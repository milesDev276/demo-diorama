import type { DioramaObject, SurfaceKind, SurfaceMap } from "../types/diorama.types";
import { BUILDING_PRESETS } from "../assets/buildingPresets";
import { SURFACE_KIND_SPECS } from "../assets/surfaceKinds";
import { BASE_TEMPLATES } from "./baseTemplates";
import { CORNER } from "./cornerLayout";
import { createDioramaObject, place, run, scatterPatchParams, shopHouse } from "./objectDefaults";
import { SURFACE_CELL } from "./surfaceMap";

/**
 * The "Back Street" starter: a 24 × 16 m plot with a front road and a side
 * lane meeting in a T-junction. Left of the lane a corner shop-house and a
 * walled garden; right of it a house and a small fenced parking lot. X runs
 * −12 … 12, Z −8 … 8 (front). All numbers are meters.
 */
const WIDTH = 24;
const DEPTH = 16;
const ROAD_Y = CORNER.roadY;

/** Where the ground changes kind. */
const FRONT_ROAD_Z = 3.5;
const SIDEWALK_Z = 2;
const LANE = { x0: 2, x1: 5 };
const PARKING_Z = -3;
const GARDEN = { x1: -6, z1: -2 };
const CROSSWALK_X = -6.25;

/** Rectangles painted in order, later ones over earlier ones: [kind, x0, x1, z0, z1]. */
const GROUND: Array<[SurfaceKind, number, number, number, number]> = [
  ["gravel", -12, 12, -8, 8],
  ["grass", -12, GARDEN.x1, -8, GARDEN.z1],
  ["concrete", LANE.x1, 12, -8, PARKING_Z],
  // The step from the parking lot down to the lane is a ramp: a driveway.
  ["ramp", LANE.x1, LANE.x1 + 0.5, -8, PARKING_Z],
  ["tile", LANE.x1, 12, 1, SIDEWALK_Z],
  ["sidewalk", -12, 12, SIDEWALK_Z, FRONT_ROAD_Z],
  ["asphalt", -12, 12, FRONT_ROAD_Z, 8],
  ["asphalt", LANE.x0, LANE.x1, -8, FRONT_ROAD_Z],
  // The curb is dropped where the crosswalk meets the sidewalk.
  ["ramp", CROSSWALK_X - 1.25, CROSSWALK_X + 1.25, FRONT_ROAD_Z - 0.5, FRONT_ROAD_Z],
];

export function getBackStreetSurface(): SurfaceMap {
  const cols = WIDTH / SURFACE_CELL;
  const rows = DEPTH / SURFACE_CELL;
  const cells = Array.from({ length: rows }, () => new Array<string>(cols).fill(SURFACE_KIND_SPECS.gravel.code));
  for (const [kind, x0, x1, z0, z1] of GROUND) {
    const { code } = SURFACE_KIND_SPECS[kind];
    for (let j = Math.round((z0 + DEPTH / 2) / SURFACE_CELL); j < Math.round((z1 + DEPTH / 2) / SURFACE_CELL); j++) {
      for (let i = Math.round((x0 + WIDTH / 2) / SURFACE_CELL); i < Math.round((x1 + WIDTH / 2) / SURFACE_CELL); i++) cells[j][i] = code;
    }
  }
  return { cols, rows: cells.map((row) => row.join("")) };
}

/** A round patch of scatter at a world position. */
function patch(kind: "leaves" | "grass" | "weeds", x: number, z: number, radius: number, seed: number): DioramaObject {
  return createDioramaObject("scatter", 0, BASE_TEMPLATES.plot, {
    position: [x, 0, z],
    rotation: [0, 0, 0],
    params: scatterPatchParams(kind, radius, seed),
  });
}

/** Fresh objects of the Back Street scene, with new ids on every call. */
export function getBackStreetObjects(): DioramaObject[] {
  const house = createDioramaObject("building", 0, BASE_TEMPLATES.plot, {
    position: [8.8, 0, -0.7],
    rotation: [0, 0, 0],
    params: BUILDING_PRESETS[1].params,
  });
  const half = Math.PI / 2;

  return [
    // Left of the lane: the shop-house on the corner, vending machines beside it, a garden behind a wall
    ...shopHouse(-1.3, -1.0),
    place("vendingMachine", -5.6, 1.3),
    place("vendingMachine", -4.6, 1.3),
    place("recycleBin", -6.5, 1.4),
    place("ginkgoTree", -9.2, -5.2, 0.4),
    place("zelkovaTree", -8.4, 0.2, 1.1),
    ...run("hedge", 1.2, [-5.6, -7.6], [-5.6, -2.8]),
    ...run("blockWall", 2, [-12, -7.925], [2, -7.925]),
    ...run("blockWall", 2, [-11.925, -8], [-11.925, 2]),
    patch("leaves", -9.2, -5.2, 2.3, 9101),
    patch("leaves", -8.2, 1.2, 1.6, 9102),
    patch("grass", -10.4, -3.2, 1.2, 9103),
    patch("weeds", -11.2, 0.6, 0.9, 9104),

    // Front sidewalk
    place("postBox", -10.6, 2.6),
    place("utilityPole", -9.0, 3.15),
    place("powerLine", -9.0, 3.15),
    place("pedestrian", -5.2, 2.5, Math.PI),
    place("bicycle", -2.6, 2.45),
    place("aFrameSign", 0.2, 2.6, -0.2),
    place("pottedPlant", -3.75, 1.95, 1.2),
    place("pottedPlant", -3.4, 1.9, 4.0, 0.8),
    ...run("guardRail", 2, [-4.5, 3.3], [1.5, 3.3]),
    place("curveMirror", 1.7, 3.2, Math.PI / 4),

    // Right of the lane: a house, its paved front, and a fenced parking lot behind it
    house,
    place("sign", 5.25, 2.3, Math.PI),
    place("pottedPlant", 7.6, 1.45, 0.7),
    place("pottedPlant", 9.9, 1.5, 2.6, 0.85),
    place("parkingBay", 8.0, -6.6, -half),
    place("parkingBay", 8.0, -4.2, -half),
    place("keiCar", 8.1, -6.6, half),
    ...run("fence", 2, [5.5, -7.9], [11.5, -7.9]),
    ...run("fence", 2, [11.9, -7.9], [11.9, -3.9]),
    patch("weeds", 11.2, -3.6, 0.7, 9105),

    // Roads: markings, a manhole, grates, and someone crossing
    place("crosswalk", CROSSWALK_X, 5.75, half, undefined, ROAD_Y),
    place("stopLine", 3.5, 2.6, 0, undefined, ROAD_Y),
    ...run("roadLine", 4, [-12, 7.5], [12, 7.5]).map((line) => ({ ...line, position: [line.position[0], ROAD_Y, line.position[2]] as [number, number, number] })),
    place("manhole", -1.0, 5.8, 0, undefined, ROAD_Y),
    place("gutterGrate", -2.0, 3.65, 0, undefined, ROAD_Y),
    place("gutterGrate", 8.0, 3.65, 0, undefined, ROAD_Y),
    place("pedestrian", -6.3, 5.2, 0, undefined, ROAD_Y),
  ];
}
