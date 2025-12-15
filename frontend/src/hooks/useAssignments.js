// frontend/src/hooks/useAssignments.js
import { useState, useEffect } from 'react';

import {
  getEventAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment
} from '../utils/api';

/**
 * Hook for managing event assignments with granular update support
 *
 * Features:
 * - Fetch assignments for an event
 * - Add new assignment
 * - Remove assignment
 * - Update single field (patch) for inline cell edits
 * - Update full assignment
 * - Refresh assignments from server
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
        const response = await getEventAssignments(eventId);
        setAssignments(response.data);
      } catch (err) {
        setError(err.message);
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
      const response = await getEventAssignments(eventId);
      setAssignments(response.data);
    } catch (err) {
      setError(err.message);
    }
  };

  /**
   * Add a new assignment to the event
   * @param {object} data - Assignment data (technician_id, position, hours_worked, rate_type, etc.)
   */
  const addAssignment = async (data) => {
    try {
      const response = await createAssignment({
        event_id: eventId,
        ...data
      });
      setAssignments([...assignments, response.data]);
      return response.data;
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
      setAssignments(assignments.filter(a => a.id !== id));
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
   * updateAssignmentField('assign-123', { hours_worked: 8 })
   * updateAssignmentField('assign-123', { position: 'Spotlight Op', hours_worked: 8 })
   */
  const updateAssignmentField = async (id, updates) => {
    try {
      const response = await updateAssignment(id, updates);
      setAssignments(assignments.map(a =>
        a.id === id ? { ...a, ...response.data } : a
      ));
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Update full assignment (PUT)
   * For complete record updates
   *
   * @param {string} id - Assignment ID
   * @param {object} updates - Complete assignment object
   */
  const updateAssignmentFull = async (id, updates) => {
    try {
      const response = await updateAssignment(id, updates);
      setAssignments(assignments.map(a =>
        a.id === id ? { ...a, ...response.data } : a
      ));
      return response.data;
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
  const updateAssignmentLocal = async (id, updates) => {
    try {
      setAssignments(assignments.map(a =>
        a.id === id ? { ...a, ...updates } : a
      ));
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    assignments,
    loading,
    error,
    addAssignment,
    removeAssignment,
    updateAssignmentField, // ✅ For inline cell edits (PATCH)
    updateAssignmentFull, // ✅ For full updates (PUT)
    updateAssignmentLocal, // Optimistic local update
    refreshAssignments
  };
};
