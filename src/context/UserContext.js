/**
 * UserContext - Production-grade Auth Context for User State Management
 *
 * This context manages authentication state, user profile, auth tokens,
 * loading/error logic, reactivity to real-time changes with Supabase,
 * plus login, logout, register, password reset, and provider flow support.
 *
 * ⚠️ All state derives from Supabase and is always up-to-date.
 * ⚠️ Use this context across the app to get currentUser reliably.
 */

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { supabase } from "../lib/supabase";

const UserContext = createContext();

/**
 * useUser - Custom hook to access UserContext
 */
export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
};

/**
 * UserProvider - Provides auth/user context to children.
 */
export const UserProvider = ({ children }) => {
  // States: user, session, profile, loading, error
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null); // Supabase user
  const [profile, setProfile] = useState(null); // Custom user data from a "profiles" table, etc.
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [token, setToken] = useState(null); // Access token, if needed

  // --- Effect: Initialize Auth State on Mount ---
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const getSessionAndProfile = async () => {
      const {
        data: { session: _session },
        error: sessionErr,
      } = await supabase.auth.getSession();
      if (sessionErr) {
        if (isMounted) setAuthError(sessionErr.message);
        if (isMounted) setLoading(false);
        return;
      }
      if (isMounted) setSession(_session);
      if (_session?.user) {
        if (isMounted) setUser(_session.user);
        if (isMounted) setToken(_session.access_token);
        // Optionally fetch extended profile:
        // Delay fetchProfile access until after its declaration to avoid temporal dead zone
        // Use dynamic import (or wrap in setTimeout) as a temporary workaround:

        setTimeout(() => {
          import("react").then(() => {
            fetchProfile(_session.user.id, isMounted);
          });
        }, 0);
      } else {
        if (isMounted) setUser(null);
        if (isMounted) setProfile(null);
        if (isMounted) setToken(null);
      }
      if (isMounted) setLoading(false);
    };

    getSessionAndProfile();

    // Setup Supabase realtime auth state listener
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, _session) => {
        setSession(_session);
        setUser(_session?.user || null);
        setToken(_session?.access_token || null);
        if (_session?.user) {
          fetchProfile(_session.user.id, true);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe();
    };
    // eslint-disable-next-line
  }, []);

  /**
   * Fetch custom profile data for the signed-in user, e.g. from 'profiles' table.
   */
  const fetchProfile = useCallback(
    async (userId, _isMounted = true) => {
      // Prevent race conditions if multiple calls
      try {
        // Replace 'profiles' with actual table if different
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error && _isMounted) {
          setProfile(null);
        }
        if (data && _isMounted) {
          setProfile(data);
        }
      } catch {
        if (_isMounted) setProfile(null);
      }
    },
    []
  );

  // --- Auth Actions ---

  /**
   * Sign in with email/password.
   */
  const login = useCallback(
    async ({ email, password }) => {
      setAuthError(null);
      setLoading(true);
      try {
        const {
          data: { user: _user, session: _session },
          error,
        } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          setAuthError(error.message);
          setSession(null);
          setUser(null);
          setProfile(null);
          setToken(null);
          setLoading(false);
          return { error };
        }
        setSession(_session);
        setUser(_user);
        setToken(_session?.access_token);
        if (_user) {
          await fetchProfile(_user.id, true);
        }
        setLoading(false);
        return { session: _session, user: _user };
      } catch (err) {
        setAuthError(err.message);
        setSession(null);
        setUser(null);
        setProfile(null);
        setToken(null);
        setLoading(false);
        return { error: err };
      }
    },
    [fetchProfile]
  );

  /**
   * Sign up (register) with email/password (+profile).
   * @param {Object} details { email, password, ...additionalFields }
   */
  const register = useCallback(
    async ({ email, password, ...meta }) => {
      setAuthError(null);
      setLoading(true);
      try {
        const {
          data: { user: _user, session: _session },
          error,
        } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: meta, // Additional signup fields - for extendable user info
          },
        });
        if (error) {
          setAuthError(error.message);
          setLoading(false);
          return { error };
        }
        setSession(_session);
        setUser(_user);
        setToken(_session?.access_token ?? null);

        // Optionally, insert initial profile into 'profiles' table
        if (_user) {
          await supabase.from("profiles").upsert(
            [
              {
                id: _user.id,
                email,
                ...meta,
              },
            ],
            { ignoreDuplicates: true }
          );
          await fetchProfile(_user.id, true);
        }
        setLoading(false);
        return { session: _session, user: _user };
      } catch (err) {
        setAuthError(err.message);
        setLoading(false);
        return { error: err };
      }
    },
    [fetchProfile]
  );

  /**
   * Sign out the current user
   */
  const logout = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setAuthError(error.message);
      }
      setSession(null);
      setUser(null);
      setProfile(null);
      setToken(null);
      setLoading(false);
    } catch (err) {
      setAuthError(err.message);
      setLoading(false);
    }
  }, []);

  /**
   * Reset password via email
   */
  const resetPassword = useCallback(async (email) => {
    setAuthError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-password", // Update to match your route if different
      });
      setLoading(false);
      if (error) {
        setAuthError(error.message);
        return { error };
      }
      return { success: true };
    } catch (err) {
      setAuthError(err.message);
      setLoading(false);
      return { error: err };
    }
  }, []);

  /**
   * Login with OAuth social providers (Google, Github, etc)
   * Example: signInWithProvider("google")
   */
  const signInWithProvider = useCallback(async (provider, options = {}) => {
    setAuthError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + "/auth/callback", // Route for handling social login callback
          ...options,
        },
      });
      setLoading(false);
      if (error) {
        setAuthError(error.message);
        return { error };
      }
      return { success: true };
    } catch (err) {
      setAuthError(err.message);
      setLoading(false);
      return { error: err };
    }
  }, []);

  // --- Memo for Provider value ---
  const contextValue = useMemo(
    () => ({
      session,
      user,
      profile,
      token,
      loading,
      authError,
      login,
      register,
      logout,
      resetPassword,
      signInWithProvider,
      refreshProfile: () => {
        if (user?.id) fetchProfile(user.id, true);
      },
      setProfile,
    }),
    [
      session,
      user,
      profile,
      token,
      loading,
      authError,
      login,
      register,
      logout,
      resetPassword,
      signInWithProvider,
      fetchProfile,
    ]
  );

  return React.createElement(
    UserContext.Provider,
    { value: contextValue },
    children
  );
};