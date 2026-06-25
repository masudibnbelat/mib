// src/components/Articles/ArticleCard.tsx
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Calendar, Clock3, Eye, Folder } from "lucide-react";
import { memo } from "react";

import LikeButton from "./LikeButton";
import ShareButton from "./ShareButton";
import { ArticleData } from "@/src/types/article";
import TimeAgo from "../common/TimeAgo";

interface Props {
  article: ArticleData;
  onRefetch?: () => void;
}

const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, "").trim();
};

const ArticleCard = memo(function ArticleCard({ article }: Props) {
  const date = new Date(article.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const readingTime = Math.ceil(article.description.split(" ").length / 200);

  // ✅ Plain text preview — no hydration mismatch
  const plainDescription = stripHtml(article.description);
  const truncatedDescription =
    plainDescription.length > 150
      ? plainDescription.substring(0, 150) + "…"
      : plainDescription;

  return (
    <div className="group relative flex flex-col rounded-lg overflow-hidden border border-(--color-active-border) bg-(--color-bg) hover:border-violet-500/40 hover:shadow-[0_8px_30px_rgba(109,40,217,0.1)] transition-all duration-300">
      <div className="relative h-52 shrink-0 overflow-hidden">
        <Image
          src={article.img}
          alt={article.title}
          fill
          quality={50}
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs">
          <Clock3 className="w-3 h-3" />
          {readingTime} min read
        </div>
      </div>

      <div className="flex flex-col flex-1 p-4 gap-3">
        <Link href={`/articles/${article.slug}`}>
          <h3 className="text-xl font-semibold text-(--color-text) bangla line-clamp-2 leading-snug group-hover:text-violet-500 transition-colors">
            {article.title}
          </h3>
        </Link>

        <div className="flex items-center gap-3 text-xs text-(--color-gray)">
          <span className="flex items-center gap-1 bangla">
            <Calendar className="w-3 h-3" />
            {date}
          </span>
          <span className="w-px h-3 bg-(--color-active-border)" />
          <span className="flex items-center gap-1 bangla">
            <Folder className="w-3 h-3" />
            {article.topic?.title}
          </span>
        </div>

        <p className="text-sm text-(--color-gray) bangla flex-1 leading-6 line-clamp-3">
          {truncatedDescription}
        </p>

        <div className="flex justify-between">
          <TimeAgo
            date={article.createdAt}
            className="text-(--color-gray)"
            showIcon={true}
          />
          <Link
            href={`/articles/${article.slug}`}
            prefetch
            className="flex items-center gap-0.5 text-xs font-semibold text-(--color-gray) hover:animate-pulse transition-colors"
          >
            Read More <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex items-center justify-around pt-3 border-t border-(--color-active-border) mt-auto">
          <LikeButton
            slug={article.slug}
            initialCount={Number(article.likesCount ?? 0)}
          />
          <div className="flex items-center gap-1.5 text-sm text-(--color-gray)">
            <Eye className="w-5 h-5" />
            <span>{Number(article.views ?? 0)}</span>
          </div>
          <ShareButton
            slug={article.slug}
            title={article.title}
            initialCount={Number(article.shares ?? 0)}
          />
        </div>
      </div>
    </div>
  );
});

export default ArticleCard;
