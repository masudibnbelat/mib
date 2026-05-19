// Utility/editor-renderer.ts
import { COLORS } from "../constants/editor";

export const QUOTE_MAP: Record<
  string,
  {
    borderColor: string;
    titleBg: string;
    titleText: string;
    descBg: string;
    descText: string;
  }
> = {
  info: {
    borderColor: "#6366f1",
    titleBg: "rgba(99,102,241,0.25)",
    titleText: "#e0e7ff",
    descBg: "rgba(99,102,241,0.08)",
    descText: "#a5b4fc",
  },
  warn: {
    borderColor: "#f59e0b",
    titleBg: "rgba(245,158,11,0.25)",
    titleText: "#fef3c7",
    descBg: "rgba(245,158,11,0.08)",
    descText: "#fcd34d",
  },
  danger: {
    borderColor: "#ef4444",
    titleBg: "rgba(239,68,68,0.25)",
    titleText: "#fee2e2",
    descBg: "rgba(239,68,68,0.08)",
    descText: "#fca5a5",
  },
  success: {
    borderColor: "#22c55e",
    titleBg: "rgba(34,197,94,0.25)",
    titleText: "#dcfce7",
    descBg: "rgba(34,197,94,0.08)",
    descText: "#86efac",
  },
  tip: {
    borderColor: "#06b6d4",
    titleBg: "rgba(6,182,212,0.25)",
    titleText: "#cffafe",
    descBg: "rgba(6,182,212,0.08)",
    descText: "#67e8f9",
  },
};

function inlineStyles(line: string): string {
  let s = esc(line);

  s = s.replace(
    /`(.+?)`/g,
    '<code style="font-family:monospace;font-size:0.85em;background:rgba(139,92,246,0.13);color:#c084fc;border:1px solid rgba(139,92,246,0.25);border-radius:4px;padding:0 4px;">$1</code>',
  );
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
  s = s.replace(/~~(.+?)~~/g, '<s style="opacity:0.6;">$1</s>');
  s = s.replace(/__(.+?)__/g, "<u>$1</u>");
  s = s.replace(/~sm~(.+?)~sm~/g, '<span style="font-size:0.85em;">$1</span>');
  s = s.replace(/~lg~(.+?)~lg~/g, '<span style="font-size:1.1em;">$1</span>');
  s = s.replace(/~xl~(.+?)~xl~/g, '<span style="font-size:1.25em;">$1</span>');
  for (const c of COLORS) {
    const e = c.marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(
      new RegExp(`${e}(.+?)${e}`, "g"),
      `<span style="color:${c.hex}">$1</span>`,
    );
  }
  s = s.replace(
    /==(.+?)==/g,
    '<mark style="background:rgba(250,204,21,0.25);color:#fde047;border-radius:2px;padding:0 2px;">$1</mark>',
  );
  return s;
}

