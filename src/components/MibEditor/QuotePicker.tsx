"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquareQuote, ChevronDown } from "lucide-react";
import type { QuotePickerProps, QuoteStyle } from "../../types/editor";

export function QuotePicker({ quotes, onSelect, disabled }: QuotePickerProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: rect.left,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        btnRef.current &&
        !btnRef.current.contains(target) &&
        dropRef.current &&
        !dropRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <>
      <motion.button
        ref={btnRef}
        type="button"
        whileTap={{ scale: 0.86 }}
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((p) => !p);
        }}
        className={`flex items-center gap-0.5 p-1.5 rounded-lg transition-colors shrink-0 ${
          disabled
            ? "opacity-40 pointer-events-none"
            : "text-zinc-400 hover:text-violet-400 hover:bg-violet-500/10"
        }`}
      >
        <MessageSquareQuote className="w-3.5 h-3.5" />
        <ChevronDown
          className={`w-2.5 h-2.5 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </motion.button>

      {open &&
        createPortal(
          <AnimatePresence>
            <motion.div
              ref={dropRef}
              initial={{ opacity: 0, scale: 0.9, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              transition={{ duration: 0.13 }}
              style={{
                position: "fixed",
                top: pos.top,
                left: pos.left,
                zIndex: 99999,
              }}
              className="w-48 p-1.5 rounded-xl bg-zinc-900 border border-zinc-700/60 shadow-2xl"
            >
              {quotes.map((q: QuoteStyle) => (
                <motion.button
                  key={q.key}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelect(q);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/70 transition-colors"
                >
                  <div
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: q.borderColor }}
                  />
                  <span
                    className="text-xs font-medium"
                    style={{ color: q.titleColor }}
                  >
                    {q.label}
                  </span>
                  <span
                    className="text-[10px] ml-auto"
                    style={{ color: q.textColor, opacity: 0.6 }}
                  >
                    বিবরণ
                  </span>
                </motion.button>
              ))}
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
