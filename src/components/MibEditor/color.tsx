// components/MibEditor/color.tsx
"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Highlighter, X } from "lucide-react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection } from "lexical";
import { $patchStyleText } from "@lexical/selection";

/* ─── Config ─── */
export const TEXT_COLORS = [
  "var(--color-text)",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
  "#ffffff",
  "#000000",
];

export const BG_COLORS = [
  "transparent",
  "#ef444440",
  "#f9731640",
  "#eab30840",
  "#22c55e40",
  "#3b82f640",
  "#8b5cf640",
  "#ec489940",
  "#6b728040",
  "#ffffff20",
];

/* ─── Hook ─── */
export function useColorActions() {
  const [editor] = useLexicalComposerContext();

  const applyStyle = useCallback(
    (styles: Record<string, string>) => {
      editor.update(() => {
        const sel = $getSelection();
        if ($isRangeSelection(sel)) $patchStyleText(sel, styles);
      });
    },
    [editor],
  );

  return { applyStyle };
}

/* ─── Color Picker Popup ─── */
function ColorGrid({
  colors,
  onSelect,
  isBackground,
}: {
  colors: string[];
  onSelect: (color: string) => void;
  isBackground?: boolean;
}) {
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onSelect(color)}
          className="w-6 h-6 rounded-full border border-(--color-active-border) hover:scale-125 transition-transform"
          style={{
            backgroundColor:
              color === "transparent" ? "var(--color-active-bg)" : color,
          }}
          title={color === "transparent" ? "None" : color}
        >
          {color === "transparent" && (
            <X className="w-3 h-3 text-(--color-gray) m-auto" />
          )}
        </button>
      ))}
    </div>
  );
}

/* ─── Toolbar Buttons ─── */
export function ColorToolbarButtons({
  ToolbarButton,
}: {
  ToolbarButton: React.ComponentType<{
    active?: boolean;
    onClick: () => void;
    title: string;
    children: React.ReactNode;
  }>;
}) {
  const [showText, setShowText] = useState(false);
  const [showBg, setShowBg] = useState(false);
  const { applyStyle } = useColorActions();

  const closeAll = () => {
    setShowText(false);
    setShowBg(false);
  };

  return (
    <>
      {/* Text color */}
      <div className="relative">
        <ToolbarButton
          active={showText}
          onClick={() => {
            setShowBg(false);
            setShowText((p) => !p);
          }}
          title="Text Color"
        >
          <Palette className="w-4 h-4" />
        </ToolbarButton>
        <AnimatePresence>
          {showText && (
            <>
              <div className="fixed inset-0 z-10000" onClick={closeAll} />
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute top-full left-0 mt-1.5 z-10001 w-44 p-3 rounded-xl border border-(--color-active-border) bg-(--color-bg) shadow-2xl"
              >
                <p className="text-[10px] text-(--color-gray) font-semibold uppercase tracking-wider mb-2">
                  Text Color
                </p>
                <ColorGrid
                  colors={TEXT_COLORS}
                  onSelect={(c) => {
                    applyStyle({ color: c });
                    closeAll();
                  }}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Highlight */}
      <div className="relative">
        <ToolbarButton
          active={showBg}
          onClick={() => {
            setShowText(false);
            setShowBg((p) => !p);
          }}
          title="Highlight Color"
        >
          <Highlighter className="w-4 h-4" />
        </ToolbarButton>
        <AnimatePresence>
          {showBg && (
            <>
              <div className="fixed inset-0 z-10000" onClick={closeAll} />
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute top-full left-0 mt-1.5 z-10001 w-44 p-3 rounded-xl border border-(--color-active-border) bg-(--color-bg) shadow-2xl"
              >
                <p className="text-[10px] text-(--color-gray) font-semibold uppercase tracking-wider mb-2">
                  Background
                </p>
                <ColorGrid
                  colors={BG_COLORS}
                  onSelect={(c) => {
                    applyStyle({ "background-color": c });
                    closeAll();
                  }}
                  isBackground
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
