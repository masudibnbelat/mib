"use client";
import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Bold,
  Italic,
  Strikethrough,
  Underline,
  Quote,
  Palette,
  ChevronDown,
  X,
  Code,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Minus,
  TerminalSquare,
} from "lucide-react";

// ─── types ────────────────────────────────────────────────────────────────────
interface MarkdownEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
}

// ─── colors ───────────────────────────────────────────────────────────────────
const COLORS = [
  { label: "লাল", hex: "#f87171", marker: "==r==" },
  { label: "সবুজ", hex: "#4ade80", marker: "==g==" },
  { label: "নীল", hex: "#60a5fa", marker: "==b==" },
  { label: "হলুদ", hex: "#facc15", marker: "==y==" },
  { label: "বেগুনি", hex: "#c084fc", marker: "==p==" },
  { label: "কমলা", hex: "#fb923c", marker: "==o==" },
];

// ─── renderer ─────────────────────────────────────────────────────────────────
function renderInline(raw: string): string {
  if (!raw) return "";

  const lines = raw.split("\n");
  const out: string[] = [];
  let i = 0;
  // track ordered list counter for auto-numbering
  let olCounter = 0;

  while (i < lines.length) {
    const line = lines[i];

    // fenced code block
    if (line.trimStart().startsWith("```")) {
      const lang = line.trimStart().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(escHtml(lines[i]));
        i++;
      }
      out.push(
        `<div class="md-codeblock"><span class="md-codeblock-lang">${escHtml(lang)}</span><pre><code>${codeLines.join("\n") || ""}</code></pre></div>`,
      );
      olCounter = 0;
      i++;
      continue;
    }

    // hr
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      out.push(`<div class="md-hr"><hr /></div>`);
      olCounter = 0;
      i++;
      continue;
    }

    // headings
    const h3 = line.match(/^### (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h1 = line.match(/^# (.+)/);
    if (h1) {
      out.push(`<div class="md-h1">${styleSpans(h1[1])}</div>`);
      olCounter = 0;
      i++;
      continue;
    }
    if (h2) {
      out.push(`<div class="md-h2">${styleSpans(h2[1])}</div>`);
      olCounter = 0;
      i++;
      continue;
    }
    if (h3) {
      out.push(`<div class="md-h3">${styleSpans(h3[1])}</div>`);
      olCounter = 0;
      i++;
      continue;
    }

    // unordered list
    const ul = line.match(/^[-*] (.+)/);
    if (ul) {
      out.push(
        `<div class="md-ul"><span class="md-bullet">•</span><span class="md-li-text"> ${styleSpans(ul[1])}</span></div>`,
      );
      olCounter = 0;
      i++;
      continue;
    }

    // ordered list — auto-increment counter, ignore what the user typed
    const ol = line.match(/^(\d+)\. (.+)/);
    if (ol) {
      olCounter++;
      out.push(
        `<div class="md-ol"><span class="md-num">${olCounter}.</span><span class="md-li-text"> ${styleSpans(ol[2])}</span></div>`,
      );
      i++;
      continue;
    }

    // reset ol counter on non-list lines
    olCounter = 0;

    // blockquote
    if (line.startsWith("> ")) {
      const inner = styleSpans(line.slice(2));
      out.push(`<div class="md-quote">${inner || "<br>"}</div>`);
      i++;
      continue;
    }

    // normal line
    const styled = styleSpans(line);
    out.push(`<div class="md-line">${styled || "<br>"}</div>`);
    i++;
  }

  return out.join("");
}

function escHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function styleSpans(line: string): string {
  let s = escHtml(line);
  // inline code (before bold/italic to avoid * inside ` `)
  s = s.replace(/`(.+?)`/g, '<code class="md-code">$1</code>');
  // bold
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // italic
  s = s.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // strikethrough
  s = s.replace(/~~(.+?)~~/g, "<s>$1</s>");
  // underline
  s = s.replace(/__(.+?)__/g, "<u>$1</u>");
  // colors (before generic highlight so ==r== isn't consumed)
  s = s.replace(/==r==(.+?)==r==/g, '<span class="clr-r">$1</span>');
  s = s.replace(/==g==(.+?)==g==/g, '<span class="clr-g">$1</span>');
  s = s.replace(/==b==(.+?)==b==/g, '<span class="clr-b">$1</span>');
  s = s.replace(/==y==(.+?)==y==/g, '<span class="clr-y">$1</span>');
  s = s.replace(/==p==(.+?)==p==/g, '<span class="clr-p">$1</span>');
  s = s.replace(/==o==(.+?)==o==/g, '<span class="clr-o">$1</span>');
  // generic highlight (after color markers)
  s = s.replace(/==(.+?)==/g, '<mark class="md-mark">$1</mark>');
  return s;
}

