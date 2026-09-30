import * as THREE from "three";
import { DIORAMA_COLORS } from "../utils/palette";
import { POWER_LINE_ATTACH, POWER_LINE_SPAN } from "../utils/legacyUnits";

/** How far a wire droops at mid-span between poles. */
const SAG = 0.16;
const WIRE_RADIUS = 0.008;

/** One drooping span from x0 to x1 at the given attach height/depth. */
function spanCurve(x0: number, x1: number, y: number, z: number) {
  // A quadratic Bézier reaches half its control-point offset at t = 0.5,
  // so double the sag on the control point.
  return new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(x0, y, z),
    new THREE.Vector3((x0 + x1) / 2, y - SAG * 2, z),
    new THREE.Vector3(x1, y, z)
  );
}

// Static geometry — built once at module load, shared by every instance.
const WIRE_CURVES = POWER_LINE_ATTACH.flatMap(([y, z]) => [
  spanCurve(-POWER_LINE_SPAN, 0, y, z),
  spanCurve(0, POWER_LINE_SPAN, y, z),
]);

/**
 * Overhead power lines passing over a pole: three wires running along
 * local X, drooping between poles. Origin is the pole's base — place it at
 * a UtilityPole's position (same rotation) and it meets the insulators.
 */
export function PowerLine() {
  return (
    <group>
      {WIRE_CURVES.map((curve, i) => (
        <mesh key={i} castShadow>
          <tubeGeometry args={[curve, 24, WIRE_RADIUS, 4, false]} />
          <meshStandardMaterial color={DIORAMA_COLORS.wireGray} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}
