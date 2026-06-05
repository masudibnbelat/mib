import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, Download, Loader2, FileText } from "lucide-react";

const FILE_ID = "1mGJACD7a9BA9OTanbN67kFIc8EZtGoZS";
const PREVIEW_URL = `https://drive.google.com/file/d/${FILE_ID}/preview`;
const DOWNLOAD_URL = `https://drive.google.com/uc?export=download&id=${FILE_ID}`;

export const HeroButton = () => {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Body scroll lock - only when modal is open
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

    // Create temporary link instead of iframe
    const link = document.createElement("a");
    link.href = DOWNLOAD_URL;
    link.download = "resume.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloading(false);
    }, 2000);
  };

  return (
    <>
      {/* Remove animation delay for better interaction time */}
      <div className="flex flex-wrap gap-4">
        <motion.button
          className="group px-6 py-3 rounded bg-(--color-bg) text-(--color-text) border border-(--color-text) font-medium flex items-center gap-2 transition-shadow hover:shadow-lg"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setOpen(true)}
        >
          <FileText className="w-4 h-4" />
          Resume
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </motion.button>

        <motion.button
          className="px-6 py-3 rounded bg-(--color-text) text-(--color-bg) font-medium transition-all hover:shadow-lg"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={scrollToContact}
        >
          Contact Me
        </motion.button>
      </div>

      <AnimatePresence>
        {open && (
          <div>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />

            {/* Modal */}
            <motion.div
              className="fixed inset-4 md:inset-8 z-50 flex flex-col bg-(--color-bg) rounded-lg shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-(--color-text)/10 shrink-0">
                <span className="font-semibold text-(--color-text) tracking-wide">
                  Resume Preview
                </span>

                <div className="flex items-center gap-3">
                  {/* Download Button */}
                  <motion.button
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-(--color-text) text-(--color-bg) text-sm font-medium disabled:opacity-50"
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
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Downloading...
                        </motion.span>
                      ) : (
                        <motion.span
                          key="idle"
                          className="flex items-center gap-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  {/* Close Button */}
                  <motion.button
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setOpen(false)}
                  >
                    <X className="w-4 h-4" />
                    Close
                  </motion.button>
                </div>
              </div>

              {/* PDF Container */}
              <div className="relative flex-1 w-full bg-gray-100 dark:bg-gray-900">
                {/* Loading State */}
                {!iframeLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-(--color-text)/50" />
                  </div>
                )}

                {/* Iframe - only load when modal opens */}
                <iframe
                  src={PREVIEW_URL}
                  className="w-full h-full"
                  allow="autoplay"
                  onLoad={() => setIframeLoaded(true)}
                  loading="lazy"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HeroButton;
