import { DIORAMA_COLORS } from "../utils/palette";

// A 3-sided cylinder turned to face +Z gives a flat triangle whose tip
// points down — the silhouette of the Japanese 止まれ (stop) sign.
const FACE_FORWARD: [number, number, number] = [Math.PI / 2, 0, 0];

/**
 * Japanese road sign: a thin metal post with the inverted red triangle
 * "stop" board. No text rendering — a white bar suggests the lettering.
 */
export function Sign() {
  return (
    <group>
      <mesh position={[0, 0.21, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.011, 0.011, 0.42, 6]} />
        <meshStandardMaterial color={DIORAMA_COLORS.signPost} roughness={0.5} metalness={0.3} />
      </mesh>

      {/* White border, then the red face slightly in front of it */}
      <mesh position={[0, 0.39, 0.014]} rotation={FACE_FORWARD} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.012, 3]} />
        <meshStandardMaterial color={DIORAMA_COLORS.signBoard} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.39, 0.021]} rotation={FACE_FORWARD}>
        <cylinderGeometry args={[0.082, 0.082, 0.004, 3]} />
        <meshStandardMaterial color={DIORAMA_COLORS.signRed} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.4, 0.024]}>
        <boxGeometry args={[0.07, 0.014, 0.002]} />
        <meshStandardMaterial color={DIORAMA_COLORS.signBoard} roughness={0.6} />
      </mesh>
    </group>
  );
}
