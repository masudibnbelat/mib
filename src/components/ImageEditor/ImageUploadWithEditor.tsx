// src/components/ImageEditor/ImageUploadWithEditor.tsx
import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { ImagePlus, CheckCircle2, Pencil, X, Check, Edit3 } from "lucide-react";
import ImageEditor from "./ImageEditor";
import { lockScroll, unlockScroll } from "@/src/Utility/scrollLock";
import { toBn } from "@/src/Utility/Formatters";
import { fileToWebp } from "./fileToWebp";

export interface EditedImage {
  blob: Blob;
  previewUrl: string;
  originalName: string;
}

interface ImageUploadWithEditorProps {
  images: EditedImage[];
  onChange: (images: EditedImage[]) => void;
  maxImages?: number;
}

// ── Preview Modal ─────────────────────────────────────────
interface PreviewModalProps {
  file: File;
  previewUrl: string;
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
}

const PreviewModal = ({
  file,
  previewUrl,
  onConfirm,
  onEdit,
  onCancel,
}: PreviewModalProps) => {
  useEffect(() => {
    lockScroll();
    return () => unlockScroll();
  }, []);

  const modal = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-99990 bg-black/95 backdrop-blur-sm flex flex-col"
    >
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="flex items-center justify-between px-4 py-3 bg-black/80 border-b border-white/10 shrink-0"
      >
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-sm transition-all active:scale-95"
        >
          <X className="w-4 h-4" />
          <span className="bangla hidden sm:inline">বাতিল</span>
        </button>
        <p className="text-white/60 text-xs bangla truncate max-w-45">
          {file.name} · {(file.size / (1024 * 1024)).toFixed(1)} MB
        </p>
        <div className="w-24" />
      </motion.div>

      <div className="flex-1 min-h-0 flex items-center justify-center p-4 overflow-hidden">
        <motion.img
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          src={previewUrl}
          alt="preview"
          className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
        />
      </div>

      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-black/90 border-t border-white/10 p-4 shrink-0"
      >
        <div className="flex gap-3 max-w-sm mx-auto">
          <motion.button
            type="button"
            onClick={onEdit}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
              bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30
              text-amber-400 text-sm font-medium transition-all bangla"
          >
            <Edit3 className="w-4 h-4" /> সম্পাদনা
          </motion.button>
          <motion.button
            type="button"
            onClick={onConfirm}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
              bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30
              text-emerald-400 text-sm font-semibold transition-all bangla"
          >
            <Check className="w-4 h-4" /> নিশ্চিত করুন
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(modal, document.body);
};

