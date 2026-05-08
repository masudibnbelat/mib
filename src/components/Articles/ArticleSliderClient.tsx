// src/components/Articles/ArticleSliderClient.tsx

"use client";

import { useRef, useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { Inbox } from "lucide-react";
import "swiper/css";
import "swiper/css/effect-fade";
import { Autoplay, EffectFade } from "swiper/modules";

const AUTOPLAY_DELAY = 5000;
const padded = (n: number) => String(n).padStart(2, "0");

interface TopicData {
  _id: string;
  title: string;
  img: string;
}

interface Props {
  topics: TopicData[];
}

export default function ArticleSliderClient({ topics }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);

  if (!topics.length) {
    return (
      <section className="mt-20 w-full">
        <div className="flex aspect-16/6 w-full flex-col items-center justify-center gap-3 rounded border border-(--color-active-border) bg-(--color-active-bg)">
          <Inbox className="h-8 w-8 text-(--color-gray)" />
          <p className="text-sm text-(--color-gray)">কোনো টপিক পাওয়া যায়নি</p>
        </div>
      </section>
    );
  }

  const total = topics.length;

  return (
    <section className="mt-20 w-full">
      <div className="relative w-full overflow-hidden rounded">
        <Swiper
          modules={[Autoplay, EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          slidesPerView={1}
          loop
          speed={800} // Smooth transition
          autoplay={{ delay: AUTOPLAY_DELAY, disableOnInteraction: false }}
          onSwiper={(s) => (swiperRef.current = s)}
          onSlideChange={(s) => {
            setActiveIndex(s.realIndex);
            setProgress(0);
          }}
          onAutoplayTimeLeft={(_, __, pct) => setProgress((1 - pct) * 100)}
          className="w-full"
        >
          {topics.map((topic, i) => (
            <SwiperSlide key={topic._id}>
              <div className="relative aspect-16/8 w-full sm:aspect-16/6 lg:aspect-12/4">
                <Image
                  src={topic.img}
                  alt={topic.title}
                  fill
                  sizes="100vw"
                  className="object-cover object-center"
                  priority={i === 0}
                  loading={i === 0 ? "eager" : "lazy"}
                />
                {/* Fix: bg-linear-to-t (typo ছিল bg-liniear-to-t) */}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-black/10" />

                <div className="absolute inset-x-0 bottom-0 flex flex-col px-6 pb-10 items-end sm:px-12 sm:pb-12 lg:px-20 lg:pb-14">
                  <AnimatePresence mode="wait">
                    {activeIndex === i && (
                      <motion.h2
                        key={topic._id}
                        initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="max-w-3xl text-2xl font-bold leading-tight tracking-tight text-white drop-shadow-lg sm:text-3xl lg:text-4xl xl:text-5xl bangla"
                      >
                        {topic.title}
                      </motion.h2>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Counter */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/35 px-3 py-1 text-[12px] font-semibold tabular-nums text-white backdrop-blur-sm"
          >
            {padded(activeIndex + 1)} / {padded(total)}
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
          {topics.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => swiperRef.current?.slideToLoop(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                i === activeIndex
                  ? "w-8 bg-white"
                  : "w-1.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>

        {/* Progress */}
        <div className="absolute bottom-0 left-0 right-0 z-10 h-0.5 bg-white/10">
          <motion.div
            className="h-full bg-white/80"
            style={{ width: `${progress}%` }}
            transition={{ ease: "linear", duration: 0.1 }}
          />
        </div>
      </div>
    </section>
  );
}
