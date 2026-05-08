// DrawingCanvas.tsx

"use client";

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  memo,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  Download,
  Undo2,
  Redo2,
  Pencil,
  PenLine,
  Highlighter,
  Eraser,
  ChevronUp,
  X,
  Minus,
  Plus,
} from "lucide-react";
import {
  isBrowser,
  safeLocalGet,
  safeLocalSet,
  safeLocalRemove,
} from "./ThirdEyeLogic";

type DrawTool = "pencil" | "pen" | "marker" | "eraser";

interface Point {
  x: number;
  y: number;
  pressure: number;
}

const TOOLS = [
  {
    id: "pencil" as DrawTool,
    label: "Pencil",
    Icon: Pencil,
    baseWidth: 1.8,
    opacity: 0.92,
    cap: "round" as CanvasLineCap,
  },
  {
    id: "pen" as DrawTool,
    label: "Pen",
    Icon: PenLine,
    baseWidth: 3.0,
    opacity: 1.0,
    cap: "round" as CanvasLineCap,
  },
  {
    id: "marker" as DrawTool,
    label: "Marker",
    Icon: Highlighter,
    baseWidth: 14,
    opacity: 0.42,
    cap: "square" as CanvasLineCap,
  },
  {
    id: "eraser" as DrawTool,
    label: "Eraser",
    Icon: Eraser,
    baseWidth: 28,
    opacity: 1.0,
    cap: "round" as CanvasLineCap,
  },
];

const COLORS = [
  { value: "#1e293b", label: "Dark" },
  { value: "#000000", label: "Black" },
  { value: "#ef4444", label: "Red" },
  { value: "#22c55e", label: "Green" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#a855f7", label: "Purple" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#ec4899", label: "Pink" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#14b8a6", label: "Teal" },
  { value: "#6b7280", label: "Gray" },
];

const MAX_UNDO = 50;

const getCanvasBg = (): string => {
  if (!isBrowser) return "#ffffff";
  const theme = document.documentElement.getAttribute("data-theme");
  return theme === "dark" ? "#13161c" : "#ffffff";
};

const getPointerPos = (
  e: React.PointerEvent | PointerEvent,
  canvas: HTMLCanvasElement,
): Point => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const native = "nativeEvent" in e ? e.nativeEvent : e;
  let pressure = native.pressure ?? 0.5;
  if (pressure === 0) pressure = 0.5;
  return {
    x: (native.clientX - rect.left) * scaleX,
    y: (native.clientY - rect.top) * scaleY,
    pressure,
  };
};

const drawSmoothStroke = (
  ctx: CanvasRenderingContext2D,
  points: Point[],
  tool: (typeof TOOLS)[number],
  color: string,
  multiplier: number,
  isEraser: boolean,
) => {
  if (points.length < 2) return;
  ctx.save();
  if (isEraser) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.globalAlpha = 1;
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = tool.opacity;
  }
  ctx.strokeStyle = isEraser ? "#000" : color;
  ctx.lineCap = tool.cap;
  ctx.lineJoin = "round";

  if (tool.id === "pencil") {
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1],
        p1 = points[i];
      ctx.beginPath();
      ctx.lineWidth =
        tool.baseWidth * multiplier * ((p0.pressure + p1.pressure) / 2);
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
  } else {
    ctx.beginPath();
    const avg = points.reduce((s, p) => s + p.pressure, 0) / points.length;
    ctx.lineWidth = tool.baseWidth * multiplier * avg;
    if (points.length === 2) {
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[1].x, points[1].y);
    } else {
      ctx.moveTo(points[0].x, points[0].y);
      const t = tool.id === "pen" ? 0.45 : 0.6;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(i - 1, 0)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(i + 2, points.length - 1)];
        ctx.bezierCurveTo(
          p1.x + ((p2.x - p0.x) * t) / 3,
          p1.y + ((p2.y - p0.y) * t) / 3,
          p2.x - ((p3.x - p1.x) * t) / 3,
          p2.y - ((p3.y - p1.y) * t) / 3,
          p2.x,
          p2.y,
        );
      }
    }
    ctx.stroke();
  }
  ctx.restore();
};

