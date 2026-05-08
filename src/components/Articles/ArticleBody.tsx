// src/components/Articles/ArticleBody.tsx

import { connectDB } from "@/src/lib/db";
import { Article } from "@/src/models/Article";
import { unstable_cache } from "next/cache";
import ArticleCard from "./ArticleCard";
import { BookOpen } from "lucide-react";
import { ArticleData } from "@/src/types/article";

const getCachedArticles = unstable_cache(
  async (): Promise<ArticleData[]> => {
    await connectDB();
    const articles = await Article.find()
      .populate("topic", "title img")
      .sort({ createdAt: -1 })
      .lean<ArticleData[]>();

    // lean object serializable করা
    return JSON.parse(JSON.stringify(articles));
  },
  ["articles-list"],
  { revalidate: 60, tags: ["articles"] },
);

export default async function ArticleBody() {
  const articles = await getCachedArticles();

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
          <ArticleCard key={article._id} article={article} />
        ))}
      </div>
    </div>
  );
}
