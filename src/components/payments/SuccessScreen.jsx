import React from "react";
import PropTypes from "prop-types";

/**
 * SuccessScreen component
 * Shows a celebratory "Donation Successful!" message after payment.
 * Production ready: clear messaging, accessibility, optional details, close action.
 *
 * Props:
 *   show: (bool) - Whether the modal/screen is visible
 *   onClose: (func) - Handler when dismissed (required)
 *   amount: (number|string) - Amount donated (optional, for confirmation)
 *   receipt: (object) - Receipt information, e.g. { name, reference, email, phone, created_at } (optional)
 *   organization: (string) - Optional override for displayed org name
 *   className: (string) - Extra classNames for styling
 */
const SuccessScreen = ({
  show = false,
  onClose,
  amount,
  receipt,
  organization,
  className = "",
}) => {
  // Safe fallback for org displayed
  const orgName =
    organization || receipt?.organization || "Flourishing Souls Foundation";
  const donorName =
    receipt?.name || (typeof receipt?.email === "string" ? receipt.email.split("@")[0] : "") || "";

  if (!show) return null;

  return (
    <div
      className={
        "fixed z-50 inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all" +
        (show ? "" : " pointer-events-none opacity-0") +
        " " +
        className
      }
      role="dialog"
      aria-modal="true"
      aria-labelledby="donation-success-title"
      tabIndex={-1}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full px-8 py-7 text-center relative animate-fade-in">
        {/* Close button */}
        <button
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          onClick={onClose}
          aria-label="Close"
          tabIndex={0}
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none">
            <path
              d="M6 6l8 8M14 6l-8 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Celebration Icon */}
        <div className="flex justify-center mb-4">
          <span className="inline-block bg-green-100 text-green-600 rounded-full p-4 shadow-md">
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="white"
              />
              <path
                d="M7 13.5l3 3 7-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </span>
        </div>

        {/* Heading */}
        <h2
          className="text-2xl font-bold text-primary-700 dark:text-primary-400 mb-2"
          id="donation-success-title"
        >
          Thank You, {donorName ? donorName : "Donor"}!
        </h2>
        <div className="text-gray-700 dark:text-gray-200 font-medium text-lg">
          Your donation was successful.
        </div>

        {/* Amount */}
        {amount ? (
          <div className="mt-2 text-primary-600 dark:text-primary-300 font-semibold text-xl">
            ₦{Number(amount).toLocaleString()}
          </div>
        ) : null}

        {/** Optional receipt details */}
        {receipt && (
          <div className="mt-3 text-sm text-gray-500 dark:text-gray-300">
            <div>
              <span className="font-medium">Reference:</span>{" "}
              {receipt.reference}
            </div>
            {receipt.email && (
              <div>
                <span className="font-medium">Email:</span> {receipt.email}
              </div>
            )}
            {receipt.phone && (
              <div>
                <span className="font-medium">Phone:</span> {receipt.phone}
              </div>
            )}
            {receipt.created_at && (
              <div>
                <span className="font-medium">Date:</span>{" "}
                {new Date(receipt.created_at).toLocaleString()}
              </div>
            )}
          </div>
        )}

        <div className="my-4 text-gray-600 dark:text-gray-400 text-sm">
          We appreciate your generosity. Your donation will help us continue our mission at{" "}
          <span className="font-semibold">{orgName}</span>.
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 px-6 py-2 rounded bg-primary-600 hover:bg-primary-700 text-white font-semibold transition focus:ring-2 focus:ring-primary-500"
          autoFocus
        >
          Close
        </button>
      </div>
    </div>
  );
};

SuccessScreen.propTypes = {
  show: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  receipt: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    reference: PropTypes.string,
    created_at: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    organization: PropTypes.string,
  }),
  organization: PropTypes.string,
  className: PropTypes.string,
};

export default SuccessScreen;

