import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export const HeroButton = () => {
  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <motion.div
      className="flex flex-wrap gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
    >
      <Link href="/" target="_blank">
        <motion.button
          className="group px-6 py-3 rounded bg-(--color-bg) text-(--color-text) border border-(--color-text) font-medium flex items-center gap-2 transition-shadow font"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Resume
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </Link>

      <motion.button
        className="px-6 py-3 rounded bg-red-500 text-white font-medium transition-colors box-shadow font"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={scrollToContact}
      >
        Contact Me
      </motion.button>
    </motion.div>
  );
};

export default HeroButton;
