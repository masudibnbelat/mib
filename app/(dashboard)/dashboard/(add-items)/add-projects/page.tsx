"use client";
import { useCallback, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe,
  Smartphone,
  ExternalLink,
  FileText,
  Code2,
  Plus,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import ImageUploadWithEditor, {
  type EditedImage,
} from "@/src/components/ImageEditor/ImageUploadWithEditor";
import { axiosSecure } from "@/src/hooks/axiosSecure";

export type ProjectType = "web" | "app";
export type Tech = (typeof TECH_STACK)[number];

export interface ProjectFormData {
  type: ProjectType;
  title: string;
  description: string;
  githubLink: string;
  liveLink: string;
  technologies: Tech[];
  images: EditedImage[];
}

export const TECH_STACK = [
  "HTML",
  "CSS",
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Vue",
  "Nuxt",
  "Angular",
  "Svelte",
  "Tailwind CSS",
  "Bootstrap",
  "Node.js",
  "Express",
  "NestJS",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "Redis",
  "Prisma",
  "GraphQL",
  "REST API",
  "Python",
  "Django",
  "FastAPI",
  "C",
  "C++",
  "C#",
  ".NET",
  "Java",
  "Spring Boot",
  "PHP",
  "Laravel",
  "Flutter",
  "React Native",
  "Docker",
  "AWS",
  "Firebase",
  "Supabase",
] as const;

/* ── Shared styles ── */
const inputCls =
  "w-full px-4 py-2.5 rounded-xl " +
  "bg-(--color-active-bg) border border-(--color-active-border) " +
  "text-(--color-text) text-sm placeholder:text-(--color-gray) " +
  "focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 " +
  "transition-all duration-200";

/* ── Field wrapper ── */
const Field = ({
  label,
  icon,
  children,
  error,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  error?: string;
}) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-sm text-(--color-gray) bangla">
      {icon}
      {label}
    </label>
    {children}
    <AnimatePresence>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="text-xs text-rose-500 bangla"
        >
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

/* ════════════════════════════════════════════════════════ */
export default function AddProjectsPage() {
  const [techSearch, setTechSearch] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    defaultValues: {
      type: "web",
      title: "",
      description: "",
      githubLink: "",
      liveLink: "",
      technologies: [],
      images: [],
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedTechs = watch("technologies");
  const selectedType = watch("type");
  const description = watch("description");

  const toggleTech = useCallback(
    (t: Tech) => {
      const current = selectedTechs ?? [];
      setValue(
        "technologies",
        current.includes(t) ? current.filter((x) => x !== t) : [...current, t],
        { shouldValidate: true },
      );
    },
    [selectedTechs, setValue],
  );

  // blob → base64 (browser-compatible)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const onSubmit = async (data: ProjectFormData) => {
    const formData = new FormData();

    // ── Text fields ──
    formData.append("type", data.type);
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("githubLink", data.githubLink ?? "");
    formData.append("liveLink", data.liveLink ?? "");
    formData.append("technologies", JSON.stringify(data.technologies));

    // ── Images as Blob (no base64 conversion needed) ──
    data.images.forEach((img, i) => {
      formData.append("images", img.blob, img.originalName ?? `image-${i}.jpg`);
    });

    await axiosSecure.post("/api/projects", formData, {
      timeout: 60000, // 60 seconds for upload
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    setSuccess(true);
    reset();
    setTimeout(() => setSuccess(false), 3000);
  };

  const filteredTechs = TECH_STACK.filter((t) =>
    t.toLowerCase().includes(techSearch.toLowerCase()),
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 max-w-2xl mx-auto p-4"
    >
      {/* ── Type (Pills) ── */}
      <Field label="প্রজেক্ট ধরন" icon={<Globe className="w-3.5 h-3.5" />}>
        <div className="flex p-1 rounded-2xl bg-(--color-active-bg) border border-(--color-active-border)">
          {(["web", "app"] as const).map((t) => {
            const isActive = selectedType === t;

            return (
              <motion.button
                key={t}
                type="button"
                onClick={() => setValue("type", t)}
                whileTap={{ scale: 0.95 }}
                className="relative flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {/* Active background pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeTypePill"
                    className="absolute inset-0 rounded-xl bg-(--color-text) "
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Content */}
                <span
                  className={`relative z-10 flex items-center gap-2 transition-colors ${
                    isActive ? "text-(--color-bg)" : "text-(--color-gray)"
                  }`}
                >
                  {t === "web" ? (
                    <Globe className="w-4 h-4" />
                  ) : (
                    <Smartphone className="w-4 h-4" />
                  )}
                  <span className="bangla">
                    {t === "web" ? "ওয়েব অ্যাপ" : "মোবাইল অ্যাপ"}
                  </span>
                </span>
              </motion.button>
            );
          })}
        </div>
      </Field>

      {/* ── Title ── */}
      <Field
        label="শিরোনাম *"
        icon={<FileText className="w-3.5 h-3.5" />}
        error={errors.title?.message}
      >
        <input
          {...register("title", { required: "শিরোনাম দিন" })}
          type="text"
          placeholder="প্রজেক্টের নাম লিখুন..."
          className={inputCls}
        />
      </Field>

      {/* ── Description ── */}
      <Field
        label="বিবরণ *"
        icon={<FileText className="w-3.5 h-3.5" />}
        error={errors.description?.message}
      >
        <textarea
          {...register("description", { required: "বিবরণ দিন" })}
          rows={4}
          placeholder="প্রজেক্ট সম্পর্কে বিস্তারিত লিখুন..."
          className={`${inputCls} resize-none`}
        />
        <p className="text-right text-(--color-gray) text-xs">
          {description?.length ?? 0} অক্ষর
        </p>
      </Field>

      {/* ── Links ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="GitHub লিংক"
          icon={<FaGithub className="w-3.5 h-3.5" />}
          error={errors.githubLink?.message}
        >
          <input
            {...register("githubLink", {
              pattern: { value: /^https?:\/\/.+/, message: "সঠিক URL দিন" },
            })}
            type="url"
            placeholder="https://github.com/..."
            className={inputCls}
          />
        </Field>

        <Field
          label="লাইভ লিংক"
          icon={<ExternalLink className="w-3.5 h-3.5" />}
          error={errors.liveLink?.message}
        >
          <input
            {...register("liveLink", {
              pattern: { value: /^https?:\/\/.+/, message: "সঠিক URL দিন" },
            })}
            type="url"
            placeholder="https://myproject.com"
            className={inputCls}
          />
        </Field>
      </div>

      {/* ── Technologies ── */}
      <Field
        label="প্রযুক্তি *"
        icon={<Code2 className="w-3.5 h-3.5" />}
        error={errors.technologies?.message}
      >
        <input
          type="hidden"
          {...register("technologies", {
            validate: (v) => v.length > 0 || "কমপক্ষে একটি প্রযুক্তি বেছে নিন",
          })}
        />
        <div className="space-y-2">
          <input
            type="text"
            placeholder="প্রযুক্তি খুঁজুন..."
            value={techSearch}
            onChange={(e) => setTechSearch(e.target.value)}
            className={inputCls}
          />

          <AnimatePresence>
            {selectedTechs?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-1.5 p-2 rounded-lg
                  bg-(--color-active-bg) border border-(--color-active-border)"
              >
                {selectedTechs.map((t) => (
                  <motion.span
                    key={t}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full
                      bg-violet-600 text-white text-xs font-medium"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => toggleTech(t)}
                      className="hover:text-rose-300 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto p-2 rounded-xl
              bg-(--color-active-bg) border border-(--color-active-border)
              scrollbar-thin scrollbar-track-transparent scrollbar-thumb-(--color-active-border)"
          >
            {filteredTechs.map((t) => {
              const active = selectedTechs?.includes(t);
              return (
                <motion.button
                  key={t}
                  type="button"
                  whileTap={{ scale: 0.93 }}
                  onClick={() => toggleTech(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium
                    transition-all duration-150 flex items-center gap-1
                    ${
                      active
                        ? "bg-violet-600 text-white"
                        : "bg-(--color-active-bg) text-(--color-gray) border border-(--color-active-border) hover:text-(--color-active-text)"
                    }`}
                >
                  {active && <CheckCircle2 className="w-3 h-3" />}
                  {t}
                </motion.button>
              );
            })}
            {filteredTechs.length === 0 && (
              <p className="text-(--color-gray) text-xs bangla p-2">
                কিছু পাওয়া যায়নি
              </p>
            )}
          </div>
        </div>
      </Field>

      {/* ── Images ── */}
      <Field label="ছবি *" error={errors.images?.message}>
        <Controller
          name="images"
          control={control}
          rules={{
            validate: (v) => v.length > 0 || "কমপক্ষে একটি ছবি যোগ করুন",
          }}
          render={({ field }) => (
            <ImageUploadWithEditor
              images={field.value}
              onChange={field.onChange}
              maxImages={6}
            />
          )}
        />
      </Field>

      {/* ── Submit ── */}
      <motion.button
        type="submit"
        disabled={isSubmitting}
        whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
        whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
        className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500
          text-white font-semibold text-sm bangla flex items-center justify-center
          gap-2 transition-all shadow-lg shadow-violet-600/30
          disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <AnimatePresence mode="wait">
          {isSubmitting ? (
            <motion.span
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              প্রসেসিং...
            </motion.span>
          ) : success ? (
            <motion.span
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              সফলভাবে যোগ হয়েছে!
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              প্রজেক্ট যোগ করুন
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </form>
  );
}
