import type { TimeOfDay, Weather } from "../types/diorama.types";
import { TIME_OF_DAY_LOOKS, type TimeOfDayLook } from "./timeOfDay";

/** What falls from the sky (components/WeatherParticles.tsx). */
export interface WeatherParticlesLook {
  kind: "rain" | "snow";
  /** Pieces per square meter of the base. */
  density: number;
  /** Fall speed in meters per second. */
  speed: number;
  /** Rain: meters sideways per meter fallen. Snow: how far (meters) a flake sways. */
  drift: number;
  /** Rain: length of a streak. Snow: width of a flake. Meters. */
  size: number;
  opacity: number;
}

/**
 * What a weather changes about a time of day. Everything here is a factor
 * or an amount; the absolute lighting numbers stay in utils/timeOfDay.ts.
 * `clear` changes nothing.
 */
export interface WeatherLook {
  label: string;
  /** How much of the sun gets through. */
  sun: number;
  /** How much stronger the shadowless fill — ambient, hemisphere, the sky above — becomes. */
  fill: number;
  /** Factors on the darkness and the softness of cast shadows. */
  shadow: { strength: number; radius: number };
  /** How far the colors of the lights and the sky go toward gray (0–1), and how bright that gray sky is. */
  overcast: number;
  brightness: number;
  /** Haze distances that replace the time of day's; null keeps them. */
  haze: { start: number; end: number } | null;
  /** The least glow windows and backlit signs have: lights are on in a dark afternoon. */
  lights: { emissive: number; signs: number };
  /** How wet (darker, glossy, puddles) and how snowed on surfaces are, 0–1. */
  wet: number;
  snow: number;
  particles: WeatherParticlesLook | null;
}

export const WEATHER_LOOKS: Record<Weather, WeatherLook> = {
  clear: {
    label: "Clear",
    sun: 1,
    fill: 1,
    shadow: { strength: 1, radius: 1 },
    overcast: 0,
    brightness: 1,
    haze: null,
    lights: { emissive: 0, signs: 0 },
    wet: 0,
    snow: 0,
    particles: null,
  },
  cloudy: {
    label: "Cloudy",
    sun: 0.4,
    fill: 1.45,
    shadow: { strength: 0.55, radius: 2 },
    overcast: 0.75,
    brightness: 0.97,
    haze: null,
    lights: { emissive: 0, signs: 0 },
    wet: 0,
    snow: 0,
    particles: null,
  },
  rain: {
    label: "Rain",
    sun: 0.3,
    fill: 1.4,
    shadow: { strength: 0.35, radius: 2.5 },
    overcast: 0.85,
    brightness: 0.86,
    haze: { start: 2, end: 60 },
    lights: { emissive: 0.9, signs: 0.35 },
    wet: 1,
    snow: 0,
    particles: { kind: "rain", density: 7, speed: 16, drift: 0.18, size: 0.9, opacity: 0.4 },
  },
  fog: {
    label: "Fog",
    sun: 0.3,
    fill: 1.5,
    shadow: { strength: 0.3, radius: 2.5 },
    overcast: 0.9,
    brightness: 1,
    haze: { start: -12, end: 20 },
    lights: { emissive: 0.7, signs: 0.3 },
    wet: 0.25,
    snow: 0,
    particles: null,
  },
  snow: {
    label: "Snow",
    sun: 0.4,
    fill: 1.5,
    shadow: { strength: 0.45, radius: 2 },
    overcast: 0.85,
    brightness: 1.02,
    haze: { start: 0, end: 55 },
    lights: { emissive: 0.6, signs: 0.25 },
    wet: 0,
    snow: 0.92,
    particles: { kind: "snow", density: 5, speed: 1.3, drift: 0.35, size: 0.11, opacity: 0.9 },
  },
};

export const WEATHER_ORDER: Weather[] = ["clear", "cloudy", "rain", "fog", "snow"];

/** An overcast sky is not neutral gray: a little blue stays. */
const OVERCAST_TINT = [0.96, 0.99, 1.05];

/** `hex` moved toward the gray of its own brightness by `amount`, then scaled by `brightness`. */
function overcast(hex: string, amount: number, brightness = 1): string {
  const value = parseInt(hex.slice(1), 16);
  const rgb = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  const gray = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  const mixed = rgb.map((channel, i) => {
    const out = (channel + (gray * OVERCAST_TINT[i] - channel) * amount) * brightness;
    return Math.round(Math.min(255, Math.max(0, out)));
  });
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function applyWeather(look: TimeOfDayLook, weather: WeatherLook): TimeOfDayLook {
  const gray = (hex: string) => overcast(hex, weather.overcast);
  const sky = (hex: string) => overcast(hex, weather.overcast, weather.brightness);
  /** The sky above takes over from the sun; the far side and the ground bounce only lose their color. */
  const formerFactor = { sky: weather.fill, sun: weather.sun, far: 1, ground: 1 };
  return {
    ...look,
    sun: { ...look.sun, color: gray(look.sun.color), intensity: look.sun.intensity * weather.sun },
    shadow: { strength: look.shadow.strength * weather.shadow.strength, radius: look.shadow.radius * weather.shadow.radius },
    ambient: { color: gray(look.ambient.color), intensity: look.ambient.intensity * weather.fill },
    hemisphere: {
      sky: gray(look.hemisphere.sky),
      ground: gray(look.hemisphere.ground),
      intensity: look.hemisphere.intensity * weather.fill,
    },
    environment: {
      ...look.environment,
      formers: look.environment.formers.map((former) => ({
        ...former,
        color: gray(former.color),
        intensity: former.intensity * formerFactor[former.name],
      })),
    },
    sky: { top: sky(look.sky.top), middle: sky(look.sky.middle), bottom: sky(look.sky.bottom) },
    haze: weather.haze ?? look.haze,
    emissive: Math.max(look.emissive, weather.lights.emissive),
    signs: Math.max(look.signs, weather.lights.signs),
  };
}

const looks = new Map<string, TimeOfDayLook>();

/**
 * The look of a time of day in a weather. The same pair always gives the
 * same object, so it is safe as an effect dependency; clear weather gives
 * the time of day's own record.
 */
export function sceneLook(timeOfDay: TimeOfDay, weather: Weather): TimeOfDayLook {
  if (weather === "clear") return TIME_OF_DAY_LOOKS[timeOfDay];
  const key = `${timeOfDay}/${weather}`;
  let look = looks.get(key);
  if (!look) {
    look = applyWeather(TIME_OF_DAY_LOOKS[timeOfDay], WEATHER_LOOKS[weather]);
    looks.set(key, look);
  }
  return look;
}
