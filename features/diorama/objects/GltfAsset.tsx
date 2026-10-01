"use client";

import { Component, Suspense, type ReactNode } from "react";
import { Clone, useGLTF } from "@react-three/drei";
import type { Material, Mesh, Object3D } from "three";
import { DIORAMA_COLORS } from "../utils/palette";
import { getSlotMaterial } from "./materials";

/** One render-ready copy per loaded GLB: shared slot materials, shadows on.
 *  Built from a clone, so useGLTF's cached scene is never mutated. */
const templates = new WeakMap<Object3D, Object3D>();

function templateFor(scene: Object3D): Object3D {
  let template = templates.get(scene);
  if (!template) {
    template = scene.clone(true);
    template.traverse((child) => {
      const mesh = child as Mesh;
      if (mesh.isMesh) mesh.material = getSlotMaterial((mesh.material as Material).name);
    });
    templates.set(scene, template);
  }
  return template;
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <Clone object={templateFor(scene)} castShadow receiveShadow />;
}

/** Faint stand-in while a model loads, or — tinted — when it failed to. Sized from the footprint. */
function AssetGhost({ radius, failed = false }: { radius: number; failed?: boolean }) {
  const height = Math.max(0.5, radius);
  return (
    <mesh position={[0, height / 2, 0]}>
      <cylinderGeometry args={[radius * 0.6, radius * 0.6, height, 16]} />
      <meshBasicMaterial
        color={failed ? DIORAMA_COLORS.signRed : DIORAMA_COLORS.sidewalkJoint}
        transparent
        opacity={failed ? 0.45 : 0.3}
        depthWrite={false}
      />
    </mesh>
  );
}

const reportedFailures = new Set<string>();

/** Keeps one broken model from taking the whole canvas down. */
export class ModelErrorBoundary extends Component<{ url: string; fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (reportedFailures.has(this.props.url)) return;
    reportedFailures.add(this.props.url);
    console.warn(`[diorama] Could not load model ${this.props.url}`, error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

interface GltfAssetProps {
  url: string;
  /** Asset footprint in meters; sizes the placeholder. */
  footprintRadius: number;
}

/**
 * A Blender GLB asset (meters, origin at the ground contact point). Each
 * instance suspends on its own, so a loading or broken model shows a ghost
 * in place instead of blanking the scene.
 */
export function GltfAsset({ url, footprintRadius }: GltfAssetProps) {
  return (
    <ModelErrorBoundary url={url} fallback={<AssetGhost radius={footprintRadius} failed />}>
      <Suspense fallback={<AssetGhost radius={footprintRadius} />}>
        <Model url={url} />
      </Suspense>
    </ModelErrorBoundary>
  );
}
