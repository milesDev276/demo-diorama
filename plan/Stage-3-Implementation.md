# Stage 3 — Blender Pipeline and First Hero Assets (Implementation Plan)

Part of [Hero-Diorama-Roadmap.md](Hero-Diorama-Roadmap.md) (decisions L2,
L3, L4, L8).

**Goal:** Blender GLBs become a first-class asset kind in the app, and the
first six hero assets ship through that path. Together the six cover
every hard case early:

| Hard case | Asset |
|---|---|
| Hard-edged prop | AC unit |
| Printed graphics | vending machine (from the pilot) |
| Organic shape | autumn tree (ginkgo) |
| Curved vehicle body | kei car |
| Thin tubes | bicycle |
| Human silhouette | one figure |

Branch: `stage3-assets`, cut from `stage2-lookdev`. If Stage 2 merges into
`main` first, rebase onto `main`.

---

## 0. Starting Point (verified 2026-09-30)

* **Blender lib (`art/blender/lib/`)** already has:
  * `palette.py`: reads `palette.ts`
  * `builder.py`: `MeshBuilder`, which merges parts into one mesh, with
    `box` (bevel, cuts), `cylinder` (upright only) and `sphere`
  * `materials.py`: slots `base` and `emissive`
  * `finish.py`: Cycles AO bake, ground grime, per-face jitter, GLB export
  * `preview.py`: day, dusk and scale-check renders
  * `build.py`: version check, hand-finished set, triangle budget check
* **Missing in the lib:**
  * the `printed` slot and UVs
  * rotated and organic primitives (tubes, tori, blobs, extruded profiles)
  * per-asset weathering settings
  * preview framing for long or tall assets. The scale check crops
    anything taller than about 2 m.
  * a draw-call report
* **Pilot GLB:** `prop_vending_machine_01.glb` has 3,144 tris, 183 KB, 2
  primitives (`base`, `emissive`), `COLOR_0`, no UVs. The app does **not**
  load it yet.
* **App:**
  * Every registry entry is a procedural component. The only GLB loaded
    anywhere is the dev blockout, through a plain `useGLTF` + `<Clone>`.
  * The legacy vending machine is 14 meshes (14 draw calls), rendered
    ×6 to 1.32 × 2.04 × 1.02 m.
  * Lighting was tuned on flat legacy materials (Stage 2 §6).

---

## 1. Decisions

### D1 — The registry gets a second asset kind

`AssetDefinition` becomes a union. Shared fields stay as they are.

```ts
interface ProceduralAsset extends AssetBase { component: ComponentType; legacyUnits: boolean }
interface ModelAsset      extends AssetBase { modelUrl: string }  // meters, no legacy wrapper
export type AssetDefinition = ProceduralAsset | ModelAsset;
```

* `DioramaObject` renders `<GltfAsset url={asset.modelUrl} />` for model
  assets. Procedural rendering is unchanged.
* **New types** (camelCase, like the existing ones): `airConditioner`,
  `bicycle`, `keiCar`, `ginkgoTree`, `pedestrian`.
* **New category `People`**, as roadmap L7 specifies. It goes last in the
  browser order.
* **`vendingMachine` keeps its type and switches to the GLB.**
  * Saved scenes keep working with no migration and no version bump:
    `scale` still means "relative to the asset's natural size".
  * Existing vending machines get smaller, from 1.32 × 2.04 m to the real
    1.0 × 1.83 m. That is intended.
  * `objects/VendingMachine.tsx` is deleted.
* **The legacy green `tree` stays.** The ginkgo is a separate type (see
  §6, question 1).
* New types are purely additive. Older files validate as before, so
  `SCENE_FILE_VERSION` stays at 2 (roadmap L1 rule).

### D2 — Shared materials, remapped by slot name

New `objects/materials.ts` holds three module-level shared materials, so
every GLB instance reuses the same three programs:

| Slot | App material |
|---|---|
| `base` | `MeshStandardMaterial`, `vertexColors`, roughness ≈ 0.65 (tuned in M2), metalness 0 |
| `emissive` | the same, plus `emissive` white × `EMISSIVE_INTENSITY`. A small `onBeforeCompile` patch multiplies the emissive term by the vertex color, as the Blender material does. |
| `printed` | `vertexColors` + `map` = the graphics atlas (D4). Vertex colors carry the baked AO and grime, so prints weather like everything else. |

