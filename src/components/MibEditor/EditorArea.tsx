// components/editor/EditorArea.tsx
"use client";
import { useRef, useLayoutEffect, useCallback } from "react";

import type { EditorAreaProps } from "../../types/editor";
import { renderToHtml } from "@/src/Utility/editor-renderer";

export function EditorArea({
  value,
  onChange,
  placeholder,
  disabled,
  textareaRef,
}: EditorAreaProps) {
  const mirrorRef = useRef<HTMLDivElement>(null);

  // Keep mirror in sync with value
  useLayoutEffect(() => {
    const el = mirrorRef.current;
    if (!el) return;

    if (value) {
      el.innerHTML = renderToHtml(value);
    } else {
      el.innerHTML = `<div class="text-zinc-500 opacity-40">${placeholder}</div>`;
    }
  }, [value, placeholder]);

  // Sync scroll between textarea and mirror
  const syncScroll = useCallback(() => {
    const ta = textareaRef.current;
    const mr = mirrorRef.current;
    if (!ta || !mr) return;
    mr.scrollTop = ta.scrollTop;
    mr.scrollLeft = ta.scrollLeft;
  }, [textareaRef]);

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Mirror layer - rendered HTML preview */}
      <div
        ref={mirrorRef}
        aria-hidden="true"
        className="absolute inset-0 overflow-y-auto overflow-x-hidden pointer-events-none text-base leading-6 font-[inherit] px-5 py-4 whitespace-pre-wrap wrap-break-word text-slate-200"
      />

      {/* Textarea layer - transparent, handles input */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        disabled={disabled}
        placeholder=""
        spellCheck={false}
        autoComplete="off"
        className={`absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden resize-none border-none outline-none bg-transparent text-base leading-6 font-[inherit] px-5 py-4 whitespace-pre-wrap wrap-break-word z-1 text-transparent caret-violet-400 selection:bg-violet-400/20 ${
          disabled ? "opacity-50" : ""
        }`}
      />
    </div>
  );
}
