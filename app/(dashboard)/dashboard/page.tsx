"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { LogOut, Shield } from "lucide-react";
import {
  decodeToken,
  removeToken,
  isAuthenticated,
  type TokenPayload,
} from "@/src/lib/auth-client";
import toast, { Toaster } from "react-hot-toast";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<TokenPayload | null>(null);

  useEffect(() => {
    // Check auth on mount
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    const payload = decodeToken();
    if (payload) {
      setUser(payload);
    } else {
      router.replace("/login");
    }
  }, [router]);

  const handleLogout = () => {
    removeToken();
    toast.success("লগআউট সফল!");
    setTimeout(() => router.replace("/login"), 500);
  };

  // Don't render until user is loaded
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--color-bg)">
        <Toaster position="top-center" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 rounded-full border-2 border-(--color-active-text) border-t-transparent"
        />
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-(--color-bg) flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm p-6 rounded-2xl bg-(--color-active-bg) border border-(--color-active-border)"
        >
          {/* User Info */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-(--color-bg) border border-(--color-active-border) flex items-center justify-center">
              <Shield
                size={20}
                strokeWidth={1.8}
                className="text-(--color-active-text)"
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-(--color-text)">
                ড্যাশবোর্ড
              </h2>
              <p className="text-xs text-(--color-gray)">
                {user.username} • {user.role}
              </p>
            </div>
          </div>

          {/* Token Info */}
          <div className="space-y-3 mb-6">
            <div className="p-3 rounded-xl bg-(--color-bg) border border-(--color-active-border)">
              <p className="text-xs text-(--color-gray) mb-1">Username</p>
              <p className="text-sm font-medium text-(--color-text)">
                {user.username}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-(--color-bg) border border-(--color-active-border)">
              <p className="text-xs text-(--color-gray) mb-1">Role</p>
              <p className="text-sm font-medium text-(--color-text)">
                {user.role}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-(--color-bg) border border-(--color-active-border)">
              <p className="text-xs text-(--color-gray) mb-1">Token Expires</p>
              <p className="text-sm font-medium text-(--color-text)">
                {user.exp
                  ? new Date(user.exp * 1000).toLocaleString("bn-BD")
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Logout */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleLogout}
            className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2
                       bg-red-500/10 text-red-500 border border-red-500/20 cursor-pointer
                       hover:bg-red-500/15 transition-colors duration-200"
          >
            <LogOut size={16} strokeWidth={2} />
            লগআউট
          </motion.button>
        </motion.div>
      </div>
    </>
  );
}
