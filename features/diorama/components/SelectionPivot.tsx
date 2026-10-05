"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { TransformControls } from "@react-three/drei";
import * as THREE from "three";
import type { Group } from "three";
import type { DioramaObject, Vector3Tuple } from "../types/diorama.types";
import { useDioramaStore } from "../store/dioramaStore";
import { getSelectionCenter } from "../utils/sceneGraph";

/** What a drag started from. */
interface DragStart {
  /** The pivot's world position at the last step of a move. */
  position: THREE.Vector3;
  center: Vector3Tuple;
  objects: DioramaObject[];
}

/**
 * The gizmo of a multi-selection: a pivot at the selection's center that
 * moves the whole group, or turns it about that center. The pivot is not
 * scene data — it is put back on the center whenever the selection or the
 * objects change outside a drag.
 */
export function SelectionPivot({ ids }: { ids: string[] }) {
  const [pivot, setPivot] = useState<Group | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<DragStart | null>(null);
  const objects = useDioramaStore((s) => s.objects);
  const transformMode = useDioramaStore((s) => s.transformMode);
  const snapEnabled = useDioramaStore((s) => s.snapEnabled);
  const gridSize = useDioramaStore((s) => s.gridSize);
  const rotationSnapEnabled = useDioramaStore((s) => s.rotationSnapEnabled);
  const rotationSnapDegrees = useDioramaStore((s) => s.rotationSnapDegrees);
  const translateObjectsBy = useDioramaStore((s) => s.translateObjectsBy);
  const turnObjectsAbout = useDioramaStore((s) => s.turnObjectsAbout);
  const commitTransform = useDioramaStore((s) => s.commitTransform);

  const center = useMemo(() => getSelectionCenter(objects, ids), [objects, ids]);
  const isRotating = transformMode === "rotate";

  useLayoutEffect(() => {
    if (!pivot || !center || isDragging) return;
    pivot.position.set(...center);
    pivot.rotation.set(0, 0, 0);
  }, [pivot, center, isDragging]);

  const handleMouseDown = useCallback(() => {
    if (!pivot) return;
    const position = pivot.getWorldPosition(new THREE.Vector3());
    dragRef.current = { position, center: position.toArray(), objects: useDioramaStore.getState().objects };
    setIsDragging(true);
  }, [pivot]);

  const handleObjectChange = useCallback(() => {
    const drag = dragRef.current;
    if (!pivot || !drag) return;
    if (isRotating) {
      // Only the Y ring is shown; read the angle from the quaternion, which does not flip past ±90° as Euler angles do.
      const angle = 2 * Math.atan2(pivot.quaternion.y, pivot.quaternion.w);
      turnObjectsAbout(ids, drag.center, angle, drag.objects);
      return;
    }
    const position = pivot.getWorldPosition(new THREE.Vector3());
    const delta = position.clone().sub(drag.position).toArray() as Vector3Tuple;
    drag.position.copy(position);
    if (delta[0] !== 0 || delta[1] !== 0 || delta[2] !== 0) translateObjectsBy(ids, delta);
  }, [pivot, ids, isRotating, translateObjectsBy, turnObjectsAbout]);

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
    commitTransform();
    setIsDragging(false);
  }, [commitTransform]);

  return (
    <>
      <group ref={setPivot} />
      {pivot && center && (
        <TransformControls
          object={pivot}
          mode={isRotating ? "rotate" : "translate"}
          showX={!isRotating}
          showY
          showZ={!isRotating}
          translationSnap={snapEnabled ? gridSize : null}
          rotationSnap={rotationSnapEnabled ? THREE.MathUtils.degToRad(rotationSnapDegrees) : null}
          onMouseDown={handleMouseDown}
          onObjectChange={handleObjectChange}
          onMouseUp={handleMouseUp}
          size={0.8}
        />
      )}
    </>
  );
}
