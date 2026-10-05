"use client";

import { useDioramaStore } from "../store/dioramaStore";
import type { DioramaBase } from "../types/diorama.types";
import { BASE_ORDER, BASE_TEMPLATES } from "../utils/baseTemplates";
import { SEASON_OPTIONS, timeOfDayOptions, WEATHER_OPTIONS } from "../utils/environmentOptions";
import { GroundPanel } from "./GroundPanel";
import { SegmentedControl } from "./SegmentedControl";

const baseOption = (value: DioramaBase) => ({ value, label: BASE_TEMPLATES[value].label });
const BASE_OPTIONS = BASE_ORDER.map(baseOption);
const TIME_OPTIONS = timeOfDayOptions(true);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4A3421]/40">{title}</p>
      {children}
    </div>
  );
}

/**
 * Scene-level settings, shown in the inspector while nothing is selected:
 * the light the Diorama is seen in, its weather and season, the base it stands on, and
 * that base's ground and platform.
 */
export function ScenePanel() {
  const base = useDioramaStore((s) => s.environment.base);
  const timeOfDay = useDioramaStore((s) => s.environment.timeOfDay);
  const season = useDioramaStore((s) => s.environment.season);
  const weather = useDioramaStore((s) => s.environment.weather);
  const setBase = useDioramaStore((s) => s.setBase);
  const setTimeOfDay = useDioramaStore((s) => s.setTimeOfDay);
  const setSeason = useDioramaStore((s) => s.setSeason);
  const setWeather = useDioramaStore((s) => s.setWeather);

  return (
    <div className="flex flex-col gap-5">
      <Section title="Time of day">
        <SegmentedControl label="Time of day" options={TIME_OPTIONS} value={timeOfDay} onChange={setTimeOfDay} />
      </Section>

      <Section title="Weather">
        <SegmentedControl label="Weather" options={WEATHER_OPTIONS} value={weather} onChange={setWeather} />
      </Section>

      <Section title="Season">
        <SegmentedControl label="Season" options={SEASON_OPTIONS} value={season} onChange={setSeason} />
        <p className="text-xs text-[#4A3421]/50">Changes leafy trees, fallen leaves and grass.</p>
      </Section>

      <Section title="Scene base">
        <SegmentedControl label="Scene base" options={BASE_OPTIONS} value={base} onChange={setBase} />
        <p className="text-xs text-[#4A3421]/50">
          {BASE_TEMPLATES[base].description} Switching keeps every object where it is.
        </p>
      </Section>

      <GroundPanel />
    </div>
  );
}
