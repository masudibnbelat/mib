// src/components/Articles/BackButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-2 text-sm font-medium
      text-(--color-text) bg-(--color-bg)/50 py-1 px-2.5 rounded-2xl transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      back to articles
    </button>
  );
}
