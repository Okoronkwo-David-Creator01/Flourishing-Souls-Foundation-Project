/**
 * supabaseServices.js
 * Production-ready API abstraction for Supabase CRUD, admin and utility operations.
 * Do not simulate anything - all functions interact with the real Supabase backend.
 * 
 * Note: assumes single supabase client instance exported from 'src/lib/supabase.js'.
 */

import { supabase } from '../lib/supabase';

/* ===================== COMMON UTILS ===================== */

/**
 * Helper to check and throw on Supabase errors.
 */
function checkError(error, customMsg) {
  if (error) {
    throw new Error(customMsg ? `${customMsg}: ${error.message}` : error.message);
  }
}

/* ===================== VOLUNTEERS API ===================== */

/**
 * Create a new volunteer (insert into 'volunteers' table).
 * @param {object} data
 * @returns {Promise<object>} - Inserted volunteer row or throws on error.
 */
export async function createVolunteer(data) {
  const { data: inserted, error } = await supabase
    .from('volunteers')
    .insert([data])
    .single();
  checkError(error, "Failed to create volunteer");
  return inserted;
}

/**
 * Get all volunteers (paginated).
 * @param {object} options - {limit, offset, filters}
 * @returns {Promise<{data: object[], count: number}>}
 */
export async function listVolunteers({ limit = 50, offset = 0, filters = {} } = {}) {
  let query = supabase
    .from('volunteers')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  Object.entries(filters).forEach(([field, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query = query.eq(field, value);
    }
  });

  const { data, error, count } = await query;
  checkError(error, "Failed to list volunteers");
  return { data, count };
}

/**
 * Update a volunteer's info by id
 * @param {string} id
 * @param {object} data 
 * @returns {Promise<object>}
 */
export async function updateVolunteer(id, data) {
  const { data: updated, error } = await supabase
    .from('volunteers')
    .update(data)
    .eq('id', id)
    .single();
  checkError(error, "Failed to update volunteer");
  return updated;
}

/**
 * Delete a volunteer by id (soft/hard depending on your DB triggers)
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteVolunteer(id) {
  const { error } = await supabase
    .from('volunteers')
    .delete()
    .eq('id', id);
  checkError(error, "Failed to delete volunteer");
}

/* ===================== SUPPORT REQUESTS ===================== */

/**
 * Submit a new support request.
 * @param {object} requestData
 * @returns {Promise<object>}
 */
export async function createSupportRequest(requestData) {
  const { data, error } = await supabase
    .from('support_requests')
    .insert([requestData])
    .single();
  checkError(error, "Failed to submit support request");
  return data;
}

/**
 * List support requests (optionally filter by user, status, etc)
 * @param {object} options - {limit, offset, filters}
 * @returns {Promise<{data: object[], count: number}>}
 */
export async function listSupportRequests({ limit = 50, offset = 0, filters = {} } = {}) {
  let query = supabase
    .from('support_requests')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  Object.entries(filters).forEach(([field, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query = query.eq(field, value);
    }
  });

  const { data, error, count } = await query;
  checkError(error, "Failed to list support requests");
  return { data, count };
}

/**
 * Update support request status, notes, or assignment.
 * @param {string} id
 * @param {object} updates
 * @returns {Promise<object>}
 */
export async function updateSupportRequest(id, updates) {
  const { data, error } = await supabase
    .from('support_requests')
    .update(updates)
    .eq('id', id)
    .single();
  checkError(error, "Failed to update support request");
  return data;
}

/* ===================== EVENTS & GALLERY ===================== */

/**
 * List upcoming events (optionally future only)
 * @param {object} options - {limit, offset, futureOnly}
 * @returns {Promise<{data: object[], count: number}>}
 */
export async function listEvents({ limit = 20, offset = 0, futureOnly = true } = {}) {
  let query = supabase
    .from('events')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('date', { ascending: true });

  if (futureOnly) {
    const today = new Date().toISOString().substring(0, 10);
    query = query.gte('date', today);
  }

  const { data, error, count } = await query;
  checkError(error, "Failed to list events");
  return { data, count };
}

/**
 * Backwards-compatible helper used by `src/pages/Events.jsx`.
 * @returns {Promise<object[]>}
 */
