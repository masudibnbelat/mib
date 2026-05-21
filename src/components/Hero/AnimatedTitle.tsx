// src/components/Hero/AnimatedTitle.tsx
"use client";

import React from "react";
import { motion } from "motion/react";
import { Fan } from "lucide-react";
import AutoType from "./AutoType";

export const AnimatedTitle = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.7,
        ease: "easeOut",
      }}
      className="space-y-5"
    >
      {/* top badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-2 text-(--color-text) audiowide"
      >
        <Fan className="w-5 h-5 animate-spin" />

        <span className="text-sm font-medium tracking-wide">Full-Stack</span>
      </motion.div>

      {/* title */}
      <div className="text-5xl leading-none lg:text-7xl font-bold audiowide">
        <div>Web</div>

        <AutoType />
      </div>

      {/* desc */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 max-w-xl text-base lg:text-lg text-(--color-text-secondary) rubik-regular leading-relaxed"
      >
        Transforming creative ideas into elegant, high-performance applications
        with modern web technologies and clean code.
      </motion.p>
    </motion.div>
  );
};
