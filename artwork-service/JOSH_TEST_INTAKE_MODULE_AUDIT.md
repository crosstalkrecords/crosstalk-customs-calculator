# JOSH TEST intake module audit (offline)

This is a build aid, **not a runnable Make blueprint**. No scenario was created
or activated. The current Make Dropbox connection `13265327` must not be bound:
its read-only root listing exposed folders outside the expected JOSH TEST app
folder while the grant includes write scopes. Use a verified replacement app
connection and a new API-key-protected hook.

## Verified module identifiers

The following identifiers were checked against Make's app module catalog in the
Customs organization on 21 November 2026:

| Use | Identifier / version | Configuration finding |
| --- | --- | --- |
| Webhook and response | `gateway:CustomWebHook` / 1; `gateway:WebhookRespond` / 1 | The hook ID must be a new protected test hook. |
| Routes | `builtin:BasicRouter` / 1 | Filters and error routes need explicit testing. |
| Atomic claim and stage updates | `datastore:AddRecord`, `datastore:GetRecord`, `datastore:UpdateRecord` / 1 | Data store `267564` exists, but the connector's dynamic schema RPC denied `datastores:read`; mapper fields and overwrite behavior cannot yet be validated. |
| Reconcile and create record | `airtable:ActionSearchRecords`, `airtable:ActionCreateRecord`, `airtable:ActionGetRecord`, `airtable:ActionUpdateRecords` / 3 | Use connection `13265002`, test base/table, exact Submission ID lookup, and no price-triggered invoice. Create/search mapping was validated separately in `JOSH_TEST_INTAKE_MAPPING.json`. |
| Order and Uploads folders | `dropbox:createFolder` / 5 | Fixed test root and `autorename=false`; never use a client path. |
| Audio upload and staff link | `dropbox:createFileRequest`, `dropbox:createShareLink` / 5 | `createFileRequest` requires `title` and `path` and returns `url`, `destination`, `is_open`. Its upload URL belongs in `Audio Upload`; the share URL belongs in `Internal Folder Link`. |
| Artwork bind | `http:MakeRequest` / 4 | Use only the isolated exporter connection with actual Airtable record ID and returned Uploads path. |
| Test confirmations | `microsoft-email:createAndSendAMessage` / 2 | Fixed recipient `delousedcomatorium@gmail.com`; ambiguous provider sends stop automatic retries. |

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
   customer URL separately from the staff share URL. Confirm the destination
   is the same isolated namespace used by the exporter.
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

- The replacement Dropbox connection and protected hook/key do not exist.
- Make's dynamic Data store mapper schema was inaccessible through the
  connector (`datastores:read` denied), so a runnable claim/update blueprint
  would be speculative. Its overwrite and error-route behavior must be checked
  in an inactive test scenario before use.
- The full route's 25-second response budget has not been measured. Folder,
  file request, bind and email side effects need controlled failure and retry
  tests before any customer-facing acknowledgement.
- The current production intake contains raw OAuth values in an HTTP module;
  it must not be cloned. Rebuild native Dropbox steps with the replacement
  connection and keep the live scenario unchanged.
