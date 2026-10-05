import type { TimeOfDay, Vector3Tuple } from "../types/diorama.types";

/** One rectangle of the procedural environment map (drei Lightformer). */
export interface LightformerLook {
  /** Which light of the sky this is; the weather dims the sun's and raises the sky's (utils/weather.ts). */
  name: "sky" | "sun" | "far" | "ground";
  color: string;
  intensity: number;
  position: Vector3Tuple;
  scale: Vector3Tuple;
}

/**
 * Everything a time of day decides. SceneLighting, the sky behind the
 * canvas, the fog, the emissive and printed materials and the after-dark lights all read
 * one of these; no other file holds a lighting number. The weather scales
 * one into another (utils/weather.ts); components get that through
 * hooks/useSceneEnvironment.ts.
 */
export interface TimeOfDayLook {
  label: string;
  /** The one shadow-casting light: the sun, or the moon at night. */
  sun: { position: Vector3Tuple; color: string; intensity: number };
  /** The sun's cast shadows: how dark (0–1) and how soft (PCF radius). */
  shadow: { strength: number; radius: number };
  ambient: { color: string; intensity: number };
  hemisphere: { sky: string; ground: string; intensity: number };
  /** Fill from the environment map: sky above, glow on the sun's side, the far side, ground bounce. */
  environment: { intensity: number; formers: LightformerLook[] };
  /** Backdrop gradient, top → middle → bottom. The fog fades toward the middle. */
  sky: { top: string; middle: string; bottom: string };
  /** Haze in the sky's middle color: it starts this far (meters) past the orbit target and is complete this far past it. */
  haze: { start: number; end: number };
  /** Glow of every `emissive` slot: windows, shop interiors, vending fronts. */
  emissive: number;
  /** Glow of backlit prints — shop signs, the vending machine's ad; 0 = switched off. */
  signs: number;
  /** Strength of the shop and vending-machine lights (SceneGlowLights); 0 = none. */
  glow: number;
}

/** Where the four Lightformers stand when the sun is at the front-right (morning, day). */
const FORMERS_SUN_RIGHT = {
  sky: { position: [0, 40, 0], scale: [60, 60, 1] },
  sun: { position: [40, 25, 25], scale: [20, 20, 1] },
  far: { position: [-40, 10, -20], scale: [30, 15, 1] },
  ground: { position: [0, -30, 0], scale: [60, 60, 1] },
} satisfies Record<string, Pick<LightformerLook, "position" | "scale">>;

/** The same, mirrored, for a sun at the front-left (golden hour, evening, night). */
const FORMERS_SUN_LEFT = {
  ...FORMERS_SUN_RIGHT,
  sun: { position: [-40, 18, 25], scale: [20, 20, 1] },
  far: { position: [40, 10, -20], scale: [30, 15, 1] },
} satisfies Record<string, Pick<LightformerLook, "position" | "scale">>;

/** Under a clear sky, at every time of day. */
const CLEAR_SHADOW = { strength: 1, radius: 4 };
const CLEAR_HAZE = { start: 11, end: 83 };

type FormerLights = Record<keyof typeof FORMERS_SUN_RIGHT, [color: string, intensity: number]>;

function formers(layout: typeof FORMERS_SUN_RIGHT, lights: FormerLights): LightformerLook[] {
  return (Object.keys(layout) as Array<keyof typeof layout>).map((key) => ({
    ...layout[key],
    name: key,
    color: lights[key][0],
    intensity: lights[key][1],
  }));
}

