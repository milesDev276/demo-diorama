"use client";

import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useDioramaStore } from "../store/dioramaStore";
import { setEmissiveLevel, setFoliageSeason, setSignGlow, setWeatherSurface, setWireBounds } from "../objects/materials";
import { getBaseTemplate } from "../utils/baseTemplates";
import { SEASON_LOOKS } from "../utils/seasons";
import { sceneLook, WEATHER_LOOKS } from "../utils/weather";

/**
 * Pushes the scene's environment into the shared materials: how strongly
 * emissive surfaces and backlit prints glow (time of day and weather), how wet or
 * snowed on surfaces are (weather), what deciduous crowns look like
 * (season) and where overhead wires are cut off (the base's outline). Runs
 * when one of them changes — never per frame. The lights and the sky read
 * the same looks themselves.
 */
export function EnvironmentDriver() {
  const gl = useThree((s) => s.gl);
  const timeOfDay = useDioramaStore((s) => s.environment.timeOfDay);
  const season = useDioramaStore((s) => s.environment.season);
  const weather = useDioramaStore((s) => s.environment.weather);
  const template = useDioramaStore((s) => getBaseTemplate(s.environment));

  useLayoutEffect(() => {
    const look = sceneLook(timeOfDay, weather);
    setEmissiveLevel(look.emissive);
    setSignGlow(look.signs);
    setWeatherSurface(WEATHER_LOOKS[weather].wet, WEATHER_LOOKS[weather].snow);
  }, [timeOfDay, weather]);

  useLayoutEffect(() => {
    setFoliageSeason(SEASON_LOOKS[season].foliage);
  }, [season]);

  useLayoutEffect(() => {
    // Wires carry their own clipping planes; the renderer has to honor them.
    // eslint-disable-next-line react-hooks/immutability -- the live renderer, not React state
    gl.localClippingEnabled = true;
    setWireBounds(template.width, template.depth);
  }, [gl, template]);

  return null;
}
