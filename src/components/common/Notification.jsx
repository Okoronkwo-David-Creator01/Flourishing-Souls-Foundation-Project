import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";

/**
 * Notification Component - Production Ready, Real-Time
 * - Works with NotificationContext for truly global, realtime notifications.
 * - Type: "success", "error", "info", "warning", "loading"
 * - Auto-dismiss, persistent, ARIA-live/accessible, composable, and atomic.
 * - You should use this inside a notification system -- e.g., NotificationProvider manages stacking & state.
 *
 * Props:
 *   - id: unique notification id (string/number) [required]
 *   - type: one of "success"|"error"|"info"|"warning"|"loading" (default "info")
 *   - message: main notification text (JSX or string)
 *   - description: optional sub-text
 *   - duration: ms to auto-close (0 = persistent)
 *   - onClose: fn(id) callback for dismiss
 *   - actions: [{ label, onClick }]
 *   - className: for extra CSS/tailwind classes
 */

const TYPE_CONF = {
  success: {
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    bg: "bg-green-50",
    border: "border-green-400",
    text: "text-green-900"
  },
  error: {
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    bg: "bg-red-50",
    border: "border-red-400",
    text: "text-red-900"
  },
  info: {
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01" />
      </svg>
    ),
    bg: "bg-blue-50",
    border: "border-blue-400",
    text: "text-blue-900"
  },
  warning: {
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M4.93 19h14.14a2 2 0 001.72-3l-7.07-12a2 2 0 00-3.43 0l-7.07 12A2 2 0 004.93 19z" />
      </svg>
    ),
    bg: "bg-yellow-50",
    border: "border-yellow-400",
    text: "text-yellow-900"
  },
  loading: {
    icon: (
      <svg className="animate-spin h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    ),
    bg: "bg-gray-50",
    border: "border-gray-300",
    text: "text-gray-800"
  }
};

function Notification({
  id,
  type = "info",
  message,
  description,
  duration = 5000,
  onClose,
  actions = [],
  className = ""
}) {
  const timerRef = useRef();
  const closeBtnRef = useRef();

  // Set up auto-dismiss for non-loading, finite-duration notifications
  useEffect(() => {
    if (type === "loading" || !duration || duration <= 0) return;
    timerRef.current = setTimeout(() => {
      if (onClose) onClose(id);
    }, duration);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line
  }, [id, duration, type, onClose]);

  // Accessibility: Close on ESC and focus close btn on mount
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") {
        onClose?.(id);
      }
    }
    document.addEventListener("keydown", handleKey);
    if (closeBtnRef.current) closeBtnRef.current.focus();
    return () => document.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line
  }, [id, onClose]);

  const { icon, bg, border, text } = TYPE_CONF[type] || TYPE_CONF.info;

  return (
    <div
      className={`relative flex w-full max-w-sm mx-auto my-2 p-4 rounded shadow-lg border-l-4 ${bg} ${border} ${text} ${className}`}
      role="alert"
      aria-live={type === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      tabIndex={0}
      data-notification={type}
    >
      <div className="flex-shrink-0 mr-3 mt-1">{icon}</div>
      <div className="flex-1 min-w-0">
        {message && (
          <div className="font-semibold text-base leading-tight">
            {message}
          </div>
        )}
        {description && (
          <div className="mt-1 text-sm opacity-90">
            {description}
          </div>
        )}
        {(actions && actions.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {actions.map((action, idx) => (
              <button
                key={idx}
                className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition ring-1 ring-gray-200"
                type="button"
                onClick={() => action.onClick?.(id)}
                tabIndex={0}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        ref={closeBtnRef}
        className="ml-4 flex-shrink-0 p-1 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition"
        onClick={() => onClose?.(id)}
        aria-label="Close notification"
        tabIndex={0}
        type="button"
      >
        <svg
          className="h-4 w-4 text-gray-600"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 8.586l4.95-4.95a1 1 0 111.414 1.415L11.414 10l4.95 4.95a1 1 0 01-1.415 1.415L10 11.414l-4.95 4.95a1 1 0 01-1.415-1.415L8.586 10l-4.95-4.95A1 1 0 115.05 3.636L10 8.586z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}

Notification.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  type: PropTypes.oneOf(["success", "error", "info", "warning", "loading"]),
  message: PropTypes.node.isRequired,
  description: PropTypes.node,
  duration: PropTypes.number,
  onClose: PropTypes.func,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func
    })
  ),
  className: PropTypes.string
};

export default Notification;