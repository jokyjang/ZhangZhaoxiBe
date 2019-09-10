package com.zzx.love.cdk;

import software.amazon.awscdk.core.Construct;
import software.amazon.awscdk.core.Stack;
import software.amazon.awscdk.core.StackProps;
import software.amazon.awscdk.services.iam.AnyPrincipal;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.PolicyStatementProps;
import software.amazon.awscdk.services.route53.ARecord;
import software.amazon.awscdk.services.route53.ARecordProps;
import software.amazon.awscdk.services.route53.HostedZone;
import software.amazon.awscdk.services.route53.HostedZoneProviderProps;
import software.amazon.awscdk.services.route53.RecordTarget;
import software.amazon.awscdk.services.route53.targets.BucketWebsiteTarget;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketProps;

import java.util.Collections;

/**
 * This is a stack that creates a sub-domain love.{domain_name} and optional
 * www.love.{domain_name} along with the S3 buckets corresponding to the
 * sub-domains as static website.
 */
public class LoveStack extends Stack {
    private static final String DOMAIN_NAME = "zhangzhaoxi.be";
    private static final String SUB_DOMAIN_NAME = "love." + DOMAIN_NAME;

    public LoveStack(Construct parent, String id, StackProps props) {
        super(parent, id, props);
        init();
    }

    private void init() {
        Bucket bucket = createStaticWebsiteBucket();
        createRoute53Record(bucket);
    }

    private Bucket createStaticWebsiteBucket() {
        String bucketName = SUB_DOMAIN_NAME;
        Bucket bucket = new Bucket(
            this,
            "StaticWebsiteBucket",
            BucketProps.builder()
                .bucketName(bucketName)
                .websiteIndexDocument("index.html")
                .websiteErrorDocument("error.html")
                .build()
        );

        PolicyStatement policyStatement = new PolicyStatement(PolicyStatementProps.builder()
            .effect(Effect.ALLOW)
            .principals(Collections.singletonList(new AnyPrincipal()))
            .actions(Collections.singletonList("s3:GetObject"))
            .resources(Collections.singletonList("arn:aws:s3:::" + bucketName + "/*"))
            .build()
        );

        bucket.addToResourcePolicy(policyStatement);

        return bucket;
    }

    private void createWwwStaticWebsiteBucket() {

    }

    private void createRoute53Record(Bucket bucket) {
        new ARecord(this, "LoveRecordSet", ARecordProps.builder()
            .zone(HostedZone.fromLookup(this, "HostedZone", HostedZoneProviderProps.builder()
                .domainName(DOMAIN_NAME)
                .build()))
            .recordName("love")
            // TODO bug report at https://github.com/aws/aws-cdk/issues/3928
            .target(RecordTarget.fromAlias(new BucketWebsiteTarget(bucket)))
            .build()
        );
    }
}
