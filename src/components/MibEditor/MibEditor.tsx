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
  Table,
  Trash2,
  Grid3X3,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Merge,
  SplitSquareHorizontal,
  ToggleLeft,
  Rows3,
  Columns3,
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
  $createTextNode,
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
  LexicalEditor,
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
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import {
  $createTableNode,
  $createTableRowNode,
  $createTableCellNode,
  $isTableNode,
  $isTableRowNode,
  $isTableCellNode,
  TableCellHeaderStates,
  TableNode,
  TableRowNode,
  TableCellNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $deleteTableColumn__EXPERIMENTAL,
  $deleteTableRow__EXPERIMENTAL,
  $insertTableColumn__EXPERIMENTAL,
  $insertTableRow__EXPERIMENTAL,
  $unmergeCell,
  $isTableSelection,
} from "@lexical/table";
import {
  BlockInfo,
  BlockType,
  MibEditorProps,
} from "@/src/types/MibEditorTypes";

/* ─────────────────────────── helpers ─────────────────────────── */

function $findAncestor<T>(node: any, check: (n: any) => n is T): T | null {
  let cur = node;
  while (cur && cur.getKey?.() !== "root") {
    if (check(cur)) return cur;
    cur = cur.getParent?.() ?? null;
  }
  return null;
}

function $mergeTableCellsAtSelection(editor: LexicalEditor) {
  editor.update(() => {
    const sel = $getSelection();
    if (!$isTableSelection(sel)) return;
    const nodes = sel.getNodes();
    const cells = nodes.filter($isTableCellNode);
    if (cells.length < 2) return;
    let minRow = Infinity,
      maxRow = -1,
      minCol = Infinity,
      maxCol = -1;
    const table = $findAncestor(cells[0], $isTableNode);
    if (!table) return;
    const rows = table.getChildren().filter($isTableRowNode);
    cells.forEach((cell) => {
      const row = cell.getParent();
      if (!$isTableRowNode(row)) return;
      const ri = rows.indexOf(row);
      const ci = row.getChildren().indexOf(cell);
      const colSpan = cell.getColSpan?.() ?? 1;
      const rowSpan = cell.getRowSpan?.() ?? 1;
      minRow = Math.min(minRow, ri);
      maxRow = Math.max(maxRow, ri + rowSpan - 1);
      minCol = Math.min(minCol, ci);
      maxCol = Math.max(maxCol, ci + colSpan - 1);
    });
    const targetCell = (rows[minRow] as TableRowNode).getChildren()[minCol] as
      | TableCellNode
      | undefined;
    if (!targetCell) return;
    const texts: string[] = [];
    for (let r = minRow; r <= maxRow; r++) {
      const row = rows[r] as TableRowNode;
      const rowCells = row.getChildren();
      for (let c = minCol; c <= maxCol; c++) {
        const cell = rowCells[c] as TableCellNode | undefined;
        if (!cell || cell === targetCell) continue;
        const text = cell.getTextContent().trim();
        if (text) texts.push(text);
        cell.remove();
      }
    }
    targetCell.setColSpan(maxCol - minCol + 1);
    targetCell.setRowSpan(maxRow - minRow + 1);
    if (texts.length > 0) {
      texts.forEach((t) => {
        const para = $createParagraphNode();
        para.append($createTextNode(t));
        targetCell.append(para);
      });
    }
  });
}

function $unmergeCellAtSelection(editor: LexicalEditor) {
  editor.update(() => {
    const sel = $getSelection();
    if (!$isRangeSelection(sel)) return;
    const cell = $findAncestor(sel.anchor.getNode(), $isTableCellNode);
    if (!cell) return;
    const colSpan = cell.getColSpan?.() ?? 1;
    const rowSpan = cell.getRowSpan?.() ?? 1;
    if (colSpan <= 1 && rowSpan <= 1) return;
    try {
      $unmergeCell();
    } catch {
      cell.setColSpan(1);
      cell.setRowSpan(1);
    }
  });
}

function $toggleHeaderRow(editor: LexicalEditor) {
  editor.update(() => {
    const sel = $getSelection();
    if (!$isRangeSelection(sel)) return;
    const table = $findAncestor(sel.anchor.getNode(), $isTableNode);
    if (!table) return;
    const firstRow = table.getFirstChild();
    if (!$isTableRowNode(firstRow)) return;
    firstRow.getChildren().forEach((cell) => {
      if ($isTableCellNode(cell)) {
        const isHeader = cell.getHeaderStyles?.() === TableCellHeaderStates.ROW;
        cell.setHeaderStyles(
          isHeader
            ? TableCellHeaderStates.NO_STATUS
            : TableCellHeaderStates.ROW,
        );
      }
    });
  });
}