* An unknown slot name falls back to `base` and warns once in the console.
* **Emissive level is one uniform for all objects.** Stage 7 time of day
  then changes one number. Stage 3 sets it so vending fronts glow as
  subtly as the legacy windows do (Stage 2 D5).
* The GLB's own materials (`doubleSided: true`, from Blender) are never
  used, so they need no fixing.

### D3 — Loading: `objects/GltfAsset.tsx`

* **Template per URL.** `useGLTF(url)` returns the cached scene. A
  `WeakMap` builds one template per loaded scene: clone it, swap in the
  shared materials by slot name, and set `castShadow`/`receiveShadow`.
  Every instance is `<Clone object={template} />`, which shares geometry
  and materials. Nothing mutates the loader's cache.
* **Per-object `Suspense`** in `DioramaObject`, wrapped around the visual
  only. The group, gizmo and selection ring never suspend.
  * The fallback is a faint ghost cylinder sized from `footprintRadius`,
    so a loading asset never blanks the scene.
* **Per-object error boundary.** A missing or corrupt GLB shows the same
  ghost in a warning tint and logs once. It never crashes the canvas.
  This is part of the §48 definition of done.
* **Preloading.** After the first render, `DioramaCanvas` calls
  `useGLTF.preload` on every registry `modelUrl`. That is 6 files of about
  0.2–1 MB each, so the first "add" shows no placeholder flash. Revisit
  when the library grows (CLAUDE.md §43, lazy loading).

### D4 — Graphics atlas for `printed` faces

* **One layout file, read by both sides:**
  `features/diorama/objects/textures/atlasLayout.json` holds the canvas
  size (1024²) and named cells `[x, y, w, h]` in pixels.
  * Blender reads it with `json` to assign UVs.
  * The app imports it (`resolveJsonModule` is on) to know where to draw.
* **`objects/textures/graphicsAtlas.ts`** builds a single `CanvasTexture`
  lazily on the client:
  * sRGB, `flipY = false` to match glTF UV orientation, mipmaps,
    anisotropy 4
  * each cell has an 8 px gutter that repeats its edge color, so mipmaps
    don't bleed between cells
* **Text** uses the L2 font stack: Yu Gothic, Hiragino Sans, Meiryo,
  Noto Sans JP.
* **Stage 3 cells.** Everything is fictional: no real brands and no real
  plates.
  * `vending_ad`: a drink ad for the vending machine's lower-left panel.
    It replaces today's white panel with blue and green strips, with a
    bottle illustration, 緑茶, 新発売 and a price.
  * `plate_kei`: a yellow kei-car plate with black text, e.g. 練馬 580 /
    あ 12-34.
* **Later stages add cells:** 止まれ and markings in Stage 4, kanban and
  shop signs in Stage 5.
* **Blender UVs.** A part created with `print="<cell>"` puts only its
  outward face (default −Y, the front) into the `printed` slot. That face
  gets planar UVs into the cell:
  * u runs along the viewer's right (`up × normal`)
  * v runs down the face
  * the rest of the part stays `base`
* **Previews.** Blender does not have the runtime canvas. Printed faces
  render as blank light panels in the Blender previews. The in-app
  screenshots are the review surface for prints.

### D5 — Blender lib completion

* **`builder.py`:**
  * `box(..., rotation=)`
  * `cylinder(..., axis="x|y|z", radius_top=)` for frustums, wheels and
    limbs
  * `tube(points, radii, sides)`, a swept polyline with per-point radius,
    for branches, bike frames, handlebars, pipes and limbs
  * `torus(...)` for tires
  * `blob(center, radii, noise, seed)`, a displaced ellipsoid, for canopy
    clumps, heads and hair
  * `extrude(profile_2d, depth, axis, bevel)`, for the car body and chain
    guard
  * a `print=` option on `box` and `extrude` (D4)
* **`materials.py`:** add the `printed` slot (a vertex-color × light
  neutral material for previews). Slot order becomes `base, emissive,
  printed`. Faces carry the index, so the pilot is unaffected.
* **`finish.py`:**
  * `weather()` also darkens printed faces
  * an asset may set `WEATHER = {...}` to override strengths. For
    example, the tree and figure get little ground grime.
  * UVs are exported only when an asset has printed faces
