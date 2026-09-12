# Make blueprint spec

Citations are `path:LINE`, rooted at `~/Code/learning/aff-research/ref/`.
`ms/` = `integromat~make-skills/skills/`. Anything not found in a source is marked `UNVERIFIED`.

## 1. Top-level shape

- A blueprint is `{ name, flow, metadata }` — `flow` is the module array, `metadata` the scenario settings — `ms/make-scenario-building/blueprint-construction.md:12`.
- `flow` holds modules in execution order; nested flows hang off `routes` (routers) or `onerror` (error handlers) — `blueprint-construction.md:16`.
- `metadata` is **required** by the create API; the minimum accepted block is `version`, `scenario{roundtrips,maxErrors,autoCommit,autoCommitTriggerLast,sequential,confidential,dataloss,dlq,freshVariables}`, `designer{orphans:[]}` — `blueprint-construction.md:528-547`.
- Full default block adds `instant` (true for webhook/instant triggers) and `zone` (e.g. `eu2.make.com`) — `blueprint-construction.md:303-333`, `:343`.
- All 12 valid Make files in the corpus match exactly this shape (`metadata` keys: `designer,instant,scenario,version,zone`) — e.g. `felores~make-blueprints/blueprints/Fal.ai-API-CONNECTOR_NOTACODER_blueprint.json`.
- UI exports differ: they may carry the steps under `subflows[0].flow` instead of top-level `flow`; a raw UI export must be normalized to top-level `flow` before `POST/PATCH /api/v2/scenarios` — `ms/make-api-shell-connection-workflow/discovery-and-shells.md:337-347`.
- A `{ name, blueprint }` wrapper: UNVERIFIED — needs a real export to confirm. The only corpus file with those top-level keys (`Mr-Asante~AI-Automations/facebook-leads-automation.json`) is hand-written pseudo-JSON (`blueprint.scenarios[].modules`, no `module`/`version`/`mapper`), not a Make export. Ship templates as bare `{name, flow, metadata}`.

## 2. Module shape

```json
{ "id": 1, "module": "namespace:ModuleName", "version": 1,
  "parameters": {}, "mapper": {}, "filter": null,
  "metadata": { "designer": { "x": 0, "y": 0, "name": "Display Name" } } }
```
`blueprint-construction.md:48-59`

| Field | Required | Notes |
|---|---|---|
| `id` | yes | unique positive int, sequential from 1 when constructing — `:64`, `:74` |
| `module` | yes | `namespace:ModuleName` — `:65` |
| `version` | yes | int, must match the app version — `:67`, `:73` |
| `parameters` | de facto | static config: component IDs, mode selects, RPC-picked resource IDs; no IML — `ms/make-module-configuring/general-principles.md:16-25` |
| `mapper` | de facto | runtime IML values; may be `null` on `builtin:BasicRouter` — `ms/make-scenario-building/routing.md:163` |
| `metadata.designer` | recommended | `x` +300 per module, `y` 0 main flow, +150–300 per route — `:75`, `:97-115` |
| `filter` | optional | `null`, or `{name, conditions}` — `:117-137` |
| `onerror` | optional | array of directive modules — `:16`, `:511-520` |
| `routes` | router only | `[{ "flow": [...] }]` — `routing.md:170` |
| `branches` | If-Else only | subflows live in `branches[].flow`, never in top-level `flow` — `ms/make-scenario-building/branching.md:29`, `:242` |

- `filter.conditions` is `[[AND…],[AND…]]`: outer array = OR groups, inner = AND — `:123`, `:163-174`. Each condition: `a` (operand/IML ref), `b` (optional for `exist`/`notexist`), `o` (operator) — `:139-161`.
- Never put a filter on the trigger module; in routers the filter sits on the first module *inside* each route — `ms/make-module-configuring/filtering.md:15-17`, `:173-175`.
- Aggregator `feeder` (source module id) goes **inside `parameters`**, not top-level; top-level is ignored at runtime — `:76-86`, `:264`; required for every aggregator — `ms/make-module-configuring/aggregators.md:37`, `:110`.
- `builtin:BasicMerge` needs `filters` with one entry per branch (`null` = no filter) and `outputs` — `:241-244`.

## 3. Connections in a shared blueprint

