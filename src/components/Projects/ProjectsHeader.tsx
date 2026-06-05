// src/components/Projects/ProjectsHeader.tsx

"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import fallbackImg from "@/public/assets/projects.webp";
import type { Project } from "@/src/types/project";

const DELAY = 2500;

type Slide = { src: string | StaticImageData; title: string };

interface Props {
  projects: Project[];
}

const ProjectsHeader = ({ projects }: Props) => {
  const slides: Slide[] =
    projects
      .filter((p) => p.images?.length > 0)
      .map((p) => ({
        src: p.images[0],
        title: p.title,
      })).length > 0
      ? projects.map((p) => ({ src: p.images[0], title: p.title }))
      : [{ src: fallbackImg, title: "Projects" }];

  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (index: number) => {
    setActive(index);
    // dot click করলে timer reset
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, DELAY);
  };

  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, DELAY);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length]);

  return (
    <div className="relative  left-1/2 -translate-x-1/2 mt-20 overflow-hidden h-52 md:h-125">
      {/* Slides */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === active
              ? "opacity-100 z-10"
              : "opacity-0 z-0 pointer-events-none"
          }`}
        >
          <Image
            src={slide.src}
            alt={slide.title}
            fill
            sizes="100dvw"
            priority={i === 0}
            loading={i === 0 ? "eager" : "lazy"}
            className="object-cover object-center rounded"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-black/10" />
        </div>
      ))}

      {/* Title */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-5 md:p-6">
        <AnimatePresence mode="wait">
          <motion.p
            key={slides[active]?.title ?? active}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className="truncate text-right text-2xl lg:text-4xl font-bold text-white"
          >
            {slides[active]?.title}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`rounded-full transition-all ${
                active === i ? "h-2.5 w-6 bg-white" : "h-2.5 w-2.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsHeader;
