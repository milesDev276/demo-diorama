"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { Background as BackgroundType } from "@/types";

interface BackgroundProps {
  background: BackgroundType;
}

export function Background({ background }: BackgroundProps) {
  return (
    <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#8B6F52] via-[#A7C4A0] to-[#9DB4C0]">
      <AnimatePresence initial={false}>
        <motion.div
          key={background.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={background.full}
            alt={background.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />
    </div>
  );
}
