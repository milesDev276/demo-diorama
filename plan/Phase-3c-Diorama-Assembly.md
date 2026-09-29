# Phase 3c — Diorama Assembly: How Do We Build The Complete Scene?

Part of [Phase-3-Overview.md](Phase-3-Overview.md). Assumes the entities
from [Phase-3b-Entity-Creation.md](Phase-3b-Entity-Creation.md) exist.

## 1. Target Composition

Per CLAUDE.md §36, the vertical slice should look like:

```text
             ⚡
             │
       🏠    │    🏪
      🌳           🥤
────────────────────────
        SIDEWALK
════════════════════════
           ROAD
════════════════════════
```

Read left-to-right as a shallow street-corner diorama, not a top-down
island: buildings and props sit on a raised sidewalk strip behind a road
strip, both resting on the existing tapered base concept from §20 — a
small bounded plot, still clearly a "miniature object," not an infinite
plane.

---

## 2. Ground Rework

Replace the current floating circular island in `Ground.tsx` with a
rectangular plot:

```text
   ┌──────────────────────────┐
   │        SIDEWALK          │   ← objects (house, shop, pole, props) sit here
   ├──────────────────────────┤
   │          ROAD             │   ← road surface, painted centerline
   └──────────────────────────┘
           tapered base underside (keep — same handcrafted-object feel
           as today's dirt cone, just under a rectangular footprint)
```

Concretely:
* Keep the two-layer construction (top surface + tapered underside) —
  that's the part of `Ground.tsx` that makes it feel like a physical
  miniature rather than a flat plane, and CLAUDE.md §20 explicitly wants
  that preserved.
* Replace the single grass cylinder with two adjacent flat boxes: a wider,
  shorter **road** box (`asphalt` color, thin painted-line strip via a
  second thin box or plane on top) and a narrower, slightly raised
  **sidewalk** box (`sidewalkConcrete`) behind it, with a small **curb**
  lip between them (thin `curb`-colored box) for a subtle physical step.
* Introduce a `SIDEWALK_DEPTH` / `ROAD_DEPTH` (or similar) constant next to
  the existing `ISLAND_RADIUS` in `objectDefaults.ts`, and use it to bound
  where new objects can spawn — same role `ISLAND_RADIUS` plays today.
* A strip of grass/dirt can remain along the back edge behind the
  sidewalk (small, not dominant) so `Tree`/`Rock` still have a natural
  place to sit, echoing the original reference in CLAUDE.md §7.

This is the single highest-leverage visual change — it's what turns
"floating fantasy island" into "street corner," more than any individual
prop does.

---

## 3. Default Scene Layout

Update `getDefaultScene()` in `objectDefaults.ts` to place, roughly
(exact numbers depend on final plot dimensions — treat these as relative
placement, not final coordinates):

```text
House          — back-left, on the sidewalk strip
Small Shop     — back-right, on the sidewalk strip
Utility Pole   — between them, close to the sidewalk/road edge
Power Line     — attached near the utility pole
Tree           — front-left, near the grass strip
Vending Machine— beside the shop, facing the road
Sign           — small, near the road edge
```

Keep the golden-angle spiral spawn logic in `nextSpawnPosition()` for
user-added objects — it's type-agnostic and doesn't need to change, just
make sure its radius bound matches the new plot shape rather than the old
circular island.

---

## 4. Lighting

`SceneLighting.tsx` already leans warm (`#fff1d8` directional, `#fff4e6`
ambient) — nudge intensity/color slightly further toward CLAUDE.md §26's
Golden Hour target rather than rebuilding it. This is a tuning pass, not a
rewrite — do not add new light types or post-processing (§26 explicitly
warns against bloom/heavy post-processing).

---

## 5. Camera

No change required for this phase. The existing isometric default
(`sceneDefaults.ts`) already frames a small object well; re-check after the
ground shape changes from circular to rectangular that the default
zoom/position still frames the whole plot (CLAUDE.md §24 — camera should
reinforce the miniature feeling, not require manual adjustment on load).

---

## 6. Implementation Order

1. Palette additions (`Phase-3b` §2) — needed by everything downstream.
2. Data model + wiring changes (`Phase-3b` §3) — with zero new components
   yet, this alone should compile clean (new types, empty library entries
   pointing at placeholder geometry, or stub components).
3. Ground rework (§2 above) — get the plot shape and road/sidewalk right
   before placing anything on it; it's the base every entity is judged
   against visually.
4. New entity components, one at a time, in this order:
   `UtilityPole` → `Sign` → `VendingMachine` → `Shop` → `PowerLine`
   (roughly simplest-silhouette-first, so each one is a fast visual check
   before moving to the next).
5. Reskin the 3 existing entities (`House`, `Tree`, `Rock`) toward the new
   palette per `Phase-3-Overview.md`'s stated goal.
6. Update `getDefaultScene()` to the §3 layout.
7. Lighting tuning pass (§4).
8. Full manual pass through §7's acceptance checklist.

---

## 7. Acceptance Checklist

Mirrors the format of `Phase-1.md` §28 / `Phase-2.md` §44.

### Data / wiring
* [ ] All new object types added to `diorama.types.ts`.
* [ ] All new object types addable from `ObjectLibrary.tsx`.
* [ ] All new object types render via `OBJECT_VISUALS` in `DioramaObject.tsx`.
* [ ] All new object types included in `VALID_TYPES` in `sceneValidator.ts`.
* [ ] Save → reload → export → import round-trip works with the new types
      (a scene containing every new type survives a full export/import cycle).

### Visual (CLAUDE.md §49 gate)
* [ ] Default scene reads as a Japanese street corner, not a generic scene.
* [ ] All entities share one material/scale family — nothing looks
      borrowed from a different style.
* [ ] Ground reads as road + sidewalk + small bounded plot, not a floating
      island or infinite plane.
* [ ] Utility pole + power line read correctly at their taller, thinner
      scale relative to House/Tree (CLAUDE.md §18).
* [ ] Vending machine is instantly recognizable at a glance.
* [ ] Lighting stays soft/warm — no harsh shadows, no bloom.

### Technical
* [ ] `npm run lint` passes.
* [ ] `npm run build` passes (TypeScript + Next build).
* [ ] No console errors at `/diorama` in the browser.
* [ ] Existing Phase 1/2 functionality unaffected: select, move, rotate,
      scale, delete, duplicate, undo/redo, lock/hide, camera presets.

---

## 8. What NOT To Do (reiterating CLAUDE.md §45/§50 for this phase)

* Do not add a `.glb` import pipeline unless `Phase-3a-Asset-Sourcing.md`'s
  recommendation is explicitly overridden by the user.
* Do not implement time-of-day, weather, or photography mode — that's
  Phase 4/5.
* Do not touch auth/backend/persistence beyond what already exists
  (localStorage save is already Phase 2 — don't add cloud save).
* Do not build every asset in CLAUDE.md §15's full taxonomy — only the §36
  vertical slice. Expand the library only after this slice passes the
  acceptance checklist.
