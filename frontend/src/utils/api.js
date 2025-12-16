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

export const getEventRequirements = (eventId) => api.get(`/events/${eventId}/requirements`);

export const getEventRequirementsWithCoverage = (eventId) =>
  api.get(`/events/${eventId}/requirements-with-coverage`);

export const getRequirement = (id) => api.get(`/requirements/${id}`);

// ✅ FIXED: Include eventId in request body so backend can parse it as JSON
export const createRequirement = (eventId, data) => 
  api.post(`/events/${eventId}/requirements`, {
    ...data,
    eventId, // Ensure eventId is in the payload for redundancy
  });

export const updateRequirement = (id, data) => api.patch(`/requirements/${id}`, data);

export const deleteRequirement = (id) => api.delete(`/requirements/${id}`);

export const getEventLocations = (eventId) => api.get(`/events/${eventId}/locations`);

// =============================================
// ASSIGNMENTS
// =============================================

export const getEventAssignments = (eventId) => api.get(`/events/${eventId}/assignments`);

export const getSlotAssignments = (eventId, date, location) =>
  api.get(`/events/${eventId}/assignments/slot/${date}/${location}`);

export const getAssignment = (id) => api.get(`/assignments/${id}`);

export const createAssignment = (data) => api.post('/assignments', data);

export const updateAssignment = (id, data) => api.patch(`/assignments/${id}`, data);

export const deleteAssignment = (id) => api.delete(`/assignments/${id}`);

export const getTechAvailability = (eventId, date, startTime, endTime) =>
  api.get(`/events/${eventId}/tech-availability/${date}/${startTime}/${endTime}`);

export const bulkCreateAssignments = (assignments) => api.post('/assignments/bulk', assignments);

// =============================================
// TECHNICIANS
// =============================================

export const getTechnicians = () => api.get('/technicians');

export const getTechnician = (id) => api.get(`/technicians/${id}`);

export const createTechnician = (data) => api.post('/technicians', data);

export const updateTechnician = (id, data) => api.put(`/technicians/${id}`, data);

export const deleteTechnician = (id) => api.delete(`/technicians/${id}`);

// =============================================
// SETTINGS
// =============================================

export const getSettings = () => api.get('/settings');

export const updateSettings = (data) => api.put('/settings', data);

export const getEventSettings = (eventId) => api.get(`/events/${eventId}/settings`);

export const updateEventSettings = (eventId, data) => api.patch(`/events/${eventId}/settings`, data);

// =============================================
// SCHEDULE (GRID) SPECIFIC
// =============================================

export const getScheduleData = async (eventId) => {
  try {
    const [events, requirements, assignments, technicians, settings] = await Promise.all([
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

export default api;
