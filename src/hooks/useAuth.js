/**
 * useAuth - A real, production ready user authentication hook using Supabase for Flourishing Souls Foundation.
 * Integrates robust session persistence (auth state), secure sign-in, sign-up, sign-out, social auth, 
 * password recovery, and user refresh. No simulation—all logic completed against real Supabase backend.
 * 
 * Environment: 
 *   VITE_SUPABASE_URL, VITE_SUPABASE_KEY required (see .env.example)
 *
 * Usage:
 *   const { user, session, loading, signIn, signUp, signOut, ... } = useAuth();
 */
import { useState, useEffect, useCallback } from "react";
import { useNotification } from "../context/NotificationContext";
import { useUser } from "../context/UserContext";
import { getSupabaseClient } from "../lib/supabase";

/**
 * Initializes Supabase from environment; must be properly configured and secrets never exposed on client.
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const supabase = getSupabaseClient(SUPABASE_URL, SUPABASE_KEY);

function useAuth() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Notification handler (e.g. toast/snackbar for auth feedback)
  const notify = useNotification?.();
  // Optionally refresh app-wide user profile when auth changes
  const { refreshUserProfile } = useUser?.() || {};

  // Core effect: Hydrate session/user and sync with Supabase auth state (across tabs, realtime)
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Live auth state changes (sign-in/out, token refresh, multi-tab sync)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (refreshUserProfile && newSession?.user) {
          try {
            await refreshUserProfile(newSession.user.id);
          } catch {
            // error intentionally ignored to prevent unhandled rejections
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line
  }, []);

  /**
   * Sign in with email and password (returns user or throws)
   */
  const signIn = useCallback(
    async ({ email, password }, { redirectTo } = {}) => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) {
          notify?.error?.(error.message || "Sign-in failed.");
          throw error;
        }
        setUser(data.user ?? null);
        if (redirectTo) window.location.assign(redirectTo);
        notify?.success?.("Signed in successfully.");
        return data.user;
      } finally {
        setLoading(false);
      }
    },
    [notify]
  );

  /**
   * Register new user (optionally with public metadata)
   */
  const signUp = useCallback(
    async ({ email, password, ...meta }, { redirectTo } = {}) => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: meta,
            emailRedirectTo: redirectTo || window.location.origin
          }
        });
        if (error) {
          notify?.error?.(error.message || "Sign-up failed.");
          throw error;
        }
        setUser(data.user ?? null);
        notify?.success?.("Registration successful! Please check your email to confirm your account.");
        return data.user;
      } finally {
        setLoading(false);
      }
    },
    [notify]
  );

  /**
   * OAuth sign-in (Google, GitHub, etc)
   */
  const signInWithProvider = useCallback(
    async (provider, { redirectTo } = {}) => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo: redirectTo || window.location.origin }
        });
        if (error) {
          notify?.error?.(error.message || `Sign-in with ${provider} failed.`);
          throw error;
        }
        // On success, browser will redirect - data.url may be used for manual navigation
        return data;
      } finally {
        setLoading(false);
      }
    },
    [notify]
  );

  /**
   * Sign out current user
   */
  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        notify?.error?.(error.message || "Sign-out failed.");
        throw error;
      }
      setUser(null);
      setSession(null);
      notify?.success?.("Signed out successfully.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  /**
   * Send password reset email (secure, no simulation)
   */
  const requestPasswordReset = useCallback(
    async (email, { redirectTo } = {}) => {
      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectTo || window.location.origin,
        });
        if (error) {
          notify?.error?.(error.message || "Password reset failed.");
          throw error;
        }
        notify?.success?.("Check your email for a password reset link (don't forget spam!).");
        return true;
      } finally {
        setLoading(false);
      }
    },
    [notify]
  );

  /**
   * Set a new password (after arriving via email recovery link)
   */
  const updatePassword = useCallback(
    async (newPassword) => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          notify?.error?.(error.message || "Password update failed.");
          throw error;
        }
        notify?.success?.("Password updated. You may now login.");
        return data;
      } finally {
        setLoading(false);
      }
    },
    [notify]
  );

  /**
   * Always get latest user profile from Supabase (bypassing local state/cache)
   */
  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user: freshUser }, error } = await supabase.auth.getUser();
      if (error) {
        notify?.error?.(error.message || "Failed to fetch user.");
        throw error;
      }
      setUser(freshUser ?? null);
      return freshUser;
    } finally {
      setLoading(false);
    }
  }, [notify]);

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user,

    // Auth controls
    signIn,
    signUp,
    signOut,
    signInWithProvider,
    requestPasswordReset,
    updatePassword,
    refreshUser,
    setUser, // Provided for advanced scenarios (not typically required)
  };
}

export { useAuth };
export default useAuth;


