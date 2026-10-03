import type {
  DioramaBase,
  DioramaObject,
  DioramaObjectType,
  ObjectParams,
  ScatterKind,
  ScatterParams,
  Vector3Tuple,
} from "../types/diorama.types";
import { ASSET_REGISTRY } from "../assets/assetRegistry";
import { BUILDING_PRESETS, DEFAULT_BUILDING_PARAMS } from "../assets/buildingPresets";
import { SCATTER_KIND_SPECS } from "../assets/scatterKinds";
import { BASE_TEMPLATES, type BaseTemplate } from "./baseTemplates";
import { BUILDING_GRID } from "./buildingParams";
import { CORNER } from "./cornerLayout";
import { createId } from "./id";
import { newScatterSeed, roundPoint, scatterLine, scatterPatch } from "./scatterParams";
import { STREET_PLOT } from "./worldScale";

const PLOT_Z = STREET_PLOT.z;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * Places newly-added objects around the middle of the base's spawn area
 * using a golden-angle spiral so repeated clicks fan out instead of stacking
 * on top of each other, clamped to stay inside it.
 */
export function nextSpawnPosition(existingCount: number, template: BaseTemplate): Vector3Tuple {
  const { spawnBounds: bounds, spawnSpread: spread } = template;
  const goldenAngle = 2.399963229728653; // radians
  const angle = existingCount * goldenAngle;
  const radius = Math.min(spread.max, spread.start + existingCount * spread.step);
  const jitter = (Math.random() - 0.5) * spread.jitter;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;

  const x = clamp(centerX + Math.cos(angle) * radius + jitter, bounds.minX, bounds.maxX);
  const z = clamp(centerZ + Math.sin(angle) * radius + jitter, bounds.minZ, bounds.maxZ);

  return [Number(x.toFixed(2)), 0, Number(z.toFixed(2))];
}

/** The heading a new object of this type starts with. */
export function spawnYaw(type: DioramaObjectType): number {
  return ASSET_REGISTRY[type].randomSpawnRotation ? Math.random() * Math.PI * 2 : 0;
}

/** The scale of a repeat of `scale`: varied within the asset's jitter, if it has one. */
export function jitteredScale(type: DioramaObjectType, scale: Vector3Tuple): Vector3Tuple {
  const jitter = ASSET_REGISTRY[type].jitter;
  if (!jitter) return scale;
  const k = 1 + (Math.random() * 2 - 1) * jitter;
  return [scale[0] * k, scale[1] * k, scale[2] * k];
}

/** A ready-made round patch of one scatter kind — the brush's keyboard path, kits and starters. */
export function scatterPatchParams(kind: ScatterKind, radius = 1.2, seed = newScatterSeed()): ScatterParams {
  return { kind, seed, points: scatterPatch(seed, radius, SCATTER_KIND_SPECS[kind].spacing * 1.15) };
}

function defaultParams(type: DioramaObjectType): ObjectParams | undefined {
  if (type === "building") return DEFAULT_BUILDING_PARAMS;
  if (type === "scatter") return scatterPatchParams("leaves");
  return undefined;
}

/**
 * A new object of `type`. Without a transform it lands on the template's spawn
 * spiral; `overrides` carries a chosen transform, a parent or building params.
 */
export function createDioramaObject(
  type: DioramaObjectType,
  existingCount: number,
  template: BaseTemplate,
  overrides: Partial<Pick<DioramaObject, "position" | "rotation" | "scale" | "parentId" | "params">> = {}
): DioramaObject {
  const object: DioramaObject = {
    id: createId(),
    type,
    position: overrides.position ?? nextSpawnPosition(existingCount, template),
    rotation: overrides.rotation ?? [0, spawnYaw(type), 0],
    scale: overrides.scale ?? ASSET_REGISTRY[type].defaultScale,
    visible: true,
    locked: false,
  };
  if (overrides.parentId) object.parentId = overrides.parentId;
  const params = overrides.params ?? defaultParams(type);
  if (params) object.params = params;
  return object;
}

/** An object of a starter scene at a world position on the ground (or at height `y`). */
export function place(type: DioramaObjectType, x: number, z: number, rotationY = 0, scale?: number, y = 0): DioramaObject {
  return createDioramaObject(type, 0, BASE_TEMPLATES.street, {
    position: [x, y, z],
    rotation: [0, rotationY, 0],
    scale: scale === undefined ? undefined : [scale, scale, scale],
  });
}

/** An object attached to `parent`, at a position in the parent's frame. */
function attach(
  parent: DioramaObject,
  type: DioramaObjectType,
  position: Vector3Tuple,
  rotationY = 0,
  scale?: number
): DioramaObject {
  return { ...place(type, position[0], position[2], rotationY, scale, position[1]), parentId: parent.id };
}

