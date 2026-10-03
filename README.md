# PHOTOBENCH v1.3.0

A self-hosted, local-first photo editor from Green Shoe Garage.

**Open → Adjust → Compare → Export.**

An independent browser implementation inspired by Snapseed-style photo editing. It is not an official Snapseed port and does not use Google's code, artwork, or proprietary editing algorithms.

## Run it

**Simplest:** open `index.html` in a current desktop browser. The editor, sample image, styles, and image-processing worker are embedded. No installation, account, API key, build, or internet connection is needed.

**On your server:** create a folder such as `/photobench/` and upload these two files together:

```text
photobench/
  index.html
  sw.js
```

Visit `https://your-domain.example/photobench/`. Any ordinary static host works. Relative paths support deployment at a subdirectory. `index.html` alone runs the editor; `sw.js` adds offline page reload after a successful first visit over HTTPS or localhost.

**Local server, including macOS:** from this folder run `python3 -m http.server 8000`, then open `http://localhost:8000/`. Python is optional; opening the HTML directly also works. Browser behavior for storage on `file://` differs; a local server is the more predictable choice for recovery.

Do not upload your photos or saved project JSON files to your public web folder. The application never requires them to be on the server.

## What is included

- JPEG, PNG, and WebP import, file picker and drag/drop.
- Twelve editable looks, plus up to 24 personal looks saved in your browser.
- Exposure, brightness, contrast, highlights, shadows, whites, blacks, saturation, vibrance, warmth, tint, sharpening, and structure.
- Master RGB and individual red/green/blue tone curves, with nine editable output anchors, a draggable curve graph, and linear/smooth interpolation.
- Free and ratio crops, draggable corners/interior, optional snapping to thirds/center, exact percentage bounds, rotation, flip, and ±30° straightening.
- Horizontal/vertical perspective correction and explicit transparent, solid-color, or stretched-edge fill.
- Canvas expansion with transparent, solid, edge, or mirrored fill.
- Eight overlapping HSL color ranges with separate hue, saturation, and lightness controls.
- Up to twelve soft radial control points with exposure, saturation, and warmth.
- Painted exposure, saturation, and warmth adjustments; up to 60 strokes per project. Select, edit, bypass, or delete individual strokes; show their masks and erase portions. Optional pen pressure controls radius.
- Soft manual clone retouching; up to 60 strokes. Select individual strokes to change size, opacity, or sampling offset; bypass or delete them.
- Halation, grunge, film palettes, dehaze, and chromatic aberration with individual strength, tuning, bypass, and reset.
- Vignette, grain, glow, radial lens blur, text, and inset frames.
- Double exposure with Normal, Screen, Multiply, Overlay, and Soft Light blending.
- Aligned original/edited comparison, luminance histogram, zoom/pan, touch pinch, Full detail preview, and undo/redo.
- Editing-group bypass inspector, session history, and up to eight named comparison/restore snapshots.
- Portable recipe JSON for global looks, with optional geometry/text/frame.
- Remembered tool, group expansion, inspector width, theme, and mode.
- JPEG, PNG, and WebP output; adjustable dimensions and quality; print/save-to-PDF through your browser.
- Easy and Advanced modes; dark, light, and high-contrast themes.
- IndexedDB autosave with visible save status, portable project JSON, and Fresh Start.
- No telemetry, advertising, account requirement, image uploads, runtime dependencies, or external fonts.

## Everyday use

1. Open a photo, or choose **Try the Yosemite sample**.
2. Pick a Look if useful. Looks replace global tone, curves, and effect settings; they leave crop, text, local adjustments, and clone work intact.
3. Use Adjust to shape tone and color. Switch to Advanced for curves, detail, and local tools. Existing advanced edits remain applied in Easy mode.
4. In Crop, draw a rectangle or select a ratio. Drag its corners to resize or its interior to move it. Choose **Apply crop** to use the draft. Leaving the Crop tab without applying discards only the draft. Rotation/flip reset crop bounds. Full Image removes a crop.
5. Compare with **Before / after**. The original tones share the current crop and orientation. Hold Space while the photo workspace has keyboard focus for a temporary comparison.
6. Export an image for use elsewhere. Download a **project JSON** to keep editing later.

