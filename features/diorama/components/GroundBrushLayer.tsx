"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useDioramaStore } from "../store/dioramaStore";
import { DIORAMA_COLORS } from "../utils/palette";
import { brushStart, cellAt, levelAt, SURFACE_CELL, surfaceSize } from "../utils/surfaceMap";
import { toPointer, worldNormal } from "../utils/surfacePicking";

type Cell = [number, number];

/** How far the highlight floats above the ground it marks. */
const HIGHLIGHT_LIFT = 0.02;
/** A hit is moved this far into its face, so a hit on a curb's side counts for the cell the curb belongs to. */
const INTO_FACE = 0.01;

/** Outline of the unit square the highlight is scaled from. */
const OUTLINE = new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]);

/** The plot's ground mesh (objects/ground/PlotBase.tsx). */
function findGround(scene: THREE.Object3D): THREE.Object3D | null {
  let ground: THREE.Object3D | null = null;
  scene.traverse((node) => {
    if (node.userData.groundPaint) ground = node;
  });
  return ground;
}

function ActiveGroundBrush() {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  const highlightRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const element = gl.domElement;
    const store = useDioramaStore;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let ground: THREE.Object3D | null = null;
    let stroke: { start: Cell; last: Cell } | null = null;
    let hover: Cell | null = null;

    /** The cell under the pointer. Only the ground is raycast: buildings and props never block the brush. */
    const cellUnder = (event: PointerEvent): Cell | null => {
      const surface = store.getState().environment.surface;
      if (!ground?.parent) ground = findGround(scene);
      if (!surface || !ground) return null;
      raycaster.setFromCamera(toPointer(event, element, pointer), camera);
      const hit = raycaster.intersectObject(ground, false)[0];
      if (!hit?.face) return null;
      const normal = worldNormal(hit);
      return cellAt(surface, hit.point.x - normal.x * INTO_FACE, hit.point.z - normal.z * INTO_FACE);
    };

    const showHighlight = () => {
      const highlight = highlightRef.current;
      const { environment, groundBrushSize: size } = store.getState();
      const surface = environment.surface;
      if (!highlight) return;
      highlight.visible = hover !== null && surface !== undefined;
      if (!hover || !surface) return;
      const { width, depth } = surfaceSize(surface);
      const x = -width / 2 + (brushStart(hover[0], size) + size / 2) * SURFACE_CELL;
      const z = -depth / 2 + (brushStart(hover[1], size) + size / 2) * SURFACE_CELL;
      const cellX = -width / 2 + (hover[0] + 0.5) * SURFACE_CELL;
      const cellZ = -depth / 2 + (hover[1] + 0.5) * SURFACE_CELL;
      highlight.position.set(x, (levelAt(surface, cellX, cellZ) ?? 0) + HIGHLIGHT_LIFT, z);
      highlight.scale.setScalar(size * SURFACE_CELL);
    };

    /** Paints every cell on the way from `from` to `to`, so a fast drag leaves no gaps. */
    const paintLine = (from: Cell, to: Cell) => {
      const steps = Math.max(Math.abs(to[0] - from[0]), Math.abs(to[1] - from[1]));
      const { paintGround } = store.getState();
      for (let step = 1; step <= steps; step++) {
        const t = step / steps;
        paintGround(Math.round(from[0] + (to[0] - from[0]) * t), Math.round(from[1] + (to[1] - from[1]) * t));
      }
    };

    const handleMove = (event: PointerEvent) => {
      let cell = cellUnder(event);
      if (stroke && cell) {
        // Shift keeps the stroke on the row or column it started on: straight roads.
        if (event.shiftKey) {
          const [startI, startJ] = stroke.start;
          cell = Math.abs(cell[0] - startI) >= Math.abs(cell[1] - startJ) ? [cell[0], startJ] : [startI, cell[1]];
        }
        paintLine(stroke.last, cell);
        stroke.last = cell;
      }
      if (cell || !stroke) hover = cell;
      showHighlight();
    };

    // Captured and stopped before OrbitControls and R3F see it: a left drag paints instead of orbiting.
    const handleDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      event.stopImmediatePropagation();
      event.preventDefault();
      const cell = cellUnder(event);
      if (!cell) return;
      element.setPointerCapture(event.pointerId);
      stroke = { start: cell, last: cell };
      hover = cell;
      store.getState().paintGround(cell[0], cell[1]);
      showHighlight();
    };

    const handleUp = (event: PointerEvent) => {
      if (!stroke) return;
      stroke = null;
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
      store.getState().endGroundStroke();
    };

    // While painting, clicks neither select nor deselect.
    const handleClick = (event: MouseEvent) => event.stopImmediatePropagation();

    const handleLeave = () => {
      if (stroke) return;
      hover = null;
      showHighlight();
    };

    const unsubscribe = store.subscribe((state, previous) => {
      if (state.groundBrushSize !== previous.groundBrushSize || state.environment.surface !== previous.environment.surface) showHighlight();
    });

    element.addEventListener("pointermove", handleMove);
    element.addEventListener("pointerdown", handleDown, true);
    element.addEventListener("pointerup", handleUp);
    element.addEventListener("pointercancel", handleUp);
    element.addEventListener("click", handleClick, true);
    element.addEventListener("pointerleave", handleLeave);
    return () => {
      unsubscribe();
      if (stroke) store.getState().endGroundStroke();
      element.removeEventListener("pointermove", handleMove);
      element.removeEventListener("pointerdown", handleDown, true);
      element.removeEventListener("pointerup", handleUp);
      element.removeEventListener("pointercancel", handleUp);
      element.removeEventListener("click", handleClick, true);
      element.removeEventListener("pointerleave", handleLeave);
    };
  }, [gl, camera, scene]);

  return (
    <group ref={highlightRef} visible={false} renderOrder={10}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color={DIORAMA_COLORS.selection} transparent opacity={0.3} depthTest={false} depthWrite={false} />
      </mesh>
      <lineLoop rotation={[-Math.PI / 2, 0, 0]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[OUTLINE, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={DIORAMA_COLORS.selection} depthTest={false} depthWrite={false} />
      </lineLoop>
    </group>
  );
}

/**
 * The ground brush: while the store holds a `groundBrush`, a square follows
 * the pointer over the plot and a left drag sets the cells under it to the
 * brush's kind (Shift keeps the drag on a straight line). Each stroke is
 * one undo step. Right-drag still pans and the wheel zooms.
 */
export function GroundBrushLayer() {
  const isActive = useDioramaStore((s) => s.groundBrush !== null && s.environment.base === "plot");
  return isActive ? <ActiveGroundBrush /> : null;
}
