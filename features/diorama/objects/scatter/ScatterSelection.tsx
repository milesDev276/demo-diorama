"use client";

import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Matrix4, Quaternion, Vector3, type InstancedMesh, type MeshBasicMaterial } from "three";
import type { ScatterParams } from "../../types/diorama.types";
import { DIORAMA_COLORS } from "../../utils/palette";

const FLAT = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2);

/**
 * Selection marker of a scatter layer: a small ring under every piece. A
 * single ring around a layer's origin would have to span the whole layer,
 * which can reach across the base.
 */
export function ScatterSelection({ params, locked = false }: { params: ScatterParams; locked?: boolean }) {
  const meshRef = useRef<InstancedMesh>(null);
  const materialRef = useRef<MeshBasicMaterial>(null);
  const capacity = Math.max(16, 2 ** Math.ceil(Math.log2(Math.max(1, params.points.length))));

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const matrix = new Matrix4();
    const scale = new Vector3(1, 1, 1);
    const position = new Vector3();
    params.points.forEach((point, i) => {
      mesh.setMatrixAt(i, matrix.compose(position.set(point[0], point[1] + 0.02, point[2]), FLAT, scale));
    });
    mesh.count = params.points.length;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [params.points, capacity]);

  useFrame(({ clock }) => {
    const material = materialRef.current;
    if (!material) return;
    material.opacity = 0.6 + Math.sin(clock.elapsedTime * 2.5) * 0.2;
  });

  return (
    <instancedMesh key={capacity} ref={meshRef} args={[undefined, undefined, capacity]} raycast={() => null}>
      <ringGeometry args={[0.11, 0.16, 16]} />
      <meshBasicMaterial ref={materialRef} color={locked ? DIORAMA_COLORS.locked : DIORAMA_COLORS.selection} transparent depthWrite={false} />
    </instancedMesh>
  );
}
