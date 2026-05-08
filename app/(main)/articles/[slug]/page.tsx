// app/articles/[slug]/page.tsx

import { notFound } from "next/navigation";
import Image from "next/image";
import { Calendar, Clock, Clock3, Eye, Folder } from "lucide-react";
import { connectDB } from "@/src/lib/db";
import { Article } from "@/src/models/Article";
import { formatDistanceToNow } from "date-fns";
import LikeButton from "@/src/components/Articles/LikeButton";
import ShareButton from "@/src/components/Articles/ShareButton";
import ViewTracker from "@/src/components/Articles/ViewTracker";
import BackButton from "@/src/components/Articles/BackButton";
import DatenClock from "@/src/components/Date/DatenClock";

export const dynamic = "force-dynamic";

async function getArticle(slug: string) {
  await connectDB();
  return Article.findOne({ slug }).populate("topic", "title img").lean();
}

export default async function ArticleDetails({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const raw = await getArticle(slug);

  if (!raw) notFound();

  const article = JSON.parse(JSON.stringify(raw));
  const topicTitle = (article.topic as { title: string })?.title ?? "";
  const formattedDate = new Date(article.createdAt).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  );
  const timeAgo = formatDistanceToNow(new Date(article.createdAt), {
    addSuffix: true,
  });
  const readingTime = Math.ceil(article.description.split(" ").length / 200);

  const likesCount = Number(article.likesCount ?? 0);
  const viewsCount = Number(article.views ?? 0);
  const sharesCount = Number(article.shares ?? 0);

  return (
    <div className="min-h-screen bg-(--color-bg) mt-20">
      <ViewTracker slug={slug} />

      <div className="relative w-full h-[42vh] sm:h-[55vh]">
        <Image
          src={article.img}
          alt={article.title}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-black/10" />
        <div className="absolute top-4 left-4">
          <BackButton />
        </div>
        <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-violet-600/90 backdrop-blur-sm text-white text-xs font-medium bangla">
          {topicTitle}
        </span>
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-6">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white bangla leading-snug drop-shadow-md">
            {article.title}
          </h1>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-(--color-active-border)">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-(--color-gray)">
            <span className="flex items-center gap-1.5">
              <Folder className="w-4 h-4 text-violet-500" />
              <span className="bangla">{topicTitle}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span className="bangla">{formattedDate}</span>
            </span>

            <span className="flex items-center gap-1.5">
              <Clock3 className="w-4 h-4" />
              <span className="bangla">{readingTime} min read</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-(--color-gray)">
            <LikeButton slug={article.slug} initialCount={likesCount} />
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              <span>{viewsCount}</span>
            </span>

            <ShareButton
              slug={article.slug}
              title={article.title}
              initialCount={sharesCount}
            />
          </div>
        </div>

        <article className="text-base sm:text-[17px] leading-loose text-(--color-text) bangla whitespace-pre-line">
          {article.description}
        </article>

        <div className="flex items-center justify-between pt-6 border-t border-(--color-active-border)">
          <span className="flex items-center gap-1.5 text-sm text-(--color-gray)">
            <Clock className="w-4 h-4" />
            <span className="bangla">{timeAgo}</span>
          </span>
          <DatenClock />
        </div>
      </div>
    </div>
  );
}
