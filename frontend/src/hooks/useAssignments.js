// frontend/src/hooks/useAssignments.js
import { useState, useEffect } from 'react';
import {
  getEventAssignments,
  createEventAssignment,
  updateAssignment,
  deleteAssignment
} from '../utils/api';

export const useAssignments = (eventId) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const refreshAssignments = async () => {
    if (!eventId) return;
    try {
      const response = await getEventAssignments(eventId);
      setAssignments(response.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const addAssignment = async (data) => {
    try {
      const response = await createEventAssignment(eventId, data);
      setAssignments([...assignments, response.data]);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const removeAssignment = async (id) => {
    try {
      await deleteAssignment(id);
      setAssignments(assignments.filter(a => a.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return { assignments, loading, error, addAssignment, removeAssignment, refreshAssignments };
};
