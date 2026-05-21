import { servicesData } from "@/src/data/service";
import Image from "next/image";
import "./service.css";

const mid = Math.ceil(servicesData.length / 2);
const firstRow = servicesData.slice(0, mid);
const secondRow = servicesData.slice(mid);

type ReviewCardProps = {
  name: string;
  username: string;
  body: string;
  img: string;
};

function ReviewCard({ name, username, body, img }: ReviewCardProps) {
  return (
    <figure className="mx-2.5 h-37.5 w-70 min-w-70 overflow-hidden rounded-xl border border-(--color-active-border) bg-(--color-bg) p-4 text-(--color-text) md:mx-2 md:h-37.5 md:w-70">
      <div className="mb-2.5 flex items-center gap-2.5">
        <Image
          src={img}
          alt={name}
          width={32}
          height={32}
          loading="lazy"
          decoding="async"
          className="h-8 w-8 shrink-0 rounded-full object-contain"
        />

        <div className="flex min-w-0 flex-col overflow-hidden">
          <figcaption className="truncate text-sm font-semibold leading-[1.2] text-(--color-text)">
            {name}
          </figcaption>
          <p className="truncate text-xs leading-[1.2] text-(--color-gray)">
            {username}
          </p>
        </div>
      </div>

      <blockquote className="text-xs leading-[1.55] text-(--color-text)/85">
        {body}
      </blockquote>
    </figure>
  );
}

function MarqueeRow({
  items,
  reverse = false,
}: {
  items: typeof servicesData;
  reverse?: boolean;
}) {
  return (
    <div className="w-full overflow-hidden">
      <div
        className={`flex w-max will-change-transform ${
          reverse
            ? "animate-[marqueeReverse_35s_linear_infinite]"
            : "animate-[marquee_35s_linear_infinite]"
        }`}
      >
        {[...items, ...items].map((item, i) => (
          <ReviewCard key={`${item.username}-${i}`} {...item} />
        ))}
      </div>
    </div>
  );
}

export default function Services() {
  return (
    <section className="relative flex h-105 w-full flex-col justify-center gap-4 overflow-hidden bg-(--color-bg) text-(--color-text) md:h-125 md:gap-5">
      <MarqueeRow items={firstRow} />
      <MarqueeRow items={secondRow} reverse />
    </section>
  );
}
