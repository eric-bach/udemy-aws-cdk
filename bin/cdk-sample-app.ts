#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { EpicAppCdkStack } from '../lib/cdk-sample-app-stack';
import { EpicAppStackDns } from '../lib/cdk-simple-app-stack-dns';

const domainNameApex = 'ericbach.app';

const app = new cdk.App();

const { hostedZone, certificate } = new EpicAppStackDns(app, 'EpicAppCdkStackDns', {
  env: { account: '524849261220', region: 'us-east-1' },
  dnsName: domainNameApex,
});

// new EpicAppCdkStack(app, 'EpicAppCdkStack-dev', {
//   env: { account: '524849261220', region: 'us-west-2' },
//   envName: 'dev',
//   dnsName: domainNameApex,
//   hostedZone,
//   certificate,
// });
new EpicAppCdkStack(app, 'EpicAppCdkStack-prod', {
  env: { account: '524849261220', region: 'us-east-1' },
  envName: 'prod',
  dnsName: domainNameApex,
  hostedZone,
  certificate,
});
