
import React, { Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllEvents } from "../services/supabaseServices";
import EventCard from "../components/events/EventCard";
import Calendar from "../components/events/Calendar";

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calendar filter state (example: filter by date or category)
  const [calendarDate, setCalendarDate] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    // Real-time data fetch, no simulation
    getAllEvents()
      .then((data) => {
        if (isMounted) {
          setEvents(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError("Could not load events right now.");
          setLoading(false);
        }
      });

    // Optionally, listen to real-time updates if supported
    // Example: supabase.channel.subscribe(...)
    // Can implement a hook/useSubscription for real-time table changes

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter logic if using calendar
  const filteredEvents = calendarDate
    ? events.filter(evt =>
        new Date(evt.date).toDateString() ===
        new Date(calendarDate).toDateString()
      )
    : events;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 pb-16">
      <header className="w-full max-w-4xl mx-auto py-8 flex flex-col items-center gap-2">
        <h1 className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-300 tracking-tight">
          Upcoming Events
        </h1>
        <p className="text-md text-gray-500 dark:text-gray-300 text-center max-w-2xl">
          Join us and make a difference! Here are all our real, upcoming, and past events, automatically updated in real time from our live database.
        </p>
        <div className="mt-2">
          <Link
            to="/"
            className="text-xs text-slate-400 hover:text-indigo-400 transition"
          >
            &laquo; Back to Home
          </Link>
        </div>
      </header>

      <main className="w-full max-w-4xl mx-auto">
        <section className="mb-8">
          <Suspense fallback={<div>Loading calendar...</div>}>
            <Calendar
              events={events}
              selectedDate={calendarDate}
              onDateSelect={setCalendarDate}
            />
          </Suspense>
        </section>

        {loading ? (
          <div className="w-full py-32 text-center text-lg text-gray-500 dark:text-gray-400">
            Loading events...
          </div>
        ) : error ? (
          <div className="w-full py-8 text-center text-red-500">{error}</div>
        ) : filteredEvents.length === 0 ? (
          <div className="w-full py-8 text-center text-gray-400">
            No events found for the selected date or criteria.
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </section>
        )}

        <div className="mt-8 text-xs text-gray-400 text-center">
          Interested in hosting or suggesting an event?{" "}
          <a
            href="mailto:support@flourishingsoulsfoundation.org"
            className="underline hover:text-indigo-600"
          >
            Contact us
          </a>
        </div>
      </main>

      <footer className="w-full mt-12 flex flex-col items-center">
        <Link
          to="/"
          className="text-xs text-slate-400 hover:text-indigo-500 transition"
        >
          &copy; {new Date().getFullYear()} Flourishing Souls Foundation
        </Link>
      </footer>
    </div>
  );
}

export default Events;