/** The starter scene of a base: what "Reset" shows. A plot starts empty. */
export function getDefaultScene(base: DioramaBase): DioramaObject[] {
  if (base === "plot") return [];
  return base === "corner" ? getCornerStarter() : getStreetStarter();
}

/**
 * The vertical-slice street strip: house and shop on the lot facing the
 * road, a utility pole carrying power lines at the curb, a vending machine
 * by the shop, a stop sign, and garden trees along the back.
 */
function getStreetStarter(): DioramaObject[] {
  const curbLine = PLOT_Z.road - 0.72;

  return [
    place("house", -13.2, PLOT_Z.lot + 6),
    place("shop", 5.4, PLOT_Z.lot + 5.7),
    place("vendingMachine", 10.5, PLOT_Z.sidewalk - 0.84),
    place("utilityPole", 0, curbLine),
    place("powerLine", 0, curbLine),
    place("sign", 17.4, curbLine),
    place("tree", -21, PLOT_Z.back + 1.8),
    place("tree", 20.4, PLOT_Z.back + 2.1, 0.8, 0.85),
    place("rock", -7.2, PLOT_Z.back + 1.5, 0.4, 0.6),
  ];
}

/** A scatter layer at a world position, with points in its own frame. */
function scatterLayer(kind: ScatterKind, origin: [number, number], seed: number, points: Vector3Tuple[]): DioramaObject {
  return createDioramaObject("scatter", 0, BASE_TEMPLATES.corner, {
    position: [origin[0], 0, origin[1]],
    rotation: [0, 0, 0],
    params: { kind, seed, points },
  });
}

/** Points of a patch centered at `center` (world), expressed from `origin` and kept inside `keep`. */
function patchAt(
  seed: number,
  kind: ScatterKind,
  origin: [number, number],
  center: [number, number],
  radius: number,
  keep: (x: number, z: number) => boolean
): Vector3Tuple[] {
  return scatterPatch(seed, radius, SCATTER_KIND_SPECS[kind].spacing * 1.1, 400)
    .map(([x, , z]): Vector3Tuple => [x + center[0], 0, z + center[1]])
    .filter(([x, , z]) => keep(x, z))
    .map(([x, , z]) => roundPoint([x - origin[0], 0, z - origin[1]]));
}

/**
 * The corner starter's small details: fallen leaves under both trees
 * drifting onto the sidewalks, weeds along the building's back walls and the
 * foot of the block wall, and grass in the lot's back corner. Kept off the
 * roads and the building.
 */
function cornerScatter(): DioramaObject[] {
  const inside = (x: number, z: number) => Math.max(Math.abs(x), Math.abs(z)) < CORNER.half - 0.15;
  const offRoad = (x: number, z: number) => inside(x, z) && x < CORNER.roadEdge - 0.2 && z < CORNER.roadEdge - 0.2;
  const offBuilding = (x: number, z: number) => offRoad(x, z) && !(x > -3.9 && x < 1.85 && z > -3.9 && z < 1.85);

  const leavesOrigin: [number, number] = [-6.6, -1.0];
  const leaves = [
    ...patchAt(11, "leaves", leavesOrigin, leavesOrigin, 2.4, offBuilding),
    ...patchAt(12, "leaves", leavesOrigin, [-5.4, 2.7], 1.3, offBuilding),
    ...patchAt(13, "leaves", leavesOrigin, [-0.3, -6.2], 2.3, offBuilding),
    ...patchAt(14, "leaves", leavesOrigin, [2.7, -5.2], 0.9, offBuilding),
  ];

  const weedsOrigin: [number, number] = [-3.95, -3.95];
  const wallFoot = (from: [number, number], to: [number, number], seed: number) =>
    scatterLine(seed, from, to, 0.5, 0.08).map(([x, , z]) => roundPoint([x - weedsOrigin[0], 0, z - weedsOrigin[1]]));
  const weeds = [
    ...wallFoot([-3.95, -3.95], [1.6, -3.95], 21),
    ...wallFoot([-3.95, -3.7], [-3.95, 1.2], 22),
    ...wallFoot([-7.75, -7.75], [-1.5, -7.75], 23),
  ];

  const grassOrigin: [number, number] = [-6.6, -6.6];
  const grass = patchAt(31, "grass", grassOrigin, grassOrigin, 1.5, inside);

  return [
    scatterLayer("leaves", leavesOrigin, 1101, leaves),
    scatterLayer("weeds", weedsOrigin, 2101, weeds),
    scatterLayer("grass", grassOrigin, 3101, grass),
  ];
}

