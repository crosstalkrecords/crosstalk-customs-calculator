# Crosstalk Customs artwork handoff — prelaunch review

## 26 November designer feedback follow-up — isolated JOSH TEST

The review branch removes the extra artwork checkbox. A standalone **Open
Packaging Designer** button sits after the Packaging choices (or the fixed
printed-promo summary) and before the Handmade packaging / Artwork files
notes. It remains visible with Standard packaging. Clicking it on Standard
explains which printed option is required, focuses that choice and does not
change the selection or price. Printed orders can still be submitted without
designer artwork for the separate private upload route. The button explains
that customers may upload their own images or create a design, and the JOSH
TEST form's session draft restores choices and tracklist for up to 24 hours.
Desktop Layers is now a full-width button at the top of the right Edit panel;
the narrow layout retains a visible Layers button in the top bar and canvas
controls.

The inactive protected Make intake 8715068 now maps the Airtable Job Number
into both customer and staff email subjects. Its staff HTML message addresses
only `custom@crosstalkrecords.com` and labels the private, signed-in Dropbox
folder-navigation link with the Job Number; the recipient must sign in to an
account with access. The staff archive output code already names the ZIP,
root folder, PSDs and reference PNGs using the protected Job Number. A local
synthetic ZIP test verifies those entries, but JOB365's remote ZIP contents
still require an independent download and CRC/PSD inspection.

The JOB365 test record was `Queued` despite a ZIP visible in its isolated
Dropbox folder. A separate inactive batch sweep, Make scenario **8816289**,
searches up to 100 completed JOSH TEST orders still queued for artwork. It
requests the authenticated exporter status, checks submission, record and
artwork IDs against a fresh Airtable read, and updates only a verified terminal
delivery or failure. Ambiguous, mismatched or non-200 responses write a
sanitized `Reconciliation blocked:` note and send one test-only staff review
alert; flagged rows leave the sweep until a human clears the note. A controlled
run `c42657669e53402e9f69d70cd1c38f66` on 26 November completed SUCCESS
with five operations and changed only JOB365's Artwork Delivery Status to
`Delivered`. The sweep was deactivated afterward. Its failure/alert routes,
network-timeout behaviour, second-pass no-op, and scheduling while a tester is
active still need hosted proof; do not represent this as production-grade
automatic reconciliation.

Local gate after the feedback change: build passed, 30 service tests passed,
two synthetic PSD acceptance orders passed (including flipped photo and text
fallback pixels), and desktop/mobile form handoff plus Standard/no-artwork
regression passed. Hosted deploy, inbox rendering at the staff address,
JOB-numbered file inspection and the next controlled full order are pending.
The live form, live Make intake and production delivery have not changed.

## 26 November tester feedback revision (JOSH TEST only)

An earlier JOSH TEST revision put the editor button near the top of Extras
behind an artwork checkbox and blocked Continue after opting in without a
finished design. The designer's later feedback prompted the revision above;
the checkbox and its Continue gate have been removed. The
separate standard/no-artwork order route remains available. The
customer-facing
layered-PNG/staff-export download is removed; staff PSD/PNG generation remains
server-side. The editor has Layers in the top bar at desktop and phone widths,
with Duplicate, Flip horizontally and Flip vertically. Rectangle corners are
square and shapes can shrink below the former 8%-of-canvas limit. Flipped text
uses an explicitly named visual raster fallback in the PSD so it does not
silently appear as editable native text. A future dedicated custom label
designer can use the current separate label A/B surfaces and order handoff;
this change does not claim that product has been designed or approved.

The protected JOSH TEST bind optionally accepts Airtable's formula Job Number
and the inactive Make intake 8715068 now maps that field from its isolated
record. The staff archive uses `JOSH TEST-JOB###.zip` and contains a matching
top-level folder; PSDs, reference PNGs and conversion metadata also carry the
JOB number. Old bindings fall back to the unique Airtable record ID. This
mapping has not yet been exercised by a new hosted submission.
The inactive JOSH TEST staff notice template has a Dropbox folder-navigation
link for the isolated order, but its inbox rendering and staff access have not
yet been retested with this revision. It is not a public shared-folder URL.

