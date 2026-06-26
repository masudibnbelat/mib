// components/MibEditor/code.tsx
"use client";

import { useEffect, useState, useRef, useCallback, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import { Code, Code2, Copy, Check, ChevronDown, Search } from "lucide-react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $getNodeByKey,
  FORMAT_TEXT_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_TAB_COMMAND,
  KEY_ARROW_DOWN_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  type LexicalEditor,
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import {
  $createCodeNode,
  $isCodeNode,
  CodeNode,
  registerCodeHighlighting,
  getLanguageFriendlyName,
  getDefaultCodeLanguage,
  CODE_LANGUAGE_FRIENDLY_NAME_MAP,
} from "@lexical/code";
import { mergeRegister } from "@lexical/utils";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   LANGUAGE META
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const LANG_META: Record<string, { icon: string; color: string }> = {
  javascript: { icon: "JS", color: "#f7df1e" },
  js: { icon: "JS", color: "#f7df1e" },
  typescript: { icon: "TS", color: "#3178c6" },
  ts: { icon: "TS", color: "#3178c6" },
  python: { icon: "PY", color: "#3572A5" },
  py: { icon: "PY", color: "#3572A5" },
  java: { icon: "JV", color: "#b07219" },
  csharp: { icon: "C#", color: "#178600" },
  cs: { icon: "C#", color: "#178600" },
  cpp: { icon: "++", color: "#f34b7d" },
  c: { icon: "C", color: "#555555" },
  go: { icon: "GO", color: "#00ADD8" },
  rust: { icon: "RS", color: "#dea584" },
  rs: { icon: "RS", color: "#dea584" },
  ruby: { icon: "RB", color: "#701516" },
  rb: { icon: "RB", color: "#701516" },
  php: { icon: "PH", color: "#4F5D95" },
  swift: { icon: "SW", color: "#F05138" },
  kotlin: { icon: "KT", color: "#A97BFF" },
  html: { icon: "HT", color: "#e34c26" },
  markup: { icon: "HT", color: "#e34c26" },
  css: { icon: "CS", color: "#563d7c" },
  sql: { icon: "SQ", color: "#e38c00" },
  bash: { icon: "SH", color: "#89e051" },
  shell: { icon: "SH", color: "#89e051" },
  json: { icon: "{}", color: "#6bac4e" },
  xml: { icon: "XM", color: "#0060ac" },
  yaml: { icon: "YA", color: "#cb171e" },
  markdown: { icon: "MD", color: "#083fa1" },
  md: { icon: "MD", color: "#083fa1" },
  jsx: { icon: "JX", color: "#61dafb" },
  tsx: { icon: "TX", color: "#3178c6" },
  plain: { icon: "TX", color: "#8b949e" },
};

function getLangMeta(lang: string) {
  return (
    LANG_META[lang.toLowerCase()] || {
      icon: lang.slice(0, 2).toUpperCase() || "TX",
      color: "#8b949e",
    }
  );
}

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   THEME
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export const codeTheme = {
  code: [
    "mib-code-block",
    "block relative",
    "bg-(--color-active-bg)",
    "text-(--color-text)",
    "border border-(--color-active-border)",
    "rounded-xl",
    "font-mono text-[13px]/[1.7]",
    "my-5",
    // ✅ Tight padding — no excess top space, left space reserved for line numbers
    "!pt-2 !pb-2 !pl-[3.5rem] !pr-5",
    "whitespace-pre",
    "overflow-x-auto",
    "selection:bg-violet-500/30",
    "focus-within:border-violet-500/60",
    "transition-[border-color] duration-200",
  ].join(" "),
  codeHighlight: {
    atrule: "text-[#c678dd]",
    attr: "text-[#56b6c2]",
    boolean: "text-[#d19a66]",
    builtin: "text-[#e5c07b]",
    cdata: "text-[#7f848e] italic",
    char: "text-[#98c379]",
    class: "text-[#e5c07b]",
    "class-name": "text-[#e5c07b]",
    comment: "text-[#7f848e] italic",
    constant: "text-[#d19a66]",
    deleted: "text-[#e06c75]",
    doctype: "text-[#7f848e]",
    entity: "text-[#56b6c2]",
    function: "text-[#61afef]",
    important: "text-[#e06c75] font-bold",
    inserted: "text-[#98c379]",
    keyword: "text-[#c678dd]",
    namespace: "text-[#c678dd]/80",
    number: "text-[#d19a66]",
    operator: "text-[#56b6c2]",
    prolog: "text-[#7f848e]",
    property: "text-[#d19a66]",
    punctuation: "text-[#abb2bf]",
    regex: "text-[#98c379]",
    selector: "text-[#98c379]",
    string: "text-[#98c379]",
    symbol: "text-[#d19a66]",
    tag: "text-[#e06c75]",
    url: "text-[#56b6c2] underline decoration-[#56b6c2]/30",
    variable: "text-[#e06c75]",
  },
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HELPERS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function $isInCodeBlock(): boolean {
  const sel = $getSelection();
  if (!$isRangeSelection(sel)) return false;
  const topLevel = sel.anchor.getNode().getTopLevelElementOrThrow();
  return $isCodeNode(topLevel);
}

export function $getCodeLanguageFromSelection(): string | null {
  const sel = $getSelection();
  if (!$isRangeSelection(sel)) return null;
  const topLevel = sel.anchor.getNode().getTopLevelElementOrThrow();
  return $isCodeNode(topLevel)
    ? topLevel.getLanguage() || getDefaultCodeLanguage()
    : null;
}

function isDomCaretAtEnd(el: HTMLElement): boolean {
  const sel = window.getSelection();
  if (!sel || !sel.isCollapsed || sel.rangeCount === 0) return false;
  const current = sel.getRangeAt(0).cloneRange();
  const end = document.createRange();
  end.selectNodeContents(el);
  end.collapse(false);
  return current.compareBoundaryPoints(Range.START_TO_START, end) === 0;
}

function $moveSelectionAfterCodeBlock(codeNodeKey: string) {
  const node = $getNodeByKey(codeNodeKey);
  if (!node || !$isCodeNode(node)) return;
  const next = node.getNextSibling();
  if (next && next.getType() !== "code") {
    (next as { selectStart: () => void }).selectStart();
    return;
  }
  const paragraph = $createParagraphNode();
  node.insertAfter(paragraph);
  paragraph.selectStart();
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PLUGINS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function CodeHighlightPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => registerCodeHighlighting(editor), [editor]);
  return null;
}

export function CodeTabIndentPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerCommand(
      KEY_TAB_COMMAND,
      (event) => {
        const sel = $getSelection();
        if (!$isRangeSelection(sel)) return false;
        const topLevel = sel.anchor.getNode().getTopLevelElementOrThrow();
        if (!$isCodeNode(topLevel)) return false;
        event.preventDefault();
        editor.dispatchCommand(
          event.shiftKey ? OUTDENT_CONTENT_COMMAND : INDENT_CONTENT_COMMAND,
          undefined,
        );
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);
  return null;
}

export function CodeExitPlugin() {
  const [editor] = useLexicalComposerContext();
  const exitRef = useRef<{ key: string; ts: number } | null>(null);

  useEffect(() => {
    return editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      (event) => {
        if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) {
          exitRef.current = null;
          return false;
        }
        const sel = $getSelection();
        if (!$isRangeSelection(sel) || !sel.isCollapsed()) {
          exitRef.current = null;
          return false;
        }
        const topLevel = sel.anchor.getNode().getTopLevelElementOrThrow();
        if (!$isCodeNode(topLevel)) {
          exitRef.current = null;
          return false;
        }
        const dom = editor.getElementByKey(topLevel.getKey());
        if (!dom || !isDomCaretAtEnd(dom)) {
          exitRef.current = null;
          return false;
        }
        const now = performance.now();
        const doublePress =
          exitRef.current?.key === topLevel.getKey() &&
          now - exitRef.current.ts < 700;
        if (!doublePress) {
          exitRef.current = { key: topLevel.getKey(), ts: now };
          return false;
        }
        exitRef.current = null;
        event.preventDefault();
        editor.update(() => {
          $moveSelectionAfterCodeBlock(topLevel.getKey());
        });
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);
  return null;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   LANGUAGE DROPDOWN
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export const LanguageDropdown = memo(function LanguageDropdown({
  language,
  onSelect,
}: {
  language: string;
  onSelect: (lang: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const languages = useMemo(
    () =>
      Object.entries(CODE_LANGUAGE_FRIENDLY_NAME_MAP).map(([id, name]) => ({
        id,
        name,
      })),
    [],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return languages;
    const q = search.toLowerCase();
    return languages.filter(
      (l) => l.id.toLowerCase().includes(q) || l.name.toLowerCase().includes(q),
    );
  }, [languages, search]);

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 6, left: rect.left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !menuRef.current?.contains(t)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", onDown, true);
    return () => document.removeEventListener("mousedown", onDown, true);
  }, [open]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const meta = getLangMeta(language);
  const friendlyName =
    CODE_LANGUAGE_FRIENDLY_NAME_MAP[language] ||
    getLanguageFriendlyName(language);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "flex items-center gap-2 px-2.5 py-1.5 rounded-md",
          "text-xs font-medium",
          "transition-colors duration-150 cursor-pointer outline-none",
          open
            ? "bg-(--color-active-bg) text-(--color-text)"
            : "text-(--color-gray) hover:text-(--color-text) hover:bg-(--color-active-bg)",
        )}
      >
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-bold"
          style={{ backgroundColor: meta.color + "33", color: meta.color }}
        >
          {meta.icon}
        </span>
        <span className="max-w-24 truncate">{friendlyName}</span>
        <ChevronDown
          className={cn(
            "w-3 h-3 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: menuPos.top,
              left: menuPos.left,
              zIndex: 999999,
            }}
            className={cn(
              "w-60 max-h-72",
              "bg-(--color-bg) border border-(--color-active-border)",
              "rounded-xl shadow-2xl shadow-black/40",
              "flex flex-col overflow-hidden",
            )}
          >
            <div className="p-2 border-b border-(--color-active-border)">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-(--color-gray)" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter languages..."
                  className={cn(
                    "w-full pl-8 pr-3 py-2 rounded-md",
                    "bg-(--color-active-bg) border border-(--color-active-border)",
                    "text-xs text-(--color-text)",
                    "placeholder:text-(--color-gray)",
                    "outline-none focus:border-violet-500/40",
                  )}
                />
              </div>
            </div>

            <div className="overflow-y-auto overscroll-contain py-1 flex-1">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-xs text-(--color-gray) text-center">
                  No languages
                </div>
              ) : (
                filtered.map(({ id, name }) => {
                  const isActive = id === language;
                  const m = getLangMeta(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onSelect(id);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2",
                        "text-xs text-left cursor-pointer outline-none",
                        isActive
                          ? "bg-violet-500/15 text-violet-400"
                          : "text-(--color-text) hover:bg-(--color-active-bg)",
                      )}
                    >
                      <span
                        className="inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-bold shrink-0"
                        style={{
                          backgroundColor: m.color + "22",
                          color: isActive ? "#a78bfa" : m.color,
                        }}
                      >
                        {m.icon}
                      </span>
                      <span className="flex-1 truncate">{name}</span>
                      {isActive && (
                        <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
});

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   LINE NUMBERS OVERLAY
   Renders line numbers in a gutter positioned over the left side of the code block
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function CodeLineNumbers({ codeDom }: { codeDom: HTMLElement }) {
  const [lineCount, setLineCount] = useState(1);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    height: number;
    paddingTop: number;
    visible: boolean;
  }>({ top: 0, left: 0, height: 0, paddingTop: 0, visible: false });

  // ✅ Count lines correctly for Lexical code blocks
  useEffect(() => {
    const countLines = () => {
      // Lexical inserts <br> between code lines.
      // Total lines = number of <br> elements + 1
      // But we also need to handle the case where text has \n (from paste)
      const brCount = codeDom.querySelectorAll(":scope > br").length;
      const text = codeDom.textContent || "";
      const nlCount = (text.match(/\n/g) || []).length;

      const count = Math.max(brCount + 1, nlCount + 1, 1);
      setLineCount(count);
    };

    countLines();

    const mo = new MutationObserver(countLines);
    mo.observe(codeDom, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => mo.disconnect();
  }, [codeDom]);

  // ✅ Track position with proper padding awareness
  useEffect(() => {
    let rafId: number | null = null;

    const update = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const rect = codeDom.getBoundingClientRect();
        const style = window.getComputedStyle(codeDom);
        const paddingTop = parseFloat(style.paddingTop) || 0;
        const paddingBottom = parseFloat(style.paddingBottom) || 0;
        const visible =
          rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 0;

        setPosition({
          top: rect.top,
          left: rect.left,
          height: rect.height - paddingBottom,
          paddingTop,
          visible,
        });
      });
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(codeDom);
    ro.observe(document.body);

    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [codeDom]);

  if (!position.visible) return null;

  return createPortal(
    <div
      aria-hidden="true"
      contentEditable={false}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        height: position.height,
        width: "2.75rem", // ✅ 44px gutter width
        paddingTop: position.paddingTop, // ✅ match code's top padding
        zIndex: 99997,
        pointerEvents: "none",
        userSelect: "none",
      }}
      className="font-mono text-[13px]/[1.7] text-(--color-gray)/40 text-right pr-3 overflow-hidden"
    >
      {Array.from({ length: lineCount }, (_, i) => (
        <div key={i} className="leading-[1.7]">
          {i + 1}
        </div>
      ))}
    </div>,
    document.body,
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   FLOATING COPY BUTTON
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function CodeCopyButton({ codeDom }: { codeDom: HTMLElement }) {
  const [copied, setCopied] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    right: number;
    visible: boolean;
  }>({ top: 0, right: 0, visible: false });
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let rafId: number | null = null;
    const update = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const rect = codeDom.getBoundingClientRect();
        const visible =
          rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 0;
        setPosition({
          top: rect.top + 8,
          right: window.innerWidth - rect.right + 8,
          visible,
        });
      });
    };
    update();

    const ro = new ResizeObserver(update);
    ro.observe(codeDom);
    ro.observe(document.body);

    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [codeDom]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // ✅ Extract text preserving line breaks (Lexical uses <br> for newlines)
      const extractCodeText = (root: HTMLElement): string => {
        let result = "";
        const walk = (node: Node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            // Preserve all whitespace (spaces, tabs) exactly as-is
            result += node.textContent || "";
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const tag = el.tagName.toLowerCase();
            if (tag === "br") {
              result += "\n";
            } else {
              // Recurse into children (spans from syntax highlighting, etc.)
              for (const child of Array.from(el.childNodes)) {
                walk(child);
              }
            }
          }
        };
        for (const child of Array.from(root.childNodes)) {
          walk(child);
        }
        return result;
      };

      const text = extractCodeText(codeDom);

      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
        copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
      } catch {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand("copy");
          setCopied(true);
          if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
          copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
        } catch (e2) {
          console.error("Copy failed:", e2);
        }
        document.body.removeChild(textarea);
      }
    },
    [codeDom],
  );

  if (!position.visible) return null;

  return createPortal(
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={handleCopy}
      title="Copy code"
      contentEditable={false}
      style={{
        position: "fixed",
        top: position.top,
        right: position.right,
        zIndex: 99998,
      }}
      className={cn(
        "inline-flex items-center gap-1.5",
        "px-2.5 py-1.5 rounded-md",
        "text-[11px] font-medium",
        "bg-(--color-bg)/90 backdrop-blur-md",
        "border border-(--color-active-border)",
        "shadow-md shadow-black/20",
        "transition-all duration-200",
        "cursor-pointer outline-none select-none",
        "pointer-events-auto",
        copied
          ? "text-emerald-400 border-emerald-500/30"
          : "text-(--color-gray) hover:text-(--color-text) hover:bg-(--color-active-bg)",
      )}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span>Copy</span>
        </>
      )}
    </button>,
    document.body,
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PLUGIN: Tracks all code blocks & renders overlays
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function CodeActionMenuPlugin() {
  const [editor] = useLexicalComposerContext();
  const [codeBlocks, setCodeBlocks] = useState<Map<string, HTMLElement>>(
    new Map(),
  );

  useEffect(() => {
    return mergeRegister(
      editor.registerMutationListener(
        CodeNode,
        (mutations) => {
          setCodeBlocks((prev) => {
            const next = new Map(prev);
            let dirty = false;
            for (const [key, type] of mutations) {
              if (type === "destroyed") {
                if (next.has(key)) {
                  next.delete(key);
                  dirty = true;
                }
              } else {
                const dom = editor.getElementByKey(key);
                if (dom && next.get(key) !== dom) {
                  next.set(key, dom as HTMLElement);
                  dirty = true;
                }
              }
            }
            return dirty ? next : prev;
          });
        },
        { skipInitialization: false },
      ),
    );
  }, [editor]);

  return (
    <>
      {Array.from(codeBlocks.entries()).map(([key, dom]) => (
        <span key={key}>
          <CodeLineNumbers codeDom={dom} />
          <CodeCopyButton codeDom={dom} />
        </span>
      ))}
    </>
  );
}

