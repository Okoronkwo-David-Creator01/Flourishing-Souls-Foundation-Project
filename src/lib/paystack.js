/**
 * Paystack Utility Library (Production-Ready, Real-Time)
 * Comprehensive, robust functions for Paystack workflows with full security and real API calls.
 *
 * Features:
 *  - Initialize transactions (client or server)
 *  - Verify transactions (server only—never expose secret!)
 *  - Inline payment UI integration
 *  - Webhook signature verification (strict backend usage)
 *  - All functions throw on error and avoid all simulations!
 *
 * ENV required:
 *   - PAYSTACK_SECRET_KEY      // Server-side only! Never expose to frontend
 *   - PAYSTACK_PUBLIC_KEY      // Safe for frontend (inline payment)
 *   - VITE_PAYSTACK_PUBLIC_KEY // (Vite/React frontends)
 *
 * Docs:
 *   https://paystack.com/docs/api/
 *   https://paystack.com/docs/payments/checkout/
 *
 * WARNING: Do not call any function using your secret key from client-side code.
 * Never store or log card details, and comply with all relevant security standards.
 */

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

/**
 * Get Paystack public key for client-side Inline widget usage.
 * Tries both Node.js & Vite style envs for full cross-env compatibility.
 * @returns {string}
 */
export function getPaystackPublicKey() {
  // Try Node.js env first, then fallback to Vite/React env
  if (typeof process !== 'undefined' && process.env && process.env.PAYSTACK_PUBLIC_KEY) {
    return process.env.PAYSTACK_PUBLIC_KEY;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_PAYSTACK_PUBLIC_KEY) {
    return import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  }
  throw new Error('Paystack public key is not set in environment variables');
}

/**
 * Start a Paystack transaction via the API to obtain reference and payment URL (server-side).
 * @param {Object} opts
 * @param {string} opts.email - User email (required)
 * @param {number} opts.amount - Amount in NGN (not kobo! Will be converted)
 * @param {string=} opts.callback_url - Redirect after payment success/failure
 * @param {Object=} opts.metadata - Custom data (sent to Paystack, e.g. userId, campaign)
 * @returns {Promise<{reference: string, authorization_url: string, access_code: string}>}
 */
export async function initializeTransaction({ email, amount, callback_url, metadata }) {
  let secretKey = null;
  if (typeof process !== 'undefined' && process.env && process.env.PAYSTACK_SECRET_KEY) {
    secretKey = process.env.PAYSTACK_SECRET_KEY;
  }
  // Never allow this to run if secret is not present
  if (!secretKey) throw new Error('Paystack secret key not set (server env)');
  if (!email || !amount) throw new Error('Missing email or amount for transaction');

  // Paystack expects amount in kobo
  const reqBody = {
    email,
    amount: Math.round(Number(amount) * 100), // in kobo
    callback_url,
    metadata,
  };
  Object.keys(reqBody).forEach(
    (key) => reqBody[key] === undefined && delete reqBody[key]
  );

  const resp = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reqBody),
  });

  if (!resp.ok) {
    let errText = await resp.text();
    throw new Error(`Paystack API request failed (${resp.status}): ${errText}`);
  }

  const result = await resp.json();
  if (!result.status) {
    throw new Error(result.message || 'Failed to initialize Paystack transaction');
  }
  return result.data;
}

/**
 * Verify a completed Paystack transaction by reference (server-side only).
 * Only invoke using secret key (e.g., backend API, server functions).
 * @param {string} reference
 * @returns {Promise<Object>} Full Paystack transaction object
 */
export async function verifyTransaction(reference) {
  let secretKey = null;
  if (typeof process !== 'undefined' && process.env && process.env.PAYSTACK_SECRET_KEY) {
    secretKey = process.env.PAYSTACK_SECRET_KEY;
  }
  if (!secretKey) throw new Error('Paystack secret key not set (server env)');
  if (!reference) throw new Error('Missing Paystack reference');

  const resp = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!resp.ok) {
    let errText = await resp.text();
    throw new Error(`Paystack API verification failed (${resp.status}): ${errText}`);
  }

  const result = await resp.json();
  if (!result.status) {
    throw new Error(result.message || 'Failed to verify Paystack transaction');
  }
  return result.data;
}

/**
 * CLIENT: Open the Paystack Inline payment popup.
 * For best UX, use the official @paystack/inline-js or react-paystack if possible.
 * This helper is for advanced/manual script usage in secure client React apps only.
 * @param {Object} opts
 * @param {string} opts.key - Paystack public key
 * @param {string} opts.email
 * @param {number} opts.amount - NGN (converted to kobo)
 * @param {string=} opts.reference - (optional) Custom reference string
 * @param {Object=} opts.metadata - Custom metadata (object)
 * @param {function} opts.onSuccess - Called with Paystack response on success
 * @param {function} opts.onClose - Called when dialog closes/cancelled
 */
export function payWithPaystackInline({
  key,
  email,
  amount,
  reference,
  metadata,
  onSuccess,
  onClose,
}) {
  if (typeof window === 'undefined' || !window.PaystackPop) {
    throw new Error(
      'Paystack popup script not loaded. Please include https://js.paystack.co/v1/inline.js in your index.html.'
    );
  }
  if (!key || !email || !amount || typeof onSuccess !== 'function') {
    throw new Error('Missing required payment params (key, email, amount, onSuccess)');
  }

  const handler = window.PaystackPop.setup({
    key,
    email,
    amount: Math.round(Number(amount) * 100), // convert to kobo
    reference,
    metadata,
    callback: (response) => {
      onSuccess(response);
    },
    onClose: () => {
      if (typeof onClose === 'function') onClose();
    },
  });
  handler.openIframe();
}

/**
 * Validate the format of a Paystack reference string.
 * @param {string} reference
 * @returns {boolean}
 */
export function isValidPaystackReference(reference) {
  if (typeof reference !== 'string') return false;
  // Paystack references are typically long (alphanumeric), length >= 10 is a safe check
  return /^[\w\-]+$/.test(reference) && reference.length >= 10;
}

/**
 * Securely verify Paystack webhook signatures (never use on client!).
 * @param {string|Buffer} rawBody - The exact webhook body as string/buffer (no parsing!)
 * @param {string} providedSignature - The value from x-paystack-signature header
 * @param {string} secretKey - Your Paystack secret (must be server-side)
 * @returns {boolean} True if valid, else false
 */
export function verifyPaystackWebhookSignature(rawBody, providedSignature, secretKey) {
  // Strictly require Node.js crypto (never possible on browsers)
  let crypto = null;
  if (typeof require === 'function') {
    crypto = require('crypto');
  } else if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    // Browser crypto is not suitable for HMAC SHA512 using secret key
    throw new Error('Webhook verification is only supported in Node.js environments');
  }
  if (!crypto) throw new Error('Crypto module not available');
  if (!rawBody || !providedSignature || !secretKey) throw new Error('Invalid arguments to webhook verification');

  let bodyToUse = rawBody;
  if (typeof rawBody !== 'string' && !(rawBody instanceof Buffer)) {
    // Try to convert e.g., from Object (shouldn't happen in real webhook)
    bodyToUse = Buffer.from(JSON.stringify(rawBody));
  }
  const hmac = crypto.createHmac('sha512', secretKey);
  hmac.update(typeof bodyToUse === 'string' ? bodyToUse : bodyToUse.toString());
  const digest = hmac.digest('hex');
  return digest === providedSignature;
}
