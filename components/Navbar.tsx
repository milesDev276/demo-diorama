"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Flame, Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";

const navLinks = ["Home", "Workspace", "Statistics", "Settings"];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative z-20 mx-3 mt-3 flex items-center justify-between gap-4 rounded-3xl border border-white/25 bg-white/15 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur-xl sm:mx-6 sm:mt-6 sm:px-6"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#A7C4A0]/40 text-[#FDF6EC]">
          <Leaf size={18} />
        </span>
        <div className="leading-tight">
          <p className="font-semibold text-[#FDF6EC]">Farmodoro</p>
          <p className="hidden text-xs text-[#FDF6EC]/70 sm:block">Focus • Grow • Relax</p>
        </div>
      </div>

      <nav className="hidden items-center gap-1 rounded-full bg-black/10 p-1 md:flex">
        {navLinks.map((link) => (
          <button
            key={link}
            type="button"
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              link === "Home"
                ? "bg-[#F0B27A] text-[#4A3421]"
                : "text-[#FDF6EC]/80 hover:bg-white/10 hover:text-[#FDF6EC]"
            )}
          >
            {link}
          </button>
        ))}
      </nav>

      <div className="hidden items-center gap-2 sm:flex">
        <span className="flex items-center gap-1 rounded-full bg-[#F0B27A]/20 px-2.5 py-1 text-xs font-medium text-[#F0B27A]">
          <Flame size={13} />7 day streak
        </span>
        <div className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#9DB4C0]/50 text-xs font-semibold text-[#FDF6EC]">
            M
          </span>
          <span className="text-sm font-medium text-[#FDF6EC]">Manh</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[#FDF6EC] md:hidden"
        aria-label="Toggle menu"
      >
        {menuOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 top-full mt-2 flex flex-col gap-1 rounded-2xl border border-white/25 bg-[#4A3421]/80 p-2 backdrop-blur-xl md:hidden"
          >
            {navLinks.map((link) => (
              <button
                key={link}
                type="button"
                className={cn(
                  "rounded-xl px-4 py-2 text-left text-sm font-medium",
                  link === "Home" ? "bg-[#F0B27A] text-[#4A3421]" : "text-[#FDF6EC]/90"
                )}
              >
                {link}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
