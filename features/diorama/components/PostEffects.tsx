"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, N8AO, TiltShift2, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode, type Effect, type EffectComposer as EffectComposerImpl } from "postprocessing";
import { Vector3 } from "three";
import { useTimeOfDayLook } from "../hooks/useSceneEnvironment";
import { useDioramaStore } from "../store/dioramaStore";
import { DEFAULT_PHOTO_SETTINGS } from "../utils/photo";
import { PhotoStudio } from "./PhotoStudio";
import { SkyBackdropEffect } from "./SkyBackdropEffect";

/** Height of the sharp band when nothing was clicked: the middle of the frame. */
const DEFAULT_FOCUS_HEIGHT = 0.5;

/**
 * Preview-only effect stack that sells the "photographed miniature" look:
 * contact AO, a restrained bloom on emissive windows and signs, and a
 * tilt-shift band of focus that follows the photo's focus point.
 *
 * Order matters. The composer disables the renderer's own tone mapping, so
 * Neutral tone mapping is applied here, after AO and bloom (which need HDR values). The sky
 * is then composited underneath so the frame is opaque before the blur.
 */
export function PostEffects() {
  const look = useTimeOfDayLook();
  const composerRef = useRef<EffectComposerImpl | null>(null);
  const tiltRef = useRef<Effect | null>(null);
  // A callback ref: the effect wrapper serializes its props, and an object ref would drag the effect along.
  const setTilt = useCallback((effect: Effect | null) => {
    tiltRef.current = effect;
  }, []);
  const skyBackdrop = useMemo(() => new SkyBackdropEffect(), []);
  useEffect(() => () => skyBackdrop.dispose(), [skyBackdrop]);
  useEffect(() => skyBackdrop.setSky(look.sky), [skyBackdrop, look]);

  // The focus band and its strength go straight to the shader: changing the
  // effect's props would rebuild the whole pass on every slider step.
  const projected = useMemo(() => new Vector3(), []);
  useFrame(({ camera }) => {
    const uniforms = tiltRef.current?.uniforms;
    if (!uniforms) return;
    const { focus, blur } = useDioramaStore.getState().photo;
    let height = DEFAULT_FOCUS_HEIGHT;
    if (focus) height = Math.min(1, Math.max(0, (projected.set(...focus).project(camera).y + 1) / 2));
    (uniforms.get("start")!.value as number[])[1] = height;
    (uniforms.get("end")!.value as number[])[1] = height;
    uniforms.get("blur")!.value = blur;
  });

  return (
    <>
      <EffectComposer ref={composerRef} multisampling={4}>
        <N8AO aoRadius={1.5} distanceFalloff={1} intensity={2.5} quality="medium" halfRes />
        <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.3} intensity={0.35} />
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
        <primitive object={skyBackdrop} />
        <TiltShift2
          ref={setTilt}
          blur={DEFAULT_PHOTO_SETTINGS.blur}
          taper={0.35}
          start={[0, DEFAULT_FOCUS_HEIGHT]}
          end={[1, DEFAULT_FOCUS_HEIGHT]}
          samples={10}
        />
      </EffectComposer>
      <PhotoStudio composerRef={composerRef} />
    </>
  );
}
