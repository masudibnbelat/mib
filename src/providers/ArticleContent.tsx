"use client";
import { useMemo, useRef, useEffect } from "react";
import { marked } from "marked";

interface ArticleContentProps {
  content: string;
  className?: string;
}

export function ArticleContent({
  content,
  className = "",
}: ArticleContentProps) {
  const html = useMemo(() => {
    return marked.parse(content, {
      mangle: false,
      headerIds: false,
    }) as string;
  }, [content]);

  const ref = useRef<HTMLDivElement>(null);

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
        const originalText = btn.textContent;
        btn.textContent = "✓ copied";
        setTimeout(() => {
          btn.textContent = originalText;
        }, 1200);
      });
    };

    el.addEventListener("click", handler);
    return () => el.removeEventListener("click", handler);
  }, [html]);

  return (
    <div
      ref={ref}
      className={`${className} prose prose-slate max-w-none`} // Added prose classes for styling
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
