# Diorama App — Phase 1: 3D Prototype

## 1. Project Goal

Build the first playable prototype of a web-based **3D Diorama Editor**.

The goal of this phase is to prove that users can create a small 3D diorama by placing and manipulating objects inside a miniature world.

This is a **frontend-only prototype**.

Do NOT implement:

* Authentication
* Backend
* Database
* API
* Social features
* Cloud storage
* Payment
* User profiles
* Multiplayer
* Complex asset management

The prototype should feel like the foundation of a real Diorama Editor, not just a Three.js demo.

---

# 2. Tech Stack

Use:

* React
* TypeScript
* Vite
* Three.js
* React Three Fiber
* @react-three/drei
* Zustand
* Tailwind CSS

Use modern React patterns.

Do not introduce unnecessary libraries.

Before installing packages, inspect the existing project and reuse compatible dependencies where possible.

---

# 3. General Design Direction

The application should have a:

* Cozy
* Minimal
* Stylized
* Low-poly
* Soft-lighting
* Isometric / miniature-world

visual direction.

Think of a small handcrafted miniature world rather than a realistic 3D game.

The 3D scene should contain:

* A small floating/island-like ground
* Trees
* A house
* Rocks
* Soft lighting
* Sky/background

The scene should look pleasant even when there are only a few objects.

Avoid photorealism.

---

# 4. Main User Flow

The user should be able to:

1. Open the application.
2. See the Diorama world.
3. See a toolbar/object library.
4. Add a tree.
5. Add a house.
6. Add a rock.
7. Select an object.
8. Move the object.
9. Rotate the object.
10. Scale the object.
11. Delete the object.
12. Orbit around the Diorama.
13. Zoom in/out.
14. Pan the camera.

The complete flow should work without a backend.

---

# 5. Application Layout

Create a layout similar to:

┌──────────────────────────────────────────────────────────┐
│ Diorama                         [Reset] [Preview]         │
├──────────────────┬────────────────────────┬──────────────┤
│                  │                        │              │
│   OBJECT LIBRARY │                        │  PROPERTIES  │
│                  │                        │              │
│  Nature          │                        │ Position     │
│   🌲 Tree        │                        │ X            │
│   🪨 Rock        │      3D DIORAMA        │ Y            │
│                  │                        │ Z            │
│  Buildings       │                        │              │
│   🏠 House       │                        │ Rotation     │
│                  │                        │              │
│                  │                        │ Scale        │
│                  │                        │              │
└──────────────────┴────────────────────────┴──────────────┘

The exact UI does not need to match this ASCII layout exactly.

Prioritize:

* Clear hierarchy
* Good spacing
* Usability
* 3D scene visibility

The 3D canvas must be the main focus.

---

# 6. 3D Scene

Create a Diorama scene using React Three Fiber.

The scene should contain:

## Ground

Create a small stylized island/platform.

Requirements:

* Rounded or beveled appearance
* Grass-like material
* Slight thickness
* Floating/island feeling
* Objects should sit naturally on top of it

Example:

```
      🌲
 🏠         🌲
```

┌────────────────┐
/                  
/      DIORAMA       
└──────────────────────┘

Do not make the ground completely flat like a simple infinite plane.

The world should feel like a small miniature object.

---

# 7. Camera

Use an orthographic camera.

The default camera should provide an isometric-like view.

Requirements:

* OrbitControls
* Zoom
* Pan
* Rotation
* Reasonable min/max zoom
* Reasonable camera limits if necessary

The initial camera should show the entire Diorama.

The user should immediately understand the scene without manually adjusting the camera.

---

# 8. Lighting

Create soft stylized lighting.

Use:

* Ambient light
* Directional light
* Optional hemisphere light

The scene should have:

* Soft shadows
* Pleasant contrast
* No harsh realistic lighting

Enable shadows where appropriate.

Do not over-engineer lighting in Phase 1.

---

# 9. Initial Objects

Implement at least these object types:

### Tree

Create a simple low-poly tree procedurally.

Example:

* Cylinder/trunk
* Cone or low-poly foliage
* Slightly stylized proportions

Do NOT require external 3D assets for Phase 1.

### House

Create a simple low-poly house procedurally.

Example:

* Box for walls
* Cone or custom geometry for roof
* Small door
* Optional windows

### Rock

Create a simple low-poly rock.

Use low-poly geometry.

The purpose is to establish the object system, not production-quality art.

---

# 10. Object System

Create a reusable object representation.

Every Diorama object should have:

```ts
type DioramaObject = {
  id: string;
  type: "tree" | "house" | "rock";
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
};
```

Objects should be stored in application state.

Do not hardcode object transforms directly into the scene.

