# Hero Diorama Roadmap — From Vertical Slice to "Photographed Miniature"

## Goal

Make the app capable of producing a scene at the quality level of a
hand-built physical street-corner diorama: dense small details, weathered
materials, warm interior light, and a tilt-shift "photo of a model" look.
All of it is expressed in Japanese everyday-life vocabulary
(CLAUDE.md §5–7).

The reference photo sets the **quality bar, composition and detail
density**. It does not set the content. Its signage and building type read
as a generic East-Asian street, so every detail is translated into its
Japanese equivalent, for example 自販機, a utility pole with a transformer,
a 止まれ road marking, a カーブミラー, a ブロック塀, a konbini or 酒屋
shopfront.

> **Asset production (user decision, 2026-09-30).**
> * Nothing is bought or downloaded.
> * Fixed-shape models are built in **Blender from Python (bpy) scripts
>   written by Claude**, run headless and exported to GLB.
> * Parametric, user-configurable pieces are generated in app code.
>
> This matches CLAUDE.md §16–17 (GLB, Blender).

This document locks the decisions and sets the order of the work. Each
stage gets its own implementation doc (same format as
`Phase-3-Implementation.md`) when it starts.

---

## 0. Starting Point (verified 2026-09-30)

* Phase 1–2 editor is complete. Phase 3 is implemented but was
  **uncommitted** when this was written. It includes the registry, 8
  procedural types and the street-strip plot.
* All geometry is procedural. Each object is a tree of JSX `<mesh>`
  elements, one draw call per part. Materials are flat `palette.ts`
  colors. No GLB is loaded anywhere.
* **Blender is not installed** on the dev machine.
* World scale is `METERS_PER_UNIT = 6`. The plot is 8.4 × 4.5 units, which
  is about **50 × 27 m** in real terms, and holds only two 6 m buildings.
  That is a large part of why the scene feels sparse next to the
  reference.
* `SCENE_FILE_VERSION = 1`. On import, `sceneValidator.ts` throws away
  `environment` and `camera` and always substitutes the defaults.
* Lighting is ambient + hemisphere + one directional light, with a
  1024² shadow map. There is no environment map and no post-processing.

## 1. Gap to the Reference

| Aspect | Reference | Now | Closed by |
|---|---|---|---|
| Detail density | Hundreds of small parts | ~10–30 primitives per object | Stages 3, 5, 6 |
| Materials | Texture, grime, wear | Flat colors | Stage 3 (bevels and AO/grime baked in Blender) |
| Light | Warm interior spill, AO, soft shadows | 1 sun, hard-ish shadows | Stages 2, 7 |
| Miniature read | High 3/4 view, shallow focus, dark plinth | Ortho, no DoF | Stages 2, 4 |
| Architecture | 3 floors, balcony, rooftop, lit shopfront | 1 block house | Stage 5 |
| Vegetation | Dense autumn canopies, fallen leaves | Few blobs | Stages 3, 6 |
| Vehicles, people | Yes | None | Stage 3 |
| Street | L-road around corner, crosswalk | Straight strips | Stage 4 |

**Expectation.** Scripted Blender models get real bevels, modifiers
(array, solidify, curve) and baked ambient occlusion and grime. That
brings them much closer to the reference than primitives in app code.
They will still read as stylized rather than photographed, which is the
intended direction anyway (CLAUDE.md §5).

---

## 2. Locked Decisions

### L1 — World scale becomes 1 unit = 1 m, now

Why:

* Blender works in meters, and CLAUDE.md §18 already specifies meters.
* Small props (0.8 m AC unit, 0.3 m pot) need a fine snap grid. At 6 m
  per unit the grid values become awkward fractions.
* Only 8 types exist today. This is the cheapest the migration will ever
  be.

How:

* `METERS_PER_UNIT = 1`. Values in `worldScale.ts` are expressed in meters.
* **Legacy procedural objects** keep their geometry code unchanged. The
  registry renders them inside a single `LEGACY_UNIT_SCALE = 6` wrapper
  group. Old-unit constants used only by those components (pole height,
  power-line attach points) move next to the components. The wrapper is
  removed per asset as each one is rebuilt.
