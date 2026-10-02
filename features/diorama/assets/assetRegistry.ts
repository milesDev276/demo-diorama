import type { ComponentType } from "react";
import {
  AirVent,
  AlignJustify,
  Armchair,
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
  Package,
  PersonStanding,
  Presentation,
  RectangleVertical,
  Recycle,
  Shirt,
  Signpost,
  Sparkles,
  Sprout,
  Store,
  TreeDeciduous,
  TreePine,
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
  /** Natural things whose repeats should not look stamped: duplicates and
   *  Shift+click placements get a random heading and a size within ± this fraction. */
  jitter?: number;
  tags: string[];
}

/** Geometry written as JSX, origin at the ground contact point. */
export interface ProceduralAsset extends AssetBase {
  /** Parametric assets (building, scatter) read the object's params; the others ignore their props. */
  component: ComponentType<AssetComponentProps>;
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
    component: BuildingAsset,
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
  scatter: {
    type: "scatter",
    label: "Scatter",
    category: "Nature",
    icon: Sparkles,
    component: ScatterLayer,
    legacyUnits: false,
    defaultScale: [1, 1, 1],
    footprintRadius: 1,
    randomSpawnRotation: false,
    tags: ["scatter", "brush"],
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
    jitter: 0.12,
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
    jitter: 0.12,
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
    jitter: 0.12,
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
