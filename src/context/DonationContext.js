import React, { createContext, useState, useReducer, useEffect, useContext, useCallback } from 'react';

// Define the DonationContext
const DonationContext = createContext();

// Actions for reducer
const ACTIONS = {
  ADD_DONATION: 'add_donation',
  REMOVE_DONATION: 'remove_donation',
  CLEAR_DONATIONS: 'clear_donations',
  SET_DONATIONS: 'set_donations',
  UPDATE_DONATION: 'update_donation',
};

// Initial state factory
const getInitialDonations = () => {
  try {
    const stored = localStorage.getItem('donations');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

// Reducer function for managing donations
function donationReducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD_DONATION:
      return [action.payload, ...state];
    case ACTIONS.REMOVE_DONATION:
      return state.filter(donation => donation.id !== action.payload);
    case ACTIONS.CLEAR_DONATIONS:
      return [];
    case ACTIONS.SET_DONATIONS:
      return action.payload;
    case ACTIONS.UPDATE_DONATION:
      return state.map(donation =>
        donation.id === action.payload.id
          ? { ...donation, ...action.payload.data }
          : donation
      );
    default:
      return state;
  }
}

// Util for unique IDs (production should use UUID library)
function generateId() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

// Donation Provider
export function DonationProvider({ children }) {
  const [donations, dispatch] = useReducer(donationReducer, [], getInitialDonations);

  // Persist donations to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('donations', JSON.stringify(donations));
    } catch (e) {
      // Optionally handle quota exceeded or serialization errors
      // For production, consider toast/log
    }
  }, [donations]);

  // Add a new donation
  const addDonation = useCallback((donation) => {
    dispatch({
      type: ACTIONS.ADD_DONATION,
      payload: {
        ...donation,
        id: generateId(),
        createdAt: new Date().toISOString(),
      },
    });
  }, []);

  // Remove a donation by id
  const removeDonation = useCallback((id) => {
    dispatch({
      type: ACTIONS.REMOVE_DONATION,
      payload: id,
    });
  }, []);

  // Update an existing donation
  const updateDonation = useCallback((id, data) => {
    dispatch({
      type: ACTIONS.UPDATE_DONATION,
      payload: { id, data },
    });
  }, []);

  // Clear all donations
  const clearDonations = useCallback(() => {
    dispatch({
      type: ACTIONS.CLEAR_DONATIONS,
    });
  }, []);

  // Set donations (e.g. after fetching from API)
  const setDonations = useCallback((donationsArray) => {
    dispatch({
      type: ACTIONS.SET_DONATIONS,
      payload: donationsArray,
    });
  }, []);

  // Compute stats (could memoize for larger datasets)
  const totalAmount = donations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
  const donationCount = donations.length;

  const value = {
    donations,
    addDonation,
    removeDonation,
    clearDonations,
    setDonations,
    updateDonation,
    totalAmount,
    donationCount,
  };

  return React.createElement(
    DonationContext.Provider,
    { value },
    children
  );
}

// Custom hook for using the DonationContext
export function useDonations() {
  const context = useContext(DonationContext);
  if (context === undefined) {
    throw new Error('useDonations must be used within a DonationProvider');
  }
  return context;
}
