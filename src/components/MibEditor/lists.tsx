// components/MibEditor/lists.tsx

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ElementType,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  List,
  ListOrdered,
  CheckSquare,
  IndentDecrease,
  IndentIncrease,
  ListX,
  ChevronDown,
  Plus,
} from "lucide-react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  ListNode,
  ListItemNode,
  $isListNode,
  $isListItemNode,
  $handleListInsertParagraph,
  $createListNode,
  $createListItemNode,
} from "@lexical/list";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $createTextNode,
  $isElementNode,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  INDENT_CONTENT_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_TAB_COMMAND,
  KEY_BACKSPACE_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import { AnimatePresence, motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════
   Types
═══════════════════════════════════════════════════════════════ */

export type ListType = "bullet" | "number" | "check";

export interface ListBlockInfo {
  label: string;
  shortcut: string;
  Icon: ElementType;
  type: ListType;
}

export type TBProps = {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: ReactNode;
  btnDisabled?: boolean;
};

/* ═══════════════════════════════════════════════════════════════
   Config
═══════════════════════════════════════════════════════════════ */

export const LIST_BLOCKS: readonly ListBlockInfo[] = [
  {
    label: "Bullet List",
    shortcut: "Ctrl+Shift+8",
    Icon: List,
    type: "bullet",
  },
  {
    label: "Numbered List",
    shortcut: "Ctrl+Shift+7",
    Icon: ListOrdered,
    type: "number",
  },
  {
    label: "Check List",
    shortcut: "Ctrl+Shift+9",
    Icon: CheckSquare,
    type: "check",
  },
] as const;

const LIST_CMD_MAP = {
  bullet: INSERT_UNORDERED_LIST_COMMAND,
  number: INSERT_ORDERED_LIST_COMMAND,
  check: INSERT_CHECK_LIST_COMMAND,
} as const;

const LIST_LEXICAL_TYPE_MAP: Record<ListType, "bullet" | "number" | "check"> = {
  bullet: "bullet",
  number: "number",
  check: "check",
};

/* ═══════════════════════════════════════════════════════════════
   $ helpers
═══════════════════════════════════════════════════════════════ */

function $listNodeToType(node: ListNode): ListType {
  const t = node.getListType();
  if (t === "number") return "number";
  if (t === "check") return "check";
  return "bullet";
}

export function $getActiveListType(): ListType | null {
  const sel = $getSelection();
  if (!$isRangeSelection(sel)) return null;
  const anchor = sel.anchor.getNode();

  const li = $findMatchingParent(anchor, $isListItemNode);
  if ($isListItemNode(li)) {
    const list = li.getParent();
    if ($isListNode(list)) return $listNodeToType(list);
  }

  const list = $findMatchingParent(anchor, $isListNode);
  if ($isListNode(list)) return $listNodeToType(list);

  try {
    const top = anchor.getTopLevelElementOrThrow();
    if ($isListNode(top)) return $listNodeToType(top);
  } catch {}

  return null;
}

export function $getActiveListDepth(): number {
  const sel = $getSelection();
  if (!$isRangeSelection(sel)) return 0;
  const anchor = sel.anchor.getNode();
  const li = $findMatchingParent(anchor, $isListItemNode);
  if (!$isListItemNode(li)) return 0;

  let depth = 0;
  let cursor = li.getParent();
  while ($isListNode(cursor)) {
    depth++;
    const parentLi = cursor.getParent();
    cursor = $isListItemNode(parentLi) ? parentLi.getParent() : null;
  }
  return Math.max(0, depth - 1);
}

function $getEnclosingTopLevelList(): ListNode | null {
  const sel = $getSelection();
  if (!$isRangeSelection(sel)) return null;
  const anchor = sel.anchor.getNode();

  const li = $findMatchingParent(anchor, $isListItemNode);
  if (!$isListItemNode(li)) return null;

  let topList: ListNode | null = null;
  let cursor = li.getParent();
  while ($isListNode(cursor)) {
    topList = cursor;
    const parentLi = cursor.getParent();
    cursor = $isListItemNode(parentLi) ? parentLi.getParent() : null;
  }
  return topList;
}

function $insertNewListAfter(type: ListType, afterNode: ListNode): void {
  const newList = $createListNode(LIST_LEXICAL_TYPE_MAP[type]);
  const newItem = $createListItemNode();
  newItem.append($createTextNode(""));
  newList.append(newItem);
  afterNode.insertAfter(newList);
  newItem.selectStart();
}

/**
 * Check if cursor is at the very beginning of a list item.
 * Handles both:
 *   ListItemNode → TextNode (offset 0)
 *   ListItemNode → ParagraphNode → TextNode (offset 0 of paragraph)
 */
function $isCursorAtStartOfListItem(
  listItem: ListItemNode,
  anchor: { getNode: () => any; offset: number },
): boolean {
  if (anchor.offset !== 0) return false;

  const node = anchor.getNode();

  // Walk from anchor node up to the list item.
  // At every level, check there's no previous sibling with content.
  let current = node;
  while (current && current !== listItem) {
    const prev = current.getPreviousSibling();
    if (prev && prev.getTextContentSize() > 0) {
      return false;
    }
    current = current.getParent();
  }

  return true;
}

/* ═══════════════════════════════════════════════════════════════
   useActiveListType
═══════════════════════════════════════════════════════════════ */

export function useActiveListType(): ListType | null {
  const [editor] = useLexicalComposerContext();
  const [activeType, setActiveType] = useState<ListType | null>(null);
  const ref = useRef<ListType | null>(null);

  useEffect(() => {
    function sync() {
      const next = editor.getEditorState().read($getActiveListType);
      if (next !== ref.current) {
        ref.current = next;
        setActiveType(next);
      }
    }

    sync();

    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          sync();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerUpdateListener(() => sync()),
    );
  }, [editor]);

  return activeType;
}

