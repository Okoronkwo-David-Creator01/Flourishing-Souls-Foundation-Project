import React from "react";
import { Link } from "react-router-dom";

const SUPPORT_EMAIL = "support@flourishing-souls.org";
const HOMEPAGE_ROUTE = "/Home";
const SUGGESTED_ROUTES = [
  { path: "/", label: "Home" },
  { path: "/donate", label: "Donate" },
  { path: "/volunteer", label: "Volunteer" },
  { path: "/events", label: "Events" },
  { path: "/gallery", label: "Gallery" },
  { path: "/support", label: "Support" },
];

function NotFound() {
  React.useEffect(() => {
    // Real-time error monitoring: send a log for analytics (production, not simulation)
    if (window && typeof window.fetch === "function") {
      try {
        window.fetch("/api/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "404-not-found",
            path: window.location.pathname,
            timestamp: Date.now(),
            userAgent: navigator.userAgent || null,
            referrer: document.referrer || null,
          }),
        });
      } catch (e) {
        // Suppress reporting error to avoid user impact
      }
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-tr from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-900 px-6 py-12 transition-colors duration-200">
      <div className="flex flex-col md:flex-row items-center gap-12 w-full max-w-4xl">
        <div className="flex flex-col items-center md:items-start">
          <div className="text-8xl font-black text-indigo-700 dark:text-indigo-300 tracking-tight mb-2">404</div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
            Page Not Found
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-5 max-w-md">
            We're sorry, the page you are looking for does not exist or has been moved. Double-check the URL, or return to a safe section below.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            <Link
              to={HOMEPAGE_ROUTE}
              className="inline-block px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow transition"
              aria-label="Back to home"
            >
              Back to Home
            </Link>
            <Link
              to="/support"
              className="inline-block px-4 py-2 rounded border border-indigo-600 text-indigo-700 dark:text-indigo-200 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-800 transition"
              aria-label="Contact support"
            >
              Contact Support
            </Link>
          </div>
          <ul className="flex flex-wrap gap-2 mt-4">
            {SUGGESTED_ROUTES.map((route) => (
              <li key={route.path}>
                <Link
                  to={route.path}
                  className="text-indigo-500 hover:underline text-sm font-medium"
                  tabIndex={0}
                  aria-label={`Navigate to ${route.label}`}
                >
                  {route.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-8">
            If you think this is a mistake, <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">let us know</a>.<br />
            Error code: <span className="font-mono">404-NOT-FOUND</span>
          </p>
        </div>
        <div className="hidden md:block">
          <img
            src="/images/illustrations/lost-404.svg"
            onError={e => { e.target.style.display = 'none'; }}
            alt="Lost person illustration"
            className="max-w-xs w-full h-auto"
            loading="lazy"
            width="300"
            height="270"
          />
        </div>
      </div>
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

export default NotFound;

