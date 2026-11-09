"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { useDioramaStore } from "../store/dioramaStore";
import { CAMERA_PRESETS, CAMERA_ZOOM_RANGE, DEFAULT_CAMERA_TARGET } from "../utils/cameraPresets";
import { getBaseTemplate } from "../utils/baseTemplates";
import { fitView, orthoFitView, sceneFit, type OrthoPose } from "../utils/cameraFit";
import { useFrameDolly } from "../hooks/useFrameDolly";
import { useCanvasResizeZoom } from "../hooks/useCanvasResizeZoom";
import { useOpeningFit } from "../hooks/useOpeningFit";
import type { CameraPreset, DioramaCameraState, Vector3Tuple } from "../types/diorama.types";

/** Vertical field of view of the Preview camera — narrow, like a lens photographing a model. */
const PREVIEW_FOV = 24;

const { min: MIN_ZOOM, max: MAX_ZOOM } = CAMERA_ZOOM_RANGE;

/** Orbit distance limits (meters), shared by OrbitControls and Fit. */
const DISTANCE_RANGE = { min: 8, max: 400 } as const;

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
 * camera and OrbitControls, plus an imperative API (presets, Fit, focus)
 * registered into the store so toolbar buttons and keyboard shortcuts can
 * drive the camera without the store ever holding a live, per-frame position.
 *
 * The scene remembers one view (plan/Stage-14-Implementation.md D6): the rig
 * opens on it, goes to it when another scene is opened, and records it
 * again each time the camera comes to rest after a gesture or a preset.
 *
 * The presets, Fit and a diorama opened without a view frame the whole
 * diorama in the canvas (plan/Stage-21-Implementation.md D1); such a view
 * stays fitted through canvas size changes until the user changes it (D2).
 */
