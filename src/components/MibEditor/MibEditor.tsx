// components/MibEditor/index.tsx
"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Controller, FieldValues } from "react-hook-form";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Minimize2, Undo, Redo } from "lucide-react";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $insertNodes,
  EditorState,
  UNDO_COMMAND,
  REDO_COMMAND,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
} from "lexical";
import { mergeRegister } from "@lexical/utils";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { TableNode, TableRowNode, TableCellNode } from "@lexical/table";

// ── Feature imports ──
import {
  ListToolbarButtons,
  $getActiveListType,
  type ListType,
  CheckListStyleInjector,
} from "./lists";
import {
  HeadingDropdown,
  TextToolbarButtons,
  LinkInputBar,
  $getActiveHeadingType,
  $getTextFormatState,
  type HeadingType,
  type TextFormatState,
} from "./text";
import { ColorToolbarButtons } from "./color";
import {
  CodeToolbarButtons,
  CodeHighlightPlugin,
  CodeActionMenuPlugin,
  $isInCodeBlock,
  CodeTabIndentPlugin,
  CodeExitPlugin,
} from "./code";
import { QuoteToolbarDropdown, $isInQuote } from "./quote";
import {
  TableToolbarButton,
  TableResizePlugin,
  TableContextMenuPlugin,
  FloatingTableToolbar,
  TableStyleInjector,
} from "./table";
import { FontFamilyDropdown, FontSizeDropdown, StickyNoteButton } from "./font";
import { EquationToolbarButton } from "./equation";
import { PollNode, ColumnsNode, StyledQuoteNode } from "./quote";

/* ═══════════════════ Editor Theme ═══════════════════ */

const editorTheme = {
  root: "outline-none break-words",
  paragraph:
    "mb-2 last:mb-0 leading-relaxed break-words overflow-wrap-anywhere",
  heading: {
    h1: "text-3xl font-bold mb-3 leading-tight text-(--color-text)",
    h2: "text-2xl font-semibold mb-2.5 leading-snug text-(--color-text)",
    h3: "text-xl font-semibold mb-2 leading-snug text-(--color-text)",
    h4: "text-lg font-semibold mb-2 text-(--color-text)",
    h5: "text-base font-semibold mb-1.5 text-(--color-text)",
    h6: "text-sm font-semibold mb-1.5 text-(--color-text) uppercase tracking-wide",
  },
  list: {
    nested: { listitem: "list-none" },
    ol: "list-decimal pl-6 my-2 space-y-1",
    ul: "list-disc pl-6 my-2 space-y-1",
    listitem: "leading-relaxed",
    listitemChecked: [
      "relative list-none pl-7 my-1 leading-relaxed",
      "line-through opacity-60",
      "before:content-['✓']",
      "before:absolute before:left-0 before:top-0.5",
      "before:flex before:items-center before:justify-center",
      "before:w-5 before:h-5",
      "before:rounded",
      "before:border before:border-violet-500",
      "before:bg-violet-500/20",
      "before:text-violet-300",
      "before:text-xs before:font-bold",
      "before:cursor-pointer",
    ].join(" "),
    listitemUnchecked: [
      "relative list-none pl-7 my-1 leading-relaxed",
      "before:content-['']",
      "before:absolute before:left-0 before:top-0.5",
      "before:flex before:items-center before:justify-center",
      "before:w-5 before:h-5",
      "before:rounded",
      "before:border before:border-[--color-active-border]",
      "before:bg-[--color-active-bg]",
      "before:cursor-pointer",
    ].join(" "),
  },
  quote:
    "border-l-4 border-violet-500 pl-4 my-3 italic text-(--color-gray) leading-relaxed",
  code: [
    "mib-code-block",
    "block relative",
    "bg-(--color-active-bg)",
    "text-(--color-text)",
    "border border-(--color-active-border)",
    "rounded-xl",
    "font-mono text-[13px]/[1.7]",
    "my-4",
    "pt-2 pb-2 pl-14 pr-12",
    "whitespace-pre-wrap", // ← pre থেকে pre-wrap
    "break-words", // ← break-all এর বদলে break-words
    "overflow-wrap-anywhere", // ← অতিরিক্ত safety
    "overflow-x-hidden", // ← overflow-x-auto বদলে hidden
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
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline underline-offset-2",
    strikethrough: "line-through",
    underlineStrikethrough: "underline line-through underline-offset-2",
    code: "bg-violet-500/15 border border-violet-500/25 rounded px-1.5 py-0.5 font-mono text-[0.8em] text-violet-300",
    superscript: "text-[0.7em] align-super",
    subscript: "text-[0.7em] align-sub",
  },
  link: "text-violet-400 underline underline-offset-2 hover:text-violet-300 cursor-pointer transition-colors",
  table: "mib-table",
  tableRow: "",
  tableCell: "mib-table-cell",
  tableCellHeader: "mib-table-cell-header",
  tableSelected: "bg-violet-500/15",
  tableCellSelected: "selected",
  tableScrollableWrapper: "mib-table-wrapper",
};

