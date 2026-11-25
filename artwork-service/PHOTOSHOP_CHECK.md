# Photoshop check — start here

## JOB362 customer-journey archive (25 November)

Use the ZIP named `JOSH TEST-77277d4e8b6f3c6cabe7010ecb25be40.zip` from
JOB362's isolated Uploads folder. This is a dummy order, not the separate
synthetic editable-text fixture described below.

1. Extract it and open `front.psd`, `back.psd`, `labelA.psd` and `labelB.psd` in
   Photoshop. Keep their layers and masks. Note any warnings or missing fonts.
2. Compare each document with its matching `*-reference.png`. The covers are
   3000 × 3000 pixels; the labels are 1146 × 1146 with transparent outside
   and spindle hole. All four declare 300 PPI.
3. Toggle a photo/image layer and a label mask, then restore them. Save a copy
   of each PSD, close it, reopen it and confirm the layers, transparency and
   appearance survive. Do not overwrite the delivered originals.
4. Label A and B are byte-identical in this dummy export. Confirm that this
   reflects the submitted design; flag it if different sides were intended.
5. Print a cover and both labels using the actual production templates and
   media. Have the cutting engineer confirm physical sizing, bleed, crop,
   spindle-hole alignment and legibility before live release.

The automated check passed ZIP CRC, PSD parsing and pixel comparison against
the references. This particular dummy has no native editable text layers, so
use the separate fixture below to test text editing.

The following synthetic fixture has no customer information. It tests the new
server-rendered output and native text editing. Neither fixture is a claim that
Adobe Photoshop has passed yet.

## First: just open the cover

1. Extract this ZIP in Windows (right-click the ZIP, then Extract All).
2. Open Photoshop. Press Ctrl+O and choose front.psd from the extracted folder.
3. If a warning appears, take a screenshot before choosing an option. Keep the
   layered document; do not flatten or rasterize it to get past a warning.
4. Show a screenshot of the full Photoshop window. The intended design is also
   in front-reference.png: white heading, white editable line, rotated photograph
   with an erased stripe, a translucent gradient circle and rotated mono text.

That first screenshot is enough to start. The later checks can be done together.

## Then: prove text really edits

The Fonts folder contains the exact fonts used, with their licence. If Photoshop
reports missing fonts, install the provided TTF fonts through Windows and reopen
the original PSD before comparing text. Avoid substituting fonts for this test.

1. In Photoshop, choose Window > Layers if the Layers panel is hidden.
2. Find Please change this line. Its thumbnail should show a T icon.
3. Double-click that T thumbnail, select the wording, and type Hello Josh.
4. Click another layer to commit the edit. Show a screenshot.
5. Leave Preview backup layers hidden. They are recovery images, not additional
   text to display on top of the native text.

Adobe instructions: https://helpx.adobe.com/photoshop/using/editing-text.html
Missing fonts: https://helpx.adobe.com/photoshop/desktop/text-typography/select-manage-fonts/replace-missing-fonts.html

## Later checks

- Toggle the eye beside HIDDEN green test layer: it should start hidden and
  appear only when enabled. Hide it again.
- Select Gradient at 45 percent opacity and check its opacity. Changing it should
  fade that layer independently.
- The photo layer has a separate mask thumbnail. Shift-clicking the mask should
  disable it temporarily and reveal cropped/erased photo areas. Shift-click again
  to restore it. Ask for guidance before doing this if the thumbnails are unclear.
- Save a COPY as front-photoshop-check.psd with layers retained. Close the copy,
  reopen it and confirm Hello Josh and the layers remain.
- Open labelA.psd separately. It should be circular with a transparent outside
  and centre hole; expand its layer group to find its two text layers and photo.

The reference PNGs are appearance references. Native text redraw can differ
slightly between rendering engines; a successful open alone does not establish
that edits, masks and save/reopen work correctly.
