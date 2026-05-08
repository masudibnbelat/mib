"use client";

import Image from "next/image";
import {
  memo,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type MouseEvent,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";

interface Props {
  images: string[];
  title: string;
  height?: string;
  showCount?: boolean;

  // performance controls
  interactive?: boolean; // modal এ true, card এ false
  enableKeyboard?: boolean; // modal এ true
  animated?: boolean; // modal এ true
  priority?: boolean; // important image হলে true
  imageWidth?: number; // cloudinary transform width
  sizes?: string;
}

function optimizeCloudinaryUrl(url: string, width: number) {
  if (!url) return url;

  // cloudinary না হলে original URL return
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }

  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width},c_limit/`);
}

const Fallback = ({ height }: { height: string }) => (
  <div
    className={`w-full ${height} flex items-center justify-center bg-(--color-active-bg) rounded-xl`}
  >
    <ImageOff className="w-8 h-8 text-(--color-gray)" />
  </div>
);

const ImageCarouselComponent = ({
  images,
  title,
  height = "h-48",
  showCount = false,
  interactive = false,
  enableKeyboard = false,
  animated = false,
  priority = false,
  imageWidth = 900,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
}: Props) => {
  const [idx, setIdx] = useState(0);
  const [hasError, setHasError] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const total = images?.length ?? 0;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIdx(0);
    setHasError(false);
  }, [images]);

  const prev = useCallback(
    (e?: MouseEvent<HTMLButtonElement>) => {
      e?.stopPropagation();
      if (total <= 1) return;
      setIdx((i) => (i - 1 + total) % total);
    },
    [total],
  );

  const next = useCallback(
    (e?: MouseEvent<HTMLButtonElement>) => {
      e?.stopPropagation();
      if (total <= 1) return;
      setIdx((i) => (i + 1) % total);
    },
    [total],
  );

  // keyboard only when explicitly enabled (modal)
  useEffect(() => {
    if (!enableKeyboard || total <= 1) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [enableKeyboard, total, prev, next]);

  const currentSrc = useMemo(() => {
    if (!images?.length) return "";
    return optimizeCloudinaryUrl(images[idx], imageWidth);
  }, [images, idx, imageWidth]);

  // preload next image only in interactive mode
  useEffect(() => {
    if (!interactive || total <= 1) return;

    const nextIndex = (idx + 1) % total;
    const src = optimizeCloudinaryUrl(images[nextIndex], imageWidth);

    const img = new window.Image();
    img.src = src;
  }, [interactive, total, idx, images, imageWidth]);

  if (!images?.length) {
    return <Fallback height={height} />;
  }

  return (
    <div
      className={`relative w-full ${height} rounded overflow-hidden ${
        interactive ? "group" : ""
      }`}
      onTouchStart={
        interactive
          ? (e) => {
              touchStartX.current = e.touches[0].clientX;
            }
          : undefined
      }
      onTouchEnd={
        interactive
          ? (e) => {
              if (touchStartX.current === null) return;
              const diff = touchStartX.current - e.changedTouches[0].clientX;
              // eslint-disable-next-line @typescript-eslint/no-unused-expressions
              if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
              touchStartX.current = null;
            }
          : undefined
      }
    >
      {hasError ? (
        <div className="absolute inset-0">
          <Fallback height="h-full" />
        </div>
      ) : animated ? (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentSrc || idx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0"
          >
            <Image
              src={currentSrc}
              alt={`${title} স্ক্রিনশট ${idx + 1}`}
              fill
              priority={priority}
              sizes={sizes}
              className="object-cover"
              onError={() => setHasError(true)}
            />
          </motion.div>
        </AnimatePresence>
      ) : (
        <Image
          src={currentSrc}
          alt={`${title} স্ক্রিনশট ${idx + 1}`}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover"
          onError={() => setHasError(true)}
        />
      )}

      {interactive && total > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="আগের ছবি"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full
              bg-black/60 backdrop-blur-sm text-white flex items-center justify-center
              opacity-0 group-hover:opacity-100 transition-opacity active:scale-90
              focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={next}
            aria-label="পরের ছবি"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full
              bg-black/60 backdrop-blur-sm text-white flex items-center justify-center
              opacity-0 group-hover:opacity-100 transition-opacity active:scale-90
              focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((url, i) => (
              <button
                key={`${url}-${i}`}
                type="button"
                aria-label={`ছবি ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIdx(i);
                }}
                className={`rounded-full transition-all duration-200 ${
                  i === idx ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>

          {showCount && (
            <div
              className="absolute top-2 right-2 px-2 py-0.5 rounded-full
                bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium"
            >
              {idx + 1} / {total}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const ImageCarousel = memo(ImageCarouselComponent);
export default ImageCarousel;
