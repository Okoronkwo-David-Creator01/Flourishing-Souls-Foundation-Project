import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRouter from "./routes/AppRouter";
import { AuthProvider } from "./context";
import ThemeProvider from "./components/common/ThemeProvider";
import NotificationProvider from "./components/common/NotificationProvider";
import "./styles/main.css";
import "./styles/theme.css";
import "./styles/tailwind.css";

/**
 * Main App entrypoint for Flourishing Souls Foundation (Production Ready)
 * - Provides global Auth, Theme, and Notification context.
 * - Configures routing for all user flows: donation, volunteering, support, admin, etc.
 * - Loads global styles.
 * - Handles suspense fallback for code-split routes and components.
 * 
 * This file should never simulate data, always handle real user data from backend/services.
 * 
 * NOTE: Suspense fallback here is almost never reached, because all actual lazy loading and suspense is handled
 *       inside AppRouter. If you see a blue loading screen forever, it's probably a bug or crash in a lazy-loaded
 *       route component (e.g. import error) or in an early context provider (such as AuthProvider, ThemeProvider, etc).
 */

function App() {
  // No Suspense boundary here, since AppRouter already handles it internally (see src/routes/AppRouter.jsx).
  // If stuck, the problem is inside AppRouter's Suspense or a child not resolving.
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <Router>
            <AppRouter />
          </Router>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;

/*
  If your site is stuck on a blue (indigo) loading screen:
  - The cause is almost always an import error or failure in one of your lazy-loaded pages/components in AppRouter.
    (Check AppRouter's Suspense boundary and lazy() imports.)
  - Common culprits:
      * Wrong file path or typo in lazy(() => import("...")) in src/routes/AppRouter.jsx
      * The AuthProvider (or ThemeProvider, NotificationProvider) throws or hangs while initializing.
      * Some code in those providers or their children throws before rendering AppRouter
  - Solutions:
      * Check the browser console for RED errors about failed imports or missing files.
      * Verify all routes and lazy imports in AppRouter.
      * Temporarily remove Suspense from AppRouter and see if an error is thrown.
  - Summary: The blue loading screen is the Suspense fallback in AppRouter.jsx.
    This file (App.jsx) is NOT the cause. Fix AppRouter.jsx or its dependencies.
*/
