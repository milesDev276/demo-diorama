# Stage 1 — Scale Migration (Implementation Plan)

Part of [Hero-Diorama-Roadmap.md](Hero-Diorama-Roadmap.md) (decision L1).

**Goal:** change the world unit from "1 unit ≈ 6 m" to **1 unit = 1 m**
with **no visible change** to the scene. The only intended changes are the
three unit-related editor behaviors listed in D4.

**Why now:** Blender assets are authored in meters. Stage 2 lighting
values (AO radius, shadow bias, light frustum) are in world units. Doing
the switch first means those values are only tuned once.

Branch: `stage1-scale`.

---

## 0. Starting Point (verified 2026-09-30)

* **World scale.** `worldScale.ts` defines `METERS_PER_UNIT = 6`. Its
  street-plot and pole constants are in old units.
  * Legacy geometry that imports those constants: `Ground.tsx`,
    `objects/ground/Road.tsx`, `objects/ground/Sidewalk.tsx`,
    `objects/UtilityPole.tsx`, `objects/PowerLine.tsx`.
  * Meter-space code that also imports them: `objectDefaults.ts` (spawn
    bounds, default scene) and `DioramaCanvas.tsx` (grid size and fade).
* **Hard-coded geometry.** Every object in `objects/` has many literal
  sizes in old units. So do Ground, Road and Sidewalk: slab, dashes, joints
  and curb.
* **Scene file.** `SCENE_FILE_VERSION = 1`, and there is no migration
  path. `validateAndNormalizeScene()` is the single entry point for
  autosave and for import.
* **Baseline** captured on `main` with the new
  `scripts/capture-presets.mjs`:
  * edit and Preview screenshots at all 4 presets
  * the default scene as the app saves it (a v1 file)
  * no page errors
  * The images live in the session scratchpad. Re-run the script on
    `main` to regenerate them.

---

## 1. Decisions

### D1 — Legacy geometry is scaled, not rewritten

Rewriting every literal in 8 objects + 3 ground components is where bugs
would come from. Instead:

* New `utils/legacyUnits.ts`:
  * `LEGACY_UNIT_SCALE = 6`
  * the old-unit constants moved out of `worldScale.ts` **unchanged**:
    `PLOT_WIDTH`, `STRIP_DEPTH`, `PLOT_DEPTH`, `PLOT_Z`,
    `ROAD_SURFACE_Y`, `POLE_HEIGHT`, `CROSSARM_HEIGHT`,
    `POWER_LINE_SPAN`, `POWER_LINE_ATTACH`
  * Only legacy geometry may import this file.
* Each registry entry has `legacyUnits: boolean`. `DioramaObject` renders
  a legacy visual inside `<group scale={LEGACY_UNIT_SCALE}>`.
* `Ground` wraps its contents the same way.
* The wrapper is deleted per asset when that asset is rebuilt in meters:
  a Blender GLB in Stage 3, the street base in Stage 4.
* `SelectionRing` sits **outside** the wrapper, so `footprintRadius`
  becomes meters.

### D2 — `worldScale.ts` becomes meters-only

* `METERS_PER_UNIT = 1`.
* New `STREET_PLOT` holds meter-space values derived from the legacy
  constants × `LEGACY_UNIT_SCALE`: `{ width, depth, z: { back, lot,
  sidewalk, road, front } }`. It is derived so it can never drift from the
  legacy geometry that draws the plot.
* Used by `objectDefaults.ts` and `DioramaCanvas.tsx`.

### D3 — Scene file v2

* `SCENE_FILE_VERSION = 2`.
* `migrateScene()` runs inside `validateAndNormalizeScene()` before
  normalization, so autosave and import share it.
  * v1 → v2: `position × 6`. Rotation and scale are unchanged; the legacy
    wrapper keeps the size.
  * A missing `version` is treated as 1. The app has always written
    `{ version, savedAt, scene }`.
  * A version newer than the app returns an error: "This file was made
    with a newer version of the app." Today such a file would silently
    load with wrong units.

### D4 — Intended behavior changes (everything else must stay identical)

| # | Change | Before | After |
|---|---|---|---|
| 1 | Grid options | 0.25 / 0.5 / 1 units (1.5 / 3 / 6 m) | **0.1 / 0.25 / 0.5 / 1 m**, labels show "m" |
| 2 | Default grid | 0.5 unit (3 m) | **0.5 m** (CLAUDE.md §23) |
| 3 | Position field step | 0.1 unit (0.6 m) | 0.1 m (no code change; the unit changed) |

