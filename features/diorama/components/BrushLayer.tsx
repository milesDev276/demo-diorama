"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { BrushState, Vector3Tuple } from "../types/diorama.types";
import { useDioramaStore } from "../store/dioramaStore";
import { SCATTER_KIND_SPECS } from "../assets/scatterKinds";
import { scatterParamsOf } from "../utils/objectParams";
import { MAX_SCATTER_POINTS, roundPoint } from "../utils/scatterParams";
import { getWorldMatrix, indexObjects } from "../utils/sceneGraph";
import { collectSurfaces, isSliver, surfaceOwnerId, toPointer, worldNormal } from "../utils/surfacePicking";
import { DIORAMA_COLORS } from "../utils/palette";

/** Faces whose normal points up at least this much count as ground. */
const FLAT_NORMAL_Y = 0.7;
/** Stamps are laid along the drag this far apart, as a fraction of the brush radius. */
const STAMP_STEP = 0.35;
/** Height the downward probe rays start from: above every roof. */
const PROBE_HEIGHT = 60;

const ERASE_COLOR = "#c0574d";

interface Stroke {
  erase: boolean;
  layerId?: string;
  last: THREE.Vector3;
  /** The layer's pieces in world space, for the spacing test. */
  world: THREE.Vector3[];
  /** The same pieces in the layer's frame, as stored. */
  local: Vector3Tuple[];
  toLocal: THREE.Matrix4;
}

