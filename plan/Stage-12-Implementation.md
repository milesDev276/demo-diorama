# Stage 12 — Glass and Lit Signs (Implementation Plan)

Follows [Stage-11-Implementation.md](Stage-11-Implementation.md). Two things
still break the miniature illusion: windows that should be glass are opaque
yellow or grey faces, and printed signs go dark after sunset while everything
around them glows.

**Goal:** a glass material with something to see behind it, prints that light
up after dark, and real lettering on the two shop signs. No new editor
features, no change to the scene format.

Branch: `stage12-glass`, cut from `main` (Stage 11 is merged, PR #14).

> The user accepted this scope on 2026-10-04 and then asked for the stage to
> be carried out, handing over every decision ("you have all my authority").
> The open questions in §5 are settled with the defaults listed there.

---

## 1. Decisions

### D1 — A fifth material slot, `glass`

* Blender slot name `glass`, appended to `MATERIAL_SLOTS` (the indices of the
  four existing slots do not change, so no other GLB is affected).
* In the app (`objects/materials.ts`): a vertex-colored standard material,
  transparent, glossy, no depth write. The vertex color is the tint (a pale
  pane for shops, the dark `carGlass` for vehicles); the opacity is one
  number for the whole scene.
* **Glass casts no shadow** (it would put every interior in the shade) but
  receives them. It is drawn after the other transparent things
  (`renderOrder`), so road lettering seen through a windscreen is tinted.
* Sorting inside one mesh is not needed: panes are thin boxes, back faces
  are culled, and at one low opacity the order of two panes does not show.

### D2 — The draw-call limit goes from three to four

`MAX_DRAW_CALLS = 4` in `build.py`. Roadmap L4/L8 said three because there
were three slots; a shop needs `base`, `emissive` (its interior), `glass`
and `printed` (its sign). Measured cost is in §6.

### D3 — Glass only where something stands behind it

| Asset | Change |
|---|---|
| `building_shop_01` | glass front, a shallow lit room with stocked shelves |
| `building_konbini_01` | glass front and door, a room with fridges, gondolas and a counter |
| `building_bay_shopfront_01` | panes in the door leaves and the transom (the room is already there) |
| `vehicle_kei_car_01` | hollow cabin: pillars, roof, seats, dashboard, steering wheel |
| `vehicle_kei_truck_01` | the same for the cab |

Windows of houses and upper floors stay frosted and emissive: there is no
room behind them, and a lit frosted pane is what such a window looks like
from the street. The vending machine is not rebuilt (it is one of the four
AO-baked assets).

### D4 — Interiors are shadow boxes

A room is as deep as it needs to be to read from the street: 0.9 m for the
small shop, 2.2 m for the konbini. Back walls, shelves and goods are in the
`emissive` slot, as in the modular shopfront, so the room is lit at night.
The shelf-stocking code of the shopfront bay moves to `lib/interior.py` and
is shared (same random sequence, so the bay's goods do not change).

### D5 — Lit prints: a second atlas, by cell

* `graphicsAtlas.ts` paints a second canvas, the *lit atlas*: each cell that
  is backlit is copied there at its strength, everything else is black. It
  is the `printed` material's `emissiveMap`.
* Which cells are lit is a table beside the painters (`LIT_CELLS`): the
  vending ad, the kanban sign, both shop signs, the bus stop's head and
  board. Plates, the post box and the stop sign are not lit.
* **No GLB is rebuilt for this:** the UVs are the same.
* How strongly lit prints glow is a new number of the time of day,
  `signs` in `utils/timeOfDay.ts` (0 in the morning and by day), pushed into
  the material by `EnvironmentDriver` like the emissive level.

### D6 — Lettering for two fictional shops

Two atlas cells, 528 × 84 px, in the free space under `plate_kei`:

* `shop_sign` — まるや商店, with たばこ and 日用品 beside it, on the small
  shop's signboard (now 3.3 m wide, the cell's shape).
* `konbini_sign` — コトリマート, a plate on the konbini's lit band, replacing
  the green tile and the five blocks.

### D7 — Starters keep their data

No starter scene is edited. The hero corner changes in look only where it
should: its modular shopfront gets panes, and after dark its kanban sign and
vending ad are lit.

---

## 2. Files

* Blender: `lib/materials.py` (slot), `lib/interior.py` (new),
  `build.py` (limit), the five asset scripts of D3, their GLBs and previews.
* App: `objects/materials.ts`, `objects/GltfAsset.tsx`,
  `objects/building/buildingGeometry.ts`, `objects/building/Building.tsx`,
  `objects/textures/atlasLayout.json`, `objects/textures/graphicsAtlas.ts`,
  `utils/timeOfDay.ts`, `utils/palette.ts`,
  `components/EnvironmentDriver.tsx`, thumbnails.
* Docs: this file, `HANDOFF.md`, `Hero-Diorama-Roadmap.md`.

## 3. Out of scope

* Refraction, real reflections of the scene, wet or dirty glass.
* Glass for houses, upper floors, the vending machine, the curve mirror.
* Drivers and passengers; opening doors.
* Per-sign text chosen by the user; a sign editor.
* Shadows from glow lights, more than eight glow lights.

## 4. Verification

1. `build.py` for the five assets: triangle budgets and draw calls pass;
   previews looked at.
2. `npm run lint`, `npm run build`.
3. Thumbnails re-rendered for the changed assets and presets.
4. A seeded corner scene with the five assets and the lit-print assets:
   close-ups by day and at night, no page errors.
5. Both starters against `main`, by day and at night: the differences are
   the ones D7 names and nothing else.
6. Frame rate of a scene with 100 glass assets, against `main`.

## 5. Open questions, settled with these defaults

1. **A fifth slot against the three-draw-call limit?** Yes, and the limit
   becomes four (D1, D2).
2. **What stands behind the glass of the fixed shop and the konbini?** A
   shadow-box room (D4).
3. **Sorting of transparent faces?** None inside a mesh; glass after other
   transparent objects (D1).
4. **Which GLBs are rebuilt?** The five of D3; lit prints need none (D5).
5. **Are lit signs on at golden hour?** Faintly: it is the hero's default
   light, and a backlit sign that is off at dusk looks broken.

---

## 6. Results (2026-10-04)

**Status:** implemented and verified on branch `stage12-glass`. Not
committed; the user commits and merges.

### Assets

| Asset | Triangles / budget | Draw calls | GLB |
|---|---|---|---|
| `building_shop_01` | 2,124 / 4,500 (was 2,000) | 4 | 163.6 KB |
| `building_konbini_01` | 3,368 / 5,000 (was 2,500) | 4 | 288.6 KB |
| `building_bay_shopfront_01` | 1,992 / 3,000 | 3 | 106.6 KB |
| `vehicle_kei_car_01` | 2,928 / 10,000 | 3 | 236.5 KB |
| `vehicle_kei_truck_01` | 2,400 / 8,000 | 3 | 193.9 KB |

`public/` is 5.6 MB (was 5.1).

### Deviations from the plan

* **Glass opacity is 0.3 and the material is a plain standard material:**
  no shader patch for stronger reflections. At this scale the tint and the
  room behind it carry the effect; by day a shop pane is subtle.
* **The small shop's signboard is 3.3 m wide** (was 4.96 m), the shape of
  its atlas cell; the konbini's plate is 2.77 × 0.44 m, centered over the
  door.
* **Two palette colors were added:** `glassPane`, `carSeat`.
* **`signs` by time of day:** 0 (morning, day), 0.3 (golden hour), 0.85
  (evening), 1 (night). **Cell strengths:** vending ad, kanban and konbini
  plate 1; shop sign 0.7; bus stop 0.6.
* The konbini's kick panel no longer runs under its door (the door's glass
  reaches the floor), and its three gondolas stand right of the door.

