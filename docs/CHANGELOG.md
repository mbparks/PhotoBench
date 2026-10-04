# Changelog

## v1.4.0 — 2026-10-04

- Added Retouch → Magic Eraser in both modes: paint/subtract a mask, reconstruct from surrounding pixels, preview, retry, keep, or cancel.
- Added native-resolution patch reconstruction, preserved alpha and original source, undoable kept removals, and refinement of the latest removal.
- Added schema-4 projects with persistent masks and PNG patch assets retained by current edits and snapshots. Earlier project versions remain importable.
- Preserved existing Clone brush as an explicit Retouch mode.
- Added deterministic inpainting, native Canvas/worker integration, and browser acceptance test scripts. Browser scripts could not be executed in this session; see TEST-REPORT.

## v1.3.0 — 2026-10-03

- Added Halation, Grunge, Film, Dehaze, and Chromatic aberration in Finish → Creative filters, visible in Easy and Advanced.
- Added independent filter strength, bypass, reset, and detailed tuning; four film palettes, deterministic texture seeds, and radial/linear aberration.
- Integrated filters with original-preserving preview/export, undo/redo, autosave, personal looks, recipes, and named snapshots.
- Added schema-3 project export and schema-2 recipes with backward import of previous formats and neutral defaults.
- Added pixel invariant and full browser workflow checks for the new filters.
- Retained dependency-free standalone HTML and self-hosted offline packaging.

## 1.2.0 — 2026-10-03 (UTC)

Includes both requested development batches.

**v1.1 batch:** mask overlays; individual brush/clone selection, parameters, bypass and deletion; selected-mask erasing; pen-pressure radius capture; crop handles and movement/snapping; pan, anchored wheel zoom and touch pinch; Full detail preview; persistent tool/group/inspector preferences.

**v1.2 batch:** perspective correction; canvas expansion with explicit fill modes; HSL color mixer; nine-point linear/smooth curves; portable recipes; group-bypass inspector; named comparison/restoration snapshots; schema-1 migration and schema-2 project export with snapshot asset retention.

Recovery review corrected eraser selection after undo and retained second images referenced by snapshots. Expanded output is capped at 32 MP / 8192 pixels per edge. Runtime remains self-contained and offline-capable.


## 1.0.0 — 2026-10-03

Initial complete self-hosted release. Includes tone/color and curves, twelve looks, reversible crop/orientation, source-attached selective edits, brush and clone tools, finishing effects, double exposure, image/print output, project recovery, and offline static packaging.

Release review corrected final text/frame rendering after geometry and tightened project asset validation. Browser workflows verify edit recovery, exports, offline reload, and responsive layouts. Known limits are explicit in the application help and README.
