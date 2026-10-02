"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import { useDioramaStore } from "../store/dioramaStore";
import { PHOTO_ASPECTS } from "../types/diorama.types";
import { timeOfDayOptions } from "../utils/environmentOptions";
import { PHOTO_ASPECT_LABELS, PHOTO_BLUR_RANGE, PHOTO_EXPOSURE_RANGE, PHOTO_SCALES } from "../utils/photo";
import { SegmentedControl } from "./SegmentedControl";

const TIME_OPTIONS = timeOfDayOptions();
const ASPECT_OPTIONS = PHOTO_ASPECTS.map((value) => ({ value, label: PHOTO_ASPECT_LABELS[value] }));

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
    <label className="flex items-center gap-2 text-xs font-medium text-[#4A3421]/70">
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

const Divider = () => <span aria-hidden className="hidden h-5 w-px bg-[#8b6f52]/15 lg:block" />;

type SaveState = { status: "idle" } | { status: "saving" } | { status: "saved"; text: string } | { status: "failed" };

/**
 * The photo studio's controls, along the bottom of Preview: the light, the
 * frame, focus blur and exposure, and saving the frame as a PNG. Clicking
 * the scene sets the focus (PhotoStudio). Esc leaves Preview.
 */
export function PhotoBar({ onExit }: { onExit: () => void }) {
  const timeOfDay = useDioramaStore((s) => s.environment.timeOfDay);
  const setTimeOfDay = useDioramaStore((s) => s.setTimeOfDay);
  const photo = useDioramaStore((s) => s.photo);
  const setPhoto = useDioramaStore((s) => s.setPhoto);
  const photoApi = useDioramaStore((s) => s.photoApi);
  const [save, setSave] = useState<SaveState>({ status: "idle" });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onExit();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onExit]);

  const size = photoApi?.exportSize(photo.scale);

  const savePhoto = async () => {
    if (!photoApi) return;
    setSave({ status: "saving" });
    try {
      const { width, height } = await photoApi.savePhoto(photo.scale);
      setSave({ status: "saved", text: `Saved ${width} × ${height}` });
    } catch {
      setSave({ status: "failed" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="pointer-events-none absolute inset-x-3 bottom-5 z-20 flex justify-center"
    >
      <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-3xl bg-white/90 px-3 py-2 shadow-[0_8px_32px_rgba(139,111,82,0.2)] backdrop-blur-xl">
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-[#4A3421] transition-colors hover:bg-[#4A3421]/5 cursor-pointer"
        >
          <ArrowLeft size={15} aria-hidden />
          Exit Preview
        </button>

        <Divider />
        <SegmentedControl label="Time of day" options={TIME_OPTIONS} value={timeOfDay} onChange={setTimeOfDay} compact />
        <SegmentedControl label="Photo frame" options={ASPECT_OPTIONS} value={photo.aspect} onChange={(aspect) => setPhoto({ aspect })} />

        <Divider />
        <div className="flex items-center gap-3" title="Click the scene to choose what stays sharp">
          <Slider label="Blur" display={photo.blur.toFixed(2)} value={photo.blur} range={PHOTO_BLUR_RANGE} onChange={(blur) => setPhoto({ blur })} />
          <Slider
            label="Exposure"
            display={`${photo.exposure > 0 ? "+" : ""}${photo.exposure.toFixed(1)}`}
            value={photo.exposure}
            range={PHOTO_EXPOSURE_RANGE}
            onChange={(exposure) => setPhoto({ exposure })}
          />
        </div>

        <Divider />
        <div className="flex items-center gap-2">
          <select
            aria-label="Photo size"
            value={photo.scale}
            onChange={(event) => setPhoto({ scale: Number(event.target.value) })}
            className="rounded-full border border-[#8b6f52]/15 bg-white/60 px-2 py-1.5 text-xs text-[#4A3421] outline-none"
          >
            {PHOTO_SCALES.map((scale) => (
              <option key={scale} value={scale}>
                {scale}×
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={savePhoto}
            disabled={!photoApi || save.status === "saving"}
            className="flex items-center gap-1.5 rounded-full bg-[#F0B27A] px-3.5 py-2 text-sm font-medium text-[#4A3421] shadow-[0_4px_16px_rgba(240,178,122,0.4)] transition-colors hover:bg-[#eda868] disabled:opacity-60 cursor-pointer"
          >
            {save.status === "saving" ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Camera size={15} aria-hidden />}
            Save photo
          </button>
          <span role="status" className="min-w-24 text-xs tabular-nums text-[#4A3421]/55">
            {save.status === "saved"
              ? save.text
              : save.status === "failed"
                ? "Could not save the photo"
                : size
                  ? `${size.width} × ${size.height} px`
                  : ""}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
