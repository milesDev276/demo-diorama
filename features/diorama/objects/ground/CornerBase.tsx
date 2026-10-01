"use client";

import { useEffect, useMemo } from "react";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { CORNER } from "../../utils/cornerLayout";
import { DIORAMA_COLORS } from "../../utils/palette";
import { GltfAsset } from "../GltfAsset";
import { getSlotMaterial } from "../materials";
import { buildCornerSurfaces, buildTomareDecal } from "./cornerGeometry";

const MANHOLE_URL = "/models/street/street_manhole_01.glb";
const GRATE_URL = "/models/street/street_gutter_grate_01.glb";

/** Gutter grates against the curbs: [x, z, rotationY]. The model's length runs along X. */
const GRATES: Array<[number, number, number]> = [
  ...CORNER.grates.frontXs.map((x): [number, number, number] => [x, CORNER.grates.offset, 0]),
  ...CORNER.grates.rightZs.map((z): [number, number, number] => [CORNER.grates.offset, z, Math.PI / 2]),
];

const SIZE = CORNER.half * 2;
const PLINTH_HEIGHT = CORNER.slabBottom - CORNER.plinthBottom;

/**
 * The 16 × 16 m street-corner base (plan/Hero-Layout.md): a lot wrapped by
 * sidewalks and an L of narrow road ending in a T-junction, cut out of the
 * street like a physical model on a dark plinth. Authored in meters. The
 * surfaces are one merged mesh, the 止まれ marking one atlas decal and the
 * plinth one mesh — three draw calls — plus the manhole and gutter grates,
 * which are fixed details of this base rather than placeable objects.
 */
export function CornerBase() {
  const surfaces = useMemo(() => buildCornerSurfaces(), []);
  const tomare = useMemo(() => buildTomareDecal(), []);
  const plinth = useMemo(() => new RoundedBoxGeometry(SIZE, PLINTH_HEIGHT, SIZE, 2, 0.06), []);

  useEffect(
    () => () => {
      surfaces.dispose();
      tomare.dispose();
      plinth.dispose();
    },
    [surfaces, tomare, plinth]
  );

  return (
    <group>
      <mesh geometry={surfaces} material={getSlotMaterial("ground")} castShadow receiveShadow />
      <mesh geometry={tomare} material={getSlotMaterial("decal")} receiveShadow />
      <mesh geometry={plinth} position={[0, CORNER.slabBottom - PLINTH_HEIGHT / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={DIORAMA_COLORS.plinth} roughness={0.9} />
      </mesh>

      <group position={[CORNER.manhole.x, CORNER.roadY, CORNER.manhole.z]}>
        <GltfAsset url={MANHOLE_URL} footprintRadius={0.3} />
      </group>
      {GRATES.map(([x, z, rotationY]) => (
        <group key={`${x},${z}`} position={[x, CORNER.roadY, z]} rotation={[0, rotationY, 0]}>
          <GltfAsset url={GRATE_URL} footprintRadius={0.3} />
        </group>
      ))}
    </group>
  );
}
