"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { CalendarDays, ExternalLink, Globe, Smartphone, X } from "lucide-react";
import { BsGithub } from "react-icons/bs";
import ImageCarousel from "@/src/ui/ImageCarousel";
import type { Project } from "@/src/types/project";

interface Props {
  project: Project;
  onClose: () => void;
}

const ModalContent = ({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) => {
  const date = new Date(project.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-4 text-left">
      <ImageCarousel
        images={project.images}
        title={project.title}
        height="h-[320px] sm:h-[420px] md:h-[520px] lg:h-[620px]"
        showCount
        interactive
        enableKeyboard
        animated
        priority
        imageWidth={1280}
        sizes="(max-width: 768px) 100vw, 900px"
      />

      <div className="flex h- items-start justify-between gap-3">
        <h2 className="text-xl font-bold leading-snug text-(--color-text)">
          {project.title}
        </h2>

        <span
          className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
            project.type === "web"
              ? "bg-violet-600/20 text-violet-400"
              : "bg-emerald-600/20 text-emerald-400"
          }`}
        >
          {project.type === "web" ? (
            <div className="flex items-center gap-x-1">
              <Globe className="h-3 w-3" />
              <span className="bangla">Web</span>
            </div>
          ) : (
            <div className="flex items-center gap-x-1">
              <Smartphone className="h-3 w-3" />
              <span className="bangla">App</span>
            </div>
          )}
        </span>
      </div>

      <div className="bangla flex items-center gap-1.5 text-xs text-(--color-gray)">
        <CalendarDays className="h-3.5 w-3.5" />
        {date}
      </div>

      <p className="text-sm leading-relaxed text-(--color-gray)">
        {project.description}
      </p>

      {project.technologies?.length > 0 && (
        <div>
          <p className="bangla mb-2 text-xs font-semibold text-(--color-text)">
            Languages
          </p>

          <div className="flex flex-wrap gap-1.5">
            {project.technologies.map((tech) => (
              <span
                key={`${project._id}-${tech}`}
                className="rounded-lg border border-(--color-active-border) bg-(--color-active-bg) px-2.5 py-1 text-[11px] font-medium text-(--color-gray)"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {project.githubLink && (
          <a
            href={project.githubLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-(--color-active-border) bg-(--color-active-bg) px-4 py-2 text-sm font-medium text-(--color-text)"
          >
            <BsGithub className="h-4 w-4" />
            GitHub
          </a>
        )}

        {project.liveLink && (
          <a
            href={project.liveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-(--color-active-border) bg-(--color-active-bg) px-4 py-2 text-sm font-medium text-(--color-text)"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="bangla">Live Link</span>
          </a>
        )}

        <button
          type="button"
          onClick={onClose}
          className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-(--color-active-border) bg-red-500 px-4 py-2 text-sm font-medium text-(--color-text)"
        >
          <X className="h-4 w-4" />
          <span className="bangla">Close</span>
        </button>
      </div>
    </div>
  );
};

const ProjectModal = ({ project, onClose }: Props) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleOverlayClick = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose],
  );

  if (typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      ref={overlayRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleOverlayClick}
      className=" container mx-auto  fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      aria-label="প্রজেক্ট বিস্তারিত"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-h-full w-full overflow-y-auto rounded-2xl border border-(--color-active-border) bg-(--color-bg) p-6 shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Modal"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-(--color-active-border) bg-red-500 text-(--color-text)"
        >
          <X className="h-4 w-4" />
        </button>

        <ModalContent project={project} onClose={onClose} />
      </motion.div>
    </motion.div>,
    document.body,
  );
};

export default ProjectModal;
