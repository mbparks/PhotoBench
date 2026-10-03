# PHOTOBENCH development roadmap

Current release: **v1.3.0**. The requested creative filters take priority over the previous batch-work proposal.

## v1.0 — Complete foundation

Import, original-preserving tone/color edits, RGB curves, looks, crop/orientation, selective points, brushes, manual clone retouching, effects, text/frame, double exposure, comparison, image/print export, autosave, project JSON, and offline static packaging.

## v1.1 — Complete: local-editing control

- Visible selected-mask overlays.
- Select, change, bypass, and delete individual brush and clone strokes.
- Selected-stroke eraser with undo and erased-area restoration.
- Optional pen-pressure radius capture.
- Crop corner resizing, interior movement, and snapping.
- Explicit pan mode, pointer-centered wheel zoom, touch pinch, and Full detail preview.
- Persistent selected tool, collapsible tool groups, and desktop inspector width.

Full detail uses a full working-resolution render. Adaptive high-resolution tiles remain a possible performance refinement, not a requirement to inspect original-scale pixels.

## v1.2 — Complete: composition and reusable edits

- Horizontal/vertical projective perspective correction.
- Explicit transparent, solid-color, or edge-stretch perspective fill.
- Canvas expansion with transparent, solid, edge, and mirror fill.
- Eight-range HSL color mixer.
- Nine-anchor master/RGB curves with drag controls and linear/smooth interpolation.
- Portable recipe JSON with optional geometry/text/frame.
- Editing-group bypass inspector and session history navigation.
- Eight named snapshots for comparison and undoable restoration.
- Schema-1 project import, schema-2 projects, and snapshot asset retention.

## v1.3 — Complete: creative filters

- Halation with highlight threshold, spread, and warm tint.
- Repeatable procedural grunge with texture scale, roughness, and seed.
- Four film-inspired palettes with fade and grain controls.
- Positive dehaze and negative added haze, with spatial scale control.
- Radial/linear chromatic aberration with signed strength and center/direction controls.
- Clearly named filter selector at the top of Finish in both editor modes.
- Individual bypass/reset, project/recipe/look persistence, and full-resolution export.
- Schema-1/2 project migration; schema-3 projects and schema-2 recipes guard against older editors dropping filters.

## v1.4 candidate — Repeated work

- Batch apply a recipe and review individual results.
- ZIP export, contact sheets, and reusable output-size presets.
- Export queue with explicit progress and cancellation.
- Profile large-image and dense-mask workloads before selecting a tiled or GPU optimization.

## v2 candidates — Evaluate before promising

- Bundled local RAW and HEIC decoding.
- High-bit-depth processing and calibrated color-profile handling.
- Local content-aware healing and automatic subject/background masks.
- GPU acceleration with a tested CPU fallback.

Prioritize editing correctness, useful control, recoverability, and memory use over accumulating filters.
