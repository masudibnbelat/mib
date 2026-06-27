// src/providers/ArticleContent.tsx

"use client";

import { useLayoutEffect, useRef } from "react";

interface ArticleContentProps {
  content: string;
  className?: string;
}

export function ArticleContent({
  content,
  className = "",
}: ArticleContentProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    // ═══ CODE BLOCKS ═══
    root
      .querySelectorAll<HTMLElement>("code.mib-code-block")
      .forEach((codeEl) => {
        if (codeEl.closest("[data-code-wrapper]")) return;

        const lang =
          codeEl.getAttribute("data-highlight-language") ||
          codeEl.getAttribute("data-language") ||
          codeEl.getAttribute("data-gutter") ||
          detectLanguageFromClasses(codeEl) ||
          "Code";

        const wrap = document.createElement("div");
        wrap.setAttribute("data-code-wrapper", "true");
        wrap.className =
          "relative my-5 rounded-xl overflow-hidden border border-violet-500/20 shadow-lg";
        codeEl.parentNode?.insertBefore(wrap, codeEl);
        wrap.appendChild(codeEl);

        const header = document.createElement("div");
        header.className =
          "flex items-center justify-between px-4 py-2.5 bg-[#1a1a2e] border-b border-violet-500/15 select-none";

        const badge = document.createElement("span");
        badge.className =
          "text-[11px] font-mono font-semibold uppercase tracking-[0.15em] text-violet-400/70";
        badge.textContent = lang;

        const copyBtn = createCopyButton(() => extractCodeText(codeEl));

        header.appendChild(badge);
        header.appendChild(copyBtn);
        wrap.insertBefore(header, codeEl);

        codeEl.style.borderTopLeftRadius = "0";
        codeEl.style.borderTopRightRadius = "0";
        codeEl.style.marginTop = "0";
        codeEl.style.borderTop = "none";
      });

    // fallback: <pre> blocks (not already wrapped)
    root.querySelectorAll<HTMLElement>("pre").forEach((pre) => {
      if (pre.closest("[data-code-wrapper]")) return;

      const codeChild = pre.querySelector("code");
      const lang = codeChild
        ? codeChild.getAttribute("data-highlight-language") ||
          codeChild.getAttribute("data-language") ||
          detectLanguageFromClasses(codeChild) ||
          "Code"
        : "Code";

      const wrap = document.createElement("div");
      wrap.setAttribute("data-code-wrapper", "true");
      wrap.className =
        "relative my-5 rounded-xl overflow-hidden border border-violet-500/20 shadow-lg";
      pre.parentNode?.insertBefore(wrap, pre);
      wrap.appendChild(pre);

      const header = document.createElement("div");
      header.className =
        "flex items-center justify-between px-4 py-2.5 bg-[#1a1a2e] border-b border-violet-500/15 select-none";

      const badge = document.createElement("span");
      badge.className =
        "text-[11px] font-mono font-semibold uppercase tracking-[0.15em] text-violet-400/70";
      badge.textContent = lang;

      const copyBtn = createCopyButton(() => extractCodeText(codeChild || pre));

      header.appendChild(badge);
      header.appendChild(copyBtn);
      wrap.insertBefore(header, pre);

      pre.style.borderTopLeftRadius = "0";
      pre.style.borderTopRightRadius = "0";
      pre.style.marginTop = "0";
      pre.style.borderTop = "none";
    });

    // ═══ STYLED QUOTE ═══
    root.querySelectorAll<HTMLElement>("[data-styled-quote]").forEach((el) => {
      if (el.getAttribute("data-styled-rendered")) return;
      el.setAttribute("data-styled-rendered", "true");

      const style = el.getAttribute("data-quote-style") || "elegant";
      const blockquote = el.querySelector("blockquote");
      const cite = el.querySelector("cite");

      if (!blockquote) return;

      const text = blockquote.textContent || "";
      const author = cite?.textContent?.replace(/^—\s*/, "") || "";

      // clear & rebuild
      el.innerHTML = "";
      el.className =
        "my-6 mx-auto max-w-2xl rounded-2xl border border-[var(--color-active-border)] overflow-hidden";
      el.style.cssText = ""; // clear inline styles from exportDOM

      const inner = document.createElement("div");
      inner.innerHTML = buildStyledQuoteHTML(style, text, author);
      el.appendChild(inner);
    });

    // ═══ ALSO CATCH: blockquote[data-style] (direct from exportDOM) ═══
    root
      .querySelectorAll<HTMLElement>("blockquote[data-style]")
      .forEach((bq) => {
        // If parent is already data-styled-quote, skip
        if (bq.closest("[data-styled-quote]")) return;
        if (bq.getAttribute("data-styled-rendered")) return;
        bq.setAttribute("data-styled-rendered", "true");

        const style = bq.getAttribute("data-style") || "elegant";
        const text = bq.textContent || "";
        const cite = bq.parentElement?.querySelector("cite");
        const author = cite?.textContent?.replace(/^—\s*/, "") || "";

        // Wrap in a styled container
        const wrapper = document.createElement("div");
        wrapper.className =
          "my-6 mx-auto max-w-2xl rounded-2xl border border-[var(--color-active-border)] overflow-hidden";

        const inner = document.createElement("div");
        inner.innerHTML = buildStyledQuoteHTML(style, text, author);

        wrapper.appendChild(inner);

        // Replace the blockquote (and cite if sibling)
        const parent = bq.parentElement;
        if (parent && cite) {
          parent.insertBefore(wrapper, bq);
          bq.remove();
          cite.remove();
        } else {
          bq.parentNode?.insertBefore(wrapper, bq);
          bq.remove();
        }
      });

    // ═══ POLL (read-only) ═══
    root.querySelectorAll<HTMLElement>("[data-poll]").forEach((el) => {
      if (el.getAttribute("data-poll-rendered")) return;
      el.setAttribute("data-poll-rendered", "true");

      // Extract question and options from the existing DOM
      const titleEl = el.querySelector("h4");
      const listItems = el.querySelectorAll("li");

      const question = titleEl?.textContent?.replace(/^📊\s*/, "") || "Poll";
      const options: string[] = [];
      listItems.forEach((li) => {
        if (li.textContent?.trim()) options.push(li.textContent.trim());
      });

      // Rebuild with nice read-only UI
      el.innerHTML = "";
      el.className =
        "my-6 rounded-2xl border border-[var(--color-active-border)] overflow-hidden shadow-md";
      el.style.cssText = ""; // clear exportDOM inline styles

      el.innerHTML = buildPollHTML(question, options);
    });

    // ═══ COLUMNS ═══
    root.querySelectorAll<HTMLElement>("[data-columns]").forEach((el) => {
      if (el.getAttribute("data-cols-rendered")) return;
      el.setAttribute("data-cols-rendered", "true");

      const columns = el.querySelectorAll<HTMLElement>(":scope > div");
      const colCount = columns.length || 2;

      // Reset styles properly
      el.style.cssText = `display:grid;grid-template-columns:repeat(${colCount},1fr);gap:1rem;margin:1.5rem 0;`;
      el.className = ""; // remove old classes

      columns.forEach((col, i) => {
        col.className = "";
        col.style.cssText =
          "padding:1rem;border-radius:0.75rem;border:1px solid var(--color-active-border);background:var(--color-active-bg);";

        // Add column number indicator
        if (!col.querySelector("[data-col-num]")) {
          const num = document.createElement("div");
          num.setAttribute("data-col-num", "true");
          num.style.cssText =
            "font-size:0.625rem;font-weight:600;color:var(--color-gray);margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:0.1em;opacity:0.5;";
          num.textContent = `Column ${i + 1}`;
          col.insertBefore(num, col.firstChild);
        }
      });
    });

    // ═══ TABLES (ensure proper styling) ═══
    root.querySelectorAll<HTMLTableElement>("table").forEach((table) => {
      if (table.getAttribute("data-table-rendered")) return;
      table.setAttribute("data-table-rendered", "true");

      // Wrap in scrollable container if not already
      if (!table.parentElement?.classList.contains("table-scroll-wrapper")) {
        const wrapper = document.createElement("div");
        wrapper.className =
          "table-scroll-wrapper overflow-x-auto my-4 rounded-xl border border-[var(--color-active-border)]";
        table.parentNode?.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }

      table.style.cssText =
        "width:100%;border-collapse:collapse;font-size:0.875rem;";

      table.querySelectorAll("th").forEach((th) => {
        th.style.cssText =
          "padding:0.625rem 0.875rem;border:1px solid var(--color-active-border);font-weight:600;background:var(--color-active-bg);text-align:left;";
      });

      table.querySelectorAll("td").forEach((td) => {
        td.style.cssText =
          "padding:0.625rem 0.875rem;border:1px solid var(--color-active-border);";
      });
    });
  }, [content]);

  return (
    <div
      ref={ref}
      className={[
        "max-w-none text-(--color-text)",

        // paragraph
        "[&_p]:mb-3 [&_p]:leading-7 [&_p]:wrap-break-word",

        // headings
        "[&_h1]:text-3xl [&_h1]:font-extrabold [&_h1]:leading-tight [&_h1]:mt-8 [&_h1]:mb-4",
        "[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:leading-snug [&_h2]:mt-7 [&_h2]:mb-3",
        "[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:leading-snug [&_h3]:mt-6 [&_h3]:mb-3",
        "[&_h4]:text-lg [&_h4]:font-semibold [&_h4]:mt-5 [&_h4]:mb-2",
        "[&_h5]:text-base [&_h5]:font-semibold [&_h5]:mt-4 [&_h5]:mb-2",
        "[&_h6]:text-sm [&_h6]:font-semibold [&_h6]:uppercase [&_h6]:tracking-wide [&_h6]:mt-4 [&_h6]:mb-2",
        "first:*:mt-0",

        // text format
        "[&_strong]:font-bold [&_b]:font-bold",
        "[&_em]:italic [&_i]:italic",
        "[&_u]:underline [&_u]:underline-offset-2",
        "[&_s]:line-through [&_del]:line-through",
        "[&_sub]:align-sub [&_sub]:text-[0.75em]",
        "[&_sup]:align-super [&_sup]:text-[0.75em]",

        // links
        "[&_a]:text-violet-400 [&_a]:underline [&_a]:underline-offset-2",
        "[&_a:hover]:text-violet-300 [&_a]:transition-colors",

        // lists
        "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ul]:space-y-1.5",
        "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_ol]:space-y-1.5",
        "[&_li]:leading-7",

        // blockquote (only non-styled ones)
        "[&_blockquote:not([data-style]):not([data-styled-rendered])]:my-4",
        "[&_blockquote:not([data-style]):not([data-styled-rendered])]:border-l-4",
        "[&_blockquote:not([data-style]):not([data-styled-rendered])]:border-violet-500",
        "[&_blockquote:not([data-style]):not([data-styled-rendered])]:pl-4",
        "[&_blockquote:not([data-style]):not([data-styled-rendered])]:italic",
        "[&_blockquote:not([data-style]):not([data-styled-rendered])]:text-(--color-gray)",

        // inline code
        "[&_:not(pre)>code:not(.mib-code-block)]:bg-violet-500/15",
        "[&_:not(pre)>code:not(.mib-code-block)]:text-violet-300",
        "[&_:not(pre)>code:not(.mib-code-block)]:border",
        "[&_:not(pre)>code:not(.mib-code-block)]:border-violet-500/20",
        "[&_:not(pre)>code:not(.mib-code-block)]:rounded-md",
        "[&_:not(pre)>code:not(.mib-code-block)]:px-1.5",
        "[&_:not(pre)>code:not(.mib-code-block)]:py-0.5",
        "[&_:not(pre)>code:not(.mib-code-block)]:font-mono",
        "[&_:not(pre)>code:not(.mib-code-block)]:text-[0.875em]",

        // mib-code-block
        "[&_.mib-code-block]:block [&_.mib-code-block]:relative",
        "[&_.mib-code-block]:bg-[#1e1e2e] [&_.mib-code-block]:text-gray-200",
        "[&_.mib-code-block]:border-none",
        "[&_.mib-code-block]:rounded-b-xl",
        "[&_.mib-code-block]:font-mono [&_.mib-code-block]:text-[13px] [&_.mib-code-block]:leading-7",
        "[&_.mib-code-block]:p-4 [&_.mib-code-block]:pl-5",
        "[&_.mib-code-block]:whitespace-pre-wrap [&_.mib-code-block]:wrap-break-word",
        "[&_.mib-code-block]:overflow-x-auto",

        // pre fallback
        "[&_pre]:bg-[#1e1e2e] [&_pre]:my-0 [&_pre]:rounded-b-xl [&_pre]:border-none",
        "[&_pre_code]:block [&_pre_code]:p-4",
        "[&_pre_code]:font-mono [&_pre_code]:text-[13px] [&_pre_code]:leading-7",
        "[&_pre_code]:text-gray-200",
        "[&_pre_code]:whitespace-pre-wrap [&_pre_code]:wrap-break-word",
        "[&_pre_code]:bg-transparent [&_pre_code]:border-none",

        // syntax highlight tokens
        "[&_.token.comment]:text-[#7f848e] [&_.token.comment]:italic",
        "[&_.token.keyword]:text-[#c678dd]",
        "[&_.token.function]:text-[#61afef]",
        "[&_.token.string]:text-[#98c379]",
        "[&_.token.number]:text-[#d19a66]",
        "[&_.token.boolean]:text-[#d19a66]",
        "[&_.token.property]:text-[#d19a66]",
        "[&_.token.tag]:text-[#e06c75]",
        "[&_.token.variable]:text-[#e06c75]",
        "[&_.token.operator]:text-[#56b6c2]",
        "[&_.token.class-name]:text-[#e5c07b]",
        "[&_.token.builtin]:text-[#e5c07b]",
        "[&_.token.punctuation]:text-[#abb2bf]",
        "[&_.token.attr-name]:text-[#56b6c2]",
        "[&_.token.attr-value]:text-[#98c379]",
        "[&_.token.constant]:text-[#d19a66]",
        "[&_.token.deleted]:text-[#e06c75]",
        "[&_.token.inserted]:text-[#98c379]",
        "[&_.token.selector]:text-[#98c379]",
        "[&_.token.atrule]:text-[#c678dd]",
        "[&_.token.regex]:text-[#98c379]",
        "[&_.token.important]:text-[#e06c75] [&_.token.important]:font-bold",
        "[&_.token.entity]:text-[#56b6c2]",
        "[&_.token.url]:text-[#56b6c2]",
        "[&_.token.namespace]:text-[#c678dd]/80",
        "[&_.token.prolog]:text-[#7f848e]",
        "[&_.token.cdata]:text-[#7f848e]",

        // hr
        "[&_hr]:my-6 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-(--color-active-border)",

        // img
        "[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-4",

        className,
      ].join(" ")}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

// ═══ HELPER: Detect language from CSS classes ═══
function detectLanguageFromClasses(el: Element): string | null {
  const classes = Array.from(el.classList);
  for (const cls of classes) {
    // Common patterns: language-javascript, lang-python, etc.
    const match = cls.match(/^(?:language|lang)-(.+)$/);
    if (match) return match[1];
  }
  return null;
}

// ═══ HELPER: Extract clean code text ═══
function extractCodeText(root: HTMLElement): string {
  let result = "";
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent || "";
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.tagName.toLowerCase() === "br") {
        result += "\n";
      } else {
        for (const child of Array.from(el.childNodes)) walk(child);
      }
    }
  };
  for (const child of Array.from(root.childNodes)) walk(child);
  return result;
}

