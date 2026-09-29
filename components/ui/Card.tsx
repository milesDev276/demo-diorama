"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/cn";

interface CardProps extends HTMLMotionProps<"div"> {
  tint?: "neutral" | "warm";
}

export function Card({ className, tint = "neutral", children, ...props }: CardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={cn(
        "rounded-3xl border border-white/25 shadow-[0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur-xl",
        tint === "warm" ? "bg-[#EAD9C2]/20" : "bg-white/15",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
