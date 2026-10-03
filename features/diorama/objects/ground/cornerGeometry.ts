import { BufferAttribute, BufferGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CURB_GRAIN, JOINT_GRAIN, PAINT_GRAIN, SURFACE_KIND_SPECS, type Grain } from "../../assets/surfaceKinds";
import { CORNER } from "../../utils/cornerLayout";
import { DIORAMA_COLORS } from "../../utils/palette";
import layout from "../textures/atlasLayout.json";
import { groundBox } from "./groundGeometry";

/** The ground colors of this base, each with the grain its material is drawn with. */
const GRAIN = {
  lotGravel: SURFACE_KIND_SPECS.gravel.grain,
  sidewalkConcrete: SURFACE_KIND_SPECS.sidewalk.grain,
  asphalt: SURFACE_KIND_SPECS.asphalt.grain,
  curb: CURB_GRAIN,
  sidewalkJoint: JOINT_GRAIN,
  asphaltLine: PAINT_GRAIN,
} satisfies Partial<Record<keyof typeof DIORAMA_COLORS, Grain>>;

type PaletteKey = keyof typeof GRAIN;

/** How far painted lines and paving joints stand proud of their surface. */
const PAINT = 0.004;
const JOINT = 0.002;
const JOINT_WIDTH = 0.012;

/** An axis-aligned box given by its extents, carrying one palette color and its grain on every vertex. */
function slab(x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, color: PaletteKey): BufferGeometry {
  return groundBox(x0, x1, z0, z1, y0, y1, DIORAMA_COLORS[color], GRAIN[color]);
}

/** A sidewalk-height slab whose top slopes down to just above the road along its +X edge. */
function curbRamp(x0: number, x1: number, z0: number, z1: number): BufferGeometry {
  const geometry = slab(x0, x1, z0, z1, CORNER.slabBottom, 0, "sidewalkConcrete");
  const position = geometry.getAttribute("position");
  for (let i = 0; i < position.count; i++) {
    if (position.getY(i) > -1e-6 && position.getX(i) > x1 - 1e-6) position.setY(i, CORNER.roadY + CORNER.ramp.lip);
  }
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Every opaque surface of the corner base as ONE vertex-colored geometry:
 * lot, sidewalks with curbs and joints, the curb ramp, both roads and the
 * painted lines (crosswalk, stop line, edge lines).
 */
export function buildCornerSurfaces(): BufferGeometry {
  const { half, roadY, slabBottom, lotEdge, roadEdge, curbWidth, crosswalk, ramp, stopLine, edgeLine } = CORNER;
  const curb = roadEdge - curbWidth;
  const parts: BufferGeometry[] = [];
  const ground = (x0: number, x1: number, z0: number, z1: number, color: PaletteKey) =>
    parts.push(slab(x0, x1, z0, z1, slabBottom, 0, color));
  const road = (x0: number, x1: number, z0: number, z1: number) =>
    parts.push(slab(x0, x1, z0, z1, slabBottom, roadY, "asphalt"));
  const paint = (x0: number, x1: number, z0: number, z1: number) =>
    parts.push(slab(x0, x1, z0, z1, roadY, roadY + PAINT, "asphaltLine"));

  ground(-half, lotEdge, -half, lotEdge, "lotGravel");

  // Right sidewalk, up to the crosswalk, then narrowed beside the curb ramp
  ground(lotEdge, curb, -half, crosswalk.z0, "sidewalkConcrete");
  ground(curb, roadEdge, -half, crosswalk.z0, "curb");
  ground(lotEdge, ramp.x0, crosswalk.z0, lotEdge, "sidewalkConcrete");
  parts.push(curbRamp(ramp.x0, roadEdge, crosswalk.z0, crosswalk.z1));

  // Front sidewalk and the corner block past the ramp
  ground(-half, ramp.x0, lotEdge, curb, "sidewalkConcrete");
  ground(-half, ramp.x0, curb, roadEdge, "curb");
  ground(ramp.x0, curb, crosswalk.z1, curb, "sidewalkConcrete");
  ground(curb, roadEdge, crosswalk.z1, roadEdge, "curb");
  ground(ramp.x0, curb, curb, roadEdge, "curb");

  // Paving joints, one per meter
  for (let x = -half + 1; x <= lotEdge; x++) {
    parts.push(slab(x - JOINT_WIDTH / 2, x + JOINT_WIDTH / 2, lotEdge, curb, 0, JOINT, "sidewalkJoint"));
  }
  for (let z = -half + 1; z <= 0; z++) {
    parts.push(slab(lotEdge, curb, z - JOINT_WIDTH / 2, z + JOINT_WIDTH / 2, 0, JOINT, "sidewalkJoint"));
  }

  road(-half, half, roadEdge, half); // front road
  road(roadEdge, half, -half, roadEdge); // right road, ending in the T-junction

  for (let i = 0; i < crosswalk.count; i++) {
    const x0 = crosswalk.firstX + i * crosswalk.pitch;
    paint(x0, x0 + crosswalk.stripe, crosswalk.z0, crosswalk.z1);
  }
  paint(stopLine.x0, stopLine.x1, stopLine.z0, stopLine.z1);
  paint(edgeLine.near, edgeLine.far, -half, edgeLine.rightRoadEndZ);
  paint(-half, half, edgeLine.near, edgeLine.far);

  const merged = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  return merged;
}

/**
 * The 止まれ road marking: one quad on the right road, UV-mapped to the
 * `road_tomare` atlas cell so the text reads upright for a driver heading
 * +Z (止 nearest the stop line, the driver's right toward −X).
 */
export function buildTomareDecal(): BufferGeometry {
  const { x0, x1, z0, z1 } = CORNER.tomare;
  const y = CORNER.roadY + JOINT;
  const [cx, cy, cw, ch] = layout.cells.road_tomare;
  const u0 = cx / layout.size;
  const u1 = (cx + cw) / layout.size;
  const v0 = cy / layout.size; // top canvas row (the atlas texture is not flipped)
  const v1 = (cy + ch) / layout.size;

  const geometry = new BufferGeometry();
  // Corner order: top-left, top-right, bottom-left, bottom-right of the text as the driver sees it.
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array([x1, y, z1, x0, y, z1, x1, y, z0, x0, y, z0]), 3)
  );
  geometry.setAttribute("uv", new BufferAttribute(new Float32Array([u0, v0, u1, v0, u0, v1, u1, v1]), 2));
  geometry.setAttribute("normal", new BufferAttribute(new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]), 3));
  geometry.setIndex([0, 2, 1, 1, 2, 3]);
  return geometry;
}
