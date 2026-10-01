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
  "airConditioner",
  "ginkgoTree",
  "pedestrian",
  "keiCar",
  "bicycle",
  "curveMirror",
  "building",
  "manhole",
  "gutterGrate",
  "laundry",
  "waterTank",
  "rooftopShed",
  "pottedPlant",
  "kanbanSign",
] as const;

export type DioramaObjectType = (typeof DIORAMA_OBJECT_TYPES)[number];

export type Vector3Tuple = [number, number, number];

/** What one facade bay of a building is. `shopfront` and `entrance` exist on the ground floor only. */
export const FACADE_KINDS = ["blank", "windows", "shopfront", "balcony", "entrance"] as const;
export type FacadeKind = (typeof FACADE_KINDS)[number];

export const BUILDING_SIDES = ["front", "right", "back", "left"] as const;
export type BuildingSide = (typeof BUILDING_SIDES)[number];

export const ROOF_KINDS = ["flat-rooftop", "hipped-tile", "shed"] as const;
export type RoofKind = (typeof ROOF_KINDS)[number];

/** One facade kind per bay, left to right as seen from outside. */
export type BuildingFloor = Record<BuildingSide, FacadeKind[]>;

/** What a `building` object is assembled from (objects/building). Bays follow the 1.82 m grid. */
export interface BuildingParams {
  baysX: number;
  baysZ: number;
  /** Index 0 is the ground floor. */
  floors: BuildingFloor[];
  roof: RoofKind;
}

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
  /** The building this object is attached to. Position, rotation and scale
   *  are then in that building's frame (utils/sceneGraph.ts). */
  parentId?: string;
  /** Only on `building` objects. */
  params?: BuildingParams;
}

export type TransformMode = "translate" | "rotate" | "scale";

/** Editor state while the user is choosing where an object goes: a new one
 *  of `type`, or the existing object `movingId` being put somewhere else. */
export interface Placement {
  type: DioramaObjectType;
  params?: BuildingParams;
  movingId?: string;
}

/** The miniature base the scene is built on (utils/baseTemplates.ts). */
export const DIORAMA_BASES = ["street", "corner"] as const;

export type DioramaBase = (typeof DIORAMA_BASES)[number];

/** Scene-level environment settings. `background` and `ground` have one
 *  variant each today; `base` selects the base template. */
export interface DioramaEnvironment {
  background: string;
  ground: string;
  base: DioramaBase;
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
