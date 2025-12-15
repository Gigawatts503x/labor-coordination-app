// frontend/src/hooks/useEvents.js
// Hook for managing events - fetches from backend and provides CRUD operations

import { useState, useEffect } from 'react';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../utils/api';

export const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getEvents();
      // Backend returns array directly, not wrapped in .data
      setEvents(Array.isArray(response) ? response : response.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching events:', err);
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
      const newEvent = Array.isArray(response) ? response[0] : response.data || response;
      setEvents([newEvent, ...events]);
      return newEvent;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateEventData = async (eventId, eventData) => {
    try {
      const response = await updateEvent(eventId, eventData);
      const updated = Array.isArray(response) ? response[0] : response.data || response;
      setEvents(events.map((e) => (e.id === eventId ? updated : e)));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const removeEvent = async (eventId) => {
    try {
      await deleteEvent(eventId);
      setEvents(events.filter((e) => e.id !== eventId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    events,
    loading,
    error,
    addEvent,
    updateEvent: updateEventData,
    deleteEvent: removeEvent,
    refetch: fetchEvents,
  };
};
