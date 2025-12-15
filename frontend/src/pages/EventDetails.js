// frontend/src/pages/EventDetails.js
import React, { useEffect, useState } from 'react';
import {
  getEvent,
  getTechnicians,
  deleteEvent,
  getEventRequirementsWithCoverage,
  createRequirement,
  deleteRequirement,
  updateAssignment,
  updateEvent,
  bulkCreateAssignments
} from '../utils/api';
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
  const [event, setEvent] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [error, setError] = useState(null);

  const [editingEventData, setEditingEventData] = useState({
    start_date: '',
    end_date: ''
  });

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

  const [reqSortField, setReqSortField] = useState('requirement_date');
  const [reqSortDirection, setReqSortDirection] = useState('asc');
  const [reqFilters, setReqFilters] = useState({
    dateFrom: '',
    dateTo: '',
    room: '',
    position: ''
  });

  const [assignSortField, setAssignSortField] = useState('assignment_date');
  const [assignSortDirection, setAssignSortDirection] = useState('asc');
  const [assignFilters, setAssignFilters] = useState({
    dateFrom: '',
    dateTo: '',
    technician: '',
    position: ''
  });

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

  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [bulkEditModal, setBulkEditModal] = useState(null);
  const [bulkEditValues, setBulkEditValues] = useState({
    assignment_date: '',
    start_time: '',
    end_time: '',
    position: ''
  });

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

  useEffect(() => {
    if (event) {
      setEditingEventData({
        start_date: event.start_date || '',
        end_date: event.end_date || ''
      });
    }
  }, [event]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

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
      [name]: name === 'techs_needed' ? (value === '' ? '' : parseInt(value, 10) || 1) : value
    }));
  };

  const handleBulkEditValueChange = (e) => {
    const { name, value } = e.target;
    setBulkEditValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveEventDates = async () => {
    try {
      await updateEvent(eventId, {
        start_date: editingEventData.start_date || null,
        end_date: editingEventData.end_date || null
      });
      setEvent(prev => ({
        ...prev,
        start_date: editingEventData.start_date,
        end_date: editingEventData.end_date
      }));
      alert('✅ Event dates updated successfully!');
    } catch (err) {
      console.error('Error saving dates:', err);
      alert(`❌ Failed to save dates: ${err.message}`);
    }
  };

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
    return (
      assignments
        .filter(a => a.requirement_id === requirement.id)
        .map(a => a.technician_name)
        .join(', ') || '—'
    );
  };

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

  const handleRequirementEditSave = async (requirementId, field, value) => {
    try {
      console.log(`💾 Saving requirement ${field}:`, value);
      const requirement = requirements.find(r => r.id === requirementId);
      if (requirement && requirement[field] === value) {
        console.log('No change detected, skipping update');
        return;
      }

      // Use updateRequirement from the hook or API for this
      // For now, we'll just update locally and show a message
      setRequirements(prevRequirements =>
        prevRequirements.map(r =>
          r.id === requirementId ? { ...r, [field]: value } : r
        )
      );
      console.log('✅ Update successful');
    } catch (err) {
      console.error('❌ Error saving requirement:', err);
      alert(`Failed to save ${field}: ${err.message}`);
    }
  };

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    if (!formData.technician_id || !formData.rate_type) return;

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

  const toggleAssignmentSelect = (assignmentId) => {
    setSelectedAssignmentIds(prev =>
      prev.includes(assignmentId) ? prev.filter(id => id !== assignmentId) : [...prev, assignmentId]
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
      setBulkEditValues({ assignment_date: '', start_time: '', end_time: '', position: '' });
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
      console.log('🔄 BULK UPDATE', {
        eventId,
        assignmentIds: bulkEditModal.assignmentIds,
        updates
      });
      
      // Update each assignment individually
      await Promise.all(
        bulkEditModal.assignmentIds.map(assignmentId =>
          updateAssignment(assignmentId, updates)
        )
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

  const handleAddRequirement = async (e) => {
    e.preventDefault();
    if (!reqForm.requirement_date || !reqForm.room_or_location || !reqForm.start_time || !reqForm.end_time) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const res = await createRequirement({
        event_id: eventId,
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
      technician_id: '',
      position: requirement.position || '',
      hours_worked: requirement.techs_needed || '',
      rate_type: 'hourly',
      assignment_date: requirement.requirement_date || '',
      start_time: requirement.start_time || '',
      end_time: requirement.end_time || '',
      requirement_id: requirement.id
    });
  };

  const handleDeleteRequirement = async (id) => {
    if (!window.confirm('Delete this requirement?')) return;
    try {
      await deleteRequirement(id);
      setRequirements(requirements.filter(r => r.id !== id));
    } catch (err) {
      console.error('Error deleting requirement:', err);
      setReqError(err.message);
    }
  };

  if (loadingEvent) return <div className="event-details-loading">Loading event...</div>;
  if (error) return <div className="event-details-error">Error: {error}</div>;
  if (!event) return <div className="event-details-error">Event not found</div>;

  const filteredAndSortedRequirements = getFilteredAndSortedRequirements();
  const filteredAndSortedAssignments = getFilteredAndSortedAssignments();

  return (
    <div className="event-details-container">
      <div className="event-details-header">
        <button onClick={onBack} className="btn-back">← Back</button>
        <h1>{event.name}</h1>
        <button onClick={handleDeleteEvent} className="btn-delete-event">Delete Event</button>
      </div>

      <div className="event-info-card">
        <h2>Event Information</h2>
        <div className="event-info-row">
          <label>
            Start Date:
            <input
              type="date"
              value={editingEventData.start_date}
              onChange={(e) =>
                setEditingEventData(prev => ({ ...prev, start_date: e.target.value }))
              }
            />
          </label>
          <label>
            End Date:
            <input
              type="date"
              value={editingEventData.end_date}
              onChange={(e) =>
                setEditingEventData(prev => ({ ...prev, end_date: e.target.value }))
              }
            />
          </label>
          <button onClick={handleSaveEventDates} className="btn-save">Save Dates</button>
        </div>
      </div>

      {/* Requirements Section would continue here with full table, filters, etc. */}
      {/* Assignments Section would continue here with full table, filters, etc. */}
    </div>
  );
};

export default EventDetails;