* **`preview.py`:**
  * frame the day and dusk views from the bounding box instead of the
    height, so the 3.4 m car and the 8 m tree fit
  * the scale check fits the asset's height (today it crops the tree)
* **`build.py`:**
  * also reports draw calls (distinct slots used) against the ≤ 3 budget
  * fails the build if the triangle or draw-call budget is exceeded
* **Style constants stay shared** (bevel angle, AO distance, grime): the
  roadmap's main guard against style drift.

### D6 — The six assets

Every asset follows L8: meters, origin at the ground-contact center, the
viewer-facing side on +Z in the app (−Y in Blender). All six are
benchmarked against the pilot's detail, bevels and weathering.

| Asset (file) | Type / category | Size w × h × d (m) | Tri budget | Draw calls | Content |
|---|---|---|---|---|---|
| `prop_vending_machine_01` | `vendingMachine` / Props | 1.0 × 1.83 × 0.7 | ≤ 5k (3.1k now) | 3: base, emissive, printed | The approved pilot. **Only change:** the lower-left ad panel becomes `print="vending_ad"`. |
| `prop_ac_unit_01` | `airConditioner` / Props | 0.78 × 0.62 × 0.30 | ≤ 1.5k | 1 | 室外機: bevelled casing, round fan grille with bars, side louvres, service cover, 2 taped refrigerant pipes, plastic feet |
| `prop_bicycle_01` | `bicycle` / Props (CLAUDE.md §17 name) | 1.8 × 1.0 × 0.6, length along X | ≤ 5k | 1 | ママチャリ: step-through frame, front basket, fenders, chain guard, rear carrier, center stand down, bell, dynamo lamp. Heads +X, so the chain side faces the viewer. |
| `vehicle_kei_car_01` | `keiCar` / Vehicles | 1.48 × 1.70 × 3.40 | ≤ 10k | 2: base, printed | Generic tall-wagon kei car, no brand cues: extruded, bevelled body with a narrower greenhouse, dark glass, wheels and hubcaps, lamps, mirrors, door gaps, yellow plates front and rear |
| `nature_tree_ginkgo_01` | `ginkgoTree` / Nature | canopy Ø 5, 8 tall | ≤ 15k | 1 | Street イチョウ: straight tapering trunk, up-angled branches, conical-oval crown of displaced clumps in 3–4 autumn yellows with AO depth |
| `people_pedestrian_01` | `pedestrian` / People | 1.65 tall | ≤ 5k | 1 | Faceless model-railway figure: standing, muted clothes, hair cap, shoes. Size varies through the object's scale. |

**Palette additions** (in `palette.ts`, regex-friendly `key: "#hex",`):
ginkgo yellows, bark, car body, car glass, tire, metal, bike frame,
plate yellow, cloth, skin, hair. They are tuned during preview review and
kept restrained (CLAUDE.md §5: no saturated game colors).

**Registry values:**

| Type | Icon | `footprintRadius` | Random spawn rotation |
|---|---|---|---|
| `airConditioner` | `AirVent` | 0.55 | no |
| `bicycle` | `Bike` | 1.0 | no |
| `keiCar` | `CarFront` | 1.9 | no |
| `ginkgoTree` | `TreeDeciduous` | 2.6 | yes |
| `pedestrian` | `PersonStanding` | 0.45 | no |
| `vendingMachine` | unchanged | 1.2 → 0.8 | no |

### D7 — Verification tooling (small, kept in the repo)

Every later stage has a frame-rate and draw-call check, so the helpers
that were one-offs in Stage 2 move into the repo (HANDOFF §4):

* **`/diorama?dev=stats`:** `components/dev/DevRendererHandle.tsx` sets
  `window.__dioramaRenderer = gl`, following the `?dev=blockout` pattern.
  Nothing happens without the flag.
* **`scripts/measure-scene.mjs`:**
  * builds a grid scene from `--types a,b,c --count N`, or takes
    `--seed-scene <file>`
  * opens it through `capture-presets.mjs`'s exported `Cdp` and
    `launchBrowser`
  * reports editor and Preview fps (rAF count, 1920×1080), plus
    `renderer.info` draw calls and triangles in the editor pass
