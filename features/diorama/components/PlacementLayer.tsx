"use client";

import { useEffect, useRef, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Group } from "three";
import type { Placement, Vector3Tuple } from "../types/diorama.types";
import { useDioramaStore } from "../store/dioramaStore";
import { ASSET_REGISTRY, getFootprintRadius } from "../assets/assetRegistry";
import { jitteredScale, spawnYaw } from "../utils/objectDefaults";
import { kitNeedsBase, kitRadius } from "../utils/kits";
import { canBeChild, canBeParent, getWorldTransform, indexObjects, type Transform } from "../utils/sceneGraph";
import { roadFrameAt } from "../utils/surfaceMap";
import { collectSurfaces, isSliver, surfaceOwnerId, toPointer, worldNormal } from "../utils/surfacePicking";
import { resolvePlacement, type SurfaceHit } from "../utils/surfaceSnap";
import { AssetVisual } from "./DioramaObject";
import { KitVisual } from "./KitVisual";
import { SelectionRing } from "./SelectionRing";

/** A press that travels further than this (pixels) is an orbit drag, not a placing click. */
const CLICK_TOLERANCE = 5;
/** A run of tiling pieces: its direction snaps to this, and it never has more pieces than MAX_RUN. */
const RUN_ANGLE_STEP = Math.PI / 12;
const MAX_RUN = 40;

/** The heading and scale a new object starts from; varied again after every Shift+click for jittered assets. */
function freshPose(placement: Placement): { yaw: number; scale: Vector3Tuple } {
  if ("kit" in placement) return { yaw: 0, scale: [1, 1, 1] };
  const asset = ASSET_REGISTRY[placement.type];
  return { yaw: spawnYaw(placement.type), scale: jitteredScale(placement.type, asset.defaultScale) };
}

/**
 * The pieces of a run from `start` toward `end`: whole pieces of length
 * `tile` laid end to end along their X axis, beginning at the start point.
 * Null if the drag is too short to be more than the single piece at `start`.
 */