/* ═══════════════════════════════════════════════════════════════
   useListActions
═══════════════════════════════════════════════════════════════ */

export function useListActions() {
  const [editor] = useLexicalComposerContext();

  const toggleList = useCallback(
    (type: ListType) => {
      const current = editor.getEditorState().read($getActiveListType);

      if (current === type) {
        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        return;
      }

      const enclosing = editor.getEditorState().read($getEnclosingTopLevelList);

      if (enclosing !== null) {
        editor.update(() => {
          const topList = $getEnclosingTopLevelList();
          if (!topList) {
            editor.dispatchCommand(LIST_CMD_MAP[type], undefined);
            return;
          }
          $insertNewListAfter(type, topList);
        });
        return;
      }

      editor.dispatchCommand(LIST_CMD_MAP[type], undefined);
    },
    [editor],
  );

  const clearList = useCallback(
    () => editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined),
    [editor],
  );

  const indent = useCallback(
    () => editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined),
    [editor],
  );

  const outdent = useCallback(
    () => editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined),
    [editor],
  );

  return { toggleList, clearList, indent, outdent };
}

/* ═══════════════════════════════════════════════════════════════
   ListBackspacePlugin
   
   Cursor list item এর একদম শুরুতে (offset 0) থাকলে
   Backspace → item টা list থেকে বের করে paragraph বানায়।
   
   HOW TO TEST:
   1. List item এ cursor রাখো
   2. Home key চাপুন (cursor line এর একদম শুরুতে যাবে)
   3. তারপর Backspace চাপুন
   4. Item list থেকে বের হয়ে paragraph হবে
═══════════════════════════════════════════════════════════════ */

