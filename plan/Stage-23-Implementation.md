# Stage 23 — Coming Back (Implementation Plan)

Follows [Stage-22-Implementation.md](Stage-22-Implementation.md) (a library
that folds: folding sections, search counts, Recent, sticky headers;
merged in PR #25).

> **User request (2026-11-10):** "tôi đã merge stage 22, hãy lên kế hoạch
> thực hiện stage 23": Stage 22 is merged; plan Stage 23. No topic given,
> so the topic is the one HANDOFF §7 kept as a candidate, "Coming Back"
> (drafted for Stage 22 and set aside when the user asked for the library),
> chosen because the survey below reproduces a real bug in it.

**Goal:** a person who comes back finds their work at once — the home page
offers to continue the diorama they were building and shows their newest
ones — and every thumbnail they see is a true picture of the whole
diorama, never of grey loading stand-ins. No scene-data change, no new
asset, nothing in the editor's own UI changes.

Branch: `stage23-coming-back`, cut from `main` at `8d81a96` (Stage 22
merged in PR #25) on 2026-11-10.

**Status (2026-11-10):** approved with "tôi đồng ý" (the defaults in bold,
§5). Implemented and verified; results are in §6.

---

## 0. What Was Found (code and screenshots, `main` at `8d81a96`)

Headless Chrome at 1440 × 900, a fresh profile, every `.glb` request held
back 9 s (DevTools `Fetch`) to imitate a slow first visit.

1. **A thumbnail of grey cylinders (the bug).** `ThumbnailCapture` takes
   its picture 3 s (`IDLE_MS`) after the editor opens, checking only for
   placing, brushing and Preview. It never checks whether models are still
   loading, so it photographs the `AssetGhost` stand-ins (faint cylinders)
   and stores that. Reproduced: after the first visit, My Dioramas shows
   "Autumn Street Corner" as a base under translucent cylinders and wires.
   The picture is kept until the next save, so a diorama that is opened
   and closed without an edit keeps it.
2. **It even replaces a good picture.** A diorama made from a starter is
   created with the starter's finished preview image (Stage 17 D7,
   `newDiorama.ts`). The capture 3 s after opening overwrites it — with the
   ghosts on a slow load, and otherwise with whatever the editor view
   shows at that moment.
3. **The thumbnail is whatever the editor camera sees.** It copies the
   canvas and cover-crops it to 16:10. Zoomed in on a shop sign, panned
   off to one side, or with a wide side panel narrowing the canvas, the
   card shows that crop, not the diorama. In the reproduction the base sits
   low and small in the card, its top cut by the crop.
4. **The home page does not know you.** A returning visitor gets the same
   page as a first visit: "Start building" (which then goes to My
   Dioramas), the hero picture and the starters. Nothing says "continue
   Autumn Street Corner", and the user's own dioramas appear nowhere on it.
5. **Thumbnails are 480 × 300.** Enough for My Dioramas' cards (about
   260 CSS px wide); soft on a 2× screen or in a larger card.

Not a problem: My Dioramas' list itself (newest first, rename, duplicate,
export, delete), the starter cards, the site header, storage errors
(private windows) on My Dioramas.

---

## 1. Decisions

### D1 — A thumbnail waits until every model has loaded

The capture runs only when the scene has no loading stand-in in it and
nothing is being fetched (drei's `useProgress` is idle — the check the
thumbnail studio already uses). Loading stand-ins get a marker
(`userData`) so the capture can see them in the scene graph it already
traverses. If either check fails it tries again later, as it does today
after placing or Preview. A model that **failed** to load (the red ghost)
does not hold the picture back forever: once loading has stopped, the
capture proceeds.

When the editor closes while models are still loading, no picture is
taken; the stored one stays.

### D2 — A thumbnail frames the whole diorama

