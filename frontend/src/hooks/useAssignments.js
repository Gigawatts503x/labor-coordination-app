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

  useEffect(() => {
    fetchAssignments();
  }, [eventId]);

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

  const updateOne = async (id, data) => {
    try {
      const response = await updateAssignment(id, data);
      setAssignments(assignments.map(a => a.id === id ? response.data : a));
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

  return { assignments, loading, error, addAssignment, updateOne, removeAssignment, refetch: fetchAssignments };
};
