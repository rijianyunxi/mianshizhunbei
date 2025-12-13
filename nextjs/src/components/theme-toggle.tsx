"use client";

import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  if (typeof window === "undefined") return null;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card transition hover:border-primary hover:text-primary"
      aria-label={isDark ? "切换到明亮模式" : "切换到暗色模式"}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
