"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "motion/react";
import { User, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

// ── Static credentials ──────────────────────────────────────────
const STATIC_USER = { username: "admin", password: "123456" };

type LoginFormData = {
  username: string;
  password: string;
};

const MotionDiv = motion.div;
const MotionButton = motion.button;
const MotionP = motion.p;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();

  const router = useRouter();

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    await new Promise((r) => setTimeout(r, 1000));

    if (
      data.username === STATIC_USER.username &&
      data.password === STATIC_USER.password
    ) {
      toast.success("লগইন সফল হয়েছে!");
      router.push("/dashboard");
    } else {
      toast.error("ইউজারনেম বা পাসওয়ার্ড ভুল!");
    }
  };

  return (
    <>
      <Toaster position="top-center" />

      <div className="w-full min-h-screen flex items-center justify-center px-4 py-10 relative bg-(--color-bg)">
        {/* Card */}
        <MotionDiv
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <MotionDiv
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4
                         bg-(--color-active-bg) border border-(--color-active-border)"
            >
              <Lock
                size={22}
                strokeWidth={1.8}
                className="text-(--color-text)"
              />
            </MotionDiv>

            <h1 className="text-2xl font-semibold tracking-tight text-(--color-text)">
              স্বাগতম
            </h1>
            <p className="text-sm mt-1 text-(--color-gray)">
              আপনার অ্যাকাউন্টে প্রবেশ করুন
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
            noValidate
          >
            {/* Username */}
            <MotionDiv
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <div className="relative">
                <div
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200
                    ${focusedField === "username" ? "text-(--color-active-text)" : "text-(--color-gray)"}`}
                >
                  <User size={18} strokeWidth={1.8} />
                </div>
                <input
                  {...register("username", {
                    required: "ইউজারনেম দিন",
                    minLength: { value: 3, message: "কমপক্ষে ৩ অক্ষর দিন" },
                  })}
                  type="text"
                  placeholder="Username"
                  autoComplete="username"
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-200
                    bg-(--color-active-bg) text-(--color-text) border-[1.5px]
                    ${
                      errors.username
                        ? "border-red-500"
                        : focusedField === "username"
                          ? "border-(--color-active-border) ring-2 ring-(--color-active-bg)"
                          : "border-(--color-active-border)"
                    }`}
                />
              </div>
              <AnimatePresence>
                {errors.username && (
                  <MotionP
                    initial={{ opacity: 0, height: 0, y: -4 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-1.5 mt-1.5 text-xs text-red-500"
                  >
                    <AlertCircle size={12} />
                    {errors.username.message}
                  </MotionP>
                )}
              </AnimatePresence>
            </MotionDiv>

            {/* Password */}
            <MotionDiv
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <div className="relative">
                <div
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200
                    ${focusedField === "password" ? "text-(--color-active-text)" : "text-(--color-gray)"}`}
                >
                  <Lock size={18} strokeWidth={1.8} />
                </div>
                <input
                  {...register("password", {
                    required: "পাসওয়ার্ড দিন",
                    minLength: { value: 6, message: "কমপক্ষে ৬ অক্ষর দিন" },
                  })}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  autoComplete="current-password"
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full pl-10 pr-11 py-3 rounded-xl text-sm outline-none transition-all duration-200
                    bg-(--color-active-bg) text-(--color-text) border-[1.5px]
                    ${
                      errors.password
                        ? "border-red-500"
                        : focusedField === "password"
                          ? "border-(--color-active-border) ring-2 ring-(--color-active-bg)"
                          : "border-(--color-active-border)"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-(--color-gray) transition-colors duration-200"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff size={17} strokeWidth={1.8} />
                  ) : (
                    <Eye size={17} strokeWidth={1.8} />
                  )}
                </button>
              </div>
              <AnimatePresence>
                {errors.password && (
                  <MotionP
                    initial={{ opacity: 0, height: 0, y: -4 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-1.5 mt-1.5 text-xs text-red-500"
                  >
                    <AlertCircle size={12} />
                    {errors.password.message}
                  </MotionP>
                )}
              </AnimatePresence>
            </MotionDiv>

            {/* Forgot Password */}
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-right -mt-1"
            >
              <button
                type="button"
                className="text-xs text-(--color-gray) transition-opacity duration-150 hover:opacity-70"
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </button>
            </MotionDiv>

            {/* Submit */}
            <MotionDiv
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <MotionButton
                type="submit"
                disabled={isSubmitting}
                whileTap={{ scale: 0.97 }}
                className={`w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2
                  bg-(--color-active-text) text-(--color-bg) transition-opacity duration-200
                  ${isSubmitting ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {isSubmitting ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="inline-block w-4 h-4 rounded-full border-2 border-(--color-bg) border-t-transparent"
                    />
                    <span>অপেক্ষা করুন...</span>
                  </>
                ) : (
                  <>
                    <span>প্রবেশ করুন</span>
                    <ArrowRight size={16} strokeWidth={2} />
                  </>
                )}
              </MotionButton>
            </MotionDiv>
          </form>

          {/* Demo hint */}
          <Link href="/">
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6 p-3 rounded-xl text-xs text-center
            bg-(--color-active-bg) border border-(--color-active-border) text-(--color-gray)"
            >
              Home
            </MotionDiv>
          </Link>
          {/* Demo hint */}
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 p-3 rounded-xl text-xs text-center
                       bg-(--color-active-bg) border border-(--color-active-border) text-(--color-gray)"
          >
            Demo — username:{" "}
            <strong className="text-(--color-text)">admin</strong>
            &nbsp;/&nbsp;password:{" "}
            <strong className="text-(--color-text)">123456</strong>
          </MotionDiv>
        </MotionDiv>
      </div>
    </>
  );
}
