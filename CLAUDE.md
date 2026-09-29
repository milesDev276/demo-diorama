# CLAUDE.md

# Japanese Diorama Builder

## 1. Project Overview

Project Name: **Japanese Diorama Builder** (working title)

Japanese Diorama Builder is a browser-based 3D creative application where users build miniature Japanese streets, neighborhoods, and everyday-life scenes.

The core philosophy is:

> Build a tiny Japanese world, one detail at a time.

The application should feel like building and photographing a physical Japanese miniature model.

This is NOT:

- a generic 3D modeling application
- a Blender clone
- a CAD tool
- a Minecraft clone
- a realistic city simulator
- an anime character creator

It is a focused creative tool for creating **beautiful, stylized Japanese everyday-life dioramas**.

---

# 2. Product Vision

The primary user experience is:

```text
Create Diorama
      ↓
Open 3D Editor
      ↓
Browse Japanese Assets
      ↓
Place Assets
      ↓
Move / Rotate / Scale
      ↓
Customize Scene
      ↓
Adjust Environment
      ↓
Compose Camera
      ↓
Preview
      ↓
Save / Export
```

The long-term product may evolve into:

```text
Create
  ↓
Save
  ↓
Photograph
  ↓
Publish
  ↓
Explore
  ↓
Remix
  ↓
Share
```

The core experience must remain the creation of a small, coherent, beautiful miniature world.

---

# 3. Product Priorities

When making product or engineering decisions, prioritize in this order:

1. Core Diorama creation experience
2. Visual consistency
3. Editor usability
4. Asset quality
5. Performance
6. Portable scene data
7. Environment and atmosphere
8. Photography
9. Cloud platform
10. Social features

Do NOT prioritize feature quantity over visual quality.

A single beautiful Japanese street corner is more valuable than 100 inconsistent assets.

---

# 4. Current Development Philosophy

## Build the Core Experience First

The most important question is:

> Does this help the user create a more beautiful and expressive miniature Japanese world?

If yes, consider it.

If no, question whether it belongs in the current product.

Do not build future platform features prematurely.

For example, do not implement:

- authentication
- social feed
- comments
- likes
- marketplace
- multiplayer

while the core 3D editor is still unstable.

---

# 5. Visual / Art Direction

## Overall Style

Target:

**Stylized realistic miniature / low-poly Japanese everyday life**

The visual style should feel:

- handcrafted
- cozy
- slightly nostalgic
- warm
- natural
- detailed at small scale
- like a physical miniature model

Use:

- low-to-mid poly geometry
- clean silhouettes
- subtle material variation
- slightly weathered surfaces
- soft lighting
- restrained colors
- realistic proportions with miniature-friendly exaggeration

Avoid:

- highly saturated game-like colors
- generic cartoon assets
- photorealistic AAA rendering
- inconsistent asset styles
- overly clean / sterile environments
- excessive visual effects

---

# 6. Japanese Visual Language

The product should communicate **Japanese everyday life**, not generic tourism.

Prioritize environmental details such as:

- Japanese residential houses
- small shops
- narrow streets
- sidewalks
- parking spaces
- utility poles
- transformers
- overhead power lines
- street lights
- guard rails
- road signs
- vending machines
- post boxes
- bicycles
- air conditioners
- small fences
- potted plants
- concrete walls
- corrugated metal
- brick / paved sidewalks
- shop awnings
- small signs

Avoid relying heavily on stereotypical symbols such as:

- samurai
- anime characters
- Mount Fuji
- torii gates everywhere
- cherry blossoms everywhere
- temples as the default visual identity

The goal is:

> Ordinary Japanese streets and neighborhoods.

---

# 7. Reference Direction

The primary visual reference is a physical Japanese street diorama / miniature model containing elements such as:

```text
House
Shop
Road
Parking
Sidewalk
Utility Pole
Power Lines
Street Sign
Fence
Plants
Vending Machine
Small Building Details
```

The reference is used to establish:

- composition
- scale
- density of details
- visual language
- miniature feeling

Do NOT copy a reference image literally.

---

# 8. Core Application Structure

The application will eventually contain:

