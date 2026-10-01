# Stage 5 — Modular Building and Surface Attachment (Implementation Plan)

Part of [Hero-Diorama-Roadmap.md](Hero-Diorama-Roadmap.md) (decisions L2,
L4, L6, L7, L8). Dimensions come from [Hero-Layout.md](Hero-Layout.md) §3.

**Goal:** the user builds the hero corner shop-house without any modeling:
pick a building preset, adjust bays, floors and facades in the inspector,
then click props onto its walls, balcony and roof. Props placed on a
building belong to it and follow it.

Branch: `stage5-building`, cut from `main` (Stage 4 is merged, PR #7).

> This replaces the earlier short draft of this file. The draft's slice (a
> `building` type, `parentId` + `params`, subtree delete/duplicate, a hero
> building on the corner base) is milestones M2, M3 and M6 below. The draft
> left out Blender modules, the inspector and click-to-place; the roadmap
> and `HANDOFF.md` §7 make them part of the stage, so they are planned
> here. See open question 1.

---

## 0. Starting Point (verified 2026-10-01)

* **Scene objects are flat and independent.** `DioramaObject` has `id`,
  `type`, transform, `visible`, `locked`. No `parentId`, no `params`.
  Every store action (`removeObjects`, `duplicateObjects`,
  `translateObjectsBy`) treats each object alone.
* **History is snapshots of the whole `objects` array.** New fields on an
  object are covered by undo/redo with no change to `historyManager.ts`.
* **The validator rebuilds each object from known fields,** so unknown
  fields are dropped on import and on reload.
* **Buildings are the two legacy components** `House` and `Shop`, in the
  old 6 m unit. The corner starter has no building; an AC unit stands on
  the ground inside the future footprint at (−3.4, 1.4).
* **Adding is "click in the library → spawn on a spiral"**
  (`objectDefaults.ts`). Nothing raycasts onto surfaces; the only canvas
  pointer handling is click-to-select and the gizmo.
* **GLB assets** render through `GltfAsset` (one `<Clone>` per object, up
  to three shared materials). Nine assets exist; `build.py all` passes.
* **Manhole and gutter grates** are fixed details of `CornerBase`.
* **"Focus selected"** frames `object.position` directly, which is only
  right while every position is in world space.

---

## 1. Decisions

### D1 — Scene data: `params` and `parentId`, additive

```ts
type FacadeKind = "blank" | "windows" | "shopfront" | "balcony" | "entrance";
type BuildingSide = "front" | "right" | "back" | "left";
type RoofKind = "flat-rooftop" | "hipped-tile" | "shed";

interface BuildingParams {
  baysX: number;                                   // 1 … 6
  baysZ: number;                                   // 1 … 6
  /** Index 0 is 1F. One facade kind per bay, left to right seen from outside. */
  floors: Array<Record<BuildingSide, FacadeKind[]>>; // 1 … 4 floors
  roof: RoofKind;
}

interface DioramaObject {
  // …existing fields
  parentId?: string;        // D4
  params?: BuildingParams;  // only on type "building"
}
```

* **No version bump** (roadmap L1 rule): both fields are optional. Files
  stay v2.
* **Facades are stored per bay,** not per side. The hero building needs
  mixed sides (2F front: window, balcony, balcony). The inspector edits a
  whole side at once in this stage and shows "Mixed" when bays differ.
* **`entrance` is added to the roadmap's four kinds.** A house preset needs
  a front door.
* **Validator:** `params` is kept only on `building`, clamped to the ranges
  above; arrays are resized to the bay counts; unknown kinds become
  `blank`. A building without valid `params` gets the default preset.

### D2 — Building modules from Blender, on the L6 grid

One bay is 1.82 m wide. Upper floors are 2.8 m, the ground floor 3.2 m,
the parapet 1.1 m. All modules follow the Stage 3 rules: no baked AO or
grime, simple shapes, the vending machine's bevels and palette.

