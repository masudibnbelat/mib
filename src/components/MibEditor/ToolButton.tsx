// components/editor/ToolButton.tsx
"use client";
import { ToolBtnProps } from "@/src/types/editor";
import { motion } from "motion/react";

export function ToolButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  active,
}: ToolBtnProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.84 }}
      disabled={disabled}
      title={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={`p-1.5 rounded-lg transition-colors shrink-0 ${
        active
          ? "text-violet-400 bg-violet-500/15"
          : "text-zinc-400 hover:text-violet-400 hover:bg-violet-500/10"
      } ${disabled ? "opacity-40 pointer-events-none" : ""}`}
    >
      <Icon className="w-3.5 h-3.5" />
    </motion.button>
  );
}
