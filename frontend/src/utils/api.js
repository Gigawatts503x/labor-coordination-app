// frontend/src/utils/api.js
// API client for communicating with the backend
// All endpoints match the new backend routes

import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =============================================
// EVENTS
// =============================================

export const getEvents = () => api.get('/events').then((res) => res.data);

export const getEvent = (id) => api.get(`/events/${id}`).then((res) => res.data);

export const createEvent = (data) => api.post('/events', data).then((res) => res.data);

export const updateEvent = (id, data) => api.put(`/events/${id}`, data).then((res) => res.data);

export const deleteEvent = (id) => api.delete(`/events/${id}`).then((res) => res.data);

// =============================================
// TECHNICIANS
// =============================================

export const getTechnicians = () => api.get('/technicians').then((res) => res.data);

export const getTechnician = (id) => api.get(`/technicians/${id}`).then((res) => res.data);

export const createTechnician = (data) => api.post('/technicians', data).then((res) => res.data);

export const updateTechnician = (id, data) =>
  api.put(`/technicians/${id}`, data).then((res) => res.data);

export const deleteTechnician = (id) => api.delete(`/technicians/${id}`).then((res) => res.data);

// =============================================
// REQUIREMENTS
// =============================================

export const getEventRequirements = (eventId) =>
  api.get(`/events/${eventId}/requirements`).then((res) => res.data);

export const getRequirement = (id) => api.get(`/requirements/${id}`).then((res) => res.data);

export const createRequirement = (eventId, data) =>
  api.post(`/events/${eventId}/requirements`, data).then((res) => res.data);

export const updateRequirement = (id, data) =>
  api.patch(`/requirements/${id}`, data).then((res) => res.data);

export const deleteRequirement = (id) => api.delete(`/requirements/${id}`).then((res) => res.data);

// =============================================
// ASSIGNMENTS
// =============================================

export const getEventAssignments = (eventId) =>
  api.get(`/events/${eventId}/assignments`).then((res) => res.data);

export const getAssignment = (id) => api.get(`/assignments/${id}`).then((res) => res.data);

export const createAssignment = (eventId, data) =>
  api.post(`/events/${eventId}/assignments`, data).then((res) => res.data);

export const updateAssignment = (id, data) =>
  api.patch(`/assignments/${id}`, data).then((res) => res.data);

export const deleteAssignment = (id) => api.delete(`/assignments/${id}`).then((res) => res.data);

// =============================================
// SETTINGS
// =============================================

export const getSettings = () => api.get('/settings').then((res) => res.data);

export const updateSettings = (data) => api.put('/settings', data).then((res) => res.data);

// =============================================
// POSITIONS
// =============================================

export const getPositions = () => api.get('/positions').then((res) => res.data);

// =============================================
// COMPOSITE DATA FETCHING (for schedule/dashboard)
// =============================================

export const getScheduleData = async (eventId) => {
  try {
    const [event, requirements, assignments, technicians, settings, positions] =
      await Promise.all([
        getEvent(eventId),
        getEventRequirements(eventId),
        getEventAssignments(eventId),
        getTechnicians(),
        getSettings(),
        getPositions(),
      ]);

    return {
      event,
      requirements,
      assignments,
      technicians,
      settings,
      positions,
    };
  } catch (error) {
    console.error('Error loading schedule data:', error);
    throw error;
  }
};

// =============================================
// ERROR HANDLING & INTERCEPTORS
// =============================================

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = error.response?.data?.error || error.message || 'API error occurred';
    console.error('API Error:', errorMessage);

    // Re-throw with the error message
    const apiError = new Error(errorMessage);
    apiError.status = error.response?.status;
    apiError.data = error.response?.data;
    throw apiError;
  },
);

export default api;
