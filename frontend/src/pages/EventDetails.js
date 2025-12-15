// frontend/src/pages/EventDetails.js
// Event details page with requirements and assignments management

import React, { useEffect, useState } from 'react';
import {
  getEvent,
  getTechnicians,
  deleteEvent,
  updateEvent,
} from '../utils/api';
import { useAssignments } from '../hooks/useAssignments';
import { useRequirements } from '../hooks/useRequirements';
import { useTechnicians } from '../hooks/useTechnicians';
import EditableCell from '../components/EditableCell';
import EditableSelectCell from '../components/EditableSelectCell';
import '../styles/EventDetails.css';
import '../styles/table-dark-mode.css';
import '../styles/requirements-table.css';
import '../styles/requirements-form.css';
import '../styles/assignments-table.css';

const RATETYPE = ['hourly', 'half-day', 'full-day'];
const BULK_EDIT_FIELDS = ['assignmentdate', 'starttime', 'endtime', 'position'];

const EventDetails = ({ eventId, onBack }) => {
  const [event, setEvent] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [error, setError] = useState(null);
  const [editingEventData, setEditingEventData] = useState({
    startdate: '',
    enddate: '',
  });

  // Use hooks for assignments, requirements, and technicians
  const {
    assignments: hookAssignments,
    loading: loadingAssignments,
    addAssignment,
    removeAssignment,
    updateAssignmentField,
    refreshAssignments,
  } = useAssignments(eventId);

  const {
    requirements,
    loading: loadingRequirements,
    addRequirement,
    removeRequirement,
    updateRequirementField,
  } = useRequirements(eventId);

  const { technicians, loading: loadingTechs } = useTechnicians();

  const [assignments, setAssignments] = useState([]);
  useEffect(() => {
    setAssignments(hookAssignments);
  }, [hookAssignments]);

  // Form states
  const [reqForm, setReqForm] = useState({
    requirementdate: '',
    requirementenddate: '',
    roomorlocation: '',
    settime: '',
    starttime: '',
    endtime: '',
    striketime: '',
    position: '',
    techsneeded: 1,
  });

  const [formData, setFormData] = useState({
    technicianid: '',
    position: '',
    hoursworked: '',
    ratetype: 'hourly',
    assignmentdate: '',
    starttime: '',
    endtime: '',
    requirementid: '',
  });

  // Sorting and filtering
  const [reqSortField, setReqSortField] = useState('requirementdate');
  const [reqSortDirection, setReqSortDirection] = useState('asc');
  const [reqFilters, setReqFilters] = useState({
    dateFrom: '',
    dateTo: '',
    room: '',
    position: '',
  });

  const [assignSortField, setAssignSortField] = useState('assignmentdate');
  const [assignSortDirection, setAssignSortDirection] = useState('asc');
  const [assignFilters, setAssignFilters] = useState({
    dateFrom: '',
    dateTo: '',
    technician: '',
    position: '',
  });

  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [bulkEditModal, setBulkEditModal] = useState(null);
  const [bulkEditValues, setBulkEditValues] = useState({
    assignmentdate: '',
    starttime: '',
    endtime: '',
    position: '',
  });

  // Load event on mount
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingEvent(true);
        const eventRes = await getEvent(eventId);
        const eventData = Array.isArray(eventRes) ? eventRes[0] : eventRes;
        setEvent(eventData);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingEvent(false);
      }
    };

    if (eventId) load();
  }, [eventId]);

  useEffect(() => {
    if (event) {
      setEditingEventData({
        startdate: event.startdate || '',
        enddate: event.enddate || '',
      });
    }
  }, [event]);

  // Close context menu on click
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Event handler: save event dates
  const handleSaveEventDates = async () => {
    try {
      await updateEvent(eventId, {
        startdate: editingEventData.startdate || null,
        enddate: editingEventData.enddate || null,
      });
      setEvent((prev) => ({
        ...prev,
        startdate: editingEventData.startdate,
        enddate: editingEventData.enddate,
      }));
      alert('✅ Event dates updated successfully!');
    } catch (err) {
      console.error('Error saving dates:', err);
      alert(`❌ Failed to save dates: ${err.message}`);
    }
  };

  // Requirement form handlers
  const handleReqFormChange = (e) => {
    const { name, value } = e.target;
    setReqForm((prev) => ({
      ...prev,
      [name]:
        name === 'techsneeded' ? (value === '' ? '' : parseInt(value, 10) || 1) : value,
    }));
  };

  const handleAddRequirement = async (e) => {
    e.preventDefault();
    if (
      !reqForm.requirementdate ||
      !reqForm.roomorlocation ||
      !reqForm.starttime ||
      !reqForm.endtime
    ) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await addRequirement({
        requirementdate: reqForm.requirementdate,
        requirementenddate: reqForm.requirementenddate,
        roomorlocation: reqForm.roomorlocation,
        settime: reqForm.settime,
        starttime: reqForm.starttime,
        endtime: reqForm.endtime,
        striketime: reqForm.striketime,
        position: reqForm.position || null,
        techsneeded: reqForm.techsneeded || 1,
      });

      setReqForm({
        requirementdate: '',
        requirementenddate: '',
        roomorlocation: '',
        settime: '',
        starttime: '',
        endtime: '',
        striketime: '',
        position: '',
        techsneeded: 1,
      });
    } catch (err) {
      console.error('Error creating requirement:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteRequirement = async (id) => {
    if (!window.confirm('Delete this requirement?')) return;
    try {
      await removeRequirement(id);
    } catch (err) {
      console.error('Error deleting requirement:', err);
      alert(`Failed to delete: ${err.message}`);
    }
  };

  // Assignment form handlers
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'hoursworked'
          ? value === ''
            ? ''
            : parseFloat(value) || ''
          : value,
    }));
  };

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    if (!formData.technicianid || !formData.ratetype) return;

    const hours = parseFloat(formData.hoursworked || 0);
    const tech = technicians.find((t) => t.id === formData.technicianid);

    try {
      await addAssignment({
        technicianid: formData.technicianid,
        position: formData.position || (tech ? tech.position : null),
        hoursworked: hours,
        ratetype: formData.ratetype,
        calculatedpay: 0,
        customerbill: 0,
        assignmentdate: formData.assignmentdate || null,
        starttime: formData.starttime || null,
        endtime: formData.endtime || null,
        requirementid: formData.requirementid || null,
      });

      setFormData({
        technicianid: '',
        position: '',
        hoursworked: '',
        ratetype: 'hourly',
        assignmentdate: '',
        starttime: '',
        endtime: '',
        requirementid: '',
      });
    } catch (err) {
      console.error('Failed to add assignment', err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleAssignRequirement = (requirement) => {
    setFormData({
      technicianid: '',
      position: requirement.position || '',
      hoursworked: requirement.techsneeded || '',
      ratetype: 'hourly',
      assignmentdate: requirement.requirementdate || '',
      starttime: requirement.starttime || '',
      endtime: requirement.endtime || '',
      requirementid: requirement.id,
    });
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Remove this assignment?')) return;
    try {
      await removeAssignment(id);
    } catch (err) {
      console.error('Failed to delete assignment', err);
      alert(`Error: ${err.message}`);
    }
  };

  // Sorting and filtering
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
    setReqFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearReqFilters = () => {
    setReqFilters({ dateFrom: '', dateTo: '', room: '', position: '' });
    setReqSortField('requirementdate');
    setReqSortDirection('asc');
  };

  const getFilteredAndSortedRequirements = () => {
    let filtered = requirements;

    if (reqFilters.dateFrom) {
      filtered = filtered.filter((r) => r.requirementdate >= reqFilters.dateFrom);
    }
    if (reqFilters.dateTo) {
      filtered = filtered.filter((r) => r.requirementdate <= reqFilters.dateTo);
    }
    if (reqFilters.room) {
      filtered = filtered.filter((r) =>
        r.roomorlocation?.toLowerCase().includes(reqFilters.room.toLowerCase())
      );
    }
    if (reqFilters.position) {
      filtered = filtered.filter((r) =>
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
    setAssignFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearAssignFilters = () => {
    setAssignFilters({ dateFrom: '', dateTo: '', technician: '', position: '' });
    setAssignSortField('assignmentdate');
    setAssignSortDirection('asc');
  };

  const getFilteredAndSortedAssignments = () => {
    let filtered = assignments;

    if (assignFilters.dateFrom) {
      filtered = filtered.filter((a) => a.assignmentdate >= assignFilters.dateFrom);
    }
    if (assignFilters.dateTo) {
      filtered = filtered.filter((a) => a.assignmentdate <= assignFilters.dateTo);
    }
    if (assignFilters.technician) {
      filtered = filtered.filter((a) =>
        a.technicianname?.toLowerCase().includes(assignFilters.technician.toLowerCase())
      );
    }
    if (assignFilters.position) {
      filtered = filtered.filter((a) =>
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

  // Calculate requirement coverage
  const calculateCoverage = (requirement) => {
    const assignedCount = assignments.filter(
      (a) => a.requirementid === requirement.id
    ).length;
    const needed = requirement.techsneeded || 1;
    return {
      assigned: assignedCount,
      needed: needed,
      isFull: assignedCount >= needed,
      text: `${assignedCount}/${needed}`,
    };
  };

  const getAssignedTechNames = (requirement) => {
    return (
      assignments
        .filter((a) => a.requirementid === requirement.id)
        .map((a) => a.technicianname)
        .join(', ') || '—'
    );
  };

  // Inline editing
  const handleInlineEditSave = async (assignmentId, field, value) => {
    try {
      await updateAssignmentField(assignmentId, { [field]: value || null });
    } catch (err) {
      console.error(`Error saving ${field}:`, err);
      alert(`Failed to save ${field}: ${err.message}`);
      await refreshAssignments();
    }
  };

  const handleRequirementEditSave = async (requirementId, field, value) => {
    try {
      await updateRequirementField(requirementId, { [field]: value || null });
    } catch (err) {
      console.error(`Error saving ${field}:`, err);
      alert(`Failed to save ${field}: ${err.message}`);
    }
  };

  // Bulk selection and editing
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
        : [assignmentId],
    });
  };

  const openBulkEditModal = () => {
    if (contextMenu?.assignmentIds?.length) {
      setBulkEditModal({ assignmentIds: contextMenu.assignmentIds });
      setBulkEditValues({
        assignmentdate: '',
        starttime: '',
        endtime: '',
        position: '',
      });
      setContextMenu(null);
    }
  };

  const handleBulkEditValueChange = (e) => {
    const { name, value } = e.target;
    setBulkEditValues((prev) => ({ ...prev, [name]: value }));
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
      await Promise.all(
        bulkEditModal.assignmentIds.map((assignmentId) =>
          updateAssignmentField(assignmentId, updates)
        )
      );

      await refreshAssignments();
      setBulkEditModal(null);
      setSelectedAssignmentIds([]);
      alert('✅ Assignments updated!');
    } catch (err) {
      console.error('Bulk update error:', err);
      alert(`Failed: ${err.message}`);
      setBulkEditModal(null);
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

  // Render
  if (loadingEvent) return <div className="loading">Loading event...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!event) return <div>Event not found</div>;

  return (
    <div className="event-details">
      <button className="back-button" onClick={onBack}>
        ← Back to Events
      </button>

      {/* Event header */}
      <div className="event-header">
        <h1>{event.name}</h1>
        <p>
          Client: {event.clientname} | Phone: {event.clientphone} | Email: {event.clientemail}
        </p>
      </div>

      {/* Event dates editor */}
      <div className="event-dates-editor">
        <label>
          Start Date:
          <input
            type="date"
            value={editingEventData.startdate}
            onChange={(e) =>
              setEditingEventData((prev) => ({
                ...prev,
                startdate: e.target.value,
              }))
            }
          />
        </label>
        <label>
          End Date:
          <input
            type="date"
            value={editingEventData.enddate}
            onChange={(e) =>
              setEditingEventData((prev) => ({
                ...prev,
                enddate: e.target.value,
              }))
            }
          />
        </label>
        <button onClick={handleSaveEventDates}>Save Dates</button>
        <button onClick={handleDeleteEvent} className="btn-danger">
          Delete Event
        </button>
      </div>

      {/* Requirements section */}
      <section className="requirements-section">
        <h2>Requirements</h2>

        <form onSubmit={handleAddRequirement} className="req-form">
          <input
            type="date"
            name="requirementdate"
            value={reqForm.requirementdate}
            onChange={handleReqFormChange}
            placeholder="Requirement Date"
            required
          />
          <input
            type="date"
            name="requirementenddate"
            value={reqForm.requirementenddate}
            onChange={handleReqFormChange}
            placeholder="Requirement End Date"
          />
          <input
            type="text"
            name="roomorlocation"
            value={reqForm.roomorlocation}
            onChange={handleReqFormChange}
            placeholder="Room/Location"
            required
          />
          <input
            type="time"
            name="settime"
            value={reqForm.settime}
            onChange={handleReqFormChange}
            placeholder="Set Time"
          />
          <input
            type="time"
            name="starttime"
            value={reqForm.starttime}
            onChange={handleReqFormChange}
            placeholder="Start Time"
            required
          />
          <input
            type="time"
            name="endtime"
            value={reqForm.endtime}
            onChange={handleReqFormChange}
            placeholder="End Time"
            required
          />
          <input
            type="time"
            name="striketime"
            value={reqForm.striketime}
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
            name="techsneeded"
            value={reqForm.techsneeded}
            onChange={handleReqFormChange}
            min="1"
            placeholder="Techs Needed"
          />
          <button type="submit">Add Requirement</button>
        </form>

        {/* Requirements filters */}
        <div className="filters">
          <input
            type="date"
            name="dateFrom"
            value={reqFilters.dateFrom}
            onChange={handleReqFilterChange}
            placeholder="From"
          />
          <input
            type="date"
            name="dateTo"
            value={reqFilters.dateTo}
            onChange={handleReqFilterChange}
            placeholder="To"
          />
          <input
            type="text"
            name="room"
            value={reqFilters.room}
            onChange={handleReqFilterChange}
            placeholder="Room"
          />
          <input
            type="text"
            name="position"
            value={reqFilters.position}
            onChange={handleReqFilterChange}
            placeholder="Position"
          />
          <button onClick={clearReqFilters}>Clear Filters</button>
        </div>

        {/* Requirements table */}
        <table className="requirements-table">
          <thead>
            <tr>
              <th onClick={() => handleReqSortClick('requirementdate')}>
                Date {getReqSortIndicator('requirementdate')}
              </th>
              <th onClick={() => handleReqSortClick('roomorlocation')}>
                Room {getReqSortIndicator('roomorlocation')}
              </th>
              <th onClick={() => handleReqSortClick('starttime')}>
                Start {getReqSortIndicator('starttime')}
              </th>
              <th onClick={() => handleReqSortClick('endtime')}>
                End {getReqSortIndicator('endtime')}
              </th>
              <th onClick={() => handleReqSortClick('position')}>
                Position {getReqSortIndicator('position')}
              </th>
              <th onClick={() => handleReqSortClick('techsneeded')}>
                Techs {getReqSortIndicator('techsneeded')}
              </th>
              <th>Coverage</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {getFilteredAndSortedRequirements().map((req) => {
              const coverage = calculateCoverage(req);
              return (
                <tr key={req.id}>
                  <td>{req.requirementdate}</td>
                  <td>{req.roomorlocation}</td>
                  <td>{req.starttime}</td>
                  <td>{req.endtime}</td>
                  <td>{req.position}</td>
                  <td>{req.techsneeded}</td>
                  <td className={coverage.isFull ? 'full' : 'partial'}>
                    {coverage.text} - {getAssignedTechNames(req)}
                  </td>
                  <td>
                    <button onClick={() => handleAssignRequirement(req)}>
                      Assign
                    </button>
                    <button onClick={() => handleDeleteRequirement(req.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Assignments section */}
      <section className="assignments-section">
        <h2>Assignments</h2>

        <form onSubmit={handleAddAssignment} className="assignment-form">
          <select
            name="technicianid"
            value={formData.technicianid}
            onChange={handleFormChange}
            required
          >
            <option value="">Select Technician</option>
            {technicians.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.name} ({tech.position})
              </option>
            ))}
          </select>
          <input
            type="text"
            name="position"
            value={formData.position}
            onChange={handleFormChange}
            placeholder="Position"
          />
          <input
            type="number"
            name="hoursworked"
            value={formData.hoursworked}
            onChange={handleFormChange}
            step="0.5"
            placeholder="Hours Worked"
          />
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
          <input
            type="date"
            name="assignmentdate"
            value={formData.assignmentdate}
            onChange={handleFormChange}
          />
          <input
            type="time"
            name="starttime"
            value={formData.starttime}
            onChange={handleFormChange}
          />
          <input
            type="time"
            name="endtime"
            value={formData.endtime}
            onChange={handleFormChange}
          />
          <select
            name="requirementid"
            value={formData.requirementid}
            onChange={handleFormChange}
          >
            <option value="">Link to Requirement (optional)</option>
            {requirements.map((req) => (
              <option key={req.id} value={req.id}>
                {req.roomorlocation} - {req.starttime}
              </option>
            ))}
          </select>
          <button type="submit">Add Assignment</button>
        </form>

        {/* Assignment filters */}
        <div className="filters">
          <input
            type="date"
            name="dateFrom"
            value={assignFilters.dateFrom}
            onChange={handleAssignFilterChange}
            placeholder="From"
          />
          <input
            type="date"
            name="dateTo"
            value={assignFilters.dateTo}
            onChange={handleAssignFilterChange}
            placeholder="To"
          />
          <input
            type="text"
            name="technician"
            value={assignFilters.technician}
            onChange={handleAssignFilterChange}
            placeholder="Technician"
          />
          <input
            type="text"
            name="position"
            value={assignFilters.position}
            onChange={handleAssignFilterChange}
            placeholder="Position"
          />
          <button onClick={clearAssignFilters}>Clear Filters</button>
        </div>

        {/* Assignments table */}
        <table className="assignments-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedAssignmentIds.length === assignments.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th onClick={() => handleAssignSortClick('technicianname')}>
                Technician {getAssignSortIndicator('technicianname')}
              </th>
              <th onClick={() => handleAssignSortClick('position')}>
                Position {getAssignSortIndicator('position')}
              </th>
              <th onClick={() => handleAssignSortClick('assignmentdate')}>
                Date {getAssignSortIndicator('assignmentdate')}
              </th>
              <th onClick={() => handleAssignSortClick('starttime')}>
                Start {getAssignSortIndicator('starttime')}
              </th>
              <th onClick={() => handleAssignSortClick('endtime')}>
                End {getAssignSortIndicator('endtime')}
              </th>
              <th onClick={() => handleAssignSortClick('hoursworked')}>
                Hours {getAssignSortIndicator('hoursworked')}
              </th>
              <th onClick={() => handleAssignSortClick('calculatedpay')}>
                Pay {getAssignSortIndicator('calculatedpay')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {getFilteredAndSortedAssignments().map((assign) => (
              <tr
                key={assign.id}
                onContextMenu={(e) => handleContextMenu(e, assign.id)}
                className={selectedAssignmentIds.includes(assign.id) ? 'selected' : ''}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={selectedAssignmentIds.includes(assign.id)}
                    onChange={() => toggleAssignmentSelect(assign.id)}
                  />
                </td>
                <td>{assign.technicianname}</td>
                <EditableCell
                  value={assign.position}
                  onSave={(value) => handleInlineEditSave(assign.id, 'position', value)}
                />
                <EditableCell
                  value={assign.assignmentdate}
                  onSave={(value) => handleInlineEditSave(assign.id, 'assignmentdate', value)}
                />
                <EditableCell
                  value={assign.starttime}
                  onSave={(value) => handleInlineEditSave(assign.id, 'starttime', value)}
                />
                <EditableCell
                  value={assign.endtime}
                  onSave={(value) => handleInlineEditSave(assign.id, 'endtime', value)}
                />
                <EditableCell
                  value={assign.hoursworked}
                  onSave={(value) => handleInlineEditSave(assign.id, 'hoursworked', value)}
                />
                <td>${assign.calculatedpay?.toFixed(2) || '0.00'}</td>
                <td>
                  <button onClick={() => handleDeleteAssignment(assign.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {contextMenu && (
          <div
            className="context-menu"
            style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y }}
          >
            <button onClick={openBulkEditModal}>Bulk Edit Selected</button>
            <button onClick={() => setContextMenu(null)}>Cancel</button>
          </div>
        )}

        {bulkEditModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Bulk Edit Assignments</h3>
              <input
                type="date"
                name="assignmentdate"
                value={bulkEditValues.assignmentdate}
                onChange={handleBulkEditValueChange}
                placeholder="Assignment Date"
              />
              <input
                type="time"
                name="starttime"
                value={bulkEditValues.starttime}
                onChange={handleBulkEditValueChange}
                placeholder="Start Time"
              />
              <input
                type="time"
                name="endtime"
                value={bulkEditValues.endtime}
                onChange={handleBulkEditValueChange}
                placeholder="End Time"
              />
              <input
                type="text"
                name="position"
                value={bulkEditValues.position}
                onChange={handleBulkEditValueChange}
                placeholder="Position"
              />
              <button onClick={handleBulkEditSubmit}>Apply Changes</button>
              <button onClick={() => setBulkEditModal(null)}>Cancel</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default EventDetails;
