// frontend/src/hooks/useEvents.js
import { useState, useEffect } from 'react';
import { getEvents, createEvent } from '../utils/api';

export const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await getEvents();
      setEvents(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const addEvent = async (eventData) => {
    try {
      const response = await createEvent(eventData);
      setEvents([response.data, ...events]);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return { events, loading, error, addEvent, refetch: fetchEvents };
};




