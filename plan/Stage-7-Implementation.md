# Stage 7 — Environment and Photo (Implementation Plan)

Part of [Hero-Diorama-Roadmap.md](Hero-Diorama-Roadmap.md) (decisions L2,
L4, L5, L7, L8). Builds on the Stage 2 look-dev
([Stage-2-Implementation.md](Stage-2-Implementation.md)) and the Stage 6
scatter layers ([Stage-6-Implementation.md](Stage-6-Implementation.md) D1,
D3).

**Goal:** the hero corner reads as a photographed miniature at golden hour
and at dusk. The scene gets a time of day and a season, shops and vending
machines light up after dark, Preview becomes a small photo studio (frame,
focus, exposure, PNG export), and the finished hero scene ships as the
built-in starter.

Branch: `stage7-environment`, cut from `main` (Stage 6 is merged, PR #9).

> The user handed every decision of this stage to Claude (2026-10-02: "you
> have all my permissions"). The open questions in §6 were therefore settled
> with the defaults listed there, and implementation followed the plan
> without a separate approval round — as in Stage 6.

---

## 0. Starting Point (verified 2026-10-02)

* **Lighting is fixed.** `SceneLighting.tsx` has one hard-coded look: sun
  from the front-right, ambient, hemisphere and four Lightformers.
* **The sky is three palette colors** (`skyTop/Middle/Bottom`), read by the
  CSS gradient behind the canvas, by `SkyBackdropEffect` in Preview and by
  the fog.
* **`EMISSIVE_INTENSITY = 0.55` is a constant** in `objects/materials.ts`.
  Windows glow in daylight (a known limitation since Stage 5). The legacy
  `house` and `shop` carry their own emissive values in JSX.
* **`DioramaEnvironment` is `{ background, ground, base }`.** The validator
  keeps `base` and resets the rest.
* **The shop interior is flat:** `building_bay_shopfront_01` has an emissive
  plane and paper-thin goods 2–3 cm behind the door frames.
* **Leaf colors are fixed.** The ginkgo is one `base` mesh, so its crown
  cannot be told apart from its trunk at runtime.
* **Preview** is the perspective camera plus the effect stack, with one
  "Exit Preview" button. The tilt-shift band is fixed across the middle of
  the frame. Nothing can be exported as an image.
* **A selection stays visible in Preview** (ring and gizmo), and a click
  there still selects.
* **Open L7 hero items:** utility pole and transformer in meters, wires,
  zelkova, block wall, hedge, post box, meter box. The legacy pole and
  power line are in the pre-meter unit (12 m pole, 50 m of wire).
* **The corner starter** has 21 objects, 38 draw calls, 80k triangles.
* A first visit opens the street-strip starter.

---

## 1. Decisions

### D1 — Scene data: `timeOfDay` and `season`

```ts
const TIMES_OF_DAY = ["morning", "day", "goldenHour", "evening", "night"] as const;
const SEASONS = ["spring", "summer", "autumn", "winter"] as const;

interface DioramaEnvironment {
  background: string;
  ground: string;
  base: DioramaBase;
  timeOfDay: TimeOfDay;
  season: Season;
}
```

* **Additive; files stay v2.** A file without them — or with a value this
  app does not know — loads as `day` and `autumn`.
* **`day` + `autumn` is today's look,** with one intended change: emissive
  surfaces no longer glow in daylight (D3).
* **Not on the undo stack,** like the base: switch back to undo. Both are
  part of the autosave fingerprint.

### D2 — Time-of-day looks

One record per time in `utils/timeOfDay.ts`; nothing else holds a lighting
number.

| | Sun | Sky | Emissive | Lights after dark |
|---|---|---|---|---|
| Morning | low, from the front-right, pale warm | pale blue to peach | low | off |
| Day | today's sun, unchanged | today's sky, unchanged | low | off |
| Golden hour | low, from the front-left, deep orange; long shadows | warm blue to apricot | medium | off |
| Evening (dusk) | last light on the horizon, dim | deep blue to rose-orange | high | on |
| Night | dim blue moonlight | navy | highest | on |

* Each look sets: sun position, color and intensity; ambient and
  hemisphere; the four Lightformers and the environment intensity; the
  three sky stops (the fog takes the middle one); the emissive level; the
  strength of the after-dark lights (D4).
* **Golden hour and evening put the sun at the front-left,** as
  Hero-Layout §7 says: the front facade is lit, the right one is in soft
  shade. `day` keeps its front-right sun so existing scenes do not change.
* The environment map is re-rendered when the time changes (it is keyed by
  it); it is still rendered once, not per frame.
* `SceneLighting`, the CSS gradient, `SkyBackdropEffect` and `SceneFog` all
  read the look. The three `sky*` palette entries move into the `day` look.
* **Inside a canvas the environment comes from a React context**
  (`hooks/useSceneEnvironment.ts`), which the editor's canvas fills from
  the scene. The thumbnail studio provides none, so it always renders by
  day, in autumn.

### D3 — Emissive follows the time of day

* `objects/materials.ts` exports `setEmissiveLevel(level)` instead of the
  `EMISSIVE_INTENSITY` constant; it sets the one shared emissive material.
  A new canvas component, `EnvironmentDriver`, calls it (and D6's season)
  when the scene's environment changes. No per-frame work.
* The legacy `house` and `shop` windows read the same level through a small
  hook, so old street scenes also light up at night.
* Preview's bloom is unchanged: its threshold stays at 1, so only surfaces
  the evening and night looks push past it bloom.

### D4 — Lights after dark

Evening and night add a few warm point lights **without shadows.** They are
derived from the scene, never stored:

* **A building** gives one light per side that has a shopfront bay, in front
  of the middle of that side's shopfront run, under the awning.
* **A vending machine** and the legacy **shop** give one each. The registry
  describes it: `glow?: { position, color, intensity, distance }`.
* One component, `SceneGlowLights`, reads the objects from the store, takes
  world positions through `utils/sceneGraph.ts` and lights at most
  `MAX_GLOW_LIGHTS = 8`, buildings first. Hidden objects give no light.
* **The pool of eight lights is always in the scene,** dark by day and dark
  where no object needs one (changed during implementation, see §7): the
  number of lights is part of every lit shader, and a pool that comes and
  goes recompiles them all.

### D5 — Shop interior from Blender

* **`building_bay_shopfront_01` is rebuilt with a real interior** 0.55 m
  deep behind the door frames: a floor, a back wall of shelves with goods
  that have depth, and beer crates by the door (a 酒屋). Everything inside is
  in the `emissive` slot, so it is dim by day and lit after dark.
* **New module `building_shop_side_01`:** the end wall of a shop interior.
  `layoutBuilding` adds one at each end of a shopfront run — like the
  balcony end panels — except where the run turns the corner into another
  shopfront, so a corner shop is one room.
* The door leaves stay frames without glass: there is no transparent slot,
  and at this scale an open frame reads as glass.
* Budget unchanged: ≤ 3k triangles per module.

### D6 — Season

| Season | Foliage (`foliage` slot) | Fallen leaves | Grass and weeds |
|---|---|---|---|
| Spring | fresh light green | hidden | fresh |
| Summer | deep green | hidden | as modeled |
| Autumn | as modeled (the default) | shown | as modeled |
| Winter | hidden: bare branches | shown, browned | dry straw |

* **A fourth Blender material slot, `foliage`,** for deciduous crowns. The
  app maps it to a shared material that is `base` plus a season recolor:
  the vertex color's brightness is kept (so shading and clump variation
  survive) and its hue is replaced by the season's leaf color. A plain
  multiply cannot turn both a yellow ginkgo and an orange zelkova green.
  In winter the material is simply not drawn.
* **The ginkgo is rebuilt** with its crown in `foliage` (2 draw calls) and a
  few more twigs so it holds up bare. Its autumn look must not change.
* **Scatter:** `ScatterLayer` multiplies each instance color by the season's
  tint for its kind, and draws no fallen leaves in spring and summer. The
  layer stays in the scene; only its drawing changes.
* Evergreens (hedge, potted plants, the legacy tree) do not change.
* `utils/seasons.ts` holds the table; `EnvironmentDriver` applies it.

### D7 — Photo mode lives in Preview

No third mode: **Preview is the photo studio.** A bar at the bottom of
Preview holds everything; the editor toolbar keeps its "Preview" button.

* **Time of day:** the five looks, so light can be chosen while composing.
* **Frame:** Free, 1:1, 4:5, 16:9. With a ratio chosen, the canvas itself
  takes that shape, centered on a dark mat — what is framed is exactly what
  is exported; nothing is cropped afterwards.
* **Focus:** click the scene. The click's world point is kept, and every
  frame the tilt-shift band is moved to that point's height on screen, so
  focus stays on the subject while orbiting. A blur slider sets how strong
  the falloff is.
* **Exposure:** −1.5 … +1.5 EV on the renderer's tone-mapping exposure.
* **Save photo:** PNG at 1×, 2×, 3× or 4× of the frame's size on screen.
  The composer is resized for one synchronous frame, the canvas is copied,
  and the size is restored — no `preserveDrawingBuffer`. The size is
  clamped to the GPU's limit and to a pixel budget; the bar shows the
  resulting pixel size.
* **Photo settings are editor state** (not saved with the scene). The time
  of day is scene data.
* **Preview hides the selection** (ring and gizmo) and clicks no longer
  select there — otherwise they would end up in the photo.

### D8 — The hero's missing pieces (L7)

The roadmap ends with this stage, so the open L7 items are built here. All
from Blender, no baked AO or grime, simple shapes.

| Asset | Size | Notes |
|---|---|---|
| `infra_utility_pole_01` | 10 m; crossarm at 9.2; transformer at 6.8 … 7.7 | Replaces the legacy `utilityPole` geometry (same type). Step bolts, guard band, insulators. ≤ 5k |
| `nature_tree_zelkova_01` | 7 m, crown Ø 6 | Vase-shaped; orange foam crown in the `foliage` slot. ≤ 15k |
| `street_block_wall_01` | 2.0 × 1.2 × 0.15 m | ブロック塀: six courses, a cap, one pierced block. Tiles end to end. ≤ 1.5k |
| `nature_hedge_01` | 1.2 × 1.0 × 0.6 m | Clipped evergreen hedge; tiles end to end. ≤ 1.5k |
| `prop_post_box_01` | 0.4 × 1.25 × 0.4 m | Red 〒 box on a leg; printed front (new atlas cell `post_front`). ≤ 1.5k |
| `prop_meter_box_01` | 0.3 × 0.45 × 0.14 m | Electricity meter; wall-mounted only. ≤ 1.5k |

* **The power line is rewritten in meters** in app code (L2: wires are
  parametric): six wires over the new pole's insulators — three
  high-voltage, a low-voltage pair, a communication cable — running two
  24 m spans each way with sag. Its attach points come from
  `objects/poleLayout.json`, which the pole's Blender script also reads.
* **Wires are cut at the base's edge,** as on a physical model: the wire
  material carries four clipping planes that `EnvironmentDriver` keeps on
  the active base's outline.
* Old scenes: the pole becomes 10 m (was 12 m) and its wires follow.
* **Not built:** a second figure variant and a metric stop sign. The hero
  uses the existing pedestrian twice and the legacy sign.

### D9 — The hero scene as the starter

* `getCornerStarter()` grows into the full hero scene of Hero-Layout.md:
  the pole and wires, the zelkova, the wall and hedge, post box, meter box,
  recycling bin, A-frame sign, rooftop chair, stop sign, a second figure
  and leaves under the zelkova.
* `assets/sceneTemplates.ts` lists the built-in starters. One for now:
  **"Autumn street corner"** — the hero objects on the corner base, at
  golden hour, in autumn.
* **The New-diorama dialog** offers it above the two empty bases.
* **A first visit opens it** (no autosave yet). Files without an environment
  still load as the street strip by day.
* **Reset** on the corner base rebuilds the hero objects, as before; it does
  not touch the environment.

### D10 — Out of scope

* weather, clouds, stars, animated light, street lamps as a new asset
* shadows from the point lights; lights the user places by hand
* depth-based depth of field (the tilt-shift stays screen-space)
* saving photo settings or a camera with the scene
* per-object season or time overrides; snow
* a parametric wall by length; renaming or exporting kits

---

## 2. Milestones

### M1 — Environment data and time-of-day looks

* Types, validator, defaults, store actions, autosave; `timeOfDay.ts`;
  `SceneLighting`, sky, fog; `EnvironmentDriver` and emissive; inspector
  controls.
* **Check:** `day` matches `main` except on emissive surfaces; five looks
  render in the editor and in Preview; round trip keeps both fields.

### M2 — After-dark lights and the shop interior

* `SceneGlowLights`, registry `glow`, building shop lights; shopfront
  module rebuilt; shop side module and layout rule.
* **Check:** module budgets; a corner shop is one room; frame rate at night.

### M3 — Season

* `foliage` slot in Blender and the app; ginkgo rebuilt; scatter tint and
  leaf visibility; inspector control.
* **Check:** autumn ginkgo matches the old one; four seasons render.

### M4 — Hero assets

* The six assets of D8, the metric power line, wire clipping, registry
  entries, thumbnails.
* **Check:** `build.py` exits 0; sizes read right next to the building.

### M5 — Photo mode

* Photo state, frame, focus, blur, exposure, export; selection hidden in
  Preview.
* **Check:** exported PNG sizes; a 2× export scaled down matches the screen.

### M6 — Hero starter, acceptance, docs

* Hero scene, template, New dialog, first visit; thumbnails re-rendered;
  §49 gate at golden hour and dusk; roadmap and HANDOFF.

---

## 3. Files

| Change | Files |
|---|---|
| New (app, under `features/diorama/`) | `utils/timeOfDay.ts`, `utils/seasons.ts`, `utils/environmentOptions.ts`, `utils/photo.ts`, `objects/poleLayout.json`, `assets/sceneTemplates.ts`, `hooks/useSceneEnvironment.ts`, `components/EnvironmentDriver.tsx`, `components/SceneGlowLights.tsx`, `components/SegmentedControl.tsx`, `components/PhotoBar.tsx`, `components/PhotoStudio.tsx` (focus + export, in the canvas) |
| Modified (app) | `types/diorama.types.ts`, `utils/sceneDefaults.ts`, `utils/sceneValidator.ts`, `utils/objectDefaults.ts`, `utils/palette.ts`, `utils/legacyUnits.ts`, `store/dioramaStore.ts`, `hooks/useAutoSave.ts`, `assets/assetRegistry.ts`, `objects/materials.ts`, `objects/House.tsx`, `objects/Shop.tsx`, `objects/PowerLine.tsx`, `objects/scatter/ScatterLayer.tsx`, `objects/building/buildingLayout.ts`, `objects/textures/atlasLayout.json`, `objects/textures/graphicsAtlas.ts`, `components/SceneLighting.tsx`, `components/SceneFog.tsx`, `components/SkyBackdropEffect.ts`, `components/PostEffects.tsx`, `components/DioramaCanvas.tsx`, `components/DioramaEditor.tsx`, `components/DioramaObject.tsx`, `components/SceneObjects.tsx`, `components/ScenePanel.tsx`, `components/BrushBar.tsx`, `components/NewSceneDialog.tsx`, `components/dev/ThumbnailStudio.tsx` |
| Removed (app) | `objects/UtilityPole.tsx` (replaced by the GLB) |
| New (Blender) | `assets/infrastructure/infra_utility_pole_01.py`, `assets/nature/nature_tree_zelkova_01.py`, `assets/nature/nature_hedge_01.py`, `assets/street/street_block_wall_01.py`, `assets/props/prop_post_box_01.py`, `assets/props/prop_meter_box_01.py`, `assets/buildings/building_shop_side_01.py` |
| Modified (Blender) | `lib/materials.py` (`foliage` slot), `lib/facade.py` (shop interior dimensions), `assets/nature/nature_tree_ginkgo_01.py`, `assets/buildings/building_bay_shopfront_01.py` |
| Scripts | new `scripts/capture-template.mjs` (the starter's preview image) |
| Generated | 7 new GLBs, 2 rebuilt, their previews, `public/thumbnails/*.webp`, `public/templates/autumn-corner.webp` |
| Docs | this file; roadmap Stage 7 status; `HANDOFF.md` |

No new npm dependencies.

---

## 4. Verification

| Check | How | Target |
|---|---|---|
| Existing scenes | `capture-presets.mjs` on the street starter and a seeded Stage 6 corner scene, vs. `main` | Differences only on emissive surfaces (and, on the street, the pole and wires) |
| Old files | Files without `timeOfDay` / `season`, with unknown values | Load as `day` / `autumn`; saved back as v2 with both fields |
| Five looks | Editor and Preview shots of the hero at each time | Each reads as its time; no blown-out or crushed frame |
| Asset budgets | `build.py` output | Within L8; ≤ 3 draw calls |
| Shop interior | Close-ups by day and at night; a corner shop and a single-side shop | One room at the corner; closed at the run's ends |
| Lights | `renderer.info` and light count at day and at night | 0 point lights by day; ≤ 8 after dark |
| Season | Four seasons, ginkgo and zelkova, leaves layer | Table of D6; autumn ginkgo within noise of the old one |
| Wires | Pole near the base edge, both bases | Wires end at the base outline |
| Photo frame | Each ratio at two window sizes | Canvas has the ratio, centered |
| Focus | Click a low and a high point; orbit | Band follows the point |
| Export | 1×–4× on each ratio | PNG of the announced size; 2× scaled down ≈ the screen; no page errors |
| Preview is clean | Enter Preview with a selection | No ring, no gizmo; clicks do not select |
| Template | New → Autumn street corner; first visit | Hero scene at golden hour on the corner base |
| Frame rate, 1920×1080 | Hero at day and at night, editor and Preview | Editor ≥ 50 fps, Preview ≥ 40 fps |
| Visual gate (§49) | Hero at golden hour and at dusk, Preview | Scale, materials, lighting, composition, detail, Japanese identity |
| Static checks | `npm run lint`, `npm run build` | Pass; no page errors |

---

## 5. Risks

* **Lights recompile shaders.** The number of point lights is part of every
  lit program, so the first switch to evening and adding a vending machine
  at night hitch once. Measured in verification — and removed, see §7.
* **The season recolor patches three's shader,** like the emissive
  material. It has to be re-checked on a three upgrade.
* **Large exports use a lot of GPU memory.** The size is clamped and the
  export runs without multisampling; a failed export leaves the app as it
  was.
* **Rebuilding the ginkgo re-bakes its AO** with new noise. Checked against
  the old render.
* **The legacy pole shrinks** from 12 m to 10 m in old scenes.
* **Night can go muddy** with only bloom to carry it. The looks are tuned on
  the hero scene, with real screenshots.

---

## 6. Open Questions (settled with the defaults, 2026-10-02)

1. **Scope:** the whole stage on one branch, including the open L7 assets.
2. **Photo mode is Preview** with a photo bar, not a third mode.
3. **Four seasons;** winter hides deciduous crowns.
4. **A first visit opens the hero scene.** Files without an environment
   still load as the street strip by day.
5. **Lights after dark** come from buildings with shopfronts and from
   vending machines; none are placed by hand.
6. **The block wall and the hedge are tiling Blender pieces,** not
   parametric objects.
7. **Photo settings are not saved** with the scene.

---

## 7. Status — Implemented 2026-10-02

All milestones M1–M6 are done on branch `stage7-environment`. Nothing is
committed yet.

### Deviations from the plan

* **The pool of eight glow lights is always in the scene** (D4 said
  "only at evening and night"). With lights that came and went, the first
  switch to evening froze the editor for 1.7 s while every lit shader was
  recompiled, and every vending machine added after dark would have done
  the same. Now the lights are dark by day and the shaders never change:
  a time switch takes 70–135 ms. The price is about 4 % of Preview's frame
  rate at 3216 × 1962 (91 → 88 fps); the editor stays at the 180 fps cap.
* **The environment reaches asset components through a React context,**
  not the store. `ScatterLayer`, `House` and `Shop` are imported by the
  asset registry, and the store builds its first scene from the registry
  while it loads; a store import in them was a cycle that broke the
  thumbnail page. `hooks/useSceneEnvironment.ts` holds the context and its
  two hooks. Rule from now on: nothing the registry imports may import the
  store.
* **`SceneLighting` takes no time-of-day prop.** The thumbnail studio has
  no provider and so gets day and autumn by default.
* **Six wires instead of three,** drawn two spans each way (±48 m), so they
  pass the edge of any base wherever the pole stands. The wire mesh has its
  own `raycast` that ignores the cut-off part: three's picking does not
  know about clipping planes, and a click past the base's edge selected the
  power line.
* **The thumbnail studio frames a cut wire by what is drawn** (it clips
  wires to the corner base), so the power line's thumbnail shows wires
  instead of hairlines.
* **The brush bar says when what it paints is hidden** ("Fallen Leaves do
  not show in summer…").
* **Esc leaves Preview.** The editor's shortcuts are off there, and the bar
  replaced the single button.
* **`capture-presets.mjs` was not changed.** One-off scripts drove the
  time of day through `window.__dioramaStore`.
* **Files the plan did not list:** `hooks/useSceneEnvironment.ts`,
  `utils/environmentOptions.ts`, `components/SegmentedControl.tsx`,
  `scripts/capture-template.mjs`, `lib/facade.py`, `utils/legacyUnits.ts`
  (pole constants removed), `components/BrushBar.tsx`.
* **Palette additions:** `zelkovaLeafLight`, `zelkovaLeafDeep`, `hedgeLeaf`,
  `hedgeLeafDark`, `postRed`, `concreteBlock`, `mortar`, `meterGray`. The
  three `sky*` entries moved into `utils/timeOfDay.ts`.

### Assets

| Asset | Tris / budget | Draw calls | GLB |
|---|---|---|---|
| `building_bay_shopfront_01` (rebuilt) | 1,956 / 3,000 | 2 | 103 KB |
| `building_shop_side_01` | 12 / 3,000 | 1 | 2 KB |
| `infra_utility_pole_01` | 1,132 / 5,000 | 1 | 67 KB |
| `nature_tree_zelkova_01` | 10,290 / 15,000 | 2 | 860 KB |
| `nature_tree_ginkgo_01` (rebuilt) | 11,194 / 15,000 | 2 | 931 KB |
| `nature_hedge_01` | 992 / 1,500 | 1 | 82 KB |
| `street_block_wall_01` | 456 / 1,500 | 1 | 32 KB |
| `prop_post_box_01` | 332 / 1,500 | 2 | 30 KB |
| `prop_meter_box_01` | 336 / 1,500 | 1 | 22 KB |

None of the new ones has baked AO or grime. The ginkgo keeps its bake; only
these nine were built.

### Verification results

Headless Chrome on the GTX 1660 SUPER against the dev server, driving the
page with real pointer and key events and reading the store and renderer
through `?dev=stats`. The scenario scripts were one-off files built on the
`Cdp` and `launchBrowser` exports of `capture-presets.mjs`; they are not in
the repo.

| Check | Result |
|---|---|
| Existing scenes vs. `main` (street starter and `main`'s corner starter as seeds, 4 presets, editor and Preview; canvas area only) | Editor: 0.3–2.5 % of pixels differ by more than 4/255, all of them on windows, the shopfront, vending fronts, faintly the ginkgo crown, and on the street the pole and wires. Preview front, side and top: the same places. The two `preview-isometric` pairs could not be compared: the baseline shots were taken mid-transition (the known first-Preview race). Both seeds are saved back with identical objects, v2, with `timeOfDay: "day"` and `season: "autumn"` added. |
| Environment (22 checks) | A first visit opens the hero scene (corner, golden hour, autumn, 44 objects). Emissive level rises morning 0.3 → day 0.2 → golden 0.85 → evening 1.7 → night 2.1. No lit point light by day, four on the hero after dark, eight at most with ten more vending machines, none from a hidden building. Time and season leave the undo stack alone and are autosaved (file v2). Crowns are bare in winter only; the leaf layer is drawn in autumn and winter only. Wire bounds follow the base (8 m → 25.2 × 13.5 m). Files without an environment, a v1 file, unknown values and a non-object environment load as day and autumn; known values are kept. New → Autumn Street Corner gives the hero scene with a fresh history; New empty starts by day in autumn; Reset rebuilds the 44 objects, keeps the time of day and is one undo step; a save → import round trip keeps objects and environment. |
| Photo mode (29 checks) | Gizmo and ring gone in Preview, the selection survives it, clicks do not select. A click sets the focus to the world point hit (shopfront y 1.4, rooftop y 10.1); the sky clears it; an orbit drag does not set it. Frames: 1:1, 4:5 and 16:9 within 0.01 of their ratio and centered; Free fills the window. Exposure +1 EV doubles the tone-mapping exposure and is back to 1 in the editor. Exports at 1×–4× of each frame have the announced size (1600 × 1000 → 6400 × 4000 in 0.6–0.7 s, 4.5 MB), the canvas returns to its size, no context loss. A 2× export scaled down against the 1× export: mean difference 0.43 / 255, 0.19 % of pixels over 24. Wires can be picked where drawn, not where cut. Esc leaves Preview. |
| Shop interior | Close-ups by day, at evening and at night (`art/previews/stage7_shop_evening.png`): shelves, bottles and crates read behind the door frames; the corner shop is one room; with the right side changed to windows the front run is closed at both ends. |
| Asset budgets | As in the table; `build.py` exits 0 |
| Hero scene | 44 objects, 67 draw calls, 139,900 triangles (budget 500k), 19 shader programs, the same by day and at night |
| Frame rate, 1920×1080 | Hero by day and at night: editor 180 fps (the headless cap), Preview 180. 100-object stress (kei cars, bicycles, vending machines, ginkgos; 243 draw calls, 491k triangles): editor 177, Preview 180. |
| Thumbnails | 39 of 39 items rendered; the starter's image is `public/templates/autumn-corner.webp` |
| Visual gate (§49) | `art/previews/stage7_hero_golden.png`, `stage7_hero_dusk.png`, `stage7_hero_night.png` (exported photos, 4:5), `stage7_season_summer.png`, `stage7_season_winter.png`. Scale: figures, doors, car and the 10 m pole agree. Materials: one collection. Lighting: at golden hour the front facade is lit and the right one in shade; at dusk windows, shop and vending machines carry the scene. Composition: plinth, tilt-shift band on the shop front. Identity: 山田酒店 kanban, vending machines, post box, pole with transformer and wires, 止まれ, curve mirror, block wall. |
| `npm run lint`, `npm run build` | Pass; no page errors in any run |

**Not done:** the scene was not put side by side with the reference photo.
The photo is not in the repository; the gate above was judged on the
screenshots alone, and the comparison is left to the user.

### Known limitations

* **Glow lights cast no shadows.** A shop light reaches 6.5 m and shines
  through walls on the way; at most eight lights are lit.
* **Printed faces are not lit at night:** the kanban sign, the vending ad
  and the post box front go dark with the scene.
* **Shop doors have no glass** (there is no transparent material slot).
* **The eight-light pool is in every shader,** by day too.
* **Seasons:** evergreens and the legacy procedural tree do not change;
  winter has no snow; fallen leaves painted in spring or summer cannot be
  seen until the season changes (the brush bar says so).
* **The zelkova has no baked AO,** the ginkgo beside it has.
* **The focus is a screen-space band,** not depth of field: everything at
  the focus point's height on screen is sharp.
* **Photo settings are not saved** with the scene, and an export is capped
  at about 26 megapixels.
* **Time of day and season are not on the undo stack.**
* **Old scenes change:** emissive surfaces no longer glow by day; the
  utility pole is 10 m (was 12 m) with six wires.
* **The hero scene uses the same figure twice,** has no shopkeeper, and its
  stop sign is the legacy one.
* **The editing camera does not fit the scene to a small window;** only the
  presets' fixed zoom exists.
* **In headless Chrome the canvas takes its new size late** after entering
  Preview. Scripts must wait for it before clicking or capturing; this is
  the "first Preview shot framed small" race of earlier stages.
