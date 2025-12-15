// frontend/src/hooks/useRequirements.js
// Hook for managing event requirements

import { useState, useEffect } from 'react';
import {
  getEventRequirements,
  createRequirement,
  updateRequirement,
  deleteRequirement,
} from '../utils/api';

/**
 * Hook for managing event requirements with granular update support
 *
 * Features:
 * - Fetch requirements for an event
 * - Add new requirement
 * - Remove requirement
 * - Update requirement field (patch) for inline cell edits
 * - Update full requirement
 * - Refresh requirements from server
 *
 * All fields use camelCase: requirementdate, roomorlocation, starttime, endtime, techsneeded, etc.
 */
export const useRequirements = (eventId) => {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial fetch
  useEffect(() => {
    const fetchRequirements = async () => {
      if (!eventId) return;
      try {
        setLoading(true);
        setError(null);
        const response = await getEventRequirements(eventId);
        setRequirements(Array.isArray(response) ? response : response.data || []);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching requirements:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequirements();
  }, [eventId]);

  /**
   * Refresh requirements from server
   */
  const refreshRequirements = async () => {
    if (!eventId) return;
    try {
      setError(null);
      const response = await getEventRequirements(eventId);
      setRequirements(Array.isArray(response) ? response : response.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error refreshing requirements:', err);
    }
  };

  /**
   * Add a new requirement to the event
   * @param {object} data - Requirement data (requirementdate, roomorlocation, starttime, endtime, position, techsneeded)
   */
  const addRequirement = async (data) => {
    try {
      const response = await createRequirement(eventId, data);
      const newRequirement = Array.isArray(response)
        ? response[0]
        : response.data || response;
      setRequirements([...requirements, newRequirement]);
      return newRequirement;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Remove a requirement
   * @param {string} id - Requirement ID
   */
  const removeRequirement = async (id) => {
    try {
      await deleteRequirement(id);
      setRequirements(requirements.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Update a single field on a requirement (PATCH)
   * Used for inline cell edits - sends only changed field
   *
   * Supports all fields: requirementdate, roomorlocation, starttime, endtime, position, techsneeded, etc.
   *
   * @param {string} id - Requirement ID
   * @param {object} updates - Object with field(s) to update
   * @example
   * updateRequirementField('req-123', { requirementdate: '2025-12-15' })
   * updateRequirementField('req-123', { roomorlocation: 'Main Stage', techsneeded: 2 })
   */
  const updateRequirementField = async (id, updates) => {
    try {
      const response = await updateRequirement(id, updates);
      const updated = Array.isArray(response) ? response[0] : response.data || response;
      setRequirements(requirements.map((r) => (r.id === id ? { ...r, ...updated } : r)));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Update full requirement
   * For complete record updates
   *
   * @param {string} id - Requirement ID
   * @param {object} updates - Complete requirement object
   */
  const updateRequirementFull = async (id, updates) => {
    try {
      const response = await updateRequirement(id, updates);
      const updated = Array.isArray(response) ? response[0] : response.data || response;
      setRequirements(requirements.map((r) => (r.id === id ? { ...r, ...updated } : r)));
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
   * @param {string} id - Requirement ID
   * @param {object} updates - Partial updates
   */
  const updateRequirementLocal = (id, updates) => {
    setRequirements(requirements.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  return {
    requirements,
    loading,
    error,
    addRequirement,
    removeRequirement,
    updateRequirementField, // For inline cell edits (PATCH)
    updateRequirementFull, // For full updates
    updateRequirementLocal, // Optimistic local update
    refreshRequirements,
  };
};
