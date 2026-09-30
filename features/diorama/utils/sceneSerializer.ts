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

function slugify(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "untitled-diorama";
}

/** Triggers a browser download of the scene as a `.diorama.json` file. */
export function downloadSceneAsJson(scene: DioramaScene): void {
  const payload = serializeScene(scene);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${slugify(scene.name)}.diorama.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  URL.revokeObjectURL(url);
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
  camera: DioramaScene["camera"];
}): DioramaScene {
  return { ...params };
}
