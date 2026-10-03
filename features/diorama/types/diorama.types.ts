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
  "scatter",
  "recycleBin",
  "aFrameSign",
  "chair",
  "zelkovaTree",
  "hedge",
  "blockWall",
  "postBox",
  "meterBox",
  "crosswalk",
  "stopLine",
  "roadLine",
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

/** What a scatter layer is painted with (assets/scatterKinds.ts). */
export const SCATTER_KINDS = ["leaves", "grass", "pebbles", "weeds"] as const;
export type ScatterKind = (typeof SCATTER_KINDS)[number];

/** A `scatter` object: many small pieces of one kind, drawn instanced
 *  (objects/scatter). Each piece's heading, size and tint come from the seed
 *  and its position, so they are not stored. */
export interface ScatterParams {
  kind: ScatterKind;
  /** Integer; a new seed gives every piece a new heading, size and tint. */
  seed: number;
  /** Piece positions in the layer's own frame, in meters. */
  points: Vector3Tuple[];
}

/** `BuildingParams` on a `building`, `ScatterParams` on a `scatter` layer (utils/objectParams.ts). */
export type ObjectParams = BuildingParams | ScatterParams;

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
  /** Only on parametric objects: `building` and `scatter`. */
  params?: ObjectParams;
}

/** Props of an asset component written in app code. */
export interface AssetComponentProps {
  object: Pick<DioramaObject, "type" | "params">;
  /** Scene object id, if other objects may be placed on this one. Ghosts have none. */
  surfaceId?: string;
}

export type TransformMode = "translate" | "rotate" | "scale";

/** A saved group of objects that is placed in one go (utils/kits.ts). */
export interface Kit {
  id: string;
  name: string;
  /** Shipped with the app (assets/builtInKits.ts); cannot be deleted. */
  builtIn?: boolean;
  /** Scene objects in the kit's frame: the anchor is the origin, on the ground. */
  objects: DioramaObject[];
}

/** Choosing where a new object of `type` goes, or where the existing object `movingId` goes. */
export interface ObjectPlacement {
  type: DioramaObjectType;
  params?: ObjectParams;
  movingId?: string;
}

/** Choosing where a kit goes. */
export interface KitPlacement {
  kit: Kit;
}

/** Editor state while the user is picking a surface for something. */
export type Placement = ObjectPlacement | KitPlacement;

/** Editor state while the scatter brush is active. `layerId` is the layer it paints into. */
export interface BrushState {
  kind: ScatterKind;
  layerId?: string;
}

/** The miniature base the scene is built on (utils/baseTemplates.ts). */
export const DIORAMA_BASES = ["street", "corner", "plot"] as const;

export type DioramaBase = (typeof DIORAMA_BASES)[number];

/** What a cell of a plot's ground is made of (assets/surfaceKinds.ts). */
export const SURFACE_KINDS = ["asphalt", "sidewalk", "tile", "concrete", "gravel", "grass", "soil"] as const;

export type SurfaceKind = (typeof SURFACE_KINDS)[number];

/** The ground of a `plot` base: a grid of 0.5 m cells centered on the origin
 *  (utils/surfaceMap.ts). Its size is the plot's size. */
export interface SurfaceMap {
  cols: number;
  /** One string per row, back to front (z ascending); one letter per cell, left to right. */
  rows: string[];
}

/** Editor state while the ground brush is active. */
export interface GroundBrushState {
  kind: SurfaceKind;
}

/** The finish of the platform under the diorama (objects/ground/Plinth.tsx). */
export const PLINTH_STYLES = ["dark", "wood", "earth"] as const;

export type PlinthStyle = (typeof PLINTH_STYLES)[number];

/** The light the scene is seen in (utils/timeOfDay.ts). */
export const TIMES_OF_DAY = ["morning", "day", "goldenHour", "evening", "night"] as const;

export type TimeOfDay = (typeof TIMES_OF_DAY)[number];

/** What deciduous crowns, fallen leaves and grass look like (utils/seasons.ts). */
export const SEASONS = ["spring", "summer", "autumn", "winter"] as const;

export type Season = (typeof SEASONS)[number];

/** Scene-level environment settings. `background` and `ground` have one
 *  variant each today; `base` selects the base template. */
export interface DioramaEnvironment {
  background: string;
  ground: string;
  base: DioramaBase;
  timeOfDay: TimeOfDay;
  season: Season;
  plinth: PlinthStyle;
  /** The painted ground of the `plot` base. Kept, but not drawn, on the other bases. */
  surface?: SurfaceMap;
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

/** The shape of the photo frame in Preview (utils/photo.ts). */
export const PHOTO_ASPECTS = ["free", "1:1", "4:5", "16:9"] as const;

export type PhotoAspect = (typeof PHOTO_ASPECTS)[number];

/** How Preview frames and exposes a photo. Editor state: not saved with the scene. */
export interface PhotoSettings {
  aspect: PhotoAspect;
  /** World point the tilt-shift keeps sharp; null = the middle of the frame. */
  focus: Vector3Tuple | null;
  /** Strength of the tilt-shift blur away from the focus. */
  blur: number;
  /** Exposure compensation in stops. */
  exposure: number;
  /** Export size, as a multiple of the frame's size on screen. */
  scale: number;
}

/** What a finished export reports back. */
export interface PhotoExport {
  width: number;
  height: number;
  fileName: string;
}

/** Imperative bridge from the photo bar to the live renderer (PhotoStudio). */
export interface PhotoApi {
  /** The size an export at `scale` would have, after clamping to what the GPU can do. */
  exportSize: (scale: number) => { width: number; height: number };
  /** Renders the frame at `scale` × its size on screen and downloads it as a PNG. */
  savePhoto: (scale: number) => Promise<PhotoExport>;
}

/** Imperative bridge from UI/keyboard actions to the live R3F camera rig. */
export interface CameraControlsApi {
  setPreset: (preset: CameraPreset) => void;
  resetCamera: () => void;
  focusOn: (positions: Vector3Tuple[]) => void;
}
