import { DIORAMA_COLORS } from "../../utils/palette";
import { PLOT_WIDTH, PLOT_Z, ROAD_SURFACE_Y, STRIP_DEPTH } from "../../utils/worldScale";

const SLAB = 0.1;
const CENTER_Z = PLOT_Z.sidewalk + STRIP_DEPTH.sidewalk / 2;
const CURB_DEPTH = 0.05;
const JOINT_SPACING = 0.42;
const JOINT_XS = Array.from(
  { length: Math.floor(PLOT_WIDTH / JOINT_SPACING) - 1 },
  (_, i) => -PLOT_WIDTH / 2 + JOINT_SPACING * (i + 1)
);

/**
 * Concrete sidewalk strip between the lot and the road: slab with subtle
 * paving joints, finished by a raised curb lip stepping down to the road.
 */
export function Sidewalk() {
  return (
    <group>
      <mesh position={[0, -SLAB / 2, CENTER_Z]} receiveShadow castShadow>
        <boxGeometry args={[PLOT_WIDTH, SLAB, STRIP_DEPTH.sidewalk]} />
        <meshStandardMaterial color={DIORAMA_COLORS.sidewalkConcrete} roughness={0.95} />
      </mesh>

      {JOINT_XS.map((x) => (
        <mesh key={x} position={[x, 0.001, CENTER_Z]} receiveShadow>
          <boxGeometry args={[0.012, 0.002, STRIP_DEPTH.sidewalk - CURB_DEPTH]} />
          <meshStandardMaterial color={DIORAMA_COLORS.sidewalkJoint} roughness={1} />
        </mesh>
      ))}

      {/* Curb lip: slightly proud of the sidewalk, dropping to the road surface */}
      <mesh
        position={[0, (0.008 + ROAD_SURFACE_Y - SLAB) / 2, PLOT_Z.road - CURB_DEPTH / 2]}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[PLOT_WIDTH, 0.008 - (ROAD_SURFACE_Y - SLAB), CURB_DEPTH]} />
        <meshStandardMaterial color={DIORAMA_COLORS.curb} roughness={0.9} />
      </mesh>
    </group>
  );
}
