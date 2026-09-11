# 新中文 · 汉字音韵地图

Production: https://hanzi.zhangzhaoxi.be

Migrated from the Xinzhongwen Sites project at source commit `058d260`. The
interactive page, CSS, original readings, official 3,500-character dataset and
mapping/search rules are preserved byte-for-byte. AWS uses a separate static
build; the original Sites build remains available.

## Application features

- 3,500 official level-one characters, 3,759 reading cards; immutable original Pinyin.
- Twelve consonant pairs, zero initial, 13 rhyme groups and 38 final columns.
- Exact original/reformed Pinyin search scrolls to cells without hiding other cells.
- Add rows, columns and cards; delete cards; drag or select cards to reassign spelling.
- Same-rhyme moves, confirmed cross-rhyme exceptions and blocked unrelated moves.
- Six zoom levels, heatmap, long-press/keyboard details and movement from details.
- Local edits survive reloads in the same browser and origin.

See [AGENTS.md](AGENTS.md) for the complete confirmed product and linguistic rules.

## AWS build and deployment

Use Node.js 22.18+ or 24 so the data tests can import TypeScript natively.

```sh
npm ci
npm run dev
npm run lint
npm run test:aws
```

`npm run build:aws` exports `dist/client/`: HTML, hydration JavaScript, CSS, RSC
payloads and public assets. Only that directory goes to S3. `npm run build` still
produces the original Worker/Sites build. Dynamic request metadata is replaced
with the canonical HTTPS origin to allow static prerendering.

Infrastructure and the deploy command live in [../hanzi-cdk](../hanzi-cdk).
The obsolete starter skeleton tests have been replaced by real static output
checks in `tests/static-export.test.mjs`.

## Local edits and access

Edits use `hanzi-rhyme-atlas-v4` in browser localStorage, which is isolated by
domain. The AWS URL starts with identical official seed data but cannot read
edits saved under the former Sites domain automatically. No personal edits are
uploaded by deployment; their format and local persistence behavior are unchanged.
The AWS site is public. The former Sites platform's ChatGPT sign-in gateway is
not part of the application and is not deployed to AWS.

## Source layout

- `app/`: UI, styles, seed data, mapping and search helpers.
- `data/`: authoritative official level-one character list.
- `scripts/`: reproducible seed-data generator.
- `tests/`: data, mapping, search, movement and static output checks.
- `public/`: original icons and social-preview image.
- `.openai/`, `worker/`, `build/`, `db/`, `drizzle/`, `examples/`: retained Sites integration.

---

## Historical Sites starter reference

The following original starter documentation is retained for the optional Sites
build. Its loading-skeleton descriptions no longer describe this application.

### vinext-starter

A clean full-stack starter running on
[vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and
Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
npm run build
```

This starter does not use `wrangler.jsonc`.

## Included Shape

- edit site code under `app/`
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/schema.ts` starts intentionally empty
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

OpenAI workspace sites can read the current user's email from
`oai-authenticated-user-email`.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- Use `chatGPTSignInPath(returnTo)` and `chatGPTSignOutPath(returnTo)` for
  browser links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm test`: build the starter and verify its rendered loading skeleton
- `npm run db:generate`: generate Drizzle migrations after schema changes

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
