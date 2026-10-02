# Crosstalk Customs artwork editor sandbox

This branch contains an isolated customer-facing artwork editor prototype at
`artwork-editor-sandbox.html`.

## Safety boundary

- `calculator.html` is unchanged.
- `easy-track-builder-sandbox.html` is unchanged.
- No Make, Airtable, Dropbox, pricing, submission, confirmation-email or hidden
  form-field behavior is connected to the editor.
- Uploaded artwork is processed in the customer's browser. The sandbox makes no
  artwork-upload network requests.

## First milestone

The prototype supports four design surfaces:

1. Front cover (3000 x 3000 px)
2. Back cover (3000 x 3000 px)
3. Label A (97 mm at 300 DPI)
4. Label B (97 mm at 300 DPI)

Customers can upload PNG, JPEG and WebP images, add text, move, resize and rotate
items, adjust basic styling and layer order, preview completion, download the
current print-resolution PNG, and download a versioned layered Crosstalk project
JSON file.

## Deliberate omissions

- No drawing tools.
- No automatic popups or `window.open()` calls.
- No calculator button or Common Ground embed yet.
- No direct Dropbox or Make upload yet.
- No PSD generation yet. PSD export will be added only after the editor workflow
  and exact cover/label print templates are validated.

## Planned feedback-driven phases

1. Validate the four-surface workflow, wording and mobile behavior.
2. Confirm exact front/back cover print dimensions and bleed.
3. Add project reopening and durable browser recovery.
4. Add a tested layered PSD export pipeline while retaining PNG + project JSON.
5. Add an optional, normal hyperlink from the calculator after sandbox approval.

The normal link will be user-initiated and will not depend on scripted popup
behavior. The existing order form will remain usable when the editor is disabled.
