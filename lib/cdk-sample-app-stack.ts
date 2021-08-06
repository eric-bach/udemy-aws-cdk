import { Bucket, BucketEncryption } from '@aws-cdk/aws-s3';
import * as lambda from '@aws-cdk/aws-lambda-nodejs';
import * as cdk from '@aws-cdk/core';
import { DestinationType, Runtime } from '@aws-cdk/aws-lambda';
import * as path from 'path';
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';
import { PolicyStatement } from '@aws-cdk/aws-iam';
import { HttpApi, CorsHttpMethod, HttpMethod } from '@aws-cdk/aws-apigatewayv2';
import { LambdaProxyIntegration } from '@aws-cdk/aws-apigatewayv2-integrations';
import { CloudFrontWebDistribution } from '@aws-cdk/aws-cloudfront';

export class EpicAppCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Photos bucket
    const photosBucket = new Bucket(this, 'epic-app-photos-bucket', {
      encryption: BucketEncryption.S3_MANAGED,
    });

    // Website bucket
    const websiteBucket = new Bucket(this, 'epic-app-website-bucket', {
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
    });

    // Website bucket deployment
    new BucketDeployment(this, 'EpicAppWebsiteBucket', {
      sources: [Source.asset(path.join(__dirname, '..', 'frontend', 'build'))],
      destinationBucket: websiteBucket,
    });

    // Cloudfront
    const cloudFront = new CloudFrontWebDistribution(
      this,
      'EpicAppCloudFront',
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: websiteBucket,
            },
            behaviors: [{ isDefaultBehavior: true }],
          },
        ],
      }
    );

    // Photos bucket deployment
    new BucketDeployment(this, 'EpicAppPhotosBucket', {
      sources: [Source.asset(path.join(__dirname, '..', 'photos'))],
      destinationBucket: photosBucket,
      distribution: cloudFront,
    });

    // Lambda function
    const getPhotos = new lambda.NodejsFunction(this, 'EpicAppLambda', {
      runtime: Runtime.NODEJS_12_X,
      entry: path.join(__dirname, '..', 'api', 'get-photos', 'index.ts'),
      handler: 'getPhotos',
      environment: {
        PHOTO_BUCKET_NAME: photosBucket.bucketName,
      },
    });

    // Lambda permissions
    const bucketContainerPermissions = new PolicyStatement();
    bucketContainerPermissions.addResources(photosBucket.bucketArn);
    bucketContainerPermissions.addActions('s3:ListBucket');

    const bucketPermissions = new PolicyStatement();
    bucketPermissions.addResources(`${photosBucket.bucketArn}/*`);
    bucketPermissions.addActions('s3:GetObject', 's3:PutObject');

    getPhotos.addToRolePolicy(bucketContainerPermissions);
    getPhotos.addToRolePolicy(bucketPermissions);

    // API gateway
    const httpApi = new HttpApi(this, 'EpicApiGateway', {
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [CorsHttpMethod.GET],
      },
      apiName: 'photo-api',
      createDefaultStage: true,
    });

    const lambdaIntegration = new LambdaProxyIntegration({
      handler: getPhotos,
    });

    httpApi.addRoutes({
      path: '/getAllPhotos',
      methods: [HttpMethod.GET],
      integration: lambdaIntegration,
    });

    // Outputs
    new cdk.CfnOutput(this, 'epic-app-photos-bucket-name', {
      value: photosBucket.bucketName,
      exportName: 'epic-app-photos-bucket-name',
    });

    new cdk.CfnOutput(this, 'epic-app-website-bucket-name', {
      value: websiteBucket.bucketName,
      exportName: 'epic-app-website-bucket-name',
    });

    new cdk.CfnOutput(this, 'epic-app-cloudfront-name', {
      value: cloudFront.distributionDomainName,
      exportName: 'epic-app-cloudfront-name',
    });

    new cdk.CfnOutput(this, 'epic-app-api-url', {
      value: httpApi.url!,
      exportName: 'epic-app-api-url',
    });
  }
}
