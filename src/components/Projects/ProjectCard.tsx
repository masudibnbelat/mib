"use client";

import { memo, useCallback } from "react";
import { motion } from "motion/react";
import Marquee from "react-fast-marquee";
import { Eye, ExternalLink, Globe, Smartphone } from "lucide-react";
import { BsGithub } from "react-icons/bs";
import ImageCarousel from "@/src/ui/ImageCarousel";
import type { Props } from "@/src/types/project";
import Link from "next/link";

const ProjectCardComponent = ({ project, index, onOpen }: Props) => {
  const handleOpenModal = useCallback(() => {
    onOpen?.(project);
  }, [onOpen, project]);

  const shouldUseMarquee = project.technologies?.length >= 5;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group overflow-hidden rounded-lg border border-(--color-active-border) bg-(--color-bg) transition-all duration-300  hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-600/10"
    >
      <div className="relative">
        <ImageCarousel
          images={project.images?.length ? [project.images[0]] : []}
          title={project.title}
          height="h-48"
          interactive={false}
          enableKeyboard={false}
          animated={false}
          priority={index < 3}
          imageWidth={640}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        <div
          className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium backdrop-blur-md ${
            project.type === "web"
              ? "bg-(--color-text)/60 text-(--color-bg)"
              : "bg-(--color-text)/60 text-(--color-bg)"
          }`}
        >
          {project.type === "web" ? (
            <div className="flex items-center gap-x-1">
              <Globe className="h-3.5 w-3.5" />
              <span className="bangla">Web</span>
            </div>
          ) : (
            <div className="flex items-center gap-x-1">
              <Smartphone className="h-3.5 w-3.5" />
              <span className="bangla">App</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 p-4">
        <h3 className="text-lg lg:text-2xl font-semibold leading-snug text-(--color-text) transition-colors group-hover:text-violet-400">
          {project.title}
        </h3>

        {project.technologies?.length > 0 && (
          <div>
            {shouldUseMarquee ? (
              <Marquee
                direction="left"
                speed={30}
                pauseOnHover={false}
                gradient={false}
              >
                <div className="flex gap-1.5 pr-1.5">
                  {project.technologies.map((tech) => (
                    <span
                      key={`${project._id}-${tech}`}
                      className="rounded-lg border border-(--color-active-border) bg-(--color-active-bg) px-2 py-0.5 text-[11px] font-medium text-(--color-gray)"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </Marquee>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {project.technologies.map((tech) => (
                  <span
                    key={`${project._id}-${tech}`}
                    className="rounded-lg border border-(--color-active-border) bg-(--color-active-bg) px-2 py-0.5 text-[11px] font-medium text-(--color-gray)"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="line-clamp-2 text-sm leading-relaxed text-(--color-gray)">
          {project.description}
        </p>

        <div className="flex justify-around gap-2 pt-1">
          {project.githubLink && (
            <Link
              href={project.githubLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-(--color-active-border) bg-(--color-active-bg) px-3 py-1.5 text-xs font-medium text-(--color-text)"
            >
              <BsGithub className="h-3.5 w-3.5" />
              <span>GitHub</span>
            </Link>
          )}

          {project.liveLink && (
            <Link
              href={project.liveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-(--color-active-border) bg-(--color-active-bg) px-3 py-1.5 text-xs font-medium text-(--color-text)"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="bangla">Live Link</span>
            </Link>
          )}

          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-(--color-text) px-3 py-1.5 text-xs font-medium text-(--color-bg)"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="bangla">Details</span>
          </button>
        </div>
      </div>
    </motion.article>
  );
};

const ProjectCard = memo(ProjectCardComponent);
export default ProjectCard;
