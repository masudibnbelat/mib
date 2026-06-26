// components/MibEditor/table.tsx
"use client";

import { useEffect, useCallback, useState, useRef } from "react";
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
} from "lucide-react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $createTextNode,
  LexicalEditor,
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
  $getTableNodeFromLexicalNodeOrThrow,
  $deleteTableColumn__EXPERIMENTAL,
  $deleteTableRow__EXPERIMENTAL,
  $insertTableColumn__EXPERIMENTAL,
  $insertTableRow__EXPERIMENTAL,
  $unmergeCell,
} from "@lexical/table";

/* ═══════════════════ Helpers (self-contained) ═══════════════════ */

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
    if ((cell.getColSpan?.() ?? 1) <= 1 && (cell.getRowSpan?.() ?? 1) <= 1)
      return;
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

/* ═══════════════════ Table Style Injector ═══════════════════ */

export function TableStyleInjector() {
  useEffect(() => {
    const id = "mib-table-styles";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      .mib-table { border-collapse: collapse !important; table-layout: fixed; border: 2px solid var(--color-active-border) !important; border-radius: 0 !important; overflow: visible !important; position: relative; }
      .mib-table-cell, .mib-table-cell-header { border: 1.5px solid var(--color-active-border) !important; padding: 6px 10px !important; vertical-align: top; position: relative; min-width: 40px; word-wrap: break-word; overflow-wrap: break-word; }
      .mib-table-cell-header { font-weight: 600; background: var(--color-active-bg) !important; }
      .mib-table-cell:focus-within, .mib-table-cell-header:focus-within { outline: 2px solid rgba(139, 92, 246, 0.5); outline-offset: -2px; z-index: 1; }
      .mib-table-cell.selected, .mib-table-cell-header.selected { background: rgba(139, 92, 246, 0.12) !important; }
      .mib-table-wrapper { overflow-x: auto; overflow-y: visible; position: relative; margin: 16px 0; }
    `;
    document.head.appendChild(style);
    return () => {
      document.getElementById(id)?.remove();
    };
  }, []);
  return null;
}

/* ═══════════════════ Insert Table ═══════════════════ */

export function insertTable(editor: LexicalEditor, rows: number, cols: number) {
  editor.update(() => {
    const tableNode = $createTableNode();
    for (let r = 0; r < rows; r++) {
      const rowNode = $createTableRowNode();
      for (let c = 0; c < cols; c++) {
        const cellNode = $createTableCellNode(
          r === 0 ? TableCellHeaderStates.ROW : TableCellHeaderStates.NO_STATUS,
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
      tableNode.insertAfter($createParagraphNode());
    } else {
      $getRoot().append(tableNode);
      $getRoot().append($createParagraphNode());
    }
  });
}

/* ═══════════════════ Table Size Picker ═══════════════════ */

export function TableSizePicker({
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

/* ═══════════════════ Table Resize Plugin ═══════════════════ */

type HandleType = "col" | "row" | "corner";
interface HandleInfo {
  type: HandleType;
  tableEl: HTMLTableElement;
  index: number;
  rect: { x: number; y: number; w: number; h: number };
}

export function TableResizePlugin() {
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

  const updateHandles = useCallback(() => {
    const root = editor.getRootElement();
    if (!root) {
      setHandles([]);
      return;
    }
    const tables = root.querySelectorAll<HTMLTableElement>("table.mib-table");
    const all: HandleInfo[] = [];
    tables.forEach((tableEl) => {
      const tr = tableEl.getBoundingClientRect();
      const fr = tableEl.rows[0];
      if (!fr) return;
      const cells = Array.from(fr.cells);
      for (let i = 0; i < cells.length - 1; i++) {
        const cr = cells[i].getBoundingClientRect();
        all.push({
          type: "col",
          tableEl,
          index: i,
          rect: { x: cr.right - 3, y: tr.top, w: 6, h: tr.height },
        });
      }
      const rows = Array.from(tableEl.rows);
      for (let i = 0; i < rows.length - 1; i++) {
        const rr = rows[i].getBoundingClientRect();
        all.push({
          type: "row",
          tableEl,
          index: i,
          rect: { x: tr.left, y: rr.bottom - 3, w: tr.width, h: 6 },
        });
      }
      all.push({
        type: "corner",
        tableEl,
        index: 0,
        rect: { x: tr.right - 8, y: tr.bottom - 8, w: 16, h: 16 },
      });
    });
    setHandles(all);
  }, [editor]);

  useEffect(() => {
    const cleanup = editor.registerUpdateListener(() => {
      requestAnimationFrame(updateHandles);
    });

    const root = editor.getRootElement();
    const sp = root?.closest(".overflow-y-auto") || root?.parentElement;
    const refresh = () => requestAnimationFrame(updateHandles);

    window.addEventListener("resize", refresh);
    sp?.addEventListener("scroll", refresh);

    requestAnimationFrame(updateHandles);

    return () => {
      if (typeof cleanup === "function") {
        cleanup();
      } else if (
        cleanup &&
        typeof (cleanup as { unregister?: () => void }).unregister ===
          "function"
      ) {
        (cleanup as { unregister: () => void }).unregister();
      } else if (
        cleanup &&
        typeof (cleanup as { dispose?: () => void }).dispose === "function"
      ) {
        (cleanup as { dispose: () => void }).dispose();
      }

      window.removeEventListener("resize", refresh);
      sp?.removeEventListener("scroll", refresh);
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
      const cm: Record<HandleType, string> = {
        col: "col-resize",
        row: "row-resize",
        corner: "nwse-resize",
      };
      document.body.style.cursor = cm[type];
      document.body.style.userSelect = "none";
      const guide = document.createElement("div");
      guide.id = "mib-resize-guide";
      guide.style.cssText = `position:fixed;z-index:999999;pointer-events:none;background:rgba(139,92,246,0.6);${type === "col" ? `width:2px;height:${th}px;top:${tableEl.getBoundingClientRect().top}px;left:${e.clientX}px;` : ""}${type === "row" ? `height:2px;width:${tw}px;left:${tableEl.getBoundingClientRect().left}px;top:${e.clientY}px;` : ""}${type === "corner" ? "display:none;" : ""}`;
      document.body.appendChild(guide);
      const onMove = (ev: MouseEvent) => {
        const info = dragRef.current;
        if (!info) return;
        const g = document.getElementById("mib-resize-guide");
        if (info.type === "col") {
          const d = ev.clientX - info.startX;
          const MIN = 30;
          const nL = Math.max(MIN, info.colWidths[info.index] + d);
          const nR = Math.max(MIN, info.colWidths[info.index + 1] - d);
          if (nL >= MIN && nR >= MIN && info.tableEl.rows[0]) {
            (
              info.tableEl.rows[0].cells[info.index] as HTMLElement
            ).style.width = nL + "px";
            (
              info.tableEl.rows[0].cells[info.index + 1] as HTMLElement
            ).style.width = nR + "px";
          }
          if (g) g.style.left = ev.clientX + "px";
        } else if (info.type === "row") {
          const d = ev.clientY - info.startY;
          const nH = Math.max(20, info.rowHeights[info.index] + d);
          if (info.tableEl.rows[info.index])
            (info.tableEl.rows[info.index] as HTMLElement).style.height =
              nH + "px";
          if (g) g.style.top = ev.clientY + "px";
        } else {
          const dx = ev.clientX - info.startX;
          const dy = ev.clientY - info.startY;
          const sx = Math.max(0.3, (info.tableWidth + dx) / info.tableWidth);
          const sy = Math.max(0.3, (info.tableHeight + dy) / info.tableHeight);
          if (info.tableEl.rows[0])
            info.colWidths.forEach((w, i) => {
              (info.tableEl.rows[0].cells[i] as HTMLElement).style.width =
                Math.max(30, w * sx) + "px";
            });
          info.tableEl.style.width = Math.max(100, info.tableWidth * sx) + "px";
          info.rowHeights.forEach((h, i) => {
            (info.tableEl.rows[i] as HTMLElement).style.height =
              Math.max(20, h * sy) + "px";
          });
        }
      };
      const onUp = () => {
        dragRef.current = null;
        setActiveHandle(null);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.getElementById("mib-resize-guide")?.remove();
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        requestAnimationFrame(updateHandles);
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

  useEffect(() => {
    if (!menuRef.current) return;
    setPos({
      x: Math.min(x, innerWidth - menuRef.current.offsetWidth - 12),
      y: Math.min(y, innerHeight - menuRef.current.offsetHeight - 12),
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

  const act = (fn: () => void) => {
    editor.update(fn);
    onClose();
  };
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
            const s = $getSelection();
            if ($isRangeSelection(s))
              try {
                $getTableNodeFromLexicalNodeOrThrow(
                  s.anchor.getNode(),
                ).remove();
              } catch {}
          })
        }
      />
    </motion.div>,
    document.body,
  );
}

export function TableContextMenuPlugin() {
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
        if (anchor && $findAncestor(anchor, $isTableCellNode)) {
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

/* ═══════════════════ Floating Table Toolbar ═══════════════════ */

export function FloatingTableToolbar() {
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
          const cell = $findAncestor(sel.anchor.getNode(), $isTableCellNode);
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
  const VS = () => (
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
      <VS />
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
      <VS />
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
            const s = $getSelection();
            if ($isRangeSelection(s))
              try {
                $getTableNodeFromLexicalNodeOrThrow(
                  s.anchor.getNode(),
                ).remove();
              } catch {}
          })
        }
      />
    </motion.div>
  );
}

/* ═══════════════════ Table Toolbar Button (for main toolbar) ═══════════════════ */

export function TableToolbarButton({
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

  return (
    <div className="relative">
      <ToolbarButton
        active={show}
        onClick={() => setShow((p) => !p)}
        title="Insert Table"
      >
        <Table className="w-4 h-4" />
      </ToolbarButton>
      <AnimatePresence>
        {show && (
          <>
            <div
              className="fixed inset-0 z-10000"
              onClick={() => setShow(false)}
            />
            <TableSizePicker
              onSelect={(r, c) => insertTable(editor, r, c)}
              onClose={() => setShow(false)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
