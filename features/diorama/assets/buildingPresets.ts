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
const APARTMENT_BLOCK = { baysX: 4, baysZ: 3 };
const NARROW = { baysX: 2, baysZ: 4 };
const APARTMENT_UPPER = uniformFloor(APARTMENT_BLOCK, { front: "balcony", right: "windows", back: "blank", left: "windows" });
const NARROW_UPPER = uniformFloor(NARROW, { front: "windows", right: "windows", back: "blank", left: "blank" });


/** マンション: a balcony on every front bay above the entrance floor (Stage 24 D2). */
export const APARTMENT_BLOCK_PRESET: BuildingPreset = {
  id: "apartment-block-4f",
  label: "Apartment Block 4F",
  tags: ["apartment", "mansion", "block", "flats", "residential", "balcony"],
  params: {
    ...APARTMENT_BLOCK,
    floors: [
      {
        front: ["windows", "entrance", "windows", "windows"],
        right: ["windows", "windows", "windows"],
        back: ["blank", "blank", "blank", "blank"],
        left: ["windows", "blank", "windows"],
      },
      APARTMENT_UPPER,
      APARTMENT_UPPER,
      APARTMENT_UPPER,
    ],
    roof: "flat-rooftop",
  },
};

/** ペンシルビル / 雑居ビル: a shop bay and a stair door below, offices above, a blank side against the neighbour (Stage 24 D2). */
export const NARROW_BUILDING_PRESET: BuildingPreset = {
  id: "narrow-building-4f",
  label: "Narrow Building 4F",
  tags: ["pencil building", "zakkyo", "narrow", "office", "shop", "commercial", "mixed-use"],
  params: {
    ...NARROW,
    floors: [
      {
        front: ["shopfront", "entrance"],
        right: ["windows", "windows", "blank", "blank"],
        back: ["blank", "blank"],
        left: ["blank", "blank", "blank", "blank"],
      },
      NARROW_UPPER,
      NARROW_UPPER,
      NARROW_UPPER,
    ],
    roof: "flat-rooftop",
  },
};

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
  APARTMENT_BLOCK_PRESET,
  NARROW_BUILDING_PRESET,
];

/** What a building without (valid) params falls back to. */
export const DEFAULT_BUILDING_PARAMS: BuildingParams = BUILDING_PRESETS[0].params;
