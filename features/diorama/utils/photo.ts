import type { PhotoAspect, PhotoSettings } from "../types/diorama.types";

/** Width ÷ height of each frame; `free` fills the window. */
export const PHOTO_ASPECT_RATIOS: Record<PhotoAspect, number | null> = {
  free: null,
  "1:1": 1,
  "4:5": 4 / 5,
  "16:9": 16 / 9,
};

export const PHOTO_ASPECT_LABELS: Record<PhotoAspect, string> = {
  free: "Free",
  "1:1": "1:1",
  "4:5": "4:5",
  "16:9": "16:9",
};

/** Export sizes, as multiples of the frame's size on screen. */
export const PHOTO_SCALES = [1, 2, 3, 4] as const;

/** Strength of the tilt-shift falloff (TiltShift2 `blur`). */
export const PHOTO_BLUR_RANGE = { min: 0, max: 0.3, step: 0.01 } as const;

/** Exposure compensation in stops. */
export const PHOTO_EXPOSURE_RANGE = { min: -1.5, max: 1.5, step: 0.1 } as const;

export const DEFAULT_PHOTO_SETTINGS: PhotoSettings = {
  aspect: "free",
  focus: null,
  blur: 0.12,
  exposure: 0,
  scale: 2,
};

/** Largest image an export may produce: the composer's buffers grow with it. */
const MAX_EXPORT_PIXELS = 26_000_000;

/**
 * The pixel size of an export: the frame's CSS size times `scale`, scaled
 * down as a whole if it would pass the GPU's largest texture or the pixel
 * budget.
 */
export function photoExportSize(
  frame: { width: number; height: number },
  scale: number,
  maxTextureSize: number
): { width: number; height: number; scale: number } {
  const limits = [
    scale,
    maxTextureSize / frame.width,
    maxTextureSize / frame.height,
    Math.sqrt(MAX_EXPORT_PIXELS / (frame.width * frame.height)),
  ];
  const fitted = Math.min(...limits);
  return { width: Math.round(frame.width * fitted), height: Math.round(frame.height * fitted), scale: fitted };
}

/** `autumn-street-corner-20261002-1830.png` */
export function photoFileName(sceneName: string, date = new Date()): string {
  const slug =
    sceneName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "diorama";
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
  return `${slug}-${stamp}.png`;
}
