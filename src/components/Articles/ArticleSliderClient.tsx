"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Inbox } from "lucide-react";

const DELAY = 5000;
const padded = (n: number) => String(n).padStart(2, "0");

const BLUR_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoH BwYIDAoMCwsKCwsNCxAQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/wAARC AACAAMBEQACEQEDEQH/xAAoAAEBAAAAAAAAAAAAAAAAAAAACQEBAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhADEAAAAXSgD//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEABj8Cf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8hf//aAAwDAQACAAMAAAAQA//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Qf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Qf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8Qf//Z";

interface TopicData {
  _id: string;
  title: string;
  img: string;
}

export default function ArticleSliderClient({
  topics,
}: {
  topics: TopicData[];
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (topics.length <= 1) return;
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % topics.length);
    }, DELAY);
    return () => clearInterval(id);
  }, [topics.length]);

  if (!topics.length) {
    return (
      <section className="mt-20 w-full">
        <div className="flex aspect-16/6 w-full flex-col items-center justify-center gap-3 rounded border border-(--color-active-border) bg-(--color-active-bg)">
          <Inbox className="h-8 w-8 text-(--color-gray)" />
          <p className="text-sm text-(--color-gray) bangla">
            কোনো টপিক পাওয়া যায়নি
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-20 w-full">
      <div className="relative w-full overflow-hidden rounded">
        <div className="relative aspect-16/8 w-full lg:aspect-5/2">
          {topics.map((topic, i) => (
            <div
              key={topic._id}
              className={`absolute inset-0 transition-opacity duration-700 ${
                i === active
                  ? "opacity-100 z-10"
                  : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <Image
                src={topic.img}
                alt={topic.title}
                fill
                sizes="100vw"
                quality={60}
                placeholder="blur"
                blurDataURL={BLUR_URL}
                className="object-cover object-center"
                priority={i === 0}
                loading={i === 0 ? "eager" : "lazy"}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-black/10" />
              <div className="absolute inset-x-0 bottom-0 flex flex-col px-6 pb-10 items-end sm:px-12 sm:pb-12 lg:px-20 lg:pb-14">
                <h2 className="max-w-3xl text-2xl font-bold leading-tight tracking-tight text-white drop-shadow-lg sm:text-3xl lg:text-4xl xl:text-5xl bangla">
                  {topic.title}
                </h2>
              </div>
            </div>
          ))}
        </div>

        <div className="absolute right-4 top-4 z-20 rounded-full bg-black/35 px-3 py-1 text-[12px] font-semibold tabular-nums text-white backdrop-blur-sm">
          {padded(active + 1)} / {padded(topics.length)}
        </div>

        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {topics.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active
                  ? "w-8 bg-white"
                  : "w-1.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
