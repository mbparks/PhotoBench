# Development checks

These are development checks, not application dependencies. Install Playwright in your preferred development environment:

```sh
npm install --no-save playwright @napi-rs/canvas
npx playwright install chromium
node tests/browser.cjs
node tests/edgechecks.cjs
node tests/v12.cjs
node tests/recovery-v12.cjs
node tests/filters.cjs
node tests/v13.cjs
node tests/inpaint.cjs
node tests/eraser-integration.cjs
node tests/v14.cjs
```

The original browser workflow script serves this checkout at `http://127.0.0.1:8765/photobench/`, launches headless Chromium, exercises editing/recovery/export/offline workflows, writes results to `.test-artifacts/`, then stops the server. Run it when port 8765 is available.

To use an existing compatible Chromium executable, set `CHROME_PATH=/absolute/path/to/chrome` before the node command. The v1.3 baseline was tested using Playwright 1.62.1 and Chromium 134.0.6998.35 on Linux. Browser suites were not rerun for v1.4. Dependencies are intentionally not required for opening or hosting the application.

Checks cover sample import; exposure pixel changes; undo/redo; original comparison; keyboard spacebar; IndexedDB reload; curves; point/brush/clone controls; crop/rotation/straighten; caption/frame; PNG/WebP exports; project round trip; rejection of external image URLs; saved looks; double exposure; themes; inspector collapse; offline reload; phone/tablet layout bounds; Fresh Start; standalone file operation without network; and uncaught browser errors.

The previous release received browser screenshot review; v1.4 received native Canvas pixel checks and before/after image review as described in `docs/TEST-REPORT.md`. Screenshots and generated project/image files are development output and excluded from the repository package.

The v1.2 suites also cover migration from `fixtures/v1-project.json`, editable/erasable masks, perspective coordinate mapping, expansion fills and size caps, HSL/curves, recipes, snapshot asset recovery, touch pinch, and workspace preferences. The fixture embeds the bundled public-domain sample photograph.

`filters.cjs` runs with Node alone. It checks neutral/bypass identity, warm highlight halos, deterministic texture and grain, monochrome output, haze contrast, reversed chromatic fringes, optical-center invariance, alpha preservation, and tiny images. `v13.cjs` exercises discoverability, real preview pixels, undo, individual and group bypass, autosave, schema migration, snapshots, recipes, personal looks, full-detail/export equality, and responsive themes.

For v1.4, `inpaint.cjs` needs Node only. `eraser-integration.cjs` additionally needs `@napi-rs/canvas`; it exercises the real app functions and dedicated worker with a minimal DOM/storage adapter. It is not a browser test. `v14.cjs` is the standalone-file browser acceptance suite for brush gestures, preview, recovery, cancellation, and layouts. The earlier hosted suites cover IndexedDB and offline reload on an HTTP origin. The v1.4 browser suites were not executed in the delivery environment; the exact verification boundary is recorded in `docs/TEST-REPORT.md`.
