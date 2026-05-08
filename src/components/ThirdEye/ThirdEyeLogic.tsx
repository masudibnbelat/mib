"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Terminal, AlertCircle, CheckCircle } from "lucide-react";
import type {
  AppAction,
  AppState,
  Language,
  OutputStatus,
  RunResult,
  SyntaxError2,
  TextFont,
} from "./ThirdEyeTypes";

// ═══════════════════════════════════════════════════
// HELPERS — safe browser checks
// ═══════════════════════════════════════════════════

const isBrowser = typeof window !== "undefined";

const safeLocalGet = (key: string): string | null => {
  if (!isBrowser) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeLocalSet = (key: string, value: string): void => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.error(err);
  }
};

const safeLocalRemove = (key: string): void => {
  if (!isBrowser) return;
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.error(err);
  }
};

// ═══════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════

export const LANGUAGES: Language[] = [
  { label: "Text", value: "text", mono: false },
  { label: "JavaScript", value: "javascript", mono: true },
  { label: "TypeScript", value: "typescript", mono: true },
  { label: "Python", value: "python", mono: true },
];

export const LANG_ACCENT: Record<string, string> = {
  text: "var(--color-text)",
  javascript: "#F7DF1E",
  typescript: "#3178C6",
  python: "#3572A5",
};

export const OUTPUT_ICONS: Record<OutputStatus, React.ReactNode> = {
  loading: React.createElement(Terminal, {
    size: 13,
    color: "var(--color-gray)",
  }),
  success: React.createElement(CheckCircle, {
    size: 13,
    color: "var(--color-text-hover)",
  }),
  error: React.createElement(AlertCircle, { size: 13, color: "#ef4444" }),
};

export const getOutputLabel = (lang: string): Record<OutputStatus, string> => ({
  loading: `Running ${lang}...`,
  success: `Output · ${lang}`,
  error: `Error · ${lang}`,
});

export const PAIR_MAP: Record<string, string> = {
  "(": ")",
  "[": "]",
  "{": "}",
  '"': '"',
  "'": "'",
  "`": "`",
};
export const CLOSERS = new Set(Object.values(PAIR_MAP));

export const COMMENT_PREFIX: Record<string, string> = {
  javascript: "// ",
  typescript: "// ",
  python: "# ",
  text: "",
};

// ═══════════════════════════════════════════════════
// REDUCER
// ═══════════════════════════════════════════════════

export const INITIAL_STATE: AppState = {
  text: "",
  lang: LANGUAGES[0],
  output: null,
  running: false,
  pyStatus: "idle",
  dropOpen: false,
  errors: [],
  formatting: false,
  textFont: "rubik" as TextFont,
  mode: "editor",
};

export const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case "SET_TEXT":
      return { ...state, text: action.payload };
    case "SET_LANG":
      return { ...state, lang: action.payload, dropOpen: false, errors: [] };
    case "SET_OUTPUT":
      return { ...state, output: action.payload };
    case "SET_RUNNING":
      return { ...state, running: action.payload };
    case "SET_PY_STATUS":
      return { ...state, pyStatus: action.payload };
    case "SET_ERRORS":
      return { ...state, errors: action.payload };
    case "TOGGLE_DROP":
      return { ...state, dropOpen: !state.dropOpen };
    case "CLOSE_DROP":
      return { ...state, dropOpen: false };
    case "SET_FORMATTING":
      return { ...state, formatting: action.payload };
    case "SET_TEXT_FONT":
      return { ...state, textFont: action.payload };
    case "SET_MODE":
      return { ...state, mode: action.payload, dropOpen: false };
    default:
      return state;
  }
};

// ═══════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (!isBrowser) return;
    const mq = window.matchMedia(query);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMatches(mq.matches);
    const fn = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [query]);

  return matches;
};

export const useDebounced = <T,>(value: T, delay: number): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

export const useOutsideClick = (
  ref: React.RefObject<HTMLElement | null>,
  cb: () => void,
) => {
  useEffect(() => {
    if (!isBrowser) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, cb]);
};

export const useHasSelection = (
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
): boolean => {
  const [hasSelection, setHasSelection] = useState(false);
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const check = () => {
      if (ta === document.activeElement) {
        setHasSelection(ta.selectionStart !== ta.selectionEnd);
      }
    };
    const blur = () => setHasSelection(false);
    ta.addEventListener("select", check);
    ta.addEventListener("mouseup", check);
    ta.addEventListener("keyup", check);
    ta.addEventListener("blur", blur);
    return () => {
      ta.removeEventListener("select", check);
      ta.removeEventListener("mouseup", check);
      ta.removeEventListener("keyup", check);
      ta.removeEventListener("blur", blur);
    };
  }, [textareaRef]);
  return hasSelection;
};

