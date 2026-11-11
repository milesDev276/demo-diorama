# Stage 24 — More Buildings (Implementation Plan)

Follows [Stage-23-Implementation.md](Stage-23-Implementation.md) (coming
back: thumbnails that wait for models and frame the whole diorama, Continue
on the home page; merged in PR #26).

> **User request (2026-11-10):** "lên kế hoạch stage 24 thôi": plan Stage 24.
> No topic given. The survey (§0) found nothing broken, so Claude offered
> four topics and recommended "more buildings"; the user replied only that
> Stage 23 is merged, so this plan follows the recommendation. Another topic
> from the list (figure outfits and editable signs, Preview camera, 3D-print
> export) can replace it before implementation starts.

**Goal:** widen the town beyond the corner shop and the residential lane.
Two new fixed buildings that are ordinary and clearly Japanese — a small
workshop with a roll-up shutter and an old two-storey shop with a flat
false front — two new presets of the modular building (a four-storey
apartment block and a narrow mixed-use building), and a fourth starter that
puts them on an old shopping street. No scene-data change, no editor UI
change.

Branch: `stage24-more-buildings`, cut from `main` at `55c4fb5` (Stage 23
merged in PR #26) on 2026-11-10.

**Status (2026-11-10):** approved with "tôi đồng ý" (the defaults in bold,
§5). Implemented and verified; results, and two deviations (the old shop has
no paint; the starter leaves out the apartment block and the small shop),
are in §6.

---

## 0. What Was Found (screenshots, `main` + Stage 23 at `423cdc6`)

Headless Chrome, a fresh profile, 1440 × 900 and 1366 × 768: home page
(first visit and returning), the editor, an object selected, the Scene tab,
Preview, My Dioramas.

1. **Nothing broken.** No page errors. The home page offers Continue and
   the user's dioramas (Stage 23); Preview opens to the full-window canvas
   and its one-row photo bar; the editor runs at the display's refresh rate
   with the hero scene.
2. **The Buildings section is the thinnest part of what makes a town.**
   It holds 7 entries: two presets of the modular building (Shop-house 3F,
   House 2F) and five fixed models (house, small shop, apartment,
   traditional house, konbini). Every starter is built from the same few;
   there is nothing taller than three floors, nothing industrial, nothing
   older than the shop-house.
3. **The modular building already reaches four floors** (`BUILDING_LIMITS`)
   and has balcony, window, entrance and shopfront bays, but no preset shows
   it: a user has to discover the steppers to get anything but the two
   defaults.
4. **The atlas has free room** for new sign cells: x 368–808 below
   y 616, and x 824–1016 below y 792 (HANDOFF §3, Stage 12).

---

## 1. Decisions

### D1 — Two fixed buildings

| Type | GLB | Size (m) | What it is |
|---|---|---|---|
| `workshop` | `building_workshop_01` | ≈ 7.3 × 6.4, ≈ 6.2 tall | 町工場 / garage workshop: a steel-frame shed clad in corrugated metal (波板) under a low shed roof. The street side is one wide roll-up shutter (シャッター), half raised over a dark concrete floor, and a narrow office door with a small window beside it. A steel outside stair on one end climbs to a two-window office upstairs. A painted name board over the shutter (fictional "鈴木工業"), a small AC unit, a drum and a stacked pallet by the door. |
| `oldShop` | `building_shop_old_01` | ≈ 5.5 × 7.3, ≈ 7.0 tall | 看板建築: a two-storey wooden shop-house whose street face is a flat mortar false front (copper-green trim) hiding a tile gable roof behind it, visible from the side. Ground floor: wooden-framed glass sliding doors with goods behind them (`glass` with a room, `lib/interior.py` shelves) and a small たばこ window counter at one end with its little red sign. Upstairs: two windows with railings. The shop name is painted across the false front. |

* Style rules as before: benchmark `prop_vending_machine_01`, no baked AO
  or grime (`WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}`),
  simple bevelled shapes, at most four material slots. Front (street side)
  faces −Y in Blender. Budgets: **6,000 tris** each (the traditional
  house's budget).
* **Fixed models, not presets,** for the same reason as Stage 15 D1: a
  roll-up shutter, an outside stair or a false front are not something the
  modular building makes. Nothing attaches to them (Stage 5 D4).
* **Paint (Stage 19):** the workshop's cladding (`paint` slot, the siding
  swatches plus a corrugated grey and a faded blue added to them); the old
  shop's mortar front (the plaster swatches).
* **Editable signs (Stage 19):** both name boards are new atlas cells
  (`workshop_board`, `oldshop_front`) in the free room of §0.4, with
  `sign: { label, cell, maxLength: 8 }` in the registry. The たばこ sign is
  part of the old shop's print, not editable.
* **After dark:** the old shop gets a warm `glow` from its shop window and
  its name board is a lit print (`LIT_CELLS`) at a low strength; the
  workshop gets one cold lamp over the shutter (a `glow`, plus the lamp in
  `emissive`). The pool stays at eight lights.
* Palette: reuse what exists; add only what is missing (the corrugated grey
  and its darker groove, the copper-green trim).

### D2 — Two presets of the modular building

No new geometry; two entries in `assets/buildingPresets.ts`, each with its
own app-rendered thumbnail.

| Preset | Bays | Floors | What it is |
|---|---|---|---|
| `apartment-block-4f` "Apartment Block 4F" | 4 × 3 | 4 | マンション: entrance and windows on the ground floor, a balcony on every front bay above, windows on the sides, a blank back; flat rooftop. |
| `narrow-building-4f` "Narrow Building 4F" | 2 × 4 | 4 | ペンシルビル / 雑居ビル: a shopfront and an entrance below, windows on every upper floor of the front and the open side, the other side blank (it stands against a neighbour); flat rooftop. |

The rooftop props (water tank, rooftop shed, AC unit) already attach to a
flat roof; the starter (D3) shows that on one of them.

### D3 — A fourth starter: "Old Shopping Street"

A 24 × 16 m plot built in code like the Residential Lane
(`utils/residentialStarter.ts` pattern, its own file
`utils/shoppingStreetStarter.ts`):

* A 5 m street along the front with a narrow sidewalk on the shop side and
  white edge lines, a back alley along one side.
* Along the street: the old shop, the narrow building, the existing small
  shop and the workshop with its shutter half up; the apartment block
  behind them on the alley side.
* Utility poles with power lines across the street, a vending machine by
  the old shop, a post box, bicycles in front of the shops, a kei truck by
  the workshop, a shopkeeper, an elder and a cyclist, a cat, potted plants,
  a garbage cage, weeds along the alley.
* **Evening, spring, clear** (§5 question 3): lit shop windows and signs
  show off D1's after-dark work; spring is the one season no starter uses.
* Preview image captured with `scripts/capture-template.mjs`. The other
  starters are not changed.

---

## 2. Files

* New:
  * `art/blender/assets/buildings/building_workshop_01.py`,
    `building_shop_old_01.py`; their GLBs under
    `public/models/buildings/` and previews under `art/previews/`.
  * `features/diorama/utils/shoppingStreetStarter.ts`.
  * `public/templates/old-shopping-street.webp`.
* Changed:
  * `types/diorama.types.ts` (two object types), `assets/assetRegistry.ts`
    (two entries: icon, footprint, glow, paint, sign, tags).
  * `assets/buildingPresets.ts` (two presets).
  * `utils/palette.ts`, `assets/paintSwatches.ts` (the workshop's
    swatches), `objects/textures/atlasLayout.json` and
    `objects/textures/graphicsAtlas.ts` (two cells, one of them lit).
  * `assets/sceneTemplates.ts` (the starter).
  * `public/thumbnails/*.webp`, `assets/thumbnails.json` (four new items).
* Docs: this file, `HANDOFF.md`, `Product-Roadmap.md`.

## 3. Out of Scope

* Rooms behind the workshop's shutter beyond a dark floor and a back wall;
  rooms upstairs in either building.
* A shutter that opens and closes (a param); a false front with a choice of
  styles.
* New facade kinds or a fifth floor for the modular building.
* New props for the street (drums and pallets are part of the workshop
  model, not library items).
* Figure outfits, more editable signs on existing assets, Preview camera
  work, 3D-print export, any backend work.

## 4. Verification

1. `build.py` for both assets: triangle budget and draw calls pass; each
   Blender preview looked at, side by side with the shop and the
   traditional house.
2. `npm run lint`, `npm run build`.
3. **Scale:** a plot with both new buildings beside `shop`, `house`,
   `apartment`, the kei truck and the pedestrian: door heights, floor
   heights and the stair read consistently. Screenshots by day and at
   night (glows, the lit name board).
4. **Paint and signs:** each new building recolored through every swatch;
   both names edited, saved, reloaded, exported and imported.
5. **Presets:** both added from the library; the inspector shows their bays
   and floors; a water tank attached to the apartment block's roof.
6. **Old scenes unchanged:** the three existing starters pixel-identical to
   `main` in Preview.
7. The new starter: opened from the New dialog and from the home page; its
   preview image and its My Dioramas thumbnail look right; no page errors.
8. Frame rate of the new starter at 1920 × 1080, and of 100 copies of the
   heavier new building (`measure-scene.mjs`).

## 5. Open Questions (settled by the defaults in bold, 2026-11-10)

1. **Which two fixed buildings:** **workshop + old shop (看板建築)**; or a
   古民家-style shop instead of the old shop.
2. **The apartment block as a preset (no new model):** **yes**; or a fixed
   マンション model with an entrance hall and a stair core (a bigger
   Blender job).
3. **Starter light:** **evening, spring, clear**; or evening with rain (the
   first starter with a weather).
4. **A built-in kit for the street** (e.g. a shop front: bicycles, a
   vending machine, a potted plant, an A-frame sign): **no**, the existing
   kits cover it.

---

## 6. Results (2026-11-10)

### Assets

| Type | GLB | Triangles / budget | Draw calls | Size |
|---|---|---|---|---|
| `workshop` | `building_workshop_01` | 3,654 / 6,000 | 4 (base, emissive, printed, paint) | 278 KB |
| `oldShop` | `building_shop_old_01` | 3,308 / 6,000 | 4 (base, emissive, printed, glass) | 267 KB |

### What was built

* **D1 — two fixed buildings.** `building_workshop_01.py`: the corrugated
  cladding is a triangle-wave extrusion per wall panel (`_corrugated`,
  0.2 m pitch) in the `paint` slot over a solid core with the workshop room
  cut out of its front; a half-raised shutter, the office door and window,
  the AC unit, the outside stair to an upstairs door, a gooseneck lamp, the
  name board, a drum and pallets. `building_shop_old_01.py`: the false front
  is mortar pieces around the openings with copper-green pilasters,
  moldings, a crest and plaques; four wooden-framed glass doors before a lit
  room (`lib/interior.py`), a tobacco window with a lit nook of cartons and a
  counter shelf, set-back upstairs windows with railings, a tile gable roof
  behind. Both in the registry with a `glow` (the shop window, warm; the
  lamp over the shutter, neutral) and an editable `sign`; the workshop has
  a paint region (`PAINT_SWATCHES.metal`: galvanized, faded blue, oxide red,
  white, sage, brown).
* **Atlas:** `workshop_board` (432 × 72 at 368, 616) and `oldshop_front`
  (432 × 72 at 368, 704), both in `SIGN_TEXTS` (鈴木工業, きくや商店);
  `oldshop_front` is lit at 0.5 and carries the たばこ tag at its right end,
  over the tobacco window.
* **Palette:** `wallMetal`, `copperGreen`, `mortarFront`, `workFloor`,
  `paintMetalBlue`, `paintMetalRust`.
* **D2 — two presets:** `apartment-block-4f` and `narrow-building-4f` in
  `buildingPresets.ts`, with thumbnails.
* **D3 — the starter:** `utils/shoppingStreetStarter.ts`, 42 objects,
  evening, spring, clear, wood platform; preview image
  `public/templates/old-shopping-street.webp`. `attach` in
  `objectDefaults.ts` is now exported for it.
* `scripts/measure-scene.mjs` clicked "Exit Preview", a label gone since
  Stage 20; it now clicks "Back to editor".

### Deviations from the plan

* **The old shop has no paint region.** With glass for the shop room and
  the tobacco window it already uses four slots (base, emissive, printed,
  glass); a fifth is over `MAX_DRAW_CALLS`. Its copper-green front is its
  identity anyway.
* **The starter holds the workshop, the old shop and the narrow building,
  not the small shop or the apartment block.** The five side by side need
  about 30 m of frontage, and the plot is 24 m (the Scene panel's largest);
  behind the row there are only 3 m. So the narrow building carries the
  rooftop props (a water tank, an AC unit) that D2 meant for the apartment
  block, and the right end is an alley and a walled lot with a tree.
* One pole with wires instead of two, and a street light at the alley (see
  the review fixes).

### Review fixes (`/code-review high`, 2026-11-10)

* **A second pole the wires missed:** a `powerLine` spans 24 m
  (`poleLayout.json`), so wires from the pole at x −2.8 sagged through a
  pole 13.9 m away. That pole is now a street light.
* **A block wall past the plot's back edge:** 9.2 m rounded up to five 2 m
  pieces; it is now 8 m (four), with the garbage cage where it ends.
* **The old shop's AC unit in the narrow building's wall:** the narrow
  building moved from x 4.77 to 5.0.
* **Bicycles across a 1.5 m sidewalk** (1.8 m long, into the shopfront and
  over the curb): parked along the curb instead.
* **The narrow building's size and roof height** come from
  `buildingSize(NARROW_BUILDING_PRESET.params)`, not copied numbers.
* **`onRoad` was copied in two starters and inlined in a third:** one export
  in `plotStarter.ts`, used by all three.
* **`BUILDING_PRESETS.find(...)!` by id:** the two new presets are named
  exports (`APARTMENT_BLOCK_PRESET`, `NARROW_BUILDING_PRESET`), so the
  starter refers to its preset by a symbol.

### Verification

* `build.py`: both assets within budget and four draw calls; the day, dusk
  and scale previews read (door ≈ 2 m against the 1.7 m figure).
* `npm run lint`, `npx tsc --noEmit`, `npm run build`: clean.
* **The starter in the editor** (headless Chrome, 1600 × 1000): evening,
  day (Isometric and Front) and night screenshots read; at night the lamp
  lights the shutter, the shop room and its name band glow. No page errors.
* **Paint and signs, scripted:** the workshop through all six swatches
  (the first stores as the default, `color` undefined); custom text on both
  signs (山本鉄工所, まるみ屋) shows on the models; after a reload the
  objects' types, colors, texts and building floors are identical.
* **Presets:** the apartment block added through the store; the inspector
  shows 4 × 3 bays and 4 floors. The narrow building's water tank sits on
  its roof in the starter.
* **Old starters unchanged:** their preview images rendered on `main` and
  on the branch differ by at most 19 of 255 (Autumn Street Corner), 12
  (Back Street) and 0 (Residential Lane), within the 19 / 25 / 0 that two
  renders of the branch differ by. (The committed images differ more from
  either: they were rendered in an earlier stage.) After the `onRoad`
  refactor, Residential Lane's render differs from `main` in 77 pixels
  (at most 16 of 255, round the street light) on two captures, but its
  scene data — environment and every object without ids — is identical
  to the old file's, compared as JSON in the browser; so the starters'
  scenes are unchanged and the difference is the renderer's.
* **Frame rate** (`measure-scene.mjs`, 1920 × 1080): the starter 180 fps in
  the editor (71 draw calls, 75 k triangles) and 165 in Preview; 100
  buildings alternating workshop and old shop 180 / 179 fps (404 draw
  calls, 363 k triangles).

### Known limitations

* Not tried in the user's own browser.
* The old shop cannot be recolored (above).
* The workshop's shutter is always half raised; its room is dim by day.
* The apartment block preset is in the library only; no starter uses it.
