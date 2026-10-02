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
  Kit,
  ObjectParams,
  Placement,
  SaveStatus,
  ScatterKind,
  TransformMode,
  Vector3Tuple,
} from "../types/diorama.types";
import { ASSET_REGISTRY } from "../assets/assetRegistry";
import {
  deltaToParentFrame,
  getSubtreeIds,
  getTopLevelIds,
  getWorldTransform,
  indexObjects,
  toParentFrame,
  type Transform,
} from "../utils/sceneGraph";
import {
  createDioramaObject,
  DEFAULT_SCENE_NAME,
  getDefaultScene,
  jitteredScale,
  nextSpawnPosition,
} from "../utils/objectDefaults";
import { instantiateKit } from "../utils/kits";
import { buildingParamsOf, scatterParamsOf } from "../utils/objectParams";
import { newScatterSeed, roundPoint } from "../utils/scatterParams";
import { createId } from "../utils/id";
import { DEFAULT_CAMERA_STATE, DEFAULT_ENVIRONMENT } from "../utils/sceneDefaults";
import { buildScene, downloadSceneAsJson, serializeScene, STORAGE_KEY } from "../utils/sceneSerializer";
import { normalizeBuildingParams } from "../utils/buildingParams";
import { validateAndNormalizeScene } from "../utils/sceneValidator";
import {
  createInitialHistory,
  pushHistory,
  redoHistory,
  undoHistory,
  type HistoryState,
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
  camera: DioramaCameraState;

  // --- Undo/redo history (snapshots of `objects` only) ---
  history: DioramaObject[][];
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

  // Silent transform updates (no history) — call commitTransform() to snapshot.
  updateObject: (id: string, changes: DioramaObjectChanges) => void;
  updateObjects: (ids: string[], changes: DioramaObjectChanges) => void;
  /** Moves objects by a world-space offset. Objects whose parent also moves are left to follow it. */
  translateObjectsBy: (ids: string[], delta: Vector3Tuple) => void;
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
  resetScene: () => void;
  /** Starts an empty scene on the given base (default: the current one). */
  newScene: (base?: DioramaBase) => void;
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
  setSaveStatus: (status: SaveStatus) => void;
}

/** Snapshots `objects` onto the history stack. Shared by every atomic action. */
function commit(state: Pick<DioramaState, "history" | "historyIndex">, objects: DioramaObject[]) {
  const next = pushHistory({ history: state.history, historyIndex: state.historyIndex }, objects);
  return { history: next.history, historyIndex: next.historyIndex };
}

/** Multi-select can only move together — rotate/scale fall back to translate. */
function clampTransformMode(selectionSize: number, mode: TransformMode): TransformMode {
  return selectionSize > 1 && mode !== "translate" ? "translate" : mode;
}

/** How far (meters, along X and Z) a duplicate lands from its source. */
const DUPLICATE_OFFSET = 3;

export const BRUSH_RADIUS_RANGE = { min: 0.25, max: 3 } as const;
export const BRUSH_DENSITY_RANGE = { min: 0.25, max: 1 } as const;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

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
 * on its own becomes a sibling on the same building. Returns the copies and
 * which of them to select.
 */
function duplicateWithChildren(objects: DioramaObject[], ids: string[]): { copies: DioramaObject[]; selectIds: string[] } {
  const roots = new Set(getTopLevelIds(objects, ids));
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
      : [x + DUPLICATE_OFFSET, y, z + DUPLICATE_OFFSET];
    copies.push(varied({ ...source, id, position }));
  }
  for (const source of objects) {
    const parentCopy = source.parentId && copyIdOf.get(source.parentId);
    if (parentCopy) copies.push({ ...source, id: createId(), parentId: parentCopy });
  }
  return { copies, selectIds };
}

function loadInitialState(): {
  objects: DioramaObject[];
  sceneId: string;
  sceneName: string;
  environment: DioramaEnvironment;
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
          };
        }
      }
    } catch {
      // Corrupted localStorage — fall through to the default scene.
    }
  }
  return {
    objects: getDefaultScene(DEFAULT_ENVIRONMENT.base),
    sceneId: createId("scene"),
    sceneName: DEFAULT_SCENE_NAME,
    environment: DEFAULT_ENVIRONMENT,
  };
}

const initial = loadInitialState();

