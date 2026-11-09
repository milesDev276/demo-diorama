import { useCallback, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type * as THREE from "three";
import type { OrthoPose } from "../utils/cameraFit";

/** After a diorama opens fitted, how long the fit keeps following models that arrive late (ms), and how often it looks. */
const SETTLE_MS = 5000;
const POLL_MS = 400;
/** A late model must change the fit by more than this share of the zoom, or this many meters of target, to move the camera. */
const ZOOM_TOLERANCE = 0.005;
const TARGET_TOLERANCE = 0.02;

interface OpeningFitRefs {
  orthoRef: RefObject<THREE.OrthographicCamera | null>;
  controlsRef: RefObject<OrbitControlsImpl | null>;
  /** Nothing is checked while a glide is under way. */
  transitionRef: RefObject<unknown>;
  fittedRef: RefObject<boolean>;
}

/**
 * The view a diorama opens in when it has no saved view
 * (plan/Stage-21-Implementation.md D1): its first frame with a canvas size
 * is fitted at once (not recorded), and for a few seconds after that — and
 * after `follow()` — the fit is checked again now and then, so models that
 * load late are not left outside; a changed fit is reached with `glideTo`.
 * It stops as soon as the view is no longer fitted (a gesture) or `stop()`.
 */
export function useOpeningFit(
  camera: THREE.Camera,
  { orthoRef, controlsRef, transitionRef, fittedRef }: OpeningFitRefs,
  orthoFit: (direction: THREE.Vector3, distance: number) => OrthoPose | null,
  glideTo: (pose: OrthoPose) => void,
  fitFirstFrame: boolean
): { follow: () => void; stop: () => void } {
  const pendingRef = useRef(fitFirstFrame);
  const settleRef = useRef({ until: 0, lastPoll: 0 });

  const follow = useCallback(() => {
    const now = performance.now();
    settleRef.current = { until: now + SETTLE_MS, lastPoll: now };
  }, []);
  const stop = useCallback(() => {
    settleRef.current.until = 0;
  }, []);

  useFrame(() => {
    const ortho = orthoRef.current;
    const controls = controlsRef.current;
    if (!ortho || !controls || camera !== ortho) return;
    const fitHere = () => orthoFit(ortho.position.clone().sub(controls.target), ortho.position.distanceTo(controls.target));

    if (pendingRef.current) {
      // Until the canvas has a size there is nothing to fit to; try again next frame.
      const pose = fitHere();
      if (!pose) return;
      pendingRef.current = false;
      ortho.position.copy(pose.position);
      ortho.zoom = pose.zoom;
      ortho.updateProjectionMatrix();
      controls.target.copy(pose.target);
      controls.update();
      fittedRef.current = true;
      follow();
      return;
    }

    const settle = settleRef.current;
    const now = performance.now();
    if (now >= settle.until || now - settle.lastPoll < POLL_MS || transitionRef.current) return;
    settle.lastPoll = now;
    if (!fittedRef.current) {
      settle.until = 0;
      return;
    }
    const pose = fitHere();
    if (pose && (Math.abs(pose.zoom / ortho.zoom - 1) > ZOOM_TOLERANCE || pose.target.distanceTo(controls.target) > TARGET_TOLERANCE)) {
      glideTo(pose);
    }
  });

  return { follow, stop };
}