// ── Main Component ────────────────────────────────────────
const ImageUploadWithEditor = ({
  images,
  onChange,
  maxImages = 10,
}: ImageUploadWithEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileQueueRef = useRef<File[]>([]);
  const maxImagesRef = useRef(maxImages);

  useEffect(() => {
    maxImagesRef.current = maxImages;
  }, [maxImages]);

  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [reEditIndex, setReEditIndex] = useState<number | null>(null);

  const openNextPreview = useCallback((files: File[], currentCount: number) => {
    if (files.length === 0 || currentCount >= maxImagesRef.current) return;
    fileQueueRef.current = files.slice(1);
    const file = files[0];
    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    openNextPreview(files, images.length);
  };

  const handlePreviewConfirm = useCallback(async () => {
    if (!previewFile) return;

    try {
      const webpBlob = await fileToWebp(previewFile, 0.88);
      const webpPreviewUrl = URL.createObjectURL(webpBlob);

      const newImages = [
        ...images,
        {
          blob: webpBlob,
          previewUrl: webpPreviewUrl,
          originalName: previewFile.name,
        },
      ];

      onChange(newImages);

      URL.revokeObjectURL(previewUrl);
      setPreviewFile(null);
      setPreviewUrl("");

      if (
        fileQueueRef.current.length > 0 &&
        newImages.length < maxImagesRef.current
      ) {
        setTimeout(() =>
          openNextPreview(fileQueueRef.current, newImages.length),
        );
      }
    } catch (error) {
      console.error("Preview confirm → WebP conversion failed:", error);
    }
  }, [previewFile, previewUrl, images, onChange, openNextPreview]);

  const handlePreviewEdit = useCallback(() => {
    if (!previewFile) return;
    const fileToEdit = previewFile;
    const urlToRevoke = previewUrl;
    setPreviewFile(null);
    setPreviewUrl("");
    setEditingFile(fileToEdit);
    requestAnimationFrame(() => URL.revokeObjectURL(urlToRevoke));
  }, [previewFile, previewUrl]);

  const handlePreviewCancel = useCallback(() => {
    URL.revokeObjectURL(previewUrl);
    setPreviewFile(null);
    setPreviewUrl("");
    fileQueueRef.current = [];
  }, [previewUrl]);

  const handleEditorConfirm = useCallback(
    (blob: Blob, url: string) => {
      if (reEditIndex !== null) {
        const updated = [...images];
        URL.revokeObjectURL(updated[reEditIndex].previewUrl);
        updated[reEditIndex] = {
          blob,
          previewUrl: url,
          originalName: updated[reEditIndex].originalName,
        };
        onChange(updated);
        setReEditIndex(null);
        setEditingFile(null);
        return;
      }
      const newImages = [
        ...images,
        { blob, previewUrl: url, originalName: editingFile?.name ?? "image" },
      ];
      onChange(newImages);
      setEditingFile(null);
      if (
        fileQueueRef.current.length > 0 &&
        newImages.length < maxImagesRef.current
      )
        setTimeout(
          () => openNextPreview(fileQueueRef.current, newImages.length),
          200,
        );
    },
    [editingFile, images, onChange, reEditIndex, openNextPreview],
  );

  const handleEditorCancel = useCallback(() => {
    setEditingFile(null);
    setReEditIndex(null);
    fileQueueRef.current = [];
  }, []);

  const reEditImage = useCallback(
    (index: number) => {
      const img = images[index];
      setReEditIndex(index);
      setEditingFile(
        new File([img.blob], img.originalName, {
          type: img.blob.type || "image/webp",
        }),
      );
    },
    [images],
  );

  const removeImage = useCallback(
    (index: number) => {
      URL.revokeObjectURL(images[index].previewUrl);
      onChange(images.filter((_, i) => i !== index));
    },
    [images, onChange],
  );

  const isFull = images.length >= maxImages;

  return (
    <div>
      <motion.div
        whileHover={{ scale: isFull ? 1 : 1.01 }}
        whileTap={{ scale: isFull ? 1 : 0.99 }}
        onClick={() => {
          if (!isFull) fileInputRef.current?.click();
        }}
        className={`cursor-pointer border-2 border-dashed rounded-xl p-6
          flex flex-col items-center gap-2 transition-all duration-300
          group relative overflow-hidden
          ${
            isFull
              ? "border-(--color-active-border) opacity-50 cursor-not-allowed"
              : "border-(--color-active-border) hover:border-violet-400"
          }`}
      >
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
          className="absolute inset-0 bg-linear-to-r from-transparent via-violet-500/5 to-transparent pointer-events-none"
        />
        <motion.div
          whileHover={{ rotate: 15, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <ImagePlus className="w-8 h-8 text-(--color-gray) group-hover:text-violet-500 transition-colors" />
        </motion.div>
        <p className="text-sm text-(--color-gray) group-hover:text-violet-500 transition-colors bangla font-medium text-center">
          ক্লিক করুন — ছবি যোগ করুন
        </p>
        <p className="text-xs text-(--color-gray) bangla text-center">
          নিশ্চিত করুন বা সম্পাদনা করে যোগ করুন
        </p>
      </motion.div>

      {isFull && (
        <p className="text-xs text-amber-500 bangla mt-1">
          সর্বোচ্চ {toBn(maxImages)}টি ছবি যোগ করা হয়েছে
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <AnimatePresence>
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4"
          >
            {images.map((img, i) => (
              <motion.div
                key={img.previewUrl}
                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
                className="relative group aspect-square rounded-xl overflow-hidden
                  border-2 border-(--color-active-border) hover:border-violet-400 transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.previewUrl}
                  alt={`img-${i}`}
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0 bg-black/0 group-hover:bg-black/40
                  transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      reEditImage(i);
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-9 h-9 bg-amber-500 rounded-full flex items-center
                      justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Pencil className="w-4 h-4 text-white" />
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(i);
                    }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-rose-500
                      text-white flex items-center justify-center shadow-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </motion.button>
                </div>

                <div
                  className="absolute top-1.5 left-1.5 w-6 h-6 bg-black/60
                  backdrop-blur-sm rounded-full flex items-center justify-center
                  text-white text-xs font-bold border border-white/20"
                >
                  {toBn(i + 1)}
                </div>
                <div
                  className="absolute bottom-1.5 left-1.5 px-2 py-0.5
                  bg-black/60 backdrop-blur-sm rounded-md text-white/80
                  text-[10px] border border-white/10"
                >
                  {(img.blob.size / 1024).toFixed(0)} KB
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {images.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-(--color-gray) mt-2 bangla flex items-center gap-1.5"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          {toBn(images.length)}টি ছবি নির্বাচিত
        </motion.p>
      )}

      <AnimatePresence>
        {previewFile && previewUrl && (
          <PreviewModal
            file={previewFile}
            previewUrl={previewUrl}
            onConfirm={handlePreviewConfirm}
            onEdit={handlePreviewEdit}
            onCancel={handlePreviewCancel}
          />
        )}
      </AnimatePresence>

      {editingFile && (
        <ImageEditor
          key={editingFile.name + editingFile.size}
          file={editingFile}
          onConfirm={handleEditorConfirm}
          onCancel={handleEditorCancel}
        />
      )}
    </div>
  );
};

export default ImageUploadWithEditor;
