/**
 * AdminContext - Advanced production-ready Admin Auth Context for managing admin state and permissions.
 *
 * This context manages admin authentication, elevated session, admin profile, global admin tools, granular permission checks,
 * loading/error logic, real-time reactivity, and provides secure admin actions.
 *
 * Designed to pair with Supabase or any JWT/OAuth provider.
 * Uses granular permission checks, auto-refresh, and tightly controls access to sensitive admin tools.
 * Meant for use ONLY around true admin-privileged areas. Do not expose admin secrets.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo
} from "react";
import { supabase } from "../lib/supabase";

// -- Define the core Admin Context --
const AdminContext = createContext();

/**
 * useAdmin - Custom hook to access AdminContext
 */
export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return ctx;
};

/**
 * isAdminUser(user) - Utility to check if a given user is an admin.
 * Swappable for your app's policy; example checks metadata/role or group
 */
function isAdminUser(user, profile) {
  // By convention: check JWT claims, app_metadata, or profile/roles.
  // Example: Supabase 'role' in user_metadata or custom column
  if (!user) return false;
  // Method 1: Supabase user.app_metadata or user.user_metadata
  if (
    user?.app_metadata?.role === "admin" ||
    user?.user_metadata?.role === "admin"
  )
    return true;
  // Method 2: If using custom db "admin_profiles"
  if (profile?.role === "admin") return true;
  // Method 3: If you want strict allowlist by email
  const ADMIN_EMAILS = (process.env.REACT_APP_ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase());
  if (
    user?.email &&
    ADMIN_EMAILS.length > 0 &&
    ADMIN_EMAILS.includes(user.email.toLowerCase())
  ) {
    return true;
  }
  // Default: not admin
  return false;
}

