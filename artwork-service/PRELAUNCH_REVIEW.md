# Crosstalk Customs artwork handoff — prelaunch review

Status: **test environment available, production release blocked**. This is the
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
Three test-only fields now track Submission ID, the non-secret Artwork Job ID,
and Artwork Delivery Status. A manually seeded fixture record
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

- Test URL: <https://josh-test-artwork-exporter-josh-test.up.railway.app/calculator-preview.html>
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
- Railway reports a successful **JOSH TEST only** deployment on 21 November
  2026 of review commit `66a2cb911d4152167a3f20239cb9eeec25fc93b6`
  (deployment `844a7ced-0891-4b52-8192-fc3f0aa5ab46`). After deploy, `/health` returned
  `deliveryMode=disabled` and `configured=false`; unauthenticated preview and
  test-config requests returned 401. The newer Airtable intake mapping and
  server-only Make API key guard are hosted, but the guarded form's submission
  route remains closed until a dedicated hook/key and isolated delivery are
  configured. A hosted authenticated mobile and staff-recovery smoke test is
  still required; deployment success alone does not prove those journeys.

## Intended journey and what has been exercised

| Stage | Intended customer/staff outcome | Evidence and current gap |
| --- | --- | --- |
| Open and configure | Customer chooses product, format, packaging, audio and other options; sees a comprehensible price. | The isolated preview presents the form. Local desktop/mobile browser tests cover the guarded path. Pricing/options and actual first-time hosted tester feedback still need human acceptance. |
| Design and upload | Customer uses front/back and label surfaces, adds source images, completes the designer, and sees an attached artwork reference on order review. | Local tests cover upload, attachment, failed submission retry, refresh/session isolation and mobile width. Hosted service returns the gated pages, but cloud browser authentication failed, so a human hosted pass is outstanding. |
| Submit | Test submission reaches only the isolated endpoint and Make; customer sees that the order was accepted separately from completed artwork delivery. | A synthetic `TEST JOSH 21.11` submission was accepted. Duplicate submission returned cached 200. A no-artwork test returned `not_supplied`. The test route does not create a real Airtable record. |
| Confirmation email | Josh receives a clearly labelled test receipt acknowledgement. | The four-operation Make execution reports the Microsoft email send step succeeded to the fixed address. **Gmail inbox arrival has not been independently verified.** This email is not an artwork delivery notice. |
| Bind, render and deliver | Trusted processing binds the reference to the actual order's Uploads folder, renders the PSDs/ZIP and verifies the Dropbox upload. | One test job reached `delivered` on its first attempt; the exporter checked Dropbox path, size and content hash against the local archive. Duplicate bind returned `already_bound` through the no-email route. The remote ZIP has not been downloaded, opened and independently inspected in Photoshop. |
| Staff handling | Staff see an order, audio/assets, delivery or failure status and an actionable recovery path. | The new isolated Airtable staff page shows one **manually seeded fixture**, not a Make-created order; there is still no staff email or audio upload link from the test form. The active intake has staff email, but no invoice module; invoicing is handled elsewhere. Production staff journey and failure alert are **not** end-to-end tested. The review code adds an authenticated failure list/retry route, pending operational verification. |

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
ignores the additional fields. A full intake copy must still be built and retested with those fields.

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

Local verification: `npm test` passed 15/15, including migrated-volume,
terminal-failure, low-space upload rejection, staff recovery and strict Dropbox
receipt cases. The UI
script passed desktop/mobile handoff, no-artwork and forged-origin cases;
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
The latest deployed SHA `66a2cb9` still requires a hosted authenticated smoke test.
The new test-intake allowlist, fictional shipping, changed-details replay and
server-only Make key guard passed the 15/15 local service suite, and the code
was deployed to JOSH TEST. A GitHub Actions result for the latest SHA has not
been established in this report. A
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
This may leave customers unable to upload audio. The isolated copy must use a
native Dropbox file-request module, put its upload URL in `Audio Upload`, keep
the staff folder URL in `Internal Folder Link`, and verify each before emailing.
The [sanitized JOSH TEST intake plan](JOSH_TEST_INTAKE_PLAN.json) documents
the proposed route without credential values or webhook addresses.

