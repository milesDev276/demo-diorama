import type { SurfaceKind } from "../types/diorama.types";
import { CORNER } from "../utils/cornerLayout";
import { DIORAMA_COLORS } from "../utils/palette";

type PaletteKey = keyof typeof DIORAMA_COLORS;

/** How rough a ground color is drawn (the `ground` material): [fine speckle, soft blotches], as fractions of the color. */
export type Grain = readonly [number, number];

/** "What is this ground?" — everything a cell of a plot's surface map can be. */
export interface SurfaceKindSpec {
  label: string;
  /** The cell's letter in a surface map. Fixed forever: it is in saved scenes. */
  code: string;
  color: PaletteKey;
  /** Height of the surface, in meters. */
  level: number;
  /** A curb strip is drawn where this kind meets a lower cell. */
  curb: boolean;
  grain: Grain;
  /** Paving joints: one every `every` cells, in both directions. */
  joint?: { every: number; color: PaletteKey };
  /** How much each paver between two joints differs in brightness (± this fraction). */
  tone: number;
  tags: string[];
}

export const SURFACE_KIND_SPECS: Record<SurfaceKind, SurfaceKindSpec> = {
  asphalt: {
    label: "Asphalt",
    code: "a",
    color: "asphalt",
    level: CORNER.roadY,
    curb: false,
    grain: [0.16, 0.14],
    tone: 0,
    tags: ["road", "street", "asphalt"],
  },
  sidewalk: {
    label: "Sidewalk",
    code: "s",
    color: "sidewalkConcrete",
    level: 0,
    curb: true,
    grain: [0.05, 0.07],
    joint: { every: 2, color: "sidewalkJoint" },
    tone: 0.035,
    tags: ["sidewalk", "pavement", "hodo"],
  },
  tile: {
    label: "Paving",
    code: "t",
    color: "pavingTile",
    level: 0,
    curb: true,
    grain: [0.06, 0.06],
    joint: { every: 1, color: "pavingJoint" },
    tone: 0.07,
    tags: ["paving", "tile", "brick", "shotengai"],
  },
  concrete: {
    label: "Concrete",
    code: "c",
    color: "concreteSlab",
    level: 0,
    curb: false,
    grain: [0.06, 0.09],
    tone: 0,
    tags: ["concrete", "parking", "slab"],
  },
  gravel: {
    label: "Gravel",
    code: "g",
    color: "lotGravel",
    level: 0,
    curb: false,
    grain: [0.22, 0.1],
    tone: 0,
    tags: ["gravel", "lot", "jari"],
  },
  grass: {
    label: "Grass",
    code: "r",
    color: "lawn",
    level: 0,
    curb: false,
    grain: [0.14, 0.16],
    tone: 0,
    tags: ["grass", "lawn", "green"],
  },
  soil: {
    label: "Soil",
    code: "d",
    color: "soil",
    level: 0,
    curb: false,
    grain: [0.16, 0.16],
    tone: 0,
    tags: ["soil", "dirt", "earth", "garden"],
  },
};

/** Grain of the ground colors that are not a surface kind of their own. */
export const CURB_GRAIN: Grain = [0.04, 0.06];
export const PAINT_GRAIN: Grain = [0.05, 0.1];
export const JOINT_GRAIN: Grain = [0, 0.05];

const KIND_BY_CODE = new Map(Object.entries(SURFACE_KIND_SPECS).map(([kind, spec]) => [spec.code, kind as SurfaceKind]));

/** The kind a map letter stands for, if this app knows it. */
export function surfaceKindOfCode(code: string): SurfaceKind | undefined {
  return KIND_BY_CODE.get(code);
}
