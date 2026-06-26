// components/MibEditor/quote.tsx
"use client";

import type {
  ComponentType,
  ElementType,
  ReactElement,
  ReactNode,
} from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Quote,
  TextQuote,
  Columns2,
  BarChart3,
  ChevronRight,
  Plus,
  Minus,
  Trash2,
  Check,
  RotateCcw,
  Users,
  GripVertical,
  MessageCircle,
  Sparkles,
  Flame,
  BookOpen,
  Feather,
  Megaphone,
} from "lucide-react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type {
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import {
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  DecoratorNode,
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { $createQuoteNode, $isQuoteNode } from "@lexical/rich-text";

/* ═══════════════════════════════════════════════════════════════
                          UTILITIES
   ═══════════════════════════════════════════════════════════════ */

const uid = (): string => Math.random().toString(36).slice(2, 9);

function $getAnchorTopBlock() {
  const sel = $getSelection();
  if (!$isRangeSelection(sel)) return null;
  return sel.anchor.getNode().getTopLevelElementOrThrow();
}

export function $isInQuote(): boolean {
  const sel = $getSelection();
  if (!$isRangeSelection(sel)) return false;
  return $isQuoteNode(sel.anchor.getNode().getTopLevelElementOrThrow());
}

/* ═══════════════════════════════════════════════════════════════
                      STYLED QUOTE NODE
   ═══════════════════════════════════════════════════════════════ */

export type QuoteStyle =
  | "elegant"
  | "gradient"
  | "brutalist"
  | "literary"
  | "callout"
  | "whisper";

interface QuoteStyleConfig {
  key: QuoteStyle;
  label: string;
  desc: string;
  Icon: ElementType;
  color: string;
}

const QUOTE_STYLES: QuoteStyleConfig[] = [
  {
    key: "elegant",
    label: "Elegant Quote",
    desc: "Refined serif with decorative marks",
    Icon: Feather,
    color: "violet",
  },
  {
    key: "gradient",
    label: "Gradient Quote",
    desc: "Bold gradient accent bar",
    Icon: Sparkles,
    color: "pink",
  },
  {
    key: "brutalist",
    label: "Bold Statement",
    desc: "Large dramatic emphasis",
    Icon: Flame,
    color: "orange",
  },
  {
    key: "literary",
    label: "Literary Quote",
    desc: "Book-style with attribution",
    Icon: BookOpen,
    color: "emerald",
  },
  {
    key: "callout",
    label: "Callout",
    desc: "Attention-grabbing highlight",
    Icon: Megaphone,
    color: "blue",
  },
  {
    key: "whisper",
    label: "Whisper",
    desc: "Subtle understated quote",
    Icon: MessageCircle,
    color: "slate",
  },
];

type SerializedStyledQuoteNode = Spread<
  { quoteText: string; author: string; quoteStyle: QuoteStyle },
  SerializedLexicalNode
>;

// ── Styled Quote Component ──
function StyledQuoteComponent({
  quoteText: initText,
  author: initAuthor,
  quoteStyle,
  nodeKey,
  editor,
}: {
  quoteText: string;
  author: string;
  quoteStyle: QuoteStyle;
  nodeKey: NodeKey;
  editor: LexicalEditor;
}) {
  const [text, setText] = useState(initText);
  const [author, setAuthor] = useState(initAuthor);
  const [isEditing, setIsEditing] = useState(!initText);
  const [style, setStyle] = useState<QuoteStyle>(quoteStyle);
  const [showStylePicker, setShowStylePicker] = useState(false);

  const syncToNode = useCallback(
    (t: string, a: string, s: QuoteStyle) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isStyledQuoteNode(node)) {
          node.setQuoteText(t);
          node.setAuthor(a);
          node.setQuoteStyle(s);
        }
      });
    },
    [editor, nodeKey],
  );

  const save = useCallback(() => {
    if (!text.trim()) return;
    setIsEditing(false);
    syncToNode(text, author, style);
  }, [text, author, style, syncToNode]);

  const deleteNode = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) node.remove();
    });
  }, [editor, nodeKey]);

  const changeStyle = useCallback(
    (s: QuoteStyle) => {
      setStyle(s);
      setShowStylePicker(false);
      syncToNode(text, author, s);
    },
    [text, author, syncToNode],
  );

  // ── Render Styles ──
  const renderQuote = () => {
    switch (style) {
      case "elegant":
        return (
          <div className="relative px-8 py-6">
            <svg
              className="absolute top-2 left-2 w-12 h-12 text-violet-500/15"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
            </svg>
            <blockquote className="relative z-10 text-lg italic leading-relaxed text-(--color-text) font-serif">
              &ldquo;{text}&rdquo;
            </blockquote>
            {author && (
              <div className="mt-4 flex items-center gap-2">
                <div className="w-8 h-px bg-violet-500/40" />
                <span className="text-sm text-violet-400 font-medium tracking-wide">
                  {author}
                </span>
              </div>
            )}
          </div>
        );

      case "gradient":
        return (
          <div className="relative overflow-hidden rounded-xl">
            <div className="absolute inset-y-0 left-0 w-1.5 bg-linear-to-b from-pink-500 via-purple-500 to-blue-500" />
            <div className="pl-6 pr-4 py-5">
              <blockquote className="text-base font-medium leading-relaxed text-(--color-text)">
                {text}
              </blockquote>
              {author && (
                <div className="mt-3 text-sm bg-linear-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent font-semibold">
                  — {author}
                </div>
              )}
            </div>
          </div>
        );

      case "brutalist":
        return (
          <div className="relative bg-linear-to-br from-orange-500/10 to-red-500/5 rounded-none border-l-4 border-orange-500 p-6">
            <blockquote className="text-2xl font-black leading-tight tracking-tight text-(--color-text) uppercase">
              {text}
            </blockquote>
            {author && (
              <div className="mt-4 text-sm font-bold text-orange-400 uppercase tracking-widest">
                — {author}
              </div>
            )}
          </div>
        );

      case "literary":
        return (
          <div className="relative border-y border-(--color-active-border) py-8 px-6">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 bg-(--color-bg)">
              <BookOpen className="w-5 h-5 text-emerald-400" />
            </div>
            <blockquote className="text-center text-base italic leading-loose text-(--color-text)/90 font-serif max-w-md mx-auto">
              {text}
            </blockquote>
            {author && (
              <div className="mt-5 text-center">
                <span className="inline-block px-4 py-1 rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-400 tracking-wider uppercase">
                  {author}
                </span>
              </div>
            )}
          </div>
        );

      case "callout":
        return (
          <div className="relative bg-blue-500/8 border border-blue-500/20 rounded-2xl p-5 overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-500/8 rounded-full blur-xl" />
            <div className="relative flex gap-3">
              <div className="shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Megaphone className="w-4 h-4 text-blue-400" />
                </div>
              </div>
              <div>
                <blockquote className="text-sm font-medium leading-relaxed text-(--color-text)">
                  {text}
                </blockquote>
                {author && (
                  <div className="mt-2 text-xs text-blue-400/80 font-medium">
                    — {author}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "whisper":
        return (
          <div className="relative py-4 px-6">
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-(--color-active-bg) to-transparent opacity-50 rounded-xl" />
            <blockquote className="relative text-sm text-(--color-text)/50 leading-relaxed italic text-center">
              {text}
            </blockquote>
            {author && (
              <div className="relative mt-2 text-xs text-(--color-text)/30 text-center">
                — {author}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div
      className="my-4 mx-auto max-w-2xl select-none group"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="relative rounded-2xl border border-(--color-active-border) bg-(--color-bg) overflow-hidden shadow-lg transition-shadow hover:shadow-xl">
        {/* Floating controls */}
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => setShowStylePicker((v) => !v)}
            className="p-1.5 rounded-lg bg-(--color-bg)/90 backdrop-blur-sm border border-(--color-active-border) hover:bg-(--color-active-bg) text-(--color-text)/60 hover:text-(--color-text) transition-all text-[10px] font-medium"
            title="Change style"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="p-1.5 rounded-lg bg-(--color-bg)/90 backdrop-blur-sm border border-(--color-active-border) hover:bg-(--color-active-bg) text-(--color-text)/60 hover:text-(--color-text) transition-all"
              title="Edit"
            >
              <Feather className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={deleteNode}
            className="p-1.5 rounded-lg bg-(--color-bg)/90 backdrop-blur-sm border border-red-500/20 hover:bg-red-500/10 text-red-400 transition-all"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Style picker dropdown */}
        <AnimatePresence>
          {showStylePicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-(--color-active-border) overflow-hidden"
            >
              <div className="p-3 grid grid-cols-3 gap-1.5">
                {QUOTE_STYLES.map((qs) => {
                  const active = qs.key === style;
                  return (
                    <motion.button
                      key={qs.key}
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => changeStyle(qs.key)}
                      className={[
                        "flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all",
                        active
                          ? "border-violet-500/50 bg-violet-500/10"
                          : "border-transparent hover:bg-(--color-active-bg)",
                      ].join(" ")}
                    >
                      <qs.Icon
                        className={`w-4 h-4 ${active ? "text-violet-400" : "text-(--color-text)/40"}`}
                      />
                      <span
                        className={`text-[10px] font-medium ${active ? "text-violet-300" : "text-(--color-text)/50"}`}
                      >
                        {qs.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-3"
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write your quote…"
                rows={3}
                autoFocus
                className="w-full px-3 py-2.5 rounded-xl bg-(--color-active-bg) border border-(--color-active-border) text-(--color-text) text-sm placeholder:text-(--color-text)/30 outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
              />
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author (optional)"
                className="w-full px-3 py-2 rounded-xl bg-(--color-active-bg) border border-(--color-active-border) text-(--color-text) text-sm placeholder:text-(--color-text)/30 outline-none focus:ring-2 focus:ring-violet-500/30"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={save}
                  disabled={!text.trim()}
                  className="px-4 py-1.5 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="display"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderQuote()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Styled Quote Node ──
export class StyledQuoteNode extends DecoratorNode<ReactElement> {
  __quoteText: string;
  __author: string;
  __quoteStyle: QuoteStyle;

  static getType(): string {
    return "styled-quote";
  }

  static clone(node: StyledQuoteNode): StyledQuoteNode {
    return new StyledQuoteNode(
      node.__quoteText,
      node.__author,
      node.__quoteStyle,
      node.__key,
    );
  }

  constructor(
    quoteText: string,
    author: string,
    quoteStyle: QuoteStyle,
    key?: NodeKey,
  ) {
    super(key);
    this.__quoteText = quoteText;
    this.__author = author;
    this.__quoteStyle = quoteStyle;
  }

  createDOM(): HTMLElement {
    const div = document.createElement("div");
    div.setAttribute("data-lexical-styled-quote", "true");
    return div;
  }

  updateDOM(): false {
    return false;
  }
  exportDOM(): { element: HTMLElement } {
    const div = document.createElement("div");
    div.setAttribute("data-styled-quote", "true");
    div.setAttribute("data-quote-style", this.__quoteStyle);

    // quote container
    const container = document.createElement("blockquote");
    container.setAttribute("data-style", this.__quoteStyle);
    container.style.cssText = this._getInlineStyles();
    container.textContent = this.__quoteText;

    div.appendChild(container);

    // author
    if (this.__author) {
      const authorEl = document.createElement("cite");
      authorEl.textContent = `— ${this.__author}`;
      authorEl.style.cssText =
        "display:block;margin-top:0.75rem;font-style:normal;";
      div.appendChild(authorEl);
    }

    return { element: div };
  }

  _getInlineStyles(): string {
    const base =
      "display:block;padding:1.25rem;margin:1rem 0;border-radius:0.75rem;";

    switch (this.__quoteStyle) {
      case "elegant":
        return (
          base +
          "border-left:4px solid #8b5cf6;background:rgba(139,92,246,0.06);font-style:italic;font-family:Georgia,serif;"
        );
      case "gradient":
        return (
          base +
          "border-left:4px solid #ec4899;background:linear-gradient(135deg,rgba(236,72,153,0.06),rgba(139,92,246,0.06));"
        );
      case "brutalist":
        return (
          base +
          "border-left:4px solid #f97316;background:rgba(249,115,22,0.06);text-transform:uppercase;font-weight:800;font-size:1.25rem;"
        );
      case "literary":
        return (
          base +
          "border-top:1px solid var(--color-active-border);border-bottom:1px solid var(--color-active-border);border-left:none;text-align:center;font-style:italic;font-family:Georgia,serif;"
        );
      case "callout":
        return (
          base +
          "border:1px solid rgba(59,130,246,0.2);background:rgba(59,130,246,0.06);border-left:4px solid #3b82f6;"
        );
      case "whisper":
        return (
          base +
          "text-align:center;opacity:0.6;font-style:italic;background:rgba(148,163,184,0.05);"
        );
      default:
        return base + "border-left:4px solid #8b5cf6;";
    }
  }

  setQuoteText(text: string): void {
    this.getWritable().__quoteText = text;
  }

  setAuthor(author: string): void {
    this.getWritable().__author = author;
  }

  setQuoteStyle(style: QuoteStyle): void {
    this.getWritable().__quoteStyle = style;
  }

  decorate(editor: LexicalEditor): ReactElement {
    return (
      <StyledQuoteComponent
        quoteText={this.__quoteText}
        author={this.__author}
        quoteStyle={this.__quoteStyle}
        nodeKey={this.__key}
        editor={editor}
      />
    );
  }

  static importJSON(json: SerializedStyledQuoteNode): StyledQuoteNode {
    return $createStyledQuoteNode(json.quoteText, json.author, json.quoteStyle);
  }

  exportJSON(): SerializedStyledQuoteNode {
    return {
      type: "styled-quote",
      version: 1,
      quoteText: this.__quoteText,
      author: this.__author,
      quoteStyle: this.__quoteStyle,
    };
  }

  isIsolated(): boolean {
    return true;
  }
}

export function $createStyledQuoteNode(
  text = "",
  author = "",
  style: QuoteStyle = "elegant",
): StyledQuoteNode {
  return new StyledQuoteNode(text, author, style);
}

export function $isStyledQuoteNode(
  node: LexicalNode | null | undefined,
): node is StyledQuoteNode {
  return node instanceof StyledQuoteNode;
}

/* ═══════════════════════════════════════════════════════════════
                          POLL NODE
   ═══════════════════════════════════════════════════════════════ */

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

type SerializedPollNode = Spread<
  { question: string; options: PollOption[] },
  SerializedLexicalNode
>;

function PollComponent({
  question,
  options,
  nodeKey,
  editor,
}: {
  question: string;
  options: PollOption[];
  nodeKey: NodeKey;
  editor: LexicalEditor;
}) {
  const [voted, setVoted] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(!question);
  const [editQuestion, setEditQuestion] = useState(question);
  const [editOptions, setEditOptions] = useState<PollOption[]>(options);

  const totalVotes = useMemo(
    () => editOptions.reduce((s, o) => s + o.votes, 0),
    [editOptions],
  );

  const syncToNode = useCallback(
    (q: string, opts: PollOption[]) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isPollNode(node)) {
          node.setQuestion(q);
          node.setOptions(opts);
        }
      });
    },
    [editor, nodeKey],
  );

  const handleVote = useCallback(
    (optionId: string) => {
      if (voted) return;
      setVoted(optionId);
      const updated = editOptions.map((o) =>
        o.id === optionId ? { ...o, votes: o.votes + 1 } : o,
      );
      setEditOptions(updated);
      syncToNode(editQuestion, updated);
    },
    [voted, editOptions, editQuestion, syncToNode],
  );

  const handleResetVotes = useCallback(() => {
    setVoted(null);
    const reset = editOptions.map((o) => ({ ...o, votes: 0 }));
    setEditOptions(reset);
    syncToNode(editQuestion, reset);
  }, [editOptions, editQuestion, syncToNode]);

  const addOption = useCallback(() => {
    if (editOptions.length >= 8) return;
    const updated = [...editOptions, { id: uid(), text: "", votes: 0 }];
    setEditOptions(updated);
    syncToNode(editQuestion, updated);
  }, [editOptions, editQuestion, syncToNode]);

  const removeOption = useCallback(
    (id: string) => {
      if (editOptions.length <= 2) return;
      const updated = editOptions.filter((o) => o.id !== id);
      setEditOptions(updated);
      syncToNode(editQuestion, updated);
    },
    [editOptions, editQuestion, syncToNode],
  );

  const updateOptionText = useCallback((id: string, t: string) => {
    setEditOptions((prev) =>
      prev.map((o) => (o.id === id ? { ...o, text: t } : o)),
    );
  }, []);

  const saveEdit = useCallback(() => {
    if (!editQuestion.trim() || editOptions.some((o) => !o.text.trim())) return;
    setIsEditing(false);
    syncToNode(editQuestion, editOptions);
  }, [editQuestion, editOptions, syncToNode]);

  const deletePoll = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) node.remove();
    });
  }, [editor, nodeKey]);

  const maxVotes = Math.max(...editOptions.map((o) => o.votes));

  return (
    <div
      className="my-4 mx-auto max-w-lg select-none"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <motion.div
        layout
        className="rounded-2xl border border-(--color-active-border) bg-(--color-bg) overflow-hidden shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-emerald-500/8 border-b border-(--color-active-border)">
          <div className="flex items-center gap-2">
            <div className="relative">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              {totalVotes > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400"
                />
              )}
            </div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Poll
            </span>
          </div>
          <div className="flex items-center gap-1">
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs px-2 py-1 rounded-lg hover:bg-(--color-active-bg) text-(--color-text)/60 hover:text-(--color-text) transition-colors"
              >
                Edit
              </button>
            )}
            {!isEditing && totalVotes > 0 && (
              <button
                type="button"
                onClick={handleResetVotes}
                title="Reset votes"
                className="p-1 rounded-lg hover:bg-(--color-active-bg) text-(--color-text)/60 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={deletePoll}
              title="Delete poll"
              className="p-1 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="p-4">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div
                key="edit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <input
                  type="text"
                  value={editQuestion}
                  onChange={(e) => setEditQuestion(e.target.value)}
                  placeholder="Ask a question…"
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-xl bg-(--color-active-bg) border border-(--color-active-border) text-(--color-text) text-sm font-medium placeholder:text-(--color-text)/30 outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
                <div className="space-y-2">
                  {editOptions.map((opt, i) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <span className="text-xs text-(--color-text)/30 w-5 text-right font-mono">
                        {i + 1}.
                      </span>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) =>
                          updateOptionText(opt.id, e.target.value)
                        }
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 px-3 py-2 rounded-lg bg-(--color-active-bg) border border-(--color-active-border) text-(--color-text) text-sm placeholder:text-(--color-text)/30 outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                      {editOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(opt.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {editOptions.length < 8 && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors pl-7"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add option
                  </button>
                )}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={
                      !editQuestion.trim() ||
                      editOptions.some((o) => !o.text.trim())
                    }
                    className="px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Save Poll
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="vote"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <h3 className="text-base font-semibold text-(--color-text)">
                  {editQuestion}
                </h3>
                <div className="space-y-2">
                  {editOptions.map((opt) => {
                    const pct =
                      totalVotes > 0
                        ? Math.round((opt.votes / totalVotes) * 100)
                        : 0;
                    const isVoted = voted === opt.id;
                    const isWinner =
                      voted && opt.votes === maxVotes && maxVotes > 0;

                    return (
                      <motion.button
                        key={opt.id}
                        type="button"
                        onClick={() => handleVote(opt.id)}
                        disabled={!!voted}
                        whileHover={!voted ? { scale: 1.01 } : {}}
                        whileTap={!voted ? { scale: 0.99 } : {}}
                        className={[
                          "relative w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all overflow-hidden",
                          isVoted
                            ? "border-emerald-500/50 bg-emerald-500/10"
                            : voted
                              ? "border-(--color-active-border) bg-(--color-active-bg)/50"
                              : "border-(--color-active-border) hover:border-emerald-500/30 hover:bg-emerald-500/5 cursor-pointer",
                        ].join(" ")}
                      >
                        {voted && (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{
                              duration: 0.7,
                              ease: [0.25, 0.46, 0.45, 0.94],
                              delay: 0.1,
                            }}
                            className={`absolute inset-y-0 left-0 rounded-xl ${
                              isVoted
                                ? "bg-emerald-500/20"
                                : "bg-(--color-active-bg)/80"
                            }`}
                          />
                        )}
                        <div className="relative flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isVoted && (
                              <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 300,
                                  delay: 0.3,
                                }}
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              </motion.div>
                            )}
                            <span
                              className={
                                isVoted
                                  ? "text-emerald-300 font-medium"
                                  : "text-(--color-text)"
                              }
                            >
                              {opt.text}
                            </span>
                            {isWinner && !isVoted && (
                              <motion.span
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.8 }}
                                className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium"
                              >
                                Leading
                              </motion.span>
                            )}
                          </div>
                          {voted && (
                            <motion.span
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 }}
                              className="text-xs text-(--color-text)/50 font-mono font-medium tabular-nums"
                            >
                              {pct}%
                            </motion.span>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-(--color-text)/40 pt-1">
                  <Users className="w-3 h-3" />
                  <span>
                    {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export class PollNode extends DecoratorNode<ReactElement> {
  __question: string;
  __options: PollOption[];

  static getType(): string {
    return "poll";
  }

  static clone(node: PollNode): PollNode {
    return new PollNode(node.__question, [...node.__options], node.__key);
  }

  constructor(question: string, options: PollOption[], key?: NodeKey) {
    super(key);
    this.__question = question;
    this.__options = options;
  }

  createDOM(): HTMLElement {
    const div = document.createElement("div");
    div.setAttribute("data-lexical-poll", "true");
    return div;
  }

  updateDOM(): false {
    return false;
  }

  exportDOM(): { element: HTMLElement } {
    const div = document.createElement("div");
    div.setAttribute("data-poll", "true");
    div.style.cssText =
      "border:1px solid var(--color-active-border);border-radius:0.75rem;padding:1rem;margin:1rem 0;";

    const title = document.createElement("h4");
    title.style.cssText = "font-weight:600;margin-bottom:0.75rem;";
    title.textContent = `📊 ${this.__question}`;
    div.appendChild(title);

    const list = document.createElement("ul");
    list.style.cssText = "list-style:none;padding:0;margin:0;";

    this.__options.forEach((opt) => {
      const li = document.createElement("li");
      li.style.cssText =
        "padding:0.5rem 0.75rem;margin-bottom:0.375rem;border:1px solid var(--color-active-border);border-radius:0.5rem;";
      li.textContent = opt.text;
      list.appendChild(li);
    });

    div.appendChild(list);
    return { element: div };
  }

  setQuestion(q: string): void {
    this.getWritable().__question = q;
  }

  setOptions(opts: PollOption[]): void {
    this.getWritable().__options = opts;
  }

  decorate(editor: LexicalEditor): ReactElement {
    return (
      <PollComponent
        question={this.__question}
        options={this.__options}
        nodeKey={this.__key}
        editor={editor}
      />
    );
  }

  static importJSON(json: SerializedPollNode): PollNode {
    return $createPollNode(json.question, json.options);
  }

  exportJSON(): SerializedPollNode {
    return {
      type: "poll",
      version: 1,
      question: this.__question,
      options: this.__options,
    };
  }

  isIsolated(): boolean {
    return true;
  }
}

export function $createPollNode(
  question = "",
  options?: PollOption[],
): PollNode {
  return new PollNode(
    question,
    options ?? [
      { id: uid(), text: "", votes: 0 },
      { id: uid(), text: "", votes: 0 },
    ],
  );
}

export function $isPollNode(
  node: LexicalNode | null | undefined,
): node is PollNode {
  return node instanceof PollNode;
}

/* ═══════════════════════════════════════════════════════════════
                        COLUMNS NODE
   ═══════════════════════════════════════════════════════════════ */

type SerializedColumnsNode = Spread<
  { columnCount: number; columnContents: string[] },
  SerializedLexicalNode
>;

function ColumnsComponent({
  columnCount: initCount,
  columnContents: initContents,
  nodeKey,
  editor,
}: {
  columnCount: number;
  columnContents: string[];
  nodeKey: NodeKey;
  editor: LexicalEditor;
}) {
  const [columnCount, setColumnCount] = useState(initCount);
  const [contents, setContents] = useState<string[]>(initContents);
  const [focused, setFocused] = useState<number | null>(null);

  useEffect(() => {
    setContents((prev) => {
      const updated = [...prev];
      while (updated.length < columnCount) updated.push("");
      return updated.slice(0, columnCount);
    });
  }, [columnCount]);

  const syncToNode = useCallback(
    (count: number, conts: string[]) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isColumnsNode(node)) {
          node.setColumnCount(count);
          node.setColumnContents(conts);
        }
      });
    },
    [editor, nodeKey],
  );

  const updateContent = useCallback(
    (index: number, value: string) => {
      setContents((prev) => {
        const updated = [...prev];
        updated[index] = value;
        syncToNode(columnCount, updated);
        return updated;
      });
    },
    [columnCount, syncToNode],
  );

  const changeCount = useCallback(
    (delta: number) => {
      const next = Math.max(2, Math.min(6, columnCount + delta));
      if (next === columnCount) return;
      setColumnCount(next);
      const updated = [...contents];
      while (updated.length < next) updated.push("");
      syncToNode(next, updated.slice(0, next));
    },
    [columnCount, contents, syncToNode],
  );

  const deleteNode = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) node.remove();
    });
  }, [editor, nodeKey]);

  return (
    <div
      className="my-4 select-none"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="rounded-2xl border border-(--color-active-border) bg-(--color-bg) overflow-hidden shadow-lg">
        <div className="flex items-center justify-between px-4 py-2.5 bg-blue-500/8 border-b border-(--color-active-border)">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              {columnCount} Columns
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => changeCount(-1)}
              disabled={columnCount <= 2}
              className="p-1 rounded-lg hover:bg-(--color-active-bg) text-(--color-text) disabled:opacity-30 transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-(--color-text)/50 w-4 text-center font-mono">
              {columnCount}
            </span>
            <button
              type="button"
              onClick={() => changeCount(1)}
              disabled={columnCount >= 6}
              className="p-1 rounded-lg hover:bg-(--color-active-bg) text-(--color-text) disabled:opacity-30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-(--color-active-border) mx-1" />
            <button
              type="button"
              onClick={deleteNode}
              className="p-1 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div
          className="grid gap-0"
          style={{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }}
        >
          {Array.from({ length: columnCount }).map((_, i) => (
            <div
              key={i}
              className={[
                "relative min-h-30 p-3 transition-colors",
                i < columnCount - 1
                  ? "border-r border-(--color-active-border)"
                  : "",
                focused === i ? "bg-blue-500/5" : "",
              ].join(" ")}
            >
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-(--color-active-bg) flex items-center justify-center">
                <span className="text-[10px] font-mono text-(--color-text)/30">
                  {i + 1}
                </span>
              </div>
              <textarea
                value={contents[i] || ""}
                onChange={(e) => updateContent(i, e.target.value)}
                onFocus={() => setFocused(i)}
                onBlur={() => setFocused(null)}
                placeholder={`Column ${i + 1}…`}
                className="w-full h-full min-h-25 bg-transparent text-sm text-(--color-text) placeholder:text-(--color-text)/20 outline-none resize-none"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export class ColumnsNode extends DecoratorNode<ReactElement> {
  __columnCount: number;
  __columnContents: string[];

  static getType(): string {
    return "columns";
  }

  static clone(node: ColumnsNode): ColumnsNode {
    return new ColumnsNode(
      node.__columnCount,
      [...node.__columnContents],
      node.__key,
    );
  }

  constructor(count: number, contents: string[], key?: NodeKey) {
    super(key);
    this.__columnCount = count;
    this.__columnContents = contents;
  }

  createDOM(): HTMLElement {
    const div = document.createElement("div");
    div.setAttribute("data-lexical-columns", "true");
    return div;
  }

  updateDOM(): false {
    return false;
  }

  exportDOM(): { element: HTMLElement } {
    const div = document.createElement("div");
    div.setAttribute("data-columns", "true");
    div.style.cssText = `display:grid;grid-template-columns:repeat(${this.__columnCount},1fr);gap:1rem;margin:1rem 0;`;

    this.__columnContents.forEach((text, i) => {
      const col = document.createElement("div");
      col.style.cssText =
        "padding:0.75rem;border:1px solid var(--color-active-border);border-radius:0.5rem;";
      col.textContent = text || `Column ${i + 1}`;
      div.appendChild(col);
    });

    return { element: div };
  }

  setColumnCount(count: number): void {
    this.getWritable().__columnCount = count;
  }

  setColumnContents(contents: string[]): void {
    this.getWritable().__columnContents = contents;
  }

  decorate(editor: LexicalEditor): ReactElement {
    return (
      <ColumnsComponent
        columnCount={this.__columnCount}
        columnContents={this.__columnContents}
        nodeKey={this.__key}
        editor={editor}
      />
    );
  }

  static importJSON(json: SerializedColumnsNode): ColumnsNode {
    return $createColumnsNode(json.columnCount, json.columnContents);
  }

  exportJSON(): SerializedColumnsNode {
    return {
      type: "columns",
      version: 1,
      columnCount: this.__columnCount,
      columnContents: this.__columnContents,
    };
  }

  isIsolated(): boolean {
    return true;
  }
}

export function $createColumnsNode(
  count = 2,
  contents?: string[],
): ColumnsNode {
  return new ColumnsNode(count, contents ?? Array(count).fill(""));
}

export function $isColumnsNode(
  node: LexicalNode | null | undefined,
): node is ColumnsNode {
  return node instanceof ColumnsNode;
}

/* ═══════════════════════════════════════════════════════════════
                  COLUMN PICKER SUB-MENU
   ═══════════════════════════════════════════════════════════════ */

function ColumnPicker({ onSelect }: { onSelect: (n: number) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="p-3 space-y-3">
      <p className="text-xs text-(--color-text)/40 font-medium">
        How many columns?
      </p>
      <div className="flex gap-1.5">
        {[2, 3, 4, 5, 6].map((n) => (
          <motion.button
            key={n}
            type="button"
            whileHover={{ scale: 1.12, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onHoverStart={() => setHovered(n)}
            onHoverEnd={() => setHovered(null)}
            onClick={() => onSelect(n)}
            className={[
              "w-9 h-9 rounded-lg border text-sm font-semibold transition-all flex items-center justify-center",
              hovered === n
                ? "border-blue-500 bg-blue-500/15 text-blue-400 shadow-lg shadow-blue-500/10"
                : "border-(--color-active-border) text-(--color-text) hover:bg-(--color-active-bg)",
            ].join(" ")}
          >
            {n}
          </motion.button>
        ))}
      </div>
      <div className="flex gap-1 px-0.5">
        {Array.from({ length: hovered ?? 3 }).map((_, i) => (
          <motion.div
            key={i}
            layout
            className="flex-1 h-4 rounded-sm bg-blue-500/15 border border-blue-500/25"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.15, delay: i * 0.03 }}
          />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
                  QUOTE STYLE PICKER SUB-MENU
   ═══════════════════════════════════════════════════════════════ */

function QuoteStylePicker({
  onSelect,
}: {
  onSelect: (style: QuoteStyle) => void;
}) {
  const colorMap: Record<string, string> = {
    violet: "text-violet-400",
    pink: "text-pink-400",
    orange: "text-orange-400",
    emerald: "text-emerald-400",
    blue: "text-blue-400",
    slate: "text-slate-400",
  };
  const bgMap: Record<string, string> = {
    violet: "bg-violet-500/10",
    pink: "bg-pink-500/10",
    orange: "bg-orange-500/10",
    emerald: "bg-emerald-500/10",
    blue: "bg-blue-500/10",
    slate: "bg-slate-500/10",
  };

  return (
    <div className="p-2 space-y-1">
      {QUOTE_STYLES.map((qs) => (
        <motion.button
          key={qs.key}
          type="button"
          whileHover={{ x: 2 }}
          onClick={() => onSelect(qs.key)}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-(--color-active-bg) transition-colors"
        >
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${bgMap[qs.color] ?? "bg-(--color-active-bg)"}`}
          >
            <qs.Icon
              className={`w-3.5 h-3.5 ${colorMap[qs.color] ?? "text-(--color-text)/50"}`}
            />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-(--color-text)">
              {qs.label}
            </div>
            <div className="text-[10px] text-(--color-text)/35 truncate">
              {qs.desc}
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
                       ACTIONS HOOK
   ═══════════════════════════════════════════════════════════════ */

function useQuoteActions() {
  const [editor] = useLexicalComposerContext();

  const toggleQuote = useCallback(() => {
    editor.update(() => {
      const sel = $getSelection();
      if (!$isRangeSelection(sel)) return;
      const anchor = sel.anchor.getNode().getTopLevelElementOrThrow();
      $setBlocksType(sel, () =>
        $isQuoteNode(anchor) ? $createParagraphNode() : $createQuoteNode(),
      );
    });
    editor.focus();
  }, [editor]);

  const insertStyledQuote = useCallback(
    (style: QuoteStyle) => {
      editor.update(() => {
        const anchor = $getAnchorTopBlock();
        if (!anchor) return;
        const node = $createStyledQuoteNode("", "", style);
        anchor.insertAfter(node);
        node.insertAfter($createParagraphNode());
      });
      editor.focus();
    },
    [editor],
  );

  const insertColumns = useCallback(
    (count: number) => {
      editor.update(() => {
        const anchor = $getAnchorTopBlock();
        if (!anchor) return;
        const node = $createColumnsNode(count);
        anchor.insertAfter(node);
        node.insertAfter($createParagraphNode());
      });
      editor.focus();
    },
    [editor],
  );

  const insertPoll = useCallback(() => {
    editor.update(() => {
      const anchor = $getAnchorTopBlock();
      if (!anchor) return;
      const node = $createPollNode();
      anchor.insertAfter(node);
      node.insertAfter($createParagraphNode());
    });
    editor.focus();
  }, [editor]);

  return { toggleQuote, insertStyledQuote, insertColumns, insertPoll };
}

/* ═══════════════════════════════════════════════════════════════
                 TOOLBAR DROPDOWN (exported)
   ═══════════════════════════════════════════════════════════════ */

interface ToolbarButtonProps {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: ReactNode;
}

interface ActionItem {
  key: string;
  label: string;
  desc: string;
  Icon: ElementType;
  color: string;
  onSelect: () => void;
  active?: boolean;
  hasSubmenu?: boolean;
}

const COLOR_MAP: Record<
  string,
  { icon: string; activeBg: string; activeText: string }
> = {
  violet: {
    icon: "text-violet-400",
    activeBg: "bg-violet-500/10",
    activeText: "text-violet-300",
  },
  amber: {
    icon: "text-amber-400",
    activeBg: "bg-amber-500/10",
    activeText: "text-amber-300",
  },
  blue: {
    icon: "text-blue-400",
    activeBg: "bg-blue-500/10",
    activeText: "text-blue-300",
  },
  emerald: {
    icon: "text-emerald-400",
    activeBg: "bg-emerald-500/10",
    activeText: "text-emerald-300",
  },
};

export function QuoteToolbarDropdown({
  isQuoteActive,
  ToolbarButton,
}: {
  isQuoteActive: boolean;
  ToolbarButton: ComponentType<ToolbarButtonProps>;
}) {
  const [open, setOpen] = useState(false);
  const [subMenu, setSubMenu] = useState<"columns" | "quote-styles" | null>(
    null,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const { toggleQuote, insertStyledQuote, insertColumns, insertPoll } =
    useQuoteActions();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setSubMenu(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (subMenu) setSubMenu(null);
        else setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, subMenu]);

  const close = () => {
    setOpen(false);
    setSubMenu(null);
  };

  const actions: ActionItem[] = useMemo(
    () => [
      {
        key: "quote",
        label: isQuoteActive ? "Remove Blockquote" : "Blockquote",
        desc: "Indent as quote",
        Icon: Quote,
        color: "violet",
        active: isQuoteActive,
        onSelect: () => {
          toggleQuote();
          close();
        },
      },
      {
        key: "styled-quote",
        label: "Styled Quote",
        desc: "6 beautiful quote styles",
        Icon: TextQuote,
        color: "amber",
        hasSubmenu: true,
        onSelect: () => setSubMenu("quote-styles"),
      },
      {
        key: "columns",
        label: "Columns",
        desc: "Split into columns",
        Icon: Columns2,
        color: "blue",
        hasSubmenu: true,
        onSelect: () => setSubMenu("columns"),
      },
      {
        key: "poll",
        label: "Poll",
        desc: "Ask & collect votes",
        Icon: BarChart3,
        color: "emerald",
        onSelect: () => {
          insertPoll();
          close();
        },
      },
    ],
    [isQuoteActive, toggleQuote, insertPoll],
  );

  return (
    <div
      ref={rootRef}
      className="relative"
      onPointerDown={(e) => e.preventDefault()}
    >
      <ToolbarButton
        active={isQuoteActive || open}
        onClick={() => {
          setOpen((v) => !v);
          setSubMenu(null);
        }}
        title="Insert blocks"
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.13 }}
            role="menu"
            className="absolute left-0 top-full z-10001 mt-1.5 w-60 overflow-hidden rounded-2xl border border-(--color-active-border) bg-(--color-bg) shadow-2xl"
          >
            <AnimatePresence mode="wait">
              {!subMenu ? (
                <motion.div
                  key="main"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.1 }}
                  className="py-1"
                >
                  {actions.map(
                    ({
                      key,
                      label,
                      desc,
                      Icon,
                      onSelect,
                      active,
                      hasSubmenu,
                      color,
                    }) => {
                      const c = COLOR_MAP[color] ?? COLOR_MAP.violet!;
                      return (
                        <motion.button
                          key={key}
                          type="button"
                          role="menuitem"
                          whileHover={{
                            x: 3,
                            backgroundColor: "rgba(255,255,255,0.03)",
                          }}
                          onClick={onSelect}
                          className={[
                            "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                            active
                              ? c.activeBg
                              : "hover:bg-(--color-active-bg)",
                          ].join(" ")}
                        >
                          <div
                            className={[
                              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                              active ? c.activeBg : "bg-(--color-active-bg)",
                            ].join(" ")}
                          >
                            <Icon
                              className={`w-4 h-4 ${active ? c.activeText : c.icon}`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className={`text-sm font-medium ${active ? c.activeText : "text-(--color-text)"}`}
                            >
                              {label}
                            </div>
                            <div className="text-[11px] text-(--color-text)/35 truncate">
                              {desc}
                            </div>
                          </div>
                          {hasSubmenu && (
                            <ChevronRight className="w-3.5 h-3.5 text-(--color-text)/25 shrink-0" />
                          )}
                        </motion.button>
                      );
                    },
                  )}
                </motion.div>
              ) : subMenu === "columns" ? (
                <motion.div
                  key="columns"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.1 }}
                >
                  <button
                    type="button"
                    onClick={() => setSubMenu(null)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-(--color-text)/40 hover:bg-(--color-active-bg) transition-colors border-b border-(--color-active-border)"
                  >
                    <ChevronRight className="w-3 h-3 rotate-180" />
                    Back
                  </button>
                  <ColumnPicker
                    onSelect={(n) => {
                      insertColumns(n);
                      close();
                    }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="quote-styles"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.1 }}
                >
                  <button
                    type="button"
                    onClick={() => setSubMenu(null)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-(--color-text)/40 hover:bg-(--color-active-bg) transition-colors border-b border-(--color-active-border)"
                  >
                    <ChevronRight className="w-3 h-3 rotate-180" />
                    Back
                  </button>
                  <QuoteStylePicker
                    onSelect={(style) => {
                      insertStyledQuote(style);
                      close();
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
