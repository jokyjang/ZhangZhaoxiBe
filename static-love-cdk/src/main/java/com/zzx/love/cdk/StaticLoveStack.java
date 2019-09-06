package com.zzx.love.cdk;

import software.amazon.awscdk.core.Construct;
import software.amazon.awscdk.core.SecretValue;
import software.amazon.awscdk.core.SecretsManagerSecretOptions;
import software.amazon.awscdk.core.Stack;
import software.amazon.awscdk.core.StackProps;
import software.amazon.awscdk.services.codebuild.BuildEnvironment;
import software.amazon.awscdk.services.codebuild.BuildSpec;
import software.amazon.awscdk.services.codebuild.ComputeType;
import software.amazon.awscdk.services.codebuild.GitHubSourceProps;
import software.amazon.awscdk.services.codebuild.LinuxBuildImage;
import software.amazon.awscdk.services.codebuild.PipelineProject;
import software.amazon.awscdk.services.codebuild.PipelineProjectProps;
import software.amazon.awscdk.services.codebuild.Project;
import software.amazon.awscdk.services.codebuild.ProjectProps;
import software.amazon.awscdk.services.codebuild.Source;
import software.amazon.awscdk.services.codepipeline.Artifact;
import software.amazon.awscdk.services.codepipeline.IAction;
import software.amazon.awscdk.services.codepipeline.IStage;
import software.amazon.awscdk.services.codepipeline.Pipeline;
import software.amazon.awscdk.services.codepipeline.PipelineProps;
import software.amazon.awscdk.services.codepipeline.StageProps;
import software.amazon.awscdk.services.codepipeline.actions.CodeBuildAction;
import software.amazon.awscdk.services.codepipeline.actions.CodeBuildActionProps;
import software.amazon.awscdk.services.codepipeline.actions.CodeBuildActionType;
import software.amazon.awscdk.services.codepipeline.actions.GitHubSourceAction;
import software.amazon.awscdk.services.codepipeline.actions.GitHubSourceActionProps;
import software.amazon.awscdk.services.iam.AnyPrincipal;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.PolicyStatementProps;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.RoleProps;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.route53.ARecord;
import software.amazon.awscdk.services.route53.ARecordProps;
import software.amazon.awscdk.services.route53.HostedZone;
import software.amazon.awscdk.services.route53.HostedZoneProviderProps;
import software.amazon.awscdk.services.route53.RecordTarget;
import software.amazon.awscdk.services.route53.targets.BucketWebsiteTarget;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketProps;

import java.util.Arrays;
import java.util.Collections;

/**
 * This is a stack that creates a sub-domain love.{domain_name} and optional
 * www.love.{domain_name} along with the S3 buckets corresponding to the
 * sub-domains as static website.
 */
public class StaticLoveStack extends Stack {
    private static final String DOMAIN_NAME = "zhangzhaoxi.be";
    private static final String SUB_DOMAIN_NAME = "love." + DOMAIN_NAME;

    public StaticLoveStack(Construct parent, String id, StackProps props) {
        super(parent, id, props);
        init();
    }

    private void init() {
        Bucket bucket = createStaticWebsiteBucket();
        createRoute53Record(bucket);
        createCodeBuildProject();
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

    // CI/CD system for deploying static content to S3
    private void createCodeBuildProject() {
        IAction githubSourceAction = new GitHubSourceAction(GitHubSourceActionProps.builder()
            .actionName("Source")
            .owner("jokyjang")
            .repo("ZhangZhaoxiBe")
            .branch("master")
            .oauthToken(SecretValue.secretsManager("jokyjang.github.oauth", SecretsManagerSecretOptions.builder()
                .jsonField("zhang.zhaoxi.be.oauth.token")
                .build()))
            .output(Artifact.artifact("Source"))
            .build());
        StageProps sourceStage = StageProps.builder()
            .stageName("Source")
            .actions(Collections.singletonList(githubSourceAction))
            .build();

        IAction codeBuildAction = new CodeBuildAction(CodeBuildActionProps.builder()
            .actionName("Build")
            .input(Artifact.artifact("Source"))
            .project(new PipelineProject(this, "StaticLoveProject", PipelineProjectProps.builder()
                .buildSpec(BuildSpec.fromSourceFilename("./static-love/buildspec.yml"))
                .projectName("StaticLoveProjectBuild")
                .environment(BuildEnvironment.builder()
                    .computeType(ComputeType.SMALL)
                    .buildImage(LinuxBuildImage.STANDARD_2_0)
                    // TODO add environment variables for target s3 bucket
                    .build())
                .role(new Role(this, "StaticLoveProjectRole", RoleProps.builder()
                    .roleName("StaticLoveProjectRole")
                    .assumedBy(new ServicePrincipal("codebuild.amazonaws.com"))
                    .managedPolicies(Arrays.asList(
                        ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"),
                        ManagedPolicy.fromAwsManagedPolicyName("CloudWatchLogsFullAccess")))
                    .build()))
                .build()))
            .build());

        StageProps buildStage = StageProps.builder()
            .stageName("Build")
            .actions(Collections.singletonList(codeBuildAction))
            .build();

        new Pipeline(this, "StaticLovePipeline", PipelineProps.builder()
            .pipelineName("StaticLove")
            .stages(Arrays.asList(sourceStage, buildStage))
            .build()
        );
    }
}
