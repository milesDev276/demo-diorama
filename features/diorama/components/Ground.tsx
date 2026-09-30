import { DIORAMA_COLORS } from "../utils/palette";
import { LEGACY_UNIT_SCALE, PLOT_DEPTH, PLOT_WIDTH, PLOT_Z, STRIP_DEPTH } from "../utils/legacyUnits";
import { Road } from "../objects/ground/Road";
import { Sidewalk } from "../objects/ground/Sidewalk";

const SLAB = 0.1;
const PLINTH_HEIGHT = 0.3;
const TAPER_HEIGHT = 0.8;

/** A flat surface strip whose top sits at y = 0. */
function SurfaceStrip({ start, depth, color }: { start: number; depth: number; color: string }) {
  return (
    <mesh position={[0, -SLAB / 2, start + depth / 2]} receiveShadow castShadow>
      <boxGeometry args={[PLOT_WIDTH, SLAB, depth]} />
      <meshStandardMaterial color={color} roughness={0.95} flatShading />
    </mesh>
  );
}

/**
 * The Diorama's base: a small rectangular street-corner plot rather than an
 * infinite plane. From back to front — a grass strip, the building lot, the
 * sidewalk and the road — all resting on a soil plinth with a tapered
 * underside so the whole thing reads as a handcrafted miniature object.
 * Authored in legacy units, hence the scaled group (see legacyUnits.ts).
 */
export function Ground() {
  return (
    <group scale={LEGACY_UNIT_SCALE}>
      <SurfaceStrip start={PLOT_Z.back} depth={STRIP_DEPTH.grass} color={DIORAMA_COLORS.grassTop} />
      <SurfaceStrip start={PLOT_Z.lot} depth={STRIP_DEPTH.lot} color={DIORAMA_COLORS.lotGravel} />
      <Sidewalk />
      <Road />

      {/* Soil plinth under all strips */}
      <mesh position={[0, -SLAB - PLINTH_HEIGHT / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[PLOT_WIDTH, PLINTH_HEIGHT, PLOT_DEPTH]} />
        <meshStandardMaterial color={DIORAMA_COLORS.dirt} roughness={1} flatShading />
      </mesh>

      {/* Tapered underside: a 4-sided cylinder turned 45° is a unit square
          frustum; the parent group stretches it to the plot footprint. */}
      <group position={[0, -SLAB - PLINTH_HEIGHT - TAPER_HEIGHT / 2, 0]} scale={[PLOT_WIDTH, 1, PLOT_DEPTH]}>
        <mesh rotation={[0, Math.PI / 4, 0]} receiveShadow>
          <cylinderGeometry args={[Math.SQRT1_2, Math.SQRT1_2 * 0.72, TAPER_HEIGHT, 4]} />
          <meshStandardMaterial color={DIORAMA_COLORS.dirtDark} roughness={1} flatShading />
        </mesh>
      </group>
    </group>
  );
}
