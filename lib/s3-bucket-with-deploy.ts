import { Bucket, BucketEncryption, IBucket } from '@aws-cdk/aws-s3';
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';
import * as cdk from '@aws-cdk/core';
import * as path from 'path';

interface S3BucketWithDeployProps {
  deployTo: string[];
  encryption: BucketEncryption;
}

export class S3BucketWithDeploy extends cdk.Construct {
  public readonly bucket: IBucket;

  constructor(scope: cdk.Construct, id: string, props: S3BucketWithDeployProps) {
    super(scope, id);

    // Photos bucket
    this.bucket = new Bucket(this, 'epic-app-photos-bucket', {
      encryption: props.encryption,
    });

    // Photos bucket deployment
    new BucketDeployment(this, 'EpicAppPhotosBucket', {
      sources: [Source.asset(path.join(__dirname, ...props.deployTo))],
      destinationBucket: this.bucket,
      //distribution: cloudFront,
    });
  }
}
