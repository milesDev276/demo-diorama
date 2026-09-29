# Phase 3a — Asset Sourcing: Where Do The Models Come From?

Part of [Phase-3-Overview.md](Phase-3-Overview.md).

## 1. The Real Decision Here

There are two legitimate ways to get Japanese-style 3D content into this
app, and they are not equally cheap:

```text
Option A                          Option B
Procedural geometry                Imported .glb models
(primitives, code-only)            (Blender-made or downloaded)

+ Zero new dependencies            + Higher visual fidelity / detail
+ Zero licensing risk              + Faster for complex shapes (roof
+ Matches current codebase 1:1       tiles, vending machine buttons,
+ Instantly recolorable via          power-line sag, etc.)
  palette.ts
+ No loading states / fallbacks    − New pipeline: GLTFLoader/useGLTF,
                                      Suspense, loading states, error
− More code per detail-rich object   handling for missing/broken files
− Hard to get very intricate       − Licensing to track per asset
  silhouettes (roof tiles,         − Need to normalize scale/pivot/
  lattice windows) cheaply           material style per CLAUDE.md §16
```

**Recommendation: stay procedural for this phase.** CLAUDE.md §16-17
describes a `.glb` pipeline as the long-term production path, but nothing
in the current repo uses it, and the existing 3 objects prove procedural
geometry already reads as "cute stylized miniature" at this poly budget.
Introducing a loader, Suspense boundaries, and a licensing-tracked asset
folder is real new complexity (CLAUDE.md Rule 5 — minimize dependencies;
Rule 8 — prefer simple solutions) that isn't justified until procedural
geometry actually can't produce a needed silhouette (e.g. a highly detailed
torii gate or a realistic bicycle — not needed for the §36 vertical slice).

Use Option B selectively, later, only for a specific entity that's proven
too costly to fake procedurally — not as a blanket replacement.

---

## 2. If/When You Need Option B: Where To Look

If a future entity needs more fidelity than boxes/cones/cylinders can give
cheaply, source `.glb`/`.gltf` models from:

| Source | Why | License notes |
|---|---|---|
| **[Kenney.nl](https://kenney.nl/assets)** | Huge free low-poly packs, several city/street/nature kits in a consistent style close to this project's target look | CC0 — no attribution required, safest option |
| **[Quaternius](https://quaternius.com/)** | Free low-poly packs incl. modular buildings, props, vehicles | CC0 |
| **[Poly Pizza](https://poly.pizza/)** | Searchable free low-poly `.glb` model library (Google Poly successor) | Mixed CC-BY / CC0 — check per model |
| **[Sketchfab](https://sketchfab.com/)** (filter: Downloadable + CC license) | Larger pool, includes some Japanese architecture/street-prop models | Mixed — many require attribution, some are non-commercial only. Read each license. |
| **[BlenderKit](https://www.blenderkit.com/)** (Blender add-on) | In-app free/paid asset library; useful if modeling in Blender anyway | Mixed — check per asset |
| **Custom-modeled in Blender** | Full control over style consistency (CLAUDE.md §6 Rule 6) | Full ownership, no license risk |

None of these are wired into the codebase today — picking one is a decision
to make later, not now.

## 3. If Option B Is Adopted: Non-Negotiable Rules

1. **Normalize before importing.** Every model must be rescaled to the
   project's world scale (CLAUDE.md §18 — 1 unit = 1 meter, door ≈ 2m,
   utility pole ≈ 8–12m) and re-centered so its pivot sits at the object's
   natural ground contact point (matches how `position` is used today —
   objects sit with their base at `y = 0`).
2. **Restyle to the shared palette.** A downloaded model with its own
   baked-in colors will look visually inconsistent (violates CLAUDE.md
   Rule 6). Re-material it using `DIORAMA_COLORS` from `palette.ts`, or a
   deliberate extension of that palette, not the source pack's colors.
3. **Track the license.** Keep a `public/models/CREDITS.md` (create if
   adopted) listing each file, its source URL, and its license. Never ship
   an asset whose license is unclear.
4. **Naming.** Follow CLAUDE.md §17: `building_house_01.glb`,
   `infra_utility_pole_01.glb`, etc. — not `model1.glb`.
5. **Loading path, if adopted:** `useGLTF` from `@react-three/drei`
   (already a project dependency — no new package needed) inside a
   `Suspense` boundary in `DioramaCanvas.tsx`, with `useGLTF.preload()` for
   any model used in the default scene so it doesn't pop in empty.

## 4. What This Phase Actually Uses

Given the recommendation in §1, **Phase 3b assumes procedural geometry for
every §36 vertical-slice entity.** No downloads, no new dependencies, no
licensing to track. If that turns out to look too flat once built, revisit
this file and pick specific entities to replace with a sourced `.glb`
instead of reopening the whole pipeline decision.
