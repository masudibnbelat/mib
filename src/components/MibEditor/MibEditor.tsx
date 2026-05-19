// components/MibEditor/MibEditor.tsx
"use client";
import { useState, useMemo } from "react";
import { FullscreenEditor } from "./FullscreenEditor";
import { renderToHtml } from "@/src/Utility/editor-renderer";
import { LINE_HEIGHT_PX } from "../../constants/editor";
import type { MibEditorProps } from "../../types/editor";

const MibEditor = ({
  value,
  onChange,
  placeholder = "বিস্তারিত বিবরণ লিখুন...",
  rows = 6,
  disabled = false,
  className = "",
}: MibEditorProps) => {
  const [open, setOpen] = useState(false);

  const html = useMemo(
    () =>
      value
        ? renderToHtml(value)
        : `<span style="color:#71717a;opacity:0.45">${placeholder}</span>`,
    [value, placeholder],
  );

  // FIX: height fixed, not min-height
  const fixedHeight = rows * LINE_HEIGHT_PX + 20;

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={disabled ? undefined : () => setOpen(true)}
        onKeyDown={(e) => e.key === "Enter" && !disabled && setOpen(true)}
        className={`group relative w-full rounded-xl cursor-text border border-zinc-700/60 bg-zinc-900/60 transition-all duration-200 hover:border-violet-500/50 hover:ring-1 hover:ring-violet-500/20 focus:outline-none focus:ring-2 focus:ring-violet-500/40 ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        // FIX: Use fixed height and hide overflow
        style={{
          height: `${fixedHeight}px`,
          overflow: "hidden",
        }}
      >
        <div
          className="p-3 select-none text-base leading-6 text-slate-200"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      {open && (
        <FullscreenEditor
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
};

export default MibEditor;
