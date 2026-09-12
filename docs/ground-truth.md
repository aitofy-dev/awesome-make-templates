# Ground truth — measured against the live Make API

Every claim was produced by `POST /api/v2/scenarios` → `GET /api/v2/scenarios/{id}/blueprint` →
`DELETE /api/v2/scenarios/{id}` on a Free-plan org in zone `us2`; ids and tokens redacted. The machine-readable
contract is at `GET /api/v2/openapi.json` (422 paths) — that file, not the skills corpus, is the authority.

**Plan envelope** (`GET /organizations/{id}`): `scenarios: 2` · `operations: 1000` · `apiLimit: 30`
(requests/minute, per org) · `fslimit: 5242880` · `creatingTemplates: false`. Exceeding `apiLimit` returns
`429 Requests limit for organization exceeded, please try again later.` — CI must pace itself.

## 1. Export shape — RESOLVED

`GET /scenarios/{id}/blueprint` returns
`{code:"OK", response:{blueprint:{name,flow,metadata}, scheduling, concept, created, last_edit,
metadata:{input_spec:[],output_spec:[]}, idSequence}}`.

The blueprint sits one level down under `response.blueprint` and holds exactly `{name, flow, metadata}`.
Scheduling is a **sibling**, not part of the blueprint; the outer `metadata` is the scenario interface, a
different thing from `blueprint.metadata`. The only field the server injects *into* the blueprint is
`metadata.instant` (computed from the trigger — `false` even when the request sent no metadata keys). Modules
round-trip byte-identical, key order re-sorted; a module's `metadata.parameters[]` is never injected — it is
an export-side artifact of the UI/public-template endpoint.

Request (`POST /scenarios`, scope `scenarios:write`): `{teamId, scheduling, blueprint}` where `scheduling`
and `blueprint` are **JSON strings**; all three required. Response is `{scenario:{...}}`.

## 2. How to land on "red module — pick an account" — RESOLVED (the important one)

Same module (`google-email:ActionSendEmail` v2), three variants:

| Variant | `parameters` sent | Create | Read-back |
|---|---|---|---|
| (a) key omitted | `{}` | `200` | `{}` |
| (b) explicit null | `{"account": null}` | `200` | `{"account": null}` |
| (c) stale numeric id | `{"account": 999999999}` | **`404`** | scenario never created |

Variant (c) body, verbatim:
`{"detail":"Connection not found 'google-email:999999999'.","message":"Account doesn't exist","code":"IM304"}`

**Ship variant (a).** A shipped connection id is not a cosmetic leak — it is a hard import failure for
everyone but the publisher, because Make resolves the id against the importing team before creating the
scenario. (a) is also the exact shape Make's own public-template endpoint returns: `parameters: {}` plus a
`metadata.parameters[{name:"account", type:"account:google-restricted", label:"Connection"}]` descriptor.
Dropping that descriptor also imports `200`, so it is optional for the API — keep it: it labels the
connection slot in the designer.

Neither (a) nor (b) sets `isinvalid` (`false` in both); the API exposes no "module is red" flag. Red is a
designer-side render of the unset parameter, so the visual confirmation still needs one human open (H3).

## 3. Minimum `metadata` — RESOLVED

`metadata` absent → `400 should have required property 'metadata'`. `"metadata": {}` → `200`, reads back as
`{"instant": false}`. `{scenario:{…}}` alone → `200`. `{designer:{orphans:[]}}` alone → `200`.

The true minimum is an **empty object**. `version`, `designer.orphans` and the nine `scenario.*` flags are
optional, stored verbatim when sent and not defaulted when absent. Keep the full block anyway — it is what
the UI writes, and a scenario without `scenario.maxErrors` has no declared error policy.

Related: `flow` absent → `400 missingProperty: 'flow'`; `name` absent → **`500`**, an unhandled server
error with no explanation, so a validator must catch a missing `name` locally.

## 4. Size and module-count limits — RESOLVED; `fslimit` is a red herring

