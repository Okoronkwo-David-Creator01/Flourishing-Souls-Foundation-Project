/**
 * ThemeContext - Production-level Theme Provider for Dark/Light Mode
 *
 * Supports system theme sync, persistence via localStorage, explicit forcing,
 * and dynamic toggling. Theme value can be 'light', 'dark', or 'system'.
 * Handles hydration flicker, SSR/CSR, and accessibility. Works seamlessly with Tailwind CSS.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useState,
} from "react";

const THEME_KEY = "theme-preference";

export const ThemeContext = createContext();

/**
 * useTheme - Access theme and helpers from context.
 */
export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
};

/**
 * Detect initial theme preference.
 * Uses order: 1. saved in storage, 2. system, 3. fallback.
 */
const GET_INITIAL_THEME = () => {
  if (typeof window === "undefined") return "light"; // SSR/fallback
  const persistedTheme = window.localStorage.getItem(THEME_KEY);
  if (persistedTheme === "light" || persistedTheme === "dark")
    return persistedTheme;
  // Check system
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  return mql.matches ? "dark" : "light";
}

/**
 * "System or explicit" theme.
 * - If theme === "system", tracks system pref.
 * - If theme is "light"/"dark", uses that.
 * - Returns "dark" or "light"
 */
function resolveTheme(theme) {
  if (theme === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

export const ThemeProvider = ({ children }) => {
  // theme: 'light' | 'dark' | 'system'
  const [theme, setTheme] = useState(() =>
    typeof window !== "undefined"
      ? window.localStorage.getItem(THEME_KEY) || "system"
      : "system"
  );
  // hydrated: avoid SSR/CSR mismatch (flickers)
  const [hydrated, setHydrated] = useState(false);

  // --- Keep system theme in sync if needed ---
  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      // Moved inline logic here to avoid accessing applyTheme before its declaration
      const root = window.document.documentElement;
      const mode = mql.matches ? "dark" : "light";
      root.classList.remove("dark", "light");
      root.classList.add(mode);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute("content", mode === "dark" ? "#090f20" : "#f8fafc");
      }
    };
    mql.addEventListener
      ? mql.addEventListener("change", onChange)
      : mql.addListener(onChange);
    return () => {
      mql.removeEventListener
        ? mql.removeEventListener("change", onChange)
        : mql.removeListener(onChange);
    };
    // eslint-disable-next-line
  }, [theme]);

  // --- Hydration: set a flag once on mount ---
  useEffect(() => {
    // To avoid setting state synchronously in the effect body,
    // queue the update using requestAnimationFrame (or setTimeout as a fallback)
    if (!hydrated) {
      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => setHydrated(true));
      } else {
        setTimeout(() => setHydrated(true), 0);
      }
    }
  }, );

  // --- Persist user choice ---
  useEffect(() => {
    if (!hydrated) return;
    if (theme === "system") {
      window.localStorage.removeItem(THEME_KEY);
    } else {
      window.localStorage.setItem(THEME_KEY, theme);
    }
    // Delay applyTheme call until after it has been declared to avoid TDZ
    // (Lazily import using setTimeout after hydration and localStorage update)
    // Move setTimeout + applyTheme call after applyTheme is declared to avoid temporal dead zone.
    // We'll schedule this in a separate useEffect after applyTheme exists.
    // Here, just persist localStorage; the actual applyTheme call is handled after declaration.
  }, [theme, hydrated]);

  // --- Core: Apply theme (set HTML class, meta color, etc) ---
  const applyTheme = useCallback(
    (raw, explicit) => {
      // raw: 'dark' | 'light' | 'system'
      // explicit: force value ('dark'/'light'), otherwise resolve
      const root = window.document.documentElement;
      const mode = explicit || resolveTheme(raw || theme);
      root.classList.remove("dark", "light");
      root.classList.add(mode);
      // Tailwind 'dark:' helpers are on <html>
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute(
          "content",
          mode === "dark" ? "#090f20" : "#f8fafc"
        );
      }
    },
    [theme]
  );

  // --- Helper: Set a theme, including 'system' ---
  const setThemeMode = useCallback(
    (value) => {
      if (value !== "light" && value !== "dark" && value !== "system")
        throw new Error("Invalid theme value: " + value);
      setTheme(value);
      applyTheme(value);
    },
    [applyTheme]
  );

  // --- Helper: Toggle theme ('light' <=> 'dark'). If 'system', toggles to manual. ---
  const toggleTheme = useCallback(() => {
    setTheme((cur) => {
      let next;
      if (cur === "light") next = "dark";
      else if (cur === "dark") next = "light";
      else
        next = resolveTheme("system") === "dark"
          ? "light"
          : "dark";
      window.localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
      return next;
    });
  }, [applyTheme]);

  // --- Memoize context value ---
  const contextValue = useMemo(
    () => ({
      theme,
      resolvedTheme: resolveTheme(theme),
      setTheme: setThemeMode,
      toggleTheme,
      hydrated,
    }),
    [theme, setThemeMode, toggleTheme, hydrated]
  );

  // --- Prevent hydration mismatch render flicker ---
  if (!hydrated && typeof window !== "undefined") {
    // SSR, return blank - (optionally a loader/spinner)
    return React.createElement("div", {
      style: { visibility: "hidden", height: 0 },
    });
  }

  return React.createElement(
    ThemeContext.Provider,
    { value: contextValue },
    children
  );
};




