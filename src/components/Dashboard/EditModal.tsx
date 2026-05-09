// src/components/Dashboard/EditModal.tsx
"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, type Variants } from "motion/react";
import {
  Pencil,
  X,
  Check,
  Loader2,
  FileText,
  Tag,
  AlignLeft,
} from "lucide-react";
import ImagePicker from "./ImagePicker";
import { axiosSecure } from "@/src/hooks/axiosSecure";

interface Topic {
  _id: string;
  title: string;
  img: string;
}

export interface Article {
  _id: string;
  slug: string;
  title: string;
  img: string;
  description: string;
  topic: Topic;
  views: number;
  likesCount: number;
  createdAt: string;
}

interface EditForm {
  title: string;
  description: string;
}

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const sheetVariants: Variants = {
  hidden: { opacity: 0, y: "100%" },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] },
  },
  exit: {
    opacity: 0,
    y: "100%",
    transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] },
  },
};

export default function EditModal({
  article,
  onClose,
}: {
  article: Article;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<EditForm>({
    title: article.title,
    description: article.description,
  });

  const newImgRef = useRef<Blob | null>(null);
  const [hasNewImg, setHasNewImg] = useState(false);

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: (payload: FormData) =>
      axiosSecure.patch(`/api/articles/${article.slug}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      onClose();
    },
  });

  const handleSubmit = () => {
    const fd = new FormData();
    let changed = false;

    if (form.title.trim() !== article.title) {
      fd.append("title", form.title.trim());
      changed = true;
    }

    if (form.description.trim() !== article.description) {
      fd.append("description", form.description.trim());
      changed = true;
    }

    if (newImgRef.current) {
      fd.append(
        "img",
        newImgRef.current,
        `article-${article.slug}-${Date.now()}.webp`,
      );
      changed = true;
    }

    if (!changed) return onClose();

    mutate(fd);
  };

  const onBlobReady = useCallback((blob: Blob) => {
    newImgRef.current = blob;
    setHasNewImg(true);
  }, []);

  const textFields: {
    key: keyof EditForm;
    label: string;
    icon: React.ReactNode;
    multiline?: boolean;
  }[] = [
    { key: "title", label: "শিরোনাম", icon: <FileText size={15} /> },
    {
      key: "description",
      label: "বিবরণ",
      icon: <AlignLeft size={15} />,
      multiline: true,
    },
  ];

  return (
    <motion.div
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        variants={sheetVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="absolute inset-0 flex flex-col bg-(--color-bg) overflow-hidden"
      >
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-(--color-active-border)">
          <div className="flex items-center gap-2">
            <Pencil size={16} className="text-amber-500" />
            <span className="font-semibold text-sm tracking-wide text-(--color-text)">
              আর্টিকেল এডিট
            </span>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="text-(--color-gray) hover:text-(--color-text) transition-colors rounded-lg p-1.5 hover:bg-(--color-active-bg) disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <div className="flex items-center gap-2">
            <Tag size={13} className="text-(--color-gray)" />
            <span className="text-xs text-(--color-gray)">টপিক:</span>
            <span className="text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-medium">
              {article.topic?.title ?? "—"}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-(--color-gray)">
              <span className="opacity-60">
                <FileText size={15} />
              </span>
              ছবি
              {hasNewImg && (
                <span className="ml-1 text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                  পরিবর্তিত
                </span>
              )}
            </label>

            <ImagePicker
              currentImgUrl={article.img}
              onBlobReady={(blob) => onBlobReady(blob)}
            />
          </div>

          {textFields.map(({ key, label, icon, multiline }) => (
            <div key={key} className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-(--color-gray)">
                <span className="opacity-60">{icon}</span>
                {label}
              </label>

              {multiline ? (
                <textarea
                  value={form[key]}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [key]: e.target.value }))
                  }
                  rows={6}
                  className="w-full bg-(--color-active-bg) border border-(--color-active-border) focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 rounded-xl px-3.5 py-3 text-sm text-(--color-text) outline-none resize-none transition-all"
                />
              ) : (
                <input
                  type="text"
                  value={form[key]}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [key]: e.target.value }))
                  }
                  className="w-full bg-(--color-active-bg) border border-(--color-active-border) focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 rounded-xl px-3.5 py-3 text-sm text-(--color-text) outline-none transition-all"
                />
              )}
            </div>
          ))}

          {isError && (
            <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5">
              {(error as Error)?.message ?? "কিছু একটা ভুল হয়েছে"}
            </p>
          )}
        </div>

        <div className="shrink-0 flex gap-3 px-5 py-4 border-t border-(--color-active-border) bg-(--color-bg)">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 py-3 text-sm rounded-xl border border-(--color-active-border) text-(--color-gray) hover:text-(--color-text) hover:bg-(--color-active-bg) transition-all disabled:opacity-50"
          >
            বাতিল
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            {isPending ? "সেভ হচ্ছে..." : "সেভ করো"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
