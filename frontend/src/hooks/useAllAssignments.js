// frontend/src/hooks/useAllAssignments.js
import { useState, useEffect } from 'react';
import { getAllAssignments } from '../utils/api';

/**
 * Hook for fetching ALL assignments (not event-specific)
 * Used by ScheduleGrid, Analytics, etc.
 */
export const useAllAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const response = await getAllAssignments();
        setAssignments(response.data || []);
      } catch (err) {
        setError(err.message);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  const refreshAssignments = async () => {
    try {
      const response = await getAllAssignments();
      setAssignments(response.data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  return {
    assignments,
    loading,
    error,
    refetchAssignments: refreshAssignments
  };
};
