# Editor-state PSD checks — 14 October 2026

Decision: proceed with a bounded staff-side PSD exporter. The checked conversion
is viable in Photopea. It is still a lab adapter, not production order integration
or proof of Adobe Photoshop compatibility. No checking was required on the user's
phone or work computer.

## Scope and evidence

The real approved editor was pinned to commit
`d5b75f9e6ffd98ff134a576657f88c0d53b717c2`, Git blob
`d38ee5689fa164ac1cc9c2f0c239ec1b3dac03cf`. Its unchanged print-rendering functions
produced synthetic reference designs and per-layer caches in a generated lab-only
copy. The adapter then translated that editor state to real PSDs. Photopea opened,
rendered, edited, saved and reopened them. Downloaded output was independently
parsed; a same-library write/read check was not used as the final evidence.

| Design | Editor / PSD layers | Native text | Save/reopen and independent checks |
| --- | --- | --- | --- |
| 3000 x 3000 cover | 10 / 17 | 5 | Pass |
| 1146 x 1146 circular label | 7 / 12 | 3 | Pass |
| 3000 x 3000 stress design | 40 / 41 | 0 | Pass |

Additional PSD layers are hidden text preview backups, an untouched original
upload and the background. The label also has a native group mask for its circle
and centre hole. Photo source pixels in the active layer are positioned/resampled
for the document, with crop and eraser masks kept separate. The hidden source
upload preserves the original 960 x 640 synthetic image pixels; this is not a
Photoshop smart object or a lossless editable rotation/resize transform.

Verified roundtrip invariants: dimensions, 300 PPI metadata, layer names/order,
hidden states, raster pixels, photo-mask pixels and rectangle, label-mask pixels,
edited native wording, exact font name, alignment, tracking, leading, rotation/
placement matrix and native outline width where present. Original uploads and
raster preview backups were unchanged by editing native text. Opacity changes
survived as editable metadata, with the normal 8-bit PSD opacity quantization.

Disabling the photo mask in Photopea revealed both cropped and erased areas;
re-enabling it restored the mask. The disabled-mask render differed substantially
from the approved reference (11.35% of pixels differed by more than 16 channel
levels), rather than merely changing a flag with no visible effect.

## Typography and visual comparison

Four exact, licensed lab font files were loaded in both the browser renderer and
Photopea: DejaVu Sans regular, Sans bold, Serif regular and Sans Mono oblique.
They are explicit character subsets, with the license included. They are lab test
fonts, not a final customer font catalogue. Tested text includes left/centre/right
alignment, 0.06 em spacing, -8 degree rotation, real bold/italic font faces, an
outline, accents, music/fraction/Greek symbols, and three wrapped lines.

The native-text redraw test deliberately changes each text item's wording and
changes it back before comparing pixels. This forces Photopea to generate text
from its metadata rather than simply displaying the original bitmap cache.

| Comparison to approved browser print render | Mean absolute RGBA error, 0–255 | Pixels with any channel error >16 |
| --- | --- | --- |
| Cover, after native text redraw and tracking correction | 0.28284 | 0.3125% |
| Label, after native text redraw and boundary correction | 0.21541 | 0.3880% |
| Cover, explicit raster text backups | 0.04303 | 0% |
| Forty-layer design | 0.13662 | 0% |

These are near matches, not pixel-identical native text. Initial cached text looked
closer; the redraw test is the stronger evidence. Native outline rasterization is
the largest remaining cover text difference. The fallback retains the approved
appearance more closely. These measurements are observations, not a universal
acceptance threshold for every future design.

The checks found and fixed two general conversion errors: trailing letter spacing
had shifted centred text by roughly 3 output pixels, and the circular label
boundary had been applied to both background pixels and the group mask. The
corrected label alpha mean error is 0.000646, down from 0.119887. The earlier rule
of integer pixel rectangles and whole-output-pixel effect widths also remains.

Unverified legacy/system font strings are exported as named raster layers, with
their original wording/font in conversion metadata. Native text has a separate
hidden raster preview backup. Manually switching to those backups was tested.
Automatic font-availability detection in a staff Photoshop installation and
automatic switching after a missing-font warning are not implemented.

Native text uses horizontal point text with explicit line breaks matching the
browser's initial wraps. Editing words does not give a Photoshop paragraph box
that automatically reflows exactly like the web editor. Shapes, their gradients
and drawings remain separate raster layers, so they can be moved/resized/faded
independently; they are not native editable vector shapes or gradient fills.

## Memory and reliability

The remote staff-side Node conversion of the baseline bundle peaked at 850 MiB
process RSS. Conversions took approximately 27.4 seconds for the cover, 2.7 seconds
for the label and 68.9 seconds for the 40-layer design. Files were approximately
35.1 MB, 6.3 MB and 38.6 MB before the boundary correction; the corrected label is
6.86 MB. This is an unoptimized QA pipeline containing full-resolution reference
caches. It is not a phone-memory measurement or an estimate for all designs.

The forty-layer Photopea open/render/save/reopen succeeded in a clean session.
Each document was processed separately and closed before the next session.
Photopea/browser peak memory was not measured. Larger source photographs,
photo-heavy layer counts, repeated jobs and low-memory machines remain untested.

Recommendation: customers hand off lightweight editable project state and source
uploads; work computers or a server generate the PSD sequentially. Avoid asking
customer phones to build these full-resolution raster caches and PSDs. That
handoff and an operational staff exporter still need implementation.

## Reproduce

1. Install pinned `package-lock.json` dependencies with `npm ci --ignore-scripts`.
2. Place the pinned approved `artwork-editor-sandbox.html` one directory above
   this lab; run `node build-editor-checks.cjs`. Its blob guard prevents drift.
3. Serve/open `editor-checks.html`, then Render test bundle. It loads the exact
   committed font resources and produces synthetic references with actual editor
   functions. This heavy test is for a staff/remote computer only.
4. Run `node convert-editor-bundle.cjs bundle.json`; optionally append `cover`,
   `label` or `stress` to regenerate just one fixture.
5. Open `editor-roundtrip.html` in a clean browser session, load a generated PSD,
   redraw native text, render/download PNG, edit text/opacity, save/reopen/download
   PSD. Use the mask and fallback controls for their separate checks.
6. Run `node verify-editor-roundtrip.cjs original.psd photopea-output.psd` and
   `python3 compare-render.py reference.png photopea-render.png`.

`stage2-evidence.json` records the results and SHA-256 hashes of the verified files.
Large generated PSDs and browser-reference bundles are reproducible local test
outputs, not files loaded by the customer editor. Only `psd-lab/` changed.

## Remaining production gates

- Lightweight customer-project and original-upload handoff to the staff exporter.
- Final licensed full font catalogue and rollout/migration from existing system
  stacks; complete bold/italic combinations and broader characters.
- Native paragraph text if exact automatic post-edit reflow is required.
- Native vector/gradient editing if staff need geometry/fill editing in Photoshop.
- Large-photo and repeated-job memory tests plus graceful resource limits.
- Actual physical print-template dimensions; current editor pixel sizes/300 PPI
  are preserved but do not validate paper/label cut dimensions.
- Adobe Photoshop-specific acceptance. Photopea establishes useful independent
  compatibility, not Adobe engine behavior.

The approved designer, calculator, track builder, Make/Airtable/Dropbox flows,
pricing and production branch are unchanged.
