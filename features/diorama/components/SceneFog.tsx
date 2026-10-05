"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Fog, Vector3 } from "three";
import { useTimeOfDayLook } from "../hooks/useSceneEnvironment";

/**
 * Soft haze on the far edge of the diorama — or, in fog, over most of it —
 * in the middle color of the sky. Its distances are the look's `haze`, measured from the orbit target rather than the camera, so the
 * orthographic editing camera and the more distant perspective Preview
 * camera fade the scene the same way.
 */
export function SceneFog() {
  const fogRef = useRef<Fog>(null);
  const look = useTimeOfDayLook();

  useFrame(({ camera, controls }) => {
    const fog = fogRef.current;
    const target = (controls as { target?: Vector3 } | null)?.target;
    if (!fog || !target) return;
    const distance = camera.position.distanceTo(target);
    fog.near = distance + look.haze.start;
    fog.far = distance + look.haze.end;
  });

  return <fog ref={fogRef} attach="fog" args={[look.sky.middle, 90, 162]} />;
}