- Connection IDs live in `parameters`, most commonly `__IMTCONN__`; `ai-tools:Ask` and the AI agent module use `makeConnectionId`; `google-email:ActionSendEmail` uses `account` — `:349-361`, `:456`, `ms/make-scenario-building/examples/popular-templates/README.md:9`. Never assume the name — `ms/make-module-configuring/connections.md:93`.
- Keys use `__IMTKEY__`, hooks use `__IMTHOOK__`, both also in `parameters`, both name-varying — `ms/make-module-configuring/keys.md:32`, `:48`; `ms/make-module-configuring/webhooks.md:79`, `:87`.
- Without a valid connection parameter the scenario is `isinvalid: true` and cannot be activated — `:363`. That is exactly the "red module, pick an account" state we want a template to land in.
- Connections and keys cannot be created programmatically — the importing user completes OAuth / key entry themselves — `ms/make-module-configuring/connections.md:20`, `:90`; `keys.md:47`.
- **How to write it:** omit the connection key entirely and leave `parameters` empty for modules that need post-import configuration — `blueprint-construction.md:90`. Also drop `metadata.restore.parameters.<connField>.label`, which otherwise carries the publisher's own connection label verbatim — `popular-templates/README.md:9`.
- Whether Make's importer renders a module red on a *missing* `__IMTCONN__` key versus `"__IMTCONN__": null` versus a stale integer ID: UNVERIFIED — needs a real export + import to confirm. Make's own snapshots keep the original numeric ID and are explicitly labelled "not ready-to-import blueprints" — `popular-templates/README.md:3`.
- `gateway:CustomWebHook`: leave `parameters` empty, do **not** emit a `hook` object with `type: "create"`; the webhook is configured after scenario creation — `:71`.

## 4. Error handling

Native directives, all `builtin:` modules attached under a module's `onerror` — `:511-520`:

| Directive | Effect |
|---|---|
| `builtin:Break` | stores an incomplete execution, retry later (supports exponential backoff) — `ms/make-scenario-building/error-handling.md:28`, `:86` |
| `builtin:Commit` | stop, keep everything written so far — `error-handling.md:29` |
| `builtin:Ignore` | discard the error, keep processing bundles — `:30` |
| `builtin:Resume` | substitute a fallback output, continue — `:31` |
| `builtin:Rollback` | stop and revert transactional (ACID) modules only — `:32`, `:98` |

- Exact token is `builtin:Ignore`; `builtin:IgnoreError` is not canonical — `:520`.
- Routers and error handlers themselves cannot carry an error handler; scope is per-module, there is no scenario-wide catch — `error-handling.md:10`, `:96`.
- `builtin:ThrowError` (fails the run, `status: 3`) and `builtin:ThrowWarning` (continues) raise errors deliberately — `error-handling.md:73-74`.
- **Credits:** the skills document only three credit facts — If-Else and Merge consume operations but no credits (`branching.md:289`, `ms/make-scenario-building/merging.md:76`), and subscenario calls via the Scenarios app consume no credits (`ms/make-scenario-building/subscenarios.md:17`, `:72`). The credit cost of each error directive is UNVERIFIED — needs a real run to confirm; do not claim "0 credits" in template READMEs yet.

## 5. What does not travel with a shared blueprint

Portable (pure JSON structure): routers (`routes`), filters, If-Else `branches` + Merge, iterator/aggregator `feeder` wiring — sections 2 above.

Not portable — the README of every template must say so:

- **Connections / keys** — team-level resources; the importer must create their own and re-select them per module — `ms/make-module-configuring/connections.md:94`, `keys.md:49`.
- **Webhooks** — always create a new hook, never reuse; a hook unattached to any scenario for 5 days is deactivated and returns 410 — `ms/make-module-configuring/webhooks.md:41`, `ms/make-scenario-building/webhooks.md:69`.
- **Data stores** — team-level, and a data structure must exist before the store can be created; the store ID in `parameters` is meaningless in another account — `ms/make-module-configuring/data-stores.md:54`, `:57`.
- **Subscenarios** — callable only within the same team, and the child must be active and scheduled on-demand; the parent's scenario-ID reference cannot resolve after import — `subscenarios.md:69`, `:73`.
- **AI agents** — team-shared, provider locked at creation, and knowledge/MCP/output-file config lives in the UI, not in blueprint mapper fields — `ms/make-scenario-building/ai-agents.md:119`, `:121`; `ms/make-module-configuring/ai-agents.md:18`.
- **Resource IDs** (spreadsheet, channel, base, page, calendar) — belong to the publisher; blank them and let the importer fill or map them — `popular-templates/README.md:7`.

## 6. Sanitization checklist (pre-publish)

From `ms/make-api-shell-connection-workflow/sanitization-and-sharing.md:5-23`, `:61-71`, plus leaks observed in the corpus:

