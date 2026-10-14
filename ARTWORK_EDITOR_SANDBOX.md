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

## Phone escape and editing-logic pass

- Isolated oversized artwork inside the canvas stacking context so an expanded
  photo can no longer cover or disable the fixed phone controls.
- Added a small persistent phone control pill for Back, Undo and closing the
  current selection or panel, including while artwork extends beyond the canvas.
- Kept the phone header and surface tabs visible while scrolling and raised the
  fixed toolbar above artwork layers.
- Added touch double-tap editing for existing text while retaining the optional
  Edit button and long-press shortcut.
- Made corner dragging and two-finger resizing scale text and its bounding box
  together.
- Added simple non-destructive photo controls for crop zoom, horizontal and
  vertical crop position, brightness, contrast, colour saturation and hue.
- Applied the same photo crop and adjustment settings to previews and exported
  artwork, not just the editor display.
- Added thin alignment guides and gentle snapping to the canvas and other layers'
  edges and centres, with a short vibration tick where the phone supports it.
- Added persistent minus, Fit photo and plus controls whenever a photo is selected,
  so oversized artwork can be recovered even when its drag handle is off-screen.

## Sticker library and interface-cleanliness pass

- Expanded the original preset chooser into a compact Stickers & record marks
  library, grouped into Record basics, Label details and Decorative items.
- Added editable `MADE IN EORA`, `LIMITED EDITION`, `CATALOGUE NO.`, star,
  spark, dot and divider presets alongside the existing speed, format and side
  marks.
- Kept every preset as editable browser-rendered type or a simple symbol. No AI
  imagery, copied logos, trademarks or third-party artwork is bundled.
- Simplified the desktop left rail to three creation choices: Photo, Text and
  Stickers & marks. Contextual actions now appear only when useful, and clear
  controls sit behind More options.
- Simplified the right-panel heading and tightened panel/button spacing and
  visual hierarchy without changing the four-surface workflow.
- Made tapping or clicking any blank point on the design or surrounding grey
  workspace deselect every layer type and close its phone edit sheet.
- Made the sticker chooser a scrollable, two-column touch layout on narrow phones
  while keeping larger previews on desktop.

## Backgrounds, symbols and phone text pass

- Expanded the original library to 34 editable items, including music notes,
  stars, sparks, a flower, heart, smile, sun, moon, cloud, lightning, geometric
  marks, arrows and dividers.
- Restyled the speed, stereo and mono presets with original condensed and
  wide-spaced system-font treatments inspired by vintage record typography,
  without copying a label logo or proprietary artwork.
- Added ten solid background presets, six restrained gradients and a custom
  two-colour gradient builder with horizontal, vertical and diagonal directions.
- Applied backgrounds consistently to the canvas, live previews, finished-product
  previews, recovered projects and final rendered artwork.
- Included backgrounds when duplicating Front to Back or Label A to Label B and
  when determining whether a design is complete.
- Added automatic light text on dark selected backgrounds when adding the first
  text layer.
- Added a live text-style preview inside the phone editor, kept it visible while
  the sheet scrolls, reduced the text field height and moved opacity/layer-order
  controls behind optional More text options.
- Removed the floating phone Back/Undo/Close pill. Undo and Redo remain in the
  bottom toolbar, the Edit action becomes Done while open, blank-space taps
  deselect, and each sheet or modal retains its own close control.

## Captured creative-tool feedback

## Phone header and deselection clarification

- Shortened the narrow-phone header to `Crosstalk Customs` while retaining the
  full `Crosstalk Customs Artwork Designer` title on larger screens.
- Kept the safety warning banner visible whenever text crosses the safe line,
  but now show an orange layer outline only for the currently selected unsafe
  item. Tapping away therefore removes every apparent selection box.
- Made a press-and-hold on any finalising-screen preview temporarily enlarge
  that finished-product preview on touch or mouse. Releasing returns to the
  four-up preview grid without opening the editor; a normal tap still edits it.

- Consider true resizable vector shapes such as squares, circles and triangles
  after testing the lighter symbol-based approach.
- Consider later additions to the original sticker library only after customer
  feedback. Continue to exclude AI-generated art, copied label graphics,
  trademarks and unverified third-party artwork.