/* ── Brush Preview ── */
const BrushPreview = memo(
  ({ tool, color, size }: { tool: DrawTool; color: string; size: number }) => {
    const d = Math.max(4, Math.min(size * 2, 48));
    const isE = tool === "eraser";
    return (
      <div
        style={{
          width: d,
          height: d,
          borderRadius: tool === "marker" ? 4 : "50%",
          background: isE ? "transparent" : color,
          border: isE
            ? "2px dashed var(--color-gray)"
            : `2px solid ${color === "#000000" ? "var(--color-gray)" : "transparent"}`,
          transition: "all 0.2s",
          flexShrink: 0,
        }}
      />
    );
  },
);
BrushPreview.displayName = "BrushPreview";

/* ── Size Slider ── */
const SizeSlider = memo(
  ({
    value,
    onChange,
    tool,
  }: {
    value: number;
    onChange: (v: number) => void;
    tool: DrawTool;
  }) => {
    const min = 0.3,
      max = tool === "eraser" ? 5 : 4;
    const pct = ((value - min) / (max - min)) * 100;
    return (
      <div
        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}
      >
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => onChange(Math.max(min, value - 0.2))}
          style={{
            background: "none",
            border: "none",
            color: "var(--color-gray)",
            cursor: "pointer",
            padding: 4,
            display: "flex",
          }}
        >
          <Minus size={14} />
        </motion.button>
        <input
          type="range"
          min={min}
          max={max}
          step={0.1}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="draw-range-input"
          style={{
            flex: 1,
            height: 4,
            outline: "none",
            cursor: "pointer",
            borderRadius: 4,
            background: `linear-gradient(to right, var(--color-text-hover) ${pct}%, var(--color-active-border) ${pct}%)`,
          }}
        />
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => onChange(Math.min(max, value + 0.2))}
          style={{
            background: "none",
            border: "none",
            color: "var(--color-gray)",
            cursor: "pointer",
            padding: 4,
            display: "flex",
          }}
        >
          <Plus size={14} />
        </motion.button>
      </div>
    );
  },
);
SizeSlider.displayName = "SizeSlider";

/* ── Color Grid ── */
const ColorGrid = memo(
  ({
    activeColor,
    onSelect,
  }: {
    activeColor: string;
    onSelect: (c: string) => void;
  }) => (
    <div
      style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}
    >
      {COLORS.map((c, i) => {
        const active = activeColor === c.value;
        return (
          <motion.button
            key={c.value}
            onClick={() => onSelect(c.value)}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.02, duration: 0.15 }}
            title={c.label}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: c.value,
              cursor: "pointer",
              border: active
                ? "2.5px solid var(--color-text-hover)"
                : `2px solid ${c.value === "#000000" ? "var(--color-gray)" : "transparent"}`,
              outline: active ? "2px solid var(--color-text-hover)" : "none",
              outlineOffset: 2,
            }}
          />
        );
      })}
    </div>
  ),
);
ColorGrid.displayName = "ColorGrid";

