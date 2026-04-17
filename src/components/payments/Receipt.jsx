import React from "react";
import PropTypes from "prop-types";

/**
 * Receipt - Display a finalized, real donation receipt.
 * Shows user-facing transaction details for accountability, download, or printing.
 */
const Receipt = ({
  receipt,
  onClose,
  show = true,
  organization = "Flourishing Souls Foundation",
}) => {
  if (!show || !receipt) return null;

  // Fallback safely if some fields are missing
  const {
    id,
    amount,
    name,
    email,
    phone,
    reference,
    status,
    created_at,
    organization: receiptOrg,
    // Any extra custom metadata (e.g. anonymous, etc.)
  } = receipt;

  // Convert UNIX or ISO date (backend-agnostic)
  const getReadableDate = (dt) => {
    if (!dt) return "";
    try {
      const dateObj = typeof dt === "string" ? new Date(dt) : new Date(Number(dt));
      return dateObj.toLocaleString("en-NG", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return String(dt);
    }
  };

  // Print handler
  const handlePrint = () => {
    // Open printable window with just the receipt
    const printWindow = window.open("", "PRINT", "height=600,width=450");
    if (printWindow) {
      printWindow.document.write(
        `
        <html>
          <head>
            <title>Donation Receipt</title>
            <link rel="stylesheet" href="/main.css" />
            <style>
              body { font-family: Arial,sans-serif; padding:2em;background:#FFF;}
              .receipt {max-width:400px;margin:auto;}
              .header {display:flex;align-items:center;gap:1em;}
              .logo {height:40px;margin-right:12px;}
              .thank-you {color:#06b6d4;font-weight:bold;}
              table {width:100%;margin-top:1em;margin-bottom:1em;}
              td {padding: 0.3em 0;}
              .info {color:#555;font-size:0.96em;}
              .amount {font-size:1.25em;color:#16a34a;font-weight:600;}
              .ref {font-size:0.95em;color:#6366f1;}
              .footer {text-align:center;color:#575757;font-size:0.92em;}
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="header">
                <img src="/images/logo.png" alt="logo" class="logo" />
                <div>
                  <div style="font-size:1.09em;font-weight:600">${organization || receiptOrg || ""}</div>
                  <div style="font-size:0.92em;color:#94a3b8">Official Donation Receipt</div>
                </div>
              </div>
              <hr style="margin:1em 0;" />
              <div style="margin-bottom:1em;">
                <div class="thank-you">Thank you for your generosity!</div>
                <div class="info">We gratefully confirm your donation as detailed below.</div>
              </div>
              <table>
                <tbody>
                  <tr><td>Donor Name</td><td><strong>${name || "Anonymous Donor"}</strong></td></tr>
                  <tr><td>Email</td><td>${email || "-"}</td></tr>
                  <tr><td>Phone</td><td>${phone || "-"}</td></tr>
                  <tr><td>Date</td><td>${getReadableDate(created_at)}</td></tr>
                  <tr><td>Status</td><td>${status || "Success"}</td></tr>
                  <tr><td>Donation Amount</td><td class="amount">₦${Number(amount).toLocaleString()}</td></tr>
                  <tr><td>Reference ID</td><td class="ref">${reference}</td></tr>
                  ${id ? `<tr><td>Receipt ID</td><td>${id}</td></tr>` : ""}
                </tbody>
              </table>
              <div class="footer">
                A receipt has been generated for your records. <br/>
                For all queries, visit our website or contact support.<br/><br/>
                <span style="color:#0d9488">
                  ${organization || receiptOrg || ""}
                </span>
              </div>
            </div>
            <script>
              setTimeout(() => { window.print(); setTimeout(()=>window.close(), 750) }, 80);
            </script>
          </body>
        </html>
        `
      );
      printWindow.document.close();
      printWindow.focus();
    }
  };

  // Optionally export as PDF: leave for future enhancement with html2pdf.js/print-to-pdf
  // For now, the Print dialog supports "Save as PDF" in modern browsers.

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 p-6 relative z-50">
      {/* Ribbon or badge */}
      <div className="absolute top-0 right-0 bg-green-500 text-white text-[11px] px-3 py-1 rounded-bl-lg font-bold shadow">
        Official Receipt
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <img
          src="/images/logo.png"
          alt="Flourishing Souls Foundation Logo"
          className="h-10 w-10 object-contain rounded"
          loading="lazy"
        />
        <div>
          <h3 className="font-semibold text-lg leading-tight text-primary-600 dark:text-primary-400">
            {organization || receiptOrg || "Donation"}
          </h3>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Donation Receipt
          </div>
        </div>
      </div>

      <hr className="my-2 border-gray-200 dark:border-gray-700" />

      <div className="mb-2">
        <div className="text-primary-600 font-bold text-base mb-1">
          Thank you for your donation!
        </div>
        <span className="text-xs text-gray-600 dark:text-gray-400">
          Below is a summary of your transaction:
        </span>
      </div>

      <table className="w-full text-sm mb-3">
        <tbody>
          <tr>
            <td className="py-1 text-gray-600">Name</td>
            <td className="py-1 text-right font-medium">
              {name || <em>Anonymous Donor</em>}
            </td>
          </tr>
          <tr>
            <td className="py-1 text-gray-600">Email</td>
            <td className="py-1 text-right">{email || <span>-</span>}</td>
          </tr>
          <tr>
            <td className="py-1 text-gray-600">Phone</td>
            <td className="py-1 text-right">{phone || <span>-</span>}</td>
          </tr>
          <tr>
            <td className="py-1 text-gray-600">Date</td>
            <td className="py-1 text-right">
              {getReadableDate(created_at)}
            </td>
          </tr>
          <tr>
            <td className="py-1 text-gray-600">Status</td>
            <td className="py-1 text-right">
              <span
                className={
                  status === "success" || status === "Success"
                    ? "text-green-600 dark:text-green-400 font-semibold"
                    : "text-red-600 dark:text-red-400"
                }
              >
                {status || "Success"}
              </span>
            </td>
          </tr>
          <tr>
            <td className="py-1 text-gray-600">Amount</td>
            <td className="py-1 text-right text-lg text-green-700 dark:text-green-400 font-bold">
              ₦{Number(amount).toLocaleString()}
            </td>
          </tr>
          <tr>
            <td className="py-1 text-gray-600">Reference</td>
            <td className="py-1 text-right text-indigo-500 dark:text-indigo-400 break-all font-mono">
              {reference}
            </td>
          </tr>
          {id && (
            <tr>
              <td className="py-1 text-gray-600">Receipt ID</td>
              <td className="py-1 text-right text-xs text-gray-500 dark:text-gray-400">
                {id}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="my-4 text-xs text-slate-500 text-center">
        <span>
          This is an official acknowledgment of your donation. Please keep this receipt for your records.
        </span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-3 mt-4">
        <button
          type="button"
          onClick={handlePrint}
          className="w-full md:w-auto px-4 py-2 rounded bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow transition focus:ring-2 focus:ring-primary-400"
        >
          Print / Save as PDF
        </button>
        <button
          type="button"
          className="w-full md:w-auto px-4 py-2 rounded border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-100 font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition"
          onClick={onClose}
        >
          Close
        </button>
      </div>
      <div className="mt-5 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} {organization || receiptOrg || "Flourishing Souls Foundation"}. All rights reserved.
      </div>
    </div>
  );
};

Receipt.propTypes = {
  /**
   * The receipt object: must contain main fields used above.
   * Expected: { id, amount, name, email, phone, reference, status, created_at, organization }
   */
  receipt: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    reference: PropTypes.string.isRequired,
    status: PropTypes.string,
    created_at: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    organization: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  show: PropTypes.bool,
  organization: PropTypes.string,
};

export default Receipt;

