# Handoff — Hero Diorama Work (as of 2026-10-02)

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
| Stage 4: base templates and road surface | Done | `main` (PR #7) |
| Stage 5: modular building and surface attachment | Done | `main` (PR #8) |
| **Stage 6: density tools** | **Implemented and verified (2026-10-02); NOT committed; waiting for the user's review** | branch **`stage6-density`** (cut from `main`) |
| Stage 7: environment and Photo | Next | — |

**Immediate next action:** the user reviews Stage 6, then commits
`stage6-density`, pushes and opens a PR. The user merges PRs themselves,
one branch per stage. (For Stage 6 the user handed every decision to
Claude, so the plan was settled with its defaults and implemented without
a separate approval round. That was a one-off, not a standing rule.)

**A stash to know about.** `git stash list` holds "stage5 draft slice by
another tool": six edited files and a box-shaped `Building.tsx` that
another tool wrote on 2026-10-01 while the Stage 5 plan was being drafted.
The approved plan replaced that slice, so it was stashed, not applied. It
can be dropped once the user agrees.

## 2. Documents

| File | What it is |
|---|---|
| [Hero-Diorama-Roadmap.md](Hero-Diorama-Roadmap.md) | Master plan: locked decisions L1–L8 and Stages 0–7, with status per stage |
| [Hero-Layout.md](Hero-Layout.md) | Hero scene dimensions in meters (16 × 16 m corner base). This is the source of truth for the blockout and for asset sizes. |
| [Stage-1-Implementation.md](Stage-1-Implementation.md) | Scale migration: value table and verification results |
| [Stage-2-Implementation.md](Stage-2-Implementation.md) | Look-dev: decisions D1–D6, the bugs that were found, and verification results |
| [Stage-3-Implementation.md](Stage-3-Implementation.md) | GLB pipeline and the first six assets: decisions D1–D8, deviations, asset table and verification results (§7) |
| [Stage-4-Implementation.md](Stage-4-Implementation.md) | Base templates and the corner base: decisions D1–D8, deviations and verification results (§7) |
| [Stage-5-Implementation.md](Stage-5-Implementation.md) | Modular building, parent/child rules (D4) and click-to-place: decisions D1–D8, deviations, asset table and verification results (§7) |
| [Stage-6-Implementation.md](Stage-6-Implementation.md) | Scatter brush, kits, rotate while placing, jitter, app-rendered thumbnails: decisions D1–D11, deviations, asset table and verification results (§7) |
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
* **A building is params, not a model.** `type: "building"` carries
  `params` (bays, per-bay facades per floor and side, roof). The app merges
  the Blender facade modules into one geometry per material slot
  (`objects/building/`). Grid numbers live in `utils/buildingParams.ts` and
  `art/blender/lib/facade.py`; keep the two in step.
* **Parent/child rules are Stage 5 D4.** Flat array plus `parentId`; only
  a building is a parent; one level; a child's transform is in the
  building's frame. All world/local math and subtree logic goes through
  `utils/sceneGraph.ts`. Both `params` and `parentId` are additive (files
  stay v2).
* **Adding with the pointer is click-to-place.** A library click starts a
  placement; `PlacementLayer` raycasts onto meshes tagged
  `userData.placementSurface` (the base, buildings) and
  `utils/surfaceSnap.ts` decides the transform. Keyboard activation still
  uses the spawn spiral.
* **Building modules tile, so they have no per-face jitter** and nothing
  bevelled at their left and right ends (`facade.WEATHER`).
* **Scatter is one `scatter` object per layer** (Stage 6 D1):
  `params: { kind, seed, points }`, points in the layer's frame, rounded to
  millimeters, at most 1,500. `params` is a union keyed by `type`; read it
  through `utils/objectParams.ts` (`buildingParamsOf`, `scatterParamsOf`),
  never cast inline.
* **A scatter piece's heading, size and tint are derived, never stored:**
  a hash of the seed and the piece's position (`objects/scatter/scatterVariation.ts`).
  Changing that hash or a kind's `scale` range changes how every saved
  scene looks.
* **Scatter layers and buildings are never attached** (`canBeChild` in
  `utils/sceneGraph.ts`). The brush paints on flat faces of the base only;
  buildings block it.
* **Kits are library data, not scene data:** `localStorage["diorama-kits"]`
  as `{ version: 1, kits }` (`store/kitStore.ts`), validated with the
  scene validator's `normalizeObjects`. Built-in kits are code
  (`assets/builtInKits.ts`) with fixed ids; thumbnails are named after them.
* **Thumbnails are rendered by the app,** not taken from the Blender
  previews: `scripts/capture-thumbnails.mjs` writes
  `public/thumbnails/*.webp` and `assets/thumbnails.json`. Re-run it after
  changing or adding an asset, preset or built-in kit.
* **While placing, R / Shift+R turn the ghost by 45°** (`placementYaw` in
  the store). That is the only way to turn a kit.
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

# Library thumbnails (dev server must run): every item, or some keys
node scripts/capture-thumbnails.mjs [--only vendingMachine,kit:vending-corner]

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
    (renderer, scene, camera) and the store as `window.__dioramaStore`, for
    the measurement and verification scripts.
  * **Preview** turns on the perspective camera and the effect stack.
  * `/diorama/thumbnails?item=<key>` is the thumbnail studio the capture
    script drives (`window.__thumbnails.show(key)`).
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
* **`build.py all` rewrites every preview and re-bakes the four AO
  assets** with slightly different noise. Build only what changed, or
  restore the untouched ones with `git checkout`.
* **Shell heredocs break on this machine** when the text holds an
  apostrophe or a backtick, and `python` / `python3` are only the Windows
  Store stubs (`py` works). Write script files with the editor tools and
  run them with `node`.
* **Scripted clicks need a visible target.** A test point behind the
  building (seen from the camera) hits the building instead. Pick points
  the preset camera can see, or frame the camera first.
* **Scripted DOM events in one `evaluate` skip React renders.** Handlers
  then see stale props; the building panel avoids that by updating from
  the stored params.
* **The transform gizmo must stay at the scene root** (`SceneObjects.tsx`).
  Inside an object's group it would inherit the parent's transform.
* **The emissive material patches three's shader** after
  `<emissivemap_fragment>` (`materials.ts`). Re-check it on a three
  upgrade.
* **A `main` baseline from a git worktree:** Turbopack refuses a
  `node_modules` junction that points outside the project. Run the worktree
  with `npx next dev --webpack -p 3001`. Remove the junction with
  `rmdir` (cmd) **before** `git worktree remove`.
* **`Box3.setFromObject` without `precise` overstates rotated geometry:**
  it rotates the geometry's own box. The legacy house's hipped roof came
  out twice as wide. The thumbnail studio measures vertices instead.
* **The Next.js dev indicator (`nextjs-portal`) shows up in screenshots.**
  The thumbnail script hides it; editor captures still show the small "N".
* **The brush bar and the inspector both have "Paint" / "Erase" buttons.**
  Scripted clicks by button text hit the brush bar first.
* **React Compiler lint (`react-hooks/immutability`)** flags writing
  `meshRef.current.material.opacity` in `useFrame` in some components.
  Give the material its own ref and write through that.
* **Working-tree files are CRLF** (`core.autocrlf=true`). Scripted
  multi-line replacements must normalize line endings first.
* **An overlay centered with `left-1/2 -translate-x-1/2`** can only be half
  as wide as its container, so it wraps. Use `inset-x-*` with a centered
  flex row.
* **Test points hidden behind the building** (seen from the preset camera)
  make placing fail silently: the ray hits a wall. Pick visible points.

## 6. Known Limitations and Existing Behaviors (not bugs of these stages)

* **The street strip is still legacy geometry** (≈ 6 m units, 43 draw
  calls). Only the corner base is authored in meters.
* **Base changes are not on the undo stack.**
* **Attachments do not follow a building resize;** the inspector edits a
  facade side at once, not per bay; the gizmo neither snaps to surfaces
  nor re-parents. The full list is in Stage-5-Implementation.md §7.
* **Scatter only on the base; erase acts on every layer of the kind; kits
  cannot be renamed or exported; a placed kit cannot be turned afterwards.**
  The full list is in Stage-6-Implementation.md §7.
* **Building windows glow in daylight** until Stage 7 drives
  `EMISSIVE_INTENSITY` from the time of day.
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

## 7. Next: Stage 7 — Environment and Photo

From the roadmap. Write `Stage-7-Implementation.md` first and get it
approved.

* **`environment.timeOfDay`**, five presets (morning, day, golden hour,
  evening, night), each driving sun color, angle and intensity, the sky
  gradient and Lightformers, and `EMISSIVE_INTENSITY` in
  `objects/materials.ts` (windows glow in daylight until then).
* **Evening and night:** a few non-shadow shop lights; an interior
  backplate (shelves, goods) behind the shop glass, from Blender.
* **`environment.season`:** foliage tint and whether fallen leaves show.
  Scatter leaves take their colors from the piece's vertex colors times a
  per-instance brightness (`ScatterLayer.tsx`, `setColorAt`); a season
  tint can multiply that instance color.
* **Photo mode:** 1:1 / 4:5 / 16:9 frames, click-to-focus tilt-shift,
  exposure, PNG export at 2–4×.
* **The hero scene becomes a built-in starter template.**
* Both environment fields are additive (files stay v2); the validator gives
  them defaults.
* **Still open from the hero list (L7):** utility pole and transformer in
  meters, zelkova, block wall, hedge, post box, meter box. (Recycling bin,
  A-frame sign and chair were built in Stage 6.) Decide with the user
  where they go.
* **Done when:** at golden hour and at dusk, the hero scene passes the §49
  gate next to the reference.

## 8. Working With This User

* **Language:** the user writes in Vietnamese. Reply in Vietnamese; repo
  docs are in English.
* **Plan first:** at the start of each stage, write the plan doc and get it
  approved, then implement.
* **Git:** the user commits, pushes and merges through GitHub PRs
  themselves. When asked, provide a commit message and a PR description.
* **Reporting:** follow CLAUDE.md §46 — implemented, files, verification
  with real numbers, limitations.
