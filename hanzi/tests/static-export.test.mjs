import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import test from "node:test";

const root = new URL("../dist/client/", import.meta.url);
test("AWS output is a complete static page with real hydration assets", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  assert.match(html, /汉字音韵地图/);
  assert.match(html, /3,500/);
  assert.match(html, /搜索汉字/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site|codex-preview/);
  assert.match(html, /https:\/\/hanzi\.zhangzhaoxi\.be\/og\.png/);
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)/g)].map(m => m[1]);
  assert.ok(assets.some(p => p.endsWith(".js")), "must ship hydration JavaScript");
  assert.ok(assets.some(p => p.endsWith(".css")), "must ship the original styles");
  for (const file of new Set(assets)) await access(new URL(file.slice(1), root));
  await access(new URL("og.png", root));
  await access(new URL("favicon.svg", root));
});