* Ground, Road and Sidewalk convert their few constants to meters
  directly.
* Everything else expressed in world units is re-tuned in one pass:
  * camera presets: position ×6, zoom ÷6
  * orbit distance and zoom limits
  * `focusOn` constants
  * shadow frustum and far plane
  * fog
  * spawn bounds
  * validator `POSITION_LIMIT`
* Grid options become `0.1 / 0.25 / 0.5 / 1` m, default 0.5 m
  (CLAUDE.md §23).
* **Scene file v2.** `migrateScene()` runs before validation. For v1 → v2
  it multiplies `position` by 6 and leaves rotation and scale unchanged
  (the legacy wrapper keeps the rendered size).
* Versioning rule from here on: bump the version only for changes in
  meaning. Purely additive optional fields (`params`, `parentId`, new
  environment fields) are filled with defaults by the validator and do
  not bump the version.

### L2 — Two production lanes, nothing bought or downloaded

| Lane | Used for | How |
|---|---|---|
| **Blender, scripted by Claude** | Fixed-shape assets: building modules, vending machine, utility pole + transformer, AC unit, rooftop items, sign frames, road furniture (カーブミラー, mailbox, bins, manhole cover), kei car, bicycle, trees, figures, scatter pieces | One bpy script per asset, run headless. Output is a GLB plus preview renders. |
| **App code** | Parametric or user-configured pieces: base and road surface, curbs, block walls / fences / railings by length, power-line wires, building assembly from modules, scatter layout, signage text | TypeScript components and builders |

* Nothing is purchased, no asset packs are downloaded, and there are no
  HDRI files and no AI-generated meshes.
* Blender itself is free software. It is a tool, not an asset.
* Signage text is drawn at runtime with Canvas 2D, so users can change a
  shop's name. It uses the OS Japanese font stack: Yu Gothic, Hiragino
  Sans, Meiryo, Noto Sans JP.

### L3 — Blender pipeline

* **Folders:**
  * `art/blender/lib/`: palette loader, material setup, bevel/modifier
    helpers, bake, glTF export, preview renders
  * `art/blender/assets/<category>/<name>.py`: one script per asset
  * `art/blender/build.py`: the runner
* **Command:**
  `blender --background --factory-startup --python art/blender/build.py -- <asset|all>`
* **Output:**
  * `public/models/<category>/<name>_NN.glb`
  * `art/previews/<name>.png`, holding a 3/4 view and a scale check
    beside a 1.7 m figure and a 2 m door
* **Source of truth.**
  * **The script is the source.** Scripted assets don't commit `.blend`
    files, because they can be regenerated.
  * If you finish an asset by hand in the Blender GUI, its `.blend`
    becomes the source instead. It is listed as hand-finished in
    `build.py`, and the runner never overwrites it.
* **Colors.** Scripts read `palette.ts` directly with a simple parse of
  `key: "#hex"` lines, so `palette.ts` stays the single color source.
* **Version.** The Blender version is pinned in `build.py`, because the
  bpy API changes between versions. The runner refuses to run on other
  major versions.
* **Review loop.**
  * Claude renders the previews, reads the PNGs and iterates on shape,
    scale and color.
  * You review the same PNGs.
  * The Blender GUI is only needed if you want to hand-finish something.

### L4 — Materials and loading in the app

* **In Blender:**
  * palette colors are written as a color attribute (vertex colors)
  * ~~ambient occlusion and grime are baked on top with Cycles "bake to
    color attribute"~~ Changed during Stage 3 (user decision): assets
    built from then on skip the bake; the first four keep it.
  * the result is exported as `COLOR_0`
* **Material slots** use fixed names: `base`, `emissive` (windows, signs,
  vending fronts) and `printed` (surfaces that receive the Canvas
  graphics atlas).
* **In the app**, those names are remapped to three shared materials:
  * a vertex-color `MeshStandardMaterial`
  * an emissive material
  * a printed material
