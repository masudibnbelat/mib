// components/editor/CollapsedPreview.tsx
"use client";
import { useMemo } from "react";
import { LINE_HEIGHT_PX } from "../../constants/editor";
import { renderToHtml } from "@/src/Utility/editor-renderer";

interface CollapsedPreviewProps {
  value: string;
  placeholder: string;
  rows: number;
  disabled: boolean;
  onOpen: () => void;
}

export function CollapsedPreview({
  value,
  placeholder,
  rows,
  disabled,
  onOpen,
}: CollapsedPreviewProps) {
  const html = useMemo(
    () =>
      value
        ? renderToHtml(value)
        : `<span class="text-zinc-500 opacity-45">${placeholder}</span>`,
    [value, placeholder],
  );

  const minH = rows * LINE_HEIGHT_PX + 20;

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onOpen}
      onKeyDown={(e) => e.key === "Enter" && !disabled && onOpen()}
      className={`group relative w-full rounded-xl cursor-text border border-zinc-700/60 bg-zinc-900/60 transition-all duration-200 hover:border-violet-500/50 hover:ring-1 hover:ring-violet-500/20 focus:outline-none focus:ring-2 focus:ring-violet-500/40 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      style={{ minHeight: `${minH}px` }}
    >
      <div
        className="px-3 py-2.5 select-none overflow-hidden text-base leading-6 text-slate-200"
        style={{ minHeight: `${minH}px` }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
