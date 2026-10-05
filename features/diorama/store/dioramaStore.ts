import { create } from "zustand";
import type {
  CameraControlsApi,
  BrushState,
  BuildingParams,
  DioramaBase,
  DioramaCameraState,
  DioramaEnvironment,
  DioramaObject,
  DioramaObjectType,
  DioramaScene,
  GroundBrushState,
  Kit,
  ObjectParams,
  PhotoApi,
  PhotoSettings,
  Placement,
  PlinthStyle,
  SaveStatus,
  ScatterKind,
  ScenePhotoSettings,
  Season,
  SurfaceKind,
  SurfaceMap,
  TimeOfDay,
  TransformMode,
  Vector3Tuple,
  Weather,
} from "../types/diorama.types";
import { ASSET_REGISTRY } from "../assets/assetRegistry";
import { FIRST_VISIT_TEMPLATE, SCENE_TEMPLATES } from "../assets/sceneTemplates";
import {
  deltaToParentFrame,
  getSelectionCenter,
  getSubtreeIds,
  getTopLevelIds,
  getTurnableIds,
  getWorldTransform,
  indexObjects,
  toParentFrame,
  turnAbout,
  type Transform,
} from "../utils/sceneGraph";
import {
  createDioramaObject,
  DEFAULT_SCENE_NAME,
  getDefaultScene,
  jitteredScale,
  nextSpawnPosition,
} from "../utils/objectDefaults";
import { getBaseTemplate, type BaseTemplate } from "../utils/baseTemplates";
import { instantiateKit } from "../utils/kits";
import { buildingParamsOf, scatterParamsOf } from "../utils/objectParams";
import { newScatterSeed, roundPoint } from "../utils/scatterParams";
import { createId } from "../utils/id";
import { DEFAULT_PHOTO_SETTINGS, scenePhotoOf } from "../utils/photo";
import { DEFAULT_ENVIRONMENT } from "../utils/sceneDefaults";
import { buildScene, downloadSceneAsJson, serializeScene, STORAGE_KEY } from "../utils/sceneSerializer";
import { refitAttachments } from "../utils/buildingAttachments";
import { normalizeBuildingParams } from "../utils/buildingParams";
import { validateAndNormalizeScene } from "../utils/sceneValidator";
import {
  createSurface,
  DEFAULT_PLOT_LAYOUT,
  paintCells,
  reseatMoved,
  reseatObjects,
  resizeSurface,
  type SurfaceLayout,
} from "../utils/surfaceMap";
import {
  changedObjectIds,
  createInitialHistory,
  pushHistory,
  redoHistory,
  undoHistory,
  type HistoryEntry,
} from "../history/historyManager";

export type DioramaObjectChanges = Partial<
  Pick<DioramaObject, "position" | "rotation" | "scale">
>;

interface DioramaState {
  // --- Scene data (serializable — this is what save/export/import touch) ---
  objects: DioramaObject[];
  sceneId: string;
  sceneName: string;
  environment: DioramaEnvironment;
  /** The view the scene was left in (the editing camera); undefined until the user has framed it. */
  camera: DioramaCameraState | undefined;
  /** How Preview frames, focuses and exposes a photo. Saved with the scene, except `scale`. */
  photo: PhotoSettings;

  // --- Undo/redo history (snapshots of `objects` and the painted ground) ---
  history: HistoryEntry[];
  historyIndex: number;

  // --- Editor UI state (never persisted) ---
  selectedObjectIds: string[];
  transformMode: TransformMode;
  snapEnabled: boolean;
  gridSize: number;
  rotationSnapEnabled: boolean;
  rotationSnapDegrees: number;
  isPreviewMode: boolean;
  saveStatus: SaveStatus;
  importError: string | null;
  cameraApi: CameraControlsApi | null;
  /** Set while the user is picking a surface for a new or an existing object, or a kit. */
  placement: Placement | null;
  /** Extra heading (radians) given to the placement ghost with R / Shift+R. */
  placementYaw: number;
  /** Set while the scatter brush is active. */
  brush: BrushState | null;
  /** Brush ring radius in meters. Kept between brush sessions. */
  brushRadius: number;
  /** 0.25 … 1: how close together the brush puts pieces. */
  brushDensity: number;
  /** The brush removes pieces instead of adding them (Alt does the same while held). */
  brushErase: boolean;
  /** Set while the ground brush is active (plot scenes only). */
  groundBrush: GroundBrushState | null;
  /** Edge of the ground brush's square, in cells. Kept between brush sessions. */
  groundBrushSize: number;
  /** Goes up whenever another scene is opened, so the camera rig goes to the view of that scene. */
  cameraRevision: number;
  photoApi: PhotoApi | null;