/* ═══════════════════ Editor Nodes ═══════════════════ */

const EDITOR_NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  CodeNode,
  CodeHighlightNode,
  TableNode,
  TableRowNode,
  TableCellNode,
  PollNode,
  ColumnsNode,
  StyledQuoteNode,
] as const;

/* ═══════════════════ Internal Plugins ═══════════════════ */

function HtmlSyncPlugin({
  onChange,
  initialHtml,
}: {
  onChange: (v: string) => void;
  initialHtml?: string;
}) {
  const [editor] = useLexicalComposerContext();
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current || !initialHtml) {
      didInit.current = true;
      return;
    }
    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(initialHtml, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);
      $getRoot().clear();
      $insertNodes(nodes);
    });
    didInit.current = true;
  }, [editor, initialHtml]);

  const handleChange = useCallback(
    (state: EditorState) => {
      state.read(
        () => {
          const html = $generateHtmlFromNodes(editor);
          onChange(html === "<p><br></p>" ? "" : html);
        },
        { editor },
      );
    },
    [editor, onChange],
  );

  return <OnChangePlugin onChange={handleChange} />;
}

function WordCount() {
  const [editor] = useLexicalComposerContext();
  const [words, setWords] = useState(0);
  const [chars, setChars] = useState(0);

  useEffect(
    () =>
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          const text = $getRoot().getTextContent();
          setChars(text.length);
          setWords(text.trim() ? text.trim().split(/\s+/).length : 0);
        });
      }),
    [editor],
  );

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 border-t border-(--color-active-border) bg-(--color-active-bg) shrink-0">
      <span className="text-xs text-(--color-gray)">{words} words</span>
      <span className="text-xs text-(--color-gray)">•</span>
      <span className="text-xs text-(--color-gray)">{chars} chars</span>
    </div>
  );
}

function AutoFocusPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editor.focus();
  }, [editor]);
  return null;
}

/* ═══════════════════ Toolbar ═══════════════════ */

