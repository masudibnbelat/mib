// components/editor/FullscreenEditor.tsx
"use client";
import { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Toolbar } from "./Toolbar";
import { EditorArea } from "./EditorArea";
import { Cheatsheet } from "./Cheatsheet";
import { useEditorActions } from "../../hooks/useEditorActions";
import { COLORS, CHEAT_ITEMS } from "../../constants/editor";

interface FullscreenEditorProps {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled: boolean;
  onClose: () => void;
}

export function FullscreenEditor({
  value,
  onChange,
  placeholder,
  disabled,
  onClose,
}: FullscreenEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { wrap, prefixLines, insertBlock } = useEditorActions({
    value,
    onChange,
    textareaRef,
  });

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Focus textarea on open
  useEffect(() => {
    const id = setTimeout(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }, 120);
    return () => clearTimeout(id);
  }, []);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;

      const key = e.key.toLowerCase();
      const shortcuts: Record<string, () => void> = {
        b: () => wrap("**", "**", "bold"),
        i: () => wrap("*", "*", "italic"),
        u: () => wrap("__", "__", "underline"),
        e: () => wrap("`", "`", "code"),
        h: () => wrap("==", "==", "highlight"),
      };

      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key]();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [wrap]);

  return createPortal(
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="editor-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
        className="fixed inset-0 z-9998 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        key="editor-panel"
        initial={{ opacity: 0, scale: 0.97, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 20 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-9999 bg-zinc-900 flex flex-col sm:inset-3 sm:rounded-2xl sm:border sm:border-zinc-800 sm:shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-2.5 pb-0.5 sm:hidden shrink-0">
          <div className="w-9 h-1 rounded-full bg-zinc-600/25" />
        </div>

        {/* Toolbar */}
        <Toolbar
          onWrap={wrap}
          onPrefixLines={prefixLines}
          onInsertBlock={insertBlock}
          onClose={onClose}
          disabled={disabled}
          colors={COLORS}
        />

        {/* Editor */}
        <EditorArea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          textareaRef={textareaRef}
        />

        {/* Cheatsheet */}
        <Cheatsheet items={CHEAT_ITEMS} />
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
