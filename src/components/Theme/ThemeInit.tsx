"use client";

import { useEffect } from "react";

export default function ThemeInit() {
  useEffect(() => {
    try {
      const t = localStorage.getItem("theme");
      document.documentElement.setAttribute(
        "data-theme",
        t === "light" || t === "dark" ? t : "dark",
      );
    } catch (e) {}
  }, []);

  return null;
}
