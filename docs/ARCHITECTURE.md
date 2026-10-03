# Architecture and data model

PHOTOBENCH uses browser primitives with no application server and no runtime package dependencies.

## Render pipeline

1. Decode the source and reduce only if the documented working limits are exceeded.
2. Prepare a source canvas: up to 1280 pixels for preview or the full working dimensions for export.
3. Apply manual clone strokes, sampling an unchanged copy of the source.
4. Composite the optional second exposure onto the source canvas.
5. Send image bytes and settings to an embedded Web Worker. Apply dehaze, tone/color, curves, selective points, brushes, detail, film, legacy effects, halation, aberration, then grunge. Transfer buffers to avoid redundant copies across the worker boundary.
6. Apply orientation/straightening with a DOMMatrix, then an inverse-sampled projective warp with premultiplied-alpha interpolation, normalized crop, and explicit canvas expansion. A composite forward/inverse mapper keeps spatial edits attached to the source. Text/frame transforms are independent.
7. Draw text and the inset border in the final frame's coordinate system.
8. Display or resize/encode the result. The comparison image applies the same geometry to the source without edits.

Preview renders are debounced. Obsolete results are discarded by generation number. Pointer previews use a separate overlay; committed edits trigger the image renderer. The inverse geometry matrix maps control-point/brush/clone pointer coordinates back to source coordinates. Geometry bypass uses the effective identity transform while retaining the stored settings.

## Project schema 3 (schemas 1 and 2 remain importable)

```text
format: PHOTOBENCH
schema: 3
version: semantic application version
savedAt: ISO timestamp
source: name, dataURL, width, height, importWidth, importHeight, reduced
settings:
  adjust, curves, curveInterpolation, hsl, enabled, geometry, effects
  points[], brushes[], clones[]
  text, frame, blend, look
snapshots: up to eight named settings snapshots
assets: current/snapshot second-image IDs -> image data URLs
```

The base image is not destructively modified. Undo history stores up to 50 setting snapshots in memory and is not included in project files. Session-only old blend assets can be referenced by undo; the current second exposure and every second image used by a named snapshot are written into a portable project.

Import copies known fields into defaults and clamps numeric ranges. It does not assign arbitrary input objects into executable UI configuration. Imported text is escaped in HTML and rendered on canvas. Asset URLs accept JPEG/PNG/WebP base64 data only. Image dimensions are decoded and verified. Settings additions should retain schema-1 defaults; incompatible changes require explicit migration/versioning.

## Persistence

IndexedDB `photobench` / `projects` / `current` holds one active project. A serialized transaction chain prevents older saves overwriting newer ones. Revision numbers prevent stale completion notices. The app warns on unload while a save is pending or storage has failed. `localStorage` stores mode, theme, and personal looks. Both storage systems are specific to the browser origin, not the route.

## Boundaries

This is an 8-bit browser-canvas editor with original mathematical approximations. No Snapseed internals are used. Some algorithms are deliberately simple: linear or monotone-Hermite curves, softly weighted HSL ranges, radial/painted masks, box-filter blur/unsharp operations, and soft offset cloning. Every advertised control changes the image or project; deferred capabilities are only described in documentation.

Server operators should preserve relative paths and serve `sw.js` as JavaScript. Do not apply a global service-worker scope. The service worker handles navigation only within its registration scope and cleans only its own versioned cache prefix.

## v1.1/v1.2 module boundaries

- `color.js`: shared curve interpolation and HSL conversion.
- `masks.js`: shared pressure-aware soft stroke coverage and eraser masks.
- `worker.js`: asynchronous pixel adjustments and effects.
- `geometry.js`: projective warp, inverse mapping, expansion fill, and output budget.
- `app.js`: base workflow, history, UI, image decode, validation core, and persistence.
- `workspace.js`: stroke inspector, crop manipulation, gestures, and workspace preferences.
- `studio.js`: extended validation, finer color UI, recipes, editing inspector, snapshots, and schema 3.

The bundler embeds these sources in dependency order; there are no module fetches at runtime. Validation converts 5-point curves into 9 points without changing the legacy linear shape, supplies neutral defaults, bounds pressure samples and eraser paths, and preserves required snapshot assets. Recipe JSON is distinct from project JSON and never embeds images.

The edit inspector bypasses groups by constructing an effective render state; it never erases stored parameter values. Processing order is fixed. Snapshots store complete settings but share the project's source image and separately keyed second images. Only one rendered snapshot is cached at a time.

Expanded output is bounded to 32 MP and 8192 pixels on an edge. Render source resolution is reduced before allocation when the final expanded result would exceed that budget. Full Detail preview uses the same budget. Perspective and canvas assembly run on the UI thread after the pixel worker; very large geometry operations can briefly pause interaction and remain a future performance target.

## Creative-filter modules and compatibility

`filter-settings.js` defines neutral defaults, ranges, allowlisted enum values, and numeric normalization. Settings live inside `effects`, so existing state-copy, group-bypass, look, recipe, snapshot, and history machinery retains every filter. `filter-panel.js` adds a named selector and contextual controls at the top of Finish. Extra controls are accessible in both modes.

`filters.js` is embedded only in the worker, before `worker.js`. Effects use deterministic source-relative coordinates. Each filter has a zero/bypass fast path and preserves alpha. Chromatic sampling weights neighboring channel samples by alpha to avoid hidden transparent RGB bleeding into visible edges. Dehaze uses linear-time sliding-window dark-channel minima, a bright dark-channel candidate for airlight, a 0.2 transmission floor, box smoothing, and a strength mix. This is an independent simplified implementation inspired by He, Sun, and Tang, [Single Image Haze Removal Using Dark Channel Prior (CVPR 2009)](https://people.csail.mit.edu/kaiming/publications/cvpr09.pdf); it does not implement that paper's soft-matting refinement. No external code or model is bundled.

Halation thresholds luminance, approximates diffusion with three scalar box passes, subtracts the original highlight mask, and screens a warm halo into neighboring visible pixels. Film applies an editable artistic palette/tonal response with seeded grain. Grunge combines multiscale procedural noise and stable scratch/dust fields. Aberration bilinearly resamples red/blue in opposite directions, either radially or linearly. No filter changes image dimensions.

Import from schema 1 or 2 supplies zero strengths. New projects use schema 3 and recipes use schema 2; older readers reject them instead of silently discarding creative-filter parameters. Legacy personal looks gain neutral defaults during loading. Processing remains 8-bit browser RGB; simulated film is not a color-managed physical stock profile.
