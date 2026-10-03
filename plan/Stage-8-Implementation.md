# Stage 8 — Ground Surface and Platform (Implementation Plan)

Follows the seven stages of [Hero-Diorama-Roadmap.md](Hero-Diorama-Roadmap.md).
Builds on the Stage 4 base templates
([Stage-4-Implementation.md](Stage-4-Implementation.md) D1–D3), the Stage 5
placement surfaces and the Stage 6 brush.

**Goal:** the ground stops being a fixed picture. A scene can stand on a
**free plot** whose surface the user paints — road, sidewalk, paving, concrete,
gravel, grass, soil — with curbs and steps generated where the materials meet.
Every app-built ground gets a grain so it no longer reads as a flat slab, roads
can carry placeable markings, and the platform under the diorama gets a choice
of finishes.

Branch: `stage8-surface`, cut from `main` (Stage 7 is merged, PR #10).

> The user asked for this stage ("the surface, the platform underneath") and
> handed every decision to Claude (2026-10-03). The open questions in §6 were
> settled with the defaults listed there and implementation followed the plan
> without a separate approval round, as in Stages 6 and 7.

---

## 0. Starting Point (verified 2026-10-03)

* **Two bases, both fixed.** `street` is legacy geometry; `corner` is one
  merged mesh built from `utils/cornerLayout.ts`. The user cannot change where
  the road, the sidewalk or the lot are.
* **Surfaces are flat colors.** Asphalt, concrete and gravel are one vertex
  color each (`ground` material, roughness 0.95). Only the sidewalk has joints.
* **The plinth is one dark rounded box.**
* **Everything sized to the base is read from `BASE_TEMPLATES[base]`,** a
  fixed record per base: camera, lighting, wires, grid, spawn area.
* **The undo stack holds snapshots of `objects` only.** Nothing in
  `environment` can be undone.
* **Road markings exist only inside the corner base.** The manhole and the
  gutter grate are placeable since Stage 5.
* **Placing and scatter** raycast onto meshes tagged
  `userData.placementSurface`; the base is one of them.

---

## 1. Decisions

### D1 — A third base: `plot`, drawn from a surface map

```ts
const DIORAMA_BASES = ["street", "corner", "plot"] as const;
const SURFACE_KINDS = ["asphalt", "sidewalk", "tile", "concrete", "gravel", "grass", "soil"] as const;

/** One letter per 0.5 m cell; rows run back to front (z ascending), a row left to right. */
interface SurfaceMap { cols: number; rows: string[] }

interface DioramaEnvironment {
  …
  surface?: SurfaceMap;   // the ground of the `plot` base
  plinth: PlinthStyle;    // D8
}
```

* **Additive; files stay v2.** A file without `surface` loads as before. A
  `plot` scene without a valid map gets the default plot.
* **The cell is 0.5 m,** the editor's default grid. A 24 × 24 m plot is 2,304
  letters.
* **Sizes:** 12 × 12, 16 × 16 (default), 20 × 20 and 24 × 16 m. The size is the
  map's size; it is not stored twice.
* **`street` and `corner` do not change.** They keep their own geometry, and a
  surface map in the scene is ignored (but kept) while one of them is active.
* **Switching an existing scene to `plot`** creates a map if there is none: the
  corner layout when coming from `corner`, so the ground under the objects
  stays where it was; the street layout otherwise.

### D2 — Surface kinds: `assets/surfaceKinds.ts`

One record per kind; nothing else holds a ground color or height.

| Kind | Letter | Level | Curb to the road | Detail |
|---|---|---|---|---|
| Asphalt | `a` | −0.15 m | — | fine grain, mottled |
| Sidewalk | `s` | 0 | yes | joints every 1 m, each paver slightly toned |
| Paving (tile) | `t` | 0 | yes | joints every 0.5 m, warm, toned per stone |
| Concrete | `c` | 0 | no | faint grain |
| Gravel | `g` | 0 | no | coarse grain |
| Grass | `r` | 0 | no | grain; follows the season like scatter grass |
| Soil | `d` | 0 | no | grain |

* **Two levels only:** the road and everything else, as on the corner base
  (`CORNER.roadY`).
* **Curbs are derived, never stored.** A sidewalk or paving cell next to a
  lower cell gets a 0.15 m curb strip along that edge (and a curb square at an
  inner corner). Other kinds step down with a plain wall.

### D3 — `PlotBase`: one geometry, built from the map

`objects/ground/surfaceGeometry.ts` writes one vertex-colored geometry straight
into typed arrays (no per-cell `BoxGeometry`): cell tops, curb strips, joints,
the walls between levels and the skirt down to the plinth. It is rebuilt when
the map or the season changes; a 48 × 48 map is about 10k triangles.

* One draw call, the shared `ground` material.
* Tagged as a placement surface, so click-to-place and the scatter brush work
  on it unchanged.
* No fixed details: manholes, grates and markings are objects on this base.

### D4 — Ground grain

The `ground` material gets a small shader patch: the vertex color is
multiplied by world-space noise — soft blotches at three scales, plus a fine
speckle that fades out when it would be smaller than a pixel (no shimmer when
zoomed out). How strong each is comes from a per-vertex `grain` attribute, so
asphalt and gravel are rough, concrete and paint nearly flat.

* **The corner base gets the same attribute.** This changes the hero scene's
  ground on purpose; everything else in existing scenes is untouched.
* Geometry without the attribute is drawn as before.

### D5 — Templates follow the scene

`getBaseTemplate(environment)` replaces `BASE_TEMPLATES[base]` in every
consumer. For `plot` it derives the template from the map's size: preset
zooms, shadow extent, spawn area, grid and wire bounds scale from the corner
base's values. The camera reframes when the size changes.

### D6 — The ground brush

* **The library gets a "Ground" group** on a plot scene: the seven kinds, as
  swatches. Picking one starts the ground brush; picking it again ends it.
* **A drag paints** a square of `size` cells (1 … 10, i.e. 0.5 … 5 m) centered
  on the cell under the pointer. Only the ground mesh is raycast, so buildings
  and props never block the brush.
* **Shift keeps the stroke on a straight line** (roads).
* **`[` / `]`** change the size; **Esc** or Done ends the brush.
* A floating bar shows the kinds, the size and Done, like the scatter bar.
* Editor state: `groundBrush`, `groundBrushSize`. One of placement, scatter
  brush and ground brush is active at a time.

### D7 — Ground edits are undoable; objects stay on the ground

* **A history entry becomes `{ objects, surface }`.** A stroke, a layout and a
  resize are one undo step each. Base, plinth, time of day and season stay off
  the stack, as before.
* **Objects follow the ground.** When a cell changes level, top-level objects
  and scatter pieces that stood on the old level there move to the new one, in
  the same undo step (`reseatObjects` in `utils/surfaceMap.ts`). Objects that
  floated or were sunk on purpose are left alone.

### D8 — The platform: `environment.plinth`

```ts
const PLINTH_STYLES = ["dark", "wood", "earth"] as const;
```

| Style | What it is |
|---|---|
| Dark | today's dark rounded block (the default) |
| Wood | a stepped wooden display base, a little wider than the diorama, with a brass nameplate on the front that carries the scene's name |
| Earth | the ground cut open: roadbed, soil and subsoil in bands, on a thin dark board |

* One component, `objects/ground/Plinth.tsx`, used by the corner and the plot
  base. The street strip keeps its own soil plinth.
* Additive; unknown values load as `dark`. Not on the undo stack.
* The nameplate is a small canvas texture of its own (the name changes at
  runtime; the atlas is static). It is redrawn when the name changes.

### D9 — Road markings as objects

Three flat objects, in app code, category Street. They take their height from
the surface they are placed on.

| Type | Size | Notes |
|---|---|---|
| `crosswalk` | 4.05 × 2.5 m | five 0.45 m stripes, as on the corner base |
| `stopLine` | 1.7 × 0.45 m line, 止まれ behind it | reuses the `road_tomare` atlas cell |
| `roadLine` | 4.0 × 0.15 m | edge line; tiles end to end |

### D10 — Scene panel and New dialog

* **Scene panel:** the base switch gets a third option. On a plot it shows a
  **Ground** section — size, and four starting layouts (empty lot, street,
  corner, alley) that replace the map — and on the corner and the plot a
  **Platform** section with the three plinth styles.
* **New dialog:** "Empty free plot" is offered before the corner and the
  strip. It starts with the street layout at 16 × 16 m.
* **Reset on a plot** clears the objects; the ground is kept.

### D11 — Out of scope

* more than two levels, slopes, ramps, curved or diagonal edges, water
* painting on the corner or the street base; converting the street strip
* a per-cell rotation or pattern choice; snow on the ground
* parking-bay and arrow markings; a metric stop sign
* a built-in starter scene on a plot
* undo for base and plinth changes

---

## 2. Milestones

### M1 — Data, templates, history (no visual change)

* Types, `surfaceKinds.ts`, `surfaceMap.ts`, validator, defaults,
  `getBaseTemplate`, history entries, store actions.
* **Check:** corner and street scenes render as on `main`; old files load.

### M2 — `PlotBase` and the grain

* `surfaceGeometry.ts`, `PlotBase.tsx`, the `ground` shader patch, grain on
  the corner base.
* **Check:** the corner layout on a plot matches the corner base's outline;
  close-ups of each kind.

### M3 — Ground brush

* `GroundBrushLayer`, `GroundBar`, library group, shortcuts, reseating.
* **Check:** paint, straight lines, undo/redo, objects follow the level.

### M4 — Platform

* `Plinth.tsx`, nameplate, Scene panel sections.

### M5 — Road markings, New dialog, acceptance

* Three marking objects, thumbnails, the dialog card; §4; docs.

---

## 3. Files

| Change | Files |
|---|---|
| New (app, under `features/diorama/`) | `assets/surfaceKinds.ts`, `utils/surfaceMap.ts`, `objects/ground/surfaceGeometry.ts`, `objects/ground/PlotBase.tsx`, `objects/ground/Plinth.tsx`, `objects/RoadMarking.tsx`, `components/GroundBrushLayer.tsx`, `components/GroundBar.tsx`, `components/GroundPanel.tsx` |
| Modified (app) | `types/diorama.types.ts`, `utils/baseTemplates.ts`, `utils/sceneDefaults.ts`, `utils/sceneValidator.ts`, `utils/objectDefaults.ts`, `utils/palette.ts`, `history/historyManager.ts`, `store/dioramaStore.ts`, `hooks/useEditorShortcuts.ts`, `assets/assetRegistry.ts`, `assets/builtInKits.ts`, `objects/materials.ts`, `objects/ground/CornerBase.tsx`, `objects/ground/cornerGeometry.ts`, `components/Ground.tsx`, `components/DioramaCanvas.tsx`, `components/CameraControls.tsx`, `components/SceneLighting.tsx`, `components/EnvironmentDriver.tsx`, `components/ScenePanel.tsx`, `components/NewSceneDialog.tsx`, `components/ObjectLibrary.tsx` |
| Generated | three thumbnails, `assets/thumbnails.json` |
| Docs | this file; the roadmap; `HANDOFF.md` |

No new npm dependencies. No Blender work.

---

## 4. Verification

| Check | How | Target |
|---|---|---|
| Existing scenes | `capture-presets.mjs` on the hero and the street starter, vs. `main` | Street: identical. Hero: differences on the ground only |
| Old files | Files without `surface` / `plinth`, with broken maps, unknown plinth | Load as before; `dark`; a broken map on a plot becomes the default plot |
| Round trip | Paint, save, export, New, import, reload | Same map, same plinth; file v2 |
| Geometry | Corner layout on a plot: bounding boxes, levels, curb positions | Within 1 cm of the corner base's outline and levels |
| Brush | Real pointer events: a stroke, a Shift stroke, each size | The expected cells change; nothing outside them |
| Undo | Stroke, layout, resize; undo and redo each | One step each; map and objects restored together |
| Reseat | Paint road under a prop on the sidewalk, and back | The prop moves by 0.15 m and returns; a floating prop does not move |
| Placement and scatter on a plot | Click-to-place on road and on sidewalk; scatter stroke | y −0.15 / 0; pieces land on the ground |
| Sizes | Each of the four sizes | Camera, grid, shadows and wires follow |
| Platform | Three styles on corner and plot; rename the scene | Renders; the plate shows the new name |
| Markings | Place each on a painted road | Lies on the asphalt, no z-fighting |
| Draw calls, frame rate | `renderer.info` on an empty plot; 100 objects on a 24 × 16 plot, 1920×1080 | Base ≤ 4 draw calls; editor ≥ 50 fps, Preview ≥ 40 fps |
| Paint cost | Time per stamp on a 24 × 24 map | Under one frame (16 ms) |
| Visual gate (§49) | A painted plot with the hero's assets, Preview | Reads as one miniature with the corner base |
| Static checks | `npm run lint`, `npm run build` | Pass; no page errors |

---

## 5. Risks

* **The grain shimmers** when zoomed out or orbiting. The speckle fades by
  its size on screen; checked at every preset and in Preview.
* **A third shader patch on a three material** (`ground`), next to emissive
  and foliage. Re-check on a three upgrade.
* **History entries change shape.** Every place that read `history[i]` as an
  object list has to move; covered by the undo checks on objects and scatter.
* **Rebuilding the geometry on every stamp** could stutter. Measured; the
  builder writes typed arrays directly.
* **The hero's ground changes look.** Intended; judged on screenshots.

---

## 6. Open Questions (settled with the defaults, 2026-10-03)

1. **Scope:** a paintable plot, grain, platform styles and markings in one
   stage. The corner and the street base stay fixed.
2. **Cell size 0.5 m; four plot sizes;** two ground levels.
3. **Ground edits are on the undo stack;** base and plinth changes are not.
4. **Objects follow a level change** when they stood on the ground.
5. **The nameplate belongs to the wood platform** and shows the scene's name.
6. **No new starter scene;** a first visit still opens the hero corner.

---

## 7. Status — Implemented 2026-10-03

All milestones M1–M5 are done on branch `stage8-surface`, merged into
`main` with PR #11.

### Deviations from the plan

* **The grain is read from a small noise texture,** not computed in the
  shader (D4 said noise with a fade by size on screen). A 128 × 128
  one-channel texture is generated once from a fixed seed; the shader reads
  it three times (two blotch scales, one speckle). Its mipmaps average the
  speckle away when it gets small, which replaces the `fwidth` fade and is
  cheaper than seventeen `sin` calls per pixel.
* **`Ground` reads the store itself,** and `DioramaCanvas`,
  `EnvironmentDriver` and `ScenePanel` subscribe to the fields they use
  instead of the whole `environment`. Painting changes `environment` on
  every stamp; with the old subscriptions each stamp re-rendered the whole
  canvas tree and every consumer of the environment context.
* **The library's Ground group is not part of the asset registry.**
  `ObjectLibrary` renders the seven kinds itself (`GroundCard`), so
  `LibraryItem`, the thumbnail script and the thumbnail studio are
  untouched. The cards are color swatches, not rendered thumbnails.
* **`BASE_ORDER` is now plot, corner, street** (the Scene panel and the New
  dialog list them in that order).
* **Files the plan did not list:** `objects/ground/groundGeometry.ts`
  (`groundBox` and the `QuadWriter` shared by the corner base, the plot, the
  platform and the markings).
* **Palette additions:** `pavingTile`, `pavingJoint`, `concreteSlab`, `lawn`,
  `soil`, `plinthWood`, `plinthWoodDark`, `plinthBrass`, `roadbed`,
  `subsoil`, `subsoilDark`. (Blender reads every key; none is used there.)
* **No Blender work,** as planned; `build.py` was not run.

### Verification results

Headless Chrome on the GTX 1660 SUPER against the dev server (and a
production build for the paint cost), driving the page with real pointer and
key events and reading the store and renderer through `?dev=stats`. The
scenario scripts were one-off files built on the `Cdp` and `launchBrowser`
exports of `capture-presets.mjs`; they are not in the repo. The baseline of
`main` was captured from the same working tree with the stage's changes
stashed.

| Check | Result |
|---|---|
| Existing scenes vs. `main` (street starter and the hero by day as seeds, 4 presets, editor and Preview; canvas area only) | Street: 0 pixels differ in seven of eight shots. Hero: 0.04–3.1 % of pixels differ by more than 4/255, none by more than 24/255, all of them on the ground (`diff-edit-top.png`: objects are black, roads and lot mottled). The two `preview-isometric` pairs could not be compared (the known first-Preview race). |
| Old and broken files (7 checks) | A corner file without `surface` / `plinth` loads as before (`dark`, no map); an unknown plinth loads as `dark`; a plot without a map, or with an unusable one, gets the default plot; unknown letters become gravel and short rows are padded; a v1 file still loads on the street strip; a map on another base is kept and not drawn. |
| Geometry, corner layout on a 16 m plot | Bounds x, z −8 … 8, y −0.25 … 0.002 (joints); lot and sidewalk at 0, both roads at −0.15; curb strip at x 3.35 … 3.5 and in the inner corner; 3,328 triangles |
| Brush, undo, reseat, placement (40 checks, real pointer events) | New → Empty free plot gives a 32 × 32 map in the street layout with the ground in the first history entry. A library card starts the brush; a 3 m drag at size 2 paints 16 cells, nothing else changes, and it is one undo step; undo and redo restore the map exactly. A Shift drag through three points stays on one row. `[` `]` change the size, Esc ends the brush. A click aimed at a building's wall paints the ground behind it and leaves the selection alone. Painting road under a vending machine on the sidewalk drops it by 0.15 m, a post box floating at 0.6 m stays, 22 of 47 scatter pieces drop — all in one undo step, and undo brings ground and objects back together; painting the sidewalk back lifts the machine again. Click-to-place lands at −0.15 on the road and 0 on the lot; the scatter brush paints on a plot; the three markings lie on the asphalt. Each of the four sizes sets the map, the preset zoom (45.3 / 34 / 27.2 / 22.7) and the shadow extent (±10.5 / 14 / 17.5 / 21); a resize and a layout are one undo step each. A save → New → import round trip keeps ground, platform and objects; the file is v2. Corner → Free plot gives the corner layout with every object in place; switching back draws the corner again and keeps the map. |
| Platform | Dark, wood and earth render on the corner and on a plot; the brass plate shows the scene's name and follows a rename (`art/previews/stage8_nameplate.png`) |
| Draw calls | Empty plot: 3 (grid, ground, platform). The corner base needs 10. |
| Paint cost per stamp (brush 1.5 m, 60 stamps) | Production build: median frame 5.8–6.0 ms on 16 × 16, 24 × 16 and 20 × 20 m (that is the 180 fps cap), worst 17 ms. Dev server: median 15–19 ms. The cost does not grow with the map: it is React, not the geometry. |
| Frame rate, 1920×1080 | 100 objects on a 24 × 16 m plot (kei cars, bicycles, vending machines, ginkgos; 206 draw calls, 496k triangles): editor 180 fps, Preview 180. Acceptance scene (38 objects, 69 draw calls, 69k triangles): editor 180, Preview 180. |
| Thumbnails | 42 of 42 items have one; the three markings were rendered with `--only` |
| Visual gate (§49) | `art/previews/stage8_plot_editor.png`, `stage8_ground_closeup.png`, `stage8_plot_dusk.png`, `stage8_ground_kinds.png`: a painted 24 × 16 m back street with the hero's assets. Scale: the 4.5 m road, 1.5 m sidewalk and 0.15 m curb match the corner base. Materials: asphalt, gravel and soil are grainy, concrete and pavers nearly flat; paving stones are toned one by one. Lighting: the ground takes shadows and the glow lights like the corner base. Detail: the grain shows in close-ups and is gone in the overview, without shimmer. Identity: narrow road, crosswalk, 止まれ, gutter grates, paved shop forecourt. |
| `npm run lint`, `npm run build` | Pass; no page errors in any run |

**Not done:** nothing was compared with the reference photo (it is not in
the repository).

### Known limitations

* **Two levels and straight edges only.** No ramp where a crosswalk meets a
  sidewalk on a plot, no slopes, no curved or diagonal roads.
* **Only a plot can be painted.** The corner and the street strip stay
  fixed; switching the hero corner to a plot keeps the layout but drops the
  base's own markings, manhole and grates (place the objects instead).
* **Objects follow the ground only if their origin stood on it** (within
  5 mm). A building that straddles a new road stays where it is, and
  attachments never move.
* **Objects outside a plot that was made smaller stay where they are.**
* **Markings are plain objects:** they do not snap to the road's direction,
  can be put on any surface, and stretch with the scale gizmo.
* **The curb has no joints,** and a sidewalk's joints follow the 1 m grid of
  the plot, not the shape of the sidewalk.
* **Only grass follows the season;** there is no snow.
* **The nameplate is on the wooden base only,** on the front side; a long
  name is set smaller.
* **Base and platform changes are not on the undo stack.** Undoing a ground
  step while another base is shown changes the hidden map.
* **The brush highlight is drawn over everything,** buildings included.
* **The ground cannot be painted from the keyboard;** the layouts and sizes
  can be chosen with it.
* **The editing grid floats 15 cm above roads,** as on the corner base.
