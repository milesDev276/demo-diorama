import type { CameraPreset, Vector3Tuple } from "../types/diorama.types";

export const DEFAULT_CAMERA_TARGET: Vector3Tuple = [0, 0.3, 0];

interface CameraPresetConfig {
  position: Vector3Tuple;
  zoom: number;
  label: string;
}

export const CAMERA_PRESETS: Record<CameraPreset, CameraPresetConfig> = {
  isometric: { position: [8, 7, 8], zoom: 72, label: "Isometric" },
  front: { position: [0, 2.4, 13.5], zoom: 88, label: "Front" },
  side: { position: [13.5, 2.4, 0], zoom: 88, label: "Side" },
  // Offset only along Z so the road (running along X) stays horizontal on screen.
  top: { position: [0, 13.5, 0.01], zoom: 100, label: "Top" },
};

export const CAMERA_PRESET_ORDER: CameraPreset[] = ["isometric", "front", "side", "top"];
