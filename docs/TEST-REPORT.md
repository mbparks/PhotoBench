# PHOTOBENCH v1.3.0 — release verification

Date: 2026-10-03 (UTC). Environment: Linux, Playwright 1.62.1, Chromium 134.0.6998.35.

**Result: 70 automated checks/groups passed. No uncaught errors in the browser workflow suites.**

All original v1.0 and v1.2 regression suites were rerun against the finished v1.3 bundle. New tests exercise actual filter controls, image pixels, saved files, and reloads. Local hosting/offline checks use `http://127.0.0.1:8765/photobench/`; standalone checks open the bundled HTML directly without network access. Full-detail preview and full-size exported PNG were pixel-identical on the 1600 × 1200 sample with all five creative filters active.

## Core browser workflows

- PASS — Cold start and sample import
- PASS — Exposure changes pixels, undo restores and redo reapplies
- PASS — Before/after comparison and keyboard spacebar
- PASS — Browser autosave restores the exact settings
- PASS — Curves and selective point controls
- PASS — Painted exposure and clone strokes
- PASS — Crop, rotate, straighten, and editable frame
- PASS — Full-size PNG export and project JSON round trip
- PASS — Invalid project preserves existing image and rejects external URLs
- PASS — Reusable look, double exposure, and WebP export
- PASS — Light and high-contrast themes render; controls collapse
- PASS — Offline reload restores the editor and project
- PASS — Phone and tablet layout avoid horizontal overflow
- PASS — Fresh start removes sample, edits and autosave
- PASS — Standalone HTML opens and edits without any network
- PASS — No uncaught browser errors

## Pixel and export boundaries

- PASS — Neutral pixel renderer preserves exact RGB and alpha
- PASS — All 13 tone/detail controls and four main effects change actual pixels
- PASS — Final border stays aligned at all four rotations and with straighten
- PASS — Empty numeric entry resets consistently in state and slider
- PASS — Print output contains the photograph and hides editor chrome
- PASS — JPEG export flattens transparency onto white
- PASS — Oversized image is reduced with explicit notice

## v1.1 and v1.2 workflows

- PASS — Schema 1 migration preserves source, edits, and all five curve anchors
- PASS — Brush strokes can be selected, resized, changed, bypassed, and erased
- PASS — Per-stroke masks and bypass survive JSON normalization
- PASS — Clone strokes can be individually edited and removed
- PASS — Crop handles resize and interior dragging moves the selection
- PASS — Projective geometry changes pixels and round-trips source coordinates
- PASS — Canvas expansion adds exact dimensions and explicit fill
- PASS — Nine-anchor smooth curves and HSL alter the image
- PASS — Recipe export contains no images and reapplies the selected settings
- PASS — Edit inspector bypasses groups without deleting settings
- PASS — Named snapshots compare and restore an earlier complete edit
- PASS — Current project round trip retains snapshots, masks, and geometry
- PASS — Full-detail view, zoom, pan, and remembered inspector width
- PASS — Expanded PNG export has exact size and fill color
- PASS — Responsive advanced tools remain within a phone viewport
- PASS — No uncaught browser errors

## Recovery, geometry fills, and touch

- PASS — Snapshot retains its own second image after the current overlay is replaced
- PASS — Malformed recipe leaves existing edits untouched
- PASS — Pressure samples vary mask radius while mouse radius remains stable
- PASS — Undoing the selected stroke clears eraser selection and allows a new stroke
- PASS — Transparent, solid, edge, and mirror expansion modes produce their stated fill
- PASS — Expanded render plan respects the 32 MP and 8192-pixel limits
- PASS — Two-finger browser touch gesture zooms the photo
- PASS — No uncaught errors during recovery and touch checks

## Creative filter pixel invariants

- PASS — All filters at zero are byte-identical; bypass retains neutral output
- PASS — Halation makes a warm halo around a highlight, without lifting remote shadows
- PASS — Halation threshold and spread change the visible halo
- PASS — Grunge is repeatable, spatially varied, and seed-sensitive
- PASS — Four film palettes differ; silver produces neutral monochrome
- PASS — Film fade and grain are controllable and grain is deterministic
- PASS — Dehaze recovers contrast in a synthetic hazy scene; negative adds haze
- PASS — Chromatic aberration preserves green and alpha and reverses red/blue fringes
- PASS — Radial aberration leaves its optical center fixed
- PASS — Combined filters preserve every alpha value, including transparent edges
- PASS — Tiny images and all-transparent images remain finite and stable

## Creative filter browser workflows

- PASS — Five named filters are available in Easy mode with labeled keyboard controls
- PASS — Each filter changes actual preview pixels; bypass and reset recover original pixels
- PASS — Filter amount edits are undoable and redoable
- PASS — Texture seed, film palettes, halation tuning, and aberration direction are functional
- PASS — Combined filters survive autosave and reload with identical pixels
- PASS — New project JSON keeps filter settings and named snapshots
- PASS — Recipe round trip and group bypass preserve all five filters
- PASS — Saved personal looks retain creative filters after a reload
- PASS — Full-detail preview is pixel-identical to a full-size PNG export
- PASS — Old project and recipe schemas gain neutral filter defaults; invalid parameters are sanitized
- PASS — Filter panel fits desktop and phone layouts in every theme
- PASS — No uncaught browser errors

## Visual review

Inspected final desktop dark, light, and high-contrast views and a 390-pixel phone layout. All five creative filter names are visible in Easy mode. Strength, Apply, and Reset are in the selected filter card. Fine-tune starts collapsed and remembers the user's preference. Corrected the card header so Apply sits beside the filter name. Controls do not overflow horizontally; the phone layout places them below the image. A source-relative fringe is visible at image edges in the mobile preview.

## Verification limits and known constraints

- Phone/tablet layouts and two-finger touch gestures were simulated in Chromium; physical iOS/Android devices and pen hardware were not available.
- Safari, Firefox, and Edge were not independently tested.
- Most workflows used the bundled 1600 × 1200 photograph plus synthetic color/alpha fixtures. Import and expansion size limits were tested; this was not a sustained maximum-resolution memory benchmark.
- Full-detail rendering uses more memory and processing time than Fast. Perspective/geometry assembly still runs on the UI thread after worker filtering.
- Browser storage exhaustion/eviction is documented, but was not exhaustively fault-injected.
- Fast preview downsamples the source; fine grain, narrow halos, and tiny fringes can differ from full-size export. Use Full detail for final inspection.
- Dehaze uses a bounded dark-channel-inspired estimate with box smoothing. Bright objects and strong depth edges may overcorrect or develop halos. It cannot reconstruct hidden detail.
- Film palettes and artistic effects are original simulations, not calibrated stock profiles or proprietary Snapseed algorithms. Processing is 8-bit browser RGB.
- New schema-3 projects and schema-2 recipes require v1.3 or later. Legacy projects/recipes import with neutral new-filter amounts. Close old editor tabs when upgrading.
- RAW/HEIC, automatic subject masks, content-aware healing, head pose, dedicated bloom, noise reduction, and batch export remain outside this release.

No release-blocking issue was observed in the tested workflows.