/* ─────────────────────── Table Styles (injected) ─────────────────────── */

function TableStyleInjector() {
  useEffect(() => {
    const id = "mib-table-styles";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      /* ── MS-Word-like table borders ── */
      .mib-table {
        border-collapse: collapse !important;
        table-layout: fixed;
        border: 2px solid var(--color-active-border) !important;
        border-radius: 0 !important;
        overflow: visible !important;
        position: relative;
      }
      .mib-table-cell,
      .mib-table-cell-header {
        border: 1.5px solid var(--color-active-border) !important;
        padding: 6px 10px !important;
        vertical-align: top;
        position: relative;
        min-width: 40px;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
      .mib-table-cell-header {
        font-weight: 600;
        background: var(--color-active-bg) !important;
      }
      .mib-table-cell:focus-within,
      .mib-table-cell-header:focus-within {
        outline: 2px solid rgba(139, 92, 246, 0.5);
        outline-offset: -2px;
        z-index: 1;
      }
      /* selection highlight */
      .mib-table-cell.selected,
      .mib-table-cell-header.selected {
        background: rgba(139, 92, 246, 0.12) !important;
      }

      /* scrollable wrapper override */
      .mib-table-wrapper {
        overflow-x: auto;
        overflow-y: visible;
        position: relative;
        margin: 16px 0;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.getElementById(id)?.remove();
    };
  }, []);
  return null;
}

/* ─────────────────────────── Theme ─────────────────────────── */
const editorTheme = {
  root: "outline-none",
  paragraph: "mb-2 last:mb-0 leading-relaxed",
  heading: {
    h1: "text-3xl font-bold mb-3 leading-tight text-(--color-text)",
    h2: "text-2xl font-semibold mb-2.5 leading-snug text-(--color-text)",
    h3: "text-xl font-semibold mb-2 leading-snug text-(--color-text)",
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
    "border-l-4 border-violet-500 pl-4 my-3 italic text-(--color-gray) leading-relaxed",
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
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline underline-offset-2",
    strikethrough: "line-through",
    underlineStrikethrough: "underline line-through underline-offset-2",
    code: "bg-violet-500/15 border border-violet-500/25 rounded px-1.5 py-0.5 font-mono text-[0.8em] text-violet-300",
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

/* ─────────────────────────── Colors ─────────────────────────── */
const TEXT_COLORS = [
  "var(--color-text)",
  "#f87171",
  "#fb923c",
  "#facc15",
  "#4ade80",
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
  "var(--color-gray)",
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

/* ─────────────────────────── Config ─────────────────────────── */
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
    TableNode,
    TableRowNode,
    TableCellNode,
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

/* ────────────────── Insert Table ────────────────── */
function insertTable(editor: LexicalEditor, rows: number, cols: number) {
  editor.update(() => {
    const tableNode = $createTableNode();
    const colWidth = Math.floor(100 / cols);
    for (let r = 0; r < rows; r++) {
      const rowNode = $createTableRowNode();
      for (let c = 0; c < cols; c++) {
        const isHeader = r === 0;
        const cellNode = $createTableCellNode(
          isHeader
            ? TableCellHeaderStates.ROW
            : TableCellHeaderStates.NO_STATUS,
        );
        cellNode.append($createParagraphNode());
        rowNode.append(cellNode);
      }
      tableNode.append(rowNode);
    }
    const sel = $getSelection();
    if ($isRangeSelection(sel)) {
      const topLevel = sel.anchor.getNode().getTopLevelElementOrThrow();
      topLevel.insertAfter(tableNode);
      const afterPara = $createParagraphNode();
      tableNode.insertAfter(afterPara);
    } else {
      $getRoot().append(tableNode);
      $getRoot().append($createParagraphNode());
    }
  });
}

/* ────────────── Table Size Picker ────────────── */
function TableSizePicker({
  onSelect,
  onClose,
}: {
  onSelect: (r: number, c: number) => void;
  onClose: () => void;
}) {
  const [hovered, setHovered] = useState<[number, number]>([0, 0]);
  const MAX = 8;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.96 }}
      transition={{ duration: 0.13 }}
      className="absolute top-full right-0 sm:left-0 sm:right-auto mt-1.5 z-10001 p-3 rounded-xl border border-(--color-active-border) bg-(--color-bg) shadow-2xl"
    >
      <p className="text-xs text-(--color-gray) mb-2 font-medium">
        {hovered[0] > 0
          ? `${hovered[0]} × ${hovered[1]} table`
          : "Select table size"}
      </p>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${MAX}, 1.25rem)` }}
        onMouseLeave={() => setHovered([0, 0])}
      >
        {Array.from({ length: MAX }, (_, r) =>
          Array.from({ length: MAX }, (_, c) => {
            const isActive = r < hovered[0] && c < hovered[1];
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                className={`w-4 h-4 rounded-sm border transition-all duration-100 ${isActive ? "bg-violet-500/60 border-violet-400" : "bg-(--color-active-bg) border-(--color-active-border) hover:bg-violet-500/20"}`}
                onMouseEnter={() => setHovered([r + 1, c + 1])}
                onClick={() => {
                  onSelect(r + 1, c + 1);
                  onClose();
                }}
              />
            );
          }),
        )}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TABLE RESIZE PLUGIN — MS Word style
   - Column borders: drag to redistribute width (table stays same width)
   - Row borders: drag to change row height
   - Bottom-right corner: drag to scale entire table
   ══════════════════════════════════════════════════════════════ */

type HandleType = "col" | "row" | "corner";

interface HandleInfo {
  type: HandleType;
  tableEl: HTMLTableElement;
  // for col: which column separator (0 = after col 0)
  // for row: which row separator
  index: number;
  rect: { x: number; y: number; w: number; h: number };
}

function TableResizePlugin() {
  const [editor] = useLexicalComposerContext();
  const [handles, setHandles] = useState<HandleInfo[]>([]);
  const [activeHandle, setActiveHandle] = useState<HandleType | null>(null);
  const dragRef = useRef<{
    type: HandleType;
    tableEl: HTMLTableElement;
    index: number;
    startX: number;
    startY: number;
    colWidths: number[];
    rowHeights: number[];
    tableWidth: number;
    tableHeight: number;
  } | null>(null);

  // Scan tables and build handles
  const updateHandles = useCallback(() => {
    const root = editor.getRootElement();
    if (!root) {
      setHandles([]);
      return;
    }
    const tables = root.querySelectorAll<HTMLTableElement>("table.mib-table");
    const allHandles: HandleInfo[] = [];

    tables.forEach((tableEl) => {
      const tableRect = tableEl.getBoundingClientRect();
      const firstRow = tableEl.rows[0];
      if (!firstRow) return;

      // Column separators (vertical lines between columns)
      const cells = Array.from(firstRow.cells);
      for (let i = 0; i < cells.length - 1; i++) {
        const cellRect = cells[i].getBoundingClientRect();
        allHandles.push({
          type: "col",
          tableEl,
          index: i,
          rect: {
            x: cellRect.right - 3,
            y: tableRect.top,
            w: 6,
            h: tableRect.height,
          },
        });
      }

      // Row separators (horizontal lines between rows)
      const rows = Array.from(tableEl.rows);
      for (let i = 0; i < rows.length - 1; i++) {
        const rowRect = rows[i].getBoundingClientRect();
        allHandles.push({
          type: "row",
          tableEl,
          index: i,
          rect: {
            x: tableRect.left,
            y: rowRect.bottom - 3,
            w: tableRect.width,
            h: 6,
          },
        });
      }

      // Corner handle (bottom-right)
      allHandles.push({
        type: "corner",
        tableEl,
        index: 0,
        rect: {
          x: tableRect.right - 8,
          y: tableRect.bottom - 8,
          w: 16,
          h: 16,
        },
      });
    });

    setHandles(allHandles);
  }, [editor]);

  // Refresh handles on editor changes, scroll, resize
  useEffect(() => {
    const unsub = editor.registerUpdateListener(() => {
      requestAnimationFrame(updateHandles);
    });

    const root = editor.getRootElement();
    const scrollParent =
      root?.closest(".overflow-y-auto") || root?.parentElement;

    const refresh = () => requestAnimationFrame(updateHandles);
    window.addEventListener("resize", refresh);
    scrollParent?.addEventListener("scroll", refresh);

    // Initial
    requestAnimationFrame(updateHandles);

    return () => {
      unsub();
      window.removeEventListener("resize", refresh);
      scrollParent?.removeEventListener("scroll", refresh);
    };
  }, [editor, updateHandles]);

  // Hide handles during drag
  useEffect(() => {
    if (activeHandle) setHandles([]);
  }, [activeHandle]);

  const startDrag = useCallback(
    (e: React.MouseEvent, handle: HandleInfo) => {
      e.preventDefault();
      e.stopPropagation();

      const { tableEl, type, index } = handle;
      const firstRow = tableEl.rows[0];
      if (!firstRow) return;

      // Ensure table-layout: fixed and set explicit widths
      const cells = Array.from(firstRow.cells);
      const colWidths = cells.map((c) => c.getBoundingClientRect().width);
      const rowHeights = Array.from(tableEl.rows).map(
        (r) => r.getBoundingClientRect().height,
      );
      const tableWidth = tableEl.getBoundingClientRect().width;
      const tableHeight = tableEl.getBoundingClientRect().height;

      tableEl.style.tableLayout = "fixed";
      tableEl.style.width = tableWidth + "px";
      cells.forEach((c, i) => {
        (c as HTMLElement).style.width = colWidths[i] + "px";
      });
      Array.from(tableEl.rows).forEach((r, i) => {
        (r as HTMLElement).style.height = rowHeights[i] + "px";
      });

      dragRef.current = {
        type,
        tableEl,
        index,
        startX: e.clientX,
        startY: e.clientY,
        colWidths: [...colWidths],
        rowHeights: [...rowHeights],
        tableWidth,
        tableHeight,
      };

      setActiveHandle(type);

      const cursorMap: Record<HandleType, string> = {
        col: "col-resize",
        row: "row-resize",
        corner: "nwse-resize",
      };
      document.body.style.cursor = cursorMap[type];
      document.body.style.userSelect = "none";

      // Create guide line
      const guide = document.createElement("div");
      guide.id = "mib-resize-guide";
      guide.style.cssText = `
        position: fixed; z-index: 999999; pointer-events: none;
        background: rgba(139, 92, 246, 0.6);
        ${type === "col" ? `width: 2px; height: ${tableHeight}px; top: ${tableEl.getBoundingClientRect().top}px; left: ${e.clientX}px;` : ""}
        ${type === "row" ? `height: 2px; width: ${tableWidth}px; left: ${tableEl.getBoundingClientRect().left}px; top: ${e.clientY}px;` : ""}
        ${type === "corner" ? "display: none;" : ""}
      `;
      document.body.appendChild(guide);

      const onMouseMove = (ev: MouseEvent) => {
        const info = dragRef.current;
        if (!info) return;
        const guide = document.getElementById("mib-resize-guide");

        if (info.type === "col") {
          const delta = ev.clientX - info.startX;
          const MIN_W = 30;
          const newLeft = Math.max(MIN_W, info.colWidths[info.index] + delta);
          const newRight = Math.max(
            MIN_W,
            info.colWidths[info.index + 1] - delta,
          );

          // Only allow if both columns stay above minimum
          if (newLeft >= MIN_W && newRight >= MIN_W) {
            const fr = info.tableEl.rows[0];
            if (fr) {
              (fr.cells[info.index] as HTMLElement).style.width =
                newLeft + "px";
              (fr.cells[info.index + 1] as HTMLElement).style.width =
                newRight + "px";
            }
          }
          if (guide) guide.style.left = ev.clientX + "px";
        } else if (info.type === "row") {
          const delta = ev.clientY - info.startY;
          const newH = Math.max(20, info.rowHeights[info.index] + delta);
          const row = info.tableEl.rows[info.index];
          if (row) (row as HTMLElement).style.height = newH + "px";
          if (guide) guide.style.top = ev.clientY + "px";
        } else if (info.type === "corner") {
          const deltaX = ev.clientX - info.startX;
          const deltaY = ev.clientY - info.startY;
          const scaleX = Math.max(
            0.3,
            (info.tableWidth + deltaX) / info.tableWidth,
          );
          const scaleY = Math.max(
            0.3,
            (info.tableHeight + deltaY) / info.tableHeight,
          );

          // Scale all columns proportionally
          const fr = info.tableEl.rows[0];
          if (fr) {
            info.colWidths.forEach((w, i) => {
              const newW = Math.max(30, w * scaleX);
              (fr.cells[i] as HTMLElement).style.width = newW + "px";
            });
          }
          // Scale table width
          info.tableEl.style.width =
            Math.max(100, info.tableWidth * scaleX) + "px";

          // Scale all rows proportionally
          info.rowHeights.forEach((h, i) => {
            const newH = Math.max(20, h * scaleY);
            (info.tableEl.rows[i] as HTMLElement).style.height = newH + "px";
          });
        }
      };

      const onMouseUp = () => {
        dragRef.current = null;
        setActiveHandle(null);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.getElementById("mib-resize-guide")?.remove();
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        requestAnimationFrame(updateHandles);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [updateHandles],
  );

  if (handles.length === 0 && !activeHandle) return null;

  return (
    <>
      {handles.map((h, i) => (
        <div
          key={`${h.type}-${i}`}
          onMouseDown={(e) => startDrag(e, h)}
          style={{
            position: "fixed",
            left: h.rect.x,
            top: h.rect.y,
            width: h.rect.w,
            height: h.rect.h,
            zIndex: 99998,
            cursor:
              h.type === "col"
                ? "col-resize"
                : h.type === "row"
                  ? "row-resize"
                  : "nwse-resize",
          }}
          className="group"
        >
          {/* Visible indicator on hover */}
          {h.type === "col" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-0.5 h-full bg-transparent group-hover:bg-violet-500/70 transition-colors" />
            </div>
          )}
          {h.type === "row" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-0.5 w-full bg-transparent group-hover:bg-violet-500/70 transition-colors" />
            </div>
          )}
          {h.type === "corner" && (
            <div className="absolute bottom-0 right-0 w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg viewBox="0 0 12 12" className="w-full h-full">
                <path
                  d="M11 1L1 11M11 5L5 11M11 9L9 11"
                  stroke="rgba(139,92,246,0.8)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}
        </div>
      ))}
    </>
  );
}

/* ────────────── Right-Click Context Menu ────────────── */
interface TableCtxMenuProps {
  x: number;
  y: number;
  onClose: () => void;
}

function TableContextMenu({ x, y, onClose }: TableCtxMenuProps) {
  const [editor] = useLexicalComposerContext();
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  useEffect(() => {
    if (!menuRef.current) return;
    const { innerWidth, innerHeight } = window;
    const { offsetWidth: w, offsetHeight: h } = menuRef.current;
    setPos({
      x: Math.min(x, innerWidth - w - 12),
      y: Math.min(y, innerHeight - h - 12),
    });
  }, [x, y]);

  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        onClose();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", click);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", click);
      document.removeEventListener("keydown", key);
    };
  }, [onClose]);

  const act = useCallback(
    (fn: () => void) => {
      editor.update(fn);
      onClose();
    },
    [editor, onClose],
  );

  const MI = ({
    icon: Icon,
    label,
    onClick,
    danger,
  }: {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    danger?: boolean;
  }) => (
    <motion.button
      type="button"
      whileHover={{ x: 3 }}
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left rounded-lg transition-colors ${danger ? "text-red-400 hover:text-red-300 hover:bg-red-500/10" : "text-(--color-text) hover:bg-(--color-active-bg)"}`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </motion.button>
  );

  return createPortal(
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1 }}
      style={{ position: "fixed", left: pos.x, top: pos.y, zIndex: 99999 }}
      className="w-56 rounded-xl border border-(--color-active-border) bg-(--color-bg) shadow-2xl p-1.5"
    >
      <div className="px-3 py-1.5 mb-1 border-b border-(--color-active-border)">
        <span className="text-xs font-semibold text-(--color-gray) uppercase tracking-wider flex items-center gap-1.5">
          <Grid3X3 className="w-3 h-3" /> Table
        </span>
      </div>
      <MI
        icon={ArrowUp}
        label="Insert row above"
        onClick={() => act(() => $insertTableRow__EXPERIMENTAL(false))}
      />
      <MI
        icon={ArrowDown}
        label="Insert row below"
        onClick={() => act(() => $insertTableRow__EXPERIMENTAL(true))}
      />
      <MI
        icon={ArrowLeft}
        label="Insert column left"
        onClick={() => act(() => $insertTableColumn__EXPERIMENTAL(false))}
      />
      <MI
        icon={ArrowRight}
        label="Insert column right"
        onClick={() => act(() => $insertTableColumn__EXPERIMENTAL(true))}
      />
      <div className="my-1 border-t border-(--color-active-border)" />
      <MI
        icon={Merge}
        label="Merge cells"
        onClick={() => {
          $mergeTableCellsAtSelection(editor);
          onClose();
        }}
      />
      <MI
        icon={SplitSquareHorizontal}
        label="Unmerge cell"
        onClick={() => {
          $unmergeCellAtSelection(editor);
          onClose();
        }}
      />
      <MI
        icon={ToggleLeft}
        label="Toggle header row"
        onClick={() => {
          $toggleHeaderRow(editor);
          onClose();
        }}
      />
      <div className="my-1 border-t border-(--color-active-border)" />
      <MI
        icon={Trash2}
        label="Delete row"
        danger
        onClick={() => act(() => $deleteTableRow__EXPERIMENTAL())}
      />
      <MI
        icon={Trash2}
        label="Delete column"
        danger
        onClick={() => act(() => $deleteTableColumn__EXPERIMENTAL())}
      />
      <MI
        icon={Trash2}
        label="Delete table"
        danger
        onClick={() =>
          act(() => {
            const sel = $getSelection();
            if (!$isRangeSelection(sel)) return;
            try {
              $getTableNodeFromLexicalNodeOrThrow(
                sel.anchor.getNode(),
              ).remove();
            } catch {}
          })
        }
      />
    </motion.div>,
    document.body,
  );
}

