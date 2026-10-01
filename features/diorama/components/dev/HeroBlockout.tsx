"use client";

import { Clone, useGLTF } from "@react-three/drei";

const BLOCKOUT_URL = "/models/_dev/hero_blockout.glb";

/**
 * Dev-only: the gray-box hero scene from plan/Hero-Layout.md, exported by
 * art/blender/blockout/hero_blockout.py. Shown via `/diorama?dev=blockout`
 * on top of the corner base, as a composition, alignment and lighting
 * reference. Not scene data, not an asset.
 */
export function HeroBlockout() {
  const { scene } = useGLTF(BLOCKOUT_URL);
  return <Clone object={scene} castShadow receiveShadow />;
}
