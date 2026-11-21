# Crosstalk Customs artwork handoff — prelaunch review

Status: **isolated tester interface available, complete journey blocked, production release blocked**. This is the
Customs project only. The live order form and Customer Intake scenario have not
been changed. Review branch: `artwork-form-handoff-review-20261119`; draft PR
[#24](https://github.com/crosstalkrecords/crosstalk-customs-calculator/pull/24)
targets `artwork-delivery-integration-20261018`, not the live form.

**21 November actual hosted submission:** Josh submitted **TEST JOSH 21.11**
through the Basic-gated JOSH TEST form in his own browser at 12:34 UTC. The
protected intake created one isolated Airtable order, JOB361
(`recqHVGRZkWrJEMCV`), with Submission ID
`1d3ebcab-3569-4d6b-a1dc-04f99a1512e8`. It records one double-sided black
7-inch 45 RPM order, Custom Finish Pack, pickup and a $140 estimate. The
Make execution `ba8a624ca2ca453cb76e145a8e7e4fe1` completed in 19.329 s
with **WARNING**, not clean success. Its detailed module trace was unavailable
through the connected execution-detail API; the warning remains unexplained.
Railway HTTP logs show `/v1/test-orders` 202, protected bind 202 and the
outcome callback 200. Airtable reports `Intake State=Completed` and separate
customer/staff email states `Sent`, but actual receipt of these *new* emails
has not yet been independently confirmed. The private Dropbox request and
fixed folder were created. Dropbox owner view shows a **2.06 MB ZIP inside
this order's isolated Uploads folder**, not the parent folder. Dropbox's ZIP
preview lists front/back PSDs and reference PNGs, README, conversion manifest,
Fonts and Recovery. The manifest reports two 3000-pixel surfaces, one editor
layer each, no native text and no fallbacks. The remote ZIP has not been
downloaded for CRC/Photoshop verification. The new Dropbox file request's
owner view showed zero views and zero customer uploads; the exporter ZIP is
not counted as a customer upload. Airtable still shows `Artwork Delivery Status=Queued`
despite the ZIP's presence; the worker has no Airtable delivery-status update
path. The exporter job's final state needs a separate authenticated check.
This is material staff visibility work before tester release or go-live.

Earlier separate probes confirmed Josh-only receipt and staff-style email
arrival and a private-request GIF/photo plus harmless one-second 15.67 KB
dummy WAV at a different test order folder. These do not prove the new order's
email or audio stages. The cloud browser could not pass the preview Basic
gate, so hosted UX observation remains a human test. The controlled JOSH TEST
window is now closed: Make 8715068 was deactivated, Railway delivery mode was
set to `disabled`, its redeployment succeeded, and hosted `/health` returned
`deliveryMode=disabled`, `configured=false`. No live form or production-delivery
change occurred.

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
from the staff page. The connected Airtable API cannot delete that field. The
isolated Airtable UI confirmed the copied button has no dependencies, but
warned that deleting the field cannot be undone; deletion was not confirmed.
Remove it with action-time approval before granting any tester direct table
access. The isolated form URL does not expose the Airtable table.

## Tester access and boundaries

- Preview URL (isolated; complete tester journey still under review):
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
  Make: artwork-only 8084300 remains inactive; the protected full intake is
  8715068 and ran only in a controlled JOSH TEST window. Disable the full
  scenario and delivery mode when verification ends; Dropbox setup stays
  disabled. The actual order destination is fixed beneath
  `/Crosstalk Customs/JOSH TEST/` in the scoped app folder.
- Railway reports a successful **JOSH TEST only** deployment of review commit
  `43be85b` on 21 November 2026. Hosted `/health` returned
  `deliveryMode=disabled` and `configured=false` before the controlled run;
  unauthenticated normal and percent-encoded preview paths, designer and
  test-config returned 401 in checks across the review. A distinct
  `ARTWORK_STAFF_SECRET` was provisioned on the sole JOSH TEST service after
  code deployment; its resulting redeployment succeeded. The authenticated,
  read-only staff recovery summary returned HTTP 200, while unauthenticated
  access returned 401. The test form's server-only Make key guard is deployed,
  and the protected hook destination is now configured. In a controlled window
  Make 8715068 and Dropbox delivery were reactivated for the hosted submission
  above, then disabled after the ZIP was verified. That execution produced a form-created order and ZIP but has an
  unexplained warning and incomplete email/audio/status evidence. Hosted
  mobile, recovery-action and no-artwork checks remain open.

## Intended journey and what has been exercised

| Stage | Intended customer/staff outcome | Evidence and current gap |
| --- | --- | --- |
| Open and configure | Customer chooses product, format, packaging, audio and other options; sees a comprehensible price. | Josh completed a hosted 7-inch test order with $140 estimate. Local desktop/mobile browser tests cover the guarded path; first-time tester acceptance and hosted mobile remain open. |
| Design and upload | Customer uses front/back and label surfaces, adds source images, completes the designer, and sees an attached artwork reference on order review. | The hosted submission bound and produced front/back PSDs and references. Local tests cover upload, attachment, failed submission retry, refresh/session isolation and mobile width. Independent human review of the hosted designer remains open. |
| Submit | Test submission reaches only the isolated endpoint and protected Make intake; customer sees an accurate order state. | JOB361 is a form-created isolated Airtable order. `/v1/test-orders` returned 202, protected bind 202 and outcome callback 200. Make ran with WARNING; no clean end-to-end result can be claimed until the warning and later stages are reconciled. |
| Confirmation email | Josh receives a clearly labelled test receipt acknowledgement. | JOB361's Airtable customer and staff email states are both `Sent`, but arrival of these two new messages has not yet been confirmed. Earlier separate Josh-only probes arrived; ambiguous-send recovery remains untested. |
| Bind, render and deliver | Trusted processing binds the reference to the actual order's Uploads folder, renders the PSDs/ZIP and verifies the Dropbox upload. | Dropbox owner view confirms a 2.06 MB ZIP in JOB361's fixed isolated Uploads folder. Preview lists front/back PSDs and PNGs, manifest, README, Fonts, Recovery. The manifest lists 3000-pixel surfaces. The exporter final state, archive CRC, Photoshop round-trip and print review remain open; Airtable incorrectly remains `Queued`. |
| Audio upload | Customer follows a private request and uploads audio to the isolated order folder. | JOB361 has a private request and matching fixed destination; the owner view shows zero customer uploads. An earlier separate probe transferred a GIF/photo and harmless 15.67 KB dummy WAV. Audio policy and integrated audio journey remain open. |
| Staff handling | Staff see an order, audio/assets, delivery or failure status and an actionable recovery path. | JOB361 appears in the published JOSH TEST Staff Review with mapped order details. The Airtable artwork status remains `Queued` after ZIP appearance, so staff cannot trust that field. An authenticated read-only recovery summary exists, but alert/recovery ownership and real staff routing remain open. |

Test identifiers retained for correlation: order
`0f7ba405-0239-47fa-b17d-688458e2139a`, Make execution
`aae0cc521ea54c55b7a334b3156670a7`; the no-artwork order is
`4b1dc176-5c62-40b6-9442-e9fe56506bdc`. No artwork capability reference,
provider token or webhook address belongs in this report. A Make 202 is a queue
acknowledgement, not evidence of delivery; JOB361's Dropbox contents were
independently inspected through the owner UI. Its exporter final state has not
been obtained.

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
ignores the additional fields. The protected intake mapped JOB361's actual
details into the isolated Airtable base in its first full hosted execution.

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
It was then saved as a confidential, sequential, **100-module ASYNC DRAFT**
with an early guarded 202 response, closed/open request stages, Josh-only
email branches, optional bind and outcome callback. The route subsequently
executed JOB361 with WARNING; no invoice, payment or public share
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
key only in a server-to-Make `x-make-apikey` header. Automatic approval review
blocked tool transfer of the hook address; Josh then configured it privately
in the JOSH TEST Railway service and the deployment succeeded. A first
controlled Make/Dropbox window closed without a submission. A second window
yielded JOB361 and the WARNING execution described above. Old broad Dropbox
connection 13265327 stays unused. Artwork-only scenario 8084300 remains
inactive and binds a static synthetic folder; it is not the full intake.
The incomplete protected intake `8715068` now has Make's confidential-data
setting enabled to reduce stored execution payloads; structural readback
confirmed it was valid, sequential, with incomplete execution storage off and
no Break handlers before the controlled run. The
deployed isolated server accepts only an opaque artwork job ID through Make
and resolves the sealed draft capability inside the exporter. The full
Make route executed with one form-created order, but its warning and later
delivery-status synchronization remain unresolved.

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
| 1. Production path is incomplete | Certain / high | JOB361 ran through protected Make, created one test Airtable row and a ZIP at its fixed Dropbox destination. Make ended WARNING; new email arrival and audio upload have not been verified; no-artwork and staff recovery remain open. The live form and Customer Intake are unchanged. | Explain the warning, verify both JOB361 emails and a supported audio upload to its request, complete no-artwork/mobile/recovery and remote PSD review. **Partial isolated journey; production blocked.** |
| 1a. Delivery status is stale | High / high | Dropbox shows JOB361's ZIP while Airtable and the staff interface still show `Artwork Delivery Status=Queued`. The Make outcome callback reports binding, not final worker delivery. | Local review commit `1a34155` derives truthful customer/staff API status from the worker receipt and preserves the test order on refresh; focused tests pass, but this is not deployed yet. Add a secure, idempotent test-base status update or controlled Make reconciliation after the worker verifies Dropbox, with failure/alert handling. Retest delivered and failed jobs. **Airtable status open; staff cannot rely on it.** |
| 1b. Make warning unexplained | Unknown / medium | The actual 19.329-second execution ended WARNING. Connected execution detail returned only the status and no module trace; the order's main side effects occurred. | Inspect the exact warning in Make execution UI or provider support, correct its cause and rerun the isolated full route with no customer effects beyond Josh. **Open.** |
| 2. Duplicate intake may create a second real order | Medium / high | The current live Make intake creates Airtable records without a prior dedup. Separate test claim probe reused one row with the same ID across two runs. JOB361's normal full intake ran once; replay and timeout routes have not run. | Guard on Submission ID and Request Fingerprint, verify state and reconcile side effects. Force ambiguous timeout after claim and duplicate webhook; confirm one row, one request, one email pair. **Claim reuse resolved in probe; full-route recovery open; live untouched.** |
| 2m. Intake timeout and ambiguous dispatch | Medium / high | Static claim, folder, request and separate email probes take meaningful time. A timeout after side effects may be ambiguous. The deployed JOSH TEST code durably queues before dispatch, expects an early guarded Airtable-claim response, polls the same session and marks ambiguity `unknown` instead of blind retry. | Time the full protected route and force timeout/crash/duplicate after claim; reconcile the Airtable row and side effects before retry. **Code and local tests pass; integrated runtime proof open.** |
| 2e. Ambiguous email delivery on retry | Medium / medium | A provider send can succeed before Make saves a sent flag or responds. The Customs Microsoft sender connection grants `Mail.Send` but not `Mail.Read`; the connected Outlook account is a different Releases mailbox. Both earlier Josh-only probes arrived. JOB361's separate email states say `Sent`, but arrival has not been confirmed. | Stop automatic retries at ambiguous sends; reconcile provider and inbox evidence before deliberate recovery. Confirm JOB361's receipt and staff notice, then force failures around each send and verify real staff routing separately. **Open.** |
| 2a. Copied invoice action in the test base | Low for form-only tester, high impact if clicked | A seeded test record computed a `Send Invoice` button pointing at an external invoice webhook. | Button was **not clicked**; field renamed with a warning and omitted from published staff interface. Remove the column in Airtable's base editor before broader direct table access. **Contained for form/staff-interface testing; deletion open.** |
| 2b. Customer audio link overwritten in current intake | Medium / high | Live Make module 30 writes the file-request URL to `Internal Folder Link`; module 5 overwrites it with a share URL and module 29 emails that share URL. | In the isolated copy, JOB361's file-request URL is in `Audio Upload`, `Internal Folder Link` is empty and staff have a private path. Verify an audio upload to JOB361's request before proposing the live fix. **Isolated mapping passed; upload and live change open.** |
| 2c. Secret-bearing Make blueprint and broad Dropbox connection | Medium / high | Live module 38 contains OAuth material; broad 13265327 remains unused. App-folder 13265654 read the exporter ZIP, created fixed folders and reopened the existing request through OAuth-backed API calls. No raw OAuth values or old broad connection are in inactive 8715068. The private request delivered a GIF/photo and small dummy WAV to the fixed folder. | Keep OAuth material out of the blueprint; test error recovery and enforce audio policy before production. **Scoped read/write/open, generic and WAV transfer passed; handling policy open.** |
| 2i. Staff folder may become public | Medium / high | Dropbox `create_shared_link_with_settings` defaults to public visibility if no settings are supplied; the proposed module 16 did not set an explicit audience. | Do not create a default share link in JOSH TEST. Only store a verified team-only URL for staff; if that is unavailable, leave the Airtable URL blank and keep the private path in the test Airtable ledger for authorized staff. Test access as an unauthorised viewer before considering production. **Default link removed from test plan; sharing retest open.** |
| 2h. Test preview reaches shared playlist lookup | Medium / medium | The copied calculator includes four calls to the separate production playlist importer. | A preview-only rewrite disables those network calls and presents manual synthetic track entry. Local focused tests pass and the change is deployed; hosted authenticated check remains. Test playlist import separately before go-live. **Code deployed; hosted retest open.** |
| 2f. Different Dropbox app folders cannot share an order path | Low after actual order / high | JOB361's actual exporter ZIP appeared inside the fixed `Uploads` folder created by the protected intake. The older static request separately accepted a GIF/photo and dummy WAV. | Verify a new audio upload lands beside JOB361's ZIP and that the scoped connection can read both. **Same actual order ZIP path passed; audio coexistence open.** |
| 2j. Private request inspection and full-run gate | Medium / medium | JOB361's request and fixed destination were created; the earlier static request accepted a GIF/photo and one-second dummy WAV. No new-order audio file is verified. | Exercise duplicate and expired/closed-request behavior; verify a supported harmless audio file through JOB361's request. **New-order creation passed; upload open.** |
| 2n. Audio upload validation and malware handling | Medium / high | The private request accepted both a GIF/photo and small WAV in the order's Uploads folder. It bypasses the artwork image-validation endpoint; no enforced audio format/size policy, quarantine or malicious-file scan is established. | Define allowed audio formats and maximum bytes, validate the uploaded file and match it to the claimed order before staff retrieval; quarantine or reject unexpected files and agree a malware scanning workflow. Test wrong type, oversized file and duplicate upload in JOSH TEST. **Small WAV transfer passed; policy gate open.** |
| 2g. Artist field semantics need confirmation | Medium / low | The current intake maps `Artist Order = Yes` to a boolean-like value in an Airtable single-line `Artist` field, rather than an artist name. | In the isolated record, compare the intended meaning of that field with staff expectations and map it explicitly; preserve the source behavior only if it is deliberately a yes/no flag. **Open; live unchanged.** |
| 2d. Form values can disagree with the quoted price | Low after isolated fix / medium | The JOSH TEST server recalculates the displayed estimate from allowed format, quantity, colour, packaging, rush and shipping; tampered amounts fail locally. Production remains unchanged. | Exercise all pricing branches and tampered prices in the hosted test, then review live pricing parity before cutover. **Isolated code deployed; hosted parity open.** |
| 2k. Artist eligibility and expired promotion | Medium / high if invoiced | The artist unlock string is client-side and a restored test draft could revive the expired Father's Day selection. Browser artist status does not prove eligibility. | The deployed JOSH TEST patch hides/disables the expired offer, blocks restoration and rejects its marker. Keep artist and final quote under staff approval before any invoice; implement trusted eligibility or remove automatic artist pricing in production. **Promotion retested locally and deployed; eligibility open.** |
| 2l. Browser-held artwork capability | Medium / high | The legacy handoff stores a per-draft bearer-equivalent token in browser storage and sends a full reference through the form. It is not an infrastructure key and is not in the URL, but a script running on that origin could read it. | The isolated JOSH TEST code now uses an HttpOnly signed browser session and server-sealed draft token, with only an opaque job ID in the browser; local tests and JOSH TEST deploy pass, hosted authenticated retest pending. A separate production redesign is required before attaching the designer to the live form. **Test code deployed; production open.** |
| 3. Failed or uncertain jobs could be missed | Medium / high | Four older artwork jobs are failed after three attempts; JOB361's delivered ZIP still leaves Airtable `Queued`. An ambiguous Make timeout leaves test submissions `unknown` and rejects a blind repeat. The authenticated summary is read-only; no alert, recovery ownership or backup/restore schedule is established. | Assign staff ownership, alert on failed/unknown/stale processing, reconcile worker outcome into staff status, document manual recovery before any retry, back up SQLite/artwork volume and rehearse a restore plus no-double-delivery check. **Visibility/status/alert/restore gate open.** |
| 4. Printed files may differ from approved templates | Medium / high | Dropbox ZIP preview shows front/back PSDs and references with a 3000-pixel conversion manifest. Archive CRC, Photoshop edit/save/reopen and physical print approval have not been checked. | Download the delivered test ZIP, verify CRC and source assets, inspect PSD layers/masks/fonts, edit/save/reopen, print covers and labels, and obtain engineer approval. **Preview passed; production acceptance open.** |
| 5. Hosted phone experience unknown | Medium / medium | The mobile fix is deployed. Josh submitted the hosted form in his browser, but a deliberate first-time desktop/phone UX pass with refresh and error states has not been witnessed. | Have a human tester use the completed interface on desktop and phone with refresh/interruption/large image; test the audio link and both emails as part of one order. **Hosted submission passed; UX acceptance open.** |
| 6. Production infrastructure and permission boundary absent | Certain / high | Railway project has only JOSH TEST. The replacement Make Dropbox grant is app-folder scoped; separate production credentials, volume, backup, alert and ingress limiter have not been verified. | Provision distinct production service/volume and credentials, restrict access, implement ingress rate limiting, backup/restore and monitored failure queue. Verify with synthetic data before enabling customer delivery. **Open.** |
| 7. Repeat delivery and changed/missing references | Low to medium / high | Same submission cached; duplicate binding returned `already_bound`; server rejects conflicting binding and arbitrary folder; worker retries existing archive. Hosted interrupted and adversarial paths are less thoroughly exercised. | Force upload interruption, restart mid-job, duplicate webhook, expired/invalid/foreign references and mismatched order folder in the isolated copy; inspect that one verified archive results and staff can recover. **Partial; further retest required.** |
| 8. Privacy and retention | Medium / medium | Test route fixes name/recipient/root and omits live downstream systems; service has source, layer and project limits, noindex and Basic gate. Failed jobs are now retained to avoid silent loss, which also extends private data retention. | Agree deletion/acknowledgement and restricted backup policy, verify access logs/secret handling and upload validation, measure actual Railway volume headroom during PSD/ZIP rendering and restore. **Open policy/operational gate.** |
| 9. Final CI and hosted gate | Low / medium | Railway's JOSH TEST deployment and earlier GitHub review gate passed; protected hook ran one hosted form-created order and produced a ZIP. Make WARNING and staff status mismatch remain; no-artwork regression and mobile UX not yet evidenced. Cloud browser Basic authentication failed, so Josh used his own browser. | Resolve warning and status, finish independent new-email/audio and phone checks, rerun focused CI and deployment health before tester release. **Partial hosted gate; go-live blocked.** |

## Live and test configuration comparison

| Boundary | JOSH TEST | Live/current or proposed production |
| --- | --- | --- |
| Form | Basic gated isolated preview and designer | Current GitHub Pages form remains in use without this handoff |
| Make | Artwork-only 8084300 inactive. Full confidential protected intake 8715068 ran JOB361 in the controlled JOSH TEST window, 26 operations, 19.329 s, WARNING. Static probe scenarios remain separate; old broad Dropbox 13265327 unused. | Customer Intake 4762364 remains active; no integration change applied. |
| Orders and billing | JOB361 was created by the hosted form in the isolated Airtable base and appears in the published staff interface. Earlier fixtures and probe rows also exist. No invoice or payment was created. The copied invoice button is omitted from the staff interface but remains in the base editor. | Existing intake creates records/folders and emails; it has no invoice module. Invoicing is separate. |
| Dropbox | JOB361's fixed JOSH TEST Uploads folder contains a 2.06 MB exported ZIP with front/back PSDs and references. The separate earlier probe folder contains a GIF/photo and dummy WAV. The new order's audio request has no independently verified upload. | Separate production root/authorization and tested environment required. |
| Exporter | JOSH TEST Railway service/volume, one worker; actual protected bind 202, outcome callback 200, ZIP delivered to fixed folder. Airtable remains `Queued`, and final local job state has not been independently read. | No production exporter in this project yet. |
| Secrets | Test hook key exists server-side in Make and is not in blueprint/browser URL; Josh entered the protected destination privately into Railway JOSH TEST. The controlled window was closed after JOB361 ZIP verification. | New separate production credentials and staff recovery secret to provision securely. |

## Evidence required before a live approval request

| Gate | Evidence to present | Current state |
| --- | --- | --- |
| First-time form journey | Hosted desktop and phone runs with artwork and without artwork; product/price/options, upload, refresh, validation and completion screens match the submitted test order. | Josh's hosted form submission created JOB361. Local browser tests passed; deliberate phone/no-artwork and first-time tester acceptance open. |
| Isolated intake and recovery | One Airtable row per `TEST JOSH 21.11` Submission ID with mapped details, fingerprint, Make execution and stage history; repeat click/webhook and forced post-claim timeout leave one row and one set of side effects. | Actual protected intake and bind/callback produced JOB361 and a ZIP, but Make WARNING is unexplained. Full-route duplicate, forced timeout and failure recovery untested; Airtable delivery status stale. |
| Audio, artwork and email | File request records a supported audio upload in the fixed test app folder; actual exporter bind uses the claimed record and same Uploads path; remote ZIP content/Photoshop/print review; Josh's customer and staff emails observed in inbox/Sent. | JOB361's ZIP is visible with expected files and manifest. Its two email states say `Sent` but inbox arrival and new audio upload are not confirmed. Earlier separate probes arrived and transferred dummy WAV; CRC/Photoshop/print review and actual staff routing remain open. |
| Security and operations | Confirm test-only OAuth/write boundary, no default public staff link, no invoice/payment/live recipient, protected hook and server-only key, audio format/size/malware policy, failure alert/retry, volume headroom, retention and backup/restore. | Test-only connection read/fixed writes and small WAV transfer proven; old broad connection unused. Protected hook transfer was resolved through Josh's private Railway entry. Staff recovery summary authenticated and read-only; audio policy, alerting, reconciliation and restore drill remain open. |
| Release and reversal | Exact live form diff, Make blueprint and environment variable **names** (not values), deployment order, monitored smoke, saved live commit/blueprint, disabling switches and a rehearsed rollback/no-artwork regression result. | Plan below is preliminary; no live change or production activation authorized. |

## Proposed release sequence — approval boundary

1. Finish JOSH TEST checks: JOB361's hosted intake and fixed-folder ZIP are
   observed, but Make WARNING and the Airtable `Queued` status require fixes
   and retest. Confirm arrival of JOB361's two emails and upload a harmless
   supported audio file through its new private request. Establish audio
   type/size limits and staff validation/quarantine. Repeat hosted mobile and
   no-artwork journeys in a controlled window, verify ZIP CRC, Photoshop and
   print acceptance, and force a failed delivery to test staff visibility,
   recovery and no double delivery.
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
   Review the **100-module** intake 8715068 and resolve JOB361's WARNING in a
   controlled retest. Verify
   preflight/fingerprint, early 202 acknowledgement,
   final callback and manual-stop error handling; establish an **open** request
   actually accepts a harmless audio upload into JOB361's
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
