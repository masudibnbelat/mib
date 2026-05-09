// src/components/ManageArticle/ImagePicker.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { ImagePlus, RotateCcw } from "lucide-react";
import ImageEditor from "@/src/components/ImageEditor/ImageEditor";
import { fileToWebp } from "@/src/components/ImageEditor/fileToWebp";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ImagePickerProps {
  currentImgUrl: string;
  onBlobReady: (blob: Blob, preview: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ImagePicker({
  currentImgUrl,
  onBlobReady,
}: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string>("");
  const [editedPreview, setEditedPreview] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // cleanup blob URLs
  useEffect(
    () => () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
      if (editedPreview) URL.revokeObjectURL(editedPreview);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;

      const webp = await fileToWebp(file, 0.88);
      const webpFile = new File(
        [webp],
        file.name.replace(/\.[^.]+$/, ".webp"),
        { type: "image/webp" },
      );
      if (localPreview) URL.revokeObjectURL(localPreview);
      setLocalPreview(URL.createObjectURL(webp));
      setPendingFile(webpFile);
      setIsEditing(true);
    },
    [localPreview],
  );

  const onEditorConfirm = useCallback(
    (blob: Blob, preview: string) => {
      if (editedPreview) URL.revokeObjectURL(editedPreview);
      setEditedPreview(preview);
      setIsEditing(false);
      setPendingFile(null);
      onBlobReady(blob, preview);
    },
    [editedPreview, onBlobReady],
  );

  const onEditorCancel = useCallback(() => {
    setIsEditing(false);
    setPendingFile(null);
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview("");
  }, [localPreview]);

  const displaySrc = editedPreview || currentImgUrl;

  return (
    <>
      <div className="space-y-2">
        {/* Current / new image preview */}
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-(--color-active-border) bg-(--color-active-bg) group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displaySrc}
            alt="article"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />

          {/* Overlay: change button */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-250 flex items-center justify-center gap-3">
            <motion.button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              initial={false}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-medium"
            >
              <ImagePlus size={14} />
              ছবি পরিবর্তন
            </motion.button>

            {editedPreview && (
              <motion.button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(editedPreview);
                  setEditedPreview("");
                }}
                initial={false}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-400 text-xs font-medium"
              >
                <RotateCcw size={13} />
                রিসেট
              </motion.button>
            )}
          </div>

          {/* Badge: changed */}
          {editedPreview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-medium backdrop-blur-sm"
            >
              নতুন ছবি
            </motion.div>
          )}
        </div>

        {/* Tap hint (mobile) */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-(--color-active-border) hover:border-amber-500/40 hover:bg-amber-500/5 text-(--color-gray) hover:text-amber-500 text-xs transition-all"
        >
          <ImagePlus size={13} />
          নতুন ছবি বেছে নিন (যেকোনো ফরম্যাট → WebP)
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      {/* ImageEditor in portal */}
      {mounted &&
        isEditing &&
        pendingFile &&
        createPortal(
          <AnimatePresence>
            <ImageEditor
              key={pendingFile.name + pendingFile.size}
              file={pendingFile}
              onConfirm={onEditorConfirm}
              onCancel={onEditorCancel}
            />
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
