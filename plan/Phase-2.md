# Diorama App — Phase 2: Diorama Editor

## 1. Phase Goal

Upgrade the existing Phase 1 3D prototype into a functional **Diorama Editor**.

Phase 1 established:

* 3D Diorama scene
* Camera controls
* Ground/island
* Tree
* House
* Rock
* Object selection
* Move
* Rotate
* Scale
* Object library
* Properties panel
* Delete
* Reset
* Preview mode

Phase 2 should make the editor feel like a real creative tool.

The user should be able to:

```text
Open Diorama
    ↓
Build a scene
    ↓
Manipulate objects
    ↓
Duplicate objects
    ↓
Snap objects to grid
    ↓
Undo / Redo changes
    ↓
Save scene locally
    ↓
Reload scene
    ↓
Use camera presets
    ↓
Preview Diorama
```

This phase is still **frontend-only**.

Do NOT implement a backend, authentication, database, social features, or cloud storage.

---

# 2. Important Rule

Before implementing anything:

1. Inspect the existing Phase 1 implementation.
2. Understand the current state architecture.
3. Reuse existing components.
4. Do NOT rewrite working Phase 1 functionality unnecessarily.
5. Fix existing bugs before adding Phase 2 features.
6. Preserve the existing visual style.

If Phase 1 architecture needs small refactoring, do it carefully.

Do not perform a large rewrite unless absolutely necessary.

---

# 3. Tech Stack

Continue using the existing stack.

Expected stack:

* React
* TypeScript
* Vite
* Three.js
* React Three Fiber
* @react-three/drei
* Zustand
* Tailwind CSS

Do not introduce a new state management library.

Do not introduce Redux.

Do not introduce a backend.

---

# 4. Phase 2 Features

Implement these features:

### Core Editor

* Undo
* Redo
* Duplicate object
* Multi-object selection
* Grid snapping
* Rotation snapping
* Better transform controls
* Object visibility
* Object locking

### Scene Management

* Save scene
* Load scene
* Auto-save
* Scene name
* New scene
* Reset scene
* Export scene JSON
* Import scene JSON

### Camera

* Isometric preset
* Front preset
* Side preset
* Top preset
* Reset camera

### Editor UX

* Keyboard shortcuts
* Better toolbar
* Selection state
* Object count
* Delete confirmation only where necessary
* Helpful empty states
* Better properties panel

### Visual Polish

* Grid
* Soft environment
* Better selection feedback
* Better object placement
* Better UI transitions

---

# 5. Scene State Architecture

The Scene State must remain the single source of truth.

Example:

```ts
type DioramaScene = {
  id: string;
  name: string;

  objects: DioramaObject[];

  environment: {
    background: string;
    ground: string;
  };

  camera: {
    position: [number, number, number];
    target: [number, number, number];
    zoom: number;
  };
};
```

The renderer should derive everything from this state.

Do NOT store important scene state only inside Three.js objects.

---

# 6. Object Data Model

Extend the Phase 1 object model.

Example:

```ts
type DioramaObject = {
  id: string;

  type: "tree" | "house" | "rock";

  position: [number, number, number];

  rotation: [number, number, number];

  scale: [number, number, number];

  visible: boolean;

  locked: boolean;
};
```

Use this structure consistently.

Future object types should be easy to add.

Do not create separate stores for Tree, House and Rock.

---

# 7. Scene Store

Extend the existing Zustand store.

The store should manage:

```ts
objects
selectedObjectIds
sceneName
environment
camera
history
historyIndex
```

Suggested actions:

```ts
addObject()
removeObject()
removeObjects()

updateObject()
updateObjects()

selectObject()
selectObjects()
toggleObjectSelection()
clearSelection()

duplicateObject()
duplicateObjects()

setObjectVisibility()
setObjectLocked()

setSceneName()

resetScene()
newScene()

saveScene()
loadScene()

undo()
redo()
```

Keep the API clean.

---

# 8. Undo / Redo

This is one of the most important Phase 2 features.

The editor must support:

```text
Add Tree
   ↓
Move Tree
   ↓
Rotate Tree
   ↓
Delete Tree
```

Then:

```text
Ctrl + Z
```

should reverse:

```text
Delete Tree
```

Another:

```text
Ctrl + Z
```

should reverse:

```text
Rotate Tree
```

And:

