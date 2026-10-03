# Stage 10 — Legacy Cleanup (Implementation Plan)

Follows [Stage-9-Implementation.md](Stage-9-Implementation.md). Stages 1–9
left a small island of geometry in the pre-meter unit (≈ 6 m): the house,
the shop, the tree, the rock and the street strip. This stage removes it.

**Goal:** every asset is a meter-scale Blender GLB or meter-scale app
geometry, every scene stands on the corner base or on a plot, and
`utils/legacyUnits.ts` is gone. Nothing new is offered to the user except
four better-looking assets; old scenes keep loading.

Branch: `stage10-legacy`, cut from `main` (Stage 9 is merged, PR #12).

> The user asked what should come after Stage 9 and proposed a backend. The
> answer given (2026-10-03): the files are small (3.7 MB in `public/`), so
> storage is not the problem, and the scene format should be free of legacy
> before scenes are stored in a cloud, because afterwards every such change
> is a migration of users' data. The user then asked for "the next stage" to
> be carried out; the open questions in §5 were settled with the defaults
> listed there, without a separate approval round.

---

## 1. Decisions

### D1 — The four legacy assets become GLBs; their types stay

`house`, `shop`, `tree` and `rock` stay in `DIORAMA_OBJECT_TYPES`, so saved
scenes and kits load unchanged. Their registry entries turn into model
assets:

| Type | GLB | Size (m) | What it is |
|---|---|---|---|
| `house` | `building_house_01` | 6.37 × 5.46, ridge ≈ 7.3 | Two-storey house (3.5 × 3 ken), gable tile roof, entrance with a small canopy, sliding windows |
| `shop` | `building_shop_01` | 5.46 × 4.6, ≈ 4.0 tall | One-storey neighborhood shop: glass front, lit interior, signboard, awning |
| `tree` | `nature_tree_garden_01` | ≈ 4.5 tall, Ø 3 crown | Evergreen garden tree (stays green in every season: `base` slot) |
| `rock` | `nature_rock_01` | ≈ 1.3 × 0.9 × 0.7 | Garden stone with a smaller one beside it |

* Footprints stay close to the legacy ones (house 6 × 5.4, shop 6.6 × 5.1),
  so old layouts still fit.
* The legacy tree (7.7 m) and rock (3.4 m wide) were oversized; the new ones
  are at real scale. Old scenes show them smaller (the same happened to the
  vending machine in Stage 3).
* Style rules as before: benchmark `prop_vending_machine_01`, no baked AO or
  grime, simple shapes, at most three material slots.
* The buildings stay fixed models. They are not rebuilt on the modular
  building: they are what the modular building cannot make (a pitched roof).

### D2 — `legacyUnits` leaves the registry

`ProceduralAsset.legacyUnits` and the scaled group in `DioramaObject.tsx` are
removed. A procedural asset is always in meters.

### D3 — A street-strip scene is converted to a plot when it is loaded

The validator turns `environment.base: "street"` — and a missing or unknown
base, which always meant the strip — into a plot of 102 × 54 cells
(51 × 27 m) that repeats the strip: 3 m of grass at the back, the gravel lot,
a 3 m sidewalk, the road at the front.

* The strip was 50.4 m wide and its sidewalk began at z = 3.9; on the 0.5 m
  grid that becomes 51 m and z = 4.0 … 7.0. Objects keep their positions.
* The strip's road was 0.24 m below the sidewalk, a plot's is 0.15 m. Objects
  (and scatter pieces) that stood on the strip's road are lifted onto the
  plot's road; anything placed at another height is left alone.
* The file version stays 2: nothing changes meaning, the file is just read
  into the format the app now writes.
* `MAX_CELLS` grows from 64 to 104 so the converted map is valid. The Scene
  panel still offers the same four sizes.

### D4 — The strip is deleted

`"street"` leaves `DIORAMA_BASES`. `StreetBase`, `Road`, `Sidewalk`,
`legacyUnits.ts`, `worldScale.ts`, the strip's template, its starter scene
and the Scene panel's legacy option go. `DEFAULT_ENVIRONMENT.base` becomes
`"corner"` (it only fills fields the validator does not set itself).

---

## 2. Files

* New: `art/blender/assets/buildings/building_house_01.py`,
  `building_shop_01.py`, `nature/nature_tree_garden_01.py`,
  `nature/nature_rock_01.py`; their GLBs and previews.
* New: `utils/streetStrip.ts` (the strip's surface map and the lift).
* Changed: `assetRegistry.ts`, `DioramaObject.tsx`, `diorama.types.ts`,
  `sceneValidator.ts`, `sceneDefaults.ts`, `surfaceMap.ts`,
  `baseTemplates.ts`, `objectDefaults.ts`, `Ground.tsx`, `ScenePanel.tsx`,
  `GroundPanel.tsx`, `scripts/measure-scene.mjs`, thumbnails.
* Deleted: `objects/House.tsx`, `Shop.tsx`, `Tree.tsx`, `Rock.tsx`,
  `objects/parts/AirConditionerUnit.tsx`, `objects/ground/StreetBase.tsx`,
  `Road.tsx`, `Sidewalk.tsx`, `utils/legacyUnits.ts`, `utils/worldScale.ts`.

## 3. Out of scope

* A saved camera and photo settings per scene (the other schema item named
  before a backend): its own stage.
* Glass, lit signs, weather, more figures.
* Any backend work.

## 4. Verification

1. `build.py` for the four assets: triangle budget and draw calls pass.
2. `npm run lint`, `npm run build`.
3. Thumbnails re-rendered for the four assets and looked at.
4. A seeded v2 street-strip scene (the old starter) and a v1 file load as a
   plot with every object on the ground; screenshots before and after.
5. Corner and Back Street starters unchanged (pixel diff).
6. Frame rate of the converted 51 × 27 m plot against the old strip.

## 5. Open questions, settled with these defaults

1. **Keep the old types or add new ones?** Keep (D1).
2. **Convert on load or keep the strip forever?** Convert (D3).
3. **Crop the converted plot to 32 m?** No: objects would hang over the
   edge. `MAX_CELLS` is raised instead.
4. **Which tree?** An evergreen: the library's other two trees are
   deciduous, and old scenes had a green tree.

---

## 6. Results (2026-10-03)

**Status:** implemented and verified on branch `stage10-legacy`. Not
committed; the user commits and merges.

### Assets

| Asset | Triangles / budget | Draw calls | GLB |
|---|---|---|---|
| `building_house_01` | 1,056 / 3,000 | 2 | 74.5 KB |
| `building_shop_01` | 448 / 2,000 | 2 | 33.6 KB |
| `nature_tree_garden_01` | 4,030 / 5,000 | 1 | 329.3 KB |
| `nature_rock_01` | 180 / 400 | 1 | 19.1 KB |

### Deviations from the plan

* The converted plot gets the `earth` platform when the file names none: it
  is the closest to the soil block the strip stood on.
* An object at the strip's road height takes the level of the ground that is
  under it on the plot, not always the road's: the sidewalk's edge moved by
  0.1 m (D3), so something at the very curb now stands on the sidewalk.
* `reseatObjects` was split: `liftObjects` (`utils/surfaceMap.ts`) moves
  objects and scatter pieces by a given lift; the conversion uses it too.

### Verification

* `build.py` for the four assets: exit 0, all within budget (table above).
* `npm run lint` and `npm run build`: clean.
* Thumbnails of `house`, `shop`, `tree`, `rock` re-rendered; 45 of 45
  library items have one.
* **v2 strip scene** (the old starter plus a kei car on the road at
  y = −0.24 and a pedestrian), seeded as an autosave: loads as a 102 × 54
  plot on the earth platform, every position unchanged except the car, now
  at y = −0.15. Captured before and after at all four presets, editor and
  Preview; no page errors. Saved again as `base: "plot"`, version 2.
* **v1 file** (no version, legacy units, no environment): positions × 6,
  then the same conversion; a rock at the v1 road height lands on the road.
* **Hero starter:** editor screenshots differ from `main` only inside the
  library's House and Small Shop thumbnails (4,601 pixels, x 56–240,
  y 477–546); Preview front, side and top are pixel-identical. Preview
  isometric differed, by a different amount in each of two runs (the first
  Preview shot is framed late, HANDOFF §5), so it proves nothing either way.
* **Frame rate** of the converted strip scene, 1920 × 1080 headless: 179.9
  fps in Preview, at the 180 cap.

### Known limitations

* **Old scenes look different:** the tree is 4.5 m (was 7.7 m), the stone
  1.3 m (was 3.4 m at its default scale); house and shop keep their
  footprints within 0.6 m. The strip's dashed center line and its tapered
  soil block are gone; the road is 0.09 m higher.
* **A converted plot is 51 × 27 m,** larger than any size the Scene panel
  offers: no size is highlighted, and picking one crops the plot.
* **Shadows on a converted plot are softer** than on the strip: the shadow
  frustum grows with the plot (44.6 m against 32 m).
* **Not checked in the user's own browser** with their own autosave.
* The shop's signboard carries blocks, not lettering: a print needs a new
  atlas cell.
