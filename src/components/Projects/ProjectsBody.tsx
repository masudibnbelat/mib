// src/components/projects/ProjectsBody.tsx
"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, FolderOpen } from "lucide-react";
import { axiosSecure } from "@/src/hooks/axiosSecure";
import type { ApiResponse, FilterType, Project } from "@/src/types/project";
import ProjectCard from "./ProjectCard";
import ProjectModal from "./ProjectModal";
import ProjectFilter, { FILTERS } from "./ProjectFilter";
import Loader from "../common/Loader";
import Pagination from "../common/Pagination";

const PAGE_SIZE = 6;
const STALE_TIME = 1000 * 60 * 5;
const GC_TIME = 1000 * 60 * 30;

const fetchProjects = async (
  filter: FilterType,
  page: number,
  signal?: AbortSignal,
) => {
  const res = await axiosSecure.get<ApiResponse>("/api/projects", {
    params: {
      page,
      limit: PAGE_SIZE,
      ...(filter !== "all" ? { type: filter } : {}),
    },
    signal,
  });

  return res.data;
};

const ProjectsBody = () => {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const queryClient = useQueryClient();

  const prefetchProjects = useCallback(
    (nextFilter: FilterType, nextPage: number) => {
      return queryClient.prefetchQuery({
        queryKey: ["projects", nextFilter, nextPage],
        queryFn: ({ signal }) => fetchProjects(nextFilter, nextPage, signal),
        staleTime: STALE_TIME,
      });
    },
    [queryClient],
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useQuery<ApiResponse>({
      queryKey: ["projects", filter, page],
      queryFn: ({ signal }) => fetchProjects(filter, page, signal),
      placeholderData: keepPreviousData,
      staleTime: STALE_TIME,
      gcTime: GC_TIME,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });

  const projects = data?.data ?? [];
  const meta = data?.meta;

  const handleFilterChange = useCallback(
    (nextFilter: FilterType) => {
      if (nextFilter === filter) return;

      startTransition(() => {
        setFilter(nextFilter);
        setPage(1);
      });
    },
    [filter],
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      if (nextPage === page) return;
      if (nextPage < 1) return;
      if (meta && nextPage > meta.totalPages) return;

      startTransition(() => {
        setPage(nextPage);
      });
    },
    [page, meta],
  );

  const handleOpen = useCallback((project: Project) => {
    setSelectedProject(project);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedProject(null);
  }, []);

  useEffect(() => {
    if (!meta?.totalPages) return;

    const nextPage = page + 1;
    const prevPage = page - 1;

    if (nextPage <= meta.totalPages) {
      void prefetchProjects(filter, nextPage);
    }

    if (prevPage >= 1) {
      void prefetchProjects(filter, prevPage);
    }
  }, [page, filter, meta?.totalPages, prefetchProjects]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      FILTERS.map((item) => item.value)
        .filter((value) => value !== filter)
        .forEach((value) => {
          void prefetchProjects(value, 1);
        });
    }, 150);

    return () => window.clearTimeout(timer);
  }, [filter, prefetchProjects]);

  const showInitialLoader = isLoading && !data;

  return (
    <section className="mx-auto  px-4 lg:px-0.5 py-8">
      <div className="mb-6 flex flex-col lg:flex-row gap-4 justify-center lg:justify-between">
        <div>
          <h2 className="text-4xl lg:text-5xl font-bold text-(--color-text)">
            Projects
          </h2>

          {meta && (
            <p className="mt-1 text-sm text-(--color-gray)">
              Total {meta.total} projects
            </p>
          )}
        </div>

        <ProjectFilter value={filter} onChange={handleFilterChange} />
      </div>

      <div className="relative min-h-80">
        <AnimatePresence mode="wait">
          {showInitialLoader && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader />
            </motion.div>
          )}

          {!showInitialLoader && isError && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-4 py-24"
            >
              <AlertCircle className="h-8 w-8 text-rose-500" />

              <p className="bangla text-sm text-(--color-gray)">
                {(error as Error)?.message ?? "কিছু একটা সমস্যা হয়েছে"}
              </p>

              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
              >
                আবার চেষ্টা করুন
              </button>
            </motion.div>
          )}

          {!showInitialLoader && !isError && projects.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-3 py-24"
            >
              <FolderOpen className="h-10 w-10 text-(--color-gray)" />
              <p className="bangla text-sm text-(--color-gray)">
                কোনো প্রজেক্ট পাওয়া যায়নি
              </p>
            </motion.div>
          )}

          {!showInitialLoader && !isError && projects.length > 0 && (
            <motion.div
              key={`${filter}-${page}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {projects.map((project, i) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  index={i}
                  onOpen={handleOpen}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {isFetching &&
          !showInitialLoader &&
          !isError &&
          projects.length > 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-3xl bg-(--color-bg)/35 backdrop-blur-[2px]">
              <Loader />
            </div>
          )}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={page}
            totalPages={meta.totalPages}
            onPageChange={handlePageChange}
            storageKey="projects-pagination"
          />
        </div>
      )}

      {selectedProject && (
        <ProjectModal project={selectedProject} onClose={handleClose} />
      )}
    </section>
  );
};

export default ProjectsBody;
