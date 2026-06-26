// components/MibEditor/lists.tsx
"use client";

import {
  useCallback,
  useEffect,
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
} from "lucide-react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  ListNode,
  $isListNode,
} from "@lexical/list";
import {
  $getSelection,
  $isRangeSelection,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  type LexicalEditor,
} from "lexical";
import { $getNearestNodeOfType } from "@lexical/utils";

/* ─── Types ─── */
export type ListType = "bullet" | "number" | "check";

export interface ListBlockInfo {
  label: string;
  Icon: ElementType;
  type: ListType;
}

/* ─── Command Map ─── */
const LIST_COMMANDS = {
  bullet: INSERT_UNORDERED_LIST_COMMAND,
  number: INSERT_ORDERED_LIST_COMMAND,
  check: INSERT_CHECK_LIST_COMMAND,
} as const;

/* ─── Config ─── */
export const LIST_BLOCKS: ListBlockInfo[] = [
  { label: "Bullet List", Icon: List, type: "bullet" },
  { label: "Numbered List", Icon: ListOrdered, type: "number" },
  { label: "Check List", Icon: CheckSquare, type: "check" },
];

/* ─── Helper: detect current list type ─── */
export function $getActiveListType(): ListType | null {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return null;

  const anchorNode = selection.anchor.getNode();
  const nearestList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode);

  const listNode =
    nearestList ??
    (() => {
      const topLevel =
        anchorNode.getKey() === "root"
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      return $isListNode(topLevel) ? topLevel : null;
    })();

  if (!listNode) return null;

  const lt = (listNode as ListNode).getListType();
  if (lt === "bullet") return "bullet";
  if (lt === "check") return "check";
  return "number";
}

/* ─── Read active type outside update ─── */
function readActiveListType(editor: LexicalEditor): ListType | null {
  let result: ListType | null = null;
  editor.getEditorState().read(() => {
    result = $getActiveListType();
  });
  return result;
}

/* ─── Hook: useListActions ─── */
export function useListActions() {
  const [editor] = useLexicalComposerContext();

  const toggleList = useCallback(
    (type: ListType) => {
      const currentType = readActiveListType(editor);
      editor.focus(() => {
        if (currentType === type) {
          editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        } else {
          editor.dispatchCommand(LIST_COMMANDS[type], undefined);
        }
      });
    },
    [editor],
  );

  const clearList = useCallback(() => {
    editor.focus(() => {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    });
  }, [editor]);

  const indentList = useCallback(() => {
    editor.focus(() => {
      editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
    });
  }, [editor]);

  const outdentList = useCallback(() => {
    editor.focus(() => {
      editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
    });
  }, [editor]);

  return { toggleList, clearList, indentList, outdentList };
}

/* ─── Prevent selection loss ─── */
function preventBlur(action: () => void) {
  return (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };
}

/* ─── Toolbar Button Type ─── */
type TBProps = {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: ReactNode;
  btnDisabled?: boolean;
};

/* ─── Toolbar Buttons ─── */
export function ListToolbarButtons({
  activeListType,
  ToolbarButton,
  showExtraActions = false,
}: {
  activeListType: ListType | null;
  ToolbarButton: ComponentType<TBProps>;
  showExtraActions?: boolean;
}) {
  const { toggleList, clearList, indentList, outdentList } = useListActions();
  const hasActiveList = activeListType !== null;

  return (
    <>
      {LIST_BLOCKS.map(({ label, Icon, type }) => (
        <span key={type} onMouseDown={preventBlur(() => toggleList(type))}>
          <ToolbarButton
            active={activeListType === type}
            onClick={() => {}}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </ToolbarButton>
        </span>
      ))}

      {showExtraActions && hasActiveList && (
        <>
          <span onMouseDown={preventBlur(outdentList)}>
            <ToolbarButton onClick={() => {}} title="Outdent">
              <IndentDecrease className="h-4 w-4" />
            </ToolbarButton>
          </span>
          <span onMouseDown={preventBlur(indentList)}>
            <ToolbarButton onClick={() => {}} title="Indent">
              <IndentIncrease className="h-4 w-4" />
            </ToolbarButton>
          </span>
          <span onMouseDown={preventBlur(clearList)}>
            <ToolbarButton onClick={() => {}} title="Remove List">
              <ListX className="h-4 w-4" />
            </ToolbarButton>
          </span>
        </>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   CheckList Style Injector — Pure Tailwind-compatible
   No external CSS file needed
   ═══════════════════════════════════════════════════════ */

const CHECKLIST_STYLES = `
  [role="checkbox"] {
    position: relative;
    list-style: none;
    padding-left: 1.75rem;
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;
    line-height: 1.625;
    cursor: pointer;
    user-select: none;
  }

  [role="checkbox"]::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0.25rem;
    width: 1.125rem;
    height: 1.125rem;
    border-radius: 0.3rem;
    border: 1.5px solid rgba(139, 92, 246, 0.4);
    background: rgba(139, 92, 246, 0.06);
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  [role="checkbox"]:hover::before {
    border-color: rgba(139, 92, 246, 0.7);
    background: rgba(139, 92, 246, 0.12);
  }

  [role="checkbox"][aria-checked="true"]::before {
    content: "✓";
    font-size: 0.75rem;
    font-weight: 700;
    color: #a78bfa;
    border-color: rgba(139, 92, 246, 0.6);
    background: rgba(139, 92, 246, 0.18);
  }

  [role="checkbox"][aria-checked="true"] {
    text-decoration: line-through;
    opacity: 0.55;
  }

  [role="checkbox"][aria-checked="true"]:hover {
    opacity: 0.75;
  }

  [role="checkbox"] > span {
    pointer-events: none;
  }

  [role="checkbox"]:focus-visible {
    outline: none;
  }

  [role="checkbox"]:focus-visible::before {
    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.3);
  }
`;

export function CheckListStyleInjector() {
  useEffect(() => {
    const id = "mib-checklist-styles";

    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;
    style.textContent = CHECKLIST_STYLES;
    document.head.appendChild(style);

    return () => {
      const existing = document.getElementById(id);
      if (existing) existing.remove();
    };
  }, []);

  return null;
}
