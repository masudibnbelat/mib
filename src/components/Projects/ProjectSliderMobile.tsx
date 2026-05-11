"use client";

import { memo, useRef, useCallback, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { EffectCards, Autoplay } from "swiper/modules";
import {
  ExternalLink,
  Globe,
  Smartphone,
  Pause,
  Play,
  Eye,
} from "lucide-react";
import { BsGithub } from "react-icons/bs";
import type { Project } from "@/src/types/project";
import Image from "next/image";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/effect-cards";
import "swiper/css/pagination";
import Link from "next/link";

interface Props {
  projects: Project[];
  onOpen: (project: Project) => void;
}

const ProjectSliderMobile = ({ projects, onOpen }: Props) => {
  const swiperRef = useRef<SwiperType | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const handleSlideClick = useCallback(
    (project: Project) => {
      if (swiperRef.current && !isPaused) {
        swiperRef.current.autoplay.stop();
        setIsPaused(true);
      }
      onOpen(project);
    },
    [onOpen, isPaused],
  );

  const toggleAutoplay = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!swiperRef.current) return;
      if (isPaused) {
        swiperRef.current.autoplay.start();
        setIsPaused(false);
      } else {
        swiperRef.current.autoplay.stop();
        setIsPaused(true);
      }
    },
    [isPaused],
  );

  if (!projects?.length) return null;

  return (
    <div className="relative w-full overflow-hidden py-4">
      {/* Play/Pause */}
      <button
        type="button"
        onClick={toggleAutoplay}
        title={isPaused ? "Resume" : "Pause"}
        className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-(--color-active-border) bg-(--color-bg) text-(--color-gray) transition hover:text-violet-400"
      >
        {isPaused ? (
          <Play className="h-3.5 w-3.5" />
        ) : (
          <Pause className="h-3.5 w-3.5" />
        )}
      </button>

      <div className="flex justify-center px-8 pt-4 pb-2">
        <div className="w-full max-w-70">
          <Swiper
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            effect="cards"
            grabCursor
            autoplay={{ delay: 2800, disableOnInteraction: false }}
            loop
            modules={[EffectCards, Autoplay]}
            className="w-full"
          >
            {projects.map((project) => (
              <SwiperSlide
                key={project._id}
                className="group cursor-pointer rounded-xl overflow-hidden border border-(--color-active-border) bg-(--color-bg)"
                onClick={() => handleSlideClick(project)}
              >
                {/* Image */}
                <div className="relative h-52 w-full overflow-hidden bg-(--color-active-bg)">
                  {project.images?.[0] ? (
                    <Image
                      src={project.images[0]}
                      alt={project.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Globe className="h-8 w-8 text-(--color-gray) opacity-20" />
                    </div>
                  )}

                  {/* gradient */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

                  {/* type badge */}
                  <span
                    className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur-md ${
                      project.type === "web"
                        ? "bg-violet-600/85 text-white"
                        : "bg-emerald-600/85 text-white"
                    }`}
                  >
                    {project.type === "web" ? (
                      <div className="flex items-center gap-x-1">
                        <Globe className="h-2.5 w-2.5" />
                        <span>Web</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-x-1">
                        <Smartphone className="h-2.5 w-2.5" />
                        <span>App</span>
                      </div>
                    )}
                  </span>

                  {/* title over image */}
                  <p className="absolute bottom-2 left-3 right-3 truncate text-sm font-semibold text-white">
                    {project.title}
                  </p>

                  {/* hover hint */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <span className="rounded-xl bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                      Tap for details
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2 p-3">
                  <p className="line-clamp-2 text-[11px] leading-relaxed text-(--color-gray)">
                    {project.description}
                  </p>

                  {/* FIX 3: Technologies — image div থেকে বের করে এখানে রাখা হয়েছে */}
                  {project.technologies?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.technologies.slice(0, 3).map((tech) => (
                        <span
                          key={tech}
                          className="rounded-md border border-(--color-active-border) bg-(--color-active-bg) px-1.5 py-0.5 text-[9px] font-medium text-(--color-gray)"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.technologies.length > 3 && (
                        <span className="rounded-md border border-(--color-active-border) bg-(--color-active-bg) px-1.5 py-0.5 text-[9px] font-medium text-(--color-gray)">
                          +{project.technologies.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Links */}
                  <div
                    className="flex items-center gap-1.5 pt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {project.githubLink && (
                      <Link
                        href={project.githubLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-(--color-active-border) bg-(--color-active-bg) px-2 py-1 text-[10px] font-medium text-(--color-text)"
                      >
                        <BsGithub className="h-2.5 w-2.5" />
                        GitHub
                      </Link>
                    )}
                    {project.liveLink && (
                      <Link
                        href={project.liveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-(--color-active-border) bg-(--color-active-bg) px-2 py-1 text-[10px] font-medium text-(--color-text)"
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                        Live
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSlideClick(project)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-(--color-text) px-3 py-1.5 text-xs font-medium text-(--color-bg)"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span className="bangla">Details</span>
                    </button>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
};

export default memo(ProjectSliderMobile);
