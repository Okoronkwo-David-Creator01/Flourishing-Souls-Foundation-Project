/**
 * @file src/lib/api.js
 * @description
 * Centralized, production-grade API abstraction for real-time data, user actions,
 * donations, events, gallery, and other core resources.
 *
 * Interacts with Supabase (for DB/auth/storage/etc) and Paystack (for payments).
 * No stubs, mocks or simulations — all requests are real and effect persistent data.
 */

// Note: All actual imports should be at the top-level of your entry file
import supabase from './supabase'; // See: src/lib/supabase.js
import { verifyPaystackTransaction } from './paystack'; // src/lib/paystack.js

// ========== USERS & AUTH ==========

/**
 * Fetch the current authenticated user's profile from Supabase (always fresh).
 * @returns {Promise<Object|null>}
 */
export async function getCurrentUserProfile() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  if (!user) return null;
  const { data: profile, error: dbError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (dbError) throw new Error(dbError.message);
  return profile;
}

/**
 * Fetch all users (admin only).
 * @returns {Promise<Array>}
 */
export async function getAllUsers() {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Update a user's role (admin only).
 * @param {string} userId
 * @param {string} newRole
 * @returns {Promise<Object>}
 */
export async function updateUserRole(userId, newRole) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ========== DONATIONS & PAYMENTS ==========

/**
 * Save a donation to Supabase after verified payment.
 * @param {Object} donation
 * @returns {Promise<Object>}
 */
export async function saveDonation(donation) {
  // Should be called only after transaction is confirmed
  const { data, error } = await supabase
    .from('donations')
    .insert([donation])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Fetch all donations (admin only).
 * @returns {Promise<Array>}
 */
export async function getAllDonations() {
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Fetch donations for a given user's email.
 * @param {string} email
 * @returns {Promise<Array>}
 */
export async function getDonationsByUser(email) {
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .eq('email', email)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Verify a Paystack transaction (via backend or direct HTTP).
 * @param {string} reference 
 * @returns {Promise<Object>} 
 */
export async function verifyDonation(reference) {
  return await verifyPaystackTransaction(reference);
}

// ========== EVENTS ==========

/**
 * Fetch all events.
 * @returns {Promise<Array>}
 */
export async function getAllEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Fetch details for a single event.
 * @param {string|number} eventId
 * @returns {Promise<Object>}
 */
export async function getEventById(eventId) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Register current user for an event.
 * @param {Object} registration
 * @param {string} registration.user_id
 * @param {string|number} registration.event_id
 * @returns {Promise<Object>}
 */
export async function registerForEvent({ user_id, event_id }) {
  const { data, error } = await supabase
    .from('event_registrations')
    .insert([{ user_id, event_id }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Unregister current user from event.
 * @param {string} userId
 * @param {string|number} eventId
 * @returns {Promise<void>}
 */
export async function unregisterFromEvent(userId, eventId) {
  const { error } = await supabase
    .from('event_registrations')
    .delete()
    .eq('user_id', userId)
    .eq('event_id', eventId);
  if (error) throw new Error(error.message);
}

/**
 * Fetch all registrations for a user.
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function getUserEventRegistrations(userId) {
  const { data, error } = await supabase
    .from('event_registrations')
    .select('*, events(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// ========== GALLERY ==========

/**
 * Fetch all gallery items.
 * @return {Promise<Array>}
 */
export async function getGalleryItems() {
  const { data, error } = await supabase
    .from('gallery')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Search gallery items by title/description.
 * @param {string} query
 * @returns {Promise<Array>}
 */
export async function searchGallery(query) {
  const { data, error } = await supabase
    .from('gallery')
    .select('*')
    .ilike('title', `%${query}%`);
  if (error) throw new Error(error.message);
  // Optionally: search description, tags, etc. by expanding the query
  return data;
}

/**
 * Upload a file (image/video) to Supabase storage and insert into gallery table.
 * @param {File} file
 * @param {Object} metadata
 * @param {string} metadata.title
 * @param {string} [metadata.description]
 * @returns {Promise<Object>} The new gallery item record
 */
export async function uploadGalleryFile(file, { title, description }) {
  // Upload file to storage
  const fileExt = file.name.split('.').pop();
  const filePath = `${Date.now()}_${Math.random().toString(36).substr(2, 8)}.${fileExt}`;
  const { error: uploadError } = await supabase.storage
    .from('gallery')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (uploadError) throw new Error(uploadError.message);

  // Get public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from('gallery')
    .getPublicUrl(filePath);

  // Insert gallery row
  const { data, error } = await supabase
    .from('gallery')
    .insert([{ title, description, url: publicUrl, file_path: filePath }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Delete a gallery item (removes row and deletes from storage).
 * @param {number|string} itemId
 * @returns {Promise<void>}
 */
export async function deleteGalleryItem(itemId) {
  // Get file path to delete from storage
  const { data, error } = await supabase
    .from('gallery')
    .select('file_path')
    .eq('id', itemId)
    .single();
  if (error) throw new Error(error.message);

  const filePath = data.file_path;

  // Delete DB entry
  const { error: delError } = await supabase
    .from('gallery')
    .delete()
    .eq('id', itemId);

  if (delError) throw new Error(delError.message);

  // Delete from storage in background (do not block)
  supabase.storage.from('gallery').remove([filePath]);
}

// ========== VOLUNTEERS ==========

/**
 * Submit a volunteer request.
 * @param {Object} request
 * @returns {Promise<Object>}
 */
export async function submitVolunteerRequest(request) {
  const { data, error } = await supabase
    .from('volunteers')
    .insert([request])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Get all volunteer requests (admin).
 * @returns {Promise<Array>}
 */
export async function getAllVolunteers() {
  const { data, error } = await supabase
    .from('volunteers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// ========== SUPPORT REQUESTS ==========

/**
 * Submit a support request.
 * @param {Object} req
 * @returns {Promise<Object>}
 */
export async function submitSupportRequest(req) {
  const { data, error } = await supabase
    .from('support')
    .insert([req])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Get all support requests (admin).
 * @returns {Promise<Array>}
 */
export async function getAllSupportRequests() {
  const { data, error } = await supabase
    .from('support')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// ========== ADMIN DASHBOARD ==========

/**
 * Simple aggregation: get dashboard stats.
 * @returns {Promise<Object>}
 */
export async function getDashboardStats() {
  // Parallel count queries for main entities
  const [{ count: users }, { count: donations }, { count: events }, { count: volunteers }, { count: supports }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('donations').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('volunteers').select('*', { count: 'exact', head: true }),
    supabase.from('support').select('*', { count: 'exact', head: true }),
  ]);
  return { users, donations, events, volunteers, supports };
}

// ========== UTILS ==========

/**
 * Generic error handler for API functions to log & throw.
 * @param {Error} err
 * @param {string} context
 */
export function handleApiError(err, context = 'API') {
  // Send to external logging e.g., Sentry if available
  // eslint-disable-next-line no-console
  console.error(`[${context}]`, err);
  throw err;
}

