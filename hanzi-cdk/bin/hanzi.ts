import { App } from "aws-cdk-lib";
import { HanziStack } from "../lib/hanzi-stack.js";

const app = new App({ outdir: "cdk.out" });
new HanziStack(app, "HanziSiteStack", {
  env: { account: process.env.AWS_ACCOUNT_ID ?? "178510302273", region: "us-east-1" },
  description: "Hanzi atlas: private S3, CloudFront HTTPS, Route 53",
});
app.synth();
