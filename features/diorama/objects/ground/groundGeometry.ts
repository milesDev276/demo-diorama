import { BoxGeometry, BufferAttribute, BufferGeometry, Color } from "three";
import type { Grain } from "../../assets/surfaceKinds";

/**
 * Geometry helpers of the app-built bases. Everything drawn with the
 * shared `ground` material carries a `color` and a `grain` per vertex:
 * the color is the palette color, the grain says how rough the material
 * draws it (objects/materials.ts).
 */

/** An axis-aligned box given by its extents, with one color and one grain on every vertex. */
export function groundBox(
  x0: number,
  x1: number,
  z0: number,
  z1: number,
  y0: number,
  y1: number,
  color: string,
  grain: Grain
): BufferGeometry {
  const geometry = new BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
  geometry.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  geometry.deleteAttribute("uv");
  const { r, g, b } = new Color(color);
  const count = geometry.getAttribute("position").count;
  const colors = new Float32Array(count * 3);
  const grains = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    colors.set([r, g, b], i * 3);
    grains.set(grain, i * 2);
  }
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  geometry.setAttribute("grain", new BufferAttribute(grains, 2));
  return geometry;
}

export type Rgb = readonly [number, number, number];

/** Which way a wall faces. */
export type WallSide = "left" | "right" | "back" | "front";

const WALL_NORMALS: Record<WallSide, Rgb> = { left: [-1, 0, 0], right: [1, 0, 0], back: [0, 0, -1], front: [0, 0, 1] };
const UP: Rgb = [0, 1, 0];

/** The ends [px, pz, qx, qz] of a wall's edge, ordered so that the face winds counter-clockwise seen from outside. */
export function wallEnds(side: WallSide, x0: number, x1: number, z0: number, z1: number): [number, number, number, number] {
  return [
    side === "right" || side === "back" ? x1 : x0,
    side === "right" || side === "front" ? z1 : z0,
    side === "left" || side === "back" ? x0 : x1,
    side === "left" || side === "front" ? z1 : z0,
  ];
}

/**
 * Collects flat quads and writes them out as one indexed geometry. Used
 * for surfaces made of thousands of small faces, where a BoxGeometry per
 * face would be far too slow to rebuild while painting; for the same reason
 * it writes into typed arrays and allocates nothing per quad.
 */
export class QuadWriter {
  private capacity: number;
  private count = 0;
  private positions: Float32Array;
  private normals: Float32Array;
  private colors: Float32Array;
  private grains: Float32Array;

  /** `capacity` is a first guess of the number of quads; the buffers grow when it is passed. */
  constructor(capacity = 1024) {
    this.capacity = capacity;
    this.positions = new Float32Array(capacity * 12);
    this.normals = new Float32Array(capacity * 12);
    this.colors = new Float32Array(capacity * 12);
    this.grains = new Float32Array(capacity * 8);
  }

  private grow(): void {
    this.capacity *= 2;
    const grown = (source: Float32Array, perQuad: number) => {
      const target = new Float32Array(this.capacity * perQuad);
      target.set(source);
      return target;
    };
    this.positions = grown(this.positions, 12);
    this.normals = grown(this.normals, 12);
    this.colors = grown(this.colors, 12);
    this.grains = grown(this.grains, 8);
  }

  /** Starts a quad with one normal, color and grain; returns where its four corners go in `positions`. */
  private begin(normal: Rgb, color: Rgb, grain: Grain): number {
    if (this.count === this.capacity) this.grow();
    const { normals, colors, grains } = this;
    for (let corner = 0, v = this.count * 12, g = this.count * 8; corner < 4; corner++, v += 3, g += 2) {
      normals[v] = normal[0];
      normals[v + 1] = normal[1];
      normals[v + 2] = normal[2];
      colors[v] = color[0];
      colors[v + 1] = color[1];
      colors[v + 2] = color[2];
      grains[g] = grain[0];
      grains[g + 1] = grain[1];
    }
    return this.count++ * 12;
  }

  /** A horizontal quad at height `y`, facing up. */
  top(x0: number, x1: number, z0: number, z1: number, y: number, color: Rgb, grain: Grain): void {
    const p = this.positions;
    const o = this.begin(UP, color, grain);
    p[o] = x0;
    p[o + 2] = z0;
    p[o + 3] = x0;
    p[o + 5] = z1;
    p[o + 6] = x1;
    p[o + 8] = z1;
    p[o + 9] = x1;
    p[o + 11] = z0;
    p[o + 1] = p[o + 4] = p[o + 7] = p[o + 10] = y;
  }

  /** A quad over the rectangle x0 … x1, z0 … z1 with a height of its own at each corner, facing up: a ramp. */
  slope(x0: number, x1: number, z0: number, z1: number, y00: number, y01: number, y11: number, y10: number, color: Rgb, grain: Grain): void {
    // The normal of the plane through the corners' average slopes along X and Z.
    const slopeX = (y10 + y11 - y00 - y01) / 2 / (x1 - x0);
    const slopeZ = (y01 + y11 - y00 - y10) / 2 / (z1 - z0);
    const length = Math.hypot(slopeX, 1, slopeZ);
    const p = this.positions;
    const o = this.begin([-slopeX / length, 1 / length, -slopeZ / length], color, grain);
    p[o] = x0;
    p[o + 1] = y00;
    p[o + 2] = z0;
    p[o + 3] = x0;
    p[o + 4] = y01;
    p[o + 5] = z1;
    p[o + 6] = x1;
    p[o + 7] = y11;
    p[o + 8] = z1;
    p[o + 9] = x1;
    p[o + 10] = y10;
    p[o + 11] = z0;
  }

  /**
   * A vertical quad on one side of the rectangle x0 … x1, z0 … z1, facing
   * outward. Its edge runs from p to q (wallEnds); the top and the bottom
   * each have a height at p and at q, so the wall can follow a slope.
   */
  wall(
    side: WallSide,
    x0: number,
    x1: number,
    z0: number,
    z1: number,
    yTopP: number,
    yTopQ: number,
    yBottomP: number,
    yBottomQ: number,
    color: Rgb,
    grain: Grain
  ): void {
    const [px, pz, qx, qz] = wallEnds(side, x0, x1, z0, z1);
    const p = this.positions;
    const o = this.begin(WALL_NORMALS[side], color, grain);
    p[o] = p[o + 3] = px;
    p[o + 2] = p[o + 5] = pz;
    p[o + 6] = p[o + 9] = qx;
    p[o + 8] = p[o + 11] = qz;
    p[o + 1] = yTopP;
    p[o + 10] = yTopQ;
    p[o + 4] = yBottomP;
    p[o + 7] = yBottomQ;
  }

  build(): BufferGeometry {
    const indices = new Uint32Array(this.count * 6);
    for (let quad = 0; quad < this.count; quad++) {
      const first = quad * 4;
      indices.set([first, first + 1, first + 2, first, first + 2, first + 3], quad * 6);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(this.positions.slice(0, this.count * 12), 3));
    geometry.setAttribute("normal", new BufferAttribute(this.normals.slice(0, this.count * 12), 3));
    geometry.setAttribute("color", new BufferAttribute(this.colors.slice(0, this.count * 12), 3));
    geometry.setAttribute("grain", new BufferAttribute(this.grains.slice(0, this.count * 8), 2));
    geometry.setIndex(new BufferAttribute(indices, 1));
    return geometry;
  }
}