Local evidence: `node build-public.cjs`, 30 service tests, the separate desktop
and mobile form handoff/regression script and two full synthetic PSD acceptance
orders passed. The focused test checks a 360 px mobile top bar, small square
rectangle, duplication, both flips and absence of the customer ZIP control.
The PSD acceptance additionally reads actual flipped photo-layer pixels,
verifies the mirrored text fallback and parses front/label PSDs. A synthetic
archive test inspects the ZIP directory and confirms the named folder and files.
These tests do not establish the hosted email/Make/Dropbox outcome for this
revision. The exact JOB364 (`recbBm6OayPlgH5sB`) proof-pinned status check ran
once on 26 November: Make execution `8b6ce79884b3495f972e17c9e9aaa5f6`
finished SUCCESS in 2.747 seconds with five operations, and Airtable changed
from `Queued` to `Delivered` while Intake State remained `Completed`. The
one-time scenario became inactive and was reset to on-demand. This confirms
one prior verified Dropbox delivery, not the new JOB-number archive mapping;
automated status/alert ownership remains open. Railway JOSH TEST deployment
`677fc102-758a-44f4-9dde-df2e12d14064` is SUCCESS on review commit
`5fe2c380d9aad8d0565062c987508ba432337032`; hosted `/health` reports
`deliveryMode=disabled` and `configured=false`. The Basic-gated
preview rejects an unauthenticated request with 401. Keep delivery disabled
and Make inactive outside controlled tests. Do not change the live form or
production delivery on this evidence alone.

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
with **WARNING**, not clean success. The connected execution-detail API did not
show the cause, but Make's UI history identified six Webhook Response modules
(40, 42, 44, 100, 9 and 4) warning that a response cannot be processed when
the scenario is not executed immediately on data arrival. The scenario is
configured immediate but sequential; that queue behavior is the likely cause,
not a proven harmless warning. Early structured claim acknowledgement was not
independently verified by JOB361 because the final callback can race it.
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
not counted as a customer upload. Airtable initially remained `Queued` after
the ZIP arrived. A guarded, read-only exporter status endpoint at review commit
`be0e4d5` and inactive JOSH TEST Make scenario 8719305 then reconciled the
claimed submission, fingerprint, artwork job and Airtable ID. Its second
JOB361-only Run once (`78915cff5df74641933c07d17f225f35`) succeeded in
five operations; Airtable now shows `Delivered` and `Intake State=Completed`.
The first diagnostic run found a Make HTTP output mapping error (`body` versus
`data`), wrote only a temporary manual-review note and did not change delivery
status. The mapping was corrected and the note cleared. Scenario 8719305 is
inactive; a generic schedule, failure alerts and mismatch recovery have not
been rehearsed. The customer/staff status and refresh fix passed 9 focused
tests; the guarded endpoint passed 5. The deployed service's `/health` reported
delivery disabled after that window.

**25 November actual hosted retest:** Josh completed a new full JOSH TEST form
journey and reported uploading a dummy WAV through the private request. Railway
HTTP logs show the designer draft 201, asset upload 200, commit 200, order
submission 202, protected bind 202 and final outcome callback 200. The revised
protected Make intake 8715068 executed once (`333c664e31364e4080bb6da501f1ad90`)
at 04:41 UTC in 20.244 s and finished **SUCCESS**, 25 operations, with no
Webhook Response warning or waiting hook items. It created exactly one new
isolated Airtable row, **JOB362** (`rect55xA4VsTPSJZo`), Submission ID
`6555aa56-5013-496c-acf2-1c3ebbf84271`: one double-sided 12-inch red
33 RPM Custom Finish Pack for pickup, estimated $180. Intake State is
`Completed`, both email status fields say `Sent`, and the published staff page
shows the same order. The guarded, JOB362-pinned status reconciliation scenario
8719305 ran once (`b76b20f3c85f4b3991d09018941d2ec1`), succeeded in five
operations, and updated Airtable and the staff page to `Delivered` only after
the exporter returned a verified matching delivery receipt. That scenario is
again inactive and on demand. Josh's exact JOSH TEST Uploads-folder screenshot
shows a 60.59 MB dummy WAV uploaded at 15:42 Sydney beside the exported ZIP.
The folder identifier matches JOB362's Airtable Submission ID; the ZIP filename
suffix matches its Artwork Job ID. The attached 13,211,225-byte archive has
22 entries, passes CRC and has no unsafe paths. It contains front/back and
label A/B PSDs with reference PNGs, conversion manifest, recovery files,
fonts and README. The manifest reports 3000 × 3000 covers and 1146 × 1146
labels with no fallbacks. All four PSDs fully parse with pixel layers; covers
are RGB8 3000 × 3000 and labels RGB8/transparency 1146 × 1146. Layers and
masks agree with the manifest. The cover composites match the PNG references
pixel for pixel; the label references differ by 0.17% of pixels with matching
alpha, consistent with minor antialiasing or rounding. Reference images are
nonblank with no obvious clipping. Label A and B files are byte-identical;
whether that was intended needs visual approval. ZIP text
entries show no credential-key, Make hook, artwork capability, outside-test
path or test email/phone patterns in the performed scan. The screenshot establishes
the WAV's presence and displayed size, not its audio validity, malware status
or compliance with a production upload policy. Photoshop edit/save/reopen
and physical print approval remain open. Make's
confidential execution exposes no per-module
detail through the connector. Josh independently confirmed both this order's
customer receipt and separate JOSH TEST staff notice reached the fixed Gmail
inbox. Automatic approval review had rejected broad Dropbox Apps-folder
browsing, so no alternate broad-account path was used; Josh supplied the
exact order-folder screenshot and ZIP for targeted verification. The
protected intake was deactivated, the one-time reconciliation reset to inactive
on-demand mode, and Railway delivery was switched back to `disabled`. The
resulting deployment `3d7fef2a-4f08-423b-bb6c-d860bb1760c3` succeeded and
hosted `/health` returned `deliveryMode=disabled`, `configured=false`.

