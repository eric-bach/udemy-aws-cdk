#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { EpicAppCdkStack } from '../lib/cdk-sample-app-stack';

const app = new cdk.App();
new EpicAppCdkStack(app, 'EpicAppCdkStack', {
  env: { account: '524849261220', region: 'us-east-1' },
});
