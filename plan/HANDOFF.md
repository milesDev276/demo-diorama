# Handoff — Hero Diorama Work (as of 2026-10-01)

Read this first when picking up the work. It summarizes where things
stand, what was decided and why, how to run and verify things, and what
comes next. Details live in the linked plan files.

---

## 1. Where Things Stand

| Step | Status | Where |
|---|---|---|
| Phase 1–2 editor | Done | `main` (PR #1) |
| Phase 3 asset system | Done. The commit is misnamed "done phase 2". | `main` (PR #2, `56ec1f5`) |
| Stage 0: Blender pipeline, pilot, hero layout, blockout | Done | `main` (PR #3, branch `phase3`) |
| Stage 1: world scale 1 unit = 1 m, scene file v2 | Done | `main` (PR #4, branch `stage1-scale`) |
| Stage 2: look-dev | Done | `main` (PR #5) |
| Stage 3: Blender GLB pipeline in the app, first six hero assets | Done | `main` (PR #6) |
| **Stage 4: base templates and road surface** | **Implemented, verified and approved by the user (2026-10-01); NOT committed** | branch **`stage4-base`** (cut from `main`) |
| Stage 5: modular building and surface attachment | Next | — |

**Immediate next action:** commit `stage4-base`, push, and open a PR.
The user merges PRs themselves, one branch per stage.

## 2. Documents

| File | What it is |
|---|---|
| [Hero-Diorama-Roadmap.md](Hero-Diorama-Roadmap.md) | Master plan: locked decisions L1–L8 and Stages 0–7, with status per stage |
| [Hero-Layout.md](Hero-Layout.md) | Hero scene dimensions in meters (16 × 16 m corner base). This is the source of truth for the blockout and for asset sizes. |
| [Stage-1-Implementation.md](Stage-1-Implementation.md) | Scale migration: value table and verification results |
| [Stage-2-Implementation.md](Stage-2-Implementation.md) | Look-dev: decisions D1–D6, the bugs that were found, and verification results |
| [Stage-3-Implementation.md](Stage-3-Implementation.md) | GLB pipeline and the first six assets: decisions D1–D8, deviations, asset table and verification results (§7) |
| [Stage-4-Implementation.md](Stage-4-Implementation.md) | Base templates and the corner base: decisions D1–D8, deviations and verification results (§7) |
| `Phase-*.md` | Earlier phases, kept for history |

## 3. Decisions That Must Not Be Re-litigated

* **World scale is 1 unit = 1 m.**
  * Old procedural geometry still uses the legacy unit (≈ 6 m). It is
    rendered through `legacyUnits: true` in `assetRegistry.ts` and the
    `LEGACY_UNIT_SCALE` group in `Ground.tsx`.
  * Never import `utils/legacyUnits.ts` from new code.
* **Scene file v2.**
  * `migrateRawObjects()` in `sceneSerializer.ts` handles v1 by
    multiplying positions × 6.
  * Only bump the version for changes in meaning. Additive optional fields
    get defaults in the validator and do not bump it.
* **Nothing is bought or downloaded as an asset.**
  * Fixed-shape models are Blender files built by Python scripts that
    Claude writes and runs headless.
  * Parametric pieces are generated in app code.
  * No HDRI files; the environment is built from Lightformers.
* **Style benchmark:** `prop_vending_machine_01`, approved by the user.
  New assets match its shapes, bevels and palette.
* **No baked AO or ground grime on new assets** (user decision, Stage 3).
  * The four assets built before the decision keep it: vending machine,
    AC unit, ginkgo, pedestrian.
  * Every later asset sets
    `WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}`.
  * Runtime cast shadows in the app are not affected.
* **Keep assets simple.** For organic shapes the user wants a plain foam
  look, not fine detail. Do not over-iterate.
* **GLB assets render with three shared materials** (`objects/materials.ts`),
  remapped from the Blender slot names `base`, `emissive`, `printed`.
  `EMISSIVE_INTENSITY` there is the single emissive level for the scene.
* **A scene's base is scene data:** `environment.base`, `"street"` or
  `"corner"`. It is additive (files stay v2); anything missing or unknown
  loads as `"street"`.
* **Everything sized to the base comes from `utils/baseTemplates.ts`:**
  spawn area, grid, preset zooms, focus radius, shadow frustum. Never add
  a new plot-sized constant elsewhere.
* **The corner base mirrors the layout sheet through
  `utils/cornerLayout.ts`.** Change `Hero-Layout.md` first, then that
  file.
* **Printed graphics come from one runtime canvas atlas.**
  `objects/textures/atlasLayout.json` is read by both the app and Blender;
  a new cell needs a rectangle there and a painter in `graphicsAtlas.ts`.
  Opaque cells render through `printed`; transparent ones (listed in
  `TRANSPARENT_CELLS`, e.g. 止まれ) through the `decal` material.
* **Tone mapping is Neutral, not AgX.** AgX greyed the palette; see Stage 2
  D2.
* **`@react-three/postprocessing` is pinned to exactly `3.0.4`.** Anything
  newer needs `@react-three/fiber >= 9.7`, and fiber stays at 9.6.1.

## 4. How to Run and Verify

The platform is Windows. Node 22.14, Chrome, and Blender 5.2.2 LTS at
`C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`. There is no
test runner.

```bash
npm run dev                  # http://localhost:3000/diorama
npm run lint
npm run build                # includes the TypeScript check

# Screenshots of all 4 camera presets, editor + Preview, in headless Chrome (dev server must run)
node scripts/capture-presets.mjs <outDir> [--url <url>] [--seed-scene <file>] [--save-scene <file>]

# Frame rate (editor + Preview, 1920×1080) and renderer.info for a grid scene or a seeded one
node scripts/measure-scene.mjs --types keiCar,bicycle --count 100 [--seconds 5] [--save-seed <file>]

# Blender: build one asset, several, or `all` (GLB → public/models/<category>/, previews → art/previews/)
# Exits non-zero if an asset is over its triangle budget or over 3 draw calls.
"<blender.exe>" --background --factory-startup --python art/blender/build.py -- prop_vending_machine_01

# Blender: hero blockout (GLB → public/models/_dev/, previews → art/previews/)
"<blender.exe>" --background --factory-startup --python art/blender/blockout/hero_blockout.py
```

* **Dev views:**
  * `/diorama?dev=blockout` shows the hero blockout on the corner base
    instead of the scene's objects. Open it on a corner scene, so the
    camera presets frame the 16 m base.
  * `/diorama?dev=stats` exposes the R3F state as `window.__dioramaThree()`
    (renderer, scene, camera) for the measurement and verification scripts.
  * **Preview** turns on the perspective camera and the effect stack.
* **Verification method used so far:**
  1. Capture before and after with `capture-presets.mjs`.
  2. Pixel-diff the images with numpy inside Blender.
  3. For migrations, use `--seed-scene` to simulate an old autosave.
  4. For fps, count `requestAnimationFrame` at 1920×1080 with 100 seeded
     objects.

  The fps and draw-call check is now `scripts/measure-scene.mjs`. The
  diff, crop, close-up and round-trip helpers were one-off scripts and are
  **not** in the repo. Recreate them from the `Cdp` and `launchBrowser`
  exports of `capture-presets.mjs`.

## 5. Gotchas Learned the Hard Way

* **Stopping a background `npm run dev` does not kill the Next child
  process.** It keeps port 3000, and the next start falls back to 3001.
  Kill the whole tree: `taskkill /PID <pid> /T /F`.
* **`npm install pkg@~x.y.z` can silently upgrade peers.** It resolved
  3.0.5 and bumped fiber to 9.8.1. Check `npm ls @react-three/fiber` after
  every install.
* **Blender reads `palette.ts` with a regex:** one `key: "#rrggbb",` per
  line. Keep that format. Every such key becomes a Blender palette color.
* **A transparent canvas plus blur effects gives bright fringes.** Preview
  therefore composites the sky itself (`SkyBackdropEffect`) before the
  tilt-shift. Keep that effect after tone mapping and before any blur.
* **The camera rig (`CameraControls.tsx`):**
  * R3F creates a placeholder camera on the first render, so only switches
    between the rig's two cameras are matched.
  * Zoom is restored from when Preview was entered, not recomputed,
    because the canvas resizes around the switch.
* **Fog is relative to the orbit target distance** (`SceneFog.tsx`). A
  fixed fog range swallows the more distant perspective camera.
* **R3F's `shadows` defaults to PCFSoft,** which three r184 deprecates. Use
  `shadows="percentage"` plus `shadow-radius`.
* **`renderer.info` counts the main pass only.** three r184 resets it
  after the shadow pass.
* **Headless fps is capped at 180** on this machine. An empty scene and
  100 objects both report 180, so use a heavier scene to see headroom.
* **Close-up screenshots:** `__dioramaThree()` gives `camera` and
  `controls` (the OrbitControls). Set `controls.target`, the camera
  position and `camera.zoom`, then call `updateProjectionMatrix()` and
  `controls.update()`.
* **`capture-presets.mjs` sometimes frames the first Preview shot small**
  (a resize/screenshot race, about one run in four). Re-run it.
* **`measure-scene.mjs --types` builds a street scene.** For the corner
  base, write a scene file with `environment.base` and pass
  `--seed-scene`.
* **A printed face needs interior vertices** (`cuts=`) when AO is baked.
  A single quad takes the AO of its four corners and the whole print goes
  dark.
* **A Next dev server may already be running on port 3000.** It writes to
  `.next/dev`, so `npm run build` can run beside it. Reuse it; never kill
  a server you did not start.
* **bmesh `create_icosphere`:** `subdivisions=1` is 20 faces, 2 is 80,
  3 is 320.
* **The emissive material patches three's shader** after
  `<emissivemap_fragment>` (`materials.ts`). Re-check it on a three
  upgrade.

## 6. Known Limitations and Existing Behaviors (not bugs of these stages)

* **The street strip is still legacy geometry** (≈ 6 m units, 43 draw
  calls). Only the corner base is authored in meters.
* **Base changes are not on the undo stack.**
* **Manhole and gutter grates are not placeable** until Stage 5's
  surface snap.
* **Redo does not restore the selection.**
* **Duplicates are not clamped to the plot.**
* **Lighting was re-checked with the first GLBs** in Stage 3 and left
  unchanged.
* **Legacy vending machines in old scenes got smaller** (1.32 → 1.0 m
  wide): the GLB is at real scale.
* **Blender previews show printed faces blank.** Prints only exist in the
  app's runtime atlas.
* **`npm audit` reports 10 findings.** They all predate this work (next,
  tailwind, sharp, …) and were not addressed.

## 7. Next: Stage 5 — Modular Building and Surface Attachment

From the roadmap; it is the core stage. Write
`Stage-5-Implementation.md` first and get it approved.

* **Modules from Blender,** on the L6 grid (bay 1.82 m, floors 3.2 / 2.8
  m, parapet 1.1 m), without baked AO: wall, window, shopfront and balcony
  bays, corner, parapet, roof pieces.
* **A `building` type driven by `params`:** bay counts, a facade per floor
  and side, a roof type. The app assembles instanced modules.
* **Attachments with `parentId`:** AC, laundry, water tank, rooftop items,
  pots, sign frames. Fix the parent/child rules for delete, duplicate,
  undo and import before writing code.
* **Click-to-place with a ghost and surface snap.** This also makes the
  manhole and gutter grate placeable; today they are fixed details of
  `CornerBase`.
* **Target footprint on the corner base:** x −3.76 … 1.7, z −3.76 … 1.7
  (Hero-Layout §3). `?dev=blockout` on a corner scene shows the massing.
* **Done when:** the hero building can be built from a preset in under 5
  minutes, attachments follow moves, and undo/redo, duplicate,
  multi-select, lock/hide, save and import stay correct with parent/child
  links.

## 8. Working With This User

* **Language:** the user writes in Vietnamese. Reply in Vietnamese; repo
  docs are in English.
* **Plan first:** at the start of each stage, write the plan doc and get it
  approved, then implement.
* **Git:** the user commits, pushes and merges through GitHub PRs
  themselves. When asked, provide a commit message and a PR description.
* **Reporting:** follow CLAUDE.md §46 — implemented, files, verification
  with real numbers, limitations.