export const TIME_OF_DAY_LOOKS: Record<TimeOfDay, TimeOfDayLook> = {
  morning: {
    label: "Morning",
    // Low sun from the back-right: the right facade is lit, long shadows fall toward the front road.
    sun: { position: [38, 19, -14], color: "#ffe6cc", intensity: 1.6 },
    shadow: CLEAR_SHADOW,
    ambient: { color: "#eef2ff", intensity: 0.28 },
    hemisphere: { sky: "#cfe0f5", ground: "#e2cdb4", intensity: 0.5 },
    environment: {
      intensity: 0.75,
      formers: formers(FORMERS_SUN_RIGHT, {
        sky: ["#dde9ff", 1],
        sun: ["#ffe9d2", 1.6],
        far: ["#dfe3ee", 0.6],
        ground: ["#cdbba2", 0.4],
      }),
    },
    sky: { top: "#c4def6", middle: "#eef0e4", bottom: "#f7e2cf" },
    haze: CLEAR_HAZE,
    emissive: 0.3,
    signs: 0,
    glow: 0,
  },
  day: {
    label: "Day",
    sun: { position: [36, 29, 21], color: "#ffe2bf", intensity: 1.8 },
    shadow: CLEAR_SHADOW,
    ambient: { color: "#fff0dc", intensity: 0.25 },
    hemisphere: { sky: "#cfe3f2", ground: "#e6c9a3", intensity: 0.45 },
    environment: {
      intensity: 0.75,
      formers: formers(FORMERS_SUN_RIGHT, {
        sky: ["#dcecff", 1],
        sun: ["#ffe4c2", 2],
        far: ["#e9d6bd", 0.5],
        ground: ["#cdbba2", 0.4],
      }),
    },
    sky: { top: "#bfe3ff", middle: "#e3f0dd", bottom: "#ecdfc2" },
    haze: CLEAR_HAZE,
    emissive: 0.2,
    signs: 0,
    glow: 0,
  },
  goldenHour: {
    label: "Golden hour",
    // Low sun from the front-left (Hero-Layout §7): the front facade glows, the right one is in soft shade.
    sun: { position: [-34, 13, 30], color: "#ffb469", intensity: 2.3 },
    shadow: CLEAR_SHADOW,
    ambient: { color: "#ffe0c2", intensity: 0.2 },
    hemisphere: { sky: "#c9cfe8", ground: "#e2b48a", intensity: 0.42 },
    environment: {
      intensity: 0.7,
      formers: formers(FORMERS_SUN_LEFT, {
        sky: ["#cfd8f2", 0.8],
        sun: ["#ffb877", 2.4],
        far: ["#b9bfdc", 0.5],
        ground: ["#c9a985", 0.4],
      }),
    },
    sky: { top: "#a9c6ea", middle: "#f2dcc0", bottom: "#f6bd8e" },
    haze: CLEAR_HAZE,
    emissive: 0.85,
    signs: 0.3,
    glow: 0,
  },
  evening: {
    label: "Evening",
    // The last light on the horizon; windows and shop lights carry the scene.
    sun: { position: [-36, 6, 26], color: "#ff9a6b", intensity: 0.55 },
    shadow: CLEAR_SHADOW,
    ambient: { color: "#9aa6dc", intensity: 0.3 },
    hemisphere: { sky: "#7f8fd0", ground: "#6b5a66", intensity: 0.5 },
    environment: {
      intensity: 0.5,
      formers: formers(FORMERS_SUN_LEFT, {
        sky: ["#7f92d8", 0.9],
        sun: ["#ff9f73", 1.4],
        far: ["#6f7fc0", 0.5],
        ground: ["#5d5266", 0.3],
      }),
    },
    sky: { top: "#33427a", middle: "#8b7aa6", bottom: "#f2a777" },
    haze: CLEAR_HAZE,
    emissive: 1.7,
    signs: 0.85,
    glow: 1,
  },
  night: {
    label: "Night",
    // Moonlight from high on the left.
    sun: { position: [-22, 34, 20], color: "#a9bdf0", intensity: 0.4 },
    shadow: CLEAR_SHADOW,
    ambient: { color: "#6f7fbf", intensity: 0.26 },
    hemisphere: { sky: "#4a5a9a", ground: "#2c2a3a", intensity: 0.42 },
    environment: {
      intensity: 0.4,
      formers: formers(FORMERS_SUN_LEFT, {
        sky: ["#5568b0", 0.8],
        sun: ["#8fa4e0", 0.7],
        far: ["#4a5a9a", 0.4],
        ground: ["#2e2c40", 0.3],
      }),
    },
    sky: { top: "#101833", middle: "#232e5a", bottom: "#40406e" },
    haze: CLEAR_HAZE,
    emissive: 2.1,
    signs: 1,
    glow: 1.25,
  },
};

export const TIME_OF_DAY_ORDER: TimeOfDay[] = ["morning", "day", "goldenHour", "evening", "night"];

/** CSS for the sky behind the editor canvas; SkyBackdropEffect draws the same gradient in Preview. */
export function skyGradient(look: TimeOfDayLook): string {
  return `linear-gradient(to bottom, ${look.sky.top}, ${look.sky.middle}, ${look.sky.bottom})`;
}
