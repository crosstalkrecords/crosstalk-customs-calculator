# JOSH TEST Airtable-ledger intake draft

Status: **offline build draft, not an importable/runnable Make blueprint yet**.
This avoids the Make Data store mapper that currently fails `datastores:read`.
It is limited to the isolated Airtable base/table and custom Dropbox app-folder
connection. Do not activate a scenario or send a test order from this document.

## Durable claim and retry rule

The JOSH TEST Railway server has a persisted SQLite primary key on Submission
ID and refuses a changed retry. Make must run the intake scenario sequentially
with incomplete executions enabled. For every accepted webhook, use Airtable's
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
`/2/file_requests/create` with `title`, `destination`, `open:true`.
Those write calls have **not** run. Native Dropbox folder picker RPC fails for
this app-folder connection, so use the validated API-call configuration and
verify response mapping in an isolated probe. Do not use connection `13265327`.

## Before turning this into a runnable blueprint

1. Create the dedicated API-key-protected JOSH TEST hook and bind its ID; the
   matching key stays server-side in Railway. No key or hook URL belongs in
   the blueprint or browser code.
2. Validate the single-bundle performUpsert response and Make's array mapping
   in an inactive read/claim probe against one disposable test row.
3. Configure sequential execution and incomplete execution storage. Verify
   the exact error routes and Airtable stage updates, with no automatic retry
   at file request or email uncertainty.
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
