// frontend/src/pages/EventDetails.js
import React, { useEffect, useState } from 'react';
import { getEvent, getTechnicians, bulkUpdateAssignments } from '../utils/api';
import { useAssignments } from '../hooks/useAssignments';
import '../styles/EventDetails.css';
import {
  getEventRequirementsWithCoverage,
  createEventRequirement,
  deleteRequirement
} from '../utils/api';

const RATE_TYPES = ['hourly', 'half-day', 'full-day'];
const BULK_EDIT_FIELDS = ['assignment_date', 'start_time', 'end_time', 'position'];

const EventDetails = ({ eventId, onBack }) => {
  const [event, setEvent] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [error, setError] = useState(null);

  const {
    assignments,
    loading: loadingAssignments,
    addAssignment,
    removeAssignment,
    refreshAssignments
  } = useAssignments(eventId);

  const [formData, setFormData] = useState({
    technician_id: '',
    position: '',
    hours_worked: '',
    rate_type: 'hourly',
    assignment_date: '',
    start_time: '',
    end_time: '',
    requirement_id: ''
  });

  // Bulk edit state
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [bulkEditModal, setBulkEditModal] = useState(null);
  const [bulkEditValues, setBulkEditValues] = useState({
    assignment_date: '',
    start_time: '',
    end_time: '',
    position: ''
  });

  const [requirements, setRequirements] = useState([]);
  const [loadingRequirements, setLoadingRequirements] = useState(false);
  const [reqError, setReqError] = useState(null);

  const [reqForm, setReqForm] = useState({
    requirement_date: '',
    room_or_location: '',
    set_time: '',
    start_time: '',
    end_time: '',
    strike_time: '',
    position: '',
    techs_needed: 1
  });

  // Load event, technicians, requirements
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingEvent(true);
        setLoadingRequirements(true);
        const [eventRes, techRes, reqRes] = await Promise.all([
          getEvent(eventId),
          getTechnicians(),
          getEventRequirementsWithCoverage(eventId)
        ]);
        setEvent(eventRes.data);
        setTechnicians(techRes.data);
        setRequirements(reqRes.data);
        setError(null);
        setReqError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingEvent(false);
        setLoadingRequirements(false);
      }
    };
    if (eventId) load();
  }, [eventId]);

  // Close context menu on click
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Form handlers
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'hours_worked' ? (value === '' ? '' : parseFloat(value) || '') : value
    }));
  };

  const handleReqFormChange = (e) => {
    const { name, value } = e.target;
    setReqForm(prev => ({
      ...prev,
      [name]: name === 'techs_needed'
        ? (value === '' ? '' : parseInt(value, 10) || 1)
        : value
    }));
  };

  const handleBulkEditValueChange = (e) => {
    const { name, value } = e.target;
    setBulkEditValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Assignment handlers
  const handleAddAssignment = async (e) => {
    e.preventDefault();
    if (!formData.technician_id || !formData.rate_type) return;

    const hours = parseFloat(formData.hours_worked || 0);
    const tech = technicians.find(t => t.id === formData.technician_id);

    const data = {
      technician_id: formData.technician_id,
      position: formData.position || (tech ? tech.position : null),
      hours_worked: hours,
      rate_type: formData.rate_type,
      calculated_pay: 0,
      customer_bill: 0,
      assignment_date: formData.assignment_date || null,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
      requirement_id: formData.requirement_id || null
    };

    try {
      await addAssignment(data);
      setFormData({
        technician_id: '',
        position: '',
        hours_worked: '',
        rate_type: 'hourly',
        assignment_date: '',
        start_time: '',
        end_time: '',
        requirement_id: ''
      });
    } catch (err) {
      console.error('Failed to add assignment', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this assignment?')) return;
    try {
      await removeAssignment(id);
    } catch (err) {
      console.error('Failed to delete assignment', err);
    }
  };

  // Bulk edit handlers
  const toggleAssignmentSelect = (assignmentId) => {
    setSelectedAssignmentIds(prev =>
      prev.includes(assignmentId)
        ? prev.filter(id => id !== assignmentId)
        : [...prev, assignmentId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAssignmentIds.length === assignments.length) {
      setSelectedAssignmentIds([]);
    } else {
      setSelectedAssignmentIds(assignments.map(a => a.id));
    }
  };

  const handleContextMenu = (e, assignmentId) => {
    e.preventDefault();

    if (!selectedAssignmentIds.includes(assignmentId)) {
      setSelectedAssignmentIds([assignmentId]);
    }

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      assignmentIds: selectedAssignmentIds.includes(assignmentId)
        ? selectedAssignmentIds
        : [assignmentId]
    });
  };

  const openBulkEditModal = () => {
    if (contextMenu?.assignmentIds?.length) {
      setBulkEditModal({ assignmentIds: contextMenu.assignmentIds });
      setBulkEditValues({
        assignment_date: '',
        start_time: '',
        end_time: '',
        position: ''
      });
      setContextMenu(null);
    }
  };

  const handleBulkEditSubmit = async () => {
    if (!bulkEditModal?.assignmentIds?.length) return;

    // Build updates object with only non-empty values
    const updates = {};
    BULK_EDIT_FIELDS.forEach(field => {
      if (bulkEditValues[field] !== '') {
        updates[field] = bulkEditValues[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      alert('Please enter at least one value to update');
      return;
    }

    // Confirm before applying
    const count = bulkEditModal.assignmentIds.length;
    if (!window.confirm(`Apply these changes to ${count} assignment(s)?`)) {
      return;
    }

    try {
      await bulkUpdateAssignments(eventId, bulkEditModal.assignmentIds, updates);
      await refreshAssignments();
      setBulkEditModal(null);
      setSelectedAssignmentIds([]);
    } catch (err) {
      console.error('Bulk update failed:', err);
      alert('Failed to update assignments');
    }
  };

  // Requirement handlers
  const handleAddRequirement = async (e) => {
    e.preventDefault();
    if (!reqForm.requirement_date || !reqForm.room_or_location || !reqForm.start_time || !reqForm.end_time) return;

    try {
      const res = await createEventRequirement(eventId, {
        requirement_date: reqForm.requirement_date,
        room_or_location: reqForm.room_or_location,
        set_time: reqForm.set_time,
        start_time: reqForm.start_time,
        end_time: reqForm.end_time,
        strike_time: reqForm.strike_time,
        position: reqForm.position || null,
        techs_needed: reqForm.techs_needed || 1
      });
      setRequirements([...requirements, res.data]);
      setReqForm({
        requirement_date: '',
        room_or_location: '',
        set_time: '',
        start_time: '',
        end_time: '',
        strike_time: '',
        position: '',
        techs_needed: 1
      });
    } catch (err) {
      setReqError(err.message);
    }
  };

  const handleDeleteRequirement = async (id) => {
    if (!window.confirm('Delete this requirement?')) return;
    try {
      await deleteRequirement(id);
      setRequirements(requirements.filter(r => r.id !== id));
    } catch (err) {
      setReqError(err.message);
    }
  };

  const totalPay = assignments.reduce((sum, a) => sum + (a.calculated_pay || 0), 0);
  const totalBill = assignments.reduce((sum, a) => sum + (a.customer_bill || 0), 0);

  if (loadingEvent) return <div className="event-details">Loading event…</div>;
  if (error) return <div className="event-details error">Error: {error}</div>;
  if (!event) return <div className="event-details">Event not found.</div>;

  return (
    <div className="event-details">
      <button className="btn btn-secondary" onClick={onBack}>
        ← Back to Events
      </button>

      <header className="event-header">
        <div>
          <h1>{event.name}</h1>
          <p><strong>Client:</strong> {event.client_name}</p>
          {event.client_contact && <p><strong>Contact:</strong> {event.client_contact}</p>}
          {event.client_phone && <p><strong>Phone:</strong> {event.client_phone}</p>}
          {event.client_email && <p><strong>Email:</strong> {event.client_email}</p>}
        </div>
        <div className="event-summary">
          <h3>Totals</h3>
          <p><strong>Tech Pay:</strong> ${totalPay.toFixed(2)}</p>
          <p><strong>Customer Bill:</strong> ${totalBill.toFixed(2)}</p>
        </div>
      </header>

      <section className="requirements-section">
        <h2>Requirements (Rooms / Slots)</h2>

        {reqError && <div className="error-message">{reqError}</div>}

        <form className="requirement-form" onSubmit={handleAddRequirement}>
          <div className="form-row">
            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                name="requirement_date"
                value={reqForm.requirement_date}
                onChange={handleReqFormChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Room / Location *</label>
              <input
                type="text"
                name="room_or_location"
                value={reqForm.room_or_location}
                onChange={handleReqFormChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Set</label>
              <input
                type="time"
                name="set_time"
                value={reqForm.set_time}
                onChange={handleReqFormChange}
              />
            </div>
            <div className="form-group">
              <label>Start Time *</label>
              <input
                type="time"
                name="start_time"
                value={reqForm.start_time}
                onChange={handleReqFormChange}
                required
              />
            </div>
            <div className="form-group">
              <label>End Time *</label>
              <input
                type="time"
                name="end_time"
                value={reqForm.end_time}
                onChange={handleReqFormChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Strike</label>
              <input
                type="time"
                name="strike_time"
                value={reqForm.strike_time}
                onChange={handleReqFormChange}
              />
            </div>
            <div className="form-group">
              <label>Position</label>
              <input
                type="text"
                name="position"
                value={reqForm.position}
                onChange={handleReqFormChange}
                placeholder="e.g. A2, Cam Op"
              />
            </div>
            <div className="form-group">
              <label>Techs Needed</label>
              <input
                type="number"
                name="techs_needed"
                min="1"
                value={reqForm.techs_needed}
                onChange={handleReqFormChange}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-success">
            + Add Requirement
          </button>
        </form>

        {loadingRequirements ? (
          <p>Loading requirements...</p>
        ) : requirements.length === 0 ? (
          <p className="empty-state">No requirements yet for this event.</p>
        ) : (
          <div className="table-container">
            <table className="assignments-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Room</th>
                  <th>Set</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Strike</th>
                  <th>Position</th>
                  <th>Coverage</th>
                  <th>Assigned Techs</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map(r => {
                  const assignedNames = r.assigned_techs
                    ? r.assigned_techs.map(t => t.name).join(', ')
                    : '';
                  const coverageStatus = `${r.assigned_count || 0}/${r.techs_needed}`;

                  return (
                    <tr key={r.id}>
                      <td>{r.requirement_date || '—'}</td>
                      <td>{r.room_or_location}</td>
                      <td>{r.set_time || '—'}</td>
                      <td>{r.start_time || '—'}</td>
                      <td>{r.end_time || '—'}</td>
                      <td>{r.strike_time || '—'}</td>
                      <td>{r.position || '—'}</td>
                      <td>
                        <strong>{coverageStatus}</strong>
                      </td>
                      <td>
                        {assignedNames ? assignedNames : '—'}
                      </td>
                      <td>
                        <button
                          className="btn btn-small btn-delete"
                          onClick={() => handleDeleteRequirement(r.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="assignments-section">
        <h2>Assignments</h2>

        <form className="assignment-form" onSubmit={handleAddAssignment}>
          <div className="form-row">
            <div className="form-group">
              <label>Technician *</label>
              <select
                name="technician_id"
                value={formData.technician_id}
                onChange={handleFormChange}
                required
              >
                <option value="">Select technician</option>
                {technicians.map(tech => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name} ({tech.position || 'No primary position'})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Requirement / Room Slot</label>
              <select
                name="requirement_id"
                value={formData.requirement_id}
                onChange={handleFormChange}
              >
                <option value="">Select requirement (optional)</option>
                {requirements.map(req => (
                  <option key={req.id} value={req.id}>
                    {req.requirement_date} – {req.room_or_location} – {req.position || 'Any'} (Techs needed: {req.techs_needed})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Position</label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleFormChange}
                placeholder="Leave blank to use tech's primary position"
              />
            </div>

            <div className="form-group">
              <label>Hours</label>
              <input
                type="number"
                name="hours_worked"
                step="0.25"
                min="0"
                value={formData.hours_worked}
                onChange={handleFormChange}
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Rate Type</label>
              <select
                name="rate_type"
                value={formData.rate_type}
                onChange={handleFormChange}
              >
                {RATE_TYPES.map(rt => (
                  <option key={rt} value={rt}>{rt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                name="assignment_date"
                value={formData.assignment_date}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-group">
              <label>Start Time</label>
              <input
                type="time"
                name="start_time"
                value={formData.start_time}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-group">
              <label>End Time</label>
              <input
                type="time"
                name="end_time"
                value={formData.end_time}
                onChange={handleFormChange}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-success">
            + Add Assignment
          </button>
        </form>

        {loadingAssignments ? (
          <p>Loading assignments…</p>
        ) : assignments.length === 0 ? (
          <p className="empty-state">No assignments yet. Add one above.</p>
        ) : (
          <div className="table-container">
            <table className="assignments-table">
              <thead>
                <tr>
                  <th style={{ width: '30px' }}>
                    <input
                      type="checkbox"
                      checked={selectedAssignmentIds.length === assignments.length && assignments.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>Technician</th>
                  <th>Date</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Position</th>
                  <th>Hours</th>
                  <th>Rate Type</th>
                  <th>Tech Pay</th>
                  <th>Customer Bill</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(a => (
                  <tr
                    key={a.id}
                    onContextMenu={(e) => handleContextMenu(e, a.id)}
                    style={{
                      backgroundColor: selectedAssignmentIds.includes(a.id) ? '#e8f4f8' : 'transparent',
                      cursor: 'context-menu'
                    }}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedAssignmentIds.includes(a.id)}
                        onChange={() => toggleAssignmentSelect(a.id)}
                      />
                    </td>
                    <td>{a.technician_name}</td>
                    <td>{a.assignment_date || '—'}</td>
                    <td>{a.start_time || '—'}</td>
                    <td>{a.end_time || '—'}</td>
                    <td>{a.position}</td>
                    <td>{a.hours_worked}</td>
                    <td>{a.rate_type}</td>
                    <td>${(a.calculated_pay || 0).toFixed(2)}</td>
                    <td>${(a.customer_bill || 0).toFixed(2)}</td>
                    <td>
                      <button
                        className="btn btn-small btn-delete"
                        onClick={() => handleDelete(a.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Context Menu */}
        {contextMenu && (
          <div
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              zIndex: 1000,
              minWidth: '150px'
            }}
          >
            <button
              onClick={openBulkEditModal}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              ✏️ Bulk Edit ({contextMenu.assignmentIds.length})
            </button>
          </div>
        )}

        {/* Bulk Edit Modal */}
        {bulkEditModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 2000
            }}
            onClick={() => setBulkEditModal(null)}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '20px',
                minWidth: '400px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Bulk Edit Assignments ({bulkEditModal.assignmentIds.length} selected)</h3>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date</label>
                <input
                  type="date"
                  name="assignment_date"
                  value={bulkEditValues.assignment_date}
                  onChange={handleBulkEditValueChange}
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Start Time</label>
                <input
                  type="time"
                  name="start_time"
                  value={bulkEditValues.start_time}
                  onChange={handleBulkEditValueChange}
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>End Time</label>
                <input
                  type="time"
                  name="end_time"
                  value={bulkEditValues.end_time}
                  onChange={handleBulkEditValueChange}
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Position</label>
                <input
                  type="text"
                  name="position"
                  value={bulkEditValues.position}
                  onChange={handleBulkEditValueChange}
                  placeholder="Leave blank to keep unchanged"
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setBulkEditModal(null)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkEditSubmit}
                  className="btn btn-success"
                  style={{ padding: '8px 16px' }}
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default EventDetails;
