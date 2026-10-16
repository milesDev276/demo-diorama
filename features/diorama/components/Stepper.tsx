import { Minus, Plus } from "lucide-react";

export interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled: boolean;
  onStep: (step: 1 | -1) => void;
}

/** A label and a count with − and + buttons, as the inspector's building and run sections use. */
export function Stepper({ label, value, min, max, disabled, onStep }: StepperProps) {
  const button = (delta: 1 | -1, Icon: typeof Plus, name: string) => (
    <button
      type="button"
      aria-label={`${name} ${label.toLowerCase()}`}
      disabled={disabled || value + delta < min || value + delta > max}
      onClick={() => onStep(delta)}
      className="rounded-md p-1 text-[#4A3421]/70 transition-colors hover:bg-white disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
    >
      <Icon size={13} />
    </button>
  );
  return (
    <div className="flex items-center justify-between text-sm text-[#4A3421]">
      <span className="text-xs font-medium">{label}</span>
      <div className="flex items-center gap-1 rounded-lg bg-[#4A3421]/5 p-0.5">
        {button(-1, Minus, "Fewer")}
        <span className="w-5 text-center text-xs font-semibold tabular-nums">{value}</span>
        {button(1, Plus, "More")}
      </div>
    </div>
  );
}
