"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosSecure } from "@/src/hooks/axiosSecure";

export default function ViewTracker({ slug }: { slug: string }) {
  const hasTracked = useRef(false);
  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: async () => {
      const res = await axiosSecure.post(
        `/api/articles/${encodeURIComponent(slug)}/view`,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
  });

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;
    mutate();
  }, [mutate]);

  return null;
}
