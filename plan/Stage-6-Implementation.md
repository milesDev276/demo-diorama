# Stage 6 — Density Tools (Implementation Plan)

Part of [Hero-Diorama-Roadmap.md](Hero-Diorama-Roadmap.md) (decisions L2,
L4, L7, L8). Builds on Stage 5's parent/child rules and click-to-place
([Stage-5-Implementation.md](Stage-5-Implementation.md) D4, D5).

**Goal:** the small-detail density of the reference — fallen leaves, weeds
along walls, pebbles, clutter by the shop door, a row of bicycles — takes
minutes, not hours. The user paints scatter with a brush and drops whole
groups of props ("kits") in one click.

Branch: `stage6-density`, cut from `main` (Stage 5 is merged, PR #8).

> The user handed every decision of this stage to Claude (2026-10-02). The
> open questions in §6 were therefore settled with the defaults listed
> there, and implementation followed the plan without a separate approval
> round.

---

## 0. Starting Point (verified 2026-10-02)

* **Adding is click-to-place** (Stage 5 D5): `placement` in editor state,
  `PlacementLayer` raycasts surfaces tagged `userData.placementSurface`,
  `utils/surfaceSnap.ts` decides the transform. A placement session keeps
  one random heading for all Shift+click placements.
* **`params` is typed `BuildingParams`** and only exists on `building`.
* **Duplicate** (`duplicateWithChildren` in the store) offsets by 3 m and
  copies subtrees; no variation.
* **The asset browser** is a single-column list of icon rows; no
  thumbnails. Blender previews exist for GLB assets only, on a floor, with
  printed faces blank (the atlas is runtime-only).
* **Nothing renders instanced.** Every object is its own draw call(s).
* **No small props for clutter** beyond pots; recycling bin, A-frame sign
  and chair are on the L7 hero list but not built.
* The corner starter has 18 objects, 35 draw calls, 40k triangles.

---

## 1. Decisions

### D1 — Scene data: the `scatter` type

```ts
const SCATTER_KINDS = ["leaves", "grass", "pebbles", "weeds"] as const;

interface ScatterParams {
  kind: ScatterKind;
  seed: number;              // integer; changes the per-piece variation
  points: Vector3Tuple[];    // piece positions in the layer's own frame
}

type ObjectParams = BuildingParams | ScatterParams;

interface DioramaObject {
  // …existing fields
  params?: ObjectParams;     // BuildingParams on "building", ScatterParams on "scatter"
}
```

* **One scene object per layer,** as the roadmap says. Moving, hiding,
  locking, deleting and duplicating a layer use the existing actions.
* **Per-piece heading, size and tint are not stored.** They come from a hash
  of the seed and the piece's position (rounded to the millimeter), so a
  file stays small, a scene reproduces exactly anywhere, and erasing one
  piece never changes its neighbours.
* **Points are rounded to millimeters,** at most `MAX_SCATTER_POINTS`
  (1,500) per layer.
* **Additive:** files stay v2. The validator drops a scatter object with an
  unknown kind, clamps the point list and fixes a bad seed.
* **`params` becomes a union keyed by `type`.** Typed readers
  (`buildingParamsOf`, `scatterParamsOf`) do the narrowing; nothing casts
  inline.
* **Scatter layers are never attached.** `repairParentLinks` also drops a
  `parentId` on a scatter layer. Painting on roofs is out of scope (D10).

### D2 — Scatter pieces from Blender

Small GLBs in `public/models/nature/`, one piece per kind. Variety comes
from D1's per-piece heading (0–360°), size (±25 %) and brightness (±8 %).
All without baked AO; one `base` slot, so **one draw call per layer**.

| Piece | Size | Budget | Shadows |
|---|---|---|---|
| `nature_scatter_leaves_01` | 6–7 fallen leaves (ginkgo fans, zelkova, brown) over ~0.4 m, lying flat | ≤ 200 | receive only |
| `nature_scatter_grass_01` | tuft of tapered blades, ~0.25 m tall | ≤ 200 | cast + receive |
| `nature_scatter_pebbles_01` | 4 flattened stones over ~0.25 m | ≤ 200 | cast + receive |
| `nature_scatter_weeds_01` | rosette of leaves with one yellow flower, ~0.2 m (the weeds that grow along Japanese walls and curbs) | ≤ 200 | cast + receive |

* Leaves are a little oversized (12 cm), as model-makers do, so they read
  as speckles from the isometric camera instead of vanishing.
* New L8 row: **scatter piece ≤ 200 triangles.**
* Palette additions: `zelkovaLeaf`, `leafBrown`, `pebble`.

### D3 — Rendering: one `InstancedMesh` per layer

* `objects/scatter/ScatterLayer.tsx` loads the piece GLB, takes its one
  geometry and renders an `InstancedMesh` with the shared `base` material
  and per-instance color (the brightness jitter).
* Instance matrices are rebuilt in a layout effect when the points or seed
  change — never per frame. Capacity grows in powers of two, so painting
  does not recreate the mesh on every new piece.
* `objects/scatter/scatterVariation.ts` holds the hash and the per-piece
  transform; the thumbnail studio and the brush preview use the same code.
* The selection ring of a layer is sized to its points.

### D4 — The scatter brush

* **Editor state** (not saved): `brush: { kind, layerId? } | null`, plus
  `brushRadius` (0.25 … 3 m, default 0.8) and `brushDensity` (0.25 … 1,
  default 0.7) that persist between brush sessions.
* **Entering:** clicking a scatter kind in the library ("Fallen leaves",
  "Grass tufts", "Pebbles", "Weeds", under Nature) starts the brush. The
  inspector's "Paint more" on a selected layer starts it for that layer.
  Starting a brush ends any placement and vice versa.
* **Stroke:** press and drag on the base. A ring follows the pointer. Along
  the drag, stamps every 0.35 × radius try candidates inside the ring; a
  candidate is kept if a ray straight down meets the base first (not a
  building, not a wall) on a flat face, and it is at least the kind's
  spacing (÷ density) from every other piece of the layer.
* **Target layer:** the selected layer of the same kind; otherwise the
  first stroke creates a new layer at the first stamp and selects it, so a
  whole brush session fills one layer.
* **Erase:** Alt+drag, or the Erase toggle in the brush bar, removes pieces
  of the brush's kind under the ring from every visible, unlocked layer.
  A layer erased to nothing is removed.
* **One undo step per stroke.** During the stroke the store is updated
  silently (like a gizmo drag) only when pieces are added or removed;
  `endScatterStroke` commits.
* **Camera:** the brush captures the left button before OrbitControls and
  R3F see it, so a left drag paints; right-drag pans and the wheel zooms as
  usual.
* **Brush bar** (top of the canvas while brushing): kind, Paint / Erase,
  size and density sliders, Done. `[` / `]` change the size; Esc ends the
  brush. The transform gizmo is hidden while brushing.
* **Keyboard path** (CLAUDE.md §44): activating a scatter kind from the
  keyboard adds a ready-made round patch (1.2 m, flat) on the spawn spiral.

### D5 — Kits

```ts
interface Kit {
  id: string;
  name: string;
  builtIn?: boolean;
  /** Scene objects in the kit's frame: the anchor is the origin. */
  objects: DioramaObject[];
}
```

* **Save as kit:** the inspector offers "Save as kit" for one object or a
  multi-selection, with an inline name field. The kit takes the selection's
  top-level objects with their attachments. The anchor is the center of
  the top-level objects' world positions on X/Z, at the lowest of their
  heights, so a rooftop group saved off a roof lands on any flat surface.
  A selected attachment whose building is not selected is saved detached,
  in world terms.
* **Storage:** a separate small Zustand store (`store/kitStore.ts`),
  persisted to `localStorage["diorama-kits"]` as
  `{ version: 1, kits }` whenever it changes (rare, user-triggered). Kits
  are library data, not scene data. Loading validates every kit through the
  scene validator's object normalizer and parent repair.
* **Library:** a "Kits" group after the asset categories: the user's kits
  first (with a delete button), then the four built-in ones.
* **Placing:** a kit is a placement like any asset (`placement.kit`). The
  ghost shows the whole group. It goes on flat surfaces only:
  * on the base, the kit's objects become top-level objects;
  * on a building's flat surface (roof, balcony), its top-level objects
    attach to that building — a kit holding a building cannot go there.
  * The kit's objects keep their relative transforms; ids are new and
    internal links are re-mapped (the same remapping as
    `duplicateWithChildren`). One undo step; the placed objects are
    selected.
* **Keyboard path:** activating a kit from the keyboard places it on the
  spawn spiral.

### D6 — Rotate while placing, varied repeats

* **R while placing** turns the ghost by 45° (Shift+R the other way) — for
  any asset and for kits. The transform-mode shortcut has no use while
  placing, so it is borrowed. Without this a placed kit could not be turned
  at all: a multi-selection only moves.
* **Jitter** (roadmap): assets marked `jitter` in the registry (tree, garden
  stone, ginkgo, potted plant) get a random heading and a size within
  ±12 % when duplicated, and again after every Shift+click placement, so
  repeated pots and trees never look stamped.

### D7 — New small props (from the L7 list)

The built-in kits need the clutter that the hero list already names. All
from Blender, no baked AO, ≤ 1.5k triangles:

| Asset | Size | Notes |
|---|---|---|
| `prop_recycle_bin_01` | 0.45 × 0.45 × 0.95 m | the can/bottle box beside every vending machine, two round slots |
| `prop_a_frame_sign_01` | 0.5 × 0.45 × 0.9 m | 立て看板 with a dark board face |
| `prop_chair_01` | 0.45 × 0.45 × 0.8 m | stackable plastic chair |

Other open L7 items (utility pole and transformer in meters, zelkova, block
wall, hedge, post box, meter box) stay open; they are not density tools.

### D8 — Built-in kits

Authored in code (`assets/builtInKits.ts`), in meters:

| Kit | Contents |
|---|---|
| Vending corner | 2 vending machines, recycling bin, a weeds patch at their feet |
| Bike parking | 3 bicycles in a loose row |
| Shop entrance | A-frame sign, 3 potted plants, a weeds patch |
| Rooftop set | water tank, storage shed, chair, 2 potted plants, laundry pole |

### D9 — Thumbnails, rendered by the app

**Deviation from the roadmap** ("reuse the Blender preview renders"): the
Blender previews show printed faces blank, sit on a floor, and do not exist
for legacy assets, building presets, scatter kinds or kits. Instead:

* `app/diorama/thumbnails/page.tsx` — a dev page that renders one library
  item (`?item=<key>`) alone on a transparent canvas with the scene's
  lighting and materials, framed by an isometric orthographic camera
  fitted to its bounds, and a faint contact shadow.
* `scripts/capture-thumbnails.mjs` — opens that page for every library
  item in headless Chrome and writes `public/thumbnails/<key>.webp`
  (192 × 192) plus `features/diorama/assets/thumbnails.json` (the keys that
  have one).
* The library becomes a two-column grid of cards (thumbnail, label), as in
  CLAUDE.md §30. An item without a thumbnail (a user's kit) shows its icon.

### D10 — Corner starter

Reset on the corner base adds three layers to the Stage 5 starter: fallen
leaves under and around the ginkgo, weeds along the building's back walls
and the lot edges, grass tufts in the lot's back corner. Saved scenes do
not change.

### D11 — Out of scope

* scatter on roofs or attached to buildings; season tint of leaves (Stage 7
  `environment.season`)
* renaming or editing kits, exporting or sharing kits
* new building or infrastructure assets beyond D7
* undo of kit library changes (save/delete a kit)
* a brush in Preview

---

## 2. Milestones

### M1 — Blender assets

* The four scatter pieces of D2 and the three props of D7.
* **Check:** `build.py` exits 0 for all seven; previews read at their size
  next to the vending machine.

### M2 — Scatter data and rendering

* Types, validator, registry entry, `ScatterLayer`, `scatterVariation`,
  keyboard patch, inspector section (count, Paint more, Shuffle).
* **Check:** a layer with 1,000 points is one draw call; round trip keeps
  points and seed.

### M3 — Brush

* Store state and actions, `BrushLayer`, brush bar, shortcuts.
* **Check:** paint, erase, target rules, one undo step per stroke, nothing
  lands under a building or on a wall.

### M4 — Kits and placement rotation

* `kitStore`, `utils/kits.ts`, built-in kits, Save as kit, kit placement and
  ghost, R to rotate.
* **Check:** save → place → links re-mapped; rooftop kit attaches to a
  building; reload keeps user kits.

### M5 — Jitter

### M6 — Thumbnails and library grid

### M7 — Starter, acceptance, docs

---

## 3. Files

| Change | Files |
|---|---|
| New (app, under `features/diorama/`) | `objects/scatter/ScatterLayer.tsx`, `objects/scatter/scatterVariation.ts`, `utils/scatterParams.ts`, `utils/kits.ts`, `assets/builtInKits.ts`, `assets/thumbnails.json`, `store/kitStore.ts`, `components/BrushLayer.tsx`, `components/BrushBar.tsx`, `components/ScatterPanel.tsx`, `components/SaveKitAction.tsx`, `components/dev/ThumbnailStudio.tsx` |
| New (app) | `app/diorama/thumbnails/page.tsx` |
| Modified (app) | `types/diorama.types.ts`, `utils/sceneValidator.ts`, `utils/sceneGraph.ts`, `utils/objectDefaults.ts`, `utils/palette.ts`, `store/dioramaStore.ts`, `assets/assetRegistry.ts`, `components/DioramaObject.tsx`, `components/SceneObjects.tsx`, `components/DioramaCanvas.tsx`, `components/PlacementLayer.tsx`, `components/ObjectLibrary.tsx`, `components/ObjectList.tsx`, `components/PropertiesPanel.tsx`, `components/BuildingPanel.tsx`, `components/SurfaceActions.tsx`, `hooks/useEditorShortcuts.ts`, `objects/building/Building.tsx` |
| New (Blender) | `art/blender/assets/nature/nature_scatter_{leaves,grass,pebbles,weeds}_01.py`, `art/blender/assets/props/prop_{recycle_bin,a_frame_sign,chair}_01.py` |
| New (scripts) | `scripts/capture-thumbnails.mjs` |
| Generated | 7 GLBs, their previews, `public/thumbnails/*.webp` |
| Docs | this file; roadmap Stage 6 status and L8 row; `HANDOFF.md` |

No new npm dependencies.

---

## 4. Verification

| Check | How | Target |
|---|---|---|
| Existing scenes unchanged | `capture-presets.mjs` on a seeded Stage 5 corner scene and the street starter, vs. `main` | Canvas identical apart from render noise |
| Asset budgets | `build.py` output | Scatter ≤ 200, props ≤ 1.5k triangles; 1 draw call each (props ≤ 3) |
| Scatter draw calls | `renderer.info` with one 1,000-point layer | +1 draw call for the layer |
| Scatter round trip | Save → New → import; reload | Same points, kind, seed; file v2 |
| Bad files | Unknown kind, 5,000 points, NaN points, bad seed, scatter with a parent | Object dropped / points clamped / seed fixed / link dropped |
| Brush | Scripted strokes with real pointer events on the corner base | Pieces only on base faces facing up; none under the building; spacing respected; one undo step per stroke; Alt erases; emptied layer removed |
| Brush target | Selected layer of the same kind vs. none vs. another kind | Paints into it / new layer / new layer |
| Kits | Save a building with attachments + a loose prop; place it; place the rooftop kit on a roof; reload | Ids new, links re-mapped, rooftop items attached; user kits survive reload |
| Kit file damage | Corrupt `diorama-kits` in localStorage | Loads without the damaged kits, no crash |
| Rotate while placing | R / Shift+R before the click | Placed yaw = ghost yaw |
| Jitter | Duplicate a pot 5 times; Shift+click 5 pots | Headings differ, scales within ±12 % |
| Thumbnails | `capture-thumbnails.mjs` | One webp per library item; library shows them |
| Density benchmark | Corner starter + 3 layers of 400 pieces + 4 kits, 1920×1080 | Editor ≥ 50 fps, Preview ≥ 40 fps, no drop vs. the starter |
| Visual gate (§49) | Editor and Preview shots of the corner starter, close-ups | Leaves and weeds read as part of the same miniature |
| Static checks | `npm run lint`, `npm run build` | Pass; no page errors |

---

## 5. Risks

* **Painting cost.** Each added piece updates the store; with ~100 objects
  that re-renders the object tree. Pieces are added only when spacing
  allows (a few per stamp), and the frame rate while painting is measured.
* **Scatter hides clicks.** A click on leaves selects the leaf layer rather
  than "nothing". Accepted: it is how every object behaves; Esc clears.
* **Thumbnail drift.** Thumbnails are generated files; they go stale when an
  asset changes. The script is one command and rewrites all of them.
* **Kits saved from an old app version** fail validation gracefully: a
  damaged kit is dropped, the rest load.

---

## 6. Open Questions (settled with the defaults, 2026-10-02)

1. **Scope:** the whole stage on one branch.
2. **Scatter layers** live on the base only (no roofs, not attachable).
3. **Thumbnails** are rendered by the app, not taken from Blender previews.
4. **Three new small props** from the L7 list (recycling bin, A-frame sign,
   chair) so the built-in kits have content.
5. **R rotates the ghost** while placing.
6. **The corner starter** gets three scatter layers.

---

## 7. Status — Implemented 2026-10-02

All milestones M1–M7 are done on branch `stage6-density`. Nothing is
committed yet.

### Deviations from the plan

* **A selected scatter layer marks every piece** with a small ring
  (`objects/scatter/ScatterSelection.tsx`) instead of one ring around its
  origin. A layer can spread across the base, and its single ring cut
  through the whole scene.
* **Asset components receive the object.** Procedural registry components
  now take `AssetComponentProps` (`object`, `surfaceId`); the building is
  registered through a small `BuildingAsset` adapter, the scatter layer as
  `ScatterLayer`. Legacy components ignore the props.
* **Thumbnails are 256 × 256** (not 192) and use a soft contact shadow
  under the item: the sun's shadow of a tall building ran out of the frame
  and was cut off. Framing uses vertex bounds — a geometry's own box,
  rotated, doubled the size of the legacy house's hipped roof.
* **The capture script hides the Next.js dev indicator,** which otherwise
  ends up in every thumbnail.
* **A stroke's clean-up removes every empty scatter layer,** not only the
  one it painted (an imported empty layer goes with the next stroke, inside
  that undo step).
* **Files the plan did not list:** `utils/objectParams.ts` (typed params
  readers), `utils/surfacePicking.ts` (raycast helpers shared by placing and
  the brush), `components/KitVisual.tsx` (kit ghost and thumbnails),
  `objects/scatter/ScatterSelection.tsx`, `store/kitStore.ts`.
* **Library cards** carry a small brush badge on scatter kinds; user kits
  have a delete button (with a confirm).
* **Palette additions:** `zelkovaLeaf`, `leafBrown`, `pebble`.

### Assets

| Asset | Tris / budget | Draw calls | GLB |
|---|---|---|---|
| `nature_scatter_leaves_01` | 140 / 200 | 1 | 10 KB |
| `nature_scatter_grass_01` | 126 / 200 | 1 | 10 KB |
| `nature_scatter_pebbles_01` | 80 / 200 | 1 | 9 KB |
| `nature_scatter_weeds_01` | 132 / 200 | 1 | 11 KB |
| `prop_recycle_bin_01` | 460 / 1,500 | 1 | 29 KB |
| `prop_a_frame_sign_01` | 132 / 1,500 | 1 | 11 KB |
| `prop_chair_01` | 548 / 1,500 | 1 | 38 KB |

None has baked AO or grime. Only these seven were built; no older asset
was rebuilt.

### Verification results

Headless Chrome on the GTX 1660 SUPER against the dev server, driving the
canvas with real pointer and key events and reading the store through
`?dev=stats`. The scenario scripts were one-off files built on the `Cdp`
and `launchBrowser` exports of `capture-presets.mjs`; they are not in the
repo.

| Check | Result |
|---|---|
| Existing scenes vs. `main` (street starter by default, and `main`'s Stage 5 corner starter as a seed), 4 presets × editor/Preview | 0 pixels differ by more than 4/255 in all 16 shots (canvas area; `main` ran from a temporary worktree on port 3001). The seeded scene is saved back with identical objects, v2. |
| Asset budgets | As in the table: scatter 80–140 triangles, props 132–548, one draw call each |
| Scatter draw calls | Corner starter 35 → 38 draw calls with its three layers (one each); 80k triangles |
| Brush (21 checks) | A library card click starts the brush; a stroke makes one layer, selected, one undo step; sidewalk pieces at y 0, road pieces at −0.15; nothing under the building, pieces on its far side; spacing ≥ kind spacing ÷ density (0.417 m measured, 0.416 m required); a second stroke fills the selected layer; another kind makes a new layer; Alt+drag erases (63 → 45) as one undo step, undo restores; a layer erased to nothing is removed; Esc ends the brush; `[` `]` resize; the saved file keeps the points |
| Kits (28 checks) | Rooftop Set on the roof: 6 objects, all attached, unique ids, at y 8.8, selected. Vending Corner refused on the roof, placed on the lot after R R at 90° (its weeds layer turned too). Save as kit of the building + bicycle: 16 objects (with 14 attachments), file v1; survives a reload; placing it re-links all 14 attachments to the new building, no id reused; refused on a roof. Delete with confirm. Damaged kit storage: the broken kits are dropped, the good one loads. |
| Jitter | Five duplicated pots: five headings, scales ×0.97–1.10; a vending machine duplicate unchanged. Four Shift+click pots: four headings, varied sizes. |
| Keyboard path | Enter on Bike Parking adds 3 bicycles; Enter on Grass Tufts adds a 45-piece patch |
| Bad files | Unknown kind and missing params dropped; 5,000 points → 1,500; NaN, short and out-of-range points skipped; seed "x" → 1, 3.7 → 4; points rounded to mm; a scatter `parentId` dropped |
| Inspector | Paint starts the brush on that layer and toggles off; Shuffle changes the seed in one undo step; undo restores it |
| Thumbnails | 34 of 34 items rendered, 208 KB in all (`art/previews/stage6_thumbnails.png`); all 34 load in the library |
| Frame rate, 1920×1080 | Corner starter (21 objects): editor 180 fps (the headless cap), Preview 180. Dense scene (starter + three 400-piece layers + the four built-in kits: 42 objects, 1,510 pieces): editor 180, Preview 180; 63 draw calls, 239k triangles. Stress (10,510 pieces, 1.35M triangles): 180 / 180. While painting a 240-move stroke on the dense scene: 137 fps (180 idle). |
| Visual gate | `art/previews/stage6_corner_starter.png` and `stage6_scatter_closeup.png`: fallen ginkgo leaves drift from the tree onto the sidewalk, weeds line the wall feet, grass fills the lot's back corner; the pieces read as part of the same miniature |
| `npm run lint`, `npm run build` | Pass; no page errors in any run |

**Not measured:** "the hero scene's small-detail density takes about 15
minutes" was not timed with a person. With a kit and a few strokes per
area, the corner reaches the starter's density in a handful of actions.

### Known limitations

* **Scatter lives on the base only.** Pieces never land on roofs or
  balconies, and layers cannot be attached to a building.
* **Erase acts on every visible, unlocked layer of the brush's kind,** not
  only the selected one.
* **Leaf colors are fixed** until Stage 7's `environment.season`.
* **A click on scatter pieces selects their layer,** like any object; Esc
  clears it.
* **The gizmo's scale handle scales a layer's pieces too.**
* **Kits cannot be renamed, edited or exported;** deleting one is not
  undoable, and kits are not part of a scene export.
* **User kits have no thumbnail** (they show the kit icon).
* **Thumbnails are generated files.** Re-run
  `scripts/capture-thumbnails.mjs` after changing an asset.
* **A placed kit cannot be turned afterwards** (a multi-selection only
  moves). Turn it with R before the click; the keyboard path places it
  unturned.
* **`/diorama/thumbnails` ships in the production build,** like the
  `?dev=` flags. It is not linked from the app.
* **The recycling bin's label band is blank** (no atlas cell yet).
