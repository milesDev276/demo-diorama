import type { DioramaCameraState, DioramaEnvironment, Vector3Tuple } from "../types/diorama.types";

/** What a scene file without an environment loads as; each missing field takes its value from here. */
export const DEFAULT_ENVIRONMENT: DioramaEnvironment = {
  background: "sky-cozy",
  ground: "street-corner",
  base: "street",
  timeOfDay: "day",
  season: "autumn",
  plinth: "dark",
};

const ISOMETRIC_POSITION: Vector3Tuple = [48, 42, 48];
const DEFAULT_TARGET: Vector3Tuple = [0, 1.8, 0];

export const DEFAULT_CAMERA_STATE: DioramaCameraState = {
  position: ISOMETRIC_POSITION,
  target: DEFAULT_TARGET,
  zoom: 12,
};
