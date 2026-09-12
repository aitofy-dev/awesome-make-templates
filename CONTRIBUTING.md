# Contributing

## Setup

```bash
git clone <your-fork-url> && cd awesome-make-templates
pnpm install
pnpm validate
```

`pnpm validate` is the only gate. If it passes locally, CI passes.

## Adding a template

One folder under `templates/` = one use case. Name it after what a user would search for
(`google-forms-to-notion`), not after the apps' marketing names.

```
templates/<slug>/
├── blueprint.json   # exported from Make, imports cleanly, no credentials
├── meta.json        # the single source of truth for this template
├── README.md        # ≤40 lines
└── canvas.png       # screenshot of the real scenario
```

Rules, all enforced by `pnpm validate`:

- **The blueprint must import.** Export it from Make and import it back into a clean
  account before opening a PR. A blueprint that errors on import is not a template.
- **No secrets.** No connection IDs, API keys, real webhook URLs, or real email addresses.
  Scrub them before committing.
- **Screenshot required.** The actual scenario canvas, not a mockup.
- **Credits per run required.** A number in `meta.json`, plus a one-line breakdown of where
  the credits go.
- **Connection checklist required.** List every account the user must connect, in the
  template README. Say that red modules after import are normal.
- `slug` in `meta.json` must equal the folder name.

## Pull requests

One template (or one fix) per PR. Conventional commit titles: `feat(google-forms-to-notion): ...`,
`fix: ...`, `docs: ...`. Keep the diff under 400 lines. Do not hand-edit generated sections —
anything between `<!-- gen:* -->` markers is produced from `meta.json`.