```text
Japanese Diorama Builder
│
├── Editor
│   ├── 3D Canvas
│   ├── Asset Browser
│   ├── Scene Objects
│   ├── Inspector
│   ├── Transform Tools
│   ├── Grid / Snap
│   └── Undo / Redo
│
├── Environment
│   ├── Lighting
│   ├── Time of Day
│   ├── Weather
│   ├── Sky
│   └── Atmosphere
│
├── Photography
│   ├── Camera Presets
│   ├── Composition
│   ├── Depth of Field
│   └── Image Export
│
├── Asset Library
│   ├── Buildings
│   ├── Street
│   ├── Infrastructure
│   ├── Props
│   ├── Vehicles
│   └── Nature
│
└── Future Platform
    ├── Authentication
    ├── Cloud Save
    ├── Explore
    ├── Publish
    ├── Like
    ├── Remix
    └── Share
```

Future features must not be implemented unless explicitly requested.

---

# 9. Frontend Stack

## Core

Framework:

- React

Language:

- TypeScript

Build Tool:

- Vite

## 3D

- Three.js
- React Three Fiber
- @react-three/drei

## State

- Zustand

## Routing

- React Router

## Styling

- Tailwind CSS

## Server State

- TanStack Query

Server state is relevant when backend/cloud functionality is introduced.

Do not introduce server-state infrastructure into purely local editor features unless necessary.

---

# 10. 3D Architecture

Use:

```text
Scene Data
    ↓
Zustand
    ↓
React Components
    ↓
React Three Fiber
    ↓
Three.js
```

The scene data is the source of truth.

Do NOT use raw Three.js objects as the application's source of truth.

Avoid architectures where:

```text
Three.js Mesh
    ↓
Hidden state
    ↓
UI
```

The scene must remain serializable.

---

# 11. Scene State vs Editor State

These must remain conceptually separate.

## Scene State

Represents the actual Diorama:

```text
scene name
objects
environment
camera data when explicitly part of the scene
```

## Editor State

Represents how the user is currently editing:

```text
selectedObjectIds
transformMode
snapEnabled
gridSize
rotationSnap
activePanel
previewMode
temporary camera state
```

Do not persist temporary editor UI state as scene data unless there is a clear product reason.

---

# 12. Core Scene Model

A Diorama scene should be serializable.

Example:

```ts
type DioramaScene = {
  id: string;
  name: string;
  objects: DioramaObject[];

  environment: {
    timeOfDay: string;
    weather: string;
    sky?: string;
  };

  camera?: {
    preset?: string;
    position?: [number, number, number];
    target?: [number, number, number];
    zoom?: number;
  };
};
```

The schema can evolve.

When scenes become persistent, consider schema versioning.

---

# 13. Diorama Object Model

A scene object represents an instance of an asset.

Example:

```ts
type DioramaObject = {
  id: string;
  type: string;

  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];

  visible: boolean;
  locked: boolean;
};
```

Keep the model extensible.

Do not put large asset metadata directly into every scene object.

---

# 14. Asset Definition

Assets and scene objects are different concepts.

```text
Asset Definition
=
"What is this object?"

Diorama Object
=
"Where did the user place this object?"
```

Example:

```ts
type AssetDefinition = {
  id: string;
  name: string;
  category: AssetCategory;

  modelUrl: string;
  thumbnailUrl?: string;

  tags: string[];

  defaultTransform?: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  };
};
```

The asset registry should be the source for asset metadata.

---

# 15. Asset Categories

Initial taxonomy:

```text
Buildings
├── Japanese House
├── Small Shop
├── Apartment
├── Convenience Store
└── Traditional House

Street
├── Road
├── Sidewalk
├── Parking
├── Guard Rail
├── Road Sign
└── Street Light

Infrastructure
├── Utility Pole
├── Transformer
├── Power Line
├── Cable
└── Utility Box

Props
├── Vending Machine
├── Mailbox
├── Bicycle
├── Trash Bin
├── Delivery Box
├── Bench
└── Signboard

Nature
├── Tree
├── Bush
├── Grass
├── Potted Plant
└── Flower

Vehicles
├── Small Car
├── Bicycle
├── Scooter
├── Truck
└── Bus
```

The taxonomy can evolve as the asset library grows.

---

# 16. Asset Production

Primary 3D asset format:

```text
.glb
```

Optional:

```text
.gltf
```

Recommended modeling tool:

```text
Blender
```

