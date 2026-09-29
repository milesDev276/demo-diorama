import type { DioramaCameraState, DioramaEnvironment, Vector3Tuple } from "../types/diorama.types";

/** Only one environment variant exists today; the field is kept on the scene
 *  type so future ground/sky presets don't require a data migration. */
export const DEFAULT_ENVIRONMENT: DioramaEnvironment = {
  background: "sky-cozy",
  ground: "grass-island",
};

const ISOMETRIC_POSITION: Vector3Tuple = [8, 7, 8];
const DEFAULT_TARGET: Vector3Tuple = [0, 0.3, 0];

export const DEFAULT_CAMERA_STATE: DioramaCameraState = {
  position: ISOMETRIC_POSITION,
  target: DEFAULT_TARGET,
  zoom: 72,
};
