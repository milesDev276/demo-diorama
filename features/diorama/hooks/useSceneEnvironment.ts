"use client";

import { createContext, useContext } from "react";
import type { DioramaEnvironment } from "../types/diorama.types";
import { DEFAULT_ENVIRONMENT } from "../utils/sceneDefaults";
import { SEASON_LOOKS, type SeasonLook } from "../utils/seasons";
import type { TimeOfDayLook } from "../utils/timeOfDay";
import { sceneLook, WEATHER_LOOKS, type WeatherLook } from "../utils/weather";

/**
 * The time of day, season and weather that everything inside a canvas is
 * drawn in. The editor's canvas provides the scene's; a canvas without a
 * provider — the thumbnail studio — gets the defaults: day, autumn, clear.
 *
 * Asset components read the environment from here, not from the store: the
 * store builds its first scene from the asset registry, so nothing the
 * registry imports may import the store.
 */
export const SceneEnvironmentContext = createContext<Pick<DioramaEnvironment, "timeOfDay" | "season" | "weather">>({
  timeOfDay: DEFAULT_ENVIRONMENT.timeOfDay,
  season: DEFAULT_ENVIRONMENT.season,
  weather: DEFAULT_ENVIRONMENT.weather,
});

/** The look of the canvas's time of day, in its weather. */
export function useTimeOfDayLook(): TimeOfDayLook {
  const { timeOfDay, weather } = useContext(SceneEnvironmentContext);
  return sceneLook(timeOfDay, weather);
}

/** The look of the canvas's season. */
export function useSeasonLook(): SeasonLook {
  return SEASON_LOOKS[useContext(SceneEnvironmentContext).season];
}

/** What the canvas's weather does to surfaces, and what falls. The light it gives is in useTimeOfDayLook. */
export function useWeatherLook(): WeatherLook {
  return WEATHER_LOOKS[useContext(SceneEnvironmentContext).weather];
}
