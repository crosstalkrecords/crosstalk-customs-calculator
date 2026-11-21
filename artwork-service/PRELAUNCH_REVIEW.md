# Crosstalk Customs artwork handoff — prelaunch review

Status: **test environment available, production release blocked**. This is the
Customs project only. The live order form and Customer Intake scenario have not
been changed. Review branch: `artwork-form-handoff-review-20261119`; draft PR
[#24](https://github.com/crosstalkrecords/crosstalk-customs-calculator/pull/24)
targets `artwork-delivery-integration-20261018`, not the live form.

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
  Make: `JOSH TEST artwork delivery` (scenario 8084300), enabled only for the
  controlled tester window. Test Dropbox root:
  `/Crosstalk Customs/JOSH TEST/JOSH TEST/Uploads`. Disable the scenario and
  delivery mode when the window ends; Dropbox setup stays disabled.
- The running Railway revision is `1e8926690d7e48301381cb2fb7f9b0202569bae1`.
  The review branch now has the same-origin mobile draft and staff recovery
  fixes, but they have **not** been applied to Railway. A JOSH TEST deployment
  approval returned cancelled. The pending source pin targets an older review
  SHA; the current review head must be selected before deploying the final
  candidate through a valid approval path.
  Hosted mobile success cannot be claimed from the local test.

## Intended journey and what has been exercised

| Stage | Intended customer/staff outcome | Evidence and current gap |
| --- | --- | --- |
| Open and configure | Customer chooses product, format, packaging, audio and other options; sees a comprehensible price. | The isolated preview presents the form. Local desktop/mobile browser tests cover the guarded path. Pricing/options and actual first-time hosted tester feedback still need human acceptance. |
| Design and upload | Customer uses front/back and label surfaces, adds source images, completes the designer, and sees an attached artwork reference on order review. | Local tests cover upload, attachment, failed submission retry, refresh/session isolation and mobile width. Hosted service returns the gated pages, but cloud browser authentication failed, so a human hosted pass is outstanding. |
| Submit | Test submission reaches only the isolated endpoint and Make; customer sees that the order was accepted separately from completed artwork delivery. | A synthetic `TEST JOSH 21.11` submission was accepted. Duplicate submission returned cached 200. A no-artwork test returned `not_supplied`. The test route does not create a real Airtable record. |
| Confirmation email | Josh receives a clearly labelled test receipt acknowledgement. | The four-operation Make execution reports the Microsoft email send step succeeded to the fixed address. **Gmail inbox arrival has not been independently verified.** This email is not an artwork delivery notice. |
| Bind, render and deliver | Trusted processing binds the reference to the actual order's Uploads folder, renders the PSDs/ZIP and verifies the Dropbox upload. | One test job reached `delivered` on its first attempt; the exporter checked Dropbox path, size and content hash against the local archive. Duplicate bind returned `already_bound` through the no-email route. The remote ZIP has not been downloaded, opened and independently inspected in Photoshop. |
| Staff handling | Staff see an order, audio/assets, delivery or failure status and an actionable recovery path. | The isolated test intentionally has no Airtable record, staff email, invoice or real audio upload link. Production staff journey and failure alert are **not** end-to-end tested. The review code adds an authenticated failure list/retry route, pending deployment and operational verification. |

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

The latest review code also fixes a missing `Origin` on a same-origin mobile
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
GitHub review gate on code commit `1b32d97b680f54b9f9522daea42aa60b6443b21a`
([run 44849791028](https://github.com/crosstalkrecords/crosstalk-customs-calculator/actions/runs/44849791028)).
The final deployed SHA still requires a hosted smoke test.

## Prioritized risks and release gates

| Priority / risk | Likelihood / impact | Evidence | Concrete resolution and retest status |
| --- | --- | --- | --- |
| 1. Production path is incomplete | Certain / high | Test scenario has no Airtable, real folder creation, audio link, invoice or staff notification; the live form and Customer Intake are unchanged. | Build an inactive copy of the current intake with isolated test base/folders, then bind using module 2's actual Airtable ID and module 27's returned Uploads path. Test artwork, no-artwork, customer/staff outcomes and error paths before cutover. **Open.** |
| 2. Failed jobs could be missed or lost | Medium / high | Three delivery attempts previously ended in `failed`, worker tick errors were swallowed, failed data expired after seven days from creation; no staff alert or backup schedule. | Review code retains failures and their files, records failure stage and completed timestamp, lists them under a separate staff secret, and supports authenticated retry. Migration, forced failure, retention, low-space rejection and retry tests pass locally. Repeat on JOSH TEST, add an actual alert and backup/restore procedure. **Code fix verified locally; operational gate open.** |
| 3. Printed files may differ from approved templates | Medium / high | Synthetic parser/render tests exist; actual remote ZIP and PSDs have not been opened/edit-saved/reopened in Photoshop or physically approved. | Download the delivered test ZIP, inspect source files and PSD layers/masks/fonts, edit/save/reopen, print covers and labels, and obtain engineer approval. **Open.** |
| 4. Hosted phone and email experience unknown | Medium / medium | Local mobile test passed after a code fix not on Railway; Make email module succeeded but inbox arrival unverified; cloud browser could not use Basic auth. | Apply approved JOSH TEST source pin, have a human tester use desktop and phone with refresh/interruption/large image, and check Josh's inbox including spam for both test messages. **Open.** |
| 5. Production infrastructure and permission boundary absent | Certain / high | Railway project has only JOSH TEST; test OAuth is app-folder scoped but the token's provider permissions are wider than the application root check. No production volume, backup, alert or ingress limiter is verified. | Provision a distinct production environment/service/volume and credentials, restrict access, implement ingress rate limiting, backup/restore, monitored failure queue and separate provider authorization. Verify with synthetic data before enabling customer delivery. **Open.** |
| 6. Repeat delivery and changed/missing references | Low to medium / high | Same submission cached; duplicate binding returned `already_bound`; server rejects conflicting binding and arbitrary folder; worker retries existing archive. Hosted interrupted and adversarial paths are less thoroughly exercised. | Force upload interruption, restart mid-job, duplicate webhook, expired/invalid/foreign references and mismatched order folder in the isolated copy; inspect that one verified archive results and staff can recover. **Partial; further retest required.** |
| 7. Privacy and retention | Medium / medium | Test route fixes name/recipient/root and omits live downstream systems; service has source, layer and project limits, noindex and Basic gate. Failed jobs are now retained to avoid silent loss, which also extends private data retention. | Agree deletion/acknowledgement and restricted backup policy, verify access logs/secret handling and upload validation, measure actual Railway volume headroom during PSD/ZIP rendering and restore. **Open policy/operational gate.** |
| 8. Final CI and hosted gate | Low / medium | Earlier CI failed `ETXTBSY`, and the old UI fixture expected a retired route. Code commit `1b32d97` passed service, UI, acceptance and audit steps on GitHub. | CI runner and fixture fixes are verified on the review branch. Select and deploy the final JOSH TEST SHA, then repeat hosted smoke and mobile tests. **CI resolved; hosted retest open.** |

## Live and test configuration comparison

| Boundary | JOSH TEST | Live/current or proposed production |
| --- | --- | --- |
| Form | Basic gated isolated preview and designer | Current GitHub Pages form remains in use without this handoff |
| Make | Scenario 8084300, test webhook, Josh-only receipt | Customer Intake 4762364 remains active; no integration change applied |
| Orders and billing | No Airtable, invoice, payment or real audio link | Existing intake creates records/folders and performs its normal workflow; changes need inactive-copy tests |
| Dropbox | Fixed JOSH TEST root, verified test ZIP | Separate production root/authorization and tested environment required |
| Exporter | JOSH TEST Railway service/volume, one worker | No production exporter in this project yet |
| Secrets | Server-side test webhook, bind secret, encrypted Dropbox refresh token | New separate production credentials and staff recovery secret to provision securely |

## Proposed release sequence — approval boundary

1. Finish JOSH TEST fixes: apply the final reviewed SHA to the isolated Railway
   service through a valid approval path; check deployment health and
   repeat the hosted mobile and no-artwork journeys. Confirm inbox arrival and
   actual ZIP/Photoshop/print acceptance. Force a failed delivery and verify
   staff visibility, recovery and no double delivery.
2. Snapshot the live form commit and export the active Customer Intake blueprint.
   Provision a **separate** production exporter, volume and credentials with
   delivery disabled. Configure restricted origins, ingress limits, retention,
   backup/restore and alerts. Verify health and a synthetic archive first.
3. Prepare an **inactive** copy of Customer Intake. Preserve existing pricing,
   tracklist, invoice, customer/staff email and no-artwork routes. Add optional
   Artwork Reference input, branch after Dropbox Uploads creation, and trusted
   bind to the actual Airtable record ID and returned Uploads path. Test normal,
   absent-artwork, duplicate and failure/retry cases against isolated records.
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