## Crop, vector and experimental pencil pass

- Corrected text and editable record-mark resizing so the visible type and its
  selection box scale together at the same rate.
- Added three photo-frame choices: Original, Square and Free crop. Customers can
  change the crop frame independently, zoom the photo inside it and move the
  visible crop horizontally or vertically.
- Added genuine editable vector layers for rectangles, circles, triangles,
  stars and hearts, plus original record, cassette, headphones, microphone and
  music-note symbols.
- Added solid, transparent and two-colour gradient fills, optional outlines and
  independent width/height resizing when Keep proportions is turned off.
- Replaced the label-origin preset with `MADE IN EORA`.
- Added the approved Crosstalk Records logo extracted from the supplied artwork
  template. It is bundled locally and does not depend on a third-party service.
- Added the Draw tool to the normal sandbox interface on desktop and phone.
  Customers can choose a colour and width, draw directly on any artwork surface,
  then select, move, resize, rotate, duplicate, reorder or delete the stroke.
  Drawings participate in Undo/Redo and are included in previews and exports.
- Kept every new tool browser-local and isolated from the calculator, Airtable,
  Make, Dropbox, pricing and order-submission code.
- Tightened the desktop creation controls, added a visual preview for the
  official logo sticker and retained the existing touch-sized phone controls.

## Tester interaction correction pass

- Replaced the single photo resize corner with a conventional crop frame that
  can be adjusted from all four edges and all four corners on mouse or touch,
  with Original, Square, Round and Free crop choices. Round crops stay circular
  while their frame is resized.
- Kept alignment lines and their small haptic cue, but removed magnetic snapping
  so customers retain exact control over where an object is placed.
- Split layer ordering into four explicit actions: Move forward and Move
  backward change one layer at a time; Bring to front and Send to back move to
  the two extremes.
- Made pencil strokes retain round caps and a consistent round line when their
  selection box is scaled.
- Replaced device-dependent font names with visibly distinct, mobile-safe font
  families while preserving existing project text styles.
- Locked the original headphones, music note, microphone and cassette artwork
  to its intended proportions, and made vector outline widths independent of
  shape stretching in both the editor and rendered artwork.
- Added a circular, centre-out background gradient for record labels and changed
  the vague “restrained gradient” wording to “simple two-colour gradient.”

## Deliberate omissions

- No automatic popups or `window.open()` calls.
- No calculator button, Common Ground embed, tracklist transfer or return-message
  listener yet.
- No direct Dropbox or Make upload yet.
- No browser-generated `.psd` file yet. The advanced export now creates a
  Photoshop-ready layered ZIP instead: full-size, identically aligned transparent
  PNG layers, flattened print PNGs, untouched source photos, a compact manifest
  and a plain-English Photoshop import guide. This avoids shipping a misleading
  JSON-only “layered project” or an unverified PSD writer.

## Non-destructive photo eraser and layered export

- Added an Erase part of this photo action for customer-uploaded images.
- Added Erase and Restore brush modes with an adjustable round brush, touch and
  mouse support, Clear erasing, Done and Escape handling.
- Erasing is stored as reversible mask strokes; the original uploaded image is
  never rewritten. Each stroke participates in the existing Undo/Redo and device
  recovery history.
- Applied the mask consistently to the design canvas, live previews, finished
  previews, flattened print artwork and isolated layer exports.
- Added an Advanced / staff export section to the finish screen so production
  tooling does not clutter the ordinary customer completion path.
- Added a local-only layered ZIP generator with one same-size transparent PNG per
  layer. Files are numbered from back to front and include a background layer,
  flattened reference, untouched uploaded photos and Photoshop import directions.
- Kept export entirely in the browser: no artwork, PII or project data is sent to
  a new endpoint.

## Planned feedback-driven phases

1. Validate the four-surface workflow, wording and mobile behavior.
2. Confirm exact front/back cover print dimensions and bleed.
3. Validate the layered ZIP with staff in Photoshop, then add direct `.psd`
   generation only if the PNG-stack handoff is materially insufficient.
4. Add the optional calculator link, tracklist transfer and return-to-order bridge
   after sandbox approval.

The normal link will be user-initiated and will not depend on scripted popup
behavior. The existing order form will remain usable when the editor is disabled.
