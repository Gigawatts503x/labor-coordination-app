// frontend/src/hooks/useScheduleSync.js
// Polls and syncs requirements & assignments across all events
// FIXED: React Hook dependencies and useCallback for stable functions

import { useEffect, useState, useCallback } from 'react';
import { getEventRequirements, getEventAssignments } from '../utils/api';

/**
 * useScheduleSync(events, pollInterval)
 * 
 * Fetches and syncs requirements and assignments for all provided events.
 * Auto-refreshes every `pollInterval` milliseconds (default 5000ms).
 * 
 * Returns:
 *   - requirements: array of all requirements across all events
 *   - assignments: array of all assignments across all events
 *   - loading: boolean indicating if data is currently being fetched
 *   - error: error object if fetch failed, null otherwise
 *   - lastUpdated: ISO timestamp of last successful sync
 *   - refetch: function to manually trigger a fetch
 */
export const useScheduleSync = (events = [], pollInterval = 5000) => {
  const [requirements, setRequirements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch all data for all events - wrapped in useCallback to fix dependency warnings
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const allRequirements = [];
      const allAssignments = [];

      // Fetch data for each event in parallel
      const promises = events.map((event) =>
        Promise.all([
          getEventRequirements(event.id).catch((err) => {
            console.warn(`Failed to fetch requirements for event ${event.id}:`, err);
            return { data: [] };
          }),
          getEventAssignments(event.id).catch((err) => {
            console.warn(`Failed to fetch assignments for event ${event.id}:`, err);
            return { data: [] };
          }),
        ]).then(([reqRes, assignRes]) => {
          if (reqRes?.data) allRequirements.push(...reqRes.data);
          if (assignRes?.data) allAssignments.push(...assignRes.data);
        })
      );

      await Promise.all(promises);

      setRequirements(allRequirements);
      setAssignments(allAssignments);
      setLastUpdated(new Date().toISOString());

      console.log(
        `[useScheduleSync] Synced ${allRequirements.length} requirements, ${allAssignments.length} assignments`
      );
    } catch (err) {
      console.error('[useScheduleSync] Error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [events]); // Only depends on events array

  // Initial fetch
  useEffect(() => {
    if (events && events.length > 0) {
      fetchAllData();
    }
  }, [events, fetchAllData]);

  // Set up polling interval
  useEffect(() => {
    if (!events || events.length === 0) return;

    const interval = setInterval(fetchAllData, pollInterval);
    return () => clearInterval(interval);
  }, [events, fetchAllData, pollInterval]);

  return {
    requirements,
    assignments,
    loading,
    error,
    lastUpdated,
    refetch: fetchAllData,
  };
};

export default useScheduleSync;
