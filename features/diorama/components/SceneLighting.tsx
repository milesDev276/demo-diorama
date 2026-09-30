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
        position={[6, 7, 3.5]}
        intensity={1.35}
        color="#ffe9cc"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-bias={-0.0015}
      />
    </>
  );
}
