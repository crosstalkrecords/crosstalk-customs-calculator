# Photoshop check — start here

These are synthetic designs, with no customer information. They test the new
server-rendered output. They are not a claim that Adobe Photoshop has passed yet.

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
