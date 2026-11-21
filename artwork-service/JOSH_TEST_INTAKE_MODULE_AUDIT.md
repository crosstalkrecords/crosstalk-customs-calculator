# JOSH TEST intake module audit (offline)

This is a build aid, **not a runnable Make blueprint**. No scenario was created
or activated. The earlier Make Dropbox connection `13265327` must not be bound:
its read-only root listing exposed folders outside the expected JOSH TEST app
folder while the grant includes write scopes. A replacement custom app-folder
connection `13265654` now exists. An inactive read probe in scenario `8714819`
used `dropbox:makeApiCall` with `disablePathRoot=true` and returned HTTP 200
for the expected JOSH TEST folder. A new API-key-protected hook is still needed.
The simpler Airtable-only state design is in
`JOSH_TEST_AIRTABLE_LEDGER_DRAFT.md`; it avoids the Data store mapper below.

## Verified module identifiers

The following identifiers were checked against Make's app module catalog in the
Customs organization on 21 November 2026:

| Use | Identifier / version | Configuration finding |
| --- | --- | --- |
| Webhook and response | `gateway:CustomWebHook` / 1; `gateway:WebhookRespond` / 1 | The hook ID must be a new protected test hook. |
| Routes | `builtin:BasicRouter` / 1 | Filters and error routes need explicit testing. |
| Atomic claim and stage updates | `datastore:AddRecord`, `datastore:GetRecord`, `datastore:UpdateRecord` / 1 | Data store `267564` exists, but the connector's dynamic schema RPC denied `datastores:read`; mapper fields and overwrite behavior cannot yet be validated. |
| Reconcile and create record | `airtable:ActionSearchRecords`, `airtable:ActionCreateRecord`, `airtable:ActionGetRecord`, `airtable:ActionUpdateRecords` / 3 | Use connection `13265002`, test base/table, exact Submission ID lookup, and no price-triggered invoice. Create/search mapping was validated separately in `JOSH_TEST_INTAKE_MAPPING.json`. |
| Order and Uploads folders | `dropbox:createFolder` / 5, or `dropbox:makeApiCall` / 5 | Fixed test root and `autorename=false`; never use a client path. The native folder picker RPC fails for this app-folder connection, so test the OAuth-backed API-call route on a synthetic path. |
| Audio upload | `dropbox:createFileRequest` / 5, or `dropbox:makeApiCall` / 5 | Native `createFileRequest` requires `title` and `path`; the Dropbox API route uses `title` and `destination`. The upload URL belongs in `Audio Upload`. Verify returned `destination`, `is_open` and `url`. |
| Staff folder access | `dropbox:createShareLink` / 5, or `dropbox:makeApiCall` / 5 | Dropbox's default shared-link visibility is public. Do not create a staff share link until restricted visibility and actual access are verified; a private Dropbox path may be safer for staff with account access. |
| Artwork bind | `http:MakeRequest` / 4 | Use only the isolated exporter connection with actual Airtable record ID and returned Uploads path. |
| Test confirmations | `microsoft-email:createAndSendAMessage` / 2 | Fixed recipient `delousedcomatorium@gmail.com`; ambiguous provider sends stop automatic retries. |

The OAuth-backed `dropbox:makeApiCall` mapper needs `type="api"`,
`method="POST"`, a relative `/2/...` URL, JSON body, `Content-Type:
application/json`, and `disablePathRoot=true` for the verified app-folder
connection. Make supplies the Authorization header. Strict Make configuration
validation passed for `/2/files/create_folder_v2` with `{path,
autorename:false}` and `/2/file_requests/create` with `{title,
destination,open:true}` using connection `13265654`. These were **validation
only**; neither route was executed.

## Required stage ordering

1. Preflight exact test label/recipient, UUID, field allowlist, artwork
   reference shape and fixed destination before any write. The protected hook
   must reject missing or wrong `x-make-apikey`.
2. Claim the Submission ID in Data store `267564` without overwrite. An
   existing claim branches to its saved result or a reconciliation route.
3. Search test Airtable by exact Submission ID (limit two). Reuse one matching
   record only after detail comparison; two matches stop for staff review;
   create only after zero matches. Persist the record ID immediately.
4. Create or verify the fixed order folder, then its `Uploads` folder. Persist
   each returned path. A collision or mismatch stops; never autorename.
5. Create and verify the file request for the Uploads path. Persist its
   customer URL separately from any staff link. Confirm the destination is
   the same isolated namespace used by the exporter. Do not expose the
   uploaded files through an unrestricted folder share link. Set a
   `file_request_uncertain` state **before** the create call. The connection
   lacks `file_requests.read`, so an ambiguous create must stop automatic
   retries. Staff inspect the Make incomplete execution and Dropbox File
   requests UI for a deterministic title containing the Submission ID, then
   reconcile the exact destination/URL or deliberately retry if none exists.
6. If artwork exists, bind the supplied capability on the server side to the
   actual Airtable record ID and returned Uploads path. Persist `bound` or
   `already_bound`; for no artwork persist `not_supplied`. Errors remain
   recoverable and visible to staff.
7. Send Josh-only customer and staff test emails after the file request is
   verified. Persist each send state separately. An ambiguous send requires
   inbox/provider inspection before resuming; a Data store flag alone cannot
   guarantee exactly one email.
8. Respond with the persisted final handoff state. The current preview server
   requires this within 25 seconds and rejects a bare Make `202`. Measure the
   whole path; if it exceeds that budget, implement a persisted queued state
   and status polling in the isolated server/UI before activation.

## Why this is still non-deployable

- The replacement app-folder connection exists and has passed a read probe,
  but its create-folder and file-request writes have not been exercised. The
  protected hook/key does not exist.
- Make's dynamic Data store mapper schema was inaccessible through the
  connector (`datastores:read` denied). The Airtable `performUpsert` claim and
  nine test-only stage fields offer a simpler path without that module, but
  their runtime behavior and error routes still need an inactive test.
- Native Dropbox folder-picker RPC fails for this custom app connection. The
  OAuth-backed `dropbox:makeApiCall` module supplies authorization itself and
  supports the `/2/files/create_folder_v2` and `/2/file_requests/create` API
  routes with a JSON body. The current read probe proves only a read; these
  write routes and response mapping need a controlled test before use.
- The connection has `file_requests.write` but not `file_requests.read`.
  Automatic get/list recovery after an ambiguous create is unavailable.
  Manual reconciliation avoids another authorization change, but requires a
  tested staff alert and runbook. No customer confirmation should be sent
  while this stage is uncertain.
- The full route's 25-second response budget has not been measured. Folder,
  file request, bind and email side effects need controlled failure and retry
  tests before any customer-facing acknowledgement.
- The current production intake contains raw OAuth values in an HTTP module;
  it must not be cloned. Use only the OAuth-backed Dropbox module with
  connection `13265654`; do not add Authorization headers or tokens to a
  blueprint. Keep the live scenario unchanged.
