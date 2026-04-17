import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../components/common/Layout";
import { useAuth } from "../context";

/**
 * NOTE: The Suspense fallback ("Loading..." on blue) here is where you land if a lazy-loaded route never resolves.
 * Fixes for "stuck on blue loading screen":
 *   - Check lazy() import paths for typos or missing files.
 *   - Check your browser console for RED errors about failed imports.
 *   - Ensure context providers in App.jsx don't throw/hang (especially AuthProvider).
 *   - Remove/comment Suspense here for debugging (it will throw the real error).
 */

const Home = lazy(() => import("../pages/Home"));
const Donate = lazy(() => import("../pages/Donate"));
const Volunteer = lazy(() => import("../pages/Volunteer"));
const Support = lazy(() => import("../pages/Support"));
const Events = lazy(() => import("../pages/Events"));
const Gallery = lazy(() => import("../pages/Gallery"));
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const Admin = lazy(() => import("../pages/Admin"));

// Inline NotFound -- prefer to create ../pages/NotFound.jsx for production.
const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
    <h1 className="text-6xl font-bold text-indigo-600 mb-4">404</h1>
    <p className="text-2xl text-gray-800 mb-2">Page Not Found</p>
    <p className="text-gray-500">Sorry, the page you are looking for does not exist.</p>
  </div>
);

function RequireAuth({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    // Show Suspense-style loader while auth state loads
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-indigo-500 text-lg animate-pulse">Loading...</span>
      </div>
    );
  }
  if (!user) {
    // Not logged in: redirect to login page
    return <Navigate to="/login" replace />;
  }
  if (requiredRole && (!user.role || user.role !== requiredRole)) {
    // Not enough role: redirect to home
    return <Navigate to="/" replace />;
  }
  return children;
}

const AppRouter = () => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center min-h-screen bg-indigo-50">
        <span className="text-indigo-500 text-lg animate-pulse">Loading...</span>
      </div>
    }
  >
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/volunteer" element={<Volunteer />} />
        <Route path="/support" element={<Support />} />
        <Route path="/events" element={<Events />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/admin/*"
          element={
            <RequireAuth requiredRole="admin">
              <Admin />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  </Suspense>
);

export default AppRouter;

/*
  If the app is stuck on a blue loading screen:
    - It is almost always due to a failed or pending lazy() import in this file.
    - Check for typos/missing files: lazy(() => import('...'))
    - Check context providers in App.jsx (AuthProvider, ThemeProvider, etc) for errors/thrown exceptions.
    - Remove Suspense from here to see uncaught import errors in the console.
*/