export const useDioramaStore = create<DioramaState>((set, get) => ({
  objects: initial.objects,
  sceneId: initial.sceneId,
  sceneName: initial.sceneName,
  environment: initial.environment,
  camera: DEFAULT_CAMERA_STATE,

  ...createInitialHistory(initial.objects),

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

  addObject: (type, params) =>
    set((state) => {
      const object = createDioramaObject(type, state.objects.length, state.environment.base, { params });
      const objects = [...state.objects, object];
      return {
        objects,
        selectedObjectIds: [object.id],
        placement: null,
        brush: null,
        ...commit(state, objects),
      };
    }),

  addKit: (kit) =>
    set((state) => {
      const position = nextSpawnPosition(state.objects.length, state.environment.base);
      const placed = instantiateKit(kit, { position, rotation: [0, 0, 0], scale: [1, 1, 1] });
      const objects = [...state.objects, ...placed.objects];
      return {
        objects,
        selectedObjectIds: placed.rootIds,
        transformMode: clampTransformMode(placed.rootIds.length, state.transformMode),
        placement: null,
        brush: null,
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

  startPlacement: (placement) => set({ placement, placementYaw: 0, brush: null }),

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

      const object = createDioramaObject(placement.type, state.objects.length, state.environment.base, {
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
      const objects = state.objects.map((o) => {
        const params = buildingParamsOf(o);
        return o.id === id && params && !o.locked ? { ...o, params: normalizeBuildingParams(update(params)) ?? params } : o;
      });
      return { objects, ...commit(state, objects) };
    }),

  startBrush: (kind, layerId) => set({ brush: { kind, layerId }, placement: null }),

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
    const layer = createDioramaObject("scatter", 0, state.environment.base, {
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
      const top = state.history[state.historyIndex];
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
      const { copies, selectIds } = duplicateWithChildren(state.objects, ids);
      if (!copies.length) return state;
      const objects = [...state.objects, ...copies];
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
    set((state) => (state.environment.base === base ? state : { environment: { ...state.environment, base } })),

  resetScene: () =>
    set((state) => {
      const objects = getDefaultScene(state.environment.base);
      return {
        objects,
        selectedObjectIds: [],
        placement: null,
        brush: null,
        transformMode: "translate",
        ...commit(state, objects),
      };
    }),

  newScene: (base) =>
    set((state) => {
      const objects: DioramaObject[] = [];
      return {
        objects,
        environment: { ...state.environment, base: base ?? state.environment.base },
        sceneId: createId("scene"),
        sceneName: DEFAULT_SCENE_NAME,
        selectedObjectIds: [],
        placement: null,
        brush: null,
        transformMode: "translate" as TransformMode,
        ...createInitialHistory(objects),
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
    });
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeScene(scene)));
    } catch {
      // Storage unavailable/full — editor keeps working in-memory.
    }
    set({ saveStatus: "saved" });
  },

  loadScene: (scene) =>
    set(() => ({
      objects: scene.objects,
      sceneId: scene.id,
      sceneName: scene.name,
      environment: scene.environment,
      camera: scene.camera,
      selectedObjectIds: [],
      placement: null,
      brush: null,
      transformMode: "translate" as TransformMode,
      ...createInitialHistory(scene.objects),
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
      const result = undoHistory({ history: state.history, historyIndex: state.historyIndex } as HistoryState);
      if (!result) return state;
      const validIds = new Set(result.objects.map((o) => o.id));
      return {
        objects: result.objects,
        historyIndex: result.historyIndex,
        selectedObjectIds: state.selectedObjectIds.filter((id) => validIds.has(id)),
        placement: null,
      };
    }),

  redo: () =>
    set((state) => {
      const result = redoHistory({ history: state.history, historyIndex: state.historyIndex } as HistoryState);
      if (!result) return state;
      const validIds = new Set(result.objects.map((o) => o.id));
      return {
        objects: result.objects,
        historyIndex: result.historyIndex,
        selectedObjectIds: state.selectedObjectIds.filter((id) => validIds.has(id)),
        placement: null,
      };
    }),

  setTransformMode: (mode) =>
    set((state) => (state.selectedObjectIds.length > 1 && mode !== "translate" ? state : { transformMode: mode })),

  setSnapEnabled: (enabled) => set({ snapEnabled: enabled }),
  setGridSize: (size) => set({ gridSize: size }),
  setRotationSnapEnabled: (enabled) => set({ rotationSnapEnabled: enabled }),
  setRotationSnapDegrees: (degrees) => set({ rotationSnapDegrees: degrees }),
  setPreviewMode: (enabled) => set({ isPreviewMode: enabled, placement: null, brush: null }),
  registerCameraApi: (api) => set({ cameraApi: api }),
  setSaveStatus: (status) => set({ saveStatus: status }),
}));
