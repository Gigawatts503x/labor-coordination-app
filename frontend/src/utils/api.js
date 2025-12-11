// frontend/src/utils/api.js
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Events
export const getEvents = () => api.get('/events');
export const getEvent = (id) => api.get(`/events/${id}`);
export const createEvent = (data) => api.post('/events', data);
export const updateEvent = (id, data) => api.put(`/events/${id}`, data);
export const deleteEvent = (id) => api.delete(`/events/${id}`);

// Technicians
export const getTechnicians = () => api.get('/technicians');
export const createTechnician = (data) => api.post('/technicians', data);
export const updateTechnician = (id, data) => api.put(`/technicians/${id}`, data);
export const deleteTechnician = (id) => api.delete(`/technicians/${id}`);

// Event assignments
export const getEventAssignments = (eventId) => api.get(`/events/${eventId}/assignments`);
export const createEventAssignment = (eventId, data) =>
  api.post(`/events/${eventId}/assignments`, data);
export const updateAssignment = (id, data) => api.put(`/assignments/${id}`, data);
export const deleteAssignment = (id) => api.delete(`/assignments/${id}`);

export const getTechSchedule = (techId) => api.get(`/technicians/${techId}/schedule`);

export const getEventRequirements = (eventId) => api.get(`/events/${eventId}/requirements`);
export const createEventRequirement = (eventId, data) =>
  api.post(`/events/${eventId}/requirements`, data);
export const updateRequirement = (id, data) => api.put(`/requirements/${id}`, data);
export const deleteRequirement = (id) => api.delete(`/requirements/${id}`);


export const getEventRequirementsWithCoverage = (eventId) =>
  api.get(`/events/${eventId}/requirements/with-coverage`);

export const bulkUpdateAssignments = async (eventId, assignmentIds, updates) => {
  console.log('📤 API CALL bulkUpdateAssignments:', {
    url: `/events/${eventId}/assignments/bulk-update`,
    body: { assignmentIds, updates }
  });

  const response = await api.patch(
    `/events/${eventId}/assignments/bulk-update`,
    { assignmentIds, updates }
  );


  console.log('📥 API RESPONSE:', response.data);
  return response.data;
};


