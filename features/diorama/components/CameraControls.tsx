"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { useDioramaStore } from "../store/dioramaStore";
import { CAMERA_PRESETS, CAMERA_ZOOM_RANGE, DEFAULT_CAMERA_TARGET } from "../utils/cameraPresets";
import { getBaseTemplate } from "../utils/baseTemplates";
import type { CameraPreset, DioramaCameraState, Vector3Tuple } from "../types/diorama.types";

/** Vertical field of view of the Preview camera — narrow, like a lens photographing a model. */
const PREVIEW_FOV = 24;

const { min: MIN_ZOOM, max: MAX_ZOOM } = CAMERA_ZOOM_RANGE;

/** The camera counts as at rest when it moved less than this (meters, and zoom) since the last frame. */
const REST_EPSILON = 1e-5;

const roundMm = (n: number) => Math.round(n * 1000) / 1000;
const roundPoint = (v: THREE.Vector3): Vector3Tuple => [roundMm(v.x), roundMm(v.y), roundMm(v.z)];

interface Transition {
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
  fromZoom: number;
  toZoom: number;
  start: number;
  duration: number;
  /** Whether the view it ends in is recorded as the view of the scene. */
  record: boolean;
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
 *
 * The scene remembers one view (plan/Stage-14-Implementation.md D6): the rig
 * opens on it, goes to it when another scene is opened, and records it
 * again each time the camera comes to rest after a gesture or a preset.
 */
export function CameraControls() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const orthoRef = useRef<THREE.OrthographicCamera>(null);
  const perspectiveRef = useRef<THREE.PerspectiveCamera>(null);
  const transitionRef = useRef<Transition | null>(null);
  const previousCameraRef = useRef<THREE.Camera | null>(null);
  const previewEntryRef = useRef<PreviewEntry | null>(null);
  const camera = useThree((s) => s.camera);
  const isPreviewMode = useDioramaStore((s) => s.isPreviewMode);
  // The same base and size always give the same template object (getBaseTemplate).
  const template = useDioramaStore((s) => getBaseTemplate(s.environment));
  const registerCameraApi = useDioramaStore((s) => s.registerCameraApi);
  const setCamera = useDioramaStore((s) => s.setCamera);
  const cameraRevision = useDioramaStore((s) => s.cameraRevision);
  // What the editing camera is created with: the view the scene was saved in, else the
  // isometric preset. Later changes animate through the rig instead of jumping with a changed prop.
  const [initialView] = useState<DioramaCameraState>(
    () =>
      useDioramaStore.getState().camera ?? {
        position: CAMERA_PRESETS.isometric.position,
        target: DEFAULT_CAMERA_TARGET,
        zoom: template.presetZoom.isometric,
      }
  );
  const targetRef = useRef(new THREE.Vector3(...initialView.target));
  const framedTemplateRef = useRef(template);
  const openedRevisionRef = useRef(cameraRevision);
  // Set while the camera is still gliding after a gesture or a transition; the view is recorded once it rests.
  const settlingRef = useRef(false);
  const lastPoseRef = useRef({ position: new THREE.Vector3(), target: new THREE.Vector3(), zoom: 0 });

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
    function startTransition(toPos: Vector3Tuple, toTarget: Vector3Tuple, toZoom: number, duration = 550, record = true) {
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
        record,
      };
    }

    function applyPreset(preset: CameraPreset, record = true) {
      startTransition(CAMERA_PRESETS[preset].position, DEFAULT_CAMERA_TARGET, template.presetZoom[preset], 550, record);
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
        const radius = Math.max(template.focusRadius, size.length() / 2 + template.focusRadius);

        const direction = camera.position.clone().sub(controls.target);
        if (direction.lengthSq() === 0) direction.set(1, 1, 1);
        direction.normalize();

        const distance = 78;
        const targetZoom = THREE.MathUtils.clamp(95 / radius, MIN_ZOOM, MAX_ZOOM);

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

    if (openedRevisionRef.current !== cameraRevision) {
      // Another scene was opened: go to its view, or frame it if it has none. That is not the user framing it.
      openedRevisionRef.current = cameraRevision;
      framedTemplateRef.current = template;
      const view = useDioramaStore.getState().camera;
      if (view) startTransition(view.position, view.target, view.zoom, 450, false);
      else applyPreset("isometric", false);
    } else if (framedTemplateRef.current !== template) {
      // A different base, or a plot of another size: reframe it with its own presets.
      framedTemplateRef.current = template;
      applyPreset("isometric");
    }

    return () => registerCameraApi(null);
  }, [camera, template, cameraRevision, registerCameraApi]);

  // The view as the editing camera sees it. In Preview that is the view leaving Preview would give.
  const recordView = () => {
    const controls = controlsRef.current;
    const ortho = orthoRef.current;
    const perspective = perspectiveRef.current;
    if (!controls || !ortho || !perspective) return;
    const target = controls.target;
    if (camera === ortho) {
      setCamera({ position: roundPoint(ortho.position), target: roundPoint(target), zoom: roundMm(ortho.zoom) });
      return;
    }
    const entry = previewEntryRef.current;
    if (camera !== perspective || !entry) return;
    const direction = perspective.position.clone().sub(target).normalize();
    const position = target.clone().addScaledVector(direction, ortho.position.distanceTo(targetRef.current));
    const height = 2 * perspective.position.distanceTo(target) * halfFovTan(perspective);
    const zoom = THREE.MathUtils.clamp((entry.zoom * entry.height) / height, MIN_ZOOM, MAX_ZOOM);
    setCamera({ position: roundPoint(position), target: roundPoint(target), zoom: roundMm(zoom) });
  };

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

      if (progress >= 1) {
        transitionRef.current = null;
        settlingRef.current = transition.record;
      }
    } else if (settlingRef.current) {
      // Damping keeps the camera gliding after the pointer lets go; record the view when it has stopped.
      const last = lastPoseRef.current;
      const atRest =
        last.position.distanceTo(camera.position) < REST_EPSILON &&
        last.target.distanceTo(controls.target) < REST_EPSILON &&
        Math.abs(last.zoom - camera.zoom) < REST_EPSILON;
      last.position.copy(camera.position);
      last.target.copy(controls.target);
      last.zoom = camera.zoom;
      if (atRest) {
        settlingRef.current = false;
        recordView();
      }
    }

    targetRef.current.copy(controls.target);
  });

  return (
    <>
      <OrthographicCamera
        ref={orthoRef}
        makeDefault={!isPreviewMode}
        position={initialView.position}
        zoom={initialView.zoom}
        near={0.6}
        far={600}
      />
      <PerspectiveCamera ref={perspectiveRef} makeDefault={isPreviewMode} fov={PREVIEW_FOV} near={0.5} far={1200} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={initialView.target}
        onStart={() => {
          settlingRef.current = false;
        }}
        onEnd={() => {
          settlingRef.current = true;
        }}
        enableDamping
        dampingFactor={0.08}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        minPolarAngle={0.05}
        maxPolarAngle={Math.PI / 2 - 0.02}
        minDistance={8}
        maxDistance={400}
      />
    </>
  );
}