Undo/redo keeps the latest 50 states in the current session. Reloading or opening a project begins a new undo history; all active editing parameters and the source photo remain available.

### Selective edits and retouching

Control points and brush strokes are stored in normalized source-image coordinates. They stay attached to the photo when you crop or rotate. The default point appears near the center of the visible crop. Use its position fields or drag its center. Masks are soft radial regions; they do not detect subjects or match colors automatically.

Brush strokes apply the chosen adjustment with a soft edge. A stroke uses its strongest brush coverage at each pixel, avoiding dark joins. Separate strokes accumulate. Undo removes a stroke; Erase All removes all adjustment brush strokes.

Clone retouching samples the original image, before color edits. Choose a clean source, then paint over a small distraction. Each stroke uses an offset from its first point to the selected source. Re-pick the source for another area. It is **manual cloning, not content-aware healing**. At source-image edges, sample patches may contain transparent pixels.

Text and borders are added after geometry and are aligned to the final frame. The frame is inset and covers the photo edge; it does not expand the image. Text supports up to five lines and three built-in font families.

### Storage and recovery

One active project is saved in IndexedDB in this browser. The status reads Unsaved, Saving, Saved, or an explicit storage error. Saved looks, theme, and mode use localStorage. Save a project JSON for important work: browser eviction, private browsing, clearing site data, changing origins, or changing devices can remove local recovery.

Project JSON schema 3 includes the working source image, adjustments, spatial edits, snapshots, and every second image referenced by the current edit or a snapshot. Schema-1 and schema-2 projects from v1.0–v1.2 import automatically with the new filters off. Five-anchor curves are expanded to nine anchors with the original linear shape retained. New schema-3 projects require v1.3 or later so older editors cannot silently drop creative-filter settings; keep older backups if needed. Import validates the schema, image type, ranges, mask sizes, asset identifiers, and working dimensions. Invalid imports preserve the existing session. No network URLs or imported scripts are accepted.

Fresh Start clears the active project and its autosave after confirmation. It keeps personal looks and interface preferences. Reset All Edits is undoable. Personal looks can be cleared separately from the Looks panel.

### Export and image fidelity

Fast preview starts from a source at most 1280 pixels on the longest edge; canvas expansion can increase the displayed result dimensions. Full detail uses working-resolution pixels within the output budget. Export reprocesses the source independently of preview quality, then applies the requested output size without upscaling the photo itself. Expanded canvas adds pixels around it. Input files are never overwritten.

- Inputs must be JPEG/PNG/WebP and at most 40 MB.
- Photos above 20 megapixels or 6000 pixels on either edge are reduced on import, with a visible notice. The project retains the reduced working copy; keep your original file separately.
- A project file may be up to 180 MB. Embedded PNG images and second exposures can make projects large.
- Exported images omit camera metadata, including GPS. PNG/WebP preserve available transparency; JPEG flattens it onto white.
- Processing is 8-bit browser RGB. This is not a RAW developer or a professional wide-gamut/ICC color-management system.
- Expanded output is capped at 32 megapixels and 8192 pixels per edge. When expansion exceeds that budget, the rendered source and final canvas are reduced proportionally; the export dialog shows the actual output dimensions.
- Curves offer piecewise-linear or smooth monotone Hermite interpolation. Structure and sharpening use local contrast; glow and lens blur use box-filter softening. Artistic effects are original approximations, not identical reproductions of Snapseed filters.
- Preview versus full-size grain, detail, brush edges, and blur can differ slightly with resolution. Judge final sharpness from an exported image.
- Large photos, many local strokes, and double exposure require substantial memory. Device/browser memory limits can be lower than the application's input limit. Reduce the image dimensions first on constrained phones.
- Print/PDF is an image printout using browser print settings, not a separate analysis report.

## Offline and privacy

