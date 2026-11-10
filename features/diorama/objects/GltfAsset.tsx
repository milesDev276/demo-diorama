"use client";

import { Component, Suspense, useEffect, type ReactNode } from "react";
import { Clone, useGLTF } from "@react-three/drei";
import type { Material, Mesh, Object3D } from "three";
import { DIORAMA_COLORS } from "../utils/palette";
import { LOADING_GHOST } from "../utils/editorHelpers";
import {
  castsShadow,
  getPaintMaterial,
  getSignMaterial,
  getSlotMaterial,
  GLASS_RENDER_ORDER,
  releaseSignMaterial,
  retainSignMaterial,
} from "./materials";
import type { SignCell } from "./textures/graphicsAtlas";

/** A sign with a text of its own (registry `sign`, DioramaObject `text`). */
export interface CustomSign {
  cell: SignCell;
  text: string;
}

type Templates = WeakMap<Object3D, Map<string, Object3D>>;

/** Render-ready copies of each loaded GLB, one per paint color: shared slot
 *  materials, shadows on. Built from clones, so useGLTF's cached scene is
 *  never mutated. Copies with a custom sign are kept under its material, so
 *  they go once the sign is released. */
const templates: Templates = new WeakMap();
const signTemplates = new WeakMap<Material, Templates>();

/** What Clone copies from a template mesh. */
const CLONE_KEYS = ["name", "visible", "geometry", "material", "position", "rotation", "scale", "castShadow", "receiveShadow", "renderOrder", "userData"];

function templateFor(scene: Object3D, paint: string | undefined, sign: Material | null): Object3D {
  let byScene = templates;
  if (sign) {
    byScene = signTemplates.get(sign) ?? new WeakMap();
    signTemplates.set(sign, byScene);
  }
  const byPaint = byScene.get(scene) ?? new Map<string, Object3D>();
  byScene.set(scene, byPaint);
  let template = byPaint.get(paint ?? "");
  if (!template) {
    template = scene.clone(true);
    template.traverse((child) => {
      const mesh = child as Mesh;
      if (!mesh.isMesh) return;
      const slot = (mesh.material as Material).name;
      mesh.material =
        slot === "paint" && paint ? getPaintMaterial(paint) : slot === "printed" && sign ? sign : getSlotMaterial(slot);
      mesh.castShadow = castsShadow(slot);
      mesh.receiveShadow = true;
      if (slot === "glass") mesh.renderOrder = GLASS_RENDER_ORDER;
    });
    byPaint.set(paint ?? "", template);
  }
  return template;
}

/** The material of a custom sign, held while the component is mounted. */
function useSignMaterial(sign: CustomSign | undefined) {
  const cell = sign?.cell;
  const text = sign?.text;
  const material = cell && text ? getSignMaterial(cell, text) : null;
  useEffect(() => {
    if (!cell || !text || !material) return;
    retainSignMaterial(cell, text, material);
    return () => releaseSignMaterial(cell, text);
  }, [cell, text, material]);
  return material;
}

interface ModelProps {
  url: string;
  paint?: string;
  sign?: CustomSign;
}

function Model({ url, paint, sign }: ModelProps) {
  const { scene } = useGLTF(url);
  const signMaterial = useSignMaterial(sign);
  // Shadow flags come from the template: Clone's own props would switch them on for glass too.
  return <Clone object={templateFor(scene, paint, signMaterial)} keys={CLONE_KEYS} />;
}

/** Faint stand-in while a model loads, or — tinted — when it failed to. Sized from the footprint. */
function AssetGhost({ radius, failed = false }: { radius: number; failed?: boolean }) {
  const height = Math.max(0.5, radius);
  return (
    <mesh position={[0, height / 2, 0]} userData={failed ? {} : LOADING_GHOST}>
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
  /** "#rrggbb" for the faces of the `paint` slot. */
  paint?: string;
  /** Text for the `printed` faces, when it is not the sign's own. */
  sign?: CustomSign;
}

/**
 * A Blender GLB asset (meters, origin at the ground contact point). Each
 * instance suspends on its own, so a loading or broken model shows a ghost
 * in place instead of blanking the scene.
 */
export function GltfAsset({ url, footprintRadius, paint, sign }: GltfAssetProps) {
  return (
    <ModelErrorBoundary url={url} fallback={<AssetGhost radius={footprintRadius} failed />}>
      <Suspense fallback={<AssetGhost radius={footprintRadius} />}>
        <Model url={url} paint={paint} sign={sign} />
      </Suspense>
    </ModelErrorBoundary>
  );
}