```text
Ctrl + Shift + Z
```

or:

```text
Ctrl + Y
```

should redo the action.

---

# 9. History Architecture

Do not store Three.js objects in history.

Store serializable scene snapshots.

Example:

```ts
type HistoryEntry = {
  objects: DioramaObject[];
};
```

Or preferably a complete serializable scene state.

Example:

```text
History

Scene A
   ↓
Scene B
   ↓
Scene C
   ↓
Scene D

             ↑
           current
```

If the user goes back:

```text
Scene A
   ↓
Scene B
   ↓
Scene C ← current
```

Then performs a new action:

```text
Scene A
   ↓
Scene B
   ↓
Scene C
   ↓
Scene X ← current
```

The old future history should be discarded.

---

# 10. History Rules

Do not create history entries for every tiny rendering update.

For example, dragging an object:

```text
mouse down
   ↓
drag
   ↓
drag
   ↓
drag
   ↓
mouse up
```

should ideally create:

```text
1 history entry
```

not hundreds.

Use transaction-like behavior:

```text
beginTransform()
      ↓
object moves
      ↓
endTransform()
      ↓
commit history
```

This is important for editor usability.

---

# 11. Duplicate Object

Add:

```text
Ctrl + D
```

When an object is selected:

```text
Tree
 ↓
Ctrl + D
 ↓
Tree copy
```

The duplicate must:

* Have a new unique ID.
* Preserve type.
* Preserve rotation.
* Preserve scale.
* Spawn with a small position offset.

Example:

```text
Original:
[2, 0, 1]

Duplicate:
[2.5, 0, 1.5]
```

The duplicate should automatically become selected.

---

# 12. Multi-Selection

Implement multi-selection.

Support:

```text
Shift + Click
```

to add/remove an object from the current selection.

Example:

```text
Tree A
Tree B
Tree C
```

Select:

```text
Tree A
+
Shift-click Tree B
```

Result:

```text
Selected:
Tree A
Tree B
```

The UI should clearly indicate all selected objects.

---

# 13. Multi-Object Transform

When multiple objects are selected:

* Move them together.
* Rotate them together if practical.
* Scale them together if practical.

If implementing full multi-object rotation/scaling is too complex, prioritize:

1. Multi-select.
2. Multi-move.
3. Multi-delete.
4. Multi-duplicate.

Then implement multi-rotation/scaling cleanly if feasible.

Do not create broken or unpredictable transform behavior.

---

# 14. Grid Snapping

Add an editor grid.

Example:

```text
      ┼───┼───┼───┼
      │   │   │   │
      ┼───┼───┼───┼
      │   │   │   │
      ┼───┼───┼───┼
```

Add a snapping toggle:

```text
Snap: ON
```

When enabled:

```text
position = nearest grid point
```

Example:

```text
Grid size = 0.5
```

Positions become:

```text
1.0
1.5
2.0
2.5
...
```

instead of arbitrary values.

Allow the user to change grid size:

```text
0.25
0.5
1.0
```

Default:

```text
0.5
```

---

# 15. Rotation Snapping

Add rotation snapping.

Example:

```text
15°
30°
45°
90°
```

Default:

```text
15°
```

When snapping is enabled:

```text
43°
```

becomes:

```text
45°
```

This should work primarily during user transformations.

---

# 16. Object Locking

Add a lock state:

```ts
locked: boolean
```

Locked objects:

* Cannot be moved.
* Cannot be rotated.
* Cannot be scaled.

They may still be selectable.

Properties panel should display:

```text
🔒 Locked
```

Provide:

```text
Lock
Unlock
```

Do not allow transform controls to manipulate locked objects.

---

# 17. Object Visibility

Add:

```ts
visible: boolean
```

Allow the user to hide an object.

Example:

```text
🌲 Tree      👁
🏠 House     👁
🪨 Rock      ○
```

Hidden objects:

* Are not rendered.
* Remain in scene state.
* Can be made visible again.

Do not delete hidden objects.

---

# 18. Object List

Improve the editor by adding a scene object list.

Example:

```text
SCENE

🌲 Tree
🌲 Tree
🏠 House
🪨 Rock
🪨 Rock
```

Clicking an item selects that object.

Allow:

* Select
* Hide/show
* Lock/unlock
* Delete

This creates the foundation for a future professional editor.

