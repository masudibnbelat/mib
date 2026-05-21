// src/ui/text-randomized.tsx

"use client";

import { useEffect, useMemo, useState } from "react";

const CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()_+-=[]{}|;:,.<>?";

interface Props {
  text: string;
  duration?: number;
  className?: string;
}

export default function RandomizedTextEffect({
  text,
  duration = 700,
  className = "",
}: Props) {
  const [display, setDisplay] = useState(text);

  const iterations = useMemo(() => {
    return Math.max(text.length * 2, 12);
  }, [text]);

  useEffect(() => {
    let frame = 0;

    const interval = setInterval(() => {
      frame++;

      const progress = frame / iterations;

      const output = text
        .split("")
        .map((char, index) => {
          if (index < progress * text.length) {
            return text[index];
          }

          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join("");

      setDisplay(output);

      if (frame >= iterations) {
        clearInterval(interval);
        setDisplay(text);
      }
    }, duration / iterations);

    return () => clearInterval(interval);
  }, [text, duration, iterations]);

  return (
    <span className={`inline-block will-change-transform ${className}`}>
      {display}
    </span>
  );
}