Every asset should have:

- consistent world scale
- correct orientation
- predictable origin/pivot
- readable silhouette
- appropriate polygon count
- optimized materials
- consistent visual style

---

# 17. Asset Naming

Use predictable names.

Examples:

```text
building_house_01.glb
building_shop_01.glb

street_road_01.glb
street_sidewalk_01.glb

infra_utility_pole_01.glb
infra_power_line_01.glb

prop_vending_machine_01.glb
prop_mailbox_01.glb
prop_bicycle_01.glb

nature_tree_01.glb
nature_bush_01.glb
```

Avoid:

```text
thing1.glb
newmodel.glb
test.glb
final2.glb
```

---

# 18. World Scale

Use one canonical world scale.

Recommended:

```text
1 Three.js unit = 1 meter
```

Approximate examples:

```text
Door            ≈ 2m
Person          ≈ 1.7m
Utility pole    ≈ 8–12m
House           ≈ 5–10m wide
Road lane       ≈ 2.5–3m
```

Exact values can be stylized, but relative scale must remain consistent.

Never independently guess the scale of every asset.

---

# 19. Modular Building Philosophy

Buildings may eventually be modular.

Example:

```text
House
├── Walls
├── Roof
├── Windows
├── Door
├── Awning
├── Sign
├── AC
└── Plants
```

This enables variations without requiring a completely new model for every building.

However:

> Do not over-engineer modular buildings during the first prototype.

Use modularity when it provides clear product value.

---

# 20. Diorama Base

The Diorama should feel like a physical miniature model.

Do NOT default to an infinite plane as the final product experience.

Concept:

```text
          OBJECTS
       🏠   🌳   🏪
────────────────────────
       ROAD / STREET
════════════════════════
      MINIATURE BASE
┌────────────────────────┐
│                        │
│                        │
└────────────────────────┘
```

Future base types may include:

- rectangular plot
- corner plot
- road segment
- modular terrain

A full terrain editor is out of scope for the early phases.

---

# 21. Editor Features

The editor will eventually support:

- Add object
- Select object
- Multi-select
- Move
- Rotate
- Scale
- Delete
- Duplicate
- Lock
- Hide
- Grid snapping
- Rotation snapping
- Undo
- Redo
- Object list
- Properties panel
- Camera presets
- Focus selected object
- Preview mode
- Save
- Load
- Import
- Export

Do not implement all of these at once.

Follow the current roadmap phase.

---

# 22. Transform Controls

Recommended shortcuts:

```text
W
Move

E
Rotate

R
Scale

Delete / Backspace
Delete selection

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
Save
```

Avoid browser conflicts.

---

# 23. Grid and Snap

Initial defaults:

```text
Grid size:
0.5 units

Rotation snap:
15 degrees
```

These should eventually be configurable.

Snap behavior should be implemented as reusable utilities rather than duplicated across UI components.

---

# 24. Camera

The primary visual style should use:

**Orthographic / isometric-like camera**

Recommended presets:

```text
Isometric
Front
Side
Top
Close-up
```

The editor may support orbit, zoom, and pan.

The camera should reinforce the feeling of a miniature rather than a large open-world scene.

---

# 25. Environment

Future environment controls:

## Time of Day

```text
Morning
Day
Golden Hour
Evening
Night
```

## Weather

```text
Clear
Cloudy
Rain
Fog
Snow
```

Environment may affect:

- lighting
- sky
- atmosphere
- particles
- optional sound
- material response

Do not add complex weather simulation unless explicitly required.

---

# 26. Lighting

The lighting should reinforce the miniature illusion.

Prefer:

- soft directional light
- ambient / hemisphere lighting
- controlled shadows
- warm natural lighting

Avoid:

- excessive bloom
- dramatic game-style lighting
- unnecessary post-processing

Golden Hour is an important future lighting preset because it fits the nostalgic Japanese miniature aesthetic.

---

# 27. Photography Mode

Photography is a major long-term feature.

Future workflow:

```text
Build
  ↓
Photography Mode
  ↓
Camera
  ↓
Lighting
  ↓
Weather
  ↓
Composition
  ↓
Render
  ↓
Export Image
```

Potential controls:

- camera preset
- zoom / focal length
- depth of field
- exposure
- lighting preset
- background
- aspect ratio