A review-branch-only exporter change at `424e6f7` now also accepts Make's
default exact `200 Accepted` queue acknowledgement without treating it as an
Airtable claim. Seven focused tests cover callback races, duplicate submissions,
timeouts and rejected/nonexact responses. Josh explicitly approved the exact
isolated Make edit after automatic approval review initially rejected it over
changed response/error behavior. Scenario 8715068 now has exactly those six
Webhook Response modules removed; independent readback confirms it remains
inactive, valid, immediate, sequential and confidential, with 94 modules and
zero responders. Commit error handlers 41/43/45, the protected hook and the
other claim, delivery, email and callback paths are preserved. The new queue
acknowledgement path passed JOB362's normal real intake retest; ambiguous
timeout, replay and partial-failure routes still need integrated tests. The
[redacted change plan](MAKE_QUEUE_ACK_CANDIDATE.md) records the edit and rollback.

Earlier separate probes confirmed Josh-only receipt and staff-style email
arrival and a private-request GIF/photo plus harmless one-second 15.67 KB
dummy WAV at a different test order folder. JOB362's separate inbox arrival
and WAV location now have their own evidence.
The cloud browser could not pass the preview Basic
gate, so hosted UX observation remains a human test. The controlled JOSH TEST
window is now closed: Make 8715068 is inactive, Railway delivery mode was set
to `disabled`, its redeployment succeeded, and hosted health is unconfigured.
No live form or production-delivery
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
  8715068 and ran only in a controlled JOSH TEST window. The separate
  one-record status reconciliation scenario 8719305 is also inactive. Keep
  the full intake and delivery mode off outside controlled tests; Dropbox setup
  stays disabled. The actual order destination is fixed beneath
  `/Crosstalk Customs/JOSH TEST/` in the scoped app folder.
- Railway reports a successful **JOSH TEST only** deployment of review commit
  `5fe2c380` on 26 November 2026. Hosted `/health` returned
  `deliveryMode=disabled` and `configured=false` before the controlled run;
  unauthenticated normal and percent-encoded preview paths, designer and
  test-config returned 401 in checks across the review. A distinct
  `ARTWORK_STAFF_SECRET` was provisioned on the sole JOSH TEST service after
  code deployment; its resulting redeployment succeeded. The authenticated,
  read-only staff recovery summary returned HTTP 200, while unauthenticated
  access returned 401. The test form's server-only Make key guard is deployed,
  and the protected hook destination is now configured. In a controlled window
  Make 8715068 and Dropbox delivery were reactivated for the hosted submission
  above, then disabled after the ZIP was verified. That execution produced a
  form-created order and ZIP but has a Webhook Response warning and incomplete
  email/audio evidence. The separate status reconciliation succeeded. Hosted
  mobile, recovery-action and no-artwork checks remain open.

## Intended journey and what has been exercised

