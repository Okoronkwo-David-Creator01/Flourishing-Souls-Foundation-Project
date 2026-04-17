/**
 * useEvents - Production-ready React hook for full event lifecycle management.
 * Provides real interactions with the Supabase backend for fetching, creating,
 * updating, deleting, registering, and RSVPing to events for the Flourishing Souls Foundation.
 *
 * Features:
 *   - Fetch all events, single event, or upcoming events
 *   - CRUD operations for admins
 *   - Register/RSVP for event, withdraw RSVP
 *   - Real Supabase integration (pg/rest/rpc, no stubbing or simulation)
 *   - Global notification context for user feedback
 *
 * Usage:
 *   import useEvents from './useEvents'
 *   const { events, createEvent, registerForEvent, ... } = useEvents()
 *
 * Supabase table design assumption:
 *   - events: { id, title, description, date, location, image_url, ... }
 *   - event_registrations: { id, event_id, user_id, registered_at }
 */

import { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { getSupabaseClient } from '../lib/supabase';

/* Environment variables are required for Supabase */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const supabase = getSupabaseClient(SUPABASE_URL, SUPABASE_KEY);

const EVENTS_TABLE = 'events';
const REGISTRATIONS_TABLE = 'event_registrations';

function useEvents() {
  const [events, setEvents] = useState([]);
  const [singleEvent, setSingleEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [error, setError] = useState(null);

  const notify = useNotification?.();
  const { user } = useAuth?.() || {};

  /**
   * Fetch all events (public API)
   */
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from(EVENTS_TABLE)
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        throw error;
      }

      setEvents(data || []);
      return data || [];
    } catch (err) {
      setError(err.message || 'Failed to fetch events');
      notify?.error?.(err.message || 'Failed to fetch events');
      return [];
    } finally {
      setLoading(false);
    }
  }, [notify]);

  /**
   * Fetch a single event by ID
   */
  const fetchEventById = useCallback(async (eventId) => {
    if (!eventId) return null;
    setLoading(true);
    setSingleEvent(null);

    try {
      const { data, error } = await supabase
        .from(EVENTS_TABLE)
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;

      setSingleEvent(data);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch event');
      notify?.error?.(err.message || 'Failed to fetch event details');
      return null;
    } finally {
      setLoading(false);
    }
  }, [notify]);

  /**
   * Fetch only upcoming events
   */
  const fetchUpcomingEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from(EVENTS_TABLE)
        .select('*')
        .gte('date', now)
        .order('date', { ascending: true });

      if (error) throw error;

      setEvents(data || []);
      return data || [];
    } catch (err) {
      setError(err.message || 'Failed to fetch upcoming events');
      notify?.error?.(err.message || 'Failed to fetch upcoming events');
      return [];
    } finally {
      setLoading(false);
    }
  }, [notify]);

  /**
   * Admin: Create a new event
   */
  const createEvent = useCallback(async (eventData) => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from(EVENTS_TABLE)
        .insert([eventData])
        .select();

      if (error) throw error;

      setEvents(prev => [...prev, ...data]);
      notify?.success?.('Event created successfully.');
      return data[0];
    } catch (err) {
      setError(err.message || 'Unable to create event');
      notify?.error?.(err.message || 'Failed to create event');
      return null;
    } finally {
      setLoading(false);
    }
  }, [notify]);

  /**
   * Admin: Update an event by ID
   */
  const updateEvent = useCallback(async (eventId, updatedData) => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from(EVENTS_TABLE)
        .update(updatedData)
        .eq('id', eventId)
        .select();

      if (error) throw error;

      setEvents(prev =>
        prev.map((ev) => (ev.id === eventId ? { ...ev, ...updatedData } : ev))
      );
      notify?.success?.('Event updated successfully.');
      return data[0];
    } catch (err) {
      setError(err.message || 'Unable to update event');
      notify?.error?.(err.message || 'Failed to update event');
      return null;
    } finally {
      setLoading(false);
    }
  }, [notify]);

  /**
   * Admin: Delete an event by ID
   */
  const deleteEvent = useCallback(async (eventId) => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from(EVENTS_TABLE)
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      setEvents(prev => prev.filter(ev => ev.id !== eventId));
      notify?.success?.('Event deleted.');
      return true;
    } catch (err) {
      setError(err.message || 'Unable to delete event');
      notify?.error?.(err.message || 'Failed to delete event');
      return false;
    } finally {
      setLoading(false);
    }
  }, [notify]);

  /**
   * Register (RSVP) user for an event
   */
  const registerForEvent = useCallback(async (eventId) => {
    if (!user?.id) {
      const msg = 'You must be signed in to RSVP for events.';
      setError(msg);
      notify?.error?.(msg);
      return false;
    }
    setLoading(true);

    try {
      // Prevent double-registration
      const { data: existing, error: findErr } = await supabase
        .from(REGISTRATIONS_TABLE)
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (findErr) throw findErr;
      if (existing) {
        const msg = 'You have already registered for this event.';
        setError(msg);
        notify?.error?.(msg);
        return false;
      }

      const { data, error } = await supabase
        .from(REGISTRATIONS_TABLE)
        .insert([{ event_id: eventId, user_id: user.id, registered_at: new Date().toISOString() }])
        .select();

      if (error) throw error;

      setRegistrations(prev => [...prev, ...data]);
      notify?.success?.('You have successfully registered for the event!');
      return true;
    } catch (err) {
      setError(err.message || 'Failed to RSVP');
      notify?.error?.(err.message || 'Failed to register for event');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, notify]);

  /**
   * Withdraw RSVP/registration for an event
   */
  const unregisterFromEvent = useCallback(async (eventId) => {
    if (!user?.id) {
      const msg = 'You must be signed in to withdraw registration.';
      setError(msg);
      notify?.error?.(msg);
      return false;
    }
    setLoading(true);

    try {
      const { error } = await supabase
        .from(REGISTRATIONS_TABLE)
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;

      setRegistrations(prev =>
        prev.filter(r => !(r.event_id === eventId && r.user_id === user.id))
      );
      notify?.success?.('You have withdrawn from the event.');
      return true;
    } catch (err) {
      setError(err.message || 'Failed to withdraw');
      notify?.error?.(err.message || 'Failed to withdraw RSVP');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, notify]);

  /**
   * Fetch registrations for a user (all events)
   */
  const fetchUserRegistrations = useCallback(async (uid) => {
    if (!uid) return [];
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from(REGISTRATIONS_TABLE)
        .select('id, event_id, registered_at')
        .eq('user_id', uid);

      if (error) throw error;

      setRegistrations(data || []);
      return data || [];
    } catch (err) {
      setError(err.message || 'Failed to fetch registrations');
      notify?.error?.(err.message || 'Failed to fetch event registrations');
      return [];
    } finally {
      setLoading(false);
    }
  }, [notify]);

  /**
   * Is user registered for specific event
   */
  const isUserRegistered = useCallback(
    (eventId) =>
      !!registrations.find(
        (r) => r.event_id === eventId && r.user_id === user?.id
      ),
    [registrations, user]
  );

  // On mount: auto-fetch all events
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // (Optional) Fetch user registrations on user login
  useEffect(() => {
    if (user?.id) {
      fetchUserRegistrations(user.id);
    } else {
      setRegistrations([]);
    }
  }, [user, fetchUserRegistrations]);

  return {
    events,                // List of all events
    singleEvent,           // Details of a single event
    registrations,         // User's registrations
    loading,
    error,

    fetchEvents,
    fetchEventById,
    fetchUpcomingEvents,
    createEvent,
    updateEvent,
    deleteEvent,

    registerForEvent,
    unregisterFromEvent,
    fetchUserRegistrations,
    isUserRegistered,
  };
}

export { useEvents };
export default useEvents;

