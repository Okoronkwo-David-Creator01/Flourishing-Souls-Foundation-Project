import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../../hooks/useAuth';
import AdminAuthGuard from '../admin/AdminAuthGuard';
import Notification from '../common/Notification';
import MainContent from './MainContent';

/**
 * AdminLayout.jsx
 *
 * Complex, production-ready layout for the admin section of the platform.
 * Handles sidebar, header, notifications, and route protection.
 *
 * Note: All admin pages that require authentication and admin role should use this layout.
 */

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, signOut } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 1024);
  const [notifications, setNotifications] = useState([]);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  // Responsive sidebar toggle
  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  // Ensure admin privileges
  useEffect(() => {
    if (!isLoading && user && !isAdmin) {
      navigate('/login', { state: { from: location }, replace: true });
    }
  }, [isLoading, user, isAdmin, navigate, location]);

  // Theme toggling logic
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleThemeSwitch = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Notification mechanism (could be powered from a context or global event bus)
  const addNotification = useCallback((message, type = 'info') => {
    setNotifications((prev) => [
      ...prev,
      { id: Date.now(), message, type }
    ]);
  }, []);
  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <span className="loader">Loading...</span>
      </div>
    );
  }

  return (
    <AdminAuthGuard>
      <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors`}>
        {/* Sidebar */}
        <Sidebar
          open={sidebarOpen}
          onToggle={handleSidebarToggle}
          user={user}
          signOut={signOut}
          activePath={location.pathname}
        />

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 min-w-0">
          <Header
            sidebarOpen={sidebarOpen}
            onSidebarToggle={handleSidebarToggle}
            theme={theme}
            onThemeSwitch={handleThemeSwitch}
            user={user}
            onSignOut={signOut}
            addNotification={addNotification}
          />

          {/* Notification Component */}
          <div className="fixed top-4 right-4 z-50 space-y-2">
            {notifications.map((note) => (
              <Notification
                key={note.id}
                message={note.message}
                type={note.type}
                onClose={() => removeNotification(note.id)}
              />
            ))}
          </div>

          {/* Main Content */}
          <MainContent>
            <React.Suspense
              fallback={
                <div className="flex items-center justify-center h-[300px]">
                  <span className="loader">Loading...</span>
                </div>
              }
            >
              <Outlet />
            </React.Suspense>
          </MainContent>

          <Footer className="mt-auto" />
        </div>
      </div>
    </AdminAuthGuard>
  );
};

AdminLayout.propTypes = {
  // If this component ever receives children directly
  children: PropTypes.node,
};

export default AdminLayout;