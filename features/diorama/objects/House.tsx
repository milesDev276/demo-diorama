import { useTimeOfDayLook } from "../hooks/useSceneEnvironment";
import { DIORAMA_COLORS } from "../utils/palette";
import { AirConditionerUnit } from "./parts/AirConditionerUnit";

const WIDTH = 1;
const WALL_HEIGHT = 0.7;
const DEPTH = 0.9;
const FRONT = DEPTH / 2;
const EAVE = 0.14;

/** Sliding window: a pane that glows with the time of day, split by a wooden center bar. */
function SlidingWindow({ x, y, width, height }: { x: number; y: number; width: number; height: number }) {
  const { emissive } = useTimeOfDayLook();

  return (
    <group position={[x, y, FRONT]}>
      <mesh position={[0, 0, 0.012]}>
        <boxGeometry args={[width + 0.03, height + 0.03, 0.012]} />
        <meshStandardMaterial color={DIORAMA_COLORS.woodTrim} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[width, height, 0.008]} />
        <meshStandardMaterial
          color={DIORAMA_COLORS.windowGlow}
          emissive={DIORAMA_COLORS.windowGlow}
          emissiveIntensity={emissive}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[0, 0, 0.026]}>
        <boxGeometry args={[0.014, height, 0.006]} />
        <meshStandardMaterial color={DIORAMA_COLORS.woodTrim} roughness={0.9} />
      </mesh>
    </group>
  );
}

/**
 * Two-storey Japanese residential house: plaster walls under a low,
 * dark-tiled hipped roof with deep eaves, an off-center entrance with a
 * small hisashi canopy, sliding windows, and an outdoor AC unit.
 * No external assets — geometry only. Front faces local +Z.
 */
export function House() {
  // A 4-sided cone turned 45° is a square pyramid; the group's Z scale
  // stretches it to cover the rectangular footprint plus the eaves.
  const roofHalfX = WIDTH / 2 + EAVE;
  const roofHalfZ = DEPTH / 2 + EAVE;

  return (
    <group>
      <mesh position={[0, WALL_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WIDTH, WALL_HEIGHT, DEPTH]} />
        <meshStandardMaterial color={DIORAMA_COLORS.wallPlaster} roughness={0.85} />
      </mesh>

      {/* Hipped tile roof with a thin eave slab underneath */}
      <mesh position={[0, WALL_HEIGHT + 0.015, 0]} castShadow receiveShadow>
        <boxGeometry args={[roofHalfX * 2, 0.03, roofHalfZ * 2]} />
        <meshStandardMaterial color={DIORAMA_COLORS.roofTile} roughness={0.75} flatShading />
      </mesh>
      <group position={[0, WALL_HEIGHT + 0.03 + 0.17, 0]} scale={[1, 1, roofHalfZ / roofHalfX]}>
        <mesh rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
          <coneGeometry args={[roofHalfX * Math.SQRT2, 0.34, 4]} />
          <meshStandardMaterial color={DIORAMA_COLORS.roofTile} roughness={0.75} flatShading />
        </mesh>
      </group>

      {/* Entrance: door + small hisashi canopy */}
      <mesh position={[0.24, 0.16, FRONT + 0.02]} castShadow>
        <boxGeometry args={[0.22, 0.32, 0.04]} />
        <meshStandardMaterial color={DIORAMA_COLORS.woodTrim} roughness={0.9} />
      </mesh>
      <mesh position={[0.24, 0.35, FRONT + 0.06]} rotation={[0.25, 0, 0]} castShadow>
        <boxGeometry args={[0.34, 0.02, 0.13]} />
        <meshStandardMaterial color={DIORAMA_COLORS.roofTile} roughness={0.75} />
      </mesh>

      <SlidingWindow x={-0.22} y={0.18} width={0.28} height={0.15} />
      <SlidingWindow x={-0.22} y={0.52} width={0.22} height={0.14} />
      <SlidingWindow x={0.24} y={0.52} width={0.22} height={0.14} />

      <AirConditionerUnit position={[-WIDTH / 2 - 0.045, 0, 0.12]} rotationY={-Math.PI / 2} />
    </group>
  );
}
