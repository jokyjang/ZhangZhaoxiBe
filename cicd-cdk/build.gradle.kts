plugins {
    java
    application
}

dependencies {
    implementation("software.amazon.awscdk:core:${project.property("cdkVersion")}")
    implementation("software.amazon.awscdk:s3:${project.property("cdkVersion")}")
    implementation("software.amazon.awscdk:route53:${project.property("cdkVersion")}")
    implementation("software.amazon.awscdk:route53-targets:${project.property("cdkVersion")}")
    implementation("software.amazon.awscdk:codepipeline:${project.property("cdkVersion")}")
    implementation("software.amazon.awscdk:codebuild:${project.property("cdkVersion")}")
    implementation("software.amazon.awscdk:codepipeline-actions:${project.property("cdkVersion")}")

    // Use Junit test framework
    testImplementation("junit:junit:${project.property("junitVersion")}")
}

application {
    mainClassName = "com.zzx.cicd.cdk.Cdk"
}