function TableContextMenuPlugin() {
  const [editor] = useLexicalComposerContext();
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const root = editor.getRootElement();
    if (!root) return;
    const handler = (e: MouseEvent) => {
      editor.getEditorState().read(() => {
        const sel = $getSelection();
        if (!$isRangeSelection(sel) && !$isTableSelection(sel)) return;
        const anchor = $isRangeSelection(sel) ? sel.anchor.getNode() : null;
        if (!anchor) return;
        if ($findAncestor(anchor, $isTableCellNode)) {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY });
        }
      });
    };
    root.addEventListener("contextmenu", handler);
    return () => root.removeEventListener("contextmenu", handler);
  }, [editor]);

  return (
    <AnimatePresence>
      {menu && (
        <TableContextMenu x={menu.x} y={menu.y} onClose={() => setMenu(null)} />
      )}
    </AnimatePresence>
  );
}

/* ────────────── Floating Table Toolbar ────────────── */
function FloatingTableToolbar() {
  const [editor] = useLexicalComposerContext();
  const [isInTable, setIsInTable] = useState(false);
  const [canMerge, setCanMerge] = useState(false);
  const [canUnmerge, setCanUnmerge] = useState(false);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const sel = $getSelection();
        if ($isTableSelection(sel)) {
          setIsInTable(true);
          setCanMerge(sel.getNodes().filter($isTableCellNode).length >= 2);
          setCanUnmerge(false);
          return;
        }
        if ($isRangeSelection(sel)) {
          const node = sel.anchor.getNode();
          const cell = $findAncestor(node, $isTableCellNode);
          if (cell) {
            setIsInTable(true);
            setCanMerge(false);
            setCanUnmerge(
              (cell.getColSpan?.() ?? 1) > 1 || (cell.getRowSpan?.() ?? 1) > 1,
            );
            return;
          }
        }
        setIsInTable(false);
        setCanMerge(false);
        setCanUnmerge(false);
      });
    });
  }, [editor]);

  if (!isInTable) return null;

  const act = (fn: () => void) => editor.update(fn);

  const Btn = ({
    icon: Icon,
    label,
    onClick,
    danger,
    disabled: d,
  }: {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    danger?: boolean;
    disabled?: boolean;
  }) => (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      disabled={d}
      title={label}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${danger ? "text-red-400 hover:text-red-300 hover:bg-red-500/10" : "text-(--color-text) hover:bg-(--color-active-bg)"}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </motion.button>
  );
  const VSep = () => (
    <div className="w-px h-5 bg-(--color-active-border) mx-0.5 shrink-0" />
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="flex flex-wrap items-center gap-0.5 px-3 py-1.5 border-t border-(--color-active-border) bg-(--color-active-bg) shrink-0"
    >
      <Grid3X3 className="w-3.5 h-3.5 text-violet-400 mr-1.5" />
      <span className="text-xs text-violet-400 font-semibold mr-2 hidden sm:inline">
        Table
      </span>
      <Btn
        icon={ArrowUp}
        label="Row ↑"
        onClick={() => act(() => $insertTableRow__EXPERIMENTAL(false))}
      />
      <Btn
        icon={ArrowDown}
        label="Row ↓"
        onClick={() => act(() => $insertTableRow__EXPERIMENTAL(true))}
      />
      <Btn
        icon={ArrowLeft}
        label="Col ←"
        onClick={() => act(() => $insertTableColumn__EXPERIMENTAL(false))}
      />
      <Btn
        icon={ArrowRight}
        label="Col →"
        onClick={() => act(() => $insertTableColumn__EXPERIMENTAL(true))}
      />
      <VSep />
      <Btn
        icon={Merge}
        label="Merge"
        onClick={() => $mergeTableCellsAtSelection(editor)}
        disabled={!canMerge}
      />
      <Btn
        icon={SplitSquareHorizontal}
        label="Unmerge"
        onClick={() => $unmergeCellAtSelection(editor)}
        disabled={!canUnmerge}
      />
      <Btn
        icon={ToggleLeft}
        label="Header"
        onClick={() => $toggleHeaderRow(editor)}
      />
      <VSep />
      <Btn
        icon={Rows3}
        label="Del Row"
        danger
        onClick={() => act(() => $deleteTableRow__EXPERIMENTAL())}
      />
      <Btn
        icon={Columns3}
        label="Del Col"
        danger
        onClick={() => act(() => $deleteTableColumn__EXPERIMENTAL())}
      />
      <Btn
        icon={Trash2}
        label="Del Table"
        danger
        onClick={() =>
          act(() => {
            const sel = $getSelection();
            if (!$isRangeSelection(sel)) return;
            try {
              $getTableNodeFromLexicalNodeOrThrow(
                sel.anchor.getNode(),
              ).remove();
            } catch {}
          })
        }
      />
    </motion.div>
  );
}

