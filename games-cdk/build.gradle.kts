plugins {
    java
    application
}

dependencies {
    implementation("software.amazon.awscdk:core:1.7.0.DEVPREVIEW")
    implementation("software.amazon.awscdk:ec2:1.7.0.DEVPREVIEW")
    implementation("software.amazon.awscdk:ecs:1.7.0.DEVPREVIEW")
    implementation("software.amazon.awscdk:ecs-patterns:1.7.0.DEVPREVIEW")

    implementation("software.amazon.awscdk:iam:1.7.0.DEVPREVIEW")
    implementation("software.amazon.awscdk:s3:1.7.0.DEVPREVIEW")
    implementation("software.amazon.awscdk:sns:1.7.0.DEVPREVIEW")
    implementation("software.amazon.awscdk:sns-subscriptions:1.7.0.DEVPREVIEW")
    implementation("software.amazon.awscdk:sqs:1.7.0.DEVPREVIEW")

    // Use JUnit test framework
    testImplementation("junit:junit:4.12")
}

application {
    // Define the main class for the application
    mainClassName = "com.zzx.games.cdk.Cdk"
}