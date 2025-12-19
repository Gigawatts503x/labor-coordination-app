// frontend/src/utils/api.js

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

export const getEvents = () => api.get('/events');

export const getEvent = (id) => api.get(`/events/${id}`);

export const createEvent = (data) => api.post('/events', data);

export const updateEvent = (id, data) => api.put(`/events/${id}`, data);

export const deleteEvent = (id) => api.delete(`/events/${id}`);

// =============================================
// REQUIREMENTS
// =============================================

export const getEventRequirements = (eventId) =>
  api.get(`/events/${eventId}/requirements`);

export const getEventRequirementsWithCoverage = (eventId) =>
  api.get(`/events/${eventId}/requirements-with-coverage`);

export const getRequirement = (id) => api.get(`/requirements/${id}`);

// ✅ FIXED: Now accepts eventId as first parameter
export const createRequirement = (eventId, data) =>
  api.post(`/requirements`, { ...data, eventId });

export const updateRequirement = (id, data) =>
  api.patch(`/requirements/${id}`, data);

export const deleteRequirement = (id) => api.delete(`/requirements/${id}`);

export const getEventLocations = (eventId) =>
  api.get(`/events/${eventId}/locations`);

// =============================================
// ASSIGNMENTS
// =============================================

export const getEventAssignments = (eventId) =>
  api.get(`/events/${eventId}/assignments`);

export const getSlotAssignments = (eventId, date, location) =>
  api.get(`/events/${eventId}/assignments/slot/${date}/${location}`);

export const getAssignment = (id) => api.get(`/assignments/${id}`);

// ✅ FIXED: Now accepts eventId as first parameter
export const createAssignment = (eventId, data) =>
  api.post('/assignments', { ...data, eventId });

export const updateAssignment = (id, data) =>
  api.patch(`/assignments/${id}`, data);

export const deleteAssignment = (id) => api.delete(`/assignments/${id}`);

export const getTechAvailability = (eventId, date, startTime, endTime) =>
  api.get(
    `/events/${eventId}/tech-availability/${date}/${startTime}/${endTime}`
  );

export const bulkCreateAssignments = (assignments) =>
  api.post('/assignments/bulk', assignments);

// =============================================
// TECHNICIANS
// =============================================

export const getTechnicians = () => api.get('/technicians');

export const getTechnician = (id) => api.get(`/technicians/${id}`);

export const createTechnician = (data) => api.post('/technicians', data);

export const updateTechnician = (id, data) =>
  api.put(`/technicians/${id}`, data);

export const deleteTechnician = (id) => api.delete(`/technicians/${id}`);

// =============================================
// SETTINGS
// =============================================

export const getSettings = () => api.get('/settings');

export const updateSettings = (data) => api.put('/settings', data);

export const getEventSettings = (eventId) =>
  api.get(`/events/${eventId}/settings`);

export const updateEventSettings = (eventId, data) =>
  api.patch(`/events/${eventId}/settings`, data);

// =============================================
// POSITIONS (Global Setting) ✅ NEW
// =============================================

export const getPositions = () => api.get('/settings/positions');

export const createPosition = (name) =>
  api.post('/settings/positions', { name });

export const deletePosition = (name) =>
  api.delete(`/settings/positions/${encodeURIComponent(name)}`);

// =============================================
// SCHEDULE (GRID) SPECIFIC
// =============================================

export const getScheduleData = async (eventId) => {
  try {
    const [events, requirements, assignments, technicians, settings] =
      await Promise.all([
        getEvent(eventId),
        getEventRequirements(eventId),
        getEventAssignments(eventId),
        getTechnicians(),
        getSettings(),
      ]);

    return {
      event: events.data,
      requirements: requirements.data,
      assignments: assignments.data,
      technicians: technicians.data,
      settings: settings.data,
    };
  } catch (error) {
    console.error('Error loading schedule data:', error);
    throw error;
  }
};

// =============================================
// ERROR HANDLING
// =============================================

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
);

// =============================================
// DEFAULT EXPORT: API WRAPPER OBJECT
// For use with DataStoreContext (methods like API.fetchEvents())
// =============================================

const API = {
  // Events
  fetchEvents: async () => {
    const res = await getEvents();
    return res.data;
  },
  createEvent: async (data) => {
    const res = await createEvent(data);
    return res.data;
  },
  updateEvent: async (id, data) => {
    const res = await updateEvent(id, data);
    return res.data;
  },
  deleteEvent: async (id) => {
    const res = await deleteEvent(id);
    return res.data;
  },

  // Requirements
  fetchRequirements: async (eventId = null) => {
    let res;
    if (eventId) {
      res = await getEventRequirements(eventId);
    } else {
      res = await api.get('/requirements');
    }
    return res.data;
  },
  createRequirement: async (eventId, data) => {
    const res = await createRequirement(eventId, data);
    return res.data;
  },
  updateRequirement: async (id, data) => {
    const res = await updateRequirement(id, data);
    return res.data;
  },
  deleteRequirement: async (id) => {
    const res = await deleteRequirement(id);
    return res.data;
  },

  // Assignments
  fetchAssignments: async (eventId = null) => {
    let res;
    if (eventId) {
      res = await getEventAssignments(eventId);
    } else {
      res = await api.get('/assignments');
    }
    return res.data;
  },
  createAssignment: async (data) => {
    const res = await createAssignment(data.eventId, data);
    return res.data;
  },
  updateAssignment: async (id, data) => {
    const res = await updateAssignment(id, data);
    return res.data;
  },
  deleteAssignment: async (id) => {
    const res = await deleteAssignment(id);
    return res.data;
  },

  // Technicians
  fetchTechnicians: async () => {
    const res = await getTechnicians();
    return res.data;
  },
  createTechnician: async (data) => {
    const res = await createTechnician(data);
    return res.data;
  },
  updateTechnician: async (id, data) => {
    const res = await updateTechnician(id, data);
    return res.data;
  },
  deleteTechnician: async (id) => {
    const res = await deleteTechnician(id);
    return res.data;
  },

  // Settings
  fetchSettings: async () => {
    const res = await getSettings();
    return res.data;
  },
  updateSettings: async (data) => {
    const res = await updateSettings(data);
    return res.data;
  },
};

export default API;
