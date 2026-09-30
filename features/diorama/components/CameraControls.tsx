"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { useDioramaStore } from "../store/dioramaStore";
import { CAMERA_PRESETS, DEFAULT_CAMERA_TARGET } from "../utils/cameraPresets";
import type { CameraPreset, Vector3Tuple } from "../types/diorama.types";

/** Vertical field of view of the Preview camera — narrow, like a lens photographing a model. */
const PREVIEW_FOV = 24;

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

const isOrthographic = (camera: THREE.Camera): camera is THREE.OrthographicCamera =>
  (camera as THREE.OrthographicCamera).isOrthographicCamera === true;

const halfFovTan = (camera: THREE.PerspectiveCamera) => Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

/** How the editing view looked when Preview was entered. */
interface PreviewEntry {
  zoom: number;
  /** World-space height shown at the orbit target. */
  height: number;
}

/**
 * The camera rig: an orthographic editing camera, a perspective Preview
 * camera and OrbitControls, plus an imperative API (presets, reset, focus)
 * registered into the store so toolbar buttons and keyboard shortcuts can
 * drive the camera without the store ever holding a live, per-frame position.
 */
export function CameraControls() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const orthoRef = useRef<THREE.OrthographicCamera>(null);
  const perspectiveRef = useRef<THREE.PerspectiveCamera>(null);
  const transitionRef = useRef<Transition | null>(null);
  const targetRef = useRef(new THREE.Vector3(...DEFAULT_CAMERA_TARGET));
  const previousCameraRef = useRef<THREE.Camera | null>(null);
  const previewEntryRef = useRef<PreviewEntry | null>(null);
  const camera = useThree((s) => s.camera);
  const isPreviewMode = useDioramaStore((s) => s.isPreviewMode);
  const registerCameraApi = useDioramaStore((s) => s.registerCameraApi);

  // Switching between the editing and Preview cameras keeps the composition:
  // same orbit target, same viewing direction, same visible world height.
  // Leaving Preview restores the editing zoom, scaled only by how far the
  // user dollied in Preview — the canvas also resizes around this switch, so
  // zoom can't be recomputed from the frustum. OrbitControls is recreated
  // for the new camera, so its target is restored too. R3F's placeholder
  // camera from the first render is never matched from.
  useLayoutEffect(() => {
    const controls = controlsRef.current;
    const ortho = orthoRef.current;
    const perspective = perspectiveRef.current;
    const previous = previousCameraRef.current;
    previousCameraRef.current = camera;
    if (!controls || !ortho || !perspective) return;

    const target = targetRef.current;
    if (previous === ortho && camera === perspective) {
      transitionRef.current = null;
      const height = (ortho.top - ortho.bottom) / ortho.zoom;
      previewEntryRef.current = { zoom: ortho.zoom, height };
      const direction = ortho.position.clone().sub(target).normalize();
      perspective.position.copy(target).addScaledVector(direction, height / 2 / halfFovTan(perspective));
    } else if (previous === perspective && camera === ortho) {
      const direction = perspective.position.clone().sub(target).normalize();
      // An orthographic camera's distance only matters for clipping — keep it.
      const distance = ortho.position.distanceTo(target);
      ortho.position.copy(target).addScaledVector(direction, distance);
      const entry = previewEntryRef.current;
      if (entry) {
        const height = 2 * perspective.position.distanceTo(target) * halfFovTan(perspective);
        ortho.zoom = (entry.zoom * entry.height) / height;
        ortho.updateProjectionMatrix();
      }
    }
    controls.target.copy(target);
    controls.update();
  }, [camera]);

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
        const radius = Math.max(9, size.length() / 2 + 9);

        const direction = camera.position.clone().sub(controls.target);
        if (direction.lengthSq() === 0) direction.set(1, 1, 1);
        direction.normalize();

        const distance = 78;
        const targetZoom = THREE.MathUtils.clamp(95 / radius, 32 / 6, 170 / 6);

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
    const controls = controlsRef.current;
    if (!controls) return;
    const transition = transitionRef.current;

    if (transition) {
      const elapsed = performance.now() - transition.start;
      const progress = Math.min(1, elapsed / transition.duration);
      const eased = easeOutCubic(progress);

      camera.position.lerpVectors(transition.fromPos, transition.toPos, eased);
      controls.target.lerpVectors(transition.fromTarget, transition.toTarget, eased);
      // Presets and focus are editing tools; zoom only means "pixels per meter" on the ortho camera.
      if (isOrthographic(camera)) {
        // eslint-disable-next-line react-hooks/immutability
        camera.zoom = THREE.MathUtils.lerp(transition.fromZoom, transition.toZoom, eased);
        camera.updateProjectionMatrix();
      }
      controls.update();

      if (progress >= 1) transitionRef.current = null;
    }

    targetRef.current.copy(controls.target);
  });

  return (
    <>
      <OrthographicCamera
        ref={orthoRef}
        makeDefault={!isPreviewMode}
        position={CAMERA_PRESETS.isometric.position}
        zoom={CAMERA_PRESETS.isometric.zoom}
        near={0.6}
        far={600}
      />
      <PerspectiveCamera ref={perspectiveRef} makeDefault={isPreviewMode} fov={PREVIEW_FOV} near={0.5} far={1200} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={DEFAULT_CAMERA_TARGET}
        enableDamping
        dampingFactor={0.08}
        minZoom={5}
        maxZoom={200 / 6}
        minPolarAngle={0.05}
        maxPolarAngle={Math.PI / 2 - 0.02}
        minDistance={8}
        maxDistance={400}
      />
    </>
  );
}
