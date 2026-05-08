/* eslint-disable react-hooks/set-state-in-effect */
// src/components/ImageEditor/ImageEditor.tsx
"use client";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Check,
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  FlipHorizontal,
  FlipVertical,
  RefreshCw,
  Crop,
  Move,
  Maximize2,
} from "lucide-react";
import { lockScroll, unlockScroll } from "@/src/Utility/scrollLock";

/* ── types ── */
interface ImageEditorProps {
  file: File;
  onConfirm: (editedBlob: Blob, previewUrl: string) => void;
  onCancel: () => void;
}
type FreeCrop = { x: number; y: number; w: number; h: number };
type Bounds = { x: number; y: number; w: number; h: number };

const ASPECT_OPTIONS = [
  { label: "Free", value: "free" as const, bn: "মুক্ত রিসাইজ" },
  { label: "1:1", value: 1, bn: "১:১" },
  { label: "4:3", value: 4 / 3, bn: "৪:৩" },
  { label: "16:9", value: 16 / 9, bn: "১৬:৯" },
  { label: "3:2", value: 3 / 2, bn: "৩:২" },
  { label: "2:3", value: 2 / 3, bn: "২:৩" },
] as const;

/* ── helpers ──
   new HTMLImage() ব্যবহার করছি — next/image import নেই,
   তাই global Image constructor shadow হয় না              */
const loadImg = (url: string): Promise<HTMLImageElement> =>
  new Promise((res, rej) => {
    const i = new window.Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = url;
  });

const rad = (d: number) => (d * Math.PI) / 180;
const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

async function cropFixed(
  src: string,
  area: Area,
  rot: number,
  fh: boolean,
  fv: boolean,
): Promise<Blob> {
  const img = await loadImg(src);
  const r = rad(rot);
  const s = Math.abs(Math.sin(r)),
    c = Math.abs(Math.cos(r));
  const bw = img.width * c + img.height * s;
  const bh = img.width * s + img.height * c;
  const cv = document.createElement("canvas");
  cv.width = bw;
  cv.height = bh;
  const cx = cv.getContext("2d")!;
  cx.translate(bw / 2, bh / 2);
  cx.rotate(r);
  cx.scale(fh ? -1 : 1, fv ? -1 : 1);
  cx.translate(-img.width / 2, -img.height / 2);
  cx.drawImage(img, 0, 0);
  const out = document.createElement("canvas");
  out.width = area.width;
  out.height = area.height;
  out
    .getContext("2d")!
    .drawImage(
      cv,
      area.x,
      area.y,
      area.width,
      area.height,
      0,
      0,
      area.width,
      area.height,
    );
  return new Promise((res, rej) =>
    out.toBlob((b) => (b ? res(b) : rej()), "image/webp", 0.88),
  );
}

async function cropFree(
  src: string,
  crop: FreeCrop,
  rot: number,
  fh: boolean,
  fv: boolean,
): Promise<Blob> {
  const img = await loadImg(src);
  const px = Math.round((crop.x / 100) * img.naturalWidth);
  const py = Math.round((crop.y / 100) * img.naturalHeight);
  const pw = Math.max(1, Math.round((crop.w / 100) * img.naturalWidth));
  const ph = Math.max(1, Math.round((crop.h / 100) * img.naturalHeight));
  const cv1 = document.createElement("canvas");
  cv1.width = pw;
  cv1.height = ph;
  cv1.getContext("2d")!.drawImage(img, px, py, pw, ph, 0, 0, pw, ph);
  if (rot === 0 && !fh && !fv)
    return new Promise((res, rej) =>
      cv1.toBlob((b) => (b ? res(b) : rej()), "image/webp", 0.88),
    );
  const r = rad(rot);
  const s = Math.abs(Math.sin(r)),
    c = Math.abs(Math.cos(r));
  const bW = Math.round(pw * c + ph * s),
    bH = Math.round(pw * s + ph * c);
  const cv2 = document.createElement("canvas");
  cv2.width = bW;
  cv2.height = bH;
  const cx = cv2.getContext("2d")!;
  cx.translate(bW / 2, bH / 2);
  cx.rotate(r);
  cx.scale(fh ? -1 : 1, fv ? -1 : 1);
  cx.drawImage(cv1, -pw / 2, -ph / 2);
  return new Promise((res, rej) =>
    cv2.toBlob((b) => (b ? res(b) : rej()), "image/webp", 0.88),
  );
}

