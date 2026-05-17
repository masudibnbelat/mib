// src/components/Articles/LikeButton.tsx
"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { motion } from "motion/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosSecure } from "@/src/hooks/axiosSecure";

interface Props {
  slug: string;
  initialCount?: number;
  variant?: "icon" | "button";
}

export default function LikeButton({
  slug,
  initialCount = 0,
  variant = "icon",
}: Props) {
  const [count, setCount] = useState(Number(initialCount) || 0);
  const [animKey, setAnimKey] = useState(0);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const res = await axiosSecure.post<{ likesCount: number }>(
        `/api/articles/${encodeURIComponent(slug)}/like`,
      );
      return res.data;
    },
    onMutate: () => {
      setCount((c) => c + 1);
      setAnimKey((k) => k + 1);
    },
    onSuccess: (data) => {
      if (typeof data.likesCount === "number") {
        setCount(data.likesCount);
      }
      // ★ এটাই magic — list page auto update হবে
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: () => {
      setCount((c) => Math.max(0, c - 1));
    },
  });

  const handleClick = () => {
    if (isPending) return;
    mutate();
  };

  if (variant === "button") {
    return (
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={handleClick}
        disabled={isPending}
        className="flex items-center gap-2 px-5 py-2 rounded-full border border-(--color-active-border) text-(--color-gray) hover:border-rose-500/50 hover:text-rose-500 transition-all group"
      >
        <motion.span
          key={animKey}
          initial={{ scale: 1.35 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 14 }}
        >
          <Heart className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </motion.span>
        <span className="text-sm bangla">পছন্দ করুন</span>
        <span className="text-xs opacity-60">{count}</span>
      </motion.button>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-1.5 text-sm text-(--color-gray) hover:text-rose-500 transition-colors"
    >
      <motion.span
        key={animKey}
        initial={{ scale: 1.45 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 14 }}
      >
        <Heart className="w-5 h-5" />
      </motion.span>
      <span>{count}</span>
    </motion.button>
  );
}
