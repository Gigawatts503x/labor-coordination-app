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
  // STATE - Financial Data
  // ==========================================
  const [financialData, setFinancialData] = useState({
    totalTechPayout: 0,
    totalCustomerBilling: 0,
    totalLaborCost: 0,
    profitMargin: 0
  });
  const [breakdownByRateType, setBreakdownByRateType] = useState({});
  const [editingFinancialField, setEditingFinancialField] = useState(null);

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
    setFormData((prev) => ({
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
    setReqForm((prev) => ({
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
    setBulkEditValues((prev) => ({
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
      const assignment = assignments.find((a) => a.id === assignmentId);
      if (assignment && assignment[field] === value) {
        console.log('No change detected, skipping update');
        return;
      }
      await updateAssignment(assignmentId, { [field]: value || null });
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
      const conflict = assignments.some((a) => {
        if (
          a.technician_id !== selectedTech ||
          a.assignment_date !== assignmentDate
        ) {
          return false;
        }
        const existingStart = a.start_time;
        const existingEnd = a.end_time;
        return startTime < existingEnd && endTime > existingStart;
      });

      if (conflict) {
        alert(
          `❌ Conflict! This tech is already scheduled during this time slot on ${assignmentDate}`
        );
        return;
      }
    }

    const hours = parseFloat(formData.hoursworked || 0);
    const tech = technicians.find((t) => t.id === formData.technicianid);
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
    if (
      !window.confirm(
        'Are you sure you want to delete this entire event? This cannot be undone.'
      )
    ) {
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
  // FINANCIAL CALCULATIONS
  // ==========================================
  const calculateFinancialTotals = (assignmentsList) => {
    let totalTechPayout = 0;
    let totalCustomerBill = 0;

    assignmentsList.forEach((assignment) => {
      totalTechPayout += assignment.calculated_pay || 0;
      totalCustomerBill += assignment.customer_bill || 0;
    });

    const laborCost = totalTechPayout;
    const profit = totalCustomerBill - laborCost;
    const margin = totalCustomerBill > 0 ? (profit / totalCustomerBill) * 100 : 0;

    return {
      totalTechPayout: Math.round(totalTechPayout * 100) / 100,
      totalCustomerBilling: Math.round(totalCustomerBill * 100) / 100,
      totalLaborCost: Math.round(laborCost * 100) / 100,
      profitMargin: Math.round(margin * 100) / 100
    };
  };

  const getBreakdownByRateType = (assignmentsList) => {
    const breakdown = {};

    assignmentsList.forEach((assignment) => {
      const type = assignment.rate_type || 'unknown';
      if (!breakdown[type]) {
        breakdown[type] = {
          count: 0,
          totalHours: 0,
          totalPay: 0,
          totalBill: 0
        };
      }
      breakdown[type].count += 1;
      breakdown[type].totalHours += assignment.hours_worked || 0;
      breakdown[type].totalPay += assignment.calculated_pay || 0;
      breakdown[type].totalBill += assignment.customer_bill || 0;
    });

    return breakdown;
  };

  // Update financial data when assignments change
  useEffect(() => {
    if (assignments && assignments.length > 0) {
      const totals = calculateFinancialTotals(assignments);
      setFinancialData(totals);

      const breakdown = getBreakdownByRateType(assignments);
      setBreakdownByRateType(breakdown);
    } else {
      setFinancialData({
        totalTechPayout: 0,
        totalCustomerBilling: 0,
        totalLaborCost: 0,
        profitMargin: 0
      });
      setBreakdownByRateType({});
    }
  }, [assignments]);

  // ==========================================
  // HANDLERS - Bulk Edit
  // ==========================================
  const toggleAssignmentSelect = (assignmentId) => {
    setSelectedAssignmentIds((prev) =>
      prev.includes(assignmentId)
        ? prev.filter((id) => id !== assignmentId)
        : [...prev, assignmentId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAssignmentIds.length === assignments.length) {
      setSelectedAssignmentIds([]);
    } else {
      setSelectedAssignmentIds(assignments.map((a) => a.id));
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
    BULK_EDIT_FIELDS.forEach((field) => {
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
  // HANDLERS - Financial Data
  // ==========================================
  const handleSaveFinancialData = async () => {
    try {
      console.log('💾 Saving financial data:', financialData);

      await api.put(`/events/${eventId}`, {
        ...event,
        total_tech_payout: financialData.totalTechPayout,
        total_labor_cost: financialData.totalLaborCost,
        total_customer_billing: financialData.totalCustomerBilling
      });

      // Refresh event data
      const updated = await getEvent(eventId);
      setEvent(updated.data);

      alert('✅ Financial data saved successfully!');
      setEditingFinancialField(null);
    } catch (err) {
      console.error('Failed to save financial data:', err);
      alert(`Failed to save: ${err.message}`);
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
      setRequirements(requirements.filter((r) => r.id !== id));
    } catch (err) {
      setReqError(err.message);
    }
  };

  // ==========================================
  // CALCULATIONS
  // ==========================================
  const totalPay = assignments.reduce(
    (sum, a) => sum + (a.calculated_pay || 0),
    0
  );
  const totalBill = assignments.reduce(
    (sum, a) => sum + (a.customer_bill || 0),
    0
  );

  // ==========================================
  // LOADING STATES
  // ==========================================
  if (loadingEvent) return <div className="event-details">Loading event...</div>;
  if (!event) return <div className="event-details">Event not found</div>;

  return (
    <div className="event-details">
      {/* Back Button & Header */}
      <button className="btn-back" onClick={onBack}>
        ← Back to Events
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>{event.name}</h1>
          <p style={{ margin: '5px 0', color: '#666' }}>
            <strong>Client:</strong> {event.client_name}
          </p>
          {event.po_number && (
            <p style={{ margin: '5px 0', color: '#666' }}>
              <strong>PO:</strong> {event.po_number}
            </p>
          )}
        </div>
        <div>
          <button
            className="btn btn-secondary"
            onClick={() => setSettingsModal(true)}
            style={{ marginRight: '10px' }}
          >
            ⚙️ Settings
          </button>
          <button className="btn btn-delete" onClick={handleDeleteEvent}>
            🗑️ Delete Event
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {/* ========================================== */}
      {/* SECTION 1: Requirements */}
      {/* ========================================== */}
      <section className="section">
        <h2>📋 Requirements</h2>

        {/* Add Requirement Form */}
        <div style={{ marginBottom: '20px' }}>
          <form onSubmit={handleAddRequirement}>
            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  name="requirementdate"
                  value={reqForm.requirementdate}
                  onChange={handleReqFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Room/Location</label>
                <input
                  type="text"
                  name="roomorlocation"
                  value={reqForm.roomorlocation}
                  onChange={handleReqFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Set Time</label>
                <input
                  type="time"
                  name="settime"
                  value={reqForm.settime}
                  onChange={handleReqFormChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="time"
                  name="starttime"
                  value={reqForm.starttime}
                  onChange={handleReqFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <input
                  type="time"
                  name="endtime"
                  value={reqForm.endtime}
                  onChange={handleReqFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Strike Time</label>
                <input
                  type="time"
                  name="striketime"
                  value={reqForm.striketime}
                  onChange={handleReqFormChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Position</label>
                <input
                  type="text"
                  name="position"
                  value={reqForm.position}
                  onChange={handleReqFormChange}
                />
              </div>
              <div className="form-group">
                <label>Techs Needed</label>
                <input
                  type="number"
                  name="techsneeded"
                  min="1"
                  value={reqForm.techsneeded}
                  onChange={handleReqFormChange}
                />
              </div>
              <div className="form-group">
                <label>&nbsp;</label>
                <button type="submit" className="btn btn-primary">
                  ➕ Add Requirement
                </button>
              </div>
            </div>
          </form>
        </div>

        {reqError && <div className="error">{reqError}</div>}

        {/* Requirements Table */}
        {loadingRequirements ? (
          <p>Loading requirements...</p>
        ) : requirements.length === 0 ? (
          <p className="empty-state">No requirements yet for this event.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Room</th>
                <th>Set</th>
                <th>Start</th>
                <th>End</th>
                <th>Strike</th>
                <th>Position</th>
                <th>Needed</th>
                <th>Assigned</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requirements.map((r) => {
                const coverageStatus =
                  r.assigned_count >= r.techs_needed
                    ? '✅ Full'
                    : `⚠️ ${r.assigned_count}/${r.techs_needed}`;
                const assignedNames = r.assigned_techs
                  ? r.assigned_techs.map((t) => t.name).join(', ')
                  : '';

                return (
                  <tr key={r.id}>
                    <td>{r.requirement_date || '—'}</td>
                    <td>{r.room_or_location}</td>
                    <td>{r.set_time || '—'}</td>
                    <td>{r.start_time || '—'}</td>
                    <td>{r.end_time || '—'}</td>
                    <td>{r.strike_time || '—'}</td>
                    <td>{r.position || '—'}</td>
                    <td>{r.techs_needed}</td>
                    <td>
                      <small>{coverageStatus}</small>
                      <br />
                      <small style={{ color: '#666' }}>
                        {assignedNames ? assignedNames : '—'}
                      </small>
                    </td>
                    <td>
                      <button
                        className="btn btn-primary"
                        style={{ marginRight: '5px', padding: '4px 8px', fontSize: '11px' }}
                        onClick={() => handleSelectRequirement(r)}
                      >
                        Assign
                      </button>
                      <button
                        className="btn btn-delete"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
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
      </section>

      {/* ========================================== */}
      {/* SECTION 2: Assignments */}
      {/* ========================================== */}
      <section className="section">
        <h2>👥 Assignments</h2>

        {/* Add Assignment Form */}
        <form onSubmit={handleAddAssignment} className="assignment-form">
          <div className="form-row">
            <div className="form-group">
              <label>Technician *</label>
              <select
                name="technicianid"
                value={formData.technicianid}
                onChange={handleFormChange}
                required
              >
                <option value="">Select technician</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name}
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
              />
            </div>
            <div className="form-group">
              <label>Hours Worked</label>
              <input
                type="number"
                step="0.5"
                name="hoursworked"
                value={formData.hoursworked}
                onChange={handleFormChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Rate Type *</label>
              <select
                name="ratetype"
                value={formData.ratetype}
                onChange={handleFormChange}
              >
                {RATETYPE.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Assignment Date</label>
              <input
                type="date"
                name="assignmentdate"
                value={formData.assignmentdate}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-group">
              <label>Start Time</label>
              <input
                type="time"
                name="starttime"
                value={formData.starttime}
                onChange={handleFormChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>End Time</label>
              <input
                type="time"
                name="endtime"
                value={formData.endtime}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-group">
              <label>Link to Requirement</label>
              <select
                name="requirementid"
                value={formData.requirementid}
                onChange={handleFormChange}
              >
                <option value="">None</option>
                {requirements.map((req) => (
                  <option key={req.id} value={req.id}>
                    {req.room_or_location} - {req.position}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>&nbsp;</label>
              <button type="submit" className="btn btn-success">
                ➕ Add Assignment
              </button>
            </div>
          </div>
        </form>

        {/* Assignments Table */}
        {loadingAssignments ? (
          <p>Loading assignments…</p>
        ) : assignments.length === 0 ? (
          <p className="empty-state">No assignments yet. Add one above.</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={
                        selectedAssignmentIds.length > 0 &&
                        selectedAssignmentIds.length === assignments.length
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
                {assignments.map((a) => (
                  <tr
                    key={a.id}
                    onContextMenu={(e) => handleContextMenu(e, a.id)}
                    style={{
                      background: selectedAssignmentIds.includes(a.id)
                        ? '#e8f5e9'
                        : 'transparent'
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
                        onSave={(value) =>
                          handleInlineEditSave(a.id, 'assignment_date', value)
                        }
                      />
                    </td>
                    <td>
                      <EditableCell
                        value={a.start_time || ''}
                        type="time"
                        onSave={(value) =>
                          handleInlineEditSave(a.id, 'start_time', value)
                        }
                      />
                    </td>
                    <td>
                      <EditableCell
                        value={a.end_time || ''}
                        type="time"
                        onSave={(value) =>
                          handleInlineEditSave(a.id, 'end_time', value)
                        }
                      />
                    </td>
                    <td>
                      <EditableCell
                        value={a.position || ''}
                        onSave={(value) =>
                          handleInlineEditSave(a.id, 'position', value)
                        }
                      />
                    </td>
                    <td>{(a.hours_worked || 0).toFixed(1)}</td>
                    <td>
                      <EditableSelectCell
                        value={a.rate_type || ''}
                        options={RATETYPE}
                        onSave={(value) =>
                          handleInlineEditSave(a.id, 'rate_type', value)
                        }
                      />
                    </td>
                    <td>${(a.calculated_pay || 0).toFixed(2)}</td>
                    <td>${(a.customer_bill || 0).toFixed(2)}</td>
                    <td>
                      <button
                        className="btn btn-delete"
                        onClick={() => handleDelete(a.id)}
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: '15px', fontSize: '14px', fontWeight: 'bold' }}>
              <p>
                <strong>Total Tech Pay:</strong> ${totalPay.toFixed(2)}
              </p>
              <p>
                <strong>Total Customer Bill:</strong> ${totalBill.toFixed(2)}
              </p>
            </div>

            {selectedAssignmentIds.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <button
                  className="btn btn-primary"
                  onClick={openBulkEditModal}
                >
                  ✏️ Bulk Edit ({selectedAssignmentIds.length})
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ========================================== */}
      {/* SECTION 3: Financial Overview */}
      {/* ========================================== */}
      <section className="section financial-section">
        <h2>💰 Financial Overview</h2>

        {/* Summary Cards */}
        <div className="financial-grid">
          <div className="financial-card">
            <span className="financial-card-label">Total Tech Payout</span>
            <span className="financial-card-value">
              ${financialData.totalTechPayout.toFixed(2)}
            </span>
            <small style={{ color: '#999', fontSize: '11px' }}>
              {assignments.length} assignments
            </small>
          </div>

          <div className="financial-card">
            <span className="financial-card-label">Customer Billing</span>
            <span className="financial-card-value">
              ${financialData.totalCustomerBilling.toFixed(2)}
            </span>
            <small style={{ color: '#999', fontSize: '11px' }}>
              Total billable amount
            </small>
          </div>

          <div className="financial-card profit-card">
            <span className="financial-card-label">Profit</span>
            <span className="financial-card-value">
              $
              {(
                financialData.totalCustomerBilling -
                financialData.totalLaborCost
              ).toFixed(2)}
            </span>
            <small style={{ color: '#188038', fontSize: '11px' }}>
              Margin: {financialData.profitMargin.toFixed(1)}%
            </small>
          </div>
        </div>

        {/* Breakdown by Rate Type */}
        {Object.keys(breakdownByRateType).length > 0 && (
          <div className="financial-breakdown">
            <h3>Breakdown by Rate Type</h3>
            <table className="breakdown-table">
              <thead>
                <tr>
                  <th>Rate Type</th>
                  <th>Count</th>
                  <th>Total Hours</th>
                  <th>Tech Payout</th>
                  <th>Customer Bill</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(breakdownByRateType).map(([type, data]) => (
                  <tr key={type}>
                    <td style={{ textTransform: 'capitalize' }}>
                      {type || 'Unknown'}
                    </td>
                    <td>{data.count}</td>
                    <td>{data.totalHours.toFixed(1)}h</td>
                    <td>${data.totalPay.toFixed(2)}</td>
                    <td>${data.totalBill.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Save Button */}
        <div className="financial-actions">
          <button className="btn btn-primary" onClick={handleSaveFinancialData}>
            💾 Save Financial Data
          </button>
        </div>
      </section>

      {/* ========================================== */}
      {/* MODALS & MENUS */}
      {/* ========================================== */}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`
          }}
        >
          <button onClick={openBulkEditModal}>✏️ Bulk Edit</button>
          <button
            onClick={() => {
              contextMenu.assignmentIds.forEach((id) => handleDelete(id));
              setContextMenu(null);
            }}
          >
            🗑️ Delete Selected
          </button>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {bulkEditModal && (
        <div className="modal-overlay" onClick={() => setBulkEditModal(null)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Bulk Edit Assignments</h3>
            <div className="form-group">
              <label>Assignment Date</label>
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
            <div className="modal-buttons">
              <button
                className="btn btn-secondary"
                onClick={() => setBulkEditModal(null)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleBulkEditSubmit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {settingsModal && (
        <div className="modal-overlay" onClick={() => setSettingsModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Event Settings</h3>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
              Configure company-wide rate calculations for this event
            </p>
            <div className="form-group">
              <label>Half-Day Hours</label>
              <input
                type="number"
                value={settings.halfday_hours}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    halfday_hours: parseInt(e.target.value)
                  })
                }
              />
            </div>
            <div className="form-group">
              <label>Full-Day Hours</label>
              <input
                type="number"
                value={settings.fullday_hours}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    fullday_hours: parseInt(e.target.value)
                  })
                }
              />
            </div>
            <div className="form-group">
              <label>OT Threshold (hours)</label>
              <input
                type="number"
                value={settings.ot_threshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    ot_threshold: parseInt(e.target.value)
                  })
                }
              />
            </div>
            <div className="modal-buttons">
              <button
                className="btn btn-secondary"
                onClick={() => setSettingsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;
