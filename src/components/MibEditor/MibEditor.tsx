"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { Control, Controller, FieldValues } from "react-hook-form";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Link,
  Link2Off,
  Undo,
  Redo,
  Type,
  Minus,
  ChevronDown,
  Minimize2,
  FileText,
  CheckSquare,
  Palette,
  Highlighter,
  Copy,
  Check,
} from "lucide-react";

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
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  EditorState,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  $isElementNode,
  ElementFormatType,
  $insertNodes,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
} from "lexical";
import { $setBlocksType, $patchStyleText } from "@lexical/selection";
import {
  $isHeadingNode,
  $createHeadingNode,
  $isQuoteNode,
  $createQuoteNode,
  HeadingTagType,
  HeadingNode,
  QuoteNode,
} from "@lexical/rich-text";
import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  ListNode,
  ListItemNode,
} from "@lexical/list";
import {
  $isLinkNode,
  TOGGLE_LINK_COMMAND,
  LinkNode,
  AutoLinkNode,
} from "@lexical/link";
import {
  $isCodeNode,
  $createCodeNode,
  CodeNode,
  CodeHighlightNode,
  registerCodeHighlighting,
} from "@lexical/code";
import { $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import {
  BlockInfo,
  BlockType,
  MibEditorProps,
} from "@/src/types/MibEditorTypes";

// ── Theme ─────────────────────────────────────
const editorTheme = {
  root: "outline-none",
  paragraph: "mb-2 last:mb-0 leading-relaxed",
  heading: {
    h1: "text-3xl font-bold mb-3 leading-tight text-[var(--color-text)]",
    h2: "text-2xl font-semibold mb-2.5 leading-snug text-[var(--color-text)]",
    h3: "text-xl font-semibold mb-2 leading-snug text-[var(--color-text)]",
  },
  list: {
    nested: { listitem: "list-none" },
    ol: "list-decimal pl-6 my-2 space-y-1",
    ul: "list-disc pl-6 my-2 space-y-1",
    listitem: "leading-relaxed",
    listitemChecked: "line-through opacity-50",
    listitemUnchecked: "",
  },
  quote:
    "border-l-4 border-violet-500 pl-4 my-3 italic text-[var(--color-gray)] leading-relaxed",
  // ✅ Code block has top padding (pt-12) to make space for the floating header
  code: "mib-code-block block relative bg-[#1e1e24] text-gray-200 border border-violet-500/20 rounded-lg pt-12 pb-4 px-4 font-mono text-sm leading-relaxed my-4 whitespace-pre-wrap break-words overflow-hidden",
  codeHighlight: {
    atrule: "text-purple-400",
    attr: "text-blue-400",
    boolean: "text-orange-400",
    builtin: "text-green-400",
    cdata: "text-gray-500",
    char: "text-green-300",
    class: "text-blue-300",
    "class-name": "text-blue-300",
    comment: "text-gray-500 italic",
    constant: "text-orange-400",
    deleted: "text-red-400",
    doctype: "text-gray-500",
    entity: "text-yellow-400",
    function: "text-blue-400",
    important: "text-orange-400 font-bold",
    inserted: "text-green-400",
    keyword: "text-purple-400",
    namespace: "text-purple-300",
    number: "text-orange-400",
    operator: "text-yellow-400",
    prolog: "text-gray-500",
    property: "text-orange-400",
    punctuation: "text-gray-400",
    regex: "text-orange-400",
    selector: "text-green-400",
    string: "text-green-300",
    symbol: "text-orange-400",
    tag: "text-orange-400",
    url: "text-yellow-400",
    variable: "text-orange-300",
  },
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline underline-offset-2",
    strikethrough: "line-through",
    underlineStrikethrough: "underline line-through underline-offset-2",
    code: "bg-violet-500/15 border border-violet-500/25 rounded px-1.5 py-0.5 font-mono text-[0.8em] text-violet-300",
  },
  link: "text-violet-400 underline underline-offset-2 hover:text-violet-300 cursor-pointer transition-colors",
};

