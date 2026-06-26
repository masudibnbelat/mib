// components/MibEditor/text.tsx
"use client";

import { useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link,
  Link2Off,
  Minus,
  CaseSensitive,
  CaseUpper,
  CaseLower,
  Superscript,
  Subscript,
  RemoveFormatting,
  ChevronDown,
  X,
} from "lucide-react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $createTextNode,
  $isTextNode,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  ElementFormatType,
  TextFormatType,
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import {
  $isHeadingNode,
  $createHeadingNode,
  HeadingTagType,
} from "@lexical/rich-text";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { $isElementNode } from "lexical";

/* ─── Types ─── */
export type HeadingType = "paragraph" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export interface HeadingBlockInfo {
  label: string;
  Icon: React.ElementType;
  type: HeadingType;
}

/* ─── Config ─── */
export const HEADING_BLOCKS: HeadingBlockInfo[] = [
  { label: "Normal Text", Icon: Type, type: "paragraph" },
  { label: "Heading 1", Icon: Heading1, type: "h1" },
  { label: "Heading 2", Icon: Heading2, type: "h2" },
  { label: "Heading 3", Icon: Heading3, type: "h3" },
  { label: "Heading 4", Icon: Heading4, type: "h4" },
  { label: "Heading 5", Icon: Heading5, type: "h5" },
  { label: "Heading 6", Icon: Heading6, type: "h6" },
];

/* ─── Helper: detect heading type ─── */
export function $getActiveHeadingType(): HeadingType {
  const sel = $getSelection();
  if (!$isRangeSelection(sel)) return "paragraph";
  const anchor = sel.anchor.getNode();
  const el =
    anchor.getKey() === "root" ? anchor : anchor.getTopLevelElementOrThrow();
  if ($isHeadingNode(el)) return el.getTag() as HeadingType;
  return "paragraph";
}

/* ─── Helper: detect text formats ─── */
export interface TextFormatState {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrike: boolean;
  isSuperscript: boolean;
  isSubscript: boolean;
  isLink: boolean;
  align: ElementFormatType;
}

export function $getTextFormatState(): TextFormatState {
  const sel = $getSelection();
  if (!$isRangeSelection(sel)) {
    return {
      isBold: false,
      isItalic: false,
      isUnderline: false,
      isStrike: false,
      isSuperscript: false,
      isSubscript: false,
      isLink: false,
      align: "left",
    };
  }
  const anchor = sel.anchor.getNode();
  const el =
    anchor.getKey() === "root" ? anchor : anchor.getTopLevelElementOrThrow();
  return {
    isBold: sel.hasFormat("bold"),
    isItalic: sel.hasFormat("italic"),
    isUnderline: sel.hasFormat("underline"),
    isStrike: sel.hasFormat("strikethrough"),
    isSuperscript: sel.hasFormat("superscript"),
    isSubscript: sel.hasFormat("subscript"),
    isLink: $isLinkNode(anchor.getParent()) || $isLinkNode(anchor),
    align: $isElementNode(el) ? el.getFormatType() || "left" : "left",
  };
}

/* ─── Hook: useTextActions ─── */
export function useTextActions() {
  const [editor] = useLexicalComposerContext();

  const formatHeading = useCallback(
    (type: HeadingType) => {
      editor.update(() => {
        const sel = $getSelection();
        if (!$isRangeSelection(sel)) return;
        if (type === "paragraph") {
          $setBlocksType(sel, () => $createParagraphNode());
        } else {
          $setBlocksType(sel, () => $createHeadingNode(type as HeadingTagType));
        }
      });
    },
    [editor],
  );

  const formatText = useCallback(
    (format: TextFormatType) => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    },
    [editor],
  );

  const formatAlign = useCallback(
    (align: ElementFormatType) => {
      editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, align);
    },
    [editor],
  );

  const insertLink = useCallback(
    (url: string) => {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, {
        url,
        target: "_blank",
        rel: "noopener noreferrer",
      });
    },
    [editor],
  );

  const removeLink = useCallback(() => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
  }, [editor]);

  const insertDivider = useCallback(() => {
    editor.update(() => {
      const sel = $getSelection();
      if ($isRangeSelection(sel)) {
        const hr = $createParagraphNode();
        const text = $createTextNode("───────────────────────");
        hr.append(text);
        sel.anchor.getNode().getTopLevelElementOrThrow().insertAfter(hr);
        const after = $createParagraphNode();
        hr.insertAfter(after);
        after.selectStart();
      }
    });
  }, [editor]);

  const changeCase = useCallback(
    (mode: "upper" | "lower") => {
      editor.update(() => {
        const sel = $getSelection();
        if (!$isRangeSelection(sel)) return;
        const nodes = sel.getNodes();
        nodes.forEach((node) => {
          if ($isTextNode(node)) {
            const text = node.getTextContent();
            node.setTextContent(
              mode === "upper" ? text.toUpperCase() : text.toLowerCase(),
            );
          }
        });
      });
    },
    [editor],
  );

  const clearFormat = useCallback(() => {
    editor.update(() => {
      const sel = $getSelection();
      if (!$isRangeSelection(sel)) return;
      const nodes = sel.getNodes();
      nodes.forEach((node) => {
        if ($isTextNode(node)) {
          node.setFormat(0);
          node.setStyle("");
        }
      });
    });
  }, [editor]);

  return {
    formatHeading,
    formatText,
    formatAlign,
    insertLink,
    removeLink,
    insertDivider,
    changeCase,
    clearFormat,
  };
}

