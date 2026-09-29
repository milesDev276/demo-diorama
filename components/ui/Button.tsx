"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/cn";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "ghost";
}

export function Button({ className, variant = "primary", children, ...props }: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors cursor-pointer",
        variant === "primary"
          ? "bg-[#F0B27A] text-[#4A3421] shadow-[0_4px_16px_rgba(240,178,122,0.4)] hover:bg-[#eda868]"
          : "bg-white/10 text-[#FDF6EC] border border-white/25 hover:bg-white/20",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
