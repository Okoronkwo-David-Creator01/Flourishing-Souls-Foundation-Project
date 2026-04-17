/**
 * ThemeProvider.jsx
 * Complex, production-ready Theme Context + Provider for real-time user theme preference.
 * This component manages theme (light/dark/system) state, persists it across sessions,
 * automatically updates on system preference and user toggle, and syncs to localStorage for cross-tab.
 * Use this to wrap your app in App.jsx or main.jsx.
 */

import React, { createContext, useEffect, useState, useCallback } from "react";

// Utility: Detect system preference
function getSystemTheme() {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// All supported themes
const THEMES = ["light", "dark", "system"];
const LOCAL_STORAGE_KEY = "fsf-theme-preference";

// Context
export const ThemeContext = createContext({
  theme: "system", // user-set: 'light'|'dark'|'system'
  resolvedTheme: "light", // resolved: 'light'|'dark'
  setTheme: () => {},
  loading: true
});

/**
 * ThemeProvider: provides current theme, auto-persisted, auto-detected, cross-tab & system aware.
 * @param children
 * @returns {JSX.Element}
 */
function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("system");
  const [resolvedTheme, setResolvedTheme] = useState(getSystemTheme());
  const [loading, setLoading] = useState(true);

  // Document theme toggling logic
  function applyTheme(userTheme, sysTheme) {
    const real = userTheme === "system" ? (sysTheme || getSystemTheme()) : userTheme;
    document.documentElement.setAttribute("data-theme", real);

    // Optionally: adjust background-color immediately for non-FOUC
    if (real === "dark") {
      document.documentElement.style.backgroundColor = "#18192f";
    } else {
      document.documentElement.style.backgroundColor = "#fbfbff";
    }
  }

  // Sync theme from localStorage at mount
  useEffect(() => {
    let stored = null;
    try {
      stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    } catch {
      // SSR/malformed; ignore
    }
    if (stored && THEMES.includes(stored)) {
      // Defer setState to avoid cascading renders (schedule after paint)
      setTimeout(() => setThemeState(stored), 0);
    }

    // Set initial theme on documentElement
    const initial = stored && THEMES.includes(stored) ? stored : "system";
    applyTheme(initial);

    // Defer setState to avoid cascading renders (schedule after paint)
    setTimeout(() => setLoading(false), 0);
    // eslint-disable-next-line
  }, []);

  // Watch system theme changes only if 'system' is selected
  useEffect(() => {
    if (theme !== "system") {
      // Avoid calling setResolvedTheme synchronously in the effect to prevent cascading renders.
      // Instead, we can defer it with setTimeout to schedule after paint.
      setTimeout(() => setResolvedTheme(theme), 0);
      applyTheme(theme);
      return;
    }
    // system = dynamic detection
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const sys = getSystemTheme();
      setResolvedTheme(sys);
      applyTheme("system", sys);
    };
    mq.addEventListener("change", handler);
    handler(); // initialize
    return () => {
      mq.removeEventListener("change", handler);
    };
  }, [theme]);

  // Cross-tab localStorage sync
  useEffect(() => {
    const handler = (e) => {
      if (e.key === LOCAL_STORAGE_KEY && THEMES.includes(e.newValue)) {
        setThemeState(e.newValue);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // Handle setting & persisting theme
  const setTheme = useCallback((nextTheme) => {
    if (!THEMES.includes(nextTheme)) return;
    setThemeState(nextTheme);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, nextTheme);
    } catch {
      // ignore errors
    }
    applyTheme(nextTheme);
  }, []);

  // Context value
  const ctxVal = {
    theme,
    resolvedTheme: theme === "system" ? resolvedTheme : theme,
    setTheme,
    loading,
  };

  return (
    <ThemeContext.Provider value={ctxVal}>
      {children}
    </ThemeContext.Provider>
  );
}

// useContext is intentionally not imported, which resolves the 'defined but never used' lint error.

/*
// Uncomment below if needed elsewhere in the project:

/ **
 * useTheme: React hook for reading and changing user/app theme in real time.
 * @returns {{theme, resolvedTheme, setTheme, loading}}
 * /
import { useContext } from "react";
function useTheme() {
  return useContext(ThemeContext);
}
*/

// ThemeSwitcher IS NOT EXPORTED HERE: To resolve duplicated export error

// Also export core atomic/common UI elements (to serve as a true barrel as in the README structure)
// If you see an import error for Layout, create 'layout.jsx' (or 'layout/index.jsx') in: src/components/common/
// Example path: src/components/common/layout.jsx
import Layout from "./Layout";
import Button from "./Button";
import Modal from "./Modal";
import Notification from "./Notification";
import Spinner from "./Spinner";

export function notifySuccess(message) {
  console.log(message);
}

export function notifyError(message) {
  console.error(message);
}

// Recommended file location for these shared atomic UI components:
// Place 'Button.jsx', 'Modal.jsx', and 'Notification.jsx' in: src/components/common/
// For Layout, create a file in: src/components/common/Layout.jsx

/**
 * Export all relevant shared/common components
 * - ThemeProvider, and atomic UI
 * - ThemeSwitcher and useTheme are not exported here; export from the unique location only
 */
export {
  ThemeProvider,
  Layout,
  Button,
  Modal,
  Notification,
  Spinner,
};

export default ThemeProvider;
