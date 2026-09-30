# Phase 3 — Implementation Plan (Execution Order)

Part of [Phase-3-Overview.md](Phase-3-Overview.md).

The 3a / 3b / 3c docs describe **what** Phase 3 is. This file describes **how
to execute it**: milestones in order, the exact files each one touches,
and how to verify each before moving on. Where this plan disagrees with
3a–3c, this plan wins — the reasons are in §1.

---

## 0. Starting Point (verified in the repo)

* Phase 1/2 editor is complete: select, multi-select, transform, snap,
  undo/redo, lock/hide, autosave (`STORAGE_KEY = "diorama-scene"`),
  import/export (`SCENE_FILE_VERSION = 1`), camera presets.
* Object types: `tree | house | rock`, all procedural, all colors from
  `palette.ts`.
* Ground: octagonal island, `ISLAND_RADIUS = 4.2`, also used by
  `DioramaCanvas.tsx` (grid size/fade) and `nextSpawnPosition()`.
* Current object sizes: House ≈ 1.0 wide × 1.1 tall, door 0.32 tall;
  Tree ≈ 1.9 tall. Grid options `0.25 / 0.5 / 1`.
* `lucide-react@1.23.0` has `Store`, `UtilityPole`, `Cable`, `CupSoda`,
  `Signpost`, `House`, `TreePine` (checked in `node_modules`).
* No test runner. Checks available: `npm run lint`, `npm run build`,
  manual browser check at `/diorama`.

---

## 1. Decisions & Corrections to 3a–3c

### D1 — World scale (correction to 3b §4 `UtilityPole`)

3b says the pole is "8–12m… much taller than House/Tree (~1–1.7 units)".
That would make the pole about 8× taller than the house. In the
current world the door is 0.32 units, so **1 unit ≈ 6 m**, not 1 m.

**Decision:** keep the current unit for Phase 3 and write the scale down
once as a constant, so nobody has to guess (CLAUDE.md §18):

```ts
// features/diorama/utils/worldScale.ts
/** Stylized miniature scale: 1 world unit ≈ 6 m. All entities size from this table. */
export const METERS_PER_UNIT = 6;
```

| Entity | Real | Units (stylized) |
|---|---|---|
| Door | 2 m | 0.32 (existing) |
| House | 6–8 m wide | 1.0 (existing) |
| Small shop | 6–7 m wide, 1 storey | 1.1 w × 0.7 h |
| Utility pole | 10 m | **1.9–2.1** |
| Vending machine | 1.8 m | 0.34 (can push to 0.4 for readability) |
| Sign (post + board) | 2.5 m | 0.45 |
| Road (2 lanes) | 6 m | 1.1 deep |
| Sidewalk | 2 m | 0.4 deep |
| Tree | 5–8 m | ~1.2 → set Tree default scale to 0.7 |

Rescaling everything to 1 unit = 1 m is **not** part of this phase. It
would change every existing geometry, the camera zoom, shadow frustum, grid
options and saved scenes. Do it when the `.glb` pipeline arrives, if ever;
`METERS_PER_UNIT` is the conversion factor for that.

> ⚠ Confirm D1 before starting M3. If you'd rather switch to 1 unit = 1 m
> now, M0 gains a "rescale existing world" step. Everything else in this
> plan stays the same.

### D2 — Add a small asset registry (3b §3 lists 6 files to edit by hand)

Adding a type today means editing six files by hand, and forgetting
`VALID_TYPES` silently drops objects on import. Phase 3 in CLAUDE.md
already calls for an *asset registry* (§14, §35). Build a minimal one
**before** adding new types, so each new entity is one registry entry plus
one component.

### D3 — Power line spans a fixed length from the pole's crossarm

This keeps 3b's approach: the power line is a decorative, placeable object
with no pole-to-pole snapping. Tighten it: `PowerLine` uses the
same `CROSSARM_HEIGHT` constant as `UtilityPole`. It spans a fixed length
along local +X. Placing it at a pole's position therefore lines it up
with the pole with no manual Y adjustment.

### D4 — Selection ring size per type

`SelectionRing` is fixed at radius 0.78–0.9. That ring is far too big
for a vending machine or a pole and too small for a shop. Add
`footprintRadius` to the registry and pass it to the ring.

### D5 — Scope trims (from CLAUDE.md Phase 3 list)

* **Keep:** registry, categories, simple text search over label and tags
  (cheap, 9 items).
* **Defer:** thumbnails (icons are enough for now), recently used,
  favorites, `.glb` loading (3a recommendation stands).

---

## 2. Milestones

Each milestone ends with `npm run lint && npm run build` passing and a
browser check at `/diorama`. Do not start the next milestone on a red
build.

