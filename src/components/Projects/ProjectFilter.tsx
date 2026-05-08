// src/components/projects/ProjectsFilter.tsx

"use client";

import { memo, type ElementType } from "react";
import { motion } from "motion/react";
import { Code2, Globe, Smartphone } from "lucide-react";
import type { FilterType } from "@/src/types/project";

type FilterItem = {
  label: string;
  value: FilterType;
  icon: ElementType;
};

export const FILTERS: FilterItem[] = [
  { label: "all", value: "all", icon: Code2 },
  { label: "web", value: "web", icon: Globe },
  { label: "app", value: "app", icon: Smartphone },
];

interface Props {
  value: FilterType;
  onChange: (value: FilterType) => void;
  isFetching?: boolean;
}

const ProjectFilter = ({ value, onChange = () => {} }: Props) => {
  return (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
      <div className="inline-flex flex-wrap items-center gap-2 rounded border border-(--color-active-border) bg-(--color-active-bg)/80 p-1 shadow-sm shadow-black/5">
        {FILTERS.map((item) => {
          const Icon = item.icon;
          const active = value === item.value;

          return (
            <motion.button
              key={item.value}
              type="button"
              aria-pressed={active}
              whileTap={{ scale: 0.97 }}
              whileHover={{ y: -1 }}
              onClick={() => onChange(item.value)}
              className={`relative inline-flex min-w-16 items-center justify-center gap-2 overflow-hidden rounded px-4 py-2 text-sm font-medium transition-colors sm:min-w-23 ${
                active
                  ? "text-(--color-bg)"
                  : "text-(--color-gray) hover:text-(--color-text)"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="project-filter-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute inset-0 -z-10 rounded bg-(--color-text) text-(--color-bg) shadow-lg shadow-violet-600/25"
                />
              )}

              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default memo(ProjectFilter);
