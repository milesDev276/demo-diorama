/**
 * Soft, stylized lighting: no harsh realism. A warm directional "sun" casts
 * gentle shadows, ambient + hemisphere fill keeps shadow areas from going
 * flat black.
 */
export function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.5} color="#fff0dc" />
      <hemisphereLight color="#cfe3f2" groundColor="#e6c9a3" intensity={0.5} />
      <directionalLight
        position={[36, 42, 21]}
        intensity={1.35}
        color="#ffe9cc"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-36}
        shadow-camera-right={36}
        shadow-camera-top={36}
        shadow-camera-bottom={-36}
        shadow-camera-near={3}
        shadow-camera-far={120}
        shadow-bias={-0.0015}
      />
    </>
  );
}
