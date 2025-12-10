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
import EditableCell from '../components/EditableCell';
import EditableSelectCell from '../components/EditableSelectCell';
import { updateAssignment } from '../utils/api';

const RATE_TYPES = ['hourly', 'half-day', 'full-day'];
const BULK_EDIT_FIELDS = ['assignment_date', 'start_time', 'end_time', 'position'];

const EventDetails = ({ eventId, onBack }) => {
  const [event, setEvent] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [error, setError] = useState(null);

  // ✅ FIX: Get assignments from the hook FIRST (line 26-29)
  const {
    assignments,
    loading: loadingAssignments,
    addAssignment,
    removeAssignment,
    refreshAssignments
  } = useAssignments(eventId);

  // ✅ FIX: Define handleInlineEditSave AFTER hook that provides assignments (was line 26, now line 31-51)
  const handleInlineEditSave = async (assignmentId, field, value) => {
    try {
      console.log(`💾 Saving ${field}:`, value, 'for assignment:', assignmentId);

      const assignment = assignments.find(a => a.id === assignmentId);
      if (assignment && assignment[field] === value) {
        console.log('No change detected, skipping update');
        return;
      }

      const response = await updateAssignment(assignmentId, {
        [field]: value || null
      });

      console.log('✅ Update successful:', response);

      // Refresh assignments after inline edit
      await refreshAssignments();
    } catch (err) {
      console.error('❌ Error saving assignment:', err);
      alert(`Failed to save ${field}: ${err.message}`);
    }
  };

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
      [name]:
        name === 'hours_worked'
          ? value === ''
            ? ''
            : parseFloat(value) || ''
          : value
    }));
  };

  const handleReqFormChange = (e) => {
    const { name, value } = e.target;
    setReqForm(prev => ({
      ...prev,
      [name]:
        name === 'techs_needed'
          ? value === ''
            ? ''
            : parseInt(value, 10) || 1
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
      setBulkEditModal({
        assignmentIds: contextMenu.assignmentIds
      });
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
      console.log('🔄 BULK UPDATE STARTING', {
        eventId,
        assignmentIds: bulkEditModal.assignmentIds,
        updates
      });
      const response = await bulkUpdateAssignments(
        eventId,
        bulkEditModal.assignmentIds,
        updates
      );
      console.log('✅ BULK UPDATE SUCCESS:', response);
      await refreshAssignments();
      setBulkEditModal(null);
      setSelectedAssignmentIds([]);
      alert('✅ Assignments updated!');
    } catch (err) {
      console.error('❌ BULK UPDATE ERROR:', err);
      alert(`Failed: ${err.message}`);
      setBulkEditModal(null);
    }
  };

  // Requirement handlers
  const handleAddRequirement = async (e) => {
    e.preventDefault();
    if (
      !reqForm.requirement_date ||
      !reqForm.room_or_location ||
      !reqForm.start_time ||
      !reqForm.end_time
    )
      return;

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

  if (loadingEvent) return <div>Loading event...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!event) return <div>Event not found</div>;

  return (
    <div className="event-details">
      <button onClick={onBack} className="btn btn-back">
        ← Back
      </button>

      <div className="event-header">
        <h1>{event.name}</h1>
        <p className="client-name">{event.client_name}</p>
      </div>

      {/* Requirements Section */}
      <div className="section">
        <h2>Requirements</h2>

        <form onSubmit={handleAddRequirement} className="req-form">
          <div className="form-row">
            <input
              type="date"
              name="requirement_date"
              value={reqForm.requirement_date}
              onChange={handleReqFormChange}
              placeholder="Date"
              required
            />
            <input
              type="text"
              name="room_or_location"
              value={reqForm.room_or_location}
              onChange={handleReqFormChange}
              placeholder="Room/Location"
              required
            />
            <input
              type="time"
              name="set_time"
              value={reqForm.set_time}
              onChange={handleReqFormChange}
              placeholder="Set Time"
            />
            <input
              type="time"
              name="start_time"
              value={reqForm.start_time}
              onChange={handleReqFormChange}
              placeholder="Start Time"
              required
            />
            <input
              type="time"
              name="end_time"
              value={reqForm.end_time}
              onChange={handleReqFormChange}
              placeholder="End Time"
              required
            />
            <input
              type="time"
              name="strike_time"
              value={reqForm.strike_time}
              onChange={handleReqFormChange}
              placeholder="Strike Time"
            />
            <input
              type="text"
              name="position"
              value={reqForm.position}
              onChange={handleReqFormChange}
              placeholder="Position"
            />
            <input
              type="number"
              name="techs_needed"
              value={reqForm.techs_needed}
              onChange={handleReqFormChange}
              min="1"
              placeholder="Techs Needed"
            />
            <button type="submit" className="btn btn-primary">
              Add Requirement
            </button>
          </div>
        </form>

        {loadingRequirements ? (
          <p>Loading requirements...</p>
        ) : requirements.length === 0 ? (
          <p>No requirements yet for this event.</p>
        ) : (
          <table className="requirements-table">
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
                const assignedCount = r.assigned_count || 0;
                const neededCount = r.techs_needed || 0;
                const coverageStatus =
                  assignedCount >= neededCount ? (
                    <span className="status-success">✓ Full</span>
                  ) : (
                    <span className="status-warning">
                      {assignedCount}/{neededCount}
                    </span>
                  );
                const assignedNames = r.assigned_techs
                  ?.map(t => t.name)
                  .join(', ');

                return (
                  <tr key={r.id}>
                    <td>{r.requirement_date || '—'}</td>
                    <td>{r.room_or_location}</td>
                    <td>{r.set_time || '—'}</td>
                    <td>{r.start_time || '—'}</td>
                    <td>{r.end_time || '—'}</td>
                    <td>{r.strike_time || '—'}</td>
                    <td>{r.position || '—'}</td>
                    <td>{coverageStatus}</td>
                    <td>{assignedNames ? assignedNames : '—'}</td>
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
        )}
        {reqError && <p className="error">{reqError}</p>}
      </div>

      {/* Assignments Section */}
      <div className="section">
        <h2>Assignments</h2>

        <form onSubmit={handleAddAssignment} className="add-assignment-form">
          <div className="form-row">
            <select
              name="technician_id"
              value={formData.technician_id}
              onChange={handleFormChange}
              required
            >
              <option value="">-- Select Technician --</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.position})
                </option>
              ))}
            </select>

            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleFormChange}
              placeholder="Position (optional)"
            />

            <input
              type="number"
              name="hours_worked"
              value={formData.hours_worked}
              onChange={handleFormChange}
              placeholder="Hours"
              step="0.5"
            />

            <select
              name="rate_type"
              value={formData.rate_type}
              onChange={handleFormChange}
              required
            >
              {RATE_TYPES.map(rt => (
                <option key={rt} value={rt}>
                  {rt}
                </option>
              ))}
            </select>

            <input
              type="date"
              name="assignment_date"
              value={formData.assignment_date}
              onChange={handleFormChange}
              placeholder="Date"
            />

            <input
              type="time"
              name="start_time"
              value={formData.start_time}
              onChange={handleFormChange}
              placeholder="Start"
            />

            <input
              type="time"
              name="end_time"
              value={formData.end_time}
              onChange={handleFormChange}
              placeholder="End"
            />

            <select
              name="requirement_id"
              value={formData.requirement_id}
              onChange={handleFormChange}
            >
              <option value="">-- Requirement (optional) --</option>
              {requirements.map(r => (
                <option key={r.id} value={r.id}>
                  {r.requirement_date} - {r.room_or_location}
                </option>
              ))}
            </select>

            <button type="submit" className="btn btn-primary">
              Add Assignment
            </button>
          </div>
        </form>

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button onClick={openBulkEditModal}>📝 Bulk Edit</button>
          </div>
        )}

        {/* Bulk Edit Modal */}
        {bulkEditModal && (
          <div className="modal-overlay" onClick={() => setBulkEditModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Bulk Edit Assignments</h3>
              <div className="bulk-edit-form">
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    name="assignment_date"
                    value={bulkEditValues.assignment_date}
                    onChange={handleBulkEditValueChange}
                  />
                </div>
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    name="start_time"
                    value={bulkEditValues.start_time}
                    onChange={handleBulkEditValueChange}
                  />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    name="end_time"
                    value={bulkEditValues.end_time}
                    onChange={handleBulkEditValueChange}
                  />
                </div>
                <div className="form-group">
                  <label>Position</label>
                  <input
                    type="text"
                    name="position"
                    value={bulkEditValues.position}
                    onChange={handleBulkEditValueChange}
                  />
                </div>
              </div>
              <div className="modal-buttons">
                <button
                  onClick={handleBulkEditSubmit}
                  className="btn btn-primary"
                >
                  Apply Changes
                </button>
                <button
                  onClick={() => setBulkEditModal(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {loadingAssignments ? (
          <p>Loading assignments…</p>
        ) : assignments.length === 0 ? (
          <p>No assignments yet. Add one above.</p>
        ) : (
          <table className="assignments-table">
            <thead>
              <tr>
                <th style={{ width: '30px' }}>
                  <input
                    type="checkbox"
                    checked={
                      selectedAssignmentIds.length === assignments.length &&
                      assignments.length > 0
                    }
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
            
// frontend/src/pages/EventDetails.js - UPDATED TBODY SECTION
            <tbody>
              {assignments.map(a => (
                <tr
                  key={a.id}
                  onContextMenu={e => handleContextMenu(e, a.id)}
                  style={{
                    backgroundColor: selectedAssignmentIds.includes(a.id)
                      ? '#e8f4f8'
                      : 'transparent',
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

                  {/* Date - inline editable */}
                  <td>
                    <EditableCell
                      value={a.assignment_date || ''}
                      type="date"
                      onSave={value =>
                        handleInlineEditSave(a.id, 'assignment_date', value)
                      }
                      displayValue={a.assignment_date || '—'}
                    />
                  </td>

                  {/* Start Time - inline editable */}
                  <td>
                    <EditableCell
                      value={a.start_time || ''}
                      type="time"
                      onSave={value =>
                        handleInlineEditSave(a.id, 'start_time', value)
                      }
                      displayValue={a.start_time || '—'}
                    />
                  </td>

                  {/* End Time - inline editable */}
                  <td>
                    <EditableCell
                      value={a.end_time || ''}
                      type="time"
                      onSave={value =>
                        handleInlineEditSave(a.id, 'end_time', value)
                      }
                      displayValue={a.end_time || '—'}
                    />
                  </td>

                  {/* Position - inline editable */}
                  <td>
                    <EditableCell
                      value={a.position || ''}
                      type="text"
                      onSave={value =>
                        handleInlineEditSave(a.id, 'position', value)
                      }
                      displayValue={a.position || '—'}
                    />
                  </td>

                  {/* Hours Worked - inline editable */}
                  <td>
                    <EditableCell
                      value={a.hours_worked || ''}
                      type="number"
                      onSave={value =>
                        handleInlineEditSave(a.id, 'hours_worked', value)
                      }
                      displayValue={a.hours_worked || '—'}
                    />
                  </td>

                  {/* Rate Type - inline editable select */}
                  <td>
                    <EditableSelectCell
                      value={a.rate_type || 'hourly'}
                      options={RATE_TYPES}
                      onSave={value =>
                        handleInlineEditSave(a.id, 'rate_type', value)
                      }
                      displayValue={a.rate_type || '—'}
                    />
                  </td>

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
        )}

        <div className="assignments-summary">
          <p>
            <strong>Total Tech Pay:</strong> ${totalPay.toFixed(2)}
          </p>
          <p>
            <strong>Total Customer Bill:</strong> ${totalBill.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
