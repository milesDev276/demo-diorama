"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { PlinthStyle } from "../../types/diorama.types";
import { SURFACE_KIND_SPECS, type Grain } from "../../assets/surfaceKinds";
import { useDioramaStore } from "../../store/dioramaStore";
import { CORNER } from "../../utils/cornerLayout";
import { DIORAMA_COLORS } from "../../utils/palette";
import { getSlotMaterial } from "../materials";
import { groundBox } from "./groundGeometry";

/** The platform runs from under the surface slabs down to here, on every app-built base. */
const TOP = CORNER.slabBottom;
const BOTTOM = CORNER.plinthBottom;

const BEVEL = 0.06;

/** Wood: an upper block a little wider than the diorama, on a wider foot. */
const WOOD = { rim: 0.15, footRim: 0.4, footHeight: 0.48 } as const;
/** The brass plate on the front of the wooden base, in meters, and its canvas in pixels. */
const PLATE = { width: 2.8, height: 0.4, thickness: 0.02, pixels: [896, 128] } as const;
const PLATE_FONT = '"Yu Gothic", YuGothic, "Hiragino Sans", "Hiragino Kaku Gothic ProN", Meiryo, "Noto Sans JP", sans-serif';

/** Earth: bands of the cut-open ground from the top down, then a thin dark board. */
const EARTH_BANDS: Array<{ to: number; color: keyof typeof DIORAMA_COLORS; grain: Grain }> = [
  { to: -0.42, color: "roadbed", grain: [0.3, 0.12] },
  { to: -0.86, color: "subsoil", grain: SURFACE_KIND_SPECS.soil.grain },
  { to: -1.2, color: "subsoilDark", grain: SURFACE_KIND_SPECS.soil.grain },
];
const EARTH_BOARD_RIM = 0.12;

interface PlinthProps {
  width: number;
  depth: number;
  style: PlinthStyle;
}

function Block({ width, depth, top, bottom, color, roughness = 0.9 }: { width: number; depth: number; top: number; bottom: number; color: string; roughness?: number }) {
  const geometry = useMemo(() => new RoundedBoxGeometry(width, top - bottom, depth, 2, BEVEL), [width, depth, top, bottom]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} position={[0, (top + bottom) / 2, 0]} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={roughness} />
    </mesh>
  );
}

/** The scene's name engraved on brass, as a texture. A new one per name; the old one is disposed. */
function useNameplateTexture(name: string): CanvasTexture {
  const texture = useMemo(() => {
    const [w, h] = PLATE.pixels;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = DIORAMA_COLORS.plinthBrass;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(60, 42, 20, 0.55)";
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = "#3c2a14";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Shrink long names until they fit between the engraved border.
    let size = h * 0.46;
    do {
      ctx.font = `700 ${size}px ${PLATE_FONT}`;
      size -= 2;
    } while (ctx.measureText(name).width > w - 64 && size > 12);
    ctx.fillText(name, w / 2, h / 2 + 2);
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    result.anisotropy = 4;
    return result;
  }, [name]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function Nameplate({ z, y }: { z: number; y: number }) {
  const name = useDioramaStore((s) => s.sceneName);
  const texture = useNameplateTexture(name);
  return (
    <group position={[0, y, z]}>
      <mesh position={[0, 0, PLATE.thickness / 2]} castShadow>
        <boxGeometry args={[PLATE.width, PLATE.height, PLATE.thickness]} />
        <meshStandardMaterial color={DIORAMA_COLORS.plinthBrass} roughness={0.45} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0, PLATE.thickness + 0.001]}>
        <planeGeometry args={[PLATE.width - 0.04, PLATE.height - 0.04]} />
        <meshStandardMaterial map={texture} roughness={0.45} metalness={0.5} />
      </mesh>
    </group>
  );
}

function EarthSection({ width, depth }: { width: number; depth: number }) {
  const geometry = useMemo(() => {
    // Each band starts where the one above it ends.
    const parts = EARTH_BANDS.map(({ to, color, grain }, index) =>
      groundBox(-width / 2, width / 2, -depth / 2, depth / 2, to, index ? EARTH_BANDS[index - 1].to : TOP, DIORAMA_COLORS[color], grain)
    );
    const merged = mergeGeometries(parts);
    parts.forEach((part) => part.dispose());
    return merged;
  }, [width, depth]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const boardTop = EARTH_BANDS[EARTH_BANDS.length - 1].to;

  return (
    <>
      <mesh geometry={geometry} material={getSlotMaterial("ground")} castShadow receiveShadow />
      <Block width={width + EARTH_BOARD_RIM * 2} depth={depth + EARTH_BOARD_RIM * 2} top={boardTop} bottom={BOTTOM} color={DIORAMA_COLORS.plinth} />
    </>
  );
}

/**
 * The platform under an app-built base, from the underside of the surface
 * slabs down: a dark block, a wooden display base with the scene's name on
 * a brass plate, or the ground cut open in bands of roadbed and soil.
 */
export function Plinth({ width, depth, style }: PlinthProps) {
  if (style === "earth") return <EarthSection width={width} depth={depth} />;
  if (style === "wood") {
    const footTop = BOTTOM + WOOD.footHeight;
    return (
      <>
        <Block width={width + WOOD.rim * 2} depth={depth + WOOD.rim * 2} top={TOP} bottom={footTop} color={DIORAMA_COLORS.plinthWood} roughness={0.55} />
        <Block width={width + WOOD.footRim * 2} depth={depth + WOOD.footRim * 2} top={footTop} bottom={BOTTOM} color={DIORAMA_COLORS.plinthWoodDark} roughness={0.55} />
        <Nameplate z={depth / 2 + WOOD.rim} y={(TOP + footTop) / 2} />
      </>
    );
  }
  return <Block width={width} depth={depth} top={TOP} bottom={BOTTOM} color={DIORAMA_COLORS.plinth} />;
}
