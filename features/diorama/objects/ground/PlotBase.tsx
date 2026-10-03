"use client";

import { useEffect, useMemo } from "react";
import type { PlinthStyle, SurfaceMap } from "../../types/diorama.types";
import { useSeasonLook } from "../../hooks/useSceneEnvironment";
import { surfaceSize } from "../../utils/surfaceMap";
import { getSlotMaterial } from "../materials";
import { Plinth } from "./Plinth";
import { buildSurfaceGeometry } from "./surfaceGeometry";

/** The plot's ground: a placement surface like every base, and the one mesh the ground brush paints on. */
export const PLOT_SURFACE = { placementSurface: true, groundPaint: true };

interface PlotBaseProps {
  surface: SurfaceMap;
  plinth: PlinthStyle;
}

/**
 * The free plot: its ground is built from the scene's surface map
 * (utils/surfaceMap.ts) as one merged mesh — rebuilt whenever the map is
 * painted or the season changes the grass — on the platform the scene
 * chose. Authored in meters.
 */
export function PlotBase({ surface, plinth }: PlotBaseProps) {
  const grassTint = useSeasonLook().scatter.grass;
  const geometry = useMemo(() => buildSurfaceGeometry(surface, grassTint ?? [1, 1, 1]), [surface, grassTint]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const { width, depth } = surfaceSize(surface);

  return (
    <group>
      <mesh geometry={geometry} material={getSlotMaterial("ground")} userData={PLOT_SURFACE} castShadow receiveShadow />
      <Plinth width={width} depth={depth} style={plinth} />
    </group>
  );
}