- [ ] connection IDs — strip `__IMTCONN__` / `account` / `makeConnectionId` values (corpus leak: `felores~.../Dream-Machine_img2vid_Connector_NOTACODER_blueprint.json` ships `"__IMTCONN__": 2614135`).
- [ ] hook/webhook URLs — corpus leak: a live `https://hook.us1.make.com/<token>` in `Mr-Asante~AI-Automations/RAG Email.json`. A webhook URL is a bearer credential — `ms/make-scenario-building/webhooks.md:72`.
- [ ] `metadata.restore.*.label` — carries real names, page names, provider user IDs (corpus leak: `"Jono Catliff (User ID: usrQliv8ydeNbETac)"` in `RAG Social Media.json`) — `sanitization-and-sharing.md:8-9`.
- [ ] team IDs, org IDs, user/provider IDs, scenario IDs → `TEAM_ID`, `ORG_ID`, `SCENARIO_ID`, `CONNECTION_ID` — `:11-22`.
- [ ] email addresses and personal names anywhere in `mapper` strings — `:64-65`.
- [ ] API keys / tokens / `Authorization` header values in HTTP module parameters.
- [ ] workspace-specific hosts; use `https://us1.make.com` as the public example base — `:67`.
- [ ] absolute home-directory paths — `:14`, `:69`.
- [ ] hardcoded resource IDs (`spreadsheetId`, `page_id`, channel/base/calendar IDs) → `""` — `popular-templates/README.md:7`.
- [ ] `metadata.zone` — pins the template to one datacenter; UNVERIFIED whether import across zones fails, needs a real import to confirm.

## 7. Limits

- Max blueprint file size and max module count: UNVERIFIED — needs a real export/import to confirm. Nothing in the skills states either.
- Import fails when: the payload has no top-level `metadata` (`blueprint-construction.md:528`); a raw UI export is sent with `subflows[0].flow` instead of `flow` (`discovery-and-shells.md:347`); the file is not valid JSON (1 of 9 corpus files, `Mr-Asante~AI-Automations/GPT 4 Image Processing.json`, fails `JSON.parse`).
- `validate_blueprint_schema` is stricter than the runtime — it can reject valid `metadata.expect` / `metadata.restore` on aggregators; the runtime is authoritative — `blueprint-construction.md:526`. `validate_module_configuration` likewise rejects `parameters.feeder` as an unknown field although the blueprint requires it — `aggregators.md:111`.
- Runtime ceilings worth citing in a README: webhooks 300 requests / 10 s then 429 (`ms/make-scenario-building/webhooks.md:67`); webhook queue 667 items per 10 000 monthly credits, max 10 000 (`:68`); data stores max 1 000 per org, min 1 MB, record max 15 MB (`ms/make-scenario-building/data-stores.md:23`, `:69`); AI agent knowledge 20 MB/file, 20 files/agent (`ms/make-module-configuring/ai-agents.md:14`).

## Validator rules

Input for A3 (`scripts/validate.ts`). Each rule = fail condition + actionable message.

