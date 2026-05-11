"use client";

import { useEffect, useState } from "react";

const DatenClock = () => {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formattedDate = dateTime.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = dateTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <div className="flex  items-center justify-center gap-x-2 text-(--color-gray)">
      <p className="text-sm " suppressHydrationWarning>
        {formattedDate}
      </p>
      <span className="w-px h-3 bg-(--color-active-border) " />
      <h2 className="text-sm " suppressHydrationWarning>
        {formattedTime}
      </h2>
    </div>
  );
};

export default DatenClock;
