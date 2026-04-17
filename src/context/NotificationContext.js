import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * NotificationContext
 * Provides a context and provider for managing global app notifications (toasts/snackbars/alerts)
 * 
 * Usage example:
 *    const { notify, clearNotifications } = useNotification();
 *    notify({
 *      type: 'success', // 'info' | 'warning' | 'error' | 'success'
 *      message: 'Profile saved!',
 *      duration: 5000
 *    });
 */

// Notification shape example
// {
//   id: string,
//   message: string,
//   type: 'info' | 'success' | 'warning' | 'error',
//   duration: number (ms) | undefined,
//   actions: [{ label: string, callback: function }]
// }

const NotificationContext = createContext(null);

let notificationId = 0;

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const timers = useRef({});

  // Generate unique ids for notifications
  const generateId = () => {
    notificationId += 1;
    return `notif_${Date.now()}_${notificationId}`;
  };

  // Remove notification by id (also clear timer if exists)
  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  // Push/Add notification
  const notify = useCallback(
    ({
      message,
      type = 'info',
      duration = 5000,
      actions = [],
      id: providedId = null
    }) => {
      if (!message) return;
      const id = providedId || generateId();

      setNotifications((prev) => [
        ...prev,
        { id, message, type, duration, actions }
      ]);

      if (duration && duration > 0) {
        timers.current[id] = setTimeout(() => {
          removeNotification(id);
        }, duration);
      }

      return id;
    },
    [removeNotification]
  );

  // Clear all notifications (and timers)
  const clearNotifications = useCallback(() => {
    Object.values(timers.current).forEach((timer) => clearTimeout(timer));
    timers.current = {};
    setNotifications([]);
  }, []);

  // "Imperative" dismiss, e.g. user clicks X
  const dismissNotification = useCallback(
    (id) => {
      removeNotification(id);
    },
    [removeNotification]
  );

  // Ensure timers are cleaned up on unmount
  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach((timer) => clearTimeout(timer));
      timers.current = {};
    };
  }, []);

  // Value provided by context
  const contextValue = {
    notifications,
    notify,
    clearNotifications,
    dismissNotification,
  };

  return React.createElement(
    NotificationContext.Provider,
    { value: contextValue },
    children
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Custom hook to access notification context.
 * Usage: const ctx = useNotification();
 */
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === null) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;