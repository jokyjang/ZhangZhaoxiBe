plugins {
    java
    id("org.springframework.boot") version("2.1.6.RELEASE")
    id("io.spring.dependency-management") version("1.0.8.RELEASE")
    id("com.palantir.docker") version("0.22.1")
}

dependencies {
    implementation(platform("org.springframework.boot:spring-boot-dependencies:2.1.6.RELEASE"))
    implementation("org.springframework.boot:spring-boot-starter-web")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

tasks.create<Copy>("unpack") {
    dependsOn("bootJar")
    description = "Copied sources to the dest directory"
    group = "Custom"
    from(zipTree(tasks.getByName("bootJar").outputs.files.singleFile))
    into("build/dependency")
}

tasks {
    val output = this.getByName("unpack").outputs

    bootJar {
        mainClassName = "com.zzx.games.App"
    }

    docker {
        name = "${project.group}/springboot"
        copySpec.from(output).into("dependency")
        buildArgs(mapOf("DEPENDENCY" to "dependency"))
    }
}