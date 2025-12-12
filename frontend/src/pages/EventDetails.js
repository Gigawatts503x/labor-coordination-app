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
import '../styles/table-dark-mode.css';
import '../styles/requirements-table.css';
import '../styles/requirements-form.css';
import '../styles/assignments-table.css';

const RATE_TYPES = ['hourly', 'half-day', 'full-day'];
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
  // STATE - Assignments (LOCAL COPY)
  // ==========================================
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

  // ==========================================
  // STATE - Requirements
  // ==========================================
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

  // ==========================================
  // STATE - Requirements Sort & Filter
  // ==========================================
  const [reqSortField, setReqSortField] = useState('requirement_date');
  const [reqSortDirection, setReqSortDirection] = useState('asc');
  const [reqFilters, setReqFilters] = useState({
    dateFrom: '',
    dateTo: '',
    room: '',
    position: ''
  });

  // ==========================================
  // STATE - Assignments Sort & Filter
  // ==========================================
  const [assignSortField, setAssignSortField] = useState('assignment_date');
  const [assignSortDirection, setAssignSortDirection] = useState('asc');
  const [assignFilters, setAssignFilters] = useState({
    dateFrom: '',
    dateTo: '',
    technician: '',
    position: ''
  });

  // ==========================================
  // STATE - Assignment Form
  // ==========================================
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

  // ==========================================
  // HANDLERS - Requirements Sort & Filter
  // ==========================================
  const handleReqSortClick = (field) => {
    if (reqSortField === field) {
      setReqSortDirection(reqSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setReqSortField(field);
      setReqSortDirection('asc');
    }
  };

  const handleReqFilterChange = (e) => {
    const { name, value } = e.target;
    setReqFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearReqFilters = () => {
    setReqFilters({ dateFrom: '', dateTo: '', room: '', position: '' });
    setReqSortField('requirement_date');
    setReqSortDirection('asc');
  };

  const getFilteredAndSortedRequirements = () => {
    let filtered = requirements;

    if (reqFilters.dateFrom) {
      filtered = filtered.filter(r => r.requirement_date >= reqFilters.dateFrom);
    }
    if (reqFilters.dateTo) {
      filtered = filtered.filter(r => r.requirement_date <= reqFilters.dateTo);
    }
    if (reqFilters.room) {
      filtered = filtered.filter(r =>
        r.room_or_location
          .toLowerCase()
          .includes(reqFilters.room.toLowerCase())
      );
    }
    if (reqFilters.position) {
      filtered = filtered.filter(r =>
        r.position && r.position.toLowerCase().includes(reqFilters.position.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      let aVal = a[reqSortField];
      let bVal = b[reqSortField];

      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return reqSortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return reqSortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const getReqSortIndicator = (field) => {
    if (reqSortField !== field) return '';
    return reqSortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  // ==========================================
  // HANDLERS - Assignments Sort & Filter
  // ==========================================
  const handleAssignSortClick = (field) => {
    if (assignSortField === field) {
      setAssignSortDirection(assignSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setAssignSortField(field);
      setAssignSortDirection('asc');
    }
  };

  const handleAssignFilterChange = (e) => {
    const { name, value } = e.target;
    setAssignFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearAssignFilters = () => {
    setAssignFilters({ dateFrom: '', dateTo: '', technician: '', position: '' });
    setAssignSortField('assignment_date');
    setAssignSortDirection('asc');
  };

  const getFilteredAndSortedAssignments = () => {
    let filtered = assignments;

    if (assignFilters.dateFrom) {
      filtered = filtered.filter(a => a.assignment_date >= assignFilters.dateFrom);
    }
    if (assignFilters.dateTo) {
      filtered = filtered.filter(a => a.assignment_date <= assignFilters.dateTo);
    }
    if (assignFilters.technician) {
      filtered = filtered.filter(a =>
        a.technician_name.toLowerCase().includes(assignFilters.technician.toLowerCase())
      );
    }
    if (assignFilters.position) {
      filtered = filtered.filter(a =>
        a.position && a.position.toLowerCase().includes(assignFilters.position.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      let aVal = a[assignSortField];
      let bVal = b[assignSortField];

      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return assignSortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return assignSortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const getAssignSortIndicator = (field) => {
    if (assignSortField !== field) return '';
    return assignSortDirection === 'asc' ? ' ↑' : ' ↓';
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

      await updateAssignment(assignmentId, { [field]: value || null });
      console.log('✅ Update successful');

      setAssignments(prevAssignments =>
        prevAssignments.map(a =>
          a.id === assignmentId ? { ...a, [field]: value } : a
        )
      );
    } catch (err) {
      console.error('❌ Error saving assignment:', err);
      alert(`Failed to save ${field}: ${err.message}`);
      await refreshAssignments();
    }
  };

  // ==========================================
  // HANDLERS - Requirement Inline Editing
  // ==========================================
  const handleRequirementEditSave = async (requirementId, field, value) => {
    try {
      console.log(`💾 Saving requirement ${field}:`, value, 'for requirement:', requirementId);

      const requirement = requirements.find(r => r.id === requirementId);
      if (requirement && requirement[field] === value) {
        console.log('No change detected, skipping update');
        return;
      }

      const fieldMap = {
        requirement_date: 'requirement_date',
        room_or_location: 'room_or_location',
        set_time: 'set_time',
        start_time: 'start_time',
        end_time: 'end_time',
        strike_time: 'strike_time',
        position: 'position'
      };

      await api.patch(`/requirements/${requirementId}`, {
        [fieldMap[field]]: value || null
      });

      console.log('✅ Update successful');

      setRequirements(prevRequirements =>
        prevRequirements.map(r =>
          r.id === requirementId ? { ...r, [field]: value } : r
        )
      );
    } catch (err) {
      console.error('❌ Error saving requirement:', err);
      alert(`Failed to save ${field}: ${err.message}`);
    }
  };

  // ==========================================
  // HANDLERS - Refresh Requirements
  // ==========================================
  const refreshRequirements = async () => {
    try {
      const res = await getEventRequirementsWithCoverage(eventId);
      setRequirements(res.data);
    } catch (err) {
      console.error('Error refreshing requirements:', err);
    }
  };

  // ==========================================
  // HANDLERS - Assignment Operations
  // ==========================================
  const handleAddAssignment = async (e) => {
    e.preventDefault();
    if (!formData.technician_id || !formData.rate_type) return;

    // Check for scheduling conflicts
    const selectedTech = formData.technician_id;
    const assignmentDate = formData.assignment_date;
    const startTime = formData.start_time;
    const endTime = formData.end_time;

    if (assignmentDate && startTime && endTime) {
      const conflict = assignments.some(a => {
        if (a.technician_id !== selectedTech || a.assignment_date !== assignmentDate) {
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

      await refreshRequirements();
    } catch (err) {
      console.error('Failed to add assignment', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this assignment?')) return;

    try {
      await removeAssignment(id);

      await refreshRequirements();
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
      !reqForm.requirement_date ||
      !reqForm.room_or_location ||
      !reqForm.start_time ||
      !reqForm.end_time
    ) {
      return;
    }

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
        requirement_date: reqForm.requirement_date,
        room_or_location: reqForm.room_or_location,
        set_time: reqForm.set_time,
        start_time: reqForm.start_time,
        end_time: reqForm.end_time,
        strike_time: reqForm.strike_time,
        position: '',
        techs_needed: 1
      });
    } catch (err) {
      console.error('Error creating requirement:', err);
      setReqError(err.message);
    }
  };

  const handleAssignRequirement = (requirement) => {
    setFormData({
      technician_id: '',
      position: requirement.position || '',
      hours_worked: requirement.techs_needed || '',
      rate_type: 'full-day',
      assignment_date: requirement.requirement_date || '',
      start_time: requirement.set_time || '',
      end_time: requirement.strike_time || '',
      requirement_id: requirement.id
    });

    setTimeout(() => {
      const element = document.querySelector('.assignment-form');
      if (element) {
        const elementHeight = element.offsetHeight;
        const elementTop = element.getBoundingClientRect().top + window.scrollY;
        // Position so the form is at the bottom of the viewport (with 20px margin from bottom)
        window.scrollTo({
          top: elementTop - (window.innerHeight - elementHeight - 20),
          behavior: 'smooth'
        });
      }
    }, 100);
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
  if (loadingEvent)
    return <div className="event-details">Loading event…</div>;

  if (error)
    return <div className="event-details error">Error: {error}</div>;

  if (!event)
    return <div className="event-details">Event not found.</div>;

  const filteredRequirements = getFilteredAndSortedRequirements();
  const filteredAssignments = getFilteredAndSortedAssignments();

  return (
    <div className="event-details">
      <button className="btn btn-secondary" onClick={onBack}>
        ← Back to Events
      </button>

      <header className="event-header">
        <div>
          <h1>{event.name}</h1>
          <p>
            <strong>Client:</strong> {event.client_name}
          </p>
          {event.client_contact && (
            <p>
              <strong>Contact:</strong> {event.client_contact}
            </p>
          )}
          {event.client_phone && (
            <p>
              <strong>Phone:</strong> {event.client_phone}
            </p>
          )}
          {event.client_email && (
            <p>
              <strong>Email:</strong> {event.client_email}
            </p>
          )}
        </div>

        <div className="event-summary">
          <h3>Totals</h3>
          <p>
            <strong>Tech Pay:</strong> ${totalPay.toFixed(2)}
          </p>
          <p>
            <strong>Customer Bill:</strong> ${totalBill.toFixed(2)}
          </p>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button
          className="btn btn-secondary"
          onClick={() => setSettingsModal(true)}
        >
          ⚙️ Settings
        </button>
        <button className="btn btn-delete" onClick={handleDeleteEvent}>
          Delete Event
        </button>
      </div>

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
        ) : filteredRequirements.length === 0 ? (
          <p className="empty-state">No requirements yet for this event.</p>
        ) : (
          <>
            <div className="filter-controls">
              <div className="form-row">
                <div className="form-group">
                  <label>Date From</label>
                  <input
                    type="date"
                    name="dateFrom"
                    value={reqFilters.dateFrom}
                    onChange={handleReqFilterChange}
                  />
                </div>

                <div className="form-group">
                  <label>Date To</label>
                  <input
                    type="date"
                    name="dateTo"
                    value={reqFilters.dateTo}
                    onChange={handleReqFilterChange}
                  />
                </div>

                <div className="form-group">
                  <label>Room/Location</label>
                  <input
                    type="text"
                    name="room"
                    placeholder="Search..."
                    value={reqFilters.room}
                    onChange={handleReqFilterChange}
                  />
                </div>

                <div className="form-group">
                  <label>Position</label>
                  <input
                    type="text"
                    name="position"
                    placeholder="Search..."
                    value={reqFilters.position}
                    onChange={handleReqFilterChange}
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={clearReqFilters}
                >
                  Clear Filters
                </button>
              </div>

              <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                Showing {filteredRequirements.length} of {requirements.length} requirements
              </p>
            </div>

            <div className="table-container">
              <table className="assignments-table">
                <thead>
                  <tr>
                    <th
                      onClick={() => handleReqSortClick('requirement_date')}
                      style={{ cursor: 'pointer' }}
                    >
                      Date{getReqSortIndicator('requirement_date')}
                    </th>
                    <th
                      onClick={() => handleReqSortClick('room_or_location')}
                      style={{ cursor: 'pointer' }}
                    >
                      Room{getReqSortIndicator('room_or_location')}
                    </th>
                    <th
                      onClick={() => handleReqSortClick('set_time')}
                      style={{ cursor: 'pointer' }}
                    >
                      Set{getReqSortIndicator('set_time')}
                    </th>
                    <th
                      onClick={() => handleReqSortClick('start_time')}
                      style={{ cursor: 'pointer' }}
                    >
                      Start{getReqSortIndicator('start_time')}
                    </th>
                    <th
                      onClick={() => handleReqSortClick('end_time')}
                      style={{ cursor: 'pointer' }}
                    >
                      End{getReqSortIndicator('end_time')}
                    </th>
                    <th
                      onClick={() => handleReqSortClick('strike_time')}
                      style={{ cursor: 'pointer' }}
                    >
                      Strike{getReqSortIndicator('strike_time')}
                    </th>
                    <th
                      onClick={() => handleReqSortClick('position')}
                      style={{ cursor: 'pointer' }}
                    >
                      Position{getReqSortIndicator('position')}
                    </th>
                    <th>Coverage</th>
                    <th>Assigned Techs</th>
                    <th>Assign</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRequirements.map(r => {
                    const assignedNames = r.assigned_techs
                      ? r.assigned_techs.map(t => t.name).join(', ')
                      : '';
                    const coverageStatus = `${r.assigned_count || 0}/${r.techs_needed}`;

                    const isFull = r.assigned_count >= r.techs_needed;

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
                        <td>{assignedNames ? assignedNames : '—'}</td>
                        <td>
                          {!isFull && (
                            <button
                              className="btn btn-small btn-success"
                              onClick={() => handleAssignRequirement(r)}
                            >
                              Assign
                            </button>
                          )}
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
          </>
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
                  <option key={rt} value={rt}>
                    {rt}
                  </option>
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

            <div className="form-group">
              <label>Requirement (Optional)</label>
              <select
                name="requirement_id"
                value={formData.requirement_id}
                onChange={handleFormChange}
              >
                <option value="">-- Requirement (optional) --</option>
                {requirements.map(req => (
                  <option key={req.id} value={req.id}>
                    {req.requirement_date} – {req.room_or_location} – {req.position || 'Any'} (Techs needed: {req.techs_needed})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-success">
            + Add Assignment
          </button>
        </form>

        {loadingAssignments ? (
          <p>Loading assignments…</p>
        ) : filteredAssignments.length === 0 ? (
          <p className="empty-state">No assignments yet. Add one above.</p>
        ) : (
          <>
            <div className="filter-controls">
              <div className="form-row">
                <div className="form-group">
                  <label>Date From</label>
                  <input
                    type="date"
                    name="dateFrom"
                    value={assignFilters.dateFrom}
                    onChange={handleAssignFilterChange}
                  />
                </div>

                <div className="form-group">
                  <label>Date To</label>
                  <input
                    type="date"
                    name="dateTo"
                    value={assignFilters.dateTo}
                    onChange={handleAssignFilterChange}
                  />
                </div>

                <div className="form-group">
                  <label>Technician</label>
                  <input
                    type="text"
                    name="technician"
                    placeholder="Search..."
                    value={assignFilters.technician}
                    onChange={handleAssignFilterChange}
                  />
                </div>

                <div className="form-group">
                  <label>Position</label>
                  <input
                    type="text"
                    name="position"
                    placeholder="Search..."
                    value={assignFilters.position}
                    onChange={handleAssignFilterChange}
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={clearAssignFilters}
                >
                  Clear Filters
                </button>
              </div>

              <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                Showing {filteredAssignments.length} of {assignments.length} assignments
              </p>
            </div>

            <div className="table-container">
              <table className="assignments-table">
                <thead>
                  <tr>
                    <th style={{ width: '30px' }}>
                      <input
                        type="checkbox"
                        checked={
                          selectedAssignmentIds.length > 0 &&
                          selectedAssignmentIds.length ===
                            filteredAssignments.length
                        }
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th
                      onClick={() => handleAssignSortClick('technician_name')}
                      style={{ cursor: 'pointer' }}
                    >
                      Technician{getAssignSortIndicator('technician_name')}
                    </th>
                    <th
                      onClick={() => handleAssignSortClick('assignment_date')}
                      style={{ cursor: 'pointer' }}
                    >
                      Date{getAssignSortIndicator('assignment_date')}
                    </th>
                    <th
                      onClick={() => handleAssignSortClick('start_time')}
                      style={{ cursor: 'pointer' }}
                    >
                      Start{getAssignSortIndicator('start_time')}
                    </th>
                    <th
                      onClick={() => handleAssignSortClick('end_time')}
                      style={{ cursor: 'pointer' }}
                    >
                      End{getAssignSortIndicator('end_time')}
                    </th>
                    <th
                      onClick={() => handleAssignSortClick('position')}
                      style={{ cursor: 'pointer' }}
                    >
                      Position{getAssignSortIndicator('position')}
                    </th>
                    <th>Hours</th>
                    <th>Rate Type</th>
                    <th>Tech Pay</th>
                    <th>Customer Bill</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAssignments.map(a => (
                    <tr
                      key={a.id}
                      onContextMenu={(e) => handleContextMenu(e, a.id)}
                      style={{
                        backgroundColor: selectedAssignmentIds.includes(a.id)
                          ? '#f9f9f9'
                          : 'transparent'
                      }}
                    >
                      <td style={{ width: '30px' }}>
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
                          displayValue={a.assignment_date || '—'}
                          onSave={(value) =>
                            handleInlineEditSave(a.id, 'assignment_date', value)
                          }
                        />
                      </td>
                      <td>
                        <EditableCell
                          value={a.start_time || ''}
                          type="time"
                          displayValue={a.start_time || '—'}
                          onSave={(value) =>
                            handleInlineEditSave(a.id, 'start_time', value)
                          }
                        />
                      </td>
                      <td>
                        <EditableCell
                          value={a.end_time || ''}
                          type="time"
                          displayValue={a.end_time || '—'}
                          onSave={(value) =>
                            handleInlineEditSave(a.id, 'end_time', value)
                          }
                        />
                      </td>
                      <td>
                        <EditableCell
                          value={a.position || ''}
                          type="text"
                          displayValue={a.position || '—'}
                          onSave={(value) =>
                            handleInlineEditSave(a.id, 'position', value)
                          }
                        />
                      </td>
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

            <div style={{ marginTop: '20px', fontWeight: 'bold', fontSize: '16px' }}>
              <p>
                <strong>Total Tech Pay:</strong> ${totalPay.toFixed(2)}
              </p>
              <p>
                <strong>Total Customer Bill:</strong> ${totalBill.toFixed(2)}
              </p>
            </div>
          </>
        )}

        {contextMenu && (
          <div
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '6px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              zIndex: 1000,
              minWidth: '150px'
            }}
          >
            <button
              onClick={openBulkEditModal}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 15px',
                border: 'none',
                backgroundColor: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'inherit',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#f5f5f5')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
            >
              📝 Bulk Edit
            </button>
          </div>
        )}

        {bulkEditModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                maxWidth: '500px',
                width: '90%'
              }}
            >
              <h3>Bulk Edit Assignments</h3>
              <p>
                Edit {bulkEditModal.assignmentIds.length} selected assignment(s)
              </p>

              <div className="form-row">
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

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  justifyContent: 'flex-end',
                  marginTop: '20px'
                }}
              >
                <button
                  className="btn btn-secondary"
                  onClick={() => setBulkEditModal(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-success"
                  onClick={handleBulkEditSubmit}
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {settingsModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                maxWidth: '500px',
                width: '90%'
              }}
            >
              <h3>Event Settings</h3>

              <div style={{ marginTop: '20px' }}>
                <p>
                  <strong>Settings are read-only for now.</strong> Update in the main settings area.
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: '20px'
                }}
              >
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
      </section>
    </div>
  );
};

export default EventDetails;