Duplicate offset stays at the same physical distance (3 m). Revisit it
when small props arrive in Stage 3.

### D5 — Dev blockout behind a URL flag

* `hero_blockout.py` also exports `public/models/_dev/hero_blockout.glb`.
* `/diorama?dev=blockout` renders that GLB in place of the ground and
  scene objects.
* Scope:
  * It is the lighting target for Stage 2.
  * It is the first GLB loaded in the app, via `useGLTF` + drei
    `<Clone castShadow receiveShadow>`.
  * It is not a registry asset and does not touch scene data.

---

## 2. Value Table (old → new)

| File | Value | Old | New |
|---|---|---|---|
| `cameraPresets.ts` | `DEFAULT_CAMERA_TARGET` | [0, 0.3, 0] | [0, 1.8, 0] |
| | isometric | [8, 7, 8], zoom 72 | [48, 42, 48], zoom 12 |
| | front | [0, 2.4, 13.5], zoom 88 | [0, 14.4, 81], zoom 88/6 |
| | side | [13.5, 2.4, 0], zoom 88 | [81, 14.4, 0], zoom 88/6 |
| | top | [0, 13.5, 0.01], zoom 100 | [0, 81, 0.06], zoom 100/6 |
| `sceneDefaults.ts` | `DEFAULT_CAMERA_STATE` | [8, 7, 8] / [0, 0.3, 0] / 72 | [48, 42, 48] / [0, 1.8, 0] / 12 |
| `DioramaCanvas.tsx` | camera position, zoom, near, far | [8, 7, 8], 72, 0.1, 100 | [48, 42, 48], 12, 0.6, 600 |
| | fog near / far | 15 / 27 | 90 / 162 |
| | `<Grid>` y | 0.012 | 0.072 |
| `CameraControls.tsx` | minZoom / maxZoom | 30 / 200 | 5 / 200/6 |
| | minDistance / maxDistance | 4 / 26 | 24 / 156 |
| | `focusOn` radius floor, padding, distance | 1.5, 1.5, 13 | 9, 9, 78 |
| | `focusOn` zoom clamp | [32, 170] | [32/6, 170/6] (`95 / radius` already scales) |
| `SceneLighting.tsx` | sun position | [6, 7, 3.5] | [36, 42, 21] |
| | shadow frustum ±, near, far | 6, 0.5, 20 | 36, 3, 120 |
| | shadow bias | −0.0015 | unchanged: normalized depth, and the frustum scales uniformly |
| `SelectionRing.tsx` | ring y | 0.02 | 0.12 |
| `assetRegistry.ts` | `footprintRadius` | house 0.85, shop 0.85, pole 0.2, line 0.2, vending 0.2, sign 0.15, tree 0.5, rock 0.45 | × 6 |
| `objectDefaults.ts` | spawn insets 0.35 / 0.25 / 0.1, spiral `min(3, 0.6 + n·0.35)`, jitter 0.3 | — | × 6 |
| | `getDefaultScene()` x values and offsets | — | × 6, written as meter literals |
| `sceneValidator.ts` | `POSITION_LIMIT` | 30 | 180 |
| `dioramaStore.ts` | duplicate offset | 0.5 | 3 |
| | `gridSize` default | 0.5 (3 m) | 0.5 m (D4) |
| `EditorSubToolbar.tsx` | `GRID_SIZES` | [0.25, 0.5, 1] | [0.1, 0.25, 0.5, 1] + "m" label (D4) |

Unchanged on purpose:

* object `scale` (it is relative)
* `TransformControls` size (screen-space)
* grid line thicknesses (screen-space)
* rotation values

---

## 3. Milestones

Each milestone ends with `npm run lint` and `npm run build` passing.

### M1 — Legacy unit layer (D1, D2)

* New `utils/legacyUnits.ts`. Move the old-unit constants and repoint the
  5 legacy imports.
* `worldScale.ts`: meters only, with `STREET_PLOT`.
* `assetRegistry.ts`: wrap all 8 components, footprint radii × 6.
* `Ground.tsx`: wrap in the legacy scale.

### M2 — Re-tune world-unit values (§2)

Covers the camera, controls, lighting, canvas, selection ring, spawn and
default scene, validator limit, duplicate offset, and grid options/default.

### M3 — Scene file v2 (D3)

* `sceneSerializer.ts`: `SCENE_FILE_VERSION = 2`, `migrateScene()`.
* `sceneValidator.ts`: call it first, and reject newer versions.

