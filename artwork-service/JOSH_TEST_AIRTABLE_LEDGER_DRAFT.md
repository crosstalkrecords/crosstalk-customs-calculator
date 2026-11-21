# JOSH TEST Airtable-ledger intake draft

Status: **offline build draft, not an importable/runnable Make blueprint yet**.
This avoids the Make Data store mapper that currently fails `datastores:read`.
It is limited to the isolated Airtable base/table and custom Dropbox app-folder
connection. Do not activate a scenario or send a test order from this document.

## Current inactive scenario scaffold (21 November 2026)

Make scenario `8715068`, **JOSH TEST Customer Intake — INCOMPLETE**, now has
the dedicated API-key-protected hook `4151555` and explicit preflight routes.
The accepted route checks the fixed JOSH TEST label, name, recipient, UUID and
request fingerprint shape; it performs only an Airtable `performUpsert` claim
with `Submission ID` in the isolated test base, fetches the returned record
by ID, and checks that the row contains that exact Submission ID with no
existing fingerprint, state, order details, Dropbox paths or email statuses.
Only that fresh sparse-row branch writes the validated normalized order
details, Request Fingerprint, `Record ready` and Pending email states in the
isolated table. It sets `Folder uncertain`, uses OAuth-backed Dropbox modules
to create fixed order and Uploads folders and read exact metadata, then
checks status and paths before persisting `Folders ready`. It sets `File
request uncertain` and creates a **closed** file request. A valid response
with the exact destination, ID, URL and `is_open=false` persists only the
request ID and `Manual review`, then returns HTTP 503
`JOSH_TEST_INTAKE_NOT_READY`. It does not store or send the closed URL. A populated
or mismatched claim returns HTTP 409 for manual review; a rejected preflight
returns HTTP 422 without a write. Eleven side-effect/error routes have a
generic 503 response followed by `Commit` stop handlers, with incomplete
execution storage disabled. This replacement is saved and structurally valid,
but the protected intake error routes have not been executed.
The regex filters and error routes still need controlled runtime verification;
the full route has not run. Readback showed `isActive=false`,
`isinvalid=false`, and sequential execution set in blueprint metadata. It
contains **no email, invoice, payment, public sharing or exporter modules**. Make retains
`scheduling.type=immediately` for
the webhook despite an attempted on-demand schedule; the inactive state is
the actual execution guard. The webhook URL and authentication key are not
stored in this draft or in the blueprint.

The next blueprint revision must keep this fail-closed response until the
complete guarded route, error handlers, response mappings and controlled
runtime tests are ready. The current route, if deliberately run, can create
or reuse a **test Airtable row**, fixed test Dropbox folders and a closed
test file request before returning 503. The copied test base has zero
deployed/draft automations; an
invoice button exists but is not invoked by this scenario. A static 503
response placed before further side-effect modules would not prevent them
from running, so it must not be treated as an execution barrier after the
route is extended.

An isolated **on-demand, inactive** Airtable claim probe, scenario `8715169`,
has also been created and read back as valid. It has no webhook, one
`airtable:makeApiCall` upsert and one read-only `ActionGetRecord` module,
both using test-only connection `13265002`. Its
static `Submission ID` fixture is
`bce3bf49-2381-48a3-a86c-04298336bcaa`; the scenario title carries
`TEST JOSH 21.11`. A first controlled UI Run once should create one sparse
test row containing only that Submission ID. A second Run once should match
the same row, without overwriting staff fields. Both controlled inactive UI
Run once executions succeeded: first `createdRecords=1`, second
`updatedRecords=1`, both returned Airtable record `recfqJmaSzr5ovVVf` and
exactly one row remained for the fixture. Make's UI output tree shows
`Body → records → 1 → id` as a structured value, so the inactive intake Get
Record module now maps `{{5.body.records[1].id}}` after its claim. The Get
module 2 of the probe ran successfully while inactive and returned a flat
field-ID keyed collection: `id` at top level and the Submission ID at
`fldro75kOQGnubjQR`. Blank Request Fingerprint and Intake State fields are
omitted, so the inactive intake guard uses `ifempty` on their field IDs. The
guard/detail update have not run in the intake scenario yet. This probe
cannot send email, write Dropbox, invoke artwork delivery or create a live
order.