| Stage | Intended customer/staff outcome | Evidence and current gap |
| --- | --- | --- |
| Open and configure | Customer chooses product, format, packaging, audio and other options; sees a comprehensible price. | Josh completed hosted 7-inch and 12-inch test orders; JOB362's red Custom Finish Pack and $180 estimate match the test ledger. Local desktop/mobile browser tests cover the guarded path; first-time tester acceptance and hosted mobile remain open. |
| Design and upload | Customer uses front/back and label surfaces, adds source images, completes the designer, and sees an attached artwork reference on order review. | JOB362's hosted draft, asset and commit calls succeeded, then the protected bind returned 202. Its attached ZIP contains front/back and label A/B PSDs and PNGs, recovery, fonts and manifest. CRC, safe paths and full PSD parse pass; covers match references pixel for pixel, labels have minor 0.17% pixel differences with identical alpha. Photoshop/print approval remains open. Local tests cover upload, retry, refresh/session isolation and mobile width. |
| Submit | Test submission reaches only the isolated endpoint and protected Make intake; customer sees an accurate order state. | JOB362's `/v1/test-orders` returned 202, the final outcome callback returned 200, and the revised protected Make execution finished SUCCESS without warning. Airtable created one matching JOB362 row. The queue response alone is not delivery evidence; guarded terminal reconciliation confirmed delivery separately. |
| Confirmation email | Josh receives a clearly labelled test receipt acknowledgement. | JOB362's Airtable customer and staff email states are both `Sent`, and Josh confirmed both the new receipt and separate staff notice reached the fixed Gmail inbox. Ambiguous-send recovery remains untested. |
| Bind, render and deliver | Trusted processing binds the reference to the actual order's Uploads folder, renders the PSDs/ZIP and verifies the Dropbox upload. | JOB362's protected bind returned 202 and the guarded exporter query matched order/record/artwork/fingerprint with a verified terminal receipt; Airtable and staff page read `Delivered`. The exact-folder screenshot matches the submission and artwork identifiers. Its attached 13,211,225-byte ZIP has 22 safe entries, passes CRC and full PSD parse; manifest dimensions are 3000 × 3000 covers and 1146 × 1146 labels, with no fallbacks. Photoshop round-trip and print approval remain open. |
| Audio upload | Customer follows a private request and uploads audio to the isolated order folder. | Josh's exact JOB362 folder screenshot shows a 60.59 MB WAV in the same isolated Uploads folder as the ZIP, uploaded at 15:42 Sydney. This proves location and displayed size, not WAV validity, malware safety or an enforced audio policy. |
| Staff handling | Staff see an order, audio/assets, delivery or failure status and an actionable recovery path. | JOB362 appears in the published JOSH TEST Staff Review with mapped order details and `Delivered` after a guarded one-time reconciliation. An authenticated read-only recovery summary exists; automatic scheduling, failure alert/recovery ownership and real staff routing remain open. |

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
deployed to JOSH TEST; JOB362's hosted authenticated form submission passed. Playlist
import still needs its own prelaunch regression check in an
appropriately isolated environment. The isolated intake mapping also identified
Packaging, Vinyl Colour, Side A Length and Side B Length as absent from the
current Airtable intake map. Four matching fields now exist in the JOSH TEST
base, and the proposed create-record mapping validates with no Make configuration
errors or warnings. JOB361 subsequently verified persistence; its historic
execution warning was absent from JOB362's revised-route execution.

The deployed review code also fixes a missing `Origin` on a same-origin mobile
draft request, prevents playlist error markup from executing, gates the private
Dropbox probe on setup mode, retains failed jobs for staff recovery, stores
verified delivery metadata without provider paths, and exposes a separate
authenticated paginated failure list. New uploads check remaining disk space;
staff and binding secrets must differ; migrated delivered records receive a
completion-based retention window. Those code changes are deployed. Hosted
staff summary authorization was checked after the separate secret was
provisioned. JOB361's delivered status reconciled on demand; staff failure
alerting, scheduled reconciliation and backup/restore remain open.

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
That earlier deployed SHA `43be85b` still required a hosted authenticated form smoke test.
The test-intake allowlist, fictional shipping, changed-details replay and
server-only Make key guard are deployed to JOSH TEST. The staff visibility
and expired-promotion patch passed local tests and deployed; staff recovery
summary authorization now passes hosted checks. No pull-request
GitHub Actions run was returned for `2bcd592`; the current `43be85b` review
gate passed build, service/UI/acceptance and dependency audit. A
second synthetic acceptance run passed for two local archives; remote ZIP
contents remained unverified. On 23 November, the clean review branch passed
28/28 service tests, a separate desktop/mobile browser gate including upload
and submit retries and a no-artwork payload, and two local acceptance exports.
Both generated ZIPs passed CRC and their isolated delivered copies matched
byte for byte; `npm audit --omit=dev --audit-level=high` found zero
vulnerabilities. The preview build left the branch clean. Unauthenticated
hosted preview/designer and encoded preview returned 401. JOB362 then supplied
the hosted authenticated form smoke and clean revised Make intake. Its attached
remote ZIP passed CRC, safe-path and full PSD parse checks; ZIP text entries
showed none of the scanned secret or outside-test patterns. Integrated
adverse-path tests, Photoshop round-trip and print approval remain open.

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
module was added. The approved JOSH TEST revision then removed its six
Webhook Response modules, leaving 94 modules without changing the protected
hook or processing routes. It ran JOB362 successfully in this form and is
inactive again.
A separate inactive on-demand synthetic runner
`8715455` retains the earlier guarded route with a fixed `TEST JOSH 21.11` payload
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
The protected intake `8715068` has Make's confidential-data
setting enabled to reduce stored execution payloads; structural readback
confirmed it was valid, sequential, with incomplete execution storage off and
no Break handlers before the controlled run. The
deployed isolated server accepts only an opaque artwork job ID through Make
and resolves the sealed draft capability inside the exporter. The full
Make route executed with one form-created order under its earlier responder
configuration. Terminal delivery status was separately reconciled. The
revised no-responder route has not yet executed a form-created order.

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
The actual protected Make route took 19.329 seconds for JOB361; timeout,
partial-failure and replay behavior under adverse latency remain untested.

