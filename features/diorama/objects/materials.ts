import {
  Color,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  MeshStandardMaterial,
  Plane,
  RedFormat,
  RepeatWrapping,
  Vector3,
  type Material,
} from "three";
import { DIORAMA_COLORS } from "../utils/palette";
import { TIME_OF_DAY_LOOKS } from "../utils/timeOfDay";
import { getGraphicsAtlas } from "./textures/graphicsAtlas";

/**
 * The shared materials of everything authored in meters. Blender GLBs
 * carry their colors as vertex colors and name their material slots
 * `base`, `emissive` and `printed`; GltfAsset swaps each slot for the
 * shared material below; deciduous crowns use a fourth slot, `foliage`.
 * App-built bases use `ground` and `decal`, overhead wires `wire`. All
 * instances share these few shader programs, and the look is tuned in one
 * place.
 */

/** Glow of every `emissive` slot (windows, shop interiors, vending fronts): one
 *  value for the whole scene, set by the time of day (setEmissiveLevel). Until
 *  a scene sets it — the thumbnail studio never does — it is the daytime level. */
let emissiveLevel = TIME_OF_DAY_LOOKS.day.emissive;

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
    emissiveIntensity: emissiveLevel,
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

/** Linear luminance of a mid-tone autumn crown; a crown this bright takes the season's leaf color unchanged. */
const FOLIAGE_REFERENCE_LUMINANCE = 0.36;

/** What the foliage shader reads: the season's leaf color and how far crowns are recolored toward it. */
const foliageSeason = { seasonLeaf: { value: new Color(1, 1, 1) }, seasonMix: { value: 0 } };
let foliageVisible = true;

/** `base` for deciduous crowns, recolored by the season: the vertex color
 *  keeps its brightness (clump variation, baked shading) and takes the
 *  season's hue, so a yellow ginkgo and an orange zelkova both turn green.
 *  One extra line after three's color chunk (r184 chunk names). */
function createFoliageMaterial() {
  const material = createBaseMaterial();
  material.visible = foliageVisible;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, foliageSeason);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 seasonLeaf;\nuniform float seasonMix;")
      .replace(
        "#include <color_fragment>",
        "#include <color_fragment>\n\tdiffuseColor.rgb = mix(diffuseColor.rgb, seasonLeaf * dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722)), seasonMix);"
      );
  };
  material.customProgramCacheKey = () => "diorama-foliage-season";
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

/** Edge of the grain texture in texels, and how many of them a meter of speckle spans. */
const GRAIN_SIZE = 128;
const GRAIN_FREQUENCY = 28;

let grainTexture: DataTexture | null = null;

/** Random gray values that tile: the noise the ground grain is read from.
 *  Generated once, from a fixed seed, so the ground looks the same on every visit. */
function getGrainTexture(): DataTexture {
  if (!grainTexture) {
    const data = new Uint8Array(GRAIN_SIZE * GRAIN_SIZE);
    let seed = 20261003;
    for (let i = 0; i < data.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      data[i] = seed >>> 24;
    }
    grainTexture = new DataTexture(data, GRAIN_SIZE, GRAIN_SIZE, RedFormat);
    grainTexture.wrapS = grainTexture.wrapT = RepeatWrapping;
    grainTexture.magFilter = LinearFilter;
    grainTexture.minFilter = LinearMipmapLinearFilter;
    grainTexture.generateMipmaps = true;
    grainTexture.needsUpdate = true;
  }
  return grainTexture;
}

/** World-space noise that roughens a ground color: soft blotches at two
 *  scales and a fine speckle, all read from one small texture. Its mipmaps
 *  average the speckle away before it gets smaller than a pixel — so it
 *  shows in close-ups and never shimmers from afar. */
