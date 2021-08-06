import {
  expect as expectCDK,
  matchTemplate,
  MatchStyle,
} from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as CdkSampleApp from '../lib/cdk-sample-app-stack';
import '@aws-cdk/assert/jest';

test('Stack output is complete', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new CdkSampleApp.EpicAppCdkStack(app, 'MyTestStack');
  // THEN
  expectCDK(stack).to(
    matchTemplate(
      {
        Resources: {
          epicsampleappbucket816A2767: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              BucketEncryption: {
                ServerSideEncryptionConfiguration: [
                  {
                    ServerSideEncryptionByDefault: {
                      SSEAlgorithm: 'AES256',
                    },
                  },
                ],
              },
            },
            UpdateReplacePolicy: 'Retain',
            DeletionPolicy: 'Retain',
          },
        },
        Outputs: {
          epicsampleappbucketnameexport: {
            Value: {
              Ref: 'epicsampleappbucket816A2767',
            },
            Export: {
              Name: 'epic-sample-app-bucket-name',
            },
          },
        },
      },
      MatchStyle.EXACT
    )
  );
});

test('Stack creates a S3 bucket', () => {
  // ARRANGE
  const app = new cdk.App();
  // ACT
  const stack = new CdkSampleApp.EpicAppCdkStack(app, 'MyTestStack');
  // ASSERT
  expect(stack).toHaveResource('AWS::S3::Bucket');
});
