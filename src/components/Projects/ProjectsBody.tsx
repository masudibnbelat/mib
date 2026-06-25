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
const STORAGE_KEY = "projects-pagination";

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

interface Props {
  initialData: ApiResponse; // ✅ server থেকে আসবে
}

const ProjectsBody = ({ initialData }: Props) => {
  const [page, setPage] = useState<number>(1);
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? parseInt(saved, 10) : NaN;
      if (!isNaN(parsed) && parsed >= 1) setPage(parsed);
    } catch {
      //
    }
  }, []);

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

  // ✅ page change হলে persist করো
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(page));
    } catch {
      // localStorage unavailable (private mode etc.)
    }
  }, [page]);

  const { data, isFetching, isError, error, refetch } = useQuery<ApiResponse>({
    queryKey: ["projects", filter, page],
    queryFn: ({ signal }) => fetchProjects(filter, page, signal),

    initialData: filter === "all" && page === 1 ? initialData : undefined,
    initialDataUpdatedAt:
      // eslint-disable-next-line react-hooks/purity
      filter === "all" && page === 1 ? Date.now() : undefined,
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const projects = data?.data ?? [];
  const meta = data?.meta;

  // ✅ initialData আসার সাথে সাথে cache এ set করো
  useEffect(() => {
    queryClient.setQueryData(["projects", "all", 1], initialData);
  }, [initialData, queryClient]);

  // ✅ restored page যদি totalPages-এর বেশি হয়ে যায় (filter change / data shrink), clamp করো
  useEffect(() => {
    if (meta && page > meta.totalPages) {
      setPage(meta.totalPages);
    }
  }, [meta, page]);

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

      requestAnimationFrame(() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
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

  // ✅ Next/prev page prefetch
  useEffect(() => {
    if (!meta?.totalPages) return;
    const nextPage = page + 1;
    const prevPage = page - 1;
    if (nextPage <= meta.totalPages) void prefetchProjects(filter, nextPage);
    if (prevPage >= 1) void prefetchProjects(filter, prevPage);
  }, [page, filter, meta?.totalPages, prefetchProjects]);

  // ✅ Other filters prefetch (delay দিয়ে)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      FILTERS.map((item) => item.value)
        .filter((value) => value !== filter)
        .forEach((value) => void prefetchProjects(value, 1));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [filter, prefetchProjects]);

  return (
    <section className="mx-auto px-4 lg:px-0.5 py-8">
      <div className="mb-6 flex flex-col lg:flex-row gap-4 justify-center lg:justify-between">
        <div>
          <h2 className="text-4xl lg:text-5xl font-bold text-(--color-text)">
            Projects
          </h2>
          <p className="mt-1 text-sm text-(--color-gray)">
            Total {meta?.total ?? initialData.meta.total} projects
          </p>
        </div>
        <ProjectFilter value={filter} onChange={handleFilterChange} />
      </div>

      <div className="relative min-h-80">
        {/* ✅ mode="sync" — exit animation wait করবে না, lag কমবে */}
        <AnimatePresence mode="sync">
          {isError && (
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

          {!isError && projects.length === 0 && (
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

          {!isError && projects.length > 0 && (
            <motion.div
              key={`${filter}-${page}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              // ✅ transition duration কমিয়ে দাও
              transition={{ duration: 0.15 }}
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

        {/* ✅ Subtle overlay — full block না করে */}
        {isFetching && projects.length > 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-3xl bg-(--color-bg)/20 backdrop-blur-[1px] transition-opacity duration-200">
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
            siblingCount={2}
            showFirstLast={false}
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
