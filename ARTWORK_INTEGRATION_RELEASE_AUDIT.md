# Artwork integration release audit — 18 October 2026

Status: blocked for automatic production delivery. No live customer order was submitted during this audit. No customer records or Dropbox files were inspected.

## Pinned source and hosting

- Production main: `0067976c8ad9d5853a4829f64847eaee795101cb`.
- Approved editor PR #20: `d5b75f9e6ffd98ff134a576657f88c0d53b717c2`; editor blob `d38ee5689fa164ac1cc9c2f0c239ec1b3dac03cf`.
- PSD lab: branch `artwork-psd-export-lab-20261014`, commit `a503cf851a92c673428571a0aa4b8b2f4933a051`.
- The public Customs page embeds `https://crosstalkrecords.github.io/crosstalk-customs-calculator/calculator.html`. Its inline script matched the fetched main calculator exactly.
- Vercel hosts the related API project `crosstalk-playlist-importer`; deploying that project alone does not update the GitHub Pages form.
- Approved editor and current calculator JavaScript parse successfully. Neither has duplicate static DOM IDs. These checks are not an end-to-end integration test.

## Findings

| Area | Evidence | Release implication |
| --- | --- | --- |
| Completion | `completeArtwork()` saves locally and posts only surface IDs to its opener | No artwork reaches the order |
| Order submission | Existing form POSTs FormData to Make and reads `upload_link`; no artwork/project upload fields | Existing upload link does not establish a machine upload API or trusted folder association |
| PSD | Approved editor exports PNG ZIP; PSD converter is separate lab code | A production worker and handoff are still required |
| Fonts | Lab adapter recognises only its exact Lab font names; approved editor uses different/system font stacks | Native editable text is not established for current customer font choices |
| ZIP | Manifest omits visibility and opacity; opacity is baked into PNGs; hidden layers are exported | Importing all numbered layers cannot reconstruct editable state reliably |
| Original uploads | Export catches source-read failures and silently skips originals | A successful ZIP download does not prove all originals were preserved |
| Phone memory | ZIP generation rasterizes all full-size layers on device | Do not use this as the automatic mobile delivery pipeline |
| Receiving service | No environment variables on the inspected Vercel project; no production artwork receiver/worker identified in main | Credentials, durable job storage and delivery configuration are not provisioned here |

The prior lab report establishes synthetic PSD open/edit/save/reopen in Photopea,
including masks, layer order, hidden state and selected native text. It does not
establish Adobe Photoshop acceptance or automatic order delivery. Reported server
conversion peak was about 850 MiB RSS, and the 40-layer fixture took about 69
seconds. The lab consumes full-resolution browser-generated caches; replacing
that with server rendering is implementation work, not a configuration switch.

## Required production flow

1. Save versioned editable project state and original source assets to private
   durable storage, with bounded uploads and explicit failure reporting.
2. Pass an opaque artwork reference with the existing order submission. Preserve
   existing pricing, tracklist, invoice and email mappings.
3. Have trusted Make/server logic associate the accepted order and its private
   Dropbox folder with that artwork reference. Never trust a browser-supplied
   folder path or treat a Dropbox file-request URL as a write credential.
4. A server worker retrieves the project, renders with pinned fonts, generates
   PSDs plus recovery project/originals, and uploads into that exact folder.
5. Record queued, processing, delivered or failed states. Retry idempotently;
   expose a staff-visible failure and do not mark delivery complete prematurely.
6. Release only after the synthetic end-to-end acceptance below.

Private source assets and customer details must not pass through assistant
conversation logs. Provider credentials belong in server-side secret
configuration, never frontend code.

## Connection/configuration needed

The Make connection is not available to this session. Dropbox is not connected.
Before implementing against the existing flow, obtain configuration-only access
to the scenario, or a sanitised blueprint without credentials, execution bundles
or customer records. Specifically establish:
- the create-folder module's trusted output and order reference;
- existing webhook response schema and when it is returned;
- how Make can accept an opaque artwork reference and authenticate a server job;
- a dedicated synthetic test folder and a secure server-side Dropbox connection.

A general Dropbox file-browsing connection alone does not provision an unattended
worker or identify the order-to-folder mapping.

## Synthetic release acceptance

- Two simultaneous synthetic orders deliver only into their respective private
  test folders; retries create no duplicate orders or output sets.
- A phone-sized browser hands off state and sources without building print-size
  layer caches or PSDs. Refresh/resume and interrupted upload retain the draft.
- Worker outputs cover and label PSDs, originals and recoverable project state;
  no missing assets, hidden-layer changes or opacity double application.
- Exact font policy and physical print dimensions are verified. Representative
  PSDs open in the staff's target editor and preserve required editability.
- Large photographs, repeated jobs, timeout, failed conversion and failed
  Dropbox upload produce recoverable status and visible errors.
- Repeated completion/submission and lost responses do not silently lose artwork.
- Existing order, pricing, tracklist, invoice and confirmation behavior remains
  correct using an isolated test scenario, without sending customer email.
- GitHub Pages serving commit is verified after deployment; rollback is ready.

Automatic delivery is the user's requirement. Manual ZIP download followed by
customer upload is not an approved substitute for this release.