  // --- Object CRUD ---
  /** Adds an object on the spawn spiral. Removing a building removes what is attached to it. */
  addObject: (type: DioramaObjectType, params?: ObjectParams) => void;
  /** Places a kit on the spawn spiral (the keyboard path of the library). */
  addKit: (kit: Kit) => void;
  removeObject: (id: string) => void;
  removeObjects: (ids: string[]) => void;

  // --- Placement on surfaces ---
  startPlacement: (placement: Placement) => void;
  cancelPlacement: () => void;
  /** Turns the placement ghost by `radians`. */
  rotatePlacement: (radians: number) => void;
  /** Finishes the current placement at a world transform, attached to `parentId` if given. */
  placeObject: (world: Transform, parentId: string | undefined, keepPlacing: boolean) => void;
  /** Finishes the current placement as a row of new objects on the base, one per world transform. One undo step. */
  placeRun: (worlds: Transform[], keepPlacing: boolean) => void;
  /** Frees an attached object from its building without moving it. */
  detachObject: (id: string) => void;
  /** Changes a building through a function of its current params. One undo step. */
  setBuildingParams: (id: string, update: (current: BuildingParams) => BuildingParams) => void;

  // --- Scatter brush ---
  /** Starts the brush for `kind`, painting into `layerId` if given. Ends any placement. */
  startBrush: (kind: ScatterKind, layerId?: string) => void;
  stopBrush: () => void;
  setBrushRadius: (radius: number) => void;
  setBrushDensity: (density: number) => void;
  setBrushErase: (erase: boolean) => void;
  /**
   * Starts a paint stroke at a world point on the base and returns the layer
   * it paints into: the brush's layer, else the selected layer of the same
   * kind, else a new layer created there and selected. Not on the undo stack
   * until endScatterStroke.
   */
  beginScatterStroke: (origin: Vector3Tuple) => string | null;
  /** Replaces a layer's points without an undo step (during a stroke). */
  setScatterPoints: (id: string, points: Vector3Tuple[]) => void;
  /** Ends a stroke: layers left empty are removed, and the stroke becomes one undo step. */
  endScatterStroke: () => void;
  /** Gives a layer a new seed: every piece gets a new heading, size and tint. One undo step. */
  shuffleScatter: (id: string) => void;

  // --- Ground (plot scenes) ---
  /** Starts the ground brush for `kind`. Ends any placement or scatter brush. Only on a plot. */
  startGroundBrush: (kind: SurfaceKind) => void;
  stopGroundBrush: () => void;
  setGroundBrushSize: (size: number) => void;
  /** Paints the brush's square around cell (`i`, `j`) without an undo step (during a stroke). */
  paintGround: (i: number, j: number) => void;
  /** Ends a stroke: objects on cells that changed level follow the ground, and the stroke becomes one undo step. */
  endGroundStroke: () => void;
  /** Replaces the plot's ground with a starting layout at its current size. One undo step. */
  applySurfaceLayout: (layout: SurfaceLayout) => void;
  /** Changes the plot's size around its middle. One undo step. */
  resizePlot: (cols: number, rows: number) => void;

  // Silent transform updates (no history) — call commitTransform() to snapshot.
  updateObject: (id: string, changes: DioramaObjectChanges) => void;
  updateObjects: (ids: string[], changes: DioramaObjectChanges) => void;
  /** Moves objects by a world-space offset. Objects whose parent also moves are left to follow it. */
  translateObjectsBy: (ids: string[], delta: Vector3Tuple) => void;
  /**
   * Turns objects about the vertical axis through `pivot` (world), without an
   * undo step. With `from` — the objects as they were when a drag began — the
   * turn starts from those, so a long drag does not accumulate error.
   */
  turnObjectsAbout: (ids: string[], pivot: Vector3Tuple, radians: number, from?: DioramaObject[]) => void;
  /** Turns the selection about its center. One undo step. */
  turnSelection: (radians: number) => void;
  commitTransform: () => void;

  // --- Selection ---
  selectObject: (id: string) => void;
  selectObjects: (ids: string[]) => void;
  toggleObjectSelection: (id: string) => void;
  clearSelection: () => void;

  // --- Duplicate ---
  duplicateObject: (id: string) => void;
  duplicateObjects: (ids: string[]) => void;

  // --- Visibility / locking ---
  setObjectVisibility: (id: string, visible: boolean) => void;
  setObjectLocked: (id: string, locked: boolean) => void;

  // --- Scene management ---
  setSceneName: (name: string) => void;
  /** Switches the base under the existing objects. Not on the undo stack: switch back to undo. */
  setBase: (base: DioramaBase) => void;
  /** Changes the light the scene is seen in. Not on the undo stack. */
  setTimeOfDay: (timeOfDay: TimeOfDay) => void;
  /** Changes the season. Not on the undo stack. */
  setSeason: (season: Season) => void;
  /** Changes the weather. Not on the undo stack. */
  setWeather: (weather: Weather) => void;
  /** Changes the finish of the platform. Not on the undo stack. */
  setPlinth: (plinth: PlinthStyle) => void;
  resetScene: () => void;
  /** Starts an empty scene on the given base (default: the current one), by day, in autumn. */
  newScene: (base?: DioramaBase) => void;
  /** Starts a scene from a built-in starter (assets/sceneTemplates.ts). */
  newSceneFromTemplate: (templateId: string) => void;
  saveScene: () => void;
  loadScene: (scene: DioramaScene) => void;
  exportScene: () => void;
  importScene: (json: string) => void;
  clearImportError: () => void;

