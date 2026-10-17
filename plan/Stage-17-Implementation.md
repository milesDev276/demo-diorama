# Stage 17 — App Shell and My Dioramas (Implementation Plan)

Follows [Stage-16-Implementation.md](Stage-16-Implementation.md) and opens
[Product-Roadmap.md](Product-Roadmap.md) (Stages 17–27). The editor is
complete enough to build a street, but the app around it is not an app:
the home page `/` is a Pomodoro/to-do/music template leftover, and the
editor keeps **one** scene. Starting a new diorama throws the old one
away.

**Goal:** a real home page and a local **My Dioramas** collection: many
dioramas, each with a name, a thumbnail and its last edit time, opened in
the editor at `/diorama/[id]`. No backend (Phase 6's local part); the
storage is shaped so that Stage 20 can add the cloud next to it.

Branch: `stage17-shell`, cut from `main` (Stage 16 is merged, PR #19).

> The user asked for the Stage 17 plan on 2026-10-17 (after first asking
> for Phase 7 by mistake; that plan is kept as
> [Phase-7-Community.md](Phase-7-Community.md)). Product-Roadmap.md is
> not approved yet; this stage does not depend on its backend decisions.
> The plan was approved the same day ("hãy thực hiện stage 17"), with the
> open questions of §5 settled by their defaults.

---

## 0. Starting Point (verified 2026-10-17, `main` at `848cd58`)

* **The store loads the scene at import time:** `loadInitialState()` in
  `dioramaStore.ts` reads localStorage `diorama-scene` synchronously when
  the module is imported, or builds the hero starter on a first visit.
* **Autosave** (`useAutoSave.ts`) debounces 700 ms and calls
  `saveScene()`, which writes the whole scene file to that one key.
* **New / starter / import replace the scene:** `newScene`,
  `newSceneFromTemplate` and `importScene` overwrite it;
  `NewSceneDialog` warns "unsaved changes will be discarded".
* **Kits** are in localStorage `diorama-kits` (small; unaffected).
* **Template leftovers** used only by `app/page.tsx`: `components/`
  (Background, BackgroundGallery, MusicPanel, Navbar, PomodoroTimer,
  TodoList, `ui/Button`, `ui/Card`), `data/`, `hooks/`, `lib/youtube.ts`,
  `types/index.ts`, `task/init.md` (the Farmodoro brief), the starter SVGs
  in `public/`, the Unsplash entry in `next.config.ts`, the Farmodoro
  metadata in `app/layout.tsx` and `app/diorama/layout.tsx`, and the
  create-next-app `README.md`. Only `lib/cn.ts` is used by the editor.
* **Scripts that depend on the single key and `/diorama`:**
  `capture-presets.mjs` (`--seed-scene`, `--save-scene`),
  `measure-scene.mjs`, `capture-template.mjs` (uses
  `window.__dioramaStore`), `capture-thumbnails.mjs`
  (`/diorama/thumbnails`).

---

## 1. Decisions

### D1 — IndexedDB for the collection, no new dependency

Thumbnails (≈ 20–40 KB each) and many scenes (a plot scene with a
painted surface and a few hundred objects is tens to hundreds of KB) do
not fit localStorage's ≈ 5 MB, and localStorage blocks the main thread.
The collection moves to **IndexedDB**, behind a small promise wrapper
written here (≈ 100 lines; no `idb` package, CLAUDE.md Rule 5).

Database `diorama`, version 1, two object stores:

```text
entries   key id → { id, name, createdAt, updatedAt, thumbnail?: Blob,
                     objectCount, starterId? }
scenes    key id → DioramaSceneFile   (the same { version, savedAt, scene }
                                       the app already writes and exports)
```

The list reads only `entries`, so My Dioramas never parses scene files.
The entry id **is** the scene's `id` (`createId("scene")`), so a diorama
keeps one id from local storage to the cloud (Stage 20).

`navigator.storage.persist()` is requested once, when the first diorama
is created, so the browser does not evict the collection under storage
pressure. Kits stay in localStorage.

### D2 — One module owns local storage: `dioramaRepository`

`features/dioramas/storage/dioramaRepository.ts`:

```ts
listDioramas(): Promise<DioramaEntry[]>            // newest edit first
getDiorama(id): Promise<{ entry, scene } | null>    // validated + upgraded
createDiorama(scene, opts?): Promise<DioramaEntry>
saveDiorama(scene): Promise<DioramaEntry>          // updates name, updatedAt, objectCount
saveThumbnail(id, blob): Promise<void>
renameDiorama(id, name), duplicateDiorama(id), deleteDiorama(id)
```

Every read goes through `validateAndNormalizeScene` (as localStorage
reads do today), so an old or damaged record is upgraded or reported,
never crashes the editor. Stage 20 puts a cloud repository with the same
shape next to it; components only ever call hooks
(`useDioramaList`, `useDioramaActions`), never the repository directly.

No TanStack Query yet: this is local data, not server state (CLAUDE.md
§9). The list page keeps its loaded list in local React state and
refreshes it after each action.

### D3 — Routes

| Route | What |
|---|---|
| `/` | Home page (D6). Static, server-rendered. |
| `/dioramas` | My Dioramas (D5). |
| `/diorama/[id]` | The editor, opening that diorama. Unknown id → "This diorama isn't here" with a link to My Dioramas. |
| `/diorama` | Kept for old links and the scripts: redirects (client-side) to the most recently edited diorama, or creates one from the hero starter if there is none. |
| `/diorama/thumbnails` | Dev page, unchanged (a static segment wins over `[id]`). |

### D4 — The editor opens a diorama by id

* `loadInitialState()` and the import-time localStorage read are
  **removed** from the store. The store starts empty, with a new editor
  field `loadedDioramaId: string | null`.
* A hook `useOpenDiorama(id)` in the editor page loads the record from the
  repository and calls the existing `loadScene()`. Until it resolves the
  page shows the same "Loading Diorama…" screen as today; the canvas
  mounts only after the scene is in the store.
* **Autosave** keeps its fingerprint and debounce, but `saveScene()`
  writes through `saveDiorama()` (async). It is mounted only once
  `loadedDioramaId` matches the route's id, so an empty store can never
  be saved over a diorama, and switching dioramas cannot write one
  scene into another's record. "Saved" shows when the promise resolves; a
  failed write shows "Not saved" in the toolbar (today it is swallowed).
* **New** (toolbar, `Ctrl`+`N` is not used — browser conflict) opens the
  existing `NewSceneDialog`; choosing a base or a starter **creates a new
  diorama** and navigates to it. Nothing is discarded any more, so the
  "unsaved changes" warning is removed from the dialog.
* **Import** in the editor also creates a new diorama from the file and
  navigates to it, instead of replacing the open one.
* **Export** is unchanged (the open diorama as `.diorama.json`).
* The toolbar's logo becomes a link back to **My Dioramas**; the scene
  name field renames the diorama, as today.
* Undo history stays per session: it resets when a diorama is opened.

### D5 — My Dioramas

* A grid of cards, most recently edited first: thumbnail (or a plain
  base-colored placeholder until one exists), name, "Edited 3 min ago",
  object count.
* **New diorama** card first: opens the `NewSceneDialog` content (empty
  base or a starter), creates the diorama and opens the editor.
* **Import file** button: a `.diorama.json` becomes a new diorama.
* Card menu: **Open**, **Rename** (inline), **Duplicate** ("<name> copy",
  new id, thumbnail copied), **Export file**, **Delete** (a confirm
  dialog naming the diorama; deletion is permanent and says so).
* Empty state: a short line and the three starters as cards.
* Keyboard: cards are links; the menu is a button with a labelled menu;
  rename commits on Enter, cancels on Esc (CLAUDE.md §44).
* At 100 dioramas the page must still open instantly: thumbnails are
  shown as object URLs created per visible card and revoked on unmount.

### D6 — The home page

A calm, single-screen page in the editor's warm palette (CLAUDE.md §28),
server-rendered, no 3D on the page (fast, and no WebGL needed to read it):

* Header: the product name, **My Dioramas**.
* Hero: a large photo of the Autumn Street Corner (a new 1600 px capture,
  `public/home/hero.webp`, made with `capture-template.mjs` at a larger
  width; Photo mode output, not a mock-up), the line "Build a tiny
  Japanese street, one detail at a time.", and **Start building**.
* **Start building:** opens My Dioramas if the visitor has dioramas;
  otherwise creates one from the hero starter and opens the editor (the
  first-visit behavior of today).
* "Start from a street": the three starters as cards (the existing
  `public/templates/*.webp`); each creates a diorama from it.
* Three short steps: place pieces, arrange the street, take a photo.
* Nothing about accounts, Explore or publishing (later stages).

The product name stays the working title, **Japanese Diorama Builder**
("Diorama" in compact places), until the user chooses the final name
before Stage 27 (Product-Roadmap open question 9).

### D7 — Thumbnails are captured from the editor's canvas

* A `ThumbnailCapture` component inside the Canvas renders the current
  view once more **without the grid, the selection ring and the placement
  helpers**, scales it to 480 × 300 and encodes WebP (≈ 0.8 quality), the
  way `PhotoStudio` already copies a rendered frame.
* When: 3 s after a save when nothing else changed, and when the user
  leaves the editor (the toolbar's back link, or `pagehide` as a best
  effort). Never every save, never while dragging.
* Creating a diorama from a starter uses its existing template image as
  the first thumbnail, so new cards are never blank.

### D8 — Migrating the single saved scene

On the first start of this version, if IndexedDB has no entries and
localStorage holds `diorama-scene`, that scene is validated and becomes
the first diorama (same id, same name, `updatedAt` from its `savedAt`).
The localStorage key is **left in place, untouched, as a backup** until
Stage 20, and a flag `diorama-migrated` prevents a second import. If
IndexedDB is unavailable (some private windows), the editor still works
on an in-memory diorama and says "Can't save in this browser window".

### D9 — The scripts keep working

* `capture-presets.mjs --seed-scene` and `measure-scene.mjs` seed by
  calling `window.__dioramaStore.getState().loadScene(...)` after the
  page is up (with `?dev=stats`), instead of writing localStorage before
  load. `--save-scene` serializes the store's scene as `saveScene()`
  would.
* They open `/diorama` (D3's redirect), so their URLs do not change.

### D10 — Removing the template leftovers

Deleted: `app/page.tsx`'s content (replaced by D6), `components/` (all
eight files), `data/`, `hooks/`, `lib/youtube.ts`, `types/index.ts`,
`task/init.md`, `public/{file,globe,next,vercel,window}.svg`, the
Unsplash `images.remotePatterns` in `next.config.ts`. Metadata in
`app/layout.tsx` and `app/diorama/layout.tsx` names the product.
`README.md` is rewritten: what the app is, how to run it, where the plans
are. `lib/cn.ts` stays. A grep after deletion confirms nothing imports the
removed paths, and `framer-motion` / `lucide-react` stay (the editor uses
both).

### D11 — Where the code goes

```text
features/dioramas/                 (new: the collection, not the editor)
├── storage/idb.ts                 tiny IndexedDB promise wrapper
├── storage/dioramaRepository.ts   D2
├── storage/migrateLegacyScene.ts  D8
├── hooks/useDioramaList.ts, useDioramaActions.ts, useOpenDiorama.ts
├── components/DioramaCard.tsx, DioramaGrid.tsx, DioramaCardMenu.tsx,
│   DeleteDioramaDialog.tsx, MyDioramas.tsx
└── types.ts                       DioramaEntry
features/home/components/          the home page sections (D6)
features/diorama/components/ThumbnailCapture.tsx   D7
app/page.tsx, app/dioramas/page.tsx, app/diorama/[id]/page.tsx,
app/diorama/page.tsx (redirect)
```

`NewSceneDialog` moves its card grid into a component both the editor
and My Dioramas use; the dialog itself stays in the diorama feature.

---

## 2. Files

| File | Change |
|---|---|
| `features/diorama/store/dioramaStore.ts` | Remove `loadInitialState` and the localStorage write; add `loadedDioramaId`; `saveScene` through the repository; `newScene` / `newSceneFromTemplate` / `importScene` return a scene to create instead of replacing the open one |
| `features/diorama/hooks/useAutoSave.ts` | Mount guard (D4), async save, error status |
| `features/diorama/components/DioramaEditor.tsx`, `EditorToolbar.tsx`, `NewSceneDialog.tsx`, `DioramaCanvas.tsx` | Open by id, back link, new/import create and navigate, the thumbnail component |
| `features/diorama/utils/sceneSerializer.ts` | `STORAGE_KEY` kept only for the migration |
| `features/diorama/types/diorama.types.ts` | `SaveStatus` gains `"error"` |
| `features/dioramas/**`, `features/home/**` | New (D11) |
| `app/page.tsx`, `app/dioramas/page.tsx`, `app/diorama/[id]/page.tsx`, `app/diorama/page.tsx`, both `layout.tsx` | Routes and metadata |
| `scripts/capture-presets.mjs`, `measure-scene.mjs`, `capture-template.mjs` | Seeding through the store (D9); the 1600 px hero capture |
| `public/home/hero.webp` | New capture |
| Template leftovers | Deleted (D10); `README.md` rewritten |
| `plan/HANDOFF.md`, `plan/Product-Roadmap.md` | Status at the end of the stage |

---

## 3. Out of Scope

Accounts, the cloud and any server (Stages 18–20); Explore and publishing
(Phase 7); folders, tags, search or sorting options in My Dioramas; a
trash bin; a cover photo chosen from Photo mode; syncing one diorama open
in two tabs (last write wins, as today; Stage 20's revisions handle the
cloud case); kits in IndexedDB; mobile layouts.

---

## 4. Verification

* `npm run lint`, `npx tsc --noEmit`, `npm run build`.
* **Migration:** seed `diorama-scene` with a saved Residential Lane (and a
  v1 file) in a fresh browser profile, open `/` → My Dioramas shows it
  with its name; the editor opens it unchanged; the localStorage key is
  still there; reloading does not import it twice.
* **Collection:** create from an empty base and from each starter; rename,
  duplicate, delete; reload and check everything persisted; import a
  `.diorama.json` from the editor and from My Dioramas; open two dioramas
  in turn and check neither was written into the other.
* **Autosave guard:** throttle the IndexedDB open (devtools) and confirm
  nothing is saved before the diorama is loaded; an unknown id shows the
  not-found screen and creates nothing.
* **Thumbnails:** they show the view without grid or selection, update
  after edits, and the list with 100 seeded dioramas opens without a
  visible delay (measured with a seeding script).
* **Starters unchanged:** `capture-template.mjs` before and after; the
  images match.
* **Scripts:** `capture-presets.mjs --seed-scene/--save-scene`,
  `measure-scene.mjs`, `capture-thumbnails.mjs` run as before.
* **Home page:** checked in the browser at 1280 and 1920 px wide; keyboard
  order and focus rings; "Start building" with and without dioramas.
* **Leftovers:** a grep for every deleted path finds nothing.

---

## 5. Open Questions (settled by the defaults in bold)

1. **Storage:** **IndexedDB now (D1)**; or localStorage until it fills up.
2. **Import in the editor:** **creates a new diorama (D4)**; or replaces
   the open one, as today.
3. **"Start building":** **My Dioramas for returning visitors, the hero
   starter in the editor for a first visit (D6)**; or always My Dioramas.
4. **Delete:** **permanent, with a confirm dialog (D5)**; or a trash bin
   with restore.
5. **Old `diorama-scene` key:** **kept as a backup until Stage 20 (D8)**;
   or removed after the migration.
6. **Product name in the UI:** **the working title "Japanese Diorama
   Builder"**; or a name the user picks now.

---

## 6. Results (2026-10-17)

Implemented on `stage17-shell`, not committed.

### What was built

* **Storage:** `features/dioramas/storage/` — `idb.ts` (a promise wrapper:
  `readOne`, `readAll`, `count`, `transact`, `write`), `dioramaRepository.ts`
  (list, latest, has, get, create, save, saveThumbnail, rename, duplicate,
  delete; read-modify-writes in one transaction), `legacyScene.ts` (the
  old key and the migrated flag), `newDiorama.ts` (empty, from a starter
  with its template image as thumbnail, from a file with a new id).
* **Editor:** the store starts empty; `saveScene` is async and writes
  through the repository, `flushSave` saves pending changes, `loadScene`
  flushes first; `savedFingerprint` and `sceneFingerprint()` drive
  autosave and the new **Not saved** status. `DioramaEditor` opens a
  diorama by id (`useOpenDiorama`) and shows loading / not-found / error
  screens (`EditorScreens.tsx`); `EditorRoute` keys it by id. New and
  Import create a diorama and navigate (`useDioramaLauncher`). The
  toolbar's tree icon links to My Dioramas.
* **Thumbnails:** `ThumbnailCapture` (the canvas's first child) renders
  480 × 300 WebP without the grid, selection rings and gizmo, 3 s after a
  diorama opens and after each save when idle, and once more as the editor
  closes. Grid and `SelectionRing` carry `userData.editorOnly`.
* **Pages:** `/` (home, server-rendered; `StartBuildingButton` is the only
  client part), `/dioramas` (`MyDioramas`, `DioramaCard`,
  `DioramaCardMenu`, `DeleteDioramaDialog`, `StarterCards`),
  `/diorama/[id]`, `/diorama` (latest), `/diorama/new` (create from
  `starter` / `base`). `components/layout/SiteHeader.tsx` is shared by the
  home page and My Dioramas.
* **Hero image:** `public/home/hero.webp`, 1600 × 900, 34 KB, rendered by
  `capture-template.mjs --hero`.
* **Removed:** the Farmodoro leftovers listed in D10; `README.md`
  rewritten; `next.config.ts` emptied.

### Deviations from the plan

* **D2:** the hooks are `useDioramaList` (list + rename / duplicate /
  delete / export) and `useDioramaLauncher` (create and open) instead of
  `useDioramaActions`; the repository also has `latestDioramaId` and
  `hasDioramas`. The migration lives in the repository (`whenReady`), with
  the localStorage parts in `legacyScene.ts`.
* **D3:** a route that was not planned, **`/diorama/new`**, creates a
  diorama from `?starter=` or `?base=`. The home page's starter cards are
  plain links to it, and `capture-template.mjs` uses it.
* **D4:** no `loadedDioramaId` field: an empty `sceneId` means "nothing
  open", and `savedFingerprint` tells autosave what is stored. The editor
  is keyed by id, so each diorama gets a fresh editor.
* **D5:** `NewSceneDialog` is reused as it is (minus the unsaved-changes
  warning, plus `busy` and `error`) rather than split into a shared grid.
* **D7:** a thumbnail is also taken a few seconds after a diorama opens,
  so migrated and imported dioramas get one. There is no `pagehide`
  capture: a full page unload does not wait for it.
* **D8:** when IndexedDB is unavailable the editor does not fall back to
  an in-memory diorama; the pages say that the browser could not store
  the diorama (private windows). The single-scene editor is gone, so there
  is nothing to fall back to without a stored id.
* **D9:** `--seed-scene` needed no change: in the fresh profile the
  scripts use, the app migrates the seeded key and `/diorama` opens it.
  Only `--save-scene` changed (it reads `window.__dioramaSceneFile()`,
  exposed with `?dev=stats`). `capture-template.mjs` opens each starter
  through `/diorama/new` and scales the zoom to the frame, which the new
  `--hero` mode needs.

### Verification

* `npm run lint` and `npx tsc --noEmit`: clean. `npm run build`: passes;
  `/diorama/[id]` is dynamic, every other route static.
* **End-to-end, headless Chrome against the dev server: 37 of 37 checks
  passed**, with no page errors:
  * migration: a seeded Residential Lane file ("Seeded Lane", 54 objects,
    saved 3 days earlier) became the one diorama, same id, same object
    count, same time ("Edited 3 days ago"); the old key stayed; a reload
    did not import it again;
  * opening it is not an edit (`updatedAt` unchanged); a thumbnail is
    taken after opening (about 8 KB WebP);
  * an edit shows Unsaved, then is stored within 1.5 s and shows Saved;
    undo is stored too; an edit made just before clicking the back link is
    stored, and the thumbnail taken on leaving is not blank;
  * New from My Dioramas (Back Street) and New in the editor (empty plot)
    each add a diorama and leave the others unchanged; a starter's card
    has its template image; every scene is stored under its own id;
  * Import from the editor adds "Imported Lane" with a new id and opens
    it;
  * Rename (entry and scene file), Duplicate ("… copy", new id, thumbnail
    copied) and Delete (the dialog names the diorama, says it can't be
    undone, focuses Cancel) through the card menu;
  * an unknown id shows "This diorama isn't here" and creates nothing;
    `/diorama` opens the most recently edited diorama; `dev=stats` is
    carried through the redirects;
  * Start building: My Dioramas for a returning visitor, the hero in the
    editor on a first visit; the empty state lists the starters.
* **Thumbnails checked by eye:** the street and the base, no grid, no
  selection ring, no gizmo (the first run showed the gizmo; three-stdlib's
  flag was fixed), and not blank on leaving (the first version, taken
  after the scene was torn down, was an empty sky; moved to the first
  child's layout cleanup).
* **Scale:** 101 dioramas with thumbnails: the list rendered 351 ms after
  navigation (dev server, page load included); reading every entry took
  15 ms.
* **Starters unchanged:** `capture-template.mjs` before and after:
  Residential Lane byte-identical, the other two the same size and
  differing by render noise only; the originals were kept.
* **Scripts:** `capture-presets.mjs --seed-scene --save-scene` (20-object
  seed: same id, 20 objects, version 2, no page errors),
  `measure-scene.mjs`, `capture-thumbnails.mjs` (70 of 70; the only
  differences were render noise and line endings, reverted) all run.
* **Home page** at 1280, 1600 and 1920 px; Tab order header → My Dioramas
  → Start building → the starters, with visible focus rings.

### Known limitations

* Not tried in the user's own browser: their real autosave's migration is
  unverified there (the old key stays as a backup).
* The same diorama open in two tabs: the last write wins.
* An imported diorama gets its thumbnail only after it has been open for
  a few seconds in the editor.
* A full page reload or closing the tab right after an edit relies on the
  `pagehide` / `visibilitychange` save, which the browser may cut short;
  client-side navigation always saves.
* Thumbnails show the editor's view (orthographic, no post effects), not
  a Photo-mode picture.
