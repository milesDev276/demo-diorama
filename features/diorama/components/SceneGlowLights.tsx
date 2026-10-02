"use client";

import { useMemo } from "react";
import { Vector3 } from "three";
import { ASSET_REGISTRY, SHOP_GLOW, type GlowLight } from "../assets/assetRegistry";
import { useTimeOfDayLook } from "../hooks/useSceneEnvironment";
import { shopLightPositions } from "../objects/building/buildingLayout";
import { useDioramaStore } from "../store/dioramaStore";
import type { DioramaObject } from "../types/diorama.types";
import { buildingParamsOf } from "../utils/objectParams";
import { getWorldMatrix, indexObjects } from "../utils/sceneGraph";

/** Every point light costs each lit pixel a little; a street corner needs only a few. */
export const MAX_GLOW_LIGHTS = 8;

/** A light of the pool that no object uses, and every light by day: there, but dark. */
const UNUSED: GlowLight = { position: [0, 0, 0], color: "#000000", intensity: 0, distance: 1 };

/** The lights an object gives off after dark, in its own frame. */
function glowsOf(object: DioramaObject): GlowLight[] {
  const building = buildingParamsOf(object);
  if (building) return shopLightPositions(building).map((position) => ({ ...SHOP_GLOW, position }));
  const glow = ASSET_REGISTRY[object.type].glow;
  return glow ? [glow] : [];
}

/** World-space lights of the scene: shops first, so a crowded scene keeps them. */
function collectLights(objects: DioramaObject[]): GlowLight[] {
  const byId = indexObjects(objects);
  const isShown = (object: DioramaObject) => object.visible && (!object.parentId || byId.get(object.parentId)?.visible !== false);
  const lights: GlowLight[] = [];
  const point = new Vector3();
  for (const pass of ["building", "other"] as const) {
    for (const object of objects) {
      if ((object.type === "building") !== (pass === "building") || !isShown(object)) continue;
      const glows = glowsOf(object);
      if (!glows.length) continue;
      const matrix = getWorldMatrix(object, byId);
      for (const glow of glows) {
        if (lights.length >= MAX_GLOW_LIGHTS) return lights;
        lights.push({ ...glow, position: point.set(...glow.position).applyMatrix4(matrix).toArray() });
      }
    }
  }
  return lights;
}

/**
 * Evening and night: warm light spilling from shopfronts and the cold glow
 * of vending machines. A pool of shadowless point lights, placed from the
 * scene's objects — nothing is stored.
 *
 * The pool always holds MAX_GLOW_LIGHTS lights, dark by day and dark where
 * no object needs one. The number of lights is part of every lit shader:
 * a pool that came and went would recompile them all — a freeze of a second
 * or two on the first evening, and again for every vending machine added
 * after dark. Eight dark lights cost a few percent of fill rate instead.
 */
export function SceneGlowLights() {
  const { glow } = useTimeOfDayLook();
  const objects = useDioramaStore((s) => s.objects);
  const lights = useMemo(() => (glow > 0 ? collectLights(objects) : []), [glow, objects]);

  return (
    <>
      {Array.from({ length: MAX_GLOW_LIGHTS }, (_, i) => {
        const light = lights[i] ?? UNUSED;
        return (
          <pointLight
            key={i}
            position={light.position}
            color={light.color}
            intensity={light.intensity * glow}
            distance={light.distance}
            decay={2}
          />
        );
      })}
    </>
  );
}