The final image should resemble a photograph of a physical miniature model.

---

# 28. UI Principles

The UI should be:

- minimal
- calm
- clean
- creative
- approachable
- tool-oriented without feeling technical

Do NOT make the editor visually resemble:

- Blender
- Unreal Engine
- a professional CAD application

The product should feel like a creative toy/tool.

---

# 29. Editor Layout

Target:

```text
┌───────────────────────────────────────────────────────────┐
│ DIORAMA       Scene Name       Save Preview Export        │
├───────────────┬───────────────────────────┬───────────────┤
│               │                           │               │
│ ASSET BROWSER │                           │   INSPECTOR   │
│               │                           │               │
│ Buildings     │                           │ Selected      │
│ Street        │       3D DIORAMA          │ Transform     │
│ Infrastructure│                           │ Environment   │
│ Props         │                           │               │
│ Nature        │                           │               │
│ Vehicles      │                           │               │
│               │                           │               │
└───────────────┴───────────────────────────┴───────────────┘
```

The 3D canvas is the main visual focus.

---

# 30. Asset Browser

The asset browser should eventually support:

- categories
- search
- tags
- thumbnails
- recently used assets
- favorites

Initial implementation should remain simple.

Example:

```text
ASSETS

Search...

[All] [Buildings] [Street] [Props]

BUILDINGS

┌─────────┐ ┌─────────┐
│ preview │ │ preview │
│ House   │ │ Shop    │
└─────────┘ └─────────┘
```

---

# 31. Object List

The scene object list should allow users to inspect scene contents.

Example:

```text
SCENE

🌳 Tree
🏠 House
⚡ Utility Pole
🥤 Vending Machine
🌳 Tree
```

Potential actions:

- select
- hide/show
- lock/unlock
- delete

---

# 32. Persistence

During early development, use local persistence.

Recommended:

```text
localStorage
```

Potential workflow:

```text
Scene changed
    ↓
Debounce
    ↓
Save locally
```

Do not write to localStorage every animation frame.

Cloud persistence is a future concern.

---

# 33. Backend

Backend is NOT part of the early editor.

Do not introduce backend infrastructure unless explicitly requested.

Future backend may contain:

```text
User
Diorama
Asset
PublishedDiorama
Like
Comment
Remix
```

Backend technology is not finalized.

Do not lock the frontend architecture to an assumed backend.

---

# 34. Future Platform

Long-term:

```text
Create
   ↓
Save
   ↓
Publish
   ↓
Explore
   ↓
Like
   ↓
Remix
   ↓
Share
```

Remix is particularly important because structured scene data allows one user to use another user's Diorama as a starting point.

Keep scene data portable.

---

# 35. Roadmap

## Phase 0 — Foundation

Define:

- product direction
- art style
- architecture
- scene schema
- asset taxonomy

No unnecessary implementation.

---

## Phase 1 — 3D Prototype

Goal:

Prove the basic 3D interaction.

Features:

- React + R3F
- 3D canvas
- orthographic camera
- Diorama base
- basic lighting
- simple tree
- simple house
- simple rock
- add
- select
- move
- rotate
- scale
- delete
- reset
- preview

No backend.

---

## Phase 2 — Diorama Editor

Goal:

Turn the prototype into a usable editor.

Features:

- undo
- redo
- duplicate
- multi-select
- grid
- snap
- rotation snap
- object list
- lock
- hide
- local save
- auto-save
- import/export
- scene naming
- camera presets
- keyboard shortcuts
- focus selected object

No backend.

---

## Phase 3 — Japanese Asset System

Goal:

Establish the Japanese visual identity.

Initial asset groups:

```text
Buildings
Street
Infrastructure
Props
Nature
Vehicles
```

Introduce:

- GLB assets
- asset registry
- asset browser
- thumbnails
- categories
- search / tags

Prioritize visual consistency over quantity.

---

## Phase 4 — Japanese Environment

Goal:

Make the scenes feel alive.

Features:

- better roads
- sidewalks
- buildings
- utility infrastructure
- power lines
- street props
- plants
- signs
- lighting presets
- time of day
- weather
- atmosphere

---

## Phase 5 — Photography

Goal:

Make scenes visually shareable.

Features:

- camera presets
- composition
- lighting
- depth of field
- weather
- background
- render / screenshot
- image export

---

## Phase 6 — Cloud Platform

Potential features:

- authentication
- cloud save
- My Dioramas
- scene thumbnails
- versioning

---

## Phase 7 — Community

Potential features:

- Explore
- Publish
- Like
- Comment
- Remix
- Share
- Creator profiles

---

# 36. Vertical Slice

Do not build the entire Japanese asset library immediately.

The first meaningful vertical slice should contain:

```text
1 Japanese House
1 Small Shop
1 Utility Pole
1 Power Line
1 Tree
1 Vending Machine
1 Road
1 Sidewalk
1 Sign
```

Example:

```text
             ⚡
             │
       🏠    │    🏪
      🌳           🥤
────────────────────────
        SIDEWALK
════════════════════════
           ROAD
════════════════════════
```

The goal is to make this small scene:

- visually coherent
- technically stable
- pleasant to interact with
- clearly Japanese
- convincingly miniature

If this works, expand the asset library.

---

# 37. Folder Structure

Prefer feature-oriented organization.

Example:

```text
src/
├── app/
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
│       │   └── EnvironmentPanel.tsx
│       │
│       ├── assets/
│       │   ├── assetRegistry.ts
│       │   └── assetDefinitions.ts
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
├── hooks/
├── services/
├── routes/
├── types/
└── assets/
```

Agents may adapt this structure to the existing repository.

Do not create files solely to match this example.

---

# 38. Component Principles

Components should be:

- small
- composable
- reusable
- strongly typed
- focused on one responsibility

Avoid components larger than approximately 300 lines.

Extract complex logic into:

- hooks
- utilities
- feature-specific services
- state modules

Do not blindly split components just to reduce line count.

---

# 39. State Management Principles

Use local React state when state is truly local.

Use Zustand for shared editor / scene state.

Use TanStack Query for server state once backend exists.

Never duplicate server state inside Zustand without a clear reason.

Never make React component state the hidden source of truth for the Diorama scene.

---

# 40. API Principles

When backend exists:

API calls should live in dedicated service modules.

Do NOT call `fetch()` directly from UI components.

Prefer:

```text
Component
   ↓
Hook
   ↓
Service
   ↓
API
```

The current local-first editor does not require an API layer.

---

# 41. Styling Rules

Use the project's established styling system.

If Tailwind is already configured:

- use Tailwind
- avoid unnecessary inline styles
- use reusable design tokens
- keep spacing consistent

Do not introduce another styling framework without a strong reason.

The editor UI should remain visually restrained.

---

# 42. Naming Conventions

Components:

```text
PascalCase
```

Hooks:

```text
useSomething
```

Types:

```text
PascalCase
```

Constants:

```text
UPPER_SNAKE_CASE
```

Files:

Follow the existing repository convention.

Do not rename existing files solely for stylistic preference.

---

# 43. Performance Principles

The application is a 3D application, so performance matters.

Prioritize:

- optimized GLB files
- reasonable polygon counts
- reusable materials
- reasonable texture sizes
- instancing for repeated assets where useful
- lazy loading large asset collections
- avoiding unnecessary React rerenders
- avoiding React state updates every animation frame

Target early editor usability around:

```text
100+ scene objects
```

on a normal desktop.

Optimize based on actual bottlenecks.

Do not prematurely optimize everything.

---

# 44. Accessibility

UI controls should provide:

- keyboard support
- visible focus states
- appropriate aria labels
- sensible semantic elements

Accessibility requirements apply primarily to the web UI.

3D interactions should also have reasonable non-pointer alternatives where practical.

---

# 45. Engineering Rules

## Rule 1 — Scene Data Is the Source of Truth

Never make raw Three.js objects the canonical application state.

## Rule 2 — Keep Phases Separate

Do not implement future phases unless explicitly requested.

## Rule 3 — Preserve Existing Working Code

Do not rewrite functioning systems unnecessarily.

## Rule 4 — Avoid Premature Abstraction

Only introduce abstractions that solve a real current problem or provide clear architectural value.

## Rule 5 — Minimize Dependencies

Do not add libraries when existing tools can solve the problem cleanly.

## Rule 6 — Visual Consistency Matters

Do not add assets that look unrelated to the established art direction.

