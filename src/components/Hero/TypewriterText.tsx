import { useEffect, useRef } from "react";

interface TypewriterTextProps {
  text: string;
  delay?: number;
  onComplete?: () => void;
  onCharacter?: () => void;
  className?: string;
}

export function TypewriterText({
  text,
  delay = 30,
  onComplete,
  onCharacter,
  className = "",
}: TypewriterTextProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const onCompleteRef = useRef(onComplete);
  const onCharacterRef = useRef(onCharacter);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onCharacterRef.current = onCharacter;
  });

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;

    el.textContent = "";
    let index = 0;
    let timerId: ReturnType<typeof setTimeout>;

    const type = () => {
      if (index < text.length) {
        el.textContent = text.slice(0, ++index);
        onCharacterRef.current?.();
        timerId = setTimeout(type, delay);
      } else {
        onCompleteRef.current?.();
      }
    };

    timerId = setTimeout(type, delay);

    return () => clearTimeout(timerId);
  }, [text, delay]);

  return <span ref={spanRef} className={className} />;
}
