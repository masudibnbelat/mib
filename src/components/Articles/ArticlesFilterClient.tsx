// src/components/Articles/ArticlesFilterClient.tsx
"use client";

import { useCallback, useMemo, useState } from "react";
import { Inbox } from "lucide-react";
import type { TopicData } from "@/src/types/Topic";
import type { ArticleData } from "@/src/types/article";
import SelectInput from "../common/SelectInput";
import ArticleCard from "./ArticleCard";
import Pagination, { usePagination } from "../common/Pagination";

interface Props {
  articles: ArticleData[];
  topics: TopicData[];
}

const ALL = "all-topics";
const PAGE_SIZE = 6;

export default function ArticlesFilterClient({ articles, topics }: Props) {
  const [selected, setSelected] = useState(ALL);

  const topicOptions = useMemo(
    () => [
      { value: ALL, label: "সব টপিক" },
      ...topics.map((t) => ({ value: t._id, label: t.title })),
    ],
    [topics],
  );

  const filtered = useMemo(
    () =>
      selected === ALL
        ? articles
        : articles.filter((a) => a.topic?._id === selected),
    [articles, selected],
  );

  const { page, totalPages, paginated, goToPage } = usePagination(filtered, {
    pageSize: PAGE_SIZE,
    storageKey: "articles-filter-pagination",
  });

  const handleTopicChange = useCallback(
    (value: string) => {
      setSelected(value);
      goToPage(1);
    },
    [goToPage],
  );

  const label =
    topicOptions.find((o) => o.value === selected)?.label ?? "সব টপিক";

  return (
    <div className="space-y-6 p-4 mt-6">
      <div className="flex gap-4 items-center justify-between">
        <h2 className="text-3xl lg:text-5xl font-semibold text-(--color-text) bangla">
          Articles
        </h2>

        <span className="inset-0 flex items-center justify-center pointer-events-none select-none text-5xl lg:text-7xl font-bold opacity-5 text-(--color-text)">
          {filtered.length}
        </span>

        <div className="w-full sm:w-60">
          <SelectInput
            options={topicOptions}
            value={selected}
            onChange={handleTopicChange}
            placeholder="টপিক বেছে নাও"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Inbox className="w-10 h-10 text-(--color-gray)" />
          <p className="text-sm text-(--color-gray) bangla">
            &quot;{label}&quot; — কোনো আর্টিকেল নেই
          </p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map((a) => (
              <ArticleCard key={a._id} article={a} />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          )}
        </div>
      )}
    </div>
  );
}