* **At most 3 draw calls per object.**
* **Loading:**
  * `useGLTF` + drei `<Clone>` with shadows on
  * a per-object `Suspense` placeholder, so one loading asset never
    blanks the scene
  * default-scene models are preloaded
* **Compression:** none at first, since low-poly GLBs are small. Add
  meshopt via `npx @gltf-transform/cli` only if file sizes warrant it.
* **App-code lane:** parametric pieces use the same palette and shared
  materials. Their sub-parts are merged with `mergeGeometries` (which
  ships with three), so they respect the same draw-call budget.

### L5 — Render look: pull post-processing forward

This scope is approved now. Normally it would sit in Phase 4–5.

* Add `@react-three/postprocessing`. Use the v3 line, which targets
  R3F 9 / React 19. Verify peer dependencies at install time.
* **Editor:**
  * ~~AgX~~ **Neutral** tone mapping. Changed during Stage 2: AgX greyed
    the pastel palette; see [Stage-2-Implementation.md](Stage-2-Implementation.md)
    D2.
  * a procedural environment map: drei `<Environment>` built from
    `<Lightformer>`s, with no HDRI file
  * soft shadow filtering at 2048²; use whichever method three 0.184
    supports cleanly (PCF radius or drei `SoftShadows`)
* **Preview** (and later Photo) adds:
  * N8AO
  * Bloom with a high threshold, so only emissive windows and signs bloom
  * TiltShift2
  * the ToneMapping effect inside the composer, because renderer tone
    mapping does not apply to offscreen targets
* **Preview camera:** perspective with FOV ≈ 28°, framed like the
  isometric preset. Editing stays orthographic (CLAUDE.md §24).

### L6 — Building module grid

* Facade bay: **1.82 m** (1 ken).
* Ground floor: **3.2 m**. Upper floors: **2.8 m**. Rooftop parapet:
  **1.1 m**.
* Tune these once against the Stage 0 blockout, then freeze them before
  any building-module script is written.

### L7 — Hero scene (the benchmark and the scope cap)

Theme: an autumn street corner at golden hour turning to dusk, with the
shop lights coming on.

* **Base:** corner plot **16 × 16 m** on a dark plinth. All positions
  and sizes are in [Hero-Layout.md](Hero-Layout.md).
* **Street:**
  * L-shaped narrow road wrapping two sides, ~5 m wide, no center line,
    white edge lines
  * crosswalk at the corner, stop line + 止まれ
  * manhole, 側溝 grates, カーブミラー, existing stop sign
* **Hero building:** 3-floor corner shop-house.
  * 1F: small shop (酒屋 / grocery) with glass sliding doors, lit
    interior, awning, vertical kanban
  * 2F: residence with balcony, laundry, AC units
  * Rooftop: railing, water tank, small prefab shed, pots, chair
* **Infrastructure:** utility pole + transformer, wires running off the
  plot, meter box.
* **Props:** 2 vending machines, bicycle, mailbox, recycling bin,
  potted-plant cluster, A-frame sign.
* **Vehicles:** 1 kei car.
* **Nature:** 2 autumn tree variants (ginkgo yellow, zelkova orange),
  hedge, block wall, fallen leaves.
* **People:** 2–3 faceless figures in the style of model-railway
  figures. This adds a `People` category to the CLAUDE.md §15 taxonomy.

**Rule:** no assets outside this list until the hero scene passes the
CLAUDE.md §49 gate. The finished scene ships as a built-in starter
template, which also serves as the future Remix seed.

### L8 — Asset conventions and budgets

* Units are meters. The origin is at the ground-contact center.
* The front faces +Z in three, which is −Y in Blender. Export with +Y up
  and transforms applied.
* Names follow CLAUDE.md §17, for example `prop_vending_machine_01.glb`.

| Kind | Triangle budget |
|---|---|
| Small prop (AC, pot, sign) | ≤ 1.5k |
| Medium prop (vending machine, bicycle, figure) | ≤ 5k |
| Vehicle | ≤ 10k |
| Tree | ≤ 15k |
| Building module | ≤ 3k each; assembled building ≤ 40k |
| Whole hero scene | ≤ 500k |
| Draw calls per object | ≤ 3 |