function ActiveBrush({ brush }: { brush: BrushState }) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  const ringRef = useRef<THREE.Group>(null);
  const ringMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const discMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const kind = brush.kind;

  useEffect(() => {
    const element = gl.domElement;
    const store = useDioramaStore;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const down = new THREE.Vector3(0, -1, 0);
    const spec = SCATTER_KIND_SPECS[kind];
    let stroke: Stroke | null = null;
    let surfaces: THREE.Object3D[] = [];
    let hover: { point: THREE.Vector3 | null; alt: boolean } = { point: null, alt: false };

    /** The first surface under a ray, if it is flat ground of the base (buildings block it). */
    const groundHit = (): THREE.Vector3 | null => {
      const hit = raycaster.intersectObjects(surfaces, true).find((candidate) => !isSliver(candidate));
      if (!hit?.face || surfaceOwnerId(hit.object) !== undefined) return null;
      return worldNormal(hit).y > FLAT_NORMAL_Y ? hit.point.clone() : null;
    };

    const pointerHit = (event: PointerEvent) => {
      surfaces = collectSurfaces(scene);
      raycaster.setFromCamera(toPointer(event, element, pointer), camera);
      raycaster.far = Infinity;
      return groundHit();
    };

    const groundBelow = (x: number, z: number) => {
      raycaster.set(new THREE.Vector3(x, PROBE_HEIGHT, z), down);
      return groundHit();
    };

    const showRing = () => {
      const ring = ringRef.current;
      if (!ring) return;
      const { brushRadius, brushErase } = store.getState();
      const point = stroke ? stroke.last : hover.point;
      ring.visible = point !== null;
      if (!point) return;
      ring.position.set(point.x, point.y + 0.03, point.z);
      ring.scale.setScalar(brushRadius);
      const erase = stroke ? stroke.erase : hover.alt || brushErase;
      const color = erase ? ERASE_COLOR : DIORAMA_COLORS.selection;
      ringMaterialRef.current?.color.set(color);
      discMaterialRef.current?.color.set(color);
    };

    const paintAt = (center: THREE.Vector3, current: Stroke) => {
      const { brushRadius, brushDensity } = store.getState();
      const spacing = spec.spacing * (1 + (1 - brushDensity) * 2);
      const tries = Math.min(24, Math.max(2, Math.ceil(((Math.PI * brushRadius * brushRadius) / (spacing * spacing)) * 0.6)));
      let added = false;
      for (let i = 0; i < tries && current.local.length < MAX_SCATTER_POINTS; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = brushRadius * Math.sqrt(Math.random());
        const point = groundBelow(center.x + Math.cos(angle) * r, center.z + Math.sin(angle) * r);
        if (!point) continue;
        if (current.world.some((q) => (q.x - point.x) ** 2 + (q.z - point.z) ** 2 < spacing * spacing)) continue;
        current.world.push(point);
        current.local.push(roundPoint(point.clone().applyMatrix4(current.toLocal).toArray()));
        added = true;
      }
      if (added && current.layerId) store.getState().setScatterPoints(current.layerId, [...current.local]);
    };

    const eraseAt = (center: THREE.Vector3) => {
      const { objects, brushRadius, setScatterPoints } = store.getState();
      const byId = indexObjects(objects);
      const point = new THREE.Vector3();
      for (const layer of objects) {
        const params = scatterParamsOf(layer);
        if (!params || params.kind !== kind || layer.locked || !layer.visible) continue;
        const toWorld = getWorldMatrix(layer, byId);
        const kept = params.points.filter((p) => {
          point.set(...p).applyMatrix4(toWorld);
          return (point.x - center.x) ** 2 + (point.z - center.z) ** 2 > brushRadius * brushRadius;
        });
        if (kept.length !== params.points.length) setScatterPoints(layer.id, kept);
      }
    };

    const stamp = (center: THREE.Vector3, current: Stroke) => {
      if (current.erase) eraseAt(center);
      else paintAt(center, current);
    };

    const beginStroke = (origin: THREE.Vector3, erase: boolean): Stroke => {
      const state = store.getState();
      if (erase) return { erase, last: origin, world: [], local: [], toLocal: new THREE.Matrix4() };
      const layerId = state.beginScatterStroke(origin.toArray()) ?? undefined;
      const { objects } = store.getState();
      const layer = objects.find((o) => o.id === layerId);
      const toWorld = layer ? getWorldMatrix(layer, indexObjects(objects)) : new THREE.Matrix4();
      const local = [...(layer ? (scatterParamsOf(layer)?.points ?? []) : [])];
      const world = local.map((p) => new THREE.Vector3(...p).applyMatrix4(toWorld));
      return { erase, layerId, last: origin, world, local, toLocal: toWorld.clone().invert() };
    };

    const handleMove = (event: PointerEvent) => {
      const point = pointerHit(event);
      hover = { point, alt: event.altKey };
      if (stroke && point) {
        // Fill the gap since the last stamp, so a fast drag leaves no holes.
        const step = store.getState().brushRadius * STAMP_STEP;
        const distance = Math.hypot(point.x - stroke.last.x, point.z - stroke.last.z);
        const steps = Math.floor(distance / step);
        const from = stroke.last.clone();
        for (let i = 1; i <= steps; i++) {
          const center = from.clone().lerp(point, (i * step) / distance);
          stroke.last = center;
          stamp(center, stroke);
        }
      }
      showRing();
    };

    // Captured and stopped before OrbitControls and R3F see it: a left drag paints instead of orbiting.
    const handleDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      event.stopImmediatePropagation();
      event.preventDefault();
      const point = pointerHit(event);
      if (!point) return;
      element.setPointerCapture(event.pointerId);
      stroke = beginStroke(point, event.altKey || store.getState().brushErase);
      stamp(point, stroke);
      showRing();
    };

    const handleUp = (event: PointerEvent) => {
      if (!stroke) return;
      stroke = null;
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
      store.getState().endScatterStroke();
    };

    // While brushing, clicks neither select nor deselect.
    const handleClick = (event: MouseEvent) => event.stopImmediatePropagation();

    const handleLeave = () => {
      if (stroke) return;
      hover = { point: null, alt: false };
      showRing();
    };

    const unsubscribe = store.subscribe((state, previous) => {
      if (state.brushRadius !== previous.brushRadius || state.brushErase !== previous.brushErase) showRing();
    });

    element.addEventListener("pointermove", handleMove);
    element.addEventListener("pointerdown", handleDown, true);
    element.addEventListener("pointerup", handleUp);
    element.addEventListener("pointercancel", handleUp);
    element.addEventListener("click", handleClick, true);
    element.addEventListener("pointerleave", handleLeave);
    return () => {
      unsubscribe();
      if (stroke) store.getState().endScatterStroke();
      element.removeEventListener("pointermove", handleMove);
      element.removeEventListener("pointerdown", handleDown, true);
      element.removeEventListener("pointerup", handleUp);
      element.removeEventListener("pointercancel", handleUp);
      element.removeEventListener("click", handleClick, true);
      element.removeEventListener("pointerleave", handleLeave);
    };
  }, [gl, camera, scene, kind]);

  return (
    <group ref={ringRef} visible={false} renderOrder={10}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.93, 1, 48]} />
        <meshBasicMaterial ref={ringMaterialRef} transparent opacity={0.9} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.93, 48]} />
        <meshBasicMaterial ref={discMaterialRef} transparent opacity={0.14} depthWrite={false} />
      </mesh>
    </group>
  );
}

/**
 * The scatter brush: while the store holds a `brush`, a ring follows the
 * pointer over the base and a left drag paints pieces of the brush's kind
 * into one layer (Alt+drag or Erase mode removes them). Pieces only land on
 * flat ground of the base — never under a building. Each stroke is one undo
 * step. Right-drag still pans and the wheel zooms.
 */
export function BrushLayer() {
  const brush = useDioramaStore((s) => s.brush);
  if (!brush) return null;
  return <ActiveBrush key={brush.kind} brush={brush} />;
}
