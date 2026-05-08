// src/components/Articles/ArticleSlider.tsx

"use client";
import { useRef, useEffect, useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, TriangleAlert, Inbox } from "lucide-react";
import "swiper/css";
import "swiper/css/effect-fade";
import { Autoplay, EffectFade } from "swiper/modules";
import { axiosSecure } from "@/src/hooks/axiosSecure";

interface Topic {
  _id: string;
  title: string;
  img: string;
  createdAt: string;
}

interface TopicResponse {
  success: boolean;
  data: Topic[];
}

const AUTOPLAY_DELAY = 5000;

const padded = (n: number) => String(n).padStart(2, "0");

/* ────────────────────────────────────────────────────────────── */

const ArticleSlider = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosSecure.get<TopicResponse>("/api/topic");
        if (res.data.success) setTopics(res.data.data ?? []);
        else setError("ডেটা লোড করা যায়নি");
      } catch {
        setError("Server থেকে ডেটা আনতে সমস্যা হয়েছে");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── loading ── */
  if (loading) {
    return (
      <section className="mt-14 w-full">
        <div className="flex aspect-16/7 w-full animate-pulse items-center justify-center rounded-3xl bg-(--color-active-bg) sm:aspect-16/6">
          <Loader2 className="h-8 w-8 animate-spin text-(--color-gray)" />
        </div>
      </section>
    );
  }

  /* ── error ── */
  if (error) {
    return (
      <section className="mt-14 w-full">
        <div className="flex aspect-16/7 w-full flex-col items-center justify-center gap-3 rounded-3xl border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20">
          <TriangleAlert className="h-8 w-8 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </section>
    );
  }

  /* ── empty ── */
  if (!topics.length) {
    return (
      <section className="mt-14 w-full">
        <div className="flex aspect-16/7 w-full flex-col items-center justify-center gap-3 rounded-3xl border border-(--color-active-border) bg-(--color-active-bg)">
          <Inbox className="h-8 w-8 text-(--color-gray)" />
          <p className="text-sm text-(--color-gray)">কোনো টপিক পাওয়া যায়নি</p>
        </div>
      </section>
    );
  }

  const total = topics.length;

  return (
    <section className="mt-20 w-full ">
      {/* ── slider wrapper ── */}
      <div className="relative w-full overflow-hidden rounded">
        <Swiper
          modules={[Autoplay, EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          slidesPerView={1}
          loop
          autoplay={{ delay: AUTOPLAY_DELAY, disableOnInteraction: false }}
          onSwiper={(s) => (swiperRef.current = s)}
          onSlideChange={(s) => {
            setActiveIndex(s.realIndex);
            setProgress(0);
          }}
          onAutoplayTimeLeft={(_, _t, pct) => setProgress((1 - pct) * 100)}
          className="w-full"
        >
          {topics.map((topic) => (
            <SwiperSlide key={topic._id}>
              <div className="relative aspect-16/8 w-full sm:aspect-16/6 lg:aspect-12/4">
                <Image
                  src={topic.img}
                  alt={topic.title}
                  fill
                  sizes="100vw"
                  className="object-cover object-center"
                  priority
                />

                {/* dark gradient */}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-black/10" />

                {/* ── title block ── */}
                <div className="absolute inset-x-0 bottom-0 flex flex-col px-6 pb-10 items-end justify-end sm:px-12 sm:pb-12 lg:px-20 lg:pb-14">
                  <AnimatePresence mode="wait">
                    <motion.h2
                      key={topic._id}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="max-w-3xl text-2xl font-bold leading-tight tracking-tight text-white drop-shadow-lg sm:text-3xl lg:text-4xl xl:text-5xl"
                    >
                      {topic.title}
                    </motion.h2>
                  </AnimatePresence>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* ── counter badge ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.2 }}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/35 px-3 py-1 text-[12px] font-semibold tabular-nums text-white backdrop-blur-sm"
          >
            {padded(activeIndex + 1)} / {padded(total)}
          </motion.div>
        </AnimatePresence>

        {/* ── dot indicators — overlaid on image ── */}
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
          {topics.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => swiperRef.current?.slideToLoop(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? "w-6 bg-white"
                  : "w-1.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>

        {/* ── autoplay progress bar ── */}
        <div className="absolute bottom-0 left-0 right-0 z-10 h-0.75 bg-white/10">
          <motion.div
            className="h-full bg-white/70"
            style={{ width: `${progress}%` }}
            transition={{ ease: "linear" }}
          />
        </div>
      </div>
    </section>
  );
};

export default ArticleSlider;
