# JOSH TEST intake no-response-module candidate

**Status: prepared, not applied.** Automatic approval review rejected the
blueprint replacement because removing response/error handlers can change
failure behavior and explicitly disallowed a workaround. The live Customs form,
live Customer Intake, and isolated scenario 8715068 were not changed. This plan
is for a specific approval of the isolated change and a new controlled test;
it is not a go-live approval request.

Scenario 8715068 is inactive, immediate, sequential, and confidential. The protected webhook, all other module mappings, connections, filters, Airtable claim, Dropbox checks, email modules, outcome callbacks, and scheduling remain unchanged.

| Location | Delete | Preserve |
| --- | --- | --- |
| Airtable claim search module 5 error handler | Webhook response 40 (503) | Commit 41 |
| Airtable get module 6 error handler | Webhook response 42 (503) | Commit 43 |
| Airtable sparse claim update module 8 error handler | Webhook response 44 (503) | Commit 45 |
| Fresh claim path | Webhook response 100 (202) | Module 8 directly followed by module 10 onward |
| Existing or changed claim branch | Webhook response 9 (409) | Branch filter; resulting route is empty |
| Invalid payload branch | Webhook response 4 (422) | Branch filter; resulting route is empty |

The two empty routes have no downstream side effect. Their former HTTP error response becomes Make's default queue acknowledgement. The exporter must treat that acknowledgement as queued and unclaimed, then require a trusted final callback; an unclaimed timeout must surface for staff manual review with no automatic redispatch. A queue 200 cannot be reported as an Airtable claim or delivery.

The structural backup omits all mapper values, parameter values, and filter conditions. Before changing Make, fetch the current blueprint again and compare module IDs, route positions, and scenario flags to this snapshot. Preserve the original full blueprint transiently in the Make tool session for rollback; do not commit/export credential-bearing blueprint data.

The exporter at review commit `424e6f7` accepts only an exact Make default
HTTP 200 body `Accepted` as queued, with no Airtable claim; an authenticated
final callback must pin the record. Focused tests passed 7/7. This code is
deployed only in Railway JOSH TEST with delivery mode disabled.

After explicit approval of this isolated Make edit, validate the scenario is
still inactive, immediate, sequential and confidential. Apply the six removals,
read back every route and connection, and run one new Josh-only hosted form
order in a controlled window. Confirm a clean Make execution, exactly one
isolated Airtable row and email pair, a verified ZIP, final status reconciliation,
and no live, invoice or payment effect. Test rejected/duplicate payloads and
stalled queue recovery. Keep the scenario inactive outside the test window.

If validation or the controlled run fails, deactivate the scenario, disable
Railway JOSH TEST delivery, restore the original full blueprint from its saved
version, and verify the original module IDs and inactive/confidential flags.
Do not retry an ambiguous submission blindly; reconcile its Airtable row and
side effects first. The old structured acknowledgement remains supported by
the deployed exporter for this rollback.
