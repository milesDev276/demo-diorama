"use client";

import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useDioramaStore } from "../store/dioramaStore";
import { setEmissiveLevel, setFoliageSeason, setWireBounds } from "../objects/materials";
import { getBaseTemplate } from "../utils/baseTemplates";
import { SEASON_LOOKS } from "../utils/seasons";
import { TIME_OF_DAY_LOOKS } from "../utils/timeOfDay";

/**
 * Pushes the scene's environment into the shared materials: how strongly
 * emissive surfaces glow (time of day), what deciduous crowns look like
 * (season) and where overhead wires are cut off (the base's outline). Runs
 * when one of them changes — never per frame. The lights and the sky read
 * the same looks themselves.
 */
export function EnvironmentDriver() {
  const gl = useThree((s) => s.gl);
  const timeOfDay = useDioramaStore((s) => s.environment.timeOfDay);
  const season = useDioramaStore((s) => s.environment.season);
  const template = useDioramaStore((s) => getBaseTemplate(s.environment));

  useLayoutEffect(() => {
    setEmissiveLevel(TIME_OF_DAY_LOOKS[timeOfDay].emissive);
  }, [timeOfDay]);

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