/* ─────────────────── Utility Plugins ─────────────────── */

function CodeHighlightPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => registerCodeHighlighting(editor), [editor]);
  return null;
}

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

/* ─────────────────────── Main Toolbar ─────────────────────── */
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
  const [showTable, setShowTable] = useState(false);

  const closeAll = () => {
    setShowBlocks(false);
    setShowTextColor(false);
    setShowBgColor(false);
    setShowTable(false);
  };

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
        if ($isRangeSelection(selection)) $patchStyleText(selection, styles);
      });
      setShowTextColor(false);
      setShowBgColor(false);
    },
    [editor],
  );

  const formatBlock = useCallback(
    (type: BlockType) => {
      setShowBlocks(false);
      if (type === "bullet")
        editor.dispatchCommand(
          blockType === "bullet"
            ? REMOVE_LIST_COMMAND
            : INSERT_UNORDERED_LIST_COMMAND,
          undefined,
        );
      else if (type === "number")
        editor.dispatchCommand(
          blockType === "number"
            ? REMOVE_LIST_COMMAND
            : INSERT_ORDERED_LIST_COMMAND,
          undefined,
        );
      else if (type === "check")
        editor.dispatchCommand(
          blockType === "check"
            ? REMOVE_LIST_COMMAND
            : INSERT_CHECK_LIST_COMMAND,
          undefined,
        );
      else
        editor.update(() => {
          const sel = $getSelection();
          if (!$isRangeSelection(sel)) return;
          if (type === "paragraph")
            $setBlocksType(sel, () => $createParagraphNode());
          else if (type === "h1" || type === "h2" || type === "h3")
            $setBlocksType(sel, () =>
              $createHeadingNode(type as HeadingTagType),
            );
          else if (type === "quote")
            $setBlocksType(sel, () => $createQuoteNode());
          else if (type === "code")
            $setBlocksType(sel, () => $createCodeNode());
        });
    },
    [blockType, editor],
  );

  const confirmLink = useCallback(() => {
    if (linkUrl.trim())
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, {
        url: linkUrl.trim(),
        target: "_blank",
        rel: "noopener noreferrer",
      });
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
      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed ${active ? "bg-violet-500/30 text-violet-300" : "text-(--color-gray) hover:text-(--color-text) hover:bg-(--color-active-bg)"}`}
    >
      {children}
    </motion.button>
  );
  const Sep = () => (
    <div className="w-px h-5 bg-(--color-active-border) mx-0.5 shrink-0" />
  );
  const { Icon: BlockIcon, label: blockLabel } = BLOCK_TYPES[blockType];

  return (
    <>
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-(--color-active-border) bg-(--color-active-bg) shrink-0">
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

        {/* Block type */}
        <div className="relative">
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              closeAll();
              setShowBlocks((p) => !p);
            }}
            className="flex items-center gap-1.5 px-2 h-8 rounded-lg text-xs font-medium text-(--color-text) hover:bg-(--color-active-bg) border border-(--color-active-border) transition-all duration-150"
          >
            <BlockIcon className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden sm:inline max-w-20 truncate">
              {blockLabel}
            </span>
            <ChevronDown className="w-3 h-3 text-(--color-gray)" />
          </motion.button>
          <AnimatePresence>
            {showBlocks && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.13 }}
                className="absolute top-full left-0 mt-1.5 z-10001 w-48 rounded-xl border border-(--color-active-border) bg-(--color-bg) shadow-2xl overflow-hidden"
              >
                {(Object.entries(BLOCK_TYPES) as [BlockType, BlockInfo][]).map(
                  ([type, { label, Icon }]) => (
                    <motion.button
                      key={type}
                      type="button"
                      whileHover={{ x: 4 }}
                      onClick={() => formatBlock(type)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${blockType === type ? "text-violet-300 bg-violet-500/15" : "text-(--color-text) hover:bg-(--color-active-bg)"}`}
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

        {/* Format */}
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

        {/* Text color */}
        <div className="relative">
          <B
            active={showTextColor}
            onClick={() => {
              closeAll();
              setShowTextColor((p) => !p);
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
                className="absolute top-full left-0 mt-1.5 z-10001 w-40 p-2 rounded-xl border border-(--color-active-border) bg-(--color-bg) shadow-2xl"
              >
                <div className="grid grid-cols-5 gap-1.5">
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => applyStyleText({ color })}
                      className="w-5 h-5 rounded-full border border-(--color-active-border) hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Highlight */}
        <div className="relative">
          <B
            active={showBgColor}
            onClick={() => {
              closeAll();
              setShowBgColor((p) => !p);
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
                className="absolute top-full left-0 mt-1.5 z-10001 w-40 p-2 rounded-xl border border-(--color-active-border) bg-(--color-bg) shadow-2xl"
              >
                <div className="grid grid-cols-5 gap-1.5">
                  {BG_COLORS.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => applyStyleText({ "background-color": bg })}
                      className="w-5 h-5 rounded-full border border-(--color-active-border) hover:scale-110 transition-transform"
                      style={{
                        backgroundColor:
                          bg === "transparent" ? "var(--color-active-bg)" : bg,
                      }}
                      title={bg}
                    >
                      {bg === "transparent" && (
                        <X className="w-3 h-3 text-(--color-gray) m-auto" />
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

        {/* Alignment */}
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

        {/* Link */}
        <B
          active={isLink}
          onClick={() => {
            if (isLink) editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
            else {
              closeAll();
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

        {/* Table */}
        <div className="relative">
          <B
            active={showTable}
            onClick={() => {
              closeAll();
              setShowTable((p) => !p);
            }}
            title="Insert Table"
          >
            <Table className="w-4 h-4" />
          </B>
          <AnimatePresence>
            {showTable && (
              <TableSizePicker
                onSelect={(r, c) => insertTable(editor, r, c)}
                onClose={() => setShowTable(false)}
              />
            )}
          </AnimatePresence>
        </div>

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

      {/* Link bar */}
      <AnimatePresence>
        {showLink && (
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
                className="flex-1 bg-transparent text-sm text-(--color-text) placeholder:text-(--color-gray) outline-none"
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
                className="p-1 rounded-lg hover:bg-(--color-active-bg) text-(--color-gray) hover:text-(--color-text) transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(showBlocks || showTextColor || showBgColor || showTable) && (
        <div className="fixed inset-0 z-10000" onClick={closeAll} />
      )}
    </>
  );
}

/* ────────────────────── EditorInner ────────────────────── */
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
        <CodeActionOverlays />
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="outline-none w-full px-4 py-3 text-(--color-text) text-sm leading-relaxed"
              style={{
                minHeight: "calc(100dvh - 160px)",
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? "not-allowed" : "text",
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
        {/* Table resize handles rendered inside scrollable area */}
        <TableResizePlugin />
      </div>

      <AnimatePresence>
        <FloatingTableToolbar />
      </AnimatePresence>
      <WordCount />

      <HistoryPlugin />
      <ListPlugin />
      <CheckListPlugin />
      <LinkPlugin />
      <TabIndentationPlugin />
      <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
      <HtmlSyncPlugin onChange={onChange} initialHtml={initialValue} />
      <CodeHighlightPlugin />
      <AutoFocusPlugin />
      <TablePlugin hasCellMerge={true} hasCellBackgroundColor={false} />
      <TableContextMenuPlugin />
      <TableStyleInjector />
    </>
  );
}

/* ────────────────────── MibEditor (export) ────────────────────── */
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
            {/* Preview card */}
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
              className={`relative rounded-xl border border-(--color-active-border) bg-(--color-active-bg) transition-all duration-200 overflow-hidden hover:shadow-[0_0_0_3px_rgba(139,92,246,0.12)] ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-text"}`}
              style={{ minHeight: `${rows * 1.9}rem` }}
            >
              <div className="px-4 py-3">
                {hasContent ? (
                  <div
                    className="text-sm text-(--color-text) leading-relaxed line-clamp-5 select-none
                    [&_p]:mb-1 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold
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

            {/* Fullscreen editor */}
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