Bisected blueprint JSON size: 2,083,953 B → `200`; 2,963,953 B, 3,143,953 B, 4,983,953 B and 6,003,957 B all
→ `400 {"detail":"request entity too large"}`. The ceiling sits between **2.1 MB and 2.8 MB** and is an HTTP
body limit, **not** `license.fslimit` (5,242,880), which is exceeded far below its own value — the repo's
"< 2 MB" rule is correct. **Module count is not limited in any way that matters:** a 200-module flow created
`200` and round-tripped all 200 modules; the "< 20 modules" cap in the master plan is editorial.

## 5. `metadata.zone` — RESOLVED

Omitting it → `200`, key simply absent on read-back. Sending a **foreign** zone (`"eu2.make.com"` into a
`us2` org) → `200`, stored verbatim, no cross-zone error. It is inert at import time. Omit it from published
templates: it buys nothing and fingerprints the publisher's datacenter.

## Scenario sharing on Free — YES

`sanitization-and-sharing.md` is about publishing a *skill* to a repo; it says nothing about Make scenario
sharing. The answer is in `openapi.json`: `/scenarios-shared[/{scenarioId}[/{sharedScenarioId}]]`.
`POST /scenarios-shared/{scenarioId}` with `{"title":"…","descriptionShort":"…","isEnabled":true}` returned
`200` on Free: `{"scenarioShared":{"id":"<11 chars>","isEnabled":true,"origin":"us2.make.com",
"shareUrl":"https://us2.make.com/public/shared-scenario/<id>/<slug>", …}}`. A `GET` on that URL **with no
Authorization header** returns `200 text/html`, `<title>… - Make.com Automation Scenario</title>`.
The 1-click CTA works on Free. No paid tier needed.

Notes for A7:
- `title` max **40 chars**, `descriptionShort` 260, `descriptionLong` 2000 (`openapi.json` schema).
- Store `shareUrl` in `meta.json` exactly as returned; the slug is title-derived, never construct it.
- Scopes: `scenarios-shared:read` + `scenarios-shared:write` on top of `scenarios:*`.
- `DELETE /scenarios-shared/{scenarioId}/{sharedScenarioId}` is **broken server-side** —
  `400 {"detail":"executorProvider.getExecutor is not a function"}`. Deleting the parent scenario does clear
  the share from the org listing. To retire a link, `PATCH` it with `isEnabled: false`.
- The org carries a `sharedScenarioPartnerCode`; shared-scenario links are Make's own partner-attribution
  surface. Check it against the affiliate program before hardcoding `?pc=` anywhere (A8 / H1).

## Corrections to blueprint-spec.md

R1 is accurate on module shape, filters, routers, aggregators and sanitization. These need fixing — by R1:
1. **§1, "the minimum accepted block is `version`, `scenario{…}`, `designer{orphans:[]}`"** — wrong; the
   minimum is `"metadata": {}`. Reword to "ship the full block by convention".
2. **§1, `{name, blueprint}` wrapper marked UNVERIFIED** — resolved. The read wrapper is
   `{code, response:{blueprint, scheduling, metadata, idSequence, …}}`. Separately, the skills'
   `examples/popular-templates/*.json` are `{blueprint:{flow,metadata}, controller, scheduling, language,
   metadata}` — a *third* shape (public-template export) the validator must reject with "unwrap `blueprint`,
   move `controller.name` to `name`".
3. **§3, "missing key vs null vs stale integer id: UNVERIFIED"** — resolved. A stale integer is `404 IM304`
   and the scenario is never created; promote `connection-id-present` to a hard import-blocking rule.
4. **§6, "`metadata.zone` — UNVERIFIED whether import across zones fails"** — it does not fail. Downgrade to
   "publisher fingerprint, remove it".
5. **§7, "Max blueprint file size and max module count: UNVERIFIED"** — body limit 2.1–2.8 MB,
   `400 request entity too large`; no module-count limit at 200 modules; `license.fslimit` is unrelated.
6. **§7 missing case** — a blueprint with no top-level `name` returns `500`, not a validation error.
7. **Validator rules `metadata-scenario-missing` / `metadata-designer-missing`** — demote both to warn; they
   are house style, not API requirements. Add a real fail rule: `metadata` key absent.
8. **Validator rules, missing** — `name-missing`: root lacks a non-empty `name` → fail locally, the API
   answers `500`.
9. **Nowhere in the spec** — the API rate limit is 30 requests/minute per org on Free (`license.apiLimit`),
   returned as `429` with a plain-text body.
