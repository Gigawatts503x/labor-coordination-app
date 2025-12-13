import React, { useEffect, useState } from 'react';
import { getEvent, getTechnicians, bulkUpdateAssignments, deleteEvent, api, getEventRequirementsWithCoverage, createEventRequirement, deleteRequirement, updateAssignment } from '../utils/api';
import { useAssignments } from '../hooks/useAssignments';
import EditableCell from '../components/EditableCell';
import EditableSelectCell from '../components/EditableSelectCell';
import '../styles/EventDetails.css';
import '../styles/table-dark-mode.css';
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
    requirement_end_date: '',
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
      [name]: name === 'hoursworked'
        ? value === '' ? '' : parseFloat(value) || ''
        : value
    }));
  };

  const handleReqFormChange = (e) => {
    const { name, value } = e.target;
    setReqForm(prev => ({
      ...prev,
      [name]: name === 'techs_needed'
        ? value === '' ? '' : parseInt(value, 10) || 1
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
    setReqFilters(prev => ({ ...prev, [name]: value }));
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
        r.room_or_location?.toLowerCase().includes(reqFilters.room.toLowerCase())
      );
    }
    if (reqFilters.position) {
      filtered = filtered.filter(r =>
        r.position?.toLowerCase().includes(reqFilters.position.toLowerCase())
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
    setAssignFilters(prev => ({ ...prev, [name]: value }));
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
        a.technician_name?.toLowerCase().includes(assignFilters.technician.toLowerCase())
      );
    }
    if (assignFilters.position) {
      filtered = filtered.filter(a =>
        a.position?.toLowerCase().includes(assignFilters.position.toLowerCase())
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
  // HELPERS - Coverage Calculation
  // ==========================================
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

  const getAssignedTechNames = (requirement) => {
    return assignments
      .filter(a => a.requirement_id === requirement.id)
      .map(a => a.technician_name)
      .join(', ') || '—';
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
        requirement_end_date: 'requirement_end_date',
        room_or_location: 'room_or_location',
        set_time: 'set_time',
        start_time: 'start_time',
        end_time: 'end_time',
        strike_time: 'strike_time',
        position: 'position'
      };

      await api.patch(`/requirements/${requirementId}`, { [fieldMap[field]]: value || null });

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
  // HANDLERS - Assignment Operations
  // ==========================================
  const handleAddAssignment = async (e) => {
    e.preventDefault();
    if (!formData.technicianid || !formData.ratetype) return;

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
      alert('Please fill in all required fields');
      return;
    }

    try {
      const res = await createEventRequirement(eventId, {
        requirement_date: reqForm.requirement_date,
        requirement_end_date: reqForm.requirement_end_date,
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
      console.error('Error creating requirement:', err);
      setReqError(err.message);
    }
  };

  const handleAssignRequirement = (requirement) => {
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
  if (loadingEvent) return <div className="event-details loading">Loading event...</div>;
  if (error) return <div className="event-details error">Error: {error}</div>;
  if (!event) return <div className="event-details error">Event not found</div>;

  const filteredRequirements = getFilteredAndSortedRequirements();
  const filteredAssignments = getFilteredAndSortedAssignments();

  return (
    <div className="event-details">
      {/* Header */}
      <div className="event-header">
        <div>
          <h1>{event.name}</h1>
          <p><strong>Client:</strong> {event.client_name}</p>
          <p><strong>Contact:</strong> {event.client_contact}</p>
          <p><strong>Phone:</strong> {event.client_phone}</p>
          <p><strong>Email:</strong> {event.client_email}</p>
          <p><strong>Address:</strong> {event.client_address}</p>
          <p><strong>PO#:</strong> {event.po_number}</p>
          <p><strong>Dates:</strong> {event.start_date} to {event.end_date}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
          <button onClick={onBack} className="btn btn-secondary">← Back</button>
          <button onClick={handleDeleteEvent} className="btn btn-delete">Delete Event</button>
        </div>
      </div>

      {/* REQUIREMENTS SECTION */}
      <section className="requirements-section">
        <h2>Requirements</h2>

        {/* FORM */}
        <form onSubmit={handleAddRequirement} className="requirement-form">
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
                placeholder="e.g., Main Stage"
                value={reqForm.room_or_location}
                onChange={handleReqFormChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Set Time</label>
              <input
                type="time"
                name="set_time"
                value={reqForm.set_time}
                onChange={handleReqFormChange}
              />
            </div>
          </div>

          <div className="form-row">
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
                placeholder="e.g., A2, Cam Op"
                value={reqForm.position}
                onChange={handleReqFormChange}
              />
            </div>
          </div>

          <div className="form-row">
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
            <button type="submit" className="btn btn-success">Add Requirement</button>
          </div>
        </form>

        {/* FILTER CONTROLS */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input
            type="date"
            name="dateFrom"
            value={reqFilters.dateFrom}
            onChange={handleReqFilterChange}
            style={{ flex: 1, minWidth: '120px' }}
          />
          <input
            type="date"
            name="dateTo"
            value={reqFilters.dateTo}
            onChange={handleReqFilterChange}
            style={{ flex: 1, minWidth: '120px' }}
          />
          <input
            type="text"
            name="room"
            placeholder="Filter by room..."
            value={reqFilters.room}
            onChange={handleReqFilterChange}
            style={{ flex: 1, minWidth: '120px' }}
          />
          <input
            type="text"
            name="position"
            placeholder="Filter by position..."
            value={reqFilters.position}
            onChange={handleReqFilterChange}
            style={{ flex: 1, minWidth: '120px' }}
          />
          <button onClick={clearReqFilters} className="btn btn-secondary">Clear</button>
        </div>

        {/* REQUIREMENTS TABLE */}
        {filteredRequirements.length === 0 ? (
          <div className="requirements-empty-state">No requirements yet.</div>
        ) : (
          <div className="requirements-table-container">
            <table className="requirements-table">
              <thead>
                <tr>
                  <th onClick={() => handleReqSortClick('requirement_date')} style={{ cursor: 'pointer' }}>
                    Date{getReqSortIndicator('requirement_date')}
                  </th>
                  <th onClick={() => handleReqSortClick('requirement_end_date')} style={{ cursor: 'pointer' }}>
                    End Date{getReqSortIndicator('requirement_end_date')}
                  </th>
                  <th onClick={() => handleReqSortClick('room_or_location')} style={{ cursor: 'pointer' }}>
                    Room{getReqSortIndicator('room_or_location')}
                  </th>
                  <th onClick={() => handleReqSortClick('set_time')} style={{ cursor: 'pointer' }}>
                    Set{getReqSortIndicator('set_time')}
                  </th>
                  <th onClick={() => handleReqSortClick('start_time')} style={{ cursor: 'pointer' }}>
                    Start{getReqSortIndicator('start_time')}
                  </th>
                  <th onClick={() => handleReqSortClick('end_time')} style={{ cursor: 'pointer' }}>
                    End{getReqSortIndicator('end_time')}
                  </th>
                  <th onClick={() => handleReqSortClick('strike_time')} style={{ cursor: 'pointer' }}>
                    Strike{getReqSortIndicator('strike_time')}
                  </th>
                  <th onClick={() => handleReqSortClick('position')} style={{ cursor: 'pointer' }}>
                    Position{getReqSortIndicator('position')}
                  </th>
                  <th>Coverage</th>
                  <th>Assigned Techs</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequirements.map(req => {
                  const coverage = calculateCoverage(req);
                  const assignedNames = getAssignedTechNames(req);
                  
                  return (
                    <tr key={req.id}>
                      <td>
                        <EditableCell
                          value={req.requirement_date}
                          type="date"
                          onSave={(value) => handleRequirementEditSave(req.id, 'requirement_date', value)}
                        />
                      </td>
                      <td>
                        <EditableCell
                          value={req.requirement_end_date || ''}
                          type="date"
                          onSave={(value) => handleRequirementEditSave(req.id, 'requirement_end_date', value)}
                        />
                      </td>
                      <td>
                        <EditableCell
                          value={req.room_or_location}
                          onSave={(value) => handleRequirementEditSave(req.id, 'room_or_location', value)}
                        />
                      </td>
                      <td>
                        <EditableCell
                          value={req.set_time || ''}
                          type="time"
                          onSave={(value) => handleRequirementEditSave(req.id, 'set_time', value)}
                        />
                      </td>
                      <td>
                        <EditableCell
                          value={req.start_time}
                          type="time"
                          onSave={(value) => handleRequirementEditSave(req.id, 'start_time', value)}
                        />
                      </td>
                      <td>
                        <EditableCell
                          value={req.end_time}
                          type="time"
                          onSave={(value) => handleRequirementEditSave(req.id, 'end_time', value)}
                        />
                      </td>
                      <td>
                        <EditableCell
                          value={req.strike_time || ''}
                          type="time"
                          onSave={(value) => handleRequirementEditSave(req.id, 'strike_time', value)}
                        />
                      </td>
                      <td>
                        <EditableCell
                          value={req.position || ''}
                          onSave={(value) => handleRequirementEditSave(req.id, 'position', value)}
                        />
                      </td>
                      <td style={{ fontWeight: 'bold', textAlign: 'center' }}>
                        {coverage.text}
                      </td>
                      <td>{assignedNames}</td>
                      <td>
                        {!coverage.isFull && (
                          <button
                            type="button"
                            className="btn-small btn-success"
                            onClick={() => {
                              console.log('🔴 Assign clicked for req:', req.id, req);
                              handleAssignRequirement(req);
                            }}
                            title="Assign a technician to this requirement"
                            style={{ cursor: 'pointer', zIndex: 10, position: 'relative' }}
                          >
                            Assign
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-small btn-delete"
                          onClick={() => handleDeleteRequirement(req.id)}
                          style={{ marginLeft: coverage.isFull ? '0' : '4px', cursor: 'pointer' }}
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

      {/* ASSIGNMENTS SECTION */}
      <section className="assignments-section">
        <h2>Assignments</h2>

        {/* FORM */}
        <form onSubmit={handleAddAssignment} className="assignment-form">
          <h3>Add Assignment</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Technician</label>
              <select name="technicianid" value={formData.technicianid} onChange={handleFormChange} required>
                <option value="">-- Select --</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
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
              <label>Rate Type</label>
              <select name="ratetype" value={formData.ratetype} onChange={handleFormChange}>
                {RATETYPE.map(rt => (
                  <option key={rt} value={rt}>{rt}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Hours</label>
              <input
                type="number"
                name="hoursworked"
                placeholder="0.00"
                value={formData.hoursworked}
                onChange={handleFormChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
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
            <div className="form-group">
              <label>End Time</label>
              <input
                type="time"
                name="endtime"
                value={formData.endtime}
                onChange={handleFormChange}
              />
            </div>
            <button type="submit" className="btn btn-success">Add Assignment</button>
          </div>
        </form>

        {/* FILTER CONTROLS */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input
            type="date"
            name="dateFrom"
            value={assignFilters.dateFrom}
            onChange={handleAssignFilterChange}
            style={{ flex: 1, minWidth: '120px' }}
          />
          <input
            type="date"
            name="dateTo"
            value={assignFilters.dateTo}
            onChange={handleAssignFilterChange}
            style={{ flex: 1, minWidth: '120px' }}
          />
          <input
            type="text"
            name="technician"
            placeholder="Filter by tech..."
            value={assignFilters.technician}
            onChange={handleAssignFilterChange}
            style={{ flex: 1, minWidth: '120px' }}
          />
          <input
            type="text"
            name="position"
            placeholder="Filter by position..."
            value={assignFilters.position}
            onChange={handleAssignFilterChange}
            style={{ flex: 1, minWidth: '120px' }}
          />
          <button onClick={clearAssignFilters} className="btn btn-secondary">Clear</button>
        </div>

        {/* ASSIGNMENTS TABLE */}
        {filteredAssignments.length === 0 ? (
          <div className="requirements-empty-state">No assignments yet. Add one above.</div>
        ) : (
          <div className="assignments-table-container">
            <table className="assignments-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedAssignmentIds.length === assignments.length && assignments.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th onClick={() => handleAssignSortClick('technician_name')} style={{ cursor: 'pointer' }}>
                    Technician{getAssignSortIndicator('technician_name')}
                  </th>
                  <th onClick={() => handleAssignSortClick('assignment_date')} style={{ cursor: 'pointer' }}>
                    Date{getAssignSortIndicator('assignment_date')}
                  </th>
                  <th onClick={() => handleAssignSortClick('start_time')} style={{ cursor: 'pointer' }}>
                    Start{getAssignSortIndicator('start_time')}
                  </th>
                  <th onClick={() => handleAssignSortClick('end_time')} style={{ cursor: 'pointer' }}>
                    End{getAssignSortIndicator('end_time')}
                  </th>
                  <th onClick={() => handleAssignSortClick('position')} style={{ cursor: 'pointer' }}>
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
                  <tr key={a.id} style={{ backgroundColor: selectedAssignmentIds.includes(a.id) ? 'rgba(0,0,0,0.1)' : 'transparent' }}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedAssignmentIds.includes(a.id)}
                        onChange={() => toggleAssignmentSelect(a.id)}
                        onContextMenu={(e) => handleContextMenu(e, a.id)}
                      />
                    </td>
                    <td>{a.technician_name}</td>
                    <td>
                      <EditableCell
                        value={a.assignment_date || ''}
                        type="date"
                        onSave={(value) => handleInlineEditSave(a.id, 'assignment_date', value)}
                      />
                    </td>
                    <td>
                      <EditableCell
                        value={a.start_time || ''}
                        type="time"
                        onSave={(value) => handleInlineEditSave(a.id, 'start_time', value)}
                      />
                    </td>
                    <td>
                      <EditableCell
                        value={a.end_time || ''}
                        type="time"
                        onSave={(value) => handleInlineEditSave(a.id, 'end_time', value)}
                      />
                    </td>
                    <td>
                      <EditableCell
                        value={a.position || ''}
                        onSave={(value) => handleInlineEditSave(a.id, 'position', value)}
                      />
                    </td>
                    <td>
                      <EditableCell
                        value={a.hours_worked?.toString() || '0'}
                        type="number"
                        onSave={(value) => handleInlineEditSave(a.id, 'hours_worked', parseFloat(value) || 0)}
                      />
                    </td>
                    <td>
                      <EditableSelectCell
                        value={a.rate_type}
                        options={RATETYPE}
                        onSave={(value) => handleInlineEditSave(a.id, 'rate_type', value)}
                      />
                    </td>
                    <td>${(a.calculated_pay || 0).toFixed(2)}</td>
                    <td>${(a.customer_bill || 0).toFixed(2)}</td>
                    <td>
                      <button className="btn-small btn-delete" onClick={() => handleDelete(a.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TOTALS */}
        <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <strong>Total Tech Pay:</strong> ${totalPay.toFixed(2)}&nbsp;&nbsp;&nbsp;
          <strong>Total Customer Bill:</strong> ${totalBill.toFixed(2)}
        </div>

        {/* BULK EDIT MODAL */}
        {bulkEditModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '90%'
            }}>
              <h3>Bulk Edit Assignments</h3>
              <div style={{ marginBottom: '16px' }}>
                <label>Date</label>
                <input type="date" name="assignment_date" value={bulkEditValues.assignment_date} onChange={handleBulkEditValueChange} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label>Start Time</label>
                <input type="time" name="start_time" value={bulkEditValues.start_time} onChange={handleBulkEditValueChange} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label>End Time</label>
                <input type="time" name="end_time" value={bulkEditValues.end_time} onChange={handleBulkEditValueChange} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label>Position</label>
                <input type="text" name="position" value={bulkEditValues.position} onChange={handleBulkEditValueChange} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setBulkEditModal(null)} className="btn btn-secondary">Cancel</button>
                <button onClick={handleBulkEditSubmit} className="btn btn-success">Apply</button>
              </div>
            </div>
          </div>
        )}

        {/* CONTEXT MENU */}
        {contextMenu && (
          <div style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            zIndex: 1001,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}>
            <button
              onClick={openBulkEditModal}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 16px',
                border: 'none',
                background: 'none',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              Bulk Edit Selected
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default EventDetails;