export const useSmartInput = (
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  text: string,
  onChange: (val: string) => void,
  langValue: string,
) => {
  void text;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const { selectionStart: ss, selectionEnd: se } = ta;
      const val = ta.value;

      // Ctrl+/ → toggle comment
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        const prefix = COMMENT_PREFIX[langValue] ?? "// ";
        if (!prefix) return;
        const lines = val.split("\n");
        let charCount = 0;
        const startLine = lines.findIndex((l) => {
          charCount += l.length + 1;
          return charCount > ss;
        });
        const endLine = (() => {
          let c = 0;
          return lines.findIndex((l) => {
            c += l.length + 1;
            return c > se;
          });
        })();
        const sl = startLine === -1 ? lines.length - 1 : startLine;
        const el = endLine === -1 ? lines.length - 1 : endLine;
        const allCommented = lines
          .slice(sl, el + 1)
          .every((l) => l.trimStart().startsWith(prefix.trimEnd()));
        const newLines = lines.map((line, i) => {
          if (i < sl || i > el) return line;
          if (allCommented) {
            const idx = line.indexOf(prefix.trimEnd());
            return idx !== -1
              ? line.slice(0, idx) + line.slice(idx + prefix.length)
              : line;
          }
          return prefix + line;
        });
        onChange(newLines.join("\n"));
        requestAnimationFrame(() => {
          if (!ta) return;
          ta.setSelectionRange(
            ss,
            se +
              (allCommented ? -prefix.length : prefix.length) * (el - sl + 1),
          );
        });
        return;
      }

      // Tab → 2-space indent
      if (e.key === "Tab") {
        e.preventDefault();
        const indent = "  ";
        onChange(val.slice(0, ss) + indent + val.slice(se));
        requestAnimationFrame(() =>
          ta.setSelectionRange(ss + indent.length, ss + indent.length),
        );
        return;
      }

      // Enter → preserve indent + expand block openers + Python colon indent
      if (e.key === "Enter") {
        e.preventDefault();
        const lineStart = val.lastIndexOf("\n", ss - 1) + 1;
        const currentLine = val.slice(lineStart, ss);
        const indent = currentLine.match(/^(\s*)/)?.[1] ?? "";
        const charBefore = val[ss - 1];
        const charAfter = val[ss];

        const isBlockOpen =
          charBefore !== undefined &&
          "{[(".includes(charBefore) &&
          charAfter !== undefined &&
          "}])".includes(charAfter);

        const endsWithColon = currentLine.trimEnd().endsWith(":");

        if (isBlockOpen) {
          const inner = "\n" + indent + "  ";
          const closing = "\n" + indent;
          onChange(val.slice(0, ss) + inner + closing + val.slice(se));
          const pos = ss + inner.length;
          requestAnimationFrame(() => ta.setSelectionRange(pos, pos));
        } else if (endsWithColon) {
          const newIndent = indent + "  ";
          onChange(val.slice(0, ss) + "\n" + newIndent + val.slice(se));
          const pos = ss + 1 + newIndent.length;
          requestAnimationFrame(() => ta.setSelectionRange(pos, pos));
        } else {
          onChange(val.slice(0, ss) + "\n" + indent + val.slice(se));
          const pos = ss + 1 + indent.length;
          requestAnimationFrame(() => ta.setSelectionRange(pos, pos));
        }
        return;
      }

      // Auto-pair brackets / quotes
      if (PAIR_MAP[e.key]) {
        const closer = PAIR_MAP[e.key];
        const selectedText = val.slice(ss, se);
        if (ss !== se) {
          e.preventDefault();
          onChange(
            val.slice(0, ss) + e.key + selectedText + closer + val.slice(se),
          );
          requestAnimationFrame(() => ta.setSelectionRange(ss + 1, se + 1));
          return;
        }
        if (val[ss] === e.key && CLOSERS.has(e.key)) {
          e.preventDefault();
          requestAnimationFrame(() => ta.setSelectionRange(ss + 1, ss + 1));
          return;
        }
        e.preventDefault();
        onChange(val.slice(0, ss) + e.key + closer + val.slice(se));
        requestAnimationFrame(() => ta.setSelectionRange(ss + 1, ss + 1));
        return;
      }

      // Backspace removes pair
      if (e.key === "Backspace" && ss === se && ss > 0) {
        const charBefore = val[ss - 1];
        const charAfter = val[ss];
        if (charBefore !== undefined && PAIR_MAP[charBefore] === charAfter) {
          e.preventDefault();
          onChange(val.slice(0, ss - 1) + val.slice(ss + 1));
          requestAnimationFrame(() => ta.setSelectionRange(ss - 1, ss - 1));
        }
      }
    },
    [textareaRef, onChange, langValue],
  );

  return { handleKeyDown };
};

