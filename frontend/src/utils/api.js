// frontend/src/utils/api.js

import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE,
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
// GLOBAL SETTINGS
// =============================================

export const getSettings = () => api.get('/settings');

export const updateSettings = (data) => api.put('/settings', data);

// =============================================
// EVENT-LEVEL SETTINGS (NEW - Step 2)
// =============================================

export const getEventSettings = (eventId) => 
  api.get(`/events/${eventId}/settings`);

export const createEventSettings = (eventId, data) => 
  api.post(`/events/${eventId}/settings`, data);

export const updateEventSettings = (eventId, settingsId, data) => 
  api.put(`/events/${eventId}/settings/${settingsId}`, data);

// =============================================
// TECHNICIANS
// =============================================

export const getTechnicians = () => api.get('/technicians');

export const createTechnician = (data) => api.post('/technicians', data);

export const updateTechnician = (id, data) => api.put(`/technicians/${id}`, data);

export const deleteTechnician = (id) => api.delete(`/technicians/${id}`);

// =============================================
// EVENT REQUIREMENTS
// =============================================

export const getEventRequirements = (eventId) => 
  api.get(`/events/${eventId}/requirements`);

export const getEventRequirementsWithCoverage = (eventId) => 
  api.get(`/events/${eventId}/requirements/with-coverage`);

export const createEventRequirement = (eventId, data) => 
  api.post(`/events/${eventId}/requirements`, data);

export const updateRequirement = (id, data) => 
  api.put(`/requirements/${id}`, data);

export const deleteRequirement = (id) => 
  api.delete(`/requirements/${id}`);

// =============================================
// EVENT ASSIGNMENTS
// =============================================

export const getEventAssignments = (eventId) => 
  api.get(`/events/${eventId}/assignments`);

export const createEventAssignment = (eventId, data) => 
  api.post(`/events/${eventId}/assignments`, data);

/**
 * Update a single field on an assignment (for inline cell edits)
 * Sends only the fields that changed
 */
export const patchAssignment = (id, data) => 
  api.patch(`/assignments/${id}`, data);

/**
 * Full update of assignment (all fields)
 */
export const updateAssignment = (id, data) => 
  api.put(`/assignments/${id}`, data);

export const deleteAssignment = (id) => 
  api.delete(`/assignments/${id}`);

export const getTechSchedule = (techId) => 
  api.get(`/technicians/${techId}/schedule`);

/**
 * Bulk update single field across multiple assignments
 * Used for updating hours_worked, position, assignment_date, etc. on multiple rows at once
 * @param {string} eventId - Event ID
 * @param {string[]} assignmentIds - Array of assignment IDs to update
 * @param {object} updates - Object with field names and new values
 * @example
 * bulkUpdateAssignments('event-123', ['assign-1', 'assign-2'], { position: 'Spotlight Op' })
 */
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