## Rule 7 — Keep Scene Data Portable

A Diorama should eventually be exportable, importable, savable, publishable, and remixable.

## Rule 8 — Prefer Simple Solutions

Choose the simplest maintainable solution unless there is a concrete reason to use something more complex.

## Rule 9 — Test Before Claiming Completion

Do not say a feature is complete if it has not been verified.

## Rule 10 — Do Not Overbuild

Implement the requested scope, not an imagined future product.

---

# 46. AI Agent Workflow

Every coding agent must follow this process.

## Step 1 — Inspect

Before coding:

- inspect the repository
- inspect `package.json`
- inspect existing architecture
- inspect the current Diorama implementation
- inspect existing dependencies
- determine the current roadmap phase

Do not assume the repository matches this document exactly.

---

## Step 2 — Understand

Identify:

- what already works
- what is missing
- which files own the relevant behavior
- whether the requested feature belongs to the current phase
- whether existing abstractions should be reused

---

## Step 3 — Plan

For non-trivial work, provide a concise implementation plan before changing architecture.

The plan should identify:

- files/components affected
- state changes
- data model changes
- 3D changes
- UI changes
- verification steps

---

## Step 4 — Implement

Implement the smallest clean solution that satisfies the requested scope.

Avoid unrelated refactoring.

---

## Step 5 — Verify

Run appropriate checks:

```text
TypeScript
Build
Tests
Lint
Development server
```

Use only checks that exist in the project.

For visual 3D changes, inspect the result in the browser whenever possible.

---

## Step 6 — Fix

If verification reveals issues:

- fix them
- rerun verification
- do not stop after the first compile attempt

---

## Step 7 — Report

At the end, report:

```text
Implemented:
- ...

Files changed:
- ...

Verification:
- ...

Known limitations:
- ...
```

Keep the report concise.

---

# 47. Scope Control

If a requested feature belongs to a later phase:

1. Identify the phase.
2. Explain the dependency briefly.
3. If the user explicitly requests implementation, implement only the requested scope.
4. Do not silently implement the entire future phase.

Example:

If the user asks:

> "Add login."

Do not automatically implement:

- profiles
- social feed
- publishing
- comments
- likes
- creator pages

unless requested.

---

# 48. Definition of Done

A feature is not complete merely because the code compiles.

A feature is complete when the relevant combination of:

```text
Code
+
UI
+
3D interaction
+
State management
+
Error handling
+
Verification
```

works correctly.

For visual features, also verify:

```text
Scale
Materials
Lighting
Composition
Japanese visual identity
```

---

# 49. Visual Quality Gate

Before considering a major visual feature complete, ask:

## Scale

Do objects feel like they belong to the same miniature world?

## Materials

Do assets appear to come from the same collection?

## Lighting

Are shadows and highlights consistent?

## Composition

Does the scene read as a miniature?

## Detail

Are small details visible without becoming visual noise?

## Japanese Identity

Does the scene communicate everyday Japanese life naturally?

---

# 50. What Claude Must NOT Do

Do not:

- replace React with another framework
- replace the 3D stack without explicit approval
- introduce a backend during early editor phases
- create a generic 3D engine architecture
- turn the project into a full modeling tool
- add social features prematurely
- add authentication prematurely
- add unnecessary dependencies
- rewrite large portions of the codebase without reason
- create inconsistent visual assets
- hardcode every asset into UI components
- store raw Three.js objects as persistent scene state
- duplicate server state in Zustand
- claim visual features are complete without visual verification
- implement future roadmap phases without explicit instruction

---

# 51. Current Phase Awareness

The roadmap is:

```text
Phase 0
Foundation

Phase 1
3D Prototype

Phase 2
Diorama Editor

Phase 3
Japanese Asset System

Phase 4
Japanese Environment

Phase 5
Photography

Phase 6
Cloud Platform

Phase 7
Community
```

Before implementing a new feature, determine which phase it belongs to.

The current repository state takes precedence over assumptions.

---

# 52. Master Product Statement

Keep this statement in mind throughout development:

> **Japanese Diorama Builder is a cozy 3D web experience where users create miniature Japanese streets and everyday-life scenes by arranging carefully crafted buildings, infrastructure, props, nature, and environmental details. The experience should feel like building and photographing a physical Japanese miniature model.**
