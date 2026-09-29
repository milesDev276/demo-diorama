"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { useDioramaStore } from "../store/dioramaStore";
import { CAMERA_PRESETS, DEFAULT_CAMERA_TARGET } from "../utils/cameraPresets";
import type { CameraPreset, Vector3Tuple } from "../types/diorama.types";

interface Transition {
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
  fromZoom: number;
  toZoom: number;
  start: number;
  duration: number;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Owns OrbitControls plus an imperative camera rig (presets, reset, focus)
 * registered into the store so toolbar buttons and keyboard shortcuts can
 * drive the camera without the store ever holding a live, per-frame position.
 */
export function CameraControls() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const transitionRef = useRef<Transition | null>(null);
  const { camera } = useThree();
  const registerCameraApi = useDioramaStore((s) => s.registerCameraApi);

  useEffect(() => {
    function startTransition(toPos: Vector3Tuple, toTarget: Vector3Tuple, toZoom: number, duration = 550) {
      const controls = controlsRef.current;
      if (!controls) return;
      transitionRef.current = {
        fromPos: camera.position.clone(),
        toPos: new THREE.Vector3(...toPos),
        fromTarget: controls.target.clone(),
        toTarget: new THREE.Vector3(...toTarget),
        fromZoom: camera.zoom,
        toZoom,
        start: performance.now(),
        duration,
      };
    }

    function applyPreset(preset: CameraPreset) {
      const config = CAMERA_PRESETS[preset];
      startTransition(config.position, DEFAULT_CAMERA_TARGET, config.zoom);
    }

    registerCameraApi({
      setPreset: applyPreset,
      resetCamera: () => applyPreset("isometric"),
      focusOn: (positions) => {
        const controls = controlsRef.current;
        if (!controls || !positions.length) return;

        const box = new THREE.Box3();
        positions.forEach((p) => box.expandByPoint(new THREE.Vector3(...p)));
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const radius = Math.max(1.5, size.length() / 2 + 1.5);

        const direction = camera.position.clone().sub(controls.target);
        if (direction.lengthSq() === 0) direction.set(1, 1, 1);
        direction.normalize();

        const distance = 13;
        const targetZoom = THREE.MathUtils.clamp(95 / radius, 32, 170);

        startTransition(
          [
            center.x + direction.x * distance,
            center.y + direction.y * distance,
            center.z + direction.z * distance,
          ],
          [center.x, center.y, center.z],
          targetZoom,
          450
        );
      },
    });

    return () => registerCameraApi(null);
  }, [camera, registerCameraApi]);

  // R3F's whole model is imperative mutation of Three.js objects each frame —
  // `camera` here is the live scene camera, not React-owned render state, so
  // the React Compiler immutability rule (written for plain React state) is a
  // false positive for this well-established camera-rig pattern.
  // eslint-disable-next-line react-hooks/immutability
  useFrame(() => {
    const transition = transitionRef.current;
    const controls = controlsRef.current;
    if (!transition || !controls) return;

    const elapsed = performance.now() - transition.start;
    const progress = Math.min(1, elapsed / transition.duration);
    const eased = easeOutCubic(progress);

    camera.position.lerpVectors(transition.fromPos, transition.toPos, eased);
    controls.target.lerpVectors(transition.fromTarget, transition.toTarget, eased);
    if ("zoom" in camera) {
      // eslint-disable-next-line react-hooks/immutability
      (camera as THREE.OrthographicCamera).zoom = THREE.MathUtils.lerp(
        transition.fromZoom,
        transition.toZoom,
        eased
      );
      (camera as THREE.OrthographicCamera).updateProjectionMatrix();
    }
    controls.update();

    if (progress >= 1) transitionRef.current = null;
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      target={DEFAULT_CAMERA_TARGET}
      enableDamping
      dampingFactor={0.08}
      minZoom={30}
      maxZoom={200}
      minPolarAngle={0.05}
      maxPolarAngle={Math.PI / 2 - 0.02}
      minDistance={4}
      maxDistance={26}
    />
  );
}