/* ── Tool Sheet ── */
const ToolSheet = memo(
  ({
    isOpen,
    onClose,
    isMobile,
    activeTool,
    activeColor,
    strokeMultiplier,
    onToolChange,
    onColorChange,
    onSizeChange,
  }: {
    isOpen: boolean;
    onClose: () => void;
    isMobile: boolean;
    activeTool: DrawTool;
    activeColor: string;
    strokeMultiplier: number;
    onToolChange: (t: DrawTool) => void;
    onColorChange: (c: string) => void;
    onSizeChange: (s: number) => void;
  }) => {
    const currentTool = TOOLS.find((t) => t.id === activeTool)!;
    const variants = isMobile
      ? {
          hidden: { y: "100%", opacity: 0 },
          visible: {
            y: 0,
            opacity: 1,
            transition: {
              type: "spring" as const,
              stiffness: 340,
              damping: 32,
            },
          },
          exit: { y: "100%", opacity: 0, transition: { duration: 0.25 } },
        }
      : {
          hidden: { y: 16, opacity: 0, scale: 0.95 },
          visible: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: {
              type: "spring" as const,
              stiffness: 400,
              damping: 30,
            },
          },
          exit: {
            y: 16,
            opacity: 0,
            scale: 0.95,
            transition: { duration: 0.18 },
          },
        };

    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.25)",
                zIndex: 90,
                backdropFilter: "blur(2px)",
                WebkitBackdropFilter: "blur(2px)",
              }}
            />
            <motion.div
              variants={variants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                zIndex: 100,
                ...(isMobile
                  ? {
                      bottom: 0,
                      left: 0,
                      right: 0,
                      borderTopLeftRadius: 20,
                      borderTopRightRadius: 20,
                      maxHeight: "70%",
                      paddingBottom:
                        "max(20px, env(safe-area-inset-bottom, 20px))",
                    }
                  : {
                      bottom: 90,
                      left: "50%",
                      borderRadius: 16,
                      width: 340,
                      maxHeight: "60%",
                      transform: "translateX(-50%)",
                    }),
                background: "var(--color-bg)",
                border: "1px solid var(--color-active-border)",
                boxShadow: "0 8px 40px var(--color-shadow-md)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column" as const,
              }}
            >
              {isMobile && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    paddingTop: 10,
                    paddingBottom: 4,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 4,
                      borderRadius: 2,
                      background: "var(--color-gray)",
                      opacity: 0.4,
                    }}
                  />
                </div>
              )}
              <div
                style={{
                  padding: isMobile ? "8px 20px 20px" : "16px 20px 20px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column" as const,
                  gap: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12,
                      color: "var(--color-gray)",
                      textTransform: "uppercase" as const,
                      letterSpacing: 1,
                    }}
                  >
                    Brush Settings
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    style={{
                      background: "var(--color-active-bg)",
                      border: "none",
                      color: "var(--color-gray)",
                      cursor: "pointer",
                      borderRadius: 8,
                      padding: 6,
                      display: "flex",
                    }}
                  >
                    <X size={16} />
                  </motion.button>
                </div>

                <div>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      color: "var(--color-gray)",
                      marginBottom: 8,
                      display: "block",
                    }}
                  >
                    Tool
                  </span>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: 6,
                    }}
                  >
                    {TOOLS.map((t) => {
                      const isA = activeTool === t.id;
                      return (
                        <motion.button
                          key={t.id}
                          onClick={() => onToolChange(t.id)}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.95 }}
                          style={{
                            display: "flex",
                            flexDirection: "column" as const,
                            alignItems: "center",
                            gap: 4,
                            padding: "10px 4px",
                            borderRadius: 10,
                            cursor: "pointer",
                            transition: "all 0.15s",
                            border: isA
                              ? "1.5px solid var(--color-text-hover)"
                              : "1.5px solid transparent",
                            background: isA
                              ? "var(--color-active-bg)"
                              : "transparent",
                            color: isA
                              ? "var(--color-text-hover)"
                              : "var(--color-gray)",
                          }}
                        >
                          <t.Icon size={18} />
                          <span
                            style={{
                              fontSize: 10,
                              fontFamily: "monospace",
                              fontWeight: isA ? 600 : 400,
                            }}
                          >
                            {t.label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 11,
                        color: "var(--color-gray)",
                      }}
                    >
                      Size
                    </span>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <BrushPreview
                        tool={activeTool}
                        color={activeColor}
                        size={currentTool.baseWidth * strokeMultiplier}
                      />
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: 11,
                          color: "var(--color-text)",
                          minWidth: 28,
                          textAlign: "right" as const,
                        }}
                      >
                        {(currentTool.baseWidth * strokeMultiplier).toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <SizeSlider
                    value={strokeMultiplier}
                    onChange={onSizeChange}
                    tool={activeTool}
                  />
                </div>

                {activeTool !== "eraser" && (
                  <div>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 11,
                        color: "var(--color-gray)",
                        marginBottom: 8,
                        display: "block",
                      }}
                    >
                      Color
                    </span>
                    <ColorGrid
                      activeColor={activeColor}
                      onSelect={onColorChange}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  },
);
ToolSheet.displayName = "ToolSheet";

/* ── Cursor Overlay (desktop) ── */
const CursorOverlay = memo(
  ({
    x,
    y,
    visible,
    size,
    tool,
    color,
  }: {
    x: number;
    y: number;
    visible: boolean;
    size: number;
    tool: DrawTool;
    color: string;
  }) => {
    if (!visible) return null;
    const d = Math.max(6, size * 2);
    const isE = tool === "eraser";
    return (
      <div
        style={{
          position: "absolute",
          left: x - d / 2,
          top: y - d / 2,
          width: d,
          height: d,
          borderRadius: tool === "marker" ? 3 : "50%",
          border: isE
            ? "1.5px solid var(--color-gray)"
            : `1.5px solid ${color}`,
          background: isE ? "rgba(128,128,128,0.15)" : "transparent",
          pointerEvents: "none" as const,
          zIndex: 30,
          transition: "width 0.1s, height 0.1s",
        }}
      />
    );
  },
);
CursorOverlay.displayName = "CursorOverlay";

