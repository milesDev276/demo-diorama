"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music2, Link as LinkIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { musicPresets } from "@/data/musicPresets";
import { parseYoutubeId } from "@/lib/youtube";
import { cn } from "@/lib/cn";

export function MusicPanel() {
  const [activeVideoId, setActiveVideoId] = useState(musicPresets[0].youtubeId);
  const [activePresetId, setActivePresetId] = useState<string | null>(musicPresets[0].id);
  const [urlDraft, setUrlDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectPreset = (id: string, youtubeId: string) => {
    setActivePresetId(id);
    setActiveVideoId(youtubeId);
    setError(null);
    setUrlDraft("");
  };

  const handleLoad = () => {
    const id = parseYoutubeId(urlDraft);
    if (!id) {
      setError("That doesn't look like a valid YouTube link.");
      return;
    }
    setError(null);
    setActivePresetId(null);
    setActiveVideoId(id);
  };

  return (
    <Card className="flex w-full flex-col gap-4 p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Music2 size={18} className="text-[#8B6F52]" />
        <h2 className="font-semibold text-[#FDF6EC]">Ambient Music</h2>
      </div>

      <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black/30">
        <iframe
          key={activeVideoId}
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=0`}
          title="Music player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {musicPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => selectPreset(preset.id, preset.youtubeId)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              activePresetId === preset.id
                ? "border-[#F0B27A] bg-[#F0B27A]/20 text-[#F0B27A]"
                : "border-white/20 text-[#FDF6EC]/80 hover:bg-white/10"
            )}
          >
            {preset.title}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2">
          <LinkIcon size={14} className="flex-shrink-0 text-[#FDF6EC]/50" />
          <input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLoad()}
            placeholder="Paste a YouTube URL..."
            className="w-full min-w-0 bg-transparent text-sm text-[#FDF6EC] placeholder:text-[#FDF6EC]/40 outline-none"
          />
        </div>
        <Button onClick={handleLoad}>Load</Button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-[#F0B27A]"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </Card>
  );
}
