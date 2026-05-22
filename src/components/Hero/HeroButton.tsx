import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, Download, Loader2 } from "lucide-react";

const FILE_ID = "1mGJACD7a9BA9OTanbN67kFIc8EZtGoZS";
const PREVIEW_URL = `https://drive.google.com/file/d/${FILE_ID}/preview`;
const DOWNLOAD_URL = `https://drive.google.com/uc?export=download&id=${FILE_ID}`;

export const HeroButton = () => {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const iframe = document.createElement("iframe");
    iframe.src = PREVIEW_URL;
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    return () => {
      document.body.removeChild(iframe);
    };
  }, []);

  // body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDownload = () => {
    if (downloading) return;
    setDownloading(true);
    const a = document.createElement("a");
    a.href = DOWNLOAD_URL;
    a.download = "resume.pdf";
    a.click();
    setTimeout(() => setDownloading(false), 3000);
  };

  return (
    <>
      <motion.div
        className="flex flex-wrap gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <motion.button
          className="group px-6 py-3 rounded bg-(--color-bg) text-(--color-text) border border-(--color-text) font-medium flex items-center gap-2 transition-shadow"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setOpen(true)}
        >
          Resume
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </motion.button>

        <motion.button
          className="px-6 py-3 rounded bg-(--color-text) text-(--color-bg) font-medium transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={scrollToContact}
        >
          Contact Me
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {open && (
          <div>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setOpen(false)}
            />

            {/* Modal — full width, small vertical inset */}
            <motion.div
              className="fixed inset-0 z-50 flex flex-col bg-(--color-bg)"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-(--color-text)/10 shrink-0">
                <span className="font-semibold text-(--color-text) tracking-wide">
                  Resume
                </span>

                <div className="flex items-center gap-3">
                  {/* Download Button */}
                  <motion.button
                    className="relative flex items-center gap-2 px-4 py-1.5 rounded-full bg-(--color-text) text-(--color-bg) text-sm font-medium overflow-hidden"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleDownload}
                    disabled={downloading}
                  >
                    <AnimatePresence mode="wait">
                      {downloading ? (
                        <motion.span
                          key="loading"
                          className="flex items-center gap-2"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Downloading...
                        </motion.span>
                      ) : (
                        <motion.span
                          key="idle"
                          className="flex items-center gap-2"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  {/* Close Button */}
                  <motion.button
                    className="relative flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500 text-(--color-text) text-sm font-medium overflow-hidden"
                    whileHover={{ scale: 1.1, backgroundColor: "#ef4444" }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setOpen(false)}
                  >
                    <X className="w-4 h-4" />
                    Close
                  </motion.button>
                </div>
              </div>

              {/* PDF */}
              <iframe
                src={PREVIEW_URL}
                className="flex-1 w-full"
                allow="autoplay"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HeroButton;
