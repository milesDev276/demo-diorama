import { Mesh, QuadraticBezierCurve3, TubeGeometry, Vector3, type Intersection } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { getSlotMaterial, isWithinWireBounds } from "./materials";
import layout from "./poleLayout.json";

/** Pole-to-pole spans drawn on each side: enough to pass the edge of any base, where the wires are cut. */
const SPANS_PER_SIDE = 2;

/** One drooping span from x0 to x1 at a wire's attach height and depth. */
function spanCurve(x0: number, x1: number, wire: (typeof layout.wires)[number]) {
  // A quadratic Bézier reaches half its control-point offset at t = 0.5,
  // so double the sag on the control point.
  return new QuadraticBezierCurve3(
    new Vector3(x0, wire.y, wire.z),
    new Vector3((x0 + x1) / 2, wire.y - wire.sag * 2, wire.z),
    new Vector3(x1, wire.y, wire.z)
  );
}

// Static geometry — built once at module load, shared by every instance: one draw call per power line.
const WIRES = mergeGeometries(
  layout.wires.flatMap((wire) =>
    Array.from({ length: SPANS_PER_SIDE * 2 }, (_, i) => {
      const x0 = (i - SPANS_PER_SIDE) * layout.span;
      return new TubeGeometry(spanCurve(x0, x0 + layout.span, wire), 16, wire.radius, 4, false);
    })
  )
);

/** Picking ignores clipping planes: without this, a click past the base's edge would still hit the cut-off wires. */
const raycastDrawnPart: Mesh["raycast"] = function (this: Mesh, raycaster, intersects) {
  const hits: Intersection[] = [];
  Mesh.prototype.raycast.call(this, raycaster, hits);
  for (const hit of hits) if (isWithinWireBounds(hit.point)) intersects.push(hit);
};

/**
 * Overhead lines passing over a utility pole (meters): high-voltage wires
 * on the crossarm and the pole top, a low-voltage pair below them and a
 * communication cable, running along local X toward the next poles and
 * drooping in between. Origin is the pole's base — place it at a pole's
 * position (same rotation) and the wires meet its insulators
 * (objects/poleLayout.json, which the pole's Blender script also reads).
 * The `wire` material cuts them off at the edge of the base.
 */
export function PowerLine() {
  return <mesh geometry={WIRES} material={getSlotMaterial("wire")} raycast={raycastDrawnPart} castShadow />;
}
