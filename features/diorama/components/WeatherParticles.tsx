"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, Color, Vector2, Vector3, type ShaderMaterial, type ShaderMaterialParameters, type WebGLRenderer } from "three";
import { useTimeOfDayLook, useWeatherLook } from "../hooks/useSceneEnvironment";
import { useDioramaStore } from "../store/dioramaStore";
import { getBaseTemplate } from "../utils/baseTemplates";
import { CORNER } from "../utils/cornerLayout";
import type { WeatherParticlesLook } from "../utils/weather";

/** The air over the base that rain and snow fall through, in meters: from the road up. */
const FALL_HEIGHT = 14;
/** Large plots get thinner weather rather than more pieces. */
const MAX_PIECES = 6000;

/** Both shaders wrap a piece inside the box: `position` is its seed, 0–1 on each axis. */
const VERTEX_COMMON = /* glsl */ `
#include <common>
uniform float uTime;
uniform vec3 uBox;
uniform float uFloor;
uniform float uSpeed;
uniform float uDrift;
uniform float uSize;
attribute float rate;
`;

const RAIN_VERTEX = /* glsl */ `
${VERTEX_COMMON}
attribute float tip;
varying float vAlpha;
void main() {
  float y = mod(position.y * uBox.y - uTime * uSpeed * rate, uBox.y);
  // The wind carries a drop sideways as it falls; the streak's tail points back along that path.
  vec3 p = vec3(mod(position.x * uBox.x + (uBox.y - y) * uDrift, uBox.x) - 0.5 * uBox.x, uFloor + y, (position.z - 0.5) * uBox.z);
  p += tip * uSize * rate * normalize(vec3(-uDrift, 1.0, 0.0));
  vAlpha = 1.0 - tip;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}
`;

const SNOW_VERTEX = /* glsl */ `
${VERTEX_COMMON}
uniform float uViewHeight;
varying float vAlpha;
void main() {
  float y = mod(position.y * uBox.y - uTime * uSpeed * rate, uBox.y);
  float phase = position.x * 40.0 + position.z * 17.0;
  vec3 p = vec3(
    (position.x - 0.5) * uBox.x + uDrift * sin(uTime * 0.9 * rate + phase),
    uFloor + y,
    (position.z - 0.5) * uBox.z + uDrift * cos(uTime * 0.7 * rate + phase * 1.3)
  );
  vec4 viewPosition = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * viewPosition;
  // A flake has a size in meters, so it keeps it in a larger export and under both cameras.
  float pixels = uSize * (0.6 + 0.8 * fract(phase)) * 0.5 * uViewHeight * projectionMatrix[1][1];
  if (isPerspectiveMatrix(projectionMatrix)) pixels /= -viewPosition.z;
  gl_PointSize = max(pixels, 1.5);
  vAlpha = 1.0;
}
`;

const fragment = (shape: string) => /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying float vAlpha;
void main() {
  gl_FragColor = vec4(uColor, uOpacity * vAlpha${shape});
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const RAIN_FRAGMENT = fragment("");
const SNOW_FRAGMENT = fragment(" * smoothstep(0.5, 0.2, length(gl_PointCoord - 0.5))");

/** `count` pieces at fixed pseudo-random places, `verticesPerPiece` vertices each (a streak has two ends). */
function buildPieces(count: number, verticesPerPiece: 1 | 2): BufferGeometry {
  const position = new Float32Array(count * verticesPerPiece * 3);
  const rate = new Float32Array(count * verticesPerPiece);
  const tip = new Float32Array(count * verticesPerPiece);
  let seed = 20261005;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < count; i++) {
    const piece = [random(), random(), random()];
    const pieceRate = 0.75 + 0.5 * random();
    for (let v = 0; v < verticesPerPiece; v++) {
      const index = i * verticesPerPiece + v;
      position.set(piece, index * 3);
      rate[index] = pieceRate;
      tip[index] = v;
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(position, 3));
  geometry.setAttribute("rate", new BufferAttribute(rate, 1));
  if (verticesPerPiece === 2) geometry.setAttribute("tip", new BufferAttribute(tip, 1));
  return geometry;
}

function materialParameters(kind: WeatherParticlesLook["kind"]): ShaderMaterialParameters {
  return {
    vertexShader: kind === "rain" ? RAIN_VERTEX : SNOW_VERTEX,
    fragmentShader: kind === "rain" ? RAIN_FRAGMENT : SNOW_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uBox: { value: new Vector3() },
      uFloor: { value: CORNER.roadY },
      uSpeed: { value: 0 },
      uDrift: { value: 0 },
      uSize: { value: 0 },
      uColor: { value: new Color() },
      uOpacity: { value: 0 },
      uViewHeight: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
  };
}

/** The pointer never hits the weather. */
const ignorePointer = () => null;
/** After glass, so a drop in front of a shop window is not tinted away. */
const RENDER_ORDER = 2;

const bufferSize = new Vector2();

function Particles({ look, width, depth }: { look: WeatherParticlesLook; width: number; depth: number }) {
  const { kind, density } = look;
  const sky = useTimeOfDayLook().hemisphere.sky;
  const count = Math.min(MAX_PIECES, Math.round(density * width * depth));

  const geometry = useMemo(() => buildPieces(count, kind === "rain" ? 2 : 1), [count, kind]);
  // The material is written through its ref: per frame, and whenever the look changes.
  const materialRef = useRef<ShaderMaterial>(null);
  const materialArgs = useMemo((): [ShaderMaterialParameters] => [materialParameters(kind)], [kind]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useEffect(() => {
    const uniforms = materialRef.current?.uniforms;
    if (!uniforms) return;
    const { uBox, uSpeed, uDrift, uSize, uColor, uOpacity } = uniforms;
    uBox.value.set(width, FALL_HEIGHT, depth);
    uSpeed.value = look.speed;
    uDrift.value = look.drift;
    uSize.value = look.size;
    // Unlit, so the light of the hour comes from the sky's color.
    uColor.value.set(sky);
    uOpacity.value = look.opacity;
  }, [materialArgs, look, width, depth, sky]);

  useFrame(({ clock }) => {
    if (materialRef.current) materialRef.current.uniforms.uTime.value = clock.elapsedTime;
  });

  // Read when the piece is drawn, not per frame: a photo export renders one larger frame in between.
  const onBeforeRender = (renderer: WebGLRenderer) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uViewHeight.value = renderer.getRenderTarget()?.height ?? renderer.getDrawingBufferSize(bufferSize).y;
  };

  const shared = { geometry, frustumCulled: false, raycast: ignorePointer, renderOrder: RENDER_ORDER };
  const material = <shaderMaterial key={kind} ref={materialRef} args={materialArgs} />;
  return kind === "rain" ? (
    <lineSegments {...shared}>{material}</lineSegments>
  ) : (
    <points {...shared} onBeforeRender={onBeforeRender}>
      {material}
    </points>
  );
}

/**
 * Falling rain or snow over the base, when the canvas's weather has any
 * (utils/weather.ts): one draw call, moved in the vertex shader from a
 * single time uniform. It is a look, not a simulation — pieces fall through
 * roofs and stop at road level.
 */
export function WeatherParticles() {
  const look = useWeatherLook().particles;
  const template = useDioramaStore((s) => getBaseTemplate(s.environment));
  if (!look) return null;
  return <Particles look={look} width={template.width} depth={template.depth} />;
}
