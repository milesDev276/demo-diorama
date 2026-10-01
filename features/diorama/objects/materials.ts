import { MeshStandardMaterial, type Material } from "three";
import { getGraphicsAtlas } from "./textures/graphicsAtlas";

/**
 * The three materials every Blender GLB renders with. Assets carry their
 * colors (palette + baked AO and grime) as vertex colors and name their
 * material slots `base`, `emissive` and `printed`; GltfAsset swaps each
 * slot for the shared material below, so all instances of all assets share
 * three shader programs and the look is tuned in one place.
 */

/** Glow of every `emissive` slot (vending fronts, later windows and signs). One
 *  value for the whole scene, so a time-of-day preset only has to change this. */
export const EMISSIVE_INTENSITY = 0.55;

const BASE_ROUGHNESS = 0.65;

function createBaseMaterial() {
  return new MeshStandardMaterial({ vertexColors: true, roughness: BASE_ROUGHNESS, metalness: 0 });
}

/** Lit like `base`, plus an emission tinted by the vertex color — as in the
 *  Blender slot material. three's emissive is a single color, so the shader
 *  gets one extra line after its emissive-map chunk (r184 chunk names). */
function createEmissiveMaterial() {
  const material = new MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.5,
    metalness: 0,
    emissive: 0xffffff,
    emissiveIntensity: EMISSIVE_INTENSITY,
  });
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      "#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= vColor.rgb;"
    );
  };
  material.customProgramCacheKey = () => "diorama-emissive-vertex-color";
  return material;
}

/** Atlas graphics; the vertex colors (white × baked AO and grime) weather the print. */
function createPrintedMaterial() {
  return new MeshStandardMaterial({
    vertexColors: true,
    map: getGraphicsAtlas(),
    roughness: 0.6,
    metalness: 0,
  });
}

const FACTORIES: Record<string, () => Material> = {
  base: createBaseMaterial,
  emissive: createEmissiveMaterial,
  printed: createPrintedMaterial,
};

const materials = new Map<string, Material>();
const warnedSlots = new Set<string>();

/** The shared material for a Blender slot name. Unknown slots render as `base`. */
export function getSlotMaterial(slot: string): Material {
  let name = slot;
  if (!(name in FACTORIES)) {
    if (!warnedSlots.has(slot)) {
      warnedSlots.add(slot);
      console.warn(`[diorama] Unknown material slot "${slot}" — rendering it as "base".`);
    }
    name = "base";
  }
  let material = materials.get(name);
  if (!material) {
    material = FACTORIES[name]();
    materials.set(name, material);
  }
  return material;
}
