# Artwork delivery integration — isolated implementation

This service is not deployed or wired into the live calculator. The production
calculator, approved editor branch and Make scenarios are unchanged.

## Implemented flow

The preview designer sends source images sequentially plus a versioned project;
it never builds print-size per-layer caches or PSDs for the handoff. Source image
reads fail explicitly rather than silently dropping originals. A random per-draft
capability protects each project. A committed project is immutable. The calculator
preview accepts completion messages only from the opened editor window, matching
origin and random session, and adds an opaque Artwork Reference field.

Trusted server/Make logic calls POST /internal/bind with a separate server-side
Bearer secret, the artwork reference, Airtable record ID and actual returned
Dropbox Uploads path. The client cannot choose that path. Conflicting order
bindings are rejected. The worker renders one job at a time in a subprocess,
creates PSDs, reference PNGs, original sources and recovery project in a ZIP,
then delivers the ZIP to Dropbox using upload sessions and a deterministic name.

SQLite WAL and source/output files must share a private persistent volume.
Restarting resumes processing jobs; delivery retries reuse the existing archive.
Three automatic attempts are allowed, after which the job is marked failed.
Staff-only /internal/jobs lists IDs/status/errors without order names or paths;
POST /internal/retry/:id retries failed jobs. User status is capability-protected.
No customer values or provider response bodies are logged.

## Fonts and editability

Three optional bundled font families are added to the preview. New text defaults
to Crosstalk Sans; its regular/bold styles use DejaVu Sans. Serif regular/bold and
Mono regular/bold/italic/bold-italic also have exact native-text mappings. Sans or
Serif italic, legacy system fonts and preset marks using system fonts become
named raster layers. Original wording remains editable in the recovery project.
The deployment font catalogue/migration and cross-device appearance of legacy
fonts remain release gates. Do not describe all customer text as native PSD text.

Photo pixels have separate crop/eraser masks. Shapes/gradients/drawings remain
raster layers. Opacity is metadata, never baked twice. Hidden layers stay hidden.
Labels have a group mask for their outside boundary and centre hole. Native text
uses explicit line breaks, not an auto-reflowing Photoshop paragraph box.
Pixel dimensions/300 PPI are preserved; physical print templates still need approval.

The unchanged print renderer is pinned by Git blob to
d38ee5689fa164ac1cc9c2f0c239ec1b3dac03cf. The raster/mask/text adapter derives from
the separate PSD lab at a503cf851a92c673428571a0aa4b8b2f4933a051. Renderer-only
hooks run remotely, never in the customer upload pipeline.

## Local synthetic checks

Use Node 24, npm ci --ignore-scripts, node build-public.cjs, npm test and
npm run acceptance. The acceptance script renders full 3000px cover / 1146px
labels and delivers two synthetic orders to different local folders. It records
remoteDropboxVerified=false and photoshopVerified=false until independently
tested. Test output contains synthetic artwork only and is gitignored.

The bundled Chromium supports Linux x64; CHROMIUM_EXECUTABLE_PATH can select an
installed browser. Fontconfig must find real fonts; FONTCONFIG_PATH=/etc/fonts
works on Debian. Tests here used the packaged Chromium 141 executable with the
system font configuration. No claim of a successful Docker build is made until
the image has actually built.

Run a local preview with ARTWORK_BIND_SECRET set to a newly generated test secret
(at least 32 characters), ARTWORK_ORIGINS=http://127.0.0.1:4310 and npm start.
Open /calculator-preview.html. The preview removes the real Make endpoint;
submitting cannot create a real order. /designer.html can also be opened directly.
Completion uploads a project but does not queue it until trusted order binding.

## Deployment configuration (not provisioned)

Deploy a dedicated single-instance Node service, not a static GitHub Pages page.
The long-lived SQLite worker needs a persistent disk, bounded concurrency and
about 2 GiB RAM initially, to be measured under representative source photos.
Never run two worker replicas against this volume; no distributed lease exists.

- ARTWORK_BIND_SECRET: new server-only random value; enter through secret settings.
- ARTWORK_ORIGINS: comma-separated exact calculator/editor origins.
- ARTWORK_DATA_DIR: persistent private volume, writable by the Node user.
- ARTWORK_DELIVERY_MODE: dropbox for real delivery; synthetic is rejected in production.
- ARTWORK_DROPBOX_ROOT: /Crosstalk Customs/Orders, or a dedicated test root first.
- DROPBOX_CLIENT_ID / DROPBOX_CLIENT_SECRET / DROPBOX_REFRESH_TOKEN: a securely
  provisioned service connection with files.content.write. Never copy credentials
  out of the inspected scenario or place them in frontend configuration.
- HOST=0.0.0.0 and PORT from the host. Public traffic must use HTTPS.

