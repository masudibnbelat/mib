"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Trash2, Loader2, ImageIcon, X, Save } from "lucide-react";
import axiosSecure, { multipartConfig } from "@/src/hooks/axiosSecure";
import Swal from "sweetalert2";

type Topic = {
  _id: string;
  title: string;
  img: string;
  createdAt?: string;
};

type TopicResponse = {
  success: boolean;
  data: Topic[];
};

const TopicManager = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);

  const { isLoading } = useQuery({
    queryKey: ["topics"],
    queryFn: async () => {
      const res = await axiosSecure.get<TopicResponse>("/api/topic");
      setTopics(res.data.data || []);
      return res.data.data;
    },
  });

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Delete this topic?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      background: "var(--color-bg)",
      color: "var(--color-text)",
    });

    if (!result.isConfirmed) return;

    try {
      await axiosSecure.delete(`/api/topic/${id}`);
      setTopics((prev) => prev.filter((item) => item._id !== id));

      Swal.fire({
        title: "Deleted!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        background: "var(--color-bg)",
        color: "var(--color-text)",
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: "Failed!",
        text: "Something went wrong.",
        icon: "error",
        background: "var(--color-bg)",
        color: "var(--color-text)",
      });
    }
  };

  const handleEditOpen = (topic: Topic) => {
    setEditingId(topic._id); // ✅ _id set করা হচ্ছে
    setEditTitle(topic.title);
    setEditImage(null);
  };

  const handleEditClose = () => {
    setEditingId(null);
    setEditTitle("");
    setEditImage(null);
  };

  const handleUpdate = async () => {
    if (!editingId) return; // ✅ এখন ঠিকমতো কাজ করবে

    try {
      setSubmitting(true);
      const formData = new FormData();
      if (editTitle.trim()) formData.append("title", editTitle);
      if (editImage) formData.append("img", editImage);

      const res = await axiosSecure.patch(
        `/api/topic/${editingId}`, // ✅ topics → topic
        formData,
        multipartConfig,
      );

      setTopics((prev) =>
        prev.map((item) => (item._id === editingId ? res.data.data : item)),
      );

      handleEditClose();

      Swal.fire({
        title: "Updated!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        background: "var(--color-bg)",
        color: "var(--color-text)",
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: "Failed!",
        text: "Something went wrong.",
        icon: "error",
        background: "var(--color-bg)",
        color: "var(--color-text)",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isEmpty = useMemo(() => topics.length === 0, [topics]);

  return (
    <div className="min-h-screen bg-(--color-bg) px-4 py-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-(--color-text)">
            Topic Manager
          </h1>
          <p className="mt-1 text-sm text-(--color-gray)">
            Manage your topics — edit or remove existing ones.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {isLoading ? (
              <div className="col-span-full flex items-center justify-center py-24">
                <Loader2 className="size-10 animate-spin text-(--color-gray)" />
              </div>
            ) : isEmpty ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full rounded-3xl border border-(--color-active-border) bg-(--color-active-bg) p-10 text-center"
              >
                <h3 className="text-xl font-semibold text-(--color-text)">
                  No Topics Found
                </h3>
                <p className="mt-2 text-sm text-(--color-gray)">
                  No topics have been created yet.
                </p>
              </motion.div>
            ) : (
              topics.map((topic, index) => {
                const isEditing = editingId === topic._id; // ✅ সঠিকভাবে match হবে

                return (
                  <motion.div
                    key={topic._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.04 }}
                    className="overflow-hidden rounded-3xl border border-(--color-active-border) bg-(--color-active-bg) backdrop-blur-xl"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={topic.img}
                        alt={topic.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>

                    <div className="space-y-4 p-5">
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full rounded-2xl border border-(--color-active-border) bg-(--color-bg) px-4 py-3 text-(--color-text) outline-none transition focus:border-(--color-active-text)"
                          />
                          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-(--color-active-border) bg-(--color-active-bg) px-4 py-3 transition hover:opacity-80">
                            <ImageIcon className="size-5 text-(--color-gray)" />
                            <span className="truncate text-sm text-(--color-gray)">
                              {editImage?.name || "Change image"}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                setEditImage(e.target.files?.[0] || null)
                              }
                            />
                          </label>
                        </>
                      ) : (
                        <div>
                          <h3 className="line-clamp-1 text-xl font-bold text-(--color-text)">
                            {topic.title}
                          </h3>
                          <p className="mt-1 text-sm text-(--color-gray)">
                            ID: {topic._id.slice(-8)}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        {isEditing ? (
                          <>
                            <button
                              onClick={handleUpdate}
                              disabled={submitting}
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-(--color-active-text) px-4 py-3 font-semibold text-(--color-bg) transition hover:scale-[0.98] disabled:opacity-50"
                            >
                              {submitting ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Save className="size-4" />
                              )}
                              Save
                            </button>
                            <button
                              onClick={handleEditClose}
                              className="inline-flex items-center justify-center rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) p-3 text-(--color-gray) transition hover:text-(--color-text)"
                            >
                              <X className="size-5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditOpen(topic)}
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) px-4 py-3 text-(--color-text) transition hover:opacity-80"
                            >
                              <Pencil className="size-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(topic._id)}
                              className="inline-flex items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-red-500 transition hover:bg-red-500/20"
                            >
                              <Trash2 className="size-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default TopicManager;
