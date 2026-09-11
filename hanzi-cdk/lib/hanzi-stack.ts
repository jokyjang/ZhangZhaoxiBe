import { BootstraplessSynthesizer, CfnOutput, Duration, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cf from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as s3 from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";

export class HanziStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, { ...props, synthesizer: new BootstraplessSynthesizer() });
    const domainName = "hanzi.zhangzhaoxi.be";
    const certificate = acm.Certificate.fromCertificateArn(this, "Certificate",
      `arn:aws:acm:us-east-1:${this.account}:certificate/6efc1d7c-0d48-41f4-9a80-a0170f443021`);
    const zone = route53.HostedZone.fromHostedZoneAttributes(this, "Zone", {
      hostedZoneId: "ZTJ46EI8TUDHB", zoneName: "zhangzhaoxi.be",
    });
    const bucket = new s3.Bucket(this, "SiteBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      versioned: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });
    const cachePolicy = new cf.CachePolicy(this, "CachePolicy", {
      minTtl: Duration.seconds(0), defaultTtl: Duration.minutes(5), maxTtl: Duration.days(365),
      enableAcceptEncodingGzip: true, enableAcceptEncodingBrotli: true,
      queryStringBehavior: cf.CacheQueryStringBehavior.none(),
      cookieBehavior: cf.CacheCookieBehavior.none(),
    });
    const distribution = new cf.Distribution(this, "Distribution", {
      domainNames: [domainName], certificate, defaultRootObject: "index.html",
      minimumProtocolVersion: cf.SecurityPolicyProtocol.TLS_V1_2_2021,
      httpVersion: cf.HttpVersion.HTTP2_AND_3, enableIpv6: true,
      comment: "Xinzhongwen interactive Hanzi atlas",
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cf.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy, compress: true,
      },
    });
    const target = route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution));
    new route53.ARecord(this, "AliasIPv4", { zone, recordName: "hanzi", target });
    new route53.AaaaRecord(this, "AliasIPv6", { zone, recordName: "hanzi", target });
    new CfnOutput(this, "BucketName", { value: bucket.bucketName });
    new CfnOutput(this, "DistributionId", { value: distribution.distributionId });
    new CfnOutput(this, "DistributionDomain", { value: distribution.distributionDomainName });
    new CfnOutput(this, "WebsiteUrl", { value: `https://${domainName}` });
  }
}
