// components/editor/FullscreenEditor.tsx

"use client";
import { useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Bold,
  Italic,
  Strikethrough,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Minus,
  TerminalSquare,
  X,
  Quote,
  Code,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  type LucideIcon,
} from "lucide-react";
import { useEditorActions } from "../../hooks/useEditorActions";
import { COLORS, QUOTE_STYLES, CHEAT_ITEMS } from "../../constants/editor";
import { ColorPicker } from "./ColorPicker";
import { QuotePicker } from "./QuotePicker";
import { renderToHtml } from "@/src/Utility/editor-renderer";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled: boolean;
  onClose: () => void;
}

// ── Tiny inline sub-components ──

function Btn({
  icon: Icon,
  label,
  onClick,
  disabled,
  active,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
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

function Div() {
  return <div className="w-px h-4 bg-zinc-700/60 mx-0.5 shrink-0" />;
}

export function FullscreenEditor({
  value,
  onChange,
  placeholder,
  disabled,
  onClose,
}: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);

  const { wrap, prefixLines, insertBlock, insertQuote, setAlign } =
    useEditorActions({ value, onChange, textareaRef: taRef });

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Auto focus
  useEffect(() => {
    const id = setTimeout(() => {
      const el = taRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }, 120);
    return () => clearTimeout(id);
  }, []);

  // ESC close
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      const map: Record<string, () => void> = {
        b: () => wrap("**", "**", "bold"),
        i: () => wrap("*", "*", "italic"),
        u: () => wrap("__", "__", "underline"),
        e: () => wrap("`", "`", "code"),
        h: () => wrap("==", "==", "highlight"),
      };
      const fn = map[e.key.toLowerCase()];
      if (fn) {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [wrap]);

  // Mirror sync
  useLayoutEffect(() => {
    const el = mirrorRef.current;
    if (!el) return;
    el.innerHTML = value
      ? renderToHtml(value)
      : `<div style="color:#71717a;opacity:0.4">${placeholder}</div>`;
  }, [value, placeholder]);

  const syncScroll = useCallback(() => {
    const ta = taRef.current;
    const mr = mirrorRef.current;
    if (ta && mr) mr.scrollTop = ta.scrollTop;
  }, []);

  return createPortal(
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="ed-bg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-9998 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        key="ed-panel"
        initial={{ opacity: 0, scale: 0.97, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 20 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-9999 bg-zinc-900 flex flex-col sm:inset-3 sm:rounded-2xl sm:border sm:border-zinc-800 sm:shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile handle */}
        <div className="flex justify-center pt-2.5 pb-0.5 sm:hidden shrink-0">
          <div className="w-9 h-1 rounded-full bg-zinc-600/25" />
        </div>

        {/* ── Toolbar ── */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-zinc-800 shrink-0 overflow-x-auto scrollbar-none">
          <Btn
            icon={Heading1}
            label="H1"
            onClick={() => prefixLines("# ")}
            disabled={disabled}
          />
          <Btn
            icon={Heading2}
            label="H2"
            onClick={() => prefixLines("## ")}
            disabled={disabled}
          />
          <Btn
            icon={Heading3}
            label="H3"
            onClick={() => prefixLines("### ")}
            disabled={disabled}
          />

          <Div />

          <Btn
            icon={Bold}
            label="Bold"
            onClick={() => wrap("**", "**", "bold")}
            disabled={disabled}
          />
          <Btn
            icon={Italic}
            label="Italic"
            onClick={() => wrap("*", "*", "italic")}
            disabled={disabled}
          />
          <Btn
            icon={Strikethrough}
            label="Strike"
            onClick={() => wrap("~~", "~~", "strike")}
            disabled={disabled}
          />
          <Btn
            icon={Underline}
            label="Underline"
            onClick={() => wrap("__", "__", "underline")}
            disabled={disabled}
          />
          <Btn
            icon={Highlighter}
            label="Highlight"
            onClick={() => wrap("==", "==", "highlight")}
            disabled={disabled}
          />

          <Div />

          <Btn
            icon={List}
            label="Bullet"
            onClick={() => prefixLines("- ")}
            disabled={disabled}
          />
          <Btn
            icon={ListOrdered}
            label="Ordered"
            onClick={() => prefixLines("1. ")}
            disabled={disabled}
          />
          <Btn
            icon={Quote}
            label="Quote"
            onClick={() => prefixLines("> ")}
            disabled={disabled}
          />
          <QuotePicker
            quotes={QUOTE_STYLES}
            onSelect={insertQuote}
            disabled={disabled}
          />

          <Div />

          <Btn
            icon={Code}
            label="Code"
            onClick={() => wrap("`", "`", "code")}
            disabled={disabled}
          />
          <Btn
            icon={TerminalSquare}
            label="Code block"
            onClick={() => insertBlock("```\n\n```")}
            disabled={disabled}
          />
          <Btn
            icon={Minus}
            label="Divider"
            onClick={() => insertBlock("---")}
            disabled={disabled}
          />

          <Div />

          <Btn
            icon={AlignLeft}
            label="Left"
            onClick={() => setAlign("left")}
            disabled={disabled}
          />
          <Btn
            icon={AlignCenter}
            label="Center"
            onClick={() => setAlign("center")}
            disabled={disabled}
          />
          <Btn
            icon={AlignRight}
            label="Right"
            onClick={() => setAlign("right")}
            disabled={disabled}
          />

          <Div />

          <ColorPicker
            colors={COLORS}
            onSelect={(m) => wrap(m, m, "রঙিন লেখা")}
            disabled={disabled}
          />

          <div className="flex-1" />

          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>

        {/* ── Editor Area ── */}
        <div className="relative flex-1 overflow-hidden">
          {/* Mirror */}
          <div
            ref={mirrorRef}
            aria-hidden
            className="absolute inset-0 overflow-y-auto overflow-x-hidden pointer-events-none text-base leading-6 font-[inherit] px-5 py-4 whitespace-pre-wrap wrap-break-word text-slate-200"
          />
          {/* Textarea */}
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={syncScroll}
            disabled={disabled}
            spellCheck={false}
            autoComplete="off"
            className={`absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden resize-none border-none outline-none bg-transparent text-base leading-6 font-[inherit] px-5 py-4 whitespace-pre-wrap wrap-break-word z-1 text-transparent caret-violet-400 selection:bg-violet-400/20 ${
              disabled ? "opacity-50" : ""
            }`}
          />
        </div>

        {/* ── Cheatsheet ── */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-4 py-2 border-t border-zinc-800/40 text-[10px] font-mono text-zinc-500/40 shrink-0 overflow-hidden">
          {CHEAT_ITEMS.map((c) => (
            <span key={c.sym} className="whitespace-nowrap">
              <span className="text-violet-400/55">{c.sym}</span> {c.desc}
            </span>
          ))}
          <div className="flex-1" />
          <span className="hidden sm:inline opacity-50">Esc to close</span>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
