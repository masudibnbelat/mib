// Outputpanel.tsx

"use client";

import React, { memo, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

import { getOutputLabel, OUTPUT_ICONS } from "./ThirdEyeLogic";
import { useEditor } from "./ Editorcontext";

export const OutputPanel = memo(() => {
  const { state, dispatch } = useEditor();
  const { output, lang } = state;

  const dismiss = useCallback(
    () => dispatch({ type: "SET_OUTPUT", payload: null }),
    [dispatch],
  );

  const label = useMemo(
    () => (output ? getOutputLabel(lang.label)[output.status] : ""),
    [output, lang.label],
  );

  return (
    <AnimatePresence>
      {output && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-50 flex flex-col border-t border-(--color-active-border) bg-(--color-bg)"
          style={{
            maxHeight: "40vh",
            boxShadow: "0 -4px 32px var(--color-shadow-md)",
          }}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-2 px-4 py-2 shrink-0 border-b border-(--color-active-border) bg-(--color-active-bg)">
            <span className="flex shrink-0">{OUTPUT_ICONS[output.status]}</span>
            <span className="flex-1 text-[10px] font-mono uppercase tracking-widest text-(--color-gray)">
              {label}
            </span>
            <motion.button
              onClick={dismiss}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.88 }}
              className="flex items-center justify-center p-1 rounded text-(--color-gray) hover:text-(--color-text) hover:bg-(--color-active-bg) transition-colors"
            >
              <X size={13} />
            </motion.button>
          </div>

          <div className="overflow-y-auto p-4 flex-1">
            <AnimatePresence mode="wait">
              {output.status === "loading" ? (
                <motion.pre
                  key="loading"
                  className="tb-pre loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Executing
                  <span className="tb-dots">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </span>
                </motion.pre>
              ) : (
                <motion.pre
                  key="result"
                  className={`tb-pre ${output.status}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {output.text}
                </motion.pre>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
OutputPanel.displayName = "OutputPanel";