export function ListBackspacePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (event: KeyboardEvent) => {
        let handled = false;

        editor.update(() => {
          const sel = $getSelection();
          if (!$isRangeSelection(sel) || !sel.isCollapsed()) return;

          const anchor = sel.anchor;
          const node = anchor.getNode();

          const listItem = $findMatchingParent(node, $isListItemNode);
          if (!$isListItemNode(listItem)) return;

          const list = listItem.getParent();
          if (!$isListNode(list)) return;

          // ✅ Smart check: cursor at logical start of list item?
          if (!$isCursorAtStartOfListItem(listItem, anchor)) {
            // Not at start — let Lexical handle normal backspace
            return;
          }

          // Depth > 0 → let Lexical handle outdent
          const depth = $getActiveListDepth();
          if (depth > 0) return;

          // No nested lists
          const hasNestedList = listItem
            .getChildren()
            .some((child) => $isListNode(child));
          if (hasNestedList) return;

          // ✅ All checks passed — convert to paragraph
          handled = true;

          const para = $createParagraphNode();
          const children = listItem.getChildren();
          children.forEach((child) => para.append(child));

          const siblings = list.getChildren();

          if (siblings.length === 1) {
            // Only item → replace entire list
            list.replace(para);
          } else {
            const prev = listItem.getPreviousSibling();
            const next = listItem.getNextSibling();

            if (!prev) {
              // First item → paragraph before list
              list.insertBefore(para);
              listItem.remove();
            } else if (!next) {
              // Last item → paragraph after list
              list.insertAfter(para);
              listItem.remove();
            } else {
              // Middle item → split list
              const newList = $createListNode(list.getListType());
              let sib = next;
              while (sib) {
                const toMove = sib;
                sib = sib.getNextSibling();
                newList.append(toMove);
              }
              listItem.remove();
              list.insertAfter(para);
              if (newList.getChildrenSize() > 0) {
                para.insertAfter(newList);
              }
            }
          }

          para.selectStart();
        });

        if (handled) {
          event.preventDefault();
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor]);

  return null;
}

/* ═══════════════════════════════════════════════════════════════
   ListTabIndentPlugin
═══════════════════════════════════════════════════════════════ */

export function ListTabIndentPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_TAB_COMMAND,
      (event: KeyboardEvent) => {
        const sel = $getSelection();
        if (!$isRangeSelection(sel)) return false;

        const anchor = sel.anchor.getNode();
        const li = $findMatchingParent(anchor, $isListItemNode);
        if (!$isListItemNode(li)) return false;

        event.preventDefault();
        editor.dispatchCommand(
          event.shiftKey ? OUTDENT_CONTENT_COMMAND : INDENT_CONTENT_COMMAND,
          undefined,
        );
        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor]);

  return null;
}

/* ═══════════════════════════════════════════════════════════════
   ListEnterPlugin
═══════════════════════════════════════════════════════════════ */

export function ListEnterPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent | null) => {
        const sel = $getSelection();
        if (!$isRangeSelection(sel) || !sel.isCollapsed()) return false;

        const anchor = sel.anchor.getNode();
        const li = $findMatchingParent(anchor, $isListItemNode);
        if (!$isListItemNode(li)) return false;

        const isEmpty =
          li.getTextContent().trim() === "" &&
          li.getChildren().every((c) => !$isListNode(c));

        if (!isEmpty) {
          return $handleListInsertParagraph();
        }

        const depth = $getActiveListDepth();

        if (depth > 0) {
          event?.preventDefault();
          editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
          return true;
        }

        event?.preventDefault();
        editor.update(() => {
          const s = $getSelection();
          if (!$isRangeSelection(s)) return;

          const node = s.anchor.getNode();
          const item = $findMatchingParent(node, $isListItemNode);
          if (!$isListItemNode(item)) return;

          const list = item.getParent();
          if (!$isListNode(list)) return;

          const para = $createParagraphNode();
          const children = list.getChildren();

          if (children.length === 1) {
            list.insertAfter(para);
            list.remove();
          } else {
            item.remove();
            list.insertAfter(para);
          }

          para.select();
        });
        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor]);

  return null;
}

/* ═══════════════════════════════════════════════════════════════
   ListKeyboardShortcutPlugin
═══════════════════════════════════════════════════════════════ */

export function ListKeyboardShortcutPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const TYPE_MAP: Record<string, ListType> = {
      "7": "number",
      "8": "bullet",
      "9": "check",
    };

    function onKeyDown(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey) || !e.shiftKey) return;
      const type = TYPE_MAP[e.key];
      if (!type) return;
      e.preventDefault();

      const current = editor.getEditorState().read($getActiveListType);
      if (current === type) {
        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        return;
      }

      const enclosing = editor.getEditorState().read($getEnclosingTopLevelList);

      if (enclosing !== null) {
        editor.update(() => {
          const topList = $getEnclosingTopLevelList();
          if (!topList) {
            editor.dispatchCommand(LIST_CMD_MAP[type], undefined);
            return;
          }
          $insertNewListAfter(type, topList);
        });
        return;
      }

      editor.dispatchCommand(LIST_CMD_MAP[type], undefined);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editor]);

  return null;
}