The standalone HTML is self-contained. The only server requests made by a hosted editor are for its own page and service worker. Photos are decoded, edited, and saved on the device. A hosting provider may keep normal access logs for page visits; the application does not send image contents to it.

The service worker caches only this editor's page. Its cache name is scoped to the deployment route. Project data is not stored in the service-worker cache. Browser storage is origin-specific: instances on the same origin share the active session and saved looks. Use distinct origins if you need isolated installations.

If you enforce Content Security Policy, the standalone bundle needs inline scripts/styles, `worker-src blob:`, and `img-src data: blob:`. There are no external scripts. A restrictive server policy can block embedded workers; adjust it deliberately for this route.

## Accessibility and browser support

Controls have labels, focus outlines, keyboard input, native dialogs, and status announcements. Editing can be performed with numeric fields and sliders; spatial brush/clone painting requires a pointing device. Control points and crop have keyboard-accessible numeric alternatives. On mobile, editing controls appear beneath the photo. Preview zoom uses ordinary scrolling to inspect enlarged images.

Tested in Chromium 134 on Linux at desktop, tablet, and phone viewport sizes. Chrome/Edge/Firefox/Safari are intended targets, but physical iOS/Android devices and Safari were not available for this release's verification. Use a current browser with Canvas, Web Workers, IndexedDB, and native dialog support. Service-worker offline reload requires a secure context.

## Repository contents

| File/folder | Purpose | Upload to server? |
|---|---|---|
| `index.html` | Complete runnable editor | Yes |
| `sw.js` | Offline reload on HTTPS/localhost | Recommended |
| `src/` | Editable HTML/CSS/JS and embedded public-domain sample | No |
| `build.py` | Optional maintainer bundler, Python standard library only | No |
| `tests/` | Browser workflow regression checks | No |
| `docs/` | Architecture, roadmap, test report, release notes | No |
| `LICENSE` | GNU GPL version 3 | Keep with distribution |
| `THIRD-PARTY-NOTICES.md` | Sample photo provenance | Keep with distribution |

Users do not need to build anything. Maintainers can edit `src/`, then run `python3 build.py` to update `index.html`. Keep `VERSION`, the visible version, and the service-worker version in sync for future releases.

Developer checks use Playwright only; it is not a runtime dependency. See `tests/README.md` for running them. The package includes complete readable source and no minified third-party JavaScript.

## New v1.3 creative filters

Open **Finish → Creative filters** in either Easy or Advanced mode. All five filter names are visible at the top. Select one and move its strength from zero. Multiple filters can be combined. **Apply** temporarily bypasses only that filter while preserving its settings; **Reset** inside the filter restores only that filter. The panel-heading Reset resets all Finish settings as before. Fine-tune controls are collapsible and their open/closed state is remembered.

| Filter | Controls and behavior |
|---|---|
| Halation | Highlight-driven red/amber edge halo; strength, spread as a percentage of the shorter image side, highlight threshold, and red warmth. It leaves remote shadows alone. |
| Grunge | Deterministic procedural stains, dust, and scratches; strength, texture size, roughness, and seed. New texture advances the seed; rerendering never randomly changes the texture. |
| Film | Warm negative, Cool slide, Silver monochrome, and Faded instant palettes; strength, faded blacks, grain, and grain size. These are original artistic looks, not calibrated commercial film-stock emulations. |
| Dehaze | Positive strength removes estimated atmospheric haze; negative strength adds haze. Atmosphere scale adjusts the spatial estimate for positive strength. Start around +20 to +40. |
| Chromatic aberration | Intentional red/blue channel separation; signed strength reverses the fringe. Radial mode exposes optical center X/Y; Linear mode exposes direction. Green and alpha stay fixed. |

All new amounts default to zero. Sliders, numeric entry, undo/redo, original comparison, snapshots, autosave, saved looks, JSON projects, recipes, PNG/JPEG/WebP exports, and print use the same filter settings. The Edits → Effects bypass also bypasses the five filters. Applying a Look replaces global effects, including these filters.

