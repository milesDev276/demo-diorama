# Hero Scene — Layout Sheet

Part of [Hero-Diorama-Roadmap.md](Hero-Diorama-Roadmap.md), Stage 0.

This sheet is the **source of truth** for the hero scene's dimensions. The
blockout (`art/blender/blockout/hero_blockout.py`), the `CornerBase`
template and every hero asset size from it.

* All values are **meters**.
* Coordinates are app space:
  * X points right.
  * Y points up.
  * **Z points to the front**, toward the default isometric camera.
* The origin is the base center at lot level (y = 0).
* Ranges are written `from … to`.
* Blender scripts convert to Blender space as `(x, −z, y)`.

Blockout renders: `art/previews/hero_blockout_view.png` (hero view) and
`art/previews/hero_blockout_top.png` (top-down).

---

## 1. Base

```text
            x = −8                           1.7  2    3.5               8
   z = −8   ┌──────────────────────────────────┬───┬────┬────────────────┐
            │ ▒▒▒▒▒▒▒▒▒▒▒ block wall ▒▒▒▒▒▒▒▒▒ │hdg│ S  │   RIGHT ROAD   │
            │▒                    (zelkova)    │   │ I  │ [kei car]      │
            │▒                                 │   │ D  │           止まれ│
  z = −3.76 │▒ (ginkgo)   ┌─────────────┐      │   │ E  │     ─ stop ─   │
            │▒ bin VM VM  │    HERO     │▮kanban   │ W  │                │
            │▒      pots  │  BUILDING   │          │ A  │ ▥▥▥▥ crosswalk │
   z = 1.7  │▒            └─────────────┘          │ L  │                │
   z = 2    ├──────────────────────────────────────┘ K ◉ mirror         │
            │ 〒   ⚡pole    bike  A-frame   FRONT SIDEWALK │             │
   z = 3.5  ├───────────────────────────────────────────────┘             │
            │                    FRONT ROAD      (manhole)                │
   z = 8    └─────────────────────────────────────────────────────────────┘
                     ↓ +Z = front, toward the default isometric camera
```

The diagram is not to scale. The tables below are authoritative.

**Base size:** 16 × 16 m, x and z from −8 to 8. The roadmap estimated
~20 m. At 16 m the ~10 m building dominates the base, as in the
reference.

**Plinth:**
* dark, with a slight bevel
* runs from the road surface (y −0.15) down to y −1.35
* roads run straight off the base edges, like a cut-out of a real street

| Area | x | z | Top y |
|---|---|---|---|
| Front road | −8 … 8 | 3.5 … 8 | −0.15 |
| Right road | 3.5 … 8 | −8 … 3.5 | −0.15 |
| Front sidewalk | −8 … 3.5 | 2 … 3.5 | 0 |
| Right sidewalk | 2 … 3.5 | −8 … 2 | 0 |
| Lot | −8 … 2 | −8 … 2 | 0 |

**Roads:**
* 4.5 m wide, two-way, no center line
* curb height 0.15 m
* the right road ends at the front road, forming a **T-junction**

**Lanes (Japan drives on the left).** On the right road:
* lane x 5.75 … 8 heads **+Z**, toward the junction
* lane x 3.5 … 5.75 heads **−Z**

## 2. Road Markings

| Marking | Position | Notes |
|---|---|---|
| Crosswalk | across the right road: x 3.5 … 8, z 0.5 … 3.0 | 5 stripes 0.45 m wide with 0.45 m gaps, running along Z |
| Stop line | x 5.75 … 7.45, z −0.5 … −0.05 | 0.45 m, approach lane only |
| 止まれ | x 5.9 … 7.4, z −3.5 … −1.0 | 止 is nearest the stop line, so an approaching driver reads 止 → ま → れ |
| Edge line (路側帯) | right road: x 7.45 … 7.6, z −8 … −0.5. Front road: z 7.45 … 7.6, x −8 … 8 | 0.15 m, far side only |
| Manhole | center (−2, 5.8), Ø 0.6 | front road |
| 側溝 grates | front curb at z 3.5 … 3.8, x centers −6, −2, 1. Right curb at x 3.5 … 3.8, z centers −6, −3 | 1.0 × 0.3 each |

## 3. Hero Building

**Footprint:** 3 × 3 bays = 5.46 × 5.46 m, at x −3.76 … 1.7 and
z −3.76 … 1.7. It sits 0.3 m back from both sidewalks. Bays follow the
[roadmap L6](Hero-Diorama-Roadmap.md) grid (1.82 m).

| Level | y | Front facade (+Z) | Right facade (+X) |
|---|---|---|---|
| 1F | 0 … 3.2 | 3 shopfront bays with glass sliding doors; awning at y 2.6 … 2.8, 1.0 m deep | Front bay: shopfront (corner). Middle bay: small window. Back bay: meter box |
| 2F | 3.2 … 6.0 | Left bay: window. Two right bays: balcony 0.9 m deep with laundry and an AC unit | Windows |
| 3F | 6.0 … 8.8 | Windows | Windows; one wall-mounted AC |
| Roof | 8.8 … 9.9 | Parapet 0.5 m + railing 0.6 m all round | same |

