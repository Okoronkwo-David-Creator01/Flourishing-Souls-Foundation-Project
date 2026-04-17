/**
 * SettingsContext - Advanced app/user settings context for Flourishing Souls Foundation
 *
 * Provides:
 *   - SettingsProvider: React context provider for all app and per-user settings.
 *   - SettingsContext: React context for consuming any setting or changing settings.
 *   - useSettings: Hook for easy access to settings state and setters.
 *
 * Features:
 *   - Light/dark theme (with sync to system preference + CSS variable update)
 *   - Text size preferences (small, medium, large, etc)
 *   - Language/locale preference
 *   - Notification toggles (email, push, SMS — optional)
 *   - Accessibility: high contrast mode, reduced motion, dyslexia font, etc.
 *   - Settings persisted in localStorage (and also persisted for authenticated users if hooked into remote profile)
 *   - Loads and merges user defaults, app defaults, local stored prefs
 */

import React, {
  createContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useContext
} from "react";
import PropTypes from "prop-types";

// Utilities for system preference detection
const getSystemTheme = () => {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const SUPPORTED_THEMES = ["light", "dark"];
const SUPPORTED_TEXT_SIZES = ["small", "medium", "large", "x-large"];
const SUPPORTED_LOCALES = ["en", "fr", "es", "de"]; // Add others as needed

const DEFAULT_SETTINGS = {
  theme: "system", // 'light' | 'dark' | 'system'
  textSize: "medium",
  locale: "en",
  notifications: {
    email: true,
    push: false,
    sms: false,
  },
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    dyslexiaFont: false,
  },
};

const LOCAL_STORAGE_KEY = "fsf_user_settings";

// ------- Context -----------
const SettingsContext = createContext(undefined);

/**
 * Utility: Read settings from localStorage
 */
