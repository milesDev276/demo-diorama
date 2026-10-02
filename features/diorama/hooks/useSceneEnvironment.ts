"use client";

import { createContext, useContext } from "react";
import type { DioramaEnvironment } from "../types/diorama.types";
import { DEFAULT_ENVIRONMENT } from "../utils/sceneDefaults";
import { SEASON_LOOKS, type SeasonLook } from "../utils/seasons";
import { TIME_OF_DAY_LOOKS, type TimeOfDayLook } from "../utils/timeOfDay";

/**
 * The time of day and season that everything inside a canvas is drawn in.
 * The editor's canvas provides the scene's; a canvas without a provider —
 * the thumbnail studio — gets the defaults, day and autumn.
 *
 * Asset components read the environment from here, not from the store: the
 * store builds its first scene from the asset registry, so nothing the
 * registry imports may import the store.
 */
export const SceneEnvironmentContext = createContext<Pick<DioramaEnvironment, "timeOfDay" | "season">>({
  timeOfDay: DEFAULT_ENVIRONMENT.timeOfDay,
  season: DEFAULT_ENVIRONMENT.season,
});

/** The look of the canvas's time of day. */
export function useTimeOfDayLook(): TimeOfDayLook {
  return TIME_OF_DAY_LOOKS[useContext(SceneEnvironmentContext).timeOfDay];
}

/** The look of the canvas's season. */
export function useSeasonLook(): SeasonLook {
  return SEASON_LOOKS[useContext(SceneEnvironmentContext).season];
}
