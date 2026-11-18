# JOSH TEST delivery checkpoint

Nothing in the current live calculator or Make intake is changed by this branch.
All outward-facing test customer names, artwork titles, order notes, scenario
names, notification subjects and folder descriptions must say JOSH TEST. Use
Josh's verified contact details only; never invent an email address or use a
customer's details. Any automated customer/staff notification must be explicitly
identified as JOSH TEST. Do not submit the live intake webhook for a connectivity
check: it creates Airtable records, folders and sends emails.

## Isolated hosting

Railway project: Crosstalk Customs Artwork
Environment/service: JOSH TEST / JOSH TEST artwork exporter
Persistent mount: /data; one replica and one serial renderer.
Delivery starts disabled; Dropbox test root: /Crosstalk Customs/JOSH TEST.
ARTWORK_TEST_LABEL=JOSH TEST labels test ZIP names and README contents.
The deployment is pinned to a reviewed commit rather than following branch pushes.
No Dropbox credentials have been provisioned.

## Make preparation and activation boundary

The connection currently exposes read-only tools. Prepare the following in a
separate, inactive copy named JOSH TEST artwork delivery before changing intake.
The copy must have a separate test webhook; never reuse the live webhook ID.
Keep invoice creation and customer emails out of the first delivery-only test.

The reviewed intake creates the Airtable record in module 2, order folder in
module 12 and Uploads folder in module 27. Use module 27.path_display as the
binding destination, because module 12 allows automatic folder renaming.

After Uploads exists, the optional artwork branch should call POST
<exporter-origin>/internal/bind with a NEW secret stored in a private Make
connection, never inside a portable blueprint or browser code:

    Authorization: Bearer <private binding secret>
    Content-Type: application/json

    {
      "reference": "<webhook Artwork Reference>",
      "orderId": "<module 2 Airtable record id>",
      "folder": "<module 27 path_display>"
    }

Route only nonempty Artwork Reference values to binding; orders without artwork
must still reach their existing success response. Do not put an artwork-required
filter inline across the entire intake. Preserve any existing response route.
Do not swallow binding failures as successful delivery: retain a retryable work
item and mark it for staff follow-up. A 202 means queued, not delivered.

## Remote acceptance

1. Create a dedicated JOSH TEST order folder with Uploads under the test root.
2. Upload JOSH TEST artwork through the isolated preview, bind the returned
   reference to that exact folder, then wait for delivered status.
3. Confirm one JOSH TEST ZIP exists in that folder; verify returned Dropbox
   metadata and download the ZIP for hash/PSD checks.
4. Repeat the same bind and check there is still exactly one ZIP.
5. Restart the service with a queued test job and confirm delivery resumes.
6. Attempt a conflicting order/folder binding and verify it is rejected.
7. Only then review the live Make change and calculator switch for activation.

A mock Dropbox session test verifies byte offsets, Unicode paths, bounded chunk
sizes, overwrite behavior and JOSH TEST naming. It does not establish actual
Dropbox authentication, remote permissions or end-to-end delivery.
