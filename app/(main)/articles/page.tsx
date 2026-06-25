// app/articles/page.tsx
import { unstable_cache } from "next/cache";
import { connectDB } from "@/src/lib/db";
import { Article } from "@/src/models/Article";
import { Topic } from "@/src/models/Topic";
import ArticleSliderClient from "@/src/components/Articles/ArticleSliderClient";
import ArticlesFilterClient from "@/src/components/Articles/ArticlesFilterClient";
import type { TopicData, TopicLean } from "@/src/types/Topic";
import type { ArticleData, ArticleLean } from "@/src/types/article";
import { Inbox } from "lucide-react";

export const revalidate = 300;

const getTopics = unstable_cache(
  async (): Promise<TopicData[]> => {
    await connectDB();

    const raw = await Topic.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .select("_id title img")
      .lean<TopicLean[]>();

    return raw.map((t) => ({
      _id: String(t._id),
      title: t.title ?? "",
      img: t.img ?? "",
    }));
  },
  ["articles-topics"],
  {
    revalidate: 300,
    tags: ["topics"],
  },
);

const getArticles = unstable_cache(
  async (): Promise<ArticleData[]> => {
    await connectDB();

    const raw = await Article.find()
      .sort({ createdAt: -1 })
      .select(
        "_id title slug img description createdAt views likesCount shares topic",
      )
      .populate("topic", "_id title img")
      .lean<ArticleLean[]>();

    return raw.map((a) => {
      const topic =
        typeof a.topic === "object" && a.topic !== null && "title" in a.topic
          ? a.topic
          : null;

      return {
        _id: String(a._id),
        title: a.title ?? "",
        slug: a.slug ?? "",
        img: a.img ?? "",
        description: a.description ?? "",
        createdAt: a.createdAt ? String(a.createdAt) : "",
        views: Number(a.views ?? 0),
        likesCount: Number(a.likesCount ?? 0),
        shares: Number(a.shares ?? 0),
        topic: {
          _id: String(topic?._id ?? ""),
          title: topic?.title ?? "",
          img: topic?.img ?? "",
        },
      };
    });
  },
  ["articles-list"],
  {
    revalidate: 300,
    tags: ["articles"],
  },
);

export default async function ArticlesPage() {
  const [topics, articles] = await Promise.all([getTopics(), getArticles()]);

  return (
    <div>
      <ArticleSliderClient topics={topics} />

      {!articles.length ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Inbox className="w-10 h-10 text-(--color-gray)" />
          <p className="text-sm text-(--color-gray) bangla">
            এখনো কোনো আর্টিকেল যোগ করা হয়নি
          </p>
        </div>
      ) : (
        <ArticlesFilterClient articles={articles} topics={topics} />
      )}
    </div>
  );
}
