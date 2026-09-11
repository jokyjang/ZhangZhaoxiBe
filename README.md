# ZhangZhaoxiBe
Personal project that applies AWS technologies for building web services or applications. This is the source code repository for building the website [zhangzhaoxi.be](http://zhangzhaoxi.be). 

## Domain structures

* [zhangzhaoxi.be](http://zhangzhaoxi.be)
  * [love.zhangzhaoxi.be](http://love.zhangzhaoxi.be) - Using Amazon S3 bucket for hosting static website.
  * [games.zhangzhaoxi.be](http://games.zhangzhaoxi.be) - Using AWS ECS for hosting Spring Boot services for gaming.
  * [life.zhangzhaoxi.be](http://life.zhangzhaoxi.be) - Using AWS Lambda + Amazon API Gateway hosting OhLife web application.
  
## Project structures

* [hanzi](hanzi) - Interactive Xinzhongwen atlas at [hanzi.zhangzhaoxi.be](https://hanzi.zhangzhaoxi.be), with all application source and the official 3,500-character dataset.
* [hanzi-cdk](hanzi-cdk) - CDK v2 infrastructure and deployment for private S3, CloudFront HTTPS and Route 53.

* [cicd-cdk](cicd-cdk) - CDK module for building the CI/CD pipelines for all the website.
* [love](love) - Static website content to be hosted on Amazon S3 bucket.
* [love-cdk](love-cdk) - CDK module for creating the infrastructure of the love website.
* [games](games) - ECS based services for games such as Kayles.
* [games-cdk](games-cdk) - CDK module for building the service infrastructure of these games.
* [life](life) - Lambda functions that are used as business logics for the OhLife web application.
* [life-cdk](life-cdk) - CDK module for creating the infrastructure of the OhLife web application.

## Build and deploy project

1. You need to setup [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html) and configure the basic AWS account to your local development environment.
1. Step into the `love-cdk` project, and run `cdk deploy` to create the infrastructure for the static website.
1. Step into the `games-cdk` project, and run `cdk deploy` to create the ECS based service infrastructure and deploy the service. (TODO) This has not been integrated into the CI/CD system yet.
1. Step into the `cicd-cdk` project, and run `cdk deploy` to create the CI/CD pipeline for this project.
1. Step into the `life-cdk` project, and run `cdk deploy` to create the Serverless Application for life.
