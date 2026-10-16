import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Path, Shape, type Mesh, type MeshBasicMaterial } from "three";
import { DIORAMA_COLORS } from "../utils/palette";

interface SelectionRingProps {
  /** Locked objects get a muted, cooler ring so selection state reads as "safe to click, not to drag". */
  locked?: boolean;
  /** Outer radius in meters (before the object's own scale) — sized per asset footprint. */
  radius?: number;
  /** Distance between the centers of the two round ends, along X: a run's ring is stretched to its length. */
  length?: number;
}

/** A stadium outline: two half circles `length` apart, joined by straight sides. */
function stadium(path: Path, radius: number, length: number, reverse: boolean) {
  const half = length / 2;
  const turn = reverse ? -1 : 1;
  path.absarc(half, 0, radius, -turn * Math.PI / 2, turn * Math.PI / 2, reverse);
  path.absarc(-half, 0, radius, turn * Math.PI / 2, turn * Math.PI * 1.5, reverse);
  path.closePath();
}

/** The flat band of a stretched ring, in the XY plane (laid down like the round one). */
function useStadiumShape(radius: number, length: number): Shape | null {
  return useMemo(() => {
    if (length <= 0) return null;
    const shape = new Shape();
    stadium(shape, radius, length, false);
    const hole = new Path();
    stadium(hole, radius * 0.86, length, true);
    shape.holes.push(hole);
    return shape;
  }, [radius, length]);
}

/**
 * A soft glowing ring drawn under the selected object. Gently pulses so
 * selection reads clearly without being distracting.
 */
export function SelectionRing({ locked = false, radius = 0.9, length = 0 }: SelectionRingProps) {
  const meshRef = useRef<Mesh>(null);
  const color = locked ? DIORAMA_COLORS.locked : DIORAMA_COLORS.selection;
  const stretched = useStadiumShape(radius, length);

  useFrame(({ clock }) => {
    const material = meshRef.current?.material as MeshBasicMaterial | undefined;
    if (!material) return;
    material.opacity = 0.55 + Math.sin(clock.elapsedTime * 2.5) * 0.2;
  });

  return (
    <mesh ref={meshRef} position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {stretched ? <shapeGeometry args={[stretched, 12]} /> : <ringGeometry args={[radius * 0.86, radius, 32]} />}
      <meshBasicMaterial color={color} transparent opacity={0.7} depthWrite={false} />
    </mesh>
  );
}
