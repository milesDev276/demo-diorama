"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrthographicCamera, useProgress } from "@react-three/drei";
import {
  Box3,
  NeutralToneMapping,
  Vector3,
  type Group,
  type InstancedMesh,
  type Material,
  type Mesh,
  type Object3D,
  type OrthographicCamera as OrthographicCameraImpl,
} from "three";
import { getAllLibraryItems, thumbnailFileName, type LibraryItem } from "../../assets/assetRegistry";
import { BUILT_IN_KITS } from "../../assets/builtInKits";
import { setWireBounds } from "../../objects/materials";
import { BASE_TEMPLATES } from "../../utils/baseTemplates";
import { CAMERA_PRESETS } from "../../utils/cameraPresets";
import { scatterPatchParams } from "../../utils/objectDefaults";
import { AssetVisual } from "../DioramaObject";
import { KitVisual } from "../KitVisual";
import { SceneLighting } from "../SceneLighting";

declare global {
  interface Window {
    /** Read by scripts/capture-thumbnails.mjs. */
    __thumbnails?: {
      items: Array<{ key: string; file: string }>;
      /** Shows one item and resolves once it is loaded and framed. */
      show: (key: string) => Promise<void>;
    };
  }
}

/** Frames that the content must keep the same bounds before it counts as ready. */
const STABLE_FRAMES = 20;
/** Share of the frame the item fills. */
const FILL = 0.84;
/** Thumbnails of scatter kinds show a small round patch, the same every time. */
const PATCH_SEED = 7;
/** Overhead wires are shown as the stretch that crosses this base. */
const WIRE_BASE = BASE_TEMPLATES.corner;

const DIRECTION = new Vector3(...CAMERA_PRESETS.isometric.position).normalize();

function ItemVisual({ item }: { item: LibraryItem }) {
  const patch = useMemo(() => (item.action === "brush" ? scatterPatchParams(item.kind, 0.55, PATCH_SEED) : null), [item]);
  if (item.action === "kit") return <KitVisual kit={item.kit} />;
  if (item.action === "brush") return <AssetVisual object={{ type: "scatter", params: patch! }} />;
  return <AssetVisual object={{ type: item.type, params: item.params }} />;
}

/**
 * Waits until every model has loaded and the content's bounds hold still,
 * then fits the isometric camera around it and reports ready.
 */
/**
 * Tight world bounds of everything drawn under `root`: from the vertices of
 * plain meshes (a rotated geometry's own box would overstate it — a hipped
 * roof turned 45° doubles), from the instances of instanced ones. A mesh
 * that its material cuts off (overhead wires) counts only up to the cut.
 */
function contentBounds(root: Object3D): Box3 {
  const box = new Box3();
  const part = new Box3();
  const vertex = new Vector3();
  root.updateWorldMatrix(true, true);
  root.traverse((node) => {
    const mesh = node as Mesh;
    if (!mesh.isMesh || !mesh.visible) return;
    const instanced = mesh as InstancedMesh;
    if (instanced.isInstancedMesh) {
      instanced.computeBoundingBox();
      part.copy(instanced.boundingBox!).applyMatrix4(instanced.matrixWorld);
    } else {
      part.makeEmpty();
      const position = mesh.geometry.getAttribute("position");
      for (let i = 0; i < position.count; i++) part.expandByPoint(vertex.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld));
      // Axis-aligned clipping planes (objects/materials.ts): keep the side their normal points to.
      for (const plane of (mesh.material as Material).clippingPlanes ?? []) {
        for (const axis of ["x", "y", "z"] as const) {
          if (plane.normal[axis] < -0.99) part.max[axis] = Math.min(part.max[axis], plane.constant);
          if (plane.normal[axis] > 0.99) part.min[axis] = Math.max(part.min[axis], -plane.constant);
        }
      }
    }
    box.union(part);
  });
  return box;
}

/** Where the soft contact shadow goes: under the item, as large as its footprint. */
interface ShadowSpot {
  position: [number, number, number];
  scale: number;
  far: number;
}

interface FramerProps {
  content: React.RefObject<Group | null>;
  itemKey: string;
  onFramed: (spot: ShadowSpot) => void;
  onReady: () => void;
}