---

## 3. Stages

The scale migration comes **before** look-dev. AO radius, shadow bias and
the light frustum are all in world units, so doing look-dev first would
mean tuning them twice.

### Stage 0 — Setup, pilot, layout

* Commit the Phase 3 work.
* Install Blender at the pinned LTS version.
* **Pilot.** Claude scripts one asset end to end: the vending machine,
  from script to GLB to preview render.
  * This proves scripted-Blender quality before the rest of the plan
    depends on it.
  * If the result does not clearly beat the current procedural vending
    machine, revisit L2.
* Capture baseline screenshots from the isometric and front presets.
* Write `plan/Hero-Layout.md`: a top-down layout of the hero scene with
  every dimension in meters. It covers the base, road widths, crosswalk,
  building footprint in bays, pole, trees, car and figures.
* Build a scripted **gray-box blockout** of the hero scene in Blender
  from the layout sheet. Render it from the intended 3/4 angle.
* Freeze the base size and the L6 dimensions.

**Done when:**

* The pilot is approved.
* The layout sheet is agreed.
* The blockout render reads like the reference composition.

**Status (2026-09-30):**

* [x] Commit the Phase 3 work. It is in `56ec1f5` and was merged via
      PR #2.
* [x] Blender 5.2.2 LTS installed. The pinned version is set in
      `art/blender/build.py`.
* [x] Pilot approved: `prop_vending_machine_01`, 3,144 triangles, 2 draw
      calls. It is the style benchmark for all later assets.
* [x] Baseline screenshots, taken with `scripts/capture-presets.mjs` at
      the start of Stage 1.
* [x] Layout sheet agreed: [Hero-Layout.md](Hero-Layout.md). It was
      merged in PR #3.
* [x] Blockout rendered by `art/blender/blockout/hero_blockout.py` into
      `art/previews/hero_blockout_{view,top}.png`.

### Stage 1 — Scale migration

**Status:** implemented and verified on branch `stage1-scale`, 2026-09-30.
See [Stage-1-Implementation.md](Stage-1-Implementation.md) §6.

* Apply L1 across `worldScale.ts`, `assetRegistry.ts` (legacy wrapper and
  footprint radii), `cameraPresets.ts`, `sceneDefaults.ts`,
  `CameraControls.tsx`, `SceneLighting.tsx`, `DioramaCanvas.tsx` (fog,
  grid), `objectDefaults.ts`, `sceneValidator.ts`, `EditorSubToolbar.tsx`
  (grid options) and the ground components.
* In `sceneSerializer.ts`: `SCENE_FILE_VERSION = 2` and `migrateScene()`.
* Load the blockout GLB in the app behind a dev flag, using a plain
  `useGLTF` call. It becomes the lighting target for Stage 2.

**Done when:**

* Before/after screenshots at all 4 presets match.
* A v1 autosave and a v1 exported file load in the right place.
* Snap, focus and camera presets behave as before.
* The blockout sits correctly on the plot.
* Lint and build pass.

### Stage 2 — Look-dev

**Status:** implemented and verified on branch `stage2-lookdev`,
2026-09-30. See [Stage-2-Implementation.md](Stage-2-Implementation.md).

* Install `@react-three/postprocessing`.
* `SceneLighting.tsx`:
  * 2048² shadows with the frustum fitted to the plot
  * tuned bias / normalBias
  * lower, warmer sun
  * the Lightformer environment as fill, with the hemisphere light
    reduced to match
* New `components/PostEffects.tsx`: the Preview-only effect stack from L5.
* `CameraControls.tsx` + `cameraPresets.ts`: support the perspective
  Preview camera.
* Adjust emissive levels of windows and signs to the bloom threshold.

**Done when:**

* With the blockout and current assets, the Preview screenshot is clearly
  more "physical model" than the baseline.
* Frame rate with 100 objects on a normal desktop at 1080p: editor
  ≥ 50 fps, Preview ≥ 40 fps.

