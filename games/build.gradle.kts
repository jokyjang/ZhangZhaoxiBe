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
    implementation("org.springframework.boot:spring-boot-starter-thymeleaf:${project.property("springBootVersion")}")
    implementation("org.springframework.boot:spring-boot-starter-security:${project.property("springBootVersion")}")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa:${project.property("springBootVersion")}")
    implementation("com.h2database:h2:${project.property("h2Version")}")

    testImplementation("org.springframework.boot:spring-boot-starter-test:${project.property("springBootVersion")}")
    testImplementation("io.rest-assured:rest-assured:${project.property("restAssuredVersion")}")
    testImplementation("io.rest-assured:json-path:${project.property("restAssuredVersion")}")
    testImplementation("io.rest-assured:xml-path:${project.property("restAssuredVersion")}")
}

tasks {
    bootJar {
        mainClassName = "com.zzx.games.App"
    }

    docker {
        name = "${project.group}/${project.name}"
        val outputFile = getByName("bootJar").outputs.files.singleFile
        copySpec.from(outputFile).into(".")
        buildArgs(mapOf("BOOT_JAR" to outputFile.name))
    }
}