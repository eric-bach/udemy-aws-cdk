#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkSampleAppStack } from '../lib/cdk-sample-app-stack';

const app = new cdk.App();
new CdkSampleAppStack(app, 'CdkSampleAppStack', {
  env: { account: '524849261220', region: 'us-east-1' },
});