No safe, runnable inactive intake copy exists yet. In Make, the dedicated
`JOSH TEST Customs intake ledger` Data store (ID `267564`, 1 MB) and strict
`JOSH TEST Customs intake state` structure have been created and are empty.
They contain slots for the Airtable record, Dropbox folders and links, artwork
job, separate email flags, error and update time; no scenario uses them yet.
The new Make Airtable connection 13265002 is Locked, and its grant was
independently verified in Airtable Integrations as limited to the JOSH TEST
base. No broad workspace grant was made. A new Make connection
`JOSH TEST Dropbox app` (13265327) exists with `account_info.read`,
`file_requests.write`, `files.content.write`, `files.metadata.read`,
`sharing.read` and `sharing.write`. Make lists it as scoped and team-visible,
under `custom@crosstalkrecords.com`. Josh accepts team read access outside the
test app folder; the critical question is where this connection can write.
A read-only root folder listing
through this connection exposed `Crosstalk Customs`, `File requests` and `Apps`
at the top level, outside the expected JOSH TEST app folder. That fails the
read-only isolation check; **do not bind or use connection 13265327 pending
write-boundary verification**. This observation does not establish which
individual folders are writable. If its write grant reaches outside JOSH TEST,
replace it with a custom-app connection whose write scope is test-folder-only.
The chosen connection must share the exporter's intended namespace. Make still needs a
dedicated API-key-protected webhook. The isolated form code now sends the test
key only in a server-to-Make `x-make-apikey` header and refuses submission
without it; the key has not been created or configured, and this guard has
passed local tests only. The existing Dropbox Make connection lacks the file-request
scope and can access production folders. A custom app-folder Dropbox grant
would isolate Make, but its paths are relative to that app folder; the JOSH
TEST exporter must use the same Dropbox app and destination, or both components
must use a dedicated test Dropbox account. A hardcoded path cannot bridge two
different app folders. Existing scenario 8084300 binds a
static synthetic order/folder and is not a substitute for the real intake
handoff.

The ledger claim alone cannot make intake idempotent. An Airtable create can
succeed before Make records its ID or returns an HTTP response. The inactive
copy must search the test table for the exact Submission ID before any recovery
create, persist each external side effect, and reconcile a timed-out execution
against the ledger, Airtable and Dropbox. A successful email send followed by
a failed state update is ambiguous; pause that stage for provider/inbox review
instead of blindly resending. The [sanitized intake plan](JOSH_TEST_INTAKE_PLAN.json)
now specifies those recovery paths, but no runnable stage modules exist yet.

