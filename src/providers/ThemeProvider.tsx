"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  type FC,
} from "react";
import { motion, AnimatePresence } from "motion/react";

type Theme = "light" | "dark";
type Corner = "top-right" | "top-left" | "bottom-right" | "bottom-left";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ANIMATION_CORNER: Corner = "bottom-left";
const THEME_STORAGE_KEY = "theme";

const CLIP_PATHS: Record<Corner, { from: string; to: string }> = {
  "top-right": { from: "circle(0% at 100% 0%)", to: "circle(150% at 100% 0%)" },
  "top-left": { from: "circle(0% at 0% 0%)", to: "circle(150% at 0% 0%)" },
  "bottom-right": {
    from: "circle(0% at 100% 100%)",
    to: "circle(150% at 100% 100%)",
  },
  "bottom-left": {
    from: "circle(0% at 0% 100%)",
    to: "circle(150% at 0% 100%)",
  },
} as const;

const CORNER_STYLES: Record<Corner, Record<string, number>> = {
  "top-right": { top: -250, right: -250 },
  "top-left": { top: -250, left: -250 },
  "bottom-right": { bottom: -250, right: -250 },
  "bottom-left": { bottom: -250, left: -250 },
} as const;

const THEME_COLORS: Record<
  Theme,
  { bg: string; glow: string; particle: string }
> = {
  dark: {
    bg: "#0C0D12",
    glow: "rgba(59,130,246,0.3)",
    particle: "rgba(59,130,246,0.7)",
  },
  light: {
    bg: "#E9EBED",
    glow: "rgba(168,85,247,0.3)",
    particle: "rgba(168,85,247,0.7)",
  },
} as const;

// Get theme from localStorage or return default
const getInitialTheme = (): Theme => {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
  } catch (error) {
    console.error("Error reading theme from localStorage:", error);
  }
  return "dark"; // Default theme
};

// Save theme to localStorage
const saveTheme = (theme: Theme): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.error("Error saving theme to localStorage:", error);
  }
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}

export const ThemeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    return getInitialTheme();
  });

  const [isAnimating, setIsAnimating] = useState(false);
  const [nextTheme, setNextTheme] = useState<Theme>(theme);

  // Apply theme to body className
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme: Theme = theme === "light" ? "dark" : "light";
    setNextTheme(newTheme);
    setIsAnimating(true);

    // Save to localStorage immediately
    saveTheme(newTheme);

    setTimeout(() => setTheme(newTheme), 200);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const colors = THEME_COLORS[nextTheme];
  const clipPath = CLIP_PATHS[ANIMATION_CORNER];
  const cornerStyle = CORNER_STYLES[ANIMATION_CORNER];

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
      <AnimatePresence mode="wait">
        {isAnimating && (
          <>
            <motion.div
              className="fixed inset-0 pointer-events-none z-40"
              initial={{ clipPath: clipPath.from }}
              animate={{ clipPath: clipPath.to }}
              transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              style={{ backgroundColor: colors.bg }}
            />
            <motion.div
              className="fixed pointer-events-none z-40"
              style={{
                width: 500,
                height: 500,
                ...cornerStyle,
                background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
                filter: "blur(60px)",
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 0.8, 0], scale: [0.8, 1.5, 2] }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
            {Array.from({ length: 8 }, (_, i) => (
              <motion.div
                key={i}
                className="fixed pointer-events-none z-39"
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  ...Object.fromEntries(
                    Object.entries(cornerStyle).map(([k, v]) => [k, v + 250]),
                  ),
                  background: colors.particle,
                  boxShadow: `0 0 15px ${colors.particle.replace(
                    "0.7",
                    "0.5",
                  )}`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.2, 0],
                  x: Math.cos((i / 8) * Math.PI * 2) * 180,
                  y: Math.sin((i / 8) * Math.PI * 2) * 180,
                }}
                transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.02 }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </ThemeContext.Provider>
  );
};
