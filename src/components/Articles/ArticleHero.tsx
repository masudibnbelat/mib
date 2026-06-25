// src/components/Articles/ArticleHero.tsx
"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  src: string;
  alt: string;
}

export default function ArticleHero({ src, alt }: Props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full h-[42vh] sm:h-[55vh] overflow-hidden">
      {/* ── Layer 1: Blurred background (covers full area) ── */}
      <Image
        src={src}
        alt=""
        fill
        priority
        quality={30}
        className={`object-cover blur-2xl scale-110 transition-opacity duration-700 ${
          loaded ? "opacity-60" : "opacity-0"
        }`}
        sizes="100vw"
      />

      {/* ── Layer 2: Actual image (full height, natural width, centered) ── */}
      <Image
        src={src}
        alt={alt}
        fill
        priority
        quality={85}
        className={`object-contain transition-all duration-700 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        sizes="100vw"
        onLoad={() => setLoaded(true)}
      />

      {/* ── Layer 3: Gradient overlay ── */}
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-black/10 pointer-events-none" />
    </div>
  );
}
