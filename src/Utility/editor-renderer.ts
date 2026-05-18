// editor-renderer.ts

import { COLORS } from "../constants/editor";

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function styleSpans(line: string): string {
  let s = escHtml(line);

  // inline code first
  s = s.replace(/`(.+?)`/g, (_, code) => {
    return `<code class="inline-block font-mono text-[0.82em] bg-violet-500/13 text-purple-400 border border-violet-500/25 rounded px-1.5 py-px">${code}</code>`;
  });

  // bold
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');
  // italic
  s = s.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
  // strikethrough
  s = s.replace(/~~(.+?)~~/g, '<s class="line-through opacity-60">$1</s>');
  // underline
  s = s.replace(/__(.+?)__/g, '<u class="underline">$1</u>');

  // colors
  for (const c of COLORS) {
    const escaped = c.marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`${escaped}(.+?)${escaped}`, "g");
    s = s.replace(regex, `<span style="color:${c.hex}">$1</span>`);
  }

  // generic highlight
  s = s.replace(
    /==(.+?)==/g,
    '<mark class="bg-yellow-400/25 text-yellow-300 rounded px-0.5">$1</mark>',
  );

  return s;
}

export function renderToHtml(raw: string): string {
  if (!raw) return "";

  const lines = raw.split("\n");
  const out: string[] = [];
  let i = 0;
  let olCounter = 0;

  while (i < lines.length) {
    const line = lines[i];

    // fenced code block
    if (line.trimStart().startsWith("```")) {
      const lang = line.trimStart().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(escHtml(lines[i]));
        i++;
      }
      const langBadge = lang
        ? `<span class="absolute top-1.5 right-3 text-[0.65rem] font-mono text-violet-500 uppercase tracking-wider">${escHtml(lang)}</span>`
        : "";
      out.push(
        `<div class="relative bg-black/35 border border-violet-500/20 rounded-xl px-3.5 py-2.5 my-0.5">${langBadge}<pre class="font-mono text-[0.82em] text-slate-200 whitespace-pre-wrap m-0 p-0"><code>${codeLines.join("\n") || ""}</code></pre></div>`,
      );
      olCounter = 0;
      i++;
      continue;
    }

    // hr
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      out.push(
        `<div class="py-1"><hr class="border-0 border-t border-violet-500/35" /></div>`,
      );
      olCounter = 0;
      i++;
      continue;
    }

    // headings — use explicit height/padding to not break line mapping
    const h3 = line.match(/^### (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h1 = line.match(/^# (.+)/);

    if (h1) {
      out.push(
        `<div class="text-2xl font-bold leading-8 min-h-8">${styleSpans(h1[1])}</div>`,
      );
      olCounter = 0;
      i++;
      continue;
    }
    if (h2) {
      out.push(
        `<div class="text-xl font-bold leading-7 min-h-7">${styleSpans(h2[1])}</div>`,
      );
      olCounter = 0;
      i++;
      continue;
    }
    if (h3) {
      out.push(
        `<div class="text-base font-semibold text-violet-400 leading-6.5 min-h-6.5">${styleSpans(h3[1])}</div>`,
      );
      olCounter = 0;
      i++;
      continue;
    }

    // unordered list
    const ul = line.match(/^[-*] (.+)/);
    if (ul) {
      out.push(
        `<div class="flex items-baseline min-h-6 leading-6"><span class="text-violet-400 shrink-0 w-5">•</span><span class="flex-1">${styleSpans(ul[1])}</span></div>`,
      );
      olCounter = 0;
      i++;
      continue;
    }

    // ordered list
    const ol = line.match(/^(\d+)\. (.+)/);
    if (ol) {
      olCounter++;
      out.push(
        `<div class="flex items-baseline min-h-6 leading-6"><span class="text-violet-400 shrink-0 w-6 font-semibold tabular-nums">${olCounter}.</span><span class="flex-1">${styleSpans(ol[2])}</span></div>`,
      );
      i++;
      continue;
    }

    olCounter = 0;

    // blockquote
    if (line.startsWith("> ")) {
      const inner = styleSpans(line.slice(2));
      out.push(
        `<div class="border-l-[3px] border-violet-600 pl-3 text-zinc-400 italic min-h-6 leading-6">${inner || "<br>"}</div>`,
      );
      i++;
      continue;
    }

    // normal line
    const styled = styleSpans(line);
    out.push(`<div class="min-h-6 leading-6">${styled || "<br>"}</div>`);
    i++;
  }

  return out.join("");
}