### M0 — Baseline check
* Run `npm run lint`, `npm run build`, open `/diorama`. Note any
  pre-existing errors so they aren't mistaken for Phase 3 regressions.

### M1 — Asset registry (no visual change)
Files:
* `types/diorama.types.ts`: define
  `export const DIORAMA_OBJECT_TYPES = ["tree", "house", "rock"] as const;`
  and derive `DioramaObjectType` from it.
* **new** `assets/assetRegistry.ts`, typed as
  `Record<DioramaObjectType, AssetDefinition>`:
  `{ label, category, icon, component, defaultScale, footprintRadius, tags }`.
  `category` uses the §15 names: `Buildings | Street | Infrastructure | Props | Nature | Vehicles`.
* `utils/objectLibrary.ts` → derive categories from the registry (or
  delete it and derive in `ObjectLibrary.tsx`; pick one, don't keep both).
* `components/DioramaObject.tsx`: drop `OBJECT_VISUALS` and use the registry.
* `components/ObjectLibrary.tsx`: drop `ICONS` and use the registry.
* `utils/objectDefaults.ts`: drop `DEFAULT_SCALE` and use the registry.
* `utils/sceneValidator.ts`: `VALID_TYPES = new Set(DIORAMA_OBJECT_TYPES)`.
* `components/SelectionRing.tsx`: accept a `radius` prop (D4).

Verify: the editor looks and behaves exactly as before. Export a scene,
re-import it, and all objects survive.

### M2 — Palette + world scale constants
* `utils/palette.ts`: add the 3b §2 keys (wallPlaster, roofTile, woodTrim,
  shopAwning, asphalt, asphaltLine, sidewalkConcrete, curb, poleConcrete,
  wireGray, vendingBody, vendingPanel, signBoard, signText, plus
  `lotGravel` for the building lot).
* **new** `utils/worldScale.ts` (D1): `METERS_PER_UNIT`, `CROSSARM_HEIGHT`
  and the plot dimensions from M3.

### M3 — Ground rework: island → street-corner plot
The biggest visual change. Do it before any new entity.

```text
 z−  ┌───────────── 8.4 ─────────────┐
     │ grass strip (0.5)              │  trees / rocks
     │ building lot (2.2)             │  house, shop
     │ sidewalk (0.4, +0.04 raised)   │  pole, vending, sign
     │ curb lip                       │
     │ road (1.1) + centre line       │
 z+  └────────────────────────────────┘
       tapered base underneath (keep)
```

* `components/Ground.tsx`: stack the strips as flat boxes on a tapered
  rectangular base. Box geometry scaled on the bottom face works; a
  4-segment cylinder rotated 45° with different top/bottom radii also
  works. Objects keep resting at `y = 0` on the lot. The sidewalk top
  sits slightly higher.
* **new** `objects/ground/Road.tsx`, `objects/ground/Sidewalk.tsx` (static,
  not scene objects, per 3b §5).
* Replace `ISLAND_RADIUS` everywhere with `PLOT_WIDTH` / `PLOT_DEPTH`:
  * `nextSpawnPosition()`: keep the golden-angle spiral, but clamp to the
    lot + sidewalk rectangle instead of a radius.
  * `DioramaCanvas.tsx` `<Grid>`: args and fade based on the plot size.
* `utils/sceneDefaults.ts`: `ground: "street-corner"`.
* `SceneLighting.tsx`: make sure the shadow frustum (±6) still covers the
  plot and the pole shadow.
* Camera: check that all 4 presets in `cameraPresets.ts` frame the whole
  plot. Adjust `zoom` only if needed.

Verify: old autosaved scenes still load. Their objects may sit off the
lot; that's acceptable, so note it and don't migrate. New/Reset gives a
sensible (still old) layout on the new plot.

### M4 — New entities, one at a time
For each entity: add it to `DIORAMA_OBJECT_TYPES`, add a registry entry,
create `objects/<Name>.tsx` following the 3b §1 rules (origin at the
ground, palette-only colors, shadows on), then add it from the library,
transform it, check it in the browser, and only then do the next one.

Order (simplest silhouette first):
1. `UtilityPole`: `UtilityPole` icon, Infrastructure, height ≈ 2.0, crossarm at `CROSSARM_HEIGHT`, footprint ≈ 0.25
2. `Sign`: `Signpost` icon, Props, ≈ 0.45 tall
3. `VendingMachine`: `CupSoda` icon, Props, ≈ 0.36 tall, emissive button grid
4. `Shop`: `Store` icon, Buildings, 1.1 × 0.7, shed roof, glass front, awning
5. `PowerLine`: `Cable` icon, Infrastructure, 3 sagging wires from `CROSSARM_HEIGHT` spanning ~4 units along +X (D3)

Per-entity check: at the default camera, does it read at a glance? Is it
the right size next to the house (D1 table)? Do its shadows match the
other objects?

### M5 — Restyle existing entities toward Japanese everyday
* `House.tsx`: pyramid cone → gabled or hipped dark `roofTile` roof with
  slight eaves, `wallPlaster` walls, `woodTrim` band. Keep the glowing
  windows.
* `Tree.tsx`: rounder, less "fir" canopy (street / garden tree). Set the
  default scale to about 0.7 (D1).
* `Rock.tsx`: palette tweak only. Consider moving it to a garden-stone
  role; don't remove the type (saved scenes use it).
* Update the registry icons if they change (`Home` → `House` is optional).

### M6 — Default scene + lighting pass
* `getDefaultScene()`: use the 3c §3 layout on the new plot. House
  back-left, shop back-right, pole on the sidewalk between them, power line
  at the pole, vending machine beside the shop facing the road, sign at
  the road edge, 1–2 trees on the grass strip.
* `SceneLighting.tsx`: nudge warmer and lower the sun angle a little
  (tuning only, no new light types, no post-processing; 3c §4).
* Canvas background gradient and fog: re-tint only if the green reads
  wrong against asphalt.

### M7 — Asset browser search (small)
* `ObjectLibrary.tsx`: add a search input that filters by `label` and
  `tags` from the registry. Also add an empty-results message and an
  `aria-label`.
* No thumbnails, no favorites (D5).

### M8 — Acceptance pass
Run the full checklist in [Phase-3c §7](Phase-3c-Diorama-Assembly.md),
plus:
* [ ] Round-trip: a scene with one of every type → export → New →
      import survives unchanged.
* [ ] A file containing an unknown type imports with that object
      skipped, without crashing.
* [ ] Old v1 autosave from before Phase 3 loads without errors.
* [ ] Selection ring size fits each type.
* [ ] Undo/redo, duplicate, multi-select, lock/hide and camera presets
      still work with the new types.
* [ ] CLAUDE.md §49 visual gate: screenshot the default scene from the
      isometric and front presets and judge scale, materials, lighting and
      Japanese identity.

---

## 3. Files Touched (summary)

| Change | Files |
|---|---|
| New | `assets/assetRegistry.ts`, `utils/worldScale.ts`, `objects/{UtilityPole,Sign,VendingMachine,Shop,PowerLine}.tsx`, `objects/ground/{Road,Sidewalk}.tsx` |
| Modified | `types/diorama.types.ts`, `utils/{palette,objectDefaults,objectLibrary,sceneValidator,sceneDefaults}.ts`, `components/{Ground,DioramaCanvas,DioramaObject,ObjectLibrary,SelectionRing,SceneLighting}.tsx`, `objects/{House,Tree,Rock}.tsx`, possibly `utils/cameraPresets.ts` |
| Untouched | store, history, autosave, serializer (no schema change, so `SCENE_FILE_VERSION` stays 1) |

All paths are relative to `features/diorama/`.

---

## 4. Risks

* **Scale drift:** each entity gets sized "by eye". Mitigation: the D1
  table, and every new entity is checked next to the house before merging.
* **Plot too crowded:** 8.4 × ~4.7 units holding house + shop + props
  may feel cramped. Mitigation: settle plot dimensions in M3 with
  placeholder boxes before building the entities.
* **Grid 0.5 = 3 m is coarse for props.** The 0.25 option already exists.
  Don't change defaults in this phase; note it for Phase 4 tuning.
* **Legacy scenes off-plot:** accepted and not migrated. Reset gives the
  new layout.

---

## 5. Status — Implemented 2026-09-30

M0–M8 are done: lint, typecheck and build pass, and the result was
checked in headless Chrome. Where the implementation differs from the
plan above:

* **Tree size** is set in the geometry (about 1.3 units tall at scale 1),
  not with a 0.7 default scale, so scale 1 stays the canonical size.
* **Stop sign** is in the `Street` category (CLAUDE.md §15 lists Road Sign
  under Street), not in Props. The rock is labelled "Garden Stone"; its
  type is still `rock`.
* **`randomSpawnRotation`** was added to the registry. Only nature assets
  spawn at a random heading; built things spawn facing the road, so a new
  pole and power line line up.
* **Camera presets:** Top now offsets only along Z so the road is
  horizontal on screen. Front and Side zoom were raised from 62 to 88 and
  Top from 78 to 100 to frame the rectangular plot.
* **Grid** fades from the plot center (`fadeFrom={0}`) instead of from the
  camera, so it covers the whole plot in every preset.
* **Power line** runs ±4.2 from its pole. With the default pole at x = 0,
  the wires end exactly at the plot edges.
