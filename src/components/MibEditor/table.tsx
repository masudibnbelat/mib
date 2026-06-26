// components/MibEditor/table.tsx
"use client";

import { useEffect, useCallback, useState, useRef, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
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
  Trash2,
  Copy,
  ClipboardPaste,
  Paintbrush,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowUpDown,
  Maximize2,
  Minimize2,
  RotateCcw,
  Download,
  Plus,
} from "lucide-react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $createTextNode,
  LexicalEditor,
  COMMAND_PRIORITY_LOW,
  KEY_TAB_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_ENTER_COMMAND,
  $isElementNode,
  $setSelection,
  $createRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import {
  $createTableNode,
  $createTableRowNode,
  $createTableCellNode,
  $isTableNode,
  $isTableRowNode,
  $isTableCellNode,
  $isTableSelection,
  TableCellHeaderStates,
  TableCellNode,
  TableRowNode,
  TableNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $deleteTableColumn__EXPERIMENTAL,
  $deleteTableRow__EXPERIMENTAL,
  $insertTableColumn__EXPERIMENTAL,
  $insertTableRow__EXPERIMENTAL,
  $unmergeCell,
} from "@lexical/table";

/* ═══════════════════ Types ═══════════════════ */

interface TablePosition {
  row: number;
  col: number;
}

interface TableDimensions {
  rows: number;
  cols: number;
}

interface CellStyle {
  backgroundColor?: string;
  textAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  fontWeight?: string;
}

type HandleType = "col" | "row" | "corner";

interface HandleInfo {
  type: HandleType;
  tableEl: HTMLTableElement;
  index: number;
  rect: { x: number; y: number; w: number; h: number };
}

interface DragInfo {
  type: HandleType;
  tableEl: HTMLTableElement;
  index: number;
  startX: number;
  startY: number;
  colWidths: number[];
  rowHeights: number[];
  tableWidth: number;
  tableHeight: number;
}

/* ═══════════════════ Constants ═══════════════════ */

const MIN_COL_WIDTH = 30;
const MIN_ROW_HEIGHT = 20;
const MIN_TABLE_WIDTH = 100;
const MAX_GRID_SIZE = 10;
const RESIZE_SCALE_MIN = 0.3;
const HANDLE_THICKNESS = 6;

const CELL_COLORS = [
  { label: "None", value: "transparent" },
  { label: "Light Gray", value: "rgba(156,163,175,0.15)" },
  { label: "Light Blue", value: "rgba(96,165,250,0.15)" },
  { label: "Light Green", value: "rgba(74,222,128,0.15)" },
  { label: "Light Yellow", value: "rgba(250,204,21,0.15)" },
  { label: "Light Red", value: "rgba(248,113,113,0.15)" },
  { label: "Light Purple", value: "rgba(167,139,250,0.15)" },
  { label: "Light Pink", value: "rgba(244,114,182,0.15)" },
] as const;

/* ═══════════════════ Animation variants ═══════════════════ */

const fadeScaleVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

const fadeSlideVariants = {
  initial: { opacity: 0, y: -6, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.96 },
};

const toolbarVariants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 4 },
};

/* ═══════════════════ Helpers ═══════════════════ */

function $findAncestor<T>(node: any, check: (n: any) => n is T): T | null {
  let cur = node;
  while (cur && cur.getKey?.() !== "root") {
    if (check(cur)) return cur;
    cur = cur.getParent?.() ?? null;
  }
  return null;
}

function $getTableContext(): {
  table: TableNode;
  cell: TableCellNode;
  row: TableRowNode;
  rowIndex: number;
  colIndex: number;
  dimensions: TableDimensions;
} | null {
  const sel = $getSelection();
  if (!$isRangeSelection(sel)) return null;

  const cell = $findAncestor(sel.anchor.getNode(), $isTableCellNode);
  if (!cell) return null;

  const row = cell.getParent();
  if (!$isTableRowNode(row)) return null;

  const table = $findAncestor(cell, $isTableNode);
  if (!table) return null;

  const rows = table.getChildren().filter($isTableRowNode);
  const rowIndex = rows.indexOf(row);
  const colIndex = row.getChildren().indexOf(cell);
  const cols = Math.max(...rows.map((r) => r.getChildrenSize()));

  return {
    table,
    cell,
    row,
    rowIndex,
    colIndex,
    dimensions: { rows: rows.length, cols },
  };
}

function $getCellBounds(cell: TableCellNode) {
  return {
    colSpan: cell.getColSpan?.() ?? 1,
    rowSpan: cell.getRowSpan?.() ?? 1,
  };
}