function loadLocalSettings() {
  if (typeof window === "undefined") return {};
  try {
    const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

/**
 * Utility: Store user settings in localStorage
 */
function saveLocalSettings(settings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Optionally log the error in development for debugging:
    // if (process.env.NODE_ENV === "development") {
    //   console.error("Failed to save settings to localStorage");
    // }
  }
}

/**
 * Utility: Merge settings deeply (user > local > default)
 */
function mergeSettings(defaults, local, user) {
  return {
    ...defaults,
    ...local,
    ...user,
    notifications: {
      ...defaults.notifications,
      ...(local?.notifications || {}),
      ...(user?.notifications || {}),
    },
    accessibility: {
      ...defaults.accessibility,
      ...(local?.accessibility || {}),
      ...(user?.accessibility || {}),
    },
  };
}

/**
 * Update CSS/DOM for the active theme and other features (side effects)
 */
function applySettingsToDOM({ theme, accessibility, textSize }) {
  try {
    // Theme
    let appliedTheme =
      theme === "system" ? getSystemTheme() : theme;
    document.documentElement.setAttribute(
      "data-theme",
      appliedTheme
    );

    // Add a class for theme, high contrast, dyslexia font, and text size
    document.documentElement.classList.toggle(
      "theme-dark",
      appliedTheme === "dark"
    );
    document.documentElement.classList.toggle(
      "theme-light",
      appliedTheme === "light"
    );
    document.documentElement.classList.toggle(
      "high-contrast",
      !!accessibility.highContrast
    );
    document.documentElement.classList.toggle(
      "reduced-motion",
      !!accessibility.reducedMotion
    );
    document.documentElement.classList.toggle(
      "dyslexia-font",
      !!accessibility.dyslexiaFont
    );

    // Text size as a CSS variable
    let sizeVal =
      textSize === "small"
        ? "14px"
        : textSize === "large"
        ? "20px"
        : textSize === "x-large"
        ? "24px"
        : "16px";
    document.documentElement.style.setProperty("--fsf-base-text", sizeVal);
  } catch (error) {
    console.error("Error applying settings to DOM:", error);
  }
}

/**
 * SettingsProvider - Top-level context provider
 */
export function SettingsProvider({ children, userSettings }) {
  // userSettings: optional, fetched from remote or passed from Auth/Profile; highest priority in merging
  const [settings, setSettings] = useState(() =>
    mergeSettings(
      DEFAULT_SETTINGS,
      loadLocalSettings(),
      userSettings || {}
    )
  );
  // Track a stable theme for cross-tab and prefers-color-scheme changes
  const [systemTheme, setSystemTheme] = useState(getSystemTheme());

  // Listen for system color scheme changes (reactively update if "system" is selected)
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setSystemTheme(getSystemTheme());
    if (mq.addEventListener) {
      mq.addEventListener("change", handler);
    } else {
      mq.addListener(handler);
    }
    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener("change", handler);
      } else {
        mq.removeListener(handler);
      }
    };
  }, []);

  // Reload userSettings if prop changes (from server/db)
  useEffect(() => {
    setSettings(
      mergeSettings(DEFAULT_SETTINGS, loadLocalSettings(), userSettings || {})
    );
  }, [userSettings]);

  // Effect: persist to localStorage and DOM on change
  useEffect(() => {
    saveLocalSettings(settings);
    applySettingsToDOM(settings);
  }, [settings, systemTheme]);

  // Settings update API
  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      saveLocalSettings(updated);
      applySettingsToDOM(updated);
      return updated;
    });
  }, []);

  const updateNotificationSetting = useCallback((type, value) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        notifications: { ...prev.notifications, [type]: value }
      };
      saveLocalSettings(updated);
      applySettingsToDOM(updated);
      return updated;
    });
  }, []);

  const updateAccessibilitySetting = useCallback((type, value) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        accessibility: { ...prev.accessibility, [type]: value }
      };
      saveLocalSettings(updated);
      applySettingsToDOM(updated);
      return updated;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    saveLocalSettings(DEFAULT_SETTINGS);
    applySettingsToDOM(DEFAULT_SETTINGS);
  }, []);

  // Memoize API for consumers
  const value = useMemo(
    () => ({
      settings: {
        ...settings,
        // For convenience, resolve the applied theme
        resolvedTheme:
          settings.theme === "system" ? systemTheme : settings.theme,
      },
      updateSetting,
      updateNotificationSetting,
      updateAccessibilitySetting,
      resetSettings,
      SUPPORTED_THEMES,
      SUPPORTED_TEXT_SIZES,
      SUPPORTED_LOCALES,
    }),
    [
      settings,
      updateSetting,
      updateNotificationSetting,
      updateAccessibilitySetting,
      resetSettings,
      systemTheme,
    ]
  );

  return React.createElement(
    SettingsContext.Provider,
    { value },
    children
  );
}

SettingsProvider.propTypes = {
  children: PropTypes.node,
  userSettings: PropTypes.object // Optional from server/db/profile
};

// ----------- Hook -----------
/**
 * useSettings() - Convenient hook for getting/setting settings context.
 */
export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error(
      "useSettings must be used within a SettingsProvider."
    );
  }
  return ctx;
}

// ----------- HOC/Utility: withSettings -----------
/**
 * withSettings - HOC if you need to wrap class components
 */
export function withSettings(Component) {
  // eslint-disable-next-line react/display-name
  return function WrapperComponent(props) {
    const settings = useSettings();
    return React.createElement(Component, { ...props, settings });
  };
}

// ----------- Example: What settings look like -----------
/*
  settings = {
    theme: "dark" | "light" | "system",
    textSize: "small" | "medium" | "large" | "x-large",
    locale: "en",
    notifications: {
      email: true,
      push: false,
      sms: false,
    },
    accessibility: {
      highContrast: false,
      reducedMotion: false,
      dyslexiaFont: false,
    },
    resolvedTheme: "light" | "dark",
  }
*/
