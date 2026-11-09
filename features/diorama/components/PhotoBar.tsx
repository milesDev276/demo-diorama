"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Check, Loader2, Scan } from "lucide-react";
import { useDioramaStore } from "../store/dioramaStore";
import { PHOTO_ASPECTS } from "../types/diorama.types";
import { timeOfDayOptions, WEATHER_OPTIONS } from "../utils/environmentOptions";
import { PHOTO_ASPECT_LABELS, PHOTO_BLUR_RANGE, PHOTO_EXPOSURE_RANGE, PHOTO_SCALES } from "../utils/photo";
import { SegmentedControl } from "./SegmentedControl";

const TIME_OPTIONS = timeOfDayOptions();
const ASPECT_OPTIONS = PHOTO_ASPECTS.map((value) => ({ value, label: PHOTO_ASPECT_LABELS[value] }));

/** How long "Saved" stays on the button. */
const SAVED_MS = 2000;

interface SliderProps {
  label: string;
  /** What the value reads as, e.g. "+0.5". */
  display: string;
  value: number;
  range: { min: number; max: number; step: number };
  onChange: (value: number) => void;
}

function Slider({ label, display, value, range, onChange }: SliderProps) {
  return (
    <label className="flex shrink-0 items-center gap-2 text-xs font-medium text-[#4A3421]/70">
      {label}
      <input
        type="range"
        min={range.min}
        max={range.max}
        step={range.step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-20 accent-[#F0B27A] cursor-pointer"
      />
      <span className="w-8 tabular-nums text-[#4A3421]/50">{display}</span>
    </label>
  );
}

const Divider = () => <span aria-hidden className="hidden h-5 w-px shrink-0 bg-[#8b6f52]/15 lg:block" />;

type SaveState = "idle" | "saving" | "saved" | "failed";

const SAVE_LABELS: Record<SaveState, string> = {
  idle: "Save photo",
  saving: "Saving…",
  saved: "Saved",
  failed: "Could not save",
};

/** Keys typed into these are theirs, not shortcuts. */
const isFormField = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName));

/**
 * The photo studio's controls, one row along the bottom of Preview: the
 * light, the weather, the frame and Fit, focus blur and exposure, and saving
 * the frame as a PNG at a chosen pixel size. Clicking the scene sets the
 * focus (PhotoStudio). Esc leaves Preview, F fits. The bar reports its
 * height, so the canvas stays above it (plan/Stage-20-Implementation.md D1).
 */
