// app/articles/page.tsx
import { Suspense } from "react";
import { connectDB } from "@/src/lib/db";
import { Article } from "@/src/models/Article";
import { Topic } from "@/src/models/Topic";

import ArticleSliderClient from "@/src/components/Articles/ArticleSliderClient";
import ArticlesFilterClient from "@/src/components/Articles/ArticlesFilterClient";

import type { TopicData, TopicLean } from "@/src/types/Topic";
import type { ArticleData, ArticleLean } from "@/src/types/article";
import { Inbox } from "lucide-react";

async function getTopics(): Promise<TopicData[]> {
  await connectDB();
  const raw = await Topic.find()
    .sort({ createdAt: -1 })
    .select("title img")
    .lean<TopicLean[]>();

  return raw.map((t) => ({
    _id: String(t._id),
    title: t.title ?? "",
    img: t.img ?? "",
  }));
}

async function getArticles(): Promise<ArticleData[]> {
  await connectDB();
  const raw = await Article.find()
    .populate("topic", "title img")
    .sort({ createdAt: -1 })
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
}

/* ==================== Skeletons ==================== */
function SliderSkeleton() {
  return (
    <section className="mt-20 w-full">
      <div className="w-full aspect-16/8 sm:aspect-16/6 lg:aspect-12/4 rounded animate-pulse bg-(--color-active-bg)" />
    </section>
  );
}

function BodySkeleton() {
  return (
    <div className="space-y-6 p-4 mt-6">
      <div className="h-6 w-40 rounded animate-pulse bg-(--color-active-bg)" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded border border-(--color-active-border) overflow-hidden"
          >
            <div className="h-52 animate-pulse bg-(--color-active-bg)" />
            <div className="p-4 space-y-3">
              <div className="h-4 w-3/4 rounded animate-pulse bg-(--color-active-bg)" />
              <div className="h-3 w-1/2 rounded animate-pulse bg-(--color-active-bg)" />
              <div className="h-3 w-full rounded animate-pulse bg-(--color-active-bg)" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function Slider() {
  const topics = await getTopics();
  return <ArticleSliderClient topics={topics} />;
}

async function Body() {
  const [articles, topics] = await Promise.all([getArticles(), getTopics()]);

  if (!articles.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Inbox className="w-10 h-10 text-(--color-gray)" />
        <p className="text-sm text-(--color-gray) bangla">
          এখনো কোনো আর্টিকেল যোগ করা হয়নি
        </p>
      </div>
    );
  }

  return <ArticlesFilterClient articles={articles} topics={topics} />;
}

// ★ এটাই মূল fix — প্রতিবার fresh data
export const dynamic = "force-dynamic";

export default function ArticlesPage() {
  return (
    <div>
      <Suspense fallback={<SliderSkeleton />}>
        <Slider />
      </Suspense>
      <Suspense fallback={<BodySkeleton />}>
        <Body />
      </Suspense>
    </div>
  );
}
