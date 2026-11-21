# Crosstalk Customs artwork handoff — prelaunch review

Status: **isolated tester interface available, complete journey blocked, production release blocked**. This is the
Customs project only. The live order form and Customer Intake scenario have not
been changed. Review branch: `artwork-form-handoff-review-20261119`; draft PR
[#24](https://github.com/crosstalkrecords/crosstalk-customs-calculator/pull/24)
targets `artwork-delivery-integration-20261018`, not the live form.

**21 November progress:** Josh confirmed that the Josh-only customer receipt
and separate staff-style notice arrived. He reported that the private Dropbox
request page showed a successful upload. These are separate probe scenarios,
not a single form-created order journey. An initial read-only check found no
file at the fixed destination, but later owner views confirmed a 1.75 MB
GIF/photo and then a harmless one-second **15.67 KB dummy WAV**. Dropbox now
reports **two uploads and two items (1.76 MB total)**, both in the exact
isolated order Uploads folder. This verifies a generic file transfer and a
small WAV transfer through the private request. Audio format/size enforcement,
malware handling and a full form-created journey remain untested. JOSH TEST
Railway now runs review commit `43be85b`, with durable queued intake and
staff-only fixed-folder diagnostics. Its read-only staff recovery summary
passed an authenticated hosted check; the summary found four older failed
artwork jobs and no current queued or processing submissions. The 100-module
full Make intake is saved **inactive and unexecuted**, and the server-only
Make hook destination remains unconfigured after automatic approval review
blocked its transfer. Therefore the preview is **not ready to send as a
complete tester journey**. No live form or production-delivery change occurred.

The isolated Airtable base `Crosstalk Customs — JOSH TEST`
(`appDz7CEL2KQWpzyC`) is available through the ChatGPT Airtable connection
with access to that base only. Make now has a separate Locked OAuth connection
`JOSH TEST Airtable only` (13265002). Airtable's own Integrations screen lists
only the JOSH TEST base for this new grant, not V1.0 or the whole workspace.
The base copied
the Customs table and four table views; no Airtable automations were present.
Submission ID, the non-secret Artwork Job ID and Artwork Delivery Status were
added to the test table, followed by nine Airtable intake-ledger fields for
fingerprint, state, folder paths, file-request ID, separate email states, last
error and update time. A manually seeded fixture record
`recyMzmi7CqKApYeW`, labelled **TEST JOSH 21.11**, proves that the record and
computed job number appear in the published [JOSH TEST Staff Review](https://airtable.com/appDz7CEL2KQWpzyC/pag5DGRXAl6D5FKVE)
interface. It is explicitly marked as a fixture: it was not submitted through
the customer form, did not send an email, and did not create an audio request.
The staff page shows the test submission, upload/folder and artwork status
fields, and omits the invoice button.

**Copied invoice button hazard:** the test base inherited a `Send Invoice`
button that still computes an external invoice webhook URL. We did not click
it, renamed the column `DO NOT CLICK — copied invoice button`, and excluded it
from the staff page. The connected Airtable API cannot delete that field, and
the separate browser session requires an Airtable sign-in. Remove the copied
button in Airtable's base editor before granting any tester direct table
access. The isolated form URL does not expose the Airtable table.

## Tester access and boundaries

- Preview URL (not yet a completed tester journey; do not send it as ready):
  <https://josh-test-artwork-exporter-josh-test.up.railway.app/calculator-preview.html>
- Open the URL and enter the separately supplied HTTP Basic `tester` access
  details. Do not append the passcode or an artwork reference to the URL. The
  form and designer are labelled JOSH TEST and served with `noindex` headers.
- The test form accepts only the exact order label **TEST JOSH 21.11** and
  `delousedcomatorium@gmail.com`. Its server-side webhook and recipient are
  fixed; it has a persisted 30-submission environment cap. It cannot charge,
  invoice, create a live Airtable order, notify another customer or staff member,
  or choose a production Dropbox folder.
- Railway: `Crosstalk Customs Artwork / JOSH TEST / JOSH TEST artwork exporter`.
  Make: `JOSH TEST artwork delivery` (scenario 8084300). It was found active
  during this review and was **deactivated** on 21 November 2026; keep it off
  outside a controlled tester window. Test Dropbox root:
  `/Crosstalk Customs/JOSH TEST/JOSH TEST/Uploads`. Disable the scenario and
  delivery mode when the window ends; Dropbox setup stays disabled. After a
  successful isolated Railway redeploy, `/health` returned
  `deliveryMode=disabled` and `configured=false` on 21 November 2026.
- Railway reports a successful **JOSH TEST only** deployment of review commit
  `43be85b` on 21 November 2026. Hosted `/health` returned
  `deliveryMode=disabled` and `configured=false` after that deployment;
  unauthenticated normal and percent-encoded preview paths, designer and
  test-config returned 401 in checks across the review. A distinct
  `ARTWORK_STAFF_SECRET` was provisioned on the sole JOSH TEST service after
  code deployment; its resulting redeployment succeeded. The authenticated,
  read-only staff recovery summary returned HTTP 200, while unauthenticated
  access returned 401. The test form's server-only Make key guard is deployed,
  but the protected webhook destination is not configured and the full intake
  is inactive. Hosted authenticated form, mobile and recovery-action checks
  remain open; deployment success does not establish a completed order journey.

## Intended journey and what has been exercised

| Stage | Intended customer/staff outcome | Evidence and current gap |
| --- | --- | --- |
| Open and configure | Customer chooses product, format, packaging, audio and other options; sees a comprehensible price. | The isolated preview presents the form. Local desktop/mobile browser tests cover the guarded path. Pricing/options and actual first-time hosted tester feedback still need human acceptance. |
| Design and upload | Customer uses front/back and label surfaces, adds source images, completes the designer, and sees an attached artwork reference on order review. | Local tests cover upload, attachment, failed submission retry, refresh/session isolation and mobile width. Hosted service returns the gated pages, but cloud browser authentication failed, so a human hosted pass is outstanding. |
| Submit | Test submission reaches only the isolated endpoint and protected Make intake; customer sees an accurate order state. | Earlier synthetic `TEST JOSH 21.11` artwork-only submissions reached scenario 8084300 and returned `bound`/`not_supplied`, but did **not** create an Airtable order or audio request. The deployed server now durably queues and polls a validated request when configured. Full intake 8715068 is inactive and unexecuted, and the protected Make destination is not configured in Railway, so hosted form submission is closed. |
| Confirmation email | Josh receives a clearly labelled test receipt acknowledgement. | The separate Josh-only email probe 8716152 reported provider send success, and Josh confirmed its receipt. It was not triggered by a full form submission; integrated email and ambiguous-send recovery remain untested. |
| Bind, render and deliver | Trusted processing binds the reference to the actual order's Uploads folder, renders the PSDs/ZIP and verifies the Dropbox upload. | One test job reached `delivered` on its first attempt; the exporter checked Dropbox path, size and content hash against the local archive. Duplicate bind returned `already_bound` through the no-email route. The remote ZIP has not been downloaded, opened and independently inspected in Photoshop. |
| Audio upload | Customer follows a private request and uploads audio to the isolated order folder. | A separate probe opened the fixed request and populated its private Airtable link. Dropbox now reports two uploads at the exact isolated destination: a 1.75 MB GIF/photo and a harmless one-second 15.67 KB dummy WAV. **WAV transfer passed; audio policy and integrated journey untested.** |
| Staff handling | Staff see an order, audio/assets, delivery or failure status and an actionable recovery path. | The isolated Airtable staff page shows a **manually seeded fixture** and probe rows, not a customer form-created order. Josh confirmed a separate staff-style email addressed only to him; real staff routing remains untested. The read-only recovery summary is authenticated and deployed, but no alert or manual reconciliation procedure is proven. |

Test identifiers retained for correlation: order
`0f7ba405-0239-47fa-b17d-688458e2139a`, Make execution
`aae0cc521ea54c55b7a334b3156670a7`; the no-artwork order is
`4b1dc176-5c62-40b6-9442-e9fe56506bdc`. No artwork capability reference,
provider token or webhook address belongs in this report. A Make 202 is a queue
acknowledgement, not evidence of delivery; the separate exporter state and
Dropbox metadata were checked.

## Checks and changes

The review branch adds a separately gated form handoff and test order route,
server-side Make forwarding, exact origin/window/session checks, source and
project limits, fixed Dropbox destination validation, binding and retry logic,
idempotency, and a persisted status record. It keeps label A/B surfaces in the
versioned project and separate PSD outputs so a later approved custom label
designer can use them without changing the order binding. It does **not** claim
that a new custom label interface has been designed or approved.

The latest review-branch patch maps actual allowlisted Customs form fields into the
test-only server-side payload, derives pickup/shipping, fixes identity, replaces
shipping with an explicitly fictional address and fingerprints normalized
details so the same Submission ID cannot silently change an order. It is now hosted in JOSH TEST, while the existing artwork-only Make scenario
ignores the additional fields. The new inactive intake scaffold maps those
fields into the test Airtable base, but its full route has not run.

The deployed isolated preview blocks encoded-path authentication bypasses,
serves gated HTML with private no-store caching, and associates each artwork
draft with a signed browser cookie and one order session. It checks the
displayed estimate against the chosen options, but artist eligibility remains
a staff decision and no estimate may trigger an invoice. Desktop/mobile local
tests cover Back/Forward, refresh restoration, keyboard focus and labels.
A subsequent patch adds a staff-secret-protected, read-only list of
uncertain submissions and disables the expired Father's Day offer, including
old saved drafts. The later browser-capability change stores only an opaque artwork job ID in
the browser and seals the capability server-side under a signed HttpOnly
session. Commit `2bc004d` additionally implements a durable SQLite outbox,
early guarded Make claim acknowledgement, same-session polling, trusted
binding of only the session-owned opaque job ID, authenticated outcome callback
and explicit `unknown`/`manual_review` states. Later commits `4bfe886` and
`43be85b` add staff-only fixed-folder/root metadata diagnostics and browser
recovery hardening. These safeguards have local tests and are deployed to the
sole JOSH TEST service. No protected full-route
execution has exercised them. A distinct staff secret is now provisioned; an
authenticated read-only hosted recovery summary passed, but it cannot resolve
or resend an uncertain submission and has no alerting.

A further preview-only change disables public playlist lookup and import in
JOSH TEST, so synthetic tester searches do not reach the separate shared
playlist service. Testers can enter a manual synthetic tracklist. This change
does not alter the current live form. A further preview-only copy pass removes
promises of a real order or audio upload link, and the inert fallback route
returns 410 if the test handoff script is unavailable. The latest version is
deployed to JOSH TEST; the hosted authenticated smoke test is pending. Playlist
import still needs its own prelaunch regression check in an
appropriately isolated environment. The isolated intake mapping also identified
Packaging, Vinyl Colour, Side A Length and Side B Length as absent from the
current Airtable intake map. Four matching fields now exist in the JOSH TEST
base, and the proposed create-record mapping validates with no Make configuration
errors or warnings. A real intake execution is still needed to verify persistence.

The deployed review code also fixes a missing `Origin` on a same-origin mobile
draft request, prevents playlist error markup from executing, gates the private
Dropbox probe on setup mode, retains failed jobs for staff recovery, stores
verified delivery metadata without provider paths, and exposes a separate
authenticated paginated failure list. New uploads check remaining disk space;
staff and binding secrets must differ; migrated delivered records receive a
completion-based retention window. Those code changes are deployed. Hosted
staff summary authorization was checked after the separate secret was
provisioned. Staff failure alerting, reconciliation and backup/restore remain open.

Local verification for review commit `43be85b`: `npm test` passed 26/26, including migrated-volume,
terminal-failure, low-space upload rejection, staff recovery and strict Dropbox
receipt cases, encoded-path Basic gating, price tampering, cross-session artwork
binding, queued intake races, callback idempotency and read-only uncertain-submission visibility. The UI
script passed desktop/mobile handoff, refresh, Back/Forward, no-artwork and forged-origin cases;
`npm run acceptance` produced two synthetic archives with 3000 px covers and
1146 px labels; both local ZIPs passed `unzip -tq`. Production dependency audit
reported zero vulnerabilities. A 390 px mobile test included designer upload
and a mocked isolated submit. Remote authenticated HTTP checks saw gated 200,
unauthenticated 401,
wrong-origin 403, noindex). A prior GitHub Actions run failed one browser test
with `spawn ETXTBSY`: concurrent tests extracted Chromium into the same
`/tmp/chromium`. The serialized runner and updated UI fixture passed the full
GitHub review gate on final code commit `ecfa1547dac5e68ac71c898b663a6841ea7fba0f`
([run 44850487239](https://github.com/crosstalkrecords/crosstalk-customs-calculator/actions/runs/44850487239)).
The latest deployed SHA `43be85b` still requires a hosted authenticated form smoke test.
The test-intake allowlist, fictional shipping, changed-details replay and
server-only Make key guard are deployed to JOSH TEST. The staff visibility
and expired-promotion patch passed local tests and deployed; staff recovery
summary authorization now passes hosted checks. No pull-request
GitHub Actions run was returned for `2bcd592`; the current `43be85b` review
gate passed build, service/UI/acceptance and dependency audit. A
second synthetic acceptance run passed for two local archives, but remote ZIP
contents and hosted authenticated interaction remain unverified.

## Prioritized risks and release gates

Read-only inspection of the active Make intake found webhook 1 → Airtable
create 2/get 28 → Dropbox order folder 12 (`autorename=true`)/Uploads 27 →
file-request steps 38/36 → share link 16 → Airtable updates 30/5 → customer
email 29 → staff email 41 → response 40. The webhook has no Artwork Reference
field. There is no duplicate check before module 2 and no invoice module in
this scenario. These observations do not change the active scenario.

Further inspection found that module 38 stores Dropbox OAuth values directly
in the Make blueprint, so it must not be cloned into JOSH TEST. Module 30
stores the customer file-request URL in Airtable `Internal Folder Link`, but
module 5 overwrites that field with the shared-folder URL. Customer email 29
and response 40 use the shared-folder URL rather than the upload request URL.
This may leave customers unable to upload audio. The isolated copy must create
a verified Dropbox file request using the app-folder OAuth connection, put its
upload URL in `Audio Upload`, and keep a private staff path or verified team-only
link. Leave `Internal Folder Link` empty unless a restricted link is proved.
Verify the customer can upload before emailing.
The [sanitized JOSH TEST intake plan](JOSH_TEST_INTAKE_PLAN.json) documents
the proposed route without credential values or webhook addresses.

The protected Make intake began as an isolated, **inactive** scaffold in scenario
`8715068`: protected test hook `4151555`, sequential preflight, Airtable
`performUpsert` claim/Get and fresh-row detail guard, fixed app-folder Dropbox
folders and a **closed** file request. The scaffold returned 503 after `Manual review`;
populated/mismatched claims return 409 and invalid preflight returns 422.
It has since been saved as a confidential, sequential, **100-module inactive
ASYNC DRAFT** with an early guarded 202 response, closed/open request stages,
Josh-only email branches, optional bind and outcome callback. The saved route
is structurally valid but **unexecuted**; no invoice, payment or public share
module was added. A separate inactive on-demand synthetic runner
`8715455` has the same guarded route with a fixed `TEST JOSH 21.11` payload
and no webhook. An initial UI step was blocked by automatic approval review.
A later approved Run once (`a0b4c820eded4eeba0271aca17825d0e`) completed
four operations: static JSON, Airtable claim, Get Record and manual-review
marker. It created **one sparse test row only**, with Submission ID and
Airtable's default Order Status `New Submissions`; no detail, Dropbox or
email module ran. The fresh guard had required blank status. Both inactive
scenarios now require the exact default and invert the manual-review test.
A second static execution (`6d1bd5588f1242f0a4216b51c57654aa`)
passed the fresh-row guard but module 8 failed on unsupported Make `empty()`;
its Commit handler made the execution appear successful with no details or
Dropbox action. The mapper was replaced with supported `ifempty()`, and
numeric Airtable fields now use `parseNumber()`; both inactive blueprints
passed validation and readback. A third execution
(`dfae93a043194ff38b06fa1154b123c6`) followed all 13 intended modules:
claim/Get, detail update, uncertain stage, exact JOSH TEST folders, closed
file-request creation and final record update. It reused the same static
submission row (three test-base records total), populated the order details
and fingerprint, and ended at the designed `Manual review` stop for a closed
request. The private request link was not opened or sent; this is a **closed
request rehearsal**, not a customer journey or email/delivery test.
Separate inactive on-demand probe `8716077` reopened that same request using
its dynamically mapped Airtable ID through app-folder OAuth. Its one
controlled execution (`91fe95099a9b4a27adac497212fd689a`) completed the
five intended modules: exact-row read, uncertain stage, Dropbox update,
ready-stage write and success marker. The guarded response required HTTP 200,
the same private ID, exact JOSH TEST Uploads destination, `is_open=true` and a
nonempty URL. The same Airtable row now has `Upload link ready` and its private
`Audio Upload` field populated; no private ID or URL was printed, and the
scenario remains inactive. Josh subsequently reported that a harmless dummy
upload through this private request page worked. A later owner view showed
one 1.75 MB GIF/photo at the exact isolated Uploads destination. This does
not validate audio format or content. A second controlled upload of a harmless
one-second 15.67 KB dummy WAV also reached the same destination; Dropbox
showed a finished upload and two items in the request.
Separate inactive on-demand Josh-only email probe `8716152` used the
existing Customs Microsoft `Mail.Send` connection with a single hard-coded
recipient `delousedcomatorium@gmail.com` and no CC/BCC. Its guarded one-time
execution (`de14e890e81849ff912e82c64ceb52ff`) completed five modules,
moving the same test row's Customer Email Status from `Pending` through
`Uncertain` to `Sent`; Staff Email Status remains `Pending`. The subject and
body clearly identify a JOSH TEST receipt and carry the private upload link
from Airtable by dynamic mapping, without printing it here. The scenario
remains inactive. Josh confirmed that this receipt arrived; the private
request subsequently recorded a GIF/photo and a dummy WAV upload. This was a separate email probe, not a
form-created order.
Separate inactive staff-style probe `8716245` also sent only to Josh's
approved address, with no CC/BCC or upload URL. Its single execution
(`5a6d81677e2a47b88298a4b6a6e873ad`) completed five operations and moved
Staff Email Status from `Pending` through `Uncertain` to `Sent`, while Customer
Email Status remained `Sent` and Intake State `Upload link ready`. The staff
message names the synthetic Airtable row and private folder **path**. Josh
confirmed that it arrived. This does not test real staff routing; the only To
address in this probe was Josh's approved test mailbox.
An inactive confidential read-only Dropbox listing probe `8716528` ran once
against the exact fixed Uploads path and Make reported success. Its confidential
history suppressed the result bundle, so file count, size, type and contents
could not be inferred from that execution. An aggregate-only Compose follow-up
first failed before an Airtable diagnostic write. Its mapping was corrected and
saved, but the next UI Run once was rejected by automatic approval review
because it would discard a stale editor recovery. A separate staff-only
read-only scan initially found zero files/bytes at the exact Uploads path;
the scoped app root then had three older ZIPs and no audio. A later owner request
view showed one submitter, one upload, one 1.75 MB item, and the exact isolated
Uploads folder contained that GIF/photo. The later evidence supersedes the
initial zero-file snapshot. A further one-second dummy WAV upload also finished;
the owner view now reports two uploads/two items (1.76 MB total), including
the 15.67 KB WAV at the same exact test destination.
The [Airtable-ledger draft](JOSH_TEST_AIRTABLE_LEDGER_DRAFT.md) records stages,
scenarios and the manual-stop design. Make incomplete execution storage stays
off; both inactive scenarios now use Commit stop handlers. Eleven protected
intake error routes were replaced and passed structural readback with zero
Break directives, but have not been runtime tested. The
`JOSH TEST Customs intake ledger` Make
Data store (ID `267564`, 1 MB) remains empty and **unused**.
The new Make Airtable connection 13265002 is Locked, and its grant was
independently verified in Airtable Integrations as limited to the JOSH TEST
base. No broad workspace grant was made. The first new Make Dropbox connection
13265327 is **unused**: its root listing exposed `Crosstalk Customs`,
`File requests` and `Apps` outside the expected app folder, and its write
boundary was not established. Its team visibility was acceptable for read
access, but this did not prove test-only writes.

Replacement connection 13265654 uses the JOSH TEST Dropbox app-folder grant
with `account_info.read`, `file_requests.write`, `files.content.write`,
`files.metadata.read`, `sharing.read` and `sharing.write`. Inactive read-only
probe 8714819 used OAuth-backed `dropbox:makeApiCall` and returned HTTP 200
for the test folder. An initial metadata lookup of a previously exported
unique JOSH TEST ZIP returned `path/not_found` because the lookup path was
wrong; the corrected exact-path lookup returned HTTP 200, size **2,163,437
bytes**, proving Make can see that exporter's isolated file. Inactive write
probe 8715276 created a fixed test order folder, nested Uploads folder and
**closed** file request. All three calls returned HTTP 200; returned paths
and request destination matched, and `is_open=false`. No customer upload or
public share was made. The native folder picker RPC failed on the sandbox
app, so the new intake uses OAuth-backed API-call modules without raw tokens.
The UI step to inspect the private request ID/URL for an open-update probe
was rejected by automatic approval review; it was not retried elsewhere.

The dedicated test hook is API-key protected. The isolated server sends the
key only in a server-to-Make `x-make-apikey` header, but the JOSH TEST Railway
webhook URL transfer was blocked by automatic approval review. The hosted
form's full-intake submission remains unavailable. Old broad Dropbox
connection 13265327 stays unused. Artwork-only scenario 8084300 remains
inactive and binds a static synthetic folder; it is not the full intake.
The incomplete protected intake `8715068` now has Make's confidential-data
setting enabled to reduce stored execution payloads; structural readback
confirmed it remains inactive, valid, sequential, with incomplete execution
storage off and no Break handlers. It has not run under this setting. The
deployed isolated server accepts only an opaque artwork job ID through Make
and resolves the sealed draft capability inside the exporter. The full
Make route and that server/Make contract remain unexecuted together.

Two controlled inactive UI Run once executions of isolated claim probe
8715169 used `performUpsert` with only Submission ID: first returned one
created record, second one updated record with the **same Airtable ID** and
one row. A third controlled run added read-only Get Record and confirmed
the output is a flat field-ID keyed collection, with absent fingerprint/state
fields omitted. The full intake guards fresh rows and sets uncertain stages
before side effects, with `Commit` stop error routes and incomplete execution
storage off. The static fresh-row guard completed one closed-request route;
the protected webhook guards and forced timeout/replay behavior are **not
runtime tested**. Airtable upsert is
not a uniqueness constraint against other writers. The [sanitized intake
plan](JOSH_TEST_INTAKE_PLAN.json) records the exact inactive scenario state.
The code now persists `queued` before dispatch and polls the same session;
an ambiguous 25-second Make dispatch becomes `unknown` for staff review.
The actual protected Make route timing still needs a controlled measurement.

| Priority / risk | Likelihood / impact | Evidence | Concrete resolution and retest status |
| --- | --- | --- | --- |
| 1. Production path is incomplete | Certain / high | Inactive 100-module intake 8715068 is saved but unexecuted. Separate probes opened a request and sent two Josh-only emails; a GIF/photo and small dummy WAV reached the exact test folder. One full form submission has not run. The live form and Customer Intake are unchanged. | Execute one protected isolated form-created order with claimed Airtable ID, verified audio destination, artwork bind and ZIP, both emails, no-artwork regression and staff recovery. **Blocked; no complete journey.** |
| 2. Duplicate intake may create a second real order | Medium / high | Active Make intake creates Airtable records without a prior dedup. Separate test claim probe created then reused one row with the same ID across two runs; full intake/replay and timeout routes have not run. | Guard on Submission ID and Request Fingerprint, verify state and reconcile side effects. Force ambiguous timeout after claim and duplicate webhook; confirm one row, one request, one email pair. **Claim reuse resolved in probe; full-route recovery open; live untouched.** |
| 2m. Intake timeout and ambiguous dispatch | Medium / high | Static claim, folder, request and separate email probes take meaningful time. A timeout after side effects may be ambiguous. The deployed JOSH TEST code durably queues before dispatch, expects an early guarded Airtable-claim response, polls the same session and marks ambiguity `unknown` instead of blind retry. | Time the full protected route and force timeout/crash/duplicate after claim; reconcile the Airtable row and side effects before retry. **Code and local tests pass; integrated runtime proof open.** |
| 2e. Ambiguous email delivery on retry | Medium / medium | A provider send can succeed before Make saves a sent flag or responds. The Customs Microsoft sender connection grants `Mail.Send` but not `Mail.Read`; the connected Outlook account is a different Releases mailbox. Both isolated Josh-only probes marked separate `Sent` states, and Josh confirmed both messages arrived. | Stop automatic retries at ambiguous sends; reconcile provider and inbox evidence before deliberate recovery. Force failures around each send and verify real staff routing separately. **Probe arrival resolved; integrated ambiguity and real routing open.** |
| 2a. Copied invoice action in the test base | Low for form-only tester, high impact if clicked | A seeded test record computed a `Send Invoice` button pointing at an external invoice webhook. | Button was **not clicked**; field renamed with a warning and omitted from published staff interface. Remove the column in Airtable's base editor before broader direct table access. **Contained for form/staff-interface testing; deletion open.** |
| 2b. Customer audio link overwritten in current intake | Medium / high | Live Make module 30 writes the file-request URL to `Internal Folder Link`; module 5 overwrites it with a share URL and module 29 emails that share URL. | In the isolated copy, the file-request URL goes to `Audio Upload`; staff retain a private folder path or a verified team-only link, with `Internal Folder Link` empty unless that link is safe. Verify customer upload before proposing any live fix. **Open; live unchanged.** |
| 2c. Secret-bearing Make blueprint and broad Dropbox connection | Medium / high | Live module 38 contains OAuth material; broad 13265327 remains unused. App-folder 13265654 read the exporter ZIP, created fixed folders and reopened the existing request through OAuth-backed API calls. No raw OAuth values or old broad connection are in inactive 8715068. The private request delivered a GIF/photo and small dummy WAV to the fixed folder. | Keep OAuth material out of the blueprint; test error recovery and enforce audio policy before production. **Scoped read/write/open, generic and WAV transfer passed; handling policy open.** |
| 2i. Staff folder may become public | Medium / high | Dropbox `create_shared_link_with_settings` defaults to public visibility if no settings are supplied; the proposed module 16 did not set an explicit audience. | Do not create a default share link in JOSH TEST. Only store a verified team-only URL for staff; if that is unavailable, leave the Airtable URL blank and keep the private path in the test Airtable ledger for authorized staff. Test access as an unauthorised viewer before considering production. **Default link removed from test plan; sharing retest open.** |
| 2h. Test preview reaches shared playlist lookup | Medium / medium | The copied calculator includes four calls to the separate production playlist importer. | A preview-only rewrite disables those network calls and presents manual synthetic track entry. Local focused tests pass and the change is deployed; hosted authenticated check remains. Test playlist import separately before go-live. **Code deployed; hosted retest open.** |
| 2f. Different Dropbox app folders cannot share an order path | Low after read proof / high | A corrected Make metadata lookup found an older exporter ZIP at a separate JOSH TEST path, 2,163,437 bytes. The static request then delivered a 1.75 MB GIF/photo and 15.67 KB dummy WAV to its exact fixed order Uploads folder, confirmed in Dropbox owner view. | Bind a new artwork job to the same claimed record/folder and verify the resulting ZIP beside the test audio file. **Shared read namespace and request destination passed; combined delivery open.** |
| 2j. Private request inspection and full-run gate | Medium / medium | The static route created a closed request; a separate probe reopened it, checked exact destination/ID/open state and populated private Audio Upload. Later owner evidence recorded two uploads/two items (1.76 MB total): a GIF/photo and one-second dummy WAV at the exact destination. | Exercise duplicate and expired/closed-request behavior; verify a real audio file as part of the full form-created journey. **Generic and small WAV upload passed; integrated route open.** |
| 2n. Audio upload validation and malware handling | Medium / high | The private request accepted both a GIF/photo and small WAV in the order's Uploads folder. It bypasses the artwork image-validation endpoint; no enforced audio format/size policy, quarantine or malicious-file scan is established. | Define allowed audio formats and maximum bytes, validate the uploaded file and match it to the claimed order before staff retrieval; quarantine or reject unexpected files and agree a malware scanning workflow. Test wrong type, oversized file and duplicate upload in JOSH TEST. **Small WAV transfer passed; policy gate open.** |
| 2g. Artist field semantics need confirmation | Medium / low | The current intake maps `Artist Order = Yes` to a boolean-like value in an Airtable single-line `Artist` field, rather than an artist name. | In the isolated record, compare the intended meaning of that field with staff expectations and map it explicitly; preserve the source behavior only if it is deliberately a yes/no flag. **Open; live unchanged.** |
| 2d. Form values can disagree with the quoted price | Low after isolated fix / medium | The JOSH TEST server recalculates the displayed estimate from allowed format, quantity, colour, packaging, rush and shipping; tampered amounts fail locally. Production remains unchanged. | Exercise all pricing branches and tampered prices in the hosted test, then review live pricing parity before cutover. **Isolated code deployed; hosted parity open.** |
| 2k. Artist eligibility and expired promotion | Medium / high if invoiced | The artist unlock string is client-side and a restored test draft could revive the expired Father's Day selection. Browser artist status does not prove eligibility. | The deployed JOSH TEST patch hides/disables the expired offer, blocks restoration and rejects its marker. Keep artist and final quote under staff approval before any invoice; implement trusted eligibility or remove automatic artist pricing in production. **Promotion retested locally and deployed; eligibility open.** |
| 2l. Browser-held artwork capability | Medium / high | The legacy handoff stores a per-draft bearer-equivalent token in browser storage and sends a full reference through the form. It is not an infrastructure key and is not in the URL, but a script running on that origin could read it. | The isolated JOSH TEST code now uses an HttpOnly signed browser session and server-sealed draft token, with only an opaque job ID in the browser; local tests and JOSH TEST deploy pass, hosted authenticated retest pending. A separate production redesign is required before attaching the designer to the live form. **Test code deployed; production open.** |
| 3. Failed or uncertain jobs could be missed | Medium / high | Four older artwork jobs are failed, each after three attempts; an ambiguous Make timeout leaves test submissions `unknown` and rejects a blind repeat. The authenticated summary is read-only; no alert, recovery ownership or backup/restore schedule is established. | Assign staff ownership, alert on failed/unknown/stale processing, document manual reconciliation before any retry, back up the SQLite database and artwork volume with restricted access, and rehearse a restore plus no-double-delivery check. **Read-only visibility passes; alert/recovery/restore gate open.** |
| 4. Printed files may differ from approved templates | Medium / high | Synthetic parser/render tests exist; actual remote ZIP and PSDs have not been opened/edit-saved/reopened in Photoshop or physically approved. | Download the delivered test ZIP, inspect source files and PSD layers/masks/fonts, edit/save/reopen, print covers and labels, and obtain engineer approval. **Open.** |
| 5. Hosted phone experience unknown | Medium / medium | The mobile fix is in the successful Railway deployment, but hosted phone use has not been witnessed. Josh confirmed both isolated probe messages arrived; Dropbox owner evidence confirmed a generic file and a small WAV. | Have a human tester use the completed hosted interface on desktop and phone with refresh/interruption/large image; test audio and both emails as part of one order. **Probe email and WAV transfer passed; integrated UX open.** |
| 6. Production infrastructure and permission boundary absent | Certain / high | Railway project has only JOSH TEST. The replacement Make Dropbox grant is app-folder scoped; separate production credentials, volume, backup, alert and ingress limiter have not been verified. | Provision distinct production service/volume and credentials, restrict access, implement ingress rate limiting, backup/restore and monitored failure queue. Verify with synthetic data before enabling customer delivery. **Open.** |
| 7. Repeat delivery and changed/missing references | Low to medium / high | Same submission cached; duplicate binding returned `already_bound`; server rejects conflicting binding and arbitrary folder; worker retries existing archive. Hosted interrupted and adversarial paths are less thoroughly exercised. | Force upload interruption, restart mid-job, duplicate webhook, expired/invalid/foreign references and mismatched order folder in the isolated copy; inspect that one verified archive results and staff can recover. **Partial; further retest required.** |
| 8. Privacy and retention | Medium / medium | Test route fixes name/recipient/root and omits live downstream systems; service has source, layer and project limits, noindex and Basic gate. Failed jobs are now retained to avoid silent loss, which also extends private data retention. | Agree deletion/acknowledgement and restricted backup policy, verify access logs/secret handling and upload validation, measure actual Railway volume headroom during PSD/ZIP rendering and restore. **Open policy/operational gate.** |
| 9. Final CI and hosted gate | Low / medium | Railway reports successful JOSH TEST deployment of `43be85b`; its GitHub review gate passed build, service/UI tests, acceptance and audit. Staff summary and fixed-folder diagnostics passed, but hosted authenticated form/phone journey remains untested. | Complete the hosted form and isolated full intake after the upload failure and permitted secure hook configuration are resolved. **Code gate/deploy passed; end-to-end gate open.** |

## Live and test configuration comparison

| Boundary | JOSH TEST | Live/current or proposed production |
| --- | --- | --- |
| Form | Basic gated isolated preview and designer | Current GitHub Pages form remains in use without this handoff |
| Make | Artwork-only 8084300 inactive; full intake 8715068 saved as an inactive, confidential 100-module ASYNC DRAFT with early 202, protected hook, guarded test Airtable/Dropbox, open request, email, bind and callback paths, all unexecuted together. Static runner 8715455 rehearsed a closed-request route; separate inactive probes 8716077 opened it and 8716152/8716245 sent Josh-only emails. Aggregate listing probe 8716528 failed its first Compose map; the corrected Run once was blocked by UI discard review. Old broad Dropbox 13265327 unused. | Customer Intake 4762364 remains active; no integration change applied. |
| Orders and billing | Test Airtable base has manually seeded fixture, claim probe row and one populated static-runner row; no form-created order, invoice or payment. The private request recorded two uploads: a GIF/photo and a dummy WAV. Copied invoice button omitted from staff interface. | Existing intake creates records/folders and emails; it has no invoice module. Invoicing is separate. |
| Dropbox | Fixed JOSH TEST root; verified exporter ZIP read by Make, fixed folder writes and an open request with URL stored privately in test Airtable. The exact new Uploads path contains a 1.75 MB GIF/photo and 15.67 KB one-second dummy WAV. | Separate production root/authorization and tested environment required. |
| Exporter | JOSH TEST Railway service/volume, one worker; `43be85b` deployed successfully, delivery disabled; staff secret, read-only summary and fixed-folder diagnostics verified; no full intake binding. | No production exporter in this project yet. |
| Secrets | Test hook key exists server-side in Make and is not in a blueprint/browser URL; JOSH TEST Railway webhook URL transfer was blocked, so hosted submission remains off. | New separate production credentials and staff recovery secret to provision securely. |

## Evidence required before a live approval request

| Gate | Evidence to present | Current state |
| --- | --- | --- |
| First-time form journey | Hosted desktop and phone runs with artwork and without artwork; product/price/options, upload, refresh, validation and completion screens match the submitted test order. | Local browser tests passed; hosted authenticated run and tester acceptance open. |
| Isolated intake and recovery | One Airtable row per `TEST JOSH 21.11` Submission ID with mapped details, fingerprint, Make execution and stage history; repeat click/webhook and forced post-claim timeout leave one row and one set of side effects. | Third static run completed the guarded closed-request route, reused one row and populated details/fingerprint. Actual webhook intake, duplicate after side effects, forced timeout, email and 25-second contract remain untested. |
| Audio, artwork and email | File request records a supported audio upload in the fixed test app folder; actual exporter bind uses the claimed record and same Uploads path; remote ZIP content/Photoshop/print review; Josh's customer and staff emails observed in inbox/Sent. | Josh confirmed both separate probe emails. Owner view confirmed the small dummy WAV and GIF/photo at the exact folder. Audio policy, actual staff routing, integrated bind, remote ZIP contents and print review remain open. |
| Security and operations | Confirm test-only OAuth/write boundary, no default public staff link, no invoice/payment/live recipient, protected hook and server-only key, audio format/size/malware policy, failure alert/retry, volume headroom, retention and backup/restore. | Test-only connection read/fixed writes and small WAV transfer proven; old broad connection unused. Staff recovery summary authenticated and read-only; audio policy, alerting, reconciliation, restore drill and blocked hook transfer remain open. |
| Release and reversal | Exact live form diff, Make blueprint and environment variable **names** (not values), deployment order, monitored smoke, saved live commit/blueprint, disabling switches and a rehearsed rollback/no-artwork regression result. | Plan below is preliminary; no live change or production activation authorized. |

## Proposed release sequence — approval boundary

1. Finish JOSH TEST checks: health and the isolated code deploy have passed;
   the private request's generic and small dummy WAV transfers to the exact
   destination are now verified. Establish audio type/size limits and a safe
   staff validation/quarantine procedure before accepting customer audio. Then
   repeat hosted authenticated mobile and no-artwork journeys after a permitted
   secure transfer of the protected Make hook destination to JOSH TEST Railway
   and a reviewed activation window. Confirm both probe emails again in a
   single form-created journey and obtain actual ZIP/Photoshop/print acceptance. Force a failed delivery and verify
   staff visibility, recovery and no double delivery.
2. Snapshot the live form commit and export the active Customer Intake
   (`4762364`) blueprint. The review branch's `calculator.html` still posts
   directly to the current public Make hook and does not load the artwork
   handoff script; the current service build emits JOSH TEST copy only. Prepare
   an exact production form diff that loads the reviewed artwork script,
   replaces browser-to-Make submission with a protected server intake, and
   handles confirmed/pending/uncertain states while preserving no-artwork
   orders. Provision a **separate** single-worker production exporter and
   private volume with delivery disabled and distinct `ARTWORK_BIND_SECRET`,
   `ARTWORK_STAFF_SECRET`, `ARTWORK_ORIGINS`, `ARTWORK_PUBLIC_ORIGIN`,
   `ARTWORK_DATA_DIR`, `ARTWORK_DELIVERY_MODE`, `ARTWORK_DROPBOX_ROOT`,
   Dropbox credentials, and protected Make destination/key. Configure ingress
   limits, retention, backup/restore and alerts; verify health and a synthetic
   archive in isolation first.
3. Remove the copied test-base invoice button in Airtable's editor before
   direct tester table access. Keep broad Dropbox connection 13265327 unused.
   Review and run the saved **inactive 100-module** intake 8715068 in a
   controlled test only after the upload failure and secure hook handoff are
   resolved. Verify preflight/fingerprint, early 202 acknowledgement,
   final callback and manual-stop error handling; establish an **open** request
   actually accepts a harmless audio upload into the
   same isolated Uploads folder. Persist the verified customer URL in Audio
   Upload, keep Internal Folder Link empty unless a team-only URL is proven,
   and use the private path for authorized staff. Check the saved optional
   artwork bind uses the claimed Airtable ID and Uploads path, and the fixed
   Josh-only email branches use separate uncertain/sent states. Test normal,
   no-artwork, duplicate, timeout, partial-failure and staff recovery routes.
   Confirm the early claim response is timely and the deployed durable queue,
   polling, timeout-to-unknown and callback behave correctly under latency.
   Do not copy live raw OAuth values or add invoice/payment modules.
4. Prepare a separate production Make scenario: replace unconditional Airtable
   create/get modules 2/28 with a guarded claim; replace folders 12/27 with
   fixed, no-autorename paths; replace raw OAuth HTTP modules 38/36 with a
   scoped Dropbox connection; store the verified request in `Audio Upload`
   rather than a shared-folder URL. Bind artwork to the actual Airtable ID and
   Uploads path, with separate uncertain/sent states around customer/staff
   email modules 29/41. Present the exact form diff, Make blueprint diff,
   environment configuration,
   test evidence and rollback snapshots to Josh. **Stop here for explicit approval**
   of the live form change and production delivery activation.
5. After approval, deploy the production exporter with delivery initially off;
   verify non-mutating health/configuration checks, activate the reviewed Make
   route and switch the form in a short monitored window, then enable delivery.
   Observe the first genuine order across Airtable, email, Make, ZIP and staff
   views without creating a live synthetic order unless Josh separately
   authorizes it. Watch job failure queue, Make errors, disk and delivery logs.
6. If a check fails, revert the form to its saved commit, restore the Make
   route/blueprint as applicable, disable production delivery and keep the
   volume/queued files for diagnosis. Confirm ordinary no-artwork orders still
   work after rollback. Retire and rotate the old exposed public hook only
   after the new route stabilizes; once rotated, rollback must use a prepared
   protected path rather than assuming the old URL will work.

No live form update or production delivery activation is authorized by this
review. The approval decision will be the specific diffs and configuration from
step 4, after the release gates above are satisfied.
