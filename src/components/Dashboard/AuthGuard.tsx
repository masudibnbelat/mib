// src/components/Dashboard/AuthGuard.tsx

"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { getToken, isAuthenticated } from "@/src/lib/auth-client";

function subscribe(callback: () => void) {
  // ✅ Other tab
  const handleStorage = (e: StorageEvent) => {
    if (e.key === "auth_token") callback();
  };

  // ✅ Same tab (removeToken/setToken call হলে)
  const handleCustom = () => callback();

  window.addEventListener("storage", handleStorage);
  window.addEventListener("auth-token-change", handleCustom);

  // ✅ Fallback: token expire হলে ধরবে
  const interval = setInterval(callback, 5000);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("auth-token-change", handleCustom);
    clearInterval(interval);
  };
}

function getSnapshot() {
  return getToken();
}

function getServerSnapshot() {
  return null;
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const token = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const authenticated = !!token && isAuthenticated();

  useEffect(() => {
    if (!authenticated) {
      router.replace("/login");
    }
  }, [authenticated, router]);

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--color-bg)">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 rounded-full border-2 border-(--color-active-text) border-t-transparent"
          />
          <p className="text-sm text-(--color-gray)">
            লগইন পেজে নিয়ে যাচ্ছে...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