function runPieces(start: Transform, end: Vector3Tuple, tile: number): Transform[] | null {
  const dx = end[0] - start.position[0];
  const dz = end[2] - start.position[2];
  const length = Math.hypot(dx, dz);
  if (length < tile / 2) return null;
  const angle = Math.round(Math.atan2(dz, dx) / RUN_ANGLE_STEP) * RUN_ANGLE_STEP;
  const count = Math.min(MAX_RUN, Math.max(1, Math.round(length / tile)));
  const [ux, uz] = [Math.cos(angle), Math.sin(angle)];
  return Array.from({ length: count }, (_, i) => ({
    position: [start.position[0] + ux * (i + 0.5) * tile, start.position[1], start.position[2] + uz * (i + 0.5) * tile],
    // A heading of −angle turns a piece's +X onto the run's direction.
    rotation: [0, -angle, 0],
    scale: start.scale,
  }));
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
  const placeRun = useDioramaStore((s) => s.placeRun);
  const ghostRef = useRef<Group>(null);
  // The pieces of the row being dragged out, if any. The single ghost is moved through its ref instead.
  const [run, setRun] = useState<Transform[] | null>(null);

  useEffect(() => {
    const element = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const asset = "kit" in placement ? undefined : ASSET_REGISTRY[placement.type];
    const movingId = "kit" in placement ? undefined : placement.movingId;
    const wallMount = asset?.wallMount;
    const road = asset?.road;
    const tile = movingId ? undefined : asset?.tile;
    // Buildings, scatter layers and kits holding either go on the base only.
    const baseOnly = "kit" in placement ? kitNeedsBase(placement.kit) : !canBeChild(placement);
    // A new object keeps one pose until it is placed; a moved one keeps its own.
    let pose = freshPose(placement);
    let pressed: { x: number; y: number } | null = null;
    let lastEvent: PointerEvent | null = null;
    let resolved: { world: Transform; parentId?: string } | null = null;
    /** Set while a row is dragged out: where it starts, and its pieces so far. */
    let dragged: { start: Transform; pieces: Transform[] | null } | null = null;

    const resolve = (event: PointerEvent) => {
      lastEvent = event;
      const { objects, snapEnabled, gridSize, placementYaw, environment } = useDioramaStore.getState();
      const byId = indexObjects(objects);
      const moving = movingId ? byId.get(movingId) : undefined;

      const surfaces = collectSurfaces(scene, (ownerId) => !!ownerId && (baseOnly || ownerId === movingId || dragged !== null));
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
        // A road marking on a plot's asphalt turns to the road, and may center itself across it.
        const frame =
          world && road && !surface.owner && environment.base === "plot" && environment.surface
            ? roadFrameAt(environment.surface, world.position[0], world.position[2])
            : null;
        if (world && frame) {
          world.rotation = [0, (road!.along === frame.axis ? 0 : Math.PI / 2) + placementYaw, 0];
          if (road!.center) world.position[frame.axis === "x" ? 2 : 0] = frame.center;
        }
        if (world) resolved = { world, parentId: surface.owner?.id };
      }

      if (dragged) {
        dragged.pieces = resolved ? runPieces(dragged.start, resolved.world.position, tile!) : dragged.pieces;
        setRun(dragged.pieces);
      }

      const ghost = ghostRef.current;
      if (ghost) {
        const shown = dragged ? (dragged.pieces ? null : dragged.start) : (resolved?.world ?? null);
        ghost.visible = shown !== null;
        if (shown) {
          ghost.position.set(...shown.position);
          ghost.rotation.set(...shown.rotation);
          ghost.scale.set(...shown.scale);
        }
      }
    };

    // A tiling asset pressed on the base starts a row; captured and stopped
    // before OrbitControls, so the drag lays pieces instead of orbiting.
    const handleDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (tile) {
        resolve(event);
        if (resolved && !resolved.parentId) {
          event.stopImmediatePropagation();
          event.preventDefault();
          element.setPointerCapture(event.pointerId);
          dragged = { start: resolved.world, pieces: null };
          return;
        }
      }
      pressed = { x: event.clientX, y: event.clientY };
    };

    const handleUp = (event: PointerEvent) => {
      if (!dragged) return;
      const { start, pieces } = dragged;
      dragged = null;
      setRun(null);
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
      if (event.type === "pointercancel") return;
      if (pieces) placeRun(pieces, event.shiftKey);
      else placeObject(start, undefined, event.shiftKey);
      if (event.shiftKey) resolve(event);
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
      if (dragged) return;
      resolved = null;
      lastEvent = null;
      if (ghostRef.current) ghostRef.current.visible = false;
    };
    // R / Shift+R turn the ghost; show it at once, without waiting for the pointer to move.
    const unsubscribe = useDioramaStore.subscribe((state, previous) => {
      if (state.placementYaw !== previous.placementYaw && lastEvent) resolve(lastEvent);
    });

    element.addEventListener("pointermove", resolve);
    element.addEventListener("pointerdown", handleDown, true);
    element.addEventListener("pointerup", handleUp);
    element.addEventListener("pointercancel", handleUp);
    element.addEventListener("click", handleClick as EventListener, true);
    element.addEventListener("pointerleave", handleLeave);
    return () => {
      unsubscribe();
      element.removeEventListener("pointermove", resolve);
      element.removeEventListener("pointerdown", handleDown, true);
      element.removeEventListener("pointerup", handleUp);
      element.removeEventListener("pointercancel", handleUp);
      element.removeEventListener("click", handleClick as EventListener, true);
      element.removeEventListener("pointerleave", handleLeave);
    };
  }, [gl, camera, scene, placement, placeObject, placeRun]);

  return (
    <>
      <group ref={ghostRef} visible={false}>
        <PlacementGhost placement={placement} />
      </group>
      {run?.map((piece, index) => (
        <group key={index} position={piece.position} rotation={piece.rotation} scale={piece.scale}>
          <PlacementGhost placement={placement} />
        </group>
      ))}
    </>
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
 * building if it landed on one. R turns the ghost. An asset that tiles
 * (walls, rails, lines) can also be dragged out into a row on the base.
 * The ghost's transform is written straight to its group; the store only
 * changes on the click, and React state only while a row is dragged.
 */
export function PlacementLayer() {
  const placement = useDioramaStore((s) => s.placement);
  if (!placement) return null;
  return <ActivePlacement key={placementKey(placement)} placement={placement} />;
}
