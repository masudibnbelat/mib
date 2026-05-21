import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { ChevronRight } from "lucide-react";
import { TypewriterText } from "./TypewriterText";
import { useTheme } from "@/src/providers/ThemeProvider";
import { Command, COMMANDS } from "@/src/data/commands";

const THEME_STYLES = {
  dark: {
    bg: "bg-[#0C0D12]",
    border: "border-gray-800",
    text: "text-white",
    prompt: "text-green-400",
    result: "text-gray-300",
    loading: "text-gray-400",
    error: "text-red-400",
    cursor: "bg-white",
  },
  light: {
    bg: "bg-[#E9EBED]",
    border: "border-gray-300",
    text: "text-gray-900",
    prompt: "text-emerald-600",
    result: "text-gray-700",
    loading: "text-gray-600",
    error: "text-red-600",
    cursor: "bg-gray-900",
  },
} as const;

const CONFIG = {
  COMMAND_DELAY: 24,
  RESULT_DELAY: 12,
  DISPLAY_TIME: 1600,
  FADE_TIME: 220,
  MAX_HISTORY: 6,
} as const;

type TerminalState =
  | "typing-command"
  | "typing-result"
  | "displaying"
  | "fading";

const Terminal: React.FC = () => {
  const { theme } = useTheme();
  const styles = useMemo(
    () => THEME_STYLES[theme] || THEME_STYLES.dark,
    [theme],
  );

  const [state, setState] = useState<TerminalState>("typing-command");
  const [commandIndex, setCommandIndex] = useState(0);
  const [completedCommands, setCompletedCommands] = useState<Command[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollRafRef = useRef<number | null>(null);
  const displayTimerRef = useRef<number | null>(null);
  const fadeTimerRef = useRef<number | null>(null);

  const currentCommand = COMMANDS[commandIndex % COMMANDS.length];

  const scrollToBottom = useCallback(() => {
    if (scrollRafRef.current !== null) return;

    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const el = scrollRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }, []);

  const clearTimers = useCallback(() => {
    if (displayTimerRef.current) {
      window.clearTimeout(displayTimerRef.current);
      displayTimerRef.current = null;
    }
    if (fadeTimerRef.current) {
      window.clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
      if (scrollRafRef.current) {
        cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, [clearTimers]);

  useEffect(() => {
    scrollToBottom();
  }, [completedCommands, state, scrollToBottom]);

  const currentCommandRef = useRef(currentCommand);
  useEffect(() => {
    currentCommandRef.current = currentCommand;
  }, [currentCommand]);

  const handleCommandComplete = useCallback(() => {
    const cmd = currentCommandRef.current;
    if (cmd.result) {
      setState("typing-result");
    } else {
      setState("displaying");
      clearTimers();
      displayTimerRef.current = window.setTimeout(() => {
        setState("fading");
      }, CONFIG.DISPLAY_TIME);
    }
  }, [clearTimers]);

  const handleResultComplete = useCallback(() => {
    setState("displaying");
    clearTimers();

    displayTimerRef.current = window.setTimeout(() => {
      setState("fading");
    }, CONFIG.DISPLAY_TIME);
  }, [clearTimers]);

  useEffect(() => {
    if (state !== "fading") return;

    clearTimers();

    fadeTimerRef.current = window.setTimeout(() => {
      setCompletedCommands((prev) =>
        [...prev, currentCommand].slice(-CONFIG.MAX_HISTORY),
      );
      setCommandIndex((prev) => (prev + 1) % COMMANDS.length);
      setState("typing-command");
    }, CONFIG.FADE_TIME);

    return clearTimers;
  }, [state, currentCommand, clearTimers]);

  if (!COMMANDS.length) return null;

  return (
    <div
      className={`${styles.bg} rounded-lg border ${styles.border} overflow-hidden`}
    >
      {/* Title bar */}
      <div
        className={`flex items-center gap-2 px-4 py-3 border-b ${styles.border}`}
      >
        <div className="flex-1 text-center">
          <span
            className={`flex justify-center items-center ${styles.loading} font-mono text-sm`}
          >
            <ChevronRight className="w-4 h-4" />
            <span className="ml-1">terminal</span>
          </span>
        </div>

        <div className="flex gap-2">
          {["bg-red-500", "bg-yellow-500", "bg-green-500"].map((color, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${color} opacity-90`}
            />
          ))}
        </div>
      </div>

      {/* Body */}
      <div
        ref={scrollRef}
        className={`p-4 ${styles.text} font-mono text-sm h-80 overflow-y-auto`}
        style={{ scrollbarWidth: "none" }}
      >
        <div className="space-y-4">
          {/* History */}
          {completedCommands.map((cmd, idx) => (
            <div
              key={`${cmd.command}-${idx}`}
              className="space-y-2 opacity-50 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <span className={styles.prompt}>➜</span>
                <span className={styles.result}>~</span>
                <span className={styles.prompt}>{cmd.command}</span>
              </div>

              {cmd.result && (
                <div
                  className={`${styles.result} whitespace-pre-wrap pl-6 leading-relaxed`}
                >
                  {cmd.result}
                </div>
              )}
            </div>
          ))}

          {/* Active command */}
          <div
            className="space-y-2 transition-opacity"
            style={{
              opacity: state === "fading" ? 0 : 1,
              transitionDuration: `${CONFIG.FADE_TIME}ms`,
            }}
          >
            <div className="flex items-center gap-2">
              <span className={styles.prompt}>➜</span>
              <span className={styles.result}>~</span>

              {state === "typing-command" ? (
                <div>
                  <TypewriterText
                    text={currentCommand.command}
                    delay={CONFIG.COMMAND_DELAY}
                    onComplete={handleCommandComplete}
                    onCharacter={scrollToBottom}
                    className={styles.prompt}
                  />
                  <span
                    className={`inline-block w-2 h-4 ml-1 align-middle animate-pulse ${styles.cursor}`}
                  />
                </div>
              ) : (
                <span className={styles.prompt}>{currentCommand.command}</span>
              )}
            </div>

            {state !== "typing-command" && currentCommand.result && (
              <div
                className={`${styles.result} whitespace-pre-wrap pl-6 leading-relaxed`}
              >
                {state === "typing-result" ? (
                  <div>
                    <TypewriterText
                      text={currentCommand.result}
                      delay={CONFIG.RESULT_DELAY}
                      onComplete={handleResultComplete}
                      onCharacter={scrollToBottom}
                      className={styles.result}
                    />
                    <span
                      className={`inline-block w-2 h-4 ml-1 align-middle animate-pulse ${styles.cursor}`}
                    />
                  </div>
                ) : (
                  currentCommand.result
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terminal;
