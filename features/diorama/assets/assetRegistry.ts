import type { ComponentType } from "react";
import {
  AirVent,
  Bike,
  Cable,
  CarFront,
  CircleDot,
  CupSoda,
  Gem,
  House as HouseIcon,
  PersonStanding,
  Signpost,
  Store,
  TreeDeciduous,
  TreePine,
  UtilityPole as UtilityPoleIcon,
  type LucideIcon,
} from "lucide-react";
import type { DioramaObjectType, Vector3Tuple } from "../types/diorama.types";
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
  tags: string[];
}

/** Geometry written as JSX, origin at the ground contact point. */
export interface ProceduralAsset extends AssetBase {
  component: ComponentType;
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

/** Every GLB in the registry, for preloading. */
export const MODEL_URLS: string[] = Object.values(ASSET_REGISTRY).flatMap((asset) =>
  "modelUrl" in asset ? [asset.modelUrl] : []
);

/** Registry entries grouped by category, optionally filtered by a label/tag search. */
export function getAssetsByCategory(query = ""): Array<{ category: AssetCategory; assets: AssetDefinition[] }> {
  const q = query.trim().toLowerCase();
  const matches = (asset: AssetDefinition) =>
    !q || asset.label.toLowerCase().includes(q) || asset.tags.some((tag) => tag.includes(q));

  return ASSET_CATEGORY_ORDER.map((category) => ({
    category,
    assets: Object.values(ASSET_REGISTRY).filter((a) => a.category === category && matches(a)),
  })).filter((group) => group.assets.length > 0);
}
