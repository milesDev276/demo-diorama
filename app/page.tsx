"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Background } from "@/components/Background";
import { Navbar } from "@/components/Navbar";
import { TodoList } from "@/components/TodoList";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { MusicPanel } from "@/components/MusicPanel";
import { BackgroundGallery } from "@/components/BackgroundGallery";
import { backgrounds } from "@/data/backgrounds";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function Home() {
  const [selectedId, setSelectedId] = useState(backgrounds[0].id);
  const selectedBackground = backgrounds.find((bg) => bg.id === selectedId) ?? backgrounds[0];

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <Background background={selectedBackground} />

      <Navbar />

      <motion.main
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-1 flex-col items-stretch justify-center gap-4 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6 lg:overflow-visible"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-stretch justify-center gap-4 lg:flex-row lg:items-center">
          <motion.div variants={item} className="w-full lg:w-1/4">
            <TodoList />
          </motion.div>
          <motion.div variants={item} className="w-full lg:w-2/5">
            <PomodoroTimer />
          </motion.div>
          <motion.div variants={item} className="w-full lg:w-1/3">
            <MusicPanel />
          </motion.div>
        </div>

        <motion.div variants={item} className="mx-auto w-full max-w-6xl">
          <BackgroundGallery
            backgrounds={backgrounds}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </motion.div>
      </motion.main>
    </div>
  );
}
