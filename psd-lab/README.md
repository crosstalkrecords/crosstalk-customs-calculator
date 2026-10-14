# PSD compatibility experiment — 14 October 2026

This lab is separate from the approved artwork designer at commit
`d5b75f9e6ffd98ff134a576657f88c0d53b717c2`. No editor, calculator, Make, Airtable,
Dropbox or ordering code is modified or connected. Fixtures use synthetic shapes
and text, not customer artwork. This is not a production exporter.

## What was actually demonstrated

| Fixture | Photopea open / native edit / PSD save / reopen | Independent output inspection |
| --- | --- | --- |
| 640 px cover, native outline | Pass | Edited text, font, opacity, hidden layers, order, original photo and mask pixels, outline retained |
| 3000 px cover, no outline | Pass | Edited text, font, opacity, hidden layers, order, original photo and mask pixels retained |
| 1146 px label, no outline | Pass | Same checks plus exact circular group-mask pixels retained |
| 3000 px cover, integer-width native outline | Pass | Same checks plus native outline retained |
| 1146 px label, integer-width native outline | Pass | Same checks plus native outline and exact circular group mask retained |

The native text was changed to `EDITABLE SUCCESS` / `SIDE A`, opacity was changed
from approximately 25% to 40%, and Photopea's exported PSD was then reopened in
Photopea. The downloaded output was independently parsed using ag-psd. Layer
names/order/hidden states were asserted; original image and eraser-mask RGBA
arrays were compared exactly. Label group masks include the circle and centre
hole and were also compared exactly. Output retains 300 PPI metadata.

The gradient background is a pixel layer in these fixtures; native editable
gradient fills or vector shapes have not been established by this experiment.
One real font (`DejaVuSans`) was tested. A hidden raster text backup is retained,
but automatic receiving-side missing-font detection/switching is not implemented.

## Findings and compatibility boundaries

- A successful same-library write/read check alone is insufficient. The first
  print-size fixtures passed that check but triggered Photopea rendering errors.
- PSD pixel rectangle origins are normalized to whole pixels before serialization.
  Editable text transformation matrices remain separate from those pixel caches.
- Fractional native stroke widths caused Photopea `Int32Array` alignment errors
  on the print-size fixture. Removing only the stroke allowed a round trip;
  rounding its width to whole output pixels then restored a successful native
  outline round trip. This is observed Photopea behavior, not a demonstrated
  Adobe Photoshop defect.
- Layer opacity is metadata on the original layer. It is not baked into the
  pixel image as well, which would apply the opacity twice.
- Photopea changed the physical ruler display unit from inches to centimetres
  while retaining 300 PPI and pixel dimensions. Ruler units must not be mistaken
  for a physical-scale change. Actual cover dimensions still require the print
  template specification; merely setting 300 PPI is not template validation.
- Source files served through a large tool response were initially truncated;
  uploads were repaired using bounded chunks and verified against local Git blob
  hashes. Branch URLs were also cached by the preview host. Use immutable commit
  paths for repeatable fixtures and tests.
- Direct file chooser/save commands did not complete in the cloud browser.
  Photopea's documented iframe messaging API allowed loading synthetic URLs,
  retrieving PSD bytes locally, reopening the resulting bytes, and downloading
  through the test harness. No new server upload endpoint was introduced.

## Reproduce

1. `npm ci --ignore-scripts`
2. `node fixtures.cjs` (fixture generation uses an installed DejaVu Sans font at
   `/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf`; configure this for other OSes)
3. `node variants.cjs`
4. Open `index.html` from a web origin, choose a fixture, wait for the named file
   to finish opening in the iframe, choose Edit text and opacity, then Export,
   verify and reopen PSD. Download the Photopea output.
5. `node verify-photopea.cjs generated/cover-print-integer-outline.psd output.psd`
   (substitute the matching original fixture for each output)

`index.html` checks the Photopea message origin and source window. It sends only
fixed lab scripts and loads immutable, synthetic fixture URLs. Its PSD-header
check is deliberately basic; the separate Node verifier performs the deeper
structure and pixel-array checks. Lab readiness after an open script is not proof
that the asynchronous remote file has finished loading: wait for its document tab.

## Not yet verified / next gates

- Mapping real editor state to PSD native text and reversible source-photo masks.
- A fixed licensed font set, exact versions, real bold/italic mapping, line wraps,
  alignment, tracking, rotation, accents and all preset symbols.
- Pixel comparison against the actual approved editor print render. These synthetic
  fixtures establish editability and preservation, not complete visual parity.
- Native editable vector shapes, editable gradient fills, and Photoshop smart objects.
- Larger photo/layer-count stress cases and staff-side project transfer.
- Adobe desktop Photoshop compatibility. Photopea results are useful independent
  evidence, but do not establish Adobe-specific font/layout/engine behavior.

Decision: continue with direct PSD export experiments. Native editable text and
reversible masks are demonstrated at the current print pixel sizes without user
manual testing; integration remains gated on the real-editor conversion and
broader typography/visual-fidelity checks. Keep the approved designer unchanged.

## Fresh-session recheck after interrupted response

Repeated both integer-outline fixtures in a fresh cloud-browser session on
14 October 2026. The 3000 x 3000 cover and 1146 x 1146 label each completed
native text/opacity editing, PSD export and reopen. New downloads independently
passed `verify-photopea.cjs`: original photo and eraser-mask pixels exact,
label circle/hole mask exact, native outline retained, six layers in order,
two hidden layers, edited text, 40% opacity and 300 PPI.

One browser iframe renderer crashed after accumulating the small cover, full
cover and reopened cover while moving to the label test. Reloading the lab
and testing the label in a clean session succeeded. This is a reproducible
test-session observation, not an established diagnosis of memory exhaustion
or a demonstrated PSD defect. Large layer-count/memory stress testing remains
outstanding; do not infer reliability from these small six-layer fixtures.

Repository comparison against the approved baseline confirmed that all lab
changes are confined to `psd-lab/`; the approved editor and production files
are unchanged.

## Stage 2: actual editor state, typography, parity and stress

The next check set is complete. See [STAGE2_RESULTS.md](STAGE2_RESULTS.md) and
`stage2-evidence.json` for the stronger current evidence: real approved-renderer
references, four exact fonts, forced native text redraw, reversible crop/eraser
masks, raster fallback, cover/label roundtrips and a forty-layer design. The
stage-one "one font" and "real-editor mapping unverified" limits above describe
that earlier synthetic-fixture stage, not the new bounded adapter.

The approved editor and live order workflow still have no PSD export integration.
The lab pipeline is for staff/remote computers, not customer phones. Current
limitations include explicit line breaks rather than paragraph reflow, raster
shapes/gradients, an unfinished font catalogue and project handoff, and no Adobe
Photoshop acceptance. Do not advertise this experiment as production-ready.

