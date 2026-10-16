# Stage 16 — Everyday People (Implementation Plan)

Follows [Stage-15-Implementation.md](Stage-15-Implementation.md). The
streets can now be built, but the people in them all stand still in the
same way: a pedestrian, a shopkeeper and a schoolchild, upright, arms down.
Nobody walks, sits on the bench, rides the bicycle or holds an umbrella in
the rain Stage 13 added.

**Goal:** six figures in everyday poses, built from one shared posable
figure in Blender, so a scene reads as a moment of ordinary life.

Branch: `stage16-people`, cut from `main` (Stage 15 is merged, PR #18).

> The user asked to carry out the next stage (2026-10-17) without naming a
> topic. "Everyday people" is the recommendation from the HANDOFF §7
> candidates. The plan was approved the same day ("hãy thực hiện"), with
> the open questions of §5 settled by their defaults.

---

## 1. Decisions

### D1 — One posable figure in `art/blender/lib/figure.py`

The three existing figures are each hand-placed tubes and blobs. A new
library module builds a figure from:

* **proportions** (height, build: adult, elder, child),
* **clothes** (palette keys for top, bottom, shoes, hair; optional skirt,
  apron, hat),
* **a pose**: angles at the hips, knees, shoulders and elbows, a forward
  lean of the trunk, a turn of the head.

The joints are computed from the angles, and the limbs are the same
tapered tubes and foam-simple blobs as the existing figures (the
model-railway look approved in Stage 3), so the new figures belong to the
same set. Props held in the hands (a bag, an umbrella, a cart handle) are
placed at the hand positions the pose returns.

The three existing figures are **not** rebuilt on it: they are approved
and in saved scenes.

### D2 — Six assets

| Type | GLB | Pose and size | What it is |
|---|---|---|---|
| `walker` | `people_walker_01` | mid-stride, 1.68 m | An adult walking, a canvas shopping bag (エコバッグ) in one hand |
| `sittingFigure` | `people_sitting_01` | seated, seat at 0.40 m | An adult sitting with hands on the knees. Its origin is the ground under its feet, so placed in front of the bench (seat 0.40 m) or a chair (0.43 m) it sits on it |
| `cyclist` | `people_cyclist_01` | riding, ≈ 1.8 × 0.6 m, 1.6 m tall | A rider on the city bicycle, feet on the pedals, the stand up. Heads +X like the bicycle |
| `umbrellaFigure` | `people_umbrella_01` | walking, 1.68 m, umbrella ⌀ 0.95 m | An adult walking under a clear vinyl umbrella (ビニール傘) |
| `elder` | `people_elder_01` | bent forward, 1.5 m | An elderly woman pushing a walker cart (シルバーカー) |
| `cat` | `animal_cat_01` | sitting, 0.3 m tall | A sitting cat, tail around its feet |

* Style rules as before: palette colors, no baked AO or grime, simple
  shapes, at most four draw calls, ≤ 5,000 triangles each.
* **The vinyl umbrella uses the `glass` slot** (its canopy is see-through,
  and the figure is under it). It casts no shadow, as all glass.
* **The cyclist reuses the bicycle:** the bicycle's geometry moves into
  `lib/bicycle.py` with a `stand` option; `prop_bicycle_01` calls it with
  the stand down and must rebuild to the same triangle count and the same
  look.
* All are in the **People** category; the cat is tagged `cat`, `neko`,
  `animal`.

### D3 — Placing figures on seats needs no new editor feature

The sitting figure is placed like anything else, in front of the seat it
sits on: its seat height matches the bench, and the chair is 3 cm higher,
which does not show. A snapping rule ("sit on this") is out of scope.

### D4 — The Residential Lane starter gets people

The walker, the elder with her cart, the cyclist on the lane and the cat
on the house's front wall replace the starter's standing pedestrian. The
hero corner and Back Street are not changed.

### D5 — One built-in kit

`bench-rest`: a bench, a sitting figure on it, a cat beside it.

---

## 2. Files

* New: `art/blender/lib/figure.py`, `art/blender/lib/bicycle.py`, six
  asset scripts (`assets/people/`), their GLBs and previews.
* Changed: `prop_bicycle_01.py` (calls `lib/bicycle.py`), `diorama.types.ts`
  (six types), `assetRegistry.ts` (six entries), `palette.ts` (a few
  clothes and fur colors), `builtInKits.ts` (one kit),
  `utils/residentialStarter.ts`, thumbnails, the starter's preview image.
* Docs: this file, `HANDOFF.md`, `Hero-Diorama-Roadmap.md`.

## 3. Out of scope

* Animation of any kind; figures stay still.
* Rebuilding the three existing figures on the posable figure.
* Clothes colors chosen per placed figure (each figure has one outfit).
* A "sit on" or "ride" snapping rule; drivers inside vehicles.
* Any backend work.

## 4. Verification

1. `build.py` for the six assets and the rebuilt bicycle: budgets and draw
   calls pass; each preview looked at. The bicycle's triangle count and
   preview are unchanged.
2. `npm run lint`, `npx tsc --noEmit`, `npm run build`.
3. **Scale and fit:** the sitting figure on the bench and on the chair, the
   cyclist beside a parked bicycle, the walker beside the pedestrian and the
   schoolchild; screenshots in the app. The umbrella in the rain.
4. The Residential Lane starter: re-captured preview; morning and rain
   screenshots, no page errors.
5. The hero and Back Street pixel-identical to `main` (apart from the new
   library thumbnails).
6. Frame rate of 100 of the heaviest new figure (`measure-scene.mjs`).

## 5. Open questions (defaults in bold)

1. **Which figures?** **The six of D2**; or fewer and more polish per figure.
2. **Rebuild the three existing figures on the new figure library?**
   **No** (D1).
3. **The umbrella:** **clear vinyl (glass slot)**, or an opaque colored one?
4. **People in the Residential Lane starter (D4)?** **Yes**; the other
   starters stay as they are.
5. **The cat's category:** **People**, or Nature?

---

## 6. Results (2026-10-17)

**Status:** implemented and verified on branch `stage16-people`. Not
committed; the user commits and merges.

### Assets

| Asset | Triangles / budget | Draw calls | GLB |
|---|---|---|---|
| `people_walker_01` | 1,624 / 5,000 | 1 | 110.9 KB |
| `people_sitting_01` | 1,544 / 5,000 | 1 | 113.0 KB |
| `people_cyclist_01` | 4,126 / 7,000 | 1 | 252.8 KB |
| `people_umbrella_01` | 1,944 / 5,000 | 2 | 134.3 KB |
| `people_elder_01` | 1,980 / 5,000 | 1 | 138.5 KB |
| `animal_cat_01` | 1,136 / 3,000 | 1 | 90.3 KB |

`prop_bicycle_01` rebuilt from `lib/bicycle.py`: 2,582 triangles as before,
and the GLB is byte-identical to `main`'s. `public/` is 7.2 MB.

### What was built

* **`art/blender/lib/figure.py`:** `figure(b, outfit, pelvis=…, feet=…,
  hands=…, height, yaw, lean, nod, foot_pitch, knee_pole, seated)` builds a
  figure from a pose with two-bone IK (`ik`) for knees and elbows, and
  returns its `Joints` (hands, head, …) for held props. `Outfit` holds the
  palette keys (top, bottom, shoes, hair, short sleeves, bun).
* **`art/blender/lib/bicycle.py`:** the bicycle's geometry, with
  `build_bicycle(b, stand=True)` and the rider's contact points (`PEDALS`,
  `GRIPS`, `SADDLE_TOP`).