function $getSelectedCells(): TableCellNode[] {
  const sel = $getSelection();
  if ($isTableSelection(sel)) {
    return sel.getNodes().filter($isTableCellNode);
  }
  if ($isRangeSelection(sel)) {
    const cell = $findAncestor(sel.anchor.getNode(), $isTableCellNode);
    return cell ? [cell] : [];
  }
  return [];
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

/* ═══════════════════ Table Operations ═══════════════════ */

function $mergeTableCellsAtSelection(editor: LexicalEditor) {
  editor.update(() => {
    const sel = $getSelection();
    if (!$isTableSelection(sel)) return;

    const cells = sel.getNodes().filter($isTableCellNode);
    if (cells.length < 2) return;

    const table = $findAncestor(cells[0], $isTableNode);
    if (!table) return;

    const rows = table.getChildren().filter($isTableRowNode);

    let minRow = Infinity,
      maxRow = -1,
      minCol = Infinity,
      maxCol = -1;

    cells.forEach((cell) => {
      const row = cell.getParent();
      if (!$isTableRowNode(row)) return;

      const ri = rows.indexOf(row);
      const ci = row.getChildren().indexOf(cell);
      const { colSpan, rowSpan } = $getCellBounds(cell);

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

    const { colSpan, rowSpan } = $getCellBounds(cell);
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
    const ctx = $getTableContext();
    if (!ctx) return;

    const firstRow = ctx.table.getFirstChild();
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

function $toggleHeaderColumn(editor: LexicalEditor) {
  editor.update(() => {
    const ctx = $getTableContext();
    if (!ctx) return;

    const rows = ctx.table.getChildren().filter($isTableRowNode);
    rows.forEach((row) => {
      const firstCell = row.getFirstChild();
      if ($isTableCellNode(firstCell)) {
        const isHeader =
          firstCell.getHeaderStyles?.() === TableCellHeaderStates.COLUMN;
        firstCell.setHeaderStyles(
          isHeader
            ? TableCellHeaderStates.NO_STATUS
            : TableCellHeaderStates.COLUMN,
        );
      }
    });
  });
}

function $duplicateRow(editor: LexicalEditor, below: boolean) {
  editor.update(() => {
    const ctx = $getTableContext();
    if (!ctx) return;

    const { row } = ctx;
    const newRow = $createTableRowNode();

    row.getChildren().forEach((cell) => {
      if ($isTableCellNode(cell)) {
        const newCell = $createTableCellNode(cell.getHeaderStyles());
        newCell.setColSpan(cell.getColSpan());
        newCell.setRowSpan(1);

        // Copy content
        cell.getChildren().forEach((child) => {
          const clone = child.exportJSON();
          // We'll just create empty paragraphs for duplicated rows
          newCell.append($createParagraphNode());
        });

        newRow.append(newCell);
      }
    });

    if (below) {
      row.insertAfter(newRow);
    } else {
      row.insertBefore(newRow);
    }
  });
}

function $duplicateColumn(editor: LexicalEditor, right: boolean) {
  editor.update(() => {
    const ctx = $getTableContext();
    if (!ctx) return;

    const { table, colIndex } = ctx;
    const rows = table.getChildren().filter($isTableRowNode);

    rows.forEach((row) => {
      const cells = row.getChildren();
      const sourceCell = cells[colIndex];
      if (!$isTableCellNode(sourceCell)) return;

      const newCell = $createTableCellNode(sourceCell.getHeaderStyles());
      newCell.append($createParagraphNode());

      if (right) {
        sourceCell.insertAfter(newCell);
      } else {
        sourceCell.insertBefore(newCell);
      }
    });
  });
}

function $clearCellContents(editor: LexicalEditor) {
  editor.update(() => {
    const cells = $getSelectedCells();
    cells.forEach((cell) => {
      cell.getChildren().forEach((child) => child.remove());
      cell.append($createParagraphNode());
    });
  });
}

function $setCellAlignment(
  editor: LexicalEditor,
  align: "left" | "center" | "right",
) {
  editor.update(() => {
    const cells = $getSelectedCells();
    cells.forEach((cell) => {
      const style = cell.getStyle() || "";
      const newStyle = style
        .replace(/text-align:\s*\w+;?/g, "")
        .concat(`text-align:${align};`);
      cell.setStyle(newStyle);
    });
  });
}

function $setCellVerticalAlign(
  editor: LexicalEditor,
  align: "top" | "middle" | "bottom",
) {
  editor.update(() => {
    const cells = $getSelectedCells();
    cells.forEach((cell) => {
      const style = cell.getStyle() || "";
      const newStyle = style
        .replace(/vertical-align:\s*\w+;?/g, "")
        .concat(`vertical-align:${align};`);
      cell.setStyle(newStyle);
    });
  });
}

function $setCellBackgroundColor(editor: LexicalEditor, color: string) {
  editor.update(() => {
    const cells = $getSelectedCells();
    cells.forEach((cell) => {
      const style = cell.getStyle() || "";
      const newStyle = style
        .replace(/background(-color)?:\s*[^;]+;?/g, "")
        .concat(color !== "transparent" ? `background-color:${color};` : "");
      cell.setStyle(newStyle);
    });
  });
}

function $distributeColumnsEvenly(editor: LexicalEditor) {
  editor.update(() => {
    const ctx = $getTableContext();
    if (!ctx) return;

    const { table, dimensions } = ctx;
    const rows = table.getChildren().filter($isTableRowNode);
    const equalWidth = `${(100 / dimensions.cols).toFixed(2)}%`;

    rows.forEach((row) => {
      row.getChildren().forEach((cell) => {
        if ($isTableCellNode(cell)) {
          const style = cell.getStyle() || "";
          const newStyle = style
            .replace(/width:\s*[^;]+;?/g, "")
            .concat(`width:${equalWidth};`);
          cell.setStyle(newStyle);
        }
      });
    });
  });
}

function $sortTableByColumn(editor: LexicalEditor, ascending: boolean = true) {
  editor.update(() => {
    const ctx = $getTableContext();
    if (!ctx) return;

    const { table, colIndex } = ctx;
    const rows = table.getChildren().filter($isTableRowNode);

    // Skip header row
    const headerRow = rows[0];
    const dataRows = rows.slice(1);

    if (dataRows.length < 2) return;

    const sortedRows = [...dataRows].sort((a, b) => {
      const cellA = a.getChildren()[colIndex];
      const cellB = b.getChildren()[colIndex];
      const textA = cellA?.getTextContent?.() || "";
      const textB = cellB?.getTextContent?.() || "";

      // Try numeric comparison first
      const numA = parseFloat(textA);
      const numB = parseFloat(textB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return ascending ? numA - numB : numB - numA;
      }

      return ascending
        ? textA.localeCompare(textB)
        : textB.localeCompare(textA);
    });

    // Remove and re-append in sorted order
    dataRows.forEach((row) => row.remove());
    sortedRows.forEach((row) => table.append(row));
  });
}

function $exportTableAsCSV(editor: LexicalEditor): string {
  let csv = "";
  editor.getEditorState().read(() => {
    const sel = $getSelection();
    if (!$isRangeSelection(sel)) return;

    const table = $findAncestor(sel.anchor.getNode(), $isTableNode);
    if (!table) return;

    const rows = table.getChildren().filter($isTableRowNode);
    const csvRows: string[] = [];

    rows.forEach((row) => {
      const cells: string[] = [];
      row.getChildren().forEach((cell) => {
        if ($isTableCellNode(cell)) {
          const text = cell.getTextContent().replace(/"/g, '""');
          cells.push(`"${text}"`);
        }
      });
      csvRows.push(cells.join(","));
    });

    csv = csvRows.join("\n");
  });
  return csv;
}

function $moveToCell(
  editor: LexicalEditor,
  direction: "up" | "down" | "left" | "right",
) {
  editor.update(() => {
    const ctx = $getTableContext();
    if (!ctx) return;

    const { table, rowIndex, colIndex, dimensions } = ctx;
    const rows = table.getChildren().filter($isTableRowNode);

    let targetRow = rowIndex;
    let targetCol = colIndex;

    switch (direction) {
      case "up":
        targetRow = Math.max(0, rowIndex - 1);
        break;
      case "down":
        targetRow = Math.min(dimensions.rows - 1, rowIndex + 1);
        break;
      case "left":
        targetCol = Math.max(0, colIndex - 1);
        break;
      case "right":
        targetCol = Math.min(dimensions.cols - 1, colIndex + 1);
        break;
    }

    const row = rows[targetRow];
    if (!$isTableRowNode(row)) return;

    const cell = row.getChildren()[targetCol];
    if (!$isTableCellNode(cell)) return;

    const firstChild = cell.getFirstChild();
    if (firstChild) {
      const sel = $createRangeSelection();
      if ($isElementNode(firstChild)) {
        const textNode = firstChild.getFirstChild();
        if (textNode) {
          sel.anchor.set(textNode.getKey(), 0, "text");
          sel.focus.set(textNode.getKey(), 0, "text");
        } else {
          sel.anchor.set(firstChild.getKey(), 0, "element");
          sel.focus.set(firstChild.getKey(), 0, "element");
        }
      }
      $setSelection(sel);
    }
  });
}

/* ═══════════════════ Table Style Injector ═══════════════════ */

const TABLE_STYLES = `
  .mib-table {
    border-collapse: collapse !important;
    table-layout: fixed;
    border: 2px solid var(--color-active-border) !important;
    border-radius: 0 !important;
    overflow: visible !important;
    position: relative;
    width: 100%;
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
    transition: background-color 0.15s ease;
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
  .mib-table-cell.selected,
  .mib-table-cell-header.selected {
    background: rgba(139, 92, 246, 0.12) !important;
  }
  .mib-table-wrapper {
    overflow-x: auto;
    overflow-y: visible;
    position: relative;
    margin: 16px 0;
  }
  .mib-table-add-btn {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg);
    border: 1.5px dashed var(--color-active-border);
    color: var(--color-gray);
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s, background 0.15s, color 0.15s;
    z-index: 2;
  }
  .mib-table-wrapper:hover .mib-table-add-btn {
    opacity: 1;
  }
  .mib-table-add-btn:hover {
    background: var(--color-active-bg);
    color: var(--color-text);
    border-color: rgba(139, 92, 246, 0.5);
  }
  .mib-table-add-row {
    bottom: -24px;
    left: 0;
    right: 0;
    height: 20px;
    border-radius: 0 0 6px 6px;
  }
  .mib-table-add-col {
    top: 0;
    bottom: 0;
    right: -24px;
    width: 20px;
    border-radius: 0 6px 6px 0;
  }
  @media (max-width: 640px) {
    .mib-table-cell, .mib-table-cell-header {
      padding: 4px 6px !important;
      font-size: 0.875rem;
    }
  }
`;

export const TableStyleInjector = memo(function TableStyleInjector() {
  useEffect(() => {
    const id = "mib-table-styles";
    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;
    style.textContent = TABLE_STYLES;
    document.head.appendChild(style);

    return () => {
      document.getElementById(id)?.remove();
    };
  }, []);

  return null;
});

/* ═══════════════════ Insert Table ═══════════════════ */

export function insertTable(
  editor: LexicalEditor,
  rows: number,
  cols: number,
  withHeader: boolean = true,
) {
  editor.update(() => {
    const tableNode = $createTableNode();

    for (let r = 0; r < rows; r++) {
      const rowNode = $createTableRowNode();
      for (let c = 0; c < cols; c++) {
        const isHeader = withHeader && r === 0;
        const cellNode = $createTableCellNode(
          isHeader
            ? TableCellHeaderStates.ROW
            : TableCellHeaderStates.NO_STATUS,
        );
        const paragraph = $createParagraphNode();

        if (isHeader) {
          paragraph.append($createTextNode(`Header ${c + 1}`));
        }

        cellNode.append(paragraph);
        rowNode.append(cellNode);
      }
      tableNode.append(rowNode);
    }

    const sel = $getSelection();
    if ($isRangeSelection(sel)) {
      const topLevel = sel.anchor.getNode().getTopLevelElementOrThrow();
      topLevel.insertAfter(tableNode);
      tableNode.insertAfter($createParagraphNode());
    } else {
      $getRoot().append(tableNode);
      $getRoot().append($createParagraphNode());
    }
  });
}

/* ═══════════════════ Table Size Picker ═══════════════════ */

export const TableSizePicker = memo(function TableSizePicker({
  onSelect,
  onClose,
}: {
  onSelect: (r: number, c: number) => void;
  onClose: () => void;
}) {
  const [hovered, setHovered] = useState<[number, number]>([0, 0]);
  const [customMode, setCustomMode] = useState(false);
  const [customRows, setCustomRows] = useState("4");
  const [customCols, setCustomCols] = useState("4");
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const gridCells = useMemo(() => {
    const cells: { r: number; c: number }[] = [];
    for (let r = 0; r < MAX_GRID_SIZE; r++) {
      for (let c = 0; c < MAX_GRID_SIZE; c++) {
        cells.push({ r, c });
      }
    }
    return cells;
  }, []);

  if (customMode) {
    return (
      <motion.div
        ref={pickerRef}
        variants={fadeSlideVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.13 }}
        className="absolute top-full right-0 sm:left-0 sm:right-auto mt-1.5 z-10001 p-4 rounded-xl border border-(--color-active-border) bg-(--color-bg) shadow-2xl w-56"
      >
        <p className="text-xs font-semibold text-(--color-gray) mb-3 uppercase tracking-wider">
          Custom Table Size
        </p>
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs text-(--color-gray)">Rows</span>
            <input
              type="number"
              min="1"
              max="50"
              value={customRows}
              onChange={(e) => setCustomRows(e.target.value)}
              className="mt-1 w-full px-3 py-1.5 rounded-lg border border-(--color-active-border) bg-(--color-active-bg) text-(--color-text) text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              autoFocus
            />
          </label>
          <label className="block">
            <span className="text-xs text-(--color-gray)">Columns</span>
            <input
              type="number"
              min="1"
              max="20"
              value={customCols}
              onChange={(e) => setCustomCols(e.target.value)}
              className="mt-1 w-full px-3 py-1.5 rounded-lg border border-(--color-active-border) bg-(--color-active-bg) text-(--color-text) text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCustomMode(false)}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-(--color-active-border) text-(--color-gray) hover:bg-(--color-active-bg) transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                const r = clamp(parseInt(customRows) || 3, 1, 50);
                const c = clamp(parseInt(customCols) || 3, 1, 20);
                onSelect(r, c);
                onClose();
              }}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-colors font-medium"
            >
              Create
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={pickerRef}
      variants={fadeSlideVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.13 }}
      className="absolute top-full right-0 sm:left-0 sm:right-auto mt-1.5 z-10001 p-3 rounded-xl border border-(--color-active-border) bg-(--color-bg) shadow-2xl"
    >
      <p className="text-xs text-(--color-gray) mb-2 font-medium">
        {hovered[0] > 0
          ? `${hovered[0]} × ${hovered[1]} table`
          : "Select table size"}
      </p>
      <div
        className="grid gap-0.75"
        style={{ gridTemplateColumns: `repeat(${MAX_GRID_SIZE}, 1.125rem)` }}
        onMouseLeave={() => setHovered([0, 0])}
      >
        {gridCells.map(({ r, c }) => {
          const isActive = r < hovered[0] && c < hovered[1];
          return (
            <button
              key={`${r}-${c}`}
              type="button"
              className={`w-4.5 h-4.5 rounded-[3px] border transition-all duration-75 ${
                isActive
                  ? "bg-violet-500/60 border-violet-400 scale-105"
                  : "bg-(--color-active-bg) border-(--color-active-border) hover:bg-violet-500/20"
              }`}
              onMouseEnter={() => setHovered([r + 1, c + 1])}
              onClick={() => {
                onSelect(r + 1, c + 1);
                onClose();
              }}
            />
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => setCustomMode(true)}
        className="mt-2 w-full px-3 py-1.5 text-xs text-(--color-gray) hover:text-(--color-text) hover:bg-(--color-active-bg) rounded-lg transition-colors text-center border border-dashed border-(--color-active-border)"
      >
        Custom size…
      </button>
    </motion.div>
  );
});

/* ═══════════════════ Table Keyboard Navigation Plugin ═══════════════════ */

export function TableKeyboardPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeTabHandler = editor.registerCommand(
      KEY_TAB_COMMAND,
      (event: KeyboardEvent) => {
        const ctx = editor.getEditorState().read(() => $getTableContext());
        if (!ctx) return false;

        event.preventDefault();

        if (event.shiftKey) {
          $moveToCell(editor, "left");
        } else {
          $moveToCell(editor, "right");
        }
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );

    return () => {
      removeTabHandler();
    };
  }, [editor]);

  return null;
}

/* ═══════════════════ Table Resize Plugin ═══════════════════ */

export const TableResizePlugin = memo(function TableResizePlugin() {
  const [editor] = useLexicalComposerContext();
  const [handles, setHandles] = useState<HandleInfo[]>([]);
  const [activeHandle, setActiveHandle] = useState<HandleType | null>(null);
  const dragRef = useRef<DragInfo | null>(null);
  const rafRef = useRef<number | null>(null);

  const updateHandles = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      const root = editor.getRootElement();
      if (!root) {
        setHandles([]);
        return;
      }

      const tables = root.querySelectorAll<HTMLTableElement>("table.mib-table");
      if (tables.length === 0) {
        setHandles([]);
        return;
      }

      const all: HandleInfo[] = [];

      tables.forEach((tableEl) => {
        const tr = tableEl.getBoundingClientRect();
        if (tr.width === 0 || tr.height === 0) return;

        const fr = tableEl.rows[0];
        if (!fr) return;

        const cells = Array.from(fr.cells);

        // Column handles
        for (let i = 0; i < cells.length - 1; i++) {
          const cr = cells[i].getBoundingClientRect();
          all.push({
            type: "col",
            tableEl,
            index: i,
            rect: {
              x: cr.right - HANDLE_THICKNESS / 2,
              y: tr.top,
              w: HANDLE_THICKNESS,
              h: tr.height,
            },
          });
        }

        // Row handles
        const rows = Array.from(tableEl.rows);
        for (let i = 0; i < rows.length - 1; i++) {
          const rr = rows[i].getBoundingClientRect();
          all.push({
            type: "row",
            tableEl,
            index: i,
            rect: {
              x: tr.left,
              y: rr.bottom - HANDLE_THICKNESS / 2,
              w: tr.width,
              h: HANDLE_THICKNESS,
            },
          });
        }

        // Corner handle
        all.push({
          type: "corner",
          tableEl,
          index: 0,
          rect: {
            x: tr.right - 8,
            y: tr.bottom - 8,
            w: 16,
            h: 16,
          },
        });
      });

      setHandles(all);
    });
  }, [editor]);

  useEffect(() => {
    const cleanup = editor.registerUpdateListener(() => {
      updateHandles();
    });

    const root = editor.getRootElement();
    const scrollParent =
      root?.closest(".overflow-y-auto") || root?.parentElement;

    const refresh = () => updateHandles();

    window.addEventListener("resize", refresh, { passive: true });
    scrollParent?.addEventListener("scroll", refresh, { passive: true });
    updateHandles();

    return () => {
      cleanup();
      window.removeEventListener("resize", refresh);
      scrollParent?.removeEventListener("scroll", refresh);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [editor, updateHandles]);

  useEffect(() => {
    if (activeHandle) setHandles([]);
  }, [activeHandle]);

  const startDrag = useCallback(
    (e: React.MouseEvent, handle: HandleInfo) => {
      e.preventDefault();
      e.stopPropagation();

      const { tableEl, type, index } = handle;
      const fr = tableEl.rows[0];
      if (!fr) return;

      const cells = Array.from(fr.cells);
      const colWidths = cells.map((c) => c.getBoundingClientRect().width);
      const rowHeights = Array.from(tableEl.rows).map(
        (r) => r.getBoundingClientRect().height,
      );
      const tw = tableEl.getBoundingClientRect().width;
      const th = tableEl.getBoundingClientRect().height;

      // Lock layout
      tableEl.style.tableLayout = "fixed";
      tableEl.style.width = tw + "px";
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
        tableWidth: tw,
        tableHeight: th,
      };

      setActiveHandle(type);

      const cursorMap: Record<HandleType, string> = {
        col: "col-resize",
        row: "row-resize",
        corner: "nwse-resize",
      };
      document.body.style.cursor = cursorMap[type];
      document.body.style.userSelect = "none";

      // Create visual guide
      const guide = document.createElement("div");
      guide.id = "mib-resize-guide";

      const trRect = tableEl.getBoundingClientRect();
      let guideCSS = `position:fixed;z-index:999999;pointer-events:none;background:rgba(139,92,246,0.6);transition:none;`;

      if (type === "col") {
        guideCSS += `width:2px;height:${th}px;top:${trRect.top}px;left:${e.clientX}px;`;
      } else if (type === "row") {
        guideCSS += `height:2px;width:${tw}px;left:${trRect.left}px;top:${e.clientY}px;`;
      } else {
        guideCSS += `display:none;`;
      }

      guide.style.cssText = guideCSS;
      document.body.appendChild(guide);

      let moveRaf: number | null = null;

      const onMove = (ev: MouseEvent) => {
        if (moveRaf) cancelAnimationFrame(moveRaf);
        moveRaf = requestAnimationFrame(() => {
          const info = dragRef.current;
          if (!info) return;

          const g = document.getElementById("mib-resize-guide");

          if (info.type === "col") {
            const d = ev.clientX - info.startX;
            const nL = Math.max(MIN_COL_WIDTH, info.colWidths[info.index] + d);
            const nR = Math.max(
              MIN_COL_WIDTH,
              info.colWidths[info.index + 1] - d,
            );

            if (
              nL >= MIN_COL_WIDTH &&
              nR >= MIN_COL_WIDTH &&
              info.tableEl.rows[0]
            ) {
              const row0 = info.tableEl.rows[0];
              (row0.cells[info.index] as HTMLElement).style.width = nL + "px";
              (row0.cells[info.index + 1] as HTMLElement).style.width =
                nR + "px";
            }
            if (g) g.style.left = ev.clientX + "px";
          } else if (info.type === "row") {
            const d = ev.clientY - info.startY;
            const nH = Math.max(
              MIN_ROW_HEIGHT,
              info.rowHeights[info.index] + d,
            );

            if (info.tableEl.rows[info.index]) {
              (info.tableEl.rows[info.index] as HTMLElement).style.height =
                nH + "px";
            }
            if (g) g.style.top = ev.clientY + "px";
          } else {
            const dx = ev.clientX - info.startX;
            const dy = ev.clientY - info.startY;
            const sx = Math.max(
              RESIZE_SCALE_MIN,
              (info.tableWidth + dx) / info.tableWidth,
            );
            const sy = Math.max(
              RESIZE_SCALE_MIN,
              (info.tableHeight + dy) / info.tableHeight,
            );

            if (info.tableEl.rows[0]) {
              info.colWidths.forEach((w, i) => {
                const cell = info.tableEl.rows[0]?.cells[i];
                if (cell) {
                  (cell as HTMLElement).style.width =
                    Math.max(MIN_COL_WIDTH, w * sx) + "px";
                }
              });
            }

            info.tableEl.style.width =
              Math.max(MIN_TABLE_WIDTH, info.tableWidth * sx) + "px";

            info.rowHeights.forEach((h, i) => {
              const row = info.tableEl.rows[i];
              if (row) {
                (row as HTMLElement).style.height =
                  Math.max(MIN_ROW_HEIGHT, h * sy) + "px";
              }
            });
          }
        });
      };

      const onUp = () => {
        dragRef.current = null;
        setActiveHandle(null);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.getElementById("mib-resize-guide")?.remove();
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        if (moveRaf) cancelAnimationFrame(moveRaf);
        updateHandles();
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [updateHandles],
  );

  if (handles.length === 0 && !activeHandle) return null;

  return (
    <>
      {handles.map((h, i) => (
        <div
          key={`${h.type}-${h.index}-${i}`}
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
          {h.type === "col" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-0.5 h-full bg-transparent group-hover:bg-violet-500/70 transition-colors duration-100" />
            </div>
          )}
          {h.type === "row" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-0.5 w-full bg-transparent group-hover:bg-violet-500/70 transition-colors duration-100" />
            </div>
          )}
          {h.type === "corner" && (
            <div className="absolute bottom-0 right-0 w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
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
});

/* ═══════════════════ Context Menu Item ═══════════════════ */

const MenuItem = memo(function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
  disabled,
  shortcut,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  shortcut?: string;
}) {
  return (
    <motion.button
      type="button"
      whileHover={disabled ? {} : { x: 2 }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left rounded-lg transition-colors ${
        disabled
          ? "opacity-30 cursor-not-allowed"
          : danger
            ? "text-red-400 hover:text-red-300 hover:bg-red-500/10"
            : "text-(--color-text) hover:bg-(--color-active-bg)"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {shortcut && (
        <span className="text-[10px] text-(--color-gray) font-mono ml-2">
          {shortcut}
        </span>
      )}
    </motion.button>
  );
});

const MenuDivider = () => (
  <div className="my-1 border-t border-(--color-active-border)" />
);

/* ═══════════════════ Context Menu ═══════════════════ */

function TableContextMenu({
  x,
  y,
  onClose,
}: {
  x: number;
  y: number;
  onClose: () => void;
}) {
  const [editor] = useLexicalComposerContext();
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });
  const [showColors, setShowColors] = useState(false);
  const [tableInfo, setTableInfo] = useState<{
    canMerge: boolean;
    canUnmerge: boolean;
    dimensions: TableDimensions | null;
  }>({ canMerge: false, canUnmerge: false, dimensions: null });

  // Calculate position on mount
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    setPos({
      x: Math.min(x, window.innerWidth - rect.width - 12),
      y: Math.min(y, window.innerHeight - rect.height - 12),
    });
  }, [x, y]);

  // Read table state
  useEffect(() => {
    editor.getEditorState().read(() => {
      const sel = $getSelection();
      if ($isTableSelection(sel)) {
        const cells = sel.getNodes().filter($isTableCellNode);
        const table = cells[0] ? $findAncestor(cells[0], $isTableNode) : null;
        const rows = table?.getChildren().filter($isTableRowNode) ?? [];
        setTableInfo({
          canMerge: cells.length >= 2,
          canUnmerge: false,
          dimensions: table
            ? {
                rows: rows.length,
                cols: Math.max(...rows.map((r) => r.getChildrenSize())),
              }
            : null,
        });
      } else if ($isRangeSelection(sel)) {
        const ctx = $getTableContext();
        if (ctx) {
          const { colSpan, rowSpan } = $getCellBounds(ctx.cell);
          setTableInfo({
            canMerge: false,
            canUnmerge: colSpan > 1 || rowSpan > 1,
            dimensions: ctx.dimensions,
          });
        }
      }
    });
  }, [editor]);

  // Close on click outside or escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const act = useCallback(
    (fn: () => void) => {
      editor.update(fn);
      onClose();
    },
    [editor, onClose],
  );

  const handleExportCSV = useCallback(() => {
    const csv = $exportTableAsCSV(editor);
    if (csv) {
      navigator.clipboard.writeText(csv).catch(() => {
        // Fallback: create download
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "table.csv";
        a.click();
        URL.revokeObjectURL(url);
      });
    }
    onClose();
  }, [editor, onClose]);

  return createPortal(
    <motion.div
      ref={menuRef}
      variants={fadeScaleVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.1 }}
      style={{ position: "fixed", left: pos.x, top: pos.y, zIndex: 99999 }}
      className="w-60 rounded-xl border border-(--color-active-border) bg-(--color-bg) shadow-2xl p-1.5 max-h-[80vh] overflow-y-auto"
    >
      {/* Header */}
      <div className="px-3 py-1.5 mb-1 border-b border-(--color-active-border)">
        <span className="text-xs font-semibold text-(--color-gray) uppercase tracking-wider flex items-center gap-1.5">
          <Grid3X3 className="w-3 h-3" />
          Table
          {tableInfo.dimensions && (
            <span className="text-violet-400 font-normal normal-case ml-auto">
              {tableInfo.dimensions.rows}×{tableInfo.dimensions.cols}
            </span>
          )}
        </span>
      </div>

      {/* Insert */}
      <MenuItem
        icon={ArrowUp}
        label="Insert row above"
        onClick={() => act(() => $insertTableRow__EXPERIMENTAL(false))}
      />
      <MenuItem
        icon={ArrowDown}
        label="Insert row below"
        onClick={() => act(() => $insertTableRow__EXPERIMENTAL(true))}
      />
      <MenuItem
        icon={ArrowLeft}
        label="Insert column left"
        onClick={() => act(() => $insertTableColumn__EXPERIMENTAL(false))}
      />
      <MenuItem
        icon={ArrowRight}
        label="Insert column right"
        onClick={() => act(() => $insertTableColumn__EXPERIMENTAL(true))}
      />

      <MenuDivider />

      {/* Merge / Unmerge */}
      <MenuItem
        icon={Merge}
        label="Merge cells"
        onClick={() => {
          $mergeTableCellsAtSelection(editor);
          onClose();
        }}
        disabled={!tableInfo.canMerge}
      />
      <MenuItem
        icon={SplitSquareHorizontal}
        label="Unmerge cell"
        onClick={() => {
          $unmergeCellAtSelection(editor);
          onClose();
        }}
        disabled={!tableInfo.canUnmerge}
      />

      <MenuDivider />

      {/* Alignment */}
      <MenuItem
        icon={AlignLeft}
        label="Align left"
        onClick={() => {
          $setCellAlignment(editor, "left");
          onClose();
        }}
      />
      <MenuItem
        icon={AlignCenter}
        label="Align center"
        onClick={() => {
          $setCellAlignment(editor, "center");
          onClose();
        }}
      />
      <MenuItem
        icon={AlignRight}
        label="Align right"
        onClick={() => {
          $setCellAlignment(editor, "right");
          onClose();
        }}
      />

      <MenuDivider />

      {/* Cell color */}
      <div className="px-3 py-1.5">
        <button
          type="button"
          onClick={() => setShowColors((p) => !p)}
          className="w-full flex items-center gap-2.5 text-sm text-(--color-text) hover:text-violet-400 transition-colors"
        >
          <Paintbrush className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left">Cell color</span>
          <motion.span
            animate={{ rotate: showColors ? 180 : 0 }}
            className="text-xs"
          >
            ▾
          </motion.span>
        </button>
        <AnimatePresence>
          {showColors && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-1.5 mt-2">
                {CELL_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    title={color.label}
                    onClick={() => {
                      $setCellBackgroundColor(editor, color.value);
                      onClose();
                    }}
                    className="w-6 h-6 rounded-md border border-(--color-active-border) hover:scale-110 hover:border-violet-400 transition-all"
                    style={{
                      backgroundColor:
                        color.value === "transparent"
                          ? "var(--color-bg)"
                          : color.value,
                    }}
                  >
                    {color.value === "transparent" && (
                      <span className="text-[10px] text-(--color-gray)">✕</span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <MenuDivider />

      {/* Header toggles */}
      <MenuItem
        icon={ToggleLeft}
        label="Toggle header row"
        onClick={() => {
          $toggleHeaderRow(editor);
          onClose();
        }}
      />
      <MenuItem
        icon={ToggleLeft}
        label="Toggle header column"
        onClick={() => {
          $toggleHeaderColumn(editor);
          onClose();
        }}
      />

      <MenuDivider />

      {/* Sort */}
      <MenuItem
        icon={ArrowUpDown}
        label="Sort ascending"
        onClick={() => {
          $sortTableByColumn(editor, true);
          onClose();
        }}
      />
      <MenuItem
        icon={ArrowUpDown}
        label="Sort descending"
        onClick={() => {
          $sortTableByColumn(editor, false);
          onClose();
        }}
      />

      {/* Distribute & Export */}
      <MenuItem
        icon={Maximize2}
        label="Distribute columns evenly"
        onClick={() => {
          $distributeColumnsEvenly(editor);
          onClose();
        }}
      />
      <MenuItem icon={Download} label="Copy as CSV" onClick={handleExportCSV} />

      <MenuDivider />

      {/* Clear */}
      <MenuItem
        icon={RotateCcw}
        label="Clear cell contents"
        onClick={() => {
          $clearCellContents(editor);
          onClose();
        }}
      />

      {/* Delete actions */}
      <MenuItem
        icon={Trash2}
        label="Delete row"
        danger
        onClick={() => act(() => $deleteTableRow__EXPERIMENTAL())}
      />
      <MenuItem
        icon={Trash2}
        label="Delete column"
        danger
        onClick={() => act(() => $deleteTableColumn__EXPERIMENTAL())}
      />
      <MenuItem
        icon={Trash2}
        label="Delete table"
        danger
        onClick={() =>
          act(() => {
            const s = $getSelection();
            if ($isRangeSelection(s)) {
              try {
                const tableNode = $getTableNodeFromLexicalNodeOrThrow(
                  s.anchor.getNode(),
                );
                tableNode.remove();
              } catch {
                // Table already removed or not found
              }
            }
          })
        }
      />
    </motion.div>,
    document.body,
  );
}

export const TableContextMenuPlugin = memo(function TableContextMenuPlugin() {
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
        const isTable = $isTableSelection(sel);

        if (isTable || (anchor && $findAncestor(anchor, $isTableCellNode))) {
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
});

/* ═══════════════════ Toolbar Button Component ═══════════════════ */

const ToolbarBtn = memo(function ToolbarBtn({
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
}) {
  return (
    <motion.button
      type="button"
      whileTap={d ? {} : { scale: 0.92 }}
      onClick={onClick}
      disabled={d}
      title={label}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        danger
          ? "text-red-400 hover:text-red-300 hover:bg-red-500/10"
          : "text-(--color-text) hover:bg-(--color-active-bg)"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </motion.button>
  );
});

const VerticalSep = () => (
  <div className="w-px h-5 bg-(--color-active-border) mx-0.5 shrink-0" />
);

/* ═══════════════════ Floating Table Toolbar ═══════════════════ */

export const FloatingTableToolbar = memo(function FloatingTableToolbar() {
  const [editor] = useLexicalComposerContext();
  const [isInTable, setIsInTable] = useState(false);
  const [canMerge, setCanMerge] = useState(false);
  const [canUnmerge, setCanUnmerge] = useState(false);
  const [dimensions, setDimensions] = useState<TableDimensions | null>(null);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const sel = $getSelection();

        if ($isTableSelection(sel)) {
          setIsInTable(true);
          setCanMerge(sel.getNodes().filter($isTableCellNode).length >= 2);
          setCanUnmerge(false);

          const cells = sel.getNodes().filter($isTableCellNode);
          if (cells.length > 0) {
            const table = $findAncestor(cells[0], $isTableNode);
            if (table) {
              const rows = table.getChildren().filter($isTableRowNode);
              setDimensions({
                rows: rows.length,
                cols: Math.max(...rows.map((r) => r.getChildrenSize())),
              });
            }
          }
          return;
        }

        if ($isRangeSelection(sel)) {
          const cell = $findAncestor(sel.anchor.getNode(), $isTableCellNode);
          if (cell) {
            setIsInTable(true);
            setCanMerge(false);
            const { colSpan, rowSpan } = $getCellBounds(cell);
            setCanUnmerge(colSpan > 1 || rowSpan > 1);

            const ctx = $getTableContext();
            if (ctx) setDimensions(ctx.dimensions);
            return;
          }
        }

        setIsInTable(false);
        setCanMerge(false);
        setCanUnmerge(false);
        setDimensions(null);
      });
    });
  }, [editor]);

  if (!isInTable) return null;

  const act = (fn: () => void) => editor.update(fn);

  return (
    <motion.div
      variants={toolbarVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-wrap items-center gap-0.5 px-3 py-1.5 border-t border-(--color-active-border) bg-(--color-active-bg) shrink-0"
    >
      <Grid3X3 className="w-3.5 h-3.5 text-violet-400 mr-1" />
      <span className="text-xs text-violet-400 font-semibold mr-1 hidden sm:inline">
        Table
      </span>
      {dimensions && (
        <span className="text-[10px] text-(--color-gray) mr-2 hidden sm:inline font-mono">
          {dimensions.rows}×{dimensions.cols}
        </span>
      )}

      <ToolbarBtn
        icon={ArrowUp}
        label="Row ↑"
        onClick={() => act(() => $insertTableRow__EXPERIMENTAL(false))}
      />
      <ToolbarBtn
        icon={ArrowDown}
        label="Row ↓"
        onClick={() => act(() => $insertTableRow__EXPERIMENTAL(true))}
      />
      <ToolbarBtn
        icon={ArrowLeft}
        label="Col ←"
        onClick={() => act(() => $insertTableColumn__EXPERIMENTAL(false))}
      />
      <ToolbarBtn
        icon={ArrowRight}
        label="Col →"
        onClick={() => act(() => $insertTableColumn__EXPERIMENTAL(true))}
      />

      <VerticalSep />

      <ToolbarBtn
        icon={Merge}
        label="Merge"
        onClick={() => $mergeTableCellsAtSelection(editor)}
        disabled={!canMerge}
      />
      <ToolbarBtn
        icon={SplitSquareHorizontal}
        label="Unmerge"
        onClick={() => $unmergeCellAtSelection(editor)}
        disabled={!canUnmerge}
      />
      <ToolbarBtn
        icon={ToggleLeft}
        label="Header"
        onClick={() => $toggleHeaderRow(editor)}
      />

      <VerticalSep />

      <ToolbarBtn
        icon={AlignLeft}
        label="Left"
        onClick={() => $setCellAlignment(editor, "left")}
      />
      <ToolbarBtn
        icon={AlignCenter}
        label="Center"
        onClick={() => $setCellAlignment(editor, "center")}
      />
      <ToolbarBtn
        icon={AlignRight}
        label="Right"
        onClick={() => $setCellAlignment(editor, "right")}
      />

      <VerticalSep />

      <ToolbarBtn
        icon={Maximize2}
        label="Distribute"
        onClick={() => $distributeColumnsEvenly(editor)}
      />
      <ToolbarBtn
        icon={ArrowUpDown}
        label="Sort ↑"
        onClick={() => $sortTableByColumn(editor, true)}
      />

      <VerticalSep />

      <ToolbarBtn
        icon={Rows3}
        label="Del Row"
        danger
        onClick={() => act(() => $deleteTableRow__EXPERIMENTAL())}
      />
      <ToolbarBtn
        icon={Columns3}
        label="Del Col"
        danger
        onClick={() => act(() => $deleteTableColumn__EXPERIMENTAL())}
      />
      <ToolbarBtn
        icon={Trash2}
        label="Del Table"
        danger
        onClick={() =>
          act(() => {
            const s = $getSelection();
            if ($isRangeSelection(s)) {
              try {
                $getTableNodeFromLexicalNodeOrThrow(
                  s.anchor.getNode(),
                ).remove();
              } catch {
                // Already gone
              }
            }
          })
        }
      />
    </motion.div>
  );
});

/* ═══════════════════ Table Toolbar Button (for main toolbar) ═══════════════════ */

export const TableToolbarButton = memo(function TableToolbarButton({
  ToolbarButton,
}: {
  ToolbarButton: React.ComponentType<{
    active?: boolean;
    onClick: () => void;
    title: string;
    children: React.ReactNode;
  }>;
}) {
  const [editor] = useLexicalComposerContext();
  const [show, setShow] = useState(false);

  const handleClose = useCallback(() => setShow(false), []);
  const handleToggle = useCallback(() => setShow((p) => !p), []);
  const handleSelect = useCallback(
    (r: number, c: number) => insertTable(editor, r, c),
    [editor],
  );

  return (
    <div className="relative">
      <ToolbarButton active={show} onClick={handleToggle} title="Insert Table">
        <Table className="w-4 h-4" />
      </ToolbarButton>
      <AnimatePresence>
        {show && (
          <>
            <div className="fixed inset-0 z-10000" onClick={handleClose} />
            <TableSizePicker onSelect={handleSelect} onClose={handleClose} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
});

/* ═══════════════════ Quick Add Buttons Plugin ═══════════════════ */

export const TableQuickAddPlugin = memo(function TableQuickAddPlugin() {
  const [editor] = useLexicalComposerContext();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const sel = $getSelection();
        if ($isRangeSelection(sel)) {
          const cell = $findAncestor(sel.anchor.getNode(), $isTableCellNode);
          setVisible(!!cell);
        } else {
          setVisible(false);
        }
      });
    });
  }, [editor]);

  if (!visible) return null;

  return null;
});