---

# 19. Properties Panel

Improve the existing Properties Panel.

When one object is selected:

```text
TREE

Transform

Position
X  2.0
Y  0.0
Z -1.0

Rotation
Y 45°

Scale
1.0

──────────────

Visibility
👁 Visible

Lock
🔓 Unlocked

──────────────

[Duplicate]
[Delete]
```

When multiple objects are selected:

```text
3 OBJECTS SELECTED

[Move]
[Duplicate]
[Delete]

Mixed values may be displayed as:
—
```

Do not pretend that mixed values are identical.

---

# 20. Scene Name

Add scene naming.

Default:

```text
Untitled Diorama
```

Allow editing:

```text
My Cozy Village
```

Display the name in the top toolbar.

---

# 21. Local Save

Implement local persistence using:

```text
localStorage
```

Do NOT implement backend persistence.

Scene should be serialized as JSON.

Example:

```ts
localStorage.setItem(
  "diorama-scene",
  JSON.stringify(scene)
);
```

The application should restore the latest scene when reopened.

---

# 22. Auto Save

Implement lightweight auto-save.

Whenever the scene changes:

```text
scene changed
     ↓
debounce
     ↓
save to localStorage
```

Use a debounce around:

```text
500–1000ms
```

Do not write to localStorage on every animation frame.

Show a small status indicator:

```text
Saved
```

or:

```text
Saving...
```

or:

```text
Unsaved changes
```

Keep it subtle.

---

# 23. New Scene

Add:

```text
New
```

behavior.

New scene should create an empty/default scene.

If unsaved changes exist, show a simple confirmation:

```text
You have unsaved changes.

Discard changes?

[Cancel] [Discard]
```

Do not show confirmation unnecessarily when there are no changes.

---

# 24. Export Scene

Add:

```text
Export
```

The scene should be downloadable as JSON.

Example filename:

```text
my-cozy-village.diorama.json
```

The exported file should contain enough information to recreate the scene.

Do not export raw Three.js internals.

---

# 25. Import Scene

Add:

```text
Import
```

Allow the user to select a `.json` file.

Validate the imported data.

Do not blindly trust JSON.

Validate:

* scene structure
* object IDs
* object types
* position
* rotation
* scale
* visibility
* locked state

If invalid:

```text
Unable to import Diorama.

The file is invalid or corrupted.
```

Do not crash the application.

---

# 26. Scene Serialization

Create dedicated serialization utilities.

For example:

```text
features/diorama/utils/
    sceneSerializer.ts
    sceneValidator.ts
```

Functions:

```ts
serializeScene(scene)
deserializeScene(json)
validateScene(data)
```

The serializer must be deterministic and independent from React components.

---

# 27. Camera Presets

Add camera presets:

```text
Isometric
Front
Side
Top
```

Toolbar example:

```text
Camera

[ISO]
[FRONT]
[SIDE]
[TOP]
```

### Isometric

Default Diorama view.

### Front

View from front.

### Side

View from side.

### Top

View directly from above.

Add:

```text
Reset Camera
```

The camera preset should smoothly transition when practical.

Avoid abrupt jumps if a simple animation can be implemented cleanly.

---

# 28. Camera State

Do not put camera implementation details into the scene state unless necessary.

Separate:

```text
Scene Data
```

from:

```text
Editor UI State
```

For example:

```text
Scene:
objects
environment
name

Editor:
selectedObjects
history
cameraMode
snapEnabled
gridSize
previewMode
```

This separation will help future development.

---

# 29. Keyboard Shortcuts

Implement:

```text
Delete / Backspace
    Delete selected objects

Ctrl + Z
    Undo

Ctrl + Shift + Z
    Redo

Ctrl + Y
    Redo

Ctrl + D
    Duplicate

Esc
    Clear selection

Ctrl + S
    Save scene

F
    Focus selected object
```

Do not trigger browser shortcuts accidentally.

For example:

```text
Ctrl + S
```

should not open the browser save dialog.

Prevent default browser behavior where appropriate.

---

# 30. Focus Selected Object

Implement:

```text
F
```

When an object is selected:

```text
Select Tree
↓
Press F
↓
Camera moves toward Tree
```

This is especially useful once scenes contain many objects.

If multiple objects are selected:

```text
F
```

should frame the group if practical.

---

# 31. Better Transform Controls

