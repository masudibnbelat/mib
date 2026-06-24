"use client";
import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { BookOpen, FileText, Loader2, Send } from "lucide-react";
import axios from "axios";
import { useState } from "react";
import ImageUploadWithEditor, {
  EditedImage,
} from "@/src/components/ImageEditor/ImageUploadWithEditor";
import { axiosSecure } from "@/src/hooks/axiosSecure";
import SelectInput from "@/src/components/common/SelectInput";
import { MibEditor } from "@/src/components/MibEditor/MibEditor";

interface ArticleFormData {
  topicId: string;
  title: string;
  description: string;
}

const AddArticle = () => {
  const [images, setImages] = useState<EditedImage[]>([]);

  const { control, register, setValue, handleSubmit, reset, watch } =
    useForm<ArticleFormData>({
      defaultValues: {
        topicId: "",
        title: "",
        description: "",
      },
    });

  // eslint-disable-next-line react-hooks/incompatible-library
  const topicId = watch("topicId");

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

  const onSubmit = async (data: ArticleFormData) => {
    if (!data.topicId) return toast.error("একটি topic নির্বাচন করুন");
    if (!images.length) return toast.error("একটি ছবি যোগ করুন");

    const id = toast.loading("ছবি আপলোড হচ্ছে...");
    try {
      const imgUrl = await uploadMutation.mutateAsync(images[0].blob);
      await articleMutation.mutateAsync({
        topic: data.topicId,
        title: data.title.trim(),
        img: imgUrl,
        description: data.description.trim(),
      });
      toast.success("আর্টিকেল পোস্ট হয়েছে!", { id });
      reset();
      setImages([]);
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? ((err.response?.data as { message?: string })?.message ?? err.message)
        : "কিছু একটা সমস্যা হয়েছে";
      toast.error(msg, { id });
    }
  };

  const submitting = uploadMutation.isPending || articleMutation.isPending;

  const fieldClass =
    "w-full px-3 py-2.5 rounded-xl bg-(--color-active-bg) border border-(--color-active-border) text-(--color-text) text-sm bangla placeholder:text-(--color-gray) focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-2xl mx-auto p-4 space-y-6"
    >
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-violet-500" />
        <h2 className="text-lg font-semibold text-(--color-text) bangla">
          নতুন আর্টিকেল যোগ করুন
        </h2>
      </div>

      <SelectInput
        label="বিষয় (Topic)"
        placeholder={topicsLoading ? "লোড হচ্ছে..." : "— বিষয় নির্বাচন করুন —"}
        options={topics?.map((t) => ({ value: t._id, label: t.title })) ?? []}
        value={topicId}
        onChange={(val) => {
          setValue("topicId", val, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
          });
        }}
        disabled={topicsLoading || submitting}
      />

      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-sm font-medium text-(--color-text) bangla">
          <FileText className="w-4 h-4 text-violet-400" />
          শিরোনাম
        </label>
        <input
          type="text"
          {...register("title", {
            required: "শিরোনাম লিখুন",
          })}
          disabled={submitting}
          placeholder="আর্টিকেলের শিরোনাম লিখুন..."
          className={fieldClass}
        />
      </div>

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

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-(--color-text) bangla block">
          বিবরণ
        </label>
        <MibEditor
          name="description"
          control={control}
          placeholder="বিস্তারিত বিবরণ লিখুন..."
          rows={6}
          disabled={submitting}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold bangla transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
    </form>
  );
};

export default AddArticle;
