/**
 * useTheme.js
 * Real production hook for reading and updating the user's theme in real time,
 * fully in sync with ThemeProvider context. No mockups, not a simulation,
 * handles persistence, reactivity, and system color scheme detection.
 *
 * See: src/components/common/ThemeProvider.jsx for context/provider.
 */

import { useContext } from "react";

// Note: For real-time hook interop, always import ThemeContext from provider.
// Avoid code duplication: source of truth is ./ThemeProvider.jsx in /common.
import { ThemeContext } from "../components/common/ThemeProvider.jsx";

/**
 * useTheme - React hook for consuming and updating the app/user theme preference.
 *
 * @returns {{
 *   theme: "light"|"dark"|"system",
 *   resolvedTheme: "light"|"dark",
 *   setTheme: (theme: "light"|"dark"|"system") => void,
 *   loading: boolean
 * }}
 *
 * Usage:
 *   const { theme, resolvedTheme, setTheme, loading } = useTheme();
 *
 * @remarks
 * - `theme`: The current user preference as string ("light"|"dark"|"system").
 * - `resolvedTheme`: The applied theme after system resolution.
 * - `setTheme(nextTheme)`: Function to change user preference in real-time.
 * - `loading`: True until the theme is fully resolved on mount (for SSR/CSR FOUC prevention).
 */
export default function useTheme() {
  return useContext(ThemeContext);
}