Use an independent test root and synthetic order IDs for initial remote delivery.
Root path restriction does not narrow a provider token's own Dropbox permissions.
Customer PSD outputs and text/images are private automated data, not assistant
conversation inputs. Back up the private volume with restricted retention/access.

Limits: 40 layers total, 16 distinct source images, 20 MiB per source, 80 MiB per
project, 25 MP per image, 2 MiB project JSON. Draft creation is limited to 20/hour
per directly connected IP, with 100 pending jobs and 2 GiB source-byte capacity.
The service does not trust forwarded IP headers; deploy ingress rate limiting
before public launch. These limits are initial safeguards, not measured phone
acceptance. Final user-facing limits must be checked against normal orders.

## Remaining live release gates

1. Photoshop acceptance by staff, including edit/save/reopen and masks.
2. Full font policy and physical print-template approval.
3. Large-photo, repeated-job, memory and mobile interruption/recovery checks.
4. Private persistent service, HTTPS, ingress limits, backup/restore and retention verification. Draft/ready jobs expire after 24 hours;
   delivered/failed jobs expire after seven days. Cleanup runs hourly. These
   periods must be approved and tested before public customer uploads.
5. Secure provider credentials and real synthetic Dropbox delivery verification.
6. Inactive Make test copy, optional artwork routing, authenticated binding,
   visible failure notification and delivery retry verification.
7. Device interruption/resumption acceptance: session capabilities are retained
   locally, content fingerprints prevent changed designs reusing sealed uploads,
   and repeated source uploads are idempotent. Test on actual target phones.
   New-order reset must clear the calculator order session after confirmed order
   success when the integration is moved to the production form.
8. Move the tested integration into the actual GitHub Pages calculator/editor
   only after checks pass. Do not merge this service as a live form rollout.

## Proposed minimal Make change (not applied)

Keep all existing pricing, tracklist, invoice and email field mappings. Add the
optional Artwork Reference webhook field. The trusted bind request must use:

    POST <private artwork service origin>/internal/bind
    Authorization: Bearer <new ARTWORK_BIND_SECRET>
    Content-Type: application/json

    {
      "reference": "<intake webhook Artwork Reference>",
      "orderId": "<module 2 Airtable record ID>",
      "folder": "<module 27 actual returned Uploads path_display>"
    }

Never derive the folder from a client field or reconstruct its name: module 12
has autorename enabled. Artwork-less orders must retain their existing route and
response. Build/test an inactive copy before selecting the optional routing and
error handling approach; a filter inserted into the existing linear flow can
accidentally prevent its webhook response. Current Make permissions are read-only.

The separate file-request/shared-link discrepancy and credential rotation found
in the audit are not silently changed as part of this integration.

## Private Dropbox authorization setup

Set DROPBOX_CLIENT_ID and sealed DROPBOX_CLIENT_SECRET through Railway.
ARTWORK_PUBLIC_ORIGIN must be the exact HTTPS origin with no trailing slash.
ARTWORK_DROPBOX_SETUP=enabled and a separate random
ARTWORK_DROPBOX_SETUP_SECRET enable the administrator-only setup endpoints.
Register <origin>/oauth/dropbox/callback in the Dropbox App Console.

POST /internal/dropbox/connect using the setup secret returns a ten-minute,
one-use setup URL. Opening it sets a secure HttpOnly SameSite cookie and
redirects to Dropbox. Callback state and cookie must match before exchanging
the authorization code. Only files.content.write and files.metadata.read are
requested. The refresh token is never returned to the browser or API client;
it is encrypted with AES-256-GCM in /data/dropbox-credential.enc, using a key
derived from ARTWORK_BIND_SECRET. Preserve that secret across restarts; rotating
it requires reauthorizing Dropbox. An environment DROPBOX_REFRESH_TOKEN takes
precedence over the stored token. Setup does not enable delivery.

GET /internal/dropbox/status requires the setup secret and reports booleans only.
Disable setup after authorization by setting ARTWORK_DROPBOX_SETUP=disabled.

## Restricted JOSH TEST remote delivery probe

POST /internal/dropbox/test-delivery uses the separate setup secret. It is
rejected unless ARTWORK_TEST_LABEL is exactly JOSH TEST, the configured Dropbox
root is exactly /Crosstalk Customs/JOSH TEST and authorization is present.
It creates/verifies only /Crosstalk Customs/JOSH TEST/JOSH TEST/Uploads, renders
fixed JOSH TEST cover/label artwork, archives it and uploads through the real
delivery adapter. Global delivery mode remains disabled. Repeating the request
reuses the same test job and ZIP and overwrites the same destination file.
GET on the same protected path returns only that test's status/receipt.
Dropbox file path, byte size and content hash must match the local ZIP before
the adapter reports success. The probe must be removed or disabled before
production rollout; it cannot target the production Orders root.
