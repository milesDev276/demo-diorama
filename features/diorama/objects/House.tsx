import { DIORAMA_COLORS } from "../utils/palette";

/**
 * Low-poly procedural house: box walls, a pyramid roof, a door and two
 * small glowing windows. No external assets — geometry only.
 */
export function House() {
  return (
    <group>
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 0.7, 0.9]} />
        <meshStandardMaterial color={DIORAMA_COLORS.wallCream} roughness={0.85} />
      </mesh>

      <mesh position={[0, 0.85, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.82, 0.55, 4]} />
        <meshStandardMaterial color={DIORAMA_COLORS.roof} roughness={0.7} flatShading />
      </mesh>

      <mesh position={[0, 0.16, 0.46]} castShadow>
        <boxGeometry args={[0.22, 0.32, 0.04]} />
        <meshStandardMaterial color={DIORAMA_COLORS.door} roughness={0.9} />
      </mesh>

      <mesh position={[-0.3, 0.4, 0.46]}>
        <boxGeometry args={[0.16, 0.16, 0.03]} />
        <meshStandardMaterial
          color={DIORAMA_COLORS.windowGlow}
          emissive={DIORAMA_COLORS.windowGlow}
          emissiveIntensity={0.6}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[0.3, 0.4, 0.46]}>
        <boxGeometry args={[0.16, 0.16, 0.03]} />
        <meshStandardMaterial
          color={DIORAMA_COLORS.windowGlow}
          emissive={DIORAMA_COLORS.windowGlow}
          emissiveIntensity={0.6}
          roughness={0.5}
        />
      </mesh>
    </group>
  );
}
