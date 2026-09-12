# Handoff

One block per agent, appended when its work is done.

## A4 — site-generator

- Artifacts: `scripts/{gen,meta,links,html,markdown,markers,page-home,page-template,page-static,site.css}.ts`, `scripts/*.test.ts`, `wrangler.jsonc`, `docs/deploy.md`, generated `dist/`.
- Passed: generator idempotent (`pnpm gen` twice → empty diff across `dist/`, `README.md`, `llms.txt`); `pnpm test` 14/14; `wrangler deploy --dry-run` reads `dist/` and validates the config.
- Blocked by H2: nobody has run `wrangler login`, so the site is not deployed. Commands are in `docs/deploy.md`.
- Missing until templates reach `published` (gates 2 and 4): no `canvas.png`, so template pages render without a screenshot and without an OG image; no `shareUrl`, so the primary CTA is "Download blueprint.json" and no "Use in Make" button exists. All three template pages carry `noindex` and stay out of `sitemap.xml` until `status` flips. No hand edits needed then — rerun `pnpm gen`.
- Not mine: `.github/workflows/ci.yml` does not exist yet (A3). Adding `pnpm test && pnpm build:site` to it closes the loop.
