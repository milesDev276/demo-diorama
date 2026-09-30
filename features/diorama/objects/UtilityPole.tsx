import { DIORAMA_COLORS } from "../utils/palette";
import { CROSSARM_HEIGHT, POLE_HEIGHT, POWER_LINE_ATTACH } from "../utils/worldScale";

/**
 * Japanese concrete utility pole: tapered shaft, a crossarm perpendicular
 * to the street (wires run along local X), insulators, a pole-mounted
 * transformer, and the yellow-and-black guard sleeve at the base.
 */
export function UtilityPole() {
  return (
    <group>
      {/* Shaft */}
      <mesh position={[0, POLE_HEIGHT / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.032, 0.048, POLE_HEIGHT, 8]} />
        <meshStandardMaterial color={DIORAMA_COLORS.poleConcrete} roughness={0.9} />
      </mesh>

      {/* Guard sleeve: yellow with two dark bands */}
      <mesh position={[0, 0.13, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.056, 0.058, 0.26, 8]} />
        <meshStandardMaterial color={DIORAMA_COLORS.poleGuard} roughness={0.7} />
      </mesh>
      {[0.08, 0.18].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.059, 0.059, 0.035, 8]} />
          <meshStandardMaterial color={DIORAMA_COLORS.wireGray} roughness={0.8} />
        </mesh>
      ))}

      {/* Crossarm (along Z, perpendicular to the wires) */}
      <mesh position={[0, CROSSARM_HEIGHT, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.035, 0.035, 0.62]} />
        <meshStandardMaterial color={DIORAMA_COLORS.poleConcrete} roughness={0.9} />
      </mesh>

      {/* Insulators at every wire attach point */}
      {POWER_LINE_ATTACH.map(([y, z]) => (
        <mesh key={`${y}-${z}`} position={[0, y - 0.03, z]} castShadow>
          <cylinderGeometry args={[0.016, 0.02, 0.05, 6]} />
          <meshStandardMaterial color={DIORAMA_COLORS.insulator} roughness={0.5} />
        </mesh>
      ))}

      {/* Transformer can on a small bracket */}
      <mesh position={[0, 1.32, -0.06]} castShadow receiveShadow>
        <boxGeometry args={[0.03, 0.03, 0.08]} />
        <meshStandardMaterial color={DIORAMA_COLORS.poleConcrete} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.34, -0.13]} castShadow receiveShadow>
        <cylinderGeometry args={[0.055, 0.055, 0.17, 10]} />
        <meshStandardMaterial color={DIORAMA_COLORS.transformer} roughness={0.6} />
      </mesh>
    </group>
  );
}
