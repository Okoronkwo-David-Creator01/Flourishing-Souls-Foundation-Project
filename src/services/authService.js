import { supabase } from '../lib/supabase';

/**
 * Fully-featured production-ready Authentication Service using Supabase.
 * You may use these methods in your React app hooks, context, or directly.
 * All methods handle real-time user data and return promises (no simulation).
 */

// ================== PROFILE HELPERS (used by AuthContext) ==================
/**
 * Fetch a user's profile from the `profiles` table.
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
export async function getProfile(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data || null;
}

/**
 * Create (or upsert) a user's profile in the `profiles` table.
 * @param {string} userId
 * @param {object} profile
 * @returns {Promise<object|null>}
 */
export async function createProfile(userId, profile = {}) {
  if (!userId) return null;
  const payload = { id: userId, ...(profile || {}) };
  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();
  if (error) return null;
  return data || null;
}

// ================== ADMIN HELPERS (used by admin screens) ==================
export async function getAllUsers() {
  const { data, error } = await supabase.from("profiles").select("*");
  if (error) throw error;
  return data || [];
}

export async function refreshUserData() {
  return getAllUsers();
}

export async function addUser(user) {
  const { data, error } = await supabase.from("profiles").insert([user]).select().single();
  if (error) throw error;
  return data;
}

export async function getRoles() {
  const { data, error } = await supabase.from("roles").select("*").order("name", { ascending: true });
  if (error) return [];
  return data || [];
}

export async function createRole(role) {
  const { data, error } = await supabase.from("roles").insert([role]).select().single();
  if (error) throw error;
  return data;
}

export async function updateRole(roleId, updates) {
  const { data, error } = await supabase.from("roles").update(updates).eq("id", roleId).select().single();
  if (error) throw error;
  return data;
}

export async function deleteRole(roleId) {
  const { error } = await supabase.from("roles").delete().eq("id", roleId);
  if (error) throw error;
}

export async function assignRole(userId, roleId) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ role_id: roleId })
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ================== USER SIGN-UP ==================
/**
 * Registers a user via email/password. Optionally adds user profile data.
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} params.name
 * @param {Object} [extra] - Additional metadata to store inside user_metadata
 * @returns {Promise<{user, session, error}>}
 */
export async function registerUser({ email, password, name }, extra = {}) {
  let { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, ...extra },
      emailRedirectTo: `${window.location.origin}/login`
    }
  });

  if (error) return { user: null, session: null, error };

  // Optionally create a user profile row in "profiles"
  // This example assumes you have a 'profiles' table with id = user's uuid
  if (data.user) {
    await supabase
      .from('profiles')
      .insert([
        {
          id: data.user.id,
          email: data.user.email,
          name,
          ...extra
        }
      ])
      .select();
  }

  return { ...data, error: null };
}

// ================== USER LOGIN ==================
/**
 * Logs in a user using email or password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user, session, error}>}
 */
export async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) return { user: null, session: null, error };
  return { ...data, error: null };
}

// ================== LOGOUT ==================
/**
 * Logs out current authenticated user.
 * @returns {Promise<{error}>}
 */
export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// ================== GET CURRENT USER ==================
/**
 * Loads the current user object from session (JWT-based).
 * @returns {Promise<{user, error}>}
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user || null, error };
}

// ================== PASSWORD RESET ==================
/**
 * Triggers 'forgot password' email link to the user.
 * @param {string} email
 * @returns {Promise<{error}>}
 */
export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`
  });
  return { error };
}

/**
 * Use on the reset password page after user is redirected from email.
 * Updates the authenticated user's password.
 * @param {string} newPassword
 * @returns {Promise<{user, error}>}
 */
export async function updateUserPassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  return { user: data?.user, error };
}

// ================== UPDATE USER PROFILE ==================
/**
 * Updates the user's profile in the 'profiles' table.
 * @param {string} userId
 * @param {Object} updates
 * @returns {Promise<{profile, error}>}
 */
export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { profile: data || null, error };
}

// ================== GET USER PROFILE ==================
/**
 * Fetches a user's profile from the 'profiles' table.
 * @param {string} userId
 * @returns {Promise<{profile, error}>}
 */
export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { profile: data || null, error };
}

// ================== PROVIDER AUTH ==================
/**
 * Sign in with OAuth provider (Google, GitHub, etc)
 * @param {string} provider
 * @param {Object} [options] - {redirectTo, scopes}
 * @returns {Promise<{user, session, error}>}
 */
export async function signInWithProvider(provider, options = {}) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: options.redirectTo ?? `${window.location.origin}/login`,
      scopes: options.scopes ?? ''
    }
  });
  return { ...data, error };
}

// ================== ADMIN: LIST USERS (SERVER-SIDE ONLY) ==================
/**
 * Get a paginated list of users (requires service key, not exposed to browser!).
 * This is only used in secured backend scripts/serverless/env.
 * Example use: call endpoint on secure server, never directly in browser!
 *
 * See Supabase admin API docs.
 */

// ================== AUTH STATE LISTENER ==================
/**
 * Listen for auth state changes (session, user, sign in/out)
 * Usage: pass a callback that receives (event, session)
 * Returns the unsubscribe function.
 * @param {(event: string, session: object) => void} callback
 * @returns {() => void} unsubscribe
 */
export function onAuthStateChange(callback) {
  const { data: listener } = supabase.auth.onAuthStateChange(callback);
  return () => listener?.subscription?.unsubscribe();
}