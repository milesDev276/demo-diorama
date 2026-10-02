import { BlendFunction, Effect } from "postprocessing";
import { Uniform, Vector3 } from "three";
import type { TimeOfDayLook } from "../utils/timeOfDay";

const fragmentShader = /* glsl */ `
uniform vec3 skyTop;
uniform vec3 skyMiddle;
uniform vec3 skyBottom;

vec3 srgbToLinear(const in vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  // Same stops and sRGB interpolation as the CSS gradient behind the editor canvas.
  vec3 sky = uv.y > 0.5
    ? mix(skyMiddle, skyTop, uv.y * 2.0 - 1.0)
    : mix(skyBottom, skyMiddle, uv.y * 2.0);

  // Coverage comes from the pass input, before bloom widened the alpha.
  // The scene is premultiplied over a transparent clear: put the sky under it.
  float coverage = texture2D(inputBuffer, uv).a;
  outputColor = vec4(inputColor.rgb + (1.0 - coverage) * srgbToLinear(sky), 1.0);
}
`;

function setSrgb(target: Vector3, hex: string): void {
  const value = parseInt(hex.slice(1), 16);
  target.set(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255);
}

/**
 * Composites the sky gradient under the already tone-mapped scene, so the
 * Preview image is opaque before the tilt-shift blur runs. Blurring a
 * transparent canvas leaves bright fringes once the browser composites it.
 * Placing the sky after tone mapping keeps it exactly the editor's colors
 * and keeps it out of the bloom.
 */
export class SkyBackdropEffect extends Effect {
  constructor() {
    super("SkyBackdropEffect", fragmentShader, {
      blendFunction: BlendFunction.SRC,
      uniforms: new Map([
        ["skyTop", new Uniform(new Vector3())],
        ["skyMiddle", new Uniform(new Vector3())],
        ["skyBottom", new Uniform(new Vector3())],
      ]),
    });
  }

  /** The gradient of a time of day (utils/timeOfDay.ts). */
  setSky(sky: TimeOfDayLook["sky"]): void {
    setSrgb(this.uniforms.get("skyTop")!.value, sky.top);
    setSrgb(this.uniforms.get("skyMiddle")!.value, sky.middle);
    setSrgb(this.uniforms.get("skyBottom")!.value, sky.bottom);
  }
}
