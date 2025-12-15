// frontend/src/hooks/useAssignments.js
// Hook for managing event assignments with granular update support

import { useState, useEffect } from 'react';
import {
  getEventAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from '../utils/api';

/**
 * Hook for managing event assignments
 *
 * Features:
 * - Fetch assignments for an event
 * - Add new assignment
 * - Remove assignment
 * - Update single field (patch) for inline cell edits
 * - Update full assignment
 * - Refresh assignments from server
 *
 * All fields use camelCase: technicianid, roomorlocation, hoursworked, etc.
 */
export const useAssignments = (eventId) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial fetch
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!eventId) return;
      try {
        setLoading(true);
        setError(null);
        const response = await getEventAssignments(eventId);
        setAssignments(Array.isArray(response) ? response : response.data || []);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching assignments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [eventId]);

  /**
   * Refresh assignments from server
   */
  const refreshAssignments = async () => {
    if (!eventId) return;
    try {
      setError(null);
      const response = await getEventAssignments(eventId);
      setAssignments(Array.isArray(response) ? response : response.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error refreshing assignments:', err);
    }
  };

  /**
   * Add a new assignment to the event
   * @param {object} data - Assignment data (technicianid, position, hoursworked, ratetype, etc.)
   */
  const addAssignment = async (data) => {
    try {
      const response = await createAssignment(eventId, data);
      const newAssignment = Array.isArray(response) ? response[0] : response.data || response;
      setAssignments([...assignments, newAssignment]);
      return newAssignment;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Remove an assignment
   * @param {string} id - Assignment ID
   */
  const removeAssignment = async (id) => {
    try {
      await deleteAssignment(id);
      setAssignments(assignments.filter((a) => a.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Update a single field on an assignment (PATCH)
   * Used for inline cell edits - sends only changed field
   *
   * @param {string} id - Assignment ID
   * @param {object} updates - Object with field(s) to update
   * @example
   * updateAssignmentField('assign-123', { hoursworked: 8 })
   * updateAssignmentField('assign-123', { position: 'Spotlight Op', hoursworked: 8 })
   */
  const updateAssignmentField = async (id, updates) => {
    try {
      const response = await updateAssignment(id, updates);
      const updated = Array.isArray(response) ? response[0] : response.data || response;
      setAssignments(assignments.map((a) => (a.id === id ? { ...a, ...updated } : a)));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Update full assignment (PUT equivalent)
   * For complete record updates
   *
   * @param {string} id - Assignment ID
   * @param {object} updates - Complete assignment object
   */
  const updateAssignmentFull = async (id, updates) => {
    try {
      const response = await updateAssignment(id, updates);
      const updated = Array.isArray(response) ? response[0] : response.data || response;
      setAssignments(assignments.map((a) => (a.id === id ? { ...a, ...updated } : a)));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Optimistic local update (no API call)
   * Used for immediate UI feedback before async operation
   *
   * @param {string} id - Assignment ID
   * @param {object} updates - Partial updates
   */
  const updateAssignmentLocal = (id, updates) => {
    setAssignments(assignments.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  return {
    assignments,
    loading,
    error,
    addAssignment,
    removeAssignment,
    updateAssignmentField, // For inline cell edits (PATCH)
    updateAssignmentFull, // For full updates
    updateAssignmentLocal, // Optimistic local update
    refreshAssignments,
  };
};
