import { Environment, Lightformer } from "@react-three/drei";
import { useDioramaStore } from "../store/dioramaStore";
import { BASE_TEMPLATES } from "../utils/baseTemplates";

/**
 * Soft, warm miniature lighting (meters). A low warm sun casts soft PCF
 * shadows. A small procedural environment — Lightformers, no HDRI file —
 * gives sky fill from above, a warm glow from the sun side and a little
 * ground bounce, so the ambient and hemisphere lights can stay low.
 * The shadow frustum is fitted to the active base; the sun is recreated
 * when the base changes so its shadow camera picks the new size up.
 */
export function SceneLighting() {
  const base = useDioramaStore((s) => s.environment.base);
  const extent = BASE_TEMPLATES[base].shadowExtent;

  return (
    <>
      <ambientLight intensity={0.25} color="#fff0dc" />
      <hemisphereLight color="#cfe3f2" groundColor="#e6c9a3" intensity={0.45} />
      <directionalLight
        key={base}
        position={[36, 29, 21]}
        intensity={1.8}
        color="#ffe2bf"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-extent}
        shadow-camera-right={extent}
        shadow-camera-top={extent}
        shadow-camera-bottom={-extent}
        shadow-camera-near={3}
        shadow-camera-far={120}
        shadow-bias={-0.001}
        shadow-normalBias={0.02}
        shadow-radius={4}
      />
      <Environment resolution={256} frames={1} environmentIntensity={0.75}>
        <Lightformer form="rect" color="#dcecff" intensity={1} position={[0, 40, 0]} scale={[60, 60, 1]} />
        <Lightformer form="rect" color="#ffe4c2" intensity={2} position={[40, 25, 25]} scale={[20, 20, 1]} />
        <Lightformer form="rect" color="#e9d6bd" intensity={0.5} position={[-40, 10, -20]} scale={[30, 15, 1]} />
        <Lightformer form="rect" color="#cdbba2" intensity={0.4} position={[0, -30, 0]} scale={[60, 60, 1]} />
      </Environment>
    </>
  );
}
