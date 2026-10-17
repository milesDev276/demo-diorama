import type { DioramaBase, DioramaEnvironment, DioramaScene } from "../types/diorama.types";
import { FIRST_VISIT_TEMPLATE, SCENE_TEMPLATES, type SceneTemplate } from "../assets/sceneTemplates";
import { createId } from "./id";
import { DEFAULT_SCENE_NAME } from "./objectDefaults";
import { DEFAULT_ENVIRONMENT } from "./sceneDefaults";
import { createSurface, DEFAULT_PLOT_LAYOUT } from "./surfaceMap";

/** An empty scene on the given base, by day, in autumn. A plot gets the default ground. */
export function emptyScene(base: DioramaBase): DioramaScene {
  const environment: DioramaEnvironment = { ...DEFAULT_ENVIRONMENT, base };
  if (base === "plot") environment.surface = createSurface(DEFAULT_PLOT_LAYOUT);
  return { id: createId("scene"), name: DEFAULT_SCENE_NAME, objects: [], environment };
}

/** A fresh copy of a built-in starter (assets/sceneTemplates.ts), with new ids. */
export function starterScene(template: SceneTemplate = FIRST_VISIT_TEMPLATE): DioramaScene {
  return { id: createId("scene"), name: template.name, objects: template.objects(), environment: template.environment };
}

export function findStarter(id: string): SceneTemplate | undefined {
  return SCENE_TEMPLATES.find((template) => template.id === id);
}