| Module (`public/models/buildings/`) | Size (w × h) | Notes |
|---|---|---|
| `building_bay_wall_01` | 1.82 × 2.8 | plain wall |
| `building_bay_window_01` | 1.82 × 2.8 | aluminium sliding window, glass in `emissive` |
| `building_bay_balcony_01` | 1.82 × 2.8 | sliding door, balcony 0.9 m deep with railing |
| `building_bay_entrance_01` | 1.82 × 2.8 | genkan door with a small canopy |
| `building_bay_shopfront_01` | 1.82 × 3.2 | glass sliding doors, lit interior (`emissive`), awning at y 2.6 … 2.8, 1.0 m deep; ground floor only |
| `building_bay_foundation_01` | 1.82 × 0.4 | concrete base course under ground-floor bays that are not shopfronts |
| `building_corner_01` | 0.18 × 0.18 × 1.0 | corner post, 1.5 cm proud; scaled in Y per floor |
| `building_parapet_01` | 1.82 × 1.1 | parapet 0.5 m + railing 0.6 m, for the flat rooftop |

* **Module origin:** bottom center of the bay, on the outer wall plane.
  The panel is 0.15 m thick and extends inward. Front faces −Y in Blender.
* **A shopfront above the ground floor** renders as `windows`.
* **Budget:** ≤ 3k triangles per module, ≤ 3 material slots (L8).
  `build.py` already enforces both.
* **Roofs are generated in app code,** not from Blender pieces: their size
  follows the bay counts (L2, parametric lane).
  * `flat-rooftop`: a slab plus parapet modules.
  * `hipped-tile`: four slopes with a 0.45 m eave, tile rows as shallow
    steps, `roofTile` color.
  * `shed`: one slope falling to the back.

### D3 — The `building` type: merged geometry, three draw calls

* `objects/building/` holds the builder and the component:
  * `buildingLayout.ts` — pure function `params → placements[]` (module,
    position, yaw, scale) plus the footprint and height. No three.js state.
  * `buildingGeometry.ts` — merges the placed module geometries with
    `mergeGeometries` into **one geometry per material slot**, plus the
    roof.
  * `Building.tsx` — loads the module GLBs, memoizes the merged geometry by
    the serialized `params`, renders ≤ 3 meshes with the shared materials.
* **Deviation from the roadmap:** it says "instanced modules, only the
  affected modules rebuilt". Merging gives 3 draw calls per building
  instead of about 12, and a full rebuild of ≤ 40k triangles takes a few
  milliseconds. Instancing can come back if many buildings ever cost
  memory.
* The building's origin is the center of its footprint at ground level.
* **Presets** (`assets/buildingPresets.ts`), shown in the library under
  Buildings:
  * **Shop-house 3F** — 3 × 3 bays, the hero building of Hero-Layout §3.
  * **House 2F** — 3 × 2 bays, entrance and windows, hipped tile roof.
* **Inspector** (`BuildingPanel.tsx`), shown for one selected building:
  steppers for bays X, bays Z and floors; per floor, a select for each of
  the four sides; a roof select. Every change is one undo step.
* Legacy `house` and `shop` stay as they are, for saved scenes and the
  street starter.

### D4 — Parent/child rules (fixed before any code)

The scene stays a flat array; a child carries `parentId`.

