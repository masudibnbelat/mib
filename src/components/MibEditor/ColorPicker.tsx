// components/editor/ColorPicker.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Palette, ChevronDown } from "lucide-react";
import type { ColorPickerProps } from "../../types/editor";

export function ColorPicker({ colors, onSelect, disabled }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.86 }}
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((p) => !p);
        }}
        className={`flex items-center gap-0.5 p-1.5 rounded-lg transition-colors ${
          disabled
            ? "opacity-40 pointer-events-none"
            : "text-zinc-400 hover:text-violet-400 hover:bg-violet-500/10"
        }`}
      >
        <Palette className="w-3.5 h-3.5" />
        <ChevronDown
          className={`w-2.5 h-2.5 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -4 }}
            transition={{ duration: 0.13 }}
            className="absolute top-9 left-0 z-30 grid grid-cols-6 gap-1.5 p-2.5 rounded-xl bg-zinc-900/95 border border-zinc-700/60 shadow-2xl backdrop-blur-md"
          >
            {colors.map((c) => (
              <motion.button
                key={c.key}
                type="button"
                whileHover={{ scale: 1.25 }}
                whileTap={{ scale: 0.9 }}
                title={c.label}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect(c.marker);
                  setOpen(false);
                }}
                className="w-5 h-5 rounded-full border-2 border-transparent hover:border-white/40 transition-all ring-1 ring-white/10"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