Filtering occurs on the source composition before crop, perspective, text, and frame, so added text and borders remain clean. Order is fixed: dehaze → tone/color/curves/local adjustments/detail → film → existing glow/blur/vignette/grain → halation → chromatic aberration → grunge. Finish's existing Grain adds independently of Film grain.

Dehaze is a bounded, dark-channel-inspired approximation with box-smoothed transmission; it can overcorrect bright white objects or introduce halos at strong depth edges. Reduce strength for those scenes. It does not reconstruct obscured detail. Halation, film, grunge, and aberration are artistic simulations. Fast preview resamples the source, so fine grain, tiny fringes, and halo boundaries can differ slightly from export; use **Full detail** for final judgment. Full detail and full-size export match at the same working resolution.

## New v1.1 / v1.2 workflows

**Local editing:** In Selective → Brush, the upper controls configure the next stroke. Recorded Adjustments selects an existing stroke. Its radius, strength, feather, and enabled state can be changed without repainting. Show Selected Mask overlays its influence in magenta. Erase Selected Mask affects only that stroke and uses the next-stroke radius. Restore Erased Area removes that stroke's eraser paths. Up to 30 eraser paths are retained per stroke. Pressure is captured only from pen events when enabled; mouse/touch strokes retain a steady radius.

**Crop/navigation:** Corner handles resize; interior drag moves a non-full-image crop; outside drag draws another rectangle. Ratio selection is preserved during corner resizing. Snap can align crop movement/handles to image edges, thirds, and center. Pan is an explicit mode to avoid accidental brush strokes. Ctrl/Command+wheel and two-finger pinch zoom around the interaction point. Full Detail is a full-resolution preview, not a tiled viewer; use Fast on constrained devices. Inspector resizing is available on desktops wider than 1100 pixels and also supports arrow keys on its divider.

**Perspective/expansion:** Crop → Perspective corrects horizontal and vertical convergence using a projective transform. The transformed image is fitted into the existing working frame. Fill choices are explicit; nothing is invented by AI. Expansion applies around the cropped image and is visible outside the Crop tab. It adds up to 50% on each side. Masks and retouching operate on the original image; they do not paint the new fill area. A border is still inset into the final expanded frame.

**Color mixer/curves:** Adjust → Color Mixer offers Red, Orange, Yellow, Green, Aqua, Blue, Purple, and Magenta. Ranges overlap with soft weighting and protect near-neutral pixels. Curve anchors have fixed input positions every 12.5%; drag their output values or use numbers. Smooth interpolation avoids overshoot between monotonic anchors.

**Recipes:** Project → Export / Apply Recipe saves tone, curves, HSL, and effects without embedding images. Optionally include geometry or text/frame. Import previews the groups to be replaced and asks before applying. It preserves spatial edits, source photos, snapshots, and second exposures; Undo restores the previous settings. Recipe files use their own schema 2 and are limited to 1 MB. Legacy schema-1 recipes import with neutral creative-filter settings; new recipes require v1.3 or later.

**Edits/snapshots:** Edits bypasses groups while retaining their parameters. Processing order is fixed; the inspector does not reorder filters. A named snapshot freezes the full edit settings and retains its second-image reference. Compare shows that snapshot's complete composition, which may have a different crop or size; Original Tones uses the current geometry for alignment. Restoring a snapshot is undoable. Deleting a snapshot is confirmed and leaves the current edit intact. History is session-only; named snapshots persist in project JSON and autosave.

**Updating an installation:** Download a project backup, close old editor tabs, replace both `index.html` and `sw.js`, and reopen the editor. Existing schema-1 and schema-2 autosaves are migrated on load. All copies on the same origin share one active project, so avoid editing the same session in multiple tabs.

## License and next steps

Copyright © 2026 Michael Parks / Green Shoe Garage. GNU GPL v3 only. The sample photograph is separately public domain. See `LICENSE` and `THIRD-PARTY-NOTICES.md`.

Creative filters are implemented in v1.3. Batch workflows and export-queue refinement remain future work. See `docs/ROADMAP.md`. RAW/HEIC decoding, automatic subject masking, and content-aware healing require separate evaluation; this release does not claim those features.
