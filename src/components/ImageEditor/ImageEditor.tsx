/* eslint-disable react-hooks/set-state-in-effect */
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
  { label: "Free", value: "free" as const },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
  { label: "3:2", value: 3 / 2 },
  { label: "2:3", value: 2 / 3 },
] as const;

/* ── canvas helpers ── */
const loadImg = (url: string): Promise<HTMLImageElement> =>
  new Promise((res, rej) => {
    const i = new window.Image();
    i.crossOrigin = "anonymous"; // BUG FIX: needed for canvas taint safety
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = url;
  });

const rad = (d: number) => (d * Math.PI) / 180;
const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

/* BUG FIX: wrapAngle so rotation stays within -180..180 */
const wrapAngle = (a: number): number => {
  let r = a % 360;
  if (r > 180) r -= 360;
  if (r < -180) r += 360;
  return r;
};

/* 
  BUG FIX: cropFixed now correctly accepts flipH/flipV and uses them.
  Previously the caller always passed false,false — flips were silently dropped.
*/
async function cropFixed(
  src: string,
  area: Area,
  rot: number,
  fh: boolean,
  fv: boolean,
): Promise<Blob> {
  const img = await loadImg(src);
  const r = rad(rot),
    s = Math.abs(Math.sin(r)),
    c = Math.abs(Math.cos(r));
  const bw = img.width * c + img.height * s,
    bh = img.width * s + img.height * c;
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
    out.toBlob(
      (b) => (b ? res(b) : rej(new Error("toBlob failed"))),
      "image/webp",
      0.88,
    ),
  );
}

/*
  BUG FIX: cropFree now applies transforms correctly.
  Old version cropped from pre-flip coords but drew a flipped image — 
  result was cropping the wrong region.
  Fix: crop from original coords first, THEN apply rotation+flip on the cropped tile.
*/
async function cropFree(
  src: string,
  crop: FreeCrop,
  rot: number,
  fh: boolean,
  fv: boolean,
): Promise<Blob> {
  const img = await loadImg(src);
  // Step 1 — crop tile from original, unflipped, unrotated image
  const px = Math.round((crop.x / 100) * img.naturalWidth);
  const py = Math.round((crop.y / 100) * img.naturalHeight);
  const pw = Math.max(1, Math.round((crop.w / 100) * img.naturalWidth));
  const ph = Math.max(1, Math.round((crop.h / 100) * img.naturalHeight));
  const cv1 = document.createElement("canvas");
  cv1.width = pw;
  cv1.height = ph;
  cv1.getContext("2d")!.drawImage(img, px, py, pw, ph, 0, 0, pw, ph);

  // Step 2 — if no transform needed, return early
  if (rot === 0 && !fh && !fv) {
    return new Promise((res, rej) =>
      cv1.toBlob(
        (b) => (b ? res(b) : rej(new Error("toBlob failed"))),
        "image/webp",
        0.88,
      ),
    );
  }

  // Step 3 — apply rotation + flip to the cropped tile
  const r = rad(rot),
    s = Math.abs(Math.sin(r)),
    c = Math.abs(Math.cos(r));
  const bW = Math.round(pw * c + ph * s),
    bH = Math.round(pw * s + ph * c);
  const cv2 = document.createElement("canvas");
  cv2.width = bW;
  cv2.height = bH;
  const ctx = cv2.getContext("2d")!;
  ctx.translate(bW / 2, bH / 2);
  ctx.rotate(r);
  ctx.scale(fh ? -1 : 1, fv ? -1 : 1);
  ctx.drawImage(cv1, -pw / 2, -ph / 2);
  return new Promise((res, rej) =>
    cv2.toBlob(
      (b) => (b ? res(b) : rej(new Error("toBlob failed"))),
      "image/webp",
      0.88,
    ),
  );
}

async function makeTransformed(
  src: string,
  rot: number,
  fh: boolean,
  fv: boolean,
): Promise<string> {
  const img = await loadImg(src);
  const r = rad(rot),
    s = Math.abs(Math.sin(r)),
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
      (b) =>
        b ? res(URL.createObjectURL(b)) : rej(new Error("toBlob failed")),
      "image/webp",
      0.92,
    ),
  );
}