Improve Phase 1 transform behavior.

Provide:

```text
Move
Rotate
Scale
```

tool modes.

Example toolbar:

```text
Transform

[ Move ]
[ Rotate ]
[ Scale ]
```

Keyboard shortcuts may be:

```text
W = Move
E = Rotate
R = Scale
```

If these shortcuts conflict with other browser behavior, implement carefully.

The active mode should be visually obvious.

---

# 32. Transform Constraints

Movement should primarily happen on the Diorama surface.

Do not allow users to accidentally move objects far below the island.

Prefer:

```text
X / Z
```

movement with controlled:

```text
Y
```

height.

Objects should normally remain grounded.

Do not build a complete physics system.

---

# 33. Grid UI

The grid should be visible while editing.

It may be hidden during Preview Mode.

Example:

```text
Editor:
Ground + subtle grid

Preview:
Clean Diorama without editor grid
```

The grid should be subtle.

Do not make it visually dominant.

---

# 34. Preview Mode

Improve Phase 1 Preview Mode.

Preview should hide:

* Object Library
* Properties Panel
* Scene Object List
* Grid
* Editor toolbar controls

Keep only minimal controls:

```text
← Exit Preview
```

The Diorama should become the visual focus.

---

# 35. Empty State

When there are no objects:

```text
Your Diorama is empty.

Add an object from the library
to start building your world.
```

Do not leave the user with an unexplained empty scene.

---

# 36. Default Scene

Create a visually pleasing default scene.

Suggested:

```text
House
Tree
Tree
Rock
Rock
```

Use different positions and rotations.

The scene should demonstrate the editor immediately.

---

# 37. Visual Polish

Improve the visual quality without introducing heavy rendering techniques.

Consider:

* Soft shadows
* Ambient occlusion only if lightweight
* Rounded UI panels
* Subtle borders
* Small hover transitions
* Clear selection feedback
* Consistent typography
* Consistent spacing

Avoid:

* Excessive animations
* Excessive gradients
* Neon colors
* Heavy post-processing
* Large shadows in the UI
* Overly complex effects

The product should feel:

```text
Cozy
Minimal
Creative
Calm
```

---

# 38. Error Handling

Handle:

* Invalid imported JSON
* Corrupted localStorage
* Missing scene properties
* Invalid object types
* Invalid transforms
* Duplicate IDs
* Unsupported future object types

The application should fail gracefully.

Never crash the entire editor because of invalid local data.

---

# 39. Data Validation

Create validation utilities.

For example:

```ts
isValidDioramaScene(data): boolean
```

Validate:

```text
scene.name
scene.objects
object.id
object.type
object.position
object.rotation
object.scale
object.visible
object.locked
```

Clamp invalid transform values when appropriate.

---

# 40. Performance Requirements

The editor should remain usable with:

```text
100 objects
```

on a normal desktop.

Do not use React state updates unnecessarily for every frame.

Avoid:

```text
setState()
```

inside render loops.

Do not recreate materials unnecessarily.

Keep geometry low-poly.

Use reusable materials/components when appropriate.

---

# 41. Architecture Rules

Maintain clear separation:

```text
UI
 ↓
Zustand Store
 ↓
Scene State
 ↓
React Three Fiber
 ↓
Three.js
```

Do not allow:

```text
PropertiesPanel
      ↓
direct Three.js mesh mutation
```

Instead:

```text
PropertiesPanel
      ↓
store.updateObject()
      ↓
React state
      ↓
3D renderer
```

The scene should always be reproducible from serialized state.

---

# 42. Suggested Folder Structure

Extend the Phase 1 structure:

```text
src/
├── components/
│   ├── ui/
│   └── layout/
│
├── features/
│   └── diorama/
│       ├── components/
│       │   ├── DioramaCanvas.tsx
│       │   ├── DioramaObject.tsx
│       │   ├── ObjectLibrary.tsx
│       │   ├── ObjectList.tsx
│       │   ├── PropertiesPanel.tsx
│       │   ├── EditorToolbar.tsx
│       │   ├── CameraControls.tsx
│       │   └── GridSettings.tsx
│       │
│       ├── objects/
│       │   ├── Tree.tsx
│       │   ├── House.tsx
│       │   └── Rock.tsx
│       │
│       ├── store/
│       │   └── dioramaStore.ts
│       │
│       ├── history/
│       │   └── historyManager.ts
│       │
│       ├── utils/
│       │   ├── sceneSerializer.ts
│       │   ├── sceneValidator.ts
│       │   ├── gridSnap.ts
│       │   └── cameraUtils.ts
│       │
│       └── types/
│           └── diorama.types.ts
│
├── pages/
│   └── DioramaEditor.tsx
│
└── App.tsx
```

