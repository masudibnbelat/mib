// ProjectSlider.tsx
"use client";

import { memo, useCallback, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ExternalLink, Globe, Smartphone, Eye } from "lucide-react";
import { BsGithub } from "react-icons/bs";
import { useQuery } from "@tanstack/react-query";
import type { Project, ApiResponse } from "@/src/types/project";
import { axiosSecure } from "@/src/hooks/axiosSecure";
import Image from "next/image";
import Link from "next/link";
import ProjectModal from "./ProjectModal";
import Loader from "../common/Loader";

/* ─── fetch ─────────────────────────────────────────── */
const fetchProjects = async () => {
  const res = await axiosSecure.get<ApiResponse>("/api/projects", {
    params: { limit: 20 },
  });
  return res.data.data ?? [];
};

/* ─── card ──────────────────────────────────────────── */
const ProjectCard = ({
  project,
  onOpen,
}: {
  project: Project;
  onOpen: (p: Project) => void;
}) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300, damping: 22 }}
    onClick={() => onOpen(project)}
    className="w-64 sm:w-72 shrink-0 mx-2 sm:mx-3 cursor-pointer rounded-2xl overflow-hidden border border-(--color-active-border) bg-(--color-bg) hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/10 transition-shadow duration-300"
  >
    {/* image */}
    <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-(--color-active-bg)">
      {project.images?.[0] ? (
        <Image
          src={project.images[0]}
          alt={project.title}
          fill
          sizes="(max-width: 640px) 256px, 288px"
          className="object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <Globe className="h-10 w-10 text-(--color-gray) opacity-20" />
        </div>
      )}
      <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />
      <span
        className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium backdrop-blur-md ${
          project.type === "web"
            ? "bg-violet-600/85 text-white"
            : "bg-emerald-600/85 text-white"
        }`}
      >
        {project.type === "web" ? (
          <>
            <Globe className="h-3 w-3" /> Web
          </>
        ) : (
          <>
            <Smartphone className="h-3 w-3" /> App
          </>
        )}
      </span>
    </div>

    {/* content */}
    <div className="p-3 sm:p-4 space-y-2">
      <h3 className="truncate text-xs sm:text-sm font-semibold text-(--color-text)">
        {project.title}
      </h3>
      <p className="line-clamp-2 text-[10px] sm:text-[11px] leading-relaxed text-(--color-gray)">
        {project.description}
      </p>

      {project.technologies?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {project.technologies.slice(0, 3).map((tech) => (
            <span
              key={tech}
              className="rounded-md border border-(--color-active-border) bg-(--color-active-bg) px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-medium text-(--color-gray)"
            >
              {tech}
            </span>
          ))}
          {project.technologies.length > 3 && (
            <span className="rounded-md border border-(--color-active-border) bg-(--color-active-bg) px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-medium text-(--color-gray)">
              +{project.technologies.length - 3}
            </span>
          )}
        </div>
      )}

      <div
        className="flex items-center gap-1.5 pt-1"
        onClick={(e) => e.stopPropagation()}
      >
        {project.githubLink && (
          <Link
            href={project.githubLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-(--color-active-border) bg-(--color-active-bg) px-2 py-1 text-[10px] font-medium text-(--color-text) hover:border-violet-500/40 transition-colors"
          >
            <BsGithub className="h-2.5 w-2.5" /> GitHub
          </Link>
        )}
        {project.liveLink && (
          <Link
            href={project.liveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-(--color-active-border) bg-(--color-active-bg) px-2 py-1 text-[10px] font-medium text-(--color-text) hover:border-violet-500/40 transition-colors"
          >
            <ExternalLink className="h-2.5 w-2.5" /> Live
          </Link>
        )}
        <button
          type="button"
          onClick={() => onOpen(project)}
          className="ml-auto inline-flex items-center gap-1 rounded-lg bg-(--color-text) px-2.5 py-1 text-[10px] font-medium text-(--color-bg)"
        >
          <Eye className="h-3 w-3" /> Details
        </button>
      </div>
    </div>
  </motion.div>
);

/* ─── marquee ───────────────────────────────────────── */
const Marquee = ({
  projects,
  onOpen,
  reverse = false,
  speed = 6,
}: {
  projects: Project[];
  onOpen: (p: Project) => void;
  reverse?: boolean;
  speed?: number;
}) => {
  const duration = projects.length * speed;
  const doubled = [...projects, ...projects];

  return (
    <div className="marquee-wrap overflow-hidden relative w-full">
      <div className="pointer-events-none absolute left-0 inset-y-0 w-16 sm:w-32 z-10 bg-linear-to-r from-(--color-bg) to-transparent" />
      <div className="pointer-events-none absolute right-0 inset-y-0 w-16 sm:w-32 z-10 bg-linear-to-l from-(--color-bg) to-transparent" />

      <div
        className={`marquee-track flex w-max py-4 ${reverse ? "marquee-reverse" : "marquee-forward"}`}
        style={{ "--marquee-dur": `${duration}s` } as React.CSSProperties}
      >
        {doubled.map((project, i) => (
          <ProjectCard
            key={`${project._id}-${i}`}
            project={project}
            onOpen={onOpen}
          />
        ))}
      </div>
    </div>
  );
};

/* ─── main ──────────────────────────────────────────── */
const ProjectSlider = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const {
    data: projects = [],
    isLoading,
    isError,
  } = useQuery<Project[]>({
    queryKey: ["projects-slider"],
    queryFn: fetchProjects,
    staleTime: 1000 * 60 * 5,
  });

  const handleOpen = useCallback((p: Project) => setSelectedProject(p), []);
  const handleClose = useCallback(() => setSelectedProject(null), []);

  return (
    <div>
      <style>{`
  @keyframes marquee-x {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes marquee-reverse {
    0%   { transform: translateX(-50%); }
    100% { transform: translateX(0); }
  }

  /* ✅ animation এখন class-এ, inline style নেই */
  .marquee-forward {
    animation-name: marquee-x;
    animation-duration: var(--marquee-dur);
    animation-timing-function: linear;
    animation-iteration-count: infinite;
  }
  .marquee-reverse {
    animation-name: marquee-reverse;
    animation-duration: var(--marquee-dur);
    animation-timing-function: linear;
    animation-iteration-count: infinite;
  }

  /* ✅ এখন এটা কাজ করবে */
  .marquee-wrap:hover .marquee-track {
    animation-play-state: paused;
  }
`}</style>

      <section className="w-full py-8">
        <motion.div
          className=" flex justify-center lg:justify-start items-center my-0 md:my-12"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl audiowide lg:ml-8">
            <span className="text-red-500 mr-1.5">Pro</span>jects
          </h2>
        </motion.div>

        {isLoading ? (
          <Loader />
        ) : isError ? (
          <p className="py-16 text-center text-sm text-(--color-gray)">
            Something went wrong.
          </p>
        ) : projects.length === 0 ? (
          <p className="py-16 text-center text-sm text-(--color-gray)">
            No projects found.
          </p>
        ) : (
          <div className="space-y-2">
            <Marquee projects={projects} onOpen={handleOpen} />
          </div>
        )}
      </section>

      <AnimatePresence>
        {selectedProject && (
          <ProjectModal project={selectedProject} onClose={handleClose} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(ProjectSlider);
