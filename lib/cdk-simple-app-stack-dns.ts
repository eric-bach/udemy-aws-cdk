import { Certificate, CertificateValidation, ICertificate } from '@aws-cdk/aws-certificatemanager';
import { IPublicHostedZone, PublicHostedZone } from '@aws-cdk/aws-route53';
import * as cdk from '@aws-cdk/core';

interface SimpleAppStackDnsProps extends cdk.StackProps {
  dnsName: string;
}

export class EpicAppStackDns extends cdk.Stack {
  public readonly hostedZone: IPublicHostedZone;
  public readonly certificate: ICertificate;

  constructor(scope: cdk.Construct, id: string, props?: SimpleAppStackDnsProps) {
    super(scope, id, props);
    this.hostedZone = new PublicHostedZone(this, 'EpicAppHostedZone', { zoneName: props!.dnsName });

    this.certificate = new Certificate(this, 'EpicAppCertificateManager', {
      domainName: props!.dnsName,
      validation: CertificateValidation.fromDns(this.hostedZone),
    });
  }
}
