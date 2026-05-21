"use client";

import { motion } from "motion/react";
import { Send } from "lucide-react";
import { FaFacebook } from "react-icons/fa";
import { BsGithub } from "react-icons/bs";

const socials = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/masudibnbelat",
    icon: FaFacebook,
  },

  {
    name: "Telegram",
    href: "https://t.me/mrprofessor666",
    icon: Send,
  },
  {
    name: "Github",
    href: "https://github.com/fenrirqutrub",
    icon: BsGithub,
  },
];

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const item = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.8,
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
    },
  },
};

const SocialMedia = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-wrap items-center justify-center gap-6 lg:gap-5"
      >
        {socials.map((social) => {
          const Icon = social.icon;

          return (
            <motion.a
              key={social.name}
              variants={item}
              whileHover={{
                y: -6,
                scale: 1.08,
              }}
              whileTap={{
                scale: 0.95,
              }}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded border
                border-(--color-active-border) bg-(--color-active-bg)
                p-1.5 transition-all duration-300 hover:border-(--color-text)
              "
            >
              {/* glow */}
              <span
                className="
                  absolute inset-0
                  opacity-0 blur-2xl
                  transition-opacity duration-300
                  group-hover:opacity-100
                  bg-(--color-active-bg)
                "
              />

              <div className="relative flex items-center justify-center">
                <Icon
                  size={18}
                  className="
                    text-(--color-gray)
                    transition-all duration-300
                    group-hover:text-(--color-text)
                  "
                />
              </div>
            </motion.a>
          );
        })}
      </motion.div>
    </div>
  );
};

export default SocialMedia;