function Toolbar({ onClose }: { onClose: () => void }) {
  const [editor] = useLexicalComposerContext();

  const [headingType, setHeadingType] = useState<HeadingType>("paragraph");
  const [listType, setListType] = useState<ListType | null>(null);
  const [textFormat, setTextFormat] = useState<TextFormatState>({
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrike: false,
    isSuperscript: false,
    isSubscript: false,
    isLink: false,
    align: "left",
  });
  const [isInlineCode, setIsInlineCode] = useState(false);
  const [isCodeBlock, setIsCodeBlock] = useState(false);
  const [isQuote, setIsQuote] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [showLink, setShowLink] = useState(false);

  const updateToolbar = useCallback(() => {
    const sel = $getSelection();
    if (!$isRangeSelection(sel)) return;
    setHeadingType($getActiveHeadingType());
    setListType($getActiveListType());
    setTextFormat($getTextFormatState());
    setIsInlineCode(sel.hasFormat("code"));
    setIsCodeBlock($isInCodeBlock());
    setIsQuote($isInQuote());
  }, []);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) =>
        editorState.read(updateToolbar),
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (v) => {
          setCanUndo(v);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (v) => {
          setCanRedo(v);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    );
  }, [editor, updateToolbar]);

  const TB = useCallback(
    ({
      active,
      onClick,
      title,
      children,
      btnDisabled,
    }: {
      active?: boolean;
      onClick: () => void;
      title: string;
      children: React.ReactNode;
      btnDisabled?: boolean;
    }) => (
      <motion.button
        type="button"
        whileTap={{ scale: 0.88 }}
        onClick={onClick}
        title={title}
        disabled={btnDisabled}
        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed ${
          active
            ? "bg-violet-500/30 text-violet-300"
            : "text-(--color-gray) hover:text-(--color-text) hover:bg-(--color-active-bg)"
        }`}
      >
        {children}
      </motion.button>
    ),
    [],
  );

  const Sep = () => (
    <div className="w-px h-5 bg-(--color-active-border) mx-0.5 shrink-0" />
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-(--color-active-border) bg-(--color-active-bg) shrink-0">
        <TB
          btnDisabled={!canUndo}
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </TB>
        <TB
          btnDisabled={!canRedo}
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </TB>
        <Sep />

        <FontFamilyDropdown ToolbarButton={TB} />
        <FontSizeDropdown ToolbarButton={TB} />
        <Sep />

        <HeadingDropdown activeHeading={headingType} ToolbarButton={TB} />
        <Sep />

        <TextToolbarButtons
          formatState={textFormat}
          ToolbarButton={TB}
          onShowLink={() => setShowLink(true)}
        />
        <Sep />

        <ColorToolbarButtons ToolbarButton={TB} />
        <Sep />

        <ListToolbarButtons
          activeListType={listType}
          ToolbarButton={TB}
          showExtraActions
        />
        <Sep />

        <QuoteToolbarDropdown isQuoteActive={isQuote} ToolbarButton={TB} />
        <Sep />

        <CodeToolbarButtons
          isInlineCode={isInlineCode}
          isCodeBlock={isCodeBlock}
          ToolbarButton={TB}
        />
        <Sep />

        <TableToolbarButton ToolbarButton={TB} />
        <Sep />

        <EquationToolbarButton ToolbarButton={TB} />
        <StickyNoteButton ToolbarButton={TB} />

        <div className="ml-auto">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            title="Close editor"
            className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-xs font-medium text-(--color-gray) hover:text-(--color-text) hover:bg-(--color-active-bg) border border-(--color-active-border) transition-all duration-150"
          >
            <Minimize2 className="w-4 h-4" />
            <span className="hidden sm:inline">Done</span>
          </motion.button>
        </div>
      </div>

      <LinkInputBar show={showLink} onClose={() => setShowLink(false)} />
    </>
  );
}

/* ═══════════════════ Editor Inner ═══════════════════ */

function EditorInner({
  onChange,
  placeholder,
  disabled,
  onClose,
  initialValue,
}: {
  onChange: (v: string) => void;
  placeholder: string;
  disabled: boolean;
  onClose: () => void;
  initialValue?: string;
}) {
  return (
    <>
      <Toolbar onClose={onClose} />
      <div className="relative flex-1 overflow-y-auto">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="outline-none w-full px-4 py-3 text-(--color-text) text-sm leading-relaxed wrap-break-word overflow-wrap-anywhere"
              style={{
                minHeight: "calc(100dvh - 160px)",
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? "not-allowed" : "text",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
              }}
            />
          }
          placeholder={
            <div className="pointer-events-none absolute top-3 left-4 text-(--color-gray) text-sm select-none">
              {placeholder}
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <TableResizePlugin />
      </div>
      <AnimatePresence>
        <FloatingTableToolbar />
      </AnimatePresence>
      <WordCount />
      <HistoryPlugin />
      <ListPlugin />
      <CheckListPlugin />
      <CheckListStyleInjector /> {/* ← এটা add করো */}
      <LinkPlugin />
      <TabIndentationPlugin />
      <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
      <HtmlSyncPlugin onChange={onChange} initialHtml={initialValue} />
      <CodeHighlightPlugin />
      <AutoFocusPlugin />
      <CodeTabIndentPlugin />
      <CodeExitPlugin />
      <CodeActionMenuPlugin />
      <TablePlugin hasCellMerge hasCellBackgroundColor={false} />
      <TableContextMenuPlugin />
      <TableStyleInjector />
    </>
  );
}

/* ═══════════════════ MibEditor (Main Export) ═══════════════════ */

interface MibEditorProps<T extends FieldValues = any> {
  name: any;
  control: any;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}

export function MibEditor<T extends FieldValues = any>({
  name,
  control,
  placeholder = "Write something...",
  rows = 6,
  disabled = false,
}: MibEditorProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // ✅ Stable unique namespace per component instance
  const namespace = useRef(
    `MibEditor-${Math.random().toString(36).slice(2, 7)}`,
  );

  // ✅ Config created once per component mount — never recreated
  const editorConfig = useMemo(
    () => ({
      namespace: namespace.current,
      theme: editorTheme,
      onError: (error: Error) => console.error("MibEditor:", error),
      nodes: [...EDITOR_NODES],
    }),
    [],
  );

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, mounted]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const hasContent =
          field.value &&
          field.value.trim() !== "" &&
          field.value !== "<p><br></p>";

        return (
          <>
            {/* ── Preview Card ── */}
            <motion.div
              whileHover={
                disabled ? {} : { borderColor: "rgba(139,92,246,0.6)" }
              }
              whileTap={disabled ? {} : { scale: 0.995 }}
              onClick={() => !disabled && setIsOpen(true)}
              role="button"
              tabIndex={disabled ? -1 : 0}
              onKeyDown={(e) => {
                if (!disabled && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  setIsOpen(true);
                }
              }}
              className={`relative rounded-xl border border-(--color-active-border) bg-(--color-active-bg) transition-all duration-200 overflow-hidden hover:shadow-[0_0_0_3px_rgba(139,92,246,0.12)] ${
                disabled
                  ? "opacity-50 cursor-not-allowed pointer-events-none"
                  : "cursor-text"
              }`}
              style={{ minHeight: `${rows * 1.9}rem` }}
            >
              <div className="px-4 py-3">
                {hasContent ? (
                  <div
                    className="text-sm text-(--color-text) leading-relaxed line-clamp-5 select-none
                    [&_p]:mb-1 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold
                    [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:text-base [&_h4]:font-semibold
                    [&_h5]:text-sm [&_h5]:font-semibold [&_h6]:text-xs [&_h6]:font-semibold [&_h6]:uppercase
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
                    [&_blockquote]:border-l-4 [&_blockquote]:border-violet-500 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-(--color-gray)
                    [&_code]:bg-violet-500/15 [&_code]:px-1 [&_code]:rounded [&_a]:text-violet-400 [&_a]:underline
                    [&_table]:w-full [&_table]:border-collapse [&_table]:my-2 [&_table]:border [&_table]:border-(--color-active-border)
                    [&_td]:border [&_td]:border-(--color-active-border) [&_td]:px-2 [&_td]:py-1
                    [&_th]:border [&_th]:border-(--color-active-border) [&_th]:px-2 [&_th]:py-1 [&_th]:font-semibold [&_th]:bg-(--color-active-bg)"
                    dangerouslySetInnerHTML={{ __html: field.value }}
                  />
                ) : (
                  <p className="text-sm text-(--color-gray) select-none">
                    {placeholder}
                  </p>
                )}
              </div>
              {!disabled && (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute inset-0 bg-violet-500/5 flex items-center justify-center"
                >
                  <div className="flex items-center gap-2 text-violet-300 text-xs font-medium bg-(--color-bg) px-3 py-1.5 rounded-full border border-violet-500/30 shadow-lg pointer-events-none">
                    <FileText className="w-3.5 h-3.5" />
                    Click to edit
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* ── Fullscreen Editor ── */}
            {isOpen &&
              mounted &&
              createPortal(
                <AnimatePresence>
                  <motion.div
                    key="mib-fullscreen"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-9999 flex flex-col bg-(--color-bg)"
                    style={{ height: "100dvh", width: "100dvw" }}
                  >
                    {/* Header */}
                    <motion.div
                      initial={{ y: -24, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.05, duration: 0.18 }}
                      className="flex items-center justify-between px-4 py-3 border-b border-(--color-active-border) bg-(--color-active-bg) shrink-0"
                    >
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{ scale: [1, 1.35, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="w-2 h-2 rounded-full bg-violet-500"
                        />
                        <span className="text-sm font-semibold text-(--color-text) bangla">
                          বিবরণ লিখুন
                        </span>
                      </div>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.9, rotate: 90 }}
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 rounded-lg hover:bg-(--color-active-bg) text-(--color-gray) hover:text-(--color-text) transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </motion.button>
                    </motion.div>

                    {/* ✅ Use editorConfig instead of initialConfig */}
                    <LexicalComposer initialConfig={editorConfig}>
                      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                        <EditorInner
                          onChange={field.onChange}
                          placeholder={placeholder}
                          disabled={disabled}
                          onClose={() => setIsOpen(false)}
                          initialValue={field.value}
                        />
                      </div>
                    </LexicalComposer>
                  </motion.div>
                </AnimatePresence>,
                document.body,
              )}
          </>
        );
      }}
    />
  );
}
