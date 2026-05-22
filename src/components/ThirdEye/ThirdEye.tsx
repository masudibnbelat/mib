"use client";

import React, {
  useReducer,
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import "./ThirdEye.css";
import {
  appReducer,
  executeCode,
  formatCode,
  INITIAL_STATE,
  LANGUAGES,
  loadPrettier,
  loadPrism,
  loadPyodide,
  parseErrors,
  useDebounced,
  useHasSelection,
  useMediaQuery,
  isBrowser,
  safeLocalGet,
  safeLocalSet,
} from "./ThirdEyeLogic";

import {
  DesktopTabs,
  FormatButton,
  FormatToast,
  MobileDropdown,
  RunButton,
} from "./TabsandButtons";
import type { EditorCtx } from "./ThirdEyeTypes";

import { Editor } from "./Syntaxhighlight";
import { EditorContext } from "./ Editorcontext";
import { DrawingCanvas } from "./DrawingCanvas";
import { OutputPanel } from "./ Outputpanel";

const ThirdEye = () => {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const debouncedText = useDebounced(state.text, 600);
  const [showFormatToast, setShowFormatToast] = useState(false);
  const formatToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoFormatTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFormattedText = useRef<string>("");
  const hasSelection = useHasSelection(textareaRef);
  const didRestore = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [toolbarPortalTarget, setToolbarPortalTarget] =
    useState<HTMLDivElement | null>(null);

  // ── Hydration guard ──
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // ── Restore persisted state (runs once on mount) ──
  useEffect(() => {
    if (!isBrowser || didRestore.current) return;
    didRestore.current = true;

    const t = safeLocalGet("thirdbrain-content");
    const l = safeLocalGet("thirdbrain-lang");
    const m = safeLocalGet("thirdbrain-mode");

    if (t) dispatch({ type: "SET_TEXT", payload: t });

    if (l) {
      const found = LANGUAGES.find((x) => x.value === l);
      if (found) dispatch({ type: "SET_LANG", payload: found });
    }

    if (m === "draw") {
      dispatch({ type: "SET_MODE", payload: "draw" });
    }

    loadPrism();
    loadPrettier();
  }, []);

  // ── Focus textarea when switching back to editor ──
  useEffect(() => {
    if (state.mode === "editor" && isBrowser) {
      const id = setTimeout(() => textareaRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [state.mode]);

  // ── Persist content ──
  useEffect(() => {
    if (debouncedText) {
      safeLocalSet("thirdbrain-content", debouncedText);
    }
  }, [debouncedText]);

  // ── Preload Pyodide when Python is selected ──
  useEffect(() => {
    if (state.lang.value === "python" && state.pyStatus === "idle") {
      dispatch({ type: "SET_PY_STATUS", payload: "loading" });
      loadPyodide()
        .then(() => dispatch({ type: "SET_PY_STATUS", payload: "ready" }))
        .catch(() => dispatch({ type: "SET_PY_STATUS", payload: "idle" }));
    }
  }, [state.lang.value, state.pyStatus]);

  // ── Auto-format on pause (JS / TS) ──
  useEffect(() => {
    if (state.mode !== "editor") return;
    const lang = state.lang.value;
    if (lang !== "javascript" && lang !== "typescript") return;
    if (!state.text.trim() || state.text === lastFormattedText.current) return;
    if (autoFormatTimer.current) clearTimeout(autoFormatTimer.current);
    autoFormatTimer.current = setTimeout(async () => {
      const ta = textareaRef.current;
      const cursorPos = ta?.selectionStart ?? 0;
      const formatted = await formatCode(lang, state.text);
      if (
        !formatted ||
        state.text !== (textareaRef.current?.value ?? state.text)
      )
        return;
      lastFormattedText.current = formatted;
      dispatch({ type: "SET_TEXT", payload: formatted });
      requestAnimationFrame(() => {
        if (!ta) return;
        const p = Math.min(cursorPos, formatted.length);
        ta.setSelectionRange(p, p);
      });
    }, 1200);
    return () => {
      if (autoFormatTimer.current) clearTimeout(autoFormatTimer.current);
    };
  }, [state.text, state.lang.value, state.mode]);

  // ── Manual format ──
  const onFormat = useCallback(async () => {
    if (state.formatting) return;
    dispatch({ type: "SET_FORMATTING", payload: true });
    const ta = textareaRef.current;
    const cursorPos = ta?.selectionStart ?? 0;
    try {
      const formatted = await formatCode(state.lang.value, state.text);
      if (formatted) {
        lastFormattedText.current = formatted;
        dispatch({ type: "SET_TEXT", payload: formatted });
        requestAnimationFrame(() => {
          if (!ta) return;
          const p = Math.min(cursorPos, formatted.length);
          ta.setSelectionRange(p, p);
        });
        if (formatToastTimer.current) clearTimeout(formatToastTimer.current);
        setShowFormatToast(true);
        formatToastTimer.current = setTimeout(
          () => setShowFormatToast(false),
          1800,
        );
      }
    } finally {
      dispatch({ type: "SET_FORMATTING", payload: false });
    }
  }, [state.formatting, state.lang.value, state.text]);

  // ── Run code ──
  const onRun = useCallback(async () => {
    if (state.lang.value === "text" || state.running || !state.text.trim())
      return;
    dispatch({ type: "SET_RUNNING", payload: true });
    dispatch({ type: "SET_ERRORS", payload: [] });
    dispatch({ type: "SET_OUTPUT", payload: { status: "loading", text: "" } });
    try {
      const { ok, text } = await executeCode(state.lang.value, state.text);
      dispatch({
        type: "SET_OUTPUT",
        payload: { status: ok ? "success" : "error", text },
      });
      if (!ok)
        dispatch({
          type: "SET_ERRORS",
          payload: parseErrors(text, state.lang.value),
        });
    } catch (err) {
      const errText = String(err);
      dispatch({
        type: "SET_OUTPUT",
        payload: { status: "error", text: errText },
      });
      dispatch({
        type: "SET_ERRORS",
        payload: parseErrors(errText, state.lang.value),
      });
    } finally {
      dispatch({ type: "SET_RUNNING", payload: false });
    }
  }, [state.lang.value, state.running, state.text]);

  const canRun = useMemo(
    () =>
      state.mode === "editor" &&
      state.lang.value !== "text" &&
      !state.running &&
      state.text.trim().length > 0,
    [state.mode, state.lang.value, state.running, state.text],
  );

  const ctxValue = useMemo<EditorCtx>(
    () => ({ state, dispatch, onRun, onFormat, canRun, hasSelection }),
    [state, dispatch, onRun, onFormat, canRun, hasSelection],
  );

  const isDrawMode = state.mode === "draw";

  // ── SSR guard: render nothing meaningful until mounted ──
  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col bg-(--color-bg) text-(--color-text)" />
    );
  }

  return (
    <EditorContext.Provider value={ctxValue}>
      <div
        className="min-h-screen flex flex-col bg-(--color-bg) text-(--color-text)"
        style={isDrawMode ? { overflow: "hidden", height: "100vh" } : {}}
      >
        {/* ── Desktop layout ── */}
        {isDesktop && (
          <div
            className="flex pt-20"
            style={
              isDrawMode
                ? { height: "calc(100vh)", overflow: "hidden" }
                : { minHeight: "100vh" }
            }
          >
            <DesktopTabs />

            <div
              className="flex-1 flex flex-col"
              style={isDrawMode ? { overflow: "hidden" } : {}}
            >
              {isDrawMode ? (
                <DrawingCanvas mobileToolbarSlot={toolbarPortalTarget} />
              ) : (
                <Editor textareaRef={textareaRef} outputOpen={!!state.output} />
              )}
            </div>

            {!isDrawMode && (
              <div className="flex flex-col pt-20 px-4 gap-2 shrink-0">
                <RunButton />
                <FormatButton />
              </div>
            )}
          </div>
        )}

        {/* ── Mobile layout ── */}
        {/* ── Mobile layout ── */}
        {!isDesktop && (
          <div
            className="flex flex-col flex-1"
            style={isDrawMode ? { height: "100vh", overflow: "hidden" } : {}}
          >
            <div className="flex items-center justify-between gap-2 px-4 pt-20 pb-3">
              <MobileDropdown />
              {isDrawMode ? (
                <div
                  ref={setToolbarPortalTarget}
                  style={{ flex: 1, minWidth: 0 }}
                />
              ) : (
                <div className="flex items-center gap-2 ml-auto">
                  <FormatButton />
                  <RunButton />
                </div>
              )}
            </div>

            {isDrawMode ? (
              <DrawingCanvas mobileToolbarSlot={toolbarPortalTarget} />
            ) : (
              <Editor textareaRef={textareaRef} outputOpen={!!state.output} />
            )}
          </div>
        )}

        {!isDrawMode && <OutputPanel />}
        <FormatToast visible={showFormatToast} />
      </div>
    </EditorContext.Provider>
  );
};

export default ThirdEye;