// ─── shared line-height constant (used in both CSS & JS calculations) ─────────
// We pick a concrete px value so textarea and mirror stay pixel-perfect in sync.
const LINE_HEIGHT_PX = 24; // 1.5 × 16px base = 24px

// ─── styles ───────────────────────────────────────────────────────────────────
// All text inside .md-editor-root MUST use the same font-size (16px) and
// line-height (LINE_HEIGHT_PX). The textarea and the mirror share identical
// typography so scroll positions map 1-to-1.
const EDITOR_STYLES = `
  .md-editor-root { font-size:16px; line-height:${LINE_HEIGHT_PX}px; }
  .md-editor-root .md-line  { min-height:${LINE_HEIGHT_PX}px; }
  .md-editor-root .md-h1    { font-size:1.6rem; font-weight:700; color:var(--color-text); line-height:1.25; padding:2px 0; }
  .md-editor-root .md-h2    { font-size:1.25rem; font-weight:700; color:var(--color-text); line-height:1.3; padding:2px 0; }
  .md-editor-root .md-h3    { font-size:1.05rem; font-weight:600; color:#a78bfa; line-height:1.3; padding:2px 0; }
  .md-editor-root .md-quote {
    border-left:3px solid #7c3aed; padding-left:0.7rem;
    color:#a1a1aa; font-style:italic; min-height:${LINE_HEIGHT_PX}px;
  }
  .md-editor-root .md-ul  { display:flex; align-items:baseline; min-height:${LINE_HEIGHT_PX}px; }
  .md-editor-root .md-ol  { display:flex; align-items:baseline; min-height:${LINE_HEIGHT_PX}px; }
  .md-editor-root .md-bullet { color:#a78bfa; flex-shrink:0; }
  .md-editor-root .md-num    { color:#a78bfa; flex-shrink:0; font-weight:600; font-variant-numeric:tabular-nums; min-width:1.6em; }
  .md-editor-root .md-li-text { flex:1; }
  .md-editor-root .md-code {
    font-family:ui-monospace,monospace; font-size:0.82em;
    background:rgba(124,58,237,0.13); color:#c084fc;
    border:1px solid rgba(124,58,237,0.25);
    border-radius:4px; padding:0.05em 0.35em;
  }
  .md-editor-root .md-codeblock {
    background:rgba(0,0,0,0.35); border:1px solid rgba(124,58,237,0.2);
    border-radius:10px; padding:0.6rem 0.9rem; margin:2px 0;
    position:relative;
  }
  .md-editor-root .md-codeblock pre {
    font-family:ui-monospace,monospace; font-size:0.82em;
    color:#e2e8f0; white-space:pre-wrap; margin:0; padding:0;
  }
  .md-editor-root .md-codeblock code { font-family:inherit; }
  .md-editor-root .md-codeblock-lang {
    position:absolute; top:0.35rem; right:0.6rem;
    font-size:0.65rem; font-family:ui-monospace,monospace;
    color:#7c3aed; text-transform:uppercase; letter-spacing:0.08em;
  }
  .md-editor-root .md-mark {
    background:rgba(250,204,21,0.25); color:#facc15;
    border-radius:3px; padding:0 0.2em;
  }
  .md-editor-root .md-hr   { padding:4px 0; }
  .md-editor-root .md-hr hr{ border:none; border-top:1px solid rgba(124,58,237,0.35); margin:0; }
  .md-editor-root strong   { font-weight:700; }
  .md-editor-root em       { font-style:italic; }
  .md-editor-root s        { text-decoration:line-through; opacity:0.6; }
  .md-editor-root u        { text-decoration:underline; }
  .md-editor-root .clr-r   { color:#f87171; }
  .md-editor-root .clr-g   { color:#4ade80; }
  .md-editor-root .clr-b   { color:#60a5fa; }
  .md-editor-root .clr-y   { color:#facc15; }
  .md-editor-root .clr-p   { color:#c084fc; }
  .md-editor-root .clr-o   { color:#fb923c; }
`;