The picture no longer copies the user's view. It is taken by a camera of
its own: the **Isometric preset's direction**, orthographic like the
editor, fitted to the whole diorama with the existing `sceneFit` and
`orthoFitView` (the Fit of Stage 21, which already leaves out the editor's
helpers, rain and snow, and clips wires at the base's edge) into a 16:10
frame with the usual margin. So zoom, pan, orbit and panel widths no
longer change the card, and every card in My Dioramas is framed the same
way.

It is still rendered by the editor's own renderer in one task, helpers
hidden, over the scene's sky gradient (as today) — same lights, time of
day, weather and season as the scene. The user's camera is not touched.

Size: **960 × 600** (WebP, quality 0.8; about 40–80 KB each), sharp in
the home page's cards and on 2× screens.

### D3 — A thumbnail is retaken only when the diorama changed

A diorama's entry records when its thumbnail was taken (`thumbnailAt`,
in the IndexedDB entry, not in the scene file). The editor takes a new
picture:

* **after each save** (as today), and when it closes with a save newer
  than the picture (as today);
* **on opening only if the picture is missing or older than the last
  save** — or has no `thumbnailAt` at all, which is every thumbnail made
  before this stage, so the grey ones already stored are repaired on their
  next opening.

A diorama made from a starter therefore keeps the starter's finished
preview image until its first edit; duplicating copies the picture and
its time; an imported diorama (no picture) gets one when first opened, as
today.

### D4 — The home page for a returning visitor

When this browser has dioramas, the home page offers them:

```text
 Japanese Diorama Builder                               My Dioramas

 A MINIATURE STREET IN YOUR BROWSER
 Build a tiny Japanese street,                  ┌──────────────────────┐
 one detail at a time.                          │      hero picture    │
 Arrange the ordinary corners…                  │                      │
 [ Continue “Autumn Street Corner” → ]          └──────────────────────┘
   My Dioramas (6)

 Your dioramas                                              See all 6 →
 ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
 │ thumb  │ │ thumb  │ │ thumb  │ │ thumb  │
 │ Name   │ │ Name   │ │ Name   │ │ Name   │
 │ 2h ago │ │ 1d ago │ │ 3d ago │ │ 1w ago │
 └────────┘ └────────┘ └────────┘ └────────┘

 Start from a street
 [starter] [starter] [starter]

 1. Place the pieces   2. Arrange the street   3. Take its photo
```

* The main button becomes **Continue “name”** (the most recently edited
  diorama; a long name is truncated with an ellipsis), with a quiet
  "My Dioramas (n)" link beside or under it.
* A **"Your dioramas"** section above the starters: up to **four** newest,
  each a card with the thumbnail, name and "edited … ago" that opens it
  (no menu — renaming and deleting stay in My Dioramas), and "See all n"
  when there are more than four.
* **A first visit is unchanged** (pixel-identical with `main`):
  "Start building" opens the hero street, as in Stage 17.
* The collection is read in the browser (IndexedDB), so the page is
  rendered first without it. Until the read answers, the button area keeps
  its size and shows a neutral, disabled state rather than flashing
  "Start building" and then swapping; the section appears when there is
  something to show. If storage cannot be read (some private windows) the
  page behaves as a first visit, without an error message.

My Dioramas' cards and the home cards share one thumbnail component (the
picture or, without one, the placeholder of the base), extracted from
`DioramaCard`.

---

## 2. Files

