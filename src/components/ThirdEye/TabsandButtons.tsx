"use client";

import React, { memo, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  WandSparkles,
  ChevronDown,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { FileText } from "lucide-react";
import { SiJavascript, SiTypescript, SiPython } from "react-icons/si";

import type { ErrorGutter, Language } from "./ThirdEyeTypes";
import {
  LANG_ACCENT,
  LANGUAGES,
  useOutsideClick,
  safeLocalSet,
} from "./ThirdEyeLogic";
import { useEditor } from "./ Editorcontext";

// ═══════════════════════════════════════════════════
// LANG ICON
// ═══════════════════════════════════════════════════

export const LangIcon = ({
  value,
  size = 14,
  active = false,
}: {
  value: string;
  size?: number;
  active?: boolean;
}) => {
  const accent = LANG_ACCENT[value] ?? "var(--color-text)";
  const color = active ? accent : "currentColor";
  const opacity = active ? 1 : 0.4;
  const style = { flexShrink: 0 as const, opacity };
  switch (value) {
    case "javascript":
      return <SiJavascript size={size} color={color} style={style} />;
    case "typescript":
      return <SiTypescript size={size} color={color} style={style} />;
    case "python":
      return <SiPython size={size} color={color} style={style} />;
    default:
      return (
        <FileText
          size={size}
          style={{
            ...style,
            color: active ? "var(--color-text)" : "var(--color-gray)",
          }}
        />
      );
  }
};

// ═══════════════════════════════════════════════════
// DESKTOP TABS
// ═══════════════════════════════════════════════════

export const DesktopTabs = memo(() => {
  const { state, dispatch } = useEditor();

  const tabs = useMemo(
    () =>
      LANGUAGES.map((l) => ({
        ...l,
        isActive: state.mode === "editor" && l.value === state.lang.value,
        showPy: l.value === "python" && state.pyStatus === "loading",
        accent: LANG_ACCENT[l.value] ?? "var(--color-text-hover)",
      })),
    [state.lang.value, state.pyStatus, state.mode],
  );

  const isDrawActive = state.mode === "draw";

  const handleSelect = useCallback(
    (l: Language) => {
      dispatch({ type: "SET_MODE", payload: "editor" });
      dispatch({ type: "SET_LANG", payload: l });
      safeLocalSet("thirdbrain-lang", l.value);
      safeLocalSet("thirdbrain-mode", "editor");
    },
    [dispatch],
  );

  const handleDrawSelect = useCallback(() => {
    dispatch({ type: "SET_MODE", payload: "draw" });
    safeLocalSet("thirdbrain-mode", "draw");
  }, [dispatch]);

  return (
    <nav
      className="flex flex-col gap-0.5 pt-20 px-2 shrink-0"
      style={{
        width: 136,
        borderRight: "1px solid var(--color-active-border)",
      }}
    >
      {tabs.map((l) => (
        <motion.button
          key={l.value}
          onClick={() => handleSelect(l)}
          whileTap={{ scale: 0.95 }}
          whileHover={{ x: 2 }}
          transition={{ duration: 0.12 }}
          className={[
            "relative flex items-center gap-2 px-3 py-2 rounded-md text-xs font-mono font-medium text-left w-full transition-colors",
            l.isActive
              ? "bg-(--color-active-bg) text-(--color-text)"
              : "text-(--color-gray) hover:text-(--color-text) hover:bg-(--color-active-bg)",
          ].join(" ")}
        >
          {l.isActive && (
            <motion.span
              layoutId="tab-indicator"
              className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
              style={{ backgroundColor: l.accent }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
            />
          )}
          <span className="pl-1.5 flex items-center shrink-0">
            <LangIcon value={l.value} size={14} active={l.isActive} />
          </span>
          <span style={l.isActive ? { color: l.accent } : {}}>{l.label}</span>
          {l.showPy && <span className="tb-py-dot ml-auto" />}
        </motion.button>
      ))}

      <div
        className="mx-2 my-1"
        style={{ height: 1, background: "var(--color-active-border)" }}
      />

      <motion.button
        onClick={handleDrawSelect}
        whileTap={{ scale: 0.95 }}
        whileHover={{ x: 2 }}
        transition={{ duration: 0.12 }}
        className={[
          "relative flex items-center gap-2 px-3 py-2 rounded-md text-xs font-mono font-medium text-left w-full transition-colors",
          isDrawActive
            ? "bg-(--color-active-bg) text-(--color-text)"
            : "text-(--color-gray) hover:text-(--color-text) hover:bg-(--color-active-bg)",
        ].join(" ")}
      >
        {isDrawActive && (
          <motion.span
            layoutId="tab-indicator"
            className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
            style={{ backgroundColor: "#ff9f0a" }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
          />
        )}
        <span className="pl-1.5 flex items-center shrink-0">
          <Pencil
            size={14}
            style={{
              opacity: isDrawActive ? 1 : 0.4,
              color: isDrawActive ? "#ff9f0a" : "currentColor",
            }}
          />
        </span>
        <span style={isDrawActive ? { color: "#ff9f0a" } : {}}>Draw</span>
      </motion.button>
    </nav>
  );
});
DesktopTabs.displayName = "DesktopTabs";

// ═══════════════════════════════════════════════════
// MOBILE DROPDOWN
// ═══════════════════════════════════════════════════

export const MobileDropdown = memo(() => {
  const { state, dispatch } = useEditor();
  const dropRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => dispatch({ type: "CLOSE_DROP" }), [dispatch]);

  const handleSelect = useCallback(
    (l: Language) => {
      dispatch({ type: "SET_MODE", payload: "editor" });
      dispatch({ type: "SET_LANG", payload: l });
      safeLocalSet("thirdbrain-lang", l.value);
      safeLocalSet("thirdbrain-mode", "editor");
    },
    [dispatch],
  );

  const handleDrawSelect = useCallback(() => {
    dispatch({ type: "SET_MODE", payload: "draw" });
    dispatch({ type: "CLOSE_DROP" });
    safeLocalSet("thirdbrain-mode", "draw");
  }, [dispatch]);

  useOutsideClick(dropRef, close);

  const isDrawActive = state.mode === "draw";
  const activeAccent = isDrawActive
    ? "#ff9f0a"
    : (LANG_ACCENT[state.lang.value] ?? "var(--color-text)");
  const activeLabel = isDrawActive ? "Draw" : state.lang.label;

  return (
    <div ref={dropRef} className="relative">
      <motion.button
        onClick={() => dispatch({ type: "TOGGLE_DROP" })}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium
                   bg-(--color-active-bg) border border-(--color-active-border) text-(--color-text)"
      >
        {isDrawActive ? (
          <Pencil size={13} style={{ color: "#ff9f0a" }} />
        ) : (
          <LangIcon value={state.lang.value} size={13} active />
        )}
        <span style={{ color: activeAccent }}>{activeLabel}</span>
        {!isDrawActive &&
          state.lang.value === "python" &&
          state.pyStatus === "loading" && <span className="tb-py-dot" />}
        <motion.span
          animate={{ rotate: state.dropOpen ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          style={{ display: "flex" }}
        >
          <ChevronDown size={12} />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {state.dropOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 mt-1.5 z-50 min-w-40 rounded-lg overflow-hidden
                       border border-(--color-active-border) bg-(--color-bg)"
            style={{ boxShadow: "0 8px 28px var(--color-shadow-md)" }}
          >
            {LANGUAGES.map((l, i) => {
              const isActive =
                state.mode === "editor" && l.value === state.lang.value;
              const accent = LANG_ACCENT[l.value] ?? "var(--color-text)";
              return (
                <motion.button
                  key={l.value}
                  onClick={() => handleSelect(l)}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileTap={{ scale: 0.97 }}
                  className={[
                    "w-full text-left px-3.5 py-2.5 text-xs font-mono transition-colors flex items-center gap-2.5",
                    isActive
                      ? "bg-(--color-active-bg) text-(--color-text)"
                      : "text-(--color-text) hover:bg-(--color-active-bg)",
                  ].join(" ")}
                >
                  <LangIcon value={l.value} size={13} active={isActive} />
                  <span style={isActive ? { color: accent } : {}}>
                    {l.label}
                  </span>
                </motion.button>
              );
            })}

            <div
              style={{ height: 1, background: "var(--color-active-border)" }}
            />

            <motion.button
              onClick={handleDrawSelect}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: LANGUAGES.length * 0.04 }}
              whileTap={{ scale: 0.97 }}
              className={[
                "w-full text-left px-3.5 py-2.5 text-xs font-mono transition-colors flex items-center gap-2.5",
                isDrawActive
                  ? "bg-(--color-active-bg) text-(--color-text)"
                  : "text-(--color-text) hover:bg-(--color-active-bg)",
              ].join(" ")}
            >
              <Pencil
                size={13}
                style={{
                  opacity: isDrawActive ? 1 : 0.4,
                  color: isDrawActive ? "#ff9f0a" : "currentColor",
                }}
              />
              <span style={isDrawActive ? { color: "#ff9f0a" } : {}}>Draw</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
MobileDropdown.displayName = "MobileDropdown";

// ═══════════════════════════════════════════════════
// RUN BUTTON
// ═══════════════════════════════════════════════════

export const RunButton = memo(() => {
  const { state, onRun, canRun, hasSelection } = useEditor();
  if (hasSelection) return null;
  if (state.mode === "draw") return null;
  return (
    <motion.button
      onClick={onRun}
      disabled={!canRun}
      whileHover={canRun ? { scale: 1.05 } : {}}
      whileTap={canRun ? { scale: 0.93 } : {}}
      transition={{ duration: 0.12 }}
      className={[
        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium font-mono shrink-0",
        canRun
          ? "bg-(--color-text-hover) text-white cursor-pointer"
          : "bg-(--color-active-bg) text-(--color-gray) border border-(--color-active-border) cursor-default",
      ].join(" ")}
    >
      <AnimatePresence mode="wait" initial={false}>
        {state.running ? (
          <motion.span
            key="spin"
            className="tb-spinner"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.1 }}
          />
        ) : (
          <motion.span
            key="icon"
            style={{ display: "flex" }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.1 }}
          >
            <Play size={10} fill="currentColor" />
          </motion.span>
        )}
      </AnimatePresence>
      <span>{state.running ? "Running..." : "Run"}</span>
    </motion.button>
  );
});
RunButton.displayName = "RunButton";

// ═══════════════════════════════════════════════════
// FORMAT BUTTON
// ═══════════════════════════════════════════════════

export const FormatButton = memo(() => {
  const { state, onFormat, hasSelection } = useEditor();
  const canFormat =
    state.mode === "editor" &&
    (state.lang.value === "javascript" || state.lang.value === "typescript") &&
    !state.running &&
    state.text.trim().length > 0;
  if (hasSelection) return null;
  if (state.mode === "draw") return null;
  return (
    <motion.button
      onClick={onFormat}
      disabled={!canFormat}
      title="Format code (Prettier)"
      whileHover={canFormat ? { scale: 1.05 } : {}}
      whileTap={canFormat ? { scale: 0.93 } : {}}
      transition={{ duration: 0.12 }}
      className={[
        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium font-mono shrink-0",
        canFormat
          ? "bg-(--color-active-bg) border border-(--color-active-border) text-(--color-gray) hover:text-(--color-text) cursor-pointer"
          : "opacity-30 cursor-default",
      ].join(" ")}
    >
      <AnimatePresence mode="wait" initial={false}>
        {state.formatting ? (
          <motion.span
            key="spin"
            className="tb-spinner tb-spinner-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        ) : (
          <motion.span
            key="icon"
            style={{ display: "flex" }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.1 }}
          >
            <WandSparkles size={10} />
          </motion.span>
        )}
      </AnimatePresence>
      <span>{state.formatting ? "Formatting..." : "Format"}</span>
    </motion.button>
  );
});
FormatButton.displayName = "FormatButton";

// ═══════════════════════════════════════════════════
// FORMAT TOAST
// ═══════════════════════════════════════════════════

export const FormatToast = memo(({ visible }: { visible: boolean }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-100 flex items-center gap-2
                   px-3.5 py-2 rounded-lg bg-(--color-active-bg)
                   border border-(--color-active-border)
                   text-[11px] font-mono text-(--color-text-hover)"
        style={{ boxShadow: "0 4px 20px var(--color-shadow-md)" }}
      >
        <WandSparkles size={11} />
        <span>Formatted</span>
      </motion.div>
    )}
  </AnimatePresence>
));
FormatToast.displayName = "FormatToast";

// ═══════════════════════════════════════════════════
// ERROR GUTTER LINE
// ═══════════════════════════════════════════════════

export const ErrorGutterLine = memo(({ error }: { error: ErrorGutter }) => (
  <motion.div
    initial={{ opacity: 0, x: -4 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -4 }}
    transition={{ duration: 0.18 }}
    className="flex items-start gap-2 px-3 py-1.5 text-[11px] font-mono
               bg-red-500/10 border-l-2 border-red-500 text-red-400"
  >
    <AlertCircle size={11} className="mt-0.5 shrink-0" />
    <span>
      <span className="font-semibold">Line {error.line}:</span>{" "}
      <span className="opacity-80">{error.message}</span>
    </span>
  </motion.div>
));
ErrorGutterLine.displayName = "ErrorGutterLine";
