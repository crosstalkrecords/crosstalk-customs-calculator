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
items, adjust basic styling and layer order, preview completion, and download the
current print-resolution PNG.

## Feedback iteration 1

- Added double-click photo upload from an empty canvas.
- Replaced the ambiguous fill control with a reliable "Use photo as background"
  action.
- Added automatic light/dark first-text colour and remembered text styling.
- Added Side A to Side B label copying.
- Added clear-current and confirmed clear-all controls.
- Added persistent browser recovery using IndexedDB.
- Added high-contrast safe-area guides and warnings for text outside them.
- Added a transparent centre hole to label PNG exports.
- Added explicit per-surface download names.
- Removed customer-facing JSON download and unnecessary production measurements.
- Added kraft-sleeve and record-label previews.
- Added a finish-and-return state ready for later calculator messaging.
- Added mobile bottom controls, larger touch handles and a mobile edit sheet.

## Feedback iteration 2

- Simplified the desktop add-tools panel and removed repeated guidance.
- Added deselection when the customer clicks the grey workspace outside the design.
- Moved empty-label instructions clear of the centre-hole guide.
- Increased the kraft reveal in the finished-cover preview slightly.
- Changed phone guidance to "Tap to add a photo" and enabled a single tap on an
  empty touch canvas; desktop retains double-click behavior.
- Made the phone properties sheet optional behind an Edit button instead of
  opening automatically whenever an item is selected.
- Enlarged the phone resize corner and corrected diagonal drag resizing.
- Let cover and label artwork, including the resize handle, extend visibly beyond
  the print edge while keeping exports cropped to their final shapes.
- Made the copy action contextual: front-cover duplication is labelled for the
  back cover, while Side A-to-B copying appears only in the label workflow.

## Deliberate omissions

- No drawing tools.
- No automatic popups or `window.open()` calls.
- No calculator button, Common Ground embed, tracklist transfer or return-message
  listener yet.
- No direct Dropbox or Make upload yet.
- No PSD generation yet. PSD export will be added only after the editor workflow
  and exact cover/label print templates are validated.

## Planned feedback-driven phases

1. Validate the four-surface workflow, wording and mobile behavior.
2. Confirm exact front/back cover print dimensions and bleed.
3. Add a tested layered PSD/export package pipeline for staff use.
4. Add the optional calculator link, tracklist transfer and return-to-order bridge
   after sandbox approval.

The normal link will be user-initiated and will not depend on scripted popup
behavior. The existing order form will remain usable when the editor is disabled.
