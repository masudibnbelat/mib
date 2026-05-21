"use client";
import React from "react";
import Image from "next/image";
import reviewsData from "@/public/services.json";

interface Review {
  img: string;
  name: string;
  username: string;
  body: string;
}

const reviews: Review[] = Array.isArray(reviewsData)
  ? reviewsData
  : (reviewsData as { services: Review[] }).services;

const mid = Math.ceil(reviews.length / 2);
const firstRow = reviews.slice(0, mid);
const secondRow = reviews.slice(mid);

const ReviewCard: React.FC<Review> = ({ img, name, username, body }) => (
  <figure className="relative w-72 md:w-80 h-40 mx-4 cursor-pointer overflow-hidden rounded-xl p-6 bg-(--color-bg) text-(--color-text) border border-(--color-active-border)">
    <div className="flex items-center gap-3 -mt-3">
      <Image
        src={img}
        alt={name}
        width={32}
        height={32}
        className="rounded-full"
      />
      <div className="flex flex-col">
        <figcaption className="text-xs md:text-sm font-medium text-(--color-text)">
          {name}
        </figcaption>
        <p className="text-xs font-medium text-(--color-gray)">{username}</p>
      </div>
    </div>
    <blockquote className="mt-2 text-[11px] leading-relaxed text-justify">
      {body}
    </blockquote>
  </figure>
);

const MarqueeRow: React.FC<{ items: Review[]; reverse?: boolean }> = ({
  items,
  reverse,
}) => (
  <div className="overflow-hidden w-full">
    <div
      style={{
        display: "flex",
        width: "max-content",
        animation: `${reverse ? "marquee-reverse" : "marquee"} 90s linear infinite`,
      }}
    >
      {[...items, ...items].map((review, i) => (
        <div key={`${review.username}-${i}`}>
          <ReviewCard {...review} />
        </div>
      ))}
    </div>
  </div>
);

const Services: React.FC = () => (
  <>
    <style>{`
      @keyframes marquee {
        0%   { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      @keyframes marquee-reverse {
        0%   { transform: translateX(-50%); }
        100% { transform: translateX(0); }
      }
    `}</style>

    <section className="relative flex h-125 w-full flex-col items-center justify-center gap-8 overflow-hidden bg-(--color-bg) text-(--color-text)">
      <MarqueeRow items={firstRow} />
      <MarqueeRow items={secondRow} reverse />
    </section>
  </>
);

export default Services;
