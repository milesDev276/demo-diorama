# Stage 18 — Editor Layout (Implementation Plan)

Follows [Stage-17-Implementation.md](Stage-17-Implementation.md) (merged,
PR #20).

> **User decision (2026-11-02):** after asking for the backend to live in
> its own repository (2026-10-20), the user reconsidered and chose to keep
> improving the UI first. The backend stages of
> [Product-Roadmap.md](Product-Roadmap.md) are paused, so this UI stage takes
> the number 18. Asked which part of the UI comes first, the user picked
> **the editor layout**.

**Goal:** the editor's panels use the screen well on ordinary laptop
screens, the scene settings are reachable at any time, and the toolbar
says what it does. No new editing features; the 3D view and the scene data
do not change.

Branch: `stage18-editor-layout`, cut from `main` (Stage 17 is merged).

**Status (2026-11-07):** implemented and verified. The user approved the
plan with "Hãy thực hiện plan 18" (its defaults). Results are in §6.

---

## 0. What Was Found (screenshots, 2026-11-02)

The Back Street starter was captured in the editor at 1366 × 768,
1536 × 864 and 1920 × 1080:

1. **The library gets little room on a laptop screen.** The left column
   stacks the Object Library over the Scene list in a fixed 3 : 2 split
   (`DioramaEditor.tsx`). At 1366 × 768 the library shows its search box
   and about two rows of ground swatches; the first building is below the
   fold. The Scene list takes the other 40 % even when nobody looks at it.
2. **The scene settings disappear as soon as something is selected.** The
   right panel shows time of day, weather, season, base, ground and
   platform only while nothing is selected (`PropertiesPanel` →
   `ScenePanel`). Changing the light while a building is selected means
   deselecting first. Its header also says "Edit the selected object" when
   it is showing scene settings.
3. **"Night" is cut off** in the time-of-day control at every width: five
   segments do not fit the 288 px panel.
4. **Reset sits between Export and Preview** in the top bar. It replaces the
   scene's objects with the base's defaults; undo brings them back, but it
   is a scene-level action, not a file action.
5. **The way back to My Dioramas is an unlabeled tree icon** (Stage 17
   gave it an `aria-label`, but nothing visible says what it does).
6. **The library has no categories to jump to** (CLAUDE.md §30 asks for
   them): reaching Vehicles or People means scrolling past every section.
7. In development, **Next's "N" badge sits on top of the Scene list**.

Not a problem: Preview fills the window (the canvas resizes about a second
after the panels slide out), and the right panel scrolls when an object has
many settings.

---

## 1. Decisions

### D1 — The left column becomes two tabs: Library and Objects

```text
┌───────────────────────┐
│ [Library] [Objects 73]│   tabs, full height below
│ Search…               │
│ All Ground Buildings… │   category chips (D3)
│ ┌────┐ ┌────┐ ┌────┐  │
│ │    │ │    │ │    │  │
```

* One panel, full height, with a tab bar: **Library** (default) and
  **Objects** with the object count.
* The Objects tab is the current Scene list, unchanged inside (select,
  hide, lock, delete, attachments indented). When a selection is made in
  the canvas and the Objects tab is open, the selected row scrolls into
  view.
* Which tab is open is editor state (CLAUDE.md §11), kept while the editor
  is open, not saved with the scene.
* Picking an item in the library still works as today (click, then click
  a surface).

### D2 — The right column becomes two tabs: Object and Scene

* **Object** shows what the panel shows for a selection today (one
  object, or the multi-selection summary). With nothing selected it shows a
  short hint ("Select something in the scene, or pick an item from the
  library").
* **Scene** shows today's `ScenePanel`: time of day, weather, season,
  base, ground, platform. It is available **with or without a selection**.
* **Switching:** selecting something switches to Object. Clearing the
  selection switches to Scene. Either tab can also be chosen by hand at any
  time. So the panel behaves as it does today unless the user wants the
  scene settings with something selected.
* The header names what is shown: the object's label on Object
  ("Building", "2 objects"), the diorama's name on Scene. The "Edit the
  selected object" line goes.

### D3 — Category chips in the library

* Under the search box: **All**, **Ground**, the asset categories in
  registry order (Buildings, Street, Infrastructure, Props, Nature,
  Vehicles, People) and **Kits**. They are small chips that wrap onto as
  many rows as they need.
* A chip **filters** the library to that section; **All** shows every
  section as today. Search and the chip combine: the search runs inside the
  chosen category.
* The chosen chip is editor state and is kept while the editor is open.

### D4 — Segmented controls fit their panel

* Segments share the width equally and their labels may wrap or shrink
  (11 px) instead of overflowing. Time of day (5 options), weather (5),
  season (4), base (2), plot size (4), platform (3) all fit 288 px.
* A check in the verification script: no control in either panel is
  wider than its container (`scrollWidth > clientWidth`) at any of the
  three widths.

### D5 — The top bar: a labeled way back, Reset leaves it

* Left: **"My Dioramas ›"** as a small text link above the diorama's name
  (a breadcrumb), next to the tree icon, which stays a link too. The name
  stays editable in place, and the object count and save status stay
  under it.
* Right: **New, Import, Export, Preview**, as today, without Reset.
* **Reset moves to the bottom of the Scene tab** as "Reset objects to the
  base's defaults". Like today it is one undo step. The button says that
  Ctrl+Z brings the objects back.

### D6 — Next's development badge is turned off

`devIndicators: false` in `next.config.ts`. It is shown only in
development, but there it covers the bottom of the Objects list and the
screenshots of every verification run. Build errors still show as an
overlay.

### D7 — Keyboard and accessibility

* Both tab bars are `role="tablist"` with `role="tab"` / `tabpanel`,
  `aria-selected`, and arrow keys moving between tabs (CLAUDE.md §44).
* The chips are toggle buttons (`aria-pressed`).
* Existing shortcuts are unchanged. No shortcut is added for the tabs:
  W / E / R, Delete, Ctrl+Z / Y / D / S and Esc are taken, and single
  letters would clash with typing in the search box.

---

## 2. Files

| File | Change |
|---|---|
| `features/diorama/components/DioramaEditor.tsx` | The left column hosts one tabbed panel instead of two stacked ones |
| `features/diorama/components/EditorSidePanel.tsx` (new) | A tabbed panel shell (tab bar + body) used by both columns, so the two look and behave the same |
| `features/diorama/components/ObjectLibrary.tsx` | Category chips (D3); the outer card moves into the shell |
| `features/diorama/components/ObjectList.tsx` | The outer card moves into the shell; scroll the selected row into view |
| `features/diorama/components/PropertiesPanel.tsx` | Split into the Object tab content and the tab logic (D2); the outer card moves into the shell |
| `features/diorama/components/ScenePanel.tsx` | The Reset action at the bottom (D5) |
| `features/diorama/components/SegmentedControl.tsx` | Equal segments that never overflow (D4) |
| `features/diorama/components/EditorToolbar.tsx` | Breadcrumb; Reset removed (D5) |
| `features/diorama/store/dioramaStore.ts` | Editor state: `leftTab`, `rightTab`, `libraryCategory`; selecting / clearing sets `rightTab` (D2) |
| `next.config.ts` | `devIndicators: false` (D6) |
| `plan/HANDOFF.md`, `plan/Product-Roadmap.md` | Status; the roadmap notes that the backend stages are paused and renumbered when they resume |

`PropertiesPanel.tsx` is 295 lines today. Splitting off the tab logic keeps
it under the ~300-line guideline (CLAUDE.md §38).

---

## 3. Out of Scope

Per-object colors and sign text (a candidate for the next UI stage); the
home page and My Dioramas; the Preview / photo bar; resizable or
collapsible panels; mobile and tablet layouts; new shortcuts; any change to
the 3D view, the assets or the scene format.

---

## 4. Verification

* `npm run lint`, `npx tsc --noEmit`, `npm run build`.
* **Screenshots before and after** at 1366 × 768, 1536 × 864 and
  1920 × 1080: Back Street with nothing selected, with the building
  selected, with the Objects tab open, with a chip chosen.
* **Measured:**
  * at 1366 × 768, how many rows of library items are visible without
    scrolling (today about 2; the target is at least 5);
  * no control overflows its panel at the three widths (D4).
* **Behavior:**
  * select an object → Object tab; Esc → Scene tab;
  * choose Scene with a building selected, change the weather → the
    building stays selected and the weather changes;
  * Reset from the Scene tab, then Ctrl+Z → the objects are back;
  * the breadcrumb opens My Dioramas and the last edit is saved (the
    Stage 17 flush);
  * chips with and without a search; keyboard only: Tab into each tab
    bar, arrows switch tabs, focus rings are visible.
* **The Stage 17 end-to-end script** (37 checks) still passes. It uses the
  `My Dioramas` link and the New / Import buttons, which keep their labels.
* **The starters look the same** (`capture-template.mjs`): only panels
  change, not the canvas.

---

## 5. Open Questions (settled by the defaults in bold, 2026-11-07)

1. **Left column:** **tabs Library / Objects (D1)**; a draggable split
   between the two; or the object list moved into the right column.
2. **Right column:** **tabs Object / Scene, switching with the selection
   (D2)**; or keep today's behavior and only fix the header.
3. **Reset:** **moved to the bottom of the Scene tab (D5)**; or kept in the
   top bar with a confirm dialog.
4. **Library categories:** **wrapping chips that filter (D3)**; a
   dropdown; or chips that scroll to the section instead of filtering.
5. **Next's development badge:** **off (D6)**; or keep it.

---

## 6. Results (2026-11-07)

### What was built

* **Store (editor state, never saved):** `leftTab` (`library` /
  `objects`), `rightTab` (`object` / `scene`) and `libraryCategory`, with
  their setters. A subscription below the store sets `rightTab` whenever
  the selection's ids change: Object when something is selected, Scene
  when nothing is. Every path that changes the selection is covered
  (clicks, undo, placement, duplicate, load). `selectObject` also opens
  Object, so clicking the object that is already selected shows it again.
  The types `LeftPanelTab` and `RightPanelTab` are in `diorama.types.ts`;
  `LibraryCategory` and `LIBRARY_CATEGORIES` are in `assetRegistry.ts`,
  next to `ASSET_CATEGORY_ORDER`.
* **`EditorSidePanel`:** the card both columns share: a `tablist` (arrow
  keys, Home and End; roving `tabIndex`), an optional heading, and one
  `tabpanel` per tab that scrolls by itself. Every panel stays mounted
  (`hidden` when not shown), so the search text and the scroll position
  survive a tab switch.
* **Left column (`LibraryPanel` in `DioramaEditor.tsx`):** Library /
  Objects *n*, full height.
* **Library:** category chips (`aria-pressed`) under the search box; the
  search runs inside the chosen chip, and a chip with no match says so.
  The Ground chip only exists on a plot. The ground materials are four
  across with a smaller swatch. The "Pick an item, then click where it
  goes" line was removed: the canvas already says "click a surface to
  place it" while a surface is being picked.
* **Objects list:** the old Scene list without its card and count (the
  count is on the tab). While the list is open, the first selected row is
  scrolled into view, wherever the selection was made.
* **Right column:** `PropertiesPanel` is now the tab logic, the heading
  (the object's label with a lock when locked, "2 objects", "Nothing
  selected", or the diorama's name) and the "Select something in the
  scene, or pick an item from the library" hint. The editing moved
  unchanged into the new `SelectionPanel.tsx` (259 lines), minus the green
  label pill, which the heading replaces.
* **Scene tab:** today's `ScenePanel`, plus "Reset objects to the base's
  defaults" at the bottom, with "Replaces every object in the scene.
  Ctrl+Z brings them back."
* **Segmented controls:** the segments may shrink (`min-w-0`), the gap is
  1 px, and an icon-over-label segment has no side padding. A label that
  still does not fit wraps instead of widening the row.
* **Top bar:** "My Dioramas › *name*" as a breadcrumb on the name's line;
  the tree icon is still a link (out of the tab order, so the text link is
  the one keyboard users reach). Reset is gone from the bar.
* **`next.config.ts`:** `devIndicators: false`.

### Deviations from the plan

* **D5, the breadcrumb is on the name's line, not above it.** Above it,
  the bar grew 12 px, so the canvas was 12 px shorter. Opening a scene
  frames it to the canvas, so the starters opened slightly smaller, and
  `capture-template.mjs` (which scales the zoom the editor starts with)
  rendered every starter about 1 px off (mean pixel difference 3.7–4.1
  against the committed images, against 0.17–0.18 for `main` itself). On
  the name's line the bar keeps its height, and the canvas is unchanged.
* **D3, the library's hint line was removed** to make room (see above).
* **D1, the library-rows target was not met:** at 1366 × 768 three full
  rows of library items show without scrolling (the eight ground
  materials in two rows, then the first two buildings), against "at least
  5". Before, two rows of ground swatches showed and no asset. Five rows
  would need smaller asset cards (three across); the plan did not ask for
  that, and the two-across thumbnails were kept. 1536 × 864 shows four
  rows, 1920 × 1080 five.
* **D4:** the check covers wrapped labels too: no one-word label is broken
  across two lines.

### Verification

* `npm run lint`, `npx tsc --noEmit`: clean. `npm run build`: passes.
* **Measured (headless Chrome, dev server, Back Street):**

  | | Before | After |
  |---|---|---|
  | Library rows fully visible, 1366 × 768 | 2 | 3 |
  | Library rows fully visible, 1536 × 864 | 2 | 4 |
  | Library rows fully visible, 1920 × 1080 | 3 | 5 |
  | Controls wider than their panel (all three widths) | Time of day, 256 > 246 px | none |
  | One-word labels broken across lines | — | none |

  Controls checked: radio groups and their segments, both tab bars, the
  chips, with nothing selected, with the building selected and with a chip
  chosen. Screenshots before and after at the three widths: nothing
  selected, the building selected, the Objects tab, the Vehicles chip.
* **Behavior, real mouse and keyboard input: 24 of 24 checks passed,** no
  page errors: the top bar's links and buttons (no Reset); Scene with
  nothing selected and the diorama's name as heading; select → Object with
  the label as heading; Esc → Scene; Scene with the building selected,
  Rain clicked → weather changed, building still selected, still on Scene;
  two selected → "2 objects"; Object by hand with nothing selected → the
  hint; clicking a row in Objects (also the already selected one) → Object;
  selecting the last object from the canvas path scrolls its row into
  view; Reset from the Scene tab (73 → 0 objects on the plot) then Ctrl+Z
  (→ 73); the Vehicles chip, a search inside it, All, a chip with no
  match, the Ground chip, the chip kept across a tab switch; Shift+Tab from
  the search reaches the selected tab with a visible focus ring; arrows
  switch tabs in both bars; an edit made right before clicking the
  breadcrumb is stored (the Stage 17 flush), and the breadcrumb opens My
  Dioramas.
* **Starters unchanged:** `capture-template.mjs` rendered all three with
  a mean pixel difference of 0.17–0.18 from the committed images, the same
  as `main` renders them; the committed images were kept.
* **Preview** still clears both panels and the bar; the first switch
  takes about 4 s in the dev server on `main` and on this branch alike
  (0.4–0.5 s after that).
* **Not run:** the Stage 17 end-to-end script (37 checks) was a one-off in
  that session's scratchpad and no longer exists. Its parts this stage
  touches (the My Dioramas link, the New / Import buttons, the flush on
  leaving) are covered by the checks above.

### Known limitations

* Not tried in the user's own browser.
* Three rows of library items at 1366 × 768, not five (see Deviations).
* The tabs and the chip are not saved: a page reload goes back to Library,
  All and Scene. Opening another diorama in the same tab keeps the left
  tab and the chip; the right tab follows the (empty) selection.
* No keyboard shortcut for the tabs (D7).
