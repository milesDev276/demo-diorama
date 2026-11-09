# Stage 22 — A Library That Folds (Implementation Plan)

Follows [Stage-21-Implementation.md](Stage-21-Implementation.md) (room to
work: the editor camera that fits the canvas, folding and resizable
panels, the object list; merged in PR #24).

> **User request (2026-11-09):** "tôi muốn stage 22 này sẽ cấu hình layout
> library thông minh hơn, vì library đang in ra rất nhiều thứ, tôi muốn có
> chỗ expand hay collapse nó lại": Stage 22 should lay the library out more
> smartly, because it prints a great many things; the user wants to be able
> to expand or collapse it. (This replaces a first draft of this plan,
> "Coming Back" — the home page showing your dioramas and thumbnails that
> wait for loaded models. That topic is kept as a candidate in HANDOFF §7.)

**Goal:** the library opens as a short, readable list of sections the user
can unfold one at a time; what the user is working with stays at hand
(recently used items, the open section's header while scrolling); search
still finds everything at once. No scene-data change, no new asset, no
change to how an item is placed.

Branch: `stage22-library`, cut from `main` at `8d57b6b` (Stage 21 merged
in PR #24) on 2026-11-09.

**Status (2026-11-09):** approved with "mình đồng ý" (the defaults in bold,
§5). Implemented and verified; results are in §6. One default changed
while implementing: a first visit has every section folded (§6,
deviations).

---

## 0. What Was Found (code and screenshots, `main` at `8d57b6b`)

1. **Everything is printed, always.** With the chip on "All", the Library
   tab draws every section one after another: Ground (8 swatches, on a
   plot), Buildings, Street (13), Infrastructure (4), Props (17), Nature
   (6 plus the scatter brushes), Vehicles (3), People (9) and Kits (8
   built-in plus the user's) — about 70 cards. At the default 256 px width
   that is two cards per row, about 36 rows; the user scrolls through
   several screens to reach People or Kits (exact height measured before
   and after, §4).
2. **A section cannot be put away.** The only way to see less is a
   category chip, which hides every other section; there is no middle
   ground between "all 70" and "one section".
3. **The section headings are small grey labels** (`11px`, 40 % opacity)
   that scroll away with their cards, so in the middle of Props nothing
   says which section this is.
4. **What was just used is wherever it is in the list:** placing three
   vending machines and then a bench means scrolling between Props and
   Street each time (a placement ends after one click, Stage 5).

Not a problem: search (labels and tags, inside the chosen chip), keyboard
activation (adds near the middle of the base), the cards themselves, the
column count following the panel width (Stage 21 D5).

---

## 1. Decisions

### D1 — Sections fold

```text
 LIBRARY                    Objects 54   «
 ┌─ Search assets… ───────────────────┐
 [All] [Ground] [Buildings] [Street] …    Collapse all
 ▾ RECENT                         4
   [card] [card] [card] [card]
 ▾ GROUND                         8
   [▦][▦][▦][▦][▦][▦][▦][▦]
 ▾ BUILDINGS                      7
   [card] [card]
   [card] [card] …
 ▸ STREET                        13
 ▸ INFRASTRUCTURE                 4
 ▸ PROPS                         17
 ▸ NATURE                        10
 ▸ VEHICLES                       3
 ▸ PEOPLE                         9
 ▸ KITS                    Import 8
```

* **Every section's header is a button**: a chevron, the title in the
  panel's normal text color (not the faint label of today), and the number
  of items on the right. Clicking it folds or unfolds that section; Enter
  and Space do the same (`aria-expanded`, `aria-controls`). Kits keep their
  Import button in the header, outside the toggle.
* **A folded section is its header only** (one 32 px row). Unfolding
  animates the height briefly (150 ms; none with `prefers-reduced-motion`).
* **Default for a first visit:** Recent (D3), Ground and Buildings unfolded,
  every other section folded. The whole list of sections then fits in one
  screen at 1366 × 768, so the user sees everything the library has before
  scrolling. *(Changed while implementing: every section folded — with Ground and
  Buildings open the list did not fit; §6, deviations.)*
* **"Collapse all" / "Expand all"**, a small text button at the end of the
  chip row: "Collapse all" while any section is unfolded, otherwise
  "Expand all".
* **A category chip still shows that section alone**, and it is always
  unfolded there (its header shows no chevron); going back to All restores
  the folding as it was.
* Unfolding a section does not fold the others (not an accordion): the
  user may want Props and Nature side by side.

### D2 — Search unfolds what matches

* While the search box has text, **every section with a match is shown
  unfolded**, its count reading "3 of 17"; sections with no match are left
  out, as today. The folding the user chose is not changed: clearing the
  search brings it back exactly.
* Folding a section while searching hides it for that search only.

### D3 — Recently used

* **A "Recent" section at the top** holds the last eight items the user
  started (a placement, a scatter brush, a kit — from the pointer or the
  keyboard), newest first, the same cards as everywhere else. It is not
  shown until something has been used, and it folds like any section.
* **Ground swatches are not in Recent** (Ground is short and always near
  the top); deleted user kits drop out of it.
* Recent is not in search results (the item already shows in its own
  section) and has no chip.

### D4 — The open section's header stays in view

* While a section's cards scroll past, **its header sticks to the top of
  the library's scroll area** (`position: sticky`, the panel's own
  background), so the user always sees which section this is and can fold
  it from the middle of it. The next section's header pushes it away.
* The search box and chips scroll as today (they are above the sections).

### D5 — Remembered per browser, not per diorama

The folded sections and the Recent list are **editor preferences of this
browser**, like Stage 21's panel layout: not scene data, not on the undo
stack. One `localStorage` entry (`diorama-library`), read once when the
editor opens and written after a change (debounced), inside `try/catch`;
unknown section names and item keys are dropped on read. Without storage
the defaults of D1 apply and Recent starts empty. The state lives in the
store (beside `libraryCategory`), so it survives switching between the
Library and Objects tabs and folding the panel.

---

## 2. Files

| File | Change |
|---|---|
| `features/diorama/components/ObjectLibrary.tsx` | Sections built from the store's folding and Recent; search counts; the Collapse/Expand all button (D1–D3). Its cards move out, so it stays under 300 lines |
| `features/diorama/components/LibraryCards.tsx` (new) | `LibraryCard`, `GroundCard`, moved unchanged except that starting an item records it in Recent (D3) |
| `features/diorama/components/LibrarySection.tsx` (new) | Header button, count, sticky header, folded/unfolded body with its animation (D1, D4) |
| `features/diorama/utils/libraryPrefs.ts` (new) | Defaults, `RECENT_LIMIT = 8`, guarded read/validate/write of `diorama-library` (D5) |
| `features/diorama/hooks/useLibraryPrefs.ts` (new) | Applies the stored preferences when the editor opens, writes them after changes (D5) — the pattern of `useEditorLayout` |
| `features/diorama/store/dioramaStore.ts` | `foldedSections`, `recentLibraryKeys`, `toggleSection`, `setAllSectionsFolded`, `noteLibraryUse` (editor state) |
| `features/diorama/assets/assetRegistry.ts` | `libraryItemByKey` for rebuilding Recent from stored keys |
| `plan/HANDOFF.md`, `plan/Product-Roadmap.md` | Status; Stage 21 recorded as merged (PR #24); "Coming Back" kept as a candidate |

---

## 3. Out of Scope

Favorites or pinned items; reordering sections; a list view or smaller
cards (open question 3); subcategories inside a section; new assets or
thumbnails; the Objects tab; the home page and My Dioramas (the "Coming
Back" draft).

---

## 4. Verification

* `npm run lint`, `npx tsc --noEmit`, `npm run build`.
* **How much is printed (headless Chrome, 1366 × 768, default widths,
  Residential Lane and Autumn Street Corner):** the library's scroll height
  and the number of cards in the DOM-visible area, `main` → branch, with
  the default folding; every section header visible without scrolling
  at 1366 × 768 with the defaults.
* **Folding, real input:** click each header twice (folds, unfolds);
  Enter/Space on a focused header; Collapse all then Expand all; a chip
  shows its section unfolded and All restores the previous folding;
  Import in the Kits header still opens the file picker without toggling.
* **Search:** "pole" or "bench" unfolds only the matching sections with
  "n of N" counts; clearing restores the folding exactly.
* **Recent:** start a vending machine, a bench, a grass brush and a kit
  (pointer and keyboard) — Recent shows them newest first, at most eight,
  no duplicates; delete a user kit that is in Recent — it disappears.
* **Sticky headers:** scroll through an unfolded Props — its header stays
  at the top and is pushed away by Nature's; screenshot.
* **Persistence:** fold a few sections, use some items, reload — the same
  state; with `localStorage` throwing on every call the editor opens with
  the defaults, folds and records Recent for the session, and logs no
  error.
* **Layout (Stage 18/21's overflow check):** panel at 240, 256 and 420 px,
  at 1280, 1366 and 1920: no header, count or button outside the column;
  long section titles ("Infrastructure 4") on one line.
* **Accessibility:** every header reachable with Tab, `aria-expanded`
  correct, visible focus ring; `prefers-reduced-motion` turns the height
  animation off.
* **Nothing else moved:** placing from a card, the brush, kits, keyboard
  activation and the active-card highlight behave as before.

---

## 5. Open Questions (settled by the defaults in bold, 2026-11-09)

1. **What is unfolded on a first visit:** **Recent, Ground and Buildings;
   the rest folded (D1)**; or everything unfolded, as today, until the user
   folds; or everything folded.
2. **One section at a time (accordion)?** **No, any number can be open
   (D1)**; or unfolding one folds the others.
3. **Smaller cards as well:** **not in this stage**; or a "compact" switch
   in the library header (three or four cards per row at 256 px, one-line
   labels).
4. **Recently used:** **in this stage, eight items, at the top (D3)**; or
   leave it out and do folding only.
5. **Where the folding is remembered:** **per browser (D5)**; or not at
   all (every opening starts from the defaults).

---

## 6. Results (2026-11-09)

### What was built

* **`components/LibrarySection.tsx` (new):** a section's header is a
  button (chevron, title, count, `aria-expanded` / `aria-controls`, focus
  ring) or, in a chip view, a plain heading; Kits' Import sits beside it,
  outside the toggle. The body opens and closes over 150 ms (0 with
  reduced motion) and is clipped only while it moves, so a hovered card's
  scale-up is not cut. The header is `sticky -top-3` (cancelling the panel
  body's top padding) and gets its frosted strip and hairline only while
  it is stuck (`useStuck`, a passive scroll listener while the section is
  open).
* **`components/LibraryCards.tsx` (new):** `LibraryCard` and `GroundCard`,
  moved out of `ObjectLibrary` unchanged, except that a card that starts a
  placement, brush or kit (pointer or keyboard) records itself in Recent.
* **`components/ObjectLibrary.tsx`:** builds the sections (Recent, Ground,
  the categories, Kits) with their counts ("17", or "3 of 17" while
  searching); folding from the store in the All view, a per-search folding
  in local state that resets when the text changes, none in a chip view;
  "Collapse all" / "Expand all" at the end of the chip row (the chips'
  group is `display: contents`, so the button wraps in with them instead
  of taking a row). 259 lines.
* **`utils/libraryPrefs.ts` (new):** `LIBRARY_SECTIONS`,
  `DEFAULT_FOLDED_SECTIONS`, `RECENT_LIMIT = 8`, `withRecent`, and the
  guarded read (unknown sections and items dropped) and write of
  `diorama-library`.
* **`hooks/useLibraryPrefs.ts` (new):** applies the stored preferences in
  a layout effect when the editor opens and writes them 300 ms after a
  change (and on close); drops a deleted kit from Recent at once.
* **Store:** `foldedSections`, `recentLibraryKeys`, `toggleSection`,
  `setSectionsFolded`, `noteLibraryUse`, `setLibraryPrefs` (editor state).
* **`assets/assetRegistry.ts`:** `libraryItemByKey`, returning the same
  objects as `getLibraryItems`, so the active-card highlight matches a
  card in Recent and in its own section.

### Deviations from the plan

* **D1, a first visit has every section folded** (Recent, once it has
  items, is open), not Recent, Ground and Buildings. Measured with the
  planned default at 1366 × 768, only 2 of 9 headers were in view:
  Buildings alone is about 520 px tall in a 516 px panel body. The plan's
  stated aim — the whole list of sections in one screen — wins over its
  list; with everything folded all nine headers fit (scroll height = panel
  height, 516 px).
* **D4, the sticky header is transparent at rest** and frosted only while
  stuck: an always-opaque strip showed as a band 2–4 levels lighter than
  the panel, whose translucent white shades with the page gradient.
* **D1, Collapse all wraps in with the chips** instead of at the end of
  its own row, saving a row.

### Verification

Headless Chrome against the dev server, real mouse and key input through
the DevTools protocol; the scripts were one-off (not in the repo).

* `npm run lint` clean, `npx tsc --noEmit` clean, `npm run build` passes.
* **How much is printed** (Residential Lane, 1366 × 768, default widths,
  fresh profile): the library's scroll height is 516 px for a 516 px body
  with the default folding (no scrolling, 9 of 9 headers in view), against
  5,655 px with every section unfolded — the old layout's length, 78 cards,
  about 11 panel heights.
* **29 of 29 checks passed**, no page errors:
  * defaults: every section folded, no Recent, all headers in view;
    headers at rest have no background;
  * a click on Props unfolds it (17 cards) and folds it again; Enter
    unfolds and Space folds a focused header, which shows its outline;
    Expand all then Collapse all; Import in the Kits header opens the file
    picker without folding Kits;
  * the Props chip shows Props alone, unfolded, without a toggle or the
    Collapse/Expand button; All restores the folding (only Nature open);
  * search "bench": Props 1 of 17, People 1 of 9, Kits 1 of 9, all
    unfolded; folding one during the search folds it; clearing restores the
    folding exactly; "zzzz" shows the no-match line;
  * Recent: vending machine, bench, grass tufts, a user kit (pointer) and
    a built-in kit (keyboard, which added it to the scene) → newest first;
    reusing Bench moves it to the front without a duplicate; five more
    items → eight, all different; an active bench placement highlights
    both Bench cards; Recent is hidden during a search;
  * sticky: mid-Props the header sits at the panel's top (227 px) while
    the section starts 300 px above it, only that header has a
    background, and Nature's header pushes it away without overlap;
  * a reload restores the folded sections and the eight Recent keys
    exactly; deleting the user kit (through its card's Delete) removes it
    from Recent and from the stored keys;
  * with `localStorage` throwing on every call: the editor opens with the
    defaults, folds, records Recent for the session, no error;
  * overflow: 1280, 1366 and 1920 wide × panel at 240, 256 and 420 px, all
    sections unfolded — no header, count or button outside the column, no
    truncated section title (0 problems in 9 combinations).
* Screenshots read: the folded default, a stuck Props header, Nature
  pushing it, the panel at 240 px.

### Known limitations

* **A card clicked in Recent moves to the front** of Recent at once; the
  card under the pointer changes. It is what "recent" means; noted in case
  it feels jumpy.
* Smaller cards (open question 3) are not in this stage.
* Not tried in the user's own browser.

