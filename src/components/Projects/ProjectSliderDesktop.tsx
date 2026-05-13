"use client";

import { memo, useRef, useCallback, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { EffectCoverflow, Autoplay } from "swiper/modules";
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

const ProjectSliderDesktop = ({ projects, onOpen }: Props) => {
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
    <div className="relative w-full py-4">
      {/* Play/Pause button */}
      <button
        type="button"
        onClick={toggleAutoplay}
        title={isPaused ? "Resume autoplay" : "Pause autoplay"}
        className="absolute right-4 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-(--color-active-border) bg-(--color-bg) text-(--color-gray) transition hover:text-violet-400"
      >
        {isPaused ? (
          <Play className="h-3.5 w-3.5" />
        ) : (
          <Pause className="h-3.5 w-3.5" />
        )}
      </button>

      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        effect="coverflow"
        grabCursor
        centeredSlides
        slidesPerView="auto"
        coverflowEffect={{
          rotate: 40,
          stretch: 0,
          depth: 120,
          modifier: 1.2,
          slideShadows: false,
        }}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        loop={true}
        modules={[EffectCoverflow, Autoplay]}
        style={
          {
            paddingBottom: "2.5rem",
            "--swiper-pagination-color": "#7c3aed",
            "--swiper-pagination-bullet-inactive-color": "#4c1d95",
          } as React.CSSProperties
        }
      >
        {projects.map((project) => (
          <SwiperSlide
            key={project._id}
            style={{ width: "320px" }}
            className="group cursor-pointer rounded-2xl overflow-hidden border border-(--color-active-border) bg-(--color-bg) transition-all duration-300 hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-600/10"
            onClick={() => handleSlideClick(project)}
          >
            {/* Image */}
            <div className="relative h-44 w-full overflow-hidden bg-(--color-active-bg)">
              {project.images?.[0] ? (
                <Image
                  src={project.images[0]}
                  alt={project.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Globe className="h-10 w-10 text-(--color-gray) opacity-20" />
                </div>
              )}

              {/* type badge */}
              <span
                className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium backdrop-blur-md ${
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

              {/* hover hint */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <span className="rounded-xl bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                  Click to view details
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2.5 p-4">
              <h3 className="truncate text-sm lg:text-md font-semibold text-(--color-text)">
                {project.title}
              </h3>

              {project.technologies?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {project.technologies.slice(0, 4).map((tech) => (
                    <span
                      key={tech}
                      className="rounded-md border border-(--color-active-border) bg-(--color-active-bg) px-2 py-0.5 text-[10px] font-medium text-(--color-gray)"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.technologies.length > 4 && (
                    <span className="rounded-md border border-(--color-active-border) bg-(--color-active-bg) px-2 py-0.5 text-[10px] font-medium text-(--color-gray)">
                      +{project.technologies.length - 4}
                    </span>
                  )}
                </div>
              )}

              <p className="line-clamp-2 text-xs leading-relaxed text-(--color-gray)">
                {project.description}
              </p>

              {/* Links — stop propagation so click doesn't open modal */}
              <div
                className="flex justify-around items-center gap-2 pt-1"
                onClick={(e) => e.stopPropagation()}
              >
                {project.githubLink && (
                  <Link
                    href={project.githubLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-(--color-active-border) bg-(--color-active-bg) px-2.5 py-1.5 text-[11px] font-medium text-(--color-text) transition-colors hover:border-violet-500/40"
                  >
                    <BsGithub className="h-3 w-3" />
                    GitHub
                  </Link>
                )}

                {project.liveLink && (
                  <Link
                    href={project.liveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-(--color-active-border) bg-(--color-active-bg) px-2.5 py-1.5 text-[11px] font-medium text-(--color-text) transition-colors hover:border-violet-500/40"
                  >
                    <ExternalLink className="h-3 w-3" />
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
  );
};

export default memo(ProjectSliderDesktop);
