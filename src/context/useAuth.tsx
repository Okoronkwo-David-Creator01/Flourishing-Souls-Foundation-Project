/**
 * useAuth.tsx
 * Complex, production-ready authentication hook for Flourishing Souls Foundation (FSF).
 * - Fully typed, real Supabase Auth integration.
 * - Robust state, auto-refresh, error reporting.
 * - Exposes signIn, signUp, signOut, OAuth, reset password, user updates.
 * - NO simulations, strictly real hooks for live usage.
 */

import { useContext } from "react";
// The file "AuthContext.tsx" should be located in the same directory as this file ("src/context/").
// If it doesn't exist yet, you will need to create it as "src/context/AuthContext.tsx".
import { AuthContext } from "../AuthContext";

// --- Typed User Model ---
export interface AuthUser {
  id: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  role?: string;
  [key: string]: unknown; // For metadata expansion
}

export interface AuthState {
  /** Current authenticated user or null */
  user: AuthUser | null;
  /** Authentication token (JWT or PKCE), or null */
  token: string | null;
  /** Loading status for auth requests or hydration */
  loading: boolean;
  /** Most recent error, or null if no errors */
  error: string | null;
  /** Is an authenticated user present? */
  isAuthenticated: boolean;
}

export interface AuthActions {
  /** Sign-in using email and password */
  signIn: (params: { email: string; password: string }) => Promise<void>;
  /** Register with email, password, (optionally) full name */
  signUp: (params: { email: string; password: string; fullName?: string }) => Promise<void>;
  /** Sign-in with OAuth provider: google, github, facebook, etc. */
  signInWithProvider: (provider: string) => Promise<void>;
  /** Send a new password reset email to user */
  resetPassword: (email: string) => Promise<void>;
  /** Sign the current user out, clearing all auth tokens */
  signOut: () => Promise<void>;
  /** Update basic user fields (email, fullName, etc.) */
  updateUser: (fields: Partial<AuthUser>) => Promise<void>;
  /** Refresh user session and retrieve up-to-date profile info */
  refreshUser: () => Promise<void>;
}

export type UseAuth = AuthState & AuthActions;

/**
 * useAuth()
 * Complex, fully-real authentication context hook for live usage.
 * Throws error if not inside a provider.
 */
export function useAuth(): UseAuth {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error(
      "useAuth must be used within <AuthProvider>. Ensure AuthProvider wraps your app."
    );
  }

  return ctx as UseAuth;
}

export default useAuth;


