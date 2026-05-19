// src/components/Articles/TimeAgo.tsx
"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Clock } from "lucide-react";

interface TimeAgoProps {
  date: string | Date;
  className?: string;
  showIcon?: boolean;
}

export default function TimeAgo({
  date,
  className,
  showIcon = true,
}: TimeAgoProps) {
  const [timeAgo, setTimeAgo] = useState<string>("");

  useEffect(() => {
    // Only runs on client - avoids SSR mismatch
    const update = () => {
      setTimeAgo(formatDistanceToNow(new Date(date), { addSuffix: true }));
    };

    update();

    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [date]);

  if (!timeAgo) return null;

  return (
    <span className={`flex items-center gap-1.5 text-sm ${className ?? ""}`}>
      {showIcon && <Clock className="w-4 h-4" />}
      <span>{timeAgo}</span>
    </span>
  );
}