/** Pieces of a tiling asset (block wall, hedge) end to end from `from` to `to`, which lie along X or along Z. */
export function run(
  type: DioramaObjectType,
  pieceLength: number,
  from: [number, number],
  to: [number, number]
): DioramaObject[] {
  const alongX = Math.abs(to[0] - from[0]) >= Math.abs(to[1] - from[1]);
  const count = Math.round(Math.hypot(to[0] - from[0], to[1] - from[1]) / pieceLength);
  return Array.from({ length: count }, (_, i) => {
    const t = (i + 0.5) / count;
    return place(type, from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, alongX ? 0 : Math.PI / 2);
  });
}

/**
 * Street-corner starter — the hero scene of plan/Hero-Layout.md: the
 * three-floor corner liquor shop with its balcony, wall and rooftop
 * attachments; vending machines, a recycling bin and a customer under the
 * ginkgo; a utility pole with its transformer and wires, a post box, pots,
 * a bicycle and an A-frame sign on the front sidewalk; a kei car at the
 * curb of the right road, a stop sign, a pedestrian on the crosswalk and a
 * curve mirror watching the junction; a zelkova, a hedge and a block wall
 * closing the lot; and fallen leaves, weeds and grass.
 */
/**
 * The three-floor corner shop-house (the first building preset) centered on
 * (`x`, `z`), with what hangs on it and stands on its roof: AC units,
 * laundry, the vertical shop sign, a meter, a water tank, a shed, pots and
 * a chair. The attachments are in the building's frame.
 */
export function shopHouse(x: number, z: number): DioramaObject[] {
  const { bay, groundFloor, upperFloor } = BUILDING_GRID;
  const building = createDioramaObject("building", 0, BASE_TEMPLATES.corner, {
    position: [x, 0, z],
    rotation: [0, 0, 0],
    params: BUILDING_PRESETS[0].params,
  });
  const wall = (bay * 3) / 2;
  const balconyFloor = groundFloor + 0.05;
  const roof = groundFloor + 2 * upperFloor;

  return [
    building,
    attach(building, "airConditioner", [2.25, balconyFloor, wall + 0.3]),
    attach(building, "laundry", [0.45, balconyFloor, wall + 0.5]),
    attach(building, "airConditioner", [wall + 0.2, groundFloor + upperFloor + 0.15, 0], Math.PI / 2),
    attach(building, "kanbanSign", [wall, 3.6, 2.1], Math.PI / 2),
    attach(building, "waterTank", [1.63, roof, -1.77]),
    attach(building, "rooftopShed", [-1.27, roof, -1.57]),
    attach(building, "pottedPlant", [2.2, roof, 2.25], 0.6),
    attach(building, "pottedPlant", [1.75, roof, 2.3], 2.1, 0.8),
    attach(building, "chair", [1.0, roof, 1.85], 0.5),
    // Electricity meter on the blank bay of the right wall
    attach(building, "meterBox", [wall, 1.25, -1.82], Math.PI / 2),
  ];
}

function getCornerStarter(): DioramaObject[] {
  return [
    // Footprint x, z −3.76 … 1.7 (Hero-Layout §3).
    ...shopHouse(-1.03, -1.03),
    place("pottedPlant", -3.45, 1.95, 1.2),
    place("pottedPlant", -3.05, 1.9, 4.0, 0.8),
    place("ginkgoTree", -6.6, -1.0, 0.4),
    place("zelkovaTree", -0.3, -6.2, 1.1),
    place("vendingMachine", -5.8, 1.35),
    place("vendingMachine", -4.8, 1.35),
    place("recycleBin", -6.7, 1.45),
    place("pedestrian", -5.3, 2.4, Math.PI),
    place("utilityPole", -5.5, 3.2),
    place("powerLine", -5.5, 3.2),
    place("postBox", -7.2, 2.5),
    place("bicycle", -1.9, 2.45),
    place("aFrameSign", 0.6, 2.6, -0.2),
    place("keiCar", 4.35, -5.6, Math.PI, undefined, CORNER.roadY),
    place("sign", 7.8, -0.8, Math.PI, undefined, CORNER.roadY),
    place("pedestrian", 5.6, 1.8, Math.PI / 2, undefined, CORNER.roadY),
    place("curveMirror", 3.2, 3.2, Math.PI / 4),
    ...run("blockWall", 2, [-8, -7.925], [2, -7.925]),
    ...run("blockWall", 2, [-7.925, -8], [-7.925, 2]),
    ...run("hedge", 1.2, [1.6, -7.8], [1.6, -4.2]),
    ...cornerScatter(),
  ];
}

export const DEFAULT_SCENE_NAME = "Untitled Diorama";
