# awesome-make-templates

The open-source Make.com template library: importable scenario blueprints, not 40-step tutorials.
Each folder is one working automation — download the blueprint, import it, connect your accounts, run it.
Every template ships with a canvas screenshot, a connection checklist, and its real credit cost per run.
No account needed to browse. No email gate. No paid tier.

**[Create a Make account](https://www.make.com/en/register?pc=aitofy&affiliateSource=github)** — referral link: Make pays us, you pay the same price.

## Quick Start

1. **Create a Make account** using the referral link above. It is a referral link — it costs you nothing and funds this library. Already have an account? Skip to step 2.
2. **Import the blueprint.** Open a template folder, download `blueprint.json`, then in Make: *Create a new scenario → ⋯ menu → Import Blueprint*. Where a template lists a scenario link, *Use this scenario* does the same in one click.
3. **Reconnect your accounts.** Imported modules show up red. That is normal and expected — a blueprint carries no credentials. Open each red module and pick or create its connection. The template README lists exactly which connections you need.
4. **Run once.** Hit *Run once*, check the output, then turn the schedule on.

## Templates

<!-- gen:templates -->
| Template | Apps | Operations / run | Department | Get it |
|---|---|---|---|---|
| [Send Google Forms responses to Notion and email](./templates/google-forms-to-notion/) | Google Forms, Google Sheets, Notion, Gmail | 4 | Operations | [Use in Make](https://us2.make.com/public/shared-scenario/BYOdssUC41U/form-notion-email) · [blueprint.json](./templates/google-forms-to-notion/blueprint.json) · [page](https://make-templates.aitofy.dev/google-forms-to-notion) |
| [Turn new Google Sheets rows into AI-written drafts with OpenAI](./templates/sheets-openai-draft/) | Google Sheets, OpenAI | 3 | Marketing | [Use in Make](https://us2.make.com/public/shared-scenario/EfWP9JKmFPU/sheets-row-ai-draft) · [blueprint.json](./templates/sheets-openai-draft/blueprint.json) · [page](https://make-templates.aitofy.dev/sheets-openai-draft) |
| [Post new Google Sheets rows to Slack as one digest](./templates/sheets-to-slack-digest/) | Google Sheets, Slack | 21 | Operations | [Use in Make](https://us2.make.com/public/shared-scenario/cIr0IMnHhoH/sheets-rows-slack-digest) · [blueprint.json](./templates/sheets-to-slack-digest/blueprint.json) · [page](https://make-templates.aitofy.dev/sheets-to-slack-digest) |
<!-- /gen:templates -->

*Affiliate disclosure: links to Make.com in this repository are referral links; we may earn a commission if you sign up, at no extra cost to you.*

## Contributing

New templates and fixes are welcome — one folder per use case. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the 2-minute version.

## Get started

Ready to run one of these? **[Create a Make account](https://www.make.com/en/register?pc=aitofy&affiliateSource=github)** (referral link), then follow the Quick Start above.

## License

MIT — see [LICENSE](./LICENSE).
