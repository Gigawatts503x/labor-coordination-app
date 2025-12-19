/**
 * Centralized Data Store Context
 * Single source of truth for all app data
 * Syncs across pages and provides real-time updates
 */

import React, { createContext, useCallback, useEffect, useReducer, useRef } from 'react';
import { dataEventEmitter } from './EventEmitter';
import API from '../utils/api';

// Create context
export const DataStoreContext = createContext();

// Event types for emitter
export const DATA_EVENTS = {
  EVENTS_UPDATED: 'events:updated',
  EVENTS_ADDED: 'events:added',
  EVENTS_DELETED: 'events:deleted',
  ASSIGNMENTS_UPDATED: 'assignments:updated',
  ASSIGNMENTS_ADDED: 'assignments:added',
  ASSIGNMENTS_DELETED: 'assignments:deleted',
  TECHNICIANS_UPDATED: 'technicians:updated',
  REQUIREMENTS_UPDATED: 'requirements:updated',
  SCHEDULE_SYNC: 'schedule:sync',
  DATA_LOADING: 'data:loading',
  DATA_ERROR: 'data:error',
};

// Initial state
const initialState = {
  events: [],
  assignments: [],
  technicians: [],
  requirements: [],
  selectedEvent: null,
  loading: false,
  error: null,
  lastSync: null,
  syncInProgress: false,
};

// Reducer
function dataReducer(state, action) {
  switch (action.type) {
    case 'SET_EVENTS':
      return { ...state, events: action.payload, lastSync: new Date() };
    case 'ADD_EVENT':
      return {
        ...state,
        events: [...state.events, action.payload],
        lastSync: new Date(),
      };
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(e =>
          e.id === action.payload.id ? action.payload : e
        ),
        selectedEvent:
          state.selectedEvent?.id === action.payload.id
            ? action.payload
            : state.selectedEvent,
        lastSync: new Date(),
      };
    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter(e => e.id !== action.payload),
        selectedEvent:
          state.selectedEvent?.id === action.payload ? null : state.selectedEvent,
        lastSync: new Date(),
      };
    case 'SET_ASSIGNMENTS':
      return { ...state, assignments: action.payload, lastSync: new Date() };
    case 'ADD_ASSIGNMENT':
      return {
        ...state,
        assignments: [...state.assignments, action.payload],
        lastSync: new Date(),
      };
    case 'UPDATE_ASSIGNMENT':
      return {
        ...state,
        assignments: state.assignments.map(a =>
          a.id === action.payload.id ? action.payload : a
        ),
        lastSync: new Date(),
      };
    case 'DELETE_ASSIGNMENT':
      return {
        ...state,
        assignments: state.assignments.filter(a => a.id !== action.payload),
        lastSync: new Date(),
      };
    case 'SET_TECHNICIANS':
      return { ...state, technicians: action.payload, lastSync: new Date() };
    case 'UPDATE_TECHNICIAN':
      return {
        ...state,
        technicians: state.technicians.map(t =>
          t.id === action.payload.id ? action.payload : t
        ),
        lastSync: new Date(),
      };
    case 'SET_REQUIREMENTS':
      return { ...state, requirements: action.payload, lastSync: new Date() };
    case 'UPDATE_REQUIREMENT':
      return {
        ...state,
        requirements: state.requirements.map(r =>
          r.id === action.payload.id ? action.payload : r
        ),
        lastSync: new Date(),
      };
    case 'SET_SELECTED_EVENT':
      return { ...state, selectedEvent: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload, syncInProgress: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SYNC_START':
      return { ...state, syncInProgress: true };
    case 'SYNC_END':
      return { ...state, syncInProgress: false, lastSync: new Date() };
    default:
      return state;
  }
}

/**
 * DataStoreProvider Component
 * Wraps the app and provides centralized data management
 */
