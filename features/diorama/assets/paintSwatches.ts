import { DIORAMA_COLORS } from "../utils/palette";

export type PaletteKey = keyof typeof DIORAMA_COLORS;

/** A color the inspector offers for a paint region. */
export interface Swatch {
  key: PaletteKey;
  name: string;
}

const s = (key: PaletteKey, name: string): Swatch => ({ key, name });

const SAGE = s("carBody", "Sage");
const CAR_WHITE = s("paintCarWhite", "White");
const SILVER = s("paintCarSilver", "Silver");
const NAVY = s("paintCarNavy", "Navy");
const BRICK = s("paintCarRed", "Brick red");
const CAR_CREAM = s("paintCarCream", "Cream");
const CHARCOAL = s("paintCarCharcoal", "Charcoal");

const PLASTER = s("wallPlaster", "Cream");
const SIDING = s("wallSiding", "Greige");
const WALL_COLORS = [
  s("paintWallWhite", "White"),
  s("paintWallSand", "Sand"),
  s("paintWallSage", "Sage"),
  s("paintWallBlueGrey", "Blue gray"),
  s("paintWallBrown", "Brown"),
];

/**
 * The swatches of each paint region, the asset's modeled color first (its
 * Blender script's PAINT). Curated, not free: a street of them still reads
 * as one miniature (Stage 19 D5).
 */
export const PAINT_SWATCHES = {
  keiCar: [SAGE, CAR_WHITE, SILVER, NAVY, BRICK, CAR_CREAM, CHARCOAL],
  keiTruck: [s("vendingPanel", "White"), SILVER, SAGE, NAVY, BRICK, CHARCOAL],
  scooter: [s("tankCream", "Cream"), CAR_WHITE, SILVER, NAVY, BRICK, SAGE, CHARCOAL],
  vendingMachine: [
    s("vendingBody", "Red"),
    s("paintVendingBlue", "Blue"),
    s("paintVendingWhite", "White"),
    s("paintVendingGreen", "Green"),
    s("paintVendingMustard", "Mustard"),
    s("paintVendingBlack", "Black"),
  ],
  plaster: [PLASTER, SIDING, ...WALL_COLORS],
  siding: [SIDING, PLASTER, ...WALL_COLORS],
  metal: [
    s("wallMetal", "Galvanized"),
    s("paintMetalBlue", "Faded blue"),
    s("paintMetalRust", "Oxide red"),
    s("paintWallWhite", "White"),
    s("paintWallSage", "Sage"),
    s("paintWallBrown", "Brown"),
  ],
} satisfies Record<string, Swatch[]>;

/** A swatch's color as stored on an object: "#rrggbb", lowercase. */
export function swatchHex(swatch: Swatch): string {
  return DIORAMA_COLORS[swatch.key].toLowerCase();
}
