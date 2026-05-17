"use client";

import { useQuery } from "@tanstack/react-query";
import { axiosSecure } from "@/src/hooks/axiosSecure";
import ArticleCard from "./ArticleCard";
import { BookOpen, Loader2, TriangleAlert } from "lucide-react";
import { ArticleData } from "@/src/types/article";

export default function ArticleBody() {
  const {
    data: articles = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const res = await axiosSecure.get<{
        success: boolean;
        data: ArticleData[];
      }>("/api/articles");
      if (!res.data.success) throw new Error("লোড করা যায়নি");
      return res.data.data;
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-(--color-gray)" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <TriangleAlert className="w-10 h-10 text-red-400" />
        <p className="text-sm text-red-400 bangla">আর্টিকেল লোড করা যায়নি</p>
      </div>
    );
  }

  if (!articles.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <BookOpen className="w-10 h-10 text-(--color-gray)" />
        <p className="text-sm text-(--color-gray) bangla">
          এখনো কোনো আর্টিকেল যোগ করা হয়নি
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-violet-500" />
          <h2 className="text-lg font-semibold text-(--color-text) bangla">
            Articles
          </h2>
        </div>
        <span className="text-xs text-(--color-gray) bangla px-2.5 py-1 rounded-full bg-(--color-active-bg) border border-(--color-active-border)">
          মোট {articles.length}টি
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((article) => (
          <ArticleCard
            key={article._id}
            article={article}
            onRefetch={refetch}
          />
        ))}
      </div>
    </div>
  );
}
