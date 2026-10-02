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
- Moved the Side A-to-B duplication action onto the Side A screen and simplified
  its wording.
- Added a lightweight visual-system pass for typography, spacing, button weight
  and panel hierarchy.
- Added a live four-surface preview to the desktop right panel using only the
  artwork already supplied by the customer.
- Changed record mockups to translucent clear vinyl with subtle groove lines.
- Made both the right-panel and finish-screen previews navigable: double-clicking
  a surface returns to its full-size design screen.
- Removed the active-surface PNG download from the finish panel so completion is
  treated as one artwork project rather than four unrelated files.

## Mobile interaction and polish pass

- Added two-finger pinch resizing for the selected artwork as an alternative to
  the large corner handle.
- Made Add Text open the text controls immediately on touch devices, with the
  placeholder selected and ready to replace.
- Added a visible delete handle on selected items plus a persistent mobile
  Delete control.
- Added mobile Redo alongside Undo.
- Changed browser recovery so every visit opens on a clean design. If previous
  work exists, the customer can explicitly restore it from a small recovery
  prompt or discard it and start fresh.
- Added Side A-to-B and Side B-to-A label duplication controls on mobile.
- Made finished previews single-tap navigation targets. On touch devices, a
  press-and-hold temporarily enlarges the preview until the customer lets go.
- Increased mobile touch targets and simplified the bottom toolbar while keeping
  Finish visible in the header.

## Desktop preview and type pass

- Changed the desktop live-project cards so one click opens a large finished
  product preview with the kraft sleeve or translucent clear-vinyl treatment.
- Added a separate "Edit this design" action inside the large preview so preview
  and navigation are no longer conflated.
- Added restrained mouse-wheel zoom while the pointer is over the design canvas.
- Expanded the built-in font list using browser/system fonts only, avoiding
  third-party font loading and keeping the editor functional offline.
- Reviewed third-party "33 / STEREO" graphics and deliberately did not bundle a
  commercial or trademarked design. Original editable record-mark presets are
  the recommended next step.

## Record marks and editing pass

- Added an original record-mark chooser on desktop and mobile with editable
  `33⅓ RPM`, `45 RPM`, `STEREO`, `MONO`, `LONG PLAY`, `SIDE A` and `SIDE B`
  presets.
- Implemented every mark as a normal text layer, so customers can change its
  wording, font, colour, size, position and layer order without external assets.
- Added direct double-click text editing on the design canvas.
- Refined the clear-vinyl previews with lighter transparent tones, reflected
  highlights, subtler grooves and a visible backdrop in the large preview.

## Dedicated phone layout pass

- Kept the canvas and its large corner controls inside 320–430 px phone widths,
  preventing horizontal page drift while preserving artwork beyond the print edge.
- Added dynamic-viewport and safe-area handling for mobile browser chrome and
  notched devices.
- Turned the selected-item editor into a contained bottom sheet with a visual
  handle, keyboard-safe height and internal scrolling.
- Set form controls to a phone-safe 16 px size to avoid unintended iOS zoom and
  increased close, action and surface-tab targets to at least 44 px.
- Combined record-mark and duplicate-design actions into a compact responsive row
  so they use less vertical space without becoming difficult to tap.
- Stacked modal actions on narrow screens, tightened empty-canvas copy and moved
  transient messages above the fixed mobile toolbar.

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