| Priority / risk | Likelihood / impact | Evidence | Concrete resolution and retest status |
| --- | --- | --- | --- |
| 1. Production path is incomplete | Certain / high | Test scenario has no Airtable, real folder creation, audio link, invoice or staff notification; the live form and Customer Intake are unchanged. | Build an inactive copy of the current intake with isolated test base/folders, then bind using module 2's actual Airtable ID and module 27's returned Uploads path. Test artwork, no-artwork, customer/staff outcomes and error paths before cutover. **Open.** |
| 2. Duplicate intake may create a second real order | Medium / high | Active Make intake goes from webhook 1 to Airtable create 2 without a prior dedup/lookup. A repeated webhook can repeat record creation and customer/staff emails. The isolated ledger exists but is empty and unbound; a claim alone cannot resolve a create that succeeded before its state update. | Claim a stable Submission ID before create, search Airtable by that ID on ambiguous recovery, and persist/reconcile each later side effect. Test repeat clicks, simultaneous/replayed webhooks, timeout and failures after record creation; confirm one order, one set of emails and a recoverable response. **Ledger created; scenario and retest open; active scenario untouched.** |
| 2e. Ambiguous email delivery on retry | Medium / medium | A provider send can succeed before Make saves a sent flag or responds, leaving a retry unable to know whether an email arrived. | Keep separate customer and staff sent states; stop automatic retries at ambiguous sends, inspect provider/inbox evidence and resume deliberately. Test forced failures on either side of both sends. **Open; exactly-once email is not yet established.** |
| 2a. Copied invoice action in the test base | Low for form-only tester, high impact if clicked | A seeded test record computed a `Send Invoice` button pointing at an external invoice webhook. | Button was **not clicked**; field renamed with a warning and omitted from published staff interface. Remove the column in Airtable's base editor before broader direct table access. **Contained for form/staff-interface testing; deletion open.** |
| 2b. Customer audio link overwritten in current intake | Medium / high | Live Make module 30 writes the file-request URL to `Internal Folder Link`; module 5 overwrites it with a share URL and module 29 emails that share URL. | In isolated copy, native file request URL goes to `Audio Upload`, staff share URL to `Internal Folder Link`; verify customer can upload before proposing any live fix. **Open; live unchanged.** |
| 2c. Secret-bearing Make blueprint and broad Dropbox connection | Medium / high | Live module 38 contains OAuth material in blueprint; existing broad Make Dropbox connection lacks `file_requests.write`. New connection 13265327 has the required scopes, but its read-only root listing exposed unrelated top-level folders and its write boundary remains unverified. | Do not clone module 38 or bind connection 13265327 until its write boundary is proved test-only; replace it with a custom-app connection if the grant is broad. Verify the chosen connection shares the exporter namespace and use native file request; keep credentials out of blueprint and logs. Josh accepts team read access outside the app folder. **New connection unused; write-boundary check and test copy open.** |
| 2h. Test preview reaches shared playlist lookup | Medium / medium | The copied calculator includes four calls to the separate production playlist importer. | A preview-only rewrite disables those network calls and presents manual synthetic track entry. Local focused tests pass and the change is deployed; hosted authenticated check remains. Test playlist import separately before go-live. **Code deployed; hosted retest open.** |
| 2f. Different Dropbox app folders cannot share an order path | High / high | Make can accept a custom app-folder OAuth grant, while the currently verified exporter writes to its own existing test root. App-folder paths are relative to the app, so equal path strings do not prove a shared destination. Connection 13265327 was created but failed the read-only root-isolation check. | Verify write scope and use a test-only Dropbox app for both components (reauthorizing the exporter if the app changes), or one dedicated test Dropbox account; probe folder/file-request visibility from both ends before a customer test. **Open; existing new grant is unused pending write-boundary proof or replacement.** |
| 2g. Artist field semantics need confirmation | Medium / low | The current intake maps `Artist Order = Yes` to a boolean-like value in an Airtable single-line `Artist` field, rather than an artist name. | In the isolated record, compare the intended meaning of that field with staff expectations and map it explicitly; preserve the source behavior only if it is deliberately a yes/no flag. **Open; live unchanged.** |
| 2d. Form values can disagree with the quoted price | Medium / medium | The current form supplies its price and options as browser fields; the isolated allowlist checks type/range but does not independently recalculate the quote. | Compare chosen options, quoted amount and staff-approved price against a server-side price rule or trusted staff review before invoicing; test tampered input in the isolated intake. **Open.** |
| 3. Failed jobs could be missed or lost | Medium / high | Three delivery attempts previously ended in `failed`, worker tick errors were swallowed, failed data expired after seven days from creation; no staff alert or backup schedule. | Review code retains failures and their files, records failure stage and completed timestamp, lists them under a separate staff secret, and supports authenticated retry. Migration, forced failure, retention, low-space rejection and retry tests pass locally; Railway reports successful deployment of that revision. Repeat operationally on JOSH TEST, add an actual alert and backup/restore procedure. **Code deployed; operational gate open.** |
| 4. Printed files may differ from approved templates | Medium / high | Synthetic parser/render tests exist; actual remote ZIP and PSDs have not been opened/edit-saved/reopened in Photoshop or physically approved. | Download the delivered test ZIP, inspect source files and PSD layers/masks/fonts, edit/save/reopen, print covers and labels, and obtain engineer approval. **Open.** |
| 5. Hosted phone and email experience unknown | Medium / medium | The mobile fix is now in the successful Railway deployment, but hosted phone use has not been witnessed; Make email module succeeded but inbox arrival is unverified. | Have a human tester use desktop and phone with refresh/interruption/large image, and check Josh's inbox including spam for both test messages. **Open.** |
| 6. Production infrastructure and permission boundary absent | Certain / high | Railway project has only JOSH TEST; test OAuth is app-folder scoped but the token's provider permissions are wider than the application root check. No production volume, backup, alert or ingress limiter is verified. | Provision a distinct production environment/service/volume and credentials, restrict access, implement ingress rate limiting, backup/restore, monitored failure queue and separate provider authorization. Verify with synthetic data before enabling customer delivery. **Open.** |
| 7. Repeat delivery and changed/missing references | Low to medium / high | Same submission cached; duplicate binding returned `already_bound`; server rejects conflicting binding and arbitrary folder; worker retries existing archive. Hosted interrupted and adversarial paths are less thoroughly exercised. | Force upload interruption, restart mid-job, duplicate webhook, expired/invalid/foreign references and mismatched order folder in the isolated copy; inspect that one verified archive results and staff can recover. **Partial; further retest required.** |
| 8. Privacy and retention | Medium / medium | Test route fixes name/recipient/root and omits live downstream systems; service has source, layer and project limits, noindex and Basic gate. Failed jobs are now retained to avoid silent loss, which also extends private data retention. | Agree deletion/acknowledgement and restricted backup policy, verify access logs/secret handling and upload validation, measure actual Railway volume headroom during PSD/ZIP rendering and restore. **Open policy/operational gate.** |
| 9. Final CI and hosted gate | Low / medium | Earlier CI failed `ETXTBSY`, and the old UI fixture expected a retired route. Code commit `ecfa1547` passed service, UI, acceptance and audit steps on GitHub; Railway reports the latest successful JOSH TEST deployment at `66a2cb9`. Its mapping and Make key guard passed 15 local service tests, and the preview-only copy pass passed desktop/mobile checks; no GitHub Actions run was returned for the latest SHA. | CI runner and fixture fixes are verified on the review branch. Run a hosted authenticated smoke and mobile test and the full isolated Make intake after credentials are scoped. **Deploy resolved; hosted retest open.** |

