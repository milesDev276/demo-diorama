import * as THREE from "three";
import type { BaseTemplate } from "./baseTemplates";
import { CORNER } from "./cornerLayout";

/** How far past the base's outline the platform's rim may reach (meters). */
const RIM = 0.6;

/** Share of the frame left free on every side when fitting. */
export const FIT_MARGIN = 0.06;

export interface SceneFit {
  /** Where the camera aims: the middle of everything below. */
  center: THREE.Vector3;
  /** The corners of every visible mesh's box, clipped to the base's outline. */
  points: THREE.Vector3[];
}

/**
 * What a Fit frames: every visible mesh in the scene — the base, the
 * platform and everything on it — as the corners of each mesh's own box,
 * so a tall, thin utility pole does not count as a tall block over the
 * whole base. The boxes are clipped to the base's outline on X/Z, so wires
 * that the material cuts off at the edge (and anything else past it) do
 * not widen the shot. Points and lines (rain, snow) are left out.
 */
export function sceneFit(scene: THREE.Object3D, template: Pick<BaseTemplate, "width" | "depth">): SceneFit {
  const halfWidth = template.width / 2 + RIM;
  const halfDepth = template.depth / 2 + RIM;
  // The base itself is always in the shot, also when nothing has been measured yet.
  const boxes = [
    new THREE.Box3(new THREE.Vector3(-halfWidth, CORNER.plinthBottom, -halfDepth), new THREE.Vector3(halfWidth, 0, halfDepth)),
  ];

  scene.traverseVisible((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    const box = new THREE.Box3();
    const instanced = object as THREE.InstancedMesh;
    if (instanced.isInstancedMesh) {
      if (!instanced.boundingBox) instanced.computeBoundingBox();
      box.copy(instanced.boundingBox!);
    } else {
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      box.copy(mesh.geometry.boundingBox!);
    }
    box.applyMatrix4(mesh.matrixWorld);
    box.min.set(Math.max(box.min.x, -halfWidth), Math.max(box.min.y, CORNER.plinthBottom), Math.max(box.min.z, -halfDepth));
    box.max.set(Math.min(box.max.x, halfWidth), box.max.y, Math.min(box.max.z, halfDepth));
    if (!box.isEmpty()) boxes.push(box);
  });

  const all = new THREE.Box3();
  const points: THREE.Vector3[] = [];
  for (const box of boxes) {
    all.union(box);
    for (let i = 0; i < 8; i++) {
      points.push(new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z));
    }
  }
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
