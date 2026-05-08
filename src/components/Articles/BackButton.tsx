// src/components/Articles/BackButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-1.5 text-sm font-medium
      text-(--color-text) hover:text-violet-500 bangla transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      back to articles
    </button>
  );
}
