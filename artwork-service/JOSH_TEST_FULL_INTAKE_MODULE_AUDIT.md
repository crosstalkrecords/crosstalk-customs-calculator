# JOSH TEST full intake blueprint audit (inactive saved draft)

The adjacent `JOSH_TEST_FULL_INTAKE_BLUEPRINT_DRAFT.json` was saved to protected
Make scenario `8715068`, which remains **inactive and unexecuted** end to end.
Readback confirms 100 unique modules, `confidential=true`, sequential execution,
incomplete execution storage off, and no Break retry handlers. The draft
contains no raw credential, webhook URL,
Dropbox file-request URL, or artwork capability. It uses only connection IDs
and dynamic field mappings. Do not activate or test it without a fresh
readback and controlled side-effect review.

| Route / module IDs | Effect and boundary | Guard or evidence still needed |
| --- | --- | --- |
| 1, 2, 5, 6, 7, 8 | Protected JOSH TEST webhook; fixed identity/recipient and UUID/hash preflight; one-field `performUpsert` claim, Get, exact sparse-row guard, test-only details | Claimed Airtable ID and fingerprint must match. Replay/populated row routes to 409/manual review before any new side effects. Initial Artwork Delivery Status stays blank until the no-artwork or verified bind branch; no Artwork Reference exists in the draft. Blank custom-quote price maps to Make `erase` rather than `parseNumber`; this expression is schema-valid but needs runtime verification. |
| 100 | HTTP 202 JSON `accepted` with test label, UUID, fingerprint and claimed Airtable ID | Response follows a successful detail write. This is a durable claim acknowledgement, not full order completion. Make continues after this response; server outbox/polling and callback are required. |
| 10–17, 20–23 | Fixed JOSH TEST folder/Uploads creation and metadata, closed file request and private ID write | Exact paths/status/destination/closed state/ID/URL guards. The verified closed request stores its ID with `File request uncertain` while opening is pending; the old stale `do not email` error is removed. Ambiguous create stops without automatic retry. Folder/request mismatch calls authenticated `manual_review`; no public staff share. |
| 101–105 | Mark open uncertain; dynamically reopen the same request ID via app-folder OAuth; verify 200, same ID, exact Uploads destination, open state, nonempty unchanged Dropbox request URL matching the tested URL pattern; write `Audio Upload` and `Upload link ready`, clearing any prior stage error | Existing separate probe reopened one request and wrote the isolated link. The exact test file request showed four views and zero uploads in Dropbox; scoped folder scans found no audio. `Upload link ready` does not mean audio received. The combined webhook path remains untested. The mismatch route calls `manual_review`. |
| 106–111 | Customer Uncertain → Microsoft send → Sent; staff Uncertain → Microsoft send → Sent | Both messages have **only** hard-coded Josh To, no CC/BCC, no production recipient, no invoice/payment. The customer message now instructs the tester to complete Dropbox's final Upload action and wait for its confirmation. The staff notice explicitly treats `Upload link ready` as an open request, not an uploaded file, and has no Dropbox request link. Separate one-shot probes proved provider module acceptance and test ledger Sent; Josh confirmed both arrived in Gmail. The revised copy and combined path remain untested. |
| 112–114 | No-artwork branch: require blank opaque Job ID, skip bind, mark `Not supplied`/`Completed`, callback `complete/not_supplied` | No-artwork full webhook regression required. |
| 115–123 | Artwork branch: 32-hex opaque Job ID, set bind uncertain, call protected JOSH TEST `/internal/test-bind` with UUID/hash/claimed Airtable ID/exact verified Uploads path, handle 202 bound or 200 already_bound, mark `Queued`/`Completed`, callback final outcome | Server opens sealed capability locally and rejects foreign/mismatched job, row, folder or fingerprint. Bind means rendering queued, not Dropbox ZIP delivered. Invalid/mismatched result calls `manual_review`. |
| Post-ack error routes | Generic stage-only authenticated callback (`folder`, `request`, `open`, customer/staff email, artwork bind, or finalization uncertain) followed by Commit | No automatic retry of ambiguous side effects. If callback itself fails, server watchdog must flag stuck processing for staff. No second Webhook response after the early 202. |

All test folder paths are derived from the server-validated Submission ID under
`/Crosstalk Customs/JOSH TEST`; neither browser fields nor Make webhook fields
select a Dropbox destination. App-folder Dropbox connection `13265654` is the
only Dropbox connection in the candidate. Microsoft connection `5899040`
sends solely to `delousedcomatorium@gmail.com`. Existing test server API-key
connection `12211852` authenticates bind/callback modules. No Brain, live
Customs order scenario, live form, invoice, Stripe, payment, or production
Dropbox module appears in the candidate.

The saved inactive draft passed structural schema validation with 100 unique module IDs.
All 32 distinct changed/new configuration signatures covering 54 changed/new
configured modules passed Make validation with zero errors and warnings,
including the early response, Airtable, Dropbox, Microsoft, and HTTP modules.
The initial Airtable update was revalidated after omitting the premature
Artwork Delivery Status and adding the blank quote price mapping. Modules 17
and 104 were revalidated after correcting their ledger stages. This does
**not** validate runtime filter evaluation, the blank-price `erase` expression,
HTTP response-body mapping, hook destination, recipient handling in the
combined route, timing, or error behavior. Keep the full scenario inactive
until a strict controlled end-to-end test and review.
