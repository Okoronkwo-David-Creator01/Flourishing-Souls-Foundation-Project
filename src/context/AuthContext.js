/**
 * AuthContext - Complex, production-ready authentication context using Supabase.
 *
 * Provides:
 *   - AuthProvider: Top-level context provider for authentication.
 *   - AuthContext: React context for consuming authentication state.
 *   - useAuth: Typed consumer hook for authentication in components.
 *
 * Usage:
 *   import { AuthProvider, AuthContext, useAuth } from "@/context/AuthContext";
 *   // In AppProviders (see src/context/index.js), wrap with <AuthProvider>
 *   // Use useAuth() in any component to access auth state/methods
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { getProfile, createProfile } from "../services/authService";
import PropTypes from "prop-types";

/**
 * AuthContext shape:
 * {
 *   user: null | {...SupabaseUserProfile},
 *   session: null | SupabaseSession,
 *   loading: boolean,
 *   error: null | Error,
 *   signIn: (props) => Promise,
 *   signUp: (props) => Promise,
 *   signOut: () => Promise,
 *   updateProfile: (values) => Promise,
 *   refreshUser: () => Promise,
 *   providerSignIn: (provider: "google" | "github" | ...) => Promise,
 * }
 */
const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);        // Supabase session object
  const [user, setUser] = useState(null);              // App user profile object
  const [loading, setLoading] = useState(true);        // Loading/auth resolving
  const [error, setError] = useState(null);

  // --- Subscribe to Supabase auth state
  useEffect(() => {
    let mounted = true;

    // Initial state
    const fetchSession = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) setSession(session);

        if (session?.user) {
          const profile = await getProfile(session.user.id);
          if (mounted) setUser(profile);
        } else {
          setUser(null);
        }
      } catch (err) {
        setError(err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          try {
            const profile = await getProfile(session.user.id);
            if (mounted) setUser(profile);
          } catch (err) {
            setError(err);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      mounted = false;
      // Fix: call unsubscribe() directly, as recommended by Supabase API
      if (authListener && typeof authListener.unsubscribe === "function") {
        authListener.unsubscribe();
      }
    };
  }, []);

  // -- Auth Functions --

  // Credentials sign-in (email+password)
  const signIn = useCallback(
    async ({ email, password }) => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
        if (authErr) throw authErr;
        // session and profile will auto-fetch from listener
        return { data };
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Credentials sign-up + profile creation
  const signUp = useCallback(
    async ({ email, password, ...profileFields }) => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpErr) throw signUpErr;

        // On new user, create user profile (optionally handle email confirmations, etc.)
        if (data.user) {
          await createProfile(data.user.id, { email, ...profileFields }); // Prepares user row in app DB
        }

        // session and profile will auto-fetch from listener
        return { data };
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // OAuth Sign-in (Google, GitHub, etc.)
  const providerSignIn = useCallback(
    async (provider) => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: providerErr } = await supabase.auth.signInWithOAuth({
          provider,
        });
        if (providerErr) throw providerErr;
        // Redirect will occur. User/session/profile handled by authStateChange
        return data;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Sign-out
  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: signOutErr } = await supabase.auth.signOut();
      if (signOutErr) throw signOutErr;
      setSession(null);
      setUser(null);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // User profile update (custom table, not supabase.auth.user!)
  const updateProfile = useCallback(
    async (changes) => {
      if (!user) throw new Error("No authenticated user.");
      setLoading(true);
      setError(null);
      try {
        // Save to app DB
        const updated = await createProfile(user.id, { ...user, ...changes }); // or call updateProfile, according to your API
        // Refresh local
        setUser(updated);
        return updated;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Manual user/profile refresh
  const refreshUser = useCallback(
    async () => {
      if (!session?.user) return null;
      setLoading(true);
      try {
        const freshProfile = await getProfile(session.user.id);
        setUser(freshProfile);
        return freshProfile;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  // Memoize context value to avoid unnecessary renders
  const contextValue = useMemo(() => ({
    session,
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    providerSignIn,
    updateProfile,
    refreshUser,
    isAuthenticated: !!user,
  }), [
    session, user, loading, error,
    signIn, signUp, signOut,
    providerSignIn, updateProfile, refreshUser
  ]);

  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    children
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node,
};

// Typed auth hook
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export { AuthContext };