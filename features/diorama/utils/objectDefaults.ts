import type { DioramaObject, DioramaObjectType, Vector3Tuple } from "../types/diorama.types";
import { createId } from "./id";

/** Radius of the walkable grass top of the island — keep spawned objects inside this. */
export const ISLAND_RADIUS = 4.2;

const DEFAULT_SCALE: Record<DioramaObjectType, Vector3Tuple> = {
  tree: [1, 1, 1],
  house: [1, 1, 1],
  rock: [0.9, 0.9, 0.9],
};

/**
 * Places newly-added objects around the island center using a golden-angle
 * spiral so repeated clicks fan out instead of stacking on top of each other.
 */
function nextSpawnPosition(existingCount: number): Vector3Tuple {
  const goldenAngle = 2.399963229728653; // radians
  const angle = existingCount * goldenAngle;
  const radius = Math.min(ISLAND_RADIUS * 0.75, 0.6 + existingCount * 0.35);
  const jitter = (Math.random() - 0.5) * 0.3;

  const x = Math.cos(angle) * radius + jitter;
  const z = Math.sin(angle) * radius + jitter;

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
    rotation: [0, Math.random() * Math.PI * 2, 0],
    scale: DEFAULT_SCALE[type],
    visible: true,
    locked: false,
  };
}

/** A visually pleasant starting layout: 1 house, 2 trees, 2 rocks. */
export function getDefaultScene(): DioramaObject[] {
  return [
    {
      id: createId(),
      type: "house",
      position: [0, 0, -0.6],
      rotation: [0, Math.PI * 0.15, 0],
      scale: DEFAULT_SCALE.house,
      visible: true,
      locked: false,
    },
    {
      id: createId(),
      type: "tree",
      position: [-2.3, 0, 1.5],
      rotation: [0, 0.4, 0],
      scale: [1.05, 1.05, 1.05],
      visible: true,
      locked: false,
    },
    {
      id: createId(),
      type: "tree",
      position: [1.9, 0, -1.9],
      rotation: [0, -0.6, 0],
      scale: [0.95, 0.95, 0.95],
      visible: true,
      locked: false,
    },
    {
      id: createId(),
      type: "rock",
      position: [-1.9, 0, 0.5],
      rotation: [0, 0.8, 0],
      scale: DEFAULT_SCALE.rock,
      visible: true,
      locked: false,
    },
    {
      id: createId(),
      type: "rock",
      position: [2.5, 0, 1.1],
      rotation: [0, -0.3, 0],
      scale: [0.75, 0.75, 0.75],
      visible: true,
      locked: false,
    },
  ];
}

export const DEFAULT_SCENE_NAME = "Untitled Diorama";