| Priority / risk | Likelihood / impact | Evidence | Concrete resolution and retest status |
| --- | --- | --- | --- |
| 1. Production path is incomplete | Certain / high | JOB362 exercised hosted designer upload, full protected intake, one Airtable order, bind, callback and verified exporter delivery; the revised Make run finished SUCCESS and Josh confirmed both test emails. Exact-folder screenshot shows its ZIP and 60.59 MB WAV together; attached ZIP passes CRC and PSD parse. WAV validity, Photoshop/print, no-artwork full route and failure recovery remain open. Live form and Customer Intake are unchanged. | Validate audio format/safety, obtain Photoshop and print approval, then finish no-artwork/mobile and adverse-path recovery. **Normal isolated journey substantially passed; production blocked.** |
| 1a. Delivery status can become stale | Medium / high | Both JOB361 and JOB362 initially stayed `Queued` after intake because the worker is asynchronous. Guarded one-record exporter status checks matched each order and updated Airtable to `Delivered`; JOB362's check succeeded in five operations. The proof-pinned scenario cannot simply be scheduled for a batch: one HTTP 409/timeout currently stops it before later rows. | Clone an inactive JOSH TEST candidate with a bounded test-only search, preserve exact identity rechecks, isolate each row's HTTP error, and alert once on failed/unknown/stale work using the authenticated recovery summary. Prove a valid row reconciles once, a second pass is a no-op and an invalid row cannot starve the next. Add backup/restore drill. **Resolved manually for both test orders; automation and alerting open.** |
| 1b. Make response warning and claim ambiguity | Medium / high | JOB361's earlier sequential route had six Webhook Response warnings. In the revised 94-module route, JOB362's protected execution completed SUCCESS in 20.244 s, with no warning, one Airtable row, bind and callback. | Exporter accepts exact Make default 200 `Accepted` without treating it as an Airtable claim; seven focused tests passed. Josh approved removal of the six responders. Normal full-route runtime now passes; force timeout, duplicate and post-claim failure to validate ambiguity handling. **Normal-route warning resolved in JOSH TEST; adverse paths open.** |
| 2. Duplicate intake may create a second real order | Medium / high | The current live Make intake creates Airtable records without a prior dedup. Separate test claim probe reused one row with the same ID across two runs. JOB361's normal full intake ran once; replay and timeout routes have not run. | Guard on Submission ID and Request Fingerprint, verify state and reconcile side effects. Force ambiguous timeout after claim and duplicate webhook; confirm one row, one request, one email pair. **Claim reuse resolved in probe; full-route recovery open; live untouched.** |
| 2m. Intake timeout and ambiguous dispatch | Medium / high | JOB362's normal revised route took 20.244 s. A timeout after side effects may still be ambiguous. JOSH TEST durably queues before dispatch, accepts only exact Make 200 `Accepted` as an unclaimed queue acknowledgement and pins Airtable ID only on authenticated callback. Uncertain outcomes become `unknown` without blind retry. | Force timeout/crash/duplicate after claim; reconcile the Airtable row and side effects before retry. **Normal runtime and local tests pass; adverse-path integration open.** |
| 2e. Ambiguous email delivery on retry | Medium / medium | A provider send can succeed before Make saves a sent flag or responds. The Customs Microsoft sender grants `Mail.Send` but not `Mail.Read`; the connected Outlook account is a different Releases mailbox. JOB362's separate email states say `Sent`, and Josh confirmed both messages arrived. | Stop automatic retries at ambiguous sends; reconcile provider and inbox evidence before deliberate recovery. Force failures around sends and verify real staff routing separately. **Normal pair passed; retry ambiguity open.** |
| 2a. Copied invoice action in the test base | Low for form-only tester, high impact if clicked | A seeded test record computed a `Send Invoice` button pointing at an external invoice webhook. | Button was **not clicked**; field renamed with a warning and omitted from published staff interface. Remove the column in Airtable's base editor before broader direct table access. **Contained for form/staff-interface testing; deletion open.** |
| 2b. Customer audio link overwritten in current intake | Medium / high | Live Make module 30 writes the file-request URL to `Internal Folder Link`; module 5 overwrites it with a share URL and module 29 emails that share URL. | The isolated copy stores JOB362's file-request URL in `Audio Upload`, with a private path for staff. Exact-folder screenshot shows the submitted WAV beside the ZIP. **Isolated mapping and location passed; live change open.** |
| 2c. Secret-bearing Make blueprint and broad Dropbox connection | Medium / high | Live module 38 contains OAuth material; broad 13265327 remains unused. App-folder 13265654 read the exporter ZIP, created fixed folders and reopened the existing request through OAuth-backed API calls. No raw OAuth values or old broad connection are in inactive 8715068. The private request delivered a GIF/photo and small dummy WAV to the fixed folder. | Keep OAuth material out of the blueprint; test error recovery and enforce audio policy before production. **Scoped read/write/open, generic and WAV transfer passed; handling policy open.** |
| 2i. Staff folder may become public | Medium / high | Dropbox `create_shared_link_with_settings` defaults to public visibility if no settings are supplied; the proposed module 16 did not set an explicit audience. | Do not create a default share link in JOSH TEST. Only store a verified team-only URL for staff; if that is unavailable, leave the Airtable URL blank and keep the private path in the test Airtable ledger for authorized staff. Test access as an unauthorised viewer before considering production. **Default link removed from test plan; sharing retest open.** |
| 2h. Test preview reaches shared playlist lookup | Medium / medium | The copied calculator includes four calls to the separate production playlist importer. | A preview-only rewrite disables those network calls and presents manual synthetic track entry. Local focused tests pass and the change is deployed; hosted authenticated check remains. Test playlist import separately before go-live. **Code deployed; hosted retest open.** |
| 2f. Different Dropbox app folders cannot share an order path | Low after actual order / high | JOB362's guarded exporter receipt matched its claimed isolated path. Exact-folder screenshot shows ZIP and the 60.59 MB WAV together under the Airtable Submission ID folder; ZIP suffix matches the Airtable Artwork Job ID. | Preserve fixed path mapping and repeat with failure/duplicate cases. **Audio/ZIP co-location passed for JOB362.** |
| 2j. Private request inspection and full-run gate | Medium / medium | JOB362's private request and destination were created; exact-folder screenshot confirms the uploaded WAV beside the ZIP. Airtable's aggregate field is empty because the file request does not populate that field. Broad Dropbox Apps-folder inspection was blocked by automatic review; owner-supplied evidence was used instead. | Exercise duplicate and expired/closed-request behavior; do not grant broad account access for routine review. **Normal request and folder presence passed; adverse paths open.** |
| 2n. Audio upload validation and malware handling | Medium / high | JOB362's exact-folder screenshot shows a 60.59 MB WAV, but that view cannot validate its contents. A separate prior request accepted both a GIF/photo and small WAV. [Dropbox File Requests](https://docs.dropboxapi.com/dropbox-api/api-reference/user-endpoints/file-requests/create) expose no custom per-request type or byte limit; the isolated grants have metadata access but not `files.content.read`. File requests bypass the artwork image validator. | Keep incoming files private and explicitly `Unverified` for staff. Use bounded exact-folder metadata checks for count, extension, size and duplicate ID/hash. Securely reauthorize only the app-folder `files.content.read` scope before byte validation; check magic, decoder/duration/channels, size and malware status in a bounded sandbox, then mark approved or rejected. Close requests after acceptance/expiry. Test wrong type, oversized, malformed and duplicate files. **Normal transfer/location passed; validity and policy gate open.** |
| 2g. Artist field semantics need confirmation | Medium / low | The current intake maps `Artist Order = Yes` to a boolean-like value in an Airtable single-line `Artist` field, rather than an artist name. | In the isolated record, compare the intended meaning of that field with staff expectations and map it explicitly; preserve the source behavior only if it is deliberately a yes/no flag. **Open; live unchanged.** |
| 2d. Form values can disagree with the quoted price | Low after isolated fix / medium | The JOSH TEST server recalculates the displayed estimate from allowed format, quantity, colour, packaging, rush and shipping; tampered amounts fail locally. Production remains unchanged. | Exercise all pricing branches and tampered prices in the hosted test, then review live pricing parity before cutover. **Isolated code deployed; hosted parity open.** |
| 2k. Artist eligibility and expired promotion | Medium / high if invoiced | The artist unlock string is client-side and a restored test draft could revive the expired Father's Day selection. Browser artist status does not prove eligibility. | The deployed JOSH TEST patch hides/disables the expired offer, blocks restoration and rejects its marker. Keep artist and final quote under staff approval before any invoice; implement trusted eligibility or remove automatic artist pricing in production. **Promotion retested locally and deployed; eligibility open.** |
| 2l. Browser-held artwork capability | Medium / high | The legacy handoff stores a per-draft bearer-equivalent token in browser storage and sends a full reference through the form. It is not an infrastructure key and is not in the URL, but a script running on that origin could read it. | JOSH TEST uses an HttpOnly signed browser session and server-sealed draft token, with only an opaque job ID in the browser; local tests and JOB362's hosted upload/bind passed. A separate production redesign is required before attaching the designer to the live form. **Test path passed; production open.** |
| 3. Failed or uncertain jobs could be missed | Medium / high | Four older artwork jobs are failed after three attempts. JOB361 and JOB362 terminal deliveries reconciled only by proof-pinned, on-demand runs; an ambiguous Make timeout leaves submissions `unknown` and rejects a blind repeat. The authenticated summary is read-only; no alert, recovery ownership or backup/restore schedule exists. | Assign staff ownership, schedule idempotent reconciliation, alert on failed/unknown/stale processing, document manual recovery before retry, back up SQLite/artwork volume and rehearse a restore plus no-double-delivery check. **Two normal deliveries passed; failure/alert/restore gate open.** |
| 4. Printed files may differ from approved templates | Medium / high | JOB362's attached 13,211,225-byte ZIP has 22 safe entries and passes CRC. All four PSDs parse fully; layers/masks agree with the manifest. Front/back composites match PNG references pixel for pixel; labels differ by 0.17% pixels with identical alpha. Label A/B are byte-identical in this test. Photoshop edit/save/reopen and physical print approval are untested. | Inspect the PSDs in Photoshop, edit/save/reopen, print covers/labels and obtain engineer approval of this test design and minor label reference difference. **Archive and PSD structure passed; visual/print acceptance open.** |
| 5. Hosted phone experience unknown | Medium / medium | The mobile fix is deployed. Josh submitted the hosted form in his browser, but a deliberate first-time desktop/phone UX pass with refresh and error states has not been witnessed. | Have a human tester use the completed interface on desktop and phone with refresh/interruption/large image; test the audio link and both emails as part of one order. **Hosted submission passed; UX acceptance open.** |
| 6. Production infrastructure and permission boundary absent | Certain / high | Railway project has only JOSH TEST. The replacement Make Dropbox grant is app-folder scoped; separate production credentials, volume, backup, alert and ingress limiter have not been verified. | Provision distinct production service/volume and credentials, restrict access, implement ingress rate limiting, backup/restore and monitored failure queue. Verify with synthetic data before enabling customer delivery. **Open.** |
| 7. Repeat delivery and changed/missing references | Low to medium / high | Same submission cached; duplicate binding returned `already_bound`; server rejects conflicting binding and arbitrary folder; worker retries existing archive. Hosted interrupted and adversarial paths are less thoroughly exercised. | Force upload interruption, restart mid-job, duplicate webhook, expired/invalid/foreign references and mismatched order folder in the isolated copy; inspect that one verified archive results and staff can recover. **Partial; further retest required.** |
| 8. Privacy and retention | Medium / medium | Test route fixes name/recipient/root and omits live downstream systems; service has source, layer and project limits, noindex and Basic gate. Failed jobs are retained to avoid silent loss. JOB362's original JPEG is preserved unchanged in the private ZIP `Recovery/assets` with 10 EXIF tags (camera/date, no GPS); the rendered PNGs and PSDs carry no detected EXIF. Other customer images might include location metadata. | Keep recovery ZIPs staff-only with no public share and set deletion/backup retention. Disclose preserved source metadata; if stripping it, preserve orientation/colour and update asset hashes/recovery references, then retest GPS-bearing JPEG and reopen. Measure volume headroom and restore. **Open policy/operational gate; rendered-output EXIF absent in JOB362.** |
| 9. Final CI and hosted gate | Low / medium | The 23 November unattended gate passed 28 service tests, desktop/mobile browser script, two local ZIP checks and dependency audit. JOB362's revised intake completed cleanly, guarded delivery reconciled, both messages arrived, exact-folder WAV/ZIP presence is shown and attached ZIP/PSD structure passes. WAV validity, full-route no-artwork, mobile human UX and adverse recovery remain open. | Finish audio validity/policy, phone/no-artwork and failure/replay recovery; obtain Photoshop/print approval and rerun focused CI/health before tester release. **Normal hosted path passed; go-live blocked.** |

