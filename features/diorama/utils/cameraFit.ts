import * as THREE from "three";
import type { BaseTemplate } from "./baseTemplates";
import { CORNER } from "./cornerLayout";
import { isEditorHelper } from "./editorHelpers";

/** How far past the base's outline the platform's rim may reach (meters). */
const RIM = 0.6;

/** Share of the frame left free on every side when fitting. */
export const FIT_MARGIN = 0.06;

/** An orthographic view: where the camera stands, what it looks at, how far it is zoomed (pixels per meter). */
export interface OrthoPose {
  position: THREE.Vector3;
  target: THREE.Vector3;
  zoom: number;
}

export interface SceneFit {
  /** Where the camera aims: the middle of everything below. */
  center: THREE.Vector3;
  /** The corners of every visible mesh's box, clipped to the base's outline. */
  points: THREE.Vector3[];
}

/**
 * What a Fit frames: every visible mesh in the scene — the base, the
 * platform and everything on it — as the corners of each mesh's own local
 * box moved into the world, so a tall, thin utility pole does not count as
 * a tall block over the whole base and a turned house keeps its footprint.
 * The corners are clamped to the base's outline on X/Z, so wires that the
 * material cuts off at the edge (and anything else past it) do not widen
 * the shot. Points and lines (rain, snow) are left out, and so are the
 * editor's helpers (utils/editorHelpers.ts).
 */
export function sceneFit(scene: THREE.Object3D, template: Pick<BaseTemplate, "width" | "depth">): SceneFit {
  const halfWidth = template.width / 2 + RIM;
  const halfDepth = template.depth / 2 + RIM;
  const points: THREE.Vector3[] = [];
  const all = new THREE.Box3();
  const addCorners = (box: THREE.Box3, matrix?: THREE.Matrix4) => {
    for (let i = 0; i < 8; i++) {
      const point = new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z);
      if (matrix) point.applyMatrix4(matrix);
      // Clipped to the outline, as the wire material clips the wires.
      point.set(
        THREE.MathUtils.clamp(point.x, -halfWidth, halfWidth),
        Math.max(point.y, CORNER.plinthBottom),
        THREE.MathUtils.clamp(point.z, -halfDepth, halfDepth)
      );
      points.push(point);
      all.expandByPoint(point);
    }
  };

  // The base itself is always in the shot, also when nothing has been measured yet.
  addCorners(new THREE.Box3(new THREE.Vector3(-halfWidth, CORNER.plinthBottom, -halfDepth), new THREE.Vector3(halfWidth, 0, halfDepth)));

  // Visible objects only, and never the editor's helpers (the grid, the gizmo, rings, ghosts) or anything under them.
  const visit = (object: THREE.Object3D) => {
    if (!object.visible || isEditorHelper(object)) return;
    const mesh = object as THREE.Mesh;
    if (mesh.isMesh && mesh.geometry) {
      const instanced = object as THREE.InstancedMesh;
      if (instanced.isInstancedMesh) {
        if (!instanced.boundingBox) instanced.computeBoundingBox();
        addCorners(instanced.boundingBox!, mesh.matrixWorld);
      } else {
        if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
        // The local box's own corners, moved into the world: a turned object keeps its real footprint.
        addCorners(mesh.geometry.boundingBox!, mesh.matrixWorld);
      }
    }
    for (const child of object.children) visit(child);
  };
  visit(scene);

  return { center: all.getCenter(new THREE.Vector3()), points };
}

/**
 * The tightest view along `-direction` (with `up`) of a perspective camera
 * that sees every point inside the frame, less `margin` of it on every
 * side, with the points centered in the frame: the orbit target and the
 * camera's distance from it.
 *
 * Exact. In the camera's axes (right, up, back) relative to `center`, a
 * camera at (X, Y, D) sees point (x, y, z) when |x − X| ≤ tanH · (D − z) and
 * the same for y. Those are linear in X, Y and D, so for each axis the
 * smallest D and the X that centers the points come out in closed form.
 */
export function fitView(
  { center, points }: SceneFit,
  direction: THREE.Vector3,
  up: THREE.Vector3,
  fovDegrees: number,
  aspect: number,
  margin = FIT_MARGIN
): { target: THREE.Vector3; distance: number } {
  const back = direction.clone().normalize();
  const right = new THREE.Vector3().crossVectors(up, back).normalize();
  const camUp = new THREE.Vector3().crossVectors(back, right);
  const tanV = Math.tan(THREE.MathUtils.degToRad(fovDegrees / 2)) * (1 - 2 * margin);
  const tanH = tanV * aspect;

  // Per axis: the largest x + k·z and the smallest x − k·z over the points.
  let maxX = -Infinity, minX = Infinity, maxY = -Infinity, minY = Infinity;
  const offset = new THREE.Vector3();
  for (const point of points) {
    offset.subVectors(point, center);
    const x = offset.dot(right);
    const y = offset.dot(camUp);
    const z = offset.dot(back);
    maxX = Math.max(maxX, x + tanH * z);
    minX = Math.min(minX, x - tanH * z);
    maxY = Math.max(maxY, y + tanV * z);
    minY = Math.min(minY, y - tanV * z);
  }
  const distance = Math.max((maxX - minX) / (2 * tanH), (maxY - minY) / (2 * tanV), 0);
  const target = center
    .clone()
    .addScaledVector(right, (maxX + minX) / 2)
    .addScaledVector(camUp, (maxY + minY) / 2);
  return { target, distance };
}

/**
 * The tightest view along `-direction` (with `up`) of an orthographic
 * camera that shows every point inside a canvas `width` × `height` CSS
 * pixels, less `margin` of it on every side, with the points centered: the
 * orbit target and the zoom (pixels per meter, as R3F's orthographic camera
 * takes it). Exact: an orthographic view is a projection on the camera's
 * right and up axes. The target lies in the plane through the points'
 * center across the viewing direction, so orbiting turns around the
 * diorama. The zoom is not clamped.
 */
export function orthoFitView(
  { center, points }: SceneFit,
  direction: THREE.Vector3,
  up: THREE.Vector3,
  width: number,
  height: number,
  margin = FIT_MARGIN
): { target: THREE.Vector3; zoom: number } {
  const back = direction.clone().normalize();
  const right = new THREE.Vector3().crossVectors(up, back).normalize();
  const camUp = new THREE.Vector3().crossVectors(back, right);
  let maxX = -Infinity, minX = Infinity, maxY = -Infinity, minY = Infinity;
  const offset = new THREE.Vector3();
  for (const point of points) {
    offset.subVectors(point, center);
    const x = offset.dot(right);
    const y = offset.dot(camUp);
    maxX = Math.max(maxX, x);
    minX = Math.min(minX, x);
    maxY = Math.max(maxY, y);
    minY = Math.min(minY, y);
  }
  const usable = 1 - 2 * margin;
  const zoom = Math.min((width * usable) / Math.max(maxX - minX, 1e-3), (height * usable) / Math.max(maxY - minY, 1e-3));
  const target = center
    .clone()
    .addScaledVector(right, (maxX + minX) / 2)
    .addScaledVector(camUp, (maxY + minY) / 2);
  return { target, zoom };
}
