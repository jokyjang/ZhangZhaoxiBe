plugins {
    java
    // TODO use property reference
    id("org.springframework.boot") version("2.1.8.RELEASE")
    id("io.spring.dependency-management") version("1.0.8.RELEASE")
    id("com.palantir.docker") version("0.22.1")
}

dependencies {
    implementation(platform("org.springframework.boot:spring-boot-dependencies:${project.property("springBootVersion")}"))
    implementation("org.springframework.boot:spring-boot-starter-web:${project.property("springBootVersion")}")

    testImplementation("org.springframework.boot:spring-boot-starter-test:${project.property("springBootVersion")}")
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