| Topic | Rule |
|---|---|
| Who can be a parent | Only a `building`. A child cannot have children: **one level**. |
| Child transform | Local to the parent. The child renders inside the parent's group. |
| Orientation | Attachments stay upright. Only yaw is set by surface snap. |
| Move / rotate / scale parent | Children follow, because they are in its group. Their stored transforms do not change. |
| Delete parent | Deletes its children in the same undo step. |
| Delete child | Deletes only the child. |
| Duplicate parent | Copies the subtree with new ids and remapped `parentId`. Only the root is offset. |
| Duplicate child | New sibling under the same parent, offset 0.5 m in the parent's frame. |
| Selection holds a parent and its child | Move, duplicate and delete act on the parent only, so the child is not handled twice. |
| Multi-select move | The drag delta is a world vector. For a child it is converted into the parent's frame. |
| Hide parent | Children are not drawn. Their own `visible` flag is untouched. |
| Lock parent | The parent cannot be transformed. Children stay editable. |
| Lock child | The child cannot be edited, and still follows its parent. |
| Detach (inspector) | Removes `parentId` and converts the local transform to world, so the object does not jump. One undo step. |
| Undo / redo | Unchanged: snapshots already contain `parentId` and `params`. |
| Import / reload | `parentId` is dropped if the parent is missing, is not a building, or is itself a child. Cycles cannot survive that rule. |
| Focus selected | Uses world positions. |
| Object list | Children are listed indented under their parent. |

* The world/local math lives in one file, `utils/sceneGraph.ts`
  (`getWorldTransform`, `toLocal`, `getSubtreeIds`, `topLevelIds`). Store
  actions and the UI use it; nothing else reimplements it.

### D5 — Click-to-place with a ghost and surface snap

* **Editor state** (not saved): `placement: { type, params?, movingId? } | null`.
* **Flow:** click a library item → a ghost of the asset follows the pointer
  over surfaces → click places it and selects it → placing ends.
  Shift+click keeps placing the same asset. Esc cancels.
* **Keyboard path:** activating a library item with Enter or Space places
  it on the spawn spiral as today (CLAUDE.md §44).
* **Surfaces that can be hit:** the base (lot, sidewalks, roads) and
  buildings. Other props are not targets. This narrows the roadmap's
  "any mesh", and it matches the one-level rule of D4.
* **Snap:**
  * Surface facing up: the object stands on the hit point. With grid snap
    on, x and z snap in the frame of the surface's owner. A hit on a road
    gives y −0.15 by itself.
  * Wall: only assets marked wall-mountable in the registry
    (`wallMount: { offset }`). The asset's front turns to the wall normal,
    and the origin moves out by `offset`. Other assets show no ghost on
    walls.
* **Dropping on a building sets `parentId`** and stores the transform in
  the building's frame.
* **Re-place:** an inspector action puts an existing object back under the
  pointer (`movingId`), so an attachment can move to another surface or
  another building. One undo step.
* The ghost's transform lives in a ref inside `PlacementLayer.tsx` and is
  written to the three object directly; the store changes only on click.
* The gizmo keeps working as before, without surface snap.
* **Manhole and gutter grate become placeable** (`manhole`, `gutterGrate`,
  category Street). The ones built into `CornerBase` stay, so existing
  corner scenes do not change.

### D6 — Attachments from Blender

All without baked AO. The existing AC unit becomes wall-mountable.

| Asset | Size | Budget | Mount |
|---|---|---|---|
| `prop_laundry_01` | pole 1.6 m with hanging laundry | ≤ 1.5k | balcony, roof |
| `prop_water_tank_01` | Ø 1.2 tank on a 1.0 m stand | ≤ 1.5k | roof |
| `prop_rooftop_shed_01` | 2.4 × 2.2 × 1.8 prefab shed | ≤ 1.5k | roof |
| `prop_potted_plant_01` | 0.3 × 0.5 pot with a shrub | ≤ 1.5k | any flat surface |
| `prop_sign_kanban_01` | 0.6 × 2.4 projecting vertical sign, `emissive` face with a printed cell | ≤ 1.5k | wall |

* One new atlas cell, `kanban_sakaya` (酒 vertical lettering). Editable
  sign text is not part of this stage.
* They are ordinary registry assets: they can also stand on the ground
  with no parent.

### D7 — Corner starter

Reset on the corner base now loads the hero building from the
**Shop-house 3F** preset at the layout footprint (center −1.03, −1.03),
with its attachments as children: balcony AC and laundry, a wall AC on 3F
right, the kanban, the water tank, the shed and pots on the roof. The
loose AC unit inside the footprint is removed. Saved scenes do not change.