  // --- History ---
  undo: () => void;
  redo: () => void;

  // --- Editor settings ---
  setTransformMode: (mode: TransformMode) => void;
  setSnapEnabled: (enabled: boolean) => void;
  setGridSize: (size: number) => void;
  setRotationSnapEnabled: (enabled: boolean) => void;
  setRotationSnapDegrees: (degrees: number) => void;
  setPreviewMode: (enabled: boolean) => void;
  registerCameraApi: (api: CameraControlsApi | null) => void;
  /** Records the view the camera rig has settled in. Not on the undo stack. */
  setCamera: (camera: DioramaCameraState) => void;
  setPhoto: (changes: Partial<PhotoSettings>) => void;
  registerPhotoApi: (api: PhotoApi | null) => void;
  setSaveStatus: (status: SaveStatus) => void;
}

/** Snapshots `objects` and the ground onto the history stack. Shared by every atomic action. */
function commit(
  state: Pick<DioramaState, "history" | "historyIndex" | "environment">,
  objects: DioramaObject[],
  surface: SurfaceMap | undefined = state.environment.surface
) {
  const next = pushHistory({ history: state.history, historyIndex: state.historyIndex }, { objects, surface });
  return { history: next.history, historyIndex: next.historyIndex };
}

/** A changed ground: the objects standing on it follow, and both go onto the history stack as one step. */
function commitSurface(state: DioramaState, surface: SurfaceMap) {
  const before = state.history[state.historyIndex].surface ?? state.environment.surface;
  const objects = before ? reseatObjects(state.objects, before, surface) : state.objects;
  return { objects, environment: { ...state.environment, surface }, ...commit(state, objects, surface) };
}

/** A multi-selection moves and turns together, but is not scaled — scale falls back to translate. */
function clampTransformMode(selectionSize: number, mode: TransformMode): TransformMode {
  return selectionSize > 1 && mode === "scale" ? "translate" : mode;
}

/**
 * The state after undo or redo moved to another history step. What the step
 * added or changed is selected; a step that only removed objects or edited
 * the ground keeps the selection it can.
 */
function restoreStep(state: DioramaState, step: { historyIndex: number } & HistoryEntry) {
  const changed = changedObjectIds(state.history[state.historyIndex], step);
  const validIds = new Set(step.objects.map((o) => o.id));
  const selectedObjectIds = changed.length ? changed : state.selectedObjectIds.filter((id) => validIds.has(id));
  return {
    objects: step.objects,
    // Steps from before the scene became a plot carry no ground; the current one stays.
    environment: step.surface ? { ...state.environment, surface: step.surface } : state.environment,
    historyIndex: step.historyIndex,
    selectedObjectIds,
    transformMode: clampTransformMode(selectedObjectIds.length, state.transformMode),
    placement: null,
  };
}

/** How far (meters, along X and Z) a duplicate lands from its source. */
const DUPLICATE_OFFSET = 3;
/** The diagonals a duplicate is tried on, in this order. */
const DUPLICATE_DIRECTIONS: Array<[number, number]> = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
];
/** How far duplicates stay from the edge of the base. */
const DUPLICATE_INSET = 0.25;

export const BRUSH_RADIUS_RANGE = { min: 0.25, max: 3 } as const;
export const BRUSH_DENSITY_RANGE = { min: 0.25, max: 1 } as const;
/** Edge of the ground brush, in cells of 0.5 m. */
export const GROUND_BRUSH_RANGE = { min: 1, max: 10 } as const;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** `objects` with the turnable ones among `ids` turned about `pivot`, starting from `from` if given. */
function turnObjects(
  objects: DioramaObject[],
  ids: string[],
  pivot: Vector3Tuple,
  radians: number,
  from?: DioramaObject[]
): DioramaObject[] {
  const turning = getTurnableIds(objects, ids);
  const start = from && indexObjects(from);
  return objects.map((o) => (turning.has(o.id) ? { ...o, ...turnAbout(start?.get(o.id) ?? o, pivot, radians) } : o));
}

/**
 * Where duplicates of objects at `positions` go, as an offset on X and Z:
 * the first diagonal that keeps all of them on the base, else the first
 * diagonal pulled back as a whole until they are.
 */
