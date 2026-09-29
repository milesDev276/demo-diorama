import { create } from "zustand";
import type {
  CameraControlsApi,
  DioramaCameraState,
  DioramaEnvironment,
  DioramaObject,
  DioramaObjectType,
  DioramaScene,
  SaveStatus,
  TransformMode,
  Vector3Tuple,
} from "../types/diorama.types";
import { createDioramaObject, DEFAULT_SCENE_NAME, getDefaultScene } from "../utils/objectDefaults";
import { createId } from "../utils/id";
import { DEFAULT_CAMERA_STATE, DEFAULT_ENVIRONMENT } from "../utils/sceneDefaults";
import { buildScene, downloadSceneAsJson, serializeScene, STORAGE_KEY } from "../utils/sceneSerializer";
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

  // --- Object CRUD ---
  addObject: (type: DioramaObjectType, position?: Vector3Tuple) => void;
  removeObject: (id: string) => void;
  removeObjects: (ids: string[]) => void;

  // Silent transform updates (no history) — call commitTransform() to snapshot.
  updateObject: (id: string, changes: DioramaObjectChanges) => void;
  updateObjects: (ids: string[], changes: DioramaObjectChanges) => void;
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
  resetScene: () => void;
  newScene: () => void;
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

function offsetPosition(position: Vector3Tuple): Vector3Tuple {
  return [position[0] + 0.5, position[1], position[2] + 0.5];
}

function loadInitialState(): { objects: DioramaObject[]; sceneId: string; sceneName: string } {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const result = validateAndNormalizeScene(JSON.parse(raw));
        if (!("error" in result)) {
          return { objects: result.scene.objects, sceneId: result.scene.id, sceneName: result.scene.name };
        }
      }
    } catch {
      // Corrupted localStorage — fall through to the default scene.
    }
  }
  return { objects: getDefaultScene(), sceneId: createId("scene"), sceneName: DEFAULT_SCENE_NAME };
}

const initial = loadInitialState();

export const useDioramaStore = create<DioramaState>((set, get) => ({
  objects: initial.objects,
  sceneId: initial.sceneId,
  sceneName: initial.sceneName,
  environment: DEFAULT_ENVIRONMENT,
  camera: DEFAULT_CAMERA_STATE,

  ...createInitialHistory(initial.objects),

  selectedObjectIds: [],
  transformMode: "translate",
  snapEnabled: false,
  gridSize: 0.5,
  rotationSnapEnabled: false,
  rotationSnapDegrees: 15,
  isPreviewMode: false,
  saveStatus: "saved",
  importError: null,
  cameraApi: null,

  addObject: (type, position) =>
    set((state) => {
      const object = createDioramaObject(type, state.objects.length, position);
      const objects = [...state.objects, object];
      return {
        objects,
        selectedObjectIds: [object.id],
        ...commit(state, objects),
      };
    }),

  removeObject: (id) =>
    set((state) => {
      const objects = state.objects.filter((o) => o.id !== id);
      return {
        objects,
        selectedObjectIds: state.selectedObjectIds.filter((sid) => sid !== id),
        ...commit(state, objects),
      };
    }),

  removeObjects: (ids) =>
    set((state) => {
      const idSet = new Set(ids);
      const objects = state.objects.filter((o) => !idSet.has(o.id));
      return {
        objects,
        selectedObjectIds: state.selectedObjectIds.filter((sid) => !idSet.has(sid)),
        ...commit(state, objects),
      };
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
      const idSet = new Set(ids);
      return {
        objects: state.objects.map((o) => {
          if (!idSet.has(o.id) || o.locked) return o;
          return {
            ...o,
            position: [o.position[0] + delta[0], o.position[1] + delta[1], o.position[2] + delta[2]],
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

  duplicateObject: (id) =>
    set((state) => {
      const source = state.objects.find((o) => o.id === id);
      if (!source) return state;
      const duplicate: DioramaObject = { ...source, id: createId(), position: offsetPosition(source.position) };
      const objects = [...state.objects, duplicate];
      return { objects, selectedObjectIds: [duplicate.id], ...commit(state, objects) };
    }),

  duplicateObjects: (ids) =>
    set((state) => {
      const idSet = new Set(ids);
      const sources = state.objects.filter((o) => idSet.has(o.id));
      if (!sources.length) return state;
      const duplicates = sources.map((source) => ({
        ...source,
        id: createId(),
        position: offsetPosition(source.position),
      }));
      const objects = [...state.objects, ...duplicates];
      return {
        objects,
        selectedObjectIds: duplicates.map((d) => d.id),
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

  resetScene: () =>
    set((state) => {
      const objects = getDefaultScene();
      return {
        objects,
        selectedObjectIds: [],
        transformMode: "translate",
        ...commit(state, objects),
      };
    }),

  newScene: () =>
    set(() => {
      const objects: DioramaObject[] = [];
      return {
        objects,
        sceneId: createId("scene"),
        sceneName: DEFAULT_SCENE_NAME,
        selectedObjectIds: [],
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
      set({ importError: "Unable to import Diorama. The file is invalid or corrupted." });
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
      };
    }),

  setTransformMode: (mode) =>
    set((state) => (state.selectedObjectIds.length > 1 && mode !== "translate" ? state : { transformMode: mode })),

  setSnapEnabled: (enabled) => set({ snapEnabled: enabled }),
  setGridSize: (size) => set({ gridSize: size }),
  setRotationSnapEnabled: (enabled) => set({ rotationSnapEnabled: enabled }),
  setRotationSnapDegrees: (degrees) => set({ rotationSnapDegrees: degrees }),
  setPreviewMode: (enabled) => set({ isPreviewMode: enabled }),
  registerCameraApi: (api) => set({ cameraApi: api }),
  setSaveStatus: (status) => set({ saveStatus: status }),
}));
