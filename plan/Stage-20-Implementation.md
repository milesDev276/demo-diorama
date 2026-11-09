# Stage 20 — Photo Studio (Implementation Plan)

Follows [Stage-19-Implementation.md](Stage-19-Implementation.md) (object
colors and sign text, merged in PR #22).

> **User request (2026-11-08):** "hãy thiết kế stage 20": design Stage 20.
> The topic was not named. The backend is still paused (HANDOFF §7), so
> this is a UI stage. Of the UI candidates left open (the home page, the
> Preview / photo bar, resizable panels, outfit colors, more editable
> signs), this plan takes **the Preview / photo bar**: the survey below
> found real defects there, and it is the screen where a diorama becomes
> a photograph (CLAUDE.md §27).

**Goal:** Preview becomes a dependable little photo studio on an
ordinary laptop screen. What is on screen is exactly what "Save photo"
writes; the bar fits on one row and reads cleanly; changing the frame
does not cut the diorama off; clicking to focus shows where the focus
went. No scene-data change, no new effect, no change to how an exported
photo is rendered.

Branch: `stage20-photo-studio`, cut from `main` at `326abb1` (Stage 19
merged in PR #22) on 2026-11-08. The plan file is untracked on it.

**Status (2026-11-09):** implemented and verified. The user approved the
plan with "tôi đồng ý theo ý kiến của bạn" (its defaults, 2026-11-08).
Results are in §6.

---

## 0. What Was Found (screenshots, 2026-11-08, `main` at `326abb1`)

Back Street and Residential Lane in Preview, headless Chrome, at
1366 × 768 and 1920 × 1080:

1. **The bar hides part of the photo.** With the Free frame the canvas is
   the whole window and the bar floats over it. At 1366 × 768 the bar is
   two rows, 1342 × 112 px, and covers the front of the base, yet "Save
   photo" writes the full canvas, including the strip under the bar that
   the user cannot see. (The framed shapes already stop above the bar,
   with a fixed 144 px bottom padding in `DioramaCanvas`.)
2. **Frame labels break inside the word:** "Fre / e" and "16: / 9", at
   1366 and at 1920 alike. Stage 18 let segment labels wrap anywhere so
   the inspector never overflows; in the photo bar's wrapping flex row the
   frame control gets squeezed instead. Stage 18's overflow check covered
   the side panels only.
3. **The bar needs two rows below about 1420 px.** One row is 1399 px
   wide at 1920. The parts that cost width without being controls: "Exit
   Preview" with its divider (≈ 150 px) and the size readout
   "2732 × 1536 px" (≈ 110 px).
4. **A narrower frame cuts the diorama off.** Free → 4:5 on Residential
   Lane at 1366 × 768: the frame is 480 × 600 px and both ends of the
   street are outside it. The perspective camera keeps its vertical field
   of view, so a narrower frame only crops the sides, and nothing in
   Preview frames the scene again: the camera presets live in the
   editor's sub-toolbar, which Preview hides.
5. **Focus gives no feedback.** A click on the scene sets the tilt-shift
   focus, but nothing marks the point, and the only explanation is a
   `title` tooltip on the Blur/Exposure group.
6. **The export size is a multiplier** ("2×") with the pixel size printed
   beside it; the pixels are what a user decides by.

Not a problem: time of day and weather icons have tooltips and
`aria-label`s; Esc leaves Preview; exports are correct in size and never
include the bar (they render the canvas only).

---

## 1. Decisions

### D1 — What you see is what you save

* In Preview the canvas **never lies under the photo bar**, in any frame.
* **Free:** the canvas fills the window above the bar (the window's width,
  down to the bar's top edge minus a 12 px gap). The strip behind the bar
  shows the sky gradient, as the window does today.
* **1:1, 4:5, 16:9:** as today, centered on the mat, but the bottom
  padding is the bar's measured height plus the gap instead of a fixed
  144 px, so a one-row bar gives the frame more room.
* The bar's height is measured (a `ResizeObserver` in `PhotoBar`) and kept
  as editor state (`photoBarHeight`, never saved); it changes only when the
  bar wraps, not per frame.
* Exports are unchanged: the canvas, at the chosen size.

### D2 — The bar on one row at 1366 px

```text
 ← Back to editor                                   (top-left chip, Esc)

 ┌──────────────────────────────────────────────────────────────────────┐
 │ ☀ ◐ ✦ ☾ ●  │ ☁ ☂ ≋ ❄ ○ │ Free 1:1 4:5 16:9  ⛶ Fit │ Blur ─●─  Exposure ─●─ │ 2732 × 1536 ▾  [📷 Save photo] │
 └──────────────────────────────────────────────────────────────────────┘
```

* **"Exit Preview" leaves the bar** and becomes a small floating chip at
  the top-left, "← Back to editor". Esc still leaves Preview.
* **The size menu lists pixel sizes** ("1366 × 768", "2732 × 1536", …,
  computed from the frame as today's readout is); the separate readout
  goes. Internally it is still `photo.scale` (1–4), editor state.
* **Saving says so on the button:** "Saving…", then "Saved" with a check
  for two seconds, or "Could not save" in the error color; the text is
  also announced (`role="status"`, visually hidden).
* **No label breaks inside a word**, anywhere. The bar's controls do not
  shrink (`shrink-0`); `SegmentedControl` wraps a label only between
  words. The inspector keeps fitting (Stage 18 D4 is re-checked).
* Order: time of day, weather | frame, Fit | Blur, Exposure | size, Save.
* **Target:** one row, at most 1342 px wide, at 1366 × 768. A narrower
  window may wrap to two rows; D1 keeps the canvas above it either way.

### D3 — Changing the frame keeps the shot; Fit frames the diorama

* **A narrower frame dollies the camera back** by the ratio of the old
  and new aspect, so everything that was visible across the frame stays
  visible. A wider frame leaves the camera where it is (more shows at the
  sides). This applies to Free too, when the window's shape is what
  changes the aspect.
* **"Fit" (and the F key in Preview)** frames the whole diorama — the
  base and everything on it — from the current viewing direction, with a
  small margin, in a 450 ms glide. It works in every frame.
* Both go through the rig's existing transition and rest-recording, so
  the saved view (Stage 14) follows as it does after an orbit.
* F keeps its editor meaning (focus the selection) outside Preview; the
  editor's shortcuts are off in Preview, so there is no clash.

### D4 — Focus shows where it went

* **A ring marks the clicked point** for 1.5 s, then fades. It is a DOM
  element over the canvas, placed at the click, so it can never appear in
  an exported photo.
* **Entering Preview shows one line of help** at the top center: "Drag to
  turn · Scroll to zoom · Click to choose what stays sharp". It fades
  after 4 s or at the first pointer press on the canvas, whichever comes
  first. The tooltip on the slider group goes.

### D5 — Keyboard and accessibility

* "Back to editor" and "Fit" are buttons with visible labels and focus
  rings; the size menu keeps its `aria-label`.
* Esc leaves Preview; F fits. Neither fires while focus is in the size
  menu or a slider.
* The help line is `role="status"` (announced once, not repeated).

### D6 — Nothing saved changes

No change to the scene file, its validator, the photo settings that are
saved (frame, focus, blur, exposure) or the export renderer. `photo.scale`
and `photoBarHeight` are editor state.

---

## 2. Files

| File | Change |
|---|---|
| `features/diorama/components/PhotoBar.tsx` | One-row layout, pixel size menu, save feedback on the button, Fit button, measures its own height (D1, D2, D3) |
| `features/diorama/components/PreviewOverlay.tsx` (new) | The "Back to editor" chip, the help line and the focus ring (D2, D4), so `PhotoBar` stays a bar |
| `features/diorama/components/DioramaCanvas.tsx` | The Free canvas stops above the bar; the framed mat's bottom padding comes from `photoBarHeight` (D1) |
| `features/diorama/components/CameraControls.tsx` | `fitScene()` in the camera API; dolly on a narrower aspect (D3) |
| `features/diorama/utils/cameraFit.ts` (new, added while implementing) | What Fit frames and the view that frames it (D3) |
| `features/diorama/components/PhotoStudio.tsx` | Reports the focus click's screen point for the ring (D4) |
| `features/diorama/components/SegmentedControl.tsx` | Labels wrap only between words (D2) |
| `features/diorama/components/DioramaEditor.tsx` | Mounts the overlay in Preview |
| `features/diorama/store/dioramaStore.ts`, `types/diorama.types.ts` | `photoBarHeight`, `focusPing` (screen point + time) as editor state; `fitScene` on the camera API |
| `scripts/capture-template.mjs` | The frame-height formula follows the new mat padding (it scales the hero's zoom) |
| `plan/HANDOFF.md`, `plan/Product-Roadmap.md` | Status; Stage 19 recorded as merged (PR #22) |

---

## 3. Out of Scope

Camera presets or a lens / focal-length control in Preview; season in the
bar; new frames, borders or backgrounds; a hide-the-controls mode; JPEG or
other formats; depth of field beyond today's tilt-shift; batch shots;
sharing; any change to the side panels, the assets or the scene format.

---

## 4. Verification

* `npm run lint`, `npx tsc --noEmit`, `npm run build`.
* **Screenshots before and after** at 1366 × 768, 1536 × 864 and
  1920 × 1080: Back Street and Residential Lane in Preview, every frame.
* **Measured (headless Chrome):**
  * the bar's rows and width at the three sizes (target: one row,
    ≤ 1342 px at 1366);
  * the canvas's bottom edge is above the bar's top in every frame and
    size (D1);
  * no control in the bar or the side panels is wider than its container,
    and no one-word label is broken (Stage 18's check, extended to the
    bar);
  * a saved PNG's size equals the size the menu shows, in every frame.
* **Behavior, real mouse and keyboard input:**
  * Free → 4:5: the base's corners that were inside the frame are still
    inside (projected through the camera); 4:5 → 16:9 does not move the
    camera;
  * Fit and F: all base corners and the tallest object's top inside the
    frame, from three directions, in every frame;
  * a focus click shows the ring and sets the focus; a photo saved while
    the ring is showing has no ring (pixel compare with one saved after it
    faded);
  * the help line fades by itself and at the first press;
  * Back to editor and Esc leave Preview; the view recorded after Fit is
    the one the editor opens with;
  * keyboard only: Tab reaches the chip, every control, Fit and Save with
    visible focus rings.
* **Starters unchanged:** `capture-template.mjs` renders the three
  starters within `main`'s own noise (mean pixel difference ≈ 0.17); the
  hero image too (`--hero`).

---

## 5. Open Questions (settled by the defaults in bold, 2026-11-08)

1. **Topic of Stage 20:** **the Preview / photo bar (this plan)**; or the
   home page; or resizable / collapsible side panels; or outfit colors
   for figures.
2. **The Free frame:** **stops above the bar (D1)**; or keep it
   full-window and let the bar hide the controls on demand.
3. **Exit:** **a "Back to editor" chip at the top-left (D2)**; or keep it
   in the bar.
4. **A frame change:** **dolly back on a narrower frame (D3)**; or always
   Fit the whole diorama; or leave the camera alone and offer only Fit.
5. **The size menu:** **pixel sizes (D2)**; or keep the multiplier with
   the readout.

---

## 6. Results (2026-11-09)

### What was built

* **Store (editor state, never saved):** `photoBarHeight` (the bar's
  measured height, 0 outside Preview) and `focusPing` (the last focus
  click's viewport point and time), with `setPhotoBarHeight` and
  `pingFocus`. The camera API gained `fitScene()`. Types: `FocusPing` in
  `diorama.types.ts`.
* **`DioramaCanvas`:** in Preview the canvas keeps clear of the bar by the
  bar's height + 20 px (its inset) + 12 px (the gap). Free: the canvas
  spans the window above that; behind the bar the sky gradient's last
  stop carries on, so there is no seam. Framed: the mat's bottom padding is
  the same clearance instead of a fixed 144 px. Until the bar has been
  measured the clearance assumes its old two-row height (112 px).
* **`PhotoBar`:** one row: time of day and weather (icons with tooltips),
  frame and **Fit**, Blur and Exposure, the size menu and **Save photo**.
  The size menu lists pixel sizes ("2732 × 1368"); the button reads
  "Saving…", "Saved" (two seconds) or "Could not save" (in red), and a
  visually hidden status line announces the result. Every control is
  `shrink-0`. Esc leaves Preview and F fits, except while focus is in the
  size menu or a slider. A `ResizeObserver` reports the bar's height.
* **`PreviewOverlay` (new):** the "Back to editor" chip at the top-left;
  the help line ("Drag to turn · Scroll to zoom · Click to choose what
  stays sharp"), which fades after 4 s or at the first press on the
  canvas; the focus ring at the click point (1.8 s with its fade). Each
  element carries `data-preview-overlay`.
* **`PhotoStudio`:** a focus click also calls `pingFocus` with the click's
  viewport point.
* **`SegmentedControl`:** labels wrap only between words (the
  `overflow-wrap: anywhere` of Stage 18 is gone).
* **`CameraControls`:**
  * `fitScene()`: from the current viewing direction, the tightest view
    that holds every visible mesh with 6 % of the frame free on each side,
    in the rig's 450 ms glide; the view it ends in is recorded like any
    other.
  * A frame choice that narrows the canvas moves the camera back by the
    ratio of the aspects (ignored under 1 %). The Preview entry's
    reference height is scaled by the same factor, so leaving Preview and
    the recorded view keep the editing zoom.
* **`utils/cameraFit.ts` (new):** `sceneFit(scene, template)` collects the
  corners of every visible mesh's box, clipped to the base's outline (plus
  0.6 m for the platform's rim) on X/Z; `fitView(...)` solves the target and
  the distance in closed form (in camera axes the visibility conditions are
  linear in the camera's position).
* **`scripts/capture-template.mjs`:** hides `[data-preview-overlay]`
  before taking the screenshot; its frame-height numbers are kept (see
  below).

### Deviations from the plan

* **D3, only a frame choice moves the camera,** not the window or the
  panels resizing the canvas (the plan said a change of the window's
  shape would too). Entering Preview resizes the canvas in several steps
  as the panels slide out, and some of those steps are narrower than the
  last; following them would have zoomed out on every entry. Entering
  Preview with a saved 4:5 frame therefore still crops the sides, as
  before: Fit frames it.
* **D3, Fit frames per mesh and centers the result,** instead of one box
  around everything: one box made a 10 m utility pole count as a 10 m
  block over the whole base, and the shot came out at about 60 % of the
  frame. On the axis that limits the shot the content is centered
  exactly; on the other axis it can be off by up to 0.05 of the frame's
  half-size (perspective; centering it exactly would need an iteration).
* **D1, the framed shapes grew:** the bottom padding is the bar's real
  height, so at 1366 × 768 a 4:5 frame is 528 × 660 px (was 480 × 600) and
  its export at 2× is 1056 × 1320.
* **Starter images were not re-rendered.** With the overlay hidden,
  `capture-template.mjs` renders the three starters with a mean pixel
  difference of 1.8–2.0 from the committed images (0.17 for `main`
  itself), and the hero 1.2. A difference image shows only thin outlines
  of every edge, the same thickness everywhere; the sky and flat areas are
  identical. The cause is resampling: in the 1600 × 1000 capture window
  the 16:9 frame is now 1552 px wide (was 1479; the shorter bar leaves it
  width-limited), and the screenshot is scaled down to 640 px from a
  different size. Switching the frame-change dolly off gave the same
  numbers, so it is not the cause. The content and framing are unchanged,
  so the committed images were kept. The script's frame-height formula
  keeps the Stage 7–19 numbers: only their ratio is used (the hero's
  zoom), and changing them would have reframed the hero.

### Verification

* `npm run lint`, `npx tsc --noEmit`: clean. `npm run build`: passes.
* **Measured (headless Chrome, dev server; Back Street and Residential
  Lane, every frame):**

  | | 1366 × 768 | 1536 × 864 | 1920 × 1080 |
  |---|---|---|---|
  | Bar before (rows, width × height) | 2 rows, 1342 × 112 | 2 rows | 1 row, 1399 × 68 |
  | Bar after | 1 row, 1296 × 52 | 1 row, 1296 × 52 | 1 row, 1296 × 52 |
  | Canvas bottom above the bar's top, every frame | yes (12 px gap) | yes | yes |
  | Controls wider than their container (bar and panels) | none | none | none |
  | One-word labels broken across lines (bar and panels) | none (before: "Fre/e", "16:/9") | none | none |

  The panels were checked with nothing selected and with the building
  selected (Stage 18's check).
* **Behavior, real mouse and keyboard input, Residential Lane at
  1366 × 768: 32 of 32 checks passed,** no page errors:
  * the help line shows on entry, fades by itself after about 4 s, shows
    again on the next entry and goes at the first press on the canvas;
  * Free → 4:5 (clicked): every mesh corner that was inside the frame is
    still inside (the camera went from 59.2 to 147.7 m); 4:5 → 16:9 does
    not move the camera;
  * F in 4:5, 16:9 and Free, from three directions each, and the Fit
    button: every visible mesh corner inside the frame, the outermost at
    exactly 0.88 of the half-frame (the 6 % margin), centered on the
    limiting axis (offset 0.000) and within 0.048 on the other;
  * the view recorded after Fit has Fit's target;
  * F and Esc do nothing while the size menu has focus;
  * saved PNGs are the size the menu shows (4:5 at 2×: 1056 × 1320;
    Free at 3×: 4098 × 2052); the button says "Saved", then "Save photo"
    again;
  * a focus click sets the focus and shows the ring, which has faded
    after 2 s; a photo saved while the ring showed is pixel-identical to
    one saved after (mean difference 0.000);
  * "Back to editor" and Esc leave Preview;
  * Tab reaches "Back to editor", Fit and Save photo, each with a visible
    focus ring.
* **The editing zoom survives a frame change:** Back Street, Preview,
  Free → 4:5 (the camera moved back ×2.5), leave Preview: the
  orthographic zoom is 22.6667 before and after, and no view was
  recorded.
* Screenshots before (`main`) at 1366 × 768 and 1920 × 1080, and after at
  1366 × 768, 1536 × 864 and 1920 × 1080, of Preview in every frame.

### Known limitations

* Not tried in the user's own browser.
* A run of narrower frame choices moves the camera back each time, and a
  wider one never brings it closer: 16:9 → 4:5 → 16:9 ends further away.
  Fit (F) frames the diorama again.
* Entering Preview with a saved narrow frame crops the sides (see
  Deviations).
* The "Back to editor" chip sits over the canvas's top-left corner (it is
  never in the photo).
* In headless Chrome the canvas takes its Preview size late (HANDOFF §5);
  the frame-change numbers above come from that browser.
