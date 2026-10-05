# Stage 14 — Editor Polish (Implementation Plan)

Follows [Stage-13-Implementation.md](Stage-13-Implementation.md). Stages 8 to
13 were all about the picture. The library now holds 58 items, yet building
a dense scene still trips over handling limits that Stages 5 to 9 left
behind, and CLAUDE.md §3 puts editor usability above assets and environment.

**Goal:** remove the five handling limits that get in the way most:

1. Attachments follow a building when its size changes.
2. A multi-selection turns about its common center (so a placed kit can be
   turned).
3. Undo and redo bring the selection back; a duplicate stays on the base.
4. Kits can be renamed, exported and imported.
5. The camera view and the photo settings are saved with the scene.

No new assets, no new dependency, no change to the meaning of the scene
format (files stay v2).

Branch: `stage14-editor`, cut from `main` (Stage 13 is merged, PR #16).

> The scope was proposed on 2026-10-05 and the user handed over every
> decision ("you have my full authority"). The open questions in §6 are
> settled with the defaults listed there. Results are in §7.

---

## 1. Decisions

### D1 — Attachments keep their bay and their face

Today `setBuildingParams` changes only the building; a child keeps its
stored place in the building's frame and ends up floating or inside a wall
(Stage 5 limitation).

A new pure function, `refitAttachments(children, before, after)` in
`utils/buildingAttachments.ts`, moves the children in the same `set` and the
same undo step. It works from the two sizes (`buildingSize`) only:

* **Which face.** A child at or above the old wall height, inside the
  footprint, is on the **roof**. Any other child belongs to the **wall**
  whose plane it is nearest to (this covers wall mounts, things on a
  balcony floor and things under an awning).
* **Wall children** keep their distance from that wall's plane (inside or
  outside), and keep their **bay**: their distance from the left end of the
  side, as seen from outside. This is how `fitBays` resizes a side — added
  bays go on the right end, removed bays come off it — so an AC under the
  second window stays under the second window.
  A child on a bay that no longer exists moves in by whole bays until it is
  on the last one.
* **Height.** Adding floors moves nothing on the walls. Removing floors
  lowers a wall child that would be above the new wall height by the height
  of the floors removed.
* **Roof children** rise or sink with the wall height and keep their
  distance from the nearest roof edge on X and on Z; shrinking keeps them
  inside the footprint.
* Rotation and scale are not touched. Locked children follow too: the lock
  guards against edits to the child, not against its building changing.

Facade and roof-kind changes move nothing (see §4).

### D2 — A multi-selection turns about its center

* The gizmo of a multi-selection moves from "the last selected object" to a
  **pivot at the center of the selection**: the middle of the top-level
  objects' world positions on X/Z, at their lowest height — the same anchor
  rule a kit uses (`createKit`), now shared from `utils/sceneGraph.ts`.
* **Move** works as before (`translateObjectsBy`).
* **Rotate** (E) is now allowed with several objects selected: the Y ring
  turns every top-level, unlocked object about the pivot — its position
  orbits, its own heading turns by the same angle. Buildings bring their
  attachments; scatter layers turn as a layer. Rotation snap applies.
  The transforms are computed from the ones at drag start, not accumulated
  per frame, so a long drag does not drift. One drag is one undo step.
* **Left out of a group turn:** an attached object whose building is not in
  the selection. Orbiting it would pull it off its wall; it still moves with
  the group as it does today.
* **Scale stays single-object.** `clampTransformMode` only falls back from
  scale now.
* **Without a pointer:** the multi-selection panel gets two buttons, "Turn
  left" and "Turn right", by the rotation-snap angle (15° by default), each
  one undo step.
* A kit is selected as a whole right after it is placed, so E turns it at
  once. There are no stored groups (§6 Q1): after deselecting, its pieces
  have to be selected again.

### D3 — Undo and redo select what the step changed

`redo` (and `undo`) keep only the ids that still exist, so redoing an "add"
leaves nothing selected.