function duplicateOffset(positions: Vector3Tuple[], template: BaseTemplate): [number, number] {
  if (!positions.length) return [DUPLICATE_OFFSET, DUPLICATE_OFFSET];
  const xs = positions.map((p) => p[0]);
  const zs = positions.map((p) => p[2]);
  const box = { minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) };
  const halfX = template.width / 2 - DUPLICATE_INSET;
  const halfZ = template.depth / 2 - DUPLICATE_INSET;
  const fits = (dx: number, dz: number) =>
    box.minX + dx >= -halfX && box.maxX + dx <= halfX && box.minZ + dz >= -halfZ && box.maxZ + dz <= halfZ;
  for (const [sx, sz] of DUPLICATE_DIRECTIONS) {
    if (fits(sx * DUPLICATE_OFFSET, sz * DUPLICATE_OFFSET)) return [sx * DUPLICATE_OFFSET, sz * DUPLICATE_OFFSET];
  }
  // A group wider than the base is centered on it.
  const pull = (min: number, max: number, half: number) =>
    max - min > 2 * half ? -(min + max) / 2 : clamp(DUPLICATE_OFFSET, -half - min, half - max);
  return [pull(box.minX, box.maxX, halfX), pull(box.minZ, box.maxZ, halfZ)];
}

/**
 * The view and photo settings of a scene that is being opened: its own, or
 * none and the defaults. The export size belongs to the user, so it stays.
 */
function freshView(state: Pick<DioramaState, "photo" | "cameraRevision">, scene?: Pick<DioramaScene, "camera" | "photo">) {
  return {
    camera: scene?.camera,
    photo: { ...DEFAULT_PHOTO_SETTINGS, ...scene?.photo, scale: state.photo.scale },
    cameraRevision: state.cameraRevision + 1,
  };
}

/** The object a placement moves, if it moves an existing one. */
function movingIdOf(placement: Placement | null): string | undefined {
  return placement && !("kit" in placement) ? placement.movingId : undefined;
}

/** A duplicate of a natural asset gets its own heading and size, so repeats never look stamped. */
function varied(object: DioramaObject): DioramaObject {
  if (!ASSET_REGISTRY[object.type].jitter) return object;
  return { ...object, rotation: [0, Math.random() * Math.PI * 2, 0], scale: jitteredScale(object.type, object.scale) };
}
/** The same for an attached object, which has to stay on its building. */
const ATTACHED_DUPLICATE_OFFSET = 0.5;

/**
 * Copies of the given objects with new ids. A building brings its
 * attachments along, re-linked to the copy; an attached object duplicated
 * on its own becomes a sibling on the same building. The others land where
 * the base has room for them (duplicateOffset). Returns the copies, which
 * of them to select, and the offset that was used.
 */
function duplicateWithChildren(
  objects: DioramaObject[],
  ids: string[],
  template: BaseTemplate
): { copies: DioramaObject[]; selectIds: string[]; offset: [number, number] } {
  const roots = new Set(getTopLevelIds(objects, ids));
  const offset = duplicateOffset(
    objects.filter((o) => roots.has(o.id) && !o.parentId).map((o) => o.position),
    template
  );
  const copies: DioramaObject[] = [];
  const selectIds: string[] = [];
  const copyIdOf = new Map<string, string>();

  for (const source of objects) {
    if (!roots.has(source.id)) continue;
    const id = createId();
    copyIdOf.set(source.id, id);
    selectIds.push(id);
    const [x, y, z] = source.position;
    const position: Vector3Tuple = source.parentId
      ? [x + ATTACHED_DUPLICATE_OFFSET, y, z]
      : [x + offset[0], y, z + offset[1]];
    copies.push(varied({ ...source, id, position }));
  }
  for (const source of objects) {
    const parentCopy = source.parentId && copyIdOf.get(source.parentId);
    if (parentCopy) copies.push({ ...source, id: createId(), parentId: parentCopy });
  }
  return { copies, selectIds, offset };
}

function loadInitialState(): {
  objects: DioramaObject[];
  sceneId: string;
  sceneName: string;
  environment: DioramaEnvironment;
  camera?: DioramaCameraState;
  photo?: ScenePhotoSettings;
} {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const result = validateAndNormalizeScene(JSON.parse(raw));
        if (!("error" in result)) {
          return {
            objects: result.scene.objects,
            sceneId: result.scene.id,
            sceneName: result.scene.name,
            environment: result.scene.environment,
            camera: result.scene.camera,
            photo: result.scene.photo,
          };
        }
      }
    } catch {
      // Corrupted localStorage — fall through to the default scene.
    }
  }
  // A first visit opens the hero scene rather than an empty base.
  return {
    objects: FIRST_VISIT_TEMPLATE.objects(),
    sceneId: createId("scene"),
    sceneName: FIRST_VISIT_TEMPLATE.name,
    environment: FIRST_VISIT_TEMPLATE.environment,
  };
}

const initial = loadInitialState();

