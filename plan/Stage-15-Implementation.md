# Stage 15 — Residential Street (Implementation Plan)

Follows [Stage-14-Implementation.md](Stage-14-Implementation.md). The library
can build a shopping corner, but not the street behind it: there is one
house, no apartment, no traditional house, and a boundary wall is a row of
separate 2 m pieces that cannot be moved or lengthened as one.

**Goal:** the ordinary residential lane of a Japanese town (住宅街): two new
buildings, two small residential props, walls and fences that are one object
of any length, and a starter scene that puts them together.

Branch: `stage15-residential`, cut from `main` (Stage 14 is merged, PR #17).

> The user asked what comes after Stage 14 (2026-10-06). Option A, "residential
> street", was recommended and chosen. The plan was approved the same day
> with every open question settled by its default ("theo mặc định"); §5
> lists them.

---

## 1. Decisions

### D1 — Two buildings, both fixed models

| Type | GLB | Size (m) | What it is |
|---|---|---|---|
| `apartment` | `building_apartment_01` | ≈ 9.1 × 6.5, ≈ 6.6 tall | 木造アパート: two floors of three narrow units (2.73 m each). The street side has the open corridor (外廊下) with a steel railing, a door, a meter box and a washing machine per unit, and a straight steel stair on the right end. The back has a sliding window and a small balcony per unit. Low gable roof in metal sheet. A name board (fictional "ハイツ" name) on the stair side and a row of mailboxes at the stair foot. |
| `traditionalHouse` | `building_house_traditional_01` | ≈ 9.1 × 7.3, ≈ 5.5 tall | One-storey 和風住宅 (not a temple, not a 古民家 museum piece): dark tile 入母屋 roof, dark board siding (焼杉) under white plaster, a lattice sliding entrance door (格子戸) under a small tile canopy, an engawa with glass sliding doors on the garden side. |

* Style rules as before: benchmark `prop_vending_machine_01`, no baked AO or
  grime, simple shapes, at most four material slots.
* Front (street side) faces −Y in Blender, like `building_house_01`.
* **Fixed, not building presets:** an outside corridor with a stair and an
  入母屋 roof are not something the modular building makes, and teaching it
  would be a bigger stage than this one. Like `house` and `konbini`, nothing
  attaches to them (Stage 5 D4: only a `building` is a parent).
* **Windows are emissive, not `glass`** (Stage 12: glass is for panes with a
  room behind them). The engawa's glass doors are the exception if a simple
  room (floor, a back wall, a shoji line) fits in the budget; otherwise they
  stay emissive too.
* Both get a `glow` after dark (warm, low, like a lit room), so a night scene
  of houses is not dark. The pool stays at eight lights.

### D2 — Two residential props

| Type | GLB | Size (m) | What it is |
|---|---|---|---|
| `gatePost` | `street_gate_post_01` | 0.45 × 0.35, 1.3 tall | 門柱: a plastered post with a name plate (表札), an intercom and a mail slot. It stands at the end of a block wall. |
| `propaneTanks` | `prop_propane_tanks_01` | 0.9 × 0.4, 1.35 tall | プロパンガス: two blue-gray 50 kg cylinders chained to a small bracket, with a regulator and a pipe. Stands against a house wall. |

* The name plate is a new atlas cell (a fictional family name). The apartment
  name board is a second one. Both go in the free space right of `plate_kei`
  (HANDOFF §3, Stage 12).
* Palette: reuse what exists; add only the colors that are missing (the
  cylinders' blue-gray, the dark 焼杉 board).

### D3 — Walls and fences are one object by length

Today a drag while placing a tiling asset (`tile` in the registry) lays a row
of separate objects (Stage 9). For the four tiling GLBs — `blockWall`,
`fence`, `guardRail`, `hedge` — the drag makes **one object** instead:

* **Params:** `{ pieces: number }` (an integer, 1 … 40), a third member of the
  `ObjectParams` union, read through `runParamsOf` in `utils/objectParams.ts`.
  Additive: an object without params is one piece, exactly what it is today,
  so files stay v2 and every saved scene looks the same.
* **Origin in the middle of the run,** the pieces laid along its X axis
  (`(i − (n − 1) / 2) × tile`). A single piece is therefore the same object as
  today, and a turn, a group turn, a duplicate and the selection ring work
  on the whole wall.
* **Rendered as N clones of the same GLB** in `GltfAsset` (one shared
  template, as now). No new geometry is generated.
* **The inspector gets a "Length" stepper** (in pieces, shown in meters) for
  these types. Lengthening grows the run from its left end, so the left end
  stays put; it is one undo step.
* **The footprint radius follows the length** (`getFootprintRadius`).
* Road markings (`roadLine`, `parkingBay`) keep laying separate pieces: each
  one lines up with the road where it lands (Stage 9).
* Runs already in saved scenes stay separate pieces. Nothing merges them.

### D4 — A starter: "Residential Lane"

A third built-in starter, a 24 × 16 m plot built in code like Back Street
(`utils/plotStarter.ts` pattern, its own file if it would push that one past
the size guideline):

* A narrow lane (4 m asphalt, no sidewalk, white edge lines — the 生活道路 of
  a residential block) along the front, a side alley.
* The apartment, the traditional house and the existing two-storey house,
  each behind a block wall or a hedge (D3 runs), with gate posts, propane
  tanks, potted plants, an AC unit, laundry.
* Utility poles with power lines, a curve mirror at the alley, a garbage cage
  at the corner, a kei car in a driveway, bicycles, a schoolchild and a
  pedestrian, weeds and grass scatter.
* **Morning, summer, clear** (§5 question 4). The other starters are not
  changed.

### D5 — One built-in kit

`front-gate`: a block wall run on each side of a gap, two gate posts, a
potted plant. It shows D3 and D2 in use.

---

## 2. Files

* New: four scripts under `art/blender/assets/` (buildings, street, props),
  their GLBs and previews; the starter's builder.
* Changed:
  * `diorama.types.ts` (four types, `RunParams` in the union),
    `assetRegistry.ts` (four entries, footprint of runs),
    `utils/objectParams.ts` (`runParamsOf`), `sceneValidator.ts`
    (normalize `pieces`).
  * `PlacementLayer.tsx` and `placeRun` in the store (one object for the
    four types), `GltfAsset.tsx` / `DioramaObject.tsx` (render N pieces),
    the inspector (`PropertiesPanel.tsx`: Length stepper) and a store action
    to set it.
  * `palette.ts`, `atlasLayout.json`, `graphicsAtlas.ts` (two cells),
    `builtInKits.ts` (one kit), `sceneTemplates.ts` (one starter),
    thumbnails, the starter's preview image.
* Docs: this file, `HANDOFF.md`, `Hero-Diorama-Roadmap.md`.

## 3. Out of scope

* Rooms behind the apartment's windows; interiors in general.
* Teaching the modular building outside corridors, stairs or 入母屋 roofs.
* Corners, curves or gates inside a run; a run that follows a change of
  ground level (it sits at its origin's level, like any object).
* Merging existing separate-piece runs into one object.
* Figures in new poses; drivers; editable sign text.
* Any backend work.

## 4. Verification

1. `build.py` for the four assets: triangle budget and draw calls pass; each
   Blender preview looked at.
2. `npm run lint`, `npm run build`.
3. **Scale:** a corner scene with both buildings beside `house`, `konbini`,
   the kei car and the pedestrian: door heights, floor heights and the
   stair read consistently. Screenshots by day and at night (glow).
4. **Runs (D3), scripted in the browser:** a drag lays one object with the
   right `pieces`; the stepper lengthens it from the left end; undo / redo;
   duplicate; a group turn with a run in it; save, reload, export, import;
   a kit holding a run.
5. **Old scenes unchanged:** the hero and Back Street starters (which use
   separate-piece runs) pixel-identical to `main` in Preview, except where a
   library thumbnail changed.
6. The new starter: preview image captured; opened from the New dialog; no
   page errors.
7. Frame rate of the new starter at 1920 × 1080, and of 100 copies of the
   heaviest new asset (`measure-scene.mjs`).

## 5. Open questions, settled with the defaults

1. **Apartment size:** three units per floor (≈ 9.1 m wide), not two.
2. **Traditional house:** one storey (平屋).
3. **Parametric runs (D3) in this stage:** yes.
4. **Starter light:** morning, summer, clear.
5. **The old Stage 5 stash:** dropped (2026-10-06).

---

## 6. Results (2026-10-06)

**Status:** implemented and verified on branch `stage15-residential`. Not
committed; the user commits and merges.

### Assets

| Asset | Triangles / budget | Draw calls | GLB |
|---|---|---|---|
| `building_apartment_01` | 3,324 / 7,000 | 3 | 282.8 KB |
| `building_house_traditional_01` | 5,312 / 6,000 | 2 | 366.1 KB |
| `street_gate_post_01` | 204 / 800 | 2 | 20.3 KB |
| `prop_propane_tanks_01` | 744 / 2,000 | 1 | 42.5 KB |

`public/` is 6.3 MB (5.1 MB after Stage 11).

### What was built

* **Types:** `apartment`, `traditionalHouse`, `gatePost`, `propaneTanks`
  (registry entries, icons, tags; both buildings have a `glow`: the
  apartment's corridor lamps, the shoji behind the engawa).
* **Two atlas cells** right of `plate_kei`: `name_plate` (表札, 中村) at
  [760, 8, 64, 128] and `apartment_board` (ハイツ若葉) at [840, 8, 176, 64].
  Neither is lit.
* **Palette:** `roofMetal`, `steelPaint`, `doorSteel`, `charredBoard`,
  `woodLight`, `shojiPaper`, `propaneBlue`.
* **`MeshBuilder.solid`** (`art/blender/lib/builder.py`): a closed
  polyhedron from corners and faces, for the hipped part of the 入母屋 roof.
* **Runs (D3):** `RUN_TYPES` and `RunParams` in `diorama.types.ts`;
  `utils/runParams.ts` (`MAX_RUN_PIECES` = 40, `normalizeRunParams`,
  `runPieceOffsets`, `resizedRunPosition`); `runParamsOf` / `runPiecesOf` in
  `utils/objectParams.ts`; the validator keeps valid lengths (rounded,
  clamped to 1 … 40) and drops broken ones. `placeRun` makes one object of
  a dragged row of these four types; `setRunPieces` changes the length, one
  undo step. `AssetVisual` draws a run as one clone of the GLB per piece.
  The selection ring (and the placement ghost's) is stretched to the run
  (`SelectionRing` `length`, `getRunSpan`).
* **Inspector:** `RunPanel.tsx` (Length in meters, a Pieces stepper). The
  stepper moved out of `BuildingPanel.tsx` into `Stepper.tsx`.
* **Starter:** `utils/residentialStarter.ts` ("Residential Lane"); the
  ground painter of Back Street became `surfaceFrom(width, depth, rects)` in
  `utils/plotStarter.ts`, and its `patch` is exported. `runObject` in
  `utils/objectDefaults.ts` builds one run from two points.
* **Kit:** `front-gate`.

### Deviations from the plan

* **The starter has two buildings, not three.** The existing two-storey
  house did not fit beside the traditional house (11 m with its eaves) and
  the apartment on a 24 × 16 plot with a lane and an alley; 24 × 16 is the
  largest size the Scene panel offers.
* **The apartment's corridor faces the lane** and its stair is on the right,
  so both face the isometric camera. With the corridor toward the alley (as
  first tried) the default view saw only the back balconies. The kei car is
  parked behind the apartment, reached from the alley over a curb ramp.
* **No glass on the engawa:** the doors are frames in front of lit shoji;
  the panes would add a draw call and show nothing.

### Verification

* `build.py` for the four assets: exit 0, all within budget (table above).
  Each Blender preview was looked at.
* `npm run lint`, `npx tsc --noEmit` and `npm run build`: clean.
* Thumbnails rendered for the four assets and the kit; 63 of 63 library
  items have one. The starter's preview image rendered
  (`public/templates/residential-lane.webp`).
* **Scripted in headless Chrome, 14 of 14 checks passed, no page errors:**
  the starter opens as a 24 × 16 plot at morning / summer / clear; a real
  pointer drag while placing a block wall lays one 3-piece object and
  selects it; lengthening by 2 keeps the left end (to the millimeter); the
  inspector's stepper shortens it and shows the length in meters; undo and
  redo of a length; a duplicate keeps the length; a group turn turns two
  runs; a click places one piece without params; save and reload keep the
  runs; an import clamps `pieces: 99` to 40 and rounds 2.6 to 3, drops a
  non-number and ignores `pieces` on a bench; the Front Gate kit places two
  2-piece walls.
* **Looked at:** the starter by morning, at golden hour and at night (the
  shoji and the corridor lamps glow); close-ups of the apartment (corridor,
  stair, mailboxes, the readable name board), the house front and the gate
  (the name plate reads 中村); a front-view line-up of the house, the
  apartment, the traditional house and the konbini with a kei car, a
  pedestrian and a schoolchild: doors, floors and eaves agree in scale.
* **Existing starters against `main`** (both seeded from the same scene
  file, `git stash` for the baseline): Back Street identical in the editor
  (≤ 3 pixels) and in Preview front, side and top; the hero identical
  except the library panel (the two new building thumbnails, x 42–277,
  y 221–646) and Preview side (8 pixels). Preview isometric differs in both,
  framed mid-transition as in Stages 10 and 11 (HANDOFF §5); the images
  show the same scene. Back Street's preview image re-rendered with 23
  pixels different (one 8 × 8 block) and was restored from `main`.
* **Frame rate,** 1920 × 1080 headless: the Residential Lane starter
  (51 objects, 75,778 triangles, 94 draw calls) 180.1 fps in the editor and
  172.3 in Preview; 100 traditional houses (546,226 triangles, 204 draw
  calls) 179.8 and 180.1, at the cap.

### Known limitations

* **A run is straight and sits at one level:** no corners, no gates inside
  it, and on a plot it stays at its origin's level across a curb.
* **A long run costs a draw call per piece,** as separate pieces did; runs
  are not instanced.
* **Runs already in saved scenes stay separate pieces,** and so do the hero
  and Back Street starters' walls. Road markings still lay separate pieces.
* **The selection ring of a run is a stadium as wide as one piece's ring,**
  so a thin wall gets a broad band.
* **Nothing attaches to the new buildings** (fixed models, Stage 5 D4); the
  apartment's units have no rooms behind their windows.
* **The name plate and the name board are fixed texts** and are not lit.
* **The kei car in the starter is behind the apartment,** out of the
  default view.
* **Not tried in the user's own browser.**
