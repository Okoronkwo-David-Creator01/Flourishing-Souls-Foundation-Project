/**
 * Supabase Client Utility Library (Production-Ready, Real-Time)
 * 
 * Secure, comprehensive import, configuration, and utilities for Supabase workflows.
 * - Centralizes Supabase client instantiation for SSR and CSR support
 * - Supports secure session, real-time, and storage usage
 * - Typing and safety for user, session, and table data
 * - Full helper API for auth, subscription, and storage interactions
 * - Throws on error, robust production-grade error handling
 * 
 * Environment Vars Required:
 *   - SUPABASE_URL
 *   - SUPABASE_ANON_KEY      (NEVER expose service_role keys to the client!)
 *   - VITE_SUPABASE_URL
 *   - VITE_SUPABASE_ANON_KEY
 *
 * Note: Never, ever commit your service_role key or secrets here.
 * 
 * Docs:
 *   https://supabase.com/docs/reference/javascript
 * 
 * WARNING: Use only in environments/functions where environment variables are safe.
 */

import { createClient } from '@supabase/supabase-js';

const getEnv = (name, viteName) => {
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name];
  }
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteName]) {
    return import.meta.env[viteName];
  }
  return undefined;
};

const SUPABASE_URL = getEnv('SUPABASE_URL', 'VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase URL and/or Anon Key are missing in environment variables');
}

// Configure Supabase client: Options for SSR (cookies), and production safety
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { params: { eventsPerSecond: 10 } }, // Tweak for scale if needed
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
  },
});

/**
 * Create a Supabase client for a given URL/key (used by some hooks/components).
 * Prefer importing the singleton `supabase` above when possible.
 */
export function getSupabaseClient(url, anonKey) {
  if (!url || !anonKey) {
    throw new Error("Supabase URL/key missing");
  }
  return createClient(url, anonKey, {
    realtime: { params: { eventsPerSecond: 10 } },
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      autoRefreshToken: true,
    },
  });
}

/**
 * Get Current User (session aware, works for both CSR and SSR if session is present)
 * @returns {Promise<import('@supabase/supabase-js').User|null>}
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

/**
 * Sign In With Email & Password
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{user: object, session: object}>}
 */
export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Sign Up With Email & Password
 * @param {string} email
 * @param {string} password
 * @param {object} [options] - Optionally provide additional user metadata
 * @returns {Promise<{user: object, session: object | null}>}
 */
export async function signUpWithEmail(email, password, options = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: options,
      emailRedirectTo: options.emailRedirectTo, // optional
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Sign out current user (all tabs & devices)
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Reset user password (send link)
 * @param {string} email
 * @returns {Promise<void>}
 */
export async function sendPasswordResetEmail(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window?.location?.origin
      ? `${window.location.origin}/reset-password`
      : undefined,
  });
  if (error) throw error;
}

/**
 * Update user password (only works if authenticated)
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
export async function updateUserPassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/**
 * Get the current session if available
 * @returns {Promise<import('@supabase/supabase-js').Session|null>}
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Subscribe to Realtime table changes
 * @param {string} table
 * @param {function} callback - function(payload)
 * @param {Array<'INSERT'|'UPDATE'|'DELETE'>} [events] - which events to listen for
 * @returns {object} { channel, unsubscribe }
 */
export function subscribeToTable(table, callback, events = ['INSERT', 'UPDATE', 'DELETE']) {
  const channel = supabase
    .channel(`realtime:${table}`)
    .on(
      'postgres_changes',
      {
        event: events,
        schema: 'public',
        table,
      },
      payload => callback(payload)
    )
    .subscribe((status) => {
      if(status === "SUBSCRIBED") {
        // Optionally notify connected
      }
    });

  const unsubscribe = async () => {
    await supabase.removeChannel(channel);
  };
  return { channel, unsubscribe };
}

/**
 * Upload file to Supabase Storage (public/private buckets)
 * @param {string} bucket - Name of storage bucket
 * @param {string} path - Path (including filename)
 * @param {File|Blob|Uint8Array} file - The file or blob data
 * @returns {Promise<string>} - Returns public URL, if bucket is public
 */
export async function uploadFileToStorage(bucket, path, file) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false
  });
  if (error) throw error;
  // If bucket is public, generate public URL
  if (data && data.path) {
    return supabase.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
  }
  return null;
}

/**
 * Get (public) file URL from storage. Does not validate actual file presence.
 * @param {string} bucket
 * @param {string} path
 * @returns {string}
 */
export function getPublicFileUrl(bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Download file from Supabase Storage
 * @param {string} bucket
 * @param {string} path
 * @returns {Promise<Blob>}
 */
export async function downloadFileFromStorage(bucket, path) {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) throw error;
  return data;
}

/**
 * Remove file from Supabase Storage
 * @param {string} bucket
 * @param {string} path
 * @returns {Promise<void>}
 */
export async function deleteFileFromStorage(bucket, path) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

/**
 * Utility: Centralized error handler for Supabase errors
 */
export function handleSupabaseError(error, context = "Supabase") {
  // Send to external logger if available
  // eslint-disable-next-line no-console
  console.error(`[${context}]`, error);
  throw error;
}

