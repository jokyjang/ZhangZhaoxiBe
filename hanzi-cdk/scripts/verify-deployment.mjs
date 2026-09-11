import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";

const output = new URL("../../hanzi/dist/client/", import.meta.url);
const origin = "https://hanzi.zhangzhaoxi.be/";
async function files(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory()
    ? files(new URL(`${entry.name}/`, directory), `${prefix}${entry.name}/`)
    : [`${prefix}${entry.name}`]))).flat();
}
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const paths = await files(output);
for (const file of paths) {
  const response = await fetch(new URL(file, origin));
  assert.equal(response.status, 200, `${file}: HTTP status`);
  assert.equal(sha(Buffer.from(await response.arrayBuffer())), sha(await readFile(new URL(file, output))),
    `${file}: deployed bytes differ from this build`);
  console.log(`Verified ${file}`);
}
const root = await fetch(origin);
assert.equal(root.status, 200);
assert.equal(sha(Buffer.from(await root.arrayBuffer())), sha(await readFile(new URL("index.html", output))));
const redirect = await fetch("http://hanzi.zhangzhaoxi.be/?verify=https", { redirect: "manual" });
assert.equal(redirect.status, 301);
assert.equal(redirect.headers.get("location"), `${origin}?verify=https`);
console.log(`PASS: ${paths.length} deployed files match local build; HTTPS root and HTTP redirect verified.`);
