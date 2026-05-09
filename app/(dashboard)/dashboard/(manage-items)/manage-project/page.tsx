"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";
import { motion, AnimatePresence } from "motion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderKanban, Loader2, Pencil, Save, Trash2, X } from "lucide-react";
import { axiosSecure } from "@/src/hooks/axiosSecure";

import Swal from "sweetalert2";
import ImagePicker from "@/src/components/Dashboard/ImagePicker";

/* ── Types ── */
type Project = {
  _id: string;
  type: "web" | "app";
  title: string;
  slug: string;
  description: string;
  githubLink: string;
  liveLink: string;
  technologies: string[];
  images: string[];
  createdAt: string;
};

type ProjectsResponse = {
  success: boolean;
  data: Project[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

/* ── Helpers ── */
const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Blob read failed"));
  });

/* ══════════════════════════════════════════════
   Image Manager
   ══════════════════════════════════════════════ */
interface ManagedImage {
  type: "existing" | "new";
  url: string;
  blob?: Blob;
}

const ImageManager = ({
  existingImages,
  onChange,
}: {
  existingImages: string[];
  onChange: (images: { keepImages: string[]; newBlobs: Blob[] }) => void;
}) => {
  const [images, setImages] = useState<ManagedImage[]>(
    existingImages.map((url) => ({ type: "existing" as const, url })),
  );
  const [pickerKey, setPickerKey] = useState(0);

  useEffect(() => {
    const keepImages = images
      .filter((i) => i.type === "existing")
      .map((i) => i.url);
    const newBlobs = images
      .filter((i) => i.type === "new" && i.blob)
      .map((i) => i.blob!);
    onChange({ keepImages, newBlobs });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  const removeImage = (index: number) => {
    setImages((prev) => {
      const img = prev[index];
      if (img.type === "new" && img.url) URL.revokeObjectURL(img.url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleNewImage = useCallback(
    (blob: Blob, preview: string) => {
      if (images.length >= 10) return;
      setImages((prev) => [...prev, { type: "new", url: preview, blob }]);
      setPickerKey((k) => k + 1);
    },
    [images.length],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-(--color-text)">
          Images ({images.length}/10)
        </h3>
      </div>

      {/* grid */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        <AnimatePresence mode="popLayout">
          {images.map((img, idx) => (
            <motion.div
              key={`${img.url}-${idx}`}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative overflow-hidden rounded-lg border border-(--color-active-border)"
            >
              <div className="relative aspect-square w-full">
                {img.type === "existing" ? (
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute right-1 top-1 z-20 rounded-lg bg-red-600 p-1 text-white shadow-md transition hover:bg-red-700"
              >
                <X className="h-3 w-3" />
              </button>

              <div
                className={`absolute bottom-0 left-0 right-0 py-0.5 text-center text-[9px] font-medium ${
                  img.type === "new"
                    ? "bg-amber-500/80 text-white"
                    : "bg-emerald-500/80 text-white"
                }`}
              >
                {img.type === "new" ? "নতুন" : "বিদ্যমান"}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {images.length < 10 && (
        <div className="max-w-xs">
          <ImagePicker
            key={pickerKey}
            currentImgUrl="placeholder"
            onBlobReady={handleNewImage}
          />
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════
   Edit Modal
   ══════════════════════════════════════════════ */
const EditModal = ({
  project,
  onClose,
  onSuccess,
}: {
  project: Project;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [form, setForm] = useState({
    type: project.type,
    title: project.title,
    description: project.description,
    githubLink: project.githubLink || "",
    liveLink: project.liveLink || "",
    technologies: project.technologies.join(", "),
  });

  const [imageData, setImageData] = useState<{
    keepImages: string[];
    newBlobs: Blob[];
  }>({ keepImages: project.images || [], newBlobs: [] });

  const [localError, setLocalError] = useState("");

  const updateMutation = useMutation({
    mutationFn: async () => {
      const technologies = form.technologies
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const newImages = await Promise.all(
        imageData.newBlobs.map(async (blob) => ({
          base64: await blobToBase64(blob),
        })),
      );

      return axiosSecure.patch(`/api/projects/${project.slug}`, {
        type: form.type,
        title: form.title,
        description: form.description,
        githubLink: form.githubLink,
        liveLink: form.liveLink,
        technologies,
        keepImages: imageData.keepImages,
        newImages,
      });
    },
    onSuccess: () => {
      Swal.fire({
        icon: "success",
        title: "সফল!",
        text: "প্রজেক্ট আপডেট হয়েছে",
        timer: 1500,
        showConfirmButton: false,
      });
      onSuccess();
      onClose();
    },
    onError: (err) => {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "আপডেট ব্যর্থ";
      Swal.fire({ icon: "error", title: "ত্রুটি!", text: msg });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (imageData.keepImages.length + imageData.newBlobs.length < 1) {
      setLocalError("কমপক্ষে একটি ছবি রাখতে হবে");
      return;
    }
    setLocalError("");
    updateMutation.mutate();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.98 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative flex h-full w-full flex-col bg-(--color-bg) shadow-2xl md:h-[95vh] md:w-[92vw] md:max-w-5xl md:rounded-3xl md:border md:border-(--color-active-border)"
      >
        {/* header */}
        <div className="flex shrink-0 items-center justify-between border-b border-(--color-active-border) bg-(--color-bg) px-4 py-3 md:rounded-t-3xl md:px-6 md:py-4">
          <div>
            <h2 className="text-lg font-bold text-(--color-text) md:text-xl">
              Edit Project
            </h2>
            <p className="text-xs text-(--color-gray)">slug: {project.slug}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-red-600 p-2 text-white transition hover:bg-red-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <form
            id="edit-project-form"
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {localError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"
              >
                {localError}
              </motion.div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-(--color-text)">
                  Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      type: e.target.value as "web" | "app",
                    }))
                  }
                  className="w-full rounded-2xl border border-(--color-active-border) bg-(--color-bg) px-4 py-2.5 text-(--color-text) outline-none transition focus:border-(--color-active-text)"
                >
                  <option value="web">Web</option>
                  <option value="app">App</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-(--color-text)">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-(--color-active-border) bg-(--color-bg) px-4 py-2.5 text-(--color-text) outline-none transition focus:border-(--color-active-text)"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-(--color-text)">
                Description
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                className="w-full rounded-2xl border border-(--color-active-border) bg-(--color-bg) px-4 py-2.5 text-(--color-text) outline-none transition focus:border-(--color-active-text)"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-(--color-text)">
                  GitHub Link
                </label>
                <input
                  type="text"
                  value={form.githubLink}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, githubLink: e.target.value }))
                  }
                  placeholder="https://github.com/..."
                  className="w-full rounded-2xl border border-(--color-active-border) bg-(--color-bg) px-4 py-2.5 text-(--color-text) placeholder:text-(--color-gray) outline-none transition focus:border-(--color-active-text)"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-(--color-text)">
                  Live Link
                </label>
                <input
                  type="text"
                  value={form.liveLink}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, liveLink: e.target.value }))
                  }
                  placeholder="https://example.com"
                  className="w-full rounded-2xl border border-(--color-active-border) bg-(--color-bg) px-4 py-2.5 text-(--color-text) placeholder:text-(--color-gray) outline-none transition focus:border-(--color-active-text)"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-(--color-text)">
                Technologies
              </label>
              <input
                type="text"
                value={form.technologies}
                onChange={(e) =>
                  setForm((p) => ({ ...p, technologies: e.target.value }))
                }
                placeholder="React, Next.js, Tailwind"
                className="w-full rounded-2xl border border-(--color-active-border) bg-(--color-bg) px-4 py-2.5 text-(--color-text) placeholder:text-(--color-gray) outline-none transition focus:border-(--color-active-text)"
              />
              <p className="mt-1 text-xs text-(--color-gray)">
                comma (,) দিয়ে আলাদা করুন
              </p>
            </div>

            <div className="rounded-2xl border border-(--color-active-border) bg-(--color-active-bg) p-4">
              <ImageManager
                existingImages={project.images || []}
                onChange={setImageData}
              />
            </div>
          </form>
        </div>

        {/* footer */}
        <div className="flex shrink-0 gap-3 border-t border-(--color-active-border) bg-(--color-bg) px-4 py-3 md:rounded-b-3xl md:px-6 md:py-4">
          <motion.button
            type="submit"
            form="edit-project-form"
            disabled={updateMutation.isPending}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 rounded-2xl bg-(--color-active-text) px-5 py-2.5 text-sm font-semibold text-(--color-bg) transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Update Project
          </motion.button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════
   Main Page
   ══════════════════════════════════════════════ */
const ManageProject = () => {
  const queryClient = useQueryClient();
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await axiosSecure.get<ProjectsResponse>(
        "/api/projects?page=1&limit=50",
      );
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => axiosSecure.delete(`/api/projects/${slug}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await refetch();
      Swal.fire({
        icon: "success",
        title: "সফল!",
        text: "প্রজেক্ট মুছে ফেলা হয়েছে",
        timer: 1500,
        showConfirmButton: false,
      });
    },
    onError: (err) => {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "ডিলিট ব্যর্থ";
      Swal.fire({ icon: "error", title: "ত্রুটি!", text: msg });
    },
    onSettled: () => setDeletingSlug(null),
  });

  const handleDelete = async (slug: string, title: string) => {
    const result = await Swal.fire({
      title: "নিশ্চিত করুন",
      html: `<span class="font-semibold">"${title}"</span> মুছে ফেলতে চান?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "হ্যাঁ, মুছুন",
      cancelButtonText: "না",
    });

    if (!result.isConfirmed) return;
    setDeletingSlug(slug);
    deleteMutation.mutate(slug);
  };

  const handleEditSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ["projects"] });
    await refetch();
  };

  const queryErrorMsg = axios.isAxiosError(error)
    ? error.response?.data?.message || error.message
    : "ডেটা লোড করা যায়নি";

  const projects = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-(--color-active-border) bg-(--color-bg) px-5 py-4 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-(--color-text)" />
          <p className="text-sm font-medium text-(--color-text)">Loading...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-6">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
          {queryErrorMsg}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      {/* header */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col gap-3 rounded-3xl border border-(--color-active-border) bg-(--color-bg) p-5 shadow-sm md:flex-row md:items-center md:justify-between"
      >
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-(--color-active-bg) px-3 py-1 text-sm font-medium text-(--color-text)">
            <FolderKanban className="h-4 w-4" />
            Manage Projects
          </div>
          <h1 className="text-2xl font-bold text-(--color-text) md:text-3xl">
            All Projects
          </h1>
          <p className="mt-1 text-sm text-(--color-gray)">
            Total:{" "}
            <span className="font-semibold text-(--color-text)">
              {data?.meta.total ?? 0}
            </span>
          </p>
        </div>
      </motion.div>

      {projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-dashed border-(--color-active-border) bg-(--color-bg) p-10 text-center shadow-sm"
        >
          <h2 className="text-xl font-semibold text-(--color-text)">
            No project found
          </h2>
          <p className="mt-2 text-sm text-(--color-gray)">
            নতুন project add করলে এখানে দেখাবে।
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {projects.map((project, index) => (
              <motion.div
                key={project._id}
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.04 }}
                className="group rounded-3xl border border-(--color-active-border) bg-(--color-bg) p-4 shadow-sm transition hover:shadow-md"
              >
                {/* thumbnail */}
                <div className="relative mb-4 h-52 w-full overflow-hidden rounded-2xl border border-(--color-active-border)">
                  <Image
                    src={project.images?.[0] || "/placeholder.png"}
                    alt={project.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                </div>

                {/* title + type */}
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h2 className="text-lg font-bold text-(--color-text)">
                    {project.title}
                  </h2>
                  <span className="shrink-0 rounded-full bg-(--color-active-bg) px-3 py-1 text-xs font-semibold uppercase text-(--color-text)">
                    {project.type}
                  </span>
                </div>

                {/* desc */}
                <p className="mb-4 text-sm leading-6 text-(--color-gray)">
                  {project.description.length > 120
                    ? `${project.description.slice(0, 120)}...`
                    : project.description}
                </p>

                {/* tech */}
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {project.technologies?.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full border border-(--color-active-border) bg-(--color-active-bg) px-2.5 py-0.5 text-xs text-(--color-gray)"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* actions — only Edit & Delete */}
                <div className="flex flex-wrap gap-2">
                  <motion.button
                    onClick={() => setEditProject(project)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 rounded-xl bg-(--color-active-text) px-4 py-2 text-sm font-medium text-(--color-bg) transition"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </motion.button>

                  <motion.button
                    onClick={() => handleDelete(project.slug, project.title)}
                    disabled={
                      deleteMutation.isPending && deletingSlug === project.slug
                    }
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deleteMutation.isPending &&
                    deletingSlug === project.slug ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Delete
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editProject && (
          <EditModal
            key={editProject._id}
            project={editProject}
            onClose={() => setEditProject(null)}
            onSuccess={handleEditSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageProject;
