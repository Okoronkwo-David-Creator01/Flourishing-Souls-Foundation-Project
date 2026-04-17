import React from "react";
import useTheme from "../../hooks/useTheme";

export default function ThemeSwitcher() {
  const { theme, resolvedTheme, setTheme, loading } = useTheme();

  if (loading) return null;

  const next =
    theme === "system"
      ? resolvedTheme === "dark"
        ? "light"
        : "dark"
      : theme === "dark"
      ? "light"
      : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
      aria-label="Toggle theme"
    >
      <span className="select-none">
        {resolvedTheme === "dark" ? "Dark" : "Light"}
      </span>
      <span className="text-xs opacity-70">({theme})</span>
    </button>
  );
}

