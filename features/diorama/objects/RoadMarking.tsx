"use client";

import { useEffect, useMemo } from "react";
import { BufferAttribute, BufferGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { AssetComponentProps } from "../types/diorama.types";
import { PAINT_GRAIN } from "../assets/surfaceKinds";
import { CORNER } from "../utils/cornerLayout";
import { DIORAMA_COLORS } from "../utils/palette";
import { groundBox } from "./ground/groundGeometry";
import { getSlotMaterial } from "./materials";
import layout from "./textures/atlasLayout.json";

/**
 * Road markings as objects: white paint lying on whatever surface they are
 * placed on. Their sizes are the corner base's (plan/Hero-Layout.md §2).
 * The origin is on the surface; +Z is the way a driver crosses them.
 */

/** How far paint stands proud of the road. */
const PAINT = 0.004;

type Rect = [x0: number, x1: number, z0: number, z1: number];

const { stripe, pitch, count, z0: crossZ0, z1: crossZ1 } = CORNER.crosswalk;
const CROSSWALK_WIDTH = (count - 1) * pitch + stripe;
const CROSSWALK_DEPTH = crossZ1 - crossZ0;

const STOP_LINE = { width: CORNER.stopLine.x1 - CORNER.stopLine.x0, depth: CORNER.stopLine.z1 - CORNER.stopLine.z0 };
/** 止まれ sits this far before the stop line, as on the corner base. */
const TOMARE = {
  width: CORNER.tomare.x1 - CORNER.tomare.x0,
  depth: CORNER.tomare.z1 - CORNER.tomare.z0,
  gap: CORNER.stopLine.z0 - CORNER.tomare.z1,
};

const ROAD_LINE = { length: 4, width: CORNER.edgeLine.far - CORNER.edgeLine.near };
/** A parking bay, open toward +Z. Bays 2.4 m apart share a side line. */
const BAY = { width: 2.5, depth: 5, line: 0.1 };

const RECTS = {
  crosswalk: Array.from({ length: count }, (_, i): Rect => {
    const x0 = -CROSSWALK_WIDTH / 2 + i * pitch;
    return [x0, x0 + stripe, -CROSSWALK_DEPTH / 2, CROSSWALK_DEPTH / 2];
  }),
  stopLine: [[-STOP_LINE.width / 2, STOP_LINE.width / 2, -STOP_LINE.depth / 2, STOP_LINE.depth / 2] as Rect],
  roadLine: [[-ROAD_LINE.length / 2, ROAD_LINE.length / 2, -ROAD_LINE.width / 2, ROAD_LINE.width / 2] as Rect],
  parkingBay: [
    [-BAY.width / 2, -BAY.width / 2 + BAY.line, -BAY.depth / 2, BAY.depth / 2],
    [BAY.width / 2 - BAY.line, BAY.width / 2, -BAY.depth / 2, BAY.depth / 2],
    [-BAY.width / 2 + BAY.line, BAY.width / 2 - BAY.line, -BAY.depth / 2, -BAY.depth / 2 + BAY.line],
  ] as Rect[],
};

function paintGeometry(rects: Rect[]): BufferGeometry {
  const parts = rects.map(([x0, x1, z0, z1]) => groundBox(x0, x1, z0, z1, 0, PAINT, DIORAMA_COLORS.asphaltLine, PAINT_GRAIN));
  const merged = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  return merged;
}

/** 止まれ behind the stop line, read by a driver heading +Z toward it (止 nearest the line). */
function tomareGeometry(): BufferGeometry {
  const z1 = -STOP_LINE.depth / 2 - TOMARE.gap;
  const z0 = z1 - TOMARE.depth;
  const [x0, x1] = [-TOMARE.width / 2, TOMARE.width / 2];
  const [cx, cy, cw, ch] = layout.cells.road_tomare;
  const [u0, u1, v0, v1] = [cx / layout.size, (cx + cw) / layout.size, cy / layout.size, (cy + ch) / layout.size];
  const geometry = new BufferGeometry();
  // Corner order as in objects/ground/cornerGeometry.ts: top-left, top-right, bottom-left, bottom-right of the text.
  geometry.setAttribute("position", new BufferAttribute(new Float32Array([x1, PAINT, z1, x0, PAINT, z1, x1, PAINT, z0, x0, PAINT, z0]), 3));
  geometry.setAttribute("uv", new BufferAttribute(new Float32Array([u0, v0, u1, v0, u0, v1, u1, v1]), 2));
  geometry.setAttribute("normal", new BufferAttribute(new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]), 3));
  geometry.setIndex([0, 2, 1, 1, 2, 3]);
  return geometry;
}

/** A `crosswalk`, `stopLine`, `roadLine` or `parkingBay`: flat paint, plus the 止まれ lettering of a stop line. */
export function RoadMarking({ object }: AssetComponentProps) {
  const type = object.type as keyof typeof RECTS;
  const paint = useMemo(() => paintGeometry(RECTS[type] ?? RECTS.roadLine), [type]);
  const tomare = useMemo(() => (type === "stopLine" ? tomareGeometry() : null), [type]);
  useEffect(
    () => () => {
      paint.dispose();
      tomare?.dispose();
    },
    [paint, tomare]
  );

  return (
    <group>
      <mesh geometry={paint} material={getSlotMaterial("ground")} receiveShadow />
      {tomare && <mesh geometry={tomare} material={getSlotMaterial("decal")} receiveShadow />}
    </group>
  );
}