### Verification

* `build.py` for the five assets: exit 0, all within budget (table above).
  The Blender previews were looked at (prints are blank there, as always).
* `npm run lint` and `npm run build`: clean.
* Thumbnails re-rendered for the small shop, the konbini, the kei car, the
  kei truck, the Shop-house 3F preset and the Shop Entrance kit; both
  starter previews re-captured. 58 of 58 library items have a thumbnail.
* **A plot with the konbini, the small shop, both vehicles, a vending
  machine, a bus stop, a kanban sign and a figure,** seven close-ups by day
  and at night, no page errors: rooms and seats show through the glass, the
  interiors are not in the glass's shadow, both signs read (まるや商店,
  コトリマート), and at night the vending ad, the kanban sign, the bus stop
  and both shop signs are lit while the car's plate is not.
* **Both starters against `main`,** editor Isometric and Front at day,
  golden hour and night (twelve pairs, pixels differing by more than 2):
  every difference lies in one box around the shopfront, the kei car and
  the signs. Hero: 7,631 to 21,197 pixels, within x 459–1068, y 401–656 of
  1600 × 1000. Back Street: 3,187 to 8,348 pixels, within x 468–1057,
  y 459–636. Nothing else changed, also by day, where lit prints are off.
* **Preview** (the effect stack) on the hero at golden hour and at night:
  glass, bloom and tilt-shift together, no fringes, no page errors.
* **Frame rate,** 100 objects (kei car, kei truck, small shop, konbini),
  1920 × 1080 headless: 179.7 fps in the editor and 180.1 in Preview, at
  the 180 cap, as on `main`. Draw calls went from 204 to 354 and triangles
  from 152,526 to 285,526; shader programs from 10 to 11.

### Known limitations

* **Glass does not reflect the scene** and has one opacity everywhere; a
  car's windows are tinted by color only.
* **Panes inside one object are not sorted.** Looking through a car from
  one side to the other is right at this opacity; a stack of many panes
  would not be.
* **Glass casts no shadow at all,** not even a faint one.
* **Houses, upper floors and the vending machine keep their opaque lit
  panes** (D3).
* **The rooms are shadow boxes:** 0.9 m and 2.2 m deep. Nothing can be
  placed inside them.
* **Vehicles are empty:** no driver. The steering wheel is on the right.
* **Sign texts are fixed** (one shop name each). Two small shops on one
  street have the same name.
* **Lit prints give off no light of their own;** the light on the ground
  still comes from the eight glow lights.
* **Old scenes change in look:** shopfronts have panes, the small shop's
  signboard is narrower, the kei car is see-through.
* **Not checked in the user's own browser.**