export async function getAllEvents() {
  const { data } = await listEvents({ limit: 1000, offset: 0, futureOnly: false });
  return data || [];
}

/**
 * Add new gallery item (photo/video)
 * @param {object} galleryData
 * @returns {Promise<object>}
 */
export async function createGalleryItem(galleryData) {
  const { data, error } = await supabase
    .from('gallery')
    .insert([galleryData])
    .single();
  checkError(error, "Failed to add gallery item");
  return data;
}

/**
 * List gallery items by type
 * @param {object} options - {type, limit, offset}
 * @returns {Promise<{data: object[], count: number}>}
 */
export async function listGalleryItems({ type, limit = 24, offset = 0 } = {}) {
  let query = supabase
    .from('gallery')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (type) {
    query = query.eq('type', type); // e.g. "photo" or "video"
  }

  const { data, error, count } = await query;
  checkError(error, "Failed to list gallery items");
  return { data, count };
}

/* ===================== USERS, ROLES, ADMIN ===================== */

/**
 * Get a list of user profiles (paginated).
 * @param {object} options {limit, offset, role}
 * @returns {Promise<{data: object[], count: number}>}
 */
export async function listUserProfiles({ limit = 50, offset = 0, role } = {}) {
  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (role) query = query.eq('role', role);

  const { data, error, count } = await query;
  checkError(error, "Failed to list users");
  return { data, count };
}

/**
 * Update user profile (admin or self-service)
 * @param {string} userId
 * @param {object} updates
 * @returns {Promise<object>}
 */
export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .single();
  checkError(error, "Failed to update user profile");
  return data;
}

/**
 * Assign or update a user's role (admin access required)
 * @param {string} userId
 * @param {string} role
 * @returns {Promise<object>}
 */
export async function setUserRole(userId, role) {
  return updateUserProfile(userId, { role });
}

/* ===================== STORAGE (FILE/AVATAR/UPLOAD) ===================== */

/**
 * Upload a file to Supabase Storage bucket (returns public URL on success)
 * @param {File|Blob} file
 * @param {string} bucket
 * @param {string} path
 * @returns {Promise<string>} Public URL
 */
export async function uploadFile(file, bucket, path) {
  // Upload file
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  checkError(error, "Failed to upload file");

  // Get public URL
  const { publicURL, error: pubErr } = supabase.storage.from(bucket).getPublicUrl(path);
  checkError(pubErr, "Failed to get public file url");
  return publicURL;
}

/**
 * Remove a file from bucket
 */
export async function deleteFile(bucket, path) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  checkError(error, "Failed to delete file");
}

/* ===================== GENERIC CRUD (ADVANCED USAGE) ===================== */

/**
 * Generic table fetch by id.
 * @param {string} table
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function fetchById(table, id) {
  const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
  checkError(error, `Fetch by id from '${table}' failed`);
  return data;
}

/**
 * Generic create/insert.
 * @param {string} table
 * @param {object} record
 * @returns {Promise<object>}
 */
export async function insertRecord(table, record) {
  const { data, error } = await supabase.from(table).insert([record]).single();
  checkError(error, `Insert into '${table}' failed`);
  return data;
}

/**
 * Generic update by id.
 * @param {string} table
 * @param {string} id
 * @param {object} updates
 * @returns {Promise<object>}
 */
export async function updateById(table, id, updates) {
  const { data, error } = await supabase.from(table).update(updates).eq('id', id).single();
  checkError(error, `Update by id in '${table}' failed`);
  return data;
}

/**
 * Generic delete by id.
 * @param {string} table
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteById(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  checkError(error, `Delete by id in '${table}' failed`);
}

/**
 * Run a filtered query on a table (with limit/offset/order/filters)
 * @param {string} table
 * @param {object} options {filters, limit, offset, orderBy, orderDir}
 * @returns {Promise<{data: object[], count: number}>}
 */
export async function queryTable(
  table,
  { filters = {}, limit = 20, offset = 0, orderBy = 'created_at', orderDir = false } = {}
) {
  let query = supabase
    .from(table)
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order(orderBy, { ascending: !!orderDir });

  Object.entries(filters).forEach(([k, v]) => {
    if (v !== null && v !== undefined) query = query.eq(k, v);
  });

  const { data, error, count } = await query;
  checkError(error, `Query '${table}' failed`);
  return { data, count };
}


