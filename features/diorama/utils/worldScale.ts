import { LEGACY_UNIT_SCALE, PLOT_DEPTH, PLOT_WIDTH, PLOT_Z } from "./legacyUnits";

/**
 * Canonical world scale: 1 world unit = 1 meter (CLAUDE.md §18). Size every
 * entity in real meters — never guess per asset.
 *
 *   Door ≈ 2 · Person ≈ 1.7 · Vending machine ≈ 1.83 · Utility pole ≈ 10
 */
export const METERS_PER_UNIT = 1;

const toMeters = (legacy: number) => legacy * LEGACY_UNIT_SCALE;

/**
 * The street-strip plot in meters. Derived from the legacy constants that
 * the Ground geometry is drawn with, so the two can never drift apart.
 */
export const STREET_PLOT = {
  width: toMeters(PLOT_WIDTH),
  depth: toMeters(PLOT_DEPTH),
  /** Z coordinate where each strip begins (strips run back → front). */
  z: {
    back: toMeters(PLOT_Z.back),
    lot: toMeters(PLOT_Z.lot),
    sidewalk: toMeters(PLOT_Z.sidewalk),
    road: toMeters(PLOT_Z.road),
    front: toMeters(PLOT_Z.front),
  },
} as const;