### D8 — Out of scope

* per-bay facade editing in the inspector (data supports it; UI later)
* nested attachments, attaching to props, re-parenting by dragging
* editable sign text, interior backplate, time-of-day window light
  (Stage 7)
* pipes on the back walls, chair, meter box, A-frame sign
* scatter and kits (Stage 6)
* converting the street strip or the legacy `house` / `shop`
* undo for base changes; restoring selection on redo

---

## 2. Milestones

### M1 — Building modules (Blender)

* The eight modules of D2; previews reviewed side by side with the vending
  machine.
* **Check:** `build.py all` exits 0; each module is on the L6 grid within
  1 mm (bounding box).

### M2 — `building` type, presets, inspector

* Types, validator, `buildingLayout`, `buildingGeometry`, `Building`,
  presets in the library, `BuildingPanel`.
* **Check:** the Shop-house 3F bounding box is 5.46 × 9.9 × 5.46 m; ≤ 3
  draw calls and ≤ 40k triangles; every param change redraws and undoes.

### M3 — Parent/child

* `sceneGraph.ts`, store actions, nested rendering in `DioramaObject`,
  Detach, object list, focus.
* **Check:** the scripted scenarios of §4 on a building with two children.

### M4 — Click-to-place and surface snap

* `placement` state, `PlacementLayer`, registry `wallMount`, library
  change, Re-place, manhole and grate in the registry.
* **Check:** place on lot, road, wall, balcony floor and roof; each lands
  where the ghost was.

### M5 — Attachment assets

* The five assets of D6 and the `kanban_sakaya` cell.

### M6 — Starter, acceptance, docs

* Corner starter with the hero building.
* All checks of §4; then the status section here, the roadmap and
  `HANDOFF.md`.

---

## 3. Files

| Change | Files |
|---|---|
| New (app, under `features/diorama/`) | `objects/building/buildingLayout.ts`, `objects/building/buildingGeometry.ts`, `objects/building/Building.tsx`, `assets/buildingPresets.ts`, `utils/sceneGraph.ts`, `components/BuildingPanel.tsx`, `components/PlacementLayer.tsx` |
| Modified (app) | `types/diorama.types.ts`, `utils/sceneValidator.ts`, `utils/objectDefaults.ts`, `utils/palette.ts`, `store/dioramaStore.ts`, `assets/assetRegistry.ts`, `components/DioramaObject.tsx`, `components/DioramaCanvas.tsx`, `components/ObjectLibrary.tsx`, `components/ObjectList.tsx`, `components/PropertiesPanel.tsx`, `components/dev/DevRendererHandle.tsx` (store handle for the checks), `hooks/useEditorShortcuts.ts`, `objects/ground/CornerBase.tsx` and `StreetBase.tsx` (mark surfaces as placement targets), `objects/textures/atlasLayout.json`, `objects/textures/graphicsAtlas.ts` |
| New (Blender) | `art/blender/assets/buildings/building_*.py` (8), `art/blender/assets/props/prop_laundry_01.py`, `prop_water_tank_01.py`, `prop_rooftop_shed_01.py`, `prop_potted_plant_01.py`, `prop_sign_kanban_01.py` |
| Generated | `public/models/buildings/*.glb`, `public/models/props/*.glb`, previews in `art/previews/` |
| Docs | this file; roadmap Stage 5 status; `HANDOFF.md` |

No new npm dependencies.

---

## 4. Verification

