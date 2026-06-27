// components/MibEditor/font.tsx
"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Type, ChevronDown, StickyNote, Plus, X, Trash2 } from "lucide-react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $createTextNode,
} from "lexical";
import { $patchStyleText } from "@lexical/selection";

/* ─── Config ─── */
export const FONT_FAMILIES = [
  { label: "Default", value: "" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "Comic Sans MS", value: "'Comic Sans MS', cursive" },
  { label: "Impact", value: "Impact, sans-serif" },
];

export const FONT_SIZES = [
  "10px",
  "12px",
  "14px",
  "16px",
  "18px",
  "20px",
  "24px",
  "28px",
  "32px",
  "36px",
  "48px",
  "64px",
  "72px",
];

const STICKY_COLORS = [
  { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
  { bg: "#dbeafe", border: "#3b82f6", text: "#1e3a5f" },
  { bg: "#dcfce7", border: "#22c55e", text: "#14532d" },
  { bg: "#fce7f3", border: "#ec4899", text: "#831843" },
  { bg: "#f3e8ff", border: "#a855f7", text: "#581c87" },
];

/* ─── Hook ─── */
export function useFontActions() {
  const [editor] = useLexicalComposerContext();

  const setFontFamily = useCallback(
    (fontFamily: string) => {
      editor.update(() => {
        const sel = $getSelection();
        if ($isRangeSelection(sel)) {
          $patchStyleText(sel, { "font-family": fontFamily || "" });
        }
      });
    },
    [editor],
  );

  const setFontSize = useCallback(
    (fontSize: string) => {
      editor.update(() => {
        const sel = $getSelection();
        if ($isRangeSelection(sel)) {
          $patchStyleText(sel, { "font-size": fontSize });
        }
      });
    },
    [editor],
  );

  const insertStickyNote = useCallback(
    (colorIndex: number = 0) => {
      editor.update(() => {
        const sel = $getSelection();
        if (!$isRangeSelection(sel)) return;
        const color = STICKY_COLORS[colorIndex % STICKY_COLORS.length];
        const note = $createParagraphNode();
        const text = $createTextNode("📌 Sticky note...");
        note.append(text);
        sel.anchor.getNode().getTopLevelElementOrThrow().insertAfter(note);
        const after = $createParagraphNode();
        note.insertAfter(after);
        text.select();
      });
    },
    [editor],
  );

  return { setFontFamily, setFontSize, insertStickyNote };
}

/* ─── Font Family Dropdown ─── */
export function FontFamilyDropdown({
  ToolbarButton,
}: {
  ToolbarButton: React.ComponentType<{
    active?: boolean;
    onClick: () => void;
    title: string;
    children: React.ReactNode;
  }>;
}) {
  const [show, setShow] = useState(false);
  const { setFontFamily } = useFontActions();

  return (
    <div className="relative">
      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        onClick={() => setShow((p) => !p)}
        className="flex items-center gap-1 px-2 h-8 rounded-lg text-xs font-medium text-(--color-text) hover:bg-(--color-active-bg) border border-(--color-active-border) transition-all duration-150"
      >
        <Type className="w-3.5 h-3.5 text-violet-400" />
        <span className="hidden sm:inline">Font</span>
        <ChevronDown className="w-3 h-3 text-(--color-gray)" />
      </motion.button>
      <AnimatePresence>
        {show && (
          <>
            <div
              className="fixed inset-0 z-10000"
              onClick={() => setShow(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.13 }}
              className="absolute top-full left-0 mt-1.5 z-10001 w-52 max-h-64 overflow-y-auto rounded-xl border border-(--color-active-border) bg-(--color-bg) shadow-2xl"
            >
              {FONT_FAMILIES.map(({ label, value }) => (
                <motion.button
                  key={label}
                  type="button"
                  whileHover={{ x: 4 }}
                  onClick={() => {
                    setFontFamily(value);
                    setShow(false);
                  }}
                  style={{ fontFamily: value || "inherit" }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left text-(--color-text) hover:bg-(--color-active-bg) transition-colors"
                >
                  {label}
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Font Size Dropdown ─── */
export function FontSizeDropdown({
  ToolbarButton,
}: {
  ToolbarButton: React.ComponentType<{
    active?: boolean;
    onClick: () => void;
    title: string;
    children: React.ReactNode;
  }>;
}) {
  const [show, setShow] = useState(false);
  const { setFontSize } = useFontActions();

  return (
    <div className="relative">
      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        onClick={() => setShow((p) => !p)}
        className="flex items-center gap-1 px-2 h-8 rounded-lg text-xs font-medium text-(--color-text) hover:bg-(--color-active-bg) border border-(--color-active-border) transition-all duration-150"
      >
        <span className="text-[10px] text-violet-400 font-bold">Aa</span>
        <span className="hidden sm:inline">Size</span>
        <ChevronDown className="w-3 h-3 text-(--color-gray)" />
      </motion.button>
      <AnimatePresence>
        {show && (
          <>
            <div
              className="fixed inset-0 z-10000"
              onClick={() => setShow(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.13 }}
              className="absolute top-full left-0 mt-1.5 z-10001 w-28 max-h-64 overflow-y-auto rounded-xl border border-(--color-active-border) bg-(--color-bg) shadow-2xl"
            >
              {FONT_SIZES.map((size) => (
                <motion.button
                  key={size}
                  type="button"
                  whileHover={{ x: 4 }}
                  onClick={() => {
                    setFontSize(size);
                    setShow(false);
                  }}
                  className="w-full px-3 py-1.5 text-sm text-left text-(--color-text) hover:bg-(--color-active-bg) transition-colors"
                >
                  {size}
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
