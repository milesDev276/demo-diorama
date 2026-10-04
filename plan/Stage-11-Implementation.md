# Stage 11 — Library Breadth (Implementation Plan)

Follows [Stage-10-Implementation.md](Stage-10-Implementation.md). The editor
has its tools, but the library was built for one scene: the hero corner. A
user who starts another street finds one car, one figure, one pole and no
street light, bench or convenience store.

**Goal:** eleven new assets that fill the thinnest categories, in the
approved style, each a meter-scale Blender GLB. No new editor features, no
change to the scene format.

Branch: `stage11-library`, cut from `main` (Stage 10 is merged, PR #13).

> The user asked what comes after Stage 10; library breadth was the
> recommendation (2026-10-03). The user then asked for Stage 11 to be carried
> out and handed over every decision ("you have my permission"), so the open
> questions in §5 are settled with the defaults listed there.

---

## 1. Decisions

### D1 — Eleven assets, chosen by category gap

| Type | GLB | Size (m) | What it is |
|---|---|---|---|
| `keiTruck` | `vehicle_kei_truck_01` | 1.48 × 3.40, 1.78 tall | 軽トラ: cab-over cab, flat bed with drop sides, yellow plates |
| `scooter` | `vehicle_scooter_01` | 1.75 × 0.66, 1.2 tall | 原付: step-through scooter with a leg shield and a rear box, on its stand |
| `shopkeeper` | `people_shopkeeper_01` | 1.65 tall | Standing figure in a white shirt and a long navy apron, hands together |
| `student` | `people_student_01` | 1.25 tall | Schoolchild with a yellow hat and a red randoseru |
| `streetLight` | `infra_street_light_01` | 5.0 tall | Steel pole with an arm and an LED head; gives light after dark |
| `utilityBox` | `infra_utility_box_01` | 1.10 × 0.45, 1.45 tall | Pad-mounted cabinet on a concrete plinth, as found on sidewalks |
| `bench` | `prop_bench_01` | 1.50 × 0.50, 0.78 tall | The plastic bench that stands in front of shops and at bus stops |
| `trafficCone` | `prop_traffic_cone_01` | 0.38 square, 0.70 tall | カラーコーン: red cone with a white band |
| `garbageStation` | `prop_garbage_station_01` | 1.20 × 0.65, 0.90 tall | ゴミ集積所: a folding steel-mesh cage with a few bags in it |
| `konbini` | `building_konbini_01` | 9.10 × 7.28, 3.7 tall | Convenience store: glass front, lit sign band with three stripes, fictional (no brand) |
| `busStop` | `street_bus_stop_01` | 2.4 tall | バス停: round head plate and a timetable board on a pole in a concrete block |

* Style rules as before: benchmark `prop_vending_machine_01`, no baked AO
  or grime, simple shapes, at most three material slots.
* Vehicles and the scooter follow the conventions already in the library:
  the truck's front faces −Y like the kei car; the scooter heads +X like the
  bicycle.
* The konbini is a fixed model, like `house` and `shop`: its low wide box
  with a full-width sign band is not something the modular building makes.

### D2 — Prints only where the object is unreadable without them

Two new atlas cells, both for the bus stop (`bus_stop_head`,
`bus_stop_board`). The truck reuses `plate_kei`. The konbini's sign is
modeled in the `emissive` slot (white band, three colored stripes, a logo
block), so it lights up after dark, which a print would not.

### D3 — Two more glow lights

`streetLight` and `konbini` get a `glow` in the registry. The pool stays at
eight lights (`MAX_GLOW_LIGHTS`); buildings are still served first.

### D4 — Two built-in kits

`bus-stop` (bus stop, bench, student) and `collection-point` (garbage
station, two cones, weeds). They show the new props in use and cost nothing
in the scene format.

### D5 — Starters are not changed

The hero corner and Back Street stay as they are: both are verified
compositions. The new assets are for the user's own scenes.

---

## 2. Files

* New: eleven scripts under `art/blender/assets/`, their GLBs and previews.
* Changed: `diorama.types.ts` (types), `assetRegistry.ts` (entries),
  `palette.ts` (a few colors), `atlasLayout.json` and `graphicsAtlas.ts`
  (two cells), `builtInKits.ts` (two kits), thumbnails.
* Docs: this file, `HANDOFF.md`, `Hero-Diorama-Roadmap.md`.

## 3. Out of scope

* Glass, lit prints, weather, a saved camera per scene, any backend work.
* Animated or posed figures; drivers in vehicles.
* New building modules or presets.

## 4. Verification

1. `build.py` for the eleven assets: triangle budget and draw calls pass.
2. Blender previews looked at for each asset; then each in the app
   (thumbnails).
3. `npm run lint`, `npm run build`.
4. A seeded corner scene with all eleven assets: screenshots by day and at
   night (glow lights), no page errors; scale checked against the existing
   kei car and pedestrian.
5. Both starters unchanged (pixel diff of Preview shots against `main`).
6. Frame rate of a scene with 100 of the heaviest new assets.

## 5. Open questions, settled with these defaults

1. **Which assets?** The eleven of D1: two per thin category, one building.
2. **Fixed konbini or a building preset?** Fixed (D1).
3. **Change the starters?** No (D5).
4. **A second car instead of the truck?** The truck: a different silhouette
   says more than a recolored car.

---

## 6. Results (2026-10-04)

**Status:** implemented and verified on branch `stage11-library`. Not
committed; the user commits and merges.

### Assets

| Asset | Triangles / budget | Draw calls | GLB |
|---|---|---|---|
| `building_konbini_01` | 744 / 2,500 | 2 | 52.5 KB |
| `street_bus_stop_01` | 228 / 1,500 | 2 | 18.3 KB |
| `infra_street_light_01` | 382 / 1,500 | 2 | 24.7 KB |
| `infra_utility_box_01` | 288 / 1,000 | 1 | 20.8 KB |
| `prop_bench_01` | 412 / 1,500 | 1 | 27.5 KB |
| `prop_traffic_cone_01` | 148 / 400 | 1 | 10.1 KB |
| `prop_garbage_station_01` | 1,044 / 4,000 | 1 | 75.8 KB |
| `vehicle_kei_truck_01` | 1,932 / 8,000 | 2 | 154.6 KB |
| `vehicle_scooter_01` | 1,448 / 4,000 | 1 | 94.5 KB |
| `people_shopkeeper_01` | 1,740 / 5,000 | 1 | 116.0 KB |
| `people_student_01` | 2,160 / 5,000 | 1 | 152.2 KB |

`public/` is 5.1 MB.

### Deviations from the plan

* Four palette colors were added (`coneRed`, `lampWhite`, `clothWhite`,
  `clothGray`); everything else reuses existing ones.
* The street light's glow is 26 cd with an 11 m reach, far more than a
  shop's (8 cd, 6.5 m): it hangs at 4.6 m, a shop's light at 1.9 m.

### Verification

* `build.py` for the eleven assets: exit 0, all within budget (table above).
  Each Blender preview was looked at.
* `npm run lint` and `npm run build`: clean.
* Thumbnails rendered for the eleven assets and the two kits; 58 of 58
  library items have one.
* **A corner scene with all eleven assets,** beside the kei car and the
  pedestrian, at golden hour and at night: scale is consistent (the truck
  and the car are the same length; the child reaches the adults' chest),
  the bus stop's two prints read, no page errors. At night the konbini's
  glass and sign band glow and the street light puts a pool of light on the
  sidewalk.
* **Hero starter against `main`:** editor screenshots differ only in the
  library panel (the new Convenience Store thumbnail; 7,372 pixels, x 41–254,
  y 591–646), plus 47 pixels elsewhere in the front view. Preview front,
  side and top are pixel-identical. Preview isometric differed, as in
  Stage 10 (the first Preview shot is framed late, HANDOFF §5), so it proves
  nothing either way.
* **Frame rate,** 100 objects (schoolchild, kei truck, garbage cage,
  scooter; 179,626 triangles, 129 draw calls), 1920 × 1080 headless: 179.5
  fps in the editor and 180.2 in Preview, at the 180 cap.

### Known limitations

* **The starters do not use the new assets** (D5), and the Back Street
  starter was not re-captured (nothing it uses changed).
* **The two kits were checked as thumbnails only,** not placed in a scene.
* **The konbini's sign has blocks, not lettering,** like the small shop's.
* **Printed faces stay dark at night:** the bus stop's head and timetable.
* **Figures are standing only;** nobody sits on the bench or rides the
  scooter.
* **The truck's bed is empty** and nothing snaps onto it: objects put on it
  are placed by hand.
* **Glow lights are still eight per scene,** buildings first: a street with
  many street lights leaves the last ones unlit.
* **Not checked in the user's own browser.**
