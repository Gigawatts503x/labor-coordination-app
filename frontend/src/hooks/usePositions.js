// frontend/src/hooks/usePositions.js
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

export const usePositions = (technicianId) => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPositions = async () => {
    if (!technicianId) return;
    try {
      setLoading(true);
      const response = await api.get(`/positions/technician/${technicianId}`);
      setPositions(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, [technicianId]);

  const addPosition = async (positionName) => {
    try {
      const response = await api.post('/positions', {
        technician_id: technicianId,
        position_name: positionName,
      });
      setPositions([...positions, response.data]);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const removePosition = async (positionId) => {
    try {
      await api.delete(`/positions/${positionId}`);
      setPositions(positions.filter(p => p.id !== positionId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return { positions, loading, error, addPosition, removePosition, refetch: fetchPositions };
};
