"use client";

import { ArrowRight } from "lucide-react";
import { useDioramaLauncher } from "@/features/dioramas/hooks/useDioramaLauncher";
import { HERO_BUTTON } from "./heroButton";

/**
 * A first visit goes straight into the editor with the hero street
 * (plan/Stage-17-Implementation.md D6). A returning visitor gets Continue
 * instead (HomeActions, plan/Stage-23-Implementation.md D4).
 */
export function StartBuildingButton() {
  const launcher = useDioramaLauncher();

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={() => void launcher.createFromStarter()}
        disabled={launcher.busy}
        className={`${HERO_BUTTON} cursor-pointer disabled:cursor-wait disabled:opacity-70`}
      >
        Start building <ArrowRight size={18} />
      </button>
      {launcher.error && (
        <p role="alert" className="max-w-xs text-xs text-red-600">
          {launcher.error}
        </p>
      )}
    </div>
  );
}
