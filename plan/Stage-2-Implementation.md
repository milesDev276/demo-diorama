# Stage 2 — Look-dev (Implementation Record)

Part of [Hero-Diorama-Roadmap.md](Hero-Diorama-Roadmap.md) (decision L5).
Branch: `stage2-lookdev`.

**Goal:** make Preview read as a photograph of a physical miniature, and
make the editor softer and warmer. Nothing is added to scene data, and no
assets change.

---

## 1. What Changed

| Area | Before | After |
|---|---|---|
| Tone mapping | ACES (R3F default) | **Khronos PBR Neutral**, in the editor and in Preview (D2) |
| Sun | [36, 42, 21] (≈ 45°), 1.35, 1024² PCF-soft | [36, 29, 21] (≈ 35°, longer shadows), 1.8, warmer `#ffe2bf`; 2048² PCF, radius 4, frustum ±32 |
| Fill | ambient 0.5 + hemisphere 0.5 | ambient 0.25 + hemisphere 0.45 + a **Lightformer environment** (4 rects, no HDRI file) at 0.75 |
| Preview camera | the same orthographic camera | **perspective, 24° vertical FOV**. Entering and leaving keeps the composition (D4) |
| Preview effects | none | N8AO (1.5 m) → Bloom (threshold 1) → tone mapping → **SkyBackdrop** → **TiltShift2** (horizontal band) |
| Fog | fixed 90–162 m | the same range, measured from the orbit target, so the Preview camera hazes the same way (D6) |
| Sky colors | Tailwind classes on the canvas container | `skyTop` / `skyMiddle` / `skyBottom` in `palette.ts`, shared by CSS, fog and SkyBackdrop |

## 2. Decisions

### D1 — Dependencies

* **`@react-three/postprocessing` pinned to exactly `3.0.4`.** Versions
  3.0.5 and 3.1.x require `@react-three/fiber >= 9.7`.
  * A caret range silently upgraded fiber 9.6.1 → 9.8.1 during
    installation. That was reverted.
  * Fiber stays at the version Stage 1 was verified on.
* **`postprocessing` is now a direct dependency** (`^6.39.5`), because
  `ToneMappingMode` is imported from it. It was already installed
  transitively.
* **Lockfile check:** exactly 4 new entries (`@react-three/postprocessing`
  + nested `maath`, `n8ao`, `postprocessing`).
* **`npm audit`:** identical to `main` (10 pre-existing findings in
  next / tailwind / sharp / …).

### D2 — Neutral tone mapping instead of AgX

This deviates from roadmap L5. AgX, ACES and Neutral were compared on the
same scene.

* **AgX greys the pastel palette.** The inverse was computed from three's
  AgX shader: `#e3f0dd` renders as `#c0c4be`. The scene loses its warmth.
* **Neutral keeps the palette as authored.** It only compresses
  highlights (emissive windows, bloom), which suits a palette-driven art
  direction (CLAUDE.md §5).
* **Brightness is matched to `main`.** Fill lights were raised until the
  mean luma of the plot matched: 145.0 on this branch vs 145.9 on `main`.

### D3 — Soft shadows

three r184 deprecates `PCFSoftShadowMap`. The Canvas therefore uses
`shadows="percentage"` (PCF), and softness comes from `shadow-radius`.

### D4 — Preview camera

* `CameraControls` now owns both cameras:
  * the orthographic camera, used for editing
  * the perspective camera, used for Preview
* **Entering Preview:** the perspective camera takes the editing camera's
  viewing direction, at a distance that shows the same world height.
* **Leaving Preview:**
  * the editing camera takes the Preview camera's direction
  * zoom is restored from when Preview was entered, scaled only by how far
    the user dollied in Preview
  * The canvas resizes around the switch, so zoom cannot be recomputed from
    the frustum.
* **Orbit limits** are now 8–400 m. Perspective dolly needs them; the
  orthographic camera never gets near either limit.

### D5 — Emissive levels unchanged

Windows sit at the bloom threshold, which gives a subtle glow — "avoid
excessive bloom" (CLAUDE.md §26). Stronger night emissives belong to the
Stage 7 time-of-day presets.

### D6 — SkyBackdrop effect

* **Problem:** with a transparent canvas, the tilt-shift blur left bright
  fringes around every silhouette.
  * Isolated by turning each effect on and off: bloom and AO were
    innocent; the blur was not.
  * Root cause: the composer's final pass sRGB-encodes pixels whose alpha
    is only partly covered, and the browser then composites them over the
    CSS background.
  * Reordering the effects does not help.
* **Fix:** a small custom effect composites the sky gradient **under** the
  tone-mapped image (premultiplied "over"), before the blur.
  * Coverage is read from `inputBuffer`, because bloom widens alpha.
  * The sky stays out of bloom and tone mapping, so it matches the editor
    exactly.
* **Rejected alternative:** a tone-mapped WebGL background. It would need
  pre-compensated colors up to 7.9 (HDR) to survive tone mapping, and the
  whole sky would then bloom.
* **Side benefit:** the Preview frame is now opaque, which Stage 7 PNG
  export needs.

## 3. Files

| Change | Files (under `features/diorama/`) |
|---|---|
| New | `components/PostEffects.tsx`, `components/SkyBackdropEffect.ts`, `components/SceneFog.tsx` |
| Modified | `components/CameraControls.tsx` (camera rig), `components/DioramaCanvas.tsx`, `components/SceneLighting.tsx`, `utils/palette.ts` |
| Project | `package.json`, `package-lock.json` |

## 4. Verification

All checks were done in headless Chrome on the real GPU (GTX 1660 SUPER).

| Check | Result |
|---|---|
| Preview reads as a photographed model | Perspective, longer soft shadows, contact AO, tilt-shift. Before/after compared against `main`. |
| Silhouette fringes | Gone, confirmed on zoomed crops at the tree top and base edge. |
| Enter → exit Preview | The editing view is unchanged: max diff 2/255, mean 0.04/255. |
| First load, then straight into Preview | Correct framing. This was a bug found during verification (§5). |
| All 4 presets, editor and Preview | Correct, including Top in Preview. |
| `?dev=blockout` in Preview | Lit correctly. |
| 100 objects at 1920×1080 | Editor **111 fps** (target ≥ 50), Preview **104 fps** (target ≥ 40). |
| Stage 1 editor checks rerun | Import v1, newer-version error, grid options, spawn, duplicate, undo/redo, properties in meters, focus: all pass. |
| `npm run lint`, `npm run build` | Pass. No page errors in any run. |

## 5. Bugs Found and Fixed During Verification

* **Wrong first frame.**
  * On first load the rig matched the editing camera to R3F's
    placeholder camera, so the initial view was zoomed in from the front.
  * It only showed when Preview was entered before any preset was clicked.
  * Fix: only switches between the two rig cameras are matched.
* **Leaving Preview flipped the editing view to straight-down.**
  * `position.copy(target).addScaledVector(dir, position.distanceTo(target))`
    evaluated the distance after the copy, so it was 0.
  * Fix: the distance is computed first.

## 6. Known Limitations

* **The blockout looks small in every preset,** because presets still
  frame the 50 m legacy plot. The Stage 4 corner base reframes.
* **The tilt-shift focus band is fixed** at the middle of the screen.
  Click-to-focus is Stage 7.
* **Lighting was tuned on the legacy procedural assets.** Re-check it when
  the first Blender GLBs land in Stage 3.
* **Preview effects have fixed settings.** Nothing is exposed in the UI
  yet.
