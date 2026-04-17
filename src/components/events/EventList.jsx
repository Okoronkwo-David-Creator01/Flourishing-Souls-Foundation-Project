import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Button, Modal, Notification } from "../common/ThemeProvider";

// EventList.jsx: Real-time, production-ready event board for displaying, searching, joining, and managing organizational events.

const EventList = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveEventId, setLeaveEventId] = useState(null);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });

  // Fetch current user on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user: sUser } } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(sUser || null);
    })();
    return () => { mounted = false; }
  }, []);

  // Fetch events (with organizers, limited fields for perf)
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setFetchError("");
    const fetchEvents = async () => {
      try {
        let { data, error } = await supabase
          .from("events")
          .select(`
            id, title, description, date, location, created_at,
            organizer (id, full_name, email, avatar_url),
            attendees:attendance (user_id)
          `)
          .order("date", { ascending: true });
        if (error) throw error;
        if (!mounted) return;
        setEvents(data || []);
        setFilteredEvents(data || []);
      } catch (err) {
        setFetchError(
          err?.message ||
            "Failed to load events. Please try again or refresh this page."
        );
      }
      setLoading(false);
    };
    fetchEvents();
    // Real-time subscription for events table
    const eventsSub = supabase
      .channel("public:events")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        fetchEvents
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(eventsSub);
    };
    // eslint-disable-next-line
  }, []);

  // Filter events by search
  useEffect(() => {
    if (!search.trim()) {
      setFilteredEvents(events);
      return;
    }
    const q = search.toLowerCase();
    setFilteredEvents(
      events.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.location?.toLowerCase().includes(q) ||
          e.organizer?.full_name?.toLowerCase().includes(q)
      )
    );
  }, [search, events]);

  // Join event handler (write to attendance table)
  const handleJoin = async (eventId) => {
    if (!user) {
      setNotification({
        message: "Please log in to join events.",
        type: "error",
      });
      return;
    }
    try {
      const { error } = await supabase
        .from("attendance")
        .insert([{ event_id: eventId, user_id: user.id }]);
      if (error?.code === "23505") {
        setNotification({
          message: "You have already joined this event.",
          type: "info",
        });
      } else if (error) {
        throw error;
      } else {
        setNotification({ message: "Event joined successfully!", type: "success" });
      }
    } catch (err) {
      setNotification({
        message: err?.message || "Could not join event. Try again.",
        type: "error",
      });
    }
  };

  // Leave event modal open
  const handlePromptLeave = (eventId) => {
    setLeaveEventId(eventId);
    setShowLeaveModal(true);
  };

  // Confirm leave handler
  const handleLeave = async () => {
    setLeaveLoading(true);
    try {
      const { error } = await supabase
        .from("attendance")
        .delete()
        .eq("event_id", leaveEventId)
        .eq("user_id", user.id);
      if (error) throw error;
      setNotification({ message: "You have left the event.", type: "success" });
    } catch (err) {
      setNotification({
        message: err?.message || "There was an error leaving this event.",
        type: "error",
      });
    }
    setLeaveLoading(false);
    setShowLeaveModal(false);
    setLeaveEventId(null);
  };

  // Utility: Is current user attending an event?
  const isJoined = (event) =>
    user &&
    event.attendees &&
    event.attendees.some((a) => a.user_id === user.id);

  // Utility: Is current user the organizer of an event?
  const isOrganizer = (event) => user && event.organizer && event.organizer.id === user.id;

  const formatDate = (d) => {
    if (!d) return "";
    const date = new Date(d);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-2 py-8 relative">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 tracking-tight">
          Upcoming Events
        </h2>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input px-3 py-2 transition-colors border rounded w-56 text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
            aria-label="Search events"
          />
          <Button as={Link} to="/events/calendar" variant="primary" size="sm">
            <span role="img" aria-label="calendar">📅</span> Calendar View
          </Button>
          {user && (
            <Button as={Link} to="/events/new" variant="success" size="sm">
              <span role="img" aria-label="plus">➕</span> Create Event
            </Button>
          )}
        </div>
      </div>
      {notification.message && (
        <Notification
          type={notification.type}
          className="mb-4"
          // Simple reset on dismiss
          onClose={() => setNotification({ message: "", type: "" })}
        >
          {notification.message}
        </Notification>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <span className="text-primary-600 animate-pulse">Loading events...</span>
        </div>
      ) : fetchError ? (
        <div className="bg-red-100 border border-red-400 text-red-700 rounded px-4 py-2 mb-6 text-center">
          {fetchError}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-gray-400 text-center py-20 text-lg">
          No events found.
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <li
              key={event.id}
              className="bg-white dark:bg-gray-900 shadow hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-800 rounded-lg flex flex-col justify-between"
            >
              <div
                className="px-5 pt-5 cursor-pointer"
                onClick={() => navigate(`/events/${event.id}`)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate(`/events/${event.id}`);
                }}
                role="button"
                aria-label={`View details of ${event.title}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500">
                    {formatDate(event.date)}
                  </span>
                  <span className="ml-auto text-xs rounded px-2 py-0.5 font-medium bg-gray-100 dark:bg-gray-800 text-primary-600 dark:text-primary-300">
                    {event.location || "TBD"}
                  </span>
                </div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 tracking-tight line-clamp-2">
                  {event.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-3">
                  {event.description}
                </p>
                {event.organizer && (
                  <div className="flex items-center gap-2 mt-2">
                    {event.organizer.avatar_url ? (
                      <img
                        src={event.organizer.avatar_url}
                        alt={event.organizer.full_name || event.organizer.email}
                        className="w-7 h-7 rounded-full"
                      />
                    ) : (
                      <span
                        className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400"
                        aria-label="Organizer"
                      >
                        &#9787;
                      </span>
                    )}
                    <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                      {event.organizer.full_name || event.organizer.email}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 px-4 pb-4 pt-2 mt-auto">
                {isOrganizer(event) ? (
                  <Button
                    as={Link}
                    to={`/events/${event.id}/edit`}
                    size="xs"
                    variant="info"
                  >
                    <span role="img" aria-label="edit">✏️</span> Edit
                  </Button>
                ) : isJoined(event) ? (
                  <Button
                    size="xs"
                    variant="outline-danger"
                    onClick={() => handlePromptLeave(event.id)}
                  >
                    <span role="img" aria-label="leave">🚪</span> Leave
                  </Button>
                ) : (
                  <Button
                    size="xs"
                    variant="primary"
                    onClick={() => handleJoin(event.id)}
                  >
                    <span role="img" aria-label="join">👋</span> Join
                  </Button>
                )}
                <Button
                  as={Link}
                  to={`/events/${event.id}`}
                  size="xs"
                  variant="ghost"
                >
                  View
                </Button>
                <span className="ml-auto text-xs text-gray-500">
                  {event.attendees?.length || 0} Joined
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
      >
        <div className="py-6 text-center px-4">
          <h4 className="text-xl font-semibold mb-4">Leave Event?</h4>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            Are you sure you want to leave this event? You will lose access to event updates.
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              variant="ghost"
              onClick={() => setShowLeaveModal(false)}
              disabled={leaveLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleLeave}
              loading={leaveLoading}
              disabled={leaveLoading}
            >
              Yes, Leave
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EventList;