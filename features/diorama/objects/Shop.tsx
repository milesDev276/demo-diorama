import { DIORAMA_COLORS } from "../utils/palette";
import { AirConditionerUnit } from "./parts/AirConditionerUnit";

const WIDTH = 1.1;
const HEIGHT = 0.8;
const DEPTH = 0.85;
const FRONT = DEPTH / 2;

/**
 * Small neighborhood shop: a boxy one-storey building with a slight shed
 * roof, sliding glass storefront, a kanban signboard, and a cloth awning.
 * Front faces local +Z.
 */
export function Shop() {
  return (
    <group>
      <mesh position={[0, HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WIDTH, HEIGHT, DEPTH]} />
        <meshStandardMaterial color={DIORAMA_COLORS.wallSiding} roughness={0.85} />
      </mesh>

      {/* Shed roof cap, sloping gently to the back */}
      <mesh position={[0, HEIGHT + 0.02, 0]} rotation={[-0.06, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[WIDTH + 0.08, 0.04, DEPTH + 0.08]} />
        <meshStandardMaterial color={DIORAMA_COLORS.roofTile} roughness={0.75} flatShading />
      </mesh>

      {/* Sliding glass storefront with wooden frame */}
      <mesh position={[0, 0.2, FRONT + 0.004]}>
        <boxGeometry args={[0.84, 0.34, 0.008]} />
        <meshStandardMaterial
          color={DIORAMA_COLORS.windowGlow}
          emissive={DIORAMA_COLORS.windowGlow}
          emissiveIntensity={0.3}
          roughness={0.3}
        />
      </mesh>
      {[-0.28, 0, 0.28].map((x) => (
        <mesh key={x} position={[x, 0.2, FRONT + 0.01]}>
          <boxGeometry args={[0.02, 0.34, 0.01]} />
          <meshStandardMaterial color={DIORAMA_COLORS.woodTrim} roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 0.375, FRONT + 0.01]}>
        <boxGeometry args={[0.86, 0.02, 0.012]} />
        <meshStandardMaterial color={DIORAMA_COLORS.woodTrim} roughness={0.9} />
      </mesh>

      {/* Kanban signboard with blocky "lettering" */}
      <mesh position={[0, 0.6, FRONT + 0.015]} castShadow>
        <boxGeometry args={[1.02, 0.12, 0.03]} />
        <meshStandardMaterial color={DIORAMA_COLORS.signBoard} roughness={0.7} />
      </mesh>
      {[-0.21, -0.07, 0.07, 0.21].map((x) => (
        <mesh key={x} position={[x, 0.6, FRONT + 0.032]}>
          <boxGeometry args={[0.07, 0.07, 0.004]} />
          <meshStandardMaterial color={DIORAMA_COLORS.shopAwning} roughness={0.7} />
        </mesh>
      ))}

      {/* Cloth awning over the storefront */}
      <mesh position={[0, 0.46, FRONT + 0.1]} rotation={[0.35, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.98, 0.012, 0.22]} />
        <meshStandardMaterial color={DIORAMA_COLORS.shopAwning} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.405, FRONT + 0.2]} castShadow>
        <boxGeometry args={[0.98, 0.04, 0.008]} />
        <meshStandardMaterial color={DIORAMA_COLORS.shopAwningLight} roughness={0.9} />
      </mesh>

      <AirConditionerUnit position={[WIDTH / 2 + 0.045, 0, -0.12]} rotationY={Math.PI / 2} />
    </group>
  );
}
