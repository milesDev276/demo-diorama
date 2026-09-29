import { DIORAMA_COLORS } from "../utils/palette";

/**
 * Low-poly procedural rock: a small cluster of two flat-shaded
 * dodecahedrons. No external assets — geometry only.
 */
export function Rock() {
  return (
    <group>
      <mesh position={[0, 0.22, 0]} rotation={[0.3, 0.6, 0.1]} scale={[1, 0.8, 1]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial color={DIORAMA_COLORS.rock} roughness={1} flatShading />
      </mesh>

      <mesh position={[0.22, 0.12, 0.1]} rotation={[0.1, 1.2, 0.4]} scale={[0.7, 0.55, 0.7]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial color={DIORAMA_COLORS.rockDark} roughness={1} flatShading />
      </mesh>
    </group>
  );
}
