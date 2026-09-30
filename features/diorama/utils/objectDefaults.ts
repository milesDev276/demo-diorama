import type { DioramaObject, DioramaObjectType, Vector3Tuple } from "../types/diorama.types";
import { ASSET_REGISTRY } from "../assets/assetRegistry";
import { createId } from "./id";
import { STREET_PLOT } from "./worldScale";

const PLOT_Z = STREET_PLOT.z;

/** Where newly-added objects may spawn: the building lot plus the sidewalk, inset from the edges. */
const SPAWN_BOUNDS = {
  minX: -STREET_PLOT.width / 2 + 2.1,
  maxX: STREET_PLOT.width / 2 - 2.1,
  minZ: PLOT_Z.lot + 1.5,
  maxZ: PLOT_Z.road - 0.6,
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * Places newly-added objects around the middle of the lot using a
 * golden-angle spiral so repeated clicks fan out instead of stacking on top
 * of each other, clamped to stay on the plot.
 */
function nextSpawnPosition(existingCount: number): Vector3Tuple {
  const goldenAngle = 2.399963229728653; // radians
  const angle = existingCount * goldenAngle;
  const radius = Math.min(18, 3.6 + existingCount * 2.1);
  const jitter = (Math.random() - 0.5) * 1.8;
  const centerZ = (SPAWN_BOUNDS.minZ + SPAWN_BOUNDS.maxZ) / 2;

  const x = clamp(Math.cos(angle) * radius + jitter, SPAWN_BOUNDS.minX, SPAWN_BOUNDS.maxX);
  const z = clamp(centerZ + Math.sin(angle) * radius + jitter, SPAWN_BOUNDS.minZ, SPAWN_BOUNDS.maxZ);

  return [Number(x.toFixed(2)), 0, Number(z.toFixed(2))];
}

export function createDioramaObject(
  type: DioramaObjectType,
  existingCount: number,
  position?: Vector3Tuple
): DioramaObject {
  return {
    id: createId(),
    type,
    position: position ?? nextSpawnPosition(existingCount),
    rotation: [0, ASSET_REGISTRY[type].randomSpawnRotation ? Math.random() * Math.PI * 2 : 0, 0],
    scale: ASSET_REGISTRY[type].defaultScale,
    visible: true,
    locked: false,
  };
}

function place(type: DioramaObjectType, x: number, z: number, rotationY = 0, scale?: number): DioramaObject {
  return {
    id: createId(),
    type,
    position: [x, 0, z],
    rotation: [0, rotationY, 0],
    scale: scale === undefined ? ASSET_REGISTRY[type].defaultScale : [scale, scale, scale],
    visible: true,
    locked: false,
  };
}

/**
 * The vertical-slice street corner: house and shop on the lot facing the
 * road, a utility pole carrying power lines at the curb, a vending machine
 * by the shop, a stop sign, and garden trees along the back.
 */
export function getDefaultScene(): DioramaObject[] {
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

export const DEFAULT_SCENE_NAME = "Untitled Diorama";
