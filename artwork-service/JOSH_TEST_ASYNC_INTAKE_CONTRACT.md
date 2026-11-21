# JOSH TEST queued intake contract (draft)

This is an isolated Customs design. The protected Make scenario `8715068`
remains inactive and has not run end to end. The current hosted order endpoint
still rejects a queued acknowledgement. Do not use this document as evidence
that the customer journey is complete, and do not connect the live form.

## Durable states and response truth

| Stage | Browser/server meaning | Evidence required |
| --- | --- | --- |
| `queued` | Server validated a fixed JOSH TEST submission and saved an outbox item locally; no Make or staff order claim yet | SQLite row and unchanged request fingerprint/browser session |
| `dispatching` | One worker sent the protected hook; outcome may be ambiguous after a timeout | No automatic repeat until reconciliation |
| `processing` | Make acknowledged a guarded test Airtable claim and detail write | Early 202 ack with matching test label, UUID, fingerprint, and claimed Airtable record ID |
| `manual_review` | A side effect or acknowledgement is ambiguous | Stage code, isolated Airtable ledger, staff reconciliation; no blind retry |
| `complete` | Fixed test folders, open upload request, optional artwork bind, and both provider send modules succeeded, and Make's final callback matched the claim | Final callback and test ledger `Completed`; this does not prove inbox arrival, audio upload, or artwork ZIP delivery |

The browser POST should return `202` with `queued` immediately after the
outbox write. A same-session, read-only status endpoint should return the
current safe state without an upload URL or artwork capability. Changed
details, job ID, session, or fingerprint for the same UUID return `409`.
Repeated identical POSTs return the existing state, never dispatch again.

## Make boundary

The server sends only the validated fixed-recipient payload, opaque Artwork
Job ID, Submission ID, and Request Fingerprint to the API-key-protected test
hook. It does **not** send the bearer-equivalent Artwork Reference. Make
`8715068` has sequential execution, incomplete executions off, and Keep data
confidential on. Its early Webhook response follows the test Airtable
`performUpsert`, Get, exact sparse-row/fingerprint guard, and detail update:

```json
{"testLabel":"JOSH TEST","submissionId":"<same UUID>","requestFingerprint":"<same SHA-256>","airtableRecordId":"<claimed test record ID>","state":"accepted"}
```

The response is HTTP 202 with `Content-Type: application/json`. The server
pins the Airtable ID to that UUID and fingerprint. The response occurs before
Dropbox, bind, or email, so `accepted` means only that the guarded claim is
durable. Make permits later modules after a middle Webhook response, but a
later failure will not automatically deactivate/notify; all post-ack stages
need persisted uncertainty, callback/monitoring, and a watchdog.

Post-ack stages use only the fixed JOSH TEST root: create exact order/Uploads
folders with `autorename=false`, verify metadata, set uncertain state, create
and verify a closed file request, persist its ID privately, then dynamically
open that same request and verify its ID, destination, open state, and nonempty
URL. Only then store the URL in the isolated `Audio Upload` field. No public
staff share link, invoice, payment, or production folder is involved.

Both customer and staff Microsoft messages use one hard-coded To address,
`delousedcomatorium@gmail.com`, no CC/BCC. Each has an isolated `Pending` →
`Uncertain` → `Sent` transition. Provider acceptance is not inbox delivery;
ambiguous sends stop and are reconciled, never auto-resend.

With no Artwork Job ID, Make skips bind and reports `not_supplied`. With an
opaque Job ID, Make calls the JOSH TEST `/internal/test-bind` using its
existing server-side API-key connection, the exact claimed Airtable ID and
verified `.../<Submission ID>/Uploads` path. The server opens its sealed
draft capability locally and binds only the same session-owned job and
fingerprint. HTTP 202 is `bound` (queued for rendering), an idempotent HTTP
200 is `already_bound`; neither means ZIP delivery. Any mismatch stops for
review.

## Final callback and recovery

Make calls `POST /internal/test-submissions/:id/outcome` with its existing
JOSH TEST server API-key connection; no bearer is in a blueprint, URL, browser,
or document. A completion body contains only the fixed test label, UUID,
fingerprint, claimed Airtable ID, `state: complete`, and `artwork_status` of
`bound`, `already_bound`, or `not_supplied`. A manual-review body instead
contains `state: manual_review` and a generic stage such as
`request_uncertain`, `open_uncertain`, `customer_email_uncertain`,
`staff_email_uncertain`, or `artwork_bind_uncertain`, never a private request
URL, token, or artwork capability. The callback checks the pinned claim and
job presence, accepts identical repeats, rejects conflicts, and never
regresses `complete`. A trusted final callback can reconcile a prior
`manual_review` only after downstream guards succeeded.

An ambiguous Dropbox create/open or provider send leaves the Airtable stage
`Uncertain` and prevents a duplicate run. If the callback itself fails, a
watchdog flags a stale `processing` row for staff; neither Make's accepted
response nor a generic success status can silently mark completion. Staff
must inspect the isolated ledger and provider/Dropbox evidence before any
manual recovery. This still needs a controlled full webhook test, a real
dummy upload, inbox inspection, ZIP verification, and timeout/failure tests.