### Stage 3 — Blender pipeline and first hero assets

**Status:** implemented and verified on branch `stage3-assets`,
2026-09-30; previews approved 2026-10-01. See
[Stage-3-Implementation.md](Stage-3-Implementation.md) §7.

* **User decision during the stage:** new assets no longer get the baked
  AO and ground grime. The four assets built before that keep it; the kei
  car and bicycle do not. Organic shapes stay simple (the ginkgo is a
  foam crown).

* **Blender side:**
  * complete `art/blender/lib/`: palette loader, material slots,
    bevel/modifier helpers, AO/grime bake to color attribute, export,
    preview and scale-check renders
  * `build.py` runner with the version check
* **App side:**
  * `objects/GltfAsset.tsx`: `useGLTF` + `<Clone>` + remapping slot names
    to the shared materials
  * `objects/materials.ts` and `objects/textures/` (Canvas graphics
    atlas)
  * a per-object `Suspense` placeholder in `DioramaObject.tsx`
  * `modelUrl?` in the registry for preloading
* **First six assets.** Together they cover every hard case early:
  hard-edged prop, printed graphics, organic shape, curved vehicle body,
  thin tubes, human silhouette.
  * vending machine (from the pilot)
  * AC unit
  * autumn tree
  * kei car
  * bicycle
  * one figure

**Done when:**

* The previews are approved.
* Each GLB is within its L8 budget and uses ≤ 3 draw calls; check with
  `renderer.info`.
* The assets survive save, export and import.
* Side by side (§49), they read as one collection.
* The 100-object stress scene holds the Stage 2 frame-rate targets.

### Stage 4 — Base templates and road surface

**Status:** implemented and verified on branch `stage4-base`, 2026-10-01.
See [Stage-4-Implementation.md](Stage-4-Implementation.md) §7. The manhole
and grates are fixed details of the corner base until Stage 5 adds surface
snap; the curve mirror is a placeable asset.

* Add `environment.base: "street" | "corner"`. The field is additive and
  defaults to `"street"`.
