import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const application = path.resolve(root, "../hanzi");
const profile = process.env.AWS_PROFILE ?? "personal";
const region = "us-east-1";
const stackName = "HanziSiteStack";
function run(program, args, cwd = root, capture = false) {
  return execFileSync(program, args, {
    cwd, encoding: "utf8", stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
    env: { ...process.env, AWS_PAGER: "" },
  });
}
function aws(args, capture = false) {
  return run("aws", [...args, "--profile", profile, "--region", region], root, capture);
}
const identity = JSON.parse(aws(["sts", "get-caller-identity", "--output", "json"], true));
if (identity.Account !== "178510302273") throw new Error("Unexpected AWS account; deployment stopped.");
process.env.AWS_ACCOUNT_ID = identity.Account;
run("npm", ["run", "test:aws"], application);
run("npm", ["run", "check"]);
run("npm", ["test"]);
run("npm", ["run", "synth"]);
const output = path.join(application, "dist/client");
if (!existsSync(path.join(output, "index.html"))) throw new Error("Missing static index.html");
const html = readFileSync(path.join(output, "index.html"), "utf8");
if (!html.includes("汉字音韵地图")) throw new Error("Unexpected static page");
aws(["cloudformation", "deploy", "--stack-name", stackName,
  "--template-file", path.join(root, "cdk.out/HanziSiteStack.template.json"),
  "--no-fail-on-empty-changeset", "--tags", "Project=xinzhongwen"]);
const result = JSON.parse(aws(["cloudformation", "describe-stacks", "--stack-name", stackName, "--output", "json"], true));
const outputs = Object.fromEntries(result.Stacks[0].Outputs.map(o => [o.OutputKey, o.OutputValue]));
// Upload immutable assets first. Keep older hashes so already-open tabs still work.
aws(["s3", "sync", path.join(output, "assets"), `s3://${outputs.BucketName}/assets/`,
  "--cache-control", "public,max-age=31536000,immutable", "--only-show-errors"]);
// Revalidate entry HTML, RSC payloads, and unhashed public files on every visit.
aws(["s3", "sync", output, `s3://${outputs.BucketName}/`, "--exclude", "assets/*",
  "--cache-control", "public,max-age=0,must-revalidate", "--only-show-errors"]);
const invalidation = JSON.parse(aws(["cloudfront", "create-invalidation", "--distribution-id", outputs.DistributionId,
  "--paths", "/*", "--output", "json"], true));
aws(["cloudfront", "wait", "invalidation-completed", "--distribution-id", outputs.DistributionId,
  "--id", invalidation.Invalidation.Id]);
console.log(JSON.stringify(outputs, null, 2));
