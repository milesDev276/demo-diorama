import type { DioramaObject, DioramaScene } from "../types/diorama.types";

export const STORAGE_KEY = "diorama-scene";
export const SCENE_FILE_VERSION = 1;

export interface DioramaSceneFile {
  version: number;
  savedAt: number;
  scene: DioramaScene;
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
