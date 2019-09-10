# ZhangZhaoxiBe
Personal project that applies AWS technologies for building web services or applications. This is the source code repository for building the website [zhangzhaoxi.be](http://zhangzhaoxi.be). 

## Domain structures

* [zhangzhaoxi.be](http://zhangzhaoxi.be)
  * [love.zhangzhaoxi.be](http://love.zhangzhaoxi.be) - Using Amazon S3 bucket for hosting static website.
  * [games.zhangzhaoxi.be](http://games.zhangzhaoxi.be) - Using AWS ECS for hosting Spring Boot services for gaming.
  * [life.zhangzhaoxi.be](http://life.zhangzhaoxi.be) - Using AWS Lambda + Amazon API Gateway hosting OhLife web application.
  
## Project structures

* cicd-cdk - CDK module for building the CI/CD pipelines for all the website.
* love - Static website content to be hosted on Amazon S3 bucket.
* love-cdk - CDK module for creating the infrastructure of the love website.
* life - Lambda functions that are used as business logics for the OhLife web application.
* life-cdk - CDK module for creating the infrastructure of the OhLife web application.