Both now select **the objects the step added or changed** — the difference
between the two history entries, by id. A step that only removed objects, or
only painted the ground, keeps the current selection (filtered to what still
exists), as today. Nothing is added to a history entry, and no `commit` call
site changes.

### D4 — A duplicate lands on the base

Copies go 3 m along +X and +Z today, wherever that is.

`duplicateObjects` now tries the four diagonal offsets (+X+Z, −X+Z, +X−Z,
−X−Z) and takes the first that keeps every copied top-level object inside
the base (the template's width and depth, less a small inset). If none
fits, the group of copies is shifted back as a whole by the least amount
that fits, so the arrangement is kept. On a plot a copy that stood on the
ground is put on the ground where it lands (road and sidewalk are at
different heights), through the existing `liftObjects`.

Duplicates of attached objects are unchanged (0.5 m along the wall).

### D5 — Kits: rename, export, import

* **Store** (`store/kitStore.ts`): `renameKit(id, name)` and
  `importKits(kits)`.
* **File:** `<kit-name>.kit.json`, holding
  `{ "kind": "diorama-kit", "version": 1, "kits": [ … ] }` — the storage
  format plus a `kind`. One kit per exported file; an import reads files
  with any number of kits, several files at once.
* **Import** validates with `normalizeKits` (so with the scene validator).
  A kit whose id is already in the library is imported as a copy with a new
  id; nothing is overwritten. A file with no usable kit gives a message
  under the Kits heading.
* **Wrong file in the wrong place:** importing a kit file as a scene opened
  an empty scene until now (the scene validator is tolerant). It now says
  "This is a kit file — import it under Kits in the library", and a scene
  file given to the kit import gets the matching message.
* **UI** (`ObjectLibrary.tsx`, `KitCardActions.tsx`): a user kit's card shows three small buttons on hover and
  on focus — rename (the label becomes a field; Enter saves, Esc cancels),
  export, delete. The Kits heading gets an "Import" button; it is shown even
  when the user has no kit yet.
* Built-in kits are code; they are neither renamed nor exported.

### D6 — The scene remembers its view

`DioramaScene.camera` exists since Phase 2 but was never real: the store
holds a constant, every file ever saved carries that constant
(`[48, 42, 48]`, `[0, 1.8, 0]`, zoom 12), and the validator ignores it.

* **`camera` becomes optional and real:** `{ position, target, zoom }` of
  the orthographic editing camera, rounded to millimeters. A scene without
  one opens on the isometric preset, as now.
* **Reading:** a missing or malformed `camera`, **or one equal to the old
  placeholder**, loads as "none". That is what keeps every existing file
  opening exactly as it does today. Position and target are clamped like
  object positions, zoom to the rig's limits.
* **Writing:** the rig tells the store when a view has settled — at the end
  of an orbit, pan or zoom gesture and at the end of a preset or focus
  transition (`setCamera`, never per frame). The autosave fingerprint
  includes it.
* **Applying:** on the first mount and whenever a scene is loaded
  (`loadScene`, a starter, a new scene) the rig jumps to the scene's view,
  or to the preset if it has none. "A different base → reframe" keeps
  working for base and plot-size changes made while editing, but no longer
  overrides a loaded view.
* **Preview:** the Preview camera is derived from the editing view when
  Preview is entered, and mapped back when it is left (existing code). A
  gesture in Preview stores the editing view it maps back to, with that same
  math. So a scene has one view, and both cameras open on it.
* Not on the undo stack, like the rest of the environment.

### D7 — The scene remembers its photo settings

* New optional scene field `photo`: `{ aspect, focus, blur, exposure }`.
  Additive (files stay v2); missing or out-of-range values load as the
  defaults in `utils/photo.ts`.
* The export size (`scale`) is not part of it: it describes the file to
  write, not the picture. It stays editor state.
* A new or starter scene gets the defaults. Loading a scene replaces the
  current photo settings. Not on the undo stack.
* This replaces the Stage 7 rule "`photo` is editor state and is not saved".

### D8 — Starters keep their data

No starter gets a camera or photo settings in this stage; both open on the
preset as before.

---

## 2. Files

* **New:** `utils/buildingAttachments.ts`, `components/SelectionPivot.tsx`
  (the multi-selection gizmo), `components/KitCardActions.tsx`,
  `utils/kitFile.ts` (download, parse, the `kind` check).
* **Changed:**
  * `types/diorama.types.ts` — `camera?`, `photo?` on the scene,
    `ScenePhotoSettings`, `getView` / `applyView` on `CameraControlsApi`.
  * `store/dioramaStore.ts` — `setBuildingParams` (D1), group turn actions
    (D2), `undo` / `redo` (D3), `duplicateObjects` (D4), `setCamera`, camera
    and photo in load / save / new scene (D6, D7).
  * `store/kitStore.ts`, `utils/kits.ts` (D5).
  * `utils/sceneGraph.ts` — selection center, turn about a pivot.
  * `utils/sceneValidator.ts`, `utils/sceneSerializer.ts`,
    `utils/sceneDefaults.ts`, `utils/photo.ts` — camera and photo
    normalizing, the kit-file check.
  * `components/SceneObjects.tsx`, `CameraControls.tsx`,
    `PropertiesPanel.tsx`, `EditorSubToolbar.tsx` (the "need a single
    object" hint now only for scale), `ObjectLibrary.tsx`,
    `hooks/useAutoSave.ts`, `hooks/useEditorShortcuts.ts` (doc comment).
* **Docs:** this file, `HANDOFF.md`, `Hero-Diorama-Roadmap.md`.

## 3. Order of work

Each step is verified before the next one starts.

1. D3 and D4 (store only).
2. D1 (pure function, then the store).
3. D2 (scene graph math, the pivot gizmo, the panel buttons).
4. D5 (kits).
5. D6 and D7 (scene format, rig, autosave).
6. Docs.

## 4. Out of scope

* Stored groups (`groupId`), group scale, a marquee selection.
* Per-bay facade editing; the gizmo snapping to surfaces or re-parenting.
* Refitting attachments when the **roof kind** changes (a water tank on a
  flat roof that becomes a tiled one) or when a facade kind changes under
  them.
* Kit thumbnails for user kits; editing a kit's contents; undo for kit
  deletion.
* Several saved views per scene, named cameras, a view per starter.
* Fitting the saved view to a different window size (zoom is pixels per
  meter).
* Cloud save (CLAUDE.md Phase 6). D6 and D7 are the local groundwork only.

## 5. Verification

1. `npm run lint`, `npm run build`.
2. **No visual change:** both starters, editor and Preview, against `main`:
   the canvas is pixel-identical (nothing in this stage draws differently).
3. **D1:** the hero building with its attachments (AC units, signboard,
   laundry, water tank): bays wide 3→5→2, bays deep 2→4→1, floors 2→4→1.
   Each child's distance to its wall and its bay index before and after, as
   numbers; screenshots of each state; one undo returns building and
   children together.
4. **D2:** a placed kit turned by 90° with the gizmo (a scripted drag) and
   with the panel buttons: every pairwise distance unchanged, the center
   unchanged, headings +90°; one undo step per drag; a selection holding an
   attachment without its building; a locked object in the selection.
5. **D3:** add → undo → redo; move → undo → redo; delete → undo; a ground
   stroke → undo → redo: the selection after each.
6. **D4:** duplicate at each edge and in each corner of the corner base and
   of a plot, a single object and a group; a copy that crosses a curb.
7. **D5:** rename; export, delete, import (same kit back, same objects);
   the same file twice; a damaged file; a scene file as a kit and a kit file
   as a scene; kits survive a reload.
8. **D6 / D7:** orbit, zoom and pan, reload: the camera's position, target
   and zoom match to the millimeter. The same through export and import.
   A file saved by `main` (placeholder camera) opens on the preset. Photo
   frame, focus, blur and exposure survive a reload; export size does not
   travel. A gesture in Preview, leave, reload.
9. **Frame rate** of the 100-object scene against `main` (the rig now
   listens for gesture ends; nothing should change).

## 6. Open questions, settled with these defaults

1. **Stored groups?** A kit stays "one thing" only while it is selected.
   A `groupId` on objects (click selects the whole group, with group /
   ungroup actions) would fix that, but it is new scene data and touches
   selection, duplicate, kits and the object list.
   *Default: not in this stage.*
2. **Which view is saved?** The last view the user left the scene in, saved
   automatically — or only a view the user saves on purpose ("Save this
   view" button)?
   *Default: the last view, automatically.* Reopening lands where you
   stopped. A deliberate "cover view" can be added when publishing needs it.
3. **Do undo steps change the selection (D3)?** Today undo leaves it alone
   where it can.
   *Default: yes for undo and redo alike* — the usual behavior in editors,
   and it shows what the step did.
4. **Kit import on an id clash:** a copy, or replace the existing kit?
   *Default: a copy.* Nothing in the library is ever overwritten by a file.
5. **Photo settings: is the export size saved too?**
   *Default: no* (D7).

---

## 7. Results (2026-10-05)

**Status:** implemented and verified on branch `stage14-editor`. Not
committed; the user commits and merges.

### Deviations from the plan

* **The pivot is the mean of the positions, not the middle of their
  bounding box** (D2). A turn about the mean leaves the mean where it is,
  so the gizmo does not jump when a drag ends. `createKit` keeps its own
  anchor rule and was not touched.
* **Imported kits always get a new id** (D5), not only on a clash: the
  result for the user is the same, and the store needs no list of taken
  ids.
* **The kit card's buttons are `components/KitCardActions.tsx`;** the card
  itself stayed in `ObjectLibrary.tsx`. The pivot gizmo is
  `components/SelectionPivot.tsx`.
* **`CameraControlsApi` did not grow.** The rig pushes its view into the
  store (`setCamera`) and reads the scene's view when `cameraRevision`
  changes; nothing asks it for a view.
* **Opening a scene is not "the user framing it":** the glide to a loaded
  view, or to the preset of a scene without one, records nothing, so a
  freshly opened scene stays "Saved".
* **A wall attachment above the new wall height drops by whole floors,**
  to at least ground level; one that sits just above a single remaining
  floor (the hero's signboard at 3.6 m on a 3.2 m wall) lands low on the
  wall (0.8 m).

### Verification

Headless Chrome, 1600 × 1000, against the dev server, through
`?dev=stats`, real pointer events where a pointer matters.

* `npm run lint` and `npm run build`: clean. No page errors in any run.
* **No visual change.** The four presets, editor and Preview, against
  `main` (pixels differing by more than 2): the canvas is identical in
  seven of the eight pairs. The differences outside it are the save status
  label (the view is now saved after a preset) and text antialiasing in the
  inspector. The eighth pair, the first Preview shot, was caught
  mid-resize in both runs (the known capture gotcha, HANDOFF §5) and
  compares nothing.
* **D1,** the hero building (3 × 3 bays, 3 floors; two AC units, laundry,
  signboard, meter box on the walls; tank, shed, two plants and a chair on
  the roof):

  | Change | Wall attachments | Roof attachments |
  |---|---|---|
  | 3 → 5 bays wide | same wall distance, same bay, same distance from the left end | same distance from the nearer edge on X and Z |
  | 3 → 2 bays wide | the AC on bay 2 moves to bay 1; the others stay | all inside the smaller roof |
  | 3 → 5 bays deep | the same on the side walls | the same |
  | 3 → 4 floors | unchanged | 8.8 → 11.6 m |
  | 3 → 2 floors | the AC at 6.15 m (third floor) → 3.35 m | 8.8 → 6.0 m |

  Each change is one undo step; undoing all of them restores every
  attachment to the millimeter. Screenshots of 4 bays, 4 floors and
  2 bays × 1 floor were looked at: nothing floats, nothing is inside a wall.
* **D2.** `turnSelection(90°)` on four objects: every heading +90°, every
  pairwise distance and the center unchanged (error 0), one undo step; a
  locked object and an attachment whose building is not selected stay put.
  With the pointer on a placed three-piece kit: a drag along the Y ring
  turns all three by the same angle (−38.56°), distances and center
  unchanged (4 × 10⁻¹⁶), one undo step, the pivot back at angle 0; with 45°
  rotation snap the same drag gives exactly −45°; a drag on the X arrow
  moves all three by (2, 0, 0). Scale is refused with several selected.
* **D3.** Add → undo → redo selects the added object again; move → undo and
  → redo each select the moved object; delete → undo selects the restored
  object; redoing the delete keeps the selection that still exists.
* **D4.** Corner base (±8 m): a cone at the middle goes to (3, 3); at the
  four corners (±7.5, ±7.5) it goes 3 m inward on both axes; at (7.5, 0)
  and (0, 7.5) it flips one axis. Every copy is within ±7.75 m. A group at
  (6, 6) and (2, 7) lands at (3, 3) and (−1, 4), arrangement kept. On the
  Back Street plot a copy from the road (−0.15) onto the lot stands at 0
  and one from the lot onto the road at −0.15; an object 1 m above the
  ground keeps its height; a copied scatter layer of 157 pieces lies on the
  ground it lands on.
* **D5.** Rename with the keyboard (Enter saves, Esc leaves the name);
  export writes `bench-corner.kit.json` with `kind`, `version` and the
  kit's three objects; importing it adds a second kit and importing it
  again a third; a damaged file in the same import is named in the message
  and the good one still loads; a scene file under Kits and a kit file
  under Import each get their message, and the scene is untouched; kits and
  names survive a reload.
* **D6.** A first visit has no view and opens on the preset (zoom 34).
  After an orbit and a wheel zoom the stored view equals the live camera
  to the millimeter, the autosave holds it, and after a reload the camera's
  position, target and zoom are the same three numbers. A preset click
  stores the preset. A file with the old placeholder camera loads without a
  view, opens on the preset and is saved without a `camera`. A file with a
  view opens on it and stays "Saved". A camera on its own target is
  dropped. An orbit in Preview stores the view that leaving Preview then
  shows (direction and zoom error 0). A new scene has no view.
* **D7.** Frame, focus, blur and exposure are in the saved file and come
  back after a reload; the export size is not in the file and stays the
  user's across scenes; an unknown frame, an out-of-range blur and a broken
  focus load as the default, 0.3 and none.
* **Frame rate,** 100 objects on the 51 × 27 m plot, 1920 × 1080 headless:
  179.3 / 179.5 fps (editor / Preview), 354 draw calls, 11 programs — the
  Stage 13 numbers.

### Known limitations

* **A group lasts as long as its selection.** There are no stored groups;
  a kit that was deselected has to be selected piece by piece again.
* **A group is not scaled,** and an attachment whose building is not
  selected does not take part in a group turn.
* **The gizmo's ring turns by pointer travel, not by the angle swept**
  (three's TransformControls): a 60° sweep along the ring gave 39°.
* **Attachments are refit by position only.** One wider than the wall that
  is left overhangs its end; roof attachments can end up on top of each
  other on a much smaller roof; a roof-kind or facade change moves nothing.
* **A wall attachment between two walls' reach** (near a corner) belongs to
  the nearer wall, which decides which way it moves.
* **A duplicate of an attached object** still goes 0.5 m along its wall,
  wherever that ends.
* **A duplicate on the corner base keeps its height:** only a plot has a
  ground map to seat it on.
* **Undo and redo select what changed,** which replaces the selection the
  user had; a ground stroke's undo leaves it alone.
* **Imported kits are always copies;** importing a file twice gives two
  kits. User kits still have no thumbnail, and deleting one is not undoable.
* **One view per scene, the last one,** in pixels per meter: a smaller
  window shows less of the same view. Starters have none.
* **The view is not on the undo stack,** and neither are the photo settings.
* **Not checked in the user's own browser,** nor with the user's own
  autosave.
