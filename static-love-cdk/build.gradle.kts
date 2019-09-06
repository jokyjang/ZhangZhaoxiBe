plugins {
    java
    application
}

dependencies {
    implementation("software.amazon.awscdk:core:1.6.0.DEVPREVIEW")
    implementation("software.amazon.awscdk:s3:1.6.0.DEVPREVIEW")
    implementation("software.amazon.awscdk:route53:1.6.0.DEVPREVIEW")
    implementation("software.amazon.awscdk:route53-targets:1.6.0.DEVPREVIEW")
    implementation("software.amazon.awscdk:codepipeline:1.6.0.DEVPREVIEW")
    implementation("software.amazon.awscdk:codebuild:1.6.0.DEVPREVIEW")
    implementation("software.amazon.awscdk:codepipeline-actions:1.6.0.DEVPREVIEW")

    // Use Junit test framework
    testImplementation("junit:junit:4.12")
}

application {
    mainClassName = "com.zzx.love.cdk.Cdk"
}