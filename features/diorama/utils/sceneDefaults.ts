import type { DioramaCameraState, DioramaEnvironment, Vector3Tuple } from "../types/diorama.types";

/** Where a new scene starts, and what a scene file's missing fields load as. A file without a base is
 *  not this default: it is an old street strip (utils/streetStrip.ts). */
export const DEFAULT_ENVIRONMENT: DioramaEnvironment = {
  background: "sky-cozy",
  ground: "street-corner",
  base: "corner",
  timeOfDay: "day",
  season: "autumn",
  weather: "clear",
  plinth: "dark",
};

const ISOMETRIC_POSITION: Vector3Tuple = [48, 42, 48];
const DEFAULT_TARGET: Vector3Tuple = [0, 1.8, 0];

/**
 * What every scene file carried as its camera before Stage 14: a constant
 * that was never the real view. A file with exactly this has no saved view.
 * Fixed forever — it describes old files.
 */
export const LEGACY_CAMERA_PLACEHOLDER: DioramaCameraState = {
  position: ISOMETRIC_POSITION,
  target: DEFAULT_TARGET,
  zoom: 12,
};
