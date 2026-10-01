import type { ComponentType } from "react";
import {
  AirVent,
  AlignJustify,
  Bike,
  Building2,
  Cable,
  CarFront,
  Circle,
  CircleDot,
  CupSoda,
  Cylinder,
  Gem,
  House as HouseIcon,
  PersonStanding,
  RectangleVertical,
  Shirt,
  Signpost,
  Sprout,
  Store,
  TreeDeciduous,
  TreePine,
  UtilityPole as UtilityPoleIcon,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import type { BuildingParams, DioramaObject, DioramaObjectType, Vector3Tuple } from "../types/diorama.types";
import { Building, type BuildingProps } from "../objects/building/Building";
import { BUILDING_MODULES } from "../objects/building/buildingLayout";
import { buildingSize } from "../utils/buildingParams";
import { BUILDING_PRESETS, DEFAULT_BUILDING_PARAMS } from "./buildingPresets";
import { House } from "../objects/House";
import { PowerLine } from "../objects/PowerLine";
import { Rock } from "../objects/Rock";
import { Shop } from "../objects/Shop";
import { Sign } from "../objects/Sign";
import { Tree } from "../objects/Tree";
import { UtilityPole } from "../objects/UtilityPole";

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
  tags: string[];
}

/** Geometry written as JSX, origin at the ground contact point. */
export interface ProceduralAsset extends AssetBase {
  /** Parametric assets (the building) read the object's params; the others take no props. */
  component: ComponentType<BuildingProps>;
  /** True if `component` is authored in the pre-meter unit (≈ 6 m) and must be
   *  rendered scaled by LEGACY_UNIT_SCALE. */
  legacyUnits: boolean;
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
    component: Building,
    legacyUnits: false,
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
    component: House,
    legacyUnits: true,
    defaultScale: [1, 1, 1],
    footprintRadius: 5.1,
    randomSpawnRotation: false,
    tags: ["home", "residential", "building"],
  },
  shop: {
    type: "shop",
    label: "Small Shop",
    category: "Buildings",
    icon: Store,
    component: Shop,
    legacyUnits: true,
    defaultScale: [1, 1, 1],
    footprintRadius: 5.1,
    randomSpawnRotation: false,
    tags: ["store", "shop", "commercial", "building"],
  },
  utilityPole: {
    type: "utilityPole",
    label: "Utility Pole",
    category: "Infrastructure",
    icon: UtilityPoleIcon,
    component: UtilityPole,
    legacyUnits: true,
    defaultScale: [1, 1, 1],
    footprintRadius: 1.2,
    randomSpawnRotation: false,
    tags: ["pole", "electric", "transformer", "denchu"],
  },
  powerLine: {
    type: "powerLine",
    label: "Power Line",
    category: "Infrastructure",
    icon: Cable,
    component: PowerLine,
    legacyUnits: true,
    defaultScale: [1, 1, 1],
    footprintRadius: 1.2,
    randomSpawnRotation: false,
    tags: ["wire", "cable", "electric", "overhead"],
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
    component: Sign,
    legacyUnits: true,
    defaultScale: [1, 1, 1],
    footprintRadius: 0.9,
    randomSpawnRotation: false,
    tags: ["road sign", "stop", "tomare", "traffic"],
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
  tree: {
    type: "tree",
    label: "Tree",
    category: "Nature",
    icon: TreePine,
    component: Tree,
    legacyUnits: true,
    defaultScale: [1, 1, 1],
    footprintRadius: 3,
    randomSpawnRotation: true,
    tags: ["plant", "green", "garden"],
  },
  rock: {
    type: "rock",
    label: "Garden Stone",
    category: "Nature",
    icon: Gem,
    component: Rock,
    legacyUnits: true,
    defaultScale: [0.9, 0.9, 0.9],
    footprintRadius: 2.7,
    randomSpawnRotation: true,
    tags: ["rock", "stone", "garden"],
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
    tags: ["tree", "ginkgo", "icho", "autumn", "street tree"],
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
};

/** Every GLB the registry can show (assets and building modules), for preloading. */
export const MODEL_URLS: string[] = [
  ...Object.values(ASSET_REGISTRY).flatMap((asset) => ("modelUrl" in asset ? [asset.modelUrl] : [])),
  ...Object.values(BUILDING_MODULES),
];

/** Radius of the selection ring under an object. A building's follows its footprint. */
export function getFootprintRadius(object: Pick<DioramaObject, "type" | "params">): number {
  if (object.type !== "building") return ASSET_REGISTRY[object.type].footprintRadius;
  const { width, depth } = buildingSize(object.params ?? DEFAULT_BUILDING_PARAMS);
  return Math.hypot(width, depth) / 2 + 0.4;
}

/** One entry of the asset browser: an asset, or a preset of a parametric one. */
export interface LibraryItem {
  key: string;
  label: string;
  icon: LucideIcon;
  type: DioramaObjectType;
  params?: BuildingParams;
  tags: string[];
}

/** The building is offered as its presets; every other asset as itself. */
function libraryItems(asset: AssetDefinition): LibraryItem[] {
  if (asset.type !== "building") {
    return [{ key: asset.type, label: asset.label, icon: asset.icon, type: asset.type, tags: asset.tags }];
  }
  return BUILDING_PRESETS.map((preset) => ({
    key: `building:${preset.id}`,
    label: preset.label,
    icon: asset.icon,
    type: asset.type,
    params: preset.params,
    tags: [...asset.tags, ...preset.tags],
  }));
}

/** Asset browser entries grouped by category, optionally filtered by a label/tag search. */
export function getLibraryItems(query = ""): Array<{ category: AssetCategory; items: LibraryItem[] }> {
  const q = query.trim().toLowerCase();
  const matches = (item: LibraryItem) =>
    !q || item.label.toLowerCase().includes(q) || item.tags.some((tag) => tag.includes(q));

  return ASSET_CATEGORY_ORDER.map((category) => ({
    category,
    items: Object.values(ASSET_REGISTRY)
      .filter((asset) => asset.category === category)
      .flatMap(libraryItems)
      .filter(matches),
  })).filter((group) => group.items.length > 0);
}
