import { Cloud, CloudFog, CloudMoon, CloudRain, CloudSnow, Flower2, Leaf, MoonStar, Snowflake, Sun, Sunrise, Sunset, TreeDeciduous, type LucideIcon } from "lucide-react";
import type { Season, TimeOfDay, Weather } from "../types/diorama.types";
import { SEASON_LOOKS, SEASON_ORDER } from "./seasons";
import { TIME_OF_DAY_LOOKS, TIME_OF_DAY_ORDER } from "./timeOfDay";
import { WEATHER_LOOKS, WEATHER_ORDER } from "./weather";

const TIME_ICONS: Record<TimeOfDay, LucideIcon> = {
  morning: Sunrise,
  day: Sun,
  goldenHour: Sunset,
  evening: CloudMoon,
  night: MoonStar,
};

/** Short names that fit five across the inspector. */
const TIME_SHORT_LABELS: Record<TimeOfDay, string> = {
  morning: "Morning",
  day: "Day",
  goldenHour: "Golden",
  evening: "Evening",
  night: "Night",
};

const SEASON_ICONS: Record<Season, LucideIcon> = {
  spring: Flower2,
  summer: TreeDeciduous,
  autumn: Leaf,
  winter: Snowflake,
};

const WEATHER_ICONS: Record<Weather, LucideIcon> = {
  clear: Sun,
  cloudy: Cloud,
  rain: CloudRain,
  fog: CloudFog,
  snow: CloudSnow,
};

/** The times of day as choices for a SegmentedControl; `short` uses the names that fit the inspector. */
export function timeOfDayOptions(short = false) {
  return TIME_OF_DAY_ORDER.map((value) => ({
    value,
    label: short ? TIME_SHORT_LABELS[value] : TIME_OF_DAY_LOOKS[value].label,
    icon: TIME_ICONS[value],
  }));
}

export const WEATHER_OPTIONS = WEATHER_ORDER.map((value) => ({ value, label: WEATHER_LOOKS[value].label, icon: WEATHER_ICONS[value] }));

export const SEASON_OPTIONS = SEASON_ORDER.map((value) => ({ value, label: SEASON_LOOKS[value].label, icon: SEASON_ICONS[value] }));
