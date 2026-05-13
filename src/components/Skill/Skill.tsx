"use client";
import { useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface Skill {
  icon: string;
  name: string;
  level: "Beginner" | "Intermediate" | "Master";
}

interface CategorySection {
  title: string;
  skills: Skill[];
}

const getLevelColor = (level: string) => {
  switch (level) {
    case "Master":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "Intermediate":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "Beginner":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

const MagneticSkillCard = ({ skill, idx }: { skill: Skill; idx: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 300, mass: 0.3 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  const rotateX = useTransform(y, [-1, 1], [15, -15]);
  const rotateY = useTransform(x, [-1, 1], [-15, 15]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set((e.clientX - centerX) / (rect.width / 2));
    mouseY.set((e.clientY - centerY) / (rect.height / 2));
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: idx * 0.05,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{ x, y, rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="group relative rounded-xl p-4 border border-(--color-active-border) transition-colors duration-300 cursor-pointer"
    >
      {/* Animated gradient background on hover */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        animate={{
          background: isHovered
            ? "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(168,85,247,0.1) 50%, rgba(236,72,153,0.1) 100%)"
            : "linear-gradient(135deg, rgba(59,130,246,0) 0%, rgba(168,85,247,0) 50%, rgba(236,72,153,0) 100%)",
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Glow */}
      <motion.div
        className="absolute -inset-0.5 rounded-xl blur-md -z-10"
        style={{
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)",
        }}
        animate={{ opacity: isHovered ? 0.4 : 0 }}
        transition={{ duration: 0.3 }}
      />

      <div className="relative">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-12 h-12 shrink-0 rounded-lg flex items-center justify-center bg-(--color-active-bg) transition-colors"
            animate={{ scale: isHovered ? 1.1 : 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.img
              src={skill.icon}
              alt={skill.name}
              className="w-8 h-8 object-contain"
              animate={{ rotate: isHovered ? [0, -10, 10, -10, 10, 0] : 0 }}
              transition={{
                duration: 0.6,
                repeat: isHovered ? Infinity : 0,
                repeatDelay: 0.5,
              }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = `<span class="text-xl text-(--color-text)">${skill.name.charAt(0)}</span>`;
                }
              }}
            />
          </motion.div>

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate text-(--color-text)">
              {skill.name}
            </h4>
            <motion.span
              className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium border ${getLevelColor(skill.level)}`}
              animate={{ scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.2 }}
            >
              {skill.level}
            </motion.span>
          </div>
        </div>
      </div>

      {/* Shimmer */}
      <motion.div
        className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: isHovered ? ["-200%", "200%"] : "-200%" }}
          transition={{
            duration: 1.2,
            repeat: isHovered ? Infinity : 0,
            ease: "linear",
          }}
        />
      </motion.div>

      {/* Corner particles */}
      {isHovered && (
        <>
          {[
            { top: "10%", left: "10%" },
            { top: "10%", right: "10%" },
            { bottom: "10%", left: "10%" },
            { bottom: "10%", right: "10%" },
          ].map((pos, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-blue-400"
              style={pos}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </>
      )}
    </motion.div>
  );
};

// Skeleton card
const SkeletonCard = () => (
  <div className="rounded-xl p-4 border border-(--color-active-border) animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-lg bg-(--color-active-bg)" />
      <div className="flex-1 space-y-2">
        <div className="h-3 rounded bg-(--color-active-bg) w-3/4" />
        <div className="h-4 rounded bg-(--color-active-bg) w-1/3" />
      </div>
    </div>
  </div>
);

const Skills = () => {
  // useQuery — endpoint fix
  const {
    data: skillsData = [],
    isLoading,
    isError,
  } = useQuery<CategorySection[]>({
    queryKey: ["skills"],
    queryFn: async () => {
      const res = await axios.get<CategorySection[]>("/skills.json");
      return res.data;
    },
    staleTime: 1000 * 60 * 10,
  });

  return (
    <section
      className="min-h-screen py-16 bg-(--color-bg) text-(--color-text)"
      style={{ perspective: "1000px" }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="flex items-center gap-3 my-0 md:my-12"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl rubik-bold ml-10 uppercase">
            Skills
          </h2>
        </motion.div>

        {isError && (
          <p className="text-center text-red-400 mt-16">
            Failed to load skills. Please try again.
          </p>
        )}

        <div className="space-y-24 mt-10 md:mt-32">
          {isLoading
            ? Array.from({ length: 3 }).map((_, si) => (
                <div key={si} className="flex flex-row gap-8">
                  <div className="w-8 shrink-0" />
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                </div>
              ))
            : skillsData.map((section, sectionIdx) => (
                <motion.div
                  key={section.title}
                  className="flex flex-row gap-8"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{
                    delay: sectionIdx * 0.1,
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <div className="w-8 shrink-0 flex items-start justify-center">
                    <motion.h3
                      className="text-lg font-semibold origin-center mt-10 -rotate-90 whitespace-nowrap text-(--color-gray)"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: sectionIdx * 0.1 + 0.2 }}
                    >
                      · {section.title}
                    </motion.h3>
                  </div>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {section.skills.map((skill, idx) => (
                      <MagneticSkillCard
                        key={skill.name}
                        skill={skill}
                        idx={idx}
                      />
                    ))}
                  </div>
                </motion.div>
              ))}
        </div>
      </div>
    </section>
  );
};

export default Skills;