// ── Colors for Editor ─────────────────────────────────────
const TEXT_COLORS = [
  "#ffffff",
  "#f87171",
  "#fb923c",
  "#facc15",
  "#4ade80",
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
  "#9ca3af",
  "#000000",
];

const BG_COLORS = [
  "transparent",
  "#f8717140",
  "#fb923c40",
  "#facc1540",
  "#4ade8040",
  "#60a5fa40",
  "#a78bfa40",
  "#f472b640",
  "#9ca3af40",
  "#ffffff40",
];

// ── Lexical initial config ──────────────────────────────
const initialConfig = {
  namespace: "MibEditor",
  theme: editorTheme,
  onError: (error: Error) => console.error("MibEditor:", error),
  nodes: [
    HeadingNode,
    QuoteNode,
    ListNode,
    ListItemNode,
    LinkNode,
    AutoLinkNode,
    CodeNode,
    CodeHighlightNode,
  ],
};

const BLOCK_TYPES: Record<BlockType, BlockInfo> = {
  paragraph: { label: "Normal", Icon: Type },
  h1: { label: "Heading 1", Icon: Heading1 },
  h2: { label: "Heading 2", Icon: Heading2 },
  h3: { label: "Heading 3", Icon: Heading3 },
  bullet: { label: "Bullet List", Icon: List },
  number: { label: "Numbered List", Icon: ListOrdered },
  check: { label: "Check List", Icon: CheckSquare },
  quote: { label: "Quote", Icon: Quote },
  code: { label: "Code Block", Icon: Code2 },
};

// ── Plugins ────────────────────────────────────────────────────────────

// ✅ Enable Code Highlighting Styles
function CodeHighlightPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return registerCodeHighlighting(editor);
  }, [editor]);
  return null;
}

