import type { DioramaObject, DioramaObjectType, Kit, ScatterKind, Vector3Tuple } from "../types/diorama.types";
import { BASE_TEMPLATES } from "../utils/baseTemplates";
import { createDioramaObject } from "../utils/objectDefaults";
import { roundPoint, scatterPatch } from "../utils/scatterParams";
import { SCATTER_KIND_SPECS } from "./scatterKinds";

/** An object of a built-in kit, in the kit's frame (meters, front toward +Z). */
function item(type: DioramaObjectType, x: number, z: number, yaw = 0, scale = 1, y = 0): DioramaObject {
  return createDioramaObject(type, 0, BASE_TEMPLATES.corner, { position: [x, y, z], rotation: [0, yaw, 0], scale: [scale, scale, scale] });
}

/** A small scatter cluster of patches around the given centers, as one layer at the kit's anchor. */
function cluster(kind: ScatterKind, seed: number, patches: Array<[x: number, z: number, radius: number]>): DioramaObject {
  const spacing = SCATTER_KIND_SPECS[kind].spacing;
  const points = patches.flatMap(([cx, cz, radius], i) =>
    scatterPatch(seed + i, radius, spacing, 40).map(([x, , z]): Vector3Tuple => roundPoint([x + cx, 0, z + cz]))
  );
  return createDioramaObject("scatter", 0, BASE_TEMPLATES.corner, {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    params: { kind, seed, points },
  });
}

/**
 * The four kits shipped with the app (plan/Stage-6-Implementation.md D8).
 * Ids are fixed: the library keys and thumbnails are named after them.
 */
export const BUILT_IN_KITS: Kit[] = [
  {
    id: "vending-corner",
    name: "Vending Corner",
    builtIn: true,
    objects: [
      item("vendingMachine", -0.9, 0),
      item("vendingMachine", 0.2, 0),
      item("recycleBin", 1.0, 0.08),
      cluster("weeds", 501, [
        [-1.65, 0.1, 0.35],
        [1.5, 0.15, 0.3],
      ]),
    ],
  },
  {
    id: "bike-parking",
    name: "Bike Parking",
    builtIn: true,
    // Parked side by side, front wheels toward the wall behind them.
    objects: [item("bicycle", -0.62, 0, Math.PI / 2 + 0.05), item("bicycle", 0, 0.12, Math.PI / 2 - 0.04), item("bicycle", 0.64, -0.05, Math.PI / 2 + 0.1)],
  },
  {
    id: "shop-entrance",
    name: "Shop Entrance",
    builtIn: true,
    objects: [
      item("aFrameSign", 0.85, 0.35, -0.25),
      item("pottedPlant", -0.55, 0, 0.4),
      item("pottedPlant", -0.95, 0.15, 2.0, 0.8),
      item("pottedPlant", -0.7, 0.45, 4.1, 0.9),
      cluster("weeds", 601, [[-1.2, -0.2, 0.3]]),
    ],
  },
  {
    id: "rooftop-set",
    name: "Rooftop Set",
    builtIn: true,
    objects: [
      item("waterTank", -1.15, -0.9),
      item("rooftopShed", 1.0, -0.95),
      item("laundry", -0.45, 0.65),
      item("chair", 1.15, 0.9, 3.4),
      item("pottedPlant", -1.5, 1.0, 0.7),
      item("pottedPlant", -1.1, 1.2, 2.6, 0.8),
    ],
  },
];