// --- AdminProvider: Protects access, loads admin session, manages admin profile, permissions, etc ---
export const AdminProvider = ({ children }) => {
  // States: admin (signed in user, must also have admin rights), session, profile, permissions, etc
  const [adminSession, setAdminSession] = useState(null);
  const [adminUser, setAdminUser] = useState(null); // Supabase user object
  const [adminProfile, setAdminProfile] = useState(null); // Optionally extended db profile
  const [adminToken, setAdminToken] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminError, setAdminError] = useState(null);

  // -- Fetch session/user on mount, verify admin, get profile/permissions --
  useEffect(() => {
    let isMounted = true; // for async race conditions
    setLoading(true);

    const fetchSessionAndAdmin = async () => {
      // Get Supabase session (JWT)
      const {
        data: { session },
        error: sessionErr
      } = await supabase.auth.getSession();

      if (sessionErr) {
        if (isMounted) {
          setAdminError(sessionErr.message);
          setLoading(false);
        }
        return;
      }

      // No session, no admin
      if (!session?.user) {
        if (isMounted) {
          setAdminSession(null);
          setAdminUser(null);
          setAdminProfile(null);
          setAdminToken(null);
          setIsAdmin(false);
          setPermissions([]);
          setLoading(false);
        }
        return;
      }

      const user = session.user;
      let profile = null;

      try {
        // Optional: fetch extended admin profile from a dedicated table (e.g. admin_profiles)
        // You may swap 'admin_profiles' for your real table
        const { data, error: profileErr } = await supabase
          .from("admin_profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileErr || !data) {
          // Fallback: try from user_metadata
          profile = user.user_metadata || {};
        } else {
          profile = data;
        }
      } catch {
        profile = user.user_metadata || {};
      }

      const _isAdmin = isAdminUser(user, profile);

      if (isMounted) {
        setAdminSession(session);
        setAdminUser(user);
        setAdminProfile(profile);
        setAdminToken(session.access_token);
        setIsAdmin(_isAdmin);
        setPermissions(profile?.permissions || []);
        setLoading(false);

        if (!_isAdmin) {
          setAdminError("You do not have admin privileges.");
        } else {
          setAdminError(null);
        }
      }
    };

    fetchSessionAndAdmin();

    // Listen for realtime auth changes, e.g. admin logs out, session expires, or role changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) {
          setAdminSession(null);
          setAdminUser(null);
          setAdminProfile(null);
          setAdminToken(null);
          setIsAdmin(false);
          setPermissions([]);
        } else {
          setLoading(true);
          // Re-run admin checks
          const user = session.user;
          let profile = null;
          try {
            const { data, error: profileErr } = await supabase
              .from("admin_profiles")
              .select("*")
              .eq("id", user.id)
              .single();

            if (profileErr || !data) {
              profile = user.user_metadata || {};
            } else {
              profile = data;
            }
          } catch {
            profile = user.user_metadata || {};
          }

          const _isAdmin = isAdminUser(user, profile);

          setAdminSession(session);
          setAdminUser(user);
          setAdminProfile(profile);
          setAdminToken(session.access_token);
          setIsAdmin(_isAdmin);
          setPermissions(profile?.permissions || []);
          setLoading(false);

          if (!_isAdmin) setAdminError("You do not have admin privileges.");
          else setAdminError(null);
        }
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
    // eslint-disable-next-line
  }, []);

  /**
   * Helper: Fetch full admin profile again. E.g. when updating permissions
   */
  const refreshAdminProfile = useCallback(
    async () => {
      if (!adminUser?.id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("admin_profiles")
          .select("*")
          .eq("id", adminUser.id)
          .single();
        if (error) {
          setAdminError(error.message);
          setAdminProfile(adminUser.user_metadata || {});
          setPermissions([]);
        } else {
          setAdminError(null);
          setAdminProfile(data);
          setPermissions(data?.permissions || []);
        }
      } catch {
        setAdminError("Error refreshing admin profile.");
      }
      setLoading(false);
    },
    [adminUser]
  );

  /**
   * loginAdmin - Only allow admins (server policy recommended!). Example: email/password.
   */
  const loginAdmin = useCallback(
    async ({ email, password }) => {
      setAdminError(null);
      setLoading(true);
      try {
        // Always recommend backend policies restrict this to admins ONLY
        const {
          data: { user, session },
          error
        } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          setAdminError(error.message);
          setLoading(false);
          setIsAdmin(false);
          return { error };
        }

        // Check admin again after login
        let profile = null;
        try {
          const { data, error: profileErr } = await supabase
            .from("admin_profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (profileErr || !data) {
            profile = user.user_metadata || {};
          } else {
            profile = data;
          }
        } catch {
          profile = user.user_metadata || {};
        }

        const _isAdmin = isAdminUser(user, profile);

        if (!_isAdmin) {
          setAdminError("Access denied. You are not an admin.");
          // Optionally sign out right away
          await supabase.auth.signOut();
          setLoading(false);
          setIsAdmin(false);
          setAdminSession(null);
          setAdminUser(null);
          setAdminProfile(null);
          setAdminToken(null);
          setPermissions([]);
          return { error: "Access denied. Not an admin." };
        }

        setAdminSession(session);
        setAdminUser(user);
        setAdminProfile(profile);
        setAdminToken(session.access_token);
        setIsAdmin(true);
        setPermissions(profile?.permissions || []);
        setLoading(false);
        setAdminError(null);

        return { session, user };
      } catch (err) {
        setAdminError(err.message || "Failed to login as admin.");
        setLoading(false);
        setIsAdmin(false);
        return { error: err };
      }
    },
    []
  );

  /**
   * logoutAdmin - Explicit admin logout. Clears all admin state securely.
   */
  const logoutAdmin = useCallback(async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore error, always wipe local state
    } finally {
      setAdminSession(null);
      setAdminUser(null);
      setAdminProfile(null);
      setAdminToken(null);
      setIsAdmin(false);
      setPermissions([]);
      setAdminError(null);
      setLoading(false);
    }
  }, []);

  /**
   * permissionCheck - Check if current admin has the required permission/action.
   * @param {string|string[]} perm - Permission key(s), e.g. "delete_user" or ["settings:edit", ...]
   * @returns {boolean} True if admin has all/any of these permissions
   */
  const permissionCheck = useCallback(
    (perm, options = { any: false }) => {
      // If no admin or not admin, always false
      if (!isAdmin || !adminUser) return false;
      // If "super admin" short circuit
      if (
        adminProfile?.role === "superadmin" ||
        (adminUser?.app_metadata?.role || adminUser?.user_metadata?.role) === "superadmin"
      ) {
        return true;
      }
      // No permissions set; deny all
      if (!Array.isArray(permissions) || permissions.length === 0) {
        return false;
      }
      if (Array.isArray(perm)) {
        if (options.any) return perm.some((p) => permissions.includes(p));
        // ALL required
        return perm.every((p) => permissions.includes(p));
      }
      return permissions.includes(perm);
    },
    [permissions, isAdmin, adminUser, adminProfile]
  );

  /**
   * Optionally: registerAdmin, updateAdminProfile etc
   * Strongly recommend NOT exposing public admin register in client SPA for security!
   * For real-world, registrations should be admin-invite only, server-driven.
   */

  // --- Memoized context value for performance ---
  const contextValue = useMemo(
    () => ({
      adminSession,
      adminUser,
      adminProfile,
      adminToken,
      isAdmin,
      permissions,
      loading,
      adminError,
      loginAdmin,
      logoutAdmin,
      refreshAdminProfile,
      hasPermission: permissionCheck // alias
    }),
    [
      adminSession,
      adminUser,
      adminProfile,
      adminToken,
      isAdmin,
      permissions,
      loading,
      adminError,
      loginAdmin,
      logoutAdmin,
      refreshAdminProfile,
      permissionCheck
    ]
  );

  // --- Admin protection: Only provide context if current user is an admin ---
  return React.createElement(
    AdminContext.Provider,
    { value: contextValue },
    children
  );
};

/**
 * Optionally: Higher-Order Component (HOC) or Route Guard for admin routes
 * (Usage: <RequireAdmin>...</RequireAdmin> or withRequireAdmin(Component))
 */
export const RequireAdmin = ({ children, fallback = null }) => {
  const ctx = useAdmin();
  if (ctx.loading) return fallback;
  if (!ctx.isAdmin)
    return (
      fallback ||
      React.createElement("div", null, "Access Denied: Admins only.")
    );
  return children;
};

