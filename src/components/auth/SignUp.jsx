import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

// If you have a custom Button or Notification component, import them like:
// import { Button, Notification } from "../common";

const initialFormState = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const SignUp = () => {
  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  // Helper: Validate email format
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Handle input changes
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    setFormError("");
    setSuccessMessage("");
  };

  // Handle sign up logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    // BASIC VALIDATION
    if (!form.fullName.trim())
      return setFormError("Full Name is required.");

    if (!isValidEmail(form.email))
      return setFormError("Please enter a valid email address.");

    if (!form.password || form.password.length < 8)
      return setFormError("Password must be at least 8 characters.");

    if (form.password !== form.confirmPassword)
      return setFormError("Passwords do not match.");

    setLoading(true);
    try {
      // SIGN UP USER in Supabase (with email verification)
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        if (error.message.includes("already registered"))
          setFormError("This email address is already registered.");
        else setFormError(error.message);
        setLoading(false);
        return;
      }

      // PRODUCTION: Insert user data into the "profiles" or users table if required
      // You may choose to use an onAuthStateChange function instead for security.

      // Optionally store extra user profile data
      // await supabase.from("profiles").insert([
      //   { id: user.id, full_name: form.fullName, email: form.email },
      // ]);

      setSuccessMessage(
        "Account created! Please check your email for a confirmation link."
      );
      setForm(initialFormState);

      // Optionally, redirect immediately on account creation (not best practice!)
      // navigate("/signin");

    } catch {
      setFormError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white py-8 px-6 shadow-lg">
        <div>
          <img
            className="mx-auto h-16 w-auto"
            src="/images/logo.png"
            alt="Flourishing Souls Foundation Logo"
          />
          <h2 className="mt-3 text-center text-2xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-1 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              className="font-medium text-primary-600 hover:underline"
              to="/login"
            >
              Sign in
            </Link>
          </p>
        </div>

        {formError && (
          <div className="mb-4 rounded bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 rounded bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-700"
            >
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              id="fullName"
              placeholder="John Doe"
              value={form.fullName}
              onChange={handleChange}
              required
              autoComplete="name"
              className="mt-1 w-full rounded-md border bg-gray-50 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              className="mt-1 w-full rounded-md border bg-gray-50 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
              minLength={8}
              className="mt-1 w-full rounded-md border bg-gray-50 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
              minLength={8}
              className="mt-1 w-full rounded-md border bg-gray-50 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-md bg-primary-600 py-2 px-4 text-white font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition ${
              loading ? "cursor-not-allowed opacity-60" : ""
            }`}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center">
          <span className="text-xs text-gray-400">
            By signing up, you agree to our
            <Link to="/terms" className="ml-1 text-primary-600 hover:underline">
              Terms of Service
            </Link>{" "}
            &
            <Link
              to="/privacy"
              className="ml-1 text-primary-600 hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </span>
        </div>
      </div>
    </div>
  );
};

export default SignUp;