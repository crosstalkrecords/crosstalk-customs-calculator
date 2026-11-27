# Crosstalk Customs dual-URL cutover card — preparation only

**Production HOLD.** Josh accepts roughly five minutes for a Common Ground iframe change. This is the selected *design* for the live route switch; neither its publish timing nor the actual editor steps have been rehearsed. Do not use this card as permission to switch traffic.

**Make recovery checkpoint (27 November 2026).** The organization exhausted its yearly allowance and reported scenarios paused. Josh replenished credits; the API now reports 49,998 unused credits and `isPaused:false`. With Josh's specific approval, JOSH TEST status sweep `8816289` and async intake draft `8715068` were deactivated and independently verified off. Existing Customer Intake `4762364` and invoicing backup `6745352` report active; their webhook queues each held 0 items when checked. The existing Customer Intake's last observed execution was at 2:08 pm Sydney time before the credit interruption, and no post-replenishment live order/invoice run has been observed. An active switch and an empty queue are not a completed end-to-end proof. Confirm those routes with controlled evidence before release. Do not infer from the sweep's 1,602 credits that it caused all 125,000 annual credits to be spent.

**Airtable test checkpoint.** In the separate JOSH TEST base, the Status field now reads `QC → READY FOR ART → Cut Ready → NOTIFIED FOR PICK UP → Completed`, with all original named choice IDs preserved. A test-only customer upload request URL field was added. The production Airtable schema, Make intake and Common Ground embed have not been changed by this rehearsal.

## Keep both forms published and distinct

| Role | Pages file / URL | Rule |
| --- | --- | --- |
| Preserved fallback | `calculator.html` at `https://crosstalkrecords.github.io/crosstalk-customs-calculator/calculator.html` | Leave its exact bytes untouched through the release and rollback window. It continues to submit only to existing Make Customer Intake `4762364`. |
| New candidate | `calculator-production.html` at `https://crosstalkrecords.github.io/crosstalk-customs-calculator/calculator-production.html` | Generate from the reviewed builder, publish on `main` **alongside** the old file only after separate approval, and verify its served digest before changing the iframe. It submits through the distinct gateway and protected Make scenario, never through the old hook. |

Publishing the candidate file is a GitHub Pages build, but it happens **before** the customer route changes. The candidate intake remains disabled while its public file is being published. The old iframe continues to point to `calculator.html` throughout preparation.

## Cutover after all gates pass and Josh gives specific approval

1. Capture the old served Pages bytes, the Common Ground page's current iframe `src` and published page state, original Make status/hook, gateway deployment, ledger, Airtable schema and Dropbox root in the restricted release manifest. Record the exact Common Ground editor path and who can publish it.
2. Confirm the new file is already served with the expected digest, the full Make/Dropbox/Airtable order flow has passed its isolated rehearsal, and the protected gateway is configured. Keep the old Make hook active. Enable new intake only as part of the controlled switch sequence; never route one form to both intakes.
3. Change **only** the Common Ground iframe `src` from the preserved old URL to the verified new URL, publish, and observe the served page and one controlled new-route order. Record the time until the served iframe changes. Do not treat an editor save as proof of publication.

## Primary reversal if the candidate fails

1. Attempt to pause new candidate intake. If the gateway is down or the pause is unconfirmed, continue the iframe reversal and mark candidate order count **unknown**. Already accepted orders and artwork jobs must keep draining or be reconciled; do not delete them.
2. In the same recorded Common Ground editor control, set the iframe `src` back to the **unchanged** old `calculator.html` URL above. Publish.
3. Inspect the served Common Ground page until its iframe points to that exact old URL; load the old form and verify the original Make scenario remains active on hook `2620320`. Allow for customers with an already loaded new page during propagation: a paused gateway must fail closed, and staff must reconcile their submission IDs.
4. Read the candidate ledger, including orders whose intake completed but artwork delivery has not been proven. Reconcile Airtable rows, Dropbox folders/ZIPs and Outlook notices. Never retry an uncertain order blindly or undo a legitimate Stripe invoice.

The above is a **one-field human editor reversal**. It avoids another GitHub Pages publication during the primary rollback. Josh says iframe edits normally take about five minutes; measure this in a safe-page rehearsal and do not guarantee the time beforehand. The procedure cannot be called a one-command rollback unless a supported, authenticated Common Ground edit API is identified and rehearsed.

## Secondary recovery

`./ops/rollback-production.sh /restricted/crosstalk-release-<id>/manifest.json` checks or restores the old Pages file if it was unexpectedly overwritten, and reports candidate order IDs. **It does not change the Common Ground iframe.** It still lacks a real release manifest, operator credentials and an isolated published rehearsal; do not hand it to staff as a ready emergency command. Keep the old Make hook and original renderer available until the rollback window and all old drafts/jobs have closed.
