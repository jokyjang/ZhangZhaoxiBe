package com.zzx.love.cdk;

import software.amazon.awscdk.core.Construct;
import software.amazon.awscdk.core.RemovalPolicy;
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
import software.amazon.awscdk.services.route53.IHostedZone;
import software.amazon.awscdk.services.route53.RecordTarget;
import software.amazon.awscdk.services.route53.targets.BucketWebsiteTarget;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketProps;
import software.amazon.awscdk.services.s3.RedirectProtocol;
import software.amazon.awscdk.services.s3.RedirectTarget;

import java.util.Collections;

/**
 * This is a stack that creates a sub-domain love.{domain_name} and optional
 * www.love.{domain_name} along with the S3 buckets corresponding to the
 * sub-domains as static website.
 */
public class LoveStack extends Stack {
    private static final String DOMAIN_NAME = "zhangzhaoxi.be";
    private static final String SUB_DOMAIN_NAME = "love." + DOMAIN_NAME;
    private static final String WWW_SUB_DOMAIN_NAME = "www." + SUB_DOMAIN_NAME;

    public LoveStack(Construct parent, String id, StackProps props) {
        super(parent, id, props);
        init();
    }

    private void init() {
        Bucket hostBucket = createStaticWebsiteBucket();
        Bucket wwwBucket = createWwwStaticWebsiteBucket(hostBucket);
        createRoute53Records(hostBucket, wwwBucket);
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

    private Bucket createWwwStaticWebsiteBucket(Bucket hostBucket) {
        return new Bucket(
            this,
            "WwwStaticWebsiteBucket",
            BucketProps.builder()
                .bucketName(WWW_SUB_DOMAIN_NAME)
                .removalPolicy(RemovalPolicy.DESTROY)
                .websiteRedirect(RedirectTarget.builder()
                    .hostName(hostBucket.getBucketName())
                    // TODO enable HTTPS
                    .protocol(RedirectProtocol.HTTP)
                    .build())
                .build()
        );
    }

    private void createRoute53Records(Bucket hostBucket, Bucket wwwBucket) {
        IHostedZone hostedZone = HostedZone.fromLookup(this, "HostedZone", HostedZoneProviderProps.builder()
            .domainName(DOMAIN_NAME)
            .build()
        );
        new ARecord(this, "LoveRecordSet", ARecordProps.builder()
            .zone(hostedZone)
            .recordName("love")
            .target(RecordTarget.fromAlias(new BucketWebsiteTarget(hostBucket)))
            .build()
        );
        new ARecord(this, "LoveWwwRecordSet", ARecordProps.builder()
            .zone(hostedZone)
            .recordName("www.love")
            .target(RecordTarget.fromAlias(new BucketWebsiteTarget(wwwBucket)))
            .build()
        );
    }
}
