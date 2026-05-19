// src/components/ArticleContent/ArticleContent.tsx
"use client";
import { useMemo, useRef, useEffect } from "react";
import { renderToHtml } from "@/src/Utility/editor-renderer";

interface ArticleContentProps {
  content: string;
  className?: string;
}

export function ArticleContent({
  content,
  className = "",
}: ArticleContentProps) {
  const html = useMemo(() => renderToHtml(content), [content]);
  const ref = useRef<HTMLDivElement>(null);

  // Code block copy buttons
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handler = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest("[data-copy-btn]");
      if (!btn) return;

      const targetId = btn.getAttribute("data-copy-target");
      if (!targetId) return;

      const codeEl = document.getElementById(targetId);
      if (!codeEl) return;

      navigator.clipboard.writeText(codeEl.textContent || "").then(() => {
        btn.textContent = "✓ copied";
        setTimeout(() => {
          btn.textContent = "📋";
        }, 1200);
      });
    };

    el.addEventListener("click", handler);
    return () => el.removeEventListener("click", handler);
  }, [html]);

  return (
    <div
      ref={ref}
      className={`${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
