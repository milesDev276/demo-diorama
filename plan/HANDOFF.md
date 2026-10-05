# Handoff — Hero Diorama Work (as of 2026-10-05, after Stage 14)

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
| Stage 6: density tools | Done | `main` (PR #9) |
| Stage 7: environment and Photo | Done | `main` (PR #10) |
| Stage 8: ground surface and platform | Done | `main` (PR #11) |
| Stage 9: finished streets on a plot (and a hydration-warning fix) | Done | `main` (PR #12) |
| Stage 10: legacy cleanup | Done | `main` (PR #13) |
| Stage 11: library breadth (eleven assets) | Done | `main` (PR #14) |
| Stage 12: glass and lit signs | Done | `main` (PR #15) |
| Stage 13: weather | Done | `main` (PR #16) |
| Stage 14: editor polish | Implemented and verified; **not committed** | branch `stage14-editor` (working tree) |

Stage 7 was the last stage of the original roadmap; Stages 8 to 14 were added
at the user's request.

**`main` holds Stages 0–13** (last merge: PR #16, `144a612`). Stage 14 is
in the working tree of `stage14-editor`, uncommitted.

**Immediate next action:** the user commits Stage 14 and opens its PR; then
ask what comes next (§7 lists the candidates).
The user merges PRs themselves, one branch per stage; cut the
next branch from an up-to-date `main` (`git fetch`, then fast-forward).
(For Stages 6 to 14 the user handed every decision
to Claude, so the plan was settled with its defaults and implemented without
a separate approval round. Ask again at the start of new work; it is not a
standing rule.)

**A stash to know about.** `git stash list` holds "stage5 draft slice by
another tool": six edited files and a box-shaped `Building.tsx` that
another tool wrote on 2026-10-01 while the Stage 5 plan was being drafted.
The approved plan replaced that slice, so it was stashed, not applied. It
can be dropped once the user agrees.

## 2. Documents

| File | What it is |
|---|---|
| [Hero-Diorama-Roadmap.md](Hero-Diorama-Roadmap.md) | Master plan: locked decisions L1–L8 and Stages 0–9, with status per stage |
| [Hero-Layout.md](Hero-Layout.md) | Hero scene dimensions in meters (16 × 16 m corner base). This is the source of truth for the blockout and for asset sizes. |
| [Stage-1-Implementation.md](Stage-1-Implementation.md) | Scale migration: value table and verification results |
| [Stage-2-Implementation.md](Stage-2-Implementation.md) | Look-dev: decisions D1–D6, the bugs that were found, and verification results |
| [Stage-3-Implementation.md](Stage-3-Implementation.md) | GLB pipeline and the first six assets: decisions D1–D8, deviations, asset table and verification results (§7) |
| [Stage-4-Implementation.md](Stage-4-Implementation.md) | Base templates and the corner base: decisions D1–D8, deviations and verification results (§7) |
| [Stage-5-Implementation.md](Stage-5-Implementation.md) | Modular building, parent/child rules (D4) and click-to-place: decisions D1–D8, deviations, asset table and verification results (§7) |
| [Stage-6-Implementation.md](Stage-6-Implementation.md) | Scatter brush, kits, rotate while placing, jitter, app-rendered thumbnails: decisions D1–D11, deviations, asset table and verification results (§7) |
| [Stage-7-Implementation.md](Stage-7-Implementation.md) | Time of day, season, after-dark lights, shop interior, Photo mode, the hero's last assets and the starter template: decisions D1–D10, deviations, asset table and verification results (§7) |
| [Stage-8-Implementation.md](Stage-8-Implementation.md) | The free plot and its surface map, ground brush, ground grain, platform styles, road markings: decisions D1–D11, deviations and verification results (§7) |
| [Stage-9-Implementation.md](Stage-9-Implementation.md) | The hydration fix, curb ramps, marking alignment, runs, stop sign / guard rail / fence, the Back Street starter, the retired street strip: decisions D1–D8, deviations and verification results (§7) |
| [Stage-10-Implementation.md](Stage-10-Implementation.md) | The house, shop, garden tree and stone as GLBs, the street strip read into a plot, the legacy unit deleted: decisions D1–D4 and results (§6) |
| [Stage-11-Implementation.md](Stage-11-Implementation.md) | Eleven assets for the thin categories (konbini, bus stop, street light, utility cabinet, bench, cone, garbage cage, kei truck, scooter, shopkeeper, schoolchild), two atlas cells, two kits: decisions D1–D5 and results (§6) |
| [Stage-12-Implementation.md](Stage-12-Implementation.md) | The `glass` slot, rooms behind shop glass, hollow vehicle cabins, the lit atlas, two sign cells: decisions D1–D7 and results (§6) |
| [Stage-13-Implementation.md](Stage-13-Implementation.md) | Weather as scene data, the weather looks, wet and snowed-on surfaces, falling rain and snow: decisions D1–D7 and results (§6) |
| [Stage-14-Implementation.md](Stage-14-Implementation.md) | Attachments following a building, group move and turn, undo/redo selection, duplicates on the base, kit rename / export / import, the saved view and photo settings: decisions D1–D8 and results (§7) |
| `Phase-*.md` | Earlier phases, kept for history |

## 3. Decisions That Must Not Be Re-litigated

* **World scale is 1 unit = 1 m,** everywhere since Stage 10: no geometry
  is authored in the old unit (≈ 6 m) any more. The number 6 survives only
  in `sceneSerializer.ts`, to read v1 files.
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
* **GLB assets render with shared materials** (`objects/materials.ts`),
  remapped from the Blender slot names `base`, `emissive`, `printed`,
  `foliage` and `glass`. An asset uses at most four of them
  (`MAX_DRAW_CALLS` in `build.py`; three before Stage 12).
* **A scene's base is scene data:** `environment.base`, `"corner"` or
  `"plot"`. A file whose base is `"street"`, missing or unknown is an old
  street strip and is read into a plot (Stage 10, below).
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
  stay v2). So is the optional `camera` and `photo` of a scene (Stage 14).
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
  the store). Once placed, a kit turns as a multi-selection (Stage 14).
* **Tone mapping is Neutral, not AgX.** AgX greyed the palette; see Stage 2
  D2.
* **`@react-three/postprocessing` is pinned to exactly `3.0.4`.** Anything
  newer needs `@react-three/fiber >= 9.7`, and fiber stays at 9.6.1.

Stage 7:

* **`environment.timeOfDay` and `environment.season` are scene data,**
  additive (files stay v2). Missing or unknown values load as `"day"` and
  `"autumn"`, which is the look every asset is modeled in. Neither is on
  the undo stack.
* **One record per time of day, in `utils/timeOfDay.ts`:** sun, ambient,
  hemisphere, Lightformers, sky stops, emissive level, glow strength. No
  other file holds a lighting number. `utils/seasons.ts` does the same for
  seasons.
* **Inside a canvas, read the environment from the context**
  (`hooks/useSceneEnvironment.ts`: `useTimeOfDayLook`, `useSeasonLook`).
  **Nothing the asset registry imports may import the store:** the store
  builds its first scene from the registry while it loads, so such an
  import is a cycle (it broke the thumbnail page once).
* **The shared materials are pushed, not pulled:** `EnvironmentDriver`
  calls `setEmissiveLevel`, `setFoliageSeason` and `setWireBounds` in
  `objects/materials.ts` when the environment changes.
* **The glow-light pool always has eight lights in the scene**
  (`SceneGlowLights`), dark by day. Never mount or unmount lights with the
  time of day or with objects: the light count is in every lit shader, and
  changing it recompiles them all (1.7 s measured).
* **After-dark lights are derived, not stored:** `glow` in the registry
  (vending machine, shop) and `shopLightPositions()` for buildings.
* **The `foliage` slot is for deciduous crowns only.** The season recolors
  it (brightness kept, hue replaced) and hides it in winter; whatever is in
  that slot disappears then. Evergreens stay in `base`.
* **A shop is one room:** shopfront bays share an interior
  (`facade.SHOP_FRONT`, `SHOP_BACK`), and `layoutBuilding` closes a run
  with `building_shop_side_01` except where it turns a corner into another
  shopfront.
* **The utility pole and its wires share `objects/poleLayout.json`,** read
  by `PowerLine.tsx` and by the pole's Blender script. Wires are cut at the
  base's outline by the `wire` material's clipping planes, and the wire
  mesh's own `raycast` ignores the cut-off part.
* **Photo mode is Preview.** `photo` in the store (frame, focus, blur,
  exposure, scale) is saved with the scene since Stage 14, except `scale`. With a ratio chosen
  the canvas itself takes that shape, so an export is never cropped.
* **The focus band and blur go to the tilt-shift shader's uniforms every
  frame,** not through the effect's props: the wrapper rebuilds the pass
  when a prop changes, and it serializes its props, so it gets a callback
  ref.
* **An export resizes the composer for one synchronous frame**
  (`PhotoStudio.savePhoto`): set the pixel ratio, render, copy the canvas,
  restore — all in one task, so no `preserveDrawingBuffer`.
* **Built-in starters are `assets/sceneTemplates.ts`.** A first visit opens
  the first one; the hero's objects come from `getCornerStarter()` in
  `utils/objectDefaults.ts`, which Reset on the corner base also uses.

Stage 8:

* **Only a plot's ground can be painted;** the corner keeps its own
  geometry.
* **A plot's ground is `environment.surface`:** `{ cols, rows }`, one letter
  per 0.5 m cell, rows back to front (`utils/surfaceMap.ts`). Additive (files
  stay v2). The plot's size is the map's size; nothing else stores it. A map
  on another base is kept and ignored.
* **The letters are forever:** `a s t c g r d` (and `p`, the Stage 9 ramp) in `assets/surfaceKinds.ts`,
  the one table of ground kinds (color, level, curb, grain, joints). They
  are in saved scenes; add kinds, never reuse a letter.
* **Curbs, steps, joints and the skirt are derived** from the map by
  `objects/ground/surfaceGeometry.ts`. There are two levels: the road
  (`CORNER.roadY`) and everything else.
* **Ask `getBaseTemplate(environment)` for anything sized to the base,** not
  `BASE_TEMPLATES[base]`: a plot's template comes from its map. The same
  size always returns the same object, so it is safe as an effect
  dependency and as a zustand selector result.
* **A history entry is `{ objects, surface }`.** Ground strokes, layouts and
  resizes are undo steps (`commitSurface` in the store), and the objects
  that stood on a cell whose level changed move with it in the same step
  (`reseatObjects`). Base, platform, time of day and season stay off the
  stack.
* **Subscribe to fields of `environment`, never to the whole object,** in
  anything that renders in or around the canvas: painting replaces
  `environment` on every stamp. `Ground` reads the store itself for the
  same reason.
* **Everything drawn with the `ground` material carries a `grain`
  attribute** (fine, blotch). Build such geometry with `groundBox` or
  `QuadWriter` (`objects/ground/groundGeometry.ts`). The grain is read from
  one generated 128² noise texture; its mipmaps fade the speckle.
* **The platform is `environment.plinth`** (`dark`, `wood`, `earth`), drawn
  by `objects/ground/Plinth.tsx` under the corner and the plot base.
  Additive; unknown values load as `dark`.
* **One of placement, scatter brush and ground brush is active at a time**
  (`placement`, `brush`, `groundBrush` in the store; each start clears the
  other two).
* **The ground brush raycasts only the mesh tagged `userData.groundPaint`,**
  so objects never block it. The library's Ground group is drawn by
  `ObjectLibrary` itself and is not in the asset registry.
* **Road markings are objects** (`crosswalk`, `stopLine`, `roadLine`, and
  since Stage 9 `parkingBay`; `objects/RoadMarking.tsx`), sized from
  `utils/cornerLayout.ts`.

Stage 9:

* **`<html>` and `<body>` carry `suppressHydrationWarning`** (`app/layout.tsx`).
  Browser extensions add attributes there before React hydrates; that was
  the hydration warning the user saw. The editor itself is `ssr: false`.
* **A curb ramp is a ground kind** (`ramp`, letter `p`, `ramp: true` in
  `assets/surfaceKinds.ts`): a cell whose corners beside a road are low.
  It is not derived from crosswalks.
* **Tiling assets say so in the registry:** `tile: <meters>`. While placing
  one, a left drag on the base lays a row (`runPieces` in
  `PlacementLayer.tsx`, `placeRun` in the store); the pieces are ordinary
  objects.
* **Road markings say how they line up:** `road: { along, center? }` in the
  registry, resolved with `roadFrameAt` (`utils/surfaceMap.ts`) while
  placing on a plot's asphalt.
* **Built-in starters may be plots:** a template's `environment` carries the
  `surface`. Back Street is built in `utils/plotStarter.ts` from a list of
  rectangles. Re-run `scripts/capture-template.mjs` after changing one.
* **The `sign` type renders `street_sign_stop_01`.**

Stage 10:

* **The types `house`, `shop`, `tree` and `rock` are GLBs**
  (`building_house_01`, `building_shop_01`, `nature_tree_garden_01`,
  `nature_rock_01`). The type names are in saved scenes; do not rename them.
* **A street-strip scene is converted when it is read**
  (`utils/streetStrip.ts`, called by the validator): a 102 × 54 plot with
  the strip's bands, the earth platform, and whatever stood on the strip's
  road (y = −0.24) put on the ground under it. The numbers there describe
  old files; never change them.
* **`MAX_CELLS` is 104** for those plots; the Scene panel still offers at
  most 24 m.
* **`DEFAULT_ENVIRONMENT.base` is `"corner"`,** but a file without a base
  is not the default: it is a strip.
* **`liftObjects`** (`utils/surfaceMap.ts`) is the one place that moves
  objects and scatter pieces vertically with the ground.

Stage 11:

* **A plain lit panel is modeled in the `emissive` slot** (the konbini's
  band). Since Stage 12 prints can be lit too; see there.
* **`streetLight` and `konbini` have a `glow`.** The pool is still eight
  lights, buildings first; a scene with more lit things than that leaves the
  last ones dark.
* **Vehicle conventions:** four-wheelers face −Y in Blender (the kei car,
  the kei truck); two-wheelers head +X (the bicycle, the scooter).

Stage 12:

* **`glass` is for panes with something behind them.** The vertex color is
  the tint; the opacity is one constant (`GLASS_OPACITY`, mirrored as
  `GLASS_ALPHA` in `lib/materials.py`). Windows with no room behind them
  stay opaque and emissive.
* **Glass casts no shadow and is drawn last** (`castsShadow`,
  `GLASS_RENDER_ORDER` in `objects/materials.ts`). `GltfAsset` sets the
  shadow flags on its template and hands `Clone` no shadow props: those
  would switch shadows on for every mesh.
* **A building renders up to four slots** (`BUILDING_SLOTS`).
* **Backlit prints are a table, not geometry:** `LIT_CELLS` in
  `graphicsAtlas.ts` says which atlas cells glow and how strongly; they are
  copied into a second canvas, the `printed` material's emissive map. A new
  lit sign needs no GLB change.
* **`signs` in `utils/timeOfDay.ts`** is how strongly lit prints glow,
  pushed by `EnvironmentDriver` (`setSignGlow`). It is 0 by day, so
  daytime renders are unchanged by it.
* **A lit sign is a print when it has lettering** (the konbini's plate, the
  small shop's board) and `emissive` geometry when it is a plain panel (the
  konbini's band). This replaces the Stage 11 rule.
* **Shop interiors share `art/blender/lib/interior.py`**
  (`stock_shelf`, `product_row`). The shopfront bay's goods depend on the
  order of its random calls; do not reorder them.
* **A fixed building with a room is built from wall blocks,** one box per
  side wall, so the siding's per-face jitter shows no seam.
* **The atlas has room left** right of `plate_kei` (x 752–1016, y 8–136)
  and under `bus_stop_board` (from y 792); the strip under `plate_kei` is
  used by the two sign cells.

Stage 13:

* **`environment.weather` is scene data,** additive (files stay v2); a
  missing or unknown value loads as `"clear"`. Not on the undo stack.
* **One record per weather, in `utils/weather.ts`,** and it holds factors
  only. `sceneLook(timeOfDay, weather)` applies one to a time of day and
  returns a `TimeOfDayLook`; `useTimeOfDayLook()` returns that. Read a look
  through one of the two, never `TIME_OF_DAY_LOOKS[...]` directly, or the
  weather is skipped. Absolute lighting numbers stay in `utils/timeOfDay.ts`.
* **Clear weather is the time of day's own record** (the same object), and
  the weather shader patch leaves every pixel alone at 0: a clear scene is
  pixel-identical to Stage 12.
* **Wet and snow are uniforms** of `base`, `foliage` and `ground`
  (`patchWeather`, `setWeatherSurface` in `objects/materials.ts`), pushed by
  `EnvironmentDriver`. A new lit material that should get snow needs the
  patch; `emissive`, `printed` and `glass` do not have it.
* **A puddle is a color, not a mirror:** the environment map is four
  Lightformers, and from the editing camera a mirror on the ground reflects
  the empty part of it. Puddles blend toward the palette's `puddle`.
* **A look has `shadow` and `haze`** (shadow strength and radius, fog
  distances); `SceneLighting` and `SceneFog` hold no numbers any more. Each
  Lightformer has a `name`, which the weather scales by.
* **Rain and snow are `components/WeatherParticles.tsx`:** one
  `LineSegments` or `Points` over the base, moved in the vertex shader from
  one time uniform, written through the material's ref. A flake's size is
  in meters: the shader gets the height of the target it is drawn into
  (`onBeforeRender`), so a larger export keeps it.

Stage 14:

* **A building's attachments are refit when its size changes**
  (`utils/buildingAttachments.ts`, called by `setBuildingParams` in the
  same undo step). The rule is positions only: nearest wall, distance from
  it, distance from the side's left end (= its bay, because `fitBays`
  adds and removes bays at the right end), whole floors down; roof things
  keep their distance from the nearer edge. Change `fitBays` and this
  file together.
* **A multi-selection has its own gizmo,** `components/SelectionPivot.tsx`:
  a pivot group at the scene root that is not scene data, put on
  `getSelectionCenter` (the mean on X/Z, the lowest Y) outside a drag. A
  turn is computed from the objects as they were at drag start
  (`turnObjectsAbout(ids, pivot, radians, from)`), never accumulated. The
  single-object gizmo in `SceneObjects.tsx` is unchanged.
* **Only scale is single-object now** (`clampTransformMode`).
  `getTurnableIds` says what a group turn moves: top-level, on the base,
  unlocked.
* **Undo and redo select what the step changed** (`restoreStep`,
  `changedObjectIds` in the history manager): the difference between the
  two entries. History entries still hold objects and ground only.
* **A duplicate's offset is chosen, not fixed** (`duplicateOffset`), and on
  a plot the copies are seated with `reseatMoved` (`utils/surfaceMap.ts`).
* **Kit files are `{ kind: "diorama-kit", version, kits }`**
  (`utils/kitFile.ts`). `isKitFile` in `sceneSerializer.ts` keeps the
  tolerant scene reader from opening one as an empty scene. Imported kits
  always get new ids.
* **`scene.camera` is real since Stage 14 and optional.** Every older file
  carries the constant `LEGACY_CAMERA_PLACEHOLDER` (zoom 12), which the
  validator reads as "no view"; never change that constant. The store's
  `camera` is `undefined` until the user has framed the scene.
* **The rig records the view when the camera comes to rest**
  (`CameraControls.tsx`: OrbitControls `end`, then a frame without
  movement; the end of a preset or focus transition) through `setCamera`,
  rounded to millimeters — never per frame. In Preview it records the
  editing view that leaving Preview would give.
* **`cameraRevision` goes up whenever another scene is opened**
  (`freshView` in the store: load, import, new, starter); the rig then
  glides to that scene's view or its preset, and that glide records
  nothing.
* **`scene.photo` is frame, focus, blur and exposure** (`scenePhotoOf`,
  `normalizeScenePhoto` in `utils/photo.ts`). The export size stays editor
  state. The autosave fingerprint includes `camera` and this.
* **The zoom limits are `CAMERA_ZOOM_RANGE`** in `utils/cameraPresets.ts`,
  shared by the rig and the validator.

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

# Preview image of every built-in starter scene (dev server must run)
node scripts/capture-template.mjs

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
    the measurement and verification scripts. Time of day, season, photo
    settings and exports can all be driven through the store
    (`setTimeOfDay`, `setSeason`, `setPhoto`, `photoApi.savePhoto(scale)`).
  * **Preview** turns on the perspective camera, the effect stack and the
    photo bar.
  * `/diorama/thumbnails?item=<key>` is the thumbnail studio the capture
    script drives (`window.__thumbnails.show(key)`).
* **Verification method used so far:**
  1. Capture before and after with `capture-presets.mjs`.
  2. Pixel-diff the images (numpy inside Blender in the early stages; a
     canvas in the headless browser since Stage 8, see below).
  3. For migrations, use `--seed-scene` to simulate an old autosave.
  4. For fps, count `requestAnimationFrame` at 1920×1080 with 100 seeded
     objects.

  The fps and draw-call check is now `scripts/measure-scene.mjs`. The
  diff, crop, close-up, round-trip and scenario helpers were one-off
  scripts and are **not** in the repo. Recreate them from the `Cdp` and
  `launchBrowser` exports of `capture-presets.mjs`.
* **A baseline of `main` without a worktree:** with the dev server
  running, `git stash push -u`, wait a few seconds for the hot reload,
  capture or measure, then `git stash pop`. Do it in one command so the pop
  cannot be forgotten, and check `git stash list` afterwards (the old
  Stage 5 stash must still be the only one).
* **Comparing two folders of screenshots** needs no image library: load both
  PNGs into a canvas in the headless browser and compare the pixels there.
* **A fresh browser profile now opens the hero scene** at golden hour.
  Seed a scene to test anything else. A seed without an environment is a
  converted street strip (a 51 × 27 m plot) by day.

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
  100 objects both report 180, so use a heavier scene or a 4K viewport to
  see headroom.
* **Close-up screenshots:** `__dioramaThree()` gives `camera` and
  `controls` (the OrbitControls). Set `controls.target`, the camera
  position and `camera.zoom`, then call `updateProjectionMatrix()` and
  `controls.update()`.
* **In headless Chrome the canvas takes its new size late** after entering
  Preview or changing the photo frame. A screenshot or a click that comes
  first sees the old size: this is why `capture-presets.mjs` sometimes
  frames the first Preview shot small. Poll the canvas's bounding box (and
  send a mouse move) before going on.
* **`measure-scene.mjs --types` builds a scene without an environment,**
  which loads as the converted street strip (a 51 × 27 m plot). For the
  corner base, write a scene file with `environment.base` and pass
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
* **Two materials patch three's shaders** (`materials.ts`): the emissive
  one after `<emissivemap_fragment>`, the foliage one after
  `<color_fragment>`. Re-check both on a three upgrade.
* **three's picking ignores clipping planes.** A mesh that a material cuts
  off is still hit where nothing is drawn; give it its own `raycast`
  (`PowerLine.tsx`).
* **The effect wrappers of `@react-three/postprocessing` call
  `JSON.stringify` on their props and rebuild the effect when a prop
  changes.** Pass a callback ref, not an object ref, and drive values that
  change often through the effect's uniforms.
* **`renderer.toneMappingExposure` also drives the composer's tone-mapping
  effect** (its shader declares the same uniform), so exposure is one
  renderer property in the editor and in Preview.
* **drei's `<Environment frames={1}>` re-renders the map whenever its
  children change,** so changing the Lightformers' props is enough.
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
* **A background dev server started by the agent is stopped after its time
  limit,** but its Next child keeps serving on port 3000 (see the first
  item). Check the port before starting another.

* **Headless Preview frame rates drift by a factor of two within an hour**
  on this machine (the same build measured 52 and 160 fps). Compare builds
  back to back, several runs each, before calling anything a regression.
* **The dev server makes React work look slow.** A ground-brush stamp took
  15–19 ms there and 6 ms in a production build (`npm run build`, then
  `npx next start -p 3002`). Measure interaction cost on the build.
* **A selector on the whole `environment` re-renders on every brush
  stamp.** That was the whole cost of painting before the subscriptions
  were narrowed.
* **`node -e '…'` breaks on apostrophes too,** like heredocs. Write the
  script to a file.
* **A probe ray on a whole meter hits a paving joint** (2 mm proud), not the
  paver. Probe off the grid.

* **A hydration warning that names no component is usually an extension.**
  Reproduce it by setting an attribute on `<body>` from
  `Page.addScriptToEvaluateOnNewDocument`; a clean headless profile shows
  nothing.
* **The user's own dev server may be running on port 3000.** `npm run dev`
  then exits with "Another next dev server is already running"; use theirs
  and never stop it.
* **The Blender preview of a printed face is blank,** also for a triangle:
  check the print in the app.
* **drei's `<Clone castShadow>` sets the flag on every mesh,** and only
  when true: leave the prop out and Clone copies each mesh's own flag
  (`keys`). `renderOrder` is not among Clone's default keys.
* **A transparent material still casts a full shadow** in three. Switch
  `castShadow` off on the mesh.
* **Low roughness alone shows nothing on the ground:** there is little in
  the environment map to reflect. A glossy surface only catches the sun and
  the glow lights (which is what a wet road at night should do).
* **A scripted edit that fails halfway writes nothing** if the script writes
  once at the end — and `sed -i` in Git Bash turns a CRLF file into LF.
  Check `file <path>` after scripted edits.

## 6. Known Limitations and Existing Behaviors (not bugs of these stages)

* **Old street-strip scenes changed with Stage 10:** they are 51 × 27 m
  plots now (larger than any size the Scene panel offers), without the
  dashed center line; the tree and the stone are at real size, so much
  smaller. The full list is in Stage-10-Implementation.md §6.
* **Base, platform, time-of-day and season changes are not on the undo
  stack.** Ground painting is.
* **A run is separate objects, on the base only; markings align only when
  placed with the pointer on a plot.** The full list is in
  Stage-9-Implementation.md §7.
* **Only a plot can be painted; it has two levels and straight edges;**
  objects follow a level change only if their origin stood on the ground.
  The full list is in
  Stage-8-Implementation.md §7.
* **The inspector edits a facade side at once, not per bay; the gizmo
  neither snaps to surfaces nor re-parents.** The full list is in
  Stage-5-Implementation.md §7.
* **Scatter only on the base; erase acts on every layer of the kind; user
  kits have no thumbnail.** The full list is in Stage-6-Implementation.md §7.
* **Glow lights cast no shadows and shine through walls** within their
  reach. The full list is in Stage-7-Implementation.md §7.
* **Glass has one opacity, reflects nothing and casts no shadow;** panes
  inside an object are not sorted; sign texts are fixed. The full list is
  in Stage-12-Implementation.md §6.
* **Rain and snow fall through roofs and only over the base; snow lies
  on every face that looks up, also under a roof; rain streaks are one
  pixel wide at every export size.** The full list is in
  Stage-13-Implementation.md §6.
* **No stored groups, no group scale; attachments are refit by position
  only; one saved view per scene, in pixels per meter.** The full list is
  in Stage-14-Implementation.md §7.
* **The editing camera does not fit the scene to a small window.**
* **Old scenes changed with Stage 7:** emissive surfaces no longer glow by
  day; the utility pole is 10 m (was 12 m) and carries six wires.
* **Legacy vending machines in old scenes got smaller** (1.32 → 1.0 m
  wide): the GLB is at real scale.
* **Blender previews show printed faces blank.** Prints only exist in the
  app's runtime atlas.
* **`npm audit` reports 10 findings.** They all predate this work (next,
  tailwind, sharp, …) and were not addressed.

## 7. Next

The roadmap's seven stages and Stages 8 to 14 are implemented; Stage 14 is
not committed yet. Nothing further is planned or approved; ask the user
what comes next.

* **Open from Stage 14:** not committed; not tried in the user's own
  browser or with the user's own autosave and kits.
* **Open from Stage 13:** not tried in the user's own browser. The starters
  do not use a weather.
* **Open from Stage 12:** not tried in the user's own browser. Old scenes
  change in look (panes, a narrower shop signboard).
* **Open from Stage 11:** the starters do not use the new assets; the two
  new kits were checked as thumbnails only; not tried in the user's own
  browser.
* **Open from Stage 10:** not tried with the user's own autosave.

* **Open from Stage 9:** the hydration fix was verified by reproduction
  only (attributes injected on `<body>`), not in the user's own browser. If
  the warning comes back there, ask for the attribute diff printed under it.
* **Open from Stage 7:** the hero scene was not put side by side with the
  reference photo (the photo is not in the repository). That comparison —
  the roadmap's "done when" — is the user's to make.
* **Candidates that came up, none decided:**
  * glass on houses and upper floors (needs rooms), a driver in vehicles,
    sign text the user can edit
  * editor limits left after Stage 14: stored groups, group scale,
    per-bay facade editing, the gizmo snapping to surfaces, thumbnails
    for user kits, fitting the view to the window
  * ground: more levels or slopes, curved roads, arrow markings
  * a parametric wall or fence (one object by length) instead of runs
  * more figures in other poses (walking, sitting, cycling)
  * more buildings as fixed models (apartment block, traditional house)
  * weather props and details: umbrellas, a figure with one, rain that
    stops at roofs, snow as a ground kind
* **Backend (CLAUDE.md Phase 6):** the user raised it after Stage 9
  (2026-10-03), worried about file sizes. `public/` was 3.7 MB, so assets
  stay in the repo; the proposal made was Supabase (Postgres + Auth +
  Storage), scenes as `jsonb`, local-first with cloud as a sync layer, and
  a saved camera per scene first (done locally in Stage 14). Nothing was
  decided or written down as a design; Phases 6–7 still need an explicit request.

## 8. Working With This User

* **Language:** the user writes in Vietnamese. Reply in Vietnamese; repo
  docs are in English.
* **Plan first:** at the start of each stage, write the plan doc and get it
  approved, then implement — unless the user hands over the decisions, as
  for Stages 6 to 14.
* **Git:** the user commits, pushes and merges through GitHub PRs
  themselves. When asked, provide a commit message and a PR description.
* **Reporting:** follow CLAUDE.md §46 — implemented, files, verification
  with real numbers, limitations.