export const useDioramaStore = create<DioramaState>((set, get) => ({
  objects: initial.objects,
  sceneId: initial.sceneId,
  sceneName: initial.sceneName,
  environment: initial.environment,
  camera: initial.camera,
  photo: { ...DEFAULT_PHOTO_SETTINGS, ...initial.photo },

  ...createInitialHistory(initial.objects, initial.environment.surface),

  selectedObjectIds: [],
  transformMode: "translate",
  snapEnabled: false,
  gridSize: 0.5, // meters (CLAUDE.md §23)
  rotationSnapEnabled: false,
  rotationSnapDegrees: 15,
  isPreviewMode: false,
  saveStatus: "saved",
  importError: null,
  cameraApi: null,
  placement: null,
  placementYaw: 0,
  brush: null,
  brushRadius: 0.8,
  brushDensity: 0.7,
  brushErase: false,
  groundBrush: null,
  groundBrushSize: 2,
  cameraRevision: 0,
  photoApi: null,

  addObject: (type, params) =>
    set((state) => {
      const object = createDioramaObject(type, state.objects.length, getBaseTemplate(state.environment), { params });
      const objects = [...state.objects, object];
      return {
        objects,
        selectedObjectIds: [object.id],
        placement: null,
        brush: null,
        groundBrush: null,
        ...commit(state, objects),
      };
    }),

  addKit: (kit) =>
    set((state) => {
      const position = nextSpawnPosition(state.objects.length, getBaseTemplate(state.environment));
      const placed = instantiateKit(kit, { position, rotation: [0, 0, 0], scale: [1, 1, 1] });
      const objects = [...state.objects, ...placed.objects];
      return {
        objects,
        selectedObjectIds: placed.rootIds,
        transformMode: clampTransformMode(placed.rootIds.length, state.transformMode),
        placement: null,
        brush: null,
        groundBrush: null,
        ...commit(state, objects),
      };
    }),

  removeObject: (id) => get().removeObjects([id]),

  removeObjects: (ids) =>
    set((state) => {
      const idSet = getSubtreeIds(state.objects, ids);
      const objects = state.objects.filter((o) => !idSet.has(o.id));
      return {
        objects,
        selectedObjectIds: state.selectedObjectIds.filter((sid) => !idSet.has(sid)),
        placement: idSet.has(movingIdOf(state.placement) ?? "") ? null : state.placement,
        ...commit(state, objects),
      };
    }),

  startPlacement: (placement) => set({ placement, placementYaw: 0, brush: null, groundBrush: null }),

  cancelPlacement: () => set({ placement: null }),

  rotatePlacement: (radians) =>
    set((state) => (state.placement ? { placementYaw: (state.placementYaw + radians) % (Math.PI * 2) } : state)),

  placeObject: (world, parentId, keepPlacing) =>
    set((state) => {
      const { placement } = state;
      if (!placement) return state;
      const byId = indexObjects(state.objects);
      const parent = parentId ? byId.get(parentId) : undefined;

      if ("kit" in placement) {
        const placed = instantiateKit(placement.kit, world, parent);
        const objects = [...state.objects, ...placed.objects];
        return {
          objects,
          selectedObjectIds: placed.rootIds,
          transformMode: clampTransformMode(placed.rootIds.length, state.transformMode),
          placement: keepPlacing ? placement : null,
          ...commit(state, objects),
        };
      }

      const transform = toParentFrame(world, parent);
      if (placement.movingId) {
        const moving = byId.get(placement.movingId);
        if (!moving) return { placement: null };
        const moved: DioramaObject = { ...moving, ...transform };
        if (parentId) moved.parentId = parentId;
        else delete moved.parentId;
        const objects = state.objects.map((o) => (o.id === moved.id ? moved : o));
        return { objects, placement: null, selectedObjectIds: [moved.id], ...commit(state, objects) };
      }

      const object = createDioramaObject(placement.type, state.objects.length, getBaseTemplate(state.environment), {
        ...transform,
        parentId,
        params: placement.params,
      });
      const objects = [...state.objects, object];
      return {
        objects,
        selectedObjectIds: [object.id],
        placement: keepPlacing ? placement : null,
        ...commit(state, objects),
      };
    }),

  placeRun: (worlds, keepPlacing) =>
    set((state) => {
      const { placement } = state;
      if (!placement || "kit" in placement || placement.movingId || !worlds.length) return state;
      const template = getBaseTemplate(state.environment);
      const placed = worlds.map((world) => createDioramaObject(placement.type, 0, template, { ...world, params: placement.params }));
      const objects = [...state.objects, ...placed];
      return {
        objects,
        selectedObjectIds: placed.map((object) => object.id),
        transformMode: clampTransformMode(placed.length, state.transformMode),
        placement: keepPlacing ? placement : null,
        ...commit(state, objects),
      };
    }),

  detachObject: (id) =>
    set((state) => {
      const byId = indexObjects(state.objects);
      const object = byId.get(id);
      if (!object?.parentId || object.locked) return state;
      const detached: DioramaObject = { ...object, ...getWorldTransform(object, byId) };
      delete detached.parentId;
      const objects = state.objects.map((o) => (o.id === id ? detached : o));
      return { objects, ...commit(state, objects) };
    }),

  setBuildingParams: (id, update) =>
    set((state) => {
      const building = state.objects.find((o) => o.id === id);
      const before = building && buildingParamsOf(building);
      if (!building || !before || building.locked) return state;
      const after = normalizeBuildingParams(update(before)) ?? before;
      const resized = state.objects.map((o) => (o.id === id ? { ...o, params: after } : o));
      // What is attached to the building follows its walls and its roof.
      const objects = refitAttachments(resized, id, before, after);
      return { objects, ...commit(state, objects) };
    }),

  startBrush: (kind, layerId) => set({ brush: { kind, layerId }, placement: null, groundBrush: null }),

  stopBrush: () => set({ brush: null }),

  setBrushRadius: (radius) => set({ brushRadius: clamp(radius, BRUSH_RADIUS_RANGE.min, BRUSH_RADIUS_RANGE.max) }),

  setBrushDensity: (density) =>
    set({ brushDensity: clamp(density, BRUSH_DENSITY_RANGE.min, BRUSH_DENSITY_RANGE.max) }),

  setBrushErase: (erase) => set({ brushErase: erase }),

  beginScatterStroke: (origin) => {
    const state = get();
    const { brush } = state;
    if (!brush) return null;
    const paintable = (id: string | undefined) => {
      const layer = id ? state.objects.find((o) => o.id === id) : undefined;
      return layer && scatterParamsOf(layer)?.kind === brush.kind && !layer.locked && layer.visible ? layer : undefined;
    };
    const selected = state.selectedObjectIds.length === 1 ? state.selectedObjectIds[0] : undefined;
    const target = paintable(brush.layerId) ?? paintable(selected);
    if (target) {
      set({ brush: { ...brush, layerId: target.id }, selectedObjectIds: [target.id] });
      return target.id;
    }
    const layer = createDioramaObject("scatter", 0, getBaseTemplate(state.environment), {
      position: roundPoint(origin),
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      params: { kind: brush.kind, seed: newScatterSeed(), points: [] },
    });
    set({
      objects: [...state.objects, layer],
      brush: { ...brush, layerId: layer.id },
      selectedObjectIds: [layer.id],
      transformMode: "translate",
    });
    return layer.id;
  },

  setScatterPoints: (id, points) =>
    set((state) => ({
      objects: state.objects.map((o) => {
        const params = scatterParamsOf(o);
        return o.id === id && params ? { ...o, params: { ...params, points } } : o;
      }),
    })),

  endScatterStroke: () =>
    set((state) => {
      const emptied = new Set(state.objects.filter((o) => scatterParamsOf(o)?.points.length === 0).map((o) => o.id));
      const objects = emptied.size ? state.objects.filter((o) => !emptied.has(o.id)) : state.objects;
      const cleanup = {
        brush: state.brush?.layerId && emptied.has(state.brush.layerId) ? { kind: state.brush.kind } : state.brush,
        selectedObjectIds: state.selectedObjectIds.filter((id) => !emptied.has(id)),
      };
      // A stroke that changed nothing (a click on bare ground) leaves no undo step.
      const top = state.history[state.historyIndex].objects;
      const unchanged = objects.length === top.length && objects.every((o, i) => o === top[i]);
      if (unchanged) return { objects: top, ...cleanup };
      return { objects, ...cleanup, ...commit(state, objects) };
    }),

  shuffleScatter: (id) =>
    set((state) => {
      const objects = state.objects.map((o) => {
        const params = scatterParamsOf(o);
        return o.id === id && params && !o.locked ? { ...o, params: { ...params, seed: newScatterSeed() } } : o;
      });
      return { objects, ...commit(state, objects) };
    }),

  startGroundBrush: (kind) =>
    set((state) => (state.environment.base === "plot" ? { groundBrush: { kind }, placement: null, brush: null } : state)),

  stopGroundBrush: () => set({ groundBrush: null }),

  setGroundBrushSize: (size) =>
    set({ groundBrushSize: clamp(Math.round(size), GROUND_BRUSH_RANGE.min, GROUND_BRUSH_RANGE.max) }),

  paintGround: (i, j) =>
    set((state) => {
      const { groundBrush, environment } = state;
      if (!groundBrush || !environment.surface) return state;
      const surface = paintCells(environment.surface, i, j, state.groundBrushSize, groundBrush.kind);
      return surface === environment.surface ? state : { environment: { ...environment, surface } };
    }),

  endGroundStroke: () =>
    set((state) => (state.environment.surface ? commitSurface(state, state.environment.surface) : state)),

  applySurfaceLayout: (layout) =>
    set((state) => {
      const current = state.environment.surface;
      if (!current) return state;
      return commitSurface(state, createSurface(layout, current.cols, current.rows.length));
    }),

  resizePlot: (cols, rows) =>
    set((state) => {
      const current = state.environment.surface;
      if (!current) return state;
      return commitSurface(state, resizeSurface(current, cols, rows));
    }),

  updateObject: (id, changes) =>
    set((state) => ({
      objects: state.objects.map((o) => (o.id === id && !o.locked ? { ...o, ...changes } : o)),
    })),

  updateObjects: (ids, changes) =>
    set((state) => {
      const idSet = new Set(ids);
      return {
        objects: state.objects.map((o) => (idSet.has(o.id) && !o.locked ? { ...o, ...changes } : o)),
      };
    }),

  translateObjectsBy: (ids, delta) =>
    set((state) => {
      const idSet = new Set(getTopLevelIds(state.objects, ids));
      const byId = indexObjects(state.objects);
      return {
        objects: state.objects.map((o) => {
          if (!idSet.has(o.id) || o.locked) return o;
          const local = deltaToParentFrame(delta, o.parentId ? byId.get(o.parentId) : undefined);
          return {
            ...o,
            position: [o.position[0] + local[0], o.position[1] + local[1], o.position[2] + local[2]],
          };
        }),
      };
    }),

  turnObjectsAbout: (ids, pivot, radians, from) =>
    set((state) => ({ objects: turnObjects(state.objects, ids, pivot, radians, from) })),

  turnSelection: (radians) =>
    set((state) => {
      const pivot = getSelectionCenter(state.objects, state.selectedObjectIds);
      if (!pivot) return state;
      const objects = turnObjects(state.objects, state.selectedObjectIds, pivot, radians);
      return { objects, ...commit(state, objects) };
    }),

  commitTransform: () => set((state) => commit(state, state.objects)),

  selectObject: (id) =>
    set((state) => ({ selectedObjectIds: [id], transformMode: clampTransformMode(1, state.transformMode) })),

  selectObjects: (ids) =>
    set((state) => {
      const unique = Array.from(new Set(ids));
      return { selectedObjectIds: unique, transformMode: clampTransformMode(unique.length, state.transformMode) };
    }),

  toggleObjectSelection: (id) =>
    set((state) => {
      const has = state.selectedObjectIds.includes(id);
      const next = has ? state.selectedObjectIds.filter((sid) => sid !== id) : [...state.selectedObjectIds, id];
      return { selectedObjectIds: next, transformMode: clampTransformMode(next.length, state.transformMode) };
    }),

  clearSelection: () => set({ selectedObjectIds: [] }),

  duplicateObject: (id) => get().duplicateObjects([id]),

  duplicateObjects: (ids) =>
    set((state) => {
      const { environment } = state;
      const { copies, selectIds, offset } = duplicateWithChildren(state.objects, ids, getBaseTemplate(environment));
      if (!copies.length) return state;
      // On a plot the road and the sidewalk are at different heights: a copy stands on the ground it lands on.
      const seated =
        environment.base === "plot" && environment.surface ? reseatMoved(copies, environment.surface, ...offset) : copies;
      const objects = [...state.objects, ...seated];
      return {
        objects,
        selectedObjectIds: selectIds,
        transformMode: clampTransformMode(selectIds.length, state.transformMode),
        ...commit(state, objects),
      };
    }),

  setObjectVisibility: (id, visible) =>
    set((state) => {
      const objects = state.objects.map((o) => (o.id === id ? { ...o, visible } : o));
      return { objects, ...commit(state, objects) };
    }),

  setObjectLocked: (id, locked) =>
    set((state) => {
      const objects = state.objects.map((o) => (o.id === id ? { ...o, locked } : o));
      return { objects, ...commit(state, objects) };
    }),

  setSceneName: (name) => set({ sceneName: name.slice(0, 80) || DEFAULT_SCENE_NAME }),

  setBase: (base) =>
    set((state) => {
      const { environment } = state;
      if (environment.base === base) return state;
      if (base !== "plot") return { environment: { ...environment, base }, groundBrush: null };
      // A scene that was never a plot gets a ground that matches what its objects stand on now.
      const surface = environment.surface ?? createSurface(environment.base === "corner" ? "corner" : DEFAULT_PLOT_LAYOUT);
      return {
        environment: { ...environment, base, surface },
        // The step undo returns to has to know this ground, or the first stroke could not be undone.
        history: state.history.map((entry, index) => (index === state.historyIndex ? { ...entry, surface } : entry)),
      };
    }),

  setTimeOfDay: (timeOfDay) =>
    set((state) => (state.environment.timeOfDay === timeOfDay ? state : { environment: { ...state.environment, timeOfDay } })),

  setSeason: (season) =>
    set((state) => (state.environment.season === season ? state : { environment: { ...state.environment, season } })),

  setWeather: (weather) =>
    set((state) => (state.environment.weather === weather ? state : { environment: { ...state.environment, weather } })),

  setPlinth: (plinth) =>
    set((state) => (state.environment.plinth === plinth ? state : { environment: { ...state.environment, plinth } })),

  resetScene: () =>
    set((state) => {
      const objects = getDefaultScene(state.environment.base);
      return {
        objects,
        selectedObjectIds: [],
        placement: null,
        brush: null,
        groundBrush: null,
        transformMode: "translate",
        ...commit(state, objects),
      };
    }),

  newScene: (base) =>
    set((state) => {
      const objects: DioramaObject[] = [];
      const environment: DioramaEnvironment = { ...DEFAULT_ENVIRONMENT, base: base ?? state.environment.base };
      if (environment.base === "plot") environment.surface = createSurface(DEFAULT_PLOT_LAYOUT);
      return {
        objects,
        environment,
        sceneId: createId("scene"),
        sceneName: DEFAULT_SCENE_NAME,
        ...freshView(state),
        selectedObjectIds: [],
        placement: null,
        brush: null,
        groundBrush: null,
        transformMode: "translate" as TransformMode,
        ...createInitialHistory(objects, environment.surface),
      };
    }),

  newSceneFromTemplate: (templateId) =>
    set((state) => {
      const template = SCENE_TEMPLATES.find((candidate) => candidate.id === templateId);
      if (!template) return state;
      const objects = template.objects();
      return {
        objects,
        environment: template.environment,
        sceneId: createId("scene"),
        sceneName: template.name,
        ...freshView(state),
        selectedObjectIds: [],
        placement: null,
        brush: null,
        groundBrush: null,
        transformMode: "translate" as TransformMode,
        ...createInitialHistory(objects, template.environment.surface),
      };
    }),

  saveScene: () => {
    if (typeof window === "undefined") return;
    const state = get();
    const scene = buildScene({
      id: state.sceneId,
      name: state.sceneName,
      objects: state.objects,
      environment: state.environment,
      camera: state.camera,
      photo: scenePhotoOf(state.photo),
    });
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeScene(scene)));
    } catch {
      // Storage unavailable/full — editor keeps working in-memory.
    }
    set({ saveStatus: "saved" });
  },

  loadScene: (scene) =>
    set((state) => ({
      objects: scene.objects,
      sceneId: scene.id,
      sceneName: scene.name,
      environment: scene.environment,
      ...freshView(state, scene),
      selectedObjectIds: [],
      placement: null,
      brush: null,
      groundBrush: null,
      transformMode: "translate" as TransformMode,
      ...createInitialHistory(scene.objects, scene.environment.surface),
      saveStatus: "saved" as SaveStatus,
      importError: null,
    })),

  exportScene: () => {
    const state = get();
    downloadSceneAsJson(
      buildScene({
        id: state.sceneId,
        name: state.sceneName,
        objects: state.objects,
        environment: state.environment,
        camera: state.camera,
      photo: scenePhotoOf(state.photo),
      })
    );
  },

  importScene: (json) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      set({ importError: "Unable to import Diorama. The file is invalid or corrupted." });
      return;
    }
    const result = validateAndNormalizeScene(parsed);
    if ("error" in result) {
      set({ importError: `Unable to import Diorama. ${result.error}` });
      return;
    }
    get().loadScene(result.scene);
    get().saveScene();
  },

  clearImportError: () => set({ importError: null }),

  undo: () =>
    set((state) => {
      const result = undoHistory({ history: state.history, historyIndex: state.historyIndex });
      return result ? restoreStep(state, result) : state;
    }),

  redo: () =>
    set((state) => {
      const result = redoHistory({ history: state.history, historyIndex: state.historyIndex });
      return result ? restoreStep(state, result) : state;
    }),

  setTransformMode: (mode) =>
    set((state) => (state.selectedObjectIds.length > 1 && mode === "scale" ? state : { transformMode: mode })),

  setSnapEnabled: (enabled) => set({ snapEnabled: enabled }),
  setGridSize: (size) => set({ gridSize: size }),
  setRotationSnapEnabled: (enabled) => set({ rotationSnapEnabled: enabled }),
  setRotationSnapDegrees: (degrees) => set({ rotationSnapDegrees: degrees }),
  setPreviewMode: (enabled) => set({ isPreviewMode: enabled, placement: null, brush: null, groundBrush: null }),
  registerCameraApi: (api) => set({ cameraApi: api }),
  setCamera: (camera) =>
    set((state) => (JSON.stringify(state.camera) === JSON.stringify(camera) ? state : { camera })),
  setPhoto: (changes) => set((state) => ({ photo: { ...state.photo, ...changes } })),
  registerPhotoApi: (api) => set({ photoApi: api }),
  setSaveStatus: (status) => set({ saveStatus: status }),
}));