/* ── Floating Toolbar ── */
const FloatingToolbar = memo(
  ({
    activeTool,
    activeColor,
    isMobile,
    isDrawing,
    canUndo,
    canRedo,
    onOpenSheet,
    onUndo,
    onRedo,
    onClear,
    onDownload,
    onToolChange,
  }: {
    activeTool: DrawTool;
    activeColor: string;
    isMobile: boolean;
    isDrawing: boolean;
    canUndo: boolean;
    canRedo: boolean;
    onOpenSheet: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onClear: () => void;
    onDownload: () => void;
    onToolChange: (t: DrawTool) => void;
  }) => {
    const ActiveIcon = TOOLS.find((t) => t.id === activeTool)?.Icon ?? PenLine;
    const sz = isMobile ? 20 : 16;
    const btn: React.CSSProperties = {
      background: "none",
      border: "none",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      padding: isMobile ? 10 : 8,
    };
    const sep = (
      <div
        style={{
          width: 1,
          height: 24,
          background: "var(--color-active-border)",
          flexShrink: 0,
        }}
      />
    );

    return (
      <motion.div
        initial={{ y: 30, opacity: 0, scale: 0.9 }}
        animate={{
          y: 0,
          opacity: isDrawing ? 0.25 : 1,
          scale: isDrawing ? 0.96 : 1,
        }}
        transition={{ type: "spring" as const, stiffness: 400, damping: 28 }}
        style={{
          position: "absolute",
          ...(isMobile
            ? {
                bottom: 96,
                top: "auto",
                left: 10,
                transform: "none",
              }
            : {
                bottom: 5,
                top: "auto",
                left: "50%",
                transform: "translateX(-50%)",
              }),
          zIndex: 20,
          background: "var(--color-bg)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: 16,
          padding: isMobile ? "6px 8px" : "6px 12px",
          display: "flex",
          alignItems: "center",
          gap: isMobile ? 2 : 6,
          border: "1px solid var(--color-active-border)",
          boxShadow: isMobile
            ? "0 4px 24px var(--color-shadow-md)"
            : "0 8px 32px var(--color-shadow-md)",
          pointerEvents: isDrawing ? ("none" as const) : ("auto" as const),
          width: isMobile ? "calc(100vw - 32px)" : "auto",
          maxWidth: isMobile ? "calc(100vw - 32px)" : "none",
          boxSizing: "border-box" as const,
        }}
      >
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={onOpenSheet}
          style={{
            ...btn,
            gap: 6,
            padding: isMobile ? "8px 10px" : "8px 12px",
            borderRadius: 10,
            background: "var(--color-active-bg)",
            color: "var(--color-text)",
          }}
        >
          <ActiveIcon size={sz} />
          {activeTool !== "eraser" && (
            <div
              style={{
                width: isMobile ? 14 : 12,
                height: isMobile ? 14 : 12,
                borderRadius: "50%",
                background: activeColor,
                flexShrink: 0,
                border:
                  activeColor === "#000000"
                    ? "1.5px solid var(--color-gray)"
                    : "none",
              }}
            />
          )}
          <ChevronUp
            size={isMobile ? 14 : 12}
            style={{
              opacity: 0.5,
              color: "var(--color-gray)",
              transform: "none",
              transition: "transform 0.2s",
            }}
          />
        </motion.button>

        {!isMobile && (
          <>
            {sep}
            {TOOLS.map((t) => {
              const isA = activeTool === t.id;
              return (
                <motion.button
                  key={t.id}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onToolChange(t.id)}
                  title={t.label}
                  style={{
                    ...btn,
                    opacity: isA ? 1 : 0.45,
                    color: isA
                      ? "var(--color-text-hover)"
                      : "var(--color-gray)",
                    background: isA ? "var(--color-active-bg)" : "none",
                  }}
                >
                  <t.Icon size={sz} />
                </motion.button>
              );
            })}
          </>
        )}

        {sep}

        <motion.button
          whileHover={canUndo ? { scale: 1.1 } : {}}
          whileTap={canUndo ? { scale: 0.9 } : {}}
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
          style={{
            ...btn,
            color: canUndo ? "var(--color-text)" : "var(--color-gray)",
            opacity: canUndo ? 0.85 : 0.3,
          }}
        >
          <Undo2 size={sz} />
        </motion.button>
        <motion.button
          whileHover={canRedo ? { scale: 1.1 } : {}}
          whileTap={canRedo ? { scale: 0.9 } : {}}
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
          style={{
            ...btn,
            color: canRedo ? "var(--color-text)" : "var(--color-gray)",
            opacity: canRedo ? 0.85 : 0.3,
          }}
        >
          <Redo2 size={sz} />
        </motion.button>

        {sep}

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onDownload}
          title="Download"
          style={{ ...btn, color: "var(--color-text)", opacity: 0.85 }}
        >
          <Download size={sz} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClear}
          title="Clear"
          style={{ ...btn, color: "#ef4444", opacity: 0.7 }}
        >
          <Trash2 size={sz} />
        </motion.button>
      </motion.div>
    );
  },
);
FloatingToolbar.displayName = "FloatingToolbar";

