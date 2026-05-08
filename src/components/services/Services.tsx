"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Marquee from "react-fast-marquee";
import Link from "next/link";
import Image from "next/image";

interface Review {
  img: string;
  name: string;
  username: string;
  body: string;
}

const ReviewCard: React.FC<Review> = ({ img, name, username, body }) => {
  return (
    <figure
      className={`relative w-72 md:w-80 h-40 md:h-44 mx-4 cursor-pointer overflow-hidden rounded-xl p-6 my-5 bg-(-color--bg) text-(--color--text) border border-(--active-border-bg) `}
    >
      <div className="flex flex-row items-center gap-3 -mt-3">
        <Image
          src={img}
          alt={`${name}'s profile`}
          width={32}
          height={32}
          className="rounded-full"
        />

        <div className="flex flex-col">
          <figcaption
            className={`text-xs md:text-sm font-medium text-(--color-text) `}
          >
            {name}
          </figcaption>

          <p className="text-xs font-medium text-(--color-text)">@{username}</p>
        </div>
      </div>

      <blockquote className="mt-2 text-xs leading-relaxed">{body}</blockquote>
    </figure>
  );
};

const Services: React.FC = () => {
  const {
    data: reviews = [],
    isLoading,
    error,
  } = useQuery<Review[]>({
    queryKey: ["services"],
    queryFn: async () => {
      const { data } = await axios.get("/services.json");
      return Array.isArray(data) ? data : data.services;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-125 items-center justify-center bg-(-color--bg) text-(--color--text)">
        Loading services...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-125 items-center justify-center bg-black text-red-500">
        Error loading services
      </div>
    );
  }

  const mid = Math.ceil(reviews.length / 2);
  const firstRow = reviews.slice(0, mid);
  const secondRow = reviews.slice(mid);

  return (
    <section className="relative flex h-125 w-full flex-col items-center justify-center gap-8 overflow-hidden bg-(-color--bg) text-(--color--text)">
      <Marquee direction="left" speed={40}>
        <div className="flex">
          {firstRow.map((review, i) => (
            <Link
              key={`${review.username}-${i}`}
              href={`/reviews/${review.username}`}
            >
              <ReviewCard {...review} />
            </Link>
          ))}
        </div>
      </Marquee>

      <Marquee direction="right" speed={40}>
        <div className="flex">
          {secondRow.map((review, i) => (
            <Link
              key={`${review.username}-${i}`}
              href={`/reviews/${review.username}`}
            >
              <ReviewCard {...review} />
            </Link>
          ))}
        </div>
      </Marquee>
    </section>
  );
};

export default Services;
