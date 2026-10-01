import { create } from "zustand";
import type {
  CameraControlsApi,
  BuildingParams,
  DioramaBase,
  DioramaCameraState,
  DioramaEnvironment,
  DioramaObject,
  DioramaObjectType,
  DioramaScene,
  Placement,
  SaveStatus,
  TransformMode,
  Vector3Tuple,
} from "../types/diorama.types";
import {
  deltaToParentFrame,
  getSubtreeIds,
  getTopLevelIds,
  getWorldTransform,
  indexObjects,
  toParentFrame,
  type Transform,
} from "../utils/sceneGraph";
import { createDioramaObject, DEFAULT_SCENE_NAME, getDefaultScene } from "../utils/objectDefaults";
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
  /** Set while the user is picking a surface for a new or an existing object. */
  placement: Placement | null;

  // --- Object CRUD ---
  /** Adds an object on the spawn spiral. Removing a building removes what is attached to it. */
  addObject: (type: DioramaObjectType, params?: BuildingParams) => void;
  removeObject: (id: string) => void;
  removeObjects: (ids: string[]) => void;

  // --- Placement on surfaces ---
  startPlacement: (placement: Placement) => void;
  cancelPlacement: () => void;
  /** Finishes the current placement at a world transform, attached to `parentId` if given. */
  placeObject: (world: Transform, parentId: string | undefined, keepPlacing: boolean) => void;
  /** Frees an attached object from its building without moving it. */
  detachObject: (id: string) => void;
  /** Changes a building through a function of its current params. One undo step. */
  setBuildingParams: (id: string, update: (current: BuildingParams) => BuildingParams) => void;

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
    copies.push({ ...source, id, position });
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

  addObject: (type, params) =>
    set((state) => {
      const object = createDioramaObject(type, state.objects.length, state.environment.base, { params });
      const objects = [...state.objects, object];
      return {
        objects,
        selectedObjectIds: [object.id],
        placement: null,
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
        placement: state.placement?.movingId && idSet.has(state.placement.movingId) ? null : state.placement,
        ...commit(state, objects),
      };
    }),

  startPlacement: (placement) => set({ placement }),

  cancelPlacement: () => set({ placement: null }),

  placeObject: (world, parentId, keepPlacing) =>
    set((state) => {
      const { placement } = state;
      if (!placement) return state;
      const byId = indexObjects(state.objects);
      const transform = toParentFrame(world, parentId ? byId.get(parentId) : undefined);

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
      const objects = state.objects.map((o) =>
        o.id === id && o.params && !o.locked ? { ...o, params: normalizeBuildingParams(update(o.params)) ?? o.params } : o
      );
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
  setPreviewMode: (enabled) => set({ isPreviewMode: enabled, placement: null }),
  registerCameraApi: (api) => set({ cameraApi: api }),
  setSaveStatus: (status) => set({ saveStatus: status }),
}));