/* ─── Heading Dropdown ─── */
export function HeadingDropdown({
  activeHeading,
  ToolbarButton,
}: {
  activeHeading: HeadingType;
  ToolbarButton: React.ComponentType<{
    active?: boolean;
    onClick: () => void;
    title: string;
    children: React.ReactNode;
  }>;
}) {
  const [show, setShow] = useState(false);
  const { formatHeading } = useTextActions();
  const active =
    HEADING_BLOCKS.find((b) => b.type === activeHeading) || HEADING_BLOCKS[0];

  return (
    <div className="relative">
      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        onClick={() => setShow((p) => !p)}
        className="flex items-center gap-1.5 px-2 h-8 rounded-lg text-xs font-medium text-(--color-text) hover:bg-(--color-active-bg) border border-(--color-active-border) transition-all duration-150"
      >
        <active.Icon className="w-3.5 h-3.5 text-violet-400" />
        <span className="hidden sm:inline max-w-20 truncate">
          {active.label}
        </span>
        <ChevronDown className="w-3 h-3 text-(--color-gray)" />
      </motion.button>

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
              className="absolute top-full left-0 mt-1.5 z-10001 w-48 rounded-xl border border-(--color-active-border) bg-(--color-bg) shadow-2xl overflow-hidden"
            >
              {HEADING_BLOCKS.map(({ label, Icon, type }) => (
                <motion.button
                  key={type}
                  type="button"
                  whileHover={{ x: 4 }}
                  onClick={() => {
                    formatHeading(type);
                    setShow(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                    activeHeading === type
                      ? "text-violet-300 bg-violet-500/15"
                      : "text-(--color-text) hover:bg-(--color-active-bg)"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Link Input Bar ─── */
export function LinkInputBar({
  show,
  onClose,
}: {
  show: boolean;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const { insertLink } = useTextActions();

  const confirm = () => {
    if (url.trim()) insertLink(url.trim());
    setUrl("");
    onClose();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="overflow-hidden shrink-0"
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b border-(--color-active-border) bg-(--color-active-bg)">
            <Link className="w-4 h-4 text-violet-400 shrink-0" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirm();
                if (e.key === "Escape") {
                  setUrl("");
                  onClose();
                }
              }}
              placeholder="https://example.com"
              autoFocus
              className="flex-1 bg-transparent text-sm text-(--color-text) placeholder:text-(--color-gray) outline-none"
            />
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={confirm}
              className="px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
            >
              Add
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                setUrl("");
                onClose();
              }}
              className="p-1 rounded-lg hover:bg-(--color-active-bg) text-(--color-gray) hover:text-(--color-text) transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Text Format Toolbar Buttons ─── */
export function TextToolbarButtons({
  formatState,
  ToolbarButton,
  onShowLink,
}: {
  formatState: TextFormatState;
  ToolbarButton: React.ComponentType<{
    active?: boolean;
    onClick: () => void;
    title: string;
    children: React.ReactNode;
  }>;
  onShowLink: () => void;
}) {
  const {
    formatText,
    formatAlign,
    removeLink,
    insertDivider,
    changeCase,
    clearFormat,
  } = useTextActions();

  return (
    <>
      {/* Text formats */}
      <ToolbarButton
        active={formatState.isBold}
        onClick={() => formatText("bold")}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        active={formatState.isItalic}
        onClick={() => formatText("italic")}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        active={formatState.isUnderline}
        onClick={() => formatText("underline")}
        title="Underline (Ctrl+U)"
      >
        <Underline className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        active={formatState.isStrike}
        onClick={() => formatText("strikethrough")}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        active={formatState.isSuperscript}
        onClick={() => formatText("superscript")}
        title="Superscript"
      >
        <Superscript className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        active={formatState.isSubscript}
        onClick={() => formatText("subscript")}
        title="Subscript"
      >
        <Subscript className="w-4 h-4" />
      </ToolbarButton>

      {/* Separator */}
      <div className="w-px h-5 bg-(--color-active-border) mx-0.5 shrink-0" />

      {/* Alignment */}
      <ToolbarButton
        active={formatState.align === "left"}
        onClick={() => formatAlign("left")}
        title="Align Left"
      >
        <AlignLeft className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        active={formatState.align === "center"}
        onClick={() => formatAlign("center")}
        title="Align Center"
      >
        <AlignCenter className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        active={formatState.align === "right"}
        onClick={() => formatAlign("right")}
        title="Align Right"
      >
        <AlignRight className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        active={formatState.align === "justify"}
        onClick={() => formatAlign("justify")}
        title="Justify"
      >
        <AlignJustify className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-5 bg-(--color-active-border) mx-0.5 shrink-0" />

      {/* Link */}
      <ToolbarButton
        active={formatState.isLink}
        onClick={() => {
          if (formatState.isLink) removeLink();
          else onShowLink();
        }}
        title={formatState.isLink ? "Remove Link" : "Insert Link"}
      >
        {formatState.isLink ? (
          <Link2Off className="w-4 h-4" />
        ) : (
          <Link className="w-4 h-4" />
        )}
      </ToolbarButton>

      {/* Divider */}
      <ToolbarButton
        active={false}
        onClick={insertDivider}
        title="Insert Divider"
      >
        <Minus className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-5 bg-(--color-active-border) mx-0.5 shrink-0" />

      {/* Case */}
      <ToolbarButton
        active={false}
        onClick={() => changeCase("upper")}
        title="UPPERCASE"
      >
        <CaseUpper className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        active={false}
        onClick={() => changeCase("lower")}
        title="lowercase"
      >
        <CaseLower className="w-4 h-4" />
      </ToolbarButton>

      {/* Clear format */}
      <ToolbarButton
        active={false}
        onClick={clearFormat}
        title="Clear Formatting"
      >
        <RemoveFormatting className="w-4 h-4" />
      </ToolbarButton>
    </>
  );
}
