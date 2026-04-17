import React, { useEffect, useState, useMemo } from "react";
import { Modal, Button, Notification } from "../common/ThemeProvider";
import { useEvents } from "../../hooks/useEvents";

// Utility: group events by YYYY-MM
function groupEventsByMonth(events) {
  const grouped = {};
  events.forEach((event) => {
    const date = new Date(event.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(event);
  });
  return grouped;
}

// Utility: get days in month + start day offset
function getMonthMatrix(year, month) {
  const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) ... 6 (Sat)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const matrix = [];
  let day = 1 - firstDay;
  for (let i = 0; i < 6; i++) {
    const week = [];
    for (let j = 0; j < 7; j++) {
      if (day > 0 && day <= daysInMonth) {
        week.push(day);
      } else {
        week.push(null);
      }
      day += 1;
    }
    matrix.push(week);
  }
  return matrix;
}

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const Calendar = () => {
  const {
    events,
    loading,
    error,
    refetch: refetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useEvents(); // fetches live user events from Supabase
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(null); // {day, events[]}
  const [modalOpen, setModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [activeEvent, setActiveEvent] = useState(null); // event for details/edit
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Group events by YYYY-MM-DD for fast lookup
  const eventsByDay = useMemo(() => {
    const map = {};
    if (!Array.isArray(events)) return map;
    events.forEach((event) => {
      const dateKey = new Date(event.date).toISOString().split("T")[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(event);
    });
    return map;
  }, [events]);

  const monthMatrix = useMemo(
    () =>
      getMonthMatrix(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate]
  );

  // For month label
  const monthLabel = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  function handlePrevMonth() {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(prev.getMonth() - 1);
      return d;
    });
  }

  function handleNextMonth() {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(prev.getMonth() + 1);
      return d;
    });
  }

  function handleDayClick(day) {
    if (!day) return;
    const dateKey = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    ).toISOString().split("T")[0];
    setSelectedDay({
      day,
      dateKey,
      events: eventsByDay[dateKey] || [],
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedDay(null);
    setActiveEvent(null);
  }

  function openCreateEventModal(dateStr) {
    setEventModalOpen(true);
    setNewEvent({
      title: "",
      description: "",
      date: dateStr,
      location: "",
    });
    setActiveEvent(null);
  }

  function openEditEventModal(event) {
    setEventModalOpen(true);
    setActiveEvent(event);
    setNewEvent({
      title: event.title,
      description: event.description,
      date: event.date,
      location: event.location,
    });
  }

  async function handleEventSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setNotification({ type: "", message: "" });
    try {
      if (activeEvent) {
        // Update
        await updateEvent({ ...activeEvent, ...newEvent });
        setNotification({
          type: "success",
          message: "Event updated successfully.",
        });
      } else {
        // Create
        await createEvent(newEvent);
        setNotification({
          type: "success",
          message: "Event created successfully.",
        });
      }
      await refetchEvents();
      setEventModalOpen(false);
    } catch (err) {
      setNotification({
        type: "error",
        message:
          err?.message || "An error occurred while saving the event.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteEvent(eventId) {
    if (!window.confirm("Delete this event permanently?")) return;
    try {
      await deleteEvent(eventId);
      setNotification({
        type: "success",
        message: "Event deleted.",
      });
      setModalOpen(false);
      await refetchEvents();
    } catch (err) {
      setNotification({
        type: "error",
        message: err?.message || "Failed to delete event",
      });
    }
  }

  // Highlight today's date
  const todayKey = new Date().toISOString().split("T")[0];
  const isTodayInMonth =
    currentDate.getFullYear() === new Date().getFullYear() &&
    currentDate.getMonth() === new Date().getMonth();

  return (
    <div className="w-full max-w-5xl mx-auto px-2 md:px-8">
      <div className="flex items-center justify-between mb-6 mt-4">
        <h2 className="text-3xl font-bold text-primary">{monthLabel}</h2>
        <div>
          <Button variant="secondary" onClick={handlePrevMonth} className="mr-2" aria-label="Previous Month">
            &larr;
          </Button>
          <Button variant="secondary" onClick={handleNextMonth} aria-label="Next Month">
            &rarr;
          </Button>
        </div>
      </div>
      {notification.message && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification({ type: "", message: "" })}
        />
      )}
      <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-lg shadow-md">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {dayNames.map((d) => (
                <th key={d} className="p-3 text-center font-medium text-gray-600 dark:text-gray-300">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthMatrix.map((week, i) => (
              <tr key={i}>
                {week.map((day, j) => {
                  let cellDateKey = null;
                  let hasEvents = false;
                  let isToday = false;
                  if (day) {
                    cellDateKey = new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth(),
                      day
                    )
                      .toISOString()
                      .split("T")[0];
                    hasEvents = !!eventsByDay[cellDateKey];
                    isToday = isTodayInMonth && day === new Date().getDate();
                  }
                  return (
                    <td
                      key={j}
                      className={`h-20 w-1/7 border border-gray-100 dark:border-gray-800 text-center align-top relative group transition 
                      ${
                        day
                          ? "cursor-pointer hover:bg-primary-50 dark:hover:bg-gray-800"
                          : "bg-gray-50 dark:bg-gray-900"
                      }`}
                      onClick={() => handleDayClick(day)}
                    >
                      {day && (
                        <div
                          className={`flex items-center justify-center mt-2 mb-1 mx-auto rounded-full w-8 h-8
                            ${
                              isToday
                                ? "bg-primary-600 text-white font-bold border-2 border-primary-600"
                                : hasEvents
                                ? "bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200"
                                : "text-gray-600 dark:text-gray-300"
                            }
                          `}
                          style={{ transition: "all 0.15s" }}
                        >
                          {day}
                        </div>
                      )}
                      {/* Event dots or count indicator */}
                      {day && hasEvents && (
                        <div className="flex flex-wrap justify-center mt-1 px-1">
                          {eventsByDay[cellDateKey]
                            .slice(0, 3)
                            .map((event, idx) => (
                              <span
                                key={event.id}
                                className="inline-block h-2 w-2 rounded-full bg-primary-500 mr-1 mb-1"
                                title={event.title}
                              />
                            ))}
                          {eventsByDay[cellDateKey].length > 3 && (
                            <span className="ml-1 text-xs text-primary-500 font-bold">
                              +{eventsByDay[cellDateKey].length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loading && (
        <div className="mt-3 text-center text-gray-600">Loading calendar...</div>
      )}
      {error && (
        <Notification
          type="error"
          message={error.message || "Could not load events."}
        />
      )}

      {/* Modal for day/event list */}
      {modalOpen && selectedDay && (
        <Modal isOpen={modalOpen} onClose={closeModal} title={`Events on ${selectedDay.dateKey}`}>
          <div className="space-y-3">
            {selectedDay.events.length === 0 ? (
              <div className="text-gray-400 text-center">No events for this day.</div>
            ) : (
              selectedDay.events.map((event) => (
                <div
                  key={event.id}
                  className="border-b pb-3 mb-3 last:mb-0 last:pb-0 last:border-0"
                >
                  <div className="flex justify-between items-center gap-2">
                    <h4 className="text-lg font-semibold">{event.title}</h4>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditEventModal(event)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    {event.location && <span>{event.location} &bull; </span>}
                    {event.description}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(event.date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-5 flex justify-end">
            <Button
              variant="primary"
              onClick={() => openCreateEventModal(selectedDay.dateKey)}
            >
              Add New Event
            </Button>
          </div>
        </Modal>
      )}

      {/* Event creation/edit modal */}
      {eventModalOpen && (
        <Modal
          isOpen={eventModalOpen}
          onClose={() => setEventModalOpen(false)}
          title={activeEvent ? "Edit Event" : "Create Event"}
        >
          <form onSubmit={handleEventSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="event-title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Title<span className="text-red-500">*</span>
              </label>
              <input
                id="event-title"
                name="title"
                type="text"
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent((ne) => ({ ...ne, title: e.target.value }))
                }
                className="form-input w-full"
                required
                maxLength={120}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Description
              </label>
              <textarea
                name="description"
                value={newEvent.description}
                onChange={(e) =>
                  setNewEvent((ne) => ({
                    ...ne,
                    description: e.target.value,
                  }))
                }
                className="form-textarea w-full"
                rows={3}
                maxLength={600}
              />
            </div>
            <div>
              <label
                htmlFor="event-date"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Date/Time<span className="text-red-500">*</span>
              </label>
              <input
                id="event-date"
                name="date"
                type="datetime-local"
                value={
                  newEvent.date
                    ? new Date(newEvent.date).toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  setNewEvent((ne) => ({
                    ...ne,
                    date: new Date(e.target.value).toISOString(),
                  }))
                }
                className="form-input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Location
              </label>
              <input
                name="location"
                type="text"
                value={newEvent.location}
                onChange={(e) =>
                  setNewEvent((ne) => ({
                    ...ne,
                    location: e.target.value,
                  }))
                }
                className="form-input w-full"
                maxLength={120}
              />
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEventModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                disabled={submitting}
              >
                {activeEvent ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Calendar;