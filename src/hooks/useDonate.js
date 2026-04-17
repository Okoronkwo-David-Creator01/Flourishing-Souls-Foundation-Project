import { useReducer, useCallback } from 'react'
import { processPaystackPayment } from '../lib/paystack'
import {
  saveDonation,
  getDonationsByUser,
  getAllDonations
} from '../services/paystackService'

const initialState = {
  loading: false,
  error: null,
  donationReceipt: null,
  donations: [],
  allDonations: [],
}

function reducer(state, action) {
  switch (action.type) {
    case 'DONATE_INIT':
      return { ...state, loading: true, error: null }
    case 'DONATE_SUCCESS':
      return {
        ...state,
        loading: false,
        donationReceipt: action.payload,
        error: null,
      }
    case 'DONATE_FAIL':
      return { ...state, loading: false, error: action.error }
    case 'FETCH_DONATIONS_SUCCESS':
      return { ...state, donations: action.payload }
    case 'FETCH_ALL_DONATIONS_SUCCESS':
      return { ...state, allDonations: action.payload }
    case 'CLEAR_RECEIPT':
      return { ...state, donationReceipt: null }
    default:
      return state
  }
}

/**
 * useDonate hook to manage real donations.
 *
 * Provides:
 *  - donate: to trigger a Paystack payment, save to DB, and get a receipt
 *  - getUserDonations: fetch all donations for a user by email
 *  - getAllDonations: fetch all donations (admin usage)
 *  - receipt: donation receipt for current donation
 *  - donations: user's donation history
 *  - allDonations: all donation records (admin)
 *  - loading, error
 *  - clearReceipt: clears the donation receipt after successful display
 */
export default function useDonate() {
  const [state, dispatch] = useReducer(reducer, initialState)

  /**
   * donate
   * @param {Object} params
   * @param {string} params.email - Donor's email
   * @param {string} params.fullName - Donor's Full Name
   * @param {number} params.amount - Donation amount (in Naira)
   * @param {string} [params.phone] - Donor's Phone (optional)
   * @param {string} [params.cause] - Cause/Tag (optional)
   * @returns {Promise<void>}
   */
  const donate = useCallback(async ({
    email,
    fullName,
    amount,
    phone,
    cause,
    meta = {}
  }) => {
    dispatch({ type: 'DONATE_INIT' })
    try {
      // 1. Trigger Paystack payment (returns transaction ref, details)
      const paymentResult = await processPaystackPayment({
        email,
        amount,
        metadata: {
          fullName,
          phone: phone || '',
          cause: cause || '',
          ...meta,
        },
      })

      if (!paymentResult || !paymentResult.status) {
        throw new Error('Payment was not successful. Please try again.')
      }

      // 2. Save the donation details to database
      const donationData = {
        email,
        name: fullName,
        amount,
        phone: phone || '',
        cause: cause || '',
        paystack_reference: paymentResult.reference,
        channel: paymentResult.channel || 'paystack',
        status: paymentResult.status,
        metadata: paymentResult.metadata,
        paid_at: paymentResult.paid_at || new Date().toISOString(),
        receipt_url: paymentResult.receipt_url || null,
        currency: paymentResult.currency || 'NGN',
      }

      const saved = await saveDonation(donationData)
      if (!saved || saved.error) {
        throw new Error(saved.error || 'Unable to save donation record')
      }

      // 3. Dispatch success, pass reference/receipt
      dispatch({
        type: 'DONATE_SUCCESS',
        payload: {
          reference: saved.reference || paymentResult.reference,
          email,
          amount,
          receipt_url: saved.receipt_url || paymentResult.receipt_url || '',
          paid_at: saved.paid_at || paymentResult.paid_at || donationData.paid_at,
          ...saved,
        }
      })
    } catch (error) {
      dispatch({
        type: 'DONATE_FAIL',
        error: error.message || 'Payment/donation failed'
      })
    }
  }, [])

  /**
   * Fetch user's donations by email. Only call when user is logged in.
   * @param {string} email
   * @returns {Promise<void>}
   */
  const fetchUserDonations = useCallback(async (email) => {
    if (!email) return
    try {
      const res = await getDonationsByUser(email)
      if (res && Array.isArray(res)) {
        dispatch({
          type: 'FETCH_DONATIONS_SUCCESS',
          payload: res,
        })
      }
    } catch (error) {
      dispatch({
        type: 'FETCH_DONATIONS_FAIL',
        error: error.message || 'Failed to fetch user donations',
      });
    }
  }, [])

  /**
   * Fetch all donations (for admins)
   * @returns {Promise<void>}
   */
  const fetchAllDonations = useCallback(async () => {
    try {
      const res = await getAllDonations()
      if (res && Array.isArray(res)) {
        dispatch({
          type: 'FETCH_ALL_DONATIONS_SUCCESS',
          payload: res,
        })
      }
    } catch (error) {
      dispatch({
        type: 'FETCH_ALL_DONATIONS_FAIL',
        error: error.message || 'Failed to fetch all donations'
      });
    }
  }, [])

  /**
   * Clear the current donation receipt (e.g. after displaying)
   */
  const clearReceipt = useCallback(() => {
    dispatch({ type: 'CLEAR_RECEIPT' })
  }, [])

  return {
    donate,
    loading: state.loading,
    error: state.error,
    receipt: state.donationReceipt,
    clearReceipt,
    donations: state.donations,
    fetchUserDonations,
    allDonations: state.allDonations,
    fetchAllDonations,
  }
}

