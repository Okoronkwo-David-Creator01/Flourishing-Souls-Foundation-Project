import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import { supabase } from "../../lib/supabase";

/**
 * Helper: Validate volunteer form fields
 */
function validateVolunteerFields({ name, email, phone, availability, skills, motivation }) {
  const errors = {};
  if (!name?.trim()) errors.name = "Full Name is required.";
  if (!email?.trim()) errors.email = "Email is required.";
  else if (
    !/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(email.trim())
  )
    errors.email = "Provide a valid email address.";
  if (!phone?.trim()) errors.phone = "Phone number is required.";
  else if (!/^\+?\d{7,}$/.test(phone.trim()))
    errors.phone = "Provide a valid phone number.";
  if (!availability?.trim()) errors.availability = "Availability is required.";
  if (!skills?.trim()) errors.skills = "Please list at least one skill.";
  if (!motivation?.trim()) errors.motivation = "Tell us why you want to volunteer.";
  return errors;
}

/**
 * VolunteerForm Component
 * Handles volunteer application submissions with real-time data to backend (Supabase)
 */
const VolunteerForm = ({
  onSuccess,
  onError,
  className = "",
  style = {},
  hideAfterSubmit = true,
}) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    availability: "",
    skills: "",
    motivation: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [volunteerId, setVolunteerId] = useState(null);

  const supabaseClient = supabase;
  const formRef = useRef();

  // Handle field change
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmissionError("");
    const newErrors = validateVolunteerFields(form);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }
    setSubmitting(true);
    try {
      // Insert into the `volunteers` table in Supabase
      // Table fields: name, email, phone, availability, skills, motivation, status
      const { data, error } = await supabaseClient
        .from("volunteers")
        .insert([
          {
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            availability: form.availability.trim(),
            skills: form.skills.trim(),
            motivation: form.motivation.trim(),
            status: "pending",
          },
        ])
        .select();

      if (error) {
        setSubmissionError(
          error.message ||
            "Submission failed. Please try again or contact us."
        );
        if (onError) onError(error);
      } else {
        setSubmitted(true);
        setVolunteerId(data?.[0]?.id || null);
        if (onSuccess) onSuccess(data?.[0]);
        if (hideAfterSubmit) setTimeout(() => setSubmitted(false), 7000);
        setForm({
          name: "",
          email: "",
          phone: "",
          availability: "",
          skills: "",
          motivation: "",
        });
        setErrors({});
      }
    } catch (err) {
      setSubmissionError(
        err.message || "Submission failed. Please try again."
      );
      if (onError) onError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={
        "max-w-xl w-full mx-auto px-4 py-8 rounded-md shadow bg-white dark:bg-gray-900 " +
        className
      }
      style={style}
    >
      {submitted && !submissionError ? (
        <div className="rounded bg-green-50 border border-green-300 p-4 mb-5 text-center">
          <div className="text-green-700 text-lg font-semibold mb-2">
            Thank you for applying to volunteer!
          </div>
          <div className="text-green-800">
            We have received your application{volunteerId ? ` (ID: ${volunteerId})` : ""}.<br />
            Our team will review your information and contact you soon.
          </div>
        </div>
      ) : (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          aria-label="Volunteer Application Form"
          noValidate
        >
          <h2 className="text-2xl font-bold mb-4 text-primary-700 dark:text-primary-300">
            Volunteer Application
          </h2>
          <div className="mb-5">
            <label
              htmlFor="volunteer-name"
              className="block font-medium text-gray-800 dark:text-gray-200 mb-1"
            >
              Full Name <span className="text-red-500"> *</span>
            </label>
            <input
              id="volunteer-name"
              name="name"
              type="text"
              className={
                "w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-primary-500 transition " +
                (errors.name ? "border-red-400" : "border-gray-300")
              }
              value={form.name}
              onChange={handleChange}
              disabled={submitting}
              required
              autoComplete="name"
            />
            {errors.name && (
              <div className="text-xs text-red-500 mt-1">{errors.name}</div>
            )}
          </div>
          <div className="mb-5">
            <label
              htmlFor="volunteer-email"
              className="block font-medium text-gray-800 dark:text-gray-200 mb-1"
            >
              Email <span className="text-red-500"> *</span>
            </label>
            <input
              id="volunteer-email"
              name="email"
              type="email"
              className={
                "w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-primary-500 transition " +
                (errors.email ? "border-red-400" : "border-gray-300")
              }
              value={form.email}
              onChange={handleChange}
              disabled={submitting}
              required
              autoComplete="email"
            />
            {errors.email && (
              <div className="text-xs text-red-500 mt-1">{errors.email}</div>
            )}
          </div>
          <div className="mb-5">
            <label
              htmlFor="volunteer-phone"
              className="block font-medium text-gray-800 dark:text-gray-200 mb-1"
            >
              Phone Number <span className="text-red-500"> *</span>
            </label>
            <input
              id="volunteer-phone"
              name="phone"
              type="tel"
              className={
                "w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-primary-500 transition " +
                (errors.phone ? "border-red-400" : "border-gray-300")
              }
              value={form.phone}
              onChange={handleChange}
              disabled={submitting}
              required
              autoComplete="tel"
              placeholder="+234..."
            />
            {errors.phone && (
              <div className="text-xs text-red-500 mt-1">{errors.phone}</div>
            )}
          </div>
          <div className="mb-5">
            <label
              htmlFor="volunteer-availability"
              className="block font-medium text-gray-800 dark:text-gray-200 mb-1"
            >
              Availability <span className="text-red-500"> *</span>
            </label>
            <input
              id="volunteer-availability"
              name="availability"
              type="text"
              className={
                "w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-primary-500 transition " +
                (errors.availability ? "border-red-400" : "border-gray-300")
              }
              value={form.availability}
              onChange={handleChange}
              disabled={submitting}
              required
              placeholder="e.g., Weekdays, Weekends, 5hrs/week"
            />
            {errors.availability && (
              <div className="text-xs text-red-500 mt-1">{errors.availability}</div>
            )}
          </div>
          <div className="mb-5">
            <label
              htmlFor="volunteer-skills"
              className="block font-medium text-gray-800 dark:text-gray-200 mb-1"
            >
              Skills & Experience <span className="text-red-500"> *</span>
            </label>
            <textarea
              id="volunteer-skills"
              name="skills"
              rows={3}
              className={
                "w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-primary-500 transition resize-vertical " +
                (errors.skills ? "border-red-400" : "border-gray-300")
              }
              value={form.skills}
              onChange={handleChange}
              disabled={submitting}
              required
              placeholder="What skills or experience can you offer?"
            />
            {errors.skills && (
              <div className="text-xs text-red-500 mt-1">{errors.skills}</div>
            )}
          </div>
          <div className="mb-5">
            <label
              htmlFor="volunteer-motivation"
              className="block font-medium text-gray-800 dark:text-gray-200 mb-1"
            >
              Why do you want to volunteer? <span className="text-red-500"> *</span>
            </label>
            <textarea
              id="volunteer-motivation"
              name="motivation"
              rows={3}
              className={
                "w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-primary-500 transition resize-vertical " +
                (errors.motivation ? "border-red-400" : "border-gray-300")
              }
              value={form.motivation}
              onChange={handleChange}
              disabled={submitting}
              required
              placeholder="Share your motivation for volunteering with us"
            />
            {errors.motivation && (
              <div className="text-xs text-red-500 mt-1">{errors.motivation}</div>
            )}
          </div>
          {submissionError && (
            <div className="mb-3 text-red-600 bg-red-50 border border-red-300 rounded p-2 text-xs">
              {submissionError}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 px-4 rounded bg-primary-600 hover:bg-primary-700 text-white font-semibold transition focus:ring-2 focus:ring-primary-500 disabled:opacity-70"
          >
            {submitting ? (
              <span>
                <span className="inline-block animate-spin mr-2">&#9696;</span>
                Submitting...
              </span>
            ) : (
              "Submit Application"
            )}
          </button>
        </form>
      )}
    </div>
  );
};

VolunteerForm.propTypes = {
  /* Custom Supabase URL if not using global default */
  supabaseUrl: PropTypes.string,
  /* Custom Supabase Key if not using global default */
  supabaseKey: PropTypes.string,
  /* Success callback: receives new volunteer data */
  onSuccess: PropTypes.func,
  /* Error callback: receives error */
  onError: PropTypes.func,
  /* CSS className override */
  className: PropTypes.string,
  /* Optional inline styles */
  style: PropTypes.object,
  /* Hide form after submit (show thank-you only) */
  hideAfterSubmit: PropTypes.bool,
};

export default VolunteerForm;
