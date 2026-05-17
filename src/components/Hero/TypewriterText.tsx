import React, { useState, useEffect } from "react";

interface TypewriterTextProps {
  text: string;
  delay?: number;
  onComplete?: () => void;
  onCharacter?: () => void;
  className?: string;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  delay = 100,
  onComplete,
  onCharacter,
  className = "",
}) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayText("");
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
        onCharacter?.();
      }, delay);
      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && currentIndex > 0 && onComplete) {
      onComplete();
    }
  }, [currentIndex, delay, text, onComplete, onCharacter]);

  return <span className={className}>{displayText}</span>;
};
