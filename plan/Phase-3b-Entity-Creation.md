# Phase 3b — Entity Creation: How Do We Build Each One?

Part of [Phase-3-Overview.md](Phase-3-Overview.md). Assumes the procedural
approach decided in [Phase-3a-Asset-Sourcing.md](Phase-3a-Asset-Sourcing.md).

## 1. The Existing Pattern (reuse this, don't invent a new one)

Every entity today follows the same shape — study `Tree.tsx` / `House.tsx`
/ `Rock.tsx` before writing new ones:

```text
export function EntityName() {
  return (
    <group>
      <mesh position={...} castShadow receiveShadow>
        <someGeometry args={[...]} />
        <meshStandardMaterial color={DIORAMA_COLORS.someKey} roughness={n} flatShading? />
      </mesh>
      {/* more meshes, all relative to origin */}
    </group>
  );
}
```

Rules that keep new entities consistent with the old ones:

* **No props, no internal state.** The component only renders geometry.
  Position/rotation/scale are applied by the parent (`DioramaObject.tsx`),
  never inside the entity itself.
* **Origin = ground contact point.** The lowest point of the mesh should
  sit at local `y = 0` so `position: [x, 0, z]` places it correctly on the
  ground, matching every existing entity.
* **Colors only from the shared palette** (`palette.ts`) — never a literal
  hex inside an entity file.
* **`flatShading` on anything angular** (roofs, rocks) to keep the low-poly
  look; leave it off for smoother forms.
* **`castShadow` + `receiveShadow`** on every mesh, matching current
  entities, so lighting stays consistent.

---

## 2. Palette Extension

Add new keys to `features/diorama/utils/palette.ts` (do not create a second
palette file) for the new material families the vertical slice needs:

```ts
export const DIORAMA_COLORS = {
  // ...existing keys unchanged...

  // Japanese building
  wallPlaster: "#efe6d3",     // machiya wall
  roofTile: "#3f4a52",        // dark charcoal/indigo tile roof
  woodTrim: "#5b3f2c",        // eaves / beams (reuse `door` tone family)
  shopAwning: "#8f3b3b",      // small shop awning cloth

  // Street
  asphalt: "#4a4a4a",
  asphaltLine: "#e8e2d0",     // road paint
  sidewalkConcrete: "#c9c3b6",
  curb: "#a39d8e",

  // Infrastructure
  poleConcrete: "#8f8a7d",
  wireGray: "#2b2b2b",

  // Props
  vendingBody: "#c94f4f",     // classic red Japanese vending machine
  vendingPanel: "#f4f1ea",
  signBoard: "#f4f1ea",
  signText: "#2b2b2b",
} as const;
```

Exact hex values are a starting point — tune visually once rendered, but
keep every new entity pulling from this single object.

---

## 3. Data Model Changes (do these first, before any new component)

Extending an entity type touches six files. Miss one and it either can't be
added, silently fails validation on import, or crashes on selection. Do
them in this order:

1. **`features/diorama/types/diorama.types.ts`** — extend the union:
   ```ts
   export type DioramaObjectType =
     | "tree" | "house" | "rock"          // existing
     | "shop" | "utilityPole" | "powerLine"
     | "vendingMachine" | "sign";          // new (road/sidewalk are ground pieces — see §5)
   ```
2. **`features/diorama/utils/objectLibrary.ts`** — add categories matching
   CLAUDE.md §15 taxonomy:
   ```ts
   { title: "Buildings", items: [{ type: "house", label: "House" }, { type: "shop", label: "Small Shop" }] },
   { title: "Infrastructure", items: [{ type: "utilityPole", label: "Utility Pole" }, { type: "powerLine", label: "Power Line" }] },
   { title: "Props", items: [{ type: "vendingMachine", label: "Vending Machine" }, { type: "sign", label: "Sign" }] },
   ```
3. **`features/diorama/utils/objectDefaults.ts`** — add each new type to
   `DEFAULT_SCALE`, and update `getDefaultScene()` per
   `Phase-3c-Diorama-Assembly.md`.
4. **`features/diorama/utils/sceneValidator.ts`** — add every new type to
   `VALID_TYPES`. **Easy to forget** — if skipped, saved/imported scenes
   silently drop the new objects instead of erroring.
5. **`features/diorama/components/DioramaObject.tsx`** — register each new
   component in `OBJECT_VISUALS`.
6. **`features/diorama/components/ObjectLibrary.tsx`** — pick a `lucide-react`
   icon per new type in `ICONS` (e.g. `Zap` for utility pole, `Store` for
   shop, `Beer`/`Coffee`-adjacent or `Package` for vending machine — check
   what's actually available in the installed `lucide-react` version).

---

## 4. New Entity Specs

One new file per entity in `features/diorama/objects/`, same pattern as
`Tree.tsx`. Geometry described at the level Phase-1.md used for the
original three:

### `Shop.tsx`
Small shop / storefront — a variant of `House` silhouette-wise but reads
distinctly commercial: a lower, wider box body, a flat-ish shed roof
(single angled box, not a cone), a wide glass-panel front (one large plane
using `windowGlow`-family color at low emissive), and a shop awning — a
thin angled box in `shopAwning` color jutting over the entrance.

### `UtilityPole.tsx`
A tall thin cylinder (concrete-pole gray, `poleConcrete`), plus 1–2 short
horizontal cylinder "crossarms" near the top. This is a tall, thin,
vertical-emphasis silhouette — per CLAUDE.md §18, roughly 8–12m, i.e. much
taller than House/Tree (~1–1.7 units), which is correct and intentional.

### `PowerLine.tsx`
Not a standalone placeable pole-to-pole connector for v1 — simplest
approach: 2–3 thin, slightly-drooping cylinders (or a single low-poly
"catenary" curve made from a few short cylinder segments angled to fake a
sag) spanning between a fixed local offset, colored `wireGray`. Treat it as
a decorative attachment users place near a pole rather than something that
snaps between two other objects — full pole-to-pole wire snapping is
non-trivial and belongs in a later refinement if wanted, not this phase.

### `VendingMachine.tsx`
A simple box body in `vendingBody` (red), a front panel inset in
`vendingPanel`, and a small grid of tiny emissive rectangles (reuse the
`windowGlow` emissive trick from `House.tsx`) to suggest illuminated drink
buttons — this is the single most recognizable "everyday Japan" prop per
CLAUDE.md §6, worth getting right.

### `Sign.tsx`
A thin vertical post (small cylinder) topped with a flat rectangular board
(`signBoard`) — kanji/text is not required (no text rendering system
exists); the flat board silhouette alone reads as signage at this scale.

---

## 5. Road & Sidewalk: Ground Pieces, Not Objects

Per CLAUDE.md §20's diagram, road and sidewalk are part of the **base**,
not draggable scene objects — they don't need `position`/`rotation` state
in `DioramaObject[]`. Build `Road.tsx` and `Sidewalk.tsx` as static
components composed directly into a reworked `Ground.tsx` (see
`Phase-3c-Diorama-Assembly.md` §2), the same way the current grass-top /
dirt-underside pair is composed today. This avoids touching the data model,
validator, or object library for these two — simpler, and matches how
CLAUDE.md treats the base as distinct from placeable objects.

---

## 6. Icon Availability Check

Before wiring `ICONS` in `ObjectLibrary.tsx`, confirm each chosen
`lucide-react` icon actually exists in the installed version
(`package.json` currently pins `"lucide-react": "^1.23.0"`). If a specific
icon name doesn't exist, pick the closest reasonable substitute rather than
guessing and leaving a build error.
