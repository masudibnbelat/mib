// app/dashboard/add-article/page.tsx

"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { BookOpen, FileText, Loader2, Send, Tag } from "lucide-react";
import ImageUploadWithEditor, {
  EditedImage,
} from "@/src/components/ImageEditor/ImageUploadWithEditor";
import { axiosSecure } from "@/src/hooks/axiosSecure";
import axios from "axios";

const AddArticle = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topicId, setTopicId] = useState("");
  const [images, setImages] = useState<EditedImage[]>([]);

  const { data: topics, isLoading: topicsLoading } = useQuery({
    queryKey: ["topics"],
    queryFn: async () => {
      const res = await axiosSecure.get<{
        success: boolean;
        data: { _id: string; title: string }[];
      }>("/api/topic");
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const uploadMutation = useMutation({
    mutationFn: async (blob: Blob) => {
      const fd = new FormData();
      fd.append("file", blob);
      fd.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
      );
      fd.append("folder", "articles");
      const res = await axios.post<{ secure_url: string }>(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        fd,
      );
      return res.data.secure_url;
    },
  });

  const articleMutation = useMutation({
    mutationFn: (payload: {
      topic: string;
      title: string;
      img: string;
      description: string;
    }) => axiosSecure.post("/api/articles", payload),
  });

  const handleSubmit = async () => {
    if (!topicId) return toast.error("একটি topic নির্বাচন করুন");
    if (!title.trim()) return toast.error("শিরোনাম লিখুন");
    if (!images.length) return toast.error("একটি ছবি যোগ করুন");
    if (!description.trim()) return toast.error("বিবরণ লিখুন");

    const id = toast.loading("ছবি আপলোড হচ্ছে...");
    try {
      const imgUrl = await uploadMutation.mutateAsync(images[0].blob);
      toast.loading("সেভ হচ্ছে...", { id });
      await articleMutation.mutateAsync({
        topic: topicId,
        title: title.trim(),
        img: imgUrl,
        description: description.trim(),
      });
      toast.success("আর্টিকেল পোস্ট হয়েছে!", { id });
      setTitle("");
      setDescription("");
      setTopicId("");
      setImages([]);
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? ((err.response?.data as { message?: string })?.message ?? err.message)
        : "কিছু একটা সমস্যা হয়েছে";
      toast.error(msg, { id });
    }
  };

  const submitting = uploadMutation.isPending || articleMutation.isPending;

  const field =
    "w-full px-3 py-2.5 rounded-xl bg-(--color-active-bg) border border-(--color-active-border) text-(--color-text) text-sm bangla placeholder:text-(--color-gray) focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50";

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-violet-500" />
        <h2 className="text-lg font-semibold text-(--color-text) bangla">
          নতুন আর্টিকেল যোগ করুন
        </h2>
      </div>

      {/* Topic */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-sm font-medium text-(--color-text) bangla">
          <Tag className="w-4 h-4 text-violet-400" />
          বিষয় (Topic)
        </label>
        <div className="relative">
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            disabled={topicsLoading || submitting}
            className={`${field} appearance-none cursor-pointer`}
          >
            <option value="">
              {topicsLoading ? "লোড হচ্ছে..." : "— বিষয় নির্বাচন করুন —"}
            </option>
            {topics?.map((t) => (
              <option key={t._id} value={t._id}>
                {t.title}
              </option>
            ))}
          </select>
          {topicsLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400 animate-spin" />
          )}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-sm font-medium text-(--color-text) bangla">
          <FileText className="w-4 h-4 text-violet-400" />
          শিরোনাম
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={submitting}
          placeholder="আর্টিকেলের শিরোনাম লিখুন..."
          className={field}
        />
      </div>

      {/* Image */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-(--color-text) bangla block">
          ছবি
        </label>
        <ImageUploadWithEditor
          images={images}
          onChange={setImages}
          maxImages={1}
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-(--color-text) bangla block">
          বিবরণ
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={submitting}
          rows={6}
          placeholder="বিস্তারিত বিবরণ লিখুন..."
          className={`${field} resize-none`}
        />
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold bangla transition-all active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {uploadMutation.isPending ? "ছবি আপলোড হচ্ছে..." : "সেভ হচ্ছে..."}
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            আর্টিকেল পোস্ট করুন
          </>
        )}
      </button>
    </div>
  );
};

export default AddArticle;
