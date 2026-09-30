import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh, MeshBasicMaterial } from "three";
import { DIORAMA_COLORS } from "../utils/palette";

interface SelectionRingProps {
  /** Locked objects get a muted, cooler ring so selection state reads as "safe to click, not to drag". */
  locked?: boolean;
  /** Outer radius in the object's local units — sized per asset footprint. */
  radius?: number;
}

/**
 * A soft glowing ring drawn under the selected object. Gently pulses so
 * selection reads clearly without being distracting.
 */
export function SelectionRing({ locked = false, radius = 0.9 }: SelectionRingProps) {
  const meshRef = useRef<Mesh>(null);
  const color = locked ? DIORAMA_COLORS.locked : DIORAMA_COLORS.selection;

  useFrame(({ clock }) => {
    const material = meshRef.current?.material as MeshBasicMaterial | undefined;
    if (!material) return;
    material.opacity = 0.55 + Math.sin(clock.elapsedTime * 2.5) * 0.2;
  });

  return (
    <mesh ref={meshRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius * 0.86, radius, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.7} depthWrite={false} />
    </mesh>
  );
}
