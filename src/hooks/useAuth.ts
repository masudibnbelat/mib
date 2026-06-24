// useAuth.ts

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { decodeToken, type TokenPayload } from "@/src/lib/auth-client";

export function useAuthGuard() {
  const router = useRouter();
  const [user, setUser] = useState<TokenPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkAuth = () => {
      const payload = decodeToken();

      if (!payload) {
        router.replace("/login");
        return;
      }

      setUser(payload);
      setIsLoading(false);
    };

    const timer = setTimeout(checkAuth, 50);
    return () => clearTimeout(timer);
  }, [router]);

  return { user, isLoading };
}
