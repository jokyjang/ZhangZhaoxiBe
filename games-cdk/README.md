## Deploy the infrastructure

1. Set up [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html) along with your AWS account that is used for deploying the service. 
1. Build the project `games` by running `../gradlew build`
1. Run `cdk deploy` and the `games` project will be containerized and the service infrastructure will be created.

## TODO
1. The build of the service should be integrated into the CI/CD system.
1. The deployment of the service should be integrated into the CI/CD system.