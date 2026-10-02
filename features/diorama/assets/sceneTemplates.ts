import type { DioramaEnvironment, DioramaObject } from "../types/diorama.types";
import { getDefaultScene } from "../utils/objectDefaults";
import { DEFAULT_ENVIRONMENT } from "../utils/sceneDefaults";

/** A built-in starting point: a whole scene, offered by the New-diorama dialog. */
export interface SceneTemplate {
  /** Fixed: the preview image is named after it. */
  id: string;
  name: string;
  description: string;
  /** Rendered by scripts/capture-template.mjs. */
  thumbnail: string;
  environment: DioramaEnvironment;
  /** Fresh objects with new ids on every call. */
  objects: () => DioramaObject[];
}

export const SCENE_TEMPLATES: SceneTemplate[] = [
  {
    // The hero scene of plan/Hero-Layout.md.
    id: "autumn-corner",
    name: "Autumn Street Corner",
    description: "A corner liquor shop at golden hour, ready to rearrange.",
    thumbnail: "/templates/autumn-corner.webp",
    environment: { ...DEFAULT_ENVIRONMENT, base: "corner", timeOfDay: "goldenHour", season: "autumn" },
    objects: () => getDefaultScene("corner"),
  },
];

/** What a first visit — no autosave yet — opens. */
export const FIRST_VISIT_TEMPLATE = SCENE_TEMPLATES[0];
