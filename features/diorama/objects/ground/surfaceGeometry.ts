import { Color, type BufferGeometry } from "three";
import type { SurfaceKind, SurfaceMap, Vector3Tuple } from "../../types/diorama.types";
import { CURB_GRAIN, JOINT_GRAIN, SURFACE_KIND_SPECS, surfaceKindOfCode } from "../../assets/surfaceKinds";
import { CORNER } from "../../utils/cornerLayout";
import { DIORAMA_COLORS } from "../../utils/palette";
import { SURFACE_CELL, surfaceSize } from "../../utils/surfaceMap";
import { QuadWriter, type Rgb, type WallSide } from "./groundGeometry";

/** How far paving joints stand proud of their surface, and how wide they are. */
const JOINT = 0.002;
const JOINT_WIDTH = 0.012;
/** Brightness of the wall where a kind without a curb steps down to the road. */
const STEP_SHADE = 0.82;
const EPSILON = 1e-6;

const rgb = (hex: string): Rgb => {
  const { r, g, b } = new Color(hex);
  return [r, g, b];
};

const scaled = (color: Rgb, k: number): Rgb => [color[0] * k, color[1] * k, color[2] * k];

/** A repeatable value in −1 … 1 for a pair of integers. */
function hash(a: number, b: number): number {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
}

const SIDES: Array<{ side: WallSide; di: number; dj: number }> = [
  { side: "left", di: -1, dj: 0 },
  { side: "right", di: 1, dj: 0 },
  { side: "back", di: 0, dj: -1 },
  { side: "front", di: 0, dj: 1 },
];

/**
 * The ground of a plot as ONE vertex-colored geometry: the top of every
 * cell, curb strips where a paved kind meets the road, paving joints, the
 * walls between the two levels and the skirt down to the plinth.
 * `grassTint` is the season's multiplier on grass (utils/seasons.ts).
 */
export function buildSurfaceGeometry(surface: SurfaceMap, grassTint: Vector3Tuple): BufferGeometry {
  const { width, depth } = surfaceSize(surface);
  const rowCount = surface.rows.length;
  const { cols } = surface;
  const writer = new QuadWriter(cols * rowCount * 2);

  // Decoded once: this runs on every stamp of the ground brush.
  const kinds = new Array<SurfaceKind | undefined>(cols * rowCount);
  for (let j = 0; j < rowCount; j++) {
    for (let i = 0; i < cols; i++) kinds[j * cols + i] = surfaceKindOfCode(surface.rows[j][i]);
  }
  /** The kind of a cell, or undefined outside the plot. */
  const kindAt = (i: number, j: number) => (i < 0 || j < 0 || i >= cols || j >= rowCount ? undefined : kinds[j * cols + i]);
  const curbWidth = CORNER.curbWidth;
  const curbColor = rgb(DIORAMA_COLORS.curb);

  const colors = {} as Record<SurfaceKind, Rgb>;
  const jointColors = {} as Partial<Record<SurfaceKind, Rgb>>;
  for (const [kind, spec] of Object.entries(SURFACE_KIND_SPECS) as Array<[SurfaceKind, (typeof SURFACE_KIND_SPECS)[SurfaceKind]]>) {
    const color = rgb(DIORAMA_COLORS[spec.color]);
    colors[kind] = kind === "grass" ? [color[0] * grassTint[0], color[1] * grassTint[1], color[2] * grassTint[2]] : color;
    if (spec.joint) jointColors[kind] = rgb(DIORAMA_COLORS[spec.joint.color]);
  }

  /** Level of a cell; outside the plot the ground ends, so its neighbors see the plinth's top. */
  const levelOf = (i: number, j: number): number => {
    const kind = kindAt(i, j);
    return kind ? SURFACE_KIND_SPECS[kind].level : CORNER.slabBottom;
  };

  for (let j = 0; j < rowCount; j++) {
    for (let i = 0; i < cols; i++) {
      const kind = kindAt(i, j);
      if (!kind) continue;
      const spec = SURFACE_KIND_SPECS[kind];
      const y = spec.level;
      const x0 = -width / 2 + i * SURFACE_CELL;
      const z0 = -depth / 2 + j * SURFACE_CELL;
      const x1 = x0 + SURFACE_CELL;
      const z1 = z0 + SURFACE_CELL;

      /** True if the neighbor is part of the plot and lies lower: the road beside a sidewalk. */
      const lower = (di: number, dj: number) => kindAt(i + di, j + dj) !== undefined && levelOf(i + di, j + dj) < y - EPSILON;

      const every = spec.joint?.every ?? 1;
      const color = spec.tone ? scaled(colors[kind], 1 + hash(Math.floor(i / every), Math.floor(j / every)) * spec.tone) : colors[kind];

      const curbs = spec.curb
        ? { left: lower(-1, 0), right: lower(1, 0), back: lower(0, -1), front: lower(0, 1) }
        : { left: false, right: false, back: false, front: false };
      const cornerCurb = spec.curb && (lower(-1, -1) || lower(1, -1) || lower(-1, 1) || lower(1, 1));

      if (!curbs.left && !curbs.right && !curbs.back && !curbs.front && !cornerCurb) {
        writer.top(x0, x1, z0, z1, y, color, spec.grain);
      } else {
        // Cut the cell into 3 × 3 patches; the outer ones are curb where the road is beside (or diagonal to) them.
        const xs = [x0, x0 + curbWidth, x1 - curbWidth, x1];
        const zs = [z0, z0 + curbWidth, z1 - curbWidth, z1];
        for (let px = 0; px < 3; px++) {
          for (let pz = 0; pz < 3; pz++) {
            const isCurb =
              (px === 0 && curbs.left) ||
              (px === 2 && curbs.right) ||
              (pz === 0 && curbs.back) ||
              (pz === 2 && curbs.front) ||
              (px !== 1 && pz !== 1 && lower(px - 1, pz - 1));
            writer.top(xs[px], xs[px + 1], zs[pz], zs[pz + 1], y, isCurb ? curbColor : color, isCurb ? CURB_GRAIN : spec.grain);
          }
        }
      }

      for (const { side, di, dj } of SIDES) {
        const neighbor = levelOf(i + di, j + dj);
        if (neighbor >= y - EPSILON) continue;
        const atEdge = kindAt(i + di, j + dj) === undefined;
        // The edge of the plot shows the material cut through; inside, a curb face or a shaded step.
        const wallColor = atEdge ? color : curbs[side] ? curbColor : scaled(color, STEP_SHADE);
        writer.wall(side, x0, x1, z0, z1, y, neighbor, wallColor, !atEdge && curbs[side] ? CURB_GRAIN : spec.grain);
      }

      const jointColor = jointColors[kind];
      if (jointColor) {
        const half = JOINT_WIDTH / 2;
        const zStart = z0 + (curbs.back ? curbWidth : 0);
        const zEnd = z1 - (curbs.front ? curbWidth : 0);
        const xStart = x0 + (curbs.left ? curbWidth : 0);
        const xEnd = x1 - (curbs.right ? curbWidth : 0);
        if (i % every === 0 && kindAt(i - 1, j) === kind) {
          writer.top(x0 - half, x0 + half, zStart, zEnd, y + JOINT, jointColor, JOINT_GRAIN);
        }
        if (j % every === 0 && kindAt(i, j - 1) === kind) {
          writer.top(xStart, xEnd, z0 - half, z0 + half, y + JOINT, jointColor, JOINT_GRAIN);
        }
      }
    }
  }

  return writer.build();
}
