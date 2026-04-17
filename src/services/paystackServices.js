/**
 * PaystackService - Secure production-level Paystack integration for Flourishing Souls Foundation
 * DO NOT expose Paystack secret key or sensitive methods directly to the client.
 *
 * This module is intended to be used from server-side functions, backend endpoints, or serverless functions.
 * For client-side SDK/context, only expose public key and reference/token. Keep all secret-key operations here.
 */

const PAYSTACK_BASE_URL = "https://api.paystack.co";
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Node: for backend/serverless only. Do not import 'node-fetch' on the browser.
let fetchInstance;
if (typeof fetch !== 'function') {
  fetchInstance = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
} else {
  fetchInstance = fetch;
}

/**
 * Helper to fetch from Paystack securely.
 * @param {string} path API path (starting with '/')
 * @param {object} options Fetch options (method, body, headers)
 * @returns {Promise<any>} The data or throws with error info.
 */
async function paystackRequest(path, options = {}) {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack Secret Key not set in environment variables!");
  }
  const url = PAYSTACK_BASE_URL + path;
  const headers = {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const response = await fetchInstance(url, {
    ...options,
    headers,
  });
  const data = await response.json();
  if (!response.ok || data.status === false) {
    throw new Error(data.message || data.error || "Unknown Paystack Error");
  }
  return data;
}

/**
 * Initialize a Payment Transaction (donations, etc.)
 * @param {object} params {email, amount, callback_url?, metadata?}
 * @returns {Promise<object>} Paystack "data" object, includes payment reference and auth url
 */
async function initializeTransaction({
  email,
  amount,
  callback_url,
  metadata
}) {
  if (!email || !amount) throw new Error("Email and amount required");
  const body = {
    email,
    amount: parseInt(amount, 10), // Amount in kobo (Naira * 100)
    ...(callback_url ? { callback_url } : {}),
    ...(metadata ? { metadata } : {})
  };
  const res = await paystackRequest('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify(body)
  });
  return res.data;
}

/**
 * Verify a Transaction
 * @param {string} reference The transaction reference
 * @returns {Promise<object>} Transaction details from Paystack
 */
async function verifyTransaction(reference) {
  if (!reference) throw new Error("Transaction reference required");
  const res = await paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`, {
    method: 'GET'
  });
  return res.data;
}

/**
 * List Supported Banks (optionally filtered by country/currency/type)
 * @param {object} params {currency?, country?, type?}
 * @returns {Promise<object[]>}
 */
async function listSupportedBanks(params = {}) {
  const urlParams = new URLSearchParams(params).toString();
  const res = await paystackRequest(`/bank${urlParams ? '?' + urlParams : ''}`, {
    method: 'GET'
  });
  return res.data;
}

/**
 * Resolve Account Number (for withdrawals, KYC, etc.)
 * @param {string} account_number
 * @param {string} bank_code
 * @returns {Promise<object>} {account_number, account_name, ...}
 */
async function resolveAccount(account_number, bank_code) {
  if (!account_number || !bank_code) throw new Error("Account number and bank code required");
  const params = new URLSearchParams({ account_number, bank_code }).toString();
  const res = await paystackRequest(`/bank/resolve?${params}`, {
    method: 'GET'
  });
  return res.data;
}

/**
 * Create a Paystack Customer (recommended before recurring billing, storing cards etc.)
 * @param {object} params - {email, first_name?, last_name?, phone?, metadata?}
 * @returns {Promise<object>} Created customer record
 */
async function createCustomer(params) {
  if (!params?.email) throw new Error("Customer email required");
  const res = await paystackRequest(`/customer`, {
    method: 'POST',
    body: JSON.stringify(params)
  });
  return res.data;
}

/**
 * Fetch a Paystack Customer by email or code
 * @param {object} params - {email?, customer_id?}
 * @returns {Promise<object>}
 */
async function fetchCustomer({ email, customer_id }) {
  if (customer_id) {
    const res = await paystackRequest(`/customer/${encodeURIComponent(customer_id)}`, {
      method: 'GET',
    });
    return res.data;
  } else if (email) {
    // List and filter on email (less efficient)
    const urlparams = new URLSearchParams({ perPage: 20, page: 1 }).toString();
    const res = await paystackRequest(`/customer?${urlparams}`, { method: 'GET' });
    const found = (res.data || []).find(c => c.email === email);
    if (!found) throw new Error("No customer found with given email");
    return found;
  } else {
    throw new Error("email or customer_id required");
  }
}

/**
 * Refund a completed transaction
 * @param {object} params {reference, amount? (refund partial), currency?}
 * @returns {Promise<object>}
 */
async function refundTransaction({ reference, amount, currency }) {
  if (!reference) throw new Error("Transaction reference required");
  const body = { transaction: reference };
  if (amount) body.amount = amount;
  if (currency) body.currency = currency;
  const res = await paystackRequest('/refund', {
    method: 'POST',
    body: JSON.stringify(body)
  });
  return res.data;
}

module.exports = {
  initializeTransaction,
  verifyTransaction,
  listSupportedBanks,
  resolveAccount,
  createCustomer,
  fetchCustomer,
  refundTransaction
};

