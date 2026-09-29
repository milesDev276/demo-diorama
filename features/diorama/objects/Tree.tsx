import { DIORAMA_COLORS } from "../utils/palette";

/**
 * Low-poly procedural tree: a trunk cylinder with two stacked cone layers
 * of foliage. No external assets — geometry only.
 */
export function Tree() {
  return (
    <group>
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.7, 6]} />
        <meshStandardMaterial color={DIORAMA_COLORS.trunk} roughness={0.9} />
      </mesh>

      <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.62, 0.9, 7]} />
        <meshStandardMaterial color={DIORAMA_COLORS.foliageDark} roughness={0.8} flatShading />
      </mesh>

      <mesh position={[0, 1.55, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.42, 0.75, 7]} />
        <meshStandardMaterial color={DIORAMA_COLORS.foliageLight} roughness={0.8} flatShading />
      </mesh>
    </group>
  );
}
