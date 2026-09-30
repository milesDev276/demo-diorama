"use client";

import { useEffect, useMemo } from "react";
import { Bloom, EffectComposer, N8AO, TiltShift2, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { SkyBackdropEffect } from "./SkyBackdropEffect";

/**
 * Preview-only effect stack that sells the "photographed miniature" look:
 * contact AO, a restrained bloom on emissive windows and signs, and a
 * tilt-shift band of focus across the middle of the frame.
 *
 * Order matters. The composer disables the renderer's own tone mapping, so
 * Neutral tone mapping is applied here, after AO and bloom (which need HDR values). The sky
 * is then composited underneath so the frame is opaque before the blur.
 */
export function PostEffects() {
  const skyBackdrop = useMemo(() => new SkyBackdropEffect(), []);
  useEffect(() => () => skyBackdrop.dispose(), [skyBackdrop]);

  return (
    <EffectComposer multisampling={4}>
      <N8AO aoRadius={1.5} distanceFalloff={1} intensity={2.5} quality="medium" halfRes />
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.3} intensity={0.35} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <primitive object={skyBackdrop} />
      <TiltShift2 blur={0.12} taper={0.35} start={[0, 0.5]} end={[1, 0.5]} samples={10} />
    </EffectComposer>
  );
}
