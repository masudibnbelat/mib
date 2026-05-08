// Syntaxhighlight.tsx

"use client";

import React, {
  memo,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SyntaxError2, TextFont } from "./ThirdEyeTypes";
import {
  applyLintErrorsToHtml,
  escapeHtml,
  lintCode,
  loadPrism,
  PRISM_LANG,
  prismReady,
  useSmartInput,
  isBrowser,
} from "./ThirdEyeLogic";

import { ErrorGutterLine } from "./TabsandButtons";
import { useEditor } from "./ Editorcontext";

// ═══════════════════════════════════════════════════
// SYNTAX HIGHLIGHT OVERLAY
// ═══════════════════════════════════════════════════

interface OverlayProps {
  text: string;
  lang: string;
  lintErrors: SyntaxError2[];
  font: string;
  outputOpen: boolean;
}

export const SyntaxHighlightOverlay = memo(
  ({ text, lang, lintErrors, font, outputOpen }: OverlayProps) => {
    const [highlighted, setHighlighted] = useState<string>("");
    const [prismLoaded, setPrismLoaded] = useState(prismReady);

    useEffect(() => {
      if (!prismLoaded && isBrowser) {
        loadPrism().then(() => setPrismLoaded(true));
      }
    }, [prismLoaded]);

    useEffect(() => {
      if (!isBrowser || !prismLoaded || !window.Prism) {
        setHighlighted(escapeHtml(text));
        return;
      }
      const prismLang = PRISM_LANG[lang];
      if (!prismLang || !window.Prism.languages[prismLang]) {
        setHighlighted(escapeHtml(text));
        return;
      }
      try {
        const html = window.Prism.highlight(
          text,
          window.Prism.languages[prismLang],
          prismLang,
        );
        setHighlighted(applyLintErrorsToHtml(html, text, lintErrors));
      } catch {
        setHighlighted(escapeHtml(text));
      }
    }, [text, lang, prismLoaded, lintErrors]);

    return (
      <div
        className={`tb-overlay tb-syntax-overlay ${font}`}
        aria-hidden="true"
        style={{
          paddingTop: 80,
          paddingBottom: outputOpen ? "calc(40vh + 80px)" : "80px",
        }}
        dangerouslySetInnerHTML={{ __html: highlighted }}
        suppressHydrationWarning
      />
    );
  },
);
SyntaxHighlightOverlay.displayName = "SyntaxHighlightOverlay";

// ═══════════════════════════════════════════════════
// EDITOR
// ═══════════════════════════════════════════════════

interface EditorProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  outputOpen: boolean;
}

export const Editor = memo(({ textareaRef, outputOpen }: EditorProps) => {
  const { state, dispatch } = useEditor();
  const [liveErrors, setLiveErrors] = useState<SyntaxError2[]>([]);
  const lintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fontDetectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onChange = useCallback(
    (val: string) => dispatch({ type: "SET_TEXT", payload: val }),
    [dispatch],
  );
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value),
    [onChange],
  );

  // Debounced lint
  useEffect(() => {
    if (lintTimer.current) clearTimeout(lintTimer.current);
    if (!state.lang.mono || !state.text.trim()) {
      setLiveErrors([]);
      return;
    }
    lintTimer.current = setTimeout(
      () => setLiveErrors(lintCode(state.lang.value, state.text)),
      300,
    );
    return () => {
      if (lintTimer.current) clearTimeout(lintTimer.current);
    };
  }, [state.text, state.lang.value, state.lang.mono]);

  // Text-mode font detection
  useEffect(() => {
    if (state.lang.value !== "text") return;
    if (fontDetectTimer.current) clearTimeout(fontDetectTimer.current);
    fontDetectTimer.current = setTimeout(() => {
      const newFont: TextFont = "rubik";
      if (newFont !== state.textFont)
        dispatch({ type: "SET_TEXT_FONT", payload: newFont });
    }, 200);
    return () => {
      if (fontDetectTimer.current) clearTimeout(fontDetectTimer.current);
    };
  }, [state.text, state.lang.value, state.textFont, dispatch]);

  const { handleKeyDown } = useSmartInput(
    textareaRef,
    state.text,
    onChange,
    state.lang.value,
  );

  const placeholder = useMemo(
    () =>
      state.lang.value === "text"
        ? "start writing..."
        : `// ${state.lang.label}`,
    [state.lang],
  );

  const gutterErrors = useMemo(
    () =>
      state.errors.length
        ? state.errors
        : liveErrors.map((e) => ({ line: e.line, message: e.message })),
    [state.errors, liveErrors],
  );

  const fontClass = useMemo(
    () => (state.lang.mono ? "code" : state.textFont),
    [state.lang.mono, state.textFont],
  );

  const paddingBottom = outputOpen ? "calc(40vh + 80px)" : "80px";

  const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, []);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [state.text, textareaRef]);

  return (
    <div className="flex flex-col flex-1">
      <AnimatePresence>
        {gutterErrors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col overflow-hidden border-b border-(--color-active-border)"
          >
            {gutterErrors.map((err, i) => (
              <ErrorGutterLine key={`${err.line}-${i}`} error={err} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex-1">
        {state.lang.mono && (
          <SyntaxHighlightOverlay
            text={state.text}
            lang={state.lang.value}
            lintErrors={liveErrors}
            font={fontClass}
            outputOpen={outputOpen}
          />
        )}
        <textarea
          ref={textareaRef}
          value={state.text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          spellCheck={false}
          placeholder={placeholder}
          className={`tb-editor tb-textarea w-full${state.lang.mono ? " code" : ` prose ${fontClass}`}`}
          style={{
            paddingTop: 80,
            paddingBottom,
            minHeight: "100vh",
            overflow: "hidden",
            resize: "none",
            display: "block",
            boxSizing: "border-box",
          }}
          suppressHydrationWarning
        />
      </div>
    </div>
  );
});
Editor.displayName = "Editor";
