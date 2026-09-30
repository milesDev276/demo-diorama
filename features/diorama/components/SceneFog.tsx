"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Fog, Vector3 } from "three";
import { DIORAMA_COLORS } from "../utils/palette";
/** Haze starts this far (meters) past the orbit target and is complete this far past it. */
const FOG_START = 11;
const FOG_END = 83;

/**
 * Soft haze on the far edge of the diorama. Measured from the orbit target
 * rather than the camera, so the orthographic editing camera and the more
 * distant perspective Preview camera fade the scene the same way.
 */
export function SceneFog() {
  const fogRef = useRef<Fog>(null);

  useFrame(({ camera, controls }) => {
    const fog = fogRef.current;
    const target = (controls as { target?: Vector3 } | null)?.target;
    if (!fog || !target) return;
    const distance = camera.position.distanceTo(target);
    fog.near = distance + FOG_START;
    fog.far = distance + FOG_END;
  });

  return <fog ref={fogRef} attach="fog" args={[DIORAMA_COLORS.skyMiddle, 90, 162]} />;
}
