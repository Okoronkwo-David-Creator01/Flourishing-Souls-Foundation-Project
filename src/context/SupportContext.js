import React, { createContext, useReducer, useContext, useMemo, useCallback } from 'react';

// Support context initial state
const initialState = {
  liveChatOpen: false,
  tickets: [],
  knowledgebase: [],
  loading: {
    tickets: false,
    knowledgebase: false,
    liveChat: false,
  },
  error: null,
  unreadTickets: 0,
  selectedTicket: null,
};

// Action types
const ACTIONS = {
  OPEN_LIVE_CHAT: 'OPEN_LIVE_CHAT',
  CLOSE_LIVE_CHAT: 'CLOSE_LIVE_CHAT',
  SET_TICKETS: 'SET_TICKETS',
  ADD_TICKET: 'ADD_TICKET',
  UPDATE_TICKET: 'UPDATE_TICKET',
  SET_KNOWLEDGEBASE: 'SET_KNOWLEDGEBASE',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  INCREMENT_UNREAD: 'INCREMENT_UNREAD',
  RESET_UNREAD: 'RESET_UNREAD',
  SELECT_TICKET: 'SELECT_TICKET',
  CLEAR_SELECTED_TICKET: 'CLEAR_SELECTED_TICKET',
};

// Reducer function
function supportReducer(state, action) {
  switch (action.type) {
    case ACTIONS.OPEN_LIVE_CHAT:
      return { ...state, liveChatOpen: true };
    case ACTIONS.CLOSE_LIVE_CHAT:
      return { ...state, liveChatOpen: false };
    case ACTIONS.SET_TICKETS:
      return { ...state, tickets: action.payload, loading: { ...state.loading, tickets: false }, error: null };
    case ACTIONS.ADD_TICKET:
      return { ...state, tickets: [action.payload, ...state.tickets], unreadTickets: state.unreadTickets + 1 };
    case ACTIONS.UPDATE_TICKET:
      return {
        ...state,
        tickets: state.tickets.map(ticket => ticket.id === action.payload.id ? action.payload : ticket),
        selectedTicket: state.selectedTicket && state.selectedTicket.id === action.payload.id ? action.payload : state.selectedTicket,
      };
    case ACTIONS.SET_KNOWLEDGEBASE:
      return { ...state, knowledgebase: action.payload, loading: { ...state.loading, knowledgebase: false }, error: null };
    case ACTIONS.SET_LOADING:
      return { ...state, loading: { ...state.loading, ...action.payload } };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: { ...state.loading, tickets: false, knowledgebase: false } };
    case ACTIONS.INCREMENT_UNREAD:
      return { ...state, unreadTickets: state.unreadTickets + 1 };
    case ACTIONS.RESET_UNREAD:
      return { ...state, unreadTickets: 0 };
    case ACTIONS.SELECT_TICKET:
      return { ...state, selectedTicket: action.payload };
    case ACTIONS.CLEAR_SELECTED_TICKET:
      return { ...state, selectedTicket: null };
    default:
      return state;
  }
}

// Context creation
const SupportContext = createContext();

/**
 * Provider component for SupportContext.
 * Wrap your app with <SupportProvider> to use support-related state and actions.
 */
export function SupportProvider({ children }) {
  const [state, dispatch] = useReducer(supportReducer, initialState);

  // Live chat actions
  const openLiveChat = useCallback(() => {
    dispatch({ type: ACTIONS.OPEN_LIVE_CHAT });
  }, []);

  const closeLiveChat = useCallback(() => {
    dispatch({ type: ACTIONS.CLOSE_LIVE_CHAT });
  }, []);

  // Ticket actions
  const fetchTickets = useCallback(async (api) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { tickets: true } });
    try {
      const tickets = await api.getTickets(); // Expects API to have getTickets()
      dispatch({ type: ACTIONS.SET_TICKETS, payload: tickets });
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: err.message || 'Unable to fetch tickets' });
    }
  }, []);

  const addTicket = useCallback(async (api, ticketData) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { tickets: true } });
    try {
      const ticket = await api.createTicket(ticketData);
      dispatch({ type: ACTIONS.ADD_TICKET, payload: ticket });
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: err.message || 'Unable to add ticket' });
    }
  }, []);

  const updateTicket = useCallback(async (api, ticketId, updateData) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { tickets: true } });
    try {
      const updatedTicket = await api.updateTicket(ticketId, updateData);
      dispatch({ type: ACTIONS.UPDATE_TICKET, payload: updatedTicket });
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: err.message || 'Unable to update ticket' });
    }
  }, []);

  const selectTicket = useCallback((ticket) => {
    dispatch({ type: ACTIONS.SELECT_TICKET, payload: ticket });
    dispatch({ type: ACTIONS.RESET_UNREAD });
  }, []);

  const clearSelectedTicket = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_SELECTED_TICKET });
  }, []);

  // Knowledgebase actions
  const fetchKnowledgebase = useCallback(async (api) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { knowledgebase: true } });
    try {
      const kb = await api.getKnowledgebase();
      dispatch({ type: ACTIONS.SET_KNOWLEDGEBASE, payload: kb });
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: err.message || 'Unable to fetch knowledgebase' });
    }
  }, []);

  // Error handling
  const clearError = useCallback(() => {
    dispatch({ type: ACTIONS.SET_ERROR, payload: null });
  }, []);

  // Unread tickets utilities
  const incrementUnread = useCallback(() => {
    dispatch({ type: ACTIONS.INCREMENT_UNREAD });
  }, []);

  const resetUnread = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_UNREAD });
  }, []);

  // Memoize context value for performance
  const value = useMemo(() => ({
    state,
    openLiveChat,
    closeLiveChat,
    fetchTickets,
    addTicket,
    updateTicket,
    selectTicket,
    clearSelectedTicket,
    fetchKnowledgebase,
    clearError,
    incrementUnread,
    resetUnread,
  }), [
    state,
    openLiveChat,
    closeLiveChat,
    fetchTickets,
    addTicket,
    updateTicket,
    selectTicket,
    clearSelectedTicket,
    fetchKnowledgebase,
    clearError,
    incrementUnread,
    resetUnread,
  ]);

  return React.createElement(
    SupportContext.Provider,
    { value },
    children
  );
}

/**
 * useSupport - Custom hook for easy access to SupportContext.
 */
export function useSupport() {
  const context = useContext(SupportContext);
  if (context === undefined) {
    throw new Error('useSupport must be used within a SupportProvider');
  }
  return context;
}

