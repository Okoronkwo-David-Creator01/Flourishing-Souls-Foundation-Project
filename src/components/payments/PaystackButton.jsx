import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";

// Util function to load the Paystack inline JS once per page (singleton pattern)
function loadPaystackScript() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("No window"));
    if (window.PaystackPop && typeof window.PaystackPop.setup === "function") return resolve();

    // Check if script is already in the DOM
    const existingScript = document.getElementById("paystack-script");
    if (existingScript) {
      existingScript.addEventListener("load", resolve);
      existingScript.addEventListener("error", () =>
        reject(new Error("Failed to load Paystack script"))
      );
      return;
    }

    // Otherwise, inject the script
    const script = document.createElement("script");
    script.id = "paystack-script";
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Paystack script"));

    document.body.appendChild(script);
  });
}

/**
 * PaystackButton
 * Advanced payment wrapper for Paystack Inline to use in React projects.
 *
 * Props:
 *   - publicKey (required): Your Paystack public key.
 *   - amount (required): Transaction amount in Naira (₦, NOT kobo. Will be converted).
 *   - email (required): Customer's email.
 *   - name: Customer's full name.
 *   - phone: Customer's phone number.
 *   - reference: Transaction reference (string, optional - generated if not provided).
 *   - metadata: Any additional info to pass to Paystack metadata.
 *   - currency: Default "NGN"
 *   - onSuccess: callback(paystackResponse) after successful payment.
 *   - onClose: callback() when the Paystack dialog is closed.
 *   - onFailure: callback(errorObject) when a problem occurs with Paystack setup/init.
 *   - disabled: Boolean - disables the button.
 *   - children: Button content
 *   - className: Button styling classes
 *   - style: Button inline styles
 *   - [rest]: Any other attributes for the button element (aria, etc)
 */
const PaystackButton = ({
  publicKey,
  amount,
  email,
  name,
  phone,
  reference,
  metadata = {},
  currency = "NGN",
  onSuccess,
  onClose,
  onFailure,
  disabled,
  children,
  className,
  style,
  ...rest
}) => {
  const loadingRef = useRef(false);
  const handlePay = async () => {
    if (loadingRef.current) return; // Prevent multiple inits
    loadingRef.current = true;
    try {
      // Load paystack script
      await loadPaystackScript();

      if (!publicKey) throw new Error("Paystack publicKey is required");
      if (!amount || isNaN(amount) || Number(amount) <= 0)
        throw new Error("A valid amount is required");
      if (!email || !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email))
        throw new Error("A valid email is required");

      // Generate reference if not provided
      const txRef =
        reference ||
        `FSF-${Date.now()}-${Math.ceil(Math.random() * 1e8).toString(16)}`;

      // Setup metadata
      const metaPayload = {
        ...metadata,
        name,
        phone,
      };

      const paystackConfig = {
        key: publicKey,
        email: email,
        amount: Number(amount) * 100, // Paystack expects amount in kobo
        currency,
        ref: txRef,
        metadata: metaPayload,
        callback: (response) => {
          /*
            response:
            {
              status: "success",
              reference: "transaction_ref",
              ...otherFields
            }
          */
          if (typeof onSuccess === "function") {
            onSuccess({
              reference: response.reference,
              status: response.status,
              message: response.message,
              transaction: response.transaction,
              ...response
            });
          }
        },
        onClose: () => {
          if (typeof onClose === "function") {
            onClose();
          }
        },
      };

      // Open the Paystack payment modal
      window.PaystackPop && window.PaystackPop.setup(paystackConfig).openIframe();
    } catch (err) {
      if (typeof onFailure === "function") {
        onFailure(err);
      } else {
        // eslint-disable-next-line no-console
        console.error("[PaystackButton]", err);
        if (window && window.alert) {
          window.alert(
            "Could not initiate payment. Please check your details and try again."
          );
        }
      }
    } finally {
      loadingRef.current = false;
    }
  };
  
  // Optionally pre-load Paystack script
  useEffect(() => {
    loadPaystackScript().catch(() => {});
  }, []);

  return (
    <button
      type="button"
      className={
        className
          ? className
          : // Default styling
            "w-full py-2 px-6 rounded bg-primary-600 text-white font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition disabled:opacity-60"
      }
      style={style}
      onClick={handlePay}
      disabled={disabled}
      {...rest}
    >
      {children || (
        <span>
          Donate&nbsp;
          <span className="sr-only">(via Paystack)</span>
        </span>
      )}
    </button>
  );
};

PaystackButton.propTypes = {
  publicKey: PropTypes.string.isRequired,
  amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  email: PropTypes.string.isRequired,
  name: PropTypes.string,
  phone: PropTypes.string,
  reference: PropTypes.string,
  metadata: PropTypes.object,
  currency: PropTypes.string,
  onSuccess: PropTypes.func,
  onClose: PropTypes.func,
  onFailure: PropTypes.func,
  disabled: PropTypes.bool,
  children: PropTypes.node,
  className: PropTypes.string,
  style: PropTypes.object,
};

export { PaystackButton };
export default PaystackButton;