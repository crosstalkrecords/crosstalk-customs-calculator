# Crosstalk Customs artwork handoff — prelaunch review

Status: **isolated tester interface available, complete journey blocked, production release blocked**. This is the
Customs project only. The live order form and Customer Intake scenario have not
been changed. Review branch: `artwork-form-handoff-review-20261119`; draft PR
[#24](https://github.com/crosstalkrecords/crosstalk-customs-calculator/pull/24)
targets `artwork-delivery-integration-20261018`, not the live form.

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
  `3835d52` on 21 November 2026. Hosted `/health` returned
  `deliveryMode=disabled` and `configured=false` after that deployment;
  unauthenticated normal and percent-encoded preview paths, designer and
  test-config returned 401 in checks across the review. The read-only staff
  submission route returned 503 because `ARTWORK_STAFF_SECRET` has not yet
  been provisioned in JOSH TEST. The test form's
  server-only Make key guard is deployed, but the full intake is still inactive
  and its protected webhook URL has not been configured in the JOSH TEST
  Railway service. A hosted authenticated mobile and staff-recovery smoke test
  remains open; deployment success does not establish a completed order journey.

## Intended journey and what has been exercised

| Stage | Intended customer/staff outcome | Evidence and current gap |
| --- | --- | --- |
| Open and configure | Customer chooses product, format, packaging, audio and other options; sees a comprehensible price. | The isolated preview presents the form. Local desktop/mobile browser tests cover the guarded path. Pricing/options and actual first-time hosted tester feedback still need human acceptance. |
| Design and upload | Customer uses front/back and label surfaces, adds source images, completes the designer, and sees an attached artwork reference on order review. | Local tests cover upload, attachment, failed submission retry, refresh/session isolation and mobile width. Hosted service returns the gated pages, but cloud browser authentication failed, so a human hosted pass is outstanding. |
| Submit | Test submission reaches only the isolated endpoint and protected Make intake; customer sees an accurate order state. | Earlier synthetic `TEST JOSH 21.11` artwork-only submissions reached scenario 8084300 and returned `bound`/`not_supplied`, but did **not** create an Airtable order or audio request. The new full intake 8715068 is inactive and unexecuted; the currently hosted form cannot submit through it. |
| Confirmation email | Josh receives a clearly labelled test receipt acknowledgement. | The earlier artwork-only Make execution reports a Microsoft email send step succeeded to the fixed address. **Inbox arrival has not been independently verified**, and the new intake has no email modules. This is not a completed customer receipt test. |
| Bind, render and deliver | Trusted processing binds the reference to the actual order's Uploads folder, renders the PSDs/ZIP and verifies the Dropbox upload. | One test job reached `delivered` on its first attempt; the exporter checked Dropbox path, size and content hash against the local archive. Duplicate bind returned `already_bound` through the no-email route. The remote ZIP has not been downloaded, opened and independently inspected in Photoshop. |
| Staff handling | Staff see an order, audio/assets, delivery or failure status and an actionable recovery path. | The isolated Airtable staff page shows a **manually seeded fixture** and a separate sparse upsert probe row, not a customer form-created order; there is no staff email or usable audio upload link from the new intake. The active intake has staff email but no invoice module. Production staff journey and failure alert are **not** end-to-end tested. The review code adds an authenticated failure list/retry route, pending operational verification. |

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
old saved drafts; it passed 17 service tests and is deployed at `3835d52`.
The staff view still needs its distinct server-side secret configured and
an authenticated hosted check. It does not resolve or resend an uncertain
submission.

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
completion-based retention window. Those code changes are deployed, but the
staff route still needs a separately provisioned server-side secret and an
operational test. Staff failure alerting and backup/restore are still open.

Local verification for the current working tree: `npm test` passed 17/17, including migrated-volume,
terminal-failure, low-space upload rejection, staff recovery and strict Dropbox
receipt cases, encoded-path Basic gating, price tampering, cross-session artwork
binding and read-only uncertain-submission visibility. The UI
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
The latest deployed SHA `3835d52` still requires a hosted authenticated smoke test.
The test-intake allowlist, fictional shipping, changed-details replay and
server-only Make key guard are deployed to JOSH TEST. The staff visibility
and expired-promotion patch passed local tests and deployed, but its staff
route returned 503 until a distinct secret is provisioned. No pull-request
GitHub Actions run was returned for `2bcd592` or established for `3835d52`. A
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

An isolated, **inactive** intake scaffold now exists as Make scenario
`8715068`: protected test hook `4151555`, sequential preflight, Airtable
`performUpsert` claim/Get and fresh-row detail guard, fixed app-folder Dropbox
folders and a **closed** file request. It returns 503 after `Manual review`;
populated/mismatched claims return 409 and invalid preflight returns 422.
No email, artwork bind, invoice, payment or public share module is wired, and
the full route has **not run**. A separate inactive on-demand synthetic runner
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
The 25-second test-server timeout still needs measurement or a persisted
queued/polling redesign.

| Priority / risk | Likelihood / impact | Evidence | Concrete resolution and retest status |
| --- | --- | --- | --- |
| 1. Production path is incomplete | Certain / high | Inactive intake 8715068 can claim a test row and construct fixed folders/closed request, but has no customer upload, artwork bind, email or completed response. The live form and Customer Intake are unchanged. | Complete an **open** upload request, actual exporter bind with claimed Airtable ID, Josh-only customer/staff receipt, no-artwork route and verified staff recovery in JOSH TEST. **Open; no complete journey.** |
| 2. Duplicate intake may create a second real order | Medium / high | Active Make intake creates Airtable records without a prior dedup. Separate test claim probe created then reused one row with the same ID across two runs; full intake/replay and timeout routes have not run. | Guard on Submission ID and Request Fingerprint, verify state and reconcile side effects. Force ambiguous timeout after claim and duplicate webhook; confirm one row, one request, one email pair. **Claim reuse resolved in probe; full-route recovery open; live untouched.** |
| 2e. Ambiguous email delivery on retry | Medium / medium | A provider send can succeed before Make saves a sent flag or responds, leaving a retry unable to know whether an email arrived. The Customs Microsoft sender connection grants `Mail.Send` but not `Mail.Read`; the connected Outlook account is a different Releases mailbox. | Keep separate customer and staff sent states; stop automatic retries at ambiguous sends, inspect Josh's inbox/spam or a separately authorized mailbox read and resume deliberately. Test forced failures on either side of both sends. **Open; no new intake email has been sent or independently observed.** |
| 2a. Copied invoice action in the test base | Low for form-only tester, high impact if clicked | A seeded test record computed a `Send Invoice` button pointing at an external invoice webhook. | Button was **not clicked**; field renamed with a warning and omitted from published staff interface. Remove the column in Airtable's base editor before broader direct table access. **Contained for form/staff-interface testing; deletion open.** |
| 2b. Customer audio link overwritten in current intake | Medium / high | Live Make module 30 writes the file-request URL to `Internal Folder Link`; module 5 overwrites it with a share URL and module 29 emails that share URL. | In the isolated copy, the file-request URL goes to `Audio Upload`; staff retain a private folder path or a verified team-only link, with `Internal Folder Link` empty unless that link is safe. Verify customer upload before proposing any live fix. **Open; live unchanged.** |
| 2c. Secret-bearing Make blueprint and broad Dropbox connection | Medium / high | Live module 38 contains OAuth material; broad 13265327 remains unused. App-folder 13265654 read the exporter ZIP and created fixed folders and a closed request through OAuth-backed API calls. No raw OAuth values or old broad connection are in inactive 8715068. | Keep OAuth material out of the blueprint; verify **open** request upload acceptance, exact app-folder path and error recovery before sending links. **Read/fixed writes resolved in isolated probes; open upload blocked/untested.** |
| 2i. Staff folder may become public | Medium / high | Dropbox `create_shared_link_with_settings` defaults to public visibility if no settings are supplied; the proposed module 16 did not set an explicit audience. | Do not create a default share link in JOSH TEST. Only store a verified team-only URL for staff; if that is unavailable, leave the Airtable URL blank and keep the private path in the test Airtable ledger for authorized staff. Test access as an unauthorised viewer before considering production. **Default link removed from test plan; sharing retest open.** |
| 2h. Test preview reaches shared playlist lookup | Medium / medium | The copied calculator includes four calls to the separate production playlist importer. | A preview-only rewrite disables those network calls and presents manual synthetic track entry. Local focused tests pass and the change is deployed; hosted authenticated check remains. Test playlist import separately before go-live. **Code deployed; hosted retest open.** |
| 2f. Different Dropbox app folders cannot share an order path | Low after read proof / high | The corrected Make metadata lookup found the exporter's unique ZIP at the exact test Uploads path, with matching 2,163,437-byte size; separate fixed folder/request probe returned the intended paths. | Verify an uploaded dummy file from an **open** request appears in that same Uploads namespace, then bind a new artwork job to its claimed record/folder. **Shared read namespace resolved; upload/write-to-exporter path open.** |
| 2j. Private request inspection and full-run gate | Medium / medium | Approval review rejected a UI step exposing a closed file-request ID/URL. The third static run completed the designed closed path; a boolean-only Airtable check found the private ID present and Audio Upload blank, without exposing either value. | Reopen the existing test request using a dynamically mapped ID through scoped OAuth, verify exact destination/open state, then perform a harmless upload and independently inspect its location. Do not retry an ambiguous open call blindly. **Closed route resolved; open upload untested.** |
| 2g. Artist field semantics need confirmation | Medium / low | The current intake maps `Artist Order = Yes` to a boolean-like value in an Airtable single-line `Artist` field, rather than an artist name. | In the isolated record, compare the intended meaning of that field with staff expectations and map it explicitly; preserve the source behavior only if it is deliberately a yes/no flag. **Open; live unchanged.** |
| 2d. Form values can disagree with the quoted price | Low after isolated fix / medium | The JOSH TEST server recalculates the displayed estimate from allowed format, quantity, colour, packaging, rush and shipping; tampered amounts fail locally. Production remains unchanged. | Exercise all pricing branches and tampered prices in the hosted test, then review live pricing parity before cutover. **Isolated code deployed; hosted parity open.** |
| 2k. Artist eligibility and expired promotion | Medium / high if invoiced | The artist unlock string is client-side and a restored test draft could revive the expired Father's Day selection. Browser artist status does not prove eligibility. | The deployed JOSH TEST patch hides/disables the expired offer, blocks restoration and rejects its marker. Keep artist and final quote under staff approval before any invoice; implement trusted eligibility or remove automatic artist pricing in production. **Promotion retested locally and deployed; eligibility open.** |
| 2l. Browser-held artwork capability | Medium / high | The legacy handoff stores a per-draft bearer-equivalent token in browser storage and sends a full reference through the form. It is not an infrastructure key and is not in the URL, but a script running on that origin could read it. | The isolated JOSH TEST code now uses an HttpOnly signed browser session and server-sealed draft token, with only an opaque job ID in the browser; local tests pass, hosted deployment/retest pending. A separate production redesign is required before attaching the designer to the live form. **Test fix pending hosted proof; production open.** |
| 3. Failed or uncertain jobs could be missed | Medium / high | Three delivery attempts previously ended in `failed`; an ambiguous Make timeout leaves test submissions `unknown` and rejects a blind repeat. There is no staff alert or backup schedule. | Deployed code retains failed artwork jobs and supports authenticated retry. JOSH TEST now has a staff-secret-protected read-only list of uncertain submissions with no resend action, but the distinct secret is not provisioned and its hosted route returned 503. Add manual reconciliation transition, alert and backup/restore procedure. **Code deployed; operational gate open.** |
| 4. Printed files may differ from approved templates | Medium / high | Synthetic parser/render tests exist; actual remote ZIP and PSDs have not been opened/edit-saved/reopened in Photoshop or physically approved. | Download the delivered test ZIP, inspect source files and PSD layers/masks/fonts, edit/save/reopen, print covers and labels, and obtain engineer approval. **Open.** |
| 5. Hosted phone and email experience unknown | Medium / medium | The mobile fix is now in the successful Railway deployment, but hosted phone use has not been witnessed; Make email module succeeded but inbox arrival is unverified. | Have a human tester use desktop and phone with refresh/interruption/large image, and check Josh's inbox including spam for both test messages. **Open.** |
| 6. Production infrastructure and permission boundary absent | Certain / high | Railway project has only JOSH TEST. The replacement Make Dropbox grant is app-folder scoped; separate production credentials, volume, backup, alert and ingress limiter have not been verified. | Provision distinct production service/volume and credentials, restrict access, implement ingress rate limiting, backup/restore and monitored failure queue. Verify with synthetic data before enabling customer delivery. **Open.** |
| 7. Repeat delivery and changed/missing references | Low to medium / high | Same submission cached; duplicate binding returned `already_bound`; server rejects conflicting binding and arbitrary folder; worker retries existing archive. Hosted interrupted and adversarial paths are less thoroughly exercised. | Force upload interruption, restart mid-job, duplicate webhook, expired/invalid/foreign references and mismatched order folder in the isolated copy; inspect that one verified archive results and staff can recover. **Partial; further retest required.** |
| 8. Privacy and retention | Medium / medium | Test route fixes name/recipient/root and omits live downstream systems; service has source, layer and project limits, noindex and Basic gate. Failed jobs are now retained to avoid silent loss, which also extends private data retention. | Agree deletion/acknowledgement and restricted backup policy, verify access logs/secret handling and upload validation, measure actual Railway volume headroom during PSD/ZIP rendering and restore. **Open policy/operational gate.** |
| 9. Final CI and hosted gate | Low / medium | Code commit `ecfa1547` passed an earlier GitHub service/UI/acceptance/audit gate; Railway reports successful JOSH TEST deployment of `3835d52`. Hosted authenticated phone/staff checks and CI evidence for this SHA are not established. | Run latest CI gate, hosted authenticated smoke and isolated intake once a permitted secure execution route exists. **Deploy resolved; hosted/full-route retest open.** |

## Live and test configuration comparison

| Boundary | JOSH TEST | Live/current or proposed production |
| --- | --- | --- |
| Form | Basic gated isolated preview and designer | Current GitHub Pages form remains in use without this handoff |
| Make | Artwork-only 8084300 inactive; full intake 8715068 inactive with protected hook, guarded test Airtable/Dropbox **closed-request** route and no email/bind; static runner 8715455 inactive and completed its closed-request rehearsal after two partial runs and mapper fixes. Main intake has 11 Commit stop handlers, zero Break directives and incomplete execution storage off; error routes are untested. Old broad Dropbox 13265327 unused. | Customer Intake 4762364 remains active; no integration change applied. |
| Orders and billing | Test Airtable base has manually seeded fixture, claim probe row and one populated static-runner row; no form-created order, invoice, payment or usable audio link. Copied invoice button omitted from staff interface. | Existing intake creates records/folders and emails; it has no invoice module. Invoicing is separate. |
| Dropbox | Fixed JOSH TEST root; verified exporter ZIP read by Make, fixed folder writes and a closed request. Open upload acceptance untested. | Separate production root/authorization and tested environment required. |
| Exporter | JOSH TEST Railway service/volume, one worker; `3835d52` deployed successfully, delivery disabled; staff intake visibility needs its secret; no full intake binding. | No production exporter in this project yet. |
| Secrets | Test hook key exists server-side in Make and is not in a blueprint/browser URL; JOSH TEST Railway webhook URL transfer was blocked, so hosted submission remains off. | New separate production credentials and staff recovery secret to provision securely. |

## Evidence required before a live approval request

| Gate | Evidence to present | Current state |
| --- | --- | --- |
| First-time form journey | Hosted desktop and phone runs with artwork and without artwork; product/price/options, upload, refresh, validation and completion screens match the submitted test order. | Local browser tests passed; hosted authenticated run and tester acceptance open. |
| Isolated intake and recovery | One Airtable row per `TEST JOSH 21.11` Submission ID with mapped details, fingerprint, Make execution and stage history; repeat click/webhook and forced post-claim timeout leave one row and one set of side effects. | Third static run completed the guarded closed-request route, reused one row and populated details/fingerprint. Actual webhook intake, duplicate after side effects, forced timeout, email and 25-second contract remain untested. |
| Audio, artwork and email | Test file-request link accepts a harmless upload into the verified test app folder; actual exporter bind uses the claimed record and same Uploads path; remote ZIP content/Photoshop/print review; Josh's customer and staff emails observed in inbox/Sent. | Static runner created a **closed** request and fixed folders for the same test row. Open upload, bind, new email, remote ZIP content and print review remain open. |
| Security and operations | Confirm test-only OAuth/write boundary, no default public staff link, no invoice/payment/live recipient, protected hook and server-only key, failure alert/retry, volume headroom, retention and backup/restore. | Test-only connection read/fixed writes proven; old broad connection unused. No public share/email in intake. Recovery, operational alerts, open upload and token transfer still open. |
| Release and reversal | Exact live form diff, Make blueprint and environment variable **names** (not values), deployment order, monitored smoke, saved live commit/blueprint, disabling switches and a rehearsed rollback/no-artwork regression result. | Plan below is preliminary; no live change or production activation authorized. |

## Proposed release sequence — approval boundary

1. Finish JOSH TEST checks: health and the isolated code deploy have passed;
   repeat hosted authenticated mobile and no-artwork journeys after a permitted
   secure transfer of the protected Make hook destination to JOSH TEST Railway
   and a reviewed activation window. Confirm inbox arrival and
   actual ZIP/Photoshop/print acceptance. Force a failed delivery and verify
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
   Extend the **inactive** intake 8715068 from its current guarded Airtable,
   fixed-folder and **closed-request** state. Verify the preflight/fingerprint
   routes and manual-stop error handling in a controlled, permitted test;
   establish an **open** request accepts a harmless audio upload into the
   same isolated Uploads folder. Persist the verified customer URL in Audio
   Upload, keep Internal Folder Link empty unless a team-only URL is proven,
   and use the private path for authorized staff. Add the real claimed Airtable
   ID and Uploads path to the optional artwork bind; add fixed Josh-only
   customer and staff emails with separate uncertain/sent states. Test normal,
   no-artwork, duplicate, timeout, partial-failure and staff recovery routes.
   Time the route against 25 seconds; if too slow, implement persisted queued
   status and polling in the isolated server/UI before a tester submission.
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
