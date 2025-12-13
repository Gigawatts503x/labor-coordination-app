import { useState, useEffect } from 'react';
import {
  getEventRequirements,
  getEventRequirementsWithCoverage,
  createEventRequirement,
  updateRequirement,
  deleteRequirement,
  api
} from '../utils/api';

/**
 * Hook for managing event requirements with granular update support
 * 
 * Features:
 * - Fetch requirements for an event (with or without coverage data)
 * - Add new requirement
 * - Remove requirement
 * - Update requirement field (patch) for inline cell edits
 * - Update full requirement
 * - Refresh requirements from server
 * 
 * Step 2: Supports requirement_date field for date-based organization
 */
export const useRequirements = (eventId, includeWithCoverage = true) => {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial fetch
  useEffect(() => {
    const fetchRequirements = async () => {
      if (!eventId) return;
      try {
        setLoading(true);
        const response = includeWithCoverage
          ? await getEventRequirementsWithCoverage(eventId)
          : await getEventRequirements(eventId);
        setRequirements(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRequirements();
  }, [eventId, includeWithCoverage]);

  /**
   * Refresh requirements from server
   */
  const refreshRequirements = async () => {
    if (!eventId) return;
    try {
      const response = includeWithCoverage
        ? await getEventRequirementsWithCoverage(eventId)
        : await getEventRequirements(eventId);
      setRequirements(response.data);
    } catch (err) {
      setError(err.message);
    }
  };

  /**
   * Add a new requirement to the event
   * @param {object} data - Requirement data (requirement_date, room_or_location, start_time, end_time, position, techs_needed)
   */
  const addRequirement = async (data) => {
    try {
      const response = await createEventRequirement(eventId, data);
      setRequirements([...requirements, response.data]);
      return response.data;
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
      setRequirements(requirements.filter(r => r.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Update a single field on a requirement (PATCH)
   * Used for inline cell edits - sends only changed field
   * 
   * Step 2: Supports requirement_date and all other fields
   * 
   * @param {string} id - Requirement ID
   * @param {object} updates - Object with field(s) to update
   * @example
   * updateRequirementField('req-123', { requirement_date: '2025-12-15' })
   * updateRequirementField('req-123', { room_or_location: 'Main Stage', techs_needed: 2 })
   */
  const updateRequirementField = async (id, updates) => {
    try {
      const response = await api.patch(`/requirements/${id}`, updates);
      setRequirements(requirements.map(r =>
        r.id === id ? { ...r, ...response.data } : r
      ));
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Update full requirement (PUT)
   * For complete record updates
   * 
   * @param {string} id - Requirement ID
   * @param {object} updates - Complete requirement object
   */
  const updateRequirementFull = async (id, updates) => {
    try {
      const response = await updateRequirement(id, updates);
      setRequirements(requirements.map(r =>
        r.id === id ? { ...r, ...response.data } : r
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
   * @param {string} id - Requirement ID
   * @param {object} updates - Partial updates
   */
  const updateRequirementLocal = async (id, updates) => {
    try {
      setRequirements(requirements.map(r =>
        r.id === id ? { ...r, ...updates } : r
      ));
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    requirements,
    loading,
    error,
    addRequirement,
    removeRequirement,
    updateRequirementField,    // ✅ NEW: For inline cell edits (PATCH)
    updateRequirementFull,     // ✅ NEW: For full updates (PUT)
    updateRequirementLocal,    // Optimistic local update
    refreshRequirements
  };
};
