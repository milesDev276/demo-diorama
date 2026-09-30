import { DIORAMA_COLORS } from "../../utils/palette";
import { PLOT_WIDTH, PLOT_Z, ROAD_SURFACE_Y, STRIP_DEPTH } from "../../utils/worldScale";

const SLAB = 0.1;
const CENTER_Z = PLOT_Z.road + STRIP_DEPTH.road / 2;
const LINE_Y = ROAD_SURFACE_Y + 0.002;
const DASH_LENGTH = 0.3;
const DASH_GAP = 0.25;
const DASH_XS = Array.from(
  { length: Math.floor((PLOT_WIDTH - 0.2) / (DASH_LENGTH + DASH_GAP)) },
  (_, i) => -PLOT_WIDTH / 2 + 0.25 + DASH_LENGTH / 2 + i * (DASH_LENGTH + DASH_GAP)
);

/**
 * Two-lane asphalt road strip along the front of the plot, recessed below
 * the curb, with a dashed white centerline and solid outer edge lines.
 */
export function Road() {
  return (
    <group>
      <mesh position={[0, ROAD_SURFACE_Y - SLAB / 2, CENTER_Z]} receiveShadow castShadow>
        <boxGeometry args={[PLOT_WIDTH, SLAB, STRIP_DEPTH.road]} />
        <meshStandardMaterial color={DIORAMA_COLORS.asphalt} roughness={0.95} />
      </mesh>

      {DASH_XS.map((x) => (
        <mesh key={x} position={[x, LINE_Y, CENTER_Z]} receiveShadow>
          <boxGeometry args={[DASH_LENGTH, 0.004, 0.035]} />
          <meshStandardMaterial color={DIORAMA_COLORS.asphaltLine} roughness={0.8} />
        </mesh>
      ))}

      {[PLOT_Z.road + 0.08, PLOT_Z.front - 0.08].map((z) => (
        <mesh key={z} position={[0, LINE_Y, z]} receiveShadow>
          <boxGeometry args={[PLOT_WIDTH, 0.004, 0.025]} />
          <meshStandardMaterial color={DIORAMA_COLORS.asphaltLine} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}