function getAlign(line: string): { align: string; cleaned: string } {
  const m = line.match(/^::(center|right)::(.+?)::\1::$/);
  if (m) return { align: m[1], cleaned: m[2] };
  return { align: "left", cleaned: line };
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const LH = "line-height:24px;min-height:24px;height:24px;overflow:hidden;";

export function renderToHtml(raw: string): string {
  if (!raw) return "";
  const lines = raw.split("\n");
  const out: string[] = [];
  let i = 0;
  let olCounter = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trimStart().startsWith("```")) {
      out.push(
        `<div style="${LH}color:#6d28d9;font-family:monospace;font-size:0.8em;">${esc(line)}</div>`,
      );
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        out.push(
          `<div style="${LH}font-family:monospace;font-size:0.85em;color:#e2e8f0;padding-left:12px;background:rgba(0,0,0,0.2);">${esc(lines[i]) || " "}</div>`,
        );
        i++;
      }
      if (i < lines.length) {
        out.push(
          `<div style="${LH}color:#6d28d9;font-family:monospace;font-size:0.8em;">${esc(lines[i])}</div>`,
        );
        i++;
      }
      olCounter = 0;
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      out.push(
        `<div style="${LH}display:flex;align-items:center;"><hr style="flex:1;border:0;border-top:1px solid rgba(139,92,246,0.35);"/></div>`,
      );
      olCounter = 0;
      i++;
      continue;
    }
    // ── Styled quote: >>[key] Title ──
    const qm = line.match(/^>>\[(\w+)\]\s*(.*)$/);
    if (qm) {
      const qs = QUOTE_MAP[qm[1]] || QUOTE_MAP.info;
      const title = qm[2] || "";

      // TITLE: bold white text on SOLID colored background
      out.push(
        `<div style="${LH}border-left:3px solid ${qs.borderColor};padding-left:10px;background:${qs.titleBg};font-weight:700;color:${qs.titleText};border-radius:0 6px 0 0;">${inlineStyles(title) || "<br>"}</div>`,
      );
      i++;

      // DESCRIPTION: thin colored text on light background
      while (
        i < lines.length &&
        (lines[i].startsWith(">> ") || lines[i] === ">>")
      ) {
        const descContent = lines[i] === ">>" ? "" : lines[i].slice(3);
        out.push(
          `<div style="${LH}border-left:3px solid ${qs.borderColor};padding-left:10px;background:${qs.descBg};color:${qs.descText};">${inlineStyles(descContent) || "<br>"}</div>`,
        );
        i++;
      }

      olCounter = 0;
      continue;
    }

    // Orphan >> lines
    if (line.startsWith(">> ") || line === ">>") {
      const descContent = line === ">>" ? "" : line.slice(3);
      const qs = QUOTE_MAP.info;
      out.push(
        `<div style="${LH}border-left:3px solid ${qs.borderColor};padding-left:10px;background:${qs.descBg};color:${qs.descText};">${inlineStyles(descContent) || "<br>"}</div>`,
      );
      i++;
      continue;
    }

    const { align, cleaned } = getAlign(line);
    const alignStyle = align !== "left" ? `text-align:${align};` : "";
    const h3 = cleaned.match(/^### (.+)/);
    const h2 = cleaned.match(/^## (.+)/);
    const h1 = cleaned.match(/^# (.+)/);
    if (h3) {
      out.push(
        `<div style="${LH}${alignStyle}font-weight:600;color:#a78bfa;">${inlineStyles(h3[1])}</div>`,
      );
      olCounter = 0;
      i++;
      continue;
    }
    if (h2) {
      out.push(
        `<div style="${LH}${alignStyle}font-weight:700;color:#cbd5e1;">${inlineStyles(h2[1])}</div>`,
      );
      olCounter = 0;
      i++;
      continue;
    }
    if (h1) {
      out.push(
        `<div style="${LH}${alignStyle}font-weight:800;color:#f1f5f9;">${inlineStyles(h1[1])}</div>`,
      );
      olCounter = 0;
      i++;
      continue;
    }
    const ul = cleaned.match(/^[-*] (.+)/);
    if (ul) {
      out.push(
        `<div style="${LH}${alignStyle}display:flex;"><span style="color:#a78bfa;width:20px;flex-shrink:0;">•</span><span style="flex:1;">${inlineStyles(ul[1])}</span></div>`,
      );
      olCounter = 0;
      i++;
      continue;
    }
    const ol = cleaned.match(/^(\d+)\. (.+)/);
    if (ol) {
      olCounter++;
      out.push(
        `<div style="${LH}${alignStyle}display:flex;"><span style="color:#a78bfa;width:24px;flex-shrink:0;font-weight:600;">${olCounter}.</span><span style="flex:1;">${inlineStyles(ol[2])}</span></div>`,
      );
      i++;
      continue;
    }
    olCounter = 0;
    if (cleaned.startsWith("> ")) {
      out.push(
        `<div style="${LH}${alignStyle}border-left:3px solid rgba(139,92,246,0.6);padding-left:10px;color:#94a3b8;font-style:italic;">${inlineStyles(cleaned.slice(2)) || "<br>"}</div>`,
      );
      i++;
      continue;
    }
    out.push(
      `<div style="${LH}${alignStyle}">${inlineStyles(cleaned) || "<br>"}</div>`,
    );
    i++;
  }
  return out.join("");
}
