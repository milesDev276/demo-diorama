"use client";

import { RotateCcw } from "lucide-react";
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
 * Scene-level settings, the Scene tab of the inspector: the light the
 * Diorama is seen in, its weather and season, the base it stands on, and
 * that base's ground and platform. At the bottom, putting the base's
 * default objects back.
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
  const resetScene = useDioramaStore((s) => s.resetScene);

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

      <div className="flex flex-col gap-2 border-t border-[#8b6f52]/10 pt-4">
        <button
          type="button"
          onClick={resetScene}
          className="flex items-center justify-center gap-2 rounded-xl border border-[#8b6f52]/15 bg-white/50 px-3 py-2 text-sm font-medium text-[#4A3421] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-[#F0B27A] cursor-pointer"
        >
          <RotateCcw size={14} aria-hidden />
          Reset objects to the base&apos;s defaults
        </button>
        <p className="text-xs text-[#4A3421]/50">Replaces every object in the scene. Ctrl+Z brings them back.</p>
      </div>
    </div>
  );
}
