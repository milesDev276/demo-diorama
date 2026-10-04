import type { ComponentType } from "react";
import {
  AirVent,
  AlignJustify,
  Armchair,
  Backpack,
  Bike,
  BrickWall,
  Building2,
  BusFront,
  Cable,
  CarFront,
  ChefHat,
  Circle,
  CircleDot,
  CupSoda,
  Cylinder,
  Fence,
  Footprints,
  Gauge,
  Gem,
  Grid3x3,
  House as HouseIcon,
  LampCeiling,
  Mailbox,
  Minus,
  Motorbike,
  OctagonX,
  Package,
  PersonStanding,
  Presentation,
  RectangleVertical,
  Recycle,
  Server,
  Shirt,
  ShoppingBasket,
  Shrub,
  Signpost,
  Sofa,
  Sparkles,
  Sprout,
  SquareParking,
  Store,
  TrafficCone,
  Trash2,
  TreeDeciduous,
  TreePine,
  Truck,
  UtilityPole as UtilityPoleIcon,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { SCATTER_KINDS } from "../types/diorama.types";
import type {
  AssetComponentProps,
  DioramaObject,
  DioramaObjectType,
  Kit,
  ObjectParams,
  ScatterKind,
  Vector3Tuple,
} from "../types/diorama.types";
import { BuildingAsset } from "../objects/building/Building";
import { BUILDING_MODULES } from "../objects/building/buildingLayout";
import { ScatterLayer } from "../objects/scatter/ScatterLayer";
import { buildingSize } from "../utils/buildingParams";
import { buildingParamsOf, scatterParamsOf } from "../utils/objectParams";
import { scatterRadius } from "../utils/scatterParams";
import { BUILDING_PRESETS, DEFAULT_BUILDING_PARAMS } from "./buildingPresets";
import { SCATTER_KIND_SPECS } from "./scatterKinds";
import thumbnailKeys from "./thumbnails.json";
import { PowerLine } from "../objects/PowerLine";
import { RoadMarking } from "../objects/RoadMarking";

export type AssetCategory = "Buildings" | "Street" | "Infrastructure" | "Props" | "Nature" | "Vehicles" | "People";

/** Display order of categories in the asset browser (empty ones are hidden). */
export const ASSET_CATEGORY_ORDER: AssetCategory[] = [
  "Buildings",
  "Street",
  "Infrastructure",
  "Props",
  "Nature",
  "Vehicles",
  "People",
];

/** A shadowless point light in the asset's own frame (meters). */
export interface GlowLight {
  position: Vector3Tuple;
  color: string;
  /** Candela, before the time of day's `glow` factor. */
  intensity: number;
  /** Reach in meters. */
  distance: number;
}

/** The warm light of a shop, also used for the lights a building gives its shopfronts. */
export const SHOP_GLOW = { color: "#ffd9a0", intensity: 8, distance: 6.5 } as const;

interface AssetBase {
  type: DioramaObjectType;
  label: string;
  category: AssetCategory;
  icon: LucideIcon;
  defaultScale: Vector3Tuple;
  /** Radius of the selection ring drawn under the object, in meters. */
  footprintRadius: number;
  /** Natural things spawn at a random heading; street-built things spawn facing the road (+Z). */
  randomSpawnRotation: boolean;
  /** Set if the asset can hang on a wall: `offset` is how far its origin
   *  stands off the wall, `only` means it cannot stand on a flat surface. */
  wallMount?: { offset: number; only?: boolean };
  /** Length in meters of one piece along its X axis, if pieces placed end to
   *  end make one run (a wall, a line): a drag while placing lays a row of them. */
  tile?: number;
  /** How a road marking lines up with the road it is placed on (a plot's
   *  asphalt): which of its own axes lies along the road, and whether it is
   *  centered across the road. */
  road?: { along: "x" | "z"; center?: boolean };
  /** The light this asset gives off after dark (components/SceneGlowLights.tsx). */
  glow?: GlowLight;
  /** Natural things whose repeats should not look stamped: duplicates and
   *  Shift+click placements get a random heading and a size within ± this fraction. */
  jitter?: number;
  tags: string[];
}

/** Geometry written as JSX, in meters, origin at the ground contact point. */
export interface ProceduralAsset extends AssetBase {
  /** Parametric assets (building, scatter) read the object's params; the others ignore their props. */
  component: ComponentType<AssetComponentProps>;
}

/** A GLB built by art/blender/build.py: meters, origin at the ground contact
 *  point, front toward +Z, material slots remapped by objects/materials.ts. */
export interface ModelAsset extends AssetBase {
  modelUrl: string;
}

/** "What is this object?" — metadata shared by every placed instance of a type. */
export type AssetDefinition = ProceduralAsset | ModelAsset;

/**
 * Single source of asset metadata. Adding a type = extend
 * `DIORAMA_OBJECT_TYPES`, build its GLB (art/blender) or write its
 * component, add one entry here.
 */
export const ASSET_REGISTRY: Record<DioramaObjectType, AssetDefinition> = {
  building: {
    type: "building",
    label: "Building",
    category: "Buildings",
    icon: Building2,
    component: BuildingAsset,
    defaultScale: [1, 1, 1],
    footprintRadius: 4.2,
    randomSpawnRotation: false,
    tags: ["building", "modular"],
  },
  house: {
    type: "house",
    label: "House",
    category: "Buildings",
    icon: HouseIcon,
    modelUrl: "/models/buildings/building_house_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 4.6,
    randomSpawnRotation: false,
    tags: ["home", "residential", "building"],
  },
  shop: {
    type: "shop",
    label: "Small Shop",
    category: "Buildings",
    icon: Store,
    modelUrl: "/models/buildings/building_shop_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 4,
    randomSpawnRotation: false,
    glow: { ...SHOP_GLOW, position: [0, 1.9, 3.2] },
    tags: ["store", "shop", "commercial", "building"],
  },
  konbini: {
    type: "konbini",
    label: "Convenience Store",
    category: "Buildings",
    icon: ShoppingBasket,
    modelUrl: "/models/buildings/building_konbini_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 6.2,
    randomSpawnRotation: false,
    glow: { position: [0, 2.1, 4.6], color: "#ffe9c4", intensity: 12, distance: 8 },
    tags: ["konbini", "convenience store", "store", "shop", "commercial", "building"],
  },
  utilityPole: {
    type: "utilityPole",
    label: "Utility Pole",
    category: "Infrastructure",
    icon: UtilityPoleIcon,
    modelUrl: "/models/infrastructure/infra_utility_pole_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 0.6,
    randomSpawnRotation: false,
    tags: ["pole", "electric", "transformer", "denchu"],
  },
  powerLine: {
    type: "powerLine",
    label: "Power Line",
    category: "Infrastructure",
    icon: Cable,
    component: PowerLine,
    defaultScale: [1, 1, 1],
    footprintRadius: 0.9,
    randomSpawnRotation: false,
    tags: ["wire", "cable", "electric", "overhead"],
  },
  streetLight: {
    type: "streetLight",
    label: "Street Light",
    category: "Infrastructure",
    icon: LampCeiling,
    modelUrl: "/models/infrastructure/infra_street_light_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 0.5,
    randomSpawnRotation: false,
    glow: { position: [0, 4.6, 1.15], color: "#fff1d8", intensity: 26, distance: 11 },
    tags: ["light", "lamp", "street light", "gairoto", "night", "pole"],
  },
  utilityBox: {
    type: "utilityBox",
    label: "Utility Cabinet",
    category: "Infrastructure",
    icon: Server,
    modelUrl: "/models/infrastructure/infra_utility_box_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 0.7,
    randomSpawnRotation: false,
    tags: ["cabinet", "utility box", "transformer", "electric", "chijo kiki", "sidewalk"],
  },
  vendingMachine: {
    type: "vendingMachine",
    label: "Vending Machine",
    category: "Props",
    icon: CupSoda,
    modelUrl: "/models/props/prop_vending_machine_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 0.8,
    randomSpawnRotation: false,
    glow: { position: [0, 1.15, 0.6], color: "#f1f5ff", intensity: 2.4, distance: 5 },
    tags: ["drink", "jihanki", "machine"],
  },
  airConditioner: {
    type: "airConditioner",
    label: "AC Unit",
    category: "Props",
    icon: AirVent,
    modelUrl: "/models/props/prop_ac_unit_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 0.55,
    randomSpawnRotation: false,
    wallMount: { offset: 0.2 },
    tags: ["air conditioner", "outdoor unit", "shitsugaiki", "aircon"],
  },
  sign: {
    type: "sign",
    label: "Stop Sign",
    category: "Street",
    icon: Signpost,
    modelUrl: "/models/street/street_sign_stop_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 0.5,
    randomSpawnRotation: false,
    tags: ["road sign", "stop", "tomare", "traffic"],
  },
  busStop: {
    type: "busStop",
    label: "Bus Stop",
    category: "Street",
    icon: BusFront,
    modelUrl: "/models/street/street_bus_stop_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 0.45,
    randomSpawnRotation: false,
    tags: ["bus", "bus stop", "basutei", "sign", "timetable"],
  },
  curveMirror: {
    type: "curveMirror",
    label: "Curve Mirror",
    category: "Street",
    icon: CircleDot,
    modelUrl: "/models/street/street_curve_mirror_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 0.5,
    randomSpawnRotation: false,
    tags: ["mirror", "curve mirror", "kabu mira", "junction", "traffic"],
  },
  manhole: {
    type: "manhole",
    label: "Manhole",
    category: "Street",
    icon: Circle,
    modelUrl: "/models/street/street_manhole_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 0.4,
    randomSpawnRotation: false,
    tags: ["manhole", "cover", "road", "sewer"],
  },
  blockWall: {
    type: "blockWall",
    label: "Block Wall",
    category: "Street",
    icon: BrickWall,
    modelUrl: "/models/street/street_block_wall_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 1.1,
    randomSpawnRotation: false,
    tile: 2,
    tags: ["wall", "block", "burokku-bei", "concrete", "boundary", "fence"],
  },
  gutterGrate: {
    type: "gutterGrate",
    label: "Gutter Grate",
    category: "Street",
    icon: AlignJustify,
    modelUrl: "/models/street/street_gutter_grate_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 0.6,
    randomSpawnRotation: false,
    tags: ["grate", "gutter", "sokko", "drain", "road"],
  },
  crosswalk: {
    type: "crosswalk",
    label: "Crosswalk",
    category: "Street",
    icon: Footprints,
    component: RoadMarking,
    defaultScale: [1, 1, 1],
    footprintRadius: 2.2,
    randomSpawnRotation: false,
    road: { along: "z", center: true },
    tags: ["crosswalk", "zebra", "odan-hodo", "road", "marking", "paint"],
  },
  stopLine: {
    type: "stopLine",
    label: "Stop Line",
    category: "Street",
    icon: OctagonX,
    component: RoadMarking,
    defaultScale: [1, 1, 1],
    footprintRadius: 1.6,
    randomSpawnRotation: false,
    road: { along: "z" },
    tags: ["stop", "tomare", "line", "road", "marking", "paint"],
  },
  roadLine: {
    type: "roadLine",
    label: "Road Line",
    category: "Street",
    icon: Minus,
    component: RoadMarking,
    defaultScale: [1, 1, 1],
    footprintRadius: 2.1,
    randomSpawnRotation: false,
    tile: 4,
    road: { along: "x" },
    tags: ["line", "edge line", "white line", "road", "marking", "paint"],
  },
  parkingBay: {
    type: "parkingBay",
    label: "Parking Bay",
    category: "Street",
    icon: SquareParking,
    component: RoadMarking,
    defaultScale: [1, 1, 1],
    footprintRadius: 2.8,
    randomSpawnRotation: false,
    tile: 2.4,
    tags: ["parking", "bay", "chushajo", "lot", "line", "marking", "paint"],
  },
  guardRail: {
    type: "guardRail",
    label: "Guard Rail",
    category: "Street",
    icon: Fence,
    modelUrl: "/models/street/street_guard_rail_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 1.1,
    randomSpawnRotation: false,
    tile: 2,
    tags: ["guard rail", "gado reru", "barrier", "road", "boundary"],
  },
  fence: {
    type: "fence",
    label: "Mesh Fence",
    category: "Street",
    icon: Grid3x3,
    modelUrl: "/models/street/street_fence_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 1.1,
    randomSpawnRotation: false,
    tile: 2,
    tags: ["fence", "mesh", "netto fensu", "wire", "boundary", "parking"],
  },
  kanbanSign: {
    type: "kanbanSign",
    label: "Shop Sign",
    category: "Props",
    icon: RectangleVertical,
    modelUrl: "/models/props/prop_sign_kanban_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 0.45,
    randomSpawnRotation: false,
    wallMount: { offset: 0, only: true },
    tags: ["sign", "kanban", "shop", "sakaya", "wall"],
  },
  laundry: {
    type: "laundry",
    label: "Laundry",
    category: "Props",
    icon: Shirt,
    modelUrl: "/models/props/prop_laundry_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 1.0,
    randomSpawnRotation: false,
    tags: ["laundry", "clothes", "balcony", "monohoshi"],
  },
  pottedPlant: {
    type: "pottedPlant",
    label: "Potted Plant",
    category: "Props",
    icon: Sprout,
    modelUrl: "/models/props/prop_potted_plant_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 0.3,
    randomSpawnRotation: true,
    jitter: 0.12,
    tags: ["plant", "pot", "hachiue", "green"],
  },
  waterTank: {
    type: "waterTank",
    label: "Water Tank",
    category: "Props",
    icon: Cylinder,
    modelUrl: "/models/props/prop_water_tank_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 0.85,
    randomSpawnRotation: false,
    tags: ["tank", "water", "rooftop"],
  },
  rooftopShed: {
    type: "rooftopShed",
    label: "Storage Shed",
    category: "Props",
    icon: Warehouse,
    modelUrl: "/models/props/prop_rooftop_shed_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 1.6,
    randomSpawnRotation: false,
    tags: ["shed", "storage", "prefab", "monooki", "rooftop"],
  },
  postBox: {
    type: "postBox",
    label: "Post Box",
    category: "Props",
    icon: Mailbox,
    modelUrl: "/models/props/prop_post_box_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 0.4,
    randomSpawnRotation: false,
    tags: ["post", "mail", "mailbox", "posuto", "letter"],
  },
  meterBox: {
    type: "meterBox",
    label: "Electric Meter",
    category: "Props",
    icon: Gauge,
    modelUrl: "/models/props/prop_meter_box_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 0.3,
    randomSpawnRotation: false,
    wallMount: { offset: 0, only: true },
    tags: ["meter", "electric", "box", "wall", "denryoku"],
  },
  recycleBin: {
    type: "recycleBin",
    label: "Recycling Bin",
    category: "Props",
    icon: Recycle,
    modelUrl: "/models/props/prop_recycle_bin_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 0.4,
    randomSpawnRotation: false,
    tags: ["recycle", "bin", "cans", "bottles", "trash", "vending"],
  },
  aFrameSign: {
    type: "aFrameSign",
    label: "A-frame Sign",
    category: "Props",
    icon: Presentation,
    modelUrl: "/models/props/prop_a_frame_sign_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 0.4,
    randomSpawnRotation: false,
    tags: ["sign", "a-frame", "tatekanban", "menu", "shop", "board"],
  },
  chair: {
    type: "chair",
    label: "Plastic Chair",
    category: "Props",
    icon: Armchair,
    modelUrl: "/models/props/prop_chair_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 0.4,
    randomSpawnRotation: false,
    tags: ["chair", "seat", "plastic", "rooftop"],
  },
  bench: {
    type: "bench",
    label: "Bench",
    category: "Props",
    icon: Sofa,
    modelUrl: "/models/props/prop_bench_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 0.9,
    randomSpawnRotation: false,
    tags: ["bench", "seat", "benchi", "bus stop", "shop"],
  },
  trafficCone: {
    type: "trafficCone",
    label: "Traffic Cone",
    category: "Props",
    icon: TrafficCone,
    modelUrl: "/models/props/prop_traffic_cone_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 0.32,
    randomSpawnRotation: false,
    tags: ["cone", "traffic cone", "kara kon", "road works", "parking"],
  },
  garbageStation: {
    type: "garbageStation",
    label: "Garbage Cage",
    category: "Props",
    icon: Trash2,
    modelUrl: "/models/props/prop_garbage_station_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 0.8,
    randomSpawnRotation: false,
    tags: ["garbage", "trash", "gomi", "collection", "cage", "bags"],
  },
  scatter: {
    type: "scatter",
    label: "Scatter",
    category: "Nature",
    icon: Sparkles,
    component: ScatterLayer,
    defaultScale: [1, 1, 1],
    footprintRadius: 1,
    randomSpawnRotation: false,
    tags: ["scatter", "brush"],
  },
  tree: {
    type: "tree",
    label: "Garden Tree",
    category: "Nature",
    icon: TreePine,
    modelUrl: "/models/nature/nature_tree_garden_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 1.8,
    randomSpawnRotation: true,
    jitter: 0.12,
    tags: ["tree", "evergreen", "niwaki", "plant", "green", "garden"],
  },
  rock: {
    type: "rock",
    label: "Garden Stone",
    category: "Nature",
    icon: Gem,
    modelUrl: "/models/nature/nature_rock_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 0.9,
    randomSpawnRotation: true,
    jitter: 0.12,
    tags: ["rock", "stone", "niwaishi", "garden"],
  },
  bicycle: {
    type: "bicycle",
    label: "Bicycle",
    category: "Props",
    icon: Bike,
    modelUrl: "/models/props/prop_bicycle_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 1.0,
    randomSpawnRotation: false,
    tags: ["bicycle", "bike", "mamachari", "vehicle", "parked"],
  },
  ginkgoTree: {
    type: "ginkgoTree",
    label: "Ginkgo Tree",
    category: "Nature",
    icon: TreeDeciduous,
    modelUrl: "/models/nature/nature_tree_ginkgo_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 2.6,
    randomSpawnRotation: true,
    jitter: 0.12,
    tags: ["tree", "ginkgo", "icho", "autumn", "street tree"],
  },
  zelkovaTree: {
    type: "zelkovaTree",
    label: "Zelkova Tree",
    category: "Nature",
    icon: TreeDeciduous,
    modelUrl: "/models/nature/nature_tree_zelkova_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 3,
    randomSpawnRotation: true,
    jitter: 0.12,
    tags: ["tree", "zelkova", "keyaki", "autumn", "street tree"],
  },
  hedge: {
    type: "hedge",
    label: "Hedge",
    category: "Nature",
    icon: Shrub,
    modelUrl: "/models/nature/nature_hedge_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 0.75,
    randomSpawnRotation: false,
    tile: 1.2,
    tags: ["hedge", "ikegaki", "bush", "green", "boundary"],
  },
  keiCar: {
    type: "keiCar",
    label: "Kei Car",
    category: "Vehicles",
    icon: CarFront,
    modelUrl: "/models/vehicles/vehicle_kei_car_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 1.9,
    randomSpawnRotation: false,
    tags: ["car", "kei", "vehicle", "parked"],
  },
  keiTruck: {
    type: "keiTruck",
    label: "Kei Truck",
    category: "Vehicles",
    icon: Truck,
    modelUrl: "/models/vehicles/vehicle_kei_truck_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 1.9,
    randomSpawnRotation: false,
    tags: ["truck", "kei", "keitora", "pickup", "vehicle", "parked"],
  },
  scooter: {
    type: "scooter",
    label: "Scooter",
    category: "Vehicles",
    icon: Motorbike,
    modelUrl: "/models/vehicles/vehicle_scooter_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 1.0,
    randomSpawnRotation: false,
    tags: ["scooter", "moped", "gentsuki", "delivery", "vehicle", "parked"],
  },
  pedestrian: {
    type: "pedestrian",
    label: "Pedestrian",
    category: "People",
    icon: PersonStanding,
    modelUrl: "/models/people/people_pedestrian_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 0.45,
    randomSpawnRotation: false,
    tags: ["person", "people", "figure", "walker"],
  },
  shopkeeper: {
    type: "shopkeeper",
    label: "Shopkeeper",
    category: "People",
    icon: ChefHat,
    modelUrl: "/models/people/people_shopkeeper_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 0.45,
    randomSpawnRotation: false,
    tags: ["person", "people", "figure", "shopkeeper", "apron", "staff"],
  },
  student: {
    type: "student",
    label: "Schoolchild",
    category: "People",
    icon: Backpack,
    modelUrl: "/models/people/people_student_01.glb",
    defaultScale: [1, 1, 1],
    footprintRadius: 0.4,
    randomSpawnRotation: false,
    tags: ["person", "people", "figure", "child", "student", "school", "randoseru"],
  },
};

/** Every GLB the registry can show (assets, building modules, scatter pieces), for preloading. */
export const MODEL_URLS: string[] = [
  ...Object.values(ASSET_REGISTRY).flatMap((asset) => ("modelUrl" in asset ? [asset.modelUrl] : [])),
  ...Object.values(BUILDING_MODULES),
  ...Object.values(SCATTER_KIND_SPECS).map((spec) => spec.modelUrl),
];

/** Radius of the selection ring under an object. A building's follows its footprint, a scatter layer's its pieces. */
export function getFootprintRadius(object: Pick<DioramaObject, "type" | "params">): number {
  if (object.type === "building") {
    const { width, depth } = buildingSize(buildingParamsOf(object) ?? DEFAULT_BUILDING_PARAMS);
    return Math.hypot(width, depth) / 2 + 0.4;
  }
  if (object.type === "scatter") return Math.max(0.5, scatterRadius(scatterParamsOf(object)?.points ?? []) + 0.3);
  return ASSET_REGISTRY[object.type].footprintRadius;
}

/** What the scene list and the inspector call an object: a scatter layer is named after its kind. */
export function objectLabel(object: Pick<DioramaObject, "type" | "params">): string {
  const scatter = scatterParamsOf(object);
  return scatter ? SCATTER_KIND_SPECS[scatter.kind].label : ASSET_REGISTRY[object.type].label;
}

export function objectIcon(object: Pick<DioramaObject, "type" | "params">): LucideIcon {
  const scatter = scatterParamsOf(object);
  return scatter ? SCATTER_KIND_SPECS[scatter.kind].icon : ASSET_REGISTRY[object.type].icon;
}

const THUMBNAILS: ReadonlySet<string> = new Set(thumbnailKeys as string[]);

/** File name of a library item's thumbnail (scripts/capture-thumbnails.mjs writes them). */
export function thumbnailFileName(key: string): string {
  return `${key.replace(/[^a-zA-Z0-9-]+/g, "--")}.webp`;
}

/** The item's thumbnail, if one was rendered for it. */
function thumbnailFor(key: string): string | undefined {
  return THUMBNAILS.has(key) ? `/thumbnails/${thumbnailFileName(key)}` : undefined;
}

interface LibraryItemBase {
  key: string;
  label: string;
  icon: LucideIcon;
  tags: string[];
  thumbnail?: string;
}

/** One entry of the asset browser: something to place, a scatter brush, or a kit. */
export type LibraryItem = LibraryItemBase &
  (
    | { action: "place"; type: DioramaObjectType; params?: ObjectParams }
    | { action: "brush"; kind: ScatterKind }
    | { action: "kit"; kit: Kit }
  );

/** The building is offered as its presets, scatter as its kinds; every other asset as itself. */
function libraryItems(asset: AssetDefinition): LibraryItem[] {
  if (asset.type === "building") {
    return BUILDING_PRESETS.map((preset) => {
      const key = `building:${preset.id}`;
      return {
        key,
        action: "place" as const,
        label: preset.label,
        icon: asset.icon,
        type: asset.type,
        params: preset.params,
        tags: [...asset.tags, ...preset.tags],
        thumbnail: thumbnailFor(key),
      };
    });
  }
  if (asset.type === "scatter") {
    return SCATTER_KINDS.map((kind) => {
      const spec = SCATTER_KIND_SPECS[kind];
      const key = `scatter:${kind}`;
      return { key, action: "brush" as const, kind, label: spec.label, icon: spec.icon, tags: spec.tags, thumbnail: thumbnailFor(key) };
    });
  }
  return [
    {
      key: asset.type,
      action: "place",
      label: asset.label,
      icon: asset.icon,
      type: asset.type,
      tags: asset.tags,
      thumbnail: thumbnailFor(asset.type),
    },
  ];
}

/** The library entry of a kit. Only built-in kits have thumbnails. */
export function kitLibraryItem(kit: Kit): LibraryItem {
  const key = `kit:${kit.id}`;
  return {
    key,
    action: "kit",
    kit,
    label: kit.name,
    icon: Package,
    tags: ["kit", ...kit.name.toLowerCase().split(/\s+/)],
    thumbnail: kit.builtIn ? thumbnailFor(key) : undefined,
  };
}

/** Every asset-browser entry, ungrouped: what the thumbnail script renders. */
export function getAllLibraryItems(kits: Kit[]): LibraryItem[] {
  return [...ASSET_CATEGORY_ORDER.flatMap((category) => assetsIn(category).flatMap(libraryItems)), ...kits.map(kitLibraryItem)];
}

function assetsIn(category: AssetCategory): AssetDefinition[] {
  return Object.values(ASSET_REGISTRY).filter((asset) => asset.category === category);
}

/**
 * Asset browser entries grouped by category, then the kits, optionally
 * filtered by a label/tag search. Empty groups are left out.
 */
export function getLibraryItems(query: string, kits: Kit[]): Array<{ title: string; items: LibraryItem[] }> {
  const q = query.trim().toLowerCase();
  const matches = (item: LibraryItem) =>
    !q || item.label.toLowerCase().includes(q) || item.tags.some((tag) => tag.includes(q));

  const groups = ASSET_CATEGORY_ORDER.map((category) => ({
    title: category as string,
    items: assetsIn(category).flatMap(libraryItems).filter(matches),
  }));
  groups.push({ title: "Kits", items: kits.map(kitLibraryItem).filter(matches) });
  return groups.filter((group) => group.items.length > 0);
}