/* ══════════════════════════════════════════════════════════
   FreeResizeCrop
   ══════════════════════════════════════════════════════════ */
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
  const oT = useRef<HTMLDivElement>(null),
    oB = useRef<HTMLDivElement>(null);
  const oL = useRef<HTMLDivElement>(null),
    oR = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const hRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const paint = useCallback(() => {
    const b = bRef.current,
      c = cRef.current;
    // BUG FIX: guard both w and h so paint never runs with zero bounds
    if (!b.w || !b.h) return;
    const ax = b.x + (c.x / 100) * b.w,
      ay = b.y + (c.y / 100) * b.h;
    const aw = (c.w / 100) * b.w,
      ah = (c.h / 100) * b.h;
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
  }, []);

  const calcBounds = useCallback(() => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    const cW = img.clientWidth,
      cH = img.clientHeight;
    if (!cW || !cH) return;
    const nA = img.naturalWidth / img.naturalHeight,
      cA = cW / cH;
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
    // BUG FIX: sync cRef from extCrop after bounds recalc so paint uses fresh crop
    cRef.current = extCrop;
    paint();
  }, [paint, extCrop]);

  useEffect(() => {
    // BUG FIX: always sync cRef when extCrop changes (not only while not dragging)
    // dragging uses its own sc snapshot so this is safe
    cRef.current = extCrop;
    paint();
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

  // BUG FIX: reset loaded state when imageSrc changes so old image
  // dimensions don't bleed into the new image's bounds calculation
  useEffect(() => {
    setLoaded(false);
    bRef.current = { x: 0, y: 0, w: 0, h: 0 };
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

  const beginDrag = useCallback((type: string, e: React.PointerEvent) => {
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
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const MIN = 3;
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const dx = ((e.clientX - d.sx) / d.bw) * 100,
          dy = ((e.clientY - d.sy) / d.bh) * 100,
          t = d.type;
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
  }, [paint, onChange]);

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
          style={{ transition: "opacity .18s ease", willChange: "opacity" }}
        >
          <div ref={oT} className="bg-black/55 pointer-events-none" />
          <div ref={oB} className="bg-black/55 pointer-events-none" />
          <div ref={oL} className="bg-black/55 pointer-events-none" />
          <div ref={oR} className="bg-black/55 pointer-events-none" />
          <div
            ref={boxRef}
            className="absolute top-0 left-0"
            style={{
              willChange: "transform,width,height",
              touchAction: "none",
              border: "1.5px solid rgba(255,255,255,.7)",
              boxShadow: "0 0 0 1px rgba(124,58,237,.5)",
            }}
            onPointerDown={(e) => beginDrag("move", e)}
          >
            <div
              ref={gridRef}
              className="absolute inset-0 pointer-events-none"
              style={{ opacity: 0, transition: "opacity .12s ease" }}
            >
              <div className="absolute top-1/3 inset-x-0 h-px bg-white/15" />
              <div className="absolute top-2/3 inset-x-0 h-px bg-white/15" />
              <div className="absolute left-1/3 inset-y-0 w-px bg-white/15" />
              <div className="absolute left-2/3 inset-y-0 w-px bg-white/15" />
            </div>
            <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-white pointer-events-none" />
            <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-white pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-white pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-white pointer-events-none" />
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
                background: "#fff",
                border: "2px solid rgb(124,58,237)",
                boxShadow: "0 1px 8px rgba(0,0,0,.6)",
              }}
              onPointerDown={(e) => beginDrag(id, e)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Reusable sub-components ── */
const Slider = ({
  min,
  max,
  step = 1,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
}) => (
  <input
    type="range"
    min={min}
    max={max}
    step={step}
    value={value}
    onChange={(e) => onChange(+e.target.value)}
    className="flex-1 h-0.75 rounded-full appearance-none cursor-pointer bg-white/10 accent-violet-500
      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer
      [&::-webkit-slider-thumb]:shadow-[0_0_0_2.5px_rgb(124,58,237),0_2px_8px_rgba(0,0,0,.5)]"
  />
);

const IconBtn = ({
  onClick,
  children,
  title,
}: {
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className="w-8 h-8 rounded-lg flex items-center justify-center
      bg-white/5 border border-white/8 text-white/45
      hover:text-white/80 hover:bg-white/9 active:scale-90 transition-all duration-100"
  >
    {children}
  </button>
);

/* ══════════════════════════════════════════════════════════
   ImageEditor
   ══════════════════════════════════════════════════════════ */
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

  // BUG FIX: track confirm-blob URL so we can revoke it if component unmounts
  // before the parent does — prevents memory leak
  const confirmBlobRef = useRef("");

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

  // BUG FIX: cleanup confirm blob on unmount
  useEffect(() => {
    return () => {
      if (confirmBlobRef.current) URL.revokeObjectURL(confirmBlobRef.current);
    };
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
    makeTransformed(imageSrc, isFree ? rotation : 0, flipH, flipV)
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

  /*
    BUG FIX: fixedImg should use txSrc when transforms are active.
    Old code: `flipH || flipV ? txSrc || imageSrc : imageSrc`
    — but txSrc could be stale ("") while txing is true, causing a flash
    of the untransformed image. We now wait until txSrc is populated.
  */
  const fixedImg = useMemo(() => {
    if (isFree) return imageSrc;
    if ((flipH || flipV) && txSrc) return txSrc;
    return imageSrc;
  }, [isFree, imageSrc, flipH, flipV, txSrc]);

  // BUG FIX: canConfirm must also gate on !txing for free mode
  const showCropUI = tab === "crop" && !txing;
  const canConfirm = !processing && !txing && (isFree || !!croppedPx);

  const pxW =
    isFree && natDims.w > 0 ? Math.round((freeCrop.w / 100) * natDims.w) : 0;
  const pxH =
    isFree && natDims.h > 0 ? Math.round((freeCrop.h / 100) * natDims.h) : 0;

  const confirm = async () => {
    if (!imageSrc || !canConfirm) return; // BUG FIX: double-guard
    setProcessing(true);
    try {
      let blob: Blob;
      if (isFree) {
        blob = await cropFree(imageSrc, freeCrop, rotation, flipH, flipV);
      } else {
        if (!croppedPx) return;
        /*
          BUG FIX: pass actual flipH/flipV and use the ORIGINAL imageSrc.
          cropFixed now handles flips internally, so we don't need txSrc here.
          Using txSrc caused double-flip (once in makeTransformed, once in cropFixed).
        */
        blob = await cropFixed(imageSrc, croppedPx, rotation, flipH, flipV);
      }
      const previewUrl = URL.createObjectURL(blob);
      // Track so we can revoke if unmounted before parent uses it
      confirmBlobRef.current = previewUrl;
      onConfirm(blob, previewUrl);
    } catch (e) {
      console.error(e);
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
    setCroppedPx(null); // BUG FIX: clear stale croppedPx on reset
    setTab("crop");
  };

  const pickAspect = (i: number) => {
    setAspectIdx(i);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setFreeCrop({ x: 10, y: 10, w: 80, h: 80 });
    setCroppedPx(null); // BUG FIX: clear stale croppedPx when aspect changes
  };

  const aspect =
    typeof ASPECT_OPTIONS[aspectIdx].value === "number"
      ? (ASPECT_OPTIONS[aspectIdx].value as number)
      : undefined;

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-99999 w-screen h-dvh bg-[#0c0c0e] flex flex-col overflow-hidden"
    >
      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#111116] border-b border-white/6 shrink-0">
        <div className="flex items-center gap-0.5 p-0.75 bg-white/4 rounded-[14px] border border-white/6">
          {(["crop", "transform"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="relative px-3 py-1.25 rounded-xl text-[11px] font-semibold tracking-wide flex items-center gap-1.5 transition-colors"
            >
              {tab === t && (
                <motion.div
                  layoutId="tab-bg"
                  className="absolute inset-0 rounded-xl bg-violet-600"
                  style={{ boxShadow: "0 2px 14px rgba(124,58,237,.4)" }}
                  transition={{ type: "spring", stiffness: 440, damping: 34 }}
                />
              )}
              <span
                className="relative z-10 flex items-center gap-1.5"
                style={{ color: tab === t ? "#fff" : "rgba(255,255,255,.3)" }}
              >
                {t === "crop" ? (
                  <>
                    <Crop className="w-3 h-3" />
                    Crop
                  </>
                ) : (
                  <>
                    <Move className="w-3 h-3" />
                    Transform
                  </>
                )}
              </span>
            </button>
          ))}
        </div>

        <div className="text-right leading-none">
          <p className="text-white/28 text-[10px] font-mono truncate max-w-30">
            {file.name}
          </p>
          <p className="text-white/16 text-[9px] mt-0.5">
            {(file.size / 1048576).toFixed(1)} MB · WebP
          </p>
        </div>
      </div>

      {/* ── CANVAS ──────────────────────────────────────────── */}
      <div className="relative flex-1 min-h-0 overflow-hidden bg-black">
        <AnimatePresence>
          {txing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="w-5 h-5 text-violet-400" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ratio pills */}
        <AnimatePresence>
          {tab === "crop" && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 360, damping: 26 }}
              className="absolute top-3 left-1/2 -translate-x-1/2 z-20
                flex gap-0.5 p-1 rounded-2xl
                bg-black/80 backdrop-blur-2xl border border-white/9
                shadow-[0_8px_40px_rgba(0,0,0,.7)]"
            >
              {ASPECT_OPTIONS.map((o, i) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => pickAspect(i)}
                  className="relative px-2.5 py-1.5 rounded-[10px] text-[11px] font-semibold flex items-center gap-1 transition-colors"
                >
                  {aspectIdx === i && (
                    <motion.div
                      layoutId="ratio-bg"
                      className="absolute inset-0 rounded-[10px] bg-violet-600"
                      style={{ boxShadow: "0 2px 12px rgba(124,58,237,.45)" }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 32,
                      }}
                    />
                  )}
                  <span
                    className="relative z-10 flex items-center gap-1"
                    style={{
                      color: aspectIdx === i ? "#fff" : "rgba(255,255,255,.35)",
                    }}
                  >
                    {o.value === "free" && <Maximize2 className="w-3 h-3" />}
                    {o.label}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Px info badge */}
        <AnimatePresence>
          {isFree && pxW > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20
                px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md border border-white/8"
            >
              <span className="text-white/45 text-[10px] font-mono tabular-nums tracking-wider">
                {pxW} × {pxH} px
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transform badges */}
        <div className="absolute top-3 right-2.5 z-20 flex flex-col gap-1">
          <AnimatePresence>
            {flipH && (
              <motion.div
                key="fh"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="px-1.5 py-0.5 rounded-md bg-violet-500/12 border border-violet-500/20 text-violet-400 text-[9px] font-bold flex items-center gap-1"
              >
                <FlipHorizontal className="w-2.5 h-2.5" /> H
              </motion.div>
            )}
            {flipV && (
              <motion.div
                key="fv"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="px-1.5 py-0.5 rounded-md bg-violet-500/12 border border-violet-500/20 text-violet-400 text-[9px] font-bold flex items-center gap-1"
              >
                <FlipVertical className="w-2.5 h-2.5" /> V
              </motion.div>
            )}
            {rotation !== 0 && (
              <motion.div
                key="rot"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="px-1.5 py-0.5 rounded-md bg-violet-500/12 border border-violet-500/20 text-violet-400 text-[9px] font-mono tabular-nums"
              >
                {rotation}°
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Canvas content */}
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
          <div className="w-full h-full">
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
                    ? "1.5px solid rgba(124,58,237,.75)"
                    : "1.5px solid transparent",
                  boxShadow: showCropUI
                    ? "0 0 0 9999px rgba(0,0,0,.62)"
                    : "none",
                  transition: "border-color .2s,box-shadow .2s",
                },
              }}
            />
          </div>
        )}
        {imageSrc && isFree && tab === "transform" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt=""
              className="max-w-full max-h-full object-contain"
              style={{
                transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                transition: "transform .22s cubic-bezier(.4,0,.2,1)",
              }}
            />
          </div>
        )}
      </div>

      {/* ── BOTTOM PANEL ────────────────────────────────────── */}
      <div className="bg-[#111116] border-t border-white/6 shrink-0">
        <div className="px-3.5 pt-3 pb-2">
          <AnimatePresence mode="wait">
            {tab === "crop" && !isFree && (
              <motion.div
                key="zoom"
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.11 }}
                className="flex items-center gap-2"
              >
                <span className="text-white/25 text-[10px] font-semibold uppercase tracking-widest w-8 shrink-0">
                  Zoom
                </span>
                <IconBtn
                  onClick={() =>
                    setZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))
                  }
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </IconBtn>
                <Slider
                  min={1}
                  max={5}
                  step={0.05}
                  value={zoom}
                  onChange={setZoom}
                />
                <IconBtn
                  onClick={() =>
                    setZoom((z) => Math.min(5, +(z + 0.1).toFixed(2)))
                  }
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </IconBtn>
                <span className="text-violet-400 text-[10px] font-mono tabular-nums w-8 text-right">
                  {zoom.toFixed(1)}×
                </span>
              </motion.div>
            )}

            {tab === "crop" && isFree && (
              <motion.div
                key="free-hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.11 }}
                className="flex items-center gap-2 py-0.5"
              >
                <Maximize2 className="w-3 h-3 text-violet-500/50 shrink-0" />
                <span className="text-white/20 text-[11px]">
                  Drag handles to resize · drag inside to move
                </span>
              </motion.div>
            )}

            {tab === "transform" && (
              <motion.div
                key="transform"
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.11 }}
                className="space-y-2"
              >
                {/* Rotation */}
                <div className="flex items-center gap-2">
                  <span className="text-white/25 text-[10px] font-semibold uppercase tracking-widest w-8 shrink-0">
                    Rot
                  </span>
                  {/* BUG FIX: use wrapAngle so -90 steps stay in -180..180 */}
                  <IconBtn
                    onClick={() => setRotation((r) => wrapAngle(r - 90))}
                    title="-90°"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </IconBtn>
                  <Slider
                    min={-180}
                    max={180}
                    step={1}
                    value={rotation}
                    onChange={setRotation}
                  />
                  <IconBtn
                    onClick={() => setRotation((r) => wrapAngle(r + 90))}
                    title="+90°"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </IconBtn>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min={-180}
                      max={180}
                      value={rotation}
                      onChange={(e) =>
                        setRotation(clamp(+e.target.value, -180, 180))
                      }
                      className="w-11 text-center bg-white/5 border border-white/8 rounded-lg
                        text-violet-400 text-[10px] font-mono tabular-nums py-0.75 outline-none
                        focus:border-violet-600/50 transition-colors
                        [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <span className="text-white/20 text-[9px] ml-0.5">°</span>
                  </div>
                </div>

                {/* Flip + Reset */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFlipH((f) => !f)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.25 rounded-xl text-[11px] font-semibold active:scale-95 transition-all ${
                      flipH
                        ? "bg-violet-600 text-white shadow-[0_2px_12px_rgba(124,58,237,.35)]"
                        : "bg-white/5 border border-white/[.07] text-white/38"
                    }`}
                  >
                    <FlipHorizontal className="w-3 h-3" /> Flip H
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlipV((f) => !f)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.25 rounded-xl text-[11px] font-semibold active:scale-95 transition-all ${
                      flipV
                        ? "bg-violet-600 text-white shadow-[0_2px_12px_rgba(124,58,237,.35)]"
                        : "bg-white/5 border border-white/[.07] text-white/38"
                    }`}
                  >
                    <FlipVertical className="w-3 h-3" /> Flip V
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="ml-auto flex items-center gap-1 px-2.5 py-1.25 rounded-xl text-[11px] font-medium
                      bg-white/4 border border-white/6 text-white/25
                      hover:text-rose-400 hover:border-rose-500/25 hover:bg-rose-500/6 active:scale-95 transition-all"
                  >
                    <RefreshCw className="w-3 h-3" /> Reset
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Cancel / Confirm */}
        <div className="flex gap-2 px-3.5 pt-1 pb-5">
          <motion.button
            type="button"
            onClick={onCancel}
            whileTap={{ scale: 0.97 }}
            className="flex-1 flex items-center justify-center gap-1.5 py-3.25 rounded-2xl
              bg-white/5 border border-white/8 text-white/40
              hover:text-white/65 hover:bg-white/8
              font-semibold text-[13px] tracking-wide transition-all"
          >
            <X className="w-4 h-4" /> Cancel
          </motion.button>

          <motion.button
            type="button"
            onClick={confirm}
            disabled={!canConfirm}
            whileTap={{ scale: canConfirm ? 0.97 : 1 }}
            className="flex-[1.4] flex items-center justify-center gap-1.5 py-3.25 rounded-2xl
              bg-violet-600 hover:bg-violet-500 active:bg-violet-700
              text-white font-bold text-[13px] tracking-wide
              disabled:opacity-25 disabled:cursor-not-allowed
              shadow-[0_4px_24px_rgba(124,58,237,.4)] hover:shadow-[0_4px_28px_rgba(124,58,237,.55)]
              transition-all"
          >
            {processing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="w-4 h-4" />
              </motion.div>
            ) : (
              <Check className="w-4 h-4" />
            )}
            {processing ? "Processing..." : "Confirm"}
          </motion.button>
        </div>
      </div>
    </motion.div>,
    document.body,
  );
};

export default ImageEditor;
