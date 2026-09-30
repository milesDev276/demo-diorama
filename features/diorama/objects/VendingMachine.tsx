import { DIORAMA_COLORS } from "../utils/palette";

const WIDTH = 0.22;
const HEIGHT = 0.34;
const DEPTH = 0.17;
const FRONT = DEPTH / 2;

/** Two lit shelves of tiny drink cans, left to right. */
const CAN_ROWS = [0.27, 0.225];
const CAN_COLORS = [
  DIORAMA_COLORS.canBlue,
  DIORAMA_COLORS.signRed,
  DIORAMA_COLORS.canYellow,
  DIORAMA_COLORS.canGreen,
  DIORAMA_COLORS.vendingDark,
];

/**
 * Classic red Japanese drink vending machine: a lit display window with
 * rows of cans, a dark coin panel, and the pickup slot near the ground.
 * Front faces local +Z.
 */
export function VendingMachine() {
  return (
    <group>
      <mesh position={[0, HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WIDTH, HEIGHT, DEPTH]} />
        <meshStandardMaterial color={DIORAMA_COLORS.vendingBody} roughness={0.55} />
      </mesh>

      {/* Lit display window */}
      <mesh position={[0, 0.25, FRONT + 0.002]}>
        <boxGeometry args={[0.18, 0.12, 0.004]} />
        <meshStandardMaterial
          color={DIORAMA_COLORS.vendingPanel}
          emissive={DIORAMA_COLORS.vendingPanel}
          emissiveIntensity={0.35}
          roughness={0.4}
        />
      </mesh>
      {CAN_ROWS.map((y) =>
        CAN_COLORS.map((color, i) => (
          <mesh key={`${y}-${i}`} position={[-0.068 + i * 0.034, y, FRONT + 0.006]}>
            <boxGeometry args={[0.018, 0.03, 0.004]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
        ))
      )}

      {/* Coin / button panel */}
      <mesh position={[0.06, 0.14, FRONT + 0.002]}>
        <boxGeometry args={[0.05, 0.07, 0.004]} />
        <meshStandardMaterial color={DIORAMA_COLORS.vendingDark} roughness={0.6} />
      </mesh>

      {/* Pickup slot */}
      <mesh position={[-0.02, 0.05, FRONT + 0.002]}>
        <boxGeometry args={[0.14, 0.035, 0.004]} />
        <meshStandardMaterial color={DIORAMA_COLORS.vendingDark} roughness={0.6} />
      </mesh>
    </group>
  );
}
