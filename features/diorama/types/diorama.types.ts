/** Every placeable object type. Single source for the type union and import validation. */
export const DIORAMA_OBJECT_TYPES = [
  "tree",
  "house",
  "rock",
  "shop",
  "utilityPole",
  "powerLine",
  "vendingMachine",
  "sign",
] as const;

export type DioramaObjectType = (typeof DIORAMA_OBJECT_TYPES)[number];

export type Vector3Tuple = [number, number, number];

export interface DioramaObject {
  id: string;
  type: DioramaObjectType;
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
  /** Hidden objects stay in scene state but are not rendered. */
  visible: boolean;
  /** Locked objects are still selectable but cannot be moved/rotated/scaled. */
  locked: boolean;
}

export type TransformMode = "translate" | "rotate" | "scale";

/** Scene-level environment settings. Only one variant exists today, but the
 *  shape leaves room for future ground/sky presets without a data migration. */
export interface DioramaEnvironment {
  background: string;
  ground: string;
}

export interface DioramaCameraState {
  position: Vector3Tuple;
  target: Vector3Tuple;
  zoom: number;
}

/** The complete serializable scene — everything needed to reproduce the
 *  Diorama from scratch. This is what gets saved, exported, and imported. */
export interface DioramaScene {
  id: string;
  name: string;
  objects: DioramaObject[];
  environment: DioramaEnvironment;
  camera: DioramaCameraState;
}

export type CameraPreset = "isometric" | "front" | "side" | "top";

export type SaveStatus = "saved" | "saving" | "unsaved";

/** Imperative bridge from UI/keyboard actions to the live R3F camera rig. */
export interface CameraControlsApi {
  setPreset: (preset: CameraPreset) => void;
  resetCamera: () => void;
  focusOn: (positions: Vector3Tuple[]) => void;
}