export function CameraControls() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const orthoRef = useRef<THREE.OrthographicCamera>(null);
  const perspectiveRef = useRef<THREE.PerspectiveCamera>(null);
  const transitionRef = useRef<Transition | null>(null);
  const previousCameraRef = useRef<THREE.Camera | null>(null);
  const previewEntryRef = useRef<PreviewEntry | null>(null);
  const camera = useThree((s) => s.camera);
  const getThree = useThree((s) => s.get);
  const size = useThree((s) => s.size);
  const isPreviewMode = useDioramaStore((s) => s.isPreviewMode);
  // The same base and size always give the same template object (getBaseTemplate).
  const template = useDioramaStore((s) => getBaseTemplate(s.environment));
  const registerCameraApi = useDioramaStore((s) => s.registerCameraApi);
  const setCamera = useDioramaStore((s) => s.setCamera);
  const cameraRevision = useDioramaStore((s) => s.cameraRevision);
  // What the editing camera is created with: the view the scene was saved in, else the
  // isometric preset. Later changes animate through the rig instead of jumping with a changed prop.
  // Without a saved view the first frame fits the diorama (useOpeningFit); the zoom here is a placeholder.
  const [initialView] = useState<DioramaCameraState>(
    () =>
      useDioramaStore.getState().camera ?? {
        position: CAMERA_PRESETS.isometric.position,
        target: DEFAULT_CAMERA_TARGET,
        zoom: 20,
      }
  );
  const [opensWithoutView] = useState(() => !useDioramaStore.getState().camera);
  // Whether the view is a fit the user has not changed since (D2).
  const fittedRef = useRef(false);
  const templateRef = useRef(template);
  useLayoutEffect(() => {
    templateRef.current = template;
  }, [template]);
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

  // A narrower photo frame moves the Preview camera back, so the shot keeps what it showed (Stage 20 D3).
  const resetFrameBase = useFrameDolly(camera, size, { controlsRef, perspectiveRef, transitionRef, previewEntryRef }, DISTANCE_RANGE.max);

  /** The orthographic view along `direction` (from the target toward the camera) that fits the diorama in the canvas now. */
  const orthoFit = useCallback(
    (direction: THREE.Vector3, distance: number): OrthoPose | null => {
      const ortho = orthoRef.current;
      const { scene, size: canvas } = getThree();
      if (!ortho || !canvas.width || !canvas.height) return null;
      const back = direction.clone().normalize();
      const view = orthoFitView(sceneFit(scene, templateRef.current), back, ortho.up, canvas.width, canvas.height);
      return {
        position: view.target.clone().addScaledVector(back, distance),
        target: view.target,
        zoom: THREE.MathUtils.clamp(view.zoom, MIN_ZOOM, MAX_ZOOM),
      };
    },
    [getThree]
  );

  /** Fits a fitted view to the canvas again at once; a glide toward a fit is retargeted instead. Not recorded. */
  const refit = useCallback(() => {
    const controls = controlsRef.current;
    const ortho = orthoRef.current;
    if (!controls || !ortho) return;
    const glide = transitionRef.current;
    if (glide) {
      const pose = orthoFit(glide.toPos.clone().sub(glide.toTarget), glide.toPos.distanceTo(glide.toTarget));
      if (!pose) return;
      glide.toPos.copy(pose.position);
      glide.toTarget.copy(pose.target);
      glide.toZoom = pose.zoom;
      return;
    }
    const pose = orthoFit(ortho.position.clone().sub(controls.target), ortho.position.distanceTo(controls.target));
    if (!pose) return;
    ortho.position.copy(pose.position);
    ortho.zoom = pose.zoom;
    ortho.updateProjectionMatrix();
    controls.target.copy(pose.target);
    controls.update();
  }, [orthoFit]);

  const resetResizeBase = useCanvasResizeZoom(camera, size, { orthoRef, transitionRef, fittedRef }, refit);

  /** Glides to a fit the user did not ask for (late models): not recorded. */
  const glideTo = useCallback(
    (pose: OrthoPose) => {
      const controls = controlsRef.current;
      if (!controls) return;
      transitionRef.current = {
        fromPos: camera.position.clone(),
        toPos: pose.position,
        fromTarget: controls.target.clone(),
        toTarget: pose.target,
        fromZoom: camera.zoom,
        toZoom: pose.zoom,
        start: performance.now(),
        duration: 450,
        record: false,
      };
    },
    [camera]
  );

  // A diorama without a saved view opens fitted, and the fit follows its models as they load (D1).
  const openingFit = useOpeningFit(camera, { orthoRef, controlsRef, transitionRef, fittedRef }, orthoFit, glideTo, opensWithoutView);

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

    /** Glides to the fit along `direction`; the view counts as fitted from now on. */
    function glideToFit(direction: THREE.Vector3, distance: number, duration: number, record: boolean) {
      const pose = orthoFit(direction, distance);
      if (!pose) return;
      fittedRef.current = true;
      resetResizeBase();
      startTransition(pose.position.toArray(), pose.target.toArray(), pose.zoom, duration, record);
    }

    function applyPreset(preset: CameraPreset, record = true) {
      const position = new THREE.Vector3(...CAMERA_PRESETS[preset].position);
      glideToFit(position, position.length(), 550, record);
    }

    registerCameraApi({
      setPreset: applyPreset,
      focusOn: (positions) => {
        const controls = controlsRef.current;
        if (!controls || !positions.length) return;
        fittedRef.current = false;
        resetResizeBase();

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
      fitScene: () => {
        const controls = controlsRef.current;
        const perspective = perspectiveRef.current;
        const ortho = orthoRef.current;
        if (!controls || !perspective || !ortho) return;
        if (camera === ortho) {
          // The editing camera: from the current direction, at the distance it stands at.
          glideToFit(ortho.position.clone().sub(controls.target), ortho.position.distanceTo(controls.target), 450, true);
          return;
        }
        if (camera !== perspective) return;
        // Preview's camera fits the photo's frame; the editing view is no longer a fit of the canvas.
        fittedRef.current = false;
        const direction = camera.position.clone().sub(controls.target);
        if (direction.lengthSq() === 0) direction.set(1, 1, 1);
        direction.normalize();
        const view = fitView(sceneFit(getThree().scene, template), direction, camera.up, perspective.fov, perspective.aspect);
        const distance = THREE.MathUtils.clamp(view.distance, DISTANCE_RANGE.min, DISTANCE_RANGE.max);
        const position = view.target.clone().addScaledVector(direction, distance);
        resetFrameBase();
        startTransition(position.toArray(), view.target.toArray(), camera.zoom, 450);
      },
    });

    if (openedRevisionRef.current !== cameraRevision) {
      // Another scene was opened: go to its view, or frame it if it has none. That is not the user framing it.
      openedRevisionRef.current = cameraRevision;
      framedTemplateRef.current = template;
      const view = useDioramaStore.getState().camera;
      if (view) {
        fittedRef.current = false;
        resetResizeBase();
        startTransition(view.position, view.target, view.zoom, 450, false);
      } else {
        applyPreset("isometric", false);
        // Its models are still loading: keep the fit following them for a while.
        openingFit.follow();
      }
    } else if (framedTemplateRef.current !== template) {
      // A different base, or a plot of another size: reframe it with its own presets.
      framedTemplateRef.current = template;
      applyPreset("isometric");
    }

    return () => registerCameraApi(null);
  }, [camera, template, cameraRevision, registerCameraApi, getThree, resetFrameBase, orthoFit, resetResizeBase, openingFit]);

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
          fittedRef.current = false;
          openingFit.stop();
          resetFrameBase();
          resetResizeBase();
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
        minDistance={DISTANCE_RANGE.min}
        maxDistance={DISTANCE_RANGE.max}
      />
    </>
  );
}
