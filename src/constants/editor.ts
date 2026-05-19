// src/constants/editor.ts

import { CheatItem, ColorOption, QuoteStyle } from "../types/editor";

export const LINE_HEIGHT_PX = 24;
export const LINE_HEIGHT_CLASS = "leading-6";
export const MIN_H_CLASS = "min-h-6";

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

export const QUOTE_STYLES: QuoteStyle[] = [
  {
    key: "info",
    label: "তথ্য",
    titleColor: "#7dd3fc",
    borderColor: "#38bdf8",
    bgColor: "rgba(56,189,248,0.07)",
    textColor: "#bae6fd",
  },
  {
    key: "success",
    label: "সফল",
    titleColor: "#6ee7b7",
    borderColor: "#34d399",
    bgColor: "rgba(52,211,153,0.07)",
    textColor: "#a7f3d0",
  },
  {
    key: "warning",
    label: "সতর্কতা",
    titleColor: "#fcd34d",
    borderColor: "#fbbf24",
    bgColor: "rgba(251,191,36,0.07)",
    textColor: "#fde68a",
  },
  {
    key: "danger",
    label: "বিপদ",
    titleColor: "#fda4af",
    borderColor: "#fb7185",
    bgColor: "rgba(251,113,133,0.07)",
    textColor: "#fecdd3",
  },
  {
    key: "note",
    label: "নোট",
    titleColor: "#d8b4fe",
    borderColor: "#c084fc",
    bgColor: "rgba(192,132,252,0.07)",
    textColor: "#ede9fe",
  },
  {
    key: "tip",
    label: "টিপস",
    titleColor: "#5eead4",
    borderColor: "#2dd4bf",
    bgColor: "rgba(45,212,191,0.07)",
    textColor: "#99f6e4",
  },
];

export const FONT_SIZES = [
  { label: "ছোট", value: "sm", marker: "~sm~" },
  { label: "সাধারণ", value: "base", marker: "~base~" },
  { label: "বড়", value: "lg", marker: "~lg~" },
  { label: "অনেক বড়", value: "xl", marker: "~xl~" },
];

export const CHEAT_ITEMS: CheatItem[] = [
  { sym: "# H1", desc: "heading" },
  { sym: "**b**", desc: "bold" },
  { sym: "*i*", desc: "italic" },
  { sym: "~~s~~", desc: "strike" },
  { sym: "__u__", desc: "underline" },
  { sym: "==h==", desc: "highlight" },
  { sym: "`c`", desc: "code" },
  { sym: "```", desc: "block" },
  { sym: "---", desc: "hr" },
  { sym: "==r==t==r==", desc: "color" },
  { sym: ">>[info]", desc: "quote" },
  { sym: "::center::", desc: "align" },
];
