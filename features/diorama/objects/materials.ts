import { MeshStandardMaterial, type Material } from "three";
import { getGraphicsAtlas } from "./textures/graphicsAtlas";

/**
 * The shared materials of everything authored in meters. Blender GLBs
 * carry their colors as vertex colors and name their material slots
 * `base`, `emissive` and `printed`; GltfAsset swaps each slot for the
 * shared material below. App-built bases use `ground` and `decal`. All
 * instances share these few shader programs, and the look is tuned in one
 * place.
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

/** Matte vertex-colored surfaces of an app-built base: asphalt, concrete, gravel. */
function createGroundMaterial() {
  return new MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
}

/** Paint on top of a surface (road lettering): the atlas's transparent cells,
 *  blended over whatever lies underneath and lit and shadowed like it. */
function createDecalMaterial() {
  return new MeshStandardMaterial({
    map: getGraphicsAtlas(),
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    roughness: 0.9,
    metalness: 0,
  });
}

const FACTORIES: Record<string, () => Material> = {
  base: createBaseMaterial,
  emissive: createEmissiveMaterial,
  printed: createPrintedMaterial,
  ground: createGroundMaterial,
  decal: createDecalMaterial,
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
