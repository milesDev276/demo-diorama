import { Environment, Lightformer } from "@react-three/drei";
import { useTimeOfDayLook } from "../hooks/useSceneEnvironment";
import { useDioramaStore } from "../store/dioramaStore";
import { getBaseTemplate } from "../utils/baseTemplates";

/**
 * Soft miniature lighting (meters), set by the canvas's time of day
 * (utils/timeOfDay.ts, hooks/useSceneEnvironment.ts). One sun — the moon at night — casts soft PCF
 * shadows. A small procedural environment — Lightformers, no HDRI file —
 * gives sky fill from above, a glow from the sun side and a little ground
 * bounce, so the ambient and hemisphere lights can stay low. It is rendered
 * once, and again when the look changes.
 * The shadow frustum is fitted to the active base; the sun is recreated
 * when that size changes so its shadow camera picks it up.
 */
export function SceneLighting() {
  const extent = useDioramaStore((s) => getBaseTemplate(s.environment).shadowExtent);
  const look = useTimeOfDayLook();

  return (
    <>
      <ambientLight intensity={look.ambient.intensity} color={look.ambient.color} />
      <hemisphereLight color={look.hemisphere.sky} groundColor={look.hemisphere.ground} intensity={look.hemisphere.intensity} />
      <directionalLight
        key={extent}
        position={look.sun.position}
        intensity={look.sun.intensity}
        color={look.sun.color}
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
      <Environment resolution={256} frames={1} environmentIntensity={look.environment.intensity}>
        {look.environment.formers.map((former, i) => (
          <Lightformer key={i} form="rect" color={former.color} intensity={former.intensity} position={former.position} scale={former.scale} />
        ))}
      </Environment>
    </>
  );
}