## Live and test configuration comparison

| Boundary | JOSH TEST | Live/current or proposed production |
| --- | --- | --- |
| Form | Basic gated isolated preview and designer | Current GitHub Pages form remains in use without this handoff |
| Make | Artwork-only 8084300 and full protected intake 8715068 are inactive. JOB361 used the old 100-module route and ended WARNING. JOB362 used the approved 94-module no-responder revision: SUCCESS, 25 operations, 20.244 s. Inactive on-demand reconciliation 8719305 updated only the pinned JOB362 row to `Delivered` in five operations, then reset to on-demand; the same guarded mechanism previously reconciled JOB361. Old broad Dropbox 13265327 unused. | Customer Intake 4762364 remains active; no integration change applied. |
| Orders and billing | JOB361 and JOB362 came through the hosted form into the isolated Airtable base and appear in the published staff page. JOB362 is one 12-inch red 33 RPM Custom Finish Pack, $180 pickup. No invoice or payment was created. The copied invoice button is omitted from the staff page but remains in the base editor. | Existing intake creates records/folders and emails; it has no invoice module. Invoicing is separate. |
| Dropbox | JOB361's fixed JOSH TEST Uploads folder contains a 2.06 MB exported ZIP with previewed PSDs and references. JOB362's guarded verified receipt and exact-folder screenshot show its 12.6 MiB ZIP and 60.59 MB WAV together under the matching Submission ID; ZIP suffix matches the Artwork Job ID. The attached 13,211,225-byte ZIP has 22 safe entries, passes CRC and all four PSDs parse. WAV validity is untested. | Separate production root/authorization and tested environment required. |
| Exporter | JOSH TEST Railway service/volume, one worker; JOB362 protected bind 202, outcome callback 200 and verified terminal receipt through the guarded status endpoint. Airtable now reads `Delivered`. The disabled redeployment succeeded and hosted `/health` returned `deliveryMode=disabled`, `configured=false`. | No production exporter in this project yet. |
| Secrets | Test hook key exists server-side in Make and is not in blueprint/browser URL; Josh entered the protected destination privately into Railway JOSH TEST. The controlled window was closed after JOB362's verified delivery state. | New separate production credentials and staff recovery secret to provision securely. |