Back and left facades are plain walls with pipes.

**Rooftop items:**

| Item | Position | Size |
|---|---|---|
| Prefab shed | x −3.5 … −1.1, z −3.5 … −1.7 | 2.2 m tall |
| Elevated water tank | center (0.6, −2.8) | Ø 1.2 on a 1.0 m stand; top at y 11.0 |
| Pots and a chair | front-right corner of the roof | — |

**Vertical kanban (projecting sign):**
* on the right facade near the corner
* x 1.7 … 2.3 (projects over the sidewalk), z 0.95 … 1.2, y 3.6 … 6.0
* readable from along the right road
* lit at night

## 4. Street Furniture and Props

| Item | Position (x, z) | Faces | Size (w × h × d) |
|---|---|---|---|
| Utility pole + transformer | (−5.5, 3.2), front sidewalk | wires run along X, off both edges | pole 10 m; transformer at y 6.8 … 7.7 on the lot side; crossarm at y 9.2 |
| カーブミラー | (3.2, 3.2), sidewalk corner | the junction (diagonal) | 3.2 m pole, Ø 0.8 mirror |
| Stop sign | (7.8, −0.8), right road shoulder | −Z (approaching cars) | 2.5 m |
| Vending machines × 2 | x −6.3 … −4.3, z 1.0 … 1.7 | +Z | 1.0 × 1.83 × 0.7 each (`prop_vending_machine_01`) |
| Recycling bin | x −6.925 … −6.475, z 1.225 … 1.675 | +Z | 0.45 × 0.8 × 0.45 |
| Post box 〒 | (−7.2, 2.5), front sidewalk | +Z | 0.4 × 1.25 × 0.4 |
| Potted-plant cluster | x −3.6 … −2.9, z ≈ 1.85 | — | 0.3 … 0.6 tall |
| Bicycle | x −2.8 … −1.0, z ≈ 2.45, front sidewalk | along X | 1.8 × 1.0 × 0.6 |
| A-frame sign | (0.6, 2.6) | +Z | 0.5 × 0.9 × 0.4 |

## 5. Nature and Boundaries

| Item | Position | Size |
|---|---|---|
| Ginkgo (yellow) | (−6.6, −1.0) | 8 m tall, canopy Ø 5; hangs over the vending machines and the base's left edge. It sits front-left because anything at the back-left is hidden by the building from the hero view |
| Zelkova (orange) | (−0.3, −6.2) | 7 m tall, canopy Ø 6; overhangs the right sidewalk |
| Block wall (ブロック塀) | back edge: z −8 … −7.85, x −8 … 2. Left edge: x −8 … −7.85, z −8 … 2 | 1.2 m tall |
| Hedge | x 1.3 … 1.9, z −7.8 … −4.2 | 1.0 m tall |
| Fallen leaves | under both trees, along the curbs, drifting onto sidewalks | scatter (Stage 6) |

## 6. Vehicles and People

| Item | Position | Heading | Size |
|---|---|---|---|
| Kei car | x 3.6 … 5.1, z −7.3 … −3.9 | −Z, parked at the curb | 1.48 × 1.7 × 3.4 |
| Shopkeeper | (−0.8, 2.2) | +Z | 1.6 m |
| Customer at the vending machine | (−5.3, 2.4) | −Z | 1.7 m |
| Pedestrian on the crosswalk | (5.6, 1.8) | +X | 1.65 m |

## 7. Hero View and Light

* **Camera:**
  * The hero view uses the same direction as the existing isometric
    preset: from the front-right, azimuth 45°.
  * Elevation ≈ 35°, target ≈ (0, 3.8, 0), distance ≈ 62 m.
  * Both street facades and both roads are visible.
* **Preview framing:** perspective FOV ≈ 28°, with the whole base in
  frame (roadmap L5).
* **Light (blockout):**
  * The sun comes from the front-left, so the front facade is lit and the
    right facade is in soft shade, which gives the massing form.
  * Golden hour and dusk are tuned in Stage 7.

## 8. Checks

Status as of the blockout render on 2026-09-30:

* [x] No two items overlap, checked on the top-down render. The one
      intended exception is the ginkgo canopy hanging over the vending
      machines.
* [x] The building (≈ 10 m, 11 m with rooftop items) reads as the dominant
      silhouette on the 16 m base.
* [x] From the hero view, every street furniture item is visible.
* [x] The blockout renders match this sheet.

**Open observations**, to decide when detailing:

* The back half of the lot is hidden from the hero view. It only needs
  the block wall, hedge and zelkova, so keep it cheap.
* The front road reads as a large empty surface. The reference fills its
  roads with parked cars. A second vehicle on the front road would help,
  but it is not on the L7 hero list.
