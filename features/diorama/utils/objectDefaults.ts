import type { DioramaBase, DioramaObject, DioramaObjectType, Vector3Tuple } from "../types/diorama.types";
import { ASSET_REGISTRY } from "../assets/assetRegistry";
import { BUILDING_PRESETS, DEFAULT_BUILDING_PARAMS } from "../assets/buildingPresets";
import { BASE_TEMPLATES } from "./baseTemplates";
import { BUILDING_GRID } from "./buildingParams";
import { CORNER } from "./cornerLayout";
import { createId } from "./id";
import { STREET_PLOT } from "./worldScale";

const PLOT_Z = STREET_PLOT.z;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * Places newly-added objects around the middle of the base's spawn area
 * using a golden-angle spiral so repeated clicks fan out instead of stacking
 * on top of each other, clamped to stay inside it.
 */
function nextSpawnPosition(existingCount: number, base: DioramaBase): Vector3Tuple {
  const { spawnBounds: bounds, spawnSpread: spread } = BASE_TEMPLATES[base];
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

/**
 * A new object of `type`. Without a transform it lands on the base's spawn
 * spiral; `overrides` carries a chosen transform, a parent or building params.
 */
export function createDioramaObject(
  type: DioramaObjectType,
  existingCount: number,
  base: DioramaBase,
  overrides: Partial<Pick<DioramaObject, "position" | "rotation" | "scale" | "parentId" | "params">> = {}
): DioramaObject {
  const object: DioramaObject = {
    id: createId(),
    type,
    position: overrides.position ?? nextSpawnPosition(existingCount, base),
    rotation: overrides.rotation ?? [0, spawnYaw(type), 0],
    scale: overrides.scale ?? ASSET_REGISTRY[type].defaultScale,
    visible: true,
    locked: false,
  };
  if (overrides.parentId) object.parentId = overrides.parentId;
  if (type === "building") object.params = overrides.params ?? DEFAULT_BUILDING_PARAMS;
  return object;
}

function place(type: DioramaObjectType, x: number, z: number, rotationY = 0, scale?: number, y = 0): DioramaObject {
  return createDioramaObject(type, 0, "street", {
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

/** The starter scene of a base: what a first visit and "Reset" show. */
export function getDefaultScene(base: DioramaBase): DioramaObject[] {
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

/**
 * Street-corner starter, placed from plan/Hero-Layout.md with the assets
 * that exist so far: the three-floor corner shop-house with its balcony,
 * wall and rooftop attachments, vending machines and a customer under the
 * ginkgo, pots by the shop, a parked bicycle, a kei car at the curb of the
 * right road and a curve mirror watching the junction.
 */
function getCornerStarter(): DioramaObject[] {
  const { bay, groundFloor, upperFloor } = BUILDING_GRID;
  // Footprint x, z −3.76 … 1.7 (Hero-Layout §3); attachments are in its frame.
  const building = createDioramaObject("building", 0, "corner", {
    position: [-1.03, 0, -1.03],
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
    place("pottedPlant", -3.45, 1.95, 1.2),
    place("pottedPlant", -3.05, 1.9, 4.0, 0.8),
    place("ginkgoTree", -6.6, -1.0, 0.4),
    place("vendingMachine", -5.8, 1.35),
    place("vendingMachine", -4.8, 1.35),
    place("pedestrian", -5.3, 2.4, Math.PI),
    place("bicycle", -1.9, 2.45),
    place("keiCar", 4.35, -5.6, Math.PI, undefined, CORNER.roadY),
    place("curveMirror", 3.2, 3.2, Math.PI / 4),
  ];
}

export const DEFAULT_SCENE_NAME = "Untitled Diorama";
