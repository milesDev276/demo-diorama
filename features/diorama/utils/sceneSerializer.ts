import type { DioramaObject, DioramaScene } from "../types/diorama.types";

export const STORAGE_KEY = "diorama-scene";

/**
 * File format version written by this app.
 *   1 — positions in the pre-meter world unit (≈ 6 m).
 *   2 — positions in meters.
 */
export const SCENE_FILE_VERSION = 2;

/** v1 → v2: one v1 world unit was 6 m. Fixed forever — it describes old files. */
const V1_METERS_PER_UNIT = 6;

export interface DioramaSceneFile {
  version: number;
  savedAt: number;
  scene: DioramaScene;
}

/**
 * Upgrades raw, not-yet-validated scene objects written by an older file
 * version to the current one. Anything malformed passes through untouched;
 * the validator decides what to keep.
 */
export function migrateRawObjects(rawObjects: unknown[], fromVersion: number): unknown[] {
  if (fromVersion >= 2) return rawObjects;
  return rawObjects.map((raw) => {
    if (!raw || typeof raw !== "object") return raw;
    const object = raw as Record<string, unknown>;
    if (!Array.isArray(object.position)) return raw;
    const position = object.position.map((n) => (typeof n === "number" ? n * V1_METERS_PER_UNIT : n));
    return { ...object, position };
  });
}

/** Builds the exact payload written to localStorage and exported files. */
export function serializeScene(scene: DioramaScene): DioramaSceneFile {
  return { version: SCENE_FILE_VERSION, savedAt: Date.now(), scene };
}

/** What marks an exported kit file (utils/kitFile.ts), so it is never read as a scene. */
export const KIT_FILE_KIND = "diorama-kit";

/** True if parsed JSON is a kit file rather than a scene. */
export function isKitFile(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const container = data as Record<string, unknown>;
  return container.kind === KIT_FILE_KIND || (Array.isArray(container.kits) && !container.scene && !container.objects);
}

/** A file-name stem from a scene's or a kit's name. */
export function slugify(name: string, fallback: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

/** Triggers a browser download of `payload` as a JSON file. */
export function downloadJson(fileName: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  URL.revokeObjectURL(url);
}

/** Triggers a browser download of the scene as a `.diorama.json` file. */
export function downloadSceneAsJson(scene: DioramaScene): void {
  downloadJson(`${slugify(scene.name, "untitled-diorama")}.diorama.json`, serializeScene(scene));
}

/** Reads a File (from an <input type="file">) as text. */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/** Builds a scene snapshot suitable for saving/exporting from the store's current fields. */
export function buildScene(params: {
  id: string;
  name: string;
  objects: DioramaObject[];
  environment: DioramaScene["environment"];
  camera?: DioramaScene["camera"];
  photo?: DioramaScene["photo"];
}): DioramaScene {
  return { ...params };
}
