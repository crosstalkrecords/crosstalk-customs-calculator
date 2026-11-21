# Crosstalk Customs artwork handoff — prelaunch review

Status: **test environment available, production release blocked**. This is the
Customs project only. The live order form and Customer Intake scenario have not
been changed. Review branch: `artwork-form-handoff-review-20261119`; draft PR
[#24](https://github.com/crosstalkrecords/crosstalk-customs-calculator/pull/24)
targets `artwork-delivery-integration-20261018`, not the live form.

The isolated Airtable base `Crosstalk Customs — JOSH TEST`
(`appDz7CEL2KQWpzyC`) is connected with access to that base only. It copied
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
- Railway now reports a successful JOSH TEST deployment on 21 November 2026
  at 04:05 UTC for review-branch commit
  `9522fa522641adb81a7a59e7fc3f9f2c415df880`, which includes reviewed code
  `ecfa1547dac5e68ac71c898b663a6841ea7fba0f`. Its source config pins that
  reviewed code and has no staged patch. The newer Airtable intake mapping in
  this review is still **local only**. A hosted mobile and staff-recovery smoke
  test of the deployed revision is still required; deployment success alone
  does not prove those journeys.

## Intended journey and what has been exercised

| Stage | Intended customer/staff outcome | Evidence and current gap |
| --- | --- | --- |
| Open and configure | Customer chooses product, format, packaging, audio and other options; sees a comprehensible price. | The isolated preview presents the form. Local desktop/mobile browser tests cover the guarded path. Pricing/options and actual first-time hosted tester feedback still need human acceptance. |
| Design and upload | Customer uses front/back and label surfaces, adds source images, completes the designer, and sees an attached artwork reference on order review. | Local tests cover upload, attachment, failed submission retry, refresh/session isolation and mobile width. Hosted service returns the gated pages, but cloud browser authentication failed, so a human hosted pass is outstanding. |
| Submit | Test submission reaches only the isolated endpoint and Make; customer sees that the order was accepted separately from completed artwork delivery. | A synthetic `TEST JOSH 21.11` submission was accepted. Duplicate submission returned cached 200. A no-artwork test returned `not_supplied`. The test route does not create a real Airtable record. |
| Confirmation email | Josh receives a clearly labelled test receipt acknowledgement. | The four-operation Make execution reports the Microsoft email send step succeeded to the fixed address. **Gmail inbox arrival has not been independently verified.** This email is not an artwork delivery notice. |
| Bind, render and deliver | Trusted processing binds the reference to the actual order's Uploads folder, renders the PSDs/ZIP and verifies the Dropbox upload. | One test job reached `delivered` on its first attempt; the exporter checked Dropbox path, size and content hash against the local archive. Duplicate bind returned `already_bound` through the no-email route. The remote ZIP has not been downloaded, opened and independently inspected in Photoshop. |
| Staff handling | Staff see an order, audio/assets, delivery or failure status and an actionable recovery path. | The new isolated Airtable staff page shows one **manually seeded fixture**, not a Make-created order; there is still no staff email or audio upload link from the test form. The active intake has staff email, but no invoice module; invoicing is handled elsewhere. Production staff journey and failure alert are **not** end-to-end tested. The review code adds an authenticated failure list/retry route, pending deployment and operational verification. |

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

The latest local patch maps actual allowlisted Customs form fields into the
test-only server-side payload, derives pickup/shipping, fixes identity, replaces
shipping with an explicitly fictional address and fingerprints normalized
details so the same Submission ID cannot silently change an order. It remains
unhosted and the existing artwork-only Make scenario ignores the additional
fields. A full intake copy must still be built and retested with those fields.

The deployed review code also fixes a missing `Origin` on a same-origin mobile
draft request, prevents playlist error markup from executing, gates the private
Dropbox probe on setup mode, retains failed jobs for staff recovery, stores
verified delivery metadata without provider paths, and exposes a separate
authenticated paginated failure list. New uploads check remaining disk space;
staff and binding secrets must differ; migrated delivered records receive a
completion-based retention window. The staff route needs a separately
provisioned server-side secret and an operational test. These newer changes
are not yet deployed to JOSH TEST. Staff failure alerting and backup/restore
are still open.

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
The final deployed SHA still requires a hosted smoke test.
The new test-intake allowlist, fictional shipping and changed-details replay
checks also passed the 15/15 local service suite; this newer patch has not yet
run on GitHub CI or Railway.

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

No safe, runnable inactive intake copy exists yet. Make requires a new Airtable
connection limited to the JOSH TEST base, a separate Dropbox connection with
`file_requests.write` and test-only folder access, and a dedicated Data store
for a keyed submission claim. The existing Dropbox Make connection lacks the
file-request scope and can access production folders. Connection creation and
Data store creation are not exposed through the connected Make tools. Existing
scenario 8084300 binds a static synthetic order/folder and is not a substitute
for the real intake handoff.

| Priority / risk | Likelihood / impact | Evidence | Concrete resolution and retest status |
| --- | --- | --- | --- |
| 1. Production path is incomplete | Certain / high | Test scenario has no Airtable, real folder creation, audio link, invoice or staff notification; the live form and Customer Intake are unchanged. | Build an inactive copy of the current intake with isolated test base/folders, then bind using module 2's actual Airtable ID and module 27's returned Uploads path. Test artwork, no-artwork, customer/staff outcomes and error paths before cutover. **Open.** |
| 2. Duplicate intake may create a second real order | Medium / high | Active Make intake goes from webhook 1 to Airtable create 2 without a prior dedup/lookup. A repeated webhook can repeat record creation and customer/staff emails. Exporter and test-route idempotency do not prevent this. | Add a stable submission ID and durable intake dedup/recovery state before Airtable create in an inactive copy. Test repeat clicks, simultaneous/replayed webhooks and a failure after record creation; confirm one order, one set of emails and a recoverable response. **Open; active scenario untouched.** |
| 2a. Copied invoice action in the test base | Low for form-only tester, high impact if clicked | A seeded test record computed a `Send Invoice` button pointing at an external invoice webhook. | Button was **not clicked**; field renamed with a warning and omitted from published staff interface. Remove the column in Airtable's base editor before broader direct table access. **Contained for form/staff-interface testing; deletion open.** |
| 2b. Customer audio link overwritten in current intake | Medium / high | Live Make module 30 writes the file-request URL to `Internal Folder Link`; module 5 overwrites it with a share URL and module 29 emails that share URL. | In isolated copy, native file request URL goes to `Audio Upload`, staff share URL to `Internal Folder Link`; verify customer can upload before proposing any live fix. **Open; live unchanged.** |
| 2c. Secret-bearing Make blueprint and broad Dropbox connection | Medium / high | Live module 38 contains OAuth material in blueprint; existing Make Dropbox connection lacks `file_requests.write` and can access production folders. | Do not clone module 38. Create separate scoped test connections and use native file request; keep credentials out of blueprint and logs. **Open; no test copy created.** |
| 2d. Form values can disagree with the quoted price | Medium / medium | The current form supplies its price and options as browser fields; the isolated allowlist checks type/range but does not independently recalculate the quote. | Compare chosen options, quoted amount and staff-approved price against a server-side price rule or trusted staff review before invoicing; test tampered input in the isolated intake. **Open.** |
| 3. Failed jobs could be missed or lost | Medium / high | Three delivery attempts previously ended in `failed`, worker tick errors were swallowed, failed data expired after seven days from creation; no staff alert or backup schedule. | Review code retains failures and their files, records failure stage and completed timestamp, lists them under a separate staff secret, and supports authenticated retry. Migration, forced failure, retention, low-space rejection and retry tests pass locally; Railway reports successful deployment of that revision. Repeat operationally on JOSH TEST, add an actual alert and backup/restore procedure. **Code deployed; operational gate open.** |
| 4. Printed files may differ from approved templates | Medium / high | Synthetic parser/render tests exist; actual remote ZIP and PSDs have not been opened/edit-saved/reopened in Photoshop or physically approved. | Download the delivered test ZIP, inspect source files and PSD layers/masks/fonts, edit/save/reopen, print covers and labels, and obtain engineer approval. **Open.** |
| 5. Hosted phone and email experience unknown | Medium / medium | The mobile fix is now in the successful Railway deployment, but hosted phone use has not been witnessed; Make email module succeeded but inbox arrival is unverified. | Have a human tester use desktop and phone with refresh/interruption/large image, and check Josh's inbox including spam for both test messages. **Open.** |
| 6. Production infrastructure and permission boundary absent | Certain / high | Railway project has only JOSH TEST; test OAuth is app-folder scoped but the token's provider permissions are wider than the application root check. No production volume, backup, alert or ingress limiter is verified. | Provision a distinct production environment/service/volume and credentials, restrict access, implement ingress rate limiting, backup/restore, monitored failure queue and separate provider authorization. Verify with synthetic data before enabling customer delivery. **Open.** |
| 7. Repeat delivery and changed/missing references | Low to medium / high | Same submission cached; duplicate binding returned `already_bound`; server rejects conflicting binding and arbitrary folder; worker retries existing archive. Hosted interrupted and adversarial paths are less thoroughly exercised. | Force upload interruption, restart mid-job, duplicate webhook, expired/invalid/foreign references and mismatched order folder in the isolated copy; inspect that one verified archive results and staff can recover. **Partial; further retest required.** |
| 8. Privacy and retention | Medium / medium | Test route fixes name/recipient/root and omits live downstream systems; service has source, layer and project limits, noindex and Basic gate. Failed jobs are now retained to avoid silent loss, which also extends private data retention. | Agree deletion/acknowledgement and restricted backup policy, verify access logs/secret handling and upload validation, measure actual Railway volume headroom during PSD/ZIP rendering and restore. **Open policy/operational gate.** |
| 9. Final CI and hosted gate | Low / medium | Earlier CI failed `ETXTBSY`, and the old UI fixture expected a retired route. Code commit `ecfa1547` passed service, UI, acceptance and audit steps on GitHub; Railway reports a successful deployment containing it. The newer form mapping has only local tests. | CI runner and fixture fixes are verified on the review branch. Run a hosted smoke and mobile test, then validate the newer mapping after isolated deployment. **Old CI/deploy resolved; hosted retest open.** |

## Live and test configuration comparison

| Boundary | JOSH TEST | Live/current or proposed production |
| --- | --- | --- |
| Form | Basic gated isolated preview and designer | Current GitHub Pages form remains in use without this handoff |
| Make | Scenario 8084300, test webhook, Josh-only receipt | Customer Intake 4762364 remains active; no integration change applied |
| Orders and billing | No Airtable, invoice, payment or real audio link | Existing intake creates records/folders and emails; it has no invoice module. Invoicing is a separate downstream process. Changes need inactive-copy tests |
| Dropbox | Fixed JOSH TEST root, verified test ZIP | Separate production root/authorization and tested environment required |
| Exporter | JOSH TEST Railway service/volume, one worker; review code deployed, newer intake mapping local | No production exporter in this project yet |
| Secrets | Server-side test webhook, bind secret, encrypted Dropbox refresh token | New separate production credentials and staff recovery secret to provision securely |

## Proposed release sequence — approval boundary

1. Finish JOSH TEST checks: verify health and repeat the hosted mobile and
   no-artwork journeys on the deployed review revision; deploy the newer form
   field mapping to JOSH TEST only after review. Confirm inbox arrival and
   actual ZIP/Photoshop/print acceptance. Force a failed delivery and verify
   staff visibility, recovery and no double delivery.
2. Snapshot the live form commit and export the active Customer Intake blueprint.
   Provision a **separate** production exporter, volume and credentials with
   delivery disabled. Configure restricted origins, ingress limits, retention,
   backup/restore and alerts. Verify health and a synthetic archive first.
3. Remove the copied test-base invoice button in Airtable's editor. Create a
   **new JOSH TEST-only Make Airtable OAuth connection**, **new isolated Dropbox
   connection with file-request scope**, and **JOSH TEST Data store**; verify
   the Dropbox credential cannot access production folders. Do not copy the
   live raw OAuth module. Prepare an **inactive** Customer Intake copy with a
   new webhook, test base/root and Josh-only customer/staff email destinations.
   Preserve pricing, tracklist, email semantics and no-artwork response;
   invoicing is not in this scenario. Claim a stable Submission ID before
   Airtable create, persist each side-effect stage, and handle duplicates and
   partial failures. Use the native file-request URL for customer audio uploads
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