* **`MeshBuilder.solid(…, orient=False)`** keeps face windings as given, for
  the umbrella's open canopy.
* **Types** `walker`, `sittingFigure`, `cyclist`, `umbrellaFigure`, `elder`,
  `cat`, all in People. **Palette:** `hairGray`, `clothMauve`, `catGinger`.
* **Kit** `bench-rest`; **starter:** the Residential Lane's standing
  pedestrian is replaced by a walker, the elder with her cart and a
  cyclist on the lane, and a cat on the house's front wall.

### Deviations from the plan

* **The sitting figure's origin is the floor under its seat,** not under its
  feet: placed exactly where a bench is (same position and heading) it sits
  on the bench, which is easier to line up than "in front of it". The kit
  puts it on the bench's left half.
* **The cyclist's budget is 7,000 triangles,** not 5,000: it is a bicycle
  (2,582) and a rider.
* **The seat heights in D2 and D3 were read wrong:** the bench's seat top is
  0.425 m (the figure uses that) and the chair's is 0.465 m, not 0.43 m
  (that is the middle of its seat slab).

### Verification

* `build.py` for the six assets and the bicycle: exit 0, within budget; each
  preview looked at. The sitting figure's hands were moved onto the thighs
  after the first preview (they crossed in front of the chest).
* `npm run lint`, `npx tsc --noEmit`, `npm run build`: clean.
* Thumbnails: 70 of 70 library items have one. The Residential Lane preview
  image re-rendered.
* **Headless Chrome, 4 of 4 checks, no page errors:** all six types load
  from an imported scene; the starter has its walker, elder, cyclist, cat
  and schoolchild; the Bench Rest kit places a bench, a sitting figure, a
  cat and weeds.
* **Looked at in the app:** a line-up of the schoolchild, the pedestrian and
  the five new figures (heights agree: child < elder < adults); the sitting
  figure on the bench and on the chair, from the front and from behind (on
  the seat, back near the backrest); the cyclist beside the parked bicycle
  (same bicycle, stand folded); the umbrella walker in the rain (the canopy
  reads as clear vinyl over the head); the line-up at night; the starter by
  morning and in the rain; the cat on the wall's cap.
* **Hero and Back Street against `main`** (seeded from the same files,
  `git stash` for the baseline): the hero is identical in every editor view
  and in Preview front, side and top; Back Street likewise, except 1,048
  pixels of the Properties panel's time-of-day row (x 1317–1553,
  y 276–319: its labels sit a pixel apart between the two captures; the
  canvas is identical). Preview isometric differs in both, framed
  mid-transition (HANDOFF §5). Back Street's preview image re-rendered with
  the same 23-pixel block as in Stage 15 and was restored from `main`.
* **Frame rate,** 100 cyclists (427,626 triangles, 104 draw calls) at
  1920 × 1080 headless: 180.1 fps in the editor and in Preview, at the cap.

### Known limitations

* **Figures are still:** one pose each, one outfit each; many walkers look
  alike.
* **Nothing snaps a figure onto a seat or a bicycle;** the sitting figure
  lines up by sharing the bench's position, and on the chair (seat top
  0.465 m) it sinks 4 cm into the seat, which the screenshots do not show.
* **The umbrella's canopy is one-sided glass:** seen from below (never from
  the editing cameras) it disappears; it casts no shadow; rain still falls
  through it.
* **The cyclist's left foot stops a few centimeters short of the low
  pedal** (the leg is fully stretched).
* **Blobs are axis-aligned,** so the cyclist's head and hands (turned 90°)
  are swapped, not rotated — fine for near-round shapes.
* **Not tried in the user's own browser.**