function Framer({ content, itemKey, onFramed, onReady }: FramerProps) {
  const camera = useThree((s) => s.camera) as OrthographicCameraImpl;
  const size = useThree((s) => s.size);
  const progress = useRef({ key: "", bounds: "", stable: 0 });

  useFrame(() => {
    const group = content.current;
    if (!group) return;
    if (progress.current.key !== itemKey) progress.current = { key: itemKey, bounds: "", stable: 0 };
    const state = progress.current;
    if (useProgress.getState().active) {
      state.stable = 0;
      return;
    }
    const box = contentBounds(group);
    if (box.isEmpty()) return;
    const bounds = [...box.min.toArray(), ...box.max.toArray()].map((n) => n.toFixed(3)).join();
    if (bounds !== state.bounds) {
      state.bounds = bounds;
      state.stable = 0;
      fit(camera, box, size);
      const center = box.getCenter(new Vector3());
      const extent = box.getSize(new Vector3());
      onFramed({
        position: [center.x, box.min.y + 0.002, center.z],
        scale: Math.max(extent.x, extent.z) * 1.4 + 0.3,
        far: extent.y + 0.5,
      });
      return;
    }
    if (++state.stable === STABLE_FRAMES) onReady();
  });
  return null;
}

function fit(camera: OrthographicCameraImpl, box: Box3, size: { width: number; height: number }) {
  const center = box.getCenter(new Vector3());
  camera.position.copy(center).addScaledVector(DIRECTION, 60);
  camera.lookAt(center);
  camera.updateMatrixWorld();
  // The box's extent as seen by the camera.
  const corners = [0, 1, 2, 3, 4, 5, 6, 7].map((i) =>
    new Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).applyMatrix4(
      camera.matrixWorldInverse
    )
  );
  const xs = corners.map((c) => c.x);
  const ys = corners.map((c) => c.y);
  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);
  camera.zoom = Math.min(size.width / width, size.height / height) * FILL;
  camera.updateProjectionMatrix();
}

/**
 * Dev page for scripts/capture-thumbnails.mjs (`/diorama/thumbnails`): one
 * library item alone on a transparent canvas, lit and shaded like the
 * editor by day in autumn (the canvas has no scene environment, so it gets
 * the defaults), seen from the isometric preset's direction with a soft
 * contact shadow. User kits are not included — they have no fixed look.
 */
export function ThumbnailStudio() {
  const items = useMemo(() => getAllLibraryItems(BUILT_IN_KITS), []);
  const [key, setKey] = useState(() => new URLSearchParams(window.location.search).get("item") ?? items[0].key);
  const content = useRef<Group>(null);
  const waiting = useRef<{ key: string; resolve: () => void } | null>(null);
  const readyKey = useRef<string | null>(null);
  const [shadow, setShadow] = useState<ShadowSpot | null>(null);
  const item = items.find((candidate) => candidate.key === key) ?? items[0];

  useEffect(() => setWireBounds(WIRE_BASE.width, WIRE_BASE.depth), []);

  useEffect(() => {
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    window.__thumbnails = {
      items: items.map((candidate) => ({ key: candidate.key, file: thumbnailFileName(candidate.key) })),
      show: (next) =>
        new Promise((resolve) => {
          if (readyKey.current === next) return resolve();
          waiting.current = { key: next, resolve };
          setKey(next);
        }),
    };
    return () => {
      delete window.__thumbnails;
    };
  }, [items]);

  const onReady = () => {
    readyKey.current = item.key;
    if (waiting.current?.key === item.key) {
      waiting.current.resolve();
      waiting.current = null;
    }
  };

  return (
    <div className="h-screen w-screen">
      <Canvas
        shadows="percentage"
        gl={{ alpha: true, antialias: true, toneMapping: NeutralToneMapping, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true; // the wire material's cut
        }}
      >
        <OrthographicCamera makeDefault near={0.1} far={400} position={CAMERA_PRESETS.isometric.position} zoom={20} />
        <SceneLighting />
        {/* A soft shadow straight under the item; the sun's shadow would be cut off by the frame. */}
        {shadow && (
          <ContactShadows position={shadow.position} scale={shadow.scale} far={shadow.far} blur={2.4} opacity={0.38} resolution={512} color="#4a3a2c" />
        )}
        <group ref={content} key={item.key}>
          <ItemVisual item={item} />
        </group>
        <Framer content={content} itemKey={item.key} onFramed={setShadow} onReady={onReady} />
      </Canvas>
    </div>
  );
}
