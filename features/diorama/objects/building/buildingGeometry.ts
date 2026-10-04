import { BufferAttribute, BufferGeometry, Color, Euler, Matrix4, Quaternion, Vector3 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { BuildingParams } from "../../types/diorama.types";
import { buildingSize } from "../../utils/buildingParams";
import { DIORAMA_COLORS } from "../../utils/palette";
import { layoutBuilding, type BuildingModule } from "./buildingLayout";

/** The material slots a building renders with (objects/materials.ts). */
export const BUILDING_SLOTS = ["base", "emissive", "printed", "glass"] as const;
export type BuildingSlot = (typeof BUILDING_SLOTS)[number];

export type SlotGeometries = Partial<Record<BuildingSlot, BufferGeometry>>;
export type ModuleGeometries = Record<BuildingModule, SlotGeometries>;

type PaletteKey = keyof typeof DIORAMA_COLORS;
type Point = [number, number, number];

/** How far tiled and shed roofs overhang the walls. */
const EAVE = 0.45;
/** Rise per meter of run of the hipped roof. */
const HIP_PITCH = 0.5;
const TILE_ROW = 0.4;
const TILE_LIP = 0.035;
const FASCIA = 0.1;
const SHED_PITCH = 0.22;
const SHED_THICKNESS = 0.1;

/**
 * A module geometry placed in the building, reduced to what every part
 * shares — unindexed position, normal and float RGB color (plus uv on
 * printed parts) — so that parts from different GLBs and from app code merge.
 */
function placed(source: BufferGeometry, matrix: Matrix4, keepUv: boolean): BufferGeometry {
  const geometry = source.index ? source.toNonIndexed() : source.clone();
  geometry.applyMatrix4(matrix);
  const color = geometry.getAttribute("color");
  const rgb = new Float32Array(color.count * 3);
  for (let i = 0; i < color.count; i++) rgb.set([color.getX(i), color.getY(i), color.getZ(i)], i * 3);
  const out = new BufferGeometry();
  out.setAttribute("position", geometry.getAttribute("position"));
  out.setAttribute("normal", geometry.getAttribute("normal"));
  out.setAttribute("color", new BufferAttribute(rgb, 3));
  if (keepUv) out.setAttribute("uv", geometry.getAttribute("uv"));
  return out;
}

/** Collects flat-shaded, single-color faces into one geometry. */
class FaceBuilder {
  private positions: number[] = [];
  private normals: number[] = [];
  private colors: number[] = [];

  /** A quad a-b-c-d (around its perimeter) whose front faces `toward`. Degenerate halves are dropped. */
  quad(a: Point, b: Point, c: Point, d: Point, toward: Point, color: PaletteKey, shade = 1): void {
    this.triangle(a, b, c, toward, color, shade);
    this.triangle(a, c, d, toward, color, shade);
  }

  triangle(a: Point, b: Point, c: Point, toward: Point, color: PaletteKey, shade = 1): void {
    const va = new Vector3(...a);
    const normal = new Vector3(...b).sub(va).cross(new Vector3(...c).sub(va));
    if (normal.lengthSq() < 1e-10) return;
    normal.normalize();
    const flip = normal.dot(new Vector3(...toward)) < 0;
    if (flip) normal.negate();
    const { r, g, b: blue } = new Color(DIORAMA_COLORS[color]).multiplyScalar(shade);
    for (const p of flip ? [a, c, b] : [a, b, c]) {
      this.positions.push(...p);
      this.normals.push(normal.x, normal.y, normal.z);
      this.colors.push(r, g, blue);
    }
  }

  /** An axis-aligned box given by its extents. */
  box(min: Point, max: Point, color: PaletteKey, shade = 1): void {
    const [x0, y0, z0] = min;
    const [x1, y1, z1] = max;
    this.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0], color, shade);
    this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], color, shade);
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], color, shade);
    this.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [0, 0, -1], color, shade);
    this.quad([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [1, 0, 0], color, shade);
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], color, shade);
  }

  build(): BufferGeometry {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array(this.positions), 3));
    geometry.setAttribute("normal", new BufferAttribute(new Float32Array(this.normals), 3));
    geometry.setAttribute("color", new BufferAttribute(new Float32Array(this.colors), 3));
    return geometry;
  }
}

/** Roof slab inside the parapet; the parapet modules stand on its edge. */
function flatRoof(faces: FaceBuilder, width: number, depth: number, y: number): void {
  const inset = 0.01;
  faces.box([-width / 2 + inset, y - 0.12, -depth / 2 + inset], [width / 2 - inset, y, depth / 2 - inset], "roofSlab");
}

/**
 * Hipped tile roof: rows of tiles stepping up from the eaves to the ridge
 * on all four sides. Each row is a ring of the footprint, inset further and
 * raised higher than the one below, with a small lip where the rows overlap.
 */
