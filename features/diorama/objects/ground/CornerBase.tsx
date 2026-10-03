"use client";

import { useEffect, useMemo } from "react";
import type { PlinthStyle } from "../../types/diorama.types";
import { CORNER } from "../../utils/cornerLayout";
import { BASE_SURFACE } from "../../utils/surfaceSnap";
import { GltfAsset } from "../GltfAsset";
import { getSlotMaterial } from "../materials";
import { buildCornerSurfaces, buildTomareDecal } from "./cornerGeometry";
import { Plinth } from "./Plinth";

const MANHOLE_URL = "/models/street/street_manhole_01.glb";
const GRATE_URL = "/models/street/street_gutter_grate_01.glb";

/** Gutter grates against the curbs: [x, z, rotationY]. The model's length runs along X. */
const GRATES: Array<[number, number, number]> = [
  ...CORNER.grates.frontXs.map((x): [number, number, number] => [x, CORNER.grates.offset, 0]),
  ...CORNER.grates.rightZs.map((z): [number, number, number] => [CORNER.grates.offset, z, Math.PI / 2]),
];

const SIZE = CORNER.half * 2;

/**
 * The 16 × 16 m street-corner base (plan/Hero-Layout.md): a lot wrapped by
 * sidewalks and an L of narrow road ending in a T-junction, cut out of the
 * street like a physical model on its platform. Authored in meters. The
 * surfaces are one merged mesh and the 止まれ marking one atlas decal; the
 * manhole and gutter grates are fixed details of this base rather than
 * placeable objects.
 */
export function CornerBase({ plinth = "dark" }: { plinth?: PlinthStyle }) {
  const surfaces = useMemo(() => buildCornerSurfaces(), []);
  const tomare = useMemo(() => buildTomareDecal(), []);

  useEffect(
    () => () => {
      surfaces.dispose();
      tomare.dispose();
    },
    [surfaces, tomare]
  );

  return (
    <group>
      <mesh geometry={surfaces} material={getSlotMaterial("ground")} userData={BASE_SURFACE} castShadow receiveShadow />
      <mesh geometry={tomare} material={getSlotMaterial("decal")} receiveShadow />
      <Plinth width={SIZE} depth={SIZE} style={plinth} />

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
