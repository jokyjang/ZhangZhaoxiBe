import { strict as assert } from "node:assert";
import test from "node:test";
import { App } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { HanziStack } from "../lib/hanzi-stack.js";

test("private HTTPS origin and domain use the existing certificate without runtime servers", () => {
  const template = Template.fromStack(new HanziStack(new App(), "Test", {
    env: { account: "178510302273", region: "us-east-1" },
  }));
  template.resourceCountIs("AWS::S3::Bucket", 1);
  template.hasResourceProperties("AWS::S3::Bucket", {
    PublicAccessBlockConfiguration: {
      BlockPublicAcls: true, BlockPublicPolicy: true, IgnorePublicAcls: true, RestrictPublicBuckets: true,
    }, VersioningConfiguration: { Status: "Enabled" },
  });
  template.hasResourceProperties("AWS::CloudFront::OriginAccessControl", {
    OriginAccessControlConfig: Match.objectLike({ SigningBehavior: "always", SigningProtocol: "sigv4" }),
  });
  template.hasResourceProperties("AWS::CloudFront::Distribution", {
    DistributionConfig: Match.objectLike({
      Aliases: ["hanzi.zhangzhaoxi.be"], DefaultRootObject: "index.html",
      DefaultCacheBehavior: Match.objectLike({ ViewerProtocolPolicy: "redirect-to-https" }),
      ViewerCertificate: Match.objectLike({
        AcmCertificateArn: "arn:aws:acm:us-east-1:178510302273:certificate/6efc1d7c-0d48-41f4-9a80-a0170f443021",
        SslSupportMethod: "sni-only",
      }),
    }),
  });
  for (const type of ["A", "AAAA"]) template.hasResourceProperties("AWS::Route53::RecordSet", {
    Name: "hanzi.zhangzhaoxi.be.", Type: type, HostedZoneId: "ZTJ46EI8TUDHB",
  });
  template.resourceCountIs("AWS::ACM::Certificate", 0);
  template.resourceCountIs("AWS::Lambda::Function", 0);
  assert.ok(JSON.stringify(template.toJSON()).includes("AWS:SourceArn"));
});
