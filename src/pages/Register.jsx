import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const initialState = {
  name: "",
  email: "",
  password: "",
  passwordConfirm: "",
  agree: false,
};

const Register = () => {
  const [form, setForm] = useState(initialState);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const navigate = useNavigate();

  // Validate form fields
  function validate(fields) {
    const errors = {};
    if (!fields.name.trim()) errors.name = "Full name is required.";

    if (!fields.email.trim()) {
      errors.email = "Email address is required.";
    } else if (
      !/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/i.test(fields.email.trim())
    ) {
      errors.email = "Invalid email format";
    }
    if (!fields.password) {
      errors.password = "Password is required.";
    } else if (fields.password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }
    if (!fields.passwordConfirm) {
      errors.passwordConfirm = "Please confirm your password.";
    } else if (fields.password !== fields.passwordConfirm) {
      errors.passwordConfirm = "Passwords do not match.";
    }
    if (!fields.agree) {
      errors.agree = "You must agree to the terms and privacy policy.";
    }
    return errors;
  }

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
    setFormErrors((fe) => ({ ...fe, [name]: undefined }));
    setRegisterError(null);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setRegisterError(null);
    const errors = validate(form);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setRegisterError(null);

    try {
      // Create user in Supabase Auth
      const { user, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: { name: form.name.trim() },
        },
      });

      if (error) {
        setRegisterError(error.message || "Registration failed. Try another email.");
        setSubmitting(false);
        return;
      }

      // Optionally, insert profile in a 'profiles' table
      // If you have RLS, you may need to handle profiles with triggers
      if (user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert([
            {
              id: user.id,
              email: user.email,
              name: form.name.trim(),
              created_at: new Date().toISOString(),
            },
          ]);
        if (profileError) {
          // Not a critical failure since user is registered,
          // But you may want to handle this appropriately/log for admin investigation.
          // (Could set a state variable to alert admins or log elsewhere.)
        }
      }

      setRegisterSuccess(true);
      setForm(initialState);

      // Give the user a notification and redirect after successful registration
      setTimeout(() => {
        navigate("/dashboard");
      }, 2200);
    } catch (err) {
      setRegisterError(
        err.message
          ? err.message
          : "Unexpected error. Please try again later."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-50 from-20% to-blue-100 dark:from-gray-900 dark:to-indigo-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/95 border border-slate-100 dark:border-slate-800 rounded-xl shadow-lg p-7 mt-10">
        <div className="flex flex-col items-center mb-6">
          <img
            src="/images/logo.png"
            alt="Flourishing Souls Foundation"
            className="w-16 h-16 rounded-full mb-2"
            width={64}
            height={64}
            loading="lazy"
          />
          <h1 className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-300 mb-1">
            Create your account
          </h1>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Welcome! Join the Flourishing Souls Community.
          </div>
        </div>

        {/* Registration Form */}
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300"
            >
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded border
                ${
                  formErrors.name
                    ? "border-red-400 focus:ring-red-300"
                    : "border-slate-200 focus:ring-indigo-200"
                }
                focus:outline-none focus:ring-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 transition`}
              disabled={submitting}
              aria-invalid={!!formErrors.name}
              aria-describedby={formErrors.name && "name-error"}
              required
            />
            {formErrors.name && (
              <div
                className="text-xs text-red-500 mt-1"
                id="name-error"
                role="alert"
              >
                {formErrors.name}
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded border
                ${
                  formErrors.email
                    ? "border-red-400 focus:ring-red-300"
                    : "border-slate-200 focus:ring-indigo-200"
                }
                focus:outline-none focus:ring-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 transition`}
              disabled={submitting}
              aria-invalid={!!formErrors.email}
              aria-describedby={formErrors.email && "email-error"}
              required
            />
            {formErrors.email && (
              <div
                className="text-xs text-red-500 mt-1"
                id="email-error"
                role="alert"
              >
                {formErrors.email}
              </div>
            )}
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              minLength={8}
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded border
                ${
                  formErrors.password
                    ? "border-red-400 focus:ring-red-300"
                    : "border-slate-200 focus:ring-indigo-200"
                }
                focus:outline-none focus:ring-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 transition`}
              disabled={submitting}
              aria-invalid={!!formErrors.password}
              aria-describedby={formErrors.password && "password-error"}
              required
            />
            {formErrors.password && (
              <div
                className="text-xs text-red-500 mt-1"
                id="password-error"
                role="alert"
              >
                {formErrors.password}
              </div>
            )}
          </div>
          <div>
            <label
              htmlFor="passwordConfirm"
              className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="passwordConfirm"
              name="passwordConfirm"
              minLength={8}
              autoComplete="new-password"
              value={form.passwordConfirm}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded border
                ${
                  formErrors.passwordConfirm
                    ? "border-red-400 focus:ring-red-300"
                    : "border-slate-200 focus:ring-indigo-200"
                }
                focus:outline-none focus:ring-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 transition`}
              disabled={submitting}
              aria-invalid={!!formErrors.passwordConfirm}
              aria-describedby={formErrors.passwordConfirm && "passwordConfirm-error"}
              required
            />
            {formErrors.passwordConfirm && (
              <div
                className="text-xs text-red-500 mt-1"
                id="passwordConfirm-error"
                role="alert"
              >
                {formErrors.passwordConfirm}
              </div>
            )}
          </div>
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="agree"
              name="agree"
              checked={form.agree}
              onChange={handleChange}
              disabled={submitting}
              className={`w-4 h-4 accent-indigo-600 border border-slate-200 dark:border-slate-700 ${
                formErrors.agree ? "ring-2 ring-red-400" : ""
              }`}
              aria-invalid={!!formErrors.agree}
              aria-describedby={formErrors.agree && "agree-error"}
              required
            />
            <label htmlFor="agree" className="text-xs text-gray-700 dark:text-gray-300 ml-2 select-none">
              I agree to the{" "}
              <a
                className="underline hover:text-indigo-600"
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>{" "}
              and{" "}
              <a
                className="underline hover:text-indigo-600"
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Service
              </a>
              .
            </label>
          </div>
          {formErrors.agree && (
            <div
              className="text-xs text-red-500 mt-1"
              id="agree-error"
              role="alert"
            >
              {formErrors.agree}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-2 rounded font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow transition 
              ${submitting && "opacity-60 pointer-events-none"}`}
          >
            {submitting ? "Creating..." : "Register"}
          </button>
          {registerError && (
            <div className="text-xs text-red-500 bg-red-100 rounded p-2 mt-2" role="alert">
              {registerError}
            </div>
          )}
          {registerSuccess && (
            <div className="text-xs text-green-600 bg-green-100 rounded p-2 mt-2" role="status">
              Registration successful! Redirecting to your dashboard…
            </div>
          )}
        </form>

        {/* Or continue with social auth */}
        <div className="mt-7">
          <div className="flex items-center my-2">
            <div className="flex-1 border-t border-slate-200 dark:border-slate-700"></div>
            <span className="mx-3 text-xs text-slate-400">or</span>
            <div className="flex-1 border-t border-slate-200 dark:border-slate-700"></div>
          </div>
          <SocialAuth disabled={submitting} />
        </div>
        <div className="mt-6 text-xs text-gray-600 dark:text-gray-400 text-center">
          Already have an account?{" "}
          <Link
            to="/login"
            className="underline font-semibold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900"
          >
            Sign In
          </Link>
        </div>
        <div className="mt-4 text-center text-[11px] text-gray-400 dark:text-slate-500">
          By registering, you agree to our{" "}
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

// SocialAuth Component (for production, extracted for clarity)
import SocialAuth from "../components/auth/SocialAuth";

export default Register;