### M4 — Dev blockout (D5)

* `hero_blockout.py`: GLB export.
* New `components/dev/HeroBlockout.tsx`.
* `DioramaCanvas.tsx`: the `?dev=blockout` switch, inside `<Suspense>`.

### M5 — Verification tooling

`scripts/capture-presets.mjs` gains:

* `--seed-scene <file>`: writes a scene into localStorage before the app
  loads, simulating an old autosave.
* `?dev=blockout` goes through the existing `--url` option.

---

## 4. Verification

| # | Check | How | Pass when |
|---|---|---|---|
| V1 | No visual change | Capture on `stage1-scale`; pixel-diff the Preview images against the `main` baseline | All 4 presets match, apart from sub-pixel noise |
| V2 | Edit mode | Look at the edit screenshots | Only the grid density differs (D4) |
| V3 | Old autosave | `--seed-scene` with the saved v1 default scene | Renders like the baseline; after save, localStorage has `version: 2` and positions × 6 |
| V4 | Old autosave, custom layout | `--seed-scene` with a v1 file where one object was moved | That object appears at the moved spot. This proves the file was migrated, not replaced by the default scene |
| V5 | Import | Import the same v1 files through the Import button | Same result as V3/V4 |
| V6 | Newer file | Import a file with `version: 3` | Clear error message, and the scene is unchanged |
| V7 | Editor behavior | In the browser: add object, move with 0.5 m snap, rotate snap, duplicate, focus (F), undo/redo | All work; spawned objects land on the plot |
| V8 | Blockout | Capture with `?dev=blockout` | The blockout renders, casts shadows, no page errors |
| V9 | Static checks | `npm run lint`, `npm run build` | No new errors |

## 5. Risks

* **The grid will look dense.** At the current zoom a 0.5 m cell is ~6 px
  on the 50 m legacy plot. The 16 m corner base in Stage 4 fixes this
  (≈ 20 px cells).
  * If it is too noisy in V2, set the default to 1 m until Stage 4.
* **Something in old units gets missed.** V1 pixel diffs at every preset,
  plus V3/V4 positions, catch that.
* **Precision.** Positions grow ×6 (max ~25 m). This is far from float32
  limits, and depth precision is unchanged because near and far scale
  together.

---

## 6. Status — Implemented 2026-09-30

M1–M5 are done. Every check in §4 passes.

### Deviations from the plan

* **Legacy wrapper (D1).** Implemented as a `legacyUnits` flag on each
  registry entry, rendered by `DioramaObject`, not as a
  `withLegacyUnits()` wrapper function. The React Compiler lint rules flag
  components created inside factory functions, and a flag also documents
  each asset's unit in the registry itself.
* **Import error message.** `importScene` in `dioramaStore.ts` used to
  replace every validator error with "invalid or corrupted". It now shows
  the validator's message, so V6 can say "made with a newer version". The
  wording for corrupted files is unchanged.

### Verification results

Screenshots were taken with the real GPU; pixel diffs were done with numpy
in Blender.

| Check | Result |
|---|---|
| V1 | Preview diffs vs. `main`: front and top max 1/255. Side: 0.001 % of pixels > 8/255. Isometric: 0.018 %, a sub-pixel antialiasing line along one power wire. |
| V2 | Edit mode differs only by the 0.5 m grid. It reads as fine graph paper, not noise, so the default stays 0.5 m. |
| V3 | A seeded v1 autosave renders identically to baseline. The re-saved file is v2 with positions exactly ×6 and object ids preserved. |
| V4 | A seeded v1 file with the vending machine moved loads with it at x = −3 m. |
| V5 | Importing the same v1 file gives the same result. |
| V6 | A version 3 file shows "Unable to import Diorama. This file was made with a newer version of the app." The scene is unchanged. |
| V7 | Grid options are 0.1 / 0.25 / 0.5 / 1 m. New objects spawn on the plot. Duplicate offset is 3.000 m. Undo and redo work. The properties panel shows meters. F centers the selection at the same relative zoom as before. |
| V8 | `?dev=blockout` loads the GLB with vertex colors and shadows. It looks small because the presets still frame the 50 m legacy plot; Stage 2 reframes. |
| V9 | `npm run lint` and `npm run build` pass. |

No page errors were logged in any run.

### Noticed, not changed (existing behavior)

* **Redo does not reselect.** Undo drops the selection, and redo does not
  restore it.
* **Duplicates are not clamped to the plot.** A duplicate of an object
  near the front can land on the road.