## Evidence required before a live approval request

| Gate | Evidence to present | Current state |
| --- | --- | --- |
| First-time form journey | Hosted desktop and phone runs with artwork and without artwork; product/price/options, upload, refresh, validation and completion screens match the submitted test order. | Josh's hosted form submissions created JOB361 and JOB362. Local desktop/mobile browser tests passed; deliberate hosted phone/no-artwork and first-time tester acceptance open. |
| Isolated intake and recovery | One Airtable row per `TEST JOSH 21.11` Submission ID with mapped details, fingerprint, Make execution and stage history; repeat click/webhook and forced post-claim timeout leave one row and one set of side effects. | Revised protected intake and bind/callback produced exactly one JOB362 record and a clean execution. Guarded one-record status reconciliation set Airtable to `Delivered`. Full-route duplicate, forced timeout, failed-delivery status and recovery remain untested. |
| Audio, artwork and email | File request records a supported audio upload in the fixed test app folder; actual exporter bind uses the claimed record and same Uploads path; remote ZIP content/Photoshop/print review; Josh's customer and staff emails observed in inbox/Sent. | JOB362's exact-folder screenshot shows ZIP and 60.59 MB WAV together; attached ZIP passes CRC, safe paths and full PSD parse with matching cover references. Both emails arrived. WAV audio validity, Photoshop/print review and actual staff routing remain open. |
| Security and operations | Confirm test-only OAuth/write boundary, no default public staff link, no invoice/payment/live recipient, protected hook and server-only key, audio format/size/malware policy, failure alert/retry, volume headroom, retention and backup/restore. | Test-only connection read/fixed writes and a separate earlier small WAV transfer were proven; old broad connection unused. Protected hook transfer was resolved through Josh's private Railway entry. Two one-record terminal reconciliations passed; automatic schedule, failed-job alerting, audio policy and restore drill remain open. |
| Release and reversal | Exact live form diff, Make blueprint and environment variable **names** (not values), deployment order, monitored smoke, saved live commit/blueprint, disabling switches and a rehearsed rollback/no-artwork regression result. | Plan below is preliminary; no live change or production activation authorized. |

