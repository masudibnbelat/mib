import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { TypewriterText } from "./TypewriterText";
import axios from "axios";
import { useTheme } from "@/src/providers/ThemeProvider";

interface Command {
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

  const {
    data: commands,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["commands"],
    queryFn: async () =>
      (await axios.get<{ commands: Command[] }>("/commands.json")).data
        .commands,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const currentCommand = useMemo(
    () => commands?.[commandIndex % (commands?.length || 1)],
    [commands, commandIndex],
  );

  useEffect(() => {
    if (!commands?.length || state !== "fading") return;
    const timer = setTimeout(() => {
      setCommandIndex((prev) => (prev + 1) % commands.length);
      setState("typing-command");
    }, CONFIG.FADE * 1000);
    return () => clearTimeout(timer);
  }, [commands, state]);

  const transitions = {
    command: () => {
      setState("typing-result");
      setTimeout(() => setState("typing-result"), 200);
    },
    result: () => {
      setState("displaying");
      setTimeout(() => setState("fading"), CONFIG.DISPLAY_TIME);
    },
  };

  if (isLoading)
    return (
      <div className={`${styles.bg} rounded-lg border ${styles.border} p-4`}>
        <p className={`${styles.loading} font-mono`}>Loading terminal...</p>
      </div>
    );

  if (error)
    return (
      <div className={`${styles.bg} rounded-lg border ${styles.border} p-4`}>
        <p className={`${styles.error} font-mono`}>Error: {error.message}</p>
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className={`${styles.bg} rounded-lg border ${styles.border} overflow-hidden`}
    >
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
              className={`w-3 h-3 rounded-full ${color} cursor-pointer`}
            />
          ))}
        </div>
      </div>

      <div className={`p-4 ${styles.text} font-mono text-sm min-h-80`}>
        <AnimatePresence mode="wait">
          {currentCommand && state !== "fading" && (
            <motion.div
              key={commandIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: CONFIG.FADE }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <span className={styles.prompt}>➜</span>
                <span className={styles.result}>~</span>
                {state === "typing-command" ? (
                  <>
                    <TypewriterText
                      text={currentCommand.command}
                      delay={CONFIG.COMMAND_DELAY}
                      onComplete={transitions.command}
                      className={styles.prompt}
                    />
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: CONFIG.BLINK, repeat: Infinity }}
                      className={`inline-block w-2 h-5 ml-1 ${styles.cursor}`}
                    />
                  </>
                ) : (
                  <span className={styles.prompt}>
                    {currentCommand.command}
                  </span>
                )}
              </div>

              {state !== "typing-command" && currentCommand.result && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`${styles.result} whitespace-pre-wrap pl-6 leading-relaxed`}
                >
                  {state === "typing-result" ? (
                    <>
                      <TypewriterText
                        text={currentCommand.result}
                        delay={CONFIG.RESULT_DELAY}
                        onComplete={transitions.result}
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
                    </>
                  ) : (
                    currentCommand.result
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Terminal;