| File | Change |
|---|---|
| `features/diorama/components/ThumbnailCapture.tsx` | Waits for loaded models (D1); renders from its own fitted isometric camera at 960 × 600 (D2); retakes only a stale picture on opening (D3) |
| `features/diorama/objects/GltfAsset.tsx` | The loading `AssetGhost` carries the marker the capture looks for (D1) |
| `features/diorama/utils/cameraFit.ts` | Possibly a small helper for a fitted orthographic camera at a given frame size, if `orthoFitView` is not enough on its own (D2) |
| `features/dioramas/types.ts` | `thumbnailAt?: number` on `DioramaEntry` (D3) |
| `features/dioramas/storage/dioramaRepository.ts` | `saveThumbnail` and `createDiorama` (with a picture) record `thumbnailAt`; `saveDiorama` keeps it; `duplicateDiorama` copies it; `thumbnailIsStale(id)` for the editor (D3) |
| `features/dioramas/components/DioramaThumbnail.tsx` (new) | The picture or placeholder, out of `DioramaCard` (D4) |
| `features/dioramas/components/DioramaCard.tsx` | Uses `DioramaThumbnail` |
| `features/home/components/HomeActions.tsx` (new) | The hero buttons: Start building for a first visit, Continue “name” + My Dioramas (n) when coming back, a neutral state while reading (D4); replaces `StartBuildingButton.tsx` or wraps it |
| `features/home/components/YourDioramas.tsx` (new) | The four newest as link cards, "See all n" (D4) |
| `features/home/hooks/useRecentDioramas.ts` (new, or a shared loader with `useDioramaList`) | Reads the newest entries and their thumbnail URLs, revoked on leaving (D4) |
| `app/page.tsx` | Uses `HomeActions` and `YourDioramas` |
| `plan/HANDOFF.md`, `plan/Product-Roadmap.md` | Status; Stage 22 recorded as merged (PR #25) |

---

## 3. Out of Scope

Search, sorting or folders in My Dioramas; a redesign of My Dioramas;
taking a picture at import time without opening the editor (needs an
offscreen scene); Preview-style thumbnails (perspective, effects) or a
thumbnail chosen from a saved photo; the user picking the thumbnail's
angle; the starters' own preview images; anything on a server.

---

## 4. Verification

* `npm run lint`, `npx tsc --noEmit`, `npm run build`.
* **The bug, before and after:** the survey script (fresh profile, every
  `.glb` held back 9 s, open `/diorama`, wait, open `/dioramas`) —
  `main` stores the grey cylinders; the branch stores the loaded street.
  Also: close the editor while models are still loading — the stored
  picture is unchanged. A model URL that fails (blocked with `Fetch`) —
  the picture is still taken once loading stops.
* **Framing:** in Autumn Street Corner, zoom in on the shop, pan off to
  a corner, widen the left panel to its maximum, then make an edit — the
  new thumbnail is the same whole-diorama shot as with the default view.
  All three starters and an empty plot and corner base: the base whole,
  nothing cut at the top (tall buildings, poles), helpers absent; read the
  pictures. Rain and night: weather particles and lit windows as in the
  scene, the sky gradient behind.
* **Staleness (D3):** a new diorama from a starter, opened and closed
  without an edit — its card still shows the starter image; after one
  edit — the editor's picture. An entry written by `main` (no
  `thumbnailAt`) — retaken once on opening, not again on the next
  opening. Duplicate keeps the picture; import gets one on first open.
* **Home page:** a fresh profile — pixel-compare the home page with
  `main` at 1440 × 900 (identical). With 1, 4 and 6 dioramas — the
  Continue button names the newest and opens it; "Your dioramas" shows
  one, four, four cards; "See all 6" only with six. A name of 80
  characters truncates. `indexedDB.open` throwing — the first-visit page,
  no error, no console error. No flash: screenshots at short intervals
  after load never show "Start building" for a returning visitor. No
  hydration warning in the console.
* **Layout:** home at 1280, 1366, 1440 and 1920 wide — the cards in one
  row of four, nothing overflowing.
* **Accessibility:** the buttons and cards reachable with Tab in reading
  order, visible focus rings, each card's link named "Open <name>".
* **Nothing else moved:** My Dioramas' cards look as before (now with
  sharper pictures); Preview, Photo export and the editor are untouched.

---

## 5. Open Questions (settled by the defaults in bold, 2026-11-10)

1. **The thumbnail's angle:** **the Isometric preset's direction, whole
   diorama (D2)**; or the direction the user is looking from, fitted to
   the whole diorama; or the user's view exactly, as today.
2. **Thumbnail size:** **960 × 600 (D2)**; or keep 480 × 300.
3. **Retake on every opening:** **no — only when the picture is missing
   or older than the last save, so a starter keeps its preview image until
   the first edit (D3)**; or on every opening, as today (but after models
   have loaded).
4. **Returning visitors on the home page:** **"Continue “name”" in the
   hero and the four newest above the starters (D4)**; or only the
   Continue button; or the hero picture replaced by the newest diorama's
   thumbnail.

---

## 6. Results (2026-11-10)

### What was built

* **D1 — waits for models.** `ThumbnailCapture` takes no picture while
  drei's `useProgress` is active or a loading `AssetGhost` (marked with
  `LOADING_GHOST` from `utils/editorHelpers.ts`) is visible; it looks again
  every second. A failed model (the red ghost) is not marked, so it never
  holds the picture back. Closing the editor while models load keeps the
  stored picture.
