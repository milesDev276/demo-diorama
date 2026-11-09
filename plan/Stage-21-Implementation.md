# Stage 21 — Room to Work (Implementation Plan)

Follows [Stage-20-Implementation.md](Stage-20-Implementation.md) (the photo
studio, merged in PR #23).

> **User request (2026-11-09):** "hãy thiết kế stage 21": design Stage 21.
> The topic was not named. The backend is still paused (HANDOFF §7), so
> this is a UI stage. Of the UI candidates left open (the home page,
> resizable or collapsible panels, outfit colors, more editable signs,
> the editing camera fitting the window), this plan takes **the editor's
> workspace: the camera that fits the canvas, and side panels that can
> make room for it**. The survey below found that the first thing a new
> visitor sees on a laptop is a diorama cut off at three edges.

**Goal:** on any desktop window, from 1280 × 720 to 1920 × 1080 and
beyond, the editor opens with the whole diorama in view and filling the
canvas; the camera presets and a Fit button frame it again whenever
asked; the user can fold either side panel away, or widen it, to give the
canvas or the panel the room the task needs; and the object list shows
the names of the objects. No scene-data change, no new asset, no change
to Preview or to how a photo is rendered.

Branch: `stage21-workspace`, cut from `main` at `c2d1661` (Stage 20 merged
in PR #23) on 2026-11-09. The plan file is untracked on it.

**Status (2026-11-09):** approved with "tôi đồng ý với recommend của bạn" (the
defaults in bold, §5). Implemented and verified; results are in §6.

---

## 0. What Was Found (screenshots and measurements, 2026-11-09, `main` at `c2d1661`)

The three starters in the editor, headless Chrome, at 1280 × 720,
1366 × 768 and 1920 × 1080, each camera preset; the home page and My
Dioramas at 1366 × 768.

1. **The presets do not fit the canvas.** A preset's zoom is a fixed
   number of screen pixels per meter per base (`presetZoom` in
   `baseTemplates.ts`), tuned on a large window. The canvas is 656 × 522
   px at 1280 × 720, 742 × 570 at 1366 × 768 and 1296 × 882 at
   1920 × 1080, so:
   * **Autumn Street Corner (the starter a first visit opens) at
     1366 × 768, Isometric:** the scene spans x −14…756 and y −70…573 px
     in a 742 × 570 canvas. The building's roof and water tank, the left
     road edge and the platform's front corner are cut off. At
     1280 × 720 it is worse (x −57…713, y −94…549). Front and Top crop it
     too.
   * **Residential Lane at 1920 × 1080:** the scene fills 51 % of the
     canvas's width and 51 % of its height; the diorama sits small in a
     sea of sky.
   * The "Reset camera" button (the crosshair) is the Isometric preset, so
     it crops the same way. HANDOFF §6 lists this as a known limitation
     ("the editing camera does not fit the scene to a small window").
2. **The canvas cannot get more room.** The side panels are 256 px and
   288 px wide, always; at 1366 × 768 they and the gaps take 46 % of the
   window's width. There is no way to fold them away while arranging, nor
   to widen the library for more items per row.
3. **The object list cuts names short:** "Storage S…", "Potted Pl…",
   "Plastic C…", "Electric …", "Vending Ma…". The lock and delete buttons
   are invisible until hover (`opacity-0`) but still take their 42 px, so
   a name gets about 90 px of a 256 px panel. The full name is not in a
   tooltip either.
4. **The object list is not usable from the keyboard.** A row is
   `role="button"` with `tabIndex={0}` but has no key handler, so Enter
   and Space do nothing; the lock and delete buttons stay invisible when
   they have focus.
5. **The home page's background stops at the first screen.** `body` is
   `h-full` and a flex column, so the page's gradient wrapper is one
   screen tall; scrolling down shows a hard edge across the starter cards
   where the gradient ends and the plain `body` color begins.

Not a problem: My Dioramas reads well; the editor's toolbars fit at
1280 px; Preview frames itself since Stage 20 (Fit).

---

## 1. Decisions

### D1 — The presets frame the diorama in the canvas

* **Isometric, Front, Side and Top keep their viewing directions**
  (`CAMERA_PRESETS`) but no longer have a fixed zoom: each one computes
  the orthographic zoom and the orbit target that hold the whole
  diorama — the base, the platform and everything on it — in the canvas
  as it is now, with 6 % of the canvas free on every side (Stage 20's
  `FIT_MARGIN`).
* **What counts is what Preview's Fit counts:** `sceneFit()` (every
  visible mesh's own box, clipped to the base's outline plus the
  platform's rim). Editor-only helpers are left out: the transform gizmo,
  the selection ring and pivot, the brush and placement ghosts, the grid.
  They are marked as helpers and `sceneFit` skips marked subtrees.
* **The fit is exact for an orthographic camera:** project the points on
  the camera's right and up axes; the zoom is the smaller of
  `canvasWidth · (1 − 2m) / spanX` and `canvasHeight · (1 − 2m) / spanY`,
  clamped to `CAMERA_ZOOM_RANGE`; the target is the middle of both spans
  (moved along the viewing direction to the height it had, so orbiting
  still turns around the diorama, not a point under it). A new
  `orthoFitView()` beside `fitView()` in `utils/cameraFit.ts`.
* **`presetZoom` goes** from `BaseTemplate`; nothing else uses it.
* **Opening a diorama with no saved view** (a new one, a starter, an old
  file) fits it with Isometric — **after its models have loaded**: the
  fit waits until the scene's GLBs are in (the loading manager is idle,
  at most 5 s), so a building that arrives late is not left half outside.
  Until then the camera shows the base, already fitted.
* **A saved view opens as it was saved** (Stage 14 D6: position, target,
  zoom in pixels per meter). No scene-format change. A view saved on a
  larger screen can open cropped on a smaller one; Fit (D3) is one key
  away. (Open question 4.)
* Changing the base or the plot's size fits the new base with Isometric,
  as it re-framed with the preset before.

### D2 — The shot survives the canvas changing size

The canvas changes size when the window does, when a panel folds or
unfolds (D4) or is dragged wider (D5), and when the error banner shows.

* **A fitted view stays fitted.** After a preset, Fit, or the opening fit
  the view counts as *fitted* until the user orbits, pans, zooms or
  focuses a selection. While it is fitted, every canvas size change fits
  it again from the same direction, at once (no glide), so folding a
  panel lets the diorama grow into the space, and shrinking the window
  keeps it whole.
* **Any other view keeps what it showed.** The zoom is scaled down when
  the canvas gets smaller, by the smaller of the width and height ratios,
  so nothing that was in view leaves it; it is not scaled up when the
  canvas grows (more shows around it). The ratios are taken against the
  canvas size and zoom at the user's last gesture (the *base*, as Stage
  20's frame dolly does), so shrinking and growing the window back
  returns to the same zoom instead of drifting.
* Not in Preview: Preview has its own camera and Stage 20's rules.
  Entering and leaving Preview resizes the canvas as the panels slide;
  the rule is suspended from the moment Preview is asked for until the
  editor's canvas has been the same size for two frames after leaving
  it, and the base is taken again then.
* A size change does not record the view (the saved view is the user's
  framing, not the window's); the next gesture or preset records as
  today.

### D3 — Fit in the editor

* **The crosshair button becomes "Fit"**: the same icon-and-label button
  as Preview's Fit, at the end of the camera presets. It frames the whole
  diorama from the current viewing direction, in the rig's 450 ms glide
  (Isometric is still one click away for the default direction).
* **F with nothing selected fits the diorama;** F with a selection still
  focuses the selection (Stage 2). The sub-toolbar's tooltip says so.
* `cameraApi.resetCamera` becomes `fitScene`, which now works on both
  cameras (orthographic: D1's fit; perspective: Stage 20's).

### D4 — Side panels fold away

```text
 unfolded                                   both folded (\)
┌────────┬──────────────────────┬────────┐  ┌──┬──────────────────────────────┬──┐
│Library◂│                      │▸ Object│  │▤ │                              │◧ │
│        │        canvas        │  Scene │  │☰ │            canvas            │⚙ │
│        │                      │        │  │  │                              │  │
└────────┴──────────────────────┴────────┘  └──┴──────────────────────────────┴──┘
```

* Each panel's tab bar gets a **fold button** (a chevron pointing toward
  the window's edge, "Hide library" / "Hide inspector").
* **A folded panel is a 48 px rail** with one icon button per tab
  (Library, Objects with its count as a badge; Object, Scene) and an
  unfold chevron. Clicking a tab's icon unfolds the panel on that tab.
* **`\` folds or unfolds both panels at once** (both fold if either is
  open). It is free today, does not clash with the browser, and does not
  fire in a text field. `[` and `]` stay the brush sizes.
* **Selecting an object does not unfold the inspector by itself**; the
  rail's Object icon shows a dot while there is a selection, so the user
  sees that there is something to inspect.
* Folding animates the width (250 ms, as Preview's slide); D2 keeps the
  shot through the animation.
* Below 1024 px the right panel and below 768 px the left one are hidden,
  as today (desktop only).

### D5 — Side panels can be widened

* **Drag the panel's inner edge** to change its width: the library 240–420
  px (default 256), the inspector 272–420 px (default 288). The library's
  asset grid adds a column when it has the room (cards keep their size);
  the object list simply has longer names.
* **Double-click the edge** to go back to the default width.
* **Keyboard:** the edge is a focusable `role="separator"` with
  `aria-valuenow` / `min` / `max` and a visible focus ring; ← and → change
  the width by 16 px, Home and End jump to the limits.
* The canvas never gets narrower than 480 px: a drag stops there.

Folding and width are **editor preferences of this browser**, not scene
data: one `localStorage` entry (`diorama-editor-layout`), read and written
inside `try/catch`, written when a drag ends or a panel folds (not per
pointer move). Without storage the defaults apply.

### D6 — The object list shows names and works from the keyboard

* **The name takes the whole row.** The eye, lock and delete buttons sit
  over the row's right end only while the row is hovered, holds focus
  (`focus-within`) or is selected, on a short fade of the row's own
  background so they never cover text abruptly.
* **State stays visible without hover:** a hidden object shows its
  crossed-out eye, a locked one its lock, as small marks at the right.
* **The full name is the row's `title`**, and the scatter piece count
  stays beside it.
* **Enter or Space selects a row, Shift+Enter adds it to the selection;**
  ↑ and ↓ move the focus between rows (one Tab stop for the list, the
  row with the selection first). The buttons inside a row are reachable
  with Tab from that row and become visible when focused.

### D7 — The home page's background covers the page

`body` becomes `min-h-full` (the editor's own `h-screen` wrapper keeps the
editor exactly one screen tall), so the home page's gradient runs to the
footer. No other change to the home page in this stage.

### D8 — Nothing saved changes

No change to the scene file, its validator, the saved view (Stage 14) or
the photo settings. The *fitted* flag, the resize base, and the panel
layout are editor state; the layout is remembered per browser (D5).

---

## 2. Files

| File | Change |
|---|---|
| `features/diorama/utils/cameraFit.ts` | `orthoFitView()` (D1); `sceneFit` skips subtrees marked as editor helpers |
| `features/diorama/components/CameraControls.tsx` | Presets and the opening fit through `orthoFitView`; `fitScene` on both cameras; the *fitted* flag (D1, D3) |
| `features/diorama/hooks/useCanvasResizeZoom.ts` (new) | D2's rules, out of `CameraControls` (which is at 324 lines), alongside `useFrameDolly` |
| `features/diorama/hooks/useOpeningFit.ts` (new, added while implementing) | The opening fit and following late models, out of `CameraControls` (D1) |
| `features/diorama/utils/editorHelpers.ts` (new, added while implementing) | `EDITOR_ONLY` / `isEditorHelper`, shared by thumbnails and fits (D1) |
| `features/diorama/utils/editorLayout.ts` (new, added while implementing) | Panel widths, ranges, the rail, the canvas floor, guarded `localStorage` (D4, D5) |
| `features/diorama/utils/baseTemplates.ts`, `cameraPresets.ts` | `presetZoom` removed; presets are directions only |
| `features/diorama/components/SelectionRing.tsx`, `SelectionPivot.tsx`, `PlacementLayer.tsx`, `BrushLayer.tsx`, `GroundBrushLayer.tsx`, the gizmo in `SceneObjects.tsx`, the grid in `DioramaCanvas.tsx` (drei's `Grid` is a mesh) | Mark their roots as editor helpers (D1) |
| `features/diorama/components/EditorSubToolbar.tsx` | The crosshair becomes the Fit button (D3) |
| `features/diorama/hooks/useEditorShortcuts.ts` | F with no selection fits; `\` folds both panels (D3, D4) |
| `features/diorama/components/EditorSidePanel.tsx` | Fold button; the folded rail with tab icons, count badge and selection dot (D4) |
| `features/diorama/components/PanelResizeHandle.tsx` (new) | The draggable, keyboard-operable inner edge (D5) |
| `features/diorama/hooks/useEditorLayout.ts` (new) | Reads the stored layout on open, writes it after changes (D5); the state itself is in the store |
| `features/diorama/components/DioramaEditor.tsx` | Columns sized from the layout; rails and handles mounted (D4, D5) |
| `features/diorama/components/ObjectLibrary.tsx` | The asset grid's columns follow the panel's width (D5) |
| `features/diorama/components/ObjectList.tsx` | Row layout, state marks, title, keyboard (D6) |
| `features/diorama/types/diorama.types.ts` | `CameraApi`: `fitScene` replaces `resetCamera` |
| `app/layout.tsx` | `body` `min-h-full` (D7) |
| `scripts/capture-template.mjs` | Sets the starters' zoom absolutely instead of scaling the preset's, so the starter pictures and the hero image do not change |
| `plan/HANDOFF.md`, `plan/Product-Roadmap.md` | Status; Stage 20 recorded as merged (PR #23) |

---

## 3. Out of Scope

A saved view that adapts to the screen it is opened on (open question
4); panels that float or detach; more than two columns of panels; a
minimap; a bigger home page (recent dioramas on it, a gallery); the
mobile layout; Preview, which already frames itself; any change to the
assets, the scene format or the photo export.

---

## 4. Verification

* `npm run lint`, `npx tsc --noEmit`, `npm run build`.
* **Fit, measured (headless Chrome, `?dev=stats`):** the three starters at
  1280 × 720, 1366 × 768 and 1920 × 1080, every preset and Fit: every
  point of `sceneFit` projects inside the canvas, and on the limiting
  axis the content spans 88 % ± 1 % of the canvas (6 % margins). Before
  and after numbers in §6, against §0.
* **The opening fit:** a fresh profile on `/diorama` at 1366 × 768 shows
  the hero whole, roof and water tank included, after the models load;
  measured as above.
* **D2, real input:** with a fitted view, folding each panel and both, and
  resizing the window 1366 → 1920 → 1280 → 1366: still fitted at each step
  (measured). After a zoom gesture: shrinking the window keeps every point
  that was in view, growing it leaves the zoom alone, and the round trip
  ends at the starting zoom (±0.5 %). Entering and leaving Preview five
  times ends at the starting zoom.
* **Panels:** fold and unfold with the buttons, the rail icons and `\`;
  drag both edges to their limits and back; double-click resets; keyboard
  ←/→/Home/End on a focused edge; the canvas never under 480 px; the
  layout survives a reload; with storage blocked (`localStorage` throwing)
  the editor opens with the defaults and no error.
* **Overflow check (Stage 18's, extended):** no control in the panels or
  the bars is wider than its container, at default, minimum and maximum
  panel widths, at the three window sizes.
* **Object list:** at the default width no name in the three starters is
  cut short except where it is longer than the row (count them before and
  after); keyboard only: Tab into the list, ↑/↓, Enter selects,
  Shift+Enter adds, Tab to the eye/lock/delete with visible focus.
* **Home page:** a screenshot scrolled to the bottom shows one continuous
  gradient (pixel check: no step in the background color between rows of
  the page).
* **Nothing else moved:** `capture-template.mjs` renders the three
  starters and the hero image within `main`'s own noise (mean pixel
  difference ≈ 0.17); Preview's Fit and frame dolly behave as in Stage
  20's checks; a saved view opens exactly as saved.

---

## 5. Open Questions (settled by the defaults in bold, 2026-11-09)

1. **Topic of Stage 21:** **the editor workspace (this plan)**; or the
   home page (recent dioramas on it, a fuller landing); or outfit colors
   for figures; or more editable signs.
2. **What a fitted view does when the canvas grows:** **fits again, so the
   diorama grows into the room (D2)**; or keeps its zoom like any other
   view.
3. **Widening the panels (D5):** **in this stage**; or folding only, and
   widths later.
4. **A saved view on a smaller screen:** **opens as saved, Fit is one key
   away (D1)**; or store the view's visible size in meters as well (an
   optional field in the scene file's `camera`, so old files still open),
   and open it at that size on any screen.
5. **The shortcut for folding both panels:** **`\`**; or Tab (as in some
   drawing apps, but it takes Tab away from keyboard navigation); or
   none.

---

## 6. Results (2026-11-09)

### What was built

* **`utils/cameraFit.ts`:** `orthoFitView(fit, direction, up, width,
  height)` returns the orbit target and the orthographic zoom that hold
  every point of `sceneFit` in a canvas of that size with 6 % free on every
  side (projection on the camera's right and up axes; the target lies in
  the plane through the points' center). `sceneFit` now walks the scene
  itself and skips any subtree that `isEditorHelper` matches.
* **`utils/editorHelpers.ts` (new):** `EDITOR_ONLY` and `isEditorHelper`
  (marked `userData`, or three-stdlib's TransformControls), shared by
  thumbnails and fits. The grid and the selection ring were already
  marked; the brush ring, the ground-brush highlight and the placement
  ghost are marked now (so thumbnails leave them out too).
* **`CameraControls`:**
  * a preset glides to the fit along its direction, at the length of its
    position vector (80–82 m) from the target, 550 ms; Fit glides to the
    fit along the current direction, 450 ms; both are recorded as before;
  * a diorama opened without a saved view is fitted on its first frame
    that has a canvas size (not recorded; `hooks/useOpeningFit.ts`), and for 5 s after that the fit
    is re-checked every 400 ms; if models that loaded meanwhile change it
    by more than 0.5 % of zoom or 2 cm of target, the camera glides to the
    new fit. Any gesture ends that;
  * `fittedRef` is set by a preset, Fit and the opening fit, and cleared by
    any orbit, pan or zoom gesture, Focus, a saved view being opened, and
    Fit in Preview;
  * `fitScene()` works on both cameras; `resetCamera` is gone.
* **`hooks/useCanvasResizeZoom.ts` (new):** D2. A fitted view is fitted
  again on every canvas size change (a glide toward a fit is retargeted
  instead); any other view's zoom becomes `base.zoom · min(1, w/base.w,
  h/base.h)`, the base being the canvas and zoom at the last gesture. Off
  in Preview and until the canvas has kept one size for 300 ms after
  leaving it; then a fitted view is fitted once more.
* **`baseTemplates.ts` / `cameraPresets.ts`:** `presetZoom` removed; the
  presets are directions.
* **`EditorSubToolbar`:** the crosshair is now an icon-and-label **Fit**
  button with a focus ring. **`useEditorShortcuts`:** F with nothing
  selected fits; `\` folds or unfolds both panels.
* **Panels:** the store holds `panels: { left, right }` (`width`,
  `folded`) with `setPanelLayout` and `togglePanels` (editor state).
  `utils/editorLayout.ts` (new) has the defaults (256 / 288), the ranges
  (240–420 / 272–420), the 48 px rail, the 480 px canvas floor, the 16 px
  key step and the guarded `localStorage` read/write
  (`diorama-editor-layout`, validated, clamped). `hooks/useEditorLayout.ts`
  (new) applies the stored layout when the editor opens and writes it
  300 ms after the last change.
* **`EditorSidePanel`:** a fold button at the tab bar's outer end
  ("Hide library" / "Hide inspector"); folded, a rail with the unfold
  button and one icon button per tab (Library, Objects with its count;
  Object with a dot while something is selected, Scene). The bodies stay
  mounted while folded, so the library keeps its search and scroll. Tabs
  now size to their labels and share the rest.
* **`PanelResizeHandle.tsx` (new):** the separator in the gap between a
  column and the canvas: drag (pointer capture; the column's width
  animation is off while dragging), double-click for the default, ←/→ by
  16 px, Home/End to the limits, `aria-valuenow/min/max`, a visible bar on
  hover and focus. A drag stops where the canvas would get under 480 px.
* **`ObjectLibrary`:** the asset grid is `auto-fill, minmax(100px, 1fr)`
  (two across at the default width, three from about 360 px); the ground
  grid `minmax(48px, 1fr)` (four, up to seven).
* **`ObjectList`:** each row is an `li` with a main button (icon, name,
  piece count, the hidden/locked marks) and an action strip laid over the
  row's end, opaque in the row's own color, shown on hover, focus inside
  the row, or selection. The full name is the main button's `title`. One
  row holds the Tab stop (its main button and its three controls); ↑/↓,
  Home/End move it; Enter/Space select, Shift+Enter adds. Row backgrounds
  are opaque now (`#F8E6D5` selected, `#FDFBF8` on hover).
* **`app/layout.tsx`:** `body` is `min-h-full`.
* **`scripts/capture-template.mjs`:** sets the starters' pose outright
  (Isometric direction, target (0, 1.8, 0), zoom 34 px/m × the same
  plot and window factors as before), after a synthetic `start` event so
  the opening fit does not take it back.

### Deviations from the plan

* **D1, the opening fit follows late models by checking the fit itself**
  for 5 s, instead of waiting for the loading manager (`useModelsLoaded`
  was not written): the library preloads every model when the editor
  opens, so "loading done" would have waited for models the scene does not
  use, and a re-check catches anything that changes the scene's extent.
* **D1, a fit fills 85–89 % of the canvas on its limiting axis, not
  88 % ± 1 %.** `sceneFit` (Stage 20) counts the base as its outline plus
  0.6 m for a platform rim, at the plinth's bottom; the drawn plinth stops
  at the outline, so the visible content is a little smaller than what is
  fitted. Every point stays inside. Preview's Fit uses the same rule, so it
  was left alone.
* **D5, state in the store, persistence in the hook:** the plan put the
  layout's state in `useEditorLayout`; the store holds it so the `\`
  shortcut, the rails and the handles share it.
* **D2, a view the canvas changed is recorded** once it rests (review
  fix 6), where the plan recorded nothing; a diorama with no saved view
  still records nothing.
* **D6, the list has four Tab stops in one row** (the row's main button
  and its eye, lock and delete), not one: the controls must be reachable
  from the keyboard, and only the row holding the Tab stop exposes them.
* **D4, the tabs size to their labels** (`grow basis-auto`) instead of
  sharing the width equally: with the fold button in the tab bar, "Objects
  73" no longer fitted in half of it at 256 px.

### Review fixes (`/code-review high`, 2026-11-09)

Ten findings, all fixed and checked with real input:

1. **Opening a saved view could zoom it out:** the side columns slide in
   from width 0 when the editor opens, and that shrink counted as a
   resize. The resize rules now also wait for the canvas to settle after
   the editor opens (300 ms of one size), as they did after Preview. A
   saved view on a 1600 × 1000 window reopens identical.
2. **A resize during a glide took its base from the zoom the glide was
   passing through;** it now takes the zoom the glide is heading for, and
   retargets only that.
3. **`useOpeningFit` returned a new object every render,** so the camera
   API was unregistered and registered again on every canvas resize;
   memoized.
4. **The first-frame fit read world matrices before the frame's render
   had updated them;** `sceneFit` updates them first.
5. **Stored widths could crowd the canvas on a narrower window:**
   `fitColumnWidths` (in `editorLayout.ts`) narrows both columns toward
   their minimums, in proportion, so the canvas keeps 480 px (420/420
   stored: canvas 680 px at 1600, 480 px at 1100); stored widths are kept
   for wider windows. The edge drags from the width shown.
6. **A refit was never recorded,** so after folding the panels the saved
   view no longer matched the screen. A view the canvas changed is now
   recorded when it comes to rest — only if the scene already has a saved
   view, so a never-framed diorama keeps opening fitted (preset 28.6 →
   fold → screen and saved view both 34.1).
7. **Folding a column mid-drag left the column animations off;** the edge
   ends its drag when it unmounts or loses pointer capture.
8. **The stored layout was applied after the first paint,** so the
   columns slid to the defaults and then to the stored layout; it is read
   in a layout effect now.
9. **The ghost pieces of a run being dragged out were not marked** as
   editor helpers; they are.
10. **The object list's action strip swallowed clicks** on the end of a
    row; the strip lets clicks through and only its buttons take them.

### Verification

Headless Chrome against the dev server; the scripts were one-off (not in
the repo), built on `Cdp` / `launchBrowser`. "Fill" is the share of the
canvas the content spans on its limiting axis, measured by projecting the
same points `sceneFit` uses through the live camera.

* `npm run lint` clean, `npx tsc --noEmit` clean, `npm run build` passes.
* **Presets and Fit** — the three starters at 1280 × 720, 1366 × 768 and
  1920 × 1080, Isometric, Front, Side, Top and Fit (45 views): every view
  has all points inside the canvas; fill 0.85–0.893 (Isometric 0.86–0.874,
  Front/Side 0.874–0.88, Top 0.87–0.893, Fit 0.85–0.88). Before (§0):
  Autumn Street Corner at 1366 spilled 14 px left and 70 px above the
  canvas; Residential Lane at 1920 filled 0.51.
* **The opening fit** (fresh profile, no saved view), all nine
  starter × size pairs inside the canvas; fill 0.86–0.874 (for example
  Autumn Street Corner at 1366 × 768: zoom 25.9, y 34…525 in a 570 px
  canvas, roof and water tank whole; screenshot checked).
* **D2 with real input** (Back Street, 1366 × 768): `\` folds both panels
  (canvas 742 → 1190 px, still fitted, fill 0.874) and unfolds them
  (0.863); window 1366 → 1920 → 1280 → 1366 while fitted: inside and
  0.863–0.874 at each step. After a wheel zoom (22.93): 1280 → zoom ×0.884
  (= 656/742, everything stays in view), 1920 → ×1.000, back to 1366 →
  ×1.000; five Preview round trips → ×1.0000. Fit and F (nothing
  selected) return to a fitted view.
* **Panels:** dragging the library's edge +300 px stops at 420; dragging
  the inspector's −300 px stops at 386, with the canvas at exactly 480 px;
  double-click → 256; on the inspector's edge Home → 272, ← → 288, End →
  420. The layout is written to `localStorage` and survives a reload (a
  folded inspector reopened folded); with `localStorage` throwing on every
  call the editor opens with the defaults, folds, and logs no error. The
  rail's dot shows only with a selection, and selecting does not unfold.
* **Overflow** (Stage 18's check, extended): at 1280, 1366 and 1920, with
  the panels at 256/288, 240/272 and 420/420, and three tab pairs (Library
  + Scene, Objects + Object, Library + Object with a selection): no control
  outside its column and no one-word label cut or broken (0 problems in 27
  combinations).
* **Object list:** names cut short, `main` → branch: Autumn Street Corner
  8 of 44 → 0, Back Street 9 of 73 → 0, Residential Lane 4 of 54 → 0.
  Keyboard: ↓ + Enter selects that row, ↓ + Shift+Enter adds the next,
  Space selects one row, Tab moves to the row's "Hide …" button with the
  strip visible.
* **A saved view opens as saved:** after a wheel zoom and a reload,
  position, target and zoom are identical to the recorded view.
* **Preview unchanged:** 4:5 then Fit frames Residential Lane inside the
  frame; no page errors anywhere.
* **Home page:** scrolled to the starter cards, one continuous
  background (screenshot).
* **Starter pictures:** `capture-template.mjs` on this branch against the
  same script on `main` (stash): Autumn Street Corner 0.186, Back Street
  0.000, Residential Lane 0.000, hero 0.187 mean difference, i.e. within
  `main`'s own noise. (Both differ from the committed pictures by 1.2–2.0,
  the resampling Stage 20 recorded; the pictures were not re-committed.)

### Known limitations

* **`CameraControls.tsx` is 434 lines** (324 before), over CLAUDE.md's
  ~300: the fit, refit and glide callbacks share the rig's refs; the
  opening fit, the resize rules and the frame dolly are already hooks.

* **A saved view opens at the zoom it was saved with**, also on a smaller
  screen, where it can be cropped: Fit or F frames it (open question 4).
* **From 1024 to about 1070 px wide, with both columns open,** the canvas
  is under 480 px even at the columns' minimum widths (it was narrower
  still before this stage); folding a column gives it the room.
* **A fit leaves 6–7.5 % of the canvas free** on the limiting axis because
  of the platform-rim allowance (see deviations).
* **Below 1024 px the inspector, below 768 px the library is hidden**, as
  before; the rails do not replace them there.
* Not tried in the user's own browser.