* **Per-object draw calls:** measured as the delta between a scene with
  one instance and the empty scene. three r184 resets `renderer.info`
  after the shadow pass, so the numbers are main-pass draws only.

### D8 — Out of scope for Stage 3

* the zelkova (second tree), the other hero figures, and every other L7
  asset
* instancing, scatter and kits (Stage 6)
* asset-browser thumbnails from the previews (Stage 6)
* AC as a wall attachment with `parentId` (Stage 5)
* time-of-day emissive levels (Stage 7)
* rendering the atlas into the Blender previews
* changes to the default scene. It picks up the new vending machine
  automatically; nothing else is added.
* lighting changes, unless the M2 check shows GLBs clearly off. In that
  case, material and weathering values are tuned before lights, and any
  change is recorded as a decision here.

---

## 2. Milestones

### M1 — Blender lib (D5)

* Add the primitives, the `printed` slot, `atlas.py` (layout + UV math),
  weathering overrides, preview framing and the draw-call report.
* **Regression check:** rebuild the pilot **before** its ad-panel change.
  The triangle count and draw calls must be identical, and the previews
  must pixel-match the committed ones apart from Cycles noise.

### M2 — App loading path, proven with the pilot (D1–D3)

* Registry union, `materials.ts`, `GltfAsset.tsx`, per-object `Suspense`
  and error boundary, preload.
* Switch `vendingMachine` to the GLB and delete the legacy component.
* **Checks:**
  * GLB colors match `palette.ts`: pixel-sample the vending body against
    a flat-material reference under the same light
  * roughness and emissive tuned against the Blender preview and the
    legacy windows
  * lighting re-check with GLB + legacy side by side (Stage 2 §6)
  * a 404 URL shows the warning ghost, and the canvas survives

### M3 — Graphics atlas + `printed` (D4)

* `atlasLayout.json`, `graphicsAtlas.ts`, the printed material.
* Vending machine ad panel → `print="vending_ad"`, then rebuild.
* **Check in the app:** text reads correctly, not mirrored or flipped,
  from the front; no cell bleeding when zoomed out (mip levels).

### M4 — Five new assets, one at a time

Order: AC unit → ginkgo → figure → kei car → bicycle. The organic assets
come early, as the roadmap's risk list asks.

For each asset:

1. Write the script and build it (budgets enforced).
2. Claude reads the day, dusk and scale renders and iterates on shape,
   scale and color until it matches the pilot's level.
3. Add the registry entry and palette keys.
4. Check it in the app: placement, orientation (+Z), selection ring,
   transform, shadows.

### M5 — Review pack for approval

* Every asset's `*_day / *_dusk / *_scale.png`.
* An **in-app lineup**: all six side by side on the plot, in the editor
  and in Preview, at the isometric and front presets (§49 side-by-side).
* One review round with the user. Rejected assets go back to M4.

### M6 — Acceptance

The checks in §4, then the status section of this document, the roadmap
status and `HANDOFF.md`.

---

## 3. Files

| Change | Files |
|---|---|
| New (Blender) | `art/blender/lib/atlas.py`; `art/blender/assets/props/prop_ac_unit_01.py`, `props/prop_bicycle_01.py`, `vehicles/vehicle_kei_car_01.py`, `nature/nature_tree_ginkgo_01.py`, `people/people_pedestrian_01.py` |
| Modified (Blender) | `art/blender/build.py`, `lib/builder.py`, `lib/materials.py`, `lib/finish.py`, `lib/preview.py`, `assets/props/prop_vending_machine_01.py` (ad panel only) |
| Generated | `public/models/{props,vehicles,nature,people}/*.glb`; `art/previews/<name>_{day,dusk,scale}.png` |
| New (app, under `features/diorama/`) | `objects/GltfAsset.tsx`, `objects/materials.ts`, `objects/textures/atlasLayout.json`, `objects/textures/graphicsAtlas.ts`, `components/dev/DevRendererHandle.tsx` |
| Modified (app) | `assets/assetRegistry.ts`, `types/diorama.types.ts`, `components/DioramaObject.tsx`, `components/DioramaCanvas.tsx`, `utils/palette.ts` |
| Deleted | `objects/VendingMachine.tsx` |
| Tooling | `scripts/measure-scene.mjs` |
| Docs | this file; roadmap Stage 3 status; `HANDOFF.md` |

