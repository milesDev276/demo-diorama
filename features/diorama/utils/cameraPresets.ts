import type { CameraPreset, Vector3Tuple } from "../types/diorama.types";

export const DEFAULT_CAMERA_TARGET: Vector3Tuple = [0, 1.8, 0];

interface CameraPresetConfig {
  position: Vector3Tuple;
  /** Orthographic zoom = screen pixels per meter. */
  zoom: number;
  label: string;
}

export const CAMERA_PRESETS: Record<CameraPreset, CameraPresetConfig> = {
  isometric: { position: [48, 42, 48], zoom: 12, label: "Isometric" },
  front: { position: [0, 14.4, 81], zoom: 88 / 6, label: "Front" },
  side: { position: [81, 14.4, 0], zoom: 88 / 6, label: "Side" },
  // Offset only along Z so the road (running along X) stays horizontal on screen.
  top: { position: [0, 81, 0.06], zoom: 100 / 6, label: "Top" },
};

export const CAMERA_PRESET_ORDER: CameraPreset[] = ["isometric", "front", "side", "top"];
