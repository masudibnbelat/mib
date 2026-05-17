// src/components/Articles/ShareButton.tsx
"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "motion/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosSecure } from "@/src/hooks/axiosSecure";

interface Props {
  slug: string;
  title: string;
  initialCount?: number;
  variant?: "icon" | "button";
}

export default function ShareButton({
  slug,
  title,
  initialCount = 0,
  variant = "icon",
}: Props) {
  const [count, setCount] = useState(Number(initialCount) || 0);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const res = await axiosSecure.post<{ shares: number }>(
        `/api/articles/${encodeURIComponent(slug)}/share`,
      );
      return res.data;
    },
    onSuccess: (data) => {
      if (typeof data.shares === "number") {
        setCount(data.shares);
      }
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
  });

  const share = async () => {
    if (isPending) return;
    const url = `${window.location.origin}/articles/${slug}`;

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("লিংক কপি হয়েছে!");
      }
      setCount((c) => c + 1);
      mutate();
    } catch {
      //
    }
  };

  if (variant === "button") {
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={share}
        disabled={isPending}
        className="flex items-center gap-2 px-5 py-2 rounded-full border border-(--color-active-border) hover:border-violet-500/50 hover:text-violet-500 text-sm text-(--color-gray) transition-all group"
      >
        <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        <span className="bangla">শেয়ার করুন</span>
        <span className="text-xs opacity-60">{count}</span>
      </motion.button>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={share}
      disabled={isPending}
      className="flex items-center gap-1.5 text-sm text-(--color-gray) hover:text-violet-500 transition-colors"
    >
      <Send className="w-5 h-5" />
      <span>{count}</span>
    </motion.button>
  );
}
