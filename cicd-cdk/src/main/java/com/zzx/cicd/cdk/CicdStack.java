package com.zzx.cicd.cdk;

import software.amazon.awscdk.core.Aws;
import software.amazon.awscdk.core.Construct;
import software.amazon.awscdk.core.SecretValue;
import software.amazon.awscdk.core.SecretsManagerSecretOptions;
import software.amazon.awscdk.core.Stack;
import software.amazon.awscdk.core.StackProps;
import software.amazon.awscdk.services.codebuild.BuildEnvironment;
import software.amazon.awscdk.services.codebuild.BuildSpec;
import software.amazon.awscdk.services.codebuild.ComputeType;
import software.amazon.awscdk.services.codebuild.LinuxBuildImage;
import software.amazon.awscdk.services.codebuild.PipelineProject;
import software.amazon.awscdk.services.codebuild.PipelineProjectProps;
import software.amazon.awscdk.services.codepipeline.Artifact;
import software.amazon.awscdk.services.codepipeline.IAction;
import software.amazon.awscdk.services.codepipeline.Pipeline;
import software.amazon.awscdk.services.codepipeline.PipelineProps;
import software.amazon.awscdk.services.codepipeline.StageProps;
import software.amazon.awscdk.services.codepipeline.actions.CodeBuildAction;
import software.amazon.awscdk.services.codepipeline.actions.CodeBuildActionProps;
import software.amazon.awscdk.services.codepipeline.actions.GitHubSourceAction;
import software.amazon.awscdk.services.codepipeline.actions.GitHubSourceActionProps;
import software.amazon.awscdk.services.iam.AccountPrincipal;
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.RoleProps;
import software.amazon.awscdk.services.iam.ServicePrincipal;

import java.util.Arrays;
import java.util.Collections;

public class CicdStack extends Stack {

    public CicdStack(Construct parent, String id, StackProps props) {
        super(parent, id, props);
        init();
    }

    private void init() {
        createCodeBuildProject();
    }

    // CI/CD system for deploying the project to the target domain
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

        // Love Project actions and stage.
        IAction codeBuildAction = new CodeBuildAction(CodeBuildActionProps.builder()
            .actionName("LoveBuild")
            .input(Artifact.artifact("Source"))
            .project(new PipelineProject(this, "LoveProject", PipelineProjectProps.builder()
                .buildSpec(BuildSpec.fromSourceFilename("./love/buildspec.yml"))
                .projectName("LoveProjectBuild")
                .environment(BuildEnvironment.builder()
                    .computeType(ComputeType.SMALL)
                    .buildImage(LinuxBuildImage.STANDARD_2_0)
                    .build())
                .role(new Role(this, "LoveProjectRole", RoleProps.builder()
                    .roleName("LoveProjectRole")
                    .assumedBy(new ServicePrincipal("codebuild.amazonaws.com"))
                    .managedPolicies(Collections.singletonList(ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess")))
                    .build()))
                .build()))
            .role(new Role(this, "LoveBuildActionRole", RoleProps.builder()
                .roleName("LoveBuildActionRole")
                .assumedBy(new AccountPrincipal(Aws.ACCOUNT_ID))
                .build()))
            .build());

        StageProps buildStage = StageProps.builder()
            .stageName("Build")
            .actions(Collections.singletonList(codeBuildAction))
            .build();

        new Pipeline(this, "ZhangZhaoxiBePipeline", PipelineProps.builder()
            .pipelineName("ZhangZhaoxiBe")
            .stages(Arrays.asList(sourceStage, buildStage))
            .role(new Role(this, "ZhangZhaoxiBePipelineRole", RoleProps.builder()
                .roleName("ZhangZhaoxiBePipelineRole")
                .assumedBy(new ServicePrincipal("codepipeline.amazonaws.com"))
                .build()))
            .build()
        );
    }
}