| Check | How | Target |
|---|---|---|
| Existing scenes unchanged | `capture-presets.mjs` on the street starter and on a seeded Stage 4 corner scene, vs. `main` | Canvas identical apart from render noise |
| Module grid | Bounding boxes from `build.py` | 1.82 m wide; 2.8 / 3.2 / 0.4 / 1.1 m tall; within 1 mm |
| Hero building dimensions | Bounding box in the scene graph | 5.46 × 5.46 m footprint at x, z −3.76 … 1.7; roof slab at 8.8; parapet top at 9.9 |
| Building budget | `measure-scene.mjs` on a scene with one Shop-house 3F | ≤ 3 draw calls, ≤ 40k triangles |
| Params | Each stepper and select, then undo and redo | Geometry follows; one undo step per change |
| Children follow | Move, rotate and scale the building | Children keep their place on it; their stored transforms are unchanged |
| Delete / duplicate | Parent alone, child alone, parent + child selected | Results as in the D4 table; ids unique; no dangling `parentId` |
| Undo / redo | After each operation above | Links restored exactly |
| Detach / Re-place | On a wall AC | No jump on detach; re-place onto another building changes `parentId` |
| Save / export / import / reload | Round trip of the corner starter | Same objects, `params` and `parentId`; file stays v2 |
| Bad files | Dangling parent, parent that is a prop, child of a child, bad `params` | Loads; links dropped; params clamped |
| Placement | Lot, road, sidewalk, wall, balcony, roof; snap on and off; Shift+click; Esc; keyboard add | Lands where the ghost was; correct parent; road y −0.15 |
| Visual gate (CLAUDE.md §49) | Editor and Preview shots of the corner starter, isometric and close-ups | Building reads as a Japanese shop-house; same collection as the props |
| Frame rate | Corner starter + 100 objects, 1920×1080 | Editor ≥ 50 fps, Preview ≥ 40 fps |
| Static checks | `npm run lint`, `npm run build`, `build.py all` | Pass; no page errors |

---

## 5. Risks

* **Scripted facades look flat without baked AO.** Modules get real depth
  (recessed windows, sills, frames, awning) so the runtime shadows and
  Preview's AO do the work. The previews are reviewed before M2.
* **Seams between merged modules.** Corner posts cover the corner joints;
  bays share exact grid edges. Checked in close-ups.
* **The gizmo on a nested object.** drei's `TransformControls` must write
  local transforms inside a rotated, scaled parent. Checked first thing in
  M3; the fallback is to convert from world space in `handleObjectChange`.
* **Parent/child bugs in multi-select.** All selection-wide actions go
  through `topLevelIds` in `sceneGraph.ts`; the scenarios in §4 cover the
  mixed cases.
* **Pointer-move cost while placing.** The ghost never goes through React
  state or the store.
* **Stage size.** This is the largest stage so far (13 Blender scripts and
  four app milestones). The milestones are ordered so that work can stop
  after M3 with a consistent app (see open question 1).

---

## 6. Open Questions (approved 2026-10-02 with the defaults)

