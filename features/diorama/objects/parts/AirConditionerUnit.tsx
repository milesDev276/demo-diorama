import { DIORAMA_COLORS } from "../../utils/palette";

/**
 * Small outdoor air-conditioner unit — a signature everyday-Japan wall
 * detail. Origin at its base; the fan faces local +Z.
 */
export function AirConditionerUnit(props: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={props.position} rotation={[0, props.rotationY ?? 0, 0]}>
      <mesh position={[0, 0.07, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.17, 0.14, 0.08]} />
        <meshStandardMaterial color={DIORAMA_COLORS.acUnit} roughness={0.7} />
      </mesh>
      <mesh position={[-0.02, 0.07, 0.041]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.004, 12]} />
        <meshStandardMaterial color={DIORAMA_COLORS.acFan} roughness={0.8} />
      </mesh>
    </group>
  );
}
