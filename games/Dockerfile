FROM openjdk:8-jdk-alpine
VOLUME /tmp
ARG BOOT_JAR=build/libs/games-0.1.jar
COPY ${BOOT_JAR} app.jar
ENTRYPOINT ["java", "-jar", "app.jar", "com.zzx.games.App"]
