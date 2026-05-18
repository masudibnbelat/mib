// hooks/useEditorActions.ts
import { useCallback } from "react";

interface UseEditorActionsProps {
  value: string;
  onChange: (val: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function useEditorActions({
  value,
  onChange,
  textareaRef,
}: UseEditorActionsProps) {
  /**
   * Wrap the current selection (or insert fallback) with before/after strings.
   */
  const wrap = useCallback(
    (before: string, after: string, fallback = "") => {
      const el = textareaRef.current;
      if (!el) return;
      const s = el.selectionStart;
      const e = el.selectionEnd;
      const sel = value.slice(s, e) || fallback;
      const next = value.slice(0, s) + before + sel + after + value.slice(e);
      onChange(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(s + before.length, s + before.length + sel.length);
      });
    },
    [value, onChange, textareaRef],
  );

  /**
   * Toggle a line prefix on every selected line.
   * If ALL selected lines already have the prefix, remove it. Otherwise add it.
   * For ordered lists (prefix "1. "), auto-numbers sequentially.
   */
  const prefixLines = useCallback(
    (prefix: string) => {
      const el = textareaRef.current;
      if (!el) return;

      const s = el.selectionStart;
      const e = el.selectionEnd;

      // Find the start of the first selected line
      const lineStart = value.lastIndexOf("\n", s - 1) + 1;
      // Find the end of the last selected line
      let lineEnd = value.indexOf("\n", e);
      if (lineEnd === -1) lineEnd = value.length;

      const block = value.slice(lineStart, lineEnd);
      const lines = block.split("\n");

      const isOrderedList = prefix === "1. ";

      // Check if all lines already have the prefix (for toggling off)
      const allHave = lines.every((l) => {
        if (isOrderedList) return /^\d+\. /.test(l);
        return l.startsWith(prefix);
      });

      let newLines: string[];
      if (allHave) {
        // Remove prefix
        newLines = lines.map((l) => {
          if (isOrderedList) return l.replace(/^\d+\. /, "");
          return l.startsWith(prefix) ? l.slice(prefix.length) : l;
        });
      } else {
        // Add prefix
        newLines = lines.map((l, idx) => {
          if (isOrderedList) {
            // Remove existing number prefix if any
            const cleaned = l.replace(/^\d+\. /, "");
            return `${idx + 1}. ${cleaned}`;
          }
          return l.startsWith(prefix) ? l : prefix + l;
        });
      }

      const newBlock = newLines.join("\n");
      const next = value.slice(0, lineStart) + newBlock + value.slice(lineEnd);
      onChange(next);

      requestAnimationFrame(() => {
        el.focus();
        const newEnd = lineStart + newBlock.length;
        el.setSelectionRange(lineStart, newEnd);
      });
    },
    [value, onChange, textareaRef],
  );

  /**
   * Insert a block (like code fence or hr).
   * If text is selected and it's a code block insertion, wrap the selection.
   */
  const insertBlock = useCallback(
    (text: string) => {
      const el = textareaRef.current;
      if (!el) return;

      const s = el.selectionStart;
      const e = el.selectionEnd;
      const sel = value.slice(s, e);
      const before = value.slice(0, s);
      const after = value.slice(e);

      // If it's a code block pattern and there's selected text, wrap the selection
      if (text === "```\n\n```" && sel.length > 0) {
        const wrapped = "```\n" + sel + "\n```";
        const prefix = before.length && !before.endsWith("\n") ? "\n" : "";
        const suffix = after.length && !after.startsWith("\n") ? "\n" : "";
        const insert = prefix + wrapped + suffix;
        onChange(before + insert + after);
        requestAnimationFrame(() => {
          el.focus();
          const codeStart = s + prefix.length + 4; // after ```\n
          const codeEnd = codeStart + sel.length;
          el.setSelectionRange(codeStart, codeEnd);
        });
        return;
      }

      const prefix = before.length && !before.endsWith("\n") ? "\n" : "";
      const suffix = after.length && !after.startsWith("\n") ? "\n" : "";
      const insert = prefix + text + suffix;
      onChange(before + insert + after);

      requestAnimationFrame(() => {
        el.focus();
        // For code block, place cursor inside
        if (text === "```\n\n```") {
          const cursorPos = s + prefix.length + 4; // after ```\n
          el.setSelectionRange(cursorPos, cursorPos);
        } else {
          const pos = s + insert.length;
          el.setSelectionRange(pos, pos);
        }
      });
    },
    [value, onChange, textareaRef],
  );

  return { wrap, prefixLines, insertBlock };
}
