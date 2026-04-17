import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import Button from "../common/Button";
import Notification from "../common/Notification";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({ type: "", message: "" });

  // Handle submit event
  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotification({ type: "", message: "" });

    // Basic validation
    if (!email) {
      setNotification({
        type: "error",
        message: "Please enter your email address.",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Supabase: send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setNotification({
          type: "error",
          message: error.message || "Failed to send password reset email.",
        });
      } else {
        setNotification({
          type: "success",
          message:
            "If this email is registered, a password reset link has been sent. Please check your inbox.",
        });
      }
    } catch {
      setNotification({
        type: "error",
        message: "An unexpected error occurred. Please try again later.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 px-6 py-8 bg-white dark:bg-gray-900 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-1 text-primary text-center">
        Forgot Password
      </h2>
      <p className="mb-6 text-center text-gray-600 dark:text-gray-300">
        Enter your email address to receive a password reset link.
      </p>
      {notification.message && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification({ type: "", message: "" })}
        />
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="forgot-email"
            className="block text-sm font-medium mb-1"
          >
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="forgot-email"
            name="email"
            type="email"
            className="form-input w-full"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            disabled={submitting}
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          loading={submitting}
          disabled={submitting}
        >
          Send Reset Link
        </Button>
      </form>
      <div className="mt-6 text-center">
        <a
          href="/login"
          className="text-primary hover:underline text-sm transition-colors"
        >
          Back to Login
        </a>
      </div>
    </div>
  );
};

export default ForgotPassword;