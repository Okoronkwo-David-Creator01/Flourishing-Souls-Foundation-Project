import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

/**
 * AdminAuthGuard protects admin routes and components.
 * Only authenticated users with the "admin" role can access children.
 * Otherwise, they are redirected to login or a not-authorized page.
 * This component assumes useAuth returns { user, loading }, and user has a "role" property.
 */
const AdminAuthGuard = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Optionally, put a spinner here
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <span className="ml-4 text-lg font-medium text-gray-700 dark:text-gray-200">
          Checking admin privileges...
        </span>
      </div>
    );
  }

  if (!user) {
    // Not logged in, redirect to login and preserve next location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== "admin") {
    // Logged in, but not admin
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-red-50 dark:bg-gray-950">
        <h2 className="text-3xl font-bold text-red-700 dark:text-red-400 mb-2">Access Denied</h2>
        <p className="text-base text-gray-600 dark:text-gray-300">
          You do not have permission to view this admin section.
        </p>
      </div>
    );
  }

  // Authorized admin, render children
  return <>{children}</>;
};

export default AdminAuthGuard;
