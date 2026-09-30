# Diorama App — Phase 3: Japanese Asset System (Overview)

## 1. Phase Goal

Turn the current **generic** diorama (house / tree / rock on a floating grass
island — pure Phase 1/2 geometry) into a diorama that visibly reads as a
**Japanese street / neighborhood corner**, per `CLAUDE.md` §5–7, §15, §36.

Today, nothing in the scene signals "Japan." This phase fixes that.

This document is the index. The actual work is split into three pieces —
read them in order:

| File | Answers |
|---|---|
| [Phase-3a-Asset-Sourcing.md](Phase-3a-Asset-Sourcing.md) | Where do the models come from? |
| [Phase-3b-Entity-Creation.md](Phase-3b-Entity-Creation.md) | How do we turn a model/shape into a placeable diorama entity? |
| [Phase-3c-Diorama-Assembly.md](Phase-3c-Diorama-Assembly.md) | How do we compose entities into one coherent, complete diorama? |
| [Phase-3-Implementation.md](Phase-3-Implementation.md) | In what order do we build it, and how do we verify each step? |

---

## 2. Current State (as of this plan)

Inspected directly from the repository — this is fact, not assumption:

* **Object types:** `tree | house | rock` only (`features/diorama/types/diorama.types.ts`).
* **Rendering approach:** 100% procedural Three.js geometry — primitive
  meshes (box/cone/cylinder/dodecahedron) composed in `<group>`s. **No
  `.glb` files are loaded anywhere in the app.** `useGLTF` / `GLTFLoader`
  are not used.
* **Palette:** one shared constants file, `features/diorama/utils/palette.ts`,
  every object pulls its colors from it.
* **Ground:** a floating circular "island" (grass puck + tapered dirt
  underside), not a road/plot — see `features/diorama/components/Ground.tsx`.
* **Taxonomy:** flat, two categories (`Nature`, `Buildings`) in
  `features/diorama/utils/objectLibrary.ts` — not the full §15 taxonomy
  (Street / Infrastructure / Props / Vehicles don't exist yet).
* **Wiring points for a new object type** (must all be touched together):
  `diorama.types.ts` (type union) → `objectLibrary.ts` (browser entry) →
  `objectDefaults.ts` (default scale + default scene) →
  `sceneValidator.ts` (`VALID_TYPES` set) →
  `DioramaObject.tsx` (`OBJECT_VISUALS` map) →
  `ObjectLibrary.tsx` (`ICONS` map).

This matters because it means "Japanese style" is a **content + geometry**
problem right now, not an asset-pipeline problem — there is no importer to
build. Whether that stays true is exactly what Phase 3a decides.

---

## 3. Scope

In scope (this phase):

* Restyling the 3 existing entities toward a Japanese aesthetic.
* Adding the §36 vertical-slice entities: small shop, utility pole, power
  line, vending machine, road, sidewalk, sign.
* Reworking the ground from "floating island" to a small street-corner plot.
* A Japanese-appropriate palette and lighting tweak.

Out of scope (later phases, do not implement here — CLAUDE.md §45 Rule 2):

* Time of day / weather systems (Phase 4).
* Photography mode, depth of field, image export (Phase 5).
* Any backend, auth, cloud save, publishing (Phase 6/7).
* A generalized `.glb` asset-import pipeline, unless Phase 3a's
  recommendation is explicitly accepted and requested.

---

## 4. Relationship to Existing Plans

`Phase-1.md` and `Phase-2.md` already exist in this folder and describe the
prototype and editor that were built (and match what's in the repo today).
This phase does **not** redo that work — it assumes Phase 1/2 are done and
only adds Japanese visual identity on top. Do not re-implement undo/redo,
grid snap, save/load, etc. — they already work.

---

## 5. Definition of Done

Phase 3 is complete only when, per `CLAUDE.md` §49 (Visual Quality Gate):

* [ ] The default scene reads as a small Japanese street corner at a glance,
      not a generic cottage/forest scene.
* [ ] All entities (old and new) look like they belong to the same
      material/scale family — no mismatched style.
* [ ] The new object types are fully wired (see checklist in §2 above) —
      addable, selectable, transformable, saveable, exportable, importable.
* [ ] `npm run lint` and `npm run build` pass with no new errors.
* [ ] Manually verified in the browser at `/diorama`.

See `Phase-3c-Diorama-Assembly.md` §7 for the full acceptance checklist.
