import * as THREE from "three";

/**
 * Raycasting onto placement surfaces — the meshes tagged
 * `userData.placementSurface` (the base, and buildings with their
 * `objectId`). Shared by click-to-place and the scatter brush.
 */

/** The scene object a surface mesh belongs to, read from the tag on it or an ancestor. Undefined for the base. */
export function surfaceOwnerId(object: THREE.Object3D | null): string | undefined {
  for (let node = object; node; node = node.parent) {
    if (node.userData.placementSurface) return node.userData.objectId;
  }
  return undefined;
}

/** Every tagged surface in the scene, except those whose owner `skip` rejects (`undefined` is the base). */
export function collectSurfaces(scene: THREE.Object3D, skip: (ownerId: string | undefined) => boolean = () => false): THREE.Object3D[] {
  const surfaces: THREE.Object3D[] = [];
  scene.traverse((node) => {
    if (node.userData.placementSurface && !skip(node.userData.objectId)) surfaces.push(node);
  });
  return surfaces;
}

/** Faces narrower than this (meters) are not surfaces: rails, posts, sills and frames. */
const MIN_SURFACE_WIDTH = 0.1;

/**
 * True if the hit triangle is a sliver — the face of a rail, a post or a
 * frame. Skipping those lets a click aimed at the roof behind a railing
 * reach the roof instead of balancing the object on the handrail.
 */
export function isSliver(hit: THREE.Intersection): boolean {
  const mesh = hit.object as THREE.Mesh;
  const position = mesh.geometry?.getAttribute("position");
  if (!hit.face || !position) return false;
  const [a, b, c] = [hit.face.a, hit.face.b, hit.face.c].map((index) =>
    new THREE.Vector3().fromBufferAttribute(position, index).applyMatrix4(mesh.matrixWorld)
  );
  const longest = Math.max(a.distanceTo(b), b.distanceTo(c), c.distanceTo(a));
  const doubleArea = b.clone().sub(a).cross(c.clone().sub(a)).length();
  return doubleArea / longest < MIN_SURFACE_WIDTH;
}

/** The hit's face normal in world space. */
export function worldNormal(hit: THREE.Intersection): THREE.Vector3 {
  return hit.face!.normal.clone().transformDirection(hit.object.matrixWorld);
}

/** Sets `pointer` to the event's position in normalized device coordinates of `element`. */
export function toPointer(event: PointerEvent, element: HTMLElement, pointer: THREE.Vector2): THREE.Vector2 {
  const rect = element.getBoundingClientRect();
  return pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
}
