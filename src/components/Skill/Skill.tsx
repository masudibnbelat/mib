"use client";
import { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useTheme } from "@/src/providers/ThemeProvider";

// Skills Component
interface Skill {
  icon: string;
  name: string;
  level: "Beginner" | "Intermediate" | "Master";
}

interface CategorySection {
  title: string;
  skills: Skill[];
}

const skillsData: CategorySection[] = [
  {
    title: "Languages",
    skills: [
      { icon: "/Service/javascript.svg", name: "JavaScript", level: "Master" },
      {
        icon: "Service/Typescript.svg",
        name: "TypeScript",
        level: "Master",
      },
      {
        icon: "Service/python.svg",
        name: "Python",
        level: "Master",
      },
      {
        icon: "Service/go.svg",
        name: "Golang",
        level: "Beginner",
      },
    ],
  },
  {
    title: "Frontend",
    skills: [
      { icon: "/Service/react.svg", name: "React", level: "Master" },
      { icon: "/Service/NextJs.svg", name: "Next.js", level: "Master" },
      { icon: "/Service/tailwind.svg", name: "TailwindCSS", level: "Master" },
      { icon: "/Service/bootstrap.svg", name: "Bootstrap", level: "Master" },
      {
        icon: "/Service/framer-motion.svg",
        name: "Framer Motion",
        level: "Master",
      },
    ],
  },
  {
    title: "Backend",
    skills: [
      { icon: "/Service/node.svg", name: "Node.js", level: "Master" },
      { icon: "/Service/express.svg", name: "Express", level: "Master" },
      { icon: "/Service/NextJs.svg", name: "Next.js", level: "Master" },
      { icon: "/Service/mongoDB.svg", name: "MongoDB", level: "Intermediate" },
      { icon: "/Service/jwt.svg", name: "JWT", level: "Master" },
      {
        icon: "/Service/firebase.svg",
        name: "Firebase",
        level: "Intermediate",
      },
    ],
  },
  {
    title: "Tools",
    skills: [
      { icon: "/Service/git.svg", name: "Git", level: "Master" },
      { icon: "/Service/github.svg", name: "GitHub", level: "Master" },
      { icon: "/Service/vscode.svg", name: "VS Code", level: "Master" },
      { icon: "/Service/zed.png", name: "Zed", level: "Intermediate" },
      { icon: "/Service/NPM.svg", name: "NPM", level: "Master" },
      { icon: "/Service/yarn.svg", name: "Yarn", level: "Master" },
      { icon: "/Service/Bun.svg", name: "Bun", level: "Intermediate" },
      {
        icon: "/Service/linux.svg",
        name: "Linux",
        level: "Master",
      },
      {
        icon: "/Service/archlinux.svg",
        name: "Arch Linux",
        level: "Master",
      },
    ],
  },
  {
    title: "Design",
    skills: [
      { icon: "/Service/figma.svg", name: "Figma", level: "Master" },
      {
        icon: "/Service/Adobe_Photoshop.svg",
        name: "Photoshop",
        level: "Intermediate",
      },
      { icon: "/Service/gimp.svg", name: "GIMP", level: "Intermediate" },
      { icon: "/Service/inkscape.svg", name: "Inkscape", level: "Beginner" },
    ],
  },
  {
    title: "Deployment",
    skills: [
      { icon: "/Service/vercel.svg", name: "Vercel", level: "Master" },
      {
        icon: "/Service/firebase.svg",
        name: "Firebase",
        level: "Intermediate",
      },
      { icon: "/Service/netlify.svg", name: "Netlify", level: "Master" },
      { icon: "/Service/surge.svg", name: "Surge", level: "Master" },
    ],
  },
];

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

