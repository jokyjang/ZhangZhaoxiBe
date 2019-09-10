## Containerized Spring Boot

This project contains a few games that is implemented as RESTful service using Spring Boot. The service is running in Amazon ECS.

### To Run locally

```
// Build coker image and deploy to local docker hub
../gradlew docker

// Run docker container targeting the port number 80
docker run -p 80:8080 ${group}/springboot

// Test localhost to see "Hello World!"
localhost
```