async function makeTransformed(
  src: string,
  rot: number,
  fh: boolean,
  fv: boolean,
): Promise<string> {
  const img = await loadImg(src);
  const r = rad(rot);
  const s = Math.abs(Math.sin(r)),
    c = Math.abs(Math.cos(r));
  const w = Math.round(img.naturalWidth * c + img.naturalHeight * s);
  const h = Math.round(img.naturalWidth * s + img.naturalHeight * c);
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const cx = cv.getContext("2d")!;
  cx.translate(w / 2, h / 2);
  cx.rotate(r);
  cx.scale(fh ? -1 : 1, fv ? -1 : 1);
  cx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  return new Promise((res, rej) =>
    cv.toBlob(
      (b) => (b ? res(URL.createObjectURL(b)) : rej()),
      "image/webp",
      0.92,
    ),
  );
}

/* ════════════════════════════════════════════════════════
   FreeResizeCrop
   ════════════════════════════════════════════════════════ */
interface FreeCropProps {
  imageSrc: string;
  crop: FreeCrop;
  onChange: (c: FreeCrop) => void;
  onNaturalDims?: (w: number, h: number) => void;
  show: boolean;
}

const HANDLE_IDS = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;
const HANDLE_META: Record<string, { cx: number; cy: number; cur: string }> = {
  nw: { cx: 0, cy: 0, cur: "nwse-resize" },
  n: { cx: 0.5, cy: 0, cur: "ns-resize" },
  ne: { cx: 1, cy: 0, cur: "nesw-resize" },
  e: { cx: 1, cy: 0.5, cur: "ew-resize" },
  se: { cx: 1, cy: 1, cur: "nwse-resize" },
  s: { cx: 0.5, cy: 1, cur: "ns-resize" },
  sw: { cx: 0, cy: 1, cur: "nesw-resize" },
  w: { cx: 0, cy: 0.5, cur: "ew-resize" },
};
const HS = 14,
  HH = HS / 2;

/* ════════════════════════════════════════════════════════
   FreeResizeCrop (Fixed for React Compiler)
   ═══════════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════════
   FreeResizeCrop
   ════════════════════════════════════════════════════════ */
