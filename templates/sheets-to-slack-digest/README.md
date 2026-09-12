# Post new Google Sheets rows to Slack as one digest

Rows land in a spreadsheet. Make collects the new ones, folds them into a single message, and posts that message to a Slack channel. One message per batch, not one per row. No code.

## Before you start

You need two accounts: **Google** (the spreadsheet) and **Slack** (the channel you post to). Setup takes about 5 minutes and you never leave the Make screen after importing. Nothing here needs coding — you click, pick, and type.

## What it does

| Step | App | What happens |
|---|---|---|
| 1 | Google Sheets | Checks your sheet for rows added since the last check |
| 2 | Tools | Turns every new row into one line and joins those lines into one block of text |
| 3 | Slack | Posts that block as a single message in the channel you choose |

## Prepare your Google Sheet

Do this **before** you open step 1. Row 1 must hold the headers; the rows underneath are what gets posted. Three columns is the shape the template ships with — keep the order, rename the headers to whatever you like.

| Column | What goes in it | Filled by |
|---|---|---|
| A | When it happened — a date, a timestamp, anything short | Whatever writes the row: a Google Form, another scenario, or you |
| B | The headline — the one thing you want to read in Slack | Same |
| C | The detail — a link, an amount, an owner, a note | Same |

The Slack line comes out as **B** in bold, then **C**, then **A** in brackets. If your sheet has more columns, they are still read; they just do not appear in the message until you add them in step 2.

## Accounts to connect (2)

- [ ] Google Sheets  - [ ] Slack

**Red modules after import = not yet connected, not broken.** Accounts and file choices belong to you, so they are never stored inside a shared blueprint. Open each red module and pick an account.

## Operations per run

Make charges **one operation per module, per row it handles**. This scenario has three modules, and only the third one ever runs once:

| New rows in one check | Operations | Slack messages |
|---|---|---|
| 1 | 3 | 1 |
| 10 | **21** | 1 |
| 25 (the Limit the trigger ships with) | 51 | 1 |

The formula is `2 × rows + 1`. No AI modules, so this costs you no AI credits.

## Coming from Zapier

| Zap step | Make module | Notes |
|---|---|---|
| Trigger — Google Sheets, New Spreadsheet Row | Google Sheets → Watch New Rows | Zapier fires the Zap once per new row. Make hands all the new rows to the next module in one go. |
| Digest by Zapier — Append Entry and Schedule Digest | Tools → Text aggregator | The nearest Zapier equivalent. In Make it is a built-in step with no schedule of its own: the batch is whatever the check picked up. |
| Action — Slack, Send Channel Message | Slack → Send a Message | One message for the whole batch instead of one per row. |

**A Zapier task is not a Make operation.** Zapier counts one task per *action*; the trigger itself is free. Make counts one operation per *module* per *bundle* — the trigger included. Ten new rows in one check costs **21 operations and one Slack message** here. The same thing as a plain Zap costs **10 tasks and ten Slack messages**, because each row runs the Zap again. The units measure different things, so before you conclude anything, look up what your plan charges for 1,000 tasks and what a Make plan charges for 1,000 operations, and compare those two numbers.

## Import → Reconnect → Run once

1. **Import** — in Make go to **Scenarios** → **Create a new scenario** → click the **⋯** button at the bottom of the screen → **Import Blueprint** → upload `blueprint.json`.
2. **Reconnect** — step 1: sign in to Google, then pick your spreadsheet and sheet from the dropdowns and check that *Table contains headers* is **Yes**. Step 3: sign in to Slack, then pick the channel from the dropdown. Invite your Make Slack app to that channel first, otherwise it will not be in the list.
3. **Run once** — add a test row to the sheet, press **Run once**, and check that the message lands in the channel. If nothing arrives, the sheet probably had no rows newer than the last check — add one and try again.

## TODO

- `canvas.png` screenshot and `shareUrl` missing — `status` stays `draft`.
- **Aggregator, yes.** "One message per batch" is the whole reason this template beats the Zap it replaces, and `util:TextAggregator` (app `util` 1.14.1) is the smallest thing that does it: one `parameters.feeder` pointing at module 1, one `rowSeparator`, one mapped line. The Array Aggregator would have forced a second module to render the array. `blueprint-spec.md` §7 warns that `validate_blueprint_schema` false-positives on aggregator `metadata.expect`/`restore`; this module ships neither, and the real API round-tripped all 3 modules.
- **Ops counting is derived, not measured.** `2N + 1` applies "one operation per module per bundle" to the module list. The aggregator term (N, because it consumes N bundles) is the one that would need a paid run to confirm; `iterations.md:73` is the only corpus evidence that every module past a multi-bundle point runs N times. The cost of a check that finds zero new rows is also unmeasured — deliberately not claimed in the user section.
- **Row columns are positional.** The mapper reads `` {{1.`0`}} ``/`` `1` ``/`` `2` `` — column A/B/C by position, the convention in Make's own `04-send-gmail-from-google-sheets-row` template export. Header *names* cannot be pre-filled: `watchRows.interface` is `rpc://rpcSheetOutput`, resolved per sheet at configure time.
- **Field variants chosen for no-code.** Sheets ships `mode: "select"` + `from: "drive"` (file picker dropdown, then sheet dropdown) rather than `fromAll` (text field plus ID Finder). Slack ships `channelWType: "list"` + `channelType: "public"` (channel dropdown via `rpc://slack@4/PublicChannels`) rather than the default `"manualy"`, which makes the user paste a channel ID. Both sets sit under `__IMTCONN__.options.nested`; Slack's carries `domain: "expect"` so those fields belong in `mapper`, Sheets' does not so they belong in `parameters`. Verified against the live app catalog, nothing guessed.
- Slack app v4 (4.13.4) is the current major; v2 and v3 are still published and were not used.
- No error handler by design — directive operation cost is unmeasured.
- `demandSource` is the n8n filename corpus count, not a Reddit thread. Needs a real r/Make or r/zapier permalink (A6).
- The `## Coming from Zapier` table is the draft for the future `/zapier` page (A4). Keep both in sync from here.