## Live and test configuration comparison

| Boundary | JOSH TEST | Live/current or proposed production |
| --- | --- | --- |
| Form | Basic gated isolated preview and designer | Current GitHub Pages form remains in use without this handoff |
| Make | Scenario 8084300 inactive, test webhook, Josh-only receipt; empty intake ledger 267564; JOSH TEST-only Locked Airtable connection 13265002; connection 13265327 failed read-only root-isolation check and is unused pending write-boundary verification or replacement; no runnable full intake copy | Customer Intake 4762364 remains active; no integration change applied |
| Orders and billing | No Airtable, invoice, payment or real audio link | Existing intake creates records/folders and emails; it has no invoice module. Invoicing is a separate downstream process. Changes need inactive-copy tests |
| Dropbox | Fixed JOSH TEST root, verified test ZIP | Separate production root/authorization and tested environment required |
| Exporter | JOSH TEST Railway service/volume, one worker; review code and intake mapping deployed; delivery disabled | No production exporter in this project yet |
| Secrets | Server-side test webhook, bind secret, encrypted Dropbox refresh token | New separate production credentials and staff recovery secret to provision securely |

## Proposed release sequence — approval boundary

1. Finish JOSH TEST checks: health and the isolated code deploy have passed;
   repeat hosted authenticated mobile and no-artwork journeys after the new
   Make hook and scoped connections exist. Confirm inbox arrival and
   actual ZIP/Photoshop/print acceptance. Force a failed delivery and verify
   staff visibility, recovery and no double delivery.
2. Snapshot the live form commit and export the active Customer Intake blueprint.
   Provision a **separate** production exporter, volume and credentials with
   delivery disabled. Configure restricted origins, ingress limits, retention,
   backup/restore and alerts. Verify health and a synthetic archive first.
3. Remove the copied test-base invoice button in Airtable's editor. The new
   JOSH TEST-only Make Airtable grant is verified; exercise its read/write in
   the isolated scenario.
   Keep connection 13265327 unused until its write boundary is proved test-only;
   replace it with a custom-app Dropbox connection if broader. Prove the chosen
   connection's write grant is limited to the JOSH TEST app folder and shares the
   exporter's intended namespace. Use the already-created JOSH TEST
   Data store. Do not copy the
   live raw OAuth module. Prepare an **inactive** Customer Intake copy with a
   new webhook, test base/root and Josh-only customer/staff email destinations.
   Preserve pricing, tracklist, email semantics and no-artwork response;
   invoicing is not in this scenario. Claim a stable Submission ID before
   Airtable create, search Airtable by Submission ID after an ambiguous create,
   persist each side-effect stage, and handle duplicates, email-send ambiguity
   and partial failures. Use the native file-request URL for customer audio uploads
   and a separate shared-folder URL for staff. Bind optional artwork with
   Airtable `2.id` and Dropbox `27.path_display`. Test normal, absent-artwork,
   simultaneous duplicate and partial-failure cases against isolated records.
4. Present the exact form diff, Make blueprint diff, environment configuration,
   test evidence and rollback snapshots to Josh. **Stop here for explicit approval**
   of the live form change and production delivery activation.
5. After approval, deploy the production exporter with delivery initially off;
   activate the reviewed Make route and form change in a short monitored window;
   enable delivery and make one clearly labelled, controlled synthetic order.
   Verify the actual order, emails, Make execution, ZIP contents, staff view and
   no-artwork path. Watch job failure queue, Make errors, disk and delivery logs.
6. If a check fails, revert the form to its saved commit, restore the Make
   blueprint, disable production delivery and keep the volume/queued files for
   diagnosis. Confirm ordinary no-artwork orders still work after rollback.

No live form update or production delivery activation is authorized by this
review. The approval decision will be the specific diffs and configuration from
step 4, after the release gates above are satisfied.