const FreeResizeCrop = ({
  imageSrc,
  crop: extCrop,
  onChange,
  onNaturalDims,
  show,
}: FreeCropProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const bRef = useRef<Bounds>({ x: 0, y: 0, w: 0, h: 0 });
  const cRef = useRef<FreeCrop>(extCrop);

  const boxRef = useRef<HTMLDivElement>(null);
  const oT = useRef<HTMLDivElement>(null);
  const oB = useRef<HTMLDivElement>(null);
  const oL = useRef<HTMLDivElement>(null);
  const oR = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const hRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  // Refs that don't change - no dependencies needed
  const paint = useCallback(() => {
    const b = bRef.current;
    const c = cRef.current;
    if (!b.w) return;
    const ax = b.x + (c.x / 100) * b.w;
    const ay = b.y + (c.y / 100) * b.h;
    const aw = (c.w / 100) * b.w;
    const ah = (c.h / 100) * b.h;
    const box = boxRef.current;
    if (box) {
      box.style.transform = `translate3d(${ax}px,${ay}px,0)`;
      box.style.width = aw + "px";
      box.style.height = ah + "px";
    }
    if (oT.current)
      oT.current.style.cssText = `position:absolute;left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${ay - b.y}px`;
    if (oB.current)
      oB.current.style.cssText = `position:absolute;left:${b.x}px;top:${ay + ah}px;width:${b.w}px;height:${b.y + b.h - ay - ah}px`;
    if (oL.current)
      oL.current.style.cssText = `position:absolute;left:${b.x}px;top:${ay}px;width:${ax - b.x}px;height:${ah}px`;
    if (oR.current)
      oR.current.style.cssText = `position:absolute;left:${ax + aw}px;top:${ay}px;width:${b.x + b.w - ax - aw}px;height:${ah}px`;
    for (const id of HANDLE_IDS) {
      const el = hRefs.current[id];
      if (!el) continue;
      const m = HANDLE_META[id];
      el.style.transform = `translate3d(${ax + m.cx * aw - HH}px,${ay + m.cy * ah - HH}px,0)`;
    }
  }, []); // ✅ EMPTY - refs are stable

  const calcBounds = useCallback(() => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    const cW = img.clientWidth,
      cH = img.clientHeight;
    if (!cW || !cH) return;
    const nA = img.naturalWidth / img.naturalHeight;
    const cA = cW / cH;
    let w: number, h: number, x: number, y: number;
    if (nA > cA) {
      w = cW;
      h = cW / nA;
      x = 0;
      y = (cH - h) / 2;
    } else {
      h = cH;
      w = cH * nA;
      x = (cW - w) / 2;
      y = 0;
    }
    bRef.current = { x, y, w, h };
    paint();
  }, [paint]);

  useEffect(() => {
    if (!dragging.current) {
      cRef.current = extCrop;
      paint();
    }
  }, [extCrop, paint]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    el.style.opacity = show ? "1" : "0";
    el.style.pointerEvents = show ? "auto" : "none";
  }, [show]);

  useEffect(() => {
    calcBounds();
    const ro = new ResizeObserver(calcBounds);
    if (rootRef.current) ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, [calcBounds, loaded]);

  useEffect(() => {
    setLoaded(false);
  }, [imageSrc]);

  const onLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    onNaturalDims?.(img.naturalWidth, img.naturalHeight);
    setLoaded(true);
  }, [onNaturalDims]);

  const drag = useRef<{
    type: string;
    sx: number;
    sy: number;
    sc: FreeCrop;
    bw: number;
    bh: number;
  } | null>(null);
  const rafId = useRef(0);

  const beginDrag = useCallback(
    (type: string, e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const b = bRef.current;
      if (!b.w) return;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragging.current = true;
      drag.current = {
        type,
        sx: e.clientX,
        sy: e.clientY,
        sc: { ...cRef.current },
        bw: b.w,
        bh: b.h,
      };
      if (gridRef.current) gridRef.current.style.opacity = "1";
    },
    [], // ✅ No deps - uses refs
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const MIN = 3;

    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      if (rafId.current) cancelAnimationFrame(rafId.current);

      rafId.current = requestAnimationFrame(() => {
        const dx = ((e.clientX - d.sx) / d.bw) * 100;
        const dy = ((e.clientY - d.sy) / d.bh) * 100;
        const t = d.type;
        let { x, y, w, h } = d.sc;

        if (t === "move") {
          x = clamp(d.sc.x + dx, 0, 100 - d.sc.w);
          y = clamp(d.sc.y + dy, 0, 100 - d.sc.h);
        } else {
          if (t.includes("e")) w = clamp(d.sc.w + dx, MIN, 100 - d.sc.x);
          if (t.includes("w")) {
            const dd = clamp(dx, -d.sc.x, d.sc.w - MIN);
            x = d.sc.x + dd;
            w = d.sc.w - dd;
          }
          if (t.includes("s")) h = clamp(d.sc.h + dy, MIN, 100 - d.sc.y);
          if (t.includes("n")) {
            const dd = clamp(dy, -d.sc.y, d.sc.h - MIN);
            y = d.sc.y + dd;
            h = d.sc.h - dd;
          }
        }

        cRef.current = { x, y, w, h };
        paint();
      });
    };

    const up = () => {
      if (!dragging.current) return;
      dragging.current = false;
      drag.current = null;
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = 0;
      }
      if (gridRef.current) gridRef.current.style.opacity = "0";
      onChange(cRef.current);
    };

    el.addEventListener("pointermove", move, { passive: true });
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);

    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [paint, onChange]); // ✅ Both are memoized

  return (
    <div
      ref={rootRef}
      className="relative w-full h-full overflow-hidden bg-black select-none"
      style={{ touchAction: "none" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={imageSrc}
        alt=""
        draggable={false}
        onLoad={onLoad}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
      />

      {loaded && (
        <div
          ref={wrapRef}
          className="absolute inset-0"
          style={{
            transition: "opacity .25s cubic-bezier(.4,0,.2,1)",
            willChange: "opacity",
          }}
        >
          <div ref={oT} className="bg-black/60 pointer-events-none" />
          <div ref={oB} className="bg-black/60 pointer-events-none" />
          <div ref={oL} className="bg-black/60 pointer-events-none" />
          <div ref={oR} className="bg-black/60 pointer-events-none" />

          <div
            ref={boxRef}
            className="absolute top-0 left-0"
            style={{
              willChange: "transform,width,height",
              touchAction: "none",
              border: "2px solid rgba(255,255,255,.8)",
              boxShadow: "0 0 0 1px rgba(139,92,246,.5)",
            }}
            onPointerDown={(e) => beginDrag("move", e)}
          >
            <div
              ref={gridRef}
              className="absolute inset-0 pointer-events-none"
              style={{ opacity: 0, transition: "opacity .15s ease" }}
            >
              <div className="absolute top-1/3 inset-x-0 h-px bg-white/25" />
              <div className="absolute top-2/3 inset-x-0 h-px bg-white/25" />
              <div className="absolute left-1/3 inset-y-0 w-px bg-white/25" />
              <div className="absolute left-2/3 inset-y-0 w-px bg-white/25" />
            </div>
            <div className="absolute top-0 left-0 w-5 h-5 border-t-[3px] border-l-[3px] border-white pointer-events-none" />
            <div className="absolute top-0 right-0 w-5 h-5 border-t-[3px] border-r-[3px] border-white pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-5 h-5 border-b-[3px] border-l-[3px] border-white pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-5 h-5 border-b-[3px] border-r-[3px] border-white pointer-events-none" />
          </div>

          {HANDLE_IDS.map((id) => (
            <div
              key={id}
              ref={(el) => {
                hRefs.current[id] = el;
              }}
              className="absolute top-0 left-0 z-10 rounded-full"
              style={{
                width: HS,
                height: HS,
                cursor: HANDLE_META[id].cur,
                touchAction: "none",
                willChange: "transform",
                background: "white",
                border: "2px solid rgb(139,92,246)",
                boxShadow: "0 0 6px rgba(0,0,0,.5)",
              }}
              onPointerDown={(e) => beginDrag(id, e)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════
   ImageEditor
   ════════════════════════════════════════════════════════ */
const ImageEditor = ({ file, onConfirm, onCancel }: ImageEditorProps) => {
  const [imageSrc, setImageSrc] = useState("");
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [croppedPx, setCroppedPx] = useState<Area | null>(null);
  const [aspectIdx, setAspectIdx] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [tab, setTab] = useState<"crop" | "transform">("crop");
  const [mounted, setMounted] = useState(false);
  const [freeCrop, setFreeCrop] = useState<FreeCrop>({
    x: 10,
    y: 10,
    w: 80,
    h: 80,
  });
  const [natDims, setNatDims] = useState({ w: 0, h: 0 });
  const [txSrc, setTxSrc] = useState("");
  const [txing, setTxing] = useState(false);
  const txRef = useRef("");
  const isFree = ASPECT_OPTIONS[aspectIdx].value === "free";

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setImageSrc(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  useEffect(() => {
    lockScroll();
    return () => unlockScroll();
  }, []);

  useEffect(() => {
    if (!imageSrc) return;
    const needF = isFree && (rotation !== 0 || flipH || flipV);
    const needR = !isFree && (flipH || flipV);
    if (!needF && !needR) {
      if (txRef.current) {
        URL.revokeObjectURL(txRef.current);
        txRef.current = "";
      }
      setTxSrc("");
      return;
    }
    let dead = false;
    setTxing(true);
    const r = isFree ? rotation : 0;
    makeTransformed(imageSrc, r, flipH, flipV)
      .then((u) => {
        if (dead) {
          URL.revokeObjectURL(u);
          return;
        }
        if (txRef.current) URL.revokeObjectURL(txRef.current);
        txRef.current = u;
        setTxSrc(u);
        setTxing(false);
      })
      .catch(() => {
        if (!dead) setTxing(false);
      });
    return () => {
      dead = true;
    };
  }, [imageSrc, rotation, flipH, flipV, isFree]);

  useEffect(
    () => () => {
      if (txRef.current) URL.revokeObjectURL(txRef.current);
    },
    [],
  );

  const onCropDone = useCallback((_: Area, px: Area) => setCroppedPx(px), []);

  const freeImg = useMemo(
    () => (isFree ? txSrc || imageSrc : imageSrc),
    [isFree, imageSrc, txSrc],
  );
  const fixedImg = useMemo(() => {
    if (isFree) return imageSrc;
    return flipH || flipV ? txSrc || imageSrc : imageSrc;
  }, [isFree, imageSrc, flipH, flipV, txSrc]);

  const confirm = async () => {
    if (!imageSrc) return;
    setProcessing(true);
    try {
      let blob: Blob;
      if (isFree) {
        blob = await cropFree(imageSrc, freeCrop, rotation, flipH, flipV);
      } else {
        if (!croppedPx) return;
        const s = flipH || flipV ? txSrc || imageSrc : imageSrc;
        blob = await cropFixed(s, croppedPx, rotation, false, false);
      }
      onConfirm(blob, URL.createObjectURL(blob));
    } catch (e) {
      console.error("Crop failed:", e);
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setAspectIdx(0);
    setFreeCrop({ x: 10, y: 10, w: 80, h: 80 });
    setTab("crop");
  };

  const pickAspect = (i: number) => {
    setAspectIdx(i);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setFreeCrop({ x: 10, y: 10, w: 80, h: 80 });
  };

  const aspect =
    typeof ASPECT_OPTIONS[aspectIdx].value === "number"
      ? (ASPECT_OPTIONS[aspectIdx].value as number)
      : undefined;

  const pxInfo =
    isFree && natDims.w > 0
      ? `${Math.round((freeCrop.w / 100) * natDims.w)} × ${Math.round((freeCrop.h / 100) * natDims.h)} px`
      : null;

  const showCropUI = tab === "crop" && !txing;

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-99999 w-screen h-screen bg-black flex flex-col"
    >
      {/* TOP BAR */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-black/90 border-b border-white/10 shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-medium active:scale-95 transition-transform"
        >
          <X className="w-4 h-4" />
          <span className="bangla hidden sm:inline">বাতিল</span>
        </button>

        <div className="flex flex-col items-center">
          <h2 className="text-white font-semibold bangla text-sm flex items-center gap-1.5">
            <Crop className="w-4 h-4 text-violet-400" /> ছবি সম্পাদনা
          </h2>
          {pxInfo && (
            <span className="text-white/35 text-[10px] font-mono">
              {pxInfo}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={confirm}
          disabled={processing || txing || (!isFree && !croppedPx)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold active:scale-95 transition-transform disabled:opacity-40"
        >
          {processing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="w-4 h-4" />
            </motion.div>
          ) : (
            <Check className="w-4 h-4" />
          )}
          <span className="bangla hidden sm:inline">
            {processing ? "প্রসেসিং..." : "নিশ্চিত"}
          </span>
        </button>
      </div>

      {/* CANVAS AREA */}
      <div className="relative flex-1 min-h-0 overflow-hidden bg-black">
        <AnimatePresence>
          {txing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex items-center justify-center bg-black/50"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="w-7 h-7 text-violet-400" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {imageSrc && isFree && (
          <FreeResizeCrop
            imageSrc={freeImg}
            crop={freeCrop}
            onChange={setFreeCrop}
            onNaturalDims={(w, h) => setNatDims({ w, h })}
            show={showCropUI}
          />
        )}

        {imageSrc && !isFree && (
          <div className="w-full h-full relative">
            <Cropper
              key={`${aspect}-${flipH}-${flipV}`}
              image={fixedImg}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropDone}
              cropShape="rect"
              showGrid={showCropUI}
              style={{
                containerStyle: {
                  background: "#000",
                  width: "100%",
                  height: "100%",
                },
                cropAreaStyle: {
                  border: showCropUI
                    ? "2px solid rgba(139,92,246,.8)"
                    : "2px solid transparent",
                  boxShadow: showCropUI
                    ? "0 0 0 9999px rgba(0,0,0,.6)"
                    : "none",
                  transition: "border-color .25s ease, box-shadow .25s ease",
                },
              }}
            />
          </div>
        )}

        {/* Transform preview — plain <img>, blob URL */}
        {imageSrc && isFree && tab === "transform" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt=""
              className="max-w-full max-h-full object-contain"
              style={{
                transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                transition: "transform .3s cubic-bezier(.4,0,.2,1)",
              }}
            />
          </div>
        )}

        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm border border-white/10 text-white/50 text-[11px] bangla z-10">
          {file.name} • {(file.size / 1048576).toFixed(1)} MB
        </div>

        <AnimatePresence>
          <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
            {flipH && (
              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="px-2 py-1 rounded bg-violet-500/20 backdrop-blur-sm border border-violet-500/30 text-violet-300 text-[10px] bangla flex items-center gap-1"
              >
                <FlipHorizontal className="w-3 h-3" /> অনুভূমিক ফ্লিপ
              </motion.div>
            )}
            {flipV && (
              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="px-2 py-1 rounded bg-violet-500/20 backdrop-blur-sm border border-violet-500/30 text-violet-300 text-[10px] bangla flex items-center gap-1"
              >
                <FlipVertical className="w-3 h-3" /> উল্লম্ব ফ্লিপ
              </motion.div>
            )}
            {rotation !== 0 && (
              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="px-2 py-1 rounded bg-violet-500/20 backdrop-blur-sm border border-violet-500/30 text-violet-300 text-[10px] font-mono flex items-center gap-1"
              >
                <RotateCw className="w-3 h-3" /> {rotation}°
              </motion.div>
            )}
          </div>
        </AnimatePresence>
      </div>

      {/* BOTTOM CONTROLS */}
      <div className="bg-black/95 border-t border-white/10 shrink-0">
        <div className="flex justify-center gap-1 px-4 pt-2.5">
          {(["crop", "transform"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all bangla flex items-center gap-1.5 active:scale-95 ${
                tab === t
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25"
                  : "bg-white/8 text-white/50"
              }`}
            >
              {t === "crop" ? (
                <>
                  <Crop className="w-3.5 h-3.5" /> ক্রপ
                </>
              ) : (
                <>
                  <Move className="w-3.5 h-3.5" /> ট্রান্সফর্ম
                </>
              )}
            </button>
          ))}
        </div>

        <div className="p-3.5 pb-4">
          <AnimatePresence mode="wait">
            {tab === "crop" && (
              <motion.div
                key="crop"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-3"
              >
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1.5 bangla">
                    ক্রপ অনুপাত
                  </p>
                  <div className="flex gap-1.5 flex-wrap">
                    {ASPECT_OPTIONS.map((o, i) => (
                      <button
                        key={o.label}
                        type="button"
                        onClick={() => pickAspect(i)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95 bangla flex items-center gap-1 ${
                          aspectIdx === i
                            ? "bg-violet-600 text-white"
                            : "bg-white/8 text-white/50"
                        }`}
                      >
                        {o.value === "free" && (
                          <Maximize2 className="w-3 h-3" />
                        )}
                        {o.bn}
                      </button>
                    ))}
                  </div>
                </div>

                {!isFree && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white/40 text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <ZoomIn className="w-3 h-3" />
                        <span className="bangla">জুম</span>
                      </p>
                      <span className="text-violet-400 text-xs font-mono">
                        {zoom.toFixed(1)}x
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
                        className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center text-white/60 active:scale-90 transition-transform"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={0.05}
                        value={zoom}
                        onChange={(e) => setZoom(+e.target.value)}
                        className="flex-1 h-1 bg-white/15 rounded-full appearance-none cursor-pointer accent-violet-500
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => setZoom((z) => Math.min(5, z + 0.1))}
                        className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center text-white/60 active:scale-90 transition-transform"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {isFree && (
                  <p className="text-white/30 text-[11px] bangla flex items-center gap-1.5">
                    <Maximize2 className="w-3 h-3 text-violet-400 shrink-0" />
                    হ্যান্ডেল টেনে সাইজ করুন · ভেতরে ড্র্যাগ করে সরান
                  </p>
                )}
              </motion.div>
            )}

            {tab === "transform" && (
              <motion.div
                key="transform"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white/40 text-[10px] uppercase tracking-wider flex items-center gap-1">
                      <RotateCw className="w-3 h-3" />
                      <span className="bangla">ঘোরানো</span>
                    </p>
                    <span className="text-violet-400 text-xs font-mono tabular-nums">
                      {rotation}°
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRotation((r) => r - 90)}
                      className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center text-white/60 active:scale-90 transition-transform"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      step={1}
                      value={rotation}
                      onChange={(e) => setRotation(+e.target.value)}
                      className="flex-1 h-1 bg-white/15 rounded-full appearance-none cursor-pointer accent-violet-500
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => setRotation((r) => r + 90)}
                      className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center text-white/60 active:scale-90 transition-transform"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setFlipH((f) => !f)}
                    className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-[11px] font-medium active:scale-95 transition-all bangla ${
                      flipH
                        ? "bg-violet-600 text-white"
                        : "bg-white/8 text-white/50"
                    }`}
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" /> অনুভূমিক
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlipV((f) => !f)}
                    className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-[11px] font-medium active:scale-95 transition-all bangla ${
                      flipV
                        ? "bg-violet-600 text-white"
                        : "bg-white/8 text-white/50"
                    }`}
                  >
                    <FlipVertical className="w-3.5 h-3.5" /> উল্লম্ব
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-[11px] font-medium bg-white/8 text-white/50 hover:bg-rose-500/15 hover:text-rose-400 active:scale-95 transition-all bangla ml-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> রিসেট
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>,
    document.body,
  );
};

export default ImageEditor;