export function DataStoreProvider({ children }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);
  const syncIntervalRef = useRef(null);
  const unsubscribeRef = useRef([]);

  // ============ DATA FETCHING METHODS ============

  /**
   * Fetch all events from backend
   */
  const fetchEvents = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const data = await API.fetchEvents();
      dispatch({ type: 'SET_EVENTS', payload: data || [] });
      dataEventEmitter.emit(DATA_EVENTS.EVENTS_UPDATED, data);
    } catch (error) {
      console.error('Error fetching events:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      dataEventEmitter.emit(DATA_EVENTS.DATA_ERROR, error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  /**
   * Fetch all assignments from backend
   */
  const fetchAssignments = useCallback(async (eventId = null) => {
    try {
      dispatch({ type: 'SYNC_START' });
      const data = await API.fetchAssignments(eventId);
      dispatch({ type: 'SET_ASSIGNMENTS', payload: data || [] });
      dataEventEmitter.emit(DATA_EVENTS.ASSIGNMENTS_UPDATED, data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SYNC_END' });
    }
  }, []);

  /**
   * Fetch all technicians from backend
   */
  const fetchTechnicians = useCallback(async () => {
    try {
      const data = await API.fetchTechnicians();
      dispatch({ type: 'SET_TECHNICIANS', payload: data || [] });
    } catch (error) {
      console.error('Error fetching technicians:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  /**
   * Fetch all requirements from backend
   */
  const fetchRequirements = useCallback(async (eventId = null) => {
    try {
      const data = await API.fetchRequirements(eventId);
      dispatch({ type: 'SET_REQUIREMENTS', payload: data || [] });
      dataEventEmitter.emit(DATA_EVENTS.REQUIREMENTS_UPDATED, data);
    } catch (error) {
      console.error('Error fetching requirements:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  /**
   * Fetch all data (complete sync)
   */
  const syncAllData = useCallback(async () => {
    dispatch({ type: 'SYNC_START' });
    try {
      await Promise.all([
        fetchEvents(),
        fetchAssignments(),
        fetchTechnicians(),
        fetchRequirements(),
      ]);
      dataEventEmitter.emit(DATA_EVENTS.SCHEDULE_SYNC, state);
    } catch (error) {
      console.error('Error syncing data:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SYNC_END' });
    }
  }, [fetchEvents, fetchAssignments, fetchTechnicians, fetchRequirements, state]);

  // ============ CRUD METHODS ============

  const addEvent = useCallback(async (eventData) => {
    try {
      const newEvent = await API.createEvent(eventData);
      dispatch({ type: 'ADD_EVENT', payload: newEvent });
      dataEventEmitter.emit(DATA_EVENTS.EVENTS_ADDED, newEvent);
      return newEvent;
    } catch (error) {
      console.error('Error adding event:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, []);

  const updateEvent = useCallback(async (eventId, eventData) => {
    try {
      const updated = await API.updateEvent(eventId, eventData);
      dispatch({ type: 'UPDATE_EVENT', payload: updated });
      dataEventEmitter.emit(DATA_EVENTS.EVENTS_UPDATED, updated);
      return updated;
    } catch (error) {
      console.error('Error updating event:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, []);

  const deleteEvent = useCallback(async (eventId) => {
    try {
      await API.deleteEvent(eventId);
      dispatch({ type: 'DELETE_EVENT', payload: eventId });
      dataEventEmitter.emit(DATA_EVENTS.EVENTS_DELETED, eventId);
    } catch (error) {
      console.error('Error deleting event:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, []);

  const addAssignment = useCallback(async (assignmentData) => {
    try {
      const newAssignment = await API.createAssignment(assignmentData);
      dispatch({ type: 'ADD_ASSIGNMENT', payload: newAssignment });
      dataEventEmitter.emit(DATA_EVENTS.ASSIGNMENTS_ADDED, newAssignment);
      return newAssignment;
    } catch (error) {
      console.error('Error adding assignment:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, []);

  const updateAssignment = useCallback(async (assignmentId, assignmentData) => {
    try {
      const updated = await API.updateAssignment(assignmentId, assignmentData);
      dispatch({ type: 'UPDATE_ASSIGNMENT', payload: updated });
      dataEventEmitter.emit(DATA_EVENTS.ASSIGNMENTS_UPDATED, updated);
      return updated;
    } catch (error) {
      console.error('Error updating assignment:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, []);

  const deleteAssignment = useCallback(async (assignmentId) => {
    try {
      await API.deleteAssignment(assignmentId);
      dispatch({ type: 'DELETE_ASSIGNMENT', payload: assignmentId });
      dataEventEmitter.emit(DATA_EVENTS.ASSIGNMENTS_DELETED, assignmentId);
    } catch (error) {
      console.error('Error deleting assignment:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, []);

  const updateTechnician = useCallback(async (technicianId, techData) => {
    try {
      const updated = await API.updateTechnician(technicianId, techData);
      dispatch({ type: 'UPDATE_TECHNICIAN', payload: updated });
      dataEventEmitter.emit(DATA_EVENTS.TECHNICIANS_UPDATED, updated);
      return updated;
    } catch (error) {
      console.error('Error updating technician:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, []);

  const updateRequirement = useCallback(async (requirementId, reqData) => {
    try {
      const updated = await API.updateRequirement(requirementId, reqData);
      dispatch({ type: 'UPDATE_REQUIREMENT', payload: updated });
      dataEventEmitter.emit(DATA_EVENTS.REQUIREMENTS_UPDATED, updated);
      return updated;
    } catch (error) {
      console.error('Error updating requirement:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, []);

  const setSelectedEvent = useCallback((event) => {
    dispatch({ type: 'SET_SELECTED_EVENT', payload: event });
  }, []);

  // ============ INITIALIZATION & POLLING ============

  /**
   * Initialize data on mount and setup polling
   */
  useEffect(() => {
    // Initial data load
    syncAllData();

    // Setup polling every 30 seconds for data changes
    syncIntervalRef.current = setInterval(() => {
      syncAllData();
    }, 30000);

    // Subscribe to manual refresh events from components
    const unsubSync = dataEventEmitter.on('manual:refresh', () => {
      syncAllData();
    });

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      unsubSync();
    };
  }, [syncAllData]);

  // ============ CONTEXT VALUE ============

  const value = {
    // State
    state,
    events: state.events,
    assignments: state.assignments,
    technicians: state.technicians,
    requirements: state.requirements,
    selectedEvent: state.selectedEvent,
    loading: state.loading,
    error: state.error,
    lastSync: state.lastSync,
    syncInProgress: state.syncInProgress,

    // Data fetching
    fetchEvents,
    fetchAssignments,
    fetchTechnicians,
    fetchRequirements,
    syncAllData,

    // CRUD operations
    addEvent,
    updateEvent,
    deleteEvent,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    updateTechnician,
    updateRequirement,
    setSelectedEvent,

    // Utilities
    emit: dataEventEmitter.emit.bind(dataEventEmitter),
    on: dataEventEmitter.on.bind(dataEventEmitter),
  };

  return (
    <DataStoreContext.Provider value={value}>{children}</DataStoreContext.Provider>
  );
}

export default DataStoreContext;