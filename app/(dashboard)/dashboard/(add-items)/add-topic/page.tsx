"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { motion } from "framer-motion";
import { BookOpen, SendHorizonal, Loader2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import ImageUploadWithEditor, {
  EditedImage,
} from "@/src/components/ImageEditor/ImageUploadWithEditor";

/* ── Types ── */
interface TopicFormValues {
  title: string;
  images: EditedImage[];
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: { _id: string; title: string; img: string; createdAt: string };
}

const Page = () => {
  const {
    register, // ✅ input field এর জন্য register আলাদা করে নিলাম
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<TopicFormValues>({
    defaultValues: { title: "", images: [] },
    mode: "onChange",
  });

  const [loading, setLoading] = useState(false);

  // ❌ response স্টেট আর দরকার নেই

  // eslint-disable-next-line react-hooks/incompatible-library
  const title = watch("title");
  const images = watch("images");
  const canSubmit = title.trim().length > 0 && images.length > 0 && !loading;

  const onSubmit = async (data: TopicFormValues) => {
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("title", data.title.trim());
      fd.append("img", data.images[0].blob, data.images[0].originalName);

      const res = await fetch("/api/topic", { method: "POST", body: fd });
      const apiData: ApiResponse = await res.json();

      // ✅ Toast Notification Logic
      if (apiData.success) {
        toast.success(apiData.message || "সফলভাবে save হয়েছে! 🎉");
        reset(); // ফর্ম রিসেট করবে
      } else {
        toast.error(apiData.message || "Error হয়েছে!");
      }
    } catch {
      toast.error("Network error হয়েছে!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ✅ Toaster Component (থিম অনুযায়ী কাস্টমাইজ করা) */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "var(--color-active-bg)",
            color: "var(--color-text)",
            border: "1px solid var(--color-active-border)",
            borderRadius: "12px",
            fontSize: "14px",
          },
          success: {
            iconTheme: { primary: "#22c55e", secondary: "#fff" },
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "#fff" },
          },
        }}
      />

      <div className="min-h-screen bg-(--color-bg) flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-xl bg-(--color-active-bg) border border-(--color-active-border)">
              <BookOpen size={22} className="text-(--color-text)" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-(--color-text)">
                নতুন Topic
              </h1>
              <p className="text-sm text-(--color-gray)">
                img → WebP → Cloudinary → MongoDB
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Title Field */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label className="block text-sm font-medium text-(--color-text) mb-1.5">
                Title
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-(--color-active-border) bg-(--color-active-bg) focus-within:border-(--color-text) transition-colors">
                <BookOpen size={15} className="text-(--color-gray) shrink-0" />
                <input
                  {...register("title", {
                    required: "Title লিখুন",
                    minLength: { value: 3, message: "ন্যূনতম ৩ অক্ষর" },
                  })}
                  type="text"
                  placeholder="Topic এর নাম লিখ..."
                  className="flex-1 bg-transparent text-(--color-text) placeholder:text-(--color-gray) text-sm outline-none"
                />
              </div>
              {errors.title && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.title.message}
                </p>
              )}
            </motion.div>

            {/* Image Editor Field */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <label className="block text-sm font-medium text-(--color-text) mb-1.5">
                Image{" "}
                <span className="text-(--color-gray) font-normal">
                  (যেকোনো format — WebP-এ convert হবে)
                </span>
              </label>
              <Controller
                name="images"
                control={control}
                rules={{ required: "একটি ইমেজ সিলেক্ট করুন" }}
                render={({ field }) => (
                  <ImageUploadWithEditor
                    images={field.value}
                    onChange={field.onChange}
                    maxImages={1}
                  />
                )}
              />
              {errors.images && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.images.message}
                </p>
              )}
            </motion.div>

            {/* Submit Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-(--color-active-bg) border border-(--color-active-border) text-(--color-text) font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-(--color-active-border) transition-colors cursor-pointer"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <SendHorizonal size={16} />
              )}
              {loading ? "Upload হচ্ছে..." : "Submit করো"}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </>
  );
};

export default Page;
