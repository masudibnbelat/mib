import { useCallback } from "react";
import { QuoteStyle } from "../types/editor";

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
  const getEl = () => textareaRef.current;

  const performAction = (action: (el: HTMLTextAreaElement) => void) => {
    const el = getEl();
    if (!el) return;
    el.focus();
    const scrollTop = el.scrollTop;
    action(el);
    requestAnimationFrame(() => {
      el.scrollTop = scrollTop;
    });
  };

  // FIX: Multi-line wrap — applies style to EACH selected line
  const wrap = useCallback(
    (before: string, after: string, fallback = "") => {
      performAction((el) => {
        const s = el.selectionStart;
        const e = el.selectionEnd;
        const sel = value.slice(s, e);

        // No selection — insert with fallback
        if (!sel) {
          const next =
            value.slice(0, s) + before + fallback + after + value.slice(e);
          onChange(next);
          requestAnimationFrame(() => {
            el.setSelectionRange(
              s + before.length,
              s + before.length + fallback.length,
            );
          });
          return;
        }

        // Has selection — wrap each line individually
        const lines = sel.split("\n");
        const wrappedLines = lines.map((line) => {
          // Skip empty lines
          if (!line.trim()) return line;

          // Check if already wrapped — toggle off
          if (line.startsWith(before) && line.endsWith(after)) {
            return line.slice(before.length, line.length - after.length);
          }

          return before + line + after;
        });

        const result = wrappedLines.join("\n");
        const next = value.slice(0, s) + result + value.slice(e);
        onChange(next);
        requestAnimationFrame(() => {
          el.setSelectionRange(s, s + result.length);
        });
      });
    },
    [value, onChange],
  );

  // FIX: Multi-line prefix — already works per-line, but verify
  const prefixLines = useCallback(
    (prefix: string) => {
      performAction((el) => {
        const s = el.selectionStart;
        const e = el.selectionEnd;
        const lineStart = value.lastIndexOf("\n", s - 1) + 1;
        let lineEnd = value.indexOf("\n", e);
        if (lineEnd === -1) lineEnd = value.length;
        const block = value.slice(lineStart, lineEnd);
        const lines = block.split("\n");
        const isOL = prefix === "1. ";

        const allHave = lines.every((l) =>
          isOL ? /^\d+\. /.test(l) : l.startsWith(prefix),
        );

        const newLines = allHave
          ? lines.map((l) =>
              isOL ? l.replace(/^\d+\. /, "") : l.slice(prefix.length),
            )
          : lines.map((l, i) =>
              isOL
                ? `${i + 1}. ${l.replace(/^\d+\. /, "")}`
                : l.startsWith(prefix)
                  ? l
                  : prefix + l,
            );

        const newBlock = newLines.join("\n");
        onChange(value.slice(0, lineStart) + newBlock + value.slice(lineEnd));
        requestAnimationFrame(() => {
          el.setSelectionRange(lineStart, lineStart + newBlock.length);
        });
      });
    },
    [value, onChange],
  );

  const insertBlock = useCallback(
    (text: string) => {
      performAction((el) => {
        const s = el.selectionStart;
        const e = el.selectionEnd;
        const sel = value.slice(s, e);
        const before = value.slice(0, s);
        const after = value.slice(e);
        const pre = before.length > 0 && !before.endsWith("\n") ? "\n" : "";
        const suf = after.length > 0 && !after.startsWith("\n") ? "\n" : "";

        if (text === "```\n\n```" && sel.length > 0) {
          const wrapped = "```\n" + sel + "\n```";
          onChange(before + pre + wrapped + suf + after);
          requestAnimationFrame(() => {
            const cs = s + pre.length + 4;
            el.setSelectionRange(cs, cs + sel.length);
          });
          return;
        }

        const insert = pre + text + suf;
        onChange(before + insert + after);
        requestAnimationFrame(() => {
          if (text === "```\n\n```") {
            el.setSelectionRange(s + pre.length + 4, s + pre.length + 4);
          } else {
            const pos = s + insert.length;
            el.setSelectionRange(pos, pos);
          }
        });
      });
    },
    [value, onChange],
  );

  const insertQuote = useCallback(
    (style: QuoteStyle) => {
      performAction((el) => {
        const s = el.selectionStart;
        const e = el.selectionEnd;
        const selectedText = value.slice(s, e);
        const before = value.slice(0, s);
        const after = value.slice(e);

        const titleText = "শিরোনাম লিখুন";

        // Multi-line description support
        const descText = selectedText || "এখানে বিবরণ লিখুন...";
        const descLines = descText
          .split("\n")
          .map((l) => `>> ${l}`)
          .join("\n");

        const block = `>>[${style.key}] ${titleText}\n${descLines}`;
        const pre = before.length > 0 && !before.endsWith("\n") ? "\n" : "";
        const suf = after.length > 0 && !after.startsWith("\n") ? "\n" : "";

        onChange(before + pre + block + suf + after);

        requestAnimationFrame(() => {
          const titleStart =
            before.length + pre.length + `>>[${style.key}] `.length;
          el.setSelectionRange(titleStart, titleStart + titleText.length);
        });
      });
    },
    [value, onChange],
  );

  const setAlign = useCallback(
    (align: "left" | "center" | "right") => {
      performAction((el) => {
        const s = el.selectionStart;
        const e = el.selectionEnd;
        const lineStart = value.lastIndexOf("\n", s - 1) + 1;
        let lineEnd = value.indexOf("\n", e);
        if (lineEnd === -1) lineEnd = value.length;
        const block = value.slice(lineStart, lineEnd);
        const lines = block.split("\n");

        const newLines = lines.map((l) => {
          const cleaned = l
            .replace(/^::(left|center|right)::/, "")
            .replace(/::(left|center|right)::$/, "");
          if (align === "left") return cleaned;
          return `::${align}::${cleaned}::${align}::`;
        });

        const newBlock = newLines.join("\n");
        onChange(value.slice(0, lineStart) + newBlock + value.slice(lineEnd));
        requestAnimationFrame(() => {
          el.setSelectionRange(lineStart, lineStart + newBlock.length);
        });
      });
    },
    [value, onChange],
  );

  return { wrap, prefixLines, insertBlock, insertQuote, setAlign };
}
