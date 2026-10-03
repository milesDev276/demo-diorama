# Stage 9 — Finished Streets on a Plot (Implementation Plan)

Follows [Stage-8-Implementation.md](Stage-8-Implementation.md). Stage 8 made
the ground paintable; this stage closes the gap between a painted plot and
the hand-authored corner base, so a street of one's own reads as finished.

**Goal:** on a plot the user can lower the curb at a crosswalk, lay markings
that line up with the road, draw a wall, a guard rail or a fence with one
drag, and start from a furnished back street. The last legacy-unit street
furniture (the stop sign) is rebuilt in meters, and the legacy street strip
is no longer offered for new scenes.

Branch: `stage9-streets`, cut from `main` (Stage 8 is merged, PR #11).

> The user picked this stage from the proposals made after Stage 8 and asked
> for it to be carried out (2026-10-03), after a hydration warning was fixed
> first (§0). As in Stages 6–8 the open questions in §6 were settled with
> the defaults listed there.

---

## 0. Before the stage: the hydration warning

The user reported React's "A tree hydrated but some attributes of the server
rendered HTML didn't match the client properties".

* **Not reproducible in a clean browser:** `/` and `/diorama` load in
  headless Chrome with no hydration message. The editor is loaded with
  `ssr: false`, so nothing of it is server-rendered.
* **Reproduced exactly** by setting attributes on `<html>` and `<body>`
  before React hydrates — what browser extensions do (the message itself
  names that cause).
* **Fix:** `suppressHydrationWarning` on `<html>` and `<body>` in
  `app/layout.tsx`. It covers those two elements' own attributes only; a
  real mismatch deeper in the tree is still reported.
* The user's own attribute diff was not available, so the cause is inferred
  from the reproduction.

---

## 1. Decisions

### D1 — A curb ramp is a ground kind

`ramp`, letter `p`: a sidewalk paver whose edge toward the road is lowered to
2 cm above it (the corner base's `ramp.lip`). Each corner of the cell that
touches a lower cell is low, the others stay at sidewalk height, so one cell
beside a road is a ramp and a run of them is a dropped curb. No curb strip.
Its neighbors get the small side walls that close the gap. Additive: old
maps have no `p`.

### D2 — Markings line up with the road

`roadFrameAt(surface, x, z)` (`utils/surfaceMap.ts`) looks at the asphalt
around a point: the road runs along the axis on which the asphalt continues
further. The registry says how a marking uses it:
`road: { along: "x" | "z", center?: boolean }` — which of its own axes lies
along the road, and whether it is centered across it.

* Crosswalk: stripes across the road, centered on it.
* Stop line and parking bay: turned to the road; not centered.
* Road line: along the road.
* Only while placing with the pointer on a plot's asphalt; R still turns the
  ghost on top of it. Elsewhere markings behave as before.

### D3 — One more marking: `parkingBay`

2.5 × 5.0 m, three 0.1 m lines (two sides and the back). Bays placed side by
side share a line.

### D4 — Runs: drag to lay pieces end to end

Assets that tile get `tile: <length in meters>` in the registry: block wall
(2), hedge (1.2), road line (4), parking bay (2.5), and the new guard rail
and fence (2).

* While placing one of them, **a left drag lays a row** from the press to
  the release: as many whole pieces as fit, at least one, at most 40. The
  direction snaps to 15°. A click still places one piece.
* The ghost shows the whole row. One undo step; the pieces are ordinary
  objects afterwards.
* During such a placement the left drag no longer orbits (right-drag pans,
  the wheel zooms), as with the brushes.

### D5 — Blender: stop sign in meters, guard rail, fence

All without baked AO or grime, simple shapes.

| Asset | Size | Notes |
|---|---|---|
| `street_sign_stop_01` | 2.5 m | Replaces the legacy `sign` geometry (same type). Inverted red triangle, 0.8 m side, printed 止まれ (new atlas cell `sign_stop`). ≤ 1.5k |
| `street_guard_rail_01` | 2.0 × 0.8 m | White ガードレール: one post, a corrugated beam; tiles end to end. New type `guardRail`. ≤ 1.5k |
| `street_fence_01` | 2.0 × 1.2 m | Green wire-mesh fence (ネットフェンス) with a post; tiles end to end. New type `fence`. ≤ 1.5k |

### D6 — A starter scene on a plot

`assets/sceneTemplates.ts` gets a second built-in: **"Back Street"**, a
24 × 16 m plot at golden hour — a front road with a side lane, a corner
shop-house, a house, a paved forecourt with vending machines, a small
parking lot behind a fence, a garden, and the street furniture of this
stage. Built in code (`utils/plotStarter.ts`), its ground from rectangles.
A first visit still opens the hero corner.

### D7 — The street strip is retired from the UI

It is no longer offered in the New dialog or in the base switch, unless the
open scene already stands on it. Its geometry stays: old scenes and files
without an environment still load on it, unchanged.

### D8 — Out of scope

* curved or diagonal roads, more than two levels
* arrows, lane numbers, painted text other than 止まれ
* a parametric wall object (a run is separate pieces)
* converting old street-strip scenes to plots
* runs on walls or roofs of buildings (base only)

---

## 2. Milestones

* **M1** — hydration fix; `ramp` kind and its geometry.
* **M2** — road frame, marking alignment, `parkingBay`.
* **M3** — runs: registry `tile`, drag in `PlacementLayer`, `placeRun`.
* **M4** — Blender assets, atlas cell, registry, thumbnails.
* **M5** — Back Street starter, template image, street strip retired.
* **M6** — acceptance (§4), docs.

---

## 3. Files

| Change | Files |
|---|---|
| New (app) | `utils/plotStarter.ts` |
| Modified (app) | `app/layout.tsx`, `types/diorama.types.ts`, `assets/surfaceKinds.ts`, `assets/assetRegistry.ts`, `assets/sceneTemplates.ts`, `utils/surfaceMap.ts`, `utils/baseTemplates.ts`, `objects/ground/surfaceGeometry.ts`, `objects/ground/groundGeometry.ts`, `objects/RoadMarking.tsx`, `objects/textures/atlasLayout.json`, `objects/textures/graphicsAtlas.ts`, `components/PlacementLayer.tsx`, `components/DioramaCanvas.tsx`, `components/ScenePanel.tsx`, `components/NewSceneDialog.tsx`, `store/dioramaStore.ts` |
| Removed (app) | `objects/Sign.tsx` (replaced by the GLB) |
| New (Blender) | `assets/street/street_sign_stop_01.py`, `street_guard_rail_01.py`, `street_fence_01.py` |
| Generated | three GLBs and previews, thumbnails, `public/templates/back-street.webp` |
| Docs | this file; the roadmap; `HANDOFF.md` |

No new npm dependencies.

---

## 4. Verification

| Check | How | Target |
|---|---|---|
| Hydration | Headless load of `/` and `/diorama`, clean and with attributes injected on `<html>` / `<body>` | No hydration message either way |
| Existing scenes | `capture-presets.mjs` on the hero and a Stage 8 plot scene, vs. `main` | Differences only at the stop sign |
| Ramp | Geometry probe on a ramp cell beside a road; brush; old maps | Low corners at road + 0.02, high corners at 0; no gaps; maps without `p` unchanged |
| Marking alignment | Place each marking on a road along X and on one along Z | Turned to the road; crosswalk centered across it |
| Runs | Real drags: wall along X, hedge along Z, a diagonal, a click | Piece count = length / tile; end to end; one undo step; a click places one |
| Blender budgets | `build.py` on the three assets | Within budget, ≤ 3 draw calls, exit 0 |
| Stop sign | Old scene with a legacy sign | Same place and height; reads 止まれ |
| Starter | New → Back Street | Loads; every object stands on its ground; passes §49 in Preview |
| Street strip | New dialog, base switch on a plot and on an old street scene | Not offered; still shown and selectable on a street scene |
| Frame rate, 1920×1080 | Back Street, editor and Preview | Editor ≥ 50 fps, Preview ≥ 40 fps |
| Static checks | `npm run lint`, `npm run build` | Pass; no page errors |

---

## 5. Risks

* **A sloped cell breaks assumptions of "flat ground".** Placement and the
  scatter brush use the hit's normal; the ramp's slope (≈ 15°) stays within
  their flat threshold. Checked.
* **Left-drag is taken from the orbit controls** during a tiling placement.
  Limited to those assets and stated in the hint.
* **The legacy sign changes look** in old scenes (same height, real model).
* **Wire-mesh fence triangles.** Bars are four-sided and few.

---

## 6. Open Questions (settled with the defaults, 2026-10-03)

1. **The ramp is a paintable kind,** not derived from crosswalks.
2. **A run is separate objects,** not one parametric object.
3. **Run direction snaps to 15°.**
4. **The street strip stays loadable** but is not offered.
5. **The first visit stays the hero corner.**

---

## 7. Status — Implemented 2026-10-03

All milestones M1–M6 are done on branch `stage9-streets`. Nothing is
committed yet.

### Deviations from the plan

* **The shop-house and its attachments became a helper,** `shopHouse(x, z)`
  in `utils/objectDefaults.ts`, so the corner starter and Back Street build
  the same building. `place` and `run` are exported from there for the
  same reason.
* **The ramp's swatch is a two-tone chip** (`surfaceSwatch` in
  `assets/surfaceKinds.ts`): its color is the sidewalk's, so a plain swatch
  could not be told from it.
* **`scripts/capture-template.mjs` zooms a plot that is not 16 × 16 m** so it
  fills the frame as the corner does. `autumn-corner.webp` was re-rendered
  with it (the new stop sign is in it).
* **Back Street has no crosswalk over the side lane:** the lane is 3 m wide
  and the crosswalk object 4.05 m. The crosswalk crosses the front road.
* **Files the plan did not list:** `utils/objectDefaults.ts`,
  `utils/palette.ts` (`fenceGreen`), `components/GroundBar.tsx`,
  `components/ObjectLibrary.tsx`, `scripts/capture-template.mjs`.

### Assets

| Asset | Tris / budget | Draw calls | GLB |
|---|---|---|---|
| `street_sign_stop_01` | 104 / 1,500 | 2 | 9.8 KB |
| `street_guard_rail_01` | 120 / 1,500 | 1 | 6.9 KB |
| `street_fence_01` | 256 / 1,500 | 1 | 17.1 KB |

None has baked AO or grime. Only these three were built.

### Verification results

Headless Chrome on the GTX 1660 SUPER against the dev server, with real
pointer and key events, reading the store and renderer through `?dev=stats`.
The scenario scripts were one-off files and are not in the repo.

| Check | Result |
|---|---|
| Hydration | Clean browser: no message on `/` or `/diorama`, before and after. With attributes set on `<html>` and `<body>` before hydration: the user's message appeared before the fix and is gone after it. |
| Existing scenes vs. `main` (hero by day, 4 editor presets, canvas area) | 0.14–0.23 % of pixels differ, all at the stop sign and its shadow (`diff-edit-isometric.png`) |
| Stage 8 checks re-run (brush, undo, reseat, placement, sizes, round trip) | 40 / 40 |
| Ramp (5 checks) | Painted cells are `p` in the map; the high edge is at 0, the low edge at −0.13 (road + 0.02), the middle at −0.065; neighbors stay at 0 and are closed by two side walls; one undo step |
| Marking alignment (7 checks) | A crosswalk clicked on the front road lands turned 90° and centered at z 5.75; on the right road unturned, centered at x 5.75. A road line lies along X on the one and along Z on the other, where it was clicked. A stop line faces along its road. Off the asphalt a marking keeps its heading. R turns an aligned marking. |
| Runs (8 checks) | A 6 m drag with the block wall gives three pieces at x −5, −3, −1; a 4.8 m drag along Z gives four hedges turned −90°; a diagonal gives three guard rails 2.000 m apart at 45°. A run is one undo step with every piece selected, and undo removes it whole. A click places one piece. Assets that do not tile behave as before, and a drag with one places nothing. |
| Street strip | The New dialog offers two starters, the plot and the corner. The base switch has two options on a plot and three on an old street scene, which still loads on the strip. |
| Stop sign | The legacy `sign` renders the model: top at 2.50 m, 止まれ readable (`art/previews/stage9_stop_sign.png`) |
| Starter | New → Back Street: plot 24 × 16 m, golden hour, wood platform, 73 objects; every top-level object stands on its ground within 2 cm |
| Frame rate, 1920×1080 | Back Street: editor 180 fps, Preview 169; 92 draw calls, 126k triangles |
| Thumbnails | 45 of 45; both template images rendered |
| Visual gate (§49) | `art/previews/stage9_back_street_editor.png`, `stage9_crosswalk_ramp.png`, `stage9_junction.png`, `stage9_back_street_dusk.png`. Scale: rail, fence, sign and bays agree with the figures and the car. Materials: the new pieces sit in the palette. Detail: dropped curb at the crosswalk, driveway ramp, rail along the curb, 止まれ on the lane. Identity: a lane meeting a road, a shop on the corner, a fenced 月極 lot. |
| `npm run lint`, `npm run build` | Pass; no page errors in any run |

**Not done:** the hydration fix could not be checked against the user's own
browser; nothing was compared with the reference photo.

### Known limitations

* **A run is separate objects.** It cannot be lengthened afterwards, and its
  pieces are selected, moved and deleted one by one or as a multi-selection.
* **Runs go on the base only,** and at the height of the first piece: a run
  across a curb floats or sinks by 15 cm on the far side.
* **During a tiling placement the left drag does not orbit.**
* **A marking aligns only when placed with the pointer on a plot's
  asphalt;** on the corner base, and when moved with the gizmo, it does not.
* **The road's direction is the longer run of asphalt** from the clicked
  cell; in the middle of a junction that can be either road.
* **The ramp slopes within one 0.5 m cell,** and only toward a road beside
  it; an object's height on a ramp is not adjusted when the ground changes.
* **The parking lot of Back Street is mostly hidden** behind the house from
  the default view.
* **Old street-strip scenes are not converted;** the strip is still legacy
  geometry.
