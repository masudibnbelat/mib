"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Inbox } from "lucide-react";
import type { TopicData } from "@/src/types/Topic";
import SelectInput from "../common/SelectInput";
import ArticleCard from "./ArticleCard";
import { ArticleData } from "@/src/types/article";
import { axiosSecure } from "@/src/hooks/axiosSecure";

interface ArticlesFilterClientProps {
  articles: ArticleData[];
  topics: TopicData[];
}

const ALL_TOPICS = "all-topics";

const ArticlesFilterClient = ({
  articles: initialArticles,
  topics,
}: ArticlesFilterClientProps) => {
  const [selectedTopic, setSelectedTopic] = useState(ALL_TOPICS);

  const { data: articles = initialArticles } = useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const res = await axiosSecure.get<{
        success: boolean;
        data: ArticleData[];
      }>("/api/articles");

      if (!res.data.success) {
        throw new Error("Articles load failed");
      }

      return res.data.data;
    },
    initialData: initialArticles,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const topicOptions = useMemo(
    () => [
      { value: ALL_TOPICS, label: "All Topic" },
      ...topics.map((topic) => ({
        value: topic._id,
        label: topic.title,
      })),
    ],
    [topics],
  );

  const filteredArticles = useMemo(() => {
    if (selectedTopic === ALL_TOPICS) return articles;

    return articles.filter((article) => article.topic?._id === selectedTopic);
  }, [articles, selectedTopic]);

  const selectedTopicLabel =
    topicOptions.find((opt) => opt.value === selectedTopic)?.label || "সব টপিক";

  return (
    <div className="space-y-6 p-4 mt-6">
      <div className="flex gap-4 items-center justify-between">
        <h2 className="text-3xl lg:text-5xl font-semibold text-(--color-text) bangla">
          Articles
        </h2>

        <span className="inset-0 flex items-center justify-center pointer-events-none select-none text-5xl lg:text-7xl font-bold opacity-5 text-(--color-text)">
          {filteredArticles.length}
        </span>

        <div className="w-full sm:w-60">
          <SelectInput
            options={topicOptions}
            value={selectedTopic}
            onChange={setSelectedTopic}
            placeholder="Select a topic"
          />
        </div>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Inbox className="w-10 h-10 text-(--color-gray)" />
          <p className="text-sm text-(--color-gray) bangla">
            “{selectedTopicLabel}” No Articles Found!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map((a) => (
            <ArticleCard key={a._id} article={a} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ArticlesFilterClient;
