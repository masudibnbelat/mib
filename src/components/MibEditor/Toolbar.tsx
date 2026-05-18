// components/editor/Toolbar.tsx
"use client";
import {
  Bold,
  Italic,
  Strikethrough,
  Underline,
  Quote,
  Code,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Minus,
  TerminalSquare,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { ToolButton } from "./ToolButton";
import { ToolbarDivider } from "./ToolbarDivider";
import { ColorPicker } from "./ColorPicker";
import type { ToolbarProps } from "../../types/editor";

export function Toolbar({
  onWrap,
  onPrefixLines,
  onInsertBlock,
  onClose,
  disabled,
  colors,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-zinc-800 shrink-0 overflow-x-auto scrollbar-none">
      <ToolButton
        icon={Heading1}
        label="# H1"
        onClick={() => onPrefixLines("# ")}
        disabled={disabled}
      />
      <ToolButton
        icon={Heading2}
        label="## H2"
        onClick={() => onPrefixLines("## ")}
        disabled={disabled}
      />
      <ToolButton
        icon={Heading3}
        label="### H3"
        onClick={() => onPrefixLines("### ")}
        disabled={disabled}
      />

      <ToolbarDivider />

      <ToolButton
        icon={Bold}
        label="**bold**"
        onClick={() => onWrap("**", "**", "bold")}
        disabled={disabled}
      />
      <ToolButton
        icon={Italic}
        label="*italic*"
        onClick={() => onWrap("*", "*", "italic")}
        disabled={disabled}
      />
      <ToolButton
        icon={Strikethrough}
        label="~~strike~~"
        onClick={() => onWrap("~~", "~~", "strikethrough")}
        disabled={disabled}
      />
      <ToolButton
        icon={Underline}
        label="__underline__"
        onClick={() => onWrap("__", "__", "underline")}
        disabled={disabled}
      />
      <ToolButton
        icon={Highlighter}
        label="==highlight=="
        onClick={() => onWrap("==", "==", "highlight")}
        disabled={disabled}
      />

      <ToolbarDivider />

      <ToolButton
        icon={Quote}
        label="> quote"
        onClick={() => onPrefixLines("> ")}
        disabled={disabled}
      />
      <ToolButton
        icon={List}
        label="- list"
        onClick={() => onPrefixLines("- ")}
        disabled={disabled}
      />
      <ToolButton
        icon={ListOrdered}
        label="1. list"
        onClick={() => onPrefixLines("1. ")}
        disabled={disabled}
      />

      <ToolbarDivider />

      <ToolButton
        icon={Code}
        label="`inline code`"
        onClick={() => onWrap("`", "`", "code")}
        disabled={disabled}
      />
      <ToolButton
        icon={TerminalSquare}
        label="``` code block"
        onClick={() => onInsertBlock("```\n\n```")}
        disabled={disabled}
      />
      <ToolButton
        icon={Minus}
        label="--- divider"
        onClick={() => onInsertBlock("---")}
        disabled={disabled}
      />

      <ToolbarDivider />

      <ColorPicker
        colors={colors}
        onSelect={(marker) => onWrap(marker, marker, "রঙিন লেখা")}
        disabled={disabled}
      />

      <div className="flex-1" />

      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={onClose}
        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </motion.button>
    </div>
  );
}
