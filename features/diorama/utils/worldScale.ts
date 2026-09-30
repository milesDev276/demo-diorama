/**
 * Canonical world scale. Stylized miniature: 1 world unit ≈ 6 m (a door is
 * 0.32 units tall). Size every entity from this — never guess per asset.
 *
 *   Door 2 m ≈ 0.32 · House ≈ 1.0 wide · Utility pole 10 m ≈ 2.0
 *   Vending machine 1.8 m ≈ 0.34 · Road (2 lanes) 6 m ≈ 1.1
 */
export const METERS_PER_UNIT = 6;

// ── Street-corner plot ──────────────────────────────────────────────────
// The plot is split into strips along Z, from the back edge (−Z) to the
// road at the front (+Z). Lot and sidewalk surfaces sit at y = 0; the road
// is recessed below the curb.

export const PLOT_WIDTH = 8.4;

export const STRIP_DEPTH = {
  grass: 0.5,
  lot: 2.4,
  sidewalk: 0.5,
  road: 1.1,
} as const;

export const PLOT_DEPTH = STRIP_DEPTH.grass + STRIP_DEPTH.lot + STRIP_DEPTH.sidewalk + STRIP_DEPTH.road;

const PLOT_BACK = -PLOT_DEPTH / 2;

/** Z coordinate where each strip begins (strips run back → front). */
export const PLOT_Z = {
  back: PLOT_BACK,
  lot: PLOT_BACK + STRIP_DEPTH.grass,
  sidewalk: PLOT_BACK + STRIP_DEPTH.grass + STRIP_DEPTH.lot,
  road: PLOT_BACK + STRIP_DEPTH.grass + STRIP_DEPTH.lot + STRIP_DEPTH.sidewalk,
  front: PLOT_DEPTH / 2,
} as const;

/** The road surface sits slightly below the sidewalk, giving a real curb step. */
export const ROAD_SURFACE_Y = -0.04;

// ── Utility pole / power line ───────────────────────────────────────────
// Shared so a PowerLine placed at a pole's position lines up with its
// insulators with no manual height adjustment.

export const POLE_HEIGHT = 2.0;
export const CROSSARM_HEIGHT = 1.78;
/** Horizontal distance a power line runs in each direction from its pole. */
export const POWER_LINE_SPAN = 4.2;
/** Wire attach points on a pole as [y, z]: two crossarm insulators + the pole top. */
export const POWER_LINE_ATTACH: ReadonlyArray<readonly [number, number]> = [
  [CROSSARM_HEIGHT + 0.05, -0.26],
  [CROSSARM_HEIGHT + 0.05, 0.26],
  [POLE_HEIGHT + 0.05, 0],
];