export const CodeActionOverlays = CodeActionMenuPlugin;

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HOOK: useCodeActions
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function useCodeActions() {
  const [editor] = useLexicalComposerContext();

  const toggleInlineCode = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
  }, [editor]);

  const toggleCodeBlock = useCallback(
    (isCurrentlyCode: boolean) => {
      editor.update(() => {
        const sel = $getSelection();
        if (!$isRangeSelection(sel)) return;
        $setBlocksType(sel, () =>
          isCurrentlyCode ? $createParagraphNode() : $createCodeNode(),
        );
        if (!isCurrentlyCode) {
          const nextSel = $getSelection();
          if (!$isRangeSelection(nextSel)) return;
          const topLevel = nextSel.anchor.getNode().getTopLevelElementOrThrow();
          if ($isCodeNode(topLevel) && !topLevel.getNextSibling()) {
            topLevel.insertAfter($createParagraphNode());
          }
        }
      });
    },
    [editor],
  );

  const setCodeLanguage = useCallback(
    (language: string) => {
      editor.update(() => {
        const sel = $getSelection();
        if (!$isRangeSelection(sel)) return;
        const topLevel = sel.anchor.getNode().getTopLevelElementOrThrow();
        if ($isCodeNode(topLevel)) {
          topLevel.setLanguage(language);
        }
      });
    },
    [editor],
  );

  return { toggleInlineCode, toggleCodeBlock, setCodeLanguage };
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TOOLBAR BUTTONS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function CodeToolbarButtons({
  isInlineCode,
  isCodeBlock,
  ToolbarButton,
}: {
  isInlineCode: boolean;
  isCodeBlock: boolean;
  ToolbarButton: React.ComponentType<{
    active?: boolean;
    onClick: () => void;
    title: string;
    children: React.ReactNode;
  }>;
}) {
  const { toggleInlineCode, toggleCodeBlock } = useCodeActions();

  return (
    <>
      <ToolbarButton
        active={isInlineCode}
        onClick={toggleInlineCode}
        title="Inline Code (⌘E)"
      >
        <Code className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        active={isCodeBlock}
        onClick={() => toggleCodeBlock(isCodeBlock)}
        title="Code Block (⌘⇧C)"
      >
        <Code2 className="w-4 h-4" />
      </ToolbarButton>
    </>
  );
}
