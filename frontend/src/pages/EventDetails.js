import React, { useEffect, useState } from 'react';
import { 
  getEvent, 
  getTechnicians,
  patchAssignment,
  api
} from '../utils/api';
import { useAssignments } from '../hooks/useAssignments';
import { useRequirements } from '../hooks/useRequirements';
import { calculateAssignmentMetrics } from '../utils/rateCalculator';
import '../styles/EventDetails.css';
import '../styles/table-dark-mode.css';
import '../styles/requirements-table.css';
import '../styles/requirements-form.css';
import '../styles/assignments-table.css';

const RATE_TYPE = ['hourly', 'half-day', 'full-day'];

const EventDetails = ({ eventId, onBack }) => {
  // ========================================
  // STATE - Event & Technicians
  // ========================================
  const [event, setEvent] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [error, setError] = useState(null);

  // ========================================
  // STATE - Assignments
  // ========================================
  const { 
    assignments: hookAssignments, 
    loading: loadingAssignments, 
    addAssignment, 
    removeAssignment, 
    refreshAssignments 
  } = useAssignments(eventId);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    setAssignments(hookAssignments);
  }, [hookAssignments]);

  // ========================================
  // STATE - Requirements
  // ========================================
  const { 
    requirements, 
    loading: loadingRequirements,
    addRequirement,
    removeRequirement 
  } = useRequirements(eventId);

  const [reqForm, setReqForm] = useState({
    requirement_date: '',
    requirement_end_date: '',
    room_or_location: '',
    set_time: '',
    start_time: '',
    end_time: '',
    strike_time: '',
    position: '',
    techs_needed: 1
  });

  // ========================================
  // STATE - Settings Modal
  // ========================================
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    ot_ratio: 1.5,
    dot_ratio: 2.0,
    dot_start_hour: 20,
    halfday_hours: 5,
    fullday_hours: 10,
    customer_hourly_rate: 75,
    customer_day_rate: 450
  });

  // ========================================
  // STATE - Assignment Form
  // ========================================
  const [formData, setFormData] = useState({
    technician_id: '',
    assignment_date: '',
    start_time: '',
    end_time: '',
    end_date: '',
    position: '',
    room_or_location: '',
    rate_type: 'hourly',
    requirement_id: ''
  });

  // ========================================
  // STATE - Edit Mode & Conflict Detection
  // ========================================
  const [editingCell, setEditingCell] = useState(null);
  const [conflictWarning, setConflictWarning] = useState(null);

  // ========================================
  // EFFECTS
  // ========================================
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingEvent(true);
        const [eventRes, techRes] = await Promise.all([
          getEvent(eventId),
          getTechnicians()
        ]);
        setEvent(eventRes.data);
        setTechnicians(techRes.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingEvent(false);
      }
    };
    if (eventId) load();
  }, [eventId]);

  // ========================================
  // HANDLERS - Settings
  // ========================================
  const handleSettingChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  // ========================================
  // HANDLERS - Requirements
  // ========================================
  const handleReqFormChange = (e) => {
    const { name, value } = e.target;
    setReqForm(prev => ({
      ...prev,
      [name]: name === 'techs_needed' ? (value === '' ? '' : parseInt(value, 10)) : value
    }));
  };

  const handleAddRequirement = async (e) => {
    e.preventDefault();
    if (!reqForm.requirement_date || !reqForm.room_or_location || !reqForm.start_time || !reqForm.end_time) {
      alert('Please fill in required fields');
      return;
    }
    try {
      await addRequirement(reqForm);
      setReqForm({
        requirement_date: '',
        requirement_end_date: '',
        room_or_location: '',
        set_time: '',
        start_time: '',
        end_time: '',
        strike_time: '',
        position: '',
        techs_needed: 1
      });
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteRequirement = async (id) => {
    if (!window.confirm('Delete this requirement?')) return;
    try {
      await removeRequirement(id);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // ========================================
  // HANDLERS - Assign from Requirement
  // ========================================
  const handleAssignFromRequirement = (requirement) => {
    setConflictWarning(null);
    setFormData({
      technician_id: '',
      assignment_date: requirement.requirement_date || '',
      start_time: requirement.start_time || '',
      end_time: requirement.end_time || '',
      end_date: requirement.requirement_date || '',
      position: requirement.position || '',
      room_or_location: requirement.room_or_location || '',
      rate_type: 'hourly',
      requirement_id: requirement.id || ''
    });
  };

  // ========================================
  // HANDLERS - Assignment Form
  // ========================================
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'assignment_date') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        end_date: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const checkTechConflict = (techId, date, startTime, endTime) => {
    if (!techId || !date || !startTime || !endTime) return null;

    const conflicting = assignments.find(assignment => {
      if (assignment.technician_id !== parseInt(techId)) return false;
      if (assignment.assignment_date !== date) return false;

      const existStart = assignment.start_time;
      const existEnd = assignment.end_time;

      const newStartMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
      const newEndMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
      const existStartMinutes = parseInt(existStart.split(':')[0]) * 60 + parseInt(existStart.split(':')[1]);
      const existEndMinutes = parseInt(existEnd.split(':')[0]) * 60 + parseInt(existEnd.split(':')[1]);

      if (newEndMinutes < newStartMinutes) newEndMinutes += 24 * 60;
      if (existEndMinutes < existStartMinutes) existEndMinutes += 24 * 60;

      return !(newEndMinutes <= existStartMinutes || newStartMinutes >= existEndMinutes);
    });

    return conflicting;
  };

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    
    if (!formData.technician_id || !formData.rate_type) {
      alert('Please select a technician and rate type');
      return;
    }

    const conflict = checkTechConflict(
      formData.technician_id,
      formData.assignment_date,
      formData.start_time,
      formData.end_time
    );

    if (conflict) {
      const tech = technicians.find(t => t.id === parseInt(formData.technician_id));
      setConflictWarning(
        `${tech?.name} is already scheduled from ${conflict.start_time} to ${conflict.end_time} on ${conflict.assignment_date}`
      );
      return;
    }

    try {
      const data = {
        technician_id: formData.technician_id,
        position: formData.position || '',
        room_or_location: formData.room_or_location || '',
        assignment_date: formData.assignment_date || null,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        rate_type: formData.rate_type,
        requirement_id: formData.requirement_id || null
      };

      await addAssignment(data);
      await refreshAssignments();

      setFormData({
        technician_id: '',
        assignment_date: '',
        start_time: '',
        end_time: '',
        end_date: '',
        position: '',
        room_or_location: '',
        rate_type: 'hourly',
        requirement_id: ''
      });
      setConflictWarning(null);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Remove this assignment?')) return;
    try {
      await removeAssignment(id);
      await refreshAssignments();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // ========================================
  // HANDLERS - Inline Edits
  // ========================================
  const handleCellDoubleClick = (assignmentId, fieldName) => {
    setEditingCell(`${assignmentId}-${fieldName}`);
  };

  const handleCellBlur = async (assignmentId, fieldName, value) => {
    setEditingCell(null);

    try {
      await patchAssignment(assignmentId, { [fieldName]: value || null });
      await refreshAssignments();
    } catch (err) {
      alert(`Error updating ${fieldName}: ${err.message}`);
      await refreshAssignments();
    }
  };

  const handleCellChange = (e, assignmentId, fieldName) => {
    const value = e.target.value;
    setAssignments(prev =>
      prev.map(a => a.id === assignmentId ? { ...a, [fieldName]: value } : a)
    );
  };

  // ========================================
  // CALCULATIONS
  // ========================================
  const getTechRates = (techId) => {
    const tech = technicians.find(t => t.id === techId);
    return {
      day_rate: tech?.day_rate || 450,
      hourly_rate: tech?.hourly_rate || 50,
      half_day_rate: tech?.half_day_rate || 300,
      full_day_rate: tech?.full_day_rate || 450
    };
  };

  const calculateAssignmentMetricsWithTech = (assignment) => {
    const techRates = getTechRates(assignment.technician_id);
    return calculateAssignmentMetrics(assignment, settings, techRates);
  };

  const calculateTotals = () => {
    let totalTechPay = 0;
    let totalCustomerBill = 0;
    let totalHours = 0;

    assignments.forEach(assignment => {
      const metrics = calculateAssignmentMetricsWithTech(assignment);
      totalTechPay += metrics.tech_pay;
      totalCustomerBill += metrics.customer_bill;
      totalHours += metrics.hours_worked;
    });

    return {
      totalTechPay: parseFloat(totalTechPay.toFixed(2)),
      totalCustomerBill: parseFloat(totalCustomerBill.toFixed(2)),
      totalHours: parseFloat(totalHours.toFixed(2))
    };
  };

  const totals = calculateTotals();

  // ========================================
  // COVERAGE CALCULATION
  // ========================================
  const calculateCoverage = (requirement) => {
    const assignedCount = assignments.filter(a => a.requirement_id === requirement.id).length;
    const needed = requirement.techs_needed || 1;
    return {
      assigned: assignedCount,
      needed: needed,
      isFull: assignedCount >= needed,
      text: `${assignedCount}/${needed}`
    };
  };

  // ========================================
  // RENDER - Table Cell
  // ========================================
  const renderEditableCell = (assignment, fieldName, type = 'text') => {
    const isEditing = editingCell === `${assignment.id}-${fieldName}`;
    const value = assignment[fieldName] || '';

    if (isEditing) {
      if (type === 'select') {
        return (
          <select
            autoFocus
            value={value}
            onChange={(e) => handleCellChange(e, assignment.id, fieldName)}
            onBlur={(e) => handleCellBlur(assignment.id, fieldName, e.target.value)}
          >
            <option value="">--Select--</option>
            {technicians.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        );
      } else if (type === 'rate-type') {
        return (
          <select
            autoFocus
            value={value}
            onChange={(e) => handleCellChange(e, assignment.id, fieldName)}
            onBlur={(e) => handleCellBlur(assignment.id, fieldName, e.target.value)}
          >
            {RATE_TYPE.map(rt => (
              <option key={rt} value={rt}>{rt}</option>
            ))}
          </select>
        );
      } else if (type === 'date') {
        return (
          <input
            autoFocus
            type="date"
            value={value}
            onChange={(e) => handleCellChange(e, assignment.id, fieldName)}
            onBlur={(e) => handleCellBlur(assignment.id, fieldName, e.target.value)}
          />
        );
      } else if (type === 'time') {
        return (
          <input
            autoFocus
            type="time"
            value={value}
            onChange={(e) => handleCellChange(e, assignment.id, fieldName)}
            onBlur={(e) => handleCellBlur(assignment.id, fieldName, e.target.value)}
          />
        );
      } else {
        return (
          <input
            autoFocus
            type={type}
            value={value}
            onChange={(e) => handleCellChange(e, assignment.id, fieldName)}
            onBlur={(e) => handleCellBlur(assignment.id, fieldName, e.target.value)}
          />
        );
      }
    } else {
      const displayValue = 
        type === 'select' ? technicians.find(t => t.id === value)?.name || '—' :
        type === 'rate-type' ? value || '—' :
        value || '—';

      return (
        <span
          onDoubleClick={() => handleCellDoubleClick(assignment.id, fieldName)}
          style={{ cursor: 'pointer', padding: '4px' }}
        >
          {displayValue}
        </span>
      );
    }
  };

  // ========================================
  // LOADING & ERROR STATES
  // ========================================
  if (loadingEvent) return <div className="loading">Loading event...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!event) return <div className="error">Event not found.</div>;

  return (
    <div className="event-details">
      <button className="back-button" onClick={onBack}>← Back to Events</button>

      {/* ========== EVENT HEADER ========== */}
      <header className="event-header">
        <div>
          <h1>{event.name}</h1>
          <p><strong>Client:</strong> {event.client_name}</p>
          <p><strong>Contact:</strong> {event.client_contact}</p>
          <p><strong>Phone:</strong> {event.client_phone}</p>
          <p><strong>Email:</strong> {event.client_email}</p>
          <p><strong>Address:</strong> {event.client_address}</p>
          <p><strong>PO#:</strong> {event.po_number}</p>
        </div>
        <div className="event-summary">
          <h3>Totals</h3>
          <p><strong>Total Hours:</strong> {totals.totalHours}</p>
          <p><strong>Tech Pay:</strong> ${totals.totalTechPay.toFixed(2)}</p>
          <p><strong>Customer Bill:</strong> ${totals.totalCustomerBill.toFixed(2)}</p>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowSettings(!showSettings)}
          >
            {showSettings ? 'Hide Settings' : 'Show Settings'}
          </button>
        </div>
      </header>

      {/* ========== SETTINGS MODAL ========== */}
      {showSettings && (
        <section className="settings-modal">
          <h2>Event Settings</h2>
          <div className="settings-grid">
            <div className="setting-item">
              <label>OT Ratio (multiplier)</label>
              <input 
                type="number" 
                step="0.1" 
                value={settings.ot_ratio}
                onChange={(e) => handleSettingChange('ot_ratio', e.target.value)}
              />
              <small>Default: 1.5x</small>
            </div>

            <div className="setting-item">
              <label>DOT Ratio (multiplier)</label>
              <input 
                type="number" 
                step="0.1" 
                value={settings.dot_ratio}
                onChange={(e) => handleSettingChange('dot_ratio', e.target.value)}
              />
              <small>Default: 2.0x</small>
            </div>

            <div className="setting-item">
              <label>DOT Start Hour (24-hour format)</label>
              <input 
                type="number" 
                min="0" 
                max="23" 
                value={settings.dot_start_hour}
                onChange={(e) => handleSettingChange('dot_start_hour', e.target.value)}
              />
              <small>Default: 20 (8:00 PM)</small>
            </div>

            <div className="setting-item">
              <label>Half-Day Hours</label>
              <input 
                type="number" 
                step="0.5" 
                value={settings.halfday_hours}
                onChange={(e) => handleSettingChange('halfday_hours', e.target.value)}
              />
              <small>Default: 5 hours</small>
            </div>

            <div className="setting-item">
              <label>Full-Day Hours</label>
              <input 
                type="number" 
                step="0.5" 
                value={settings.fullday_hours}
                onChange={(e) => handleSettingChange('fullday_hours', e.target.value)}
              />
              <small>Default: 10 hours</small>
            </div>

            <div className="setting-item">
              <label>Customer Hourly Rate</label>
              <input 
                type="number" 
                step="0.01" 
                value={settings.customer_hourly_rate}
                onChange={(e) => handleSettingChange('customer_hourly_rate', e.target.value)}
              />
              <small>Default: $75/hr</small>
            </div>

            <div className="setting-item">
              <label>Customer Day Rate</label>
              <input 
                type="number" 
                step="0.01" 
                value={settings.customer_day_rate}
                onChange={(e) => handleSettingChange('customer_day_rate', e.target.value)}
              />
              <small>Default: $450/day</small>
            </div>
          </div>
        </section>
      )}

      {/* ========== REQUIREMENTS SECTION ========== */}
      <section className="requirements-section">
        <h2>Requirements</h2>
        
        <form className="requirement-form" onSubmit={handleAddRequirement}>
          <h3>Add Requirement</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input 
                type="date" 
                name="requirement_date" 
                value={reqForm.requirement_date}
                onChange={handleReqFormChange}
                required
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input 
                type="date" 
                name="requirement_end_date" 
                value={reqForm.requirement_end_date}
                onChange={handleReqFormChange}
              />
            </div>
            <div className="form-group">
              <label>Room/Location</label>
              <input 
                type="text" 
                name="room_or_location" 
                placeholder="e.g., Ball A, Room 101"
                value={reqForm.room_or_location}
                onChange={handleReqFormChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Set Time</label>
              <input 
                type="time" 
                name="set_time" 
                value={reqForm.set_time}
                onChange={handleReqFormChange}
              />
            </div>
            <div className="form-group">
              <label>Start Time</label>
              <input 
                type="time" 
                name="start_time" 
                value={reqForm.start_time}
                onChange={handleReqFormChange}
                required
              />
            </div>
            <div className="form-group">
              <label>End Time</label>
              <input 
                type="time" 
                name="end_time" 
                value={reqForm.end_time}
                onChange={handleReqFormChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Strike Time</label>
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
                placeholder="e.g., A1, A2"
                value={reqForm.position}
                onChange={handleReqFormChange}
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

          <button type="submit" className="btn btn-success">Add Requirement</button>
        </form>

        {loadingRequirements ? (
          <p>Loading requirements...</p>
        ) : requirements.length === 0 ? (
          <p className="empty-state">No requirements yet.</p>
        ) : (
          <div className="table-container">
            <table className="requirements-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>End Date</th>
                  <th>Room</th>
                  <th>Set</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Strike</th>
                  <th>Position</th>
                  <th>Coverage</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map(req => {
                  const coverage = calculateCoverage(req);
                  return (
                    <tr key={req.id}>
                      <td>{req.requirement_date || '—'}</td>
                      <td>{req.requirement_end_date || '—'}</td>
                      <td>{req.room_or_location || '—'}</td>
                      <td>{req.set_time || '—'}</td>
                      <td>{req.start_time || '—'}</td>
                      <td>{req.end_time || '—'}</td>
                      <td>{req.strike_time || '—'}</td>
                      <td>{req.position || '—'}</td>
                      <td>
                        <span className={`coverage-badge ${coverage.isFull ? 'full' : 'partial'}`}>
                          {coverage.text}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-small btn-primary"
                          onClick={() => handleAssignFromRequirement(req)}
                        >
                          Assign
                        </button>
                        <button 
                          className="btn btn-small btn-delete"
                          onClick={() => handleDeleteRequirement(req.id)}
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

      {/* ========== ASSIGNMENTS SECTION ========== */}
      <section className="assignments-section">
        <h2>Assignments</h2>
        
        {conflictWarning && (
          <div className="conflict-warning">
            ⚠️ {conflictWarning}
          </div>
        )}

        <form className="assignment-form" onSubmit={handleAddAssignment}>
          <h3>Add Assignment</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Technician *</label>
              <select 
                name="technician_id" 
                value={formData.technician_id}
                onChange={handleFormChange}
                required
              >
                <option value="">-- Select --</option>
                {technicians.map(tech => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name} ({tech.position || 'No position'})
                  </option>
                ))}
              </select>
            </div>

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

          <div className="form-row">
            <div className="form-group">
              <label>Position</label>
              <input 
                type="text" 
                name="position" 
                placeholder="e.g., A1, A2, Gaffer"
                value={formData.position}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-group">
              <label>Room/Location</label>
              <input 
                type="text" 
                name="room_or_location" 
                placeholder="e.g., Main Stage"
                value={formData.room_or_location}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-group">
              <label>Rate Type</label>
              <select 
                name="rate_type" 
                value={formData.rate_type}
                onChange={handleFormChange}
              >
                {RATE_TYPE.map(rt => (
                  <option key={rt} value={rt}>{rt}</option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-success">Add Assignment</button>
        </form>

        {loadingAssignments ? (
          <p>Loading assignments...</p>
        ) : assignments.length === 0 ? (
          <p className="empty-state">No assignments yet.</p>
        ) : (
          <div className="table-container">
            <table className="assignments-table">
              <thead>
                <tr>
                  <th>Tech</th>
                  <th>Start Date</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>End Date</th>
                  <th>Position</th>
                  <th>Room</th>
                  <th>Hours</th>
                  <th>Rate Type</th>
                  <th>Day Rate Hrs</th>
                  <th>OT Calc</th>
                  <th>DOT Calc</th>
                  <th>Tech Pay</th>
                  <th>Customer Bill</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(assignment => {
                  const metrics = calculateAssignmentMetricsWithTech(assignment);
                  const tech = technicians.find(t => t.id === assignment.technician_id);

                  return (
                    <tr key={assignment.id}>
                      <td>
                        {renderEditableCell(assignment, 'technician_id', 'select')}
                      </td>

                      <td>
                        {renderEditableCell(assignment, 'assignment_date', 'date')}
                      </td>

                      <td>
                        {renderEditableCell(assignment, 'start_time', 'time')}
                      </td>

                      <td>
                        {renderEditableCell(assignment, 'end_time', 'time')}
                      </td>

                      <td>{assignment.assignment_date || '—'}</td>

                      <td>
                        {renderEditableCell(assignment, 'position', 'text')}
                      </td>

                      <td>
                        {renderEditableCell(assignment, 'room_or_location', 'text')}
                      </td>

                      <td>{metrics.hours_worked}</td>

                      <td>
                        {renderEditableCell(assignment, 'rate_type', 'rate-type')}
                      </td>

                      <td>{metrics.day_rate_hours}</td>

                      <td>{metrics.ot_hours} hrs @ {settings.ot_ratio}x</td>

                      <td>{metrics.dot_hours} hrs @ {settings.dot_ratio}x</td>

                      <td>${metrics.tech_pay.toFixed(2)}</td>

                      <td>${metrics.customer_bill.toFixed(2)}</td>

                      <td>
                        <button 
                          className="btn btn-small btn-delete"
                          onClick={() => handleDeleteAssignment(assignment.id)}
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

      {/* ========== FINANCIAL SUMMARY ========== */}
      <section className="financial-summary">
        <h2>Financial Summary</h2>
        <div className="financial-cards">
          <div className="financial-card">
            <h4>Total Hours</h4>
            <p className="value">{totals.totalHours}</p>
          </div>
          <div className="financial-card">
            <h4>Tech Payroll</h4>
            <p className="value">${totals.totalTechPay.toFixed(2)}</p>
          </div>
          <div className="financial-card">
            <h4>Customer Bill</h4>
            <p className="value">${totals.totalCustomerBill.toFixed(2)}</p>
          </div>
          <div className="financial-card profit">
            <h4>Margin</h4>
            <p className="value">${(totals.totalCustomerBill - totals.totalTechPay).toFixed(2)}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EventDetails;