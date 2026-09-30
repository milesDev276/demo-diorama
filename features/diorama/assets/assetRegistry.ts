import type { ComponentType } from "react";
import {
  Cable,
  CupSoda,
  Gem,
  House as HouseIcon,
  Signpost,
  Store,
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
import { VendingMachine } from "../objects/VendingMachine";

export type AssetCategory = "Buildings" | "Street" | "Infrastructure" | "Props" | "Nature" | "Vehicles";

/** Display order of categories in the asset browser (empty ones are hidden). */
export const ASSET_CATEGORY_ORDER: AssetCategory[] = [
  "Buildings",
  "Street",
  "Infrastructure",
  "Props",
  "Nature",
  "Vehicles",
];

/** "What is this object?" — metadata shared by every placed instance of a type. */
export interface AssetDefinition {
  type: DioramaObjectType;
  label: string;
  category: AssetCategory;
  icon: LucideIcon;
  /** Procedural geometry, origin at the ground contact point. */
  component: ComponentType;
  defaultScale: Vector3Tuple;
  /** Radius of the selection ring drawn under the object (local units). */
  footprintRadius: number;
  /** Natural things spawn at a random heading; street-built things spawn facing the road (+Z). */
  randomSpawnRotation: boolean;
  tags: string[];
}

/**
 * Single source of asset metadata. Adding a type = extend
 * `DIORAMA_OBJECT_TYPES`, write its component, add one entry here.
 */
export const ASSET_REGISTRY: Record<DioramaObjectType, AssetDefinition> = {
  house: {
    type: "house",
    label: "House",
    category: "Buildings",
    icon: HouseIcon,
    component: House,
    defaultScale: [1, 1, 1],
    footprintRadius: 0.85,
    randomSpawnRotation: false,
    tags: ["home", "residential", "building"],
  },
  shop: {
    type: "shop",
    label: "Small Shop",
    category: "Buildings",
    icon: Store,
    component: Shop,
    defaultScale: [1, 1, 1],
    footprintRadius: 0.85,
    randomSpawnRotation: false,
    tags: ["store", "shop", "commercial", "building"],
  },
  utilityPole: {
    type: "utilityPole",
    label: "Utility Pole",
    category: "Infrastructure",
    icon: UtilityPoleIcon,
    component: UtilityPole,
    defaultScale: [1, 1, 1],
    footprintRadius: 0.2,
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
    footprintRadius: 0.2,
    randomSpawnRotation: false,
    tags: ["wire", "cable", "electric", "overhead"],
  },
  vendingMachine: {
    type: "vendingMachine",
    label: "Vending Machine",
    category: "Props",
    icon: CupSoda,
    component: VendingMachine,
    defaultScale: [1, 1, 1],
    footprintRadius: 0.2,
    randomSpawnRotation: false,
    tags: ["drink", "jihanki", "machine"],
  },
  sign: {
    type: "sign",
    label: "Stop Sign",
    category: "Street",
    icon: Signpost,
    component: Sign,
    defaultScale: [1, 1, 1],
    footprintRadius: 0.15,
    randomSpawnRotation: false,
    tags: ["road sign", "stop", "tomare", "traffic"],
  },
  tree: {
    type: "tree",
    label: "Tree",
    category: "Nature",
    icon: TreePine,
    component: Tree,
    defaultScale: [1, 1, 1],
    footprintRadius: 0.5,
    randomSpawnRotation: true,
    tags: ["plant", "green", "garden"],
  },
  rock: {
    type: "rock",
    label: "Garden Stone",
    category: "Nature",
    icon: Gem,
    component: Rock,
    defaultScale: [0.9, 0.9, 0.9],
    footprintRadius: 0.45,
    randomSpawnRotation: true,
    tags: ["rock", "stone", "garden"],
  },
};

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
