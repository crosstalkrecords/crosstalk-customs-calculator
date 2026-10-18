# Synthetic verification — 18 October 2026

This is an isolated implementation checkpoint, not a production release.

- Unit/integration suite: passed capability isolation, origin rejection, geometry
  bounds, missing/remote source rejection, 40-layer limit, immutable commits,
  authenticated order binding, conflicting destination rejection, durable restart,
  retry reusing an archive and duplicate-bind idempotency.
- Actual renderer test: two synthetic orders delivered to separate LOCAL folders.
  Order A: 3000px cover, six editor layers and three native text layers; 1146px
  label A, four editor layers and two native text layers. Order B: separate
  1146px label B with two native text layers. All PSDs parsed successfully with
  masks, hidden test layers and 70% photo opacity retained.
- Order A render/archive/delivery: 32.1 seconds. Order B: 7.8 seconds. These are
  synthetic observations; worker/browser peak memory was not measured in this run.
- Output PSD bytes: cover 16,841,062; label A 901,429; label B 901,429.
- Independent Pillow PSD reader decoded the cover RGB composite and label RGBA
  composite. Cover composite exactly matched its reference PNG pixels. This does
  not force native-text redraw or establish Photoshop save/reopen behavior.
- Browser checks passed at desktop 1365x900 and mobile/touch 390x844: calculator
  opens designer, completion attaches the authenticated reference, and refreshing
  the editor resumes its sealed upload without creating another project.
  This is viewport/touch emulation, not a real-phone memory measurement.
- The live calculator, track builder and approved editor files were not changed.
  The preview removes the real order-submission webhook URL.

Environment: Node 24.19, packaged Chromium 141, system Fontconfig, pinned bundled
DejaVu fonts. The initial generic browser download failed; the packaged Chromium
was used instead. A source pin check caught a normalised audit copy; the exact
Git blob was restored before any reported rendering succeeded.

Photoshop acceptance: Josh opened and edited both supplied PSDs, toggled the
hidden artwork and photo mask, and saved/reopened the files. Both returned PSDs
were parsed on 18 October: editable Hello Josh text, original photo pixels,
enabled masks, hidden-layer pixels, and 70%/45% opacity survived. Independent
Pillow decoding confirmed label alpha is zero at the corner and centre hole,
and opaque on the label body. These results cover the supplied synthetic files.

Unverified: actual Dropbox delivery; deployment and
persistent-volume restore; Docker build; large-photo/repeated-job limits;
physical print sizing; final legacy-font policy; live Make changes. The generated
acceptance report explicitly records remoteDropboxVerified=false and
photoshopVerified=false.
