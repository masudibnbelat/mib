import { useEffect, useState, useCallback, useRef } from "react";

const lettersAndSymbols = "abcdefghijklmnopqrstuvwxyz!@#$%^&*-_+=;:<>,";

interface AnimatedTextProps {
  text: string;
}

export function RandomizedTextEffect({ text }: AnimatedTextProps) {
  const [animatedText, setAnimatedText] = useState("");
  const frameRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getRandomChar = useCallback(
    () =>
      lettersAndSymbols[Math.floor(Math.random() * lettersAndSymbols.length)],
    [],
  );

  const stopAnimation = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const animate = useCallback(() => {
    const start = Date.now();
    const initialRandomDuration = 300;
    const revealDuration = 80;

    let phase = "random";
    let i = 0;

    const generateRandom = () =>
      text
        .split("")
        .map(() => getRandomChar())
        .join("");

    const step = () => {
      const now = Date.now();

      if (phase === "random") {
        setAnimatedText(generateRandom());

        if (now - start > initialRandomDuration) {
          phase = "reveal";
        }

        frameRef.current = requestAnimationFrame(step);
        return;
      }

      // reveal phase
      if (i < text.length) {
        setAnimatedText((prev) => {
          const base = text.slice(0, i + 1);
          const rest = prev
            .slice(i + 1)
            .split("")
            .map(() => getRandomChar())
            .join("");

          return base + rest;
        });

        i++;

        timeoutRef.current = setTimeout(() => {
          frameRef.current = requestAnimationFrame(step);
        }, revealDuration);

        return;
      }
    };

    step();
  }, [text, getRandomChar]);

  useEffect(() => {
    stopAnimation();
    animate();

    return () => stopAnimation();
  }, [text, animate]);

  return <div className="relative inline-block">{animatedText}</div>;
}