/* ═══════════════════════════════════════════════════════════════
   ListDropdown
═══════════════════════════════════════════════════════════════ */

function ListDropdown({
  activeListType,
  ToolbarButton,
}: {
  activeListType: ListType | null;
  ToolbarButton: ComponentType<TBProps>;
}) {
  const { toggleList } = useListActions();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: Event) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("focusin", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("focusin", handler);
    };
  }, [open]);

  const ActiveIcon =
    LIST_BLOCKS.find((b) => b.type === activeListType)?.Icon ?? List;

  return (
    <div ref={ref} className="relative">
      <ToolbarButton
        active={activeListType !== null}
        onClick={() => setOpen((v) => !v)}
        title="List style"
      >
        <span className="flex items-center gap-0.5">
          <ActiveIcon className="h-4 w-4" />
          <ChevronDown
            className={`h-2.5 w-2.5 opacity-60 transition-transform duration-150 ${
              open ? "rotate-180" : ""
            }`}
          />
        </span>
      </ToolbarButton>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.1 }}
            className="absolute left-0 top-full mt-1.5 z-50 w-56 rounded-xl border border-(--color-active-border) bg-(--color-bg) shadow-xl shadow-black/20 overflow-hidden"
          >
            <div className="px-3 pt-2.5 pb-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-(--color-gray)">
                List Type
              </p>
            </div>

            <div className="p-1">
              {LIST_BLOCKS.map(({ label, shortcut, Icon, type }) => {
                const isActive = activeListType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      toggleList(type);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-100 text-left group ${
                      isActive
                        ? "bg-violet-500/20 text-violet-300"
                        : "text-(--color-text) hover:bg-(--color-active-bg)"
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center w-7 h-7 rounded-md shrink-0 transition-colors ${
                        isActive
                          ? "bg-violet-500/30"
                          : "bg-(--color-active-border) group-hover:bg-violet-500/15"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="flex-1 font-medium">{label}</span>
                    <kbd
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                        isActive
                          ? "border-violet-400/30 text-violet-300/70 bg-violet-500/10"
                          : "border-(--color-active-border) text-(--color-gray)"
                      }`}
                    >
                      {shortcut}
                    </kbd>
                  </button>
                );
              })}
            </div>

            {activeListType !== null && (
              <div className="px-3 pb-2.5 pt-1 border-t border-(--color-active-border) mt-1">
                <p className="text-[10px] text-(--color-gray) leading-snug flex items-center gap-1.5">
                  <Plus className="w-3 h-3 shrink-0" />
                  Different type adds new list below
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ListToolbarButtons
═══════════════════════════════════════════════════════════════ */

export function ListToolbarButtons({
  activeListType,
  ToolbarButton,
  showExtraActions = false,
}: {
  activeListType: ListType | null;
  ToolbarButton: ComponentType<TBProps>;
  showExtraActions?: boolean;
}) {
  const { indent, outdent, clearList } = useListActions();

  const handleOutdent = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      e.preventDefault();
      outdent();
    },
    [outdent],
  );
  const handleIndent = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      e.preventDefault();
      indent();
    },
    [indent],
  );
  const handleClear = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      e.preventDefault();
      clearList();
    },
    [clearList],
  );

  return (
    <>
      <ListDropdown
        activeListType={activeListType}
        ToolbarButton={ToolbarButton}
      />

      {showExtraActions && activeListType !== null && (
        <>
          <span onMouseDown={handleOutdent}>
            <ToolbarButton onClick={() => {}} title="Outdent (Shift+Tab)">
              <IndentDecrease className="h-4 w-4" />
            </ToolbarButton>
          </span>
          <span onMouseDown={handleIndent}>
            <ToolbarButton onClick={() => {}} title="Indent (Tab)">
              <IndentIncrease className="h-4" />
            </ToolbarButton>
          </span>
          <span onMouseDown={handleClear}>
            <ToolbarButton onClick={() => {}} title="Remove List">
              <ListX className="h-4 w-4" />
            </ToolbarButton>
          </span>
        </>
      )}
    </>
  );
}