/* ════════════════════════════════════════════════
   MAIN CANVAS
   ════════════════════════════════════════════════ */
export const DrawingCanvas = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeTool, setActiveTool] = useState<DrawTool>(() => {
    const saved = safeLocalGet("draw-tool");
    return (saved as DrawTool) || "pen";
  });
  const [activeColor, setActiveColor] = useState<string>(() => {
    return safeLocalGet("draw-color") || COLORS[0].value;
  });
  const [strokeMultiplier, setStrokeMultiplier] = useState<number>(() => {
    const saved = safeLocalGet("draw-size");
    return saved ? parseFloat(saved) : 1;
  });

  const saveTool = useCallback((t: DrawTool) => {
    setActiveTool(t);
    safeLocalSet("draw-tool", t);
  }, []);

  const saveColor = useCallback((c: string) => {
    setActiveColor(c);
    safeLocalSet("draw-color", c);
  }, []);

  const saveSize = useCallback((s: number) => {
    setStrokeMultiplier(s);
    safeLocalSet("draw-size", String(s));
  }, []);

  const [isDrawing, setIsDrawing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0, visible: false });
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);

  const currentPath = useRef<Point[]>([]);
  const undoStack = useRef<ImageData[]>([]);
  const redoStack = useRef<ImageData[]>([]);
  const activePointers = useRef<Map<number, { x: number; y: number }>>(
    new Map(),
  );
  const lastPinchDist = useRef<number | null>(null);
  const isMultiTouch = useRef(false);
  const twoFingerTapStart = useRef(0);
  const twoFingerMoved = useRef(false);

  const tool = useMemo(
    () => TOOLS.find((t) => t.id === activeTool)!,
    [activeTool],
  );

  useEffect(() => {
    if (!isBrowser) return;
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ── Persist canvas to localStorage after each stroke ── */
  const persistCanvas = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    try {
      const dataUrl = c.toDataURL("image/png");
      safeLocalSet("draw-canvas", dataUrl);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const saveSnapshot = useCallback(() => {
    const c = canvasRef.current,
      ctx = c?.getContext("2d");
    if (!ctx || !c) return;
    undoStack.current.push(ctx.getImageData(0, 0, c.width, c.height));
    if (undoStack.current.length > MAX_UNDO) undoStack.current.shift();
    redoStack.current = [];
    setUndoCount(undoStack.current.length);
    setRedoCount(0);
  }, []);

  const doUndo = useCallback(() => {
    const c = canvasRef.current,
      ctx = c?.getContext("2d");
    if (!ctx || !c || !undoStack.current.length) return;
    redoStack.current.push(ctx.getImageData(0, 0, c.width, c.height));
    ctx.putImageData(undoStack.current.pop()!, 0, 0);
    setUndoCount(undoStack.current.length);
    setRedoCount(redoStack.current.length);
    persistCanvas();
  }, [persistCanvas]);

  const doRedo = useCallback(() => {
    const c = canvasRef.current,
      ctx = c?.getContext("2d");
    if (!ctx || !c || !redoStack.current.length) return;
    undoStack.current.push(ctx.getImageData(0, 0, c.width, c.height));
    ctx.putImageData(redoStack.current.pop()!, 0, 0);
    setUndoCount(undoStack.current.length);
    setRedoCount(redoStack.current.length);
    persistCanvas();
  }, [persistCanvas]);

  useEffect(() => {
    if (!isBrowser) return;
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        doUndo();
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        doRedo();
      }
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case "p":
            saveTool("pencil");
            break;
          case "b":
            saveTool("pen");
            break;
          case "m":
            saveTool("marker");
            break;
          case "e":
            saveTool("eraser");
            break;
          case "[":
            saveSize(Math.max(0.3, strokeMultiplier - 0.2));
            break;
          case "]":
            saveSize(Math.min(5, strokeMultiplier + 0.2));
            break;
        }
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [doUndo, doRedo, saveTool, saveSize, strokeMultiplier]);

  /* ── Resize ── */
  useEffect(() => {
    if (!isBrowser) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = container.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);
      if (w === 0 || h === 0) return;
      if (canvas.width === w * dpr && canvas.height === h * dpr) return;

      let saved: ImageData | null = null;
      const ctx = canvas.getContext("2d");
      if (ctx && canvas.width > 0 && canvas.height > 0) {
        try {
          saved = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch {
          /**/
        }
      }
      const oldW = canvas.width,
        oldH = canvas.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const nCtx = canvas.getContext("2d")!;
      nCtx.fillStyle = getCanvasBg();
      nCtx.fillRect(0, 0, canvas.width, canvas.height);

      if (saved && oldW > 0 && oldH > 0) {
        const tmp = document.createElement("canvas");
        tmp.width = oldW;
        tmp.height = oldH;
        tmp.getContext("2d")!.putImageData(saved, 0, 0);
        nCtx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
      }
    };

    const debResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(resize);
    };
    resize();
    const obs = new ResizeObserver(debResize);
    obs.observe(container);
    const onO = () => setTimeout(resize, 200);
    window.addEventListener("orientationchange", onO);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("orientationchange", onO);
    };
  }, []);

  /* ── Fill initial bg + restore saved drawing ── */
  useEffect(() => {
    if (!isBrowser) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || canvas.width === 0) return;

    const restore = () => {
      const saved = safeLocalGet("draw-canvas");
      if (saved) {
        const img = new Image();
        img.onload = () => {
          ctx.fillStyle = getCanvasBg();
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = saved;
        return;
      }
      ctx.fillStyle = getCanvasBg();
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    if (canvas.width === 0 || canvas.height === 0) {
      const id = setInterval(() => {
        if (canvas.width > 0 && canvas.height > 0) {
          clearInterval(id);
          restore();
        }
      }, 50);
      return () => clearInterval(id);
    } else {
      restore();
    }
  }, []);

  /* ── Watch theme changes ── */
  useEffect(() => {
    if (!isBrowser) return;
    const obs = new MutationObserver(() => {
      // Theme changed — toolbar & sheet auto-update via CSS vars
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => obs.disconnect();
  }, []);

  const clearCanvas = useCallback(() => {
    const c = canvasRef.current,
      ctx = c?.getContext("2d");
    if (!ctx || !c) return;
    saveSnapshot();
    ctx.fillStyle = getCanvasBg();
    ctx.fillRect(0, 0, c.width, c.height);
    safeLocalRemove("draw-canvas");
  }, [saveSnapshot]);

  const download = useCallback(() => {
    const c = canvasRef.current;
    if (!c || !isBrowser) return;
    const a = document.createElement("a");
    a.download = `drawing-${Date.now()}.png`;
    a.href = c.toDataURL("image/png");
    a.click();
  }, []);

  const drawSegment = useCallback(
    (pts: Point[]) => {
      const c = canvasRef.current,
        ctx = c?.getContext("2d");
      if (!ctx || pts.length < 2) return;
      drawSmoothStroke(
        ctx,
        pts,
        tool,
        activeColor,
        strokeMultiplier,
        activeTool === "eraser",
      );
    },
    [activeTool, activeColor, tool, strokeMultiplier],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (sheetOpen) return;
      const canvas = e.currentTarget;
      canvas.setPointerCapture(e.pointerId);
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointers.current.size === 2) {
        isMultiTouch.current = true;
        twoFingerTapStart.current = Date.now();
        twoFingerMoved.current = false;
        currentPath.current = [];
        setIsDrawing(false);
        return;
      }
      if (activePointers.current.size > 2) return;

      saveSnapshot();
      const pt = getPointerPos(e, canvas);
      currentPath.current = [pt];
      setIsDrawing(true);

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.save();
        if (activeTool === "eraser") {
          ctx.globalCompositeOperation = "destination-out";
          ctx.globalAlpha = 1;
        } else {
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = tool.opacity;
        }
        ctx.fillStyle = activeTool === "eraser" ? "#000" : activeColor;
        ctx.beginPath();
        ctx.arc(
          pt.x,
          pt.y,
          Math.max((tool.baseWidth * strokeMultiplier * pt.pressure) / 2, 0.5),
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.restore();
      }
    },
    [sheetOpen, saveSnapshot, activeTool, activeColor, tool, strokeMultiplier],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = e.currentTarget;
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (!isMobile) {
        const r = canvas.getBoundingClientRect();
        setCursorPos({
          x: e.clientX - r.left,
          y: e.clientY - r.top,
          visible: true,
        });
      }
      if (activePointers.current.size === 2) {
        twoFingerMoved.current = true;
        const pts = Array.from(activePointers.current.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (lastPinchDist.current !== null) {
          setStrokeMultiplier((s) => {
            const next = Math.max(
              0.3,
              Math.min(5, s + (dist - lastPinchDist.current!) / 150),
            );
            safeLocalSet("draw-size", String(next));
            return next;
          });
        }
        lastPinchDist.current = dist;
        return;
      }
      if (!isDrawing || isMultiTouch.current) return;
      const pt = getPointerPos(e, canvas);
      currentPath.current.push(pt);
      drawSegment(currentPath.current.slice(-6));
    },
    [isDrawing, isMobile, drawSegment],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      activePointers.current.delete(e.pointerId);
      if (isMultiTouch.current && activePointers.current.size === 0) {
        if (
          !twoFingerMoved.current &&
          Date.now() - twoFingerTapStart.current < 400
        )
          doUndo();
        isMultiTouch.current = false;
        lastPinchDist.current = null;
      }
      if (activePointers.current.size === 0) {
        setIsDrawing(false);
        currentPath.current = [];
        lastPinchDist.current = null;
        isMultiTouch.current = false;
        persistCanvas();
      }
    },
    [doUndo, persistCanvas],
  );

  return (
    <div
      ref={containerRef}
      style={{
        flex: "1 1 0%",
        position: "relative",
        overflow: "visible",
        touchAction: "none",
        overscrollBehavior: "none",
        width: "100%",
        minHeight: 0,
        height: "100%",
        background: "var(--color-bg)",
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={(e) => {
          onPointerUp(e);
          setCursorPos((p) => ({ ...p, visible: false }));
        }}
        onPointerCancel={onPointerUp}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          touchAction: "none",
          cursor: isMobile ? "default" : "none",
        }}
      />

      {!isMobile && (
        <CursorOverlay
          x={cursorPos.x}
          y={cursorPos.y}
          visible={cursorPos.visible && !sheetOpen}
          size={tool.baseWidth * strokeMultiplier}
          tool={activeTool}
          color={activeColor}
        />
      )}

      <FloatingToolbar
        activeTool={activeTool}
        activeColor={activeColor}
        isMobile={isMobile}
        isDrawing={isDrawing}
        canUndo={undoCount > 0}
        canRedo={redoCount > 0}
        onOpenSheet={() => setSheetOpen(true)}
        onUndo={doUndo}
        onRedo={doRedo}
        onClear={clearCanvas}
        onDownload={download}
        onToolChange={saveTool}
      />

      <ToolSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        isMobile={isMobile}
        activeTool={activeTool}
        activeColor={activeColor}
        strokeMultiplier={strokeMultiplier}
        onToolChange={saveTool}
        onColorChange={saveColor}
        onSizeChange={saveSize}
      />

      <AnimatePresence>
        {!isDrawing && !sheetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            style={{
              position: "absolute",
              ...(isMobile
                ? { bottom: 20, top: "auto" }
                : { bottom: 80, top: "auto" }),
              left: "50%",
              transform: "translateX(-50%)",
              color: "var(--color-gray)",
              fontSize: 11,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              pointerEvents: "none",
              textAlign: "center",
              whiteSpace: "nowrap",
              maxWidth: "90vw",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {isMobile
              ? "pinch → resize · 2-finger tap → undo"
              : "p/b/m/e → tools · [ ] → size · ctrl+z/y → undo/redo"}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

DrawingCanvas.displayName = "DrawingCanvas";
