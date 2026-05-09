// src/components/ManageArticle/ManageArticle.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence, type Variants } from "motion/react";
import {
  Pencil,
  Trash2,
  AlertTriangle,
  FileText,
  Tag,
  RefreshCw,
} from "lucide-react";
import { axiosSecure } from "@/src/hooks/axiosSecure";
import EditModal, { Article } from "@/src/components/Dashboard/EditModal";
import DeleteConfirm from "@/src/components/Dashboard/DeleteConfirm";

// ─── Fetcher ──────────────────────────────────────────────────────────────────
const fetchArticles = async (): Promise<Article[]> => {
  const { data } = await axiosSecure.get("/api/articles");
  if (!data.success) throw new Error(data.message);
  return data.data;
};

// ─── Animation Variants ───────────────────────────────────────────────────────
const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: { opacity: 0, x: -36, transition: { duration: 0.22 } },
};

// ─── Article Row ──────────────────────────────────────────────────────────────
function ArticleRow({
  article,
  index,
  onEdit,
  onDelete,
}: {
  article: Article;
  index: number;
  onEdit: (a: Article) => void;
  onDelete: (a: Article) => void;
}) {
  return (
    <motion.div
      variants={itemVariants}
      layout
      className="group flex items-start gap-4 bg-(--color-active-bg) border border-transparent hover:border-(--color-active-border) rounded-2xl px-5 py-4 transition-colors duration-200"
    >
      {/* Index */}
      <span className="mt-0.5 shrink-0 w-7 h-7 rounded-lg border border-(--color-active-border) flex items-center justify-center text-xs font-bold text-(--color-gray)">
        {index + 1}
      </span>

      {/* Thumbnail */}
      <div className="shrink-0 w-16 h-12 rounded-xl overflow-hidden bg-(--color-active-bg) border border-(--color-active-border)">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={article.img}
          alt={article.title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <h3 className="text-sm font-semibold text-(--color-text) leading-snug line-clamp-1">
          {article.title}
        </h3>
        <p className="text-xs text-(--color-gray) line-clamp-1">
          {article.description}
        </p>
        <div className="flex items-center gap-3 pt-0.5 flex-wrap">
          {article.topic && (
            <span className="inline-flex items-center gap-1 text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full">
              <Tag size={10} />
              {article.topic.title}
            </span>
          )}
          <span className="text-xs text-(--color-gray) opacity-60">
            {new Date(article.createdAt).toLocaleDateString("bn-BD")}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="shrink-0 flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150">
        <button
          onClick={() => onEdit(article)}
          className="p-2 rounded-xl bg-(--color-bg) hover:bg-amber-500/10 text-(--color-gray) hover:text-amber-500 border border-(--color-active-border) hover:border-amber-500/30 transition-all"
          title="এডিট"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onDelete(article)}
          className="p-2 rounded-xl bg-(--color-bg) hover:bg-red-500/10 text-(--color-gray) hover:text-red-500 border border-(--color-active-border) hover:border-red-500/30 transition-all"
          title="ডিলিট"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-start gap-4 bg-(--color-active-bg) border border-(--color-active-border) rounded-2xl px-5 py-4 animate-pulse">
      <div className="w-7 h-7 rounded-lg bg-(--color-active-border) shrink-0" />
      <div className="w-16 h-12 rounded-xl bg-(--color-active-border) shrink-0" />
      <div className="flex-1 space-y-2.5 pt-0.5">
        <div className="h-3.5 bg-(--color-active-border) rounded-lg w-3/4" />
        <div className="h-3 bg-(--color-active-border) rounded-lg w-1/2" />
        <div className="h-4 bg-(--color-active-border) rounded-full w-20" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const ManageArticle = () => {
  const [editTarget, setEditTarget] = useState<Article | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);

  const {
    data: articles,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<Article[]>({
    queryKey: ["articles"],
    queryFn: fetchArticles,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="min-h-screen bg-(--color-bg) text-(--color-text)">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold text-(--color-text) tracking-tight">
              আর্টিকেল ম্যানেজ
            </h1>
            <p className="text-sm text-(--color-gray) mt-0.5">
              {isLoading
                ? "লোড হচ্ছে..."
                : articles
                  ? `${articles.length}টি আর্টিকেল`
                  : ""}
            </p>
          </div>

          <button
            onClick={() => void refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl border border-(--color-active-border) text-(--color-gray) hover:text-(--color-text) hover:bg-(--color-active-bg) transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
            রিফ্রেশ
          </button>
        </motion.div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-2.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center gap-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
            <div>
              <p className="text-(--color-text) font-medium">ডেটা লোড হয়নি</p>
              <p className="text-(--color-gray) text-sm mt-1">
                নেটওয়ার্ক সমস্যা অথবা সার্ভার ডাউন
              </p>
            </div>
            <button
              onClick={() => void refetch()}
              className="px-5 py-2 text-sm rounded-xl bg-(--color-active-bg) text-(--color-text) border border-(--color-active-border) hover:bg-(--color-active-border) transition-all"
            >
              আবার চেষ্টা করো
            </button>
          </motion.div>
        )}

        {/* Empty */}
        {!isLoading && !isError && articles?.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center gap-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-(--color-active-bg) border border-(--color-active-border) flex items-center justify-center">
              <FileText size={24} className="text-(--color-gray)" />
            </div>
            <p className="text-(--color-gray) text-sm">কোনো আর্টিকেল নেই</p>
          </motion.div>
        )}

        {/* List */}
        {!isLoading && articles && articles.length > 0 && (
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2.5"
          >
            <AnimatePresence mode="popLayout">
              {articles.map((article, i) => (
                <ArticleRow
                  key={article._id}
                  article={article}
                  index={i}
                  onEdit={setEditTarget}
                  onDelete={setDeleteTarget}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {editTarget && (
          <EditModal
            key={`edit-${editTarget._id}`}
            article={editTarget}
            onClose={() => setEditTarget(null)}
          />
        )}
        {deleteTarget && (
          <DeleteConfirm
            key={`delete-${deleteTarget._id}`}
            article={deleteTarget}
            onClose={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageArticle;
