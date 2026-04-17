import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Button, Modal, Notification } from "../common/ThemeProvider";
import { CalendarIcon, MapPinIcon, UserGroupIcon } from "@heroicons/react/24/outline";

/**
 * EventCard - Complex, production-ready card for an event.
 * - Renders rich info and live status.
 * - Responsive and accessible.
 * - Provides real-time registration and waitlist management if available in parent.
 * - Shows live attendee count, spots left, date/time with timezone, location and type.
 * - Displays event cover image, fallback or shimmer.
 * - Handles registration, error/success state, loading state.
 * @param {object} props
 */
const EventCard = ({
  event,
  attendeeCount,
  spotsLeft,
  canRegister = false,
  onRegister,
  registering,
  userRegistered,
  onUnregister,
  unregistering,
  isWaitlist,
  showActions = true,
  className = "",
  showAttendees = false,
  attendees = [],
  // For modals/notifications
  notify,
}) => {
  const [coverLoaded, setCoverLoaded] = React.useState(false);
  const [coverError, setCoverError] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  // Helper functions
  const status = event?.date
    ? new Date(event.date).getTime() > Date.now()
      ? "upcoming"
      : "past"
    : "draft";
  const isFull = spotsLeft !== undefined && spotsLeft <= 0;
  const isLive = status === "upcoming" && !isFull;

  const locationDisplay = event.location || "—";
  const eventType = event.type || "General";
  const formattedDate = event.date
    ? new Date(event.date).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      })
    : "No date set";

  // Accessibility: cover image alt
  const imgAlt =
    event.coverImageAlt ||
    `Cover image for ${event.title || "event"}`;

  // Registration logic
  const handleRegister = async () => {
    if (registering) return;
    setModalOpen(false);
    if (onRegister) await onRegister(event);
  };

  const handleUnregister = async () => {
    if (unregistering) return;
    setModalOpen(false);
    if (onUnregister) await onUnregister(event);
  };

  // Attendee Avatars (if available)
  const renderAvatars = () =>
    showAttendees && Array.isArray(attendees) && attendees.length > 0 ? (
      <div className="flex -space-x-2 overflow-hidden mt-2">
        {attendees.slice(0, 5).map((att) =>
          att.avatar ? (
            <img
              key={att.id}
              className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-700 object-cover"
              src={att.avatar}
              alt={att.name || "User"}
              loading="lazy"
            />
          ) : (
            <div
              key={att.id}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-xs font-bold ring-2 ring-white dark:ring-slate-700"
              title={att.name}
            >
              {att.name ? att.name[0] : "U"}
            </div>
          )
        )}
        {attendees.length > 5 && (
          <span className="ml-2 text-xs text-gray-400 align-middle">{`+${attendees.length - 5} more`}</span>
        )}
      </div>
    ) : null;

  // Cover image shimmer/fallback
  const renderCover = () => (
    <div className="relative">
      {!coverLoaded && !coverError && (
        <div className="animate-pulse h-44 bg-gray-200 dark:bg-slate-700 rounded-t-lg" />
      )}
      <img
        src={coverError ? "/images/logo.png" : event.coverImage}
        alt={imgAlt}
        className={`h-44 w-full object-cover rounded-t-lg transition-opacity duration-700 ${
          coverLoaded ? "opacity-100" : "opacity-0"
        }`}
        style={{ display: coverLoaded ? "block" : "none" }}
        loading="lazy"
        onLoad={() => setCoverLoaded(true)}
        onError={() => setCoverError(true)}
      />
      {isLive && (
        <span className="absolute top-3 left-3 bg-green-600 text-white text-xxs px-2 py-1 rounded uppercase font-bold tracking-wider shadow">
          Upcoming
        </span>
      )}
      {status === "past" && (
        <span className="absolute top-3 left-3 bg-gray-500 text-white text-xxs px-2 py-1 rounded uppercase font-bold tracking-wider shadow">
          Past
        </span>
      )}
      {isWaitlist && isFull && (
        <span className="absolute top-3 right-3 bg-yellow-500 text-white text-xxs px-2 py-1 rounded uppercase font-bold tracking-wider shadow">
          Waitlist
        </span>
      )}
    </div>
  );

  // Notification component: (success/error)
  const notifyToast = notify ? Notification : null;

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden flex flex-col transition-all hover:shadow-2xl ${className}`}
      aria-live="polite"
    >
      {renderCover()}
      <div className="flex flex-1 flex-col p-4">
        <header>
          <h3 className="text-lg font-extrabold mb-1 text-primary-700 dark:text-primary-300 line-clamp-2">
            {event.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-300 mb-2">
            <CalendarIcon className="w-4 h-4 mr-1 text-primary-400" />
            <span>{formattedDate}</span>
          </div>
        </header>

        {event.description && (
          <div className="mb-2">
            <p className="text-sm text-gray-600 dark:text-gray-200 line-clamp-3">
              {event.description}
            </p>
          </div>
        )}

        <div className="mb-2 flex items-center gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-200">
            <MapPinIcon className="w-4 h-4 mr-1" />
            <span>{locationDisplay}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-400">·</span>
            <span className="uppercase py-0.5 px-1.5 rounded-full bg-gray-100 dark:bg-slate-700 text-primary-600 dark:text-primary-400 font-semibold text-xxs tracking-wider">
              {eventType}
            </span>
          </div>
        </div>

        {attendeeCount !== undefined && (
          <div className="flex items-center space-x-2 mt-2 text-xs">
            <UserGroupIcon className="w-4 h-4 mr-1 text-primary-400" />
            <span>
              <strong>{attendeeCount}</strong> attending
              {spotsLeft !== undefined && (
                <>
                  {" "}
                  <span className="text-gray-400">/</span>{" "}
                  <span
                    className={`font-semibold ${
                      isFull
                        ? "text-red-600 dark:text-red-400"
                        : "text-green-600 dark:text-green-400"
                    }`}
                  >
                    {isFull
                      ? "Full"
                      : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`}
                  </span>
                </>
              )}
            </span>
          </div>
        )}

        {renderAvatars()}

        <div className="mt-auto flex flex-col gap-2">
          <Link
            to={`/events/${event.id}`}
            className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold inline-block"
            tabIndex={0}
            aria-label={`View more details about ${event.title}`}
            onClick={(e) => {
              if (event.external) e.preventDefault();
              setDetailsOpen(true);
            }}
          >
            View details
          </Link>

          {/* Action buttons */}
          {showActions && (
            <div className="flex items-center gap-2 mt-2">
              {userRegistered ? (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  loading={unregistering}
                  disabled={unregistering}
                  onClick={() => setModalOpen(true)}
                  aria-label="Unregister from this event"
                >
                  Unregister
                </Button>
              ) : (
                <Button
                  type="button"
                  variant={isFull ? "secondary" : "primary"}
                  size="sm"
                  loading={registering}
                  disabled={
                    registering || !isLive || isFull || !canRegister
                  }
                  onClick={() => setModalOpen(true)}
                  aria-label={isFull ? "Event is full" : "Register for this event"}
                >
                  {isFull
                    ? isWaitlist
                      ? "Join Waitlist"
                      : "Full"
                    : isWaitlist
                    ? "Join Waitlist"
                    : "Register"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirm/Register/Unregister Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="p-4">
          <h2 className="text-lg font-bold mb-3">
            {userRegistered ? "Unregister from Event" : isFull && isWaitlist ? "Join Waitlist" : "Register for Event"}
          </h2>
          <p className="mb-4">
            {userRegistered
              ? "Are you sure you want to unregister from this event?"
              : isFull && isWaitlist
              ? "This event is full. Join the waitlist to get notified if a spot opens."
              : "Confirm your registration for this event?"}
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            {userRegistered ? (
              <Button
                variant="danger"
                loading={unregistering}
                onClick={handleUnregister}
              >
                Yes, Unregister
              </Button>
            ) : (
              <Button
                variant={isFull && isWaitlist ? "secondary" : "primary"}
                loading={registering}
                onClick={handleRegister}
                disabled={registering}
              >
                {isFull && isWaitlist
                  ? "Join Waitlist"
                  : "Yes, Register"}
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Details Modal (optional: quickpeek for external events) */}
      <Modal open={detailsOpen} onClose={() => setDetailsOpen(false)}>
        <div className="max-w-lg p-5">
          <header>
            <h2 className="text-xl font-semibold mb-2">{event.title}</h2>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
              <CalendarIcon className="w-4 h-4 mr-1" />
              <span>{formattedDate}</span>
              <span className="mx-2">•</span>
              <MapPinIcon className="w-4 h-4" />
              <span>{locationDisplay}</span>
            </div>
          </header>
          <img
            className="w-full h-52 object-cover mb-3 rounded"
            src={coverError ? "/images/logo.png" : event.coverImage}
            alt={imgAlt}
            loading="lazy"
            onLoad={() => setCoverLoaded(true)}
            onError={() => setCoverError(true)}
          />
          <div className="mb-4">
            <p className="text-gray-700 dark:text-gray-200">{event.description}</p>
          </div>
          {notifyToast && <Notification />}
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
            {!userRegistered && canRegister && !isFull && !registering && (
              <Button
                variant="primary"
                onClick={() => {
                  setDetailsOpen(false);
                  setModalOpen(true);
                }}
              >
                Register
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

EventCard.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    description: PropTypes.string,
    location: PropTypes.string,
    date: PropTypes.string,
    coverImage: PropTypes.string,
    coverImageAlt: PropTypes.string,
    type: PropTypes.string,
    external: PropTypes.bool,
  }).isRequired,
  attendeeCount: PropTypes.number,
  spotsLeft: PropTypes.number,
  canRegister: PropTypes.bool,
  onRegister: PropTypes.func,
  registering: PropTypes.bool,
  userRegistered: PropTypes.bool,
  onUnregister: PropTypes.func,
  unregistering: PropTypes.bool,
  isWaitlist: PropTypes.bool,
  showActions: PropTypes.bool,
  showAttendees: PropTypes.bool,
  attendees: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      avatar: PropTypes.string,
      name: PropTypes.string,
    })
  ),
  notify: PropTypes.func,
};

export default EventCard;


