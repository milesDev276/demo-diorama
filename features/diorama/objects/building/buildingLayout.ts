import type { BuildingParams, BuildingSide, FacadeKind, Vector3Tuple } from "../../types/diorama.types";
import { BUILDING_SIDES } from "../../types/diorama.types";
import { BUILDING_GRID, buildingSize, sideBayCount } from "../../utils/buildingParams";

/** The GLB modules a building is assembled from (art/blender/assets/buildings). */
export const BUILDING_MODULES = {
  wall: "/models/buildings/building_bay_wall_01.glb",
  window: "/models/buildings/building_bay_window_01.glb",
  balcony: "/models/buildings/building_bay_balcony_01.glb",
  balconySide: "/models/buildings/building_balcony_side_01.glb",
  entrance: "/models/buildings/building_bay_entrance_01.glb",
  shopfront: "/models/buildings/building_bay_shopfront_01.glb",
  shopSide: "/models/buildings/building_shop_side_01.glb",
  foundation: "/models/buildings/building_bay_foundation_01.glb",
  corner: "/models/buildings/building_corner_01.glb",
  parapet: "/models/buildings/building_parapet_01.glb",
} as const;

export type BuildingModule = keyof typeof BUILDING_MODULES;

export const BUILDING_MODULE_NAMES = Object.keys(BUILDING_MODULES) as BuildingModule[];

/** One module instance in the building's frame (origin: footprint center at ground level). */
export interface ModulePlacement {
  module: BuildingModule;
  position: Vector3Tuple;
  /** Rotation about Y; 0 faces +Z (the front). */
  yaw: number;
  /** Height scale, for the corner post. */
  scaleY: number;
}

const SIDE_YAW: Record<BuildingSide, number> = {
  front: 0,
  right: Math.PI / 2,
  back: Math.PI,
  left: -Math.PI / 2,
};

/** A point on a side of the building: `along` runs left to right as seen from outside, `out` away from the wall. */
function sidePoint(
  size: { width: number; depth: number },
  side: BuildingSide,
  along: number,
  y: number,
  out = 0
): Vector3Tuple {
  const half = (side === "front" || side === "back" ? size.depth : size.width) / 2 + out;
  const sin = Math.sin(SIDE_YAW[side]);
  const cos = Math.cos(SIDE_YAW[side]);
  return [along * cos + half * sin, y, -along * sin + half * cos];
}

/** How far a balcony end panel sits inside its run. */
const BALCONY_END_INSET = 0.035;
/** The same for the end wall of a shop interior: just inside the bay post. */
const SHOP_END_INSET = 0.05;
/** Where a shop light hangs: under the awning, this far out from the wall and this high. */
const SHOP_LIGHT = { out: 0.6, height: 1.8 };

/** The ground-floor bay around the corner from one end of `side`: the last bay of the side before it, or the first of the side after it. */
function bayAroundCorner(params: BuildingParams, side: BuildingSide, end: "left" | "right"): FacadeKind {
  const index = BUILDING_SIDES.indexOf(side);
  const neighbor = BUILDING_SIDES[(index + (end === "left" ? BUILDING_SIDES.length - 1 : 1)) % BUILDING_SIDES.length];
  const bays = params.floors[0][neighbor];
  return end === "left" ? bays[bays.length - 1] : bays[0];
}

const BAY_MODULE: Record<FacadeKind, BuildingModule> = {
  blank: "wall",
  windows: "window",
  balcony: "balcony",
  shopfront: "shopfront",
  entrance: "entrance",
};

/**
 * Where every module of a building goes, for params that went through
 * normalizeBuildingParams. Pure data in, pure data out: bays
 * run left to right along each side as seen from outside, floors stack on
 * the L6 grid, a foundation course lifts ground-floor wall and window bays,
 * balcony runs get an end panel on each side, a run of shopfronts gets an
 * end wall for its interior — unless it turns the corner into another
 * shopfront, so a corner shop is one room — and corner posts cover the
 * joints (up to the railing on a flat rooftop).
 */
export function layoutBuilding(params: BuildingParams): ModulePlacement[] {
  const { bay, groundFloor, upperFloor, foundation, parapet } = BUILDING_GRID;
  const { width, depth, wallHeight } = buildingSize(params);
  const placements: ModulePlacement[] = [];

  const add = (module: BuildingModule, side: BuildingSide, along: number, y: number) =>
    placements.push({ module, position: sidePoint({ width, depth }, side, along, y), yaw: SIDE_YAW[side], scaleY: 1 });

  for (const side of BUILDING_SIDES) {
    const count = sideBayCount(params, side);
    const start = (-count * bay) / 2;
    const center = (i: number) => start + (i + 0.5) * bay;

    params.floors.forEach((floor, floorIndex) => {
      const bays = floor[side];
      const isGround = floorIndex === 0;
      const floorY = isGround ? 0 : groundFloor + (floorIndex - 1) * upperFloor;

      bays.forEach((kind, i) => {
        // Shopfronts and entrances are full ground-floor height; every other
        // module is upper-floor height, raised on the foundation at ground level.
        const onFoundation = isGround && kind !== "shopfront" && kind !== "entrance";
        if (onFoundation) add("foundation", side, center(i), 0);
        add(BAY_MODULE[kind], side, center(i), onFoundation ? foundation : floorY);

        if (kind === "balcony") {
          if (bays[i - 1] !== "balcony") add("balconySide", side, start + i * bay + BALCONY_END_INSET, floorY);
          if (bays[i + 1] !== "balcony") add("balconySide", side, start + (i + 1) * bay - BALCONY_END_INSET, floorY);
        }
        if (kind === "shopfront") {
          const before = i > 0 ? bays[i - 1] : bayAroundCorner(params, side, "left");
          const after = i < count - 1 ? bays[i + 1] : bayAroundCorner(params, side, "right");
          if (before !== "shopfront") add("shopSide", side, start + i * bay + SHOP_END_INSET, floorY);
          if (after !== "shopfront") add("shopSide", side, start + (i + 1) * bay - SHOP_END_INSET, floorY);
        }
      });
    });

    if (params.roof === "flat-rooftop") {
      for (let i = 0; i < count; i++) add("parapet", side, center(i), wallHeight);
    }
  }

  const postHeight = params.roof === "flat-rooftop" ? wallHeight + parapet : wallHeight;
  const corners: Array<[number, number]> = [
    [width / 2, depth / 2],
    [width / 2, -depth / 2],
    [-width / 2, -depth / 2],
    [-width / 2, depth / 2],
  ];
  corners.forEach(([x, z], i) =>
    placements.push({ module: "corner", position: [x, 0, z], yaw: (i * Math.PI) / 2, scaleY: postHeight })
  );

  return placements;
}

/**
 * Where a building's shop lights hang after dark, in its own frame: one per
 * side that has shopfront bays, in front of the middle of them. Derived
 * from the params; nothing about lights is stored in the scene.
 */
export function shopLightPositions(params: BuildingParams): Vector3Tuple[] {
  const size = buildingSize(params);
  const lights: Vector3Tuple[] = [];
  for (const side of BUILDING_SIDES) {
    const bays = params.floors[0][side];
    const start = (-bays.length * BUILDING_GRID.bay) / 2;
    const centers = bays.flatMap((kind, i) => (kind === "shopfront" ? [start + (i + 0.5) * BUILDING_GRID.bay] : []));
    if (!centers.length) continue;
    const middle = centers.reduce((sum, along) => sum + along, 0) / centers.length;
    lights.push(sidePoint(size, side, middle, SHOP_LIGHT.height, SHOP_LIGHT.out));
  }
  return lights;
}
