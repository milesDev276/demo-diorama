"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { hasDioramas } from "@/features/dioramas/storage/dioramaRepository";
import { STORAGE_ERROR, useDioramaLauncher } from "@/features/dioramas/hooks/useDioramaLauncher";

/**
 * A returning visitor goes to My Dioramas; a first visit goes straight
 * into the editor with the hero street (plan/Stage-17-Implementation.md D6).
 */
export function StartBuildingButton() {
  const router = useRouter();
  const launcher = useDioramaLauncher();
  const [checking, setChecking] = useState(false);
  const [failed, setFailed] = useState(false);

  const start = async () => {
    setChecking(true);
    setFailed(false);
    try {
      if (await hasDioramas()) {
        router.push("/dioramas");
        return;
      }
    } catch {
      setFailed(true);
      setChecking(false);
      return;
    }
    await launcher.createFromStarter();
    setChecking(false);
  };

  const busy = checking || launcher.busy;
  const error = failed ? STORAGE_ERROR : launcher.error;

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={() => void start()}
        disabled={busy}
        className="flex items-center gap-2 rounded-full bg-[#F0B27A] px-6 py-3 text-base font-semibold text-[#4A3421] shadow-[0_6px_20px_rgba(240,178,122,0.45)] transition-colors hover:bg-[#eda868] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B6F52] cursor-pointer disabled:cursor-wait disabled:opacity-70"
      >
        Start building <ArrowRight size={18} />
      </button>
      {error && (
        <p role="alert" className="max-w-xs text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
