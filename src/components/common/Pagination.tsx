// src/components/common/Pagination.tsx
"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

/* ───────────────────────────────────────────────
   usePagination — generic, reusable, zero-loading
   client-side pagination hook (works on any array)
─────────────────────────────────────────────── */
interface UsePaginationOptions {
  pageSize?: number;
  storageKey?: string;
  scrollToTop?: boolean;
}

export function usePagination<T>(
  items: T[],
  { pageSize = 6, storageKey, scrollToTop = true }: UsePaginationOptions = {},
) {
  const [page, setPage] = useState(1);
  const [mounted, setMounted] = useState(false);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // restore saved page once (client only)
  useEffect(() => {
    setMounted(true);
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(storageKey);
      const parsed = saved ? parseInt(saved, 10) : NaN;
      if (!isNaN(parsed) && parsed >= 1) setPage(parsed);
    } catch {
      // localStorage unavailable (SSR / private mode)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // persist page
  useEffect(() => {
    if (!mounted || !storageKey) return;
    try {
      localStorage.setItem(storageKey, String(page));
    } catch {
      // ignore
    }
  }, [page, storageKey, mounted]);

  // clamp if list shrinks (e.g. filter changes)
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const goToPage = useCallback(
    (target: number) => {
      setPage(Math.min(Math.max(target, 1), totalPages));
      if (scrollToTop) window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [totalPages, scrollToTop],
  );

  // instant slice — no network, no loading state
  const paginated = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  );

  return { page, totalPages, paginated, goToPage };
}

/* ───────────────────────────────────────────────
   Pagination — pure UI, CSS-transition only
─────────────────────────────────────────────── */
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  showFirstLast?: boolean;
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
}: PaginationProps) {
  const pages = useMemo(
    () => getPageRange(currentPage, totalPages, siblingCount),
    [currentPage, totalPages, siblingCount],
  );

  if (totalPages <= 1) return null;

  const btnBase =
    "relative flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-150 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed";

  const navBtn = `${btnBase} w-8 h-8 text-(--color-gray) hover:text-(--color-text) hover:bg-(--color-active-bg) border border-transparent hover:border-(--color-active-border) disabled:hover:bg-transparent disabled:hover:border-transparent`;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 flex-wrap select-none mt-10 lg:mt-16"
    >
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

      <button
        className={navBtn}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        title="আগের পাতা"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-1">
        {pages.map((p, idx) =>
          p === "..." ? (
            <span
              key={`dots-${idx}`}
              className="w-8 h-8 flex items-center justify-center text-(--color-gray) text-sm"
            >
              ···
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              aria-current={currentPage === p ? "page" : undefined}
              className={`${btnBase} w-8 h-8 ${
                currentPage === p
                  ? "bg-violet-600 text-white border border-violet-600 shadow-sm shadow-violet-600/30 scale-105"
                  : "text-(--color-gray) hover:text-(--color-text) hover:bg-(--color-active-bg) border border-transparent hover:border-(--color-active-border)"
              }`}
            >
              {p}
            </button>
          ),
        )}
      </div>

      <button
        className={navBtn}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        title="পরের পাতা"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

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
    </nav>
  );
}