Modify this if the existing architecture suggests a better organization.

Do not create files purely to satisfy this structure.

---

# 43. Testing

At minimum, verify these scenarios manually:

## Object manipulation

```text
Add Tree
Select Tree
Move Tree
Rotate Tree
Scale Tree
Delete Tree
```

## Duplicate

```text
Select Tree
Ctrl + D
Verify duplicate has unique ID
```

## Undo

```text
Add Tree
Move Tree
Delete Tree

Undo
Undo
Undo

Verify original state is restored
```

## Redo

```text
Undo
Redo
```

Verify the correct state is restored.

## Multi-select

```text
Select Tree A
Shift-click Tree B
Move
Delete
```

## Persistence

```text
Create scene
Reload browser
Verify scene remains
```

## Export

```text
Create scene
Export
```

Then import it again.

## Invalid import

Try malformed JSON.

The application should display an error rather than crash.

## Keyboard shortcuts

Verify all shortcuts.

---

# 44. Acceptance Criteria

Phase 2 is complete only when:

### Editor

* [ ] Undo works.
* [ ] Redo works.
* [ ] Duplicate works.
* [ ] Multi-selection works.
* [ ] Multi-delete works.
* [ ] Multi-move works.
* [ ] Grid snapping works.
* [ ] Rotation snapping works.
* [ ] Object locking works.
* [ ] Object visibility works.
* [ ] Scene object list works.

### Scene

* [ ] Scene can be named.
* [ ] Scene can be saved locally.
* [ ] Scene auto-saves.
* [ ] Scene survives browser reload.
* [ ] New scene works.
* [ ] Reset works.
* [ ] Scene can be exported.
* [ ] Scene can be imported.
* [ ] Invalid imports are handled safely.

### Camera

* [ ] Isometric preset works.
* [ ] Front preset works.
* [ ] Side preset works.
* [ ] Top preset works.
* [ ] Reset camera works.
* [ ] Focus selected object works.

### UX

* [ ] Keyboard shortcuts work.
* [ ] Transform modes are clear.
* [ ] Empty state exists.
* [ ] Preview mode works.
* [ ] Grid is hidden in Preview.
* [ ] UI is visually cohesive.
* [ ] Selection feedback is clear.

### Technical

* [ ] No TypeScript errors.
* [ ] No obvious console errors.
* [ ] No unnecessary dependency additions.
* [ ] No backend required.
* [ ] Scene state is serializable.
* [ ] Scene state is the source of truth.
* [ ] Existing Phase 1 functionality still works.

---

# 45. What NOT to Implement

Do NOT implement:

* Backend
* Authentication
* Database
* Cloud save
* User accounts
* Social feed
* Likes
* Comments
* Following
* Multiplayer
* Asset marketplace
* Asset upload system
* Payment
* AI-generated Dioramas
* Advanced animations
* Character AI
* Physics
* Complex terrain generation
* Mobile optimization
* Production-grade asset pipeline

These belong to later phases.

---

# 46. Final Verification

After implementation:

1. Start the application.
2. Test the full editor flow manually.
3. Test every keyboard shortcut.
4. Test undo/redo.
5. Test local persistence.
6. Test export/import.
7. Test invalid import.
8. Test multi-selection.
9. Test locked objects.
10. Test hidden objects.
11. Test camera presets.
12. Test Preview mode.
13. Check browser console.
14. Check TypeScript errors.
15. Fix obvious UI issues.
16. Make sure Phase 1 functionality has not regressed.

Do not claim a feature is complete unless it has been verified.

---

# 47. Final Deliverable

When finished, provide:

1. Short implementation summary.
2. List of files created.
3. List of files modified.
4. Dependencies added, if any.
5. Commands required to run the project.
6. Features completed.
7. Known limitations.
8. Suggested next steps for Phase 3.

The final result should feel like a **real local-first Diorama Editor**, not merely a 3D prototype.
