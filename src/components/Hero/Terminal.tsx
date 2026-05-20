import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { TypewriterText } from "./TypewriterText";
import { useTheme } from "@/src/providers/ThemeProvider";

interface Command {
  command: string;
  result?: string;
}

interface CompletedCommand {
  command: string;
  result?: string;
}

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
  COMMAND_DELAY: 80,
  RESULT_DELAY: 30,
  DISPLAY_TIME: 4000,
  FADE: 0.5,
  BLINK: 0.8,
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
  const [completedCommands, setCompletedCommands] = useState<
    CompletedCommand[]
  >([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    data: commands,
    isLoading,
    error,
  } = useQuery<Command[]>({
    queryKey: ["commands"],
    queryFn: async () => {
      const res = await fetch("/commands.json");
      if (!res.ok) throw new Error("Failed to fetch commands");
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.commands;
      if (!list) throw new Error("Invalid commands format");
      return list;
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const currentCommand = useMemo(
    () => commands?.[commandIndex % (commands?.length || 1)],
    [commands, commandIndex],
  );

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, []);

  // completedCommands change হলে scroll
  useEffect(() => {
    scrollToBottom();
  }, [completedCommands, scrollToBottom]);

  // fading শেষে next command এ যাও
  useEffect(() => {
    if (!commands?.length || state !== "fading") return;
    const timer = setTimeout(() => {
      if (currentCommand) {
        setCompletedCommands((prev) => [...prev, currentCommand]);
      }
      setCommandIndex((prev) => (prev + 1) % commands.length);
      setState("typing-command");
    }, CONFIG.FADE * 1000);
    return () => clearTimeout(timer);
  }, [commands, state, currentCommand]);

  const transitions = {
    command: () => setState("typing-result"),
    result: () => {
      setState("displaying");
      setTimeout(() => setState("fading"), CONFIG.DISPLAY_TIME);
    },
  };

  if (isLoading)
    return (
      <div className={`${styles.bg} rounded-lg border ${styles.border} p-4`}>
        <motion.p
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className={`${styles.loading} font-mono text-sm`}
        >
          Loading terminal...
        </motion.p>
      </div>
    );

  if (error)
    return (
      <div className={`${styles.bg} rounded-lg border ${styles.border} p-4`}>
        <p className={`${styles.error} font-mono text-sm`}>
          Error: {(error as Error).message}
        </p>
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
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
              className={`w-3 h-3 rounded-full ${color} cursor-pointer hover:opacity-80 transition-opacity`}
            />
          ))}
        </div>
      </div>

      {/* Terminal body */}
      <div
        ref={scrollRef}
        className={`p-4 ${styles.text} font-mono text-sm h-80 overflow-y-auto`}
        style={{ scrollbarWidth: "none" }}
      >
        <div className="space-y-4">
          {/* Completed commands — dim */}
          {completedCommands.map((cmd, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 1 }}
              animate={{ opacity: 0.45 }}
              transition={{ duration: 0.4 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <span className={styles.prompt}>➜</span>
                <span className={styles.result}>~</span>
                <span className={styles.prompt}>{cmd.command}</span>
              </div>
              {cmd.result && (
                <div
                  className={`${styles.result} whitespace-pre-wrap pl-6 leading-relaxed `}
                >
                  {cmd.result}
                </div>
              )}
            </motion.div>
          ))}

          {/* Current active command */}
          <AnimatePresence mode="wait">
            {currentCommand && (
              <motion.div
                key={commandIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: state === "fading" ? 0 : 1 }}
                transition={{ duration: CONFIG.FADE }}
                className="space-y-2"
              >
                {/* Command line */}
                <div className="flex items-center gap-2">
                  <span className={styles.prompt}>➜</span>
                  <span className={styles.result}>~</span>

                  {state === "typing-command" ? (
                    <div>
                      <TypewriterText
                        text={currentCommand.command}
                        delay={CONFIG.COMMAND_DELAY}
                        onComplete={transitions.command}
                        onCharacter={scrollToBottom}
                        className={styles.prompt}
                      />
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{
                          duration: CONFIG.BLINK,
                          repeat: Infinity,
                        }}
                        className={`inline-block w-2 h-5 ml-1 ${styles.cursor}`}
                      />
                    </div>
                  ) : (
                    <span className={styles.prompt}>
                      {currentCommand.command}
                    </span>
                  )}
                </div>

                {/* Result */}
                {state !== "typing-command" && currentCommand.result && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`${styles.result} whitespace-pre-wrap pl-6 leading-relaxed`}
                  >
                    {state === "typing-result" ? (
                      <div>
                        <TypewriterText
                          text={currentCommand.result}
                          delay={CONFIG.RESULT_DELAY}
                          onComplete={transitions.result}
                          onCharacter={scrollToBottom}
                          className={styles.result}
                        />
                        <motion.span
                          animate={{ opacity: [1, 0] }}
                          transition={{
                            duration: CONFIG.BLINK,
                            repeat: Infinity,
                          }}
                          className={`inline-block w-2 h-5 ml-1 ${styles.cursor}`}
                        />
                      </div>
                    ) : (
                      currentCommand.result
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default Terminal;