// ✅ Safe Code Action Overlay (Prevents Node removeChild Error)
function CodeHeaderOverlay({ dom }: { dom: HTMLElement }) {
  const [isCopied, setIsCopied] = useState(false);
  const [rect, setRect] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const updateRect = () => {
      setRect({
        top: dom.offsetTop,
        left: dom.offsetLeft,
        width: dom.offsetWidth,
      });
    };

    updateRect();
    const observer = new ResizeObserver(updateRect);
    observer.observe(dom);
    return () => observer.disconnect();
  }, [dom]);

  if (!rect.width) return null;

  return (
    <div
      className="absolute z-10 flex items-center justify-between px-4 py-2 bg-[#282a36] border-b border-gray-700/60 rounded-t-lg select-none"
      style={{ top: rect.top, left: rect.left, width: rect.width }}
    >
      <span className="text-[11px] text-gray-400 font-sans font-semibold uppercase tracking-widest">
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
        className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors cursor-pointer outline-none"
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

// Tracks all Code Nodes and safely renders overlays OUTSIDE of ContentEditable
function CodeActionOverlays() {
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

// ── HtmlSyncPlugin ────────────────────────────────────────────────────────────
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
    <div className="flex items-center gap-3 px-3 py-1.5 border-t border-white/10 bg-white/5 shrink-0">
      <span className="text-xs text-gray-500">{words} words</span>
      <span className="text-xs text-gray-600">•</span>
      <span className="text-xs text-gray-500">{chars} chars</span>
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

// ── Toolbar ───────────────────────────────────────────────────────────────────
function Toolbar({ onClose }: { onClose: () => void }) {
  const [editor] = useLexicalComposerContext();

  const [blockType, setBlockType] = useState<BlockType>("paragraph");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrike, setIsStrike] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [align, setAlign] = useState<ElementFormatType>("left");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [showBlocks, setShowBlocks] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const [showTextColor, setShowTextColor] = useState(false);
  const [showBgColor, setShowBgColor] = useState(false);

  const updateToolbar = useCallback(() => {
    const sel = $getSelection();
    if (!$isRangeSelection(sel)) return;

    setIsBold(sel.hasFormat("bold"));
    setIsItalic(sel.hasFormat("italic"));
    setIsUnderline(sel.hasFormat("underline"));
    setIsStrike(sel.hasFormat("strikethrough"));
    setIsCode(sel.hasFormat("code"));

    const anchor = sel.anchor.getNode();
    const el =
      anchor.getKey() === "root" ? anchor : anchor.getTopLevelElementOrThrow();

    if ($isHeadingNode(el)) setBlockType(el.getTag() as BlockType);
    else if ($isListNode(el)) {
      const parent = $getNearestNodeOfType<ListNode>(anchor, ListNode);
      const lt = parent ? parent.getListType() : el.getListType();
      setBlockType(
        lt === "bullet" ? "bullet" : lt === "check" ? "check" : "number",
      );
    } else if ($isQuoteNode(el)) setBlockType("quote");
    else if ($isCodeNode(el)) setBlockType("code");
    else setBlockType("paragraph");

    if ($isElementNode(el)) setAlign(el.getFormatType() || "left");

    const node = sel.anchor.getNode();
    setIsLink($isLinkNode(node.getParent()) || $isLinkNode(node));
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

  const applyStyleText = useCallback(
    (styles: Record<string, string>) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, styles);
        }
      });
      setShowTextColor(false);
      setShowBgColor(false);
    },
    [editor],
  );

  const formatBlock = useCallback(
    (type: BlockType) => {
      setShowBlocks(false);
      if (type === "bullet") {
        editor.dispatchCommand(
          blockType === "bullet"
            ? REMOVE_LIST_COMMAND
            : INSERT_UNORDERED_LIST_COMMAND,
          undefined,
        );
      } else if (type === "number") {
        editor.dispatchCommand(
          blockType === "number"
            ? REMOVE_LIST_COMMAND
            : INSERT_ORDERED_LIST_COMMAND,
          undefined,
        );
      } else if (type === "check") {
        editor.dispatchCommand(
          blockType === "check"
            ? REMOVE_LIST_COMMAND
            : INSERT_CHECK_LIST_COMMAND,
          undefined,
        );
      } else {
        editor.update(() => {
          const sel = $getSelection();
          if (!$isRangeSelection(sel)) return;

          if (type === "paragraph") {
            $setBlocksType(sel, () => $createParagraphNode());
          } else if (type === "h1" || type === "h2" || type === "h3") {
            $setBlocksType(sel, () =>
              $createHeadingNode(type as HeadingTagType),
            );
          } else if (type === "quote") {
            $setBlocksType(sel, () => $createQuoteNode());
          } else if (type === "code") {
            $setBlocksType(sel, () => $createCodeNode());
          }
        });
      }
    },
    [blockType, editor],
  );

  const confirmLink = useCallback(() => {
    if (linkUrl.trim()) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, {
        url: linkUrl.trim(),
        target: "_blank",
        rel: "noopener noreferrer",
      });
    }
    setShowLink(false);
    setLinkUrl("");
  }, [linkUrl, editor]);

  const B = ({
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
          : "text-gray-400 hover:text-gray-200 hover:bg-white/10"
      }`}
    >
      {children}
    </motion.button>
  );

  const Sep = () => <div className="w-px h-5 bg-white/10 mx-0.5 shrink-0" />;

  const { Icon: BlockIcon, label: blockLabel } = BLOCK_TYPES[blockType];

  return (
    <>
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-white/10 bg-white/5 shrink-0">
        <B
          btnDisabled={!canUndo}
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </B>
        <B
          btnDisabled={!canRedo}
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </B>

        <Sep />

        <div className="relative">
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowBlocks((p) => !p)}
            className="flex items-center gap-1.5 px-2 h-8 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 border border-white/10 transition-all duration-150"
          >
            <BlockIcon className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden sm:inline max-w-20 truncate">
              {blockLabel}
            </span>
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </motion.button>

          <AnimatePresence>
            {showBlocks && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.13 }}
                className="absolute top-full left-0 mt-1.5 z-[10001] w-48 rounded-xl border border-white/10 bg-gray-900/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden"
              >
                {(Object.entries(BLOCK_TYPES) as [BlockType, BlockInfo][]).map(
                  ([type, { label, Icon }]) => (
                    <motion.button
                      key={type}
                      type="button"
                      whileHover={{ x: 4 }}
                      onClick={() => formatBlock(type)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                        blockType === type
                          ? "text-violet-300 bg-violet-500/15"
                          : "text-gray-300 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {label}
                    </motion.button>
                  ),
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Sep />

        <B
          active={isBold}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </B>
        <B
          active={isItalic}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </B>
        <B
          active={isUnderline}
          onClick={() =>
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")
          }
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </B>
        <B
          active={isStrike}
          onClick={() =>
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
          }
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </B>

        <div className="relative">
          <B
            active={showTextColor}
            onClick={() => {
              setShowTextColor(!showTextColor);
              setShowBgColor(false);
              setShowBlocks(false);
            }}
            title="Text Color"
          >
            <Palette className="w-4 h-4" />
          </B>
          <AnimatePresence>
            {showTextColor && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute top-full left-0 mt-1.5 z-[10001] w-40 p-2 rounded-xl border border-white/10 bg-gray-900/95 backdrop-blur-xl shadow-2xl"
              >
                <div className="grid grid-cols-5 gap-1.5">
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => applyStyleText({ color })}
                      className="w-5 h-5 rounded-full border border-white/20 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <B
            active={showBgColor}
            onClick={() => {
              setShowBgColor(!showBgColor);
              setShowTextColor(false);
              setShowBlocks(false);
            }}
            title="Highlight Color"
          >
            <Highlighter className="w-4 h-4" />
          </B>
          <AnimatePresence>
            {showBgColor && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute top-full left-0 mt-1.5 z-[10001] w-40 p-2 rounded-xl border border-white/10 bg-gray-900/95 backdrop-blur-xl shadow-2xl"
              >
                <div className="grid grid-cols-5 gap-1.5">
                  {BG_COLORS.map((bg) => (
                    <button
                      key={bg}
                      onClick={() => applyStyleText({ "background-color": bg })}
                      className="w-5 h-5 rounded-full border border-white/20 hover:scale-110 transition-transform bg-checkered-pattern"
                      style={{
                        backgroundColor: bg === "transparent" ? "#222" : bg,
                      }}
                      title={bg}
                    >
                      {bg === "transparent" && (
                        <X className="w-3 h-3 text-white/50 m-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <B
          active={isCode}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
          title="Inline Code"
        >
          <Code className="w-4 h-4" />
        </B>

        <Sep />

        <B
          active={align === "left"}
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </B>
        <B
          active={align === "center"}
          onClick={() =>
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")
          }
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </B>
        <B
          active={align === "right"}
          onClick={() =>
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")
          }
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </B>
        <B
          active={align === "justify"}
          onClick={() =>
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify")
          }
          title="Justify"
        >
          <AlignJustify className="w-4 h-4" />
        </B>

        <Sep />

        <B
          active={isLink}
          onClick={() => {
            if (isLink) {
              editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
            } else {
              setShowLink(true);
            }
          }}
          title={isLink ? "Remove Link" : "Insert Link"}
        >
          {isLink ? (
            <Link2Off className="w-4 h-4" />
          ) : (
            <Link className="w-4 h-4" />
          )}
        </B>

        <B
          active={false}
          onClick={() => {
            editor.update(() => {
              const sel = $getSelection();
              if ($isRangeSelection(sel)) {
                const p = $createParagraphNode();
                sel.anchor.getNode().getTopLevelElementOrThrow().insertAfter(p);
              }
            });
          }}
          title="Insert Divider"
        >
          <Minus className="w-4 h-4" />
        </B>

        <div className="ml-auto">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            title="Close editor"
            className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/10 border border-white/10 transition-all duration-150"
          >
            <Minimize2 className="w-4 h-4" />
            <span className="hidden sm:inline">Done</span>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showLink && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden shrink-0"
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-violet-950/30">
              <Link className="w-4 h-4 text-violet-400 shrink-0" />
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmLink();
                  if (e.key === "Escape") {
                    setShowLink(false);
                    setLinkUrl("");
                  }
                }}
                placeholder="https://example.com"
                autoFocus
                className="flex-1 bg-transparent text-sm text-gray-200 placeholder:text-gray-600 outline-none"
              />
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={confirmLink}
                className="px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
              >
                Add
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  setShowLink(false);
                  setLinkUrl("");
                }}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(showBlocks || showTextColor || showBgColor) && (
        <div
          className="fixed inset-0 z-[10000]"
          onClick={() => {
            setShowBlocks(false);
            setShowTextColor(false);
            setShowBgColor(false);
          }}
        />
      )}
    </>
  );
}

// ── EditorInner ───────────────────────────────────────────────────────────────
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
        {/* ✅ Safe React Overlay Component (Rendered OUTSIDE Lexical) */}
        <CodeActionOverlays />

        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="outline-none w-full px-4 py-3 text-gray-200 text-sm leading-relaxed"
              style={{
                minHeight: "calc(100dvh - 160px)",
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? "not-allowed" : "text",
              }}
            />
          }
          placeholder={
            <div className="pointer-events-none absolute top-3 left-4 text-gray-600 text-sm select-none">
              {placeholder}
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
      </div>

      <WordCount />

      <HistoryPlugin />
      <ListPlugin />
      <CheckListPlugin />
      <LinkPlugin />
      <TabIndentationPlugin />
      <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
      <HtmlSyncPlugin onChange={onChange} initialHtml={initialValue} />

      {/* ✅ Plugin for Code Highlighting */}
      <CodeHighlightPlugin />
      <AutoFocusPlugin />
    </>
  );
}

// ── MibEditor (public export) ───────────────────
export function MibEditor<T extends FieldValues = any>({
  name,
  control,
  placeholder = "Write something...",
  rows = 6,
  disabled = false,
}: MibEditorProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

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
              className={`
                relative rounded-xl border border-white/10 bg-white/5
                transition-all duration-200 overflow-hidden
                hover:shadow-[0_0_0_3px_rgba(139,92,246,0.12)]
                ${
                  disabled
                    ? "opacity-50 cursor-not-allowed pointer-events-none"
                    : "cursor-text"
                }
              `}
              style={{ minHeight: `${rows * 1.9}rem` }}
            >
              <div className="px-4 py-3">
                {hasContent ? (
                  <div
                    className="text-sm text-gray-300 leading-relaxed line-clamp-5 select-none [&_p]:mb-1 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-violet-500 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-400 [&_code]:bg-violet-500/15 [&_code]:px-1 [&_code]:rounded [&_a]:text-violet-400 [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: field.value }}
                  />
                ) : (
                  <p className="text-sm text-gray-600 select-none">
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
                  <div className="flex items-center gap-2 text-violet-300 text-xs font-medium bg-gray-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-violet-500/30 shadow-lg pointer-events-none">
                    <FileText className="w-3.5 h-3.5" />
                    Click to edit
                  </div>
                </motion.div>
              )}
            </motion.div>

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
                    className="fixed inset-0 z-[9999] flex flex-col bg-gray-950"
                    style={{ height: "100dvh", width: "100dvw" }}
                  >
                    <motion.div
                      initial={{ y: -24, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.05, duration: 0.18 }}
                      className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gray-900/80 backdrop-blur-sm shrink-0"
                    >
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{ scale: [1, 1.35, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="w-2 h-2 rounded-full bg-violet-500"
                        />
                        <span className="text-sm font-semibold text-gray-200 bangla">
                          বিবরণ লিখুন
                        </span>
                      </div>

                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.9, rotate: 90 }}
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-gray-200 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </motion.button>
                    </motion.div>

                    <LexicalComposer initialConfig={initialConfig}>
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
