"use client";

import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { Color, Matrix4, Quaternion, Vector3, type BufferGeometry, type InstancedMesh, type Mesh, type Object3D } from "three";
import type { AssetComponentProps, ScatterParams, Vector3Tuple } from "../../types/diorama.types";
import { SCATTER_KIND_SPECS } from "../../assets/scatterKinds";
import { useSeasonLook } from "../../hooks/useSceneEnvironment";
import { scatterParamsOf } from "../../utils/objectParams";
import { ModelErrorBoundary } from "../GltfAsset";
import { getSlotMaterial } from "../materials";
import { pieceVariation } from "./scatterVariation";

const UP = new Vector3(0, 1, 0);

/** The single geometry of a scatter piece GLB (one `base` slot). */
function pieceGeometry(scene: Object3D): BufferGeometry | null {
  let geometry: BufferGeometry | null = null;
  scene.traverse((child) => {
    const mesh = child as Mesh;
    if (!geometry && mesh.isMesh) geometry = mesh.geometry;
  });
  return geometry;
}

/** Instance buffers grow in powers of two, so painting does not recreate the mesh for every new piece. */
function capacityFor(count: number): number {
  return Math.max(16, 2 ** Math.ceil(Math.log2(Math.max(1, count))));
}

function ScatterInstances({ params, tint }: { params: ScatterParams; tint: Vector3Tuple }) {
  const spec = SCATTER_KIND_SPECS[params.kind];
  const { scene } = useGLTF(spec.modelUrl);
  const geometry = useMemo(() => pieceGeometry(scene), [scene]);
  const meshRef = useRef<InstancedMesh>(null);
  const capacity = capacityFor(params.points.length);

  // Matrices are rebuilt when the points or the seed change — never per frame.
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const matrix = new Matrix4();
    const rotation = new Quaternion();
    const scale = new Vector3();
    const position = new Vector3();
    const color = new Color();
    params.points.forEach((point, i) => {
      const piece = pieceVariation(params.seed, point, spec);
      rotation.setFromAxisAngle(UP, piece.yaw);
      scale.setScalar(piece.scale);
      matrix.compose(position.set(...point), rotation, scale);
      mesh.setMatrixAt(i, matrix);
      mesh.setColorAt(i, color.setRGB(...tint).multiplyScalar(piece.brightness));
    });
    mesh.count = params.points.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    // Bounds over the instances, for frustum culling, click picking and framing.
    mesh.computeBoundingSphere();
    mesh.computeBoundingBox();
  }, [params.points, params.seed, spec, capacity, geometry, tint]);

  if (!geometry) return null;
  return (
    <instancedMesh
      key={capacity}
      ref={meshRef}
      args={[geometry, getSlotMaterial("base"), capacity]}
      castShadow={spec.castShadow}
      receiveShadow
    />
  );
}

/**
 * A scatter layer: every piece of one kind (fallen leaves, grass, pebbles,
 * weeds) as one InstancedMesh — one draw call however many pieces. Heading,
 * size and brightness per piece come from objects/scatter/scatterVariation;
 * the season tints the pieces, and in a season without fallen leaves a leaf
 * layer stays in the scene but is not drawn.
 */
export function ScatterLayer({ object }: AssetComponentProps) {
  const season = useSeasonLook();
  const params = scatterParamsOf(object);
  const tint = params ? season.scatter[params.kind] : null;
  if (!params || !tint) return null;
  const url = SCATTER_KIND_SPECS[params.kind].modelUrl;
  return (
    <ModelErrorBoundary url={url} fallback={null}>
      <Suspense fallback={null}>
        <ScatterInstances params={params} tint={tint} />
      </Suspense>
    </ModelErrorBoundary>
  );
}
