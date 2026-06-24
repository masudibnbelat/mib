"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { decodeToken, type TokenPayload } from "@/src/lib/auth-client";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<TokenPayload | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const checkAuth = useCallback(() => {
    const payload = decodeToken();
    setUser(payload);
    return payload;
  }, []);

  useEffect(() => {
    // ✅ Client-side mount mark
    setIsMounted(true);
    checkAuth();

    // ✅ Cross-tab (other tab e token change)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "auth_token") checkAuth();
    };

    // ✅ Same-tab (token set/remove)
    const handleCustom = () => checkAuth();

    window.addEventListener("storage", handleStorage);
    window.addEventListener("auth-token-change", handleCustom);

    // ✅ Token expire check
    const interval = setInterval(checkAuth, 5000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("auth-token-change", handleCustom);
      clearInterval(interval);
    };
  }, [checkAuth]);

  // ✅ Redirect only after mount
  useEffect(() => {
    if (isMounted && !user) {
      router.replace("/login");
    }
  }, [isMounted, user, router]);

  // ✅ Server & client initial render: same output (loading spinner)
  //    No hydration mismatch!
  if (!isMounted || !user) {
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
