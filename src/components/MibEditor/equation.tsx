// components/MibEditor/equation.tsx
"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import type { ReactElement } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sigma, X } from "lucide-react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $createTextNode,
  DecoratorNode,
  type NodeKey,
  type LexicalNode,
  type EditorConfig,
  type SerializedLexicalNode,
  type Spread,
  type LexicalEditor,
} from "lexical";
import katex from "katex";
import "katex/dist/katex.min.css";

/* ═══════════════════ Types ═══════════════════ */

type SerializedEquationNode = Spread<
  { equation: string; inline: boolean },
  SerializedLexicalNode
>;

/* ═══════════════════ Equation Node ═══════════════════ */

export class EquationNode extends DecoratorNode<ReactElement> {
  __equation: string;
  __inline: boolean;

  static getType(): string {
    return "equation";
  }

  static clone(node: EquationNode): EquationNode {
    return new EquationNode(node.__equation, node.__inline, node.__key);
  }

  constructor(equation: string, inline?: boolean, key?: NodeKey) {
    super(key);
    this.__equation = equation;
    this.__inline = inline ?? false;
  }

  static importJSON(serializedNode: SerializedEquationNode): EquationNode {
    return $createEquationNode(serializedNode.equation, serializedNode.inline);
  }

  exportJSON(): SerializedEquationNode {
    return {
      equation: this.__equation,
      inline: this.__inline,
      type: "equation",
      version: 1,
    };
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const el = document.createElement(this.__inline ? "span" : "div");
    el.className = this.__inline
      ? "inline-equation"
      : "block-equation my-4 text-center";
    return el;
  }

  updateDOM(): false {
    return false;
  }

  getEquation(): string {
    return this.__equation;
  }

  setEquation(equation: string): void {
    const writable = this.getWritable();
    writable.__equation = equation;
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): ReactElement {
    return (
      <EquationRenderer
        equation={this.__equation}
        inline={this.__inline}
        nodeKey={this.__key}
      />
    );
  }
}

export function $createEquationNode(
  equation: string = "",
  inline: boolean = false,
): EquationNode {
  return new EquationNode(equation, inline);
}

export function $isEquationNode(
  node: LexicalNode | null | undefined,
): node is EquationNode {
  return node instanceof EquationNode;
}

/* ═══════════════════ Equation Renderer ═══════════════════ */

function EquationRenderer({
  equation,
  inline,
  nodeKey,
}: {
  equation: string;
  inline: boolean;
  nodeKey: NodeKey;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current || !equation) return;

    try {
      katex.render(equation, ref.current, {
        displayMode: !inline,
        throwOnError: false,
        errorColor: "#ef4444",
      });
    } catch {
      if (ref.current) {
        ref.current.textContent = inline ? `$${equation}$` : `$$${equation}$$`;
        ref.current.style.fontFamily = "monospace";
        ref.current.style.color = "var(--color-text)";
        ref.current.style.backgroundColor = "var(--color-active-bg)";
        ref.current.style.padding = "2px 6px";
        ref.current.style.borderRadius = "4px";
        ref.current.style.fontSize = "0.9em";
      }
    }
  }, [equation, inline]);

  return (
    <span
      ref={ref}
      className={`${
        inline ? "inline align-middle mx-0.5" : "block my-4 text-center"
      } cursor-pointer hover:ring-2 hover:ring-violet-500/30 rounded transition-all`}
      title={`Equation: ${equation}`}
    />
  );
}

/* ═══════════════════ Equation Input Modal ═══════════════════ */