---

# 11. State Management

Use Zustand.

Create a Diorama store responsible for:

* objects
* selectedObjectId
* addObject
* removeObject
* updateObject
* selectObject
* clearScene
* resetScene

Example API:

```ts
addObject(type)
removeObject(id)
updateObject(id, changes)
selectObject(id)
clearScene()
resetScene()
```

Keep the state structure clean and extensible.

The architecture should make it easy to add future object types.

---

# 12. Object Library

Create a left-side object library.

Categories:

### Nature

* Tree
* Rock

### Buildings

* House

Each item should have:

* Icon or simple visual representation
* Name
* Click interaction

When the user clicks an item:

```text
Object Library
      ↓
Add object
      ↓
Diorama Store
      ↓
3D Scene
```

The object should appear at a reasonable default position on the Diorama.

---

# 13. Object Selection

The user must be able to click an object in the 3D scene.

When selected:

* Show visual selection feedback.
* Store its ID as selectedObjectId.
* Show its properties in the right panel.

Possible selection feedback:

* Outline
* Bounding box
* Small highlight
* Transform gizmo

Prefer a clean implementation that fits the stylized UI.

---

# 14. Object Manipulation

Phase 1 must support:

### Move

Allow the selected object to be moved.

### Rotate

Allow rotation around the Y axis.

### Scale

Allow uniform scaling.

You may use Drei's TransformControls if appropriate.

However, the interaction must not conflict with OrbitControls.

For example:

```text
No object selected
→ OrbitControls active

Object selected
→ TransformControls active
```

Make the interaction predictable.

---

# 15. Properties Panel

Create a right-side properties panel.

When no object is selected:

```text
No object selected

Select an object
to edit its properties.
```

When an object is selected:

```text
TREE

Position

X  [ 2.0 ]
Y  [ 0.0 ]
Z  [ -1.0 ]

Rotation

Y  [ 45° ]

Scale

[ 1.0 ]
```

The properties panel should allow editing numeric values.

Changes must immediately update the 3D scene.

---

# 16. Delete

When an object is selected:

Allow:

* Delete button
* Delete / Backspace keyboard shortcut

Example:

```text
Selected Tree
      ↓
Delete
      ↓
Tree removed
```

Do not delete the entire scene accidentally.

---

# 17. Reset

Add a Reset button.

Reset should restore a simple default Diorama.

Example default scene:

```text
1 House
2 Trees
2 Rocks
```

The default scene should look visually interesting.

Reset should also reset the camera if appropriate.

---

# 18. Preview Mode

Add a simple Preview button.

Editor mode:

```text
Object Library
Properties
Controls
```

Preview mode:

```text
Only the Diorama
```

Hide editor UI temporarily.

The user should be able to exit Preview and return to editing.

Do not implement a sophisticated presentation mode yet.

---

# 19. Responsive Behavior

Desktop is the primary target.

Minimum target:

* 1280 × 720

The UI should not break at:

* 1440 × 900
* 1920 × 1080

Do not spend significant time on mobile responsiveness in Phase 1.

---

# 20. Folder Structure

Use a clean feature-oriented structure.

Suggested structure:

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
│       │   ├── PropertiesPanel.tsx
│       │   └── EditorToolbar.tsx
│       │
│       ├── objects/
│       │   ├── Tree.tsx
│       │   ├── House.tsx
│       │   └── Rock.tsx
│       │
│       ├── store/
│       │   └── dioramaStore.ts
│       │
│       ├── types/
│       │   └── diorama.types.ts
│       │
│       └── utils/
│
├── pages/
│   └── DioramaEditor.tsx
│
├── App.tsx
└── main.tsx

You may modify this structure if the existing project already follows a different architecture.

Do not create unnecessary abstraction layers.

---

# 21. Component Responsibilities

Keep responsibilities clear.

### DioramaEditor

Main page.

Responsible for composing:

* Toolbar
* ObjectLibrary
* DioramaCanvas
* PropertiesPanel

### DioramaCanvas

Responsible for:

* Canvas
* Camera
* Lighting
* Ground
* Diorama objects
* Controls
* Object selection

### DioramaObject

Responsible for rendering a generic Diorama object.

It should select the correct visual component based on:

```ts
object.type
```

### Tree / House / Rock

Responsible only for their 3D visual representation.

### ObjectLibrary

Responsible for adding objects.

It should NOT directly manipulate Three.js objects.

### PropertiesPanel

Responsible for editing object state.

It should NOT directly manipulate meshes.

### Zustand Store

Single source of truth for Diorama state.

---

# 22. Important Architecture Rule

Separate:

```text
Scene State
```

from:

```text
Three.js Rendering
```

