# Handoff — Hero Diorama Work (as of 2026-09-30)

Read this first when picking up the work. It summarizes where things
stand, what was decided and why, how to run and verify things, and what
comes next. Details live in the linked plan files.

---

## 1. Where Things Stand

| Step | Status | Where |
|---|---|---|
| Phase 1–2 editor | Done | `main` (PR #1) |
| Phase 3 asset system | Done. The commit is misnamed "done phase 2". | `main` (PR #2, `56ec1f5`) |
| Stage 0: Blender pipeline, pilot, hero layout, blockout | Done | `main` (PR #3, branch `phase3`) |
| Stage 1: world scale 1 unit = 1 m, scene file v2 | Done | `main` (PR #4, branch `stage1-scale`) |
| **Stage 2: look-dev** | **Implemented and verified, NOT committed** | branch **`stage2-lookdev`**, 11 changed or new files |
| Stage 3: Blender GLB pipeline in the app, first hero assets | Next | — |

**Immediate next action:** commit `stage2-lookdev`, push, and open a PR.
The user merges PRs themselves, one branch per stage.

## 2. Documents

| File | What it is |
|---|---|
| [Hero-Diorama-Roadmap.md](Hero-Diorama-Roadmap.md) | Master plan: locked decisions L1–L8 and Stages 0–7, with status per stage |
| [Hero-Layout.md](Hero-Layout.md) | Hero scene dimensions in meters (16 × 16 m corner base). This is the source of truth for the blockout and for asset sizes. |
| [Stage-1-Implementation.md](Stage-1-Implementation.md) | Scale migration: value table and verification results |
| [Stage-2-Implementation.md](Stage-2-Implementation.md) | Look-dev: decisions D1–D6, the bugs that were found, and verification results |
| `Phase-*.md` | Earlier phases, kept for history |

## 3. Decisions That Must Not Be Re-litigated

* **World scale is 1 unit = 1 m.**
  * Old procedural geometry still uses the legacy unit (≈ 6 m). It is
    rendered through `legacyUnits: true` in `assetRegistry.ts` and the
    `LEGACY_UNIT_SCALE` group in `Ground.tsx`.
  * Never import `utils/legacyUnits.ts` from new code.
* **Scene file v2.**
  * `migrateRawObjects()` in `sceneSerializer.ts` handles v1 by
    multiplying positions × 6.
  * Only bump the version for changes in meaning. Additive optional fields
    get defaults in the validator and do not bump it.
* **Nothing is bought or downloaded as an asset.**
  * Fixed-shape models are Blender files built by Python scripts that
    Claude writes and runs headless.
  * Parametric pieces are generated in app code.
  * No HDRI files; the environment is built from Lightformers.
* **Style benchmark:** `prop_vending_machine_01`, approved by the user.
  Every new asset should match its detail, bevels and weathering.
* **Tone mapping is Neutral, not AgX.** AgX greyed the palette; see Stage 2
  D2.
* **`@react-three/postprocessing` is pinned to exactly `3.0.4`.** Anything
  newer needs `@react-three/fiber >= 9.7`, and fiber stays at 9.6.1.

## 4. How to Run and Verify

The platform is Windows. Node 22.14, Chrome, and Blender 5.2.2 LTS at
`C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`. There is no
test runner.

```bash
npm run dev                  # http://localhost:3000/diorama
npm run lint
npm run build                # includes the TypeScript check

# Screenshots of all 4 camera presets, editor + Preview, in headless Chrome (dev server must run)
node scripts/capture-presets.mjs <outDir> [--url <url>] [--seed-scene <file>] [--save-scene <file>]

# Blender: build one asset (GLB → public/models/<category>/, previews → art/previews/)
"<blender.exe>" --background --factory-startup --python art/blender/build.py -- prop_vending_machine_01

# Blender: hero blockout (GLB → public/models/_dev/, previews → art/previews/)
"<blender.exe>" --background --factory-startup --python art/blender/blockout/hero_blockout.py
```

* **Dev views:**
  * `/diorama?dev=blockout` shows the hero blockout instead of the scene.
  * **Preview** turns on the perspective camera and the effect stack.
* **Verification method used so far:**
  1. Capture before and after with `capture-presets.mjs`.
  2. Pixel-diff the images with numpy inside Blender.
  3. For migrations, use `--seed-scene` to simulate an old autosave.
  4. For fps, count `requestAnimationFrame` at 1920×1080 with 100 seeded
     objects.

  The diff, crop and fps helpers were one-off scripts and are **not** in
  the repo. Recreate them, or move them into `scripts/` if they are needed
  often.

## 5. Gotchas Learned the Hard Way

* **Stopping a background `npm run dev` does not kill the Next child
  process.** It keeps port 3000, and the next start falls back to 3001.
  Kill the whole tree: `taskkill /PID <pid> /T /F`.
* **`npm install pkg@~x.y.z` can silently upgrade peers.** It resolved
  3.0.5 and bumped fiber to 9.8.1. Check `npm ls @react-three/fiber` after
  every install.
* **Blender reads `palette.ts` with a regex:** one `key: "#rrggbb",` per
  line. Keep that format. Every such key becomes a Blender palette color.
* **A transparent canvas plus blur effects gives bright fringes.** Preview
  therefore composites the sky itself (`SkyBackdropEffect`) before the
  tilt-shift. Keep that effect after tone mapping and before any blur.
* **The camera rig (`CameraControls.tsx`):**
  * R3F creates a placeholder camera on the first render, so only switches
    between the rig's two cameras are matched.
  * Zoom is restored from when Preview was entered, not recomputed,
    because the canvas resizes around the switch.
* **Fog is relative to the orbit target distance** (`SceneFog.tsx`). A
  fixed fog range swallows the more distant perspective camera.
* **R3F's `shadows` defaults to PCFSoft,** which three r184 deprecates. Use
  `shadows="percentage"` plus `shadow-radius`.

## 6. Known Limitations and Existing Behaviors (not bugs of these stages)

* **Presets frame the 50 m legacy plot.** The blockout looks small, and a
  0.5 m grid is dense on the big plot. The Stage 4 corner base fixes both.
* **Redo does not restore the selection.**
* **Duplicates are not clamped to the plot.**
* **Lighting was tuned on legacy procedural assets.** Re-check it when the
  first GLBs land.
* **`npm audit` reports 10 findings.** They all predate this work (next,
  tailwind, sharp, …) and were not addressed.

## 7. Next: Stage 3 — Blender Pipeline in the App + First Hero Assets

From the roadmap. Write `Stage-3-Implementation.md` first and get it
approved; that is the user's usual flow.

* **App side:**
  * `objects/GltfAsset.tsx`: `useGLTF` + drei `<Clone>` with shadows;
    remap the Blender material slots (`base`, `emissive`) to shared app
    materials.
  * A per-object `Suspense` placeholder, and `modelUrl` in the registry
    for preloading.
  * The Canvas graphics atlas for signage and ads.
* **Blender side:** finish `art/blender/lib`.
* **First six assets,** covering all the hard cases: vending machine (from
  the pilot, replacing the legacy one), AC unit, autumn tree, kei car,
  bicycle, one figure.
* **Done when:**
  * each asset uses ≤ 3 draw calls and stays within the L8 triangle budget
  * the side-by-side look is consistent
  * save, export and import keep working
  * the 100-object frame rate holds

## 8. Working With This User

* **Language:** the user writes in Vietnamese. Reply in Vietnamese; repo
  docs are in English.
* **Plan first:** at the start of each stage, write the plan doc and get it
  approved, then implement.
* **Git:** the user commits, pushes and merges through GitHub PRs
  themselves. When asked, provide a commit message and a PR description.
* **Reporting:** follow CLAUDE.md §46 — implemented, files, verification
  with real numbers, limitations.
