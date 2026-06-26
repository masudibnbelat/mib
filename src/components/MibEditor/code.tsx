// components/MibEditor/code.tsx
"use client";

import { useEffect, useCallback, useState } from "react";
import { Code, Code2, Copy, Check } from "lucide-react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND } from "lexical";
import { $setBlocksType } from "@lexical/selection";
import {
  $createCodeNode,
  $isCodeNode,
  CodeNode,
  registerCodeHighlighting,
} from "@lexical/code";

/* ─── Config / Theme addition ─── */
export const codeTheme = {
  code: "mib-code-block block relative bg-(--color-active-bg) text-(--color-text) border border-(--color-active-border) rounded-lg pt-12 pb-4 px-4 font-mono text-sm leading-relaxed my-4 whitespace-pre-wrap break-words overflow-hidden",
  codeHighlight: {
    atrule: "text-purple-400",
    attr: "text-blue-400",
    boolean: "text-orange-400",
    builtin: "text-green-400",
    cdata: "text-(--color-gray)",
    char: "text-green-300",
    class: "text-blue-300",
    "class-name": "text-blue-300",
    comment: "text-(--color-gray) italic",
    constant: "text-orange-400",
    deleted: "text-red-400",
    doctype: "text-(--color-gray)",
    entity: "text-yellow-400",
    function: "text-blue-400",
    important: "text-orange-400 font-bold",
    inserted: "text-green-400",
    keyword: "text-purple-400",
    namespace: "text-purple-300",
    number: "text-orange-400",
    operator: "text-yellow-400",
    prolog: "text-(--color-gray)",
    property: "text-orange-400",
    punctuation: "text-(--color-gray)",
    regex: "text-orange-400",
    selector: "text-green-400",
    string: "text-green-300",
    symbol: "text-orange-400",
    tag: "text-orange-400",
    url: "text-yellow-400",
    variable: "text-orange-300",
  },
};

/* ─── Helper ─── */
export function $isInCodeBlock(): boolean {
  const sel = $getSelection();
  if (!$isRangeSelection(sel)) return false;
  const el = sel.anchor.getNode().getTopLevelElementOrThrow();
  return $isCodeNode(el);
}

/* ─── Plugin: Code Highlighting ─── */
export function CodeHighlightPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => registerCodeHighlighting(editor), [editor]);
  return null;
}

/* ─── Plugin: Code Block Header Overlay ─── */
function CodeHeaderOverlay({ dom }: { dom: HTMLElement }) {
  const [isCopied, setIsCopied] = useState(false);
  const [rect, setRect] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const update = () =>
      setRect({
        top: dom.offsetTop,
        left: dom.offsetLeft,
        width: dom.offsetWidth,
      });
    update();
    const obs = new ResizeObserver(update);
    obs.observe(dom);
    return () => obs.disconnect();
  }, [dom]);

  if (!rect.width) return null;

  return (
    <div
      className="absolute z-10 flex items-center justify-between px-4 py-2 bg-(--color-active-bg) border-b border-(--color-active-border) rounded-t-lg select-none"
      style={{ top: rect.top, left: rect.left, width: rect.width }}
    >
      <span className="text-[11px] text-(--color-gray) font-sans font-semibold uppercase tracking-widest">
        Code
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          navigator.clipboard.writeText(dom.textContent || "");
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        }}
        className="flex items-center gap-1.5 text-xs font-medium text-(--color-gray) hover:text-(--color-text) transition-colors cursor-pointer outline-none"
      >
        {isCopied ? (
          <Check className="w-3.5 h-3.5 text-green-400" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
        {isCopied ? (
          <span className="text-green-400">Copied!</span>
        ) : (
          "Copy code"
        )}
      </button>
    </div>
  );
}

export function CodeActionOverlays() {
  const [editor] = useLexicalComposerContext();
  const [codeNodes, setCodeNodes] = useState<Record<string, HTMLElement>>({});

  useEffect(() => {
    return editor.registerMutationListener(CodeNode, (mutations) => {
      editor.getEditorState().read(() => {
        setCodeNodes((prev) => {
          const next = { ...prev };
          let changed = false;
          for (const [key, mutation] of mutations) {
            if (mutation === "created" || mutation === "updated") {
              const dom = editor.getElementByKey(key);
              if (dom && next[key] !== dom) {
                next[key] = dom;
                changed = true;
              }
            } else if (mutation === "destroyed") {
              if (next[key]) {
                delete next[key];
                changed = true;
              }
            }
          }
          return changed ? next : prev;
        });
      });
    });
  }, [editor]);

  return (
    <>
      {Object.entries(codeNodes).map(([key, dom]) => (
        <CodeHeaderOverlay key={key} dom={dom} />
      ))}
    </>
  );
}

/* ─── Hook ─── */
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
        if (isCurrentlyCode) {
          // In a code block → convert to paragraph is not trivial, use a workaround
          // For now we set to paragraph via $setBlocksType
          const { $createParagraphNode } = require("lexical");
          $setBlocksType(sel, () => $createParagraphNode());
        } else {
          $setBlocksType(sel, () => $createCodeNode());
        }
      });
    },
    [editor],
  );

  return { toggleInlineCode, toggleCodeBlock };
}

/* ─── Toolbar Buttons ─── */
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
        title="Inline Code"
      >
        <Code className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        active={isCodeBlock}
        onClick={() => toggleCodeBlock(isCodeBlock)}
        title="Code Block"
      >
        <Code2 className="w-4 h-4" />
      </ToolbarButton>
    </>
  );
}