// ─── collapsed preview ────────────────────────────────────────────────────────
function CollapsedPreview({
  value,
  placeholder,
  rows,
  disabled,
  onOpen,
}: {
  value: string;
  placeholder: string;
  rows: number;
  disabled: boolean;
  onOpen: () => void;
}) {
  const html = useMemo(
    () =>
      value
        ? renderInline(value)
        : `<span style="color:var(--color-gray);opacity:0.45">${placeholder}</span>`,
    [value, placeholder],
  );

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onOpen}
      onKeyDown={(e) => e.key === "Enter" && !disabled && onOpen()}
      className={[
        "md-editor-root group relative w-full rounded-xl cursor-text",
        "border border-(--color-active-border) bg-(--color-active-bg)",
        "transition-all duration-200",
        "hover:border-violet-500/50 hover:ring-1 hover:ring-violet-500/20",
        "focus:outline-none focus:ring-2 focus:ring-violet-500/40",
        disabled ? "opacity-50 cursor-not-allowed" : "",
      ].join(" ")}
      style={{ minHeight: `${rows * LINE_HEIGHT_PX + 20}px` }}
    >
      <div
        className="px-3 py-2.5 select-none overflow-hidden bangla"
        style={{ minHeight: `${rows * LINE_HEIGHT_PX + 20}px` }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <style>{EDITOR_STYLES}</style>
    </div>
  );
}

// ─── toolbar group divider ────────────────────────────────────────────────────
function Divider() {
  return (
    <div className="w-px h-4 bg-(--color-active-border) mx-0.5 shrink-0" />
  );
}

// ─── toolbar button ───────────────────────────────────────────────────────────
function ToolBtn({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.84 }}
      disabled={disabled}
      title={label}
      onClick={onClick}
      className={[
        "p-1.5 rounded-lg transition-colors shrink-0",
        "text-(--color-gray) hover:text-violet-400 hover:bg-violet-500/10",
        disabled ? "opacity-40 pointer-events-none" : "",
      ].join(" ")}
    >
      <Icon className="w-3.5 h-3.5" />
    </motion.button>
  );
}

