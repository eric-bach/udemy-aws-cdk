import { Bucket, BucketEncryption } from '@aws-cdk/aws-s3';
import * as lambda from '@aws-cdk/aws-lambda-nodejs';
import * as cdk from '@aws-cdk/core';
import { DestinationType, Runtime } from '@aws-cdk/aws-lambda';
import * as path from 'path';
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';
import { PolicyStatement } from '@aws-cdk/aws-iam';
import { HttpApi, CorsHttpMethod, HttpMethod } from '@aws-cdk/aws-apigatewayv2';
import { LambdaProxyIntegration } from '@aws-cdk/aws-apigatewayv2-integrations';
import { Distribution } from '@aws-cdk/aws-cloudfront';
import { ARecord, IPublicHostedZone, RecordTarget } from '@aws-cdk/aws-route53';
import { ICertificate } from '@aws-cdk/aws-certificatemanager';
import { S3Origin } from '@aws-cdk/aws-cloudfront-origins';
import { CloudFrontTarget } from '@aws-cdk/aws-route53-targets';
import { S3BucketWithDeploy } from './s3-bucket-with-deploy';

interface SimpleAppStackProps extends cdk.StackProps {
  envName: string;
  dnsName: string;
  hostedZone: IPublicHostedZone;
  certificate: ICertificate;
}

export class EpicAppCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: SimpleAppStackProps) {
    super(scope, id, props);

    const { bucket } = new S3BucketWithDeploy(this, 'EpicAppCustomBucket', {
      deployTo: ['..', 'photos'],
      encryption: props?.envName === 'prod' ? BucketEncryption.S3_MANAGED : BucketEncryption.UNENCRYPTED,
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

    // Cloudfront distribution
    const cloudFront = new Distribution(this, 'EpicAppCloudFront', {
      defaultBehavior: { origin: new S3Origin(websiteBucket) },
      domainNames: [props!.dnsName],
      certificate: props?.certificate,
    });

    // Route53 A Record
    new ARecord(this, 'EpicAppARecordApex', {
      zone: props!.hostedZone,
      target: RecordTarget.fromAlias(new CloudFrontTarget(cloudFront)),
    });

    // Lambda function
    const getPhotos = new lambda.NodejsFunction(this, 'EpicAppLambda', {
      runtime: Runtime.NODEJS_12_X,
      entry: path.join(__dirname, '..', 'api', 'get-photos', 'index.ts'),
      handler: 'getPhotos',
      environment: {
        PHOTO_BUCKET_NAME: bucket.bucketName,
      },
    });

    // Lambda permissions
    const bucketContainerPermissions = new PolicyStatement();
    bucketContainerPermissions.addResources(bucket.bucketArn);
    bucketContainerPermissions.addActions('s3:ListBucket');

    const bucketPermissions = new PolicyStatement();
    bucketPermissions.addResources(`${bucket.bucketArn}/*`);
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
      value: bucket.bucketName,
      exportName: `epic-app-photos-bucket-name-${props?.envName}`,
    });

    new cdk.CfnOutput(this, 'epic-app-website-bucket-name', {
      value: websiteBucket.bucketName,
      exportName: `epic-app-website-bucket-name-${props?.envName}`,
    });

    new cdk.CfnOutput(this, 'epic-app-cloudfront-name', {
      value: cloudFront.distributionDomainName,
      exportName: `epic-app-cloudfront-name-${props?.envName}`,
    });

    new cdk.CfnOutput(this, 'epic-app-api-url', {
      value: httpApi.url!,
      exportName: `epic-app-api-url-${props?.envName}`,
    });
  }
}
