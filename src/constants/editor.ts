// constants/editor.ts

import { CheatItem, ColorOption } from "../types/editor";

export const LINE_HEIGHT_PX = 24;

export const COLORS: ColorOption[] = [
  { label: "লাল", hex: "#f87171", marker: "==r==", key: "r" },
  { label: "সবুজ", hex: "#4ade80", marker: "==g==", key: "g" },
  { label: "নীল", hex: "#60a5fa", marker: "==b==", key: "b" },
  { label: "হলুদ", hex: "#facc15", marker: "==y==", key: "y" },
  { label: "বেগুনি", hex: "#c084fc", marker: "==p==", key: "p" },
  { label: "কমলা", hex: "#fb923c", marker: "==o==", key: "o" },
  { label: "গোলাপি", hex: "#f472b6", marker: "==pk==", key: "pk" },
  { label: "সায়ান", hex: "#22d3ee", marker: "==c==", key: "c" },
  { label: "সাদা", hex: "#f1f5f9", marker: "==w==", key: "w" },
  { label: "ধূসর", hex: "#94a3b8", marker: "==gr==", key: "gr" },
  { label: "চুন", hex: "#a3e635", marker: "==l==", key: "l" },
  { label: "অ্যাম্বার", hex: "#fbbf24", marker: "==a==", key: "a" },
];

export const CHEAT_ITEMS: CheatItem[] = [
  { sym: "# H1", desc: "heading 1" },
  { sym: "## H2", desc: "heading 2" },
  { sym: "### H3", desc: "heading 3" },
  { sym: "**bold**", desc: "bold" },
  { sym: "*italic*", desc: "italic" },
  { sym: "~~text~~", desc: "strike" },
  { sym: "__text__", desc: "underline" },
  { sym: "==text==", desc: "highlight" },
  { sym: "> quote", desc: "quote" },
  { sym: "- item", desc: "bullet" },
  { sym: "1. item", desc: "ordered" },
  { sym: "`code`", desc: "code" },
  { sym: "```", desc: "code block" },
  { sym: "---", desc: "divider" },
  { sym: "==r==t==r==", desc: "color" },
];