## Proposed release sequence — approval boundary

1. Finish JOSH TEST checks: JOB361's earlier ZIP was previewed, JOB362's
   revised protected Make intake finished SUCCESS without warning, and guarded
   status reconciliation marked both test orders `Delivered`. Josh confirmed
   both test emails arrived. His exact-folder screenshot shows the 60.59 MB WAV
   beside the ZIP; the attached ZIP passed CRC, safe paths and PSD parse.
   Validate the WAV's audio contents and establish audio type/size limits and
   staff validation/quarantine. Repeat hosted mobile and
   no-artwork journeys in a controlled window, obtain Photoshop and
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
   Review the revised **94-module** intake 8715068 and retain JOB362's clean
   normal-route evidence. Verify preflight/fingerprint, exact default 200
   `Accepted` queue acknowledgement without an Airtable claim, final callback
   and manual-stop error handling under forced duplicate/timeout conditions;
   validate the JOB362 WAV's contents and production audio policy. Persist the
   verified customer URL in Audio
   Upload, keep Internal Folder Link empty unless a team-only URL is proven,
   and use the private path for authorized staff. Check the saved optional
   artwork bind uses the claimed Airtable ID and Uploads path, and the fixed
   Josh-only email branches use separate uncertain/sent states. Test normal,
   no-artwork, duplicate, timeout, partial-failure and staff recovery routes.
   Confirm the default queue acknowledgement is timely and never mistaken for
   an Airtable claim; the deployed durable queue, polling, timeout-to-unknown
   and authenticated callback must behave correctly under latency.
   Do not copy live raw OAuth values or add invoice/payment modules.
4. Prepare a separate production Make scenario: replace unconditional Airtable
   create/get modules 2/28 with a guarded claim; replace folders 12/27 with
   fixed, no-autorename paths; replace raw OAuth HTTP modules 38/36 with a
   scoped Dropbox connection; store the verified request in `Audio Upload`
   rather than a shared-folder URL. Bind artwork to the actual Airtable ID and
   Uploads path, with separate uncertain/sent states around customer/staff
   email modules 29/41. Add a separate production terminal-status
   reconciliation route with record/job/fingerprint matching, a bounded
   schedule, failure alerts and a manual-review stop; do not reuse the
   proof-pinned JOSH TEST scenario 8719305. Present the exact form diff, Make blueprint diff,
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
