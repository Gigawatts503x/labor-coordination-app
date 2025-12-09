// frontend/src/hooks/useTechnicians.js
import { useState, useEffect } from 'react';
import { getTechnicians, createTechnician, updateTechnician, deleteTechnician } from '../utils/api';

export const useTechnicians = () => {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      const response = await getTechnicians();
      setTechnicians(response.data);
    } catch (err) {
      setError(err.message);
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
      setTechnicians([...technicians, response.data]);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateTech = async (id, techData) => {
    try {
      const response = await updateTechnician(id, techData);
      setTechnicians(technicians.map(t => t.id === id ? response.data : t));
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteTech = async (id) => {
    try {
      await deleteTechnician(id);
      setTechnicians(technicians.filter(t => t.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return { technicians, loading, error, addTechnician, updateTech, deleteTech, refetch: fetchTechnicians };
};
