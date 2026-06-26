// components/MibEditor/quote.tsx
"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, TextQuote, Columns2, ChevronDown } from "lucide-react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $createTextNode,
  $isElementNode,
  ElementNode,
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { $createQuoteNode, $isQuoteNode } from "@lexical/rich-text";

/* ─── Types ─── */
export type QuoteType = "quote" | "pull" | "column";

interface QuoteBlockInfo {
  label: string;
  Icon: React.ElementType;
  type: QuoteType;
}

/* ─── Config ─── */
const QUOTE_BLOCKS: QuoteBlockInfo[] = [
  { label: "Blockquote", Icon: Quote, type: "quote" },
  { label: "Pull Quote", Icon: TextQuote, type: "pull" },
  { label: "2 Columns", Icon: Columns2, type: "column" },
];

/* ─── Helper ─── */
export function $isInQuote(): boolean {
  const sel = $getSelection();
  if (!$isRangeSelection(sel)) return false;
  const el = sel.anchor.getNode().getTopLevelElementOrThrow();
  return $isQuoteNode(el);
}

/* ─── Hook ─── */
export function useQuoteActions() {
  const [editor] = useLexicalComposerContext();

  const toggleQuote = useCallback(
    (isCurrentlyQuote: boolean) => {
      editor.update(() => {
        const sel = $getSelection();
        if (!$isRangeSelection(sel)) return;
        if (isCurrentlyQuote) {
          $setBlocksType(sel, () => $createParagraphNode());
        } else {
          $setBlocksType(sel, () => $createQuoteNode());
        }
      });
    },
    [editor],
  );

  const insertPullQuote = useCallback(() => {
    editor.update(() => {
      const sel = $getSelection();
      if (!$isRangeSelection(sel)) return;
      const quote = $createQuoteNode();
      // Add styling via className manipulation - pull quote is a styled blockquote
      const text = $createTextNode("Pull quote text here...");
      const para = $createParagraphNode();
      para.append(text);
      quote.append(para);
      sel.anchor.getNode().getTopLevelElementOrThrow().insertAfter(quote);
      const after = $createParagraphNode();
      quote.insertAfter(after);
      text.select();
    });
  }, [editor]);

  const insertColumns = useCallback(() => {
    editor.update(() => {
      const sel = $getSelection();
      if (!$isRangeSelection(sel)) return;
      // Columns: we create two paragraphs side by side using a wrapper
      // Since Lexical doesn't have native columns, we simulate with styled divs
      const col1 = $createParagraphNode();
      col1.append($createTextNode("Column 1 content..."));
      const col2 = $createParagraphNode();
      col2.append($createTextNode("Column 2 content..."));

      const anchor = sel.anchor.getNode().getTopLevelElementOrThrow();
      anchor.insertAfter(col1);
      col1.insertAfter(col2);

      const after = $createParagraphNode();
      col2.insertAfter(after);
      col1.selectStart();
    });
  }, [editor]);

  return { toggleQuote, insertPullQuote, insertColumns };
}

/* ─── Toolbar Dropdown ─── */
export function QuoteToolbarDropdown({
  isQuoteActive,
  ToolbarButton,
}: {
  isQuoteActive: boolean;
  ToolbarButton: React.ComponentType<{
    active?: boolean;
    onClick: () => void;
    title: string;
    children: React.ReactNode;
  }>;
}) {
  const [show, setShow] = useState(false);
  const { toggleQuote, insertPullQuote, insertColumns } = useQuoteActions();

  return (
    <div className="relative">
      <ToolbarButton
        active={isQuoteActive || show}
        onClick={() => setShow((p) => !p)}
        title="Quote & Columns"
      >
        <Quote className="w-4 h-4" />
      </ToolbarButton>

      <AnimatePresence>
        {show && (
          <>
            <div
              className="fixed inset-0 z-10000"
              onClick={() => setShow(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.13 }}
              className="absolute top-full left-0 mt-1.5 z-10001 w-44 rounded-xl border border-(--color-active-border) bg-(--color-bg) shadow-2xl overflow-hidden"
            >
              <motion.button
                type="button"
                whileHover={{ x: 4 }}
                onClick={() => {
                  toggleQuote(isQuoteActive);
                  setShow(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                  isQuoteActive
                    ? "text-violet-300 bg-violet-500/15"
                    : "text-(--color-text) hover:bg-(--color-active-bg)"
                }`}
              >
                <Quote className="w-4 h-4 shrink-0" />
                Blockquote
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ x: 4 }}
                onClick={() => {
                  insertPullQuote();
                  setShow(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left text-(--color-text) hover:bg-(--color-active-bg) transition-colors"
              >
                <TextQuote className="w-4 h-4 shrink-0" />
                Pull Quote
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ x: 4 }}
                onClick={() => {
                  insertColumns();
                  setShow(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left text-(--color-text) hover:bg-(--color-active-bg) transition-colors"
              >
                <Columns2 className="w-4 h-4 shrink-0" />2 Columns
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