## Static on-demand intake runner

Scenario `8715455`, **JOSH TEST static intake runner — CLOSED request**, is
inactive, valid, on-demand and has no webhook. A `json:ParseJSON` first module
provides a fixed synthetic no-artwork payload named `TEST JOSH 21.11`, Josh's
test recipient and Submission ID `b72ca4e5-0e82-4f75-9413-35568ae8ef0c`.
It follows the same guarded test Airtable claim/details, fixed Dropbox
folders, closed file request and uncertain stages as the inactive webhook
intake. Both inactive scenarios use `Commit` stop handlers with incomplete
executions disabled and no `Break` directives. The protected intake's eleven
replaced handlers await controlled runtime verification. Webhook responses
were replaced with harmless Compose markers. Neither scenario has email,
payment, invoice, public share or artwork bind modules.

An initial automatic approval review blocked the runner UI before execution.
After a separate approved UI attempt, one Run once execution
`a0b4c820eded4eeba0271aca17825d0e` succeeded with **four operations**:
static JSON → Airtable upsert → Get Record → populated-claim Compose marker.
It created one sparse test row for the fixture UUID, containing Submission ID
and Airtable's default Order Status `New Submissions`, with no customer detail,
fingerprint, intake state, Dropbox folder or request. No Dropbox module ran.
The fresh-row guard had required Order Status to be blank; the default made
it reject the row. Both inactive scenarios now require the exact default
`New Submissions` in the fresh branch and invert that condition in the
manual-review branch. The other 14 guard checks remain. This filter fix is
**not retested**. A separately approved second controlled run would need to
verify the detail/folder/closed-request path without exposing private request
data. The runner remains inactive. Inspect only non-secret execution status,
Airtable state and private folder paths; do not surface the request URL or ID.

## Durable claim and retry rule

The JOSH TEST Railway server has a persisted SQLite primary key on Submission
ID and refuses a changed retry. Make must run the intake scenario sequentially.
For every accepted webhook, use Airtable's
Update records API `performUpsert` with **only** the `Submission ID` field as
the merge key and as the record body. The API is expected to return the created
or matched record ID in one response bundle; a retry after an ambiguous create
should reuse the row instead of calling Create record again. It does not overwrite
staff edits or stage fields. Fetch that record, compare the stored Request
Fingerprint to the server-supplied fingerprint, and stop on a mismatch. If
the fingerprint is blank, fill the immutable order fields and initial state
only when the row is an otherwise empty claim from this test flow; unexpected
populated fields require manual review.
The merge field is not a database uniqueness constraint for edits made outside
this one sequential scenario. If staff or another integration duplicates a
Submission ID, Airtable's upsert fails; staff must resolve that duplicate
without sending another email or creating another Dropbox request.

The Make Airtable `makeApiCall` configuration for the claim passed strict
module validation with test-only connection `13265002`:

| Setting | Value |
| --- | --- |
| Method / URL | `PATCH v0/appDz7CEL2KQWpzyC/tbly1iXdcMvFuqCcY` |
| Header | `Content-Type: application/json`; Make supplies OAuth |
| Body shape | Only the Submission ID merge key, as shown below. |
| Required response | Exactly one `records` item with an Airtable record ID; inspect `createdRecords` and `updatedRecords`; a malformed or ambiguous response stops. |

```json
{"performUpsert":{"fieldsToMergeOn":["Submission ID"]},"records":[{"fields":{"Submission ID":"{{1.`Submission ID`}}"}}]}
```

