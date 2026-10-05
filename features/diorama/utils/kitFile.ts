import type { Kit } from "../types/diorama.types";
import { normalizeKits } from "./kits";
import { downloadJson, KIT_FILE_KIND, slugify } from "./sceneSerializer";

/**
 * Kits as files (plan/Stage-14-Implementation.md D5): the same
 * `{ version, kits }` the library keeps in localStorage, plus a `kind` that
 * tells it from a scene file.
 */

/** Version of the stored and exported kit list. */
export const KIT_FILE_VERSION = 1;

/** Triggers a browser download of one kit as a `.kit.json` file. */
export function downloadKit(kit: Kit): void {
  const { id, name, objects } = kit;
  downloadJson(`${slugify(name, "kit")}.kit.json`, {
    kind: KIT_FILE_KIND,
    version: KIT_FILE_VERSION,
    kits: [{ id, name, objects }],
  });
}

/** The kits in the text of a kit file, or why it has none. Never throws. */
export function parseKitFile(json: string): { kits: Kit[] } | { error: string } {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return { error: "The file is invalid or corrupted." };
  }
  if (!data || typeof data !== "object") return { error: "The file is invalid or corrupted." };

  const container = data as Record<string, unknown>;
  if (!Array.isArray(container.kits)) {
    const isScene = "scene" in container || Array.isArray(container.objects);
    return { error: isScene ? "This is a scene file. Open it with Import in the toolbar." : "This file holds no kits." };
  }
  if (typeof container.version === "number" && container.version > KIT_FILE_VERSION) {
    return { error: "This file was made with a newer version of the app." };
  }
  const kits = normalizeKits(container.kits);
  return kits.length ? { kits } : { error: "No kit in this file could be read." };
}
