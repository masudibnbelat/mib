// src/components/ManageArticle/DeleteConfirm.tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, type Variants } from "motion/react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { axiosSecure } from "@/src/hooks/axiosSecure";
import type { Article } from "./EditModal";

// ─── Animation Variants ───────────────────────────────────────────────────────
const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const confirmVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: { opacity: 0, scale: 0.92, y: 16, transition: { duration: 0.18 } },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function DeleteConfirm({
  article,
  onClose,
}: {
  article: Article;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => axiosSecure.delete(`/api/articles/${article.slug}`),
    onSuccess: () => {
      queryClient.setQueryData<Article[]>(["articles"], (old) =>
        old ? old.filter((a) => a._id !== article._id) : [],
      );
      onClose();
    },
  });

  return (
    <motion.div
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        variants={confirmVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-sm bg-(--color-bg) border border-(--color-active-border) rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
            <AlertTriangle size={22} className="text-red-500" />
          </div>
          <h3 className="text-(--color-text) font-semibold text-base mb-1.5">
            ডিলিট করবে?
          </h3>
          <p className="text-(--color-gray) text-sm leading-relaxed">
            <span className="text-(--color-active-text) font-medium">
              &ldquo;{article.title.slice(0, 48)}
              {article.title.length > 48 ? "…" : ""}&rdquo;
            </span>{" "}
            স্থায়ীভাবে মুছে যাবে।
          </p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 py-2.5 text-sm rounded-xl border border-(--color-active-border) text-(--color-gray) hover:text-(--color-text) hover:bg-(--color-active-bg) transition-all"
          >
            না, থাক
          </button>
          <button
            onClick={() => mutate()}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-all disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            {isPending ? "মুছছে..." : "হ্যাঁ, মুছো"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