For example:

```text
Zustand

{
  objects: [...]
}

        ↓

React Three Fiber

<DioramaObject />
```

Do not make Three.js objects the source of truth.

The scene should be reproducible entirely from the Zustand state.

This is important because future phases will require:

* Save
* Load
* Undo
* Redo
* Export
* Multiplayer
* Scene sharing

---

# 23. Performance

Keep the prototype lightweight.

Use:

* Low-poly geometry
* Reusable materials where possible
* Reasonable shadow settings
* No unnecessary post-processing
* No large external textures

The application should remain smooth with at least:

```text
50 Diorama objects
```

on a normal desktop.

Do not optimize prematurely.

---

# 24. Visual Quality Requirements

The result should NOT look like a default Three.js example.

Avoid:

* Plain white background
* Basic cubes everywhere
* Random default materials
* Infinite grid
* Debug UI
* Developer-looking controls

The final result should feel like a small product prototype.

The visual hierarchy should be:

```text
        DIORAMA
           ↓
      Main attraction

Object Library
      ↓
Secondary

Properties
      ↓
Secondary
```

---

# 25. UX Requirements

Interactions should feel intuitive.

Examples:

* Clicking an object selects it.
* Clicking empty space deselects it.
* Adding an object selects it automatically.
* Deleting an object clears selection.
* Selecting another object updates the Properties Panel.
* Changing properties immediately updates the object.
* Preview hides editing UI.
* Reset restores the default scene.

Avoid unnecessary confirmation dialogs.

---

# 26. Development Process

Before writing code:

1. Inspect the existing repository.
2. Identify current framework and dependencies.
3. Determine whether the project is already a Vite/React project.
4. Reuse existing configuration where possible.
5. Install only missing dependencies.
6. Explain briefly what you are going to implement.
7. Then implement Phase 1.

Do not rewrite the entire project unless necessary.

---

# 27. Implementation Order

Implement in this order:

### Step 1

Set up the application shell.

### Step 2

Create the 3D Canvas.

### Step 3

Create camera and controls.

### Step 4

Create Diorama ground.

### Step 5

Create lighting.

### Step 6

Create Tree, House and Rock.

### Step 7

Create Diorama object types.

### Step 8

Create Zustand store.

### Step 9

Render objects from store.

### Step 10

Implement object selection.

### Step 11

Implement move / rotate / scale.

### Step 12

Implement Object Library.

### Step 13

Implement Properties Panel.

### Step 14

Implement Delete.

### Step 15

Implement Reset.

### Step 16

Implement Preview Mode.

### Step 17

Polish UI and interactions.

---

# 28. Acceptance Criteria

Phase 1 is complete only when all of these work:

* [ ] Application starts successfully.
* [ ] 3D Diorama is visible.
* [ ] Camera starts in an isometric-like view.
* [ ] User can orbit the camera.
* [ ] User can zoom.
* [ ] User can pan.
* [ ] Ground exists as a miniature island/platform.
* [ ] Tree exists.
* [ ] House exists.
* [ ] Rock exists.
* [ ] User can add a Tree.
* [ ] User can add a House.
* [ ] User can add a Rock.
* [ ] User can select an object.
* [ ] Selected object has visual feedback.
* [ ] User can move an object.
* [ ] User can rotate an object.
* [ ] User can scale an object.
* [ ] Properties panel reflects selected object.
* [ ] Properties panel can modify object transforms.
* [ ] User can delete an object.
* [ ] Delete/Backspace works for selected objects.
* [ ] Reset works.
* [ ] Preview mode works.
* [ ] No backend is required.
* [ ] No authentication is required.
* [ ] No TypeScript errors.
* [ ] No obvious console errors.
* [ ] The application feels visually cohesive.

---

# 29. What NOT to Do

Do NOT:

* Build authentication.
* Build backend APIs.
* Build MongoDB schemas.
* Build user accounts.
* Build social features.
* Build payments.
* Build multiplayer.
* Build complicated asset uploading.
* Build procedural terrain generation.
* Build advanced physics.
* Build animation systems.
* Build mobile support.
* Over-engineer the architecture.

These belong to future phases.

---

# 30. Final Deliverable

At the end of the implementation:

1. Run the application.
2. Verify the main user flow manually.
3. Fix TypeScript errors.
4. Fix runtime errors.
5. Fix obvious visual issues.
6. Make sure the default Diorama looks attractive.
7. Provide a concise implementation summary.
8. List files created/modified.
9. List commands used to run the project.
10. Mention any known limitations.

Do not claim a feature works unless you actually verified it.

The final result should be a **working interactive Diorama Editor prototype**, not merely a collection of components or a static 3D scene.
