// components/Pagination.tsx
"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  showFirstLast?: boolean;
  storageKey: string;
}

function getPageRange(
  current: number,
  total: number,
  sibling: number,
): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const left = Math.max(current - sibling, 2);
  const right = Math.min(current + sibling, total - 1);
  const showLeftDots = left > 2;
  const showRightDots = right < total - 1;

  const pages: (number | "...")[] = [1];
  if (showLeftDots) pages.push("...");
  for (let i = left; i <= right; i++) pages.push(i);
  if (showRightDots) pages.push("...");
  pages.push(total);

  return pages;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  storageKey,
}: PaginationProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
          onPageChange(parsed);
        }
      }
    } catch {
      // localStorage unavailable (SSR / private mode)
    }
  }, [storageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync to localStorage on every page change
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(storageKey, String(currentPage));
    } catch {
      // ignore
    }
  }, [currentPage, storageKey, mounted]);

  // Clamp saved page if totalPages shrinks
  useEffect(() => {
    if (!mounted) return;
    if (currentPage > totalPages && totalPages > 0) {
      onPageChange(totalPages);
    }
  }, [totalPages]); // eslint-disable-line react-hooks/exhaustive-deps

  if (totalPages <= 1) return null;

  const pages = getPageRange(currentPage, totalPages, siblingCount);

  const btnBase =
    "relative flex items-center justify-center rounded text-sm font-medium transition-colors duration-150 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed";

  const navBtn = `${btnBase} w-8 h-8 text-(--color-gray) hover:text-(--color-text) hover:bg-(--color-active-bg) border border-transparent hover:border-(--color-active-border) disabled:hover:bg-transparent disabled:hover:border-transparent`;

  return (
    <div className="flex items-center justify-center gap-1 flex-wrap select-none mt-10 lg:mt-16">
      {/* First */}
      {showFirstLast && (
        <button
          className={navBtn}
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="প্রথম পাতা"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
      )}

      {/* Prev */}
      <button
        className={navBtn}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        title="আগের পাতা"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        <AnimatePresence mode="popLayout">
          {pages.map((page, idx) =>
            page === "..." ? (
              <span
                key={`dots-${idx}`}
                className="w-8 h-8 flex items-center justify-center text-(--color-gray) text-sm"
              >
                ···
              </span>
            ) : (
              <motion.button
                key={page}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  duration: 0.15,
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                }}
                onClick={() => onPageChange(page as number)}
                className={`${btnBase} w-8 h-8 ${
                  currentPage === page
                    ? "bg-(--color-text) text-(--color-bg) border border-(--color-text) shadow-sm shadow-(--color-text/30"
                    : "text-(--color-gray) hover:text-(--color-text) hover:bg-(--color-active-bg) border border-transparent hover:border-(--color-active-border)"
                }`}
              >
                {currentPage === page && (
                  <motion.span
                    layoutId={`active-page-bg-${storageKey}`}
                    className="absolute inset-0 rounded-lg bg-(--color-text) text-(--color-bg)  -z-10"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                {page}
              </motion.button>
            ),
          )}
        </AnimatePresence>
      </div>

      {/* Next */}
      <button
        className={navBtn}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        title="পরের পাতা"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Last */}
      {showFirstLast && (
        <button
          className={navBtn}
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          title="শেষ পাতা"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
