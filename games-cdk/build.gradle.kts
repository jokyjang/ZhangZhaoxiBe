plugins {
    java
    application
}

dependencies {
    implementation("software.amazon.awscdk:core:${project.property("cdkVersion")}")
    implementation("software.amazon.awscdk:ec2:${project.property("cdkVersion")}")
    implementation("software.amazon.awscdk:ecs:${project.property("cdkVersion")}")
    implementation("software.amazon.awscdk:ecs-patterns:${project.property("cdkVersion")}")

    implementation("software.amazon.awscdk:iam:${project.property("cdkVersion")}")
    implementation("software.amazon.awscdk:s3:${project.property("cdkVersion")}")
    implementation("software.amazon.awscdk:sns:${project.property("cdkVersion")}")
    implementation("software.amazon.awscdk:sns-subscriptions:${project.property("cdkVersion")}")
    implementation("software.amazon.awscdk:sqs:${project.property("cdkVersion")}")

    // Use JUnit test framework
    testImplementation("junit:junit:${project.property("junitVersion")}")
}

application {
    // Define the main class for the application
    mainClassName = "com.zzx.games.cdk.Cdk"
}