function hippedRoof(faces: FaceBuilder, width: number, depth: number, y: number): void {
  const a = width / 2 + EAVE;
  const b = depth / 2 + EAVE;
  const reach = Math.min(a, b);
  const rows = Math.max(2, Math.round(reach / TILE_ROW));
  const run = reach / rows;
  const rise = run * HIP_PITCH;
  const ring = (inset: number, height: number): Point[] => [
    [-(a - inset), height, b - inset],
    [a - inset, height, b - inset],
    [a - inset, height, -(b - inset)],
    [-(a - inset), height, -(b - inset)],
  ];
  const outward: Point[] = [
    [0, 0, 1],
    [1, 0, 0],
    [0, 0, -1],
    [-1, 0, 0],
  ];

  const eave = ring(0, y);
  faces.quad(eave[0], eave[1], eave[2], eave[3], [0, -1, 0], "roofTile", 0.7); // soffit

  for (let row = 0; row < rows; row++) {
    const lip = row === 0 ? FASCIA : TILE_LIP;
    const lower = ring(row * run, y + row * rise);
    const lipTop = ring(row * run, y + row * rise + lip);
    const upper = ring((row + 1) * run, y + (row + 1) * rise);
    for (let side = 0; side < 4; side++) {
      const next = (side + 1) % 4;
      faces.quad(lower[side], lower[next], lipTop[next], lipTop[side], outward[side], "roofTile", 0.8);
      faces.quad(lipTop[side], lipTop[next], upper[next], upper[side], [0, 1, 0], "roofTile", row % 2 ? 0.96 : 1);
    }
  }

  // Ridge cap along the longer axis
  const top = y + rows * rise;
  const half = Math.abs(a - b) + 0.12;
  const [rx, rz] = a >= b ? [half, 0.1] : [0.1, half];
  faces.box([-rx, top - 0.06, -rz], [rx, top + 0.07, rz], "roofTile", 0.85);
}

/** Single-pitch roof falling to the back, with the wall carried up under it at the front and sides. */
function shedRoof(faces: FaceBuilder, width: number, depth: number, y: number): void {
  const rise = depth * SHED_PITCH;
  const slope = rise / depth;
  const x = width / 2;
  const z = depth / 2;
  const top = (pz: number) => y + SHED_THICKNESS + (pz + z) * slope;

  // Walls up to the underside of the roof
  faces.quad([-x, y, z], [x, y, z], [x, y + rise, z], [-x, y + rise, z], [0, 0, 1], "wallPlaster");
  for (const side of [-1, 1]) {
    faces.triangle([side * x, y, -z], [side * x, y, z], [side * x, y + rise, z], [side, 0, 0], "wallPlaster");
  }

  const ox = x + EAVE * 0.6;
  const front = z + EAVE;
  const back = -z - EAVE * 0.6;
  const corner = (px: number, pz: number, under: boolean): Point => [px, top(pz) - (under ? SHED_THICKNESS : 0), pz];
  const quad = (points: Array<[number, number, boolean]>, toward: Point, shade: number) => {
    const [p0, p1, p2, p3] = points.map(([px, pz, under]) => corner(px, pz, under));
    faces.quad(p0, p1, p2, p3, toward, "roofTile", shade);
  };
  quad([[-ox, back, false], [ox, back, false], [ox, front, false], [-ox, front, false]], [0, 1, 0], 1);
  quad([[-ox, back, true], [ox, back, true], [ox, front, true], [-ox, front, true]], [0, -1, 0], 0.7);
  quad([[-ox, front, true], [ox, front, true], [ox, front, false], [-ox, front, false]], [0, 0, 1], 0.8);
  quad([[-ox, back, true], [ox, back, true], [ox, back, false], [-ox, back, false]], [0, 0, -1], 0.8);
  for (const side of [-1, 1]) {
    quad(
      [[side * ox, back, true], [side * ox, front, true], [side * ox, front, false], [side * ox, back, false]],
      [side, 0, 0],
      0.8
    );
  }
}

const ROOFS: Record<BuildingParams["roof"], (faces: FaceBuilder, width: number, depth: number, y: number) => void> = {
  "flat-rooftop": flatRoof,
  "hipped-tile": hippedRoof,
  shed: shedRoof,
};

/**
 * The whole building as one geometry per material slot: every module of
 * layoutBuilding() moved into place and merged, plus the roof, which is
 * generated here because its size follows the bay counts. The caller owns
 * (and disposes) the result.
 */
export function buildBuildingGeometry(params: BuildingParams, modules: ModuleGeometries): SlotGeometries {
  const parts: Record<BuildingSlot, BufferGeometry[]> = { base: [], emissive: [], printed: [], glass: [] };
  const matrix = new Matrix4();
  const rotation = new Quaternion();
  const euler = new Euler();

  for (const placement of layoutBuilding(params)) {
    rotation.setFromEuler(euler.set(0, placement.yaw, 0));
    matrix.compose(new Vector3(...placement.position), rotation, new Vector3(1, placement.scaleY, 1));
    for (const slot of BUILDING_SLOTS) {
      const source = modules[placement.module][slot];
      if (source) parts[slot].push(placed(source, matrix, slot === "printed"));
    }
  }

  const { width, depth, wallHeight } = buildingSize(params);
  const roof = new FaceBuilder();
  ROOFS[params.roof](roof, width, depth, wallHeight);
  parts.base.push(roof.build());

  const result: SlotGeometries = {};
  for (const slot of BUILDING_SLOTS) {
    if (!parts[slot].length) continue;
    const merged = mergeGeometries(parts[slot]);
    parts[slot].forEach((part) => part.dispose());
    if (merged) result[slot] = merged;
  }
  return result;
}