const GROUND_GRAIN_GLSL = `
uniform sampler2D grainMap;
varying vec2 vGrain;
varying vec3 vGroundPosition;
float groundGrain() {
  // The height shifts the pattern, so walls and curb faces are not streaked.
  vec2 p = vGroundPosition.xz + vGroundPosition.y * vec2(0.37, 0.61);
  float blotch = 0.6 * texture2D(grainMap, p / 48.0).r + 0.4 * texture2D(grainMap, p / 9.0 + 0.37).r - 0.5;
  float speckle = texture2D(grainMap, p * ${(GRAIN_FREQUENCY / GRAIN_SIZE).toFixed(5)}).r - 0.5;
  return 1.0 + vGrain.x * speckle * 2.0 + vGrain.y * blotch * 2.0;
}
`;

/** Matte vertex-colored surfaces of an app-built base: asphalt, concrete,
 *  gravel. Each vertex also carries a `grain` (fine, blotch) that says how
 *  rough its color is drawn; geometry without it stays flat. Two small
 *  additions to three's shader (r184 chunk names). */
function createGroundMaterial() {
  const material = new MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.grainMap = { value: getGrainTexture() };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec2 grain;\nvarying vec2 vGrain;\nvarying vec3 vGroundPosition;")
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\n\tvGrain = grain;\n\tvGroundPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;"
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${GROUND_GRAIN_GLSL}`)
      .replace("#include <color_fragment>", "#include <color_fragment>\n\tdiffuseColor.rgb *= groundGrain();");
  };
  material.customProgramCacheKey = () => "diorama-ground-grain";
  return material;
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

/** Far enough out that nothing is cut, until a base sets its outline (setWireBounds). */
const UNBOUNDED = 1e6;

/** The base's outline as four planes facing inward: +X, −X, +Z, −Z edges. */
const wireBounds = [new Vector3(-1, 0, 0), new Vector3(1, 0, 0), new Vector3(0, 0, -1), new Vector3(0, 0, 1)].map(
  (normal) => new Plane(normal, UNBOUNDED)
);

/** Overhead wires. They are cut off at the edge of the base, like the wires of a physical model. */
function createWireMaterial() {
  return new MeshStandardMaterial({
    color: DIORAMA_COLORS.wireGray,
    roughness: 0.8,
    metalness: 0,
    clippingPlanes: wireBounds,
    clipShadows: true,
  });
}

const FACTORIES: Record<string, () => Material> = {
  base: createBaseMaterial,
  emissive: createEmissiveMaterial,
  printed: createPrintedMaterial,
  foliage: createFoliageMaterial,
  ground: createGroundMaterial,
  decal: createDecalMaterial,
  wire: createWireMaterial,
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

/** Sets how strongly every `emissive` slot glows (a time of day's `emissive`). */
export function setEmissiveLevel(level: number): void {
  emissiveLevel = level;
  const material = materials.get("emissive") as MeshStandardMaterial | undefined;
  if (material) material.emissiveIntensity = level;
}

/**
 * Sets what deciduous crowns look like: recolored toward `color` by
 * `amount` (0 keeps the modeled autumn colors), or not drawn at all —
 * bare branches — when `foliage` is null.
 */
export function setFoliageSeason(foliage: { color: string; amount: number } | null): void {
  foliageVisible = foliage !== null;
  const material = materials.get("foliage");
  if (material) material.visible = foliageVisible;
  if (!foliage) return;
  // The shader multiplies by the modeled brightness, which is that of a mid-tone leaf at REFERENCE.
  foliageSeason.seasonLeaf.value.set(foliage.color).multiplyScalar(1 / FOLIAGE_REFERENCE_LUMINANCE);
  foliageSeason.seasonMix.value = foliage.amount;
}

/** Cuts every wire at the outline of a base `width` × `depth` meters, centered on the origin. Needs `gl.localClippingEnabled`. */
export function setWireBounds(width: number, depth: number): void {
  wireBounds[0].constant = wireBounds[1].constant = width / 2;
  wireBounds[2].constant = wireBounds[3].constant = depth / 2;
}

/** Whether a world point lies on the part of a wire that is drawn, not on the part that was cut off. */
export function isWithinWireBounds(point: Vector3): boolean {
  return wireBounds.every((plane) => plane.distanceToPoint(point) >= 0);
}
