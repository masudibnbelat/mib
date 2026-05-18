// components/editor/Cheatsheet.tsx
"use client";
import type { CheatsheetProps } from "../../types/editor";

export function Cheatsheet({ items }: CheatsheetProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-4 py-2 border-t border-zinc-800/40 text-[10px] font-mono text-zinc-500/40 shrink-0 overflow-hidden">
      {items.map((c) => (
        <span key={c.sym} className="whitespace-nowrap">
          <span className="text-violet-400/55">{c.sym}</span> {c.desc}
        </span>
      ))}
      <div className="flex-1" />
      <span className="hidden sm:inline opacity-50">Esc to close</span>
    </div>
  );
}
