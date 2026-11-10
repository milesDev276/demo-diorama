import { BUILDING_PRESETS } from "../assets/buildingPresets";
import type { DioramaObject, SurfaceMap } from "../types/diorama.types";
import { BASE_TEMPLATES } from "./baseTemplates";
import { BUILDING_GRID } from "./buildingParams";
import { CORNER } from "./cornerLayout";
import { attach, createDioramaObject, place, run, runObject } from "./objectDefaults";
import { patch, surfaceFrom, type GroundRect } from "./plotStarter";

/**
 * The "Old Shopping Street" starter (plan/Stage-24-Implementation.md D3): a
 * 24 × 16 m plot with a 4.5 m street along the front and a 1.5 m sidewalk on
 * the shop side. From the left: the workshop, set back behind a concrete
 * apron with a kei truck before its half-raised shutter; the old shop with
 * its tobacco window; the narrow four-storey building with a water tank on
 * its roof; a vending machine at the mouth of a back alley; beyond the alley
 * a walled lot with a tree. X runs −12 … 12, Z −8 … 8 (front). All numbers
 * are meters.
 */
const WIDTH = 24;
const DEPTH = 16;
const ROAD_Y = CORNER.roadY;

const SIDEWALK_Z = 2; // building fronts; the sidewalk runs from here to the street
const STREET_Z = 3.5;
const ALLEY = { x0: 8, x1: 10.5 };
const WORKSHOP = { x: -7, z: -3.185 }; // its front at z 0, behind the apron
const SHUTTER_X = WORKSHOP.x - 1.49; // building_workshop_01: the shutter's middle
const NARROW = { x: 4.77, z: SIDEWALK_Z - (4 * BUILDING_GRID.bay) / 2 };

const GROUND: GroundRect[] = [
  ["concrete", -11.1, -2.9, 0, SIDEWALK_Z],
  ["grass", ALLEY.x1, 12, -8, SIDEWALK_Z],
  ["sidewalk", -12, 12, SIDEWALK_Z, STREET_Z],
  ["asphalt", -12, 12, STREET_Z, 8],
  ["asphalt", ALLEY.x0, ALLEY.x1, -8, STREET_Z],
  // The curb is dropped where the truck drives up to the shutter.
  ["ramp", SHUTTER_X - 2, SHUTTER_X + 2, STREET_Z - 0.5, STREET_Z],
];

export function getShoppingStreetSurface(): SurfaceMap {
  return surfaceFrom(WIDTH, DEPTH, GROUND);
}

/** On the street or the alley, whose surface is lower than the lots. */
function onRoad(object: DioramaObject): DioramaObject {
  return { ...object, position: [object.position[0], ROAD_Y, object.position[2]] };
}

/** The narrow building with a water tank and AC units on its roof and its open side. */
function narrowBuilding(): DioramaObject[] {
  const { bay, groundFloor, upperFloor } = BUILDING_GRID;
  const building = createDioramaObject("building", 0, BASE_TEMPLATES.plot, {
    position: [NARROW.x, 0, NARROW.z],
    rotation: [0, 0, 0],
    params: BUILDING_PRESETS.find((preset) => preset.id === "narrow-building-4f")!.params,
  });
  const side = bay; // half its width
  const roof = groundFloor + 3 * upperFloor;
  return [
    building,
    attach(building, "waterTank", [0.4, roof, -2.2]),
    attach(building, "airConditioner", [-0.9, roof, 2.6]),
    attach(building, "airConditioner", [side + 0.2, groundFloor + upperFloor + 0.15, -0.9], Math.PI / 2),
    attach(building, "airConditioner", [side + 0.2, groundFloor + 2 * upperFloor + 0.15, -0.9], Math.PI / 2),
    attach(building, "meterBox", [side, 1.25, -2.7], Math.PI / 2),
  ];
}

/** Fresh objects of the Old Shopping Street scene, with new ids on every call. */
export function getShoppingStreetObjects(): DioramaObject[] {
  const half = Math.PI / 2;

  return [
    // The workshop, a kei truck on its apron and a scooter by the office door; a cat on the pallets
    place("workshop", WORKSHOP.x, WORKSHOP.z),
    place("keiTruck", SHUTTER_X, 1.1, half),
    place("scooter", -4.3, 1.1, -half - 0.2),
    place("cat", -11.59, -1.5, 0.6, undefined, 0.42),
    patch("weeds", -11.5, -6.8, 0.6, 2401),

    // The old shop, its keeper and a plant on the sidewalk
    place("oldShop", 0, SIDEWALK_Z - 3.84),
    place("shopkeeper", -1.1, 2.75),
    place("pottedPlant", -2.4, 2.3, 0.8),
    place("pottedPlant", -2.05, 2.25, 2.4, 0.8),

    // The narrow building, bicycles and an A-frame sign before it, a vending machine at the alley
    ...narrowBuilding(),
    place("bicycle", 3.55, 2.65, half + 0.05),
    place("bicycle", 4.15, 2.7, half - 0.06),
    place("aFrameSign", 6.1, 2.75, -0.25),
    place("vendingMachine", 7.35, 2.45),
    place("postBox", 2.45, 3.15),

    // Beyond the alley: a walled lot with a tree and the garbage cage at its corner
    runObject("blockWall", [ALLEY.x1 + 0.075, -8], [ALLEY.x1 + 0.075, 1.2]),
    place("zelkovaTree", 11.2, -4.6, 0.7),
    place("garbageStation", 11.25, 1.45, -half),
    patch("grass", 11.3, -6.6, 0.8, 2402),
    patch("weeds", 11.4, -1.2, 0.5, 2403),

    // Poles along the sidewalk; one set of wires runs the plot's length through both
    place("utilityPole", -2.8, 3.2),
    place("powerLine", -2.8, 3.2),
    place("utilityPole", 11.1, 3.2),

    // The street and the alley
    onRoad(place("stopLine", (ALLEY.x0 + ALLEY.x1) / 2, STREET_Z - 0.9)),
    ...run("roadLine", 4, [-12, 7.6], [12, 7.6]).map(onRoad),
    onRoad(place("manhole", -4.2, 5.8)),
    onRoad(place("gutterGrate", -1.0, 3.65)),
    onRoad(place("gutterGrate", 5.2, 3.65)),
    patch("weeds", ALLEY.x0 + 0.25, -6.2, 0.45, 2404),
    onRoad(place("elder", -5.2, 5.6, -half)),
    onRoad(place("cyclist", 0.6, 6.7)),
    onRoad(place("walker", 6.4, 5.0, half)),
  ];
}