// ─── fullscreen editor ────────────────────────────────────────────────────────
function FullscreenEditor({
  value,
  onChange,
  placeholder,
  disabled,
  onClose,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled: boolean;
  onClose: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const [colorOpen, setColorOpen] = useState(false);

  // ── lock body scroll ────────────────────────────────────────────────────────
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ── focus textarea on open ──────────────────────────────────────────────────
  useEffect(() => {
    const id = setTimeout(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }, 80);
    return () => clearTimeout(id);
  }, []);

  // ── ESC to close ────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // ── sync mirror HTML whenever value changes ─────────────────────────────────
  // useLayoutEffect (not useEffect) avoids a frame where the mirror shows stale
  // content while the textarea already reflects the new value.
  useLayoutEffect(() => {
    const el = mirrorRef.current;
    if (!el) return;
    el.innerHTML = value
      ? renderInline(value)
      : `<div class="md-placeholder">${placeholder}</div>`;
  }, [value, placeholder]);

  // ── scroll sync ─────────────────────────────────────────────────────────────
  const syncScroll = useCallback(() => {
    const ta = textareaRef.current;
    const mr = mirrorRef.current;
    if (!ta || !mr) return;
    mr.scrollTop = ta.scrollTop;
  }, []);

  // ── editing helpers ─────────────────────────────────────────────────────────
  const wrap = useCallback(
    (before: string, after: string, fallback = "") => {
      const el = textareaRef.current;
      if (!el) return;
      const s = el.selectionStart;
      const e = el.selectionEnd;
      const sel = value.slice(s, e) || fallback;
      const next = value.slice(0, s) + before + sel + after + value.slice(e);
      onChange(next);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(s + before.length, s + before.length + sel.length);
      }, 0);
    },
    [value, onChange],
  );

  const prefixLine = useCallback(
    (prefix: string) => {
      const el = textareaRef.current;
      if (!el) return;
      const s = el.selectionStart;
      const ls = value.lastIndexOf("\n", s - 1) + 1;
      const already = value.slice(ls).startsWith(prefix);
      onChange(
        already
          ? value.slice(0, ls) + value.slice(ls + prefix.length)
          : value.slice(0, ls) + prefix + value.slice(ls),
      );
      setTimeout(() => {
        el.focus();
        const off = already ? -prefix.length : prefix.length;
        el.setSelectionRange(s + off, s + off);
      }, 0);
    },
    [value, onChange],
  );

  const insertBlock = useCallback(
    (text: string) => {
      const el = textareaRef.current;
      if (!el) return;
      const s = el.selectionStart;
      const before = value.slice(0, s);
      const after = value.slice(s);
      const prefix = before.length && !before.endsWith("\n") ? "\n" : "";
      const suffix = after.length && !after.startsWith("\n") ? "\n" : "";
      const insert = prefix + text + suffix;
      onChange(before + insert + after);
      setTimeout(() => {
        el.focus();
        const pos = s + insert.length;
        el.setSelectionRange(pos, pos);
      }, 0);
    },
    [value, onChange],
  );

  const applyColor = (marker: string) => {
    wrap(marker, marker, "রঙিন লেখা");
    setColorOpen(false);
  };

  // ── cheatsheet rows ─────────────────────────────────────────────────────────
  const cheat = [
    { sym: "# H1", desc: "heading 1" },
    { sym: "## H2", desc: "heading 2" },
    { sym: "### H3", desc: "heading 3" },
    { sym: "**bold**", desc: "bold" },
    { sym: "*italic*", desc: "italic" },
    { sym: "~~text~~", desc: "strike" },
    { sym: "__text__", desc: "underline" },
    { sym: "==text==", desc: "highlight" },
    { sym: "> quote", desc: "quote" },
    { sym: "- item", desc: "bullet" },
    { sym: "1. item", desc: "ordered" },
    { sym: "`code`", desc: "code" },
    { sym: "```", desc: "code block" },
    { sym: "---", desc: "divider" },
    { sym: "==r==t==r==", desc: "color" },
  ];

  return createPortal(
    <>
      <style>{`
        ${EDITOR_STYLES}

        /* ── shared typography for textarea + mirror ── */
        .md-fs-ta,
        .md-fs-mirror {
          font-size: 16px !important;
          line-height: ${LINE_HEIGHT_PX}px !important;
          font-family: inherit;
          padding: 16px 20px;
          white-space: pre-wrap;
          word-break: break-word;
          overflow-wrap: break-word;
          box-sizing: border-box;
        }

        /* ── mirror (rendered HTML) ── */
        .md-fs-mirror {
          pointer-events: none;
          overflow-y: auto;
          overflow-x: hidden;
          position: absolute;
          inset: 0;
          color: var(--color-text, #e2e8f0);
        }
        .md-fs-mirror .md-placeholder {
          color: var(--color-gray, #71717a);
          opacity: 0.4;
        }

        /* ── transparent textarea sits on top of mirror ── */
        .md-fs-ta {
          color: transparent !important;
          caret-color: #a78bfa !important;
          background: transparent !important;
          resize: none;
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          border: none;
          outline: none;
          z-index: 1;
        }
        .md-fs-ta::selection {
          background: rgba(167,139,250,0.22);
        }
        .md-fs-ta:disabled {
          opacity: 0.5;
        }
      `}</style>

      <AnimatePresence>
        <motion.div
          key="bd"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          key="panel"
          initial={{ opacity: 0, scale: 0.97, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 20 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className={[
            "fixed inset-0 z-[9999]",
            "bg-(--color-active-bg) flex flex-col",
            "sm:inset-3 sm:rounded-2xl sm:border sm:border-(--color-active-border) sm:shadow-2xl",
          ].join(" ")}
          onClick={(e) => e.stopPropagation()}
        >
          {/* mobile drag handle */}
          <div className="flex justify-center pt-2.5 pb-0.5 sm:hidden shrink-0">
            <div className="w-9 h-1 rounded-full bg-(--color-gray)/25" />
          </div>

          {/* ── toolbar ── */}
          <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-(--color-active-border) shrink-0 overflow-x-auto scrollbar-none">
            <ToolBtn
              icon={Heading1}
              label="# H1"
              onClick={() => prefixLine("# ")}
              disabled={disabled}
            />
            <ToolBtn
              icon={Heading2}
              label="## H2"
              onClick={() => prefixLine("## ")}
              disabled={disabled}
            />
            <ToolBtn
              icon={Heading3}
              label="### H3"
              onClick={() => prefixLine("### ")}
              disabled={disabled}
            />
            <Divider />
            <ToolBtn
              icon={Bold}
              label="**bold**"
              onClick={() => wrap("**", "**", "bold")}
              disabled={disabled}
            />
            <ToolBtn
              icon={Italic}
              label="*italic*"
              onClick={() => wrap("*", "*", "italic")}
              disabled={disabled}
            />
            <ToolBtn
              icon={Strikethrough}
              label="~~strike~~"
              onClick={() => wrap("~~", "~~", "strikethrough")}
              disabled={disabled}
            />
            <ToolBtn
              icon={Underline}
              label="__underline__"
              onClick={() => wrap("__", "__", "underline")}
              disabled={disabled}
            />
            <ToolBtn
              icon={Highlighter}
              label="==highlight=="
              onClick={() => wrap("==", "==", "highlight")}
              disabled={disabled}
            />
            <Divider />
            <ToolBtn
              icon={Quote}
              label="> quote"
              onClick={() => prefixLine("> ")}
              disabled={disabled}
            />
            <ToolBtn
              icon={List}
              label="- list"
              onClick={() => prefixLine("- ")}
              disabled={disabled}
            />
            <ToolBtn
              icon={ListOrdered}
              label="1. list"
              onClick={() => prefixLine("1. ")}
              disabled={disabled}
            />
            <Divider />
            <ToolBtn
              icon={Code}
              label="`inline code`"
              onClick={() => wrap("`", "`", "code")}
              disabled={disabled}
            />
            <ToolBtn
              icon={TerminalSquare}
              label="``` code block"
              onClick={() => insertBlock("```\n\n```")}
              disabled={disabled}
            />
            <ToolBtn
              icon={Minus}
              label="--- divider"
              onClick={() => insertBlock("---")}
              disabled={disabled}
            />
            <Divider />

            {/* color picker */}
            <div className="relative shrink-0">
              <motion.button
                type="button"
                whileTap={{ scale: 0.86 }}
                onClick={() => setColorOpen((p) => !p)}
                className="flex items-center gap-0.5 p-1.5 rounded-lg text-(--color-gray) hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
              >
                <Palette className="w-3.5 h-3.5" />
                <ChevronDown
                  className={`w-2.5 h-2.5 transition-transform duration-150 ${colorOpen ? "rotate-180" : ""}`}
                />
              </motion.button>

              <AnimatePresence>
                {colorOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -4 }}
                    transition={{ duration: 0.13 }}
                    className="absolute top-9 left-0 z-30 flex gap-1.5 p-2 rounded-xl bg-zinc-900/95 border border-zinc-700/60 shadow-2xl backdrop-blur-md"
                  >
                    {COLORS.map((c) => (
                      <motion.button
                        key={c.hex}
                        type="button"
                        whileHover={{ scale: 1.22 }}
                        whileTap={{ scale: 0.9 }}
                        title={c.label}
                        onClick={() => applyColor(c.marker)}
                        className="w-5 h-5 rounded-full border-2 border-transparent hover:border-white/40 transition-all"
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-1" />

            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-1.5 rounded-lg text-(--color-gray) hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>

          {/* ── editor area ── */}
          {/*
            The mirror and textarea are both `position:absolute; inset:0` inside
            a `position:relative` container. They share identical font/line-height
            so rendered text aligns pixel-perfectly behind the transparent caret.
          */}
          <div className="relative flex-1 overflow-hidden md-editor-root bangla">
            <div ref={mirrorRef} className="md-fs-mirror" aria-hidden="true" />
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onScroll={syncScroll}
              disabled={disabled}
              placeholder=""
              spellCheck={false}
              autoComplete="off"
              className="md-fs-ta"
            />
          </div>

          {/* ── cheatsheet footer ── */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-4 py-2 border-t border-(--color-active-border)/40 text-[10px] font-mono text-(--color-gray)/40 shrink-0 overflow-hidden">
            {cheat.map((c) => (
              <span key={c.sym} className="whitespace-nowrap">
                <span className="text-violet-400/55">{c.sym}</span> {c.desc}
              </span>
            ))}
            <div className="flex-1" />
            <span className="hidden sm:inline opacity-50">Esc to close</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </>,
    document.body,
  );
}

// ─── exported component ───────────────────────────────────────────────────────
const MarkdownEditor = ({
  value,
  onChange,
  placeholder = "বিস্তারিত বিবরণ লিখুন...",
  rows = 6,
  disabled = false,
  className = "",
}: MarkdownEditorProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={className}>
      <CollapsedPreview
        value={value}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        onOpen={() => setOpen(true)}
      />
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

export default MarkdownEditor;
