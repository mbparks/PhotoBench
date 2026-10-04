# PHOTOBENCH v1.4.0 — implementation verification

Verified 2026-10-04. **33 executed checks passed. Browser acceptance was not run for this bundle.**

## Executed checks

| Suite | Environment | Passed |
|---|---|---:|
| `tests/inpaint.cjs` | Node, pure inpainting algorithm | 8 |
| `tests/eraser-integration.cjs` | Native Canvas, real worker threads, actual app modules | 14 |
| `tests/filters.cjs` | Node, actual photo-processing worker functions | 11 |

The integration harness uses a minimal DOM and storage adapter. It runs the real mask, preview, keep, history, project, validation, render, and inpainting functions. The worker adapter runs the actual embedded inpainting code in a dedicated Node worker thread. It copies native Canvas buffers for the Node bridge; the browser code still uses transferables. These tests do not verify browser layout, events, IndexedDB behavior, or service workers.

## Object removal pixel quality

- Object disappears exactly on a flat wall.
- Smooth gradient is reconstructed without retaining the painted object.
- A straight boundary continues through the removed object.
- Repeated horizontal texture retains pattern and contrast.
- Unpainted pixels and every alpha byte are preserved exactly.
- An edge-touching object and disconnected objects can be filled.
- No masked pixel is ever selected as a source donor; repeated fills are deterministic.
- Empty masks and masks without usable surroundings fail with actionable errors.

## Magic Eraser Canvas and worker integration

- Actual brush handlers create recoverable add/subtract masks.
- Real worker produces a preview while committed state and source remain unchanged.
- Keep commits one reversible removal and retains original source.
- Project and snapshot assets round-trip with exact removal pixels.
- IndexedDB save payload retains patches and painted mask metadata.
- Snapshot-only removal assets survive current-session reset.
- Bypass and geometry preserve the non-destructive removal model.
- Refine last removal restores its mask; discard leaves the mask available.
- Retry computes another proposal without accumulating kept removals.
- Cancellation stops work and preserves both the photo and mask.
- Legacy projects get an empty eraser; malformed patch references reject safely.
- Native-resolution removal retains PNG alpha outside and inside the mask.
- Reduced analysis reconstructs a native-resolution patch without resizing the photo.
- Photo texture example renders through the same full application pipeline.

## Creative filter pixel regression

- All filters at zero are byte-identical; bypass retains neutral output.
- Halation makes a warm halo around a highlight, without lifting remote shadows.
- Halation threshold and spread change the visible halo.
- Grunge is repeatable, spatially varied, and seed-sensitive.
- Four film palettes differ; silver produces neutral monochrome.
- Film fade and grain are controllable and grain is deterministic.
- Dehaze recovers contrast in a synthetic hazy scene; negative adds haze.
- Chromatic aberration preserves green and alpha and reverses red/blue fringes.
- Radial aberration leaves its optical center fixed.
- Combined filters preserve every alpha value, including transparent edges.
- Tiny images and all-transparent images remain finite and stable.

## Static and visual review

- All source JavaScript, test scripts, service worker, and generated inline script blocks pass `node --check`.
- Static HTML IDs are unique; embedded worker/cancel elements exist; all build placeholders were replaced.
- The actual application pipeline generated `docs/magic-eraser-example.png`. Visual review confirmed that the added magenta test object was replaced with plausible surrounding tree texture. This is an algorithm example, not a browser UI screenshot.
- Full-resolution reconstruction was exercised on a 1536 × 1024 image whose analysis region was downsampled; output dimensions and the flat-background fill remained correct.

## Unverified browser behavior

A local browser executable was unavailable. The Playwright browser download endpoint returned an unavailable page, and the cloud browser blocked the local test URL. No current browser screenshots or browser test results are claimed.

`tests/v14.cjs` contains unexecuted acceptance checks for Easy-mode discoverability, real pointer painting, preview/keep, undo/redo, reload, project download/import, cancellation, clone access, and phone themes. Existing hosted browser suites also need rerunning against v1.4 to verify offline recovery, IndexedDB, touch gestures, exports, and prior workflows after these changes. Physical iOS/Android and Safari/Firefox/Edge remain untested.

The previous v1.3 release passed 70 checks in Chromium 134 on Linux. That is historical evidence only and does not establish browser correctness for the v1.4 bundle.

## Known limits

- Surrounding-pixel reconstruction makes a plausible fill; unique hidden faces, text, structures, and complex crossing lines cannot be recovered reliably. Large selections can repeat texture or leave seams. Retry/refine or use Clone brush for cleanup.
- Analysis is limited to a 720-pixel longest edge; reconstruction uses original native-resolution samples. Fine unique texture may differ. Dimensions and alpha are retained.
- Processing time depends on selection size and texture complexity. Cancel is implemented and tested through the integration harness; real-device responsiveness remains unverified.
- Draft masks and kept patches are saved. A pending preview is temporary and must be kept before photo export. Only the latest kept removal can be directly removed/refined; the ordered stack avoids treating overlapping repairs as independent.
- Browser storage eviction/private mode can affect recovery. Download project JSON for important work. Schema-4 projects require v1.4 or later; previous formats remain importable.

The exact executed check names and runnable-bundle SHA-256 are recorded in `verification.json`.
