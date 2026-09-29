import { DIORAMA_COLORS } from "../utils/palette";
import { ISLAND_RADIUS } from "../utils/objectDefaults";

/**
 * The Diorama's ground: a small stylized floating island rather than a flat
 * infinite plane. A grass "puck" sits on top of a tapered dirt base so the
 * whole thing reads as a miniature object, not a game-dev grid.
 */
export function Ground() {
  return (
    <group>
      {/* Grass top — objects rest on this surface (y = 0) */}
      <mesh position={[0, -0.25, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[ISLAND_RADIUS, ISLAND_RADIUS, 0.5, 8]} />
        <meshStandardMaterial
          color={DIORAMA_COLORS.grassTop}
          roughness={0.95}
          flatShading
        />
      </mesh>

      {/* Tapered dirt underside — gives the island a floating, handcrafted feel */}
      <mesh position={[0, -1.05, 0]} receiveShadow castShadow>
        <cylinderGeometry
          args={[ISLAND_RADIUS * 0.82, ISLAND_RADIUS * 0.5, 1.1, 8]}
        />
        <meshStandardMaterial color={DIORAMA_COLORS.dirt} roughness={1} flatShading />
      </mesh>
    </group>
  );
}