Airtable's [Update multiple records API](https://airtable.com/developers/web/api/update-multiple-records)
documents zero matches as a create, one match as an update, and multiple
matches as an error. A `PATCH` updates only supplied fields, and the response
includes `records`, `createdRecords` and `updatedRecords`. `Submission ID` is
a supported text merge field.
This configuration's **shape** passed Make validation; its runtime behavior
with the copied table has not yet been tested. A focused isolated test must
force a timeout immediately after claim and verify exactly one record remains.

## Fields created in the JOSH TEST table

These fields were created and their types/choices verified on 21 November
2026. No live base, record, automation or staff interface was changed.

| Field | ID | Type / purpose |
| --- | --- | --- |
| Submission ID | `fldro75kOQGnubjQR` | Existing single-line text merge key |
| Request Fingerprint | `fldq46cNTtEpprcgN` | SHA-256 of normalized order details from the test server |
| Intake State | `fldnYB8vJvo3b6ddu` | Single select: Claimed, Record ready, Folder uncertain, Folders ready, File request uncertain, Upload link ready, Artwork bind uncertain, Artwork bound, Ready to confirm, Completed, Manual review, Failed |
| Dropbox Order Folder | `flde9LOZGGrHS8par` | Relative path inside test app folder |
| Dropbox Uploads Folder | `fldLvBqkU5rIbhFrc` | Relative Uploads path inside test app folder |
| File Request ID | `fld9AkpYIBIfCgeMv` | Dropbox ID for staff reconciliation |
| Customer Email Status | `fldiHqm7xEMbVJLmg` | Single select: Pending, Uncertain, Sent |
| Staff Email Status | `fldZJt4pfO1ldlOia` | Single select: Pending, Uncertain, Sent |
| Intake Last Error | `fldbYG3ngxEuBTjQS` | Sanitized multiline staff error, never a secret/reference |
| Intake Updated At | `fldhGBLf4ixDl7TmT` | UTC ISO 8601 text timestamp |

Existing `Audio Upload` (`fld5G2oHi9NL73kkn`), `Internal Folder Link`
(`fldFsfOT7hf2Bg4ZO`), Artwork Job ID and Artwork Delivery Status remain
separate. Use `Audio Upload` for the file-request upload URL. Keep `Internal
Folder Link` empty until a restricted staff link has been verified; Dropbox's
default shared link is public. Staff can read the private path in `Dropbox
Uploads Folder` while signed into the intended Dropbox account.

## Stage machine for an inactive Make scenario

Each stage reads the Airtable row by the claimed record ID before acting.
Only `Pending` stages can send email. Any `Uncertain` stage stops and alerts
staff; it never repeats a side effect automatically.

**Incomplete execution retry caveat:** Make can automatically retry
`RateLimitError`, `ConnectionError` and `ModuleTimeoutError` from the failed
module. A timeout after Dropbox creates a file request or a mail provider
accepts a message can therefore duplicate the side effect. Keep incomplete
execution storage off for these calls until explicit manual-only error
handling is configured and tested against each timeout/connection class.
Setting the Airtable stage to `File request uncertain` or email `Uncertain`
before the call is necessary but does not itself prevent Make from restarting
at the failed external module. Staff reconciliation must be the only path out
of ambiguity; never enable a generic automatic retry at those modules.