No new npm dependencies. `mergeGeometries`, `CanvasTexture` and
`useGLTF` all ship with three and drei.

---

## 4. Verification

| Check | How | Target |
|---|---|---|
| Budgets | `build.py all` output | Every asset within its L8 triangle budget and ≤ 3 draw calls; the build fails otherwise |
| Draw calls in the app | `measure-scene.mjs`, one instance vs. empty | Main-pass delta = the build report (≤ 3) |
| Previews | M5 review | Approved by the user |
| Collection consistency | In-app lineup, editor + Preview (§49: scale, materials, lighting, detail, Japanese identity) | Reads as one set |
| Prints | Zoomed crops of the ad panel and plates | Correct orientation, no bleeding, Japanese font used |
| Save / export / import | Autosave → reload; export → import; `--seed-scene` with the new types | Every object back in place; the file stays v2 |
| Old scenes | Seed a v1 and a v2 scene containing `vendingMachine` | Load, now with the GLB |
| Failure path | Registry URL temporarily pointed at a missing file | Warning ghost, canvas keeps running |
| Frame rate | `measure-scene.mjs --types <the six> --count 100`, 1920×1080 | Editor ≥ 50 fps, Preview ≥ 40 fps (Stage 2 targets) |
| Regression | `capture-presets.mjs` at all 4 presets vs. `stage2-lookdev` | Only the vending machine changes |
| Static checks | `npm run lint`, `npm run build` | Pass, no page errors |

---

## 5. Risks

* **The tree and figure may look "blobby"** instead of stylized.
  * Both come early in M4. Iterating on the preview renders is cheap
    (seconds per build).
  * A stylized look is acceptable (roadmap §5).
* **Thin tubes (bicycle) alias** in the zoomed-out ortho view.
  * Tube radius ≥ 1.5 cm keeps them visible. MSAA is already on.
  * If they shimmer badly, they get thicker in the stylization rather
    than taking a rendering fix.
* **Baked AO + N8AO darken twice** in Preview. Check this in M2. If
  needed, lower the baked `ao_strength` for all assets rather than per
  asset.
* **The emissive shader patch** relies on three's chunk names (r184).
  * It is isolated in `materials.ts` and covered by the M2 visual check.
  * A three upgrade must re-check it.
* **The vending machine gets smaller** in existing scenes (1.32 → 1.0 m
  wide). This is intended real scale, and it is called out in the report.
* **The atlas becomes a shared bottleneck** once many assets print on it.
  Cells are named and the layout is data, so it can grow to 2048² or a
  second page without touching assets.

---

## 6. Open Questions (approved 2026-09-30 with the defaults)

1. **Tree:** ginkgo as a new `ginkgoTree` type; the legacy green `tree`
   stays.
2. **Pilot change:** only the vending machine's ad panel became printed
   graphics.
3. **Figure:** a standing "Pedestrian", 1.65 m.
4. **Review:** one review round at M5 for all six assets.

---

## 7. Status — Implemented 2026-09-30

All milestones M1–M6 are done on branch `stage3-assets`. The user
approved the previews on 2026-10-01 (M5).

### Deviations from the plan

* **No baked AO or grime on new assets (user decision, mid-stage).**
  * The user asked to drop the "shadow effect" for now. On clarification
    this means the Blender AO bake and ground grime, not runtime shadows.
  * Assets built before the decision keep it: vending machine, AC unit,
    ginkgo, pedestrian. The kei car and bicycle set
    `WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}`.
  * `weather()` now skips the Cycles bake entirely when
    `ao_strength` is 0. Per-face jitter stays.
  * Runtime cast shadows in the app are unchanged.