// ═══ HELPER: Copy Button Creator ═══
function createCopyButton(getText: () => string): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className =
    "inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors cursor-pointer outline-none";

  const COPY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
  const CHECK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

  btn.innerHTML = `${COPY_SVG}<span>Copy code</span>`;

  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(getText());
      btn.innerHTML = `<span class="text-green-400">${CHECK_SVG}</span><span class="text-green-400">Copied!</span>`;
      setTimeout(() => {
        btn.innerHTML = `${COPY_SVG}<span>Copy code</span>`;
      }, 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = getText();
      ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        btn.innerHTML = `<span class="text-green-400">${CHECK_SVG}</span><span class="text-green-400">Copied!</span>`;
        setTimeout(() => {
          btn.innerHTML = `${COPY_SVG}<span>Copy code</span>`;
        }, 2000);
      } catch {
        /* silent */
      }
      document.body.removeChild(ta);
    }
  });

  return btn;
}

// ═══ HELPER: Build Poll HTML (read-only) ═══
function buildPollHTML(question: string, options: string[]): string {
  const optionsHTML = options
    .map(
      (opt, i) => `
    <div style="padding:0.625rem 0.875rem;border:1px solid var(--color-active-border);border-radius:0.75rem;font-size:0.875rem;color:var(--color-text);display:flex;align-items:center;gap:0.625rem;">
      <span style="width:1.25rem;height:1.25rem;border-radius:50%;border:2px solid var(--color-active-border);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.625rem;color:var(--color-gray);">${i + 1}</span>
      <span>${opt}</span>
    </div>`,
    )
    .join("");

  return `
    <div style="padding:0.625rem 1rem;background:rgba(16,185,129,0.06);border-bottom:1px solid var(--color-active-border);display:flex;align-items:center;gap:0.5rem;">
      <span style="font-size:0.6875rem;font-weight:600;color:#34d399;text-transform:uppercase;letter-spacing:0.08em;">📊 Poll</span>
    </div>
    <div style="padding:1rem;">
      <h4 style="font-weight:600;margin-bottom:0.875rem;font-size:0.9375rem;color:var(--color-text);">${question}</h4>
      <div style="display:flex;flex-direction:column;gap:0.5rem;">
        ${optionsHTML}
      </div>
      <div style="margin-top:0.75rem;font-size:0.6875rem;color:var(--color-gray);display:flex;align-items:center;gap:0.375rem;">
        <span>🗳️</span>
        <span>Poll — view only</span>
      </div>
    </div>`;
}

