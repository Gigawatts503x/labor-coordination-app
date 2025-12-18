// frontend/src/hooks/useDataStore.js
// ✅ PHASE 1: CENTRALIZED DATA STORE
// Single source of truth for all app data (events, requirements, assignments, technicians)
// This hook is called ONCE in App.js and shared with all pages via props

import { useState, useEffect, useCallback } from 'react';
import {
  getEvents,
  getTechnicians,
  createEvent,
  updateEvent,
  deleteEvent,
  createRequirement,
  updateRequirement,
  deleteRequirement,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from '../utils/api';

// Store data in localStorage with these keys
const STORE_KEYS = {
  EVENTS: 'labor_coordinator_events',
  REQUIREMENTS: 'labor_coordinator_requirements',
  ASSIGNMENTS: 'labor_coordinator_assignments',
  TECHNICIANS: 'labor_coordinator_technicians',
};

export const useDataStore = () => {
  // ==================== STATE ====================
  // These are the ONLY state variables for the entire app
  const [events, setEvents] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);

  // ==================== HELPERS ====================

  const saveToLocalStorage = useCallback((key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.error(`Error saving ${key} to localStorage:`, err);
    }
  }, []);

  const loadFromLocalStorage = useCallback((key) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error(`Error loading ${key} from localStorage:`, err);
      return null;
    }
  }, []);

  // ==================== FETCH ALL DATA ====================

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch from backend
      const [eventsRes, techniciansRes, requirementsRes, assignmentsRes] =
        await Promise.all([
          getEvents(),
          getTechnicians(),
          getRequirements ? getRequirements() : Promise.resolve([]),
          getAssignments ? getAssignments() : Promise.resolve([]),
        ]);

      // Safely extract data (handle both array and { data } responses)
      const eventsData = Array.isArray(eventsRes)
        ? eventsRes
        : eventsRes.data || [];
      const techniciansData = Array.isArray(techniciansRes)
        ? techniciansRes
        : techniciansRes.data || [];
      const requirementsData = Array.isArray(requirementsRes)
        ? requirementsRes
        : requirementsRes.data || [];
      const assignmentsData = Array.isArray(assignmentsRes)
        ? assignmentsRes
        : assignmentsRes.data || [];

      // Update state
      setEvents(eventsData);
      setRequirements(requirementsData);
      setAssignments(assignmentsData);
      setTechnicians(techniciansData);
      setLastSynced(new Date().toLocaleTimeString());

      // Save to localStorage
      saveToLocalStorage(STORE_KEYS.EVENTS, eventsData);
      saveToLocalStorage(STORE_KEYS.REQUIREMENTS, requirementsData);
      saveToLocalStorage(STORE_KEYS.ASSIGNMENTS, assignmentsData);
      saveToLocalStorage(STORE_KEYS.TECHNICIANS, techniciansData);

      console.log('✅ Data store synced:', {
        events: eventsData.length,
        requirements: requirementsData.length,
        assignments: assignmentsData.length,
        technicians: techniciansData.length,
      });
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);

      // Fallback to localStorage
      console.log('⚠️ Falling back to localStorage...');
      const cachedEvents = loadFromLocalStorage(STORE_KEYS.EVENTS);
      const cachedRequirements = loadFromLocalStorage(
        STORE_KEYS.REQUIREMENTS
      );
      const cachedAssignments = loadFromLocalStorage(STORE_KEYS.ASSIGNMENTS);
      const cachedTechnicians = loadFromLocalStorage(STORE_KEYS.TECHNICIANS);

      if (cachedEvents) setEvents(cachedEvents);
      if (cachedRequirements) setRequirements(cachedRequirements);
      if (cachedAssignments) setAssignments(cachedAssignments);
      if (cachedTechnicians) setTechnicians(cachedTechnicians);
    } finally {
      setLoading(false);
    }
  }, [saveToLocalStorage, loadFromLocalStorage]);

  // ==================== EVENTS CRUD ====================

  const addEvent = useCallback(
    async (eventData) => {
      try {
        const response = await createEvent(eventData);
        const newEvent = Array.isArray(response)
          ? response[0]
          : response.data || response;

        const updatedEvents = [newEvent, ...events];
        setEvents(updatedEvents);
        saveToLocalStorage(STORE_KEYS.EVENTS, updatedEvents);

        console.log('✅ Event added:', newEvent.id);
        return newEvent;
      } catch (err) {
        setError(err.message);
        console.error('Error adding event:', err);
        throw err;
      }
    },
    [events, saveToLocalStorage]
  );

  const updateEventData = useCallback(
    async (eventId, eventData) => {
      try {
        const response = await updateEvent(eventId, eventData);
        const updated = Array.isArray(response)
          ? response[0]
          : response.data || response;

        const updatedEvents = events.map((e) => (e.id === eventId ? updated : e));
        setEvents(updatedEvents);
        saveToLocalStorage(STORE_KEYS.EVENTS, updatedEvents);

        console.log('✅ Event updated:', eventId);
        return updated;
      } catch (err) {
        setError(err.message);
        console.error('Error updating event:', err);
        throw err;
      }
    },
    [events, saveToLocalStorage]
  );

  const removeEvent = useCallback(
    async (eventId) => {
      try {
        await deleteEvent(eventId);

        const updatedEvents = events.filter((e) => e.id !== eventId);
        setEvents(updatedEvents);
        saveToLocalStorage(STORE_KEYS.EVENTS, updatedEvents);

        // Also remove associated requirements and assignments
        const updatedRequirements = requirements.filter(
          (r) => r.eventid !== eventId
        );
        setRequirements(updatedRequirements);
        saveToLocalStorage(STORE_KEYS.REQUIREMENTS, updatedRequirements);

        const updatedAssignments = assignments.filter((a) => {
          const req = requirements.find((r) => r.id === a.requirementid);
          return req?.eventid !== eventId;
        });
        setAssignments(updatedAssignments);
        saveToLocalStorage(STORE_KEYS.ASSIGNMENTS, updatedAssignments);

        console.log('✅ Event deleted:', eventId);
      } catch (err) {
        setError(err.message);
        console.error('Error deleting event:', err);
        throw err;
      }
    },
    [events, requirements, assignments, saveToLocalStorage]
  );

  // ==================== REQUIREMENTS CRUD ====================

  const addRequirement = useCallback(
    async (requirementData) => {
      try {
        const response = await createRequirement(requirementData);
        const newRequirement = Array.isArray(response)
          ? response[0]
          : response.data || response;

        const updatedRequirements = [newRequirement, ...requirements];
        setRequirements(updatedRequirements);
        saveToLocalStorage(STORE_KEYS.REQUIREMENTS, updatedRequirements);

        console.log('✅ Requirement added:', newRequirement.id);
        return newRequirement;
      } catch (err) {
        setError(err.message);
        console.error('Error adding requirement:', err);
        throw err;
      }
    },
    [requirements, saveToLocalStorage]
  );

  const updateRequirementData = useCallback(
    async (requirementId, requirementData) => {
      try {
        const response = await updateRequirement(requirementId, requirementData);
        const updated = Array.isArray(response)
          ? response[0]
          : response.data || response;

        const updatedRequirements = requirements.map((r) =>
          r.id === requirementId ? updated : r
        );
        setRequirements(updatedRequirements);
        saveToLocalStorage(STORE_KEYS.REQUIREMENTS, updatedRequirements);

        console.log('✅ Requirement updated:', requirementId);
        return updated;
      } catch (err) {
        setError(err.message);
        console.error('Error updating requirement:', err);
        throw err;
      }
    },
    [requirements, saveToLocalStorage]
  );

  const removeRequirement = useCallback(
    async (requirementId) => {
      try {
        await deleteRequirement(requirementId);

        const updatedRequirements = requirements.filter(
          (r) => r.id !== requirementId
        );
        setRequirements(updatedRequirements);
        saveToLocalStorage(STORE_KEYS.REQUIREMENTS, updatedRequirements);

        // Remove associated assignments
        const updatedAssignments = assignments.filter(
          (a) => a.requirementid !== requirementId
        );
        setAssignments(updatedAssignments);
        saveToLocalStorage(STORE_KEYS.ASSIGNMENTS, updatedAssignments);

        console.log('✅ Requirement deleted:', requirementId);
      } catch (err) {
        setError(err.message);
        console.error('Error deleting requirement:', err);
        throw err;
      }
    },
    [requirements, assignments, saveToLocalStorage]
  );

  // ==================== ASSIGNMENTS CRUD ====================

  const addAssignment = useCallback(
    async (assignmentData) => {
      try {
        const response = await createAssignment(assignmentData);
        const newAssignment = Array.isArray(response)
          ? response[0]
          : response.data || response;

        const updatedAssignments = [newAssignment, ...assignments];
        setAssignments(updatedAssignments);
        saveToLocalStorage(STORE_KEYS.ASSIGNMENTS, updatedAssignments);

        console.log('✅ Assignment added:', newAssignment.id);
        return newAssignment;
      } catch (err) {
        setError(err.message);
        console.error('Error adding assignment:', err);
        throw err;
      }
    },
    [assignments, saveToLocalStorage]
  );

  const updateAssignmentData = useCallback(
    async (assignmentId, assignmentData) => {
      try {
        const response = await updateAssignment(assignmentId, assignmentData);
        const updated = Array.isArray(response)
          ? response[0]
          : response.data || response;

        const updatedAssignments = assignments.map((a) =>
          a.id === assignmentId ? updated : a
        );
        setAssignments(updatedAssignments);
        saveToLocalStorage(STORE_KEYS.ASSIGNMENTS, updatedAssignments);

        console.log('✅ Assignment updated:', assignmentId);
        return updated;
      } catch (err) {
        setError(err.message);
        console.error('Error updating assignment:', err);
        throw err;
      }
    },
    [assignments, saveToLocalStorage]
  );

  const removeAssignment = useCallback(
    async (assignmentId) => {
      try {
        await deleteAssignment(assignmentId);

        const updatedAssignments = assignments.filter(
          (a) => a.id !== assignmentId
        );
        setAssignments(updatedAssignments);
        saveToLocalStorage(STORE_KEYS.ASSIGNMENTS, updatedAssignments);

        console.log('✅ Assignment deleted:', assignmentId);
      } catch (err) {
        setError(err.message);
        console.error('Error deleting assignment:', err);
        throw err;
      }
    },
    [assignments, saveToLocalStorage]
  );

  // ==================== INITIAL LOAD ====================

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ==================== RETURN STORE ====================
  // Everything needed by the entire app
  return {
    // State (read-only for pages)
    events,
    requirements,
    assignments,
    technicians,
    loading,
    error,
    lastSynced,

    // Events
    addEvent,
    updateEvent: updateEventData,
    removeEvent,

    // Requirements
    addRequirement,
    updateRequirement: updateRequirementData,
    removeRequirement,

    // Assignments
    addAssignment,
    updateAssignment: updateAssignmentData,
    removeAssignment,

    // Utilities
    refetch: fetchAllData,
  };
};

export default useDataStore;