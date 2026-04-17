import React, { useState } from "react";
import PropTypes from "prop-types";
import { PaystackButton } from "./PaystackButton";
import { createDonation } from "../../services/paystackServices";
import Notification from "../common/Notification";
import Receipt from "./Receipt";
import SuccessScreen from "./SuccessScreen";

const DONATION_MIN = 100; // Minimum amount in Naira

const DonationForm = ({
  publicKey,
  organization,
  presetAmounts = [1000, 2500, 5000, 10000],
  onSuccess,
  onError,
}) => {
  const [amount, setAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [processing, setProcessing] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [receiptInfo, setReceiptInfo] = useState(null);
  const [notification, setNotification] = useState(null);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = "Your name is required.";
    if (!email.trim()) {
      errs.email = "Email is required.";
    } else if (
      !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email.trim())
    ) {
      errs.email = "Please provide a valid email address.";
    }
    if (!amount || Number(amount) < DONATION_MIN) {
      errs.amount = `Minimum donation is ₦${DONATION_MIN}.`;
    }
    if (phone && !/^\d{7,15}$/.test(phone.replace(/\D/g, ""))) {
      errs.phone = "Please provide a valid phone number.";
    }
    setErrors(errs);
    return Object.keys(errs).length < 1;
  };

  const onAmountChange = (val) => {
    setAmount(val);
    setDisplayAmount(Number(val).toLocaleString());
  };

  const handlePaystackSuccess = async (response) => {
    // response: {reference, status} from Paystack
    setProcessing(true);
    try {
      const donation = await createDonation({
        name,
        email,
        phone,
        amount: Number(amount),
        reference: response.reference,
        status: response.status,
        organization,
      });
      setReceiptInfo(donation);
      setSuccessOpen(true);
      setNotification({
        type: "success",
        message: "Donation successful! Thank you for your support.",
      });
      if (onSuccess) onSuccess(donation);
      setAmount("");
      setName("");
      setEmail("");
      setPhone("");
      setDisplayAmount("");
    } catch (e) {
      setNotification({
        type: "error",
        message: e?.message || "We could not process your donation. Please contact support.",
      });
      if (onError) onError(e);
    } finally {
      setProcessing(false);
    }
  };

  const handlePaystackClose = () => {
    setProcessing(false);
    setNotification({
      type: "warning",
      message: "Donation process was not completed.",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setNotification(null);
    if (!validate()) return;
    setProcessing(true);
    // PaystackButton triggers payment, handled via props below
    setTimeout(() => setProcessing(false), 2000);
  };

  const paystackButtonConfig = {
    email,
    amount: Number(amount) * 100, // Paystack expects in Kobo
    metadata: {
      name,
      phone,
      organization,
    },
    publicKey,
    text: processing ? "Processing..." : "Donate",
    onSuccess: handlePaystackSuccess,
    onClose: handlePaystackClose,
    className: "w-full py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded transition active:scale-95 mt-4 disabled:opacity-50",
    disabled: processing || !validate(),
  };

  return (
    <div className="max-w-lg w-full mx-auto p-6 rounded-lg bg-white shadow-sm dark:bg-slate-900/90">
      <h2 className="text-2xl font-bold mb-1 text-center text-primary-700">
        Support {organization || "Us"} with a Donation
      </h2>
      <p className="mb-4 text-gray-600 text-center dark:text-gray-300">
        Your support helps us reach more lives. Every donation counts!
      </p>
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      {successOpen && receiptInfo ? (
        <SuccessScreen
          open={successOpen}
          onClose={() => setSuccessOpen(false)}
        >
          <Receipt
            donor={receiptInfo.name}
            amount={receiptInfo.amount}
            date={receiptInfo.created_at || new Date()}
            org={organization}
            reference={receiptInfo.reference}
          />
        </SuccessScreen>
      ) : (
        <form className="grid gap-4" onSubmit={handleSubmit} autoComplete="off">
          {/* Name */}
          <div className="flex flex-col">
            <label htmlFor="donor-name" className="font-medium mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="donor-name"
              name="name"
              className={`rounded border bg-white dark:bg-gray-800 px-3 py-2 focus:ring-2 focus:ring-primary-500 transition outline-none ${
                errors.name ? "border-red-400" : "border-gray-300"
              }`}
              value={name}
              autoComplete="name"
              onChange={(e) => setName(e.target.value)}
              disabled={processing}
              required
            />
            {errors.name && (
              <span className="text-xs mt-1 text-red-500">{errors.name}</span>
            )}
          </div>
          {/* Email */}
          <div className="flex flex-col">
            <label htmlFor="donor-email" className="font-medium mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="donor-email"
              name="email"
              type="email"
              value={email}
              autoComplete="email"
              className={`rounded border bg-white dark:bg-gray-800 px-3 py-2 focus:ring-2 focus:ring-primary-500 transition outline-none ${
                errors.email ? "border-red-400" : "border-gray-300"
              }`}
              onChange={(e) => setEmail(e.target.value)}
              disabled={processing}
              required
            />
            {errors.email && (
              <span className="text-xs mt-1 text-red-500">{errors.email}</span>
            )}
          </div>
          {/* Phone */}
          <div className="flex flex-col">
            <label htmlFor="donor-phone" className="font-medium mb-1">
              Phone number
              <span className="text-xs text-gray-400 ml-1">(optional)</span>
            </label>
            <input
              id="donor-phone"
              name="phone"
              type="tel"
              value={phone}
              autoComplete="tel"
              placeholder="e.g 09012345678"
              className={`rounded border bg-white dark:bg-gray-800 px-3 py-2 focus:ring-2 focus:ring-primary-500 transition outline-none ${
                errors.phone ? "border-red-400" : "border-gray-300"
              }`}
              onChange={(e) => setPhone(e.target.value)}
              disabled={processing}
            />
            {errors.phone && (
              <span className="text-xs mt-1 text-red-500">{errors.phone}</span>
            )}
          </div>
          {/* Donation amount */}
          <div className="flex flex-col">
            <label htmlFor="donation-amount" className="font-medium mb-1">
              Amount (₦)
              <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 mb-2">
              {presetAmounts?.map((amt) => (
                <button
                  type="button"
                  key={amt}
                  className={`rounded px-2.5 py-1 text-sm font-medium border transition focus:ring-2
                    ${
                      Number(amount) === amt
                        ? "bg-primary-600 border-primary-700 text-white"
                        : "bg-white border-gray-300 dark:bg-gray-800 text-primary-700 dark:text-white"
                    }`}
                  disabled={processing}
                  onClick={() => {
                    onAmountChange(amt);
                  }}
                >
                  ₦{amt.toLocaleString()}
                </button>
              ))}
            </div>
            <input
              id="donation-amount"
              name="amount"
              type="number"
              min={DONATION_MIN}
              step={100}
              value={amount}
              placeholder={`Enter amount (min ₦${DONATION_MIN})`}
              className={`rounded border bg-white dark:bg-gray-800 px-3 py-2 focus:ring-2 focus:ring-primary-500 transition outline-none ${
                errors.amount ? "border-red-400" : "border-gray-300"
              }`}
              onChange={(e) => onAmountChange(Number(e.target.value))}
              disabled={processing}
              required
              inputMode="numeric"
              autoComplete="off"
            />
            {errors.amount && (
              <span className="text-xs mt-1 text-red-500">{errors.amount}</span>
            )}
          </div>
          {/* PaystackButton - real payment */}
          <PaystackButton {...paystackButtonConfig} />
        </form>
      )}
      <div className="mt-6 text-center text-xs text-gray-500">
        Payments securely powered by <strong>Paystack</strong>.
      </div>
    </div>
  );
};

DonationForm.propTypes = {
  publicKey: PropTypes.string.isRequired,
  organization: PropTypes.string,
  presetAmounts: PropTypes.arrayOf(PropTypes.number),
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
};

export default DonationForm;