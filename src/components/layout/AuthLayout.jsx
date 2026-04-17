import React, { useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import Footer from "./Footer";
import { useAuth } from "../../hooks/useAuth";
import ThemeSwitcher from "../common/ThemeSwitcher";
import Notification from "../common/Notification";

/**
 * Auth background images, mapped by route type.
 * @type {Object}
 */
const AUTH_BG_IMAGES = {
  login: "/images/hero/auth-bg-1.jpg",
  register: "/images/hero/auth-bg-2.jpg",
  forgot: "/images/hero/auth-bg-3.jpg",
};

/**
 * Decide which auth background to use based on pathname.
 * @param {string} pathname
 * @returns {string}
 */
function getAuthBgByPath(pathname) {
  if (pathname.includes("register")) return AUTH_BG_IMAGES.register;
  if (pathname.includes("forgot")) return AUTH_BG_IMAGES.forgot;
  return AUTH_BG_IMAGES.login;
}

/**
 * AuthLayout
 * Top-level layout wrapper for authentication-related pages (SignIn, SignUp, ForgotPassword).
 * Features:
 *  - Themed background (per route)
 *  - Centered auth card with logo, content, messaging
 *  - Redirects to home if user is already authenticated
 *  - Shows theme switcher and notification system
 *  - Responsive and accessible structure
 */
const AuthLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Pick auth background (memoized for perf and to avoid useEffect state juggling)
  const backgroundImage = useMemo(
    () => getAuthBgByPath(location.pathname),
    [location.pathname]
  );

  // Prevent authenticated users from using auth pages
  useEffect(() => {
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  // Heading/subtext logic
  const heading = useMemo(() => {
    if (location.pathname.includes("register")) return "Create your account";
    if (location.pathname.includes("forgot")) return "Forgot Password";
    return "Welcome Back";
  }, [location.pathname]);

  const subtext = useMemo(() => {
    if (location.pathname.includes("register"))
      return "Join our mission to impact lives.";
    if (location.pathname.includes("forgot"))
      return "Reset your password securely.";
    return "Sign in to your account to continue.";
  }, [location.pathname]);

  // Helper for form links
  const renderFooterLinks = () => {
    if (location.pathname.includes("register")) {
      return (
        <span>
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary-600 dark:text-primary-400 font-bold hover:underline"
          >
            Sign In
          </Link>
        </span>
      );
    }
    if (location.pathname.includes("forgot")) {
      return (
        <span>
          Remember your password?{" "}
          <Link
            to="/login"
            className="text-primary-600 dark:text-primary-400 font-bold hover:underline"
          >
            Back to Sign In
          </Link>
        </span>
      );
    }
    return (
      <>
        <span>
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="text-primary-600 dark:text-primary-400 font-bold hover:underline"
          >
            Register
          </Link>
        </span>
        <span>
          <Link
            to="/forgot-password"
            className="text-gray-500 hover:underline"
          >
            Forgot password?
          </Link>
        </span>
      </>
    );
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 relative"
      style={{
        background: `url(${backgroundImage}) center/cover no-repeat fixed`,
        transition: "background-image 0.6s",
      }}
      data-testid="auth-layout-root"
    >
      {/* Dimmed overlay for background readability */}
      <div className="absolute inset-0 bg-black bg-opacity-60 dark:bg-opacity-70 z-0 transition-all pointer-events-none" />

      {/* Site Slim Navigation/Header for Auth screens */}
      <header className="relative z-20 py-6 flex justify-between items-center px-6 md:px-12">
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src={logo}
            alt="Flourishing Souls Foundation"
            className="h-10 w-10 object-contain rounded-full border border-white shadow-md transition group-hover:scale-105"
          />
          <span className="text-xl font-bold text-white drop-shadow-sm hidden sm:inline">
            Flourishing Souls Foundation
          </span>
        </Link>
        <ThemeSwitcher />
      </header>

      {/* Auth Card */}
      <main className="flex-1 flex justify-center items-center relative z-20 px-4 py-10">
        <section className="w-full max-w-md md:max-w-lg p-8 rounded-xl bg-white dark:bg-gray-800 shadow-2xl shadow-black/20 border border-gray-200 dark:border-gray-700 relative">
          {/* Notifications */}
          <Notification />

          {/* Card Content */}
          <div className="mb-8 flex flex-col gap-1 items-center">
            <img
              src={logo}
              alt="Logo"
              className="h-14 mb-2 md:mb-3 rounded-lg drop-shadow-md"
            />
            <h2 className="font-extrabold text-2xl md:text-3xl text-gray-800 dark:text-gray-100 text-center">
              {heading}
            </h2>
            <p className="text-gray-500 dark:text-gray-300 mt-1 text-center text-sm">
              {subtext}
            </p>
          </div>
          <div>{children}</div>
          <div className="pt-8 flex flex-col gap-2 text-center text-sm">
            {renderFooterLinks()}
          </div>
        </section>
      </main>

      {/* Global Site Footer for Consistency */}
      <footer className="z-20 relative">
        <Footer />
      </footer>
    </div>
  );
};

export default AuthLayout;
