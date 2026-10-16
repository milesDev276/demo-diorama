import type { DioramaObject, SurfaceMap } from "../types/diorama.types";
import { CORNER } from "./cornerLayout";
import { place, run, runObject } from "./objectDefaults";
import { patch, surfaceFrom, type GroundRect } from "./plotStarter";

/**
 * The "Residential Lane" starter (plan/Stage-15-Implementation.md D4): a
 * 24 × 16 m plot with a narrow lane along the front — no sidewalk, white
 * edge lines — and an alley meeting it. Left of the alley a one-storey
 * traditional house behind a block wall with a gate; right of it a
 * two-storey apartment whose corridor faces the lane and whose stair is on
 * the right (both toward the isometric camera), bicycles and the garbage
 * cage on its front strip and a kei car parked behind it. X runs −12 … 12,
 * Z −8 … 8 (front). All numbers are meters.
 */
const WIDTH = 24;
const DEPTH = 16;
const ROAD_Y = CORNER.roadY;

const LANE_Z = 4.5; // the lane runs from here to the front edge
const ALLEY = { x0: -1, x1: 2 };
const WALL_Z = 4.25; // the house's boundary wall along the lane
const GATE_X = -2.925;

const GROUND: GroundRect[] = [
  ["grass", -12, -7, -8, -5],
  ["grass", 11, 12, -8, -1],
  ["concrete", ALLEY.x1, 12, 2.5, LANE_Z],
  ["concrete", ALLEY.x1, 10.5, -8, -5],
  // Stepping tiles from the gate toward the entrance
  ["tile", GATE_X - 0.5, GATE_X + 0.5, 3, LANE_Z],
  ["asphalt", -12, 12, LANE_Z, 8],
  ["asphalt", ALLEY.x0, ALLEY.x1, -8, LANE_Z],
  // Curb drops: the gate, the apartment's front strip, and the driveway from the alley to the parking behind it
  ["ramp", GATE_X - 0.5, GATE_X + 0.5, LANE_Z - 0.5, LANE_Z],
  ["ramp", 4, 9, LANE_Z - 0.5, LANE_Z],
  ["ramp", ALLEY.x1, ALLEY.x1 + 0.5, -7.5, -5],
];

export function getResidentialSurface(): SurfaceMap {
  return surfaceFrom(WIDTH, DEPTH, GROUND);
}

/** On the lane or the alley, whose surface is lower than the lots. */
function onRoad(object: DioramaObject): DioramaObject {
  return { ...object, position: [object.position[0], ROAD_Y, object.position[2]] };
}

/** Fresh objects of the Residential Lane scene, with new ids on every call. */
export function getResidentialObjects(): DioramaObject[] {
  const half = Math.PI / 2;

  return [
    // Left of the alley: the traditional house in its walled lot
    place("traditionalHouse", -6.5, -0.8),
    runObject("blockWall", [-12, WALL_Z], [-4, WALL_Z]),
    place("gatePost", GATE_X - 0.85, WALL_Z),
    place("gatePost", GATE_X + 0.85, WALL_Z),
    runObject("blockWall", [-11.925, -7.825], [-11.925, 4.175]),
    runObject("blockWall", [-12, -7.925], [-2, -7.925]),
    runObject("hedge", [-1.2, -7.85], [-1.2, 2.95]),
    place("pottedPlant", -4.45, 3.9, 0.6),
    place("pottedPlant", -1.5, 3.95, 2.2, 0.85),
    place("tree", -10.4, -6.3, 0.8),
    place("rock", -8.6, -6.5, 0.7, 0.8),
    place("rock", -7.8, -7.0, 2.1, 0.6),
    place("airConditioner", -4.5, -4.19, Math.PI),
    place("propaneTanks", -1.73, -2.8, half),
    patch("grass", -9.4, -6.4, 1.6, 1501),
    patch("weeds", -9.0, 3.9, 0.6, 1502),
    patch("weeds", -1.6, -7.3, 0.5, 1503),

    // Right of the alley: the apartment, its corridor toward the lane and its stair on the right
    place("apartment", 7.0, -0.48),
    place("bicycle", 3.3, 3.45, half + 0.05),
    place("bicycle", 3.95, 3.55, half - 0.04),
    place("bicycle", 4.6, 3.4, half + 0.1),
    place("garbageStation", 9.4, 3.85),
    place("sign", 2.3, 3.9, Math.PI),
    place("pottedPlant", 2.75, 2.9, 1.4),
    place("pottedPlant", 5.75, 2.95, 3.0, 0.85),
    place("keiCar", 6.4, -6.3, half),
    runObject("fence", [11.925, -8], [11.925, 2]),
    runObject("fence", [4, -7.925], [12, -7.925]),
    patch("weeds", 11.4, -6.4, 0.6, 1504),
    patch("grass", 11.4, -2.8, 0.7, 1505),
    patch("weeds", 11.6, 3.0, 0.4, 1506),

    // The lane and the alley
    onRoad(place("utilityPole", -6.8, 4.8)),
    onRoad(place("powerLine", -6.8, 4.8)),
    onRoad(place("streetLight", 9.6, 4.8)),
    onRoad(place("curveMirror", 0.5, 7.7, Math.PI)),
    onRoad(place("stopLine", (ALLEY.x0 + ALLEY.x1) / 2, LANE_Z - 0.9)),
    ...run("roadLine", 4, [-12, 7.6], [12, 7.6]).map(onRoad),
    ...run("roadLine", 4, [-9, 5.15], [-1, 5.15]).map(onRoad),
    ...run("roadLine", 4, [2, 5.15], [10, 5.15]).map(onRoad),
    onRoad(place("manhole", 6.0, 6.4)),
    onRoad(place("gutterGrate", -9.5, 4.65)),
    onRoad(place("gutterGrate", 5.0, 4.65)),
    onRoad(place("student", -1.6, 6.2, half)),
    onRoad(place("pedestrian", 7.8, 6.9, -half)),
  ];
}
