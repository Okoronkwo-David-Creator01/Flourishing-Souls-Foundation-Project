
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";

/**
 * Production-ready SignIn component
 * Handles: authentication, redirect, error messaging, loading state, forgot password link, "show password"
 */
const SignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const from = location.state?.from?.pathname || "/";

  // Clean form on unmount for security
  React.useEffect(() => {
    return () =>
      setForm({ email: "", password: "" });
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { email, password } = form;
      if (!email || !password) {
        setError("Email and password are required.");
        setLoading(false);
        return;
      }
      const { error: signInError, data, user, session } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // signInError and data.session checking for real-time sign-in state
      if (signInError || !data.session) {
        setError(signInError?.message || "Invalid email or password.");
        setLoading(false);
        return;
      }

      // Optionally fetch user profile or roles here with Supabase client if your system needs it
      setSuccess("Sign-in successful. Redirecting...");
      setTimeout(() => navigate(from, { replace: true }), 1000);
    } catch (err) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSignIn = async (provider) => {
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider });
      if (error) setError(error.message);
      // No further action here: Supabase will redirect as needed
    } catch (err) {
      setError(err.message || "Unable to sign in with provider.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-md shadow-lg p-8">
        <div className="flex flex-col items-center mb-6">
          <img src="/images/logo.png" alt="Flourishing Souls Foundation Logo" className="h-12 mb-2" />
          <h1 className="text-2xl font-bold mb-1">Sign in</h1>
          <p className="text-gray-500 text-sm">Access your account</p>
        </div>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              value={form.email}
              onChange={handleChange}
              className="form-input mt-1 block w-full"
              disabled={loading}
            />
          </div>
          <div className="mb-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={form.password}
                onChange={handleChange}
                className="form-input mt-1 block w-full pr-10"
                disabled={loading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 text-xs"
                tabIndex={-1}
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  onChange={() => setShowPassword((s) => !s)}
                  checked={showPassword}
                  disabled={loading}
                />
                <span className="ml-2 text-xs text-gray-600">Show Password</span>
              </label>
            </div>
            <div>
              <Link
                to="/forgot-password"
                className="text-xs text-primary-500 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>
          {error && <div className="mb-2 text-red-600 text-sm">{error}</div>}
          {success && <div className="mb-2 text-green-600 text-sm">{success}</div>}
          <button
            type="submit"
            className="w-full py-2 px-4 bg-primary-600 text-white font-semibold rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 transition"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-gray-200" />
          <span className="mx-3 text-xs text-gray-500">or</span>
          <div className="flex-grow border-t border-gray-200" />
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="flex items-center justify-center w-full py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition"
            onClick={() => handleProviderSignIn("google")}
            disabled={loading}
          >
            <img src="/assets/images/google.svg" alt="" className="h-5 w-5 mr-2" />
            Continue with Google
          </button>
          {/* Extend here for more providers (e.g. Facebook, GitHub) if enabled in Supabase */}
        </div>
        <p className="mt-6 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-primary-500 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignIn;