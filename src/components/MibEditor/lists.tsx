// components/MibEditor/lists.tsx
"use client";

import { useCallback } from "react";
import { List, ListOrdered, CheckSquare } from "lucide-react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  ListNode,
} from "@lexical/list";
import { $getSelection, $isRangeSelection } from "lexical";
import { $getNearestNodeOfType } from "@lexical/utils";
import { $isListNode } from "@lexical/list";

/* ─── Types ─── */
export type ListType = "bullet" | "number" | "check";

export interface ListBlockInfo {
  label: string;
  Icon: React.ElementType;
  type: ListType;
}

/* ─── Config ─── */
export const LIST_BLOCKS: ListBlockInfo[] = [
  { label: "Bullet List", Icon: List, type: "bullet" },
  { label: "Numbered List", Icon: ListOrdered, type: "number" },
  { label: "Check List", Icon: CheckSquare, type: "check" },
];

/* ─── Helper: detect current list type ─── */
export function $getActiveListType(): ListType | null {
  const sel = $getSelection();
  if (!$isRangeSelection(sel)) return null;
  const anchor = sel.anchor.getNode();
  const parent = $getNearestNodeOfType<ListNode>(anchor, ListNode);
  if (!parent) {
    const el =
      anchor.getKey() === "root" ? anchor : anchor.getTopLevelElementOrThrow();
    if ($isListNode(el)) {
      const lt = el.getListType();
      if (lt === "bullet") return "bullet";
      if (lt === "check") return "check";
      return "number";
    }
    return null;
  }
  const lt = parent.getListType();
  if (lt === "bullet") return "bullet";
  if (lt === "check") return "check";
  return "number";
}

/* ─── Hook: useListActions ─── */
export function useListActions() {
  const [editor] = useLexicalComposerContext();

  const toggleList = useCallback(
    (type: ListType, currentType: ListType | null) => {
      if (type === "bullet") {
        editor.dispatchCommand(
          currentType === "bullet"
            ? REMOVE_LIST_COMMAND
            : INSERT_UNORDERED_LIST_COMMAND,
          undefined,
        );
      } else if (type === "number") {
        editor.dispatchCommand(
          currentType === "number"
            ? REMOVE_LIST_COMMAND
            : INSERT_ORDERED_LIST_COMMAND,
          undefined,
        );
      } else if (type === "check") {
        editor.dispatchCommand(
          currentType === "check"
            ? REMOVE_LIST_COMMAND
            : INSERT_CHECK_LIST_COMMAND,
          undefined,
        );
      }
    },
    [editor],
  );

  return { toggleList };
}

/* ─── Toolbar Buttons ─── */
export function ListToolbarButtons({
  activeListType,
  ToolbarButton,
}: {
  activeListType: ListType | null;
  ToolbarButton: React.ComponentType<{
    active?: boolean;
    onClick: () => void;
    title: string;
    children: React.ReactNode;
  }>;
}) {
  const { toggleList } = useListActions();

  return (
    <>
      {LIST_BLOCKS.map(({ label, Icon, type }) => (
        <ToolbarButton
          key={type}
          active={activeListType === type}
          onClick={() => toggleList(type, activeListType)}
          title={label}
        >
          <Icon className="w-4 h-4" />
        </ToolbarButton>
      ))}
    </>
  );
}
