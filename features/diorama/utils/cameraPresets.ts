import type { CameraPreset, Vector3Tuple } from "../types/diorama.types";

/** Where the editing camera looks before its first fit (a diorama opened without a saved view is fitted on its first frame). */
export const DEFAULT_CAMERA_TARGET: Vector3Tuple = [0, 1.8, 0];

/** Orthographic zoom limits, in screen pixels per meter. */
export const CAMERA_ZOOM_RANGE = { min: 5, max: 80 } as const;

interface CameraPresetConfig {
  position: Vector3Tuple;
  label: string;
}

/**
 * Viewing directions shared by every base. A preset fits the diorama in the
 * canvas from its direction (plan/Stage-21-Implementation.md D1); the
 * position's length is the distance the orthographic camera stands at.
 */
export const CAMERA_PRESETS: Record<CameraPreset, CameraPresetConfig> = {
  isometric: { position: [48, 42, 48], label: "Isometric" },
  front: { position: [0, 14.4, 81], label: "Front" },
  side: { position: [81, 14.4, 0], label: "Side" },
  // Offset only along Z so the road (running along X) stays horizontal on screen.
  top: { position: [0, 81, 0.06], label: "Top" },
};

export const CAMERA_PRESET_ORDER: CameraPreset[] = ["isometric", "front", "side", "top"];
