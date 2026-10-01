# Stage 4 — Base Templates and Road Surface (Implementation Plan)

Part of [Hero-Diorama-Roadmap.md](Hero-Diorama-Roadmap.md) (decisions L1,
L4, L7). Dimensions come from [Hero-Layout.md](Hero-Layout.md) §1–2.

**Goal:** the diorama gets a second base, the **16 × 16 m street corner**
of the hero scene, next to today's street strip. A scene remembers which
base it uses. The corner base is built in app code, in meters, with road
markings, and it replaces the base pieces of the dev blockout.

Branch: `stage4-base`, cut from `main` (Stage 3 is merged, PR #6).

---

## 0. Starting Point (verified 2026-10-01)

* **One base, in legacy units.** `Ground.tsx`, `Road.tsx` and
  `Sidewalk.tsx` draw the 50.4 × 27 m street strip inside a
  `LEGACY_UNIT_SCALE` group, about 60 meshes (43 draw calls for an empty
  scene).
* **`environment` is not really scene data yet.**
  * The type has `background` and `ground`, both fixed strings.
  * The validator throws the file's `environment` away and substitutes the
    default. `loadInitialState()` ignores it too.
  * Autosave only watches the scene name and the objects.
* **Everything sized to the plot is a constant:** spawn bounds
  (`objectDefaults.ts`), the grid (`DioramaCanvas.tsx`), the camera presets
  and target (`cameraPresets.ts`), the shadow frustum (±32 m in
  `SceneLighting.tsx`), `focusOn` zoom limits.
* **UI.** "New" creates an empty scene directly (a confirm dialog appears
  only for unsaved changes). There is no environment panel; the inspector
  shows "No object selected" when the selection is empty.
* **Blockout.** `hero_blockout.py` builds the corner base, the road
  markings, a manhole and five grates as gray boxes, and
  `?dev=blockout` shows that GLB **instead of** the ground.
* **Atlas.** Two cells exist (`vending_ad`, `plate_kei`); the `printed`
  material is opaque.

---

## 1. Decisions

### D1 — `environment.base` becomes real scene data

```ts
export type DioramaBase = "street" | "corner";
interface DioramaEnvironment { background: string; ground: string; base: DioramaBase }
```

* **Additive, no version bump** (roadmap L1 rule). A file without
  `environment.base`, or with an unknown value, loads as `"street"`. So
  every existing autosave and export keeps its look.
* The validator now reads `environment.base`. The other two fields keep
  their defaults, as today.
* `loadInitialState()` restores the environment, and autosave's
  fingerprint includes the base.
* Store: `setBase(base)`. It is not on the undo stack, which holds object
  snapshots only. Switching back is the undo.

### D2 — One table describes each base: `utils/baseTemplates.ts`

Everything that today is a constant tied to the street strip moves into
one record per base. Consumers read the active template instead of
importing `STREET_PLOT`.

| Field | `street` (unchanged values) | `corner` |
|---|---|---|
| Size | 50.4 × 27 m | 16 × 16 m |
| Spawn bounds | lot + sidewalk, as today | lot and sidewalks: x −7 … 3, z −7 … 3 |
| Grid | whole plot, y 0.072 | 16 × 16 m, y 0.01 |
| Camera target | (0, 1.8, 0) | (0, 1.8, 0) |
| Preset zoom (iso / front / side / top) | 12 / 14.7 / 14.7 / 16.7 | ≈ 34 / 40 / 40 / 44, tuned so the base fills the frame |
| Shadow frustum half-size | 32 m | 14 m, so the 2048² map is about twice as sharp |
| Default scene (Reset) | today's vertical slice | corner starter (D6) |

* Orbit `maxZoom` rises from 33 to 80 px/m for both bases. The corner
  presets sit near the old limit, and small props need closer views.
* `focusOn` keeps its behavior; its zoom clamp follows the new limit.

### D3 — `CornerBase`: app code, meters, three draw calls

`Ground.tsx` becomes a switch: `StreetBase` (today's code, moved
unchanged into `objects/ground/StreetBase.tsx`) or `CornerBase`.

* **Surfaces (1 draw call).** Lot, two sidewalks, two roads, curbs,
  sidewalk joints and the painted lines are boxes merged with
  `mergeGeometries` into one vertex-colored mesh (palette colors, a matte
  ground material). Heights follow the layout sheet: lot and sidewalks at
  y 0, roads at y −0.15, curb 0.15 m.
* **Painted lines are geometry,** 4 mm proud of the asphalt, like the
  legacy road lines: 5 crosswalk stripes, the stop line, both edge lines.
* **止まれ (1 draw call)** is one atlas cell, `road_tomare`, drawn white on
  transparent and rendered on a quad through a new shared **`decal`**
  material: the atlas with alpha blending and polygon offset, lit and
  shadowed like the road. This is the first transparent cell; `paintCell`
  clears a transparent cell's rectangle instead of extending opaque edges.
* **Plinth (1 draw call).** Dark, from y −0.15 down to −1.35, with a small
  bevel (`RoundedBoxGeometry`, which ships with three).
* **Curb ramp.** The right sidewalk drops to road level along the
  crosswalk (x 3.5, z 0.5 … 3.0) as a sloped wedge in the merged mesh.
* No legacy units anywhere in the new code.

### D4 — Blender pieces, without baked AO

All three follow the Stage 3 rule: `WEATHER = {"ao_strength": 0.0,
"grime_strength": 0.0}`, simple shapes.

| Asset | Size | Budget | Use |
|---|---|---|---|
| `street_manhole_01` | Ø 0.6, 2 cm proud | ≤ 1.5k | fixed detail of the corner base, at (−2, 5.8) |
| `street_gutter_grate_01` (側溝) | 1.0 × 0.3 | ≤ 1.5k | fixed detail of the corner base, 5 places from the layout sheet |
| `street_curve_mirror_01` (カーブミラー) | 3.2 m pole, Ø 0.8 mirror, orange | ≤ 1.5k | **placeable asset** `curveMirror`, category Street |

* **Manhole and grates are part of the base, not placeable.** They sit in
  the road surface at y −0.15. Until Stage 5 brings surface snap, placing
  them by hand would mean typing a Y offset. `CornerBase` renders them
  through `GltfAsset` at the layout positions.
* Palette additions: an orange for the mirror frame and pole, a pale
  mirror-glass tone.

### D5 — Choosing the base in the UI

* **New.** The "New" button opens a small dialog with two cards, "Street
  strip" and "Street corner". Picking one creates the empty scene on that
  base. The unsaved-changes warning becomes a line inside this dialog, so
  there is still one dialog, not two.
* **Inspector.** With nothing selected, the right panel shows a "Scene"
  section with the base as a two-option switch, in place of today's empty
  state text. This is the first piece of the Environment panel
  (CLAUDE.md §29).
* **Switching the base of an existing scene** keeps every object where it
  is and moves the camera to the new base's isometric preset. Objects may
  end up outside the smaller base; nothing is deleted or moved.

### D6 — Default scenes

* A first-time visitor still gets the street strip and its vertical
  slice. Nothing changes for them.
* **Reset on the corner base** loads a small starter from the layout
  sheet, using only assets that exist: ginkgo, two vending machines, AC
  unit, bicycle, kei car (on the right road, y −0.15, heading −Z), one
  pedestrian, curve mirror. The building comes in Stage 5.

### D7 — Retire the blockout's base

* `hero_blockout.py` stops exporting its base and marking boxes into the
  GLB. Its two preview renders keep them, so the Blender images still
  read.
* `?dev=blockout` now shows the blockout **on top of `CornerBase`**. That
  is the alignment check: building, pole and props must sit on the app's
  sidewalks and roads exactly as on the layout sheet.

### D8 — Out of scope

* a modular terrain or road editor, more base types, base size options
* surface snap and click-to-place (Stage 5)
* manhole and grate as placeable assets (after surface snap)
* converting the street strip to meters or reducing its draw calls. It
  stays as it is; only its file moves.
* time of day, weather, fallen leaves, block wall, hedge
* undo for base changes

---

## 2. Milestones

### M1 — Scene data and templates (no visual change)

* `DioramaBase`, validator, store (`setBase`, initial state, autosave).
* `baseTemplates.ts`; spawn bounds, grid, presets, camera target and
  shadow frustum read from the active template.
* `Ground.tsx` → switch; `StreetBase.tsx` holds today's code.
* **Check:** all 8 preset screenshots are pixel-identical to `main`.

### M2 — `CornerBase` surfaces

* Merged surface mesh, curb ramp, plinth, painted lines.
* Corner presets and shadow frustum tuned on the empty base.
* **Check:** dimensions against the layout sheet, measured in the scene
  graph (bounding boxes of the lot, sidewalks and roads).

### M3 — 止まれ decal

* `road_tomare` cell and painter, transparent-cell support, `decal`
  material.
* **Check:** reads 止 → ま → れ for a driver approaching the stop line; no
  z-fighting or halo in the editor or in Preview.

### M4 — Blender pieces

* Manhole, grate, curve mirror; `curveMirror` in the registry.
* Manhole and grates placed by `CornerBase`.

### M5 — UI

* New dialog with the two cards; inspector "Scene" section.
* Corner starter scene for Reset.

### M6 — Blockout on the new base, acceptance

* Blockout GLB without base pieces; `?dev=blockout` over `CornerBase`.
* The checks in §4; then the status section here, the roadmap and
  `HANDOFF.md`.

---

## 3. Files

| Change | Files |
|---|---|
| New (app, under `features/diorama/`) | `utils/baseTemplates.ts`, `objects/ground/StreetBase.tsx` (moved from `Ground.tsx`), `objects/ground/CornerBase.tsx`, `objects/ground/cornerGeometry.ts`, `components/NewSceneDialog.tsx`, `components/ScenePanel.tsx` |
| Modified (app) | `types/diorama.types.ts`, `utils/sceneValidator.ts`, `utils/sceneDefaults.ts`, `utils/objectDefaults.ts`, `utils/cameraPresets.ts`, `utils/palette.ts`, `store/dioramaStore.ts`, `hooks/useAutoSave.ts`, `components/Ground.tsx`, `components/DioramaCanvas.tsx`, `components/CameraControls.tsx`, `components/SceneLighting.tsx`, `components/DioramaEditor.tsx`, `components/PropertiesPanel.tsx`, `components/dev/HeroBlockout.tsx`, `assets/assetRegistry.ts`, `objects/materials.ts`, `objects/textures/atlasLayout.json`, `objects/textures/graphicsAtlas.ts` |
| New (Blender) | `art/blender/assets/street/street_manhole_01.py`, `street_gutter_grate_01.py`, `street_curve_mirror_01.py` |
| Modified (Blender) | `art/blender/blockout/hero_blockout.py` |
| Generated | `public/models/street/*.glb`, `public/models/_dev/hero_blockout.glb`, previews in `art/previews/` |
| Docs | this file; roadmap Stage 4 status; `HANDOFF.md` |

No new npm dependencies.

---

## 4. Verification

| Check | How | Target |
|---|---|---|
| Street strip unchanged | `capture-presets.mjs`, 4 presets × editor/Preview, vs. `main` | Pixel-identical apart from render noise |
| Old scenes load as `street` | Seed a v1 file, a v2 file with no `environment.base`, and one with an unknown base | Street strip, objects in place, no error |
| Base survives save / export / import / reload | Round trip on a corner scene | `environment.base === "corner"` each time; file stays v2 |
| Corner dimensions | Bounding boxes in the scene graph vs. Hero-Layout §1–2 | Within 1 cm |
| Blockout alignment | `?dev=blockout` at the isometric and top presets | Building, pole and props sit on the app base as on the sheet |
| Markings | Close-ups of the crosswalk, stop line and 止まれ | Correct positions and reading direction; no z-fighting |
| Base draw calls | `measure-scene.mjs --count 0` on the corner base | Surfaces + decal + plinth + manhole + 5 grates ≤ 10 |
| Blender budgets | `build.py all` | All nine assets within budget; exit 0 |
| UI | New dialog (both cards, with and without unsaved changes), inspector switch, Reset on each base | Correct base, camera reframes, spawn and grid follow |
| Editor regressions | Add, select, move, duplicate, undo/redo, focus, snap on the corner base | As on the street strip |
| Frame rate | `measure-scene.mjs`, 100 objects on the corner base, 1920×1080 | Editor ≥ 50 fps, Preview ≥ 40 fps |
| Static checks | `npm run lint`, `npm run build` | Pass, no page errors |

---

## 5. Risks

* **Moving constants into templates breaks the street strip silently.**
  M1 changes no pixels by design, and the 8-screenshot diff against
  `main` proves it before anything else is built.
* **The decal fights the road for depth** (z-fighting, or it disappears
  in Preview's AO pass). It is drawn 2 mm above the asphalt with polygon
  offset and no depth write; M3 checks both render paths.
* **Objects stranded outside the base after a switch.** Accepted: nothing
  is deleted, and switching back restores the view. The inspector switch
  states this in one line.
* **The corner looks empty without the building.** It is expected until
  Stage 5; the starter scene and the blockout view show the intended
  composition.
* **Preset zoom values depend on the canvas size.** They are tuned at
  1600 × 1000 like the street presets, and checked at 1920 × 1080.

---

## 6. Open Questions (approved 2026-10-01 with the defaults)

1. **Manhole and grates** are fixed parts of the corner base.
2. **Reset on the corner base** loads the starter scene.
3. **New** always asks which base.
4. **First-time default** stays the street strip.

---

## 7. Status — Implemented 2026-10-01

All milestones M1–M6 are done on branch `stage4-base`. The user approved
the result on 2026-10-01.

### Deviations from the plan

* **`ConfirmDialog.tsx` is deleted.** The New dialog replaced its only
  use, which left it as dead code.
* **Layout numbers live in `utils/cornerLayout.ts`,** a file the plan did
  not list. `CornerBase`, its geometry builder and the starter scene all
  read it, so the layout sheet has one mirror in code.
* **Template fields added while implementing:** `spawnSpread` (the spawn
  spiral was sized to the 50 m strip) and `focusRadius` ("Focus selected"
  zoomed *out* on the small base with the street constant).
* **Preset zooms for the corner are 34 / 44 / 44 / 44,** not ≈ 34 / 40 /
  40 / 44: the front and side views had room.
* **The inspector keeps its "No object selected" hint** under the new
  Scene section instead of replacing it.
* **`?dev=blockout` needs a corner scene** to frame well. The flag forces
  the corner *ground*, but the camera presets follow the scene's own
  base. Seed or create a corner scene first.
* **No manhole or grate in the registry,** as planned. Their GLBs are
  loaded by `CornerBase` directly.

### Assets

| Asset | Tris / budget | Draw calls | GLB |
|---|---|---|---|
| `street_manhole_01` | 604 / 1,500 | 1 | 33 KB |
| `street_gutter_grate_01` | 288 / 1,500 | 1 | 21 KB |
| `street_curve_mirror_01` | 432 / 1,500 | 1 | 26 KB |

None has baked AO or grime. `build.py all` builds all nine assets and
exits 0.

### Verification results

Headless Chrome on the GTX 1660 SUPER, against the dev server.

| Check | Result |
|---|---|
| Street strip vs. `main`, 4 presets × editor/Preview | Canvas identical: at most 4 pixels differ by more than 4/255. The editor screenshots differ only in the two side panels (new library entry, Scene section). |
| Old scenes | A v1 file, a v2 file without `environment.base` and one with an unknown base all load as the street strip, objects in place |
| Round trip on a corner scene | Save, export, New (street), import, reload: `base === "corner"` every time, 8 objects, file v2 |
| Corner dimensions (scene graph) | Surfaces x/z −8 … 8, y −0.25 … 0; plinth y −1.35 … −0.25; 止まれ x 5.9 … 7.4, z −3.5 … −1.0; grates 1.0 × 0.3 at the layout positions; manhole centered on (−2, 5.8) |
| 止まれ | Reads 止 → ま → れ, upright and unmirrored, for a driver heading +Z; no z-fighting in the editor or in Preview |
| Blockout on the base | Building, pole, props, car and figures stand on the sidewalks and roads as on the sheet: `art/previews/stage4_blockout_on_base.png` |
| Base draw calls (empty corner scene) | 10 in total: grid 1 + surfaces 1 + decal 1 + plinth 1 + manhole 1 + grates 5. The street strip needs 43. |
| UI | New dialog shows both cards and creates on the chosen base; inspector switch moves between bases without touching objects; Reset loads each base's starter; the camera reframes (zoom 12 ↔ 34) |
| Editor on the corner base | Spawn inside the lot, select from the list and by canvas click, ring, gizmo, duplicate, delete, undo, hide, focus (zoom 31.7 on one object) |
| Frame rate, 100 objects on the corner base, 1920×1080 | Editor 180 fps (the headless cap), Preview 150 fps; 154 draw calls, 319k tris |
| `npm run lint`, `npm run build` | Pass; no page errors in any run |

### Known limitations

* **The corner looks empty in the middle** until the Stage 5 building.
* **Objects can end up off the base** after a switch to the smaller
  corner. Nothing is moved or deleted.
* **The grid floats 16 cm above the roads,** because it is one flat plane
  at lot level.
* **The curb ramp has straight side walls,** not flared ones.
* **Base changes are not undoable** with Ctrl+Z. Switch back instead.
* **The first Preview screenshot of a capture run is sometimes framed
  small.** It is a timing race in `capture-presets.mjs` between the
  canvas resize and the screenshot, seen once in four runs on both bases.
  Re-run the capture when it happens.
