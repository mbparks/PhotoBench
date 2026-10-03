# Browser workflow checks

These are development checks, not application dependencies. Install Playwright in your preferred development environment:

```sh
npm install --no-save playwright
npx playwright install chromium
node tests/browser.cjs
node tests/edgechecks.cjs
node tests/v12.cjs
node tests/recovery-v12.cjs
node tests/filters.cjs
node tests/v13.cjs
```

The script serves this checkout at `http://127.0.0.1:8765/photobench/`, launches headless Chromium, exercises editing/recovery/export/offline workflows, writes results to `.test-artifacts/`, then stops the server. Run it when port 8765 is available.

To use an existing compatible Chromium executable, set `CHROME_PATH=/absolute/path/to/chrome` before the node command. The release was tested using Playwright 1.62.1 and Chromium 134.0.6998.35 on Linux. Dependencies are intentionally not required for opening or hosting the application.

Checks cover sample import; exposure pixel changes; undo/redo; original comparison; keyboard spacebar; IndexedDB reload; curves; point/brush/clone controls; crop/rotation/straighten; caption/frame; PNG/WebP exports; project round trip; rejection of external image URLs; saved looks; double exposure; themes; inspector collapse; offline reload; phone/tablet layout bounds; Fresh Start; standalone file operation without network; and uncaught browser errors.

The release also receives screenshot review and targeted pixel/export checks described in `docs/TEST-REPORT.md`. Screenshots and generated project/image files are development output and excluded from the repository package.

The v1.2 suites also cover migration from `fixtures/v1-project.json`, editable/erasable masks, perspective coordinate mapping, expansion fills and size caps, HSL/curves, recipes, snapshot asset recovery, touch pinch, and workspace preferences. The fixture embeds the bundled public-domain sample photograph.

`filters.cjs` runs with Node alone. It checks neutral/bypass identity, warm highlight halos, deterministic texture and grain, monochrome output, haze contrast, reversed chromatic fringes, optical-center invariance, alpha preservation, and tiny images. `v13.cjs` exercises discoverability, real preview pixels, undo, individual and group bypass, autosave, schema migration, snapshots, recipes, personal looks, full-detail/export equality, and responsive themes.
