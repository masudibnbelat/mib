import { useTheme } from "@/src/providers/ThemeProvider";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export const HeroButton = () => {
  const { theme } = useTheme();

  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
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
          className={`group px-6 py-3 rounded ${
            theme === "dark"
              ? "bg-[#171B1F] text-[#F8F9FA] border border-[#F8F9FA]"
              : "bg-[#F8F9FA] text-[#171B1F] border border-[#171B1F]"
          } font-medium flex items-center gap-2 transition-shadow font`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Resume
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </Link>

      <motion.button
        className={`px-6 py-3 rounded ${
          theme === "dark"
            ? "bg-[#F8F9FA] text-[#171B1F]"
            : "bg-[#171B1F] text-[#F8F9FA]"
        }  font-medium transition-colors box-shadow font`}
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
