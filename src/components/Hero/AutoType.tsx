// src/components/Hero/AutoType.tsx
"use client";

import { useEffect, useState } from "react";
import RandomizedTextEffect from "@/src/ui/text-randomized";
import { useTheme } from "@/src/providers/ThemeProvider";
import { AnimatePresence, motion } from "motion/react";

const titles = ["Developer.", "Designer."];

const AutoType = () => {
  const [index, setIndex] = useState(0);
  const { theme, mounted } = useTheme();

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % titles.length);
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-[1.2em] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={titles[index]}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{
            duration: 0.35,
            ease: "easeOut",
          }}
          className={`absolute inset-0 leading-tight ${
            !mounted
              ? "text-[#0C0D12]"
              : theme === "dark"
                ? "text-[#a8e6cf]"
                : "text-[#0C0D12]"
          }`}
        >
          <RandomizedTextEffect text={titles[index]} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AutoType;
