import { useEffect, useState } from "react";
import { useTheme } from "@/src/providers/ThemeProvider";
import { RandomizedTextEffect } from "@/src/ui/text-randomized";

const AutoType = () => {
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const { theme, mounted } = useTheme();
  const titles = ["Developer.", "Designer."];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTitleIndex((prev) => (prev + 1) % titles.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [titles.length]);

  return (
    <div>
      <h1
        className={`relative z-10 leading-tight ${
          !mounted
            ? "text-[#0C0D12]"
            : theme === "dark"
              ? "text-[#a8e6cf]"
              : "text-[#0C0D12]"
        }`}
      >
        <RandomizedTextEffect text={titles[currentTitleIndex]} />
      </h1>
    </div>
  );
};

export default AutoType;