// ═══════════════════════════════════════════════════
// RUNNERS
// ═══════════════════════════════════════════════════

const PYTHON_IN_JS_CHECKS: Array<{ re: RegExp; hint: string }> = [
  { re: /(?<![.\w"'`])print\s*\(/, hint: "use console.log() in JavaScript" },
  { re: /^\s*def\s+\w+\s*\(/, hint: "use 'function name() {}'" },
  { re: /^\s*elif\b/, hint: "use 'else if (...) {}'" },
  { re: /^\s*except(\s+|\s*:)/, hint: "use 'catch (e) {}'" },
  { re: /(?<![.\w"'`])True(?!\w)/, hint: "use lowercase 'true'" },
  { re: /(?<![.\w"'`])False(?!\w)/, hint: "use lowercase 'false'" },
  { re: /(?<![.\w"'`])None(?!\w)/, hint: "use 'null'" },
];

const detectPythonInJS = (code: string): string | null => {
  const lines = code.split("\n");
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    if (!line.trim() || /^\s*\/\//.test(line) || /^\s*\*/.test(line)) continue;
    const stripped = line.replace(/(["'`])(?:(?!\1)[^\\]|\\.)*\1/g, '""');
    for (const { re, hint } of PYTHON_IN_JS_CHECKS) {
      if (re.test(stripped)) {
        const token = stripped.match(re)?.[0]?.trim() ?? "";
        return `ReferenceError: '${token.replace(/\s*\(.*/, "")}' is not valid JavaScript on line ${li + 1}\n→ ${hint}`;
      }
    }
  }
  return null;
};

export const runJS = async (code: string): Promise<RunResult> => {
  if (!isBrowser) return { ok: false, text: "Cannot run JS on server" };

  const pythonErr = detectPythonInJS(code);
  if (pythonErr) return { ok: false, text: pythonErr };

  const logs: string[] = [];
  const saved = { log: console.log, error: console.error, warn: console.warn };
  console.log = (...a: unknown[]) => logs.push(a.map(String).join(" "));
  console.error = (...a: unknown[]) =>
    logs.push("Error: " + a.map(String).join(" "));
  console.warn = (...a: unknown[]) =>
    logs.push("Warn: " + a.map(String).join(" "));

  const savedPrint = window.print;
  const savedAlert = window.alert;
  const savedConfirm = window.confirm;
  const savedPrompt = window.prompt;
  window.print = () => {
    logs.push("⚠ window.print() is not available here");
  };
  (window as unknown as Record<string, unknown>).alert = (...a: unknown[]) =>
    logs.push("alert: " + a.map(String).join(" "));
  (window as unknown as Record<string, unknown>).confirm = () => false;
  (window as unknown as Record<string, unknown>).prompt = () => null;

  const restore = () => {
    Object.assign(console, saved);
    window.print = savedPrint;
    window.alert = savedAlert;
    window.confirm = savedConfirm;
    window.prompt = savedPrompt;
  };

  try {
    // Next.js CSP may block eval — wrap in Function constructor instead
    const AsyncFunction = Object.getPrototypeOf(
      async function () {},
    ).constructor;
    const fn = new AsyncFunction(code);
    const result: unknown = fn();
    if (result instanceof Promise) {
      try {
        await result;
        restore();
        return { ok: true, text: logs.join("\n") || "(no output)" };
      } catch (e) {
        restore();
        return { ok: false, text: String(e) };
      }
    }
    restore();
    return { ok: true, text: logs.join("\n") || "(no output)" };
  } catch (e) {
    restore();
    return { ok: false, text: String(e) };
  }
};

const stripTypes = (ts: string): string => {
  let result = ts;
  result = result.replace(
    /^\s*(?:export\s+)?(?:interface|type)\s+\w[\s\S]*?^}/gm,
    "",
  );
  result = result.replace(
    /<([A-Z][A-Za-z0-9]*(?:\s*,\s*[A-Z][A-Za-z0-9]*)*)>/g,
    "",
  );
  result = result.replace(
    /(\w)\s*:\s*(?:readonly\s+)?(?:[A-Z][A-Za-z0-9]*|string|number|boolean|any|void|never|unknown|null|undefined|object)(?:\[\]|\s*\|\s*(?:[A-Z][A-Za-z0-9]*|string|number|boolean|any|void|never|unknown|null|undefined|object))*/g,
    "$1",
  );
  result = result.replace(
    /\)\s*:\s*(?:readonly\s+)?(?:[A-Z][A-Za-z0-9<>, |&[\]]*?)(\s*(?:=>|\{))/g,
    ")$1",
  );
  result = result.replace(
    /\s+as\s+(?:[A-Z][A-Za-z0-9<>[\] |&]*|string|number|boolean|any|unknown)/g,
    "",
  );
  result = result.replace(
    /^export\s+(?=(?:default\s+)?(?:function|class|const|let|var|async))/gm,
    "",
  );
  result = result.replace(/\b(?:public|private|protected|readonly)\s+/g, "");
  return result;
};

export const runTS = (code: string) => runJS(stripTypes(code));

// ═══════════════════════════════════════════════════
// PYODIDE — dynamic script loading (client only)
// ═══════════════════════════════════════════════════

declare global {
  interface Window {
    loadPyodide: (o: {
      indexURL: string;
    }) => Promise<{ runPython: (c: string) => unknown }>;
    prettier: {
      format: (code: string, opts: Record<string, unknown>) => Promise<string>;
    };
    prettierPlugins: { babel: unknown; estree: unknown; typescript: unknown };
    Prism: {
      highlight: (code: string, grammar: unknown, language: string) => string;
      languages: Record<string, unknown>;
    };
  }
}

type PyodideInstance = Awaited<ReturnType<Window["loadPyodide"]>>;
let pyInstance: PyodideInstance | null = null;
let pyLoading: Promise<PyodideInstance> | null = null;
const PY_CDN = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/";

export const loadPyodide = (): Promise<PyodideInstance> => {
  if (!isBrowser)
    return Promise.reject(new Error("Pyodide requires browser environment"));
  if (pyInstance) return Promise.resolve(pyInstance);
  if (pyLoading) return pyLoading;
  pyLoading = new Promise<PyodideInstance>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = PY_CDN + "pyodide.js";
    s.onload = async () => {
      try {
        pyInstance = await window.loadPyodide({ indexURL: PY_CDN });
        resolve(pyInstance);
      } catch (e) {
        reject(e as Error);
      }
    };
    s.onerror = () => reject(new Error("Failed to load Pyodide"));
    document.head.appendChild(s);
  });
  return pyLoading;
};

export const runPython = async (code: string): Promise<RunResult> => {
  if (!isBrowser)
    return { ok: false, text: "Python requires browser environment" };
  try {
    const py = await loadPyodide();
    py.runPython(
      "import sys,io\n_o=io.StringIO()\nsys.stdout=_o\nsys.stderr=_o",
    );
    try {
      py.runPython(code);
    } catch (e) {
      py.runPython("sys.stdout=sys.__stdout__;sys.stderr=sys.__stderr__");
      return { ok: false, text: String(e) };
    }
    const out = py.runPython("_o.getvalue()") as string;
    py.runPython("sys.stdout=sys.__stdout__;sys.stderr=sys.__stderr__");
    return { ok: true, text: out.trim() || "(no output)" };
  } catch (e) {
    return { ok: false, text: String(e) };
  }
};

const RUNNERS: Record<string, (c: string) => Promise<RunResult>> = {
  javascript: runJS,
  typescript: runTS,
  python: runPython,
};

export const executeCode = (lang: string, code: string): Promise<RunResult> =>
  RUNNERS[lang]?.(code) ??
  Promise.resolve({ ok: false, text: "Unsupported language" });

export const parseErrors = (
  text: string,
  langValue: string,
): Array<{ line: number; message: string }> => {
  if (!text) return [];
  const errors: Array<{ line: number; message: string }> = [];
  if (langValue === "javascript" || langValue === "typescript") {
    const anonMatch = text.match(/<anonymous>:(\d+)/);
    const lineMatch = text.match(/line[:\s]+(\d+)/i);
    let lineNum = 1;
    if (anonMatch) {
      lineNum = Math.max(1, parseInt(anonMatch[1], 10) - 1);
    } else if (lineMatch) {
      lineNum = parseInt(lineMatch[1], 10);
    }
    errors.push({ line: lineNum, message: text.split("\n")[0] });
  }
  if (langValue === "python") {
    const matches = [...text.matchAll(/line (\d+)/gi)];
    matches.forEach((m) => {
      const lineNum = parseInt(m[1], 10);
      if (!errors.find((e) => e.line === lineNum))
        errors.push({
          line: lineNum,
          message: text.split("\n").find((l) => l.trim()) ?? text,
        });
    });
    if (!errors.length) errors.push({ line: 1, message: text.split("\n")[0] });
  }
  return errors;
};

// ═══════════════════════════════════════════════════
// LINTERS
// ═══════════════════════════════════════════════════

const getLineOffset = (lines: string[], lineIdx: number): number =>
  lines.slice(0, lineIdx).reduce((a, l) => a + l.length + 1, 0);

const makeLineError = (
  lines: string[],
  lineIdx: number,
  message: string,
): SyntaxError2 => {
  const offset = getLineOffset(lines, lineIdx);
  const text = lines[lineIdx] ?? "";
  const leading = text.length - text.trimStart().length;
  const start = offset + leading;
  return {
    startChar: start,
    endChar: start + Math.max(text.trim().length, 1),
    line: lineIdx + 1,
    message,
  };
};

const makeTokenError = (
  lines: string[],
  lineIdx: number,
  col: number,
  len: number,
  message: string,
): SyntaxError2 => {
  const start = getLineOffset(lines, lineIdx) + col;
  return {
    startChar: start,
    endChar: start + Math.max(len, 1),
    line: lineIdx + 1,
    message,
  };
};

type LintPattern = { re: RegExp; msg: string; tokenRe: RegExp };

const PYTHON_IN_JS_PATTERNS: LintPattern[] = [
  {
    re: /(?<![.\w"'`])print\s*\(/,
    msg: "ReferenceError: 'print' is not defined — use console.log()",
    tokenRe: /print/,
  },
  {
    re: /^\s*def\s+\w+\s*\(/,
    msg: "Python syntax: use 'function name() {}' instead of 'def'",
    tokenRe: /def/,
  },
  {
    re: /^\s*elif\b/,
    msg: "Python syntax: use 'else if (...) {' not 'elif'",
    tokenRe: /elif/,
  },
  {
    re: /^\s*except(\s+|\s*:)/,
    msg: "Python syntax: use 'catch (e) {' not 'except'",
    tokenRe: /except/,
  },
  {
    re: /^\s*from\s+\w[\w.]*\s+import\b/,
    msg: "Python import — use: import { x } from 'module'",
    tokenRe: /from/,
  },
  {
    re: /(?<![.\w"'`])True(?!\w)/,
    msg: "ReferenceError: 'True' — use lowercase 'true'",
    tokenRe: /True/,
  },
  {
    re: /(?<![.\w"'`])False(?!\w)/,
    msg: "ReferenceError: 'False' — use lowercase 'false'",
    tokenRe: /False/,
  },
  {
    re: /(?<![.\w"'`])None(?!\w)/,
    msg: "ReferenceError: 'None' — use 'null'",
    tokenRe: /None/,
  },
  {
    re: /^\s*#(?!\s*!)/,
    msg: "Python comment — use '//' for JS comments",
    tokenRe: /#/,
  },
];

const lintJS = (code: string): SyntaxError2[] => {
  if (!isBrowser) return [];
  const errors: SyntaxError2[] = [];
  const codeLines = code.split("\n");
  try {
    new Function(code);
  } catch (e: unknown) {
    if (e instanceof Error) {
      const msg = e.message;
      const lineM =
        msg.match(/line\s+(\d+)/i) ??
        (e as SyntaxError).stack?.match(/<anonymous>:(\d+)/);
      const line = lineM ? parseInt(lineM[1], 10) : 1;
      const text = codeLines[line - 1] ?? "";
      const leading = text.length - text.trimStart().length;
      const start = getLineOffset(codeLines, line - 1) + leading;
      errors.push({
        startChar: start,
        endChar: start + Math.max(text.trim().length, 1),
        line,
        message: msg.split("\n")[0],
      });
      return errors;
    }
  }
  codeLines.forEach((lineText, li) => {
    if (/^\s*\/\//.test(lineText) || /^\s*\*/.test(lineText)) return;
    const stripped = lineText.replace(/(["'`])(?:(?!\1)[^\\]|\\.)*\1/g, '""');
    PYTHON_IN_JS_PATTERNS.forEach(({ re, msg, tokenRe }) => {
      if (!re.test(stripped)) return;
      const m = tokenRe.exec(lineText);
      if (m)
        errors.push(makeTokenError(codeLines, li, m.index, m[0].length, msg));
    });
  });
  return errors;
};

const lintTS = (code: string): SyntaxError2[] => {
  if (!isBrowser) return [];
  const strippedForSyntax = stripTypes(code);
  const syntaxErrors = (() => {
    const errs: SyntaxError2[] = [];
    const codeLines = code.split("\n");
    try {
      new Function(strippedForSyntax);
    } catch (e: unknown) {
      if (e instanceof Error) {
        const msg = e.message;
        const lineM =
          msg.match(/line\s+(\d+)/i) ??
          (e as SyntaxError).stack?.match(/<anonymous>:(\d+)/);
        const line = lineM ? parseInt(lineM[1], 10) : 1;
        const text = codeLines[line - 1] ?? "";
        const leading = text.length - text.trimStart().length;
        const start = getLineOffset(codeLines, line - 1) + leading;
        errs.push({
          startChar: start,
          endChar: start + Math.max(text.trim().length, 1),
          line,
          message: msg.split("\n")[0],
        });
      }
    }
    return errs;
  })();

  if (syntaxErrors.length) return syntaxErrors;

  const errors: SyntaxError2[] = [];
  const codeLines = code.split("\n");

  codeLines.forEach((lineText, li) => {
    if (/^\s*\/\//.test(lineText) || /^\s*\*/.test(lineText)) return;

    const strippedLine = lineText.replace(
      /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g,
      '""',
    );
    PYTHON_IN_JS_PATTERNS.forEach(({ re, msg, tokenRe }) => {
      if (!re.test(strippedLine)) return;
      const m2 = tokenRe.exec(lineText);
      if (m2)
        errors.push(makeTokenError(codeLines, li, m2.index, m2[0].length, msg));
    });

    const funcRe =
      /(?:function\s*\w*\s*|(?:^|[=,(]\s*)(?:\w+\s*=>|\(([^)]*)\)\s*(?:=>|:|\{)))/g;
    let m: RegExpExecArray | null;
    while ((m = funcRe.exec(lineText)) !== null) {
      const captured = m[1];
      if (!captured) continue;
      if (/:\s*\w/.test(captured)) continue;
      if (/[{[\]]/.test(captured)) continue;

      captured.split(",").forEach((param) => {
        const p = param.trim();
        if (!p) return;
        if (p.startsWith("...") || p.includes("=")) return;
        const name = p.split("=")[0].trim();
        if (!name || !/^[a-zA-Z_$][\w$]*$/.test(name)) return;
        const col = lineText.indexOf(name, m!.index);
        if (col >= 0)
          errors.push(
            makeTokenError(
              codeLines,
              li,
              col,
              name.length,
              `Parameter '${name}' implicitly has an 'any' type`,
            ),
          );
      });
    }

    const asAnyRe = /\bas\s+any\b/g;
    while ((m = asAnyRe.exec(lineText)) !== null)
      errors.push(
        makeTokenError(
          codeLines,
          li,
          m.index,
          m[0].length,
          "Unsafe cast to 'any'",
        ),
      );

    if (
      /^\s*export\s+(?:default\s+)?(?:async\s+)?function\s+\w+\s*\([^)]*\)\s*\{/.test(
        lineText,
      ) &&
      !/\)\s*:\s*\w/.test(lineText)
    )
      errors.push(
        makeLineError(
          codeLines,
          li,
          "Missing return type annotation on exported function",
        ),
      );
  });
  return errors;
};

const JS_IN_PYTHON_PATTERNS: LintPattern[] = [
  {
    re: /(?<![.\w"'`])console\.log\s*\(/,
    msg: "'console.log' is JS — use print() in Python",
    tokenRe: /console/,
  },
  {
    re: /^\s*function\s+\w+\s*\(/,
    msg: "JS syntax: use 'def name():' in Python",
    tokenRe: /function/,
  },
  { re: /^\s*\/\//, msg: "JS comment — Python uses '#'", tokenRe: /\/\// },
  {
    re: /(?<![.\w"'`])null(?!\w)/,
    msg: "'null' is JS — Python uses 'None'",
    tokenRe: /null/,
  },
  {
    re: /(?<![.\w"'`])undefined(?!\w)/,
    msg: "'undefined' doesn't exist in Python",
    tokenRe: /undefined/,
  },
  {
    re: /(?<![.\w"'`])true(?!\w)/,
    msg: "'true' is JS — Python uses 'True'",
    tokenRe: /true/,
  },
  {
    re: /(?<![.\w"'`])false(?!\w)/,
    msg: "'false' is JS — Python uses 'False'",
    tokenRe: /false/,
  },
  {
    re: /\bconst\s+\w+\s*=/,
    msg: "'const' is JS — Python needs no declaration",
    tokenRe: /const/,
  },
  {
    re: /\blet\s+\w+\s*=/,
    msg: "'let' is JS — Python needs no declaration",
    tokenRe: /let/,
  },
  {
    re: /\bvar\s+\w+\s*=/,
    msg: "'var' is JS — Python needs no declaration",
    tokenRe: /var/,
  },
];

const lintPython = (code: string): SyntaxError2[] => {
  const errors: SyntaxError2[] = [];
  const codeLines = code.split("\n");
  const OPEN_CHARS = ["(", "[", "{"];
  const CLOSE_CHARS = [")", "]", "}"];
  const stack: { ch: string; line: number; col: number }[] = [];

  let inMultilineStr: string | null = null;

  codeLines.forEach((lineText, li) => {
    const tripleDoubleIdx = lineText.indexOf('"""');
    const tripleSingleIdx = lineText.indexOf("'''");
    if (!inMultilineStr && (tripleDoubleIdx !== -1 || tripleSingleIdx !== -1)) {
      const delim =
        tripleDoubleIdx !== -1 &&
        (tripleSingleIdx === -1 || tripleDoubleIdx < tripleSingleIdx)
          ? '"""'
          : "'''";
      const closeIdx = lineText.indexOf(delim, lineText.indexOf(delim) + 3);
      if (closeIdx === -1) {
        inMultilineStr = delim;
        return;
      }
    } else if (inMultilineStr) {
      if (lineText.includes(inMultilineStr)) {
        inMultilineStr = null;
      }
      return;
    }

    let inStr: string | null = null;
    for (let ci = 0; ci < lineText.length; ci++) {
      const ch = lineText[ci];
      if (!inStr && (ch === '"' || ch === "'")) {
        inStr = ch;
        continue;
      }
      if (inStr && ch === inStr && lineText[ci - 1] !== "\\") {
        inStr = null;
        continue;
      }
      if (inStr) continue;
      if (ch === "#") break;
      const oi = OPEN_CHARS.indexOf(ch);
      const ci2 = CLOSE_CHARS.indexOf(ch);
      if (oi !== -1) stack.push({ ch, line: li + 1, col: ci });
      if (ci2 !== -1) {
        if (
          !stack.length ||
          OPEN_CHARS.indexOf(stack[stack.length - 1].ch) !== ci2
        ) {
          const start = getLineOffset(codeLines, li) + ci;
          errors.push({
            startChar: start,
            endChar: start + 1,
            line: li + 1,
            message: `SyntaxError: unexpected '${ch}'`,
          });
        } else {
          stack.pop();
        }
      }
    }
  });

  if (stack.length && errors.length === 0) {
    const u = stack[stack.length - 1];
    const start = getLineOffset(codeLines, u.line - 1) + u.col;
    errors.push({
      startChar: start,
      endChar: start + 1,
      line: u.line,
      message: `SyntaxError: '${u.ch}' was never closed`,
    });
  }

  inMultilineStr = null;
  codeLines.forEach((lineText, li) => {
    if (
      !inMultilineStr &&
      (lineText.includes('"""') || lineText.includes("'''"))
    ) {
      const delim = lineText.includes('"""') ? '"""' : "'''";
      const closeIdx = lineText.indexOf(delim, lineText.indexOf(delim) + 3);
      if (closeIdx === -1) {
        inMultilineStr = delim;
        return;
      }
    } else if (inMultilineStr) {
      if (lineText.includes(inMultilineStr)) inMultilineStr = null;
      return;
    }

    if (/^\s*#/.test(lineText)) return;
    const stripped = lineText.replace(/(["'])(?:(?!\1)[^\\])\1/g, '""');
    JS_IN_PYTHON_PATTERNS.forEach(({ re, msg, tokenRe }) => {
      if (!re.test(stripped)) return;
      const m = tokenRe.exec(lineText);
      if (m)
        errors.push(makeTokenError(codeLines, li, m.index, m[0].length, msg));
    });
  });

  let expectedIndent: number | null = null;
  let lastLineEndsWithColon = false;
  inMultilineStr = null;

  codeLines.forEach((lineText, li) => {
    const trimmed = lineText.trim();

    if (
      !inMultilineStr &&
      (trimmed.startsWith('"""') || trimmed.startsWith("'''"))
    ) {
      const delim = trimmed.startsWith('"""') ? '"""' : "'''";
      const rest = trimmed.slice(3);
      if (!rest.includes(delim)) {
        inMultilineStr = delim;
        lastLineEndsWithColon = false;
        return;
      }
    } else if (inMultilineStr) {
      if (trimmed.includes(inMultilineStr)) inMultilineStr = null;
      lastLineEndsWithColon = false;
      return;
    }

    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const indent = lineText.length - lineText.trimStart().length;

    if (lastLineEndsWithColon && indent === 0) {
      errors.push(
        makeLineError(
          codeLines,
          li,
          "IndentationError: expected an indented block after ':'",
        ),
      );
    }

    if (expectedIndent === null && indent > 0) expectedIndent = indent;
    if (expectedIndent && indent > 0 && indent % expectedIndent !== 0) {
      const start = getLineOffset(codeLines, li);
      errors.push({
        startChar: start,
        endChar: start + indent,
        line: li + 1,
        message:
          "IndentationError: unindent does not match any outer indent level",
      });
    }

    lastLineEndsWithColon = trimmed.endsWith(":");
  });

  return errors;
};

const LINTERS: Record<string, (c: string) => SyntaxError2[]> = {
  javascript: lintJS,
  typescript: lintTS,
  python: lintPython,
};
export const lintCode = (lang: string, code: string): SyntaxError2[] =>
  LINTERS[lang]?.(code) ?? [];

// ═══════════════════════════════════════════════════
// PRETTIER
// ═══════════════════════════════════════════════════

let prettierLoading: Promise<void> | null = null;
let prettierReady = false;

export const loadPrettier = (): Promise<void> => {
  if (!isBrowser) return Promise.resolve();
  if (prettierReady) return Promise.resolve();
  if (prettierLoading) return prettierLoading;
  prettierLoading = new Promise<void>((resolve) => {
    const scripts = [
      "https://unpkg.com/prettier@3.4.2/standalone.js",
      "https://unpkg.com/prettier@3.4.2/plugins/babel.js",
      "https://unpkg.com/prettier@3.4.2/plugins/estree.js",
      "https://unpkg.com/prettier@3.4.2/plugins/typescript.js",
    ];
    let loaded = 0;
    const onLoad = () => {
      loaded++;
      if (loaded === scripts.length) {
        prettierReady = true;
        resolve();
      }
    };
    scripts.forEach((src) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = onLoad;
      s.onerror = onLoad;
      document.head.appendChild(s);
    });
  });
  return prettierLoading;
};

const PRETTIER_PARSERS: Record<string, string> = {
  javascript: "babel",
  typescript: "typescript",
};

export const formatCode = async (
  lang: string,
  code: string,
): Promise<string | null> => {
  if (!isBrowser) return null;
  const parser = PRETTIER_PARSERS[lang];
  if (!parser) return null;
  try {
    await loadPrettier();
    const plugins = [
      window.prettierPlugins?.babel,
      window.prettierPlugins?.estree,
      window.prettierPlugins?.typescript,
    ].filter(Boolean);
    if (!window.prettier || !plugins.length) return null;
    const formatted = await window.prettier.format(code, {
      parser,
      plugins,
      semi: true,
      singleQuote: false,
      trailingComma: "es5",
      tabWidth: 2,
      printWidth: 80,
    });
    return formatted !== code ? formatted : null;
  } catch {
    return null;
  }
};

// ═══════════════════════════════════════════════════
// PRISM
// ═══════════════════════════════════════════════════

let prismLoading: Promise<void> | null = null;
export let prismReady = false;

export const loadPrism = (): Promise<void> => {
  if (!isBrowser) return Promise.resolve();
  if (prismReady) return Promise.resolve();
  if (prismLoading) return prismLoading;
  prismLoading = new Promise<void>((resolve) => {
    const core = document.createElement("script");
    core.src =
      "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js";
    core.onload = () => {
      const langs = [
        "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js",
      ];
      let loaded = 0;
      langs.forEach((src) => {
        const s = document.createElement("script");
        s.src = src;
        s.onload = s.onerror = () => {
          loaded++;
          if (loaded === langs.length) {
            prismReady = true;
            resolve();
          }
        };
        document.head.appendChild(s);
      });
    };
    core.onerror = () => resolve();
    document.head.appendChild(core);
  });
  return prismLoading;
};

export const PRISM_LANG: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
};

export const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const applyLintErrorsToHtml = (
  html: string,
  plainText: string,
  errors: Array<{ startChar: number; endChar: number; message: string }>,
): string => {
  if (!errors.length) return html;

  const charError = new Array<string | null>(plainText.length).fill(null);
  errors.forEach((e) => {
    const msg = e.message;
    for (let i = e.startChar; i < e.endChar && i < plainText.length; i++) {
      charError[i] = msg;
    }
  });

  let result = "";
  let textPos = 0;
  let inTag = false;
  let inErrorSpan = false;

  const openSpan = (msg: string) => {
    result += `<span class="tb-error-underline" title="${escapeHtml(msg)}">`;
    inErrorSpan = true;
  };
  const closeSpan = () => {
    result += "</span>";
    inErrorSpan = false;
  };

  for (let i = 0; i < html.length; i++) {
    const ch = html[i];

    if (ch === "<") {
      if (inErrorSpan) closeSpan();
      inTag = true;
      result += ch;
      continue;
    }
    if (ch === ">") {
      inTag = false;
      result += ch;
      continue;
    }
    if (inTag) {
      result += ch;
      continue;
    }

    if (ch === "&") {
      const semi = html.indexOf(";", i);
      if (semi !== -1 && semi - i <= 7) {
        const entity = html.slice(i, semi + 1);
        const currentError =
          textPos < charError.length ? charError[textPos] : null;

        if (currentError && !inErrorSpan) openSpan(currentError);
        else if (!currentError && inErrorSpan) closeSpan();

        result += entity;
        textPos++;
        i = semi;
        continue;
      }
    }

    const currentError = textPos < charError.length ? charError[textPos] : null;
    if (currentError && !inErrorSpan) openSpan(currentError);
    else if (!currentError && inErrorSpan) closeSpan();

    result += ch;
    textPos++;
  }

  if (inErrorSpan) closeSpan();
  return result;
};

// ═══════════════════════════════════════════════════
// Export safe localStorage helpers for other files
// ═══════════════════════════════════════════════════

export { safeLocalGet, safeLocalSet, safeLocalRemove, isBrowser };