- **not-json** — `JSON.parse` throws. → `<file> is not valid JSON. Re-export the scenario from Make and commit the raw file.`
- **top-level-keys** — root lacks `name`, `flow`, or `metadata`. → `Blueprint must have top-level {name, flow, metadata}. Found: <keys>.` (`blueprint-construction.md:12`)
- **ui-export-not-normalized** — root has `subflows` or a `blueprint` key instead of `flow`. → `This is a UI export. Move subflows[0].flow to a top-level "flow" before publishing.` (`discovery-and-shells.md:347`)
- **flow-not-array / flow-empty** — `flow` is not a non-empty array. → `"flow" must be a non-empty array of modules.`
- **metadata-scenario-missing** — `metadata.scenario` absent. → `metadata.scenario is required by scenarios_create. Add roundtrips, maxErrors, autoCommit, autoCommitTriggerLast, sequential, confidential, dataloss, dlq, freshVariables.` (`:528-547`)
- **metadata-designer-missing** — `metadata.designer.orphans` absent. → `Add metadata.designer.orphans: [].` (`:544`)
- **module-required-fields** — any module (including nested `routes[].flow`, `branches[].flow`, `onerror`) missing `id`, `module`, or `version`. → `Module at <path> is missing <field>. id, module and version are mandatory.` (`:62-67`)
- **module-id-type** — `id` is not a positive integer. → `Module id must be a positive integer, got <value>.` (`:64`)
- **module-id-duplicate** — same `id` twice anywhere in the blueprint. → `Duplicate module id <id>. Every module needs a unique id.` (`:74`)
- **module-id-nonsequential** — ids are not 1..n in flow order (warn, not fail, for adapted templates). → `Module ids are not sequential from 1. Renumber and update every mapper reference.` (`popular-templates/README.md:11`)
- **module-name-format** — `module` does not match `/^[a-z0-9-]+:[A-Za-z0-9_]+$/`. → `module must be "namespace:ModuleName", got <value>.` (`:65`)
- **mapper-ref-unknown-id** — a `{{N.` reference in any mapper/filter string points at an id not present upstream. → `Mapper references module <N>, which does not exist. Renumber references after copying modules.` (`popular-templates/README.md:11`)
- **connection-id-present** — any `parameters` key in {`__IMTCONN__`, `__IMTKEY__`, `__IMTHOOK__`, `makeConnectionId`, `account`} has a non-empty value. → `Module <id> ships a connection/key/hook id. Remove the key so the module imports unconfigured.` (`:349-363`, `connections.md:93`)
- **restore-label-present** — `metadata.restore.parameters.*.label` exists on a connection-typed field. → `metadata.restore carries the publisher's connection label. Delete metadata.restore except aggregator feeder labels.` (`popular-templates/README.md:9`, `:365`)
- **hook-url-leak** — any string matches `https?://hook\.[a-z0-9]+\.make\.com/\S+`. → `Live webhook URL found at <path>. A webhook URL is a credential — remove it.` (`webhooks.md:72`)
- **webhook-hook-create** — a `gateway:CustomWebHook` module has non-empty `parameters` or a `hook` object. → `Leave gateway:CustomWebHook parameters empty; the hook is created after import.` (`:71`)
- **pii-leak** — any string matches an email regex, or `metadata.zone`/labels contain a personal name list. → `Possible PII at <path>. Replace with a placeholder.` (`sanitization-and-sharing.md:64`)
- **hardcoded-resource-id** — `spreadsheetId`, `page_id`, `baseId`, `tableId`, `channelId`, `calendarId` non-empty. → `Resource id <field> belongs to the publisher. Blank it to "" or map it from an upstream module.` (`popular-templates/README.md:7`)
- **numeric-id-leak** — `teamId`, `organizationId`, `scenarioId`, `dataStoreId`, `dataStructureId` present with a numeric value. → `Tenant id <field> found. Replace with TEAM_ID/ORG_ID/SCENARIO_ID.` (`sanitization-and-sharing.md:11-22`)
- **aggregator-feeder-missing** — `builtin:BasicAggregator` / `util:TextAggregator` without `parameters.feeder`. → `Aggregator <id> needs parameters.feeder = <source module id>.` (`:76`, `aggregators.md:110`)
- **aggregator-feeder-toplevel** — `feeder` sits on the module object instead of `parameters`. → `Move "feeder" into parameters; at top level the runtime ignores it.` (`:264`)
- **aggregator-feeder-unknown** — `parameters.feeder` is not an existing upstream module id. → `Aggregator <id> feeds from module <n>, which does not exist.`
- **filter-on-trigger** — `flow[0].filter` is non-null. → `The trigger module cannot be filtered; it always fires.` (`filtering.md:15`)
- **filter-shape** — `filter.conditions` is not `array<array<{a,o}>>`, or a condition lacks `b` for an operator other than `exist`/`notexist`. → `filter.conditions must be [[{a,b,o}]] — outer = OR, inner = AND.` (`:123-161`)
- **router-has-filter** — `builtin:BasicRouter` has a non-null `filter`. → `Put the filter on the first module inside each route, not on the router.` (`filtering.md:173-175`)
- **router-routes-missing** — `builtin:BasicRouter` without a `routes` array of `{flow}` objects. → `Router <id> needs routes: [{flow: [...]}].` (`routing.md:170`)
- **ifelse-branches-in-flow** — an If-Else branch module also appears in the top-level `flow`. → `Branch subflows belong in branches[].flow only.` (`branching.md:242`)
- **merge-filters-count** — `builtin:BasicMerge.filters.length !== branches.length`. → `Merge needs one filters entry per branch (null for none).` (`:242`)
- **onerror-directive** — an `onerror` entry is not one of `builtin:{Break,Commit,Ignore,Resume,Rollback}`. → `Unknown error directive <value>. Use builtin:Ignore, not builtin:IgnoreError.` (`:511-520`)
- **onerror-on-router** — a `builtin:BasicRouter` carries `onerror`. → `Routers cannot have error handlers.` (`error-handling.md:10`)
- **designer-coords** — a module lacks `metadata.designer.x`/`y` (warn). → `Add metadata.designer coordinates so the scenario lays out in the Make canvas.` (`:75`)
- **zone-pinned** — `metadata.zone` present (warn). → `metadata.zone pins the template to one datacenter; consider removing it.`