* `Ground.tsx` delegates to `objects/ground/StreetBase` (today's strips)
  or `CornerBase`, the L-road built in app code from the layout sheet.
* Dark plinth sides with a slight bevel.
* Road markings from the graphics atlas: crosswalk, stop line + 止まれ,
  edge lines.
* Curb ramps at the crosswalk.
* From Blender: manhole cover, 側溝 grates, カーブミラー.
* The base is chosen in the New-diorama dialog and in the environment
  panel. Spawn bounds and grid follow the chosen template.

**Done when:**

* Both templates render.
* Old scenes load as `street`.
* The blockout's base pieces can be retired.

### Stage 5 — Modular building and surface attachment

This is the core stage: it is what lets users build the reference
without any modeling.

* **Modules from Blender**, all on the L6 grid: wall bay, window bay,
  shopfront bay, balcony bay, corner, parapet, roof pieces.
* **New `building` type**, driven by `params`:
  * bay counts X/Z
  * per-floor facade per side: `shopfront | windows | balcony | blank`
  * roof: `flat-rooftop | hipped-tile | shed`
* The app assembles instanced modules from `params`. Only the modules
  affected by a param change are rebuilt.
* Inspector: steppers for bays and floors, facade selects, roof select.
  The library offers presets such as "Shop-house 3F" and "House 2F".
  Legacy `house` and `shop` types remain for saved scenes.
* **Attachments from Blender:** AC, laundry, water tank, rooftop items,
  pots, sign frames. They use `parentId`:
  * transforms are local to the parent, and the child renders inside the
    parent group
  * deleting a parent deletes its children
  * duplicating copies the whole subtree
  * inspector has a "Detach" action
  * validator drops dangling parents and breaks cycles
* **Click-to-place** with a ghost preview and **surface snap**:
  * raycast onto any mesh
  * align the prop's front to the surface normal
  * grid snap within the surface plane
  * dropping onto a building sets `parentId`

**Done when:**

* The hero building can be built from a preset in under 5 minutes.
* Attachments follow moves.
* Undo/redo, duplicate, multi-select, lock/hide, save and import all stay
  correct when parent/child links are involved.

### Stage 6 — Density tools

* **Scatter brush** for fallen leaves, grass tufts, pebbles and small
  plants.
  * The pieces are small Blender GLBs.
  * Each scatter layer is one scene object: `type: "scatter"`,
    `params: { kind, seed, points }`.
  * Rendered with `InstancedMesh`.
* **Kits:**
  * saving a selection stores it as a kit (relative transforms, in
    localStorage)
  * kits appear under "Kits" in the browser
  * ship 4 built-in kits: vending corner, bike parking, shop-entrance
    clutter, rooftop set
* Duplicating nature props applies random jitter to rotation and scale.
* Asset browser thumbnails reuse the Blender preview renders.

**Done when:**

* The hero scene's small-detail density takes about 15 minutes to reach.
* 300+ instances cause no frame-rate drop.

### Stage 7 — Environment and Photo

* `environment.timeOfDay` has 5 presets: morning, day, golden hour,
  evening, night. Each preset drives:
  * sun color, angle and intensity
  * the sky gradient and the Lightformer setup
  * emissive levels of windows, signs and vending machines
* Evening and night:
  * a few non-shadow shop lights
  * an interior backplate (shelves, goods) behind the shop glass, made in
    Blender
* `environment.season` sets the foliage tint (autumn by default for the
  hero scene) and whether fallen leaves are visible.
* **Photo mode:**
  * aspect-ratio frames: 1:1, 4:5, 16:9
  * click-to-focus tilt-shift
  * exposure control
  * PNG export at 2–4× resolution
* The hero scene is saved as a built-in starter template.

**Done when:** at golden hour and at dusk, the hero scene passes the §49
gate when viewed side by side with the reference.

---

## 4. Scope Boundaries

| Stage | CLAUDE.md phase |
|---|---|
| 0 | Phase 0 (foundation: pipeline, layout) |
| 1 | Foundation for Phase 3 (§18 scale) |
| 2 | Parts of Phase 4 (lighting) and Phase 5 (DoF), pulled forward by L5 |
| 3 | Phase 3 (GLB assets, §16–17) |
| 4–5 | Phase 4 (roads, buildings) and §19–20 |
| 6 | Editor extension (Phase 2/3 tooling) |
| 7 | Phase 4 (time of day) and Phase 5 (photo) |

Not in this roadmap:

* weather (rain, snow, fog)
* terrain editor
* backend, auth, cloud save
* publishing, social features
* multiplayer

## 5. Risks

* **Scripted-Blender quality is unproven.** The Stage 0 pilot proves or
  disproves it before anything depends on it.
* **Organic assets (trees, figures) are the hardest to script.**
  * Both are among the first six assets in Stage 3.
  * Iterate on them early.
  * A stylized look is acceptable.
* **Asset volume is the bottleneck.**
  * Shared `lib/` helpers carry most of the reuse.
  * The L7 list caps scope.
  * Each asset is a short script plus a headless build that takes
    seconds.
* **Script output vs. hand edits.** The hand-finished rule (L3) stops
  the runner from overwriting manual work.
* **The bpy API changes between Blender versions.** The version is
  pinned, and the runner checks it.
* **Style drift between assets.**
  * One palette source, read from `palette.ts`.
  * Shared bevel and bake settings in `lib/`.
  * Side-by-side preview review for every new asset.
* **Missing Japanese fonts** on some systems, mainly Linux. Canvas text
  then falls back to a generic font. Acceptable for now.
* **Scale migration breaks tuned values.**
  * The migration is done as one isolated stage.
  * Screenshot diffs at every preset catch regressions.
* **Post-processing cost.**
  * The heavy effects run only in Preview and Photo.
  * The frame-rate targets are checked at each stage.
* **Parent/child complexity leaking into history and multi-select.**
  * The rules are fixed in Stage 5 before any code is written.
  * The scene stays a flat array with `parentId`, which keeps it
    serializable.