// ═══ HELPER: Build Styled Quote HTML ═══
function buildStyledQuoteHTML(
  style: string,
  text: string,
  author: string,
): string {
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const safeText = esc(text);
  const safeAuthor = esc(author);

  const authorHTML = safeAuthor
    ? `<div style="margin-top:0.75rem;font-size:0.875rem;opacity:0.7;">— ${safeAuthor}</div>`
    : "";

  switch (style) {
    case "elegant":
      return `
        <div style="padding:1.5rem 2rem;position:relative;">
          <div style="position:absolute;top:0.5rem;left:0.75rem;font-size:3rem;line-height:1;color:rgba(139,92,246,0.15);font-family:Georgia,serif;">"</div>
          <blockquote style="position:relative;z-index:1;font-style:italic;font-family:Georgia,serif;font-size:1.125rem;line-height:1.75;color:var(--color-text);">
            "${safeText}"
          </blockquote>
          ${safeAuthor ? `<div style="margin-top:1rem;display:flex;align-items:center;gap:0.5rem;"><div style="width:2rem;height:1px;background:rgba(139,92,246,0.4);"></div><span style="font-size:0.875rem;color:#a78bfa;font-weight:500;">${safeAuthor}</span></div>` : ""}
        </div>`;

    case "gradient":
      return `
        <div style="position:relative;overflow:hidden;border-radius:0.75rem;">
          <div style="position:absolute;top:0;bottom:0;left:0;width:4px;background:linear-gradient(to bottom,#ec4899,#8b5cf6,#3b82f6);"></div>
          <div style="padding:1.25rem 1rem 1.25rem 1.5rem;">
            <blockquote style="font-weight:500;line-height:1.75;color:var(--color-text);">${safeText}</blockquote>
            ${safeAuthor ? `<div style="margin-top:0.75rem;font-size:0.875rem;background:linear-gradient(to right,#ec4899,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-weight:600;">— ${safeAuthor}</div>` : ""}
          </div>
        </div>`;

    case "brutalist":
      return `
        <div style="background:linear-gradient(135deg,rgba(249,115,22,0.08),rgba(239,68,68,0.04));border-left:4px solid #f97316;padding:1.5rem;">
          <blockquote style="font-size:1.375rem;font-weight:800;line-height:1.3;text-transform:uppercase;letter-spacing:-0.02em;color:var(--color-text);">${safeText}</blockquote>
          ${safeAuthor ? `<div style="margin-top:1rem;font-size:0.75rem;font-weight:700;color:#f97316;text-transform:uppercase;letter-spacing:0.1em;">— ${safeAuthor}</div>` : ""}
        </div>`;

    case "literary":
      return `
        <div style="border-top:1px solid var(--color-active-border);border-bottom:1px solid var(--color-active-border);padding:2rem 1.5rem;text-align:center;">
          <blockquote style="font-style:italic;font-family:Georgia,serif;line-height:2;color:var(--color-text);max-width:28rem;margin:0 auto;opacity:0.9;">${safeText}</blockquote>
          ${safeAuthor ? `<div style="margin-top:1.25rem;"><span style="display:inline-block;padding:0.25rem 1rem;border-radius:9999px;background:rgba(16,185,129,0.1);font-size:0.75rem;font-weight:600;color:#34d399;text-transform:uppercase;letter-spacing:0.05em;">${safeAuthor}</span></div>` : ""}
        </div>`;

    case "callout":
      return `
        <div style="background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.15);border-radius:1rem;padding:1.25rem;position:relative;overflow:hidden;">
          <div style="display:flex;gap:0.75rem;">
            <div style="flex-shrink:0;width:2rem;height:2rem;border-radius:0.5rem;background:rgba(59,130,246,0.15);display:flex;align-items:center;justify-content:center;font-size:1rem;">📢</div>
            <div>
              <blockquote style="font-size:0.875rem;font-weight:500;line-height:1.75;color:var(--color-text);">${safeText}</blockquote>
              ${safeAuthor ? `<div style="margin-top:0.5rem;font-size:0.75rem;color:rgba(96,165,250,0.8);font-weight:500;">— ${safeAuthor}</div>` : ""}
            </div>
          </div>
        </div>`;

    case "whisper":
      return `
        <div style="padding:1rem 1.5rem;text-align:center;">
          <blockquote style="font-size:0.875rem;font-style:italic;line-height:1.75;color:var(--color-text);opacity:0.45;">${safeText}</blockquote>
          ${safeAuthor ? `<div style="margin-top:0.5rem;font-size:0.75rem;color:var(--color-text);opacity:0.3;">— ${safeAuthor}</div>` : ""}
        </div>`;

    default:
      return `
        <div style="border-left:4px solid #8b5cf6;padding:1rem 1.25rem;">
          <blockquote style="font-style:italic;color:var(--color-text);">${safeText}</blockquote>
          ${authorHTML}
        </div>`;
  }
}