| Stage | Before the external call | Successful verification and persisted result | Ambiguous recovery |
| --- | --- | --- | --- |
| Record | Claim by performUpsert; compare fingerprint, then set `Claimed` and Pending email states | Fill immutable mapped details and `Record ready` | Repeat claim with same Submission ID; stop on fingerprint mismatch or multiple rows |
| Folders | Set `Folder uncertain` | Create fixed order and Uploads folders with `autorename=false`; verify metadata and paths; persist both paths, `Folders ready` | `get_metadata` on exact paths using the same app-folder OAuth connection; reuse verified folders, stop on mismatch |
| File request | Set `File request uncertain`; deterministic title includes Submission ID | OAuth-backed `/2/file_requests/create`; check HTTP status, `is_open`, exact `destination`, URL and ID; persist URL/ID, `Upload link ready` | `file_requests.read` is absent. Stop auto-retry; inspect Make incomplete execution and Dropbox File requests UI, reconcile URL/ID or deliberately retry if none exists |
| Artwork | If supplied, set `Artwork bind uncertain`; if absent, record `not_supplied` | Bind actual Airtable ID and verified Uploads path to isolated exporter, persist `bound`/`already_bound`, `Artwork bound`; no-artwork skips bind | Retrying the identical bind is safe only after the exporter confirms same order/folder; otherwise manual review |
| Customer email | Set Customer Email Status `Uncertain` before send | Josh-only TEST receipt with verified upload URL; persist `Sent` | Inspect provider Sent/inbox and reconcile before resend |
| Staff email | Set Staff Email Status `Uncertain` before send | Josh-only TEST staff notice with Airtable ID and the private Uploads path (no public folder link); persist `Sent` | Inspect provider Sent/inbox and reconcile before resend |
| Response | Require both email statuses Sent and valid artwork handoff/no-artwork state | Persist `Completed`; return exact `bound`, `already_bound` or `not_supplied` contract | If the 25-second test-server timeout is exceeded, preserve state and let same Submission ID retry or add queued-status polling before customer testing |

The Dropbox app-folder connection is `13265654`. Its inactive read probe
`8714819` returned 200 for the expected JOSH TEST folder. `dropbox:makeApiCall`
v5 (OAuth supplied by Make, no token in blueprint) passed strict configuration
validation for `/2/files/create_folder_v2` with `autorename:false` and
`/2/file_requests/create` with `title`, `destination`. A separate inactive
probe `8715276` executed the fixed-path writes: both folders and a **closed**
file request returned HTTP 200 with exact paths/destination, request ID and
`is_open=false`. No customer upload, email, artwork bind or public share ran.
Native Dropbox folder picker RPC fails for this app-folder connection, so
the inactive intake uses OAuth-backed API calls. Do not use connection `13265327`.

An initial read-only lookup for the previously exported unique JOSH TEST ZIP
returned Dropbox 409 `path/not_found`; a corrected exact-path lookup through
the Make app-folder connection returned HTTP 200 for that ZIP in the fixed
JOSH TEST Uploads path, size **2,163,437 bytes**. This verifies that Make can
read the exporter's isolated namespace for that file. An **open** file
request, actual upload acceptance, ambiguous-write recovery, full-route
filters/error handling and the strict 25 s acknowledgement deadline remain
untested. An automatic approval review rejected the UI step that would expose
the closed file-request ID/URL for an open-update probe. No open request was
tested; that blocked UI step was not retried through another route. Do not
activate or email a customer upload URL until those gates pass.

## Before turning this into a runnable blueprint

1. Create the dedicated API-key-protected JOSH TEST hook and bind its ID; the
   matching key stays server-side in Railway. No key or hook URL belongs in
   the blueprint or browser code.
2. Validate the single-bundle performUpsert response and Make's array mapping
   in an inactive read/claim probe against one disposable test row.
3. Configure sequential execution and per-module error handling. Verify
   the exact error routes and Airtable stage updates, with no automatic retry
   at file request or email uncertainty. Enable incomplete execution storage
   only after an injected timeout proves the manual-stop handler intercepts
   Make's default retry classes.
   Limit manual edits to the dedicated recovery procedure so a simultaneous
   staff change does not race a Make stage update.
4. Force failures after claim, folder creation, file-request creation, bind,
   and each email. Confirm one Airtable row, one file request, one email pair,
   and staff recovery. The staff interface must show Intake State and both
   email statuses before tester access.
5. Measure the whole route against the test server's 25-second timeout. If it
   exceeds that limit, implement a persisted queued acknowledgement and
   polling/callback in the isolated UI/server before calling it end-to-end.

No live form, Customer Intake scenario, production Dropbox folder or real
customer recipient is part of this draft.
