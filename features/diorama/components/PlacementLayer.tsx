"use client";

import { useEffect, useRef, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Group } from "three";
import type { DioramaObject as DioramaObjectData, Placement } from "../types/diorama.types";
import { useDioramaStore } from "../store/dioramaStore";
import { ASSET_REGISTRY, getFootprintRadius } from "../assets/assetRegistry";
import { spawnYaw } from "../utils/objectDefaults";
import { canBeParent, getWorldTransform, indexObjects, type Transform } from "../utils/sceneGraph";
import { resolvePlacement, type SurfaceHit } from "../utils/surfaceSnap";
import { AssetVisual } from "./DioramaObject";
import { SelectionRing } from "./SelectionRing";

/** A press that travels further than this (pixels) is an orbit drag, not a placing click. */
const CLICK_TOLERANCE = 5;

/** The scene object a surface mesh belongs to, read from the `placementSurface` tag on it or an ancestor. */
function surfaceOwnerId(object: THREE.Object3D | null): string | undefined {
  for (let node = object; node; node = node.parent) {
    if (node.userData.placementSurface) return node.userData.objectId;
  }
  return undefined;
}

/** Faces narrower than this (meters) are not surfaces: rails, posts, sills and frames. */
const MIN_SURFACE_WIDTH = 0.1;

/**
 * True if the hit triangle is a sliver — the face of a rail, a post or a
 * frame. Skipping those lets a click aimed at the roof behind a railing
 * reach the roof instead of balancing the object on the handrail.
 */
function isSliver(hit: THREE.Intersection): boolean {
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

function ActivePlacement({ placement }: { placement: Placement }) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  const placeObject = useDioramaStore((s) => s.placeObject);
  const ghostRef = useRef<Group>(null);
  // A new object keeps one heading for the whole placement; a moved one keeps its own.
  const [newYaw] = useState(() => spawnYaw(placement.type));

  useEffect(() => {
    const element = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pressed: { x: number; y: number } | null = null;
    let resolved: { world: Transform; parentId?: string } | null = null;

    const resolve = (event: PointerEvent) => {
      const { objects, snapEnabled, gridSize } = useDioramaStore.getState();
      const byId = indexObjects(objects);
      const moving = placement.movingId ? byId.get(placement.movingId) : undefined;
      const isBuilding = placement.type === "building";

      // Surfaces: the base and the buildings. A building only goes on the base.
      const surfaces: THREE.Object3D[] = [];
      scene.traverse((node) => {
        if (!node.userData.placementSurface) return;
        const ownerId: string | undefined = node.userData.objectId;
        if (ownerId && (isBuilding || ownerId === placement.movingId)) return;
        surfaces.push(node);
      });

      const rect = element.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(surfaces, true).find((candidate) => !isSliver(candidate));
      resolved = null;
      if (hit?.face) {
        const ownerId = surfaceOwnerId(hit.object);
        const owner = ownerId ? byId.get(ownerId) : undefined;
        const surface: SurfaceHit = {
          point: hit.point.toArray(),
          normal: hit.face.normal.clone().transformDirection(hit.object.matrixWorld).toArray(),
          owner: owner && canBeParent(owner) ? owner : undefined,
        };
        const current = moving ? getWorldTransform(moving, byId) : undefined;
        const world = resolvePlacement(surface, byId, {
          grid: snapEnabled ? gridSize : null,
          wallMount: ASSET_REGISTRY[placement.type].wallMount,
          yaw: current ? current.rotation[1] : newYaw,
          yawFollowsOwner: !current,
          scale: current ? current.scale : ASSET_REGISTRY[placement.type].defaultScale,
        });
        if (world) resolved = { world, parentId: surface.owner?.id };
      }

      const ghost = ghostRef.current;
      if (ghost) {
        ghost.visible = resolved !== null;
        if (resolved) {
          ghost.position.set(...resolved.world.position);
          ghost.rotation.set(...resolved.world.rotation);
          ghost.scale.set(...resolved.world.scale);
        }
      }
    };

    const handleDown = (event: PointerEvent) => {
      if (event.button === 0) pressed = { x: event.clientX, y: event.clientY };
    };
    // Captured and stopped, so the click never reaches the scene's own
    // handlers: while placing, a click neither selects nor deselects.
    const handleClick = (event: PointerEvent) => {
      event.stopImmediatePropagation();
      if (event.button !== 0 || !pressed) return;
      const travelled = Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y);
      pressed = null;
      if (travelled > CLICK_TOLERANCE) return;
      // The object lands exactly where the ghost is; a tap with no hover before it resolves here.
      if (!resolved) resolve(event);
      if (resolved) placeObject(resolved.world, resolved.parentId, event.shiftKey);
    };
    const handleLeave = () => {
      resolved = null;
      if (ghostRef.current) ghostRef.current.visible = false;
    };

    element.addEventListener("pointermove", resolve);
    element.addEventListener("pointerdown", handleDown);
    element.addEventListener("click", handleClick as EventListener, true);
    element.addEventListener("pointerleave", handleLeave);
    return () => {
      element.removeEventListener("pointermove", resolve);
      element.removeEventListener("pointerdown", handleDown);
      element.removeEventListener("click", handleClick as EventListener, true);
      element.removeEventListener("pointerleave", handleLeave);
    };
  }, [gl, camera, scene, placement, newYaw, placeObject]);

  const ghostObject: Pick<DioramaObjectData, "type" | "params"> = { type: placement.type, params: placement.params };

  return (
    <group ref={ghostRef} visible={false}>
      <AssetVisual object={ghostObject} />
      <SelectionRing radius={getFootprintRadius(ghostObject)} />
    </group>
  );
}

/**
 * Click-to-place: while the store holds a `placement`, a ghost of the asset
 * follows the pointer over the base and the buildings, snapped by
 * utils/surfaceSnap, and a click puts the object there — attached to the
 * building if it landed on one. The ghost's transform is written straight to
 * its group; the store only changes on the click.
 */
export function PlacementLayer() {
  const placement = useDioramaStore((s) => s.placement);
  if (!placement) return null;
  return <ActivePlacement key={`${placement.type}:${placement.movingId ?? "new"}`} placement={placement} />;
}
