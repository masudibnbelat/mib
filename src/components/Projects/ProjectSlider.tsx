// src/components/Projects/ProjectSlider.tsx
"use client";

import { memo, useCallback, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ExternalLink, Globe, Smartphone } from "lucide-react";
import { BsGithub } from "react-icons/bs";
import { useQueryClient } from "@tanstack/react-query";
import type { Project } from "@/src/types/project";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ─── card ──────────────────────────────────────────── */
const ProjectCard = memo(({ project }: { project: Project }) => {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push("/projects")}
      className="w-64 sm:w-72 shrink-0 mx-2 sm:mx-3 cursor-pointer rounded-2xl overflow-hidden border border-(--color-active-border) bg-(--color-bg) hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 hover:-translate-y-1"
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

        {/* links — click এ /projects এ যাবে না */}
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

          {/* ✅ View All — /projects এ নিয়ে যাবে */}
          <Link
            href="/projects"
            onClick={(e) => e.stopPropagation()}
            className="ml-auto inline-flex items-center gap-1 rounded-lg bg-(--color-text) px-2.5 py-1 text-[10px] font-medium text-(--color-bg)"
          >
            View All
          </Link>
        </div>
      </div>
    </div>
  );
});

ProjectCard.displayName = "ProjectCard";

/* ─── marquee ───────────────────────────────────────── */
const MarqueeTrack = memo(
  ({
    projects,
    reverse = false,
    speed = 3,
  }: {
    projects: Project[];
    reverse?: boolean;
    speed?: number;
  }) => {
    const duration = projects.length * speed;
    const repeated = [...projects, ...projects, ...projects];

    return (
      <div className="marquee-wrap overflow-hidden relative w-full">
        {/* fade edges */}
        <div className="pointer-events-none absolute left-0 inset-y-0 w-16 sm:w-32 z-10 bg-linear-to-r from-(--color-bg) to-transparent" />
        <div className="pointer-events-none absolute right-0 inset-y-0 w-16 sm:w-32 z-10 bg-linear-to-l from-(--color-bg) to-transparent" />

        <div
          className={`marquee-track flex w-max py-4 will-change-transform ${
            reverse ? "marquee-reverse" : "marquee-forward"
          }`}
          style={{ "--marquee-dur": `${duration}s` } as React.CSSProperties}
        >
          {repeated.map((project, i) => (
            <ProjectCard key={`${project._id}-${i}`} project={project} />
          ))}
        </div>
      </div>
    );
  },
);

MarqueeTrack.displayName = "MarqueeTrack";

/* ─── main ──────────────────────────────────────────── */
interface Props {
  initialProjects: Project[];
}

const ProjectSlider = ({ initialProjects }: Props) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (initialProjects.length > 0) {
      queryClient.setQueryData(["projects-slider"], initialProjects);
    }
  }, [initialProjects, queryClient]);

  const router = useRouter();
  const prefetchedRef = useRef(false);

  const handlePrefetch = useCallback(() => {
    if (!prefetchedRef.current) {
      router.prefetch("/projects");
      prefetchedRef.current = true;
    }
  }, [router]);

  if (initialProjects.length === 0) return null;

  const mid = Math.ceil(initialProjects.length / 2);
  const firstRow = initialProjects.slice(0, mid);
  const secondRow = initialProjects.slice(mid);

  return (
    <>
      <style>{`
        @keyframes marquee-x {
          from { transform: translateX(0); }
          to   { transform: translateX(-33.333%); }
        }
        @keyframes marquee-reverse {
          from { transform: translateX(-33.333%); }
          to   { transform: translateX(0); }
        }
        .marquee-forward {
          animation: marquee-x var(--marquee-dur) linear infinite;
        }
        .marquee-reverse {
          animation: marquee-reverse var(--marquee-dur) linear infinite;
        }
      `}</style>

      <section
        className="w-full py-12 overflow-hidden"
        onMouseEnter={handlePrefetch}
      >
        <motion.div
          className="flex justify-center lg:justify-start items-center my-0 md:my-12"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-5xl audiowide lg:ml-8">
            <span className="text-red-500 mr-1.5">Pro</span>jects
          </h2>
        </motion.div>

        <div className="space-y-2">
          <MarqueeTrack projects={firstRow} speed={4} />
          {secondRow.length > 0 && (
            <MarqueeTrack projects={secondRow} reverse speed={4} />
          )}
        </div>

        {/* ✅ View All button */}
        <div className="flex justify-center mt-8">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-xl border border-(--color-active-border) bg-(--color-active-bg) px-6 py-2.5 text-sm font-medium text-(--color-text) hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300"
          >
            View All Projects →
          </Link>
        </div>
      </section>
    </>
  );
};

export default memo(ProjectSlider);
