# AWS migration verification — 2026-09-11

Site: https://hanzi.zhangzhaoxi.be

## Source and deployment

- Source baseline: original Xinzhongwen commit `058d260`.
- `app/page.tsx`, `app/globals.css`, `app/hanzi-data.ts`, `app/pinyin-utils.ts`,
  `app/search-utils.ts` and the official character TSV are byte-identical to baseline.
- Full source is in `hanzi`; infrastructure, lockfile and deploy tools are in `hanzi-cdk`.
- AWS build changes are limited to static metadata and conditional Vinext export.
- CloudFormation `HanziSiteStack`: CREATE_COMPLETE.
- CloudFront `E8GSLYSCJ9C96`: Deployed, private signed S3 origin, HTTP→HTTPS.
- ACM certificate: ISSUED, attached, eligible for automatic renewal.
- S3: all four public-access blocks enabled, SSL enforced, object versions retained.
- All 14 deployed public files matched SHA-256 of the local static build.
- HTTPS root returned 200; HTTP returned 301 preserving path/query.

## Checks completed

- 20 original data, mapping, search and card-move tests passed.
- Static HTML and referenced asset test passed; lint passed.
- CDK TypeScript check and infrastructure assertions passed.
- Browser: 3,500 characters, 3,759 cards and 950 cells after hydration.
- Search `hao`: exactly 9 cards, target scrolled into view, other cards/cells retained.
- All six zoom controls and count heatmap worked; count cells measured 42×32 px.
- Keyboard opening of count-cell details showed all 9 `hao` cards.
- Details → select 花 → `fia`: source and target counts updated to 10 and 1.
- Attempt to move 花 to `bie`: rejected as changing original initial and rhyme group.
- Move 花 to `hwo`: explicit confirmation dialog, then red exception class applied.
- Reload preserved the reassignment and exception; moving back to `hwa` removed both.
- New custom 测/ce card mapped to `tsir`, increased count to 3,760; deleting it restored 3,759.
- Final browser state: 3,759 cards, 950 cells, zero exceptions, no console errors.

## Scope of evidence

The old hosted Sites login was blocked by automatic approval review reporting a
usage limit, so an authenticated side-by-side live comparison was not completed.
Equivalence is supported by identical application/data source and the deployed
browser checks above. Touch long-press uses the unchanged source handlers;
the corresponding details/movement flow was exercised using its keyboard entry.
Browser-local edits from the old origin do not automatically transfer across
domains. See the application README. No old-origin edits were read or uploaded.