* **D2 — the whole diorama.** A camera of its own (`thumbnailCamera`):
  orthographic, the Isometric preset's direction, `sceneFit` +
  `orthoFitView` into 960 × 600, standing as far from its target as the
  editor camera does (so `SceneFog` falls the same). The renderer is set
  to pixel ratio 1 and 960 × 600 for that one render, copied over the sky
  gradient, then restored and the editor view drawn again in the same
  task, so the canvas never shows a resized frame.
* **D3 — only when stale.** `DioramaEntry.thumbnailAt`; `saveThumbnail`
  records the time the picture was rendered; `createDiorama` with a picture
  counts it as current; `saveDiorama` keeps it; renaming keeps a current
  picture current; duplicating copies its freshness;
  `thumbnailIsStale(id)` (missing, older than `updatedAt`, or no time).
  `ThumbnailCapture` tells an opening (the saved fingerprint going from
  nothing to a value) from a save, and on opening retakes only a stale
  picture.
* **D4 — the home page.** `HomeCollectionProvider` reads the collection
  once (`useDioramaList`) for `HomeActions` (Start building, or Continue
  “name” + My Dioramas (n); a quiet pill of the same height while reading)
  and `YourDioramas` (the four newest, "See all n" beyond four).
  `DioramaThumbnail` is shared with My Dioramas' `DioramaCard`.

### Deviations from the plan

* No `useRecentDioramas` hook: the provider reuses `useDioramaList`, so the
  home page and My Dioramas read the collection the same way.
* No change to `cameraFit.ts` was needed; `StartBuildingButton.tsx` is
  kept and used by `HomeActions` for the first visit.

### Verification

* `npm run lint`, `npx tsc --noEmit`, `npm run build`: clean.
* **The bug** (headless Chrome, 1440 × 900, fresh profile, every `.glb`
  held back 9 s): on `main` My Dioramas showed the base under grey
  cylinders. On the branch, with the entry made stale (its `thumbnailAt`
  removed, as a pre-Stage 23 entry): 7 s after opening no picture had been
  taken; once the models arrived the picture showed the loaded street,
  whole. Closing the editor 6 s after opening, while loading: the stored
  picture and its (missing) time unchanged.
* **A failed model** (the vending machine's GLB failed with `Fetch`): an
  edit still produced a new picture once loading stopped.
* **Framing:** with the editor camera zoomed to 70 px/m and panned 6 m
  onto the shop sign, switching to night produced the same whole-diorama
  shot as by day; the editor view was untouched. Read the pictures: base
  whole, building top and pole not cut, no grid or gizmo, lit windows and
  the night sky.
* **Staleness:** a first visit (hero starter) opened 15 s and closed —
  `thumbnailAt` unchanged, the starter's picture kept. After an edit — a
  new picture; reopening without an edit — no new picture. Duplicate and
  rename (through My Dioramas' menu) — both entries still current.
* **Home page:** a fresh profile matches `main` except inside the hero
  picture (1,295 pixels, at most 21 of 765 in summed RGB difference: raster
  noise of the rounded, shadowed image). With one diorama, two and six:
  Continue names the newest; one, two and four cards; "See all 6" only at
  six. Polling the page every 20 ms after navigation saw only "nothing yet"
  and "Continue", never "Start building". `IDBFactory.open` throwing, with
  dioramas stored: the first-visit page, no alert, no console error. An
  86-character name truncates in the button and the card. 1280 × 800,
  1366 × 768, 1440 × 900, 1920 × 1080: no horizontal overflow. Tab order:
  logo, My Dioramas, Continue, My Dioramas (n), the cards ("Open <name>"),
  the starters. No hydration warning or console error (other than the
  deliberately failed model).

### Known limitations

* Not tried in the user's own browser.
* A diorama made from a starter shows the starter's 16:9 preview (a
  Preview render, cropped to 16:10) until its first edit; after that, the
  editor-style picture. The two styles differ slightly by design (D3).
* The Continue button truncates a long name before the closing quote.
* An imported diorama still has no picture until it has been opened.
