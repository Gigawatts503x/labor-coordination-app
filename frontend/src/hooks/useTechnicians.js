// frontend/src/hooks/useTechnicians.js
// Hook for managing technicians

import { useState, useEffect } from 'react';
import {
  getTechnicians,
  createTechnician,
  updateTechnician,
  deleteTechnician,
} from '../utils/api';

/**
 * Hook for managing technicians
 *
 * Features:
 * - Fetch all technicians
 * - Add new technician
 * - Update technician
 * - Delete technician
 * - Refresh technicians from server
 */
export const useTechnicians = () => {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTechnicians();
      setTechnicians(Array.isArray(response) ? response : response.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching technicians:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const addTechnician = async (techData) => {
    try {
      const response = await createTechnician(techData);
      const newTech = Array.isArray(response) ? response[0] : response.data || response;
      setTechnicians([...technicians, newTech]);
      return newTech;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateTech = async (id, techData) => {
    try {
      const response = await updateTechnician(id, techData);
      const updated = Array.isArray(response) ? response[0] : response.data || response;
      setTechnicians(technicians.map((t) => (t.id === id ? updated : t)));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteTech = async (id) => {
    try {
      await deleteTechnician(id);
      setTechnicians(technicians.filter((t) => t.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    technicians,
    loading,
    error,
    addTechnician,
    updateTech,
    deleteTech,
    refetch: fetchTechnicians,
  };
};
