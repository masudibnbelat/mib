"use client";

import Image, { type StaticImageData } from "next/image";
import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

import { axiosSecure } from "@/src/hooks/axiosSecure";
import type { ApiResponse, Project } from "@/src/types/project";
import fallbackImg from "@/public/assets/projects.webp";

import "swiper/css";

const STALE_TIME = 1000 * 60 * 10;

type Slide = {
  src: string | StaticImageData;
  title: string;
};

const fetchHeaderProjects = async (): Promise<Project[]> => {
  const res = await axiosSecure.get<ApiResponse>("/api/projects", {
    params: { page: 1, limit: 12 },
  });

  return res.data?.data ?? [];
};

const HeaderSkeleton = () => (
  <div className="relative mt-20 animate-pulse bg-neutral-200 dark:bg-neutral-800 w-dvw max-w-dvw left-1/2 -translate-x-1/2 overflow-hidden h-52 md:h-125" />
);

const ProjectsHeader = () => {
  const swiperRef = useRef<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["projects-header"],
    queryFn: fetchHeaderProjects,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });

  const slides = useMemo<Slide[]>(() => {
    const validSlides = projects
      .filter(
        (project) => Array.isArray(project.images) && project.images.length > 0,
      )
      .map((project) => ({
        src: project.images[0],
        title: project.title,
      }));

    return validSlides.length > 0
      ? validSlides
      : [{ src: fallbackImg, title: "Projects" }];
  }, [projects]);

  if (isLoading) return <HeaderSkeleton />;

  return (
    <div className="relative w-dvw max-w-dvw left-1/2 -translate-x-1/2 group mt-20 overflow-hidden h-52 md:h-125">
      <Swiper
        modules={[Autoplay]}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          setActiveIndex(swiper.realIndex);
        }}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        slidesPerView={1}
        spaceBetween={0}
        speed={900}
        loop={slides.length > 1}
        autoplay={
          slides.length > 1
            ? {
                delay: 2500,
                disableOnInteraction: false,
                pauseOnMouseEnter: false,
              }
            : false
        }
        className="h-full! w-full!"
      >
        {slides.map((slide, index) => (
          <SwiperSlide
            key={`${slide.title}-${index}`}
            className="h-full! w-full!"
          >
            <div className="relative h-full w-full">
              <Image
                src={slide.src}
                alt={slide.title || `Project ${index + 1}`}
                fill
                priority={index === 0}
                sizes="100dvw"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-black/10" />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="pointer-events-none absolute inset-x-0 bottom-0  z-10 p-5 md:p-6">
        <AnimatePresence mode="wait">
          <motion.p
            key={slides[activeIndex]?.title ?? activeIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className="truncate text-right text-2xl lg:text-4xl font-bold text-white "
          >
            {slides[activeIndex]?.title}
          </motion.p>
        </AnimatePresence>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => swiperRef.current?.slideToLoop(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`rounded-full transition-all ${
                activeIndex === index
                  ? "h-2.5 w-6 bg-white"
                  : "h-2.5 w-2.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsHeader;
