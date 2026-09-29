/**
 * Soft, stylized lighting: no harsh realism. A warm directional "sun" casts
 * gentle shadows, ambient + hemisphere fill keeps shadow areas from going
 * flat black.
 */
export function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.55} color="#fff4e6" />
      <hemisphereLight color="#bfe3ff" groundColor="#e8c9a0" intensity={0.5} />
      <directionalLight
        position={[5, 8, 4]}
        intensity={1.3}
        color="#fff1d8"
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