function EquationModal({
  onInsert,
  onClose,
}: {
  onInsert: (eq: string, inline: boolean) => void;
  onClose: () => void;
}) {
  const [equation, setEquation] = useState("");
  const [inline, setInline] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!previewRef.current || !equation.trim()) {
      if (previewRef.current) previewRef.current.textContent = "";
      return;
    }

    try {
      katex.render(equation, previewRef.current, {
        displayMode: !inline,
        throwOnError: false,
        errorColor: "#ef4444",
      });
    } catch {
      if (previewRef.current) {
        previewRef.current.textContent = equation;
        previewRef.current.style.fontFamily = "monospace";
      }
    }
  }, [equation, inline]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-100000 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg mx-4 rounded-2xl border border-(--color-active-border) bg-(--color-bg) shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-(--color-active-border)">
          <div className="flex items-center gap-2">
            <Sigma className="w-5 h-5 text-violet-400" />
            <span className="text-sm font-semibold text-(--color-text)">
              Insert Equation
            </span>
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.9, rotate: 90 }}
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-(--color-active-bg) text-(--color-gray) hover:text-(--color-text) transition-colors"
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Mode toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setInline(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                inline
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "text-(--color-gray) hover:text-(--color-text) border border-(--color-active-border)"
              }`}
            >
              Inline
            </button>
            <button
              type="button"
              onClick={() => setInline(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                !inline
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "text-(--color-gray) hover:text-(--color-text) border border-(--color-active-border)"
              }`}
            >
              Block
            </button>
          </div>

          {/* Input */}
          <div>
            <label className="block text-xs text-(--color-gray) font-medium mb-1.5">
              LaTeX Equation
            </label>
            <textarea
              value={equation}
              onChange={(e) => setEquation(e.target.value)}
              placeholder="e.g. E = mc^2, \frac{a}{b}, \sum_{i=1}^{n} x_i"
              autoFocus
              rows={3}
              className="w-full bg-(--color-active-bg) border border-(--color-active-border) rounded-xl px-4 py-2.5 text-sm text-(--color-text) font-mono placeholder:text-(--color-gray) outline-none focus:border-violet-500/50 transition-colors resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  if (equation.trim()) {
                    onInsert(equation.trim(), inline);
                    onClose();
                  }
                }
              }}
            />
          </div>

          {/* Preview */}
          {equation.trim() && (
            <div>
              <label className="block text-xs text-(--color-gray) font-medium mb-1.5">
                Preview
              </label>
              <div
                ref={previewRef}
                className="min-h-12 flex items-center justify-center bg-(--color-active-bg) border border-(--color-active-border) rounded-xl px-4 py-3 text-(--color-text)"
              />
            </div>
          )}

          {/* Quick examples */}
          <div>
            <label className="block text-xs text-(--color-gray) font-medium mb-1.5">
              Quick Examples
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                "E = mc^2",
                "\\frac{a}{b}",
                "\\sqrt{x^2 + y^2}",
                "\\sum_{i=1}^{n} x_i",
                "\\int_0^\\infty e^{-x} dx",
                "\\alpha + \\beta = \\gamma",
              ].map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setEquation(ex)}
                  className="px-2 py-1 text-[10px] font-mono bg-(--color-active-bg) border border-(--color-active-border) rounded-lg text-(--color-gray) hover:text-(--color-text) hover:border-violet-500/30 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-(--color-active-border)">
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-(--color-gray) hover:text-(--color-text) hover:bg-(--color-active-bg) transition-colors"
          >
            Cancel
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (equation.trim()) {
                onInsert(equation.trim(), inline);
                onClose();
              }
            }}
            disabled={!equation.trim()}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Insert
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════ Hook ═══════════════════ */

export function useEquationActions() {
  const [editor] = useLexicalComposerContext();

  const insertEquation = useCallback(
    (equation: string, inline: boolean) => {
      editor.update(() => {
        const sel = $getSelection();
        if (!$isRangeSelection(sel)) return;

        if (inline) {
          const text = $createTextNode(`$${equation}$`);
          sel.insertNodes([text]);
        } else {
          const para = $createParagraphNode();
          const text = $createTextNode(`$$${equation}$$`);
          para.append(text);
          sel.anchor.getNode().getTopLevelElementOrThrow().insertAfter(para);
          const after = $createParagraphNode();
          para.insertAfter(after);
          after.selectStart();
        }
      });
    },
    [editor],
  );

  return { insertEquation };
}

/* ═══════════════════ Toolbar Button ═══════════════════ */

export function EquationToolbarButton({
  ToolbarButton,
}: {
  ToolbarButton: React.ComponentType<{
    active?: boolean;
    onClick: () => void;
    title: string;
    children: React.ReactNode;
  }>;
}) {
  const [showModal, setShowModal] = useState(false);
  const { insertEquation } = useEquationActions();

  return (
    <>
      <ToolbarButton
        active={showModal}
        onClick={() => setShowModal(true)}
        title="Insert Equation (LaTeX)"
      >
        <Sigma className="w-4 h-4" />
      </ToolbarButton>

      <AnimatePresence>
        {showModal && (
          <EquationModal
            onInsert={insertEquation}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