export function PhotoBar({ onExit }: { onExit: () => void }) {
  const timeOfDay = useDioramaStore((s) => s.environment.timeOfDay);
  const setTimeOfDay = useDioramaStore((s) => s.setTimeOfDay);
  const weather = useDioramaStore((s) => s.environment.weather);
  const setWeather = useDioramaStore((s) => s.setWeather);
  const photo = useDioramaStore((s) => s.photo);
  const setPhoto = useDioramaStore((s) => s.setPhoto);
  const photoApi = useDioramaStore((s) => s.photoApi);
  const setPhotoBarHeight = useDioramaStore((s) => s.setPhotoBarHeight);
  const [save, setSave] = useState<SaveState>("idle");
  const barRef = useRef<HTMLDivElement>(null);

  const fit = () => useDioramaStore.getState().cameraApi?.fitScene();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isFormField(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === "Escape") onExit();
      else if (event.key.toLowerCase() === "f") useDioramaStore.getState().cameraApi?.fitScene();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onExit]);

  // The bar's height only changes when it wraps; the canvas makes room for it.
  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const report = () => setPhotoBarHeight(Math.ceil(bar.getBoundingClientRect().height));
    report();
    const observer = new ResizeObserver(report);
    observer.observe(bar);
    return () => {
      observer.disconnect();
      setPhotoBarHeight(0);
    };
  }, [setPhotoBarHeight]);

  useEffect(() => {
    if (save !== "saved" && save !== "failed") return;
    const timer = window.setTimeout(() => setSave("idle"), SAVED_MS);
    return () => window.clearTimeout(timer);
  }, [save]);

  const savePhoto = async () => {
    if (!photoApi) return;
    setSave("saving");
    try {
      await photoApi.savePhoto(photo.scale);
      setSave("saved");
    } catch {
      setSave("failed");
    }
  };

  const sizeLabel = (scale: number) => {
    const size = photoApi?.exportSize(scale);
    return size ? `${size.width} × ${size.height}` : `${scale}×`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="pointer-events-none absolute inset-x-3 bottom-5 z-20 flex justify-center"
    >
      <div
        ref={barRef}
        className="pointer-events-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-3xl bg-white/90 px-3 py-2 shadow-[0_8px_32px_rgba(139,111,82,0.2)] backdrop-blur-xl"
      >
        <SegmentedControl label="Time of day" options={TIME_OPTIONS} value={timeOfDay} onChange={setTimeOfDay} compact className="shrink-0" />
        <SegmentedControl label="Weather" options={WEATHER_OPTIONS} value={weather} onChange={setWeather} compact className="shrink-0" />

        <Divider />
        <SegmentedControl
          label="Photo frame"
          options={ASPECT_OPTIONS}
          value={photo.aspect}
          onChange={(aspect) => setPhoto({ aspect })}
          className="shrink-0"
        />
        <button
          type="button"
          onClick={fit}
          title="Fit the whole diorama in the frame (F)"
          className="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-[#4A3421]/75 transition-colors hover:bg-[#4A3421]/5 hover:text-[#4A3421] focus-visible:outline-2 focus-visible:outline-[#F0B27A] cursor-pointer"
        >
          <Scan size={15} aria-hidden />
          Fit
        </button>

        <Divider />
        <Slider label="Blur" display={photo.blur.toFixed(2)} value={photo.blur} range={PHOTO_BLUR_RANGE} onChange={(blur) => setPhoto({ blur })} />
        <Slider
          label="Exposure"
          display={`${photo.exposure > 0 ? "+" : ""}${photo.exposure.toFixed(1)}`}
          value={photo.exposure}
          range={PHOTO_EXPOSURE_RANGE}
          onChange={(exposure) => setPhoto({ exposure })}
        />

        <Divider />
        <div className="flex shrink-0 items-center gap-2">
          <select
            aria-label="Photo size in pixels"
            value={photo.scale}
            onChange={(event) => setPhoto({ scale: Number(event.target.value) })}
            className="rounded-full border border-[#8b6f52]/15 bg-white/60 px-2 py-1.5 text-xs tabular-nums text-[#4A3421] outline-none focus-visible:outline-2 focus-visible:outline-[#F0B27A]"
          >
            {PHOTO_SCALES.map((scale) => (
              <option key={scale} value={scale}>
                {sizeLabel(scale)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={savePhoto}
            disabled={!photoApi || save === "saving"}
            className={
              save === "failed"
                ? "flex min-w-34 items-center justify-center gap-1.5 rounded-full bg-red-100 px-3.5 py-2 text-sm font-medium text-red-700 cursor-pointer"
                : "flex min-w-34 items-center justify-center gap-1.5 rounded-full bg-[#F0B27A] px-3.5 py-2 text-sm font-medium text-[#4A3421] shadow-[0_4px_16px_rgba(240,178,122,0.4)] transition-colors hover:bg-[#eda868] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F0B27A] disabled:opacity-60 cursor-pointer"
            }
          >
            {save === "saving" ? (
              <Loader2 size={15} className="animate-spin" aria-hidden />
            ) : save === "saved" ? (
              <Check size={15} aria-hidden />
            ) : (
              <Camera size={15} aria-hidden />
            )}
            {SAVE_LABELS[save]}
          </button>
          <span role="status" className="sr-only">
            {save === "saved" ? `Photo saved, ${sizeLabel(photo.scale)} pixels` : save === "failed" ? "Could not save the photo" : ""}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
