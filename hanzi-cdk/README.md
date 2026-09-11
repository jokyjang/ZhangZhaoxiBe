# Hanzi AWS infrastructure

Deploys https://hanzi.zhangzhaoxi.be from the sibling `hanzi` application.
This follows the repository's application / application-cdk layout. It is a
self-contained TypeScript CDK v2 module; older Java/Gradle modules are unchanged.

## Architecture

Route 53 A/AAAA aliases → CloudFront HTTPS → private S3 REST origin with OAC.
CloudFront signs every origin request; both viewer and origin connections use
HTTPS. HTTP redirects to HTTPS. S3 blocks public access and retains versioned
objects if the stack is deleted. No runtime server, Lambda or database is needed.

The existing ACM certificate in `us-east-1` and public Route 53 zone are imported
by ID. These identifiers are deployment configuration, not credentials. Preserve
the ACM DNS validation CNAME for automatic renewal. The stack does not own or
delete that pre-existing certificate.

## Deploy

Prerequisites: AWS CLI v2, Node.js 22.18+ or 24, and an authenticated AWS profile
for account `178510302273`. Prefer a scoped deployment identity for ongoing use.
Never put AWS credentials in Git.

```sh
cd hanzi
npm ci
cd ../hanzi-cdk
npm ci
AWS_PROFILE=personal npm run deploy
```

The command verifies the account, runs app tests/static build, checks/tests CDK,
synthesizes `cdk.out/HanziSiteStack.template.json`, deploys `HanziSiteStack` via
CloudFormation in `us-east-1`, uploads assets before entry documents, invalidates
CloudFront, waits for completion and prints resource outputs.

CDK uses `BootstraplessSynthesizer` because the stack has no CDK assets. The CLI
uploads site files directly. No CDK bootstrap stack, ECR repository or bootstrap
administrator roles are needed. Deployment uses STS, CloudFormation, S3,
CloudFront and Route 53; the initial ACM certificate already exists.

## Validation and rollback

```sh
npm run check
npm test
npm run synth
npm run verify
curl -I https://hanzi.zhangzhaoxi.be
curl -I http://hanzi.zhangzhaoxi.be
```

Expect HTTPS `200` and HTTP `301` with an HTTPS Location. In a browser verify
search, six zoom modes, heatmap, long-press/keyboard details, card creation and
deletion, same-rhyme moves, cross-rhyme confirmation, blocked moves and reload
persistence.

Hashed assets cache for one year with immutable headers; other files revalidate.
CloudFront minimum TTL is zero. Old hashes are retained so open tabs still work.
S3 versioning permits recovery of overwritten files. For rollback, check out a
previous application/deployment commit in a separate checkout and run the same
deploy command. Do not delete the bucket or ACM validation record for rollback.

The non-exportable ACM certificate is free. S3 and CloudFront usage is billed by
AWS. This module does not alter `love`, `games`, `life`, their DNS or their stacks.
