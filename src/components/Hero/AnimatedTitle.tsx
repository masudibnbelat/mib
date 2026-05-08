import React from "react";
import { motion } from "framer-motion";
import { Fan } from "lucide-react";
import AutoType from "./AutoType";
import { useTheme } from "@/src/providers/ThemeProvider";

export const AnimatedTitle: React.FC = () => {
  const { theme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="space-y-3"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`flex items-center gap-2 ${
          theme === "dark" ? "dark-text" : "light-text"
        } `}
      >
        <Fan className="w-5 h-5 animate-spin" />
        <span className="text-sm font-medium font">Full-Stack </span>
      </motion.div>

      <div className={`text-4xl md:text-7xl font-bold  rubik-bold  `}>
        WEB
        <br />
        <AutoType />
      </div>

      <p
        className={`"text-lg ${
          theme === "dark" ? "dark-text" : "light-text"
        } mt-6 max-w-lg rubik-regular`}
      >
        Transforming creative ideas into elegant, high-performance applications
        with modern web technologies and clean code.
      </p>
    </motion.div>
  );
};
