import { DIORAMA_COLORS } from "../utils/palette";

/** Rounded canopy clumps: [x, y, z, radius, light?]. */
const CANOPY: Array<[number, number, number, number, boolean]> = [
  [0, 0.86, 0, 0.36, false],
  [0.2, 0.72, 0.1, 0.26, true],
  [-0.2, 0.74, -0.06, 0.24, true],
  [-0.06, 1.04, 0.04, 0.24, true],
];

/**
 * Low-poly procedural street / garden tree (~8 m): a slim trunk carrying
 * a few rounded, flat-shaded canopy clumps. No external assets.
 */
export function Tree() {
  return (
    <group>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.045, 0.07, 0.6, 6]} />
        <meshStandardMaterial color={DIORAMA_COLORS.trunk} roughness={0.9} />
      </mesh>

      {CANOPY.map(([x, y, z, radius, light], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[i * 0.7, i * 1.3, 0]} castShadow receiveShadow>
          <dodecahedronGeometry args={[radius, 0]} />
          <meshStandardMaterial
            color={light ? DIORAMA_COLORS.foliageLight : DIORAMA_COLORS.foliageDark}
            roughness={0.85}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}
