"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Group } from "three";
import type { Placement, Vector3Tuple } from "../types/diorama.types";
import { useDioramaStore } from "../store/dioramaStore";
import { ASSET_REGISTRY, getFootprintRadius } from "../assets/assetRegistry";
import { jitteredScale, spawnYaw } from "../utils/objectDefaults";
import { kitNeedsBase, kitRadius } from "../utils/kits";
import { canBeChild, canBeParent, getWorldTransform, indexObjects, type Transform } from "../utils/sceneGraph";
import { collectSurfaces, isSliver, surfaceOwnerId, toPointer, worldNormal } from "../utils/surfacePicking";
import { resolvePlacement, type SurfaceHit } from "../utils/surfaceSnap";
import { AssetVisual } from "./DioramaObject";
import { KitVisual } from "./KitVisual";
import { SelectionRing } from "./SelectionRing";

/** A press that travels further than this (pixels) is an orbit drag, not a placing click. */
const CLICK_TOLERANCE = 5;

/** The heading and scale a new object starts from; varied again after every Shift+click for jittered assets. */
function freshPose(placement: Placement): { yaw: number; scale: Vector3Tuple } {
  if ("kit" in placement) return { yaw: 0, scale: [1, 1, 1] };
  const asset = ASSET_REGISTRY[placement.type];
  return { yaw: spawnYaw(placement.type), scale: jitteredScale(placement.type, asset.defaultScale) };
}

function PlacementGhost({ placement }: { placement: Placement }) {
  if ("kit" in placement) {
    return (
      <>
        <KitVisual kit={placement.kit} />
        <SelectionRing radius={kitRadius(placement.kit)} />
      </>
    );
  }
  const object = { type: placement.type, params: placement.params };
  return (
    <>
      <AssetVisual object={object} />
      <SelectionRing radius={getFootprintRadius(object)} />
    </>
  );
}

function ActivePlacement({ placement }: { placement: Placement }) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  const placeObject = useDioramaStore((s) => s.placeObject);
  const ghostRef = useRef<Group>(null);

  useEffect(() => {
    const element = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const movingId = "kit" in placement ? undefined : placement.movingId;
    const wallMount = "kit" in placement ? undefined : ASSET_REGISTRY[placement.type].wallMount;
    // Buildings, scatter layers and kits holding either go on the base only.
    const baseOnly = "kit" in placement ? kitNeedsBase(placement.kit) : !canBeChild(placement);
    // A new object keeps one pose until it is placed; a moved one keeps its own.
    let pose = freshPose(placement);
    let pressed: { x: number; y: number } | null = null;
    let lastEvent: PointerEvent | null = null;
    let resolved: { world: Transform; parentId?: string } | null = null;

    const resolve = (event: PointerEvent) => {
      lastEvent = event;
      const { objects, snapEnabled, gridSize, placementYaw } = useDioramaStore.getState();
      const byId = indexObjects(objects);
      const moving = movingId ? byId.get(movingId) : undefined;

      const surfaces = collectSurfaces(scene, (ownerId) => !!ownerId && (baseOnly || ownerId === movingId));
      raycaster.setFromCamera(toPointer(event, element, pointer), camera);
      const hit = raycaster.intersectObjects(surfaces, true).find((candidate) => !isSliver(candidate));
      resolved = null;
      if (hit?.face) {
        const ownerId = surfaceOwnerId(hit.object);
        const owner = ownerId ? byId.get(ownerId) : undefined;
        const surface: SurfaceHit = {
          point: hit.point.toArray(),
          normal: worldNormal(hit).toArray(),
          owner: owner && canBeParent(owner) ? owner : undefined,
        };
        const current = moving ? getWorldTransform(moving, byId) : undefined;
        const world = resolvePlacement(surface, byId, {
          grid: snapEnabled ? gridSize : null,
          wallMount,
          yaw: (current ? current.rotation[1] : pose.yaw) + placementYaw,
          yawFollowsOwner: !current,
          scale: current ? current.scale : pose.scale,
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
      if (!resolved) return;
      placeObject(resolved.world, resolved.parentId, event.shiftKey);
      if (event.shiftKey) {
        // The next one gets its own heading and size, so a row of pots or trees never looks stamped.
        if (!("kit" in placement) && ASSET_REGISTRY[placement.type].jitter) pose = freshPose(placement);
        resolve(event);
      }
    };
    const handleLeave = () => {
      resolved = null;
      lastEvent = null;
      if (ghostRef.current) ghostRef.current.visible = false;
    };
    // R / Shift+R turn the ghost; show it at once, without waiting for the pointer to move.
    const unsubscribe = useDioramaStore.subscribe((state, previous) => {
      if (state.placementYaw !== previous.placementYaw && lastEvent) resolve(lastEvent);
    });

    element.addEventListener("pointermove", resolve);
    element.addEventListener("pointerdown", handleDown);
    element.addEventListener("click", handleClick as EventListener, true);
    element.addEventListener("pointerleave", handleLeave);
    return () => {
      unsubscribe();
      element.removeEventListener("pointermove", resolve);
      element.removeEventListener("pointerdown", handleDown);
      element.removeEventListener("click", handleClick as EventListener, true);
      element.removeEventListener("pointerleave", handleLeave);
    };
  }, [gl, camera, scene, placement, placeObject]);

  return (
    <group ref={ghostRef} visible={false}>
      <PlacementGhost placement={placement} />
    </group>
  );
}

/** Identifies a placement session, so a new one starts with a fresh ghost. */
function placementKey(placement: Placement): string {
  return "kit" in placement ? `kit:${placement.kit.id}` : `${placement.type}:${placement.movingId ?? "new"}`;
}

/**
 * Click-to-place: while the store holds a `placement`, a ghost of the asset
 * (or of a whole kit) follows the pointer over the base and the buildings,
 * snapped by utils/surfaceSnap, and a click puts it there — attached to the
 * building if it landed on one. R turns the ghost. The ghost's transform is
 * written straight to its group; the store only changes on the click.
 */
export function PlacementLayer() {
  const placement = useDioramaStore((s) => s.placement);
  if (!placement) return null;
  return <ActivePlacement key={placementKey(placement)} placement={placement} />;
}
