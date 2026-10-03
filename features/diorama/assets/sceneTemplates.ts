import type { DioramaEnvironment, DioramaObject } from "../types/diorama.types";
import { getDefaultScene } from "../utils/objectDefaults";
import { getBackStreetObjects, getBackStreetSurface } from "../utils/plotStarter";
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
  {
    // A painted plot: what the ground brush, runs and markings are for.
    id: "back-street",
    name: "Back Street",
    description: "A shop, a house and a small parking lot on a plot you can repaint.",
    thumbnail: "/templates/back-street.webp",
    environment: {
      ...DEFAULT_ENVIRONMENT,
      base: "plot",
      timeOfDay: "goldenHour",
      season: "autumn",
      plinth: "wood",
      surface: getBackStreetSurface(),
    },
    objects: getBackStreetObjects,
  },
];

/** What a first visit — no autosave yet — opens. */
export const FIRST_VISIT_TEMPLATE = SCENE_TEMPLATES[0];
