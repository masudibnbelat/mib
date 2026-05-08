// src/components/Articles/ViewTracker.tsx

"use client";

import { useEffect, useRef } from "react";

export default function ViewTracker({ slug }: { slug: string }) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;

    const controller = new AbortController();

    // Fire and forget - view count +1
    fetch(`/api/articles/${slug}/view`, {
      method: "POST",
      signal: controller.signal,
    }).catch(() => {});

    return () => controller.abort();
  }, [slug]);

  return null;
}