1. **Scope.** Default: the whole stage, M1–M6, on one branch. Alternative:
   stop after M3 (the earlier draft's slice, with real modules) and do
   placement and attachment assets as a second PR.
2. **Library click** starts ghost placement; keyboard activation keeps the
   spiral spawn.
3. **Roofs** (hipped tile, shed) are generated in app code, not built from
   Blender pieces.
4. **Buildings render merged** (3 draw calls), not instanced.
5. **Legacy House and Small Shop** stay in the library.
6. **Manhole and grates:** the base keeps its fixed ones; placeable copies
   are added.
7. **Attachments:** only on buildings, one level deep.

---

## 7. Status — Implemented 2026-10-02

All milestones M1–M6 are done on branch `stage5-building`. Nothing is
committed yet.

### Deviations from the plan

* **Nine modules, not eight.** `building_balcony_side_01` closes each end
  of a balcony run, so the balcony bay itself tiles without side panels.
* **The entrance bay is full ground-floor height** (1.82 × 3.2 m), like the
  shopfront, so its door starts at the ground. It carries its own piece of
  foundation.
* **Ground floor and upper floors offer different facades** (ground: wall,
  windows, shopfront, entrance; upper: wall, windows, balcony). The
  validator turns a misplaced kind into `windows` instead of rendering it
  as something else.
* **The gizmo moved out of `DioramaObject`** into the new
  `components/SceneObjects.tsx`, at the scene root. Inside a building's
  group it would have been transformed with the building.
* **Files the plan did not list:** `components/SceneObjects.tsx`,
  `components/SurfaceActions.tsx` ("Move to a surface", "Detach"),
  `utils/buildingParams.ts` (grid, limits, normalizing, resizing),
  `utils/surfaceSnap.ts`, `art/blender/lib/facade.py` (shared module
  parts).
* **Thin faces are not surfaces.** While placing, a hit on a face narrower
  than 10 cm (rails, posts, frames, sills) is skipped, so a click aimed at
  the roof behind the railing reaches the roof.
* **The placing click is captured** before the scene's own click handlers.
  Otherwise the same click also deselected the object it had just placed.
* **`setBuildingParams` takes an update function** of the stored params.
  Two quick stepper clicks built on the same stale render otherwise.
* **The kanban's faces are `printed`, not `emissive`.** The printed
  material has no emission; lighting the sign belongs to Stage 7.
* **Palette additions:** `foundation`, `roofSlab`, `doorDark`,
  `terracotta`, `tankCream`.
* **Module `WEATHER` also sets `face_jitter` to 0,** so tiled bays match
  exactly.

### Assets

| Asset | Tris / budget | Draw calls | GLB |
|---|---|---|---|
| `building_bay_wall_01` | 24 / 3,000 | 1 | 3 KB |
| `building_bay_window_01` | 204 / 3,000 | 2 | 16 KB |
| `building_bay_balcony_01` | 240 / 3,000 | 2 | 19 KB |
| `building_balcony_side_01` | 24 / 3,000 | 1 | 3 KB |
| `building_bay_entrance_01` | 304 / 3,000 | 2 | 23 KB |
| `building_bay_shopfront_01` | 572 / 3,000 | 2 | 41 KB |
| `building_bay_foundation_01` | 84 / 3,000 | 1 | 7 KB |
| `building_corner_01` | 12 / 3,000 | 1 | 2 KB |
| `building_parapet_01` | 72 / 3,000 | 1 | 6 KB |
| `prop_laundry_01` | 316 / 1,500 | 1 | 22 KB |
| `prop_water_tank_01` | 582 / 1,500 | 1 | 35 KB |
| `prop_rooftop_shed_01` | 512 / 1,500 | 1 | 37 KB |
| `prop_potted_plant_01` | 312 / 1,500 | 1 | 22 KB |
| `prop_sign_kanban_01` | 116 / 1,500 | 2 | 12 KB |

None has baked AO or grime. `build.py all` builds all 23 assets and exits
0. It also re-renders the previews of the older assets and re-bakes four
GLBs with slightly different noise; those were restored from git, since
their scripts did not change.

### Verification results

Headless Chrome on the GTX 1660 SUPER, against the dev server. The
scenarios ran as one-off scripts on the `Cdp` and `launchBrowser` exports
of `capture-presets.mjs`, driving the store through `?dev=stats`
(`window.__dioramaStore`) and the canvas with real pointer events. The
scripts are not in the repo.

| Check | Result |
|---|---|
| Existing scenes vs. `main`, 4 presets × editor/Preview, street starter and a seeded Stage 4 corner scene | Canvas identical: at most 7 pixels differ by more than 4/255. One baseline shot (street, Preview, isometric) was the known small-framing race of `capture-presets.mjs`; two fresh runs agree with each other. The seeded scene is saved back without any `parentId` or `params`. |
| Module grid (GLB bounds) | Every bay module is 1.82 m wide; 2.8 / 3.2 / 0.4 / 1.1 m tall |
| Hero building (scene graph) | At ground level x, z −3.775 … 1.715: the walls at −3.76 … 1.7 plus the 1.5 cm corner posts. Parapet top at 9.9. Awnings reach x, z 2.7. |
| Building budget | 2 draw calls (`base`, `emissive`) and 7,112 triangles for Shop-house 3F |
| Params | Steppers, roof select and facade selects through the real inspector controls: geometry follows (4 × 2 bays, 4 floors, hipped roof: bounds as computed); five changes are five undo steps; redo replays them |
| Children follow | Move, rotate and scale the building: the children's stored transforms are unchanged, and the water tank's rendered world position moves with it |
| Delete / duplicate | Parent: 9 objects go in one step and come back with their links on undo. Duplicate copies the subtree with unique ids, re-linked, root offset (3, 3). A child alone: only it is deleted; its duplicate is a sibling 0.5 m along. Parent + child selected: handled once. |
| Multi-select move | Parent + child selected: only the parent's position changes. A world step on a child of a 90°-rotated building is stored as the local step (0, 0, 1). |
| Gizmo on an attached object | Dragging the X arrow of a roof pot on a 90°-rotated building writes a local step along Z only; it stays attached |
| Detach / move to a surface | Detach keeps world position and heading; undo re-attaches. A wall AC moved to the ground loses its parent; moved onto the roof it is attached again; one undo step each. |
| Hide / lock | Hiding the building removes 11 draw calls (it and its 8 attachments); child flags untouched. A locked parent cannot move while its child can; a locked child cannot be edited or detached. |
| Save → New → import | Identical objects, `params` and `parentId`; file v2; base `corner` |
| Bad files | Bays 99 / −3 → 6 / 1; six floors → four; unknown roof → flat; unknown kinds → wall; a shopfront upstairs → windows; a building without params → default preset. Links dropped for: missing parent, parent that is a prop, child of a child, building as a child, self-parent. The one valid link survives. |
| Placement | Lot, road (y −0.15), grid snap 0.5 m, wall (AC attached, 0.2 m off, facing out), roof, balcony floor (y 3.25). Shift+click keeps placing; Esc cancels; keyboard activation adds on the spiral; a wall-only sign is refused on the ground, a vending machine on a wall, a building on a building. Also on the street strip: lot, a preset building, an AC on its wall. |
| Frame rate, 1920×1080 | Corner starter (18 objects): editor 180 fps (the headless cap), Preview 180; 35 draw calls, 40k triangles. Starter + 100 objects: editor 179, Preview 180; 195 draw calls, 245k triangles. |
| Visual gate | `art/previews/stage5_corner_starter.png`: the building reads as a Japanese corner shop-house (shopfront with goods, awning, 袖看板, balcony with laundry, rooftop tank and shed) in the same palette as the props |
| `npm run lint`, `npm run build`, `tsc --noEmit` | Pass; no page errors in any run |

**Not measured:** "the hero building can be built from a preset in under
5 minutes" was not timed with a person. It takes one preset placement and
eight attachment placements.

### Known limitations

* **Attachments do not follow a resize.** Changing bays or floors leaves
  each attachment at its stored place in the building's frame, so it may
  float or sink into a wall. Use "Move to a surface".
* **The inspector edits a whole side at once.** Per-bay kinds only come
  from presets and show as "Mixed".
* **The gizmo does not snap to surfaces or change the parent.** Dragging
  an attachment off the building leaves it attached; "Move to a surface"
  re-parents.
* **Windows glow in daylight.** Glass is `emissive` at the one scene-wide
  level until Stage 7's time of day.
* **Awnings do not wrap the corner,** and the back walls are plain (no
  pipes or meter box).
* **The selection ring of a wall-mounted object** lies flat at its origin.
* **A building can still be scaled** with the gizmo, which takes it off
  the 1.82 m grid.
* **The wall-only sign added from the keyboard** lands on the ground,
  since the spiral has no walls. Move it to a wall afterwards.
* **Recessed window panes are surfaces too:** an AC aimed at a window
  mounts on the glass, 4 cm further in.
* **The parapet's coping (20 cm) is a surface;** its rails are not.