// Magnetic Card Component
const MagneticSkillCard = ({
  skill,
  idx,
  isDark,
}: {
  skill: Skill;
  idx: number;
  isDark: boolean;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Motion values for smooth magnetic effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics for smooth follow - stronger magnetic pull
  const springConfig = { damping: 20, stiffness: 300, mass: 0.3 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  // 3D rotation based on mouse position - more dramatic
  const rotateX = useTransform(y, [-1, 1], [15, -15]);
  const rotateY = useTransform(x, [-1, 1], [-15, 15]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate distance from center (-1 to 1)
    const distanceX = (e.clientX - centerX) / (rect.width / 2);
    const distanceY = (e.clientY - centerY) / (rect.height / 2);

    // Stronger magnetic effect - entire card moves
    mouseX.set(distanceX);
    mouseY.set(distanceY);
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
      style={{
        x,
        y,
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className={`group relative rounded-xl p-4 border transition-colors duration-300 cursor-pointer `}
    >
      {/* Animated gradient background on hover */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-linear-to-br from-blue-500/0 via-purple-500/0 to-pink-500/0 pointer-events-none "
        animate={{
          background: isHovered
            ? "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(168, 85, 247, 0.1) 50%, rgba(236, 72, 153, 0.1) 100%)"
            : isDark
              ? "linear-gradient(135deg, rgba(59, 130, 246, 0) 0%, rgba(168, 85, 247, 0) 50%, rgba(236, 72, 153, 0) 100%)"
              : "linear-gradient(135deg, rgba(59, 130, 246, 0) 0%, rgba(168, 85, 247, 0) 50%, rgba(236, 72, 153, 0) 100%)",
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Glow effect on hover */}
      <motion.div
        className="absolute -inset-0.5 rounded-xl opacity-0 blur-md -z-10 "
        style={{
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)",
        }}
        animate={{
          opacity: isHovered ? 0.4 : 0,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Card content - all content moves together */}
      <div className="relative">
        <div className="flex items-center gap-3">
          {/* Icon container */}
          <motion.div
            className={`w-12 h-12 shrink-0 rounded-lg flex items-center justify-center transition-colors ${
              isDark
                ? "bg-[#1C1D27] group-hover:bg-[#222330]"
                : "bg-gray-100 group-hover:bg-gray-200"
            }`}
            animate={{
              scale: isHovered ? 1.1 : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            <motion.img
              src={skill.icon}
              alt={skill.name}
              className="w-8 h-8 object-contain"
              animate={{
                rotate: isHovered ? [0, -10, 10, -10, 10, 0] : 0,
              }}
              transition={{
                duration: 0.6,
                repeat: isHovered ? Infinity : 0,
                repeatDelay: 0.5,
              }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = `<span class="text-xl">${skill.name.charAt(
                    0,
                  )}</span>`;
                }
              }}
            />
          </motion.div>

          <div className="flex-1 min-w-0">
            <h4
              className={`font-medium text-sm truncate ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {skill.name}
            </h4>
            <motion.span
              className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium border ${getLevelColor(
                skill.level,
              )}`}
              animate={{
                scale: isHovered ? 1.05 : 1,
              }}
              transition={{ duration: 0.2 }}
            >
              {skill.level}
            </motion.span>
          </div>
        </div>
      </div>

      {/* Shimmer effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent "
          animate={{
            x: isHovered ? ["-200%", "200%"] : "-200%",
          }}
          transition={{
            duration: 1.2,
            repeat: isHovered ? Infinity : 0,
            ease: "linear",
          }}
        />
      </motion.div>

      {/* Particle effects on corners */}
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
              animate={{
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </>
      )}
    </motion.div>
  );
};

const Skills = () => {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`min-h-screen bg-(-color--bg) text-(--color--text) animate-pulse`}
      >
        <div className="container mx-auto px-4 py-16" />
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <section
      className={`min-h-screen py-16 bg-(-color--bg) text-(--color--text)`}
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

        <div className="space-y-24 mt-10 md:mt-32">
          {skillsData.map((section, sectionIdx) => (
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
                  className={`text-lg font-semibold origin-center mt-10 -rotate-90 whitespace-nowrap ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
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
                    isDark={isDark}
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
