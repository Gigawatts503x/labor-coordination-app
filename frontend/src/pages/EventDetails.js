import React, { useEffect, useState } from 'react';
import { 
  getEvent, 
  getTechnicians, 
  bulkUpdateAssignments, 
  deleteEvent, 
  api,
  getEventRequirementsWithCoverage,
  createEventRequirement,
  deleteRequirement,
  updateAssignment
} from '../utils/api';
import { useAssignments } from '../hooks/useAssignments';
import EditableCell from '../components/EditableCell';
import EditableSelectCell from '../components/EditableSelectCell';
import '../styles/EventDetails.css';
import '../styles/table-dark-mode.css'; // ADD THIS
import '../styles/requirements-table.css';
import '../styles/requirements-form.css';
import '../styles/assignments-table.css';


const RATETYPE = ['hourly', 'half-day', 'full-day'];
const BULK_EDIT_FIELDS = ['assignment_date', 'start_time', 'end_time', 'position'];


const EventDetails = ({ eventId, onBack }) => {
  // ==========================================
  // STATE - Event & Technicians
  // ==========================================
  const [event, setEvent] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [error, setError] = useState(null);

  // ==========================================
  // STATE - Assignments (from hook)
  // ==========================================
  const {
    assignments,
    loading: loadingAssignments,
    addAssignment,
    removeAssignment,
    refreshAssignments
  } = useAssignments(eventId);

  // ==========================================
  // STATE - Requirements
  // ==========================================
  const [requirements, setRequirements] = useState([]);
  const [loadingRequirements, setLoadingRequirements] = useState(false);
  const [reqError, setReqError] = useState(null);
  const [reqForm, setReqForm] = useState({
    requirementdate: '',
    roomorlocation: '',
    settime: '',
    starttime: '',
    endtime: '',
    striketime: '',
    position: '',
    techsneeded: 1
  });

  // ==========================================
  // STATE - Assignment Form
  // ==========================================
  const [formData, setFormData] = useState({
    technicianid: '',
    position: '',
    hoursworked: '',
    ratetype: 'hourly',
    assignmentdate: '',
    starttime: '',
    endtime: '',
    requirementid: ''
  });

  // ==========================================
  // STATE - Bulk Edit & Modals
  // ==========================================
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [bulkEditModal, setBulkEditModal] = useState(null);
  const [bulkEditValues, setBulkEditValues] = useState({
    assignment_date: '',
    start_time: '',
    end_time: '',
    position: ''
  });
  const [settingsModal, setSettingsModal] = useState(false);
  const [settings, setSettings] = useState({
    halfday_hours: 5,
    fullday_hours: 10,
    ot_threshold: 10,
    dot_threshold: 20,
    dot_start_hour: 20,
    tech_base_rate: 50,
    customer_base_rate: 75
  });

  // ==========================================
  // EFFECTS
  // ==========================================
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingEvent(true);
        setLoadingRequirements(true);
        const [eventRes, techRes, reqRes, settingsRes] = await Promise.all([
          getEvent(eventId),
          getTechnicians(),
          getEventRequirementsWithCoverage(eventId),
          api.get('/settings').catch(() => null)
        ]);
        setEvent(eventRes.data);
        setTechnicians(techRes.data);
        setRequirements(reqRes.data);
        if (settingsRes) {
          setSettings(settingsRes.data);
        }
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

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // ==========================================
  // HANDLERS - Form Changes
  // ==========================================
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]:
        name === 'hoursworked'
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
        name === 'techsneeded'
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

  // ==========================================
  // HANDLERS - Inline Editing
  // ==========================================
  const handleInlineEditSave = async (assignmentId, field, value) => {
    try {
      console.log(`💾 Saving ${field}:`, value, 'for assignment:', assignmentId);

      const assignment = assignments.find(a => a.id === assignmentId);
      if (assignment && assignment[field] === value) {
        console.log('No change detected, skipping update');
        return;
      }

      await updateAssignment(assignmentId, {
        [field]: value || null
      });

      console.log('✅ Update successful');
      await refreshAssignments();
    } catch (err) {
      console.error('❌ Error saving assignment:', err);
      alert(`Failed to save ${field}: ${err.message}`);
    }
  };

  // ==========================================
  // HANDLERS - Assignment Operations
  // ==========================================
  const handleAddAssignment = async (e) => {
    e.preventDefault();
    if (!formData.technicianid || !formData.ratetype) return;

    // Check for scheduling conflicts
    const selectedTech = formData.technicianid;
    const assignmentDate = formData.assignmentdate;
    const startTime = formData.starttime;
    const endTime = formData.endtime;

    if (assignmentDate && startTime && endTime) {
      const conflict = assignments.some(a => {
        if (a.technician_id !== selectedTech || a.assignment_date !== assignmentDate) {
          return false;
        }
        const existingStart = a.start_time;
        const existingEnd = a.end_time;
        return (startTime < existingEnd && endTime > existingStart);
      });

      if (conflict) {
        alert(`❌ Conflict! This tech is already scheduled during this time slot on ${assignmentDate}`);
        return;
      }
    }

    const hours = parseFloat(formData.hoursworked || 0);
    const tech = technicians.find(t => t.id === formData.technicianid);

    const data = {
      technician_id: formData.technicianid,
      position: formData.position || (tech ? tech.position : null),
      hours_worked: hours,
      rate_type: formData.ratetype,
      calculated_pay: 0,
      customer_bill: 0,
      assignment_date: formData.assignmentdate || null,
      start_time: formData.starttime || null,
      end_time: formData.endtime || null,
      requirement_id: formData.requirementid || null
    };

    try {
      await addAssignment(data);
      setFormData({
        technicianid: '',
        position: '',
        hoursworked: '',
        ratetype: 'hourly',
        assignmentdate: '',
        starttime: '',
        endtime: '',
        requirementid: ''
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

  const handleDeleteEvent = async () => {
    if (!window.confirm('Are you sure you want to delete this entire event? This cannot be undone.')) {
      return;
    }
    try {
      await deleteEvent(eventId);
      alert('Event deleted successfully');
      onBack();
    } catch (err) {
      console.error('Failed to delete event:', err);
      alert(`Failed to delete event: ${err.message}`);
    }
  };

  // ==========================================
  // HANDLERS - Bulk Edit
  // ==========================================
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
      await bulkUpdateAssignments(
        eventId,
        bulkEditModal.assignmentIds,
        updates
      );
      console.log('✅ BULK UPDATE SUCCESS');
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

  // ==========================================
  // HANDLERS - Requirements
  // ==========================================
  const handleAddRequirement = async (e) => {
    e.preventDefault();

    if (
      !reqForm.requirementdate ||
      !reqForm.roomorlocation ||
      !reqForm.starttime ||
      !reqForm.endtime
    ) {
      return;
    }

    try {
      const res = await createEventRequirement(eventId, {
        requirement_date: reqForm.requirementdate,
        room_or_location: reqForm.roomorlocation,
        set_time: reqForm.settime,
        start_time: reqForm.starttime,
        end_time: reqForm.endtime,
        strike_time: reqForm.striketime,
        position: reqForm.position || null,
        techs_needed: reqForm.techsneeded || 1
      });
      setRequirements([...requirements, res.data]);
      setReqForm({
        requirementdate: reqForm.requirementdate,
        roomorlocation: reqForm.roomorlocation,
        settime: reqForm.settime,
        starttime: reqForm.starttime,
        endtime: reqForm.endtime,
        striketime: reqForm.striketime,
        position: '',
        techsneeded: 1
      });
    } catch (err) {
      console.error('Error creating requirement:', err);
      setReqError(err.message);
    }
  };

  const handleSelectRequirement = (requirement) => {
    setFormData({
      technicianid: '',
      position: requirement.position || '',
      hoursworked: requirement.techs_needed || '',
      ratetype: 'full-day',
      assignmentdate: requirement.requirement_date || '',
      starttime: requirement.set_time || '',
      endtime: requirement.strike_time || '',
      requirementid: requirement.id
    });
    document.querySelector('.assignment-form')?.scrollIntoView({ behavior: 'smooth' });
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

  // ==========================================
  // CALCULATIONS
  // ==========================================
  const totalPay = assignments.reduce((sum, a) => sum + (a.calculated_pay || 0), 0);
  const totalBill = assignments.reduce((sum, a) => sum + (a.customer_bill || 0), 0);

  // ==========================================
  // LOADING STATES
  // ==========================================
  if (loadingEvent) return <div>Loading event...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!event) return <div>Event not found</div>;

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="event-details">
      {/* Header with Back & Delete buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={onBack} className="btn btn-back">
          ← Back
        </button>
        <button onClick={handleDeleteEvent} className="btn btn-delete">
          🗑️ Delete Event
        </button>
      </div>

      {/* Event Info */}
      <div className="event-header">
        <h1>{event.name}</h1>
        <p className="client-name">{event.client_name}</p>
        <button
          onClick={() => setSettingsModal(true)}
          className="btn btn-secondary"
          style={{ float: 'right', marginTop: '-40px' }}
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Requirements Section */}
      <div className="section">
        <h2>Requirements</h2>

        <form onSubmit={handleAddRequirement} className="requirement-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="requirementdate">Date</label>
              <input
                type="date"
                id="requirementdate"
                name="requirementdate"
                value={reqForm.requirementdate}
                onChange={handleReqFormChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="roomorlocation">Room/Location</label>
              <input
                type="text"
                id="roomorlocation"
                name="roomorlocation"
                value={reqForm.roomorlocation}
                onChange={handleReqFormChange}
                placeholder="e.g., Ballroom A"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="settime">Set Time</label>
              <input
                type="time"
                id="settime"
                name="settime"
                value={reqForm.settime}
                onChange={handleReqFormChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="starttime">Start Time</label>
              <input
                type="time"
                id="starttime"
                name="starttime"
                value={reqForm.starttime}
                onChange={handleReqFormChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endtime">End Time</label>
              <input
                type="time"
                id="endtime"
                name="endtime"
                value={reqForm.endtime}
                onChange={handleReqFormChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="striketime">Strike Time</label>
              <input
                type="time"
                id="striketime"
                name="striketime"
                value={reqForm.striketime}
                onChange={handleReqFormChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="position">Position</label>
              <input
                type="text"
                id="position"
                name="position"
                value={reqForm.position}
                onChange={handleReqFormChange}
                placeholder="e.g., A1, Cam Op"
              />
            </div>

            <div className="form-group">
              <label htmlFor="techsneeded">Techs Needed</label>
              <input
                type="number"
                id="techsneeded"
                name="techsneeded"
                value={reqForm.techsneeded}
                onChange={handleReqFormChange}
                min="1"
              />
            </div>

            <div className="form-group">
              <button type="submit" className="btn btn-success" style={{ marginTop: '24px' }}>
                Add Requirement
              </button>
            </div>
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
                const assignedNames =
                  typeof r.assigned_techs === 'string'
                    ? r.assigned_techs
                    : Array.isArray(r.assigned_techs)
                    ? r.assigned_techs.map(t => t.name).join(', ')
                    : '—';

                return (
                  <tr
                    key={r.id}
                    onClick={() => handleSelectRequirement(r)}
                    style={{ cursor: 'pointer' }}
                  >
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

        <form onSubmit={handleAddAssignment} className="assignment-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="technicianid">Technician</label>
              <select
                id="technicianid"
                name="technicianid"
                value={formData.technicianid}
                onChange={handleFormChange}
                required
              >
                <option value="">-- Select Technician --</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.position || 'No position'})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="position">Position</label>
              <input
                type="text"
                id="position"
                name="position"
                value={formData.position}
                onChange={handleFormChange}
                placeholder="Leave blank for tech's primary position"
              />
            </div>

            <div className="form-group">
              <label htmlFor="hoursworked">Hours / Days</label>
              <input
                type="number"
                id="hoursworked"
                name="hoursworked"
                step="0.25"
                min="0"
                value={formData.hoursworked}
                onChange={handleFormChange}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ratetype">Rate Type</label>
              <select
                id="ratetype"
                name="ratetype"
                value={formData.ratetype}
                onChange={handleFormChange}
                required
              >
                {RATETYPE.map(rt => (
                  <option key={rt} value={rt}>
                    {rt}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="assignmentdate">Date</label>
              <input
                type="date"
                id="assignmentdate"
                name="assignmentdate"
                value={formData.assignmentdate}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="starttime">Start Time</label>
              <input
                type="time"
                id="starttime"
                name="starttime"
                value={formData.starttime}
                onChange={handleFormChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="endtime">End Time</label>
              <input
                type="time"
                id="endtime"
                name="endtime"
                value={formData.endtime}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="requirementid">Requirement (optional)</label>
              <select
                id="requirementid"
                name="requirementid"
                value={formData.requirementid}
                onChange={handleFormChange}
              >
                <option value="">-- Requirement (optional) --</option>
                {requirements.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.requirement_date} - {r.room_or_location} ({r.position}) {r.techs_needed} needed
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <button type="submit" className="btn btn-success" style={{ marginTop: '24px' }}>
                Add Assignment
              </button>
            </div>
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
                <button onClick={handleBulkEditSubmit} className="btn btn-primary">
                  Apply Changes
                </button>
                <button onClick={() => setBulkEditModal(null)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assignments Table */}
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

                  <td>
                    <EditableSelectCell
                      value={a.rate_type || 'hourly'}
                      options={RATETYPE}
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

        {/* Summary */}
        <div className="assignments-summary">
          <p>
            <strong>Total Tech Pay:</strong> ${totalPay.toFixed(2)}
          </p>
          <p>
            <strong>Total Customer Bill:</strong> ${totalBill.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Settings Modal */}
      {settingsModal && (
        <div className="modal-overlay" onClick={() => setSettingsModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Company Settings</h3>
            <div className="settings-form">
              <div className="form-group">
                <label>Half-Day Hours</label>
                <input
                  type="number"
                  value={settings.halfday_hours}
                  onChange={(e) =>
                    setSettings({ ...settings, halfday_hours: parseInt(e.target.value) })
                  }
                />
              </div>

              <div className="form-group">
                <label>Full-Day Hours</label>
                <input
                  type="number"
                  value={settings.fullday_hours}
                  onChange={(e) =>
                    setSettings({ ...settings, fullday_hours: parseInt(e.target.value) })
                  }
                />
              </div>

              <div className="form-group">
                <label>OT Threshold (hours)</label>
                <input
                  type="number"
                  value={settings.ot_threshold}
                  onChange={(e) =>
                    setSettings({ ...settings, ot_threshold: parseInt(e.target.value) })
                  }
                />
              </div>

              <div className="form-group">
                <label>DOT Threshold (hours)</label>
                <input
                  type="number"
                  value={settings.dot_threshold}
                  onChange={(e) =>
                    setSettings({ ...settings, dot_threshold: parseInt(e.target.value) })
                  }
                />
              </div>

              <div className="form-group">
                <label>DOT Start Hour (24-hour format, e.g., 20 = 8pm)</label>
                <input
                  type="number"
                  value={settings.dot_start_hour}
                  min="0"
                  max="23"
                  onChange={(e) =>
                    setSettings({ ...settings, dot_start_hour: parseInt(e.target.value) })
                  }
                />
              </div>

              <div className="form-group">
                <label>Default Tech Base Rate</label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.tech_base_rate}
                  onChange={(e) =>
                    setSettings({ ...settings, tech_base_rate: parseFloat(e.target.value) })
                  }
                />
              </div>

              <div className="form-group">
                <label>Default Customer Base Rate</label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.customer_base_rate}
                  onChange={(e) =>
                    setSettings({ ...settings, customer_base_rate: parseFloat(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="modal-buttons">
              <button
                onClick={async () => {
                  try {
                    await api.put('/settings', settings);
                    alert('✅ Settings saved!');
                    setSettingsModal(false);
                  } catch (err) {
                    alert(`Failed to save: ${err.message}`);
                  }
                }}
                className="btn btn-primary"
              >
                Save Settings
              </button>
              <button
                onClick={() => setSettingsModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;