* **The ginkgo is a simple foam crown (user direction: "xốp thôi, không
  cần chi tiết").**
  * Iteration 1, 32 smooth clumps in four contrasting yellows: read as a
    bunch of potatoes.
  * Iteration 2, 600 small faceted clusters: too busy.
  * Final: 30 overlapping clumps with a finer noise octave (`blob(...,
    bumps=)`), in close yellows.
* **Printed faces need interior vertices.** The first printed ad panel was
  a single quad. Its four corners sit against the poster frame, so baked
  AO darkened the whole print to about 77 %. The panel now uses `cuts=4`,
  so only its edges darken.
* **The atlas background is a neutral paper tone,** not transparent black.
  Otherwise the smallest mip levels darken prints seen from far away.
* **Dev handle.** `?dev=stats` exposes the R3F state getter as
  `window.__dioramaThree()`, not just the renderer. Verification scripts
  also need the scene and camera for close-ups.
* **Draw calls are main-pass only.** three r184 resets `renderer.info`
  after the shadow pass, so shadow draws are never counted.
* **No spokes on the bicycle wheels.** They read as rings at diorama
  distance, which fits the "not too detailed" direction.

### Tuned values

| Value | Result |
|---|---|
| `EMISSIVE_INTENSITY` | 0.55. Vending fronts glow about as much as the legacy windows. |
| Base roughness | 0.65 |
| Vertex colors vs `palette.ts` | Match. The vending top samples at 0.88 × the flat reference, which is exactly its authored `shade=0.88`. |

### Assets

| Asset | Tris / budget | Draw calls (build = app) | GLB | Baked AO |
|---|---|---|---|---|
| `prop_vending_machine_01` | 3,456 / 5,000 | 3 | 248 KB | yes |
| `prop_ac_unit_01` | 1,288 / 1,500 | 1 | 84 KB | yes |
| `nature_tree_ginkgo_01` | 10,534 / 15,000 | 1 | 889 KB | yes |
| `people_pedestrian_01` | 1,544 / 5,000 | 1 | 107 KB | yes |
| `vehicle_kei_car_01` | 2,376 / 10,000 | 2 | 189 KB | no |
| `prop_bicycle_01` | 2,582 / 5,000 | 1 | 143 KB | no |

`build.py all` builds all six in 14 s and exits 0.

### Verification results

All app checks ran in headless Chrome on the GTX 1660 SUPER, against the
running dev server.

| Check | Result |
|---|---|
| M1 regression (pilot rebuilt with the new lib, before its ad change) | Geometry identical: same 3,144 tris, max position diff 0. Colors differ only by Cycles AO noise (mean 0.0002). |
| Draw calls in the app, one instance vs. empty scene | 3 / 1 / 1 / 2 / 1 / 1, and triangle deltas equal the build reports |
| Prints | Text reads correctly (not mirrored or flipped); Yu Gothic renders. See `art/previews/stage3_print_closeup.png`. |
| Collection (§49) | In-app lineup at the isometric and front presets, editor and Preview: `art/previews/stage3_lineup_{preview,front}.png`. Relative scale holds (figure 1.65, vending 1.83, car 1.70, bicycle 1.0, tree 8 m). |
| Save / export / new / import / reload | All 6 objects come back with identical types and positions; files stay v2 |
| v1 file with `vendingMachine` + `keiCar` | Positions × 6, rendered as GLBs at the migrated positions |
| Failure path (GLB request blocked through CDP) | Red ghost in place, one console warning, canvas keeps running at ≈ 180 fps |
| Interaction on GLB objects | Select from the list and by canvas click, selection ring, gizmo, duplicate, delete, undo, hide: all correct |
| Frame rate, 100 objects (the six types), 1920×1080 | Editor 180 fps, Preview 180 fps: the headless frame cap. 194 draw calls, 359k tris. |
| Frame rate, 300 objects | Editor 176 fps, Preview 180 fps (493 draw calls, 1.09 M tris) |
| Default scene, 4 presets × editor/Preview vs. `stage2-lookdev` | Only the vending machine's region changes |
| `npm run lint`, `npm run build` | Pass; no page errors in any run |

### Known limitations

* **Blender previews show printed faces blank** (the ad panel, the kei
  plates). The in-app screenshots show the real prints.
* **Existing scenes' vending machines get smaller** (1.32 → 1.0 m wide),
  as intended.
* **The ginkgo GLB is the largest file (889 KB).** Meshopt compression
  (roadmap L4) becomes worthwhile once several trees are in the library.
* **Mixed weathering.** Four assets have baked AO and two do not, by the
  user's decision. Side by side the difference is subtle, because runtime
  shadows and Preview's N8AO still ground every object.
* **Canvas text depends on OS fonts.** This was already accepted in the
  roadmap risks.
