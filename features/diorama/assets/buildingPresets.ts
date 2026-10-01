import type { BuildingParams } from "../types/diorama.types";
import { uniformFloor } from "../utils/buildingParams";

export interface BuildingPreset {
  id: string;
  label: string;
  tags: string[];
  params: BuildingParams;
}

const SHOP_HOUSE = { baysX: 3, baysZ: 3 };
const HOUSE = { baysX: 3, baysZ: 2 };

/**
 * Starting points for the `building` type, offered in the asset browser.
 * A preset is only the params a new building starts with; the inspector
 * changes them afterwards.
 */
export const BUILDING_PRESETS: BuildingPreset[] = [
  {
    // The hero corner shop-house of plan/Hero-Layout.md §3.
    id: "shop-house-3f",
    label: "Shop-house 3F",
    tags: ["shop", "store", "sakaya", "corner", "shop-house"],
    params: {
      ...SHOP_HOUSE,
      floors: [
        {
          front: ["shopfront", "shopfront", "shopfront"],
          right: ["shopfront", "windows", "blank"],
          back: ["blank", "blank", "blank"],
          left: ["blank", "blank", "blank"],
        },
        {
          front: ["windows", "balcony", "balcony"],
          right: ["windows", "windows", "windows"],
          back: ["blank", "blank", "blank"],
          left: ["blank", "blank", "blank"],
        },
        uniformFloor(SHOP_HOUSE, { front: "windows", right: "windows", back: "blank", left: "blank" }),
      ],
      roof: "flat-rooftop",
    },
  },
  {
    id: "house-2f",
    label: "House 2F",
    tags: ["home", "residential", "house"],
    params: {
      ...HOUSE,
      floors: [
        {
          front: ["windows", "entrance", "windows"],
          right: ["windows", "blank"],
          back: ["windows", "blank", "windows"],
          left: ["blank", "windows"],
        },
        {
          front: ["balcony", "balcony", "windows"],
          right: ["windows", "blank"],
          back: ["windows", "blank", "windows"],
          left: ["blank", "windows"],
        },
      ],
      roof: "hipped-tile",
    },
  },
];

/** What a building without (valid) params falls back to. */
export const DEFAULT_BUILDING_PARAMS: BuildingParams = BUILDING_PRESETS[0].params;
