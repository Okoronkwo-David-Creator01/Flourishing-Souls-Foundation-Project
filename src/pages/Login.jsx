import React, { useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

/**
 * The Login page for authenticating users in production.
 * Integrates with Supabase for real-time authentication.
 * Handles email/password login, social providers, and password reset.
 * No simulations, handles real user data end-to-end.
 */
const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState("idle");
  const [resetMessage, setResetMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const passwordInput = useRef(null);

  // Autofocus on the appropriate field
  React.useEffect(() => {
    if (showReset) {
      document.getElementById("reset-email")?.focus();
    } else {
      passwordInput.current?.focus();
    }
  }, [showReset]);

  // Handle changes to login form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle normal email/password login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setStatus("submitting");
    try {
      const {
        data: { user, session },
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (loginError) {
        setStatus("error");
        setError(loginError.message);
        return;
      }
      setStatus("success");
      // On success, redirect (to dashboard or next) after small delay
      const redirectTo =
        location.state && location.state.from
          ? location.state.from.pathname
          : "/dashboard";
      setTimeout(() => navigate(redirectTo, { replace: true }), 600);
    } catch (err) {
      setStatus("error");
      setError(
        err?.message ||
          "An unexpected error occurred while logging in. Please try again."
      );
    }
  };

  // SOCIAL LOGIN (Google, etc)
  const handleSocial = async (provider) => {
    setError(null);
    setStatus("submitting");
    try {
      const { error: socialError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo:
            window.location.origin +
            "/dashboard", // Or a more advanced redirect as needed
        },
      });
      if (socialError) {
        setStatus("error");
        setError(socialError.message);
      } else {
        setStatus("success");
      }
    } catch (err) {
      setStatus("error");
      setError(
        err?.message || "Error connecting with social provider. Please try again."
      );
    }
  };

  // Handle password reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetStatus("submitting");
    setResetMessage("");
    try {
      const { data, error: resetError } = await supabase.auth.resetPasswordForEmail(
        resetEmail,
        {
          redirectTo: `${window.location.origin}/reset-password`, // should set up this route
        }
      );
      if (resetError) {
        setResetStatus("error");
        setResetMessage(resetError.message);
        return;
      }
      setResetStatus("success");
      setResetMessage(
        "Password reset link sent! Please check your email for instructions."
      );
    } catch (err) {
      setResetStatus("error");
      setResetMessage(
        err?.message ||
          "An error occurred while sending the password reset email. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 dark:bg-slate-900 px-3">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8 border border-gray-200 dark:border-slate-700">
        <Link to="/" className="mb-6 flex items-center gap-2 justify-center">
          <img src="/images/logo.png" alt="Flourishing Souls Foundation" className="h-10" />
          <span className="font-extrabold text-lg text-indigo-700 dark:text-indigo-300">
            Flourishing Souls Foundation
          </span>
        </Link>
        <h2 className="font-semibold text-2xl mb-5 text-indigo-700 dark:text-indigo-100 text-center">
          Sign In to Your Account
        </h2>
        {!showReset ? (
          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
            <div>
              <label
                htmlFor="email"
                className="block font-medium text-sm text-gray-700 dark:text-gray-200"
              >
                Email Address
              </label>
              <input
                type="email"
                name="email"
                id="email"
                autoComplete="email"
                required
                placeholder="you@email.com"
                value={form.email}
                onChange={handleChange}
                className="block mt-2 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-gray-100 placeholder:text-gray-400"
                disabled={status === "submitting"}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block font-medium text-sm text-gray-700 dark:text-gray-200"
              >
                Password
              </label>
              <input
                type="password"
                name="password"
                id="password"
                autoComplete="current-password"
                required
                minLength={6}
                ref={passwordInput}
                placeholder="Your Password"
                value={form.password}
                onChange={handleChange}
                className="block mt-2 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-gray-100 placeholder:text-gray-400"
                disabled={status === "submitting"}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  className="mt-1 text-xs underline text-indigo-500 hover:text-indigo-700"
                  onClick={() => {
                    setShowReset(true);
                    setResetStatus("idle");
                    setResetMessage("");
                  }}
                >
                  Forgot Password?
                </button>
              </div>
            </div>
            {error && (
              <div className="text-red-600 text-sm py-1 px-2 border border-red-300 bg-red-100 rounded">
                {error}
              </div>
            )}
            <button
              type="submit"
              className={`w-full py-2.5 px-4 rounded font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition-all text-lg ${
                status === "submitting" ? "opacity-70 pointer-events-none" : ""
              }`}
              disabled={status === "submitting"}
              aria-busy={status === "submitting"}
            >
              {status === "submitting" ? "Signing In..." : "Sign In"}
            </button>
            <div className="flex items-center my-4">
              <hr className="flex-grow border-gray-300" />
              <span className="mx-3 text-gray-400 dark:text-slate-500 text-xs">
                or
              </span>
              <hr className="flex-grow border-gray-300" />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 transition-all"
                onClick={() => handleSocial("google")}
                disabled={status === "submitting"}
                aria-label="Sign in with Google"
              >
                <img src="/images/brand-assets/google.svg" alt="" className="h-5" />
                <span className="font-medium text-gray-700 dark:text-gray-100">Sign in with Google</span>
              </button>
              {/* Add more providers if enabled (Facebook, Apple, etc) */}
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6" autoComplete="off">
            <div>
              <label
                htmlFor="reset-email"
                className="block font-medium text-sm text-gray-700 dark:text-gray-200"
              >
                Enter your email to reset your password
              </label>
              <input
                id="reset-email"
                name="reset-email"
                type="email"
                required
                placeholder="you@email.com"
                className="block mt-2 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-gray-100 placeholder:text-gray-400"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                disabled={resetStatus === "submitting"}
              />
            </div>
            {resetMessage && (
              <div
                className={`${
                  resetStatus === "error"
                    ? "text-red-600 bg-red-100 border border-red-200"
                    : "text-green-700 bg-green-50 border border-green-200"
                } text-sm p-2 rounded`}
              >
                {resetMessage}
              </div>
            )}
            <button
              type="submit"
              className={`w-full py-2.5 px-4 rounded font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition-all text-lg ${
                resetStatus === "submitting" ? "opacity-70 pointer-events-none" : ""
              }`}
              disabled={resetStatus === "submitting"}
              aria-busy={resetStatus === "submitting"}
            >
              {resetStatus === "submitting"
                ? "Sending Reset Link..."
                : "Send Password Reset Email"}
            </button>
            <div className="flex justify-between items-center mt-2">
              <button
                type="button"
                className="text-xs underline text-indigo-500 hover:text-indigo-700"
                onClick={() => {
                  setShowReset(false);
                  setResetEmail("");
                  setResetMessage("");
                  setResetStatus("idle");
                }}
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}
        <div className="mt-6 text-xs text-gray-600 dark:text-gray-300 text-center">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="underline font-semibold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900"
          >
            Register
          </Link>
        </div>
        <div className="mt-4 text-center text-[11px] text-gray-400 dark:text-slate-500">
          By signing in, you agree to our{" "}
          <a href="/privacy" className="underline hover:text-indigo-500">
            Privacy Policy
          </a>
          .
        </div>
      </div>
      <footer className="mt-8 text-xs text-slate-400 dark:text-slate-500 text-center">
        &copy; {new Date().getFullYear()} Flourishing Souls Foundation. All rights reserved.
      </footer>
    </div>
  );
};

export default Login;
