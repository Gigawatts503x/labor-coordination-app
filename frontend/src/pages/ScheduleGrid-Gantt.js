// frontend/src/pages/ScheduleGrid-Gantt.js
import React, { useState, useEffect, useRef } from 'react';
import { useEvents } from '../hooks/useEvents';
import { useTechnicians } from '../hooks/useTechnicians';
import { useSettings } from '../hooks/useSettings';
import { getScheduleData, updateAssignment } from '../utils/api';
import rateCalculator from '../utils/rateCalculator';
import '../styles/ScheduleGrid-Gantt.css';

const ScheduleGridGantt = ({ onNavigateToEvent }) => {
  const { events, loading: eventsLoading } = useEvents();
  const { technicians, loading: techsLoading } = useTechnicians();
  const { getRatesForCalculation } = useSettings();

  // Data
  const [assignments, setAssignments] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);

  // UI State
  const [draggedTech, setDraggedTech] = useState(null);
  const [draggedAssignmentId, setDraggedAssignmentId] = useState(null);
  const [dragMode, setDragMode] = useState(null); // 'start' | 'end' | 'move'
  const [hoveredEventId, setHoveredEventId] = useState(null);
  const [expandedEvents, setExpandedEvents] = useState({});
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [filterTech, setFilterTech] = useState('all');
  const [filterEvent, setFilterEvent] = useState('all');
  const [undoStack, setUndoStack] = useState([]);
  const [conflictWarning, setConflictWarning] = useState(null);

  // Load all data from all events
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setAssignmentsLoading(true);
        const allAssignments = [];
        const allRequirements = [];

        for (const event of events) {
          try {
            const data = await getScheduleData(event.id);
            if (data.assignments) allAssignments.push(...data.assignments);
            if (data.requirements) allRequirements.push(...data.requirements);
          } catch (err) {
            console.warn(`Failed to load data for event ${event.id}:`, err);
          }
        }

        setAssignments(allAssignments);
        setRequirements(allRequirements);
      } catch (error) {
        console.error('Error loading schedule data:', error);
      } finally {
        setAssignmentsLoading(false);
      }
    };

    if (events.length > 0) {
      loadAllData();
    } else {
      setAssignmentsLoading(false);
    }
  }, [events]);

  // ==================== HELPER FUNCTIONS ====================

  const getTech = (techId) => technicians.find(t => t.id === techId);
  const getEvent = (eventId) => events.find(e => e.id === eventId);
  const getRequirement = (reqId) => requirements.find(r => r.id === reqId);

  const timeToMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const minutesToTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Check for conflicts
  const hasConflict = (techId, startTime, endTime, excludeAssignmentId = null) => {
    return assignments.some(a => {
      if (a.technician_id !== techId || a.id === excludeAssignmentId) return false;

      const req = getRequirement(a.requirement_id);
      if (!req) return false;

      const aStart = timeToMinutes(req.start_time);
      const aEnd = timeToMinutes(req.end_time);
      const newStart = timeToMinutes(startTime);
      const newEnd = timeToMinutes(endTime);

      // Handle overnight
      if (aEnd < aStart) aEnd += 24 * 60;
      if (newEnd < newStart) newEnd += 24 * 60;

      return !(newEnd <= aStart || newStart >= aEnd);
    });
  };

  // ==================== DRAG & DROP HANDLERS ====================

  const handleTechDragStart = (e, tech) => {
    setDraggedTech(tech);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleEventDragOver = (e, eventId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setHoveredEventId(eventId);
  };

  const handleEventDrop = (e, eventId, roomId) => {
    e.preventDefault();
    setHoveredEventId(null);

    if (!draggedTech) return;

    // Find a requirement for this event/room
    const requirement = requirements.find(
      r => r.event_id === eventId && r.room_or_location === roomId
    );

    if (!requirement) {
      alert('No requirement found for this room');
      setDraggedTech(null);
      return;
    }

    // Check for conflicts
    if (hasConflict(draggedTech.id, requirement.start_time, requirement.end_time)) {
      setConflictWarning({
        tech: draggedTech,
        requirement,
        override: false
      });
      setDraggedTech(null);
      return;
    }

    // Create new assignment
    createAssignment(draggedTech.id, requirement.id);
    setDraggedTech(null);
  };

  const createAssignment = async (techId, requirementId) => {
    const requirement = getRequirement(requirementId);
    if (!requirement) return;

    const newAssignment = {
      technician_id: techId,
      requirement_id: requirementId,
      position: requirement.position,
      rate_type: 'hourly',
      hours_worked: 1, // Default 1 hour
      tech_rate: null, // Use global default
      bill_rate: null,
      ot_multiplier: null,
      dt_multiplier: null
    };

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    setAssignments([...assignments, { ...newAssignment, id: tempId }]);

    // Save undo state
    setUndoStack([...undoStack, { type: 'create', data: assignments }]);

    // TODO: Call API to create assignment
    // const response = await createAssignment(newAssignment);
    // Update with real ID
  };

  // Handle assignment time drag
  const handleAssignmentMouseDown = (e, assignmentId, mode) => {
    if (e.button !== 0) return; // Only left click

    setDraggedAssignmentId(assignmentId);
    setDragMode(mode);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!draggedAssignmentId || !dragMode) return;

    const assignment = assignments.find(a => a.id === draggedAssignmentId);
    const requirement = getRequirement(assignment?.requirement_id);
    if (!assignment || !requirement) return;

    // Calculate new time based on mouse position
    // (This would require calculating pixel-to-time conversion based on grid layout)
    // Simplified for now - actual implementation needs grid reference
  };

  const handleMouseUp = async () => {
    if (!draggedAssignmentId) {
      setDragMode(null);
      return;
    }

    const assignment = assignments.find(a => a.id === draggedAssignmentId);
    if (assignment) {
      // Save undo state
      setUndoStack([...undoStack, { type: 'update', data: assignments, assignmentId: draggedAssignmentId }]);

      // TODO: Call API to update assignment
      // await updateAssignment(assignment.id, { ...assignment });
    }

    setDraggedAssignmentId(null);
    setDragMode(null);
  };

  // Undo
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const lastState = undoStack[undoStack.length - 1];
    setAssignments(lastState.data);
    setUndoStack(undoStack.slice(0, -1));
  };

  // ==================== INLINE EDITING ====================

  const handleAssignmentFieldChange = async (assignmentId, field, value) => {
    // Update optimistically
    setAssignments(assignments.map(a =>
      a.id === assignmentId ? { ...a, [field]: value } : a
    ));

    // Save undo state
    setUndoStack([...undoStack, { type: 'update', data: assignments }]);

    // TODO: Call API
    // await updateAssignment(assignmentId, { [field]: value });
  };

  // ==================== CALCULATIONS ====================

  const calculateAssignmentPay = (assignment) => {
    const requirement = getRequirement(assignment.requirement_id);
    const event = requirement ? getEvent(requirement.event_id) : null;
    if (!requirement) return null;

    const rates = getRatesForCalculation(event?.id, {
      tech_hourly_rate: assignment.tech_rate,
      bill_hourly_rate: assignment.bill_rate,
      ot_multiplier: assignment.ot_multiplier,
      dt_multiplier: assignment.dt_multiplier
    });

    const calc = rateCalculator.calculateAssignment(
      {
        startTime: requirement.start_time,
        endTime: requirement.end_time,
        techRate: rates.techHourlyRate,
        billRate: rates.billHourlyRate,
        otMultiplier: rates.otMultiplier,
        dtMultiplier: rates.dtMultiplier
      },
      rates
    );

    return calc;
  };

  // ==================== FILTER & RENDER ====================

  const getFilteredAssignments = () => {
    return assignments.filter(a => {
      const matchesTech = filterTech === 'all' || a.technician_id === parseInt(filterTech);
      const requirement = getRequirement(a.requirement_id);
      const event = requirement ? getEvent(requirement.event_id) : null;
      const matchesEvent = filterEvent === 'all' || (event && event.id === parseInt(filterEvent));
      return matchesTech && matchesEvent;
    });
  };

  if (eventsLoading || techsLoading || assignmentsLoading) {
    return <div className="schedule-gantt loading">📅 Loading schedule...</div>;
  }

  const filteredAssignments = getFilteredAssignments();

  return (
    <div className="schedule-gantt" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      {/* Header */}
      <div className="gantt-header">
        <div className="header-top">
          <h1>📅 Schedule Grid (Gantt View)</h1>
          <div className="header-controls">
            <button onClick={handleUndo} disabled={undoStack.length === 0} className="btn-undo">
              ↶ Undo
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="gantt-filters">
          <select value={filterTech} onChange={(e) => setFilterTech(e.target.value)} className="filter-select">
            <option value="all">All Technicians</option>
            {technicians.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <select value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)} className="filter-select">
            <option value="all">All Events</option>
            {events.map(e => (
              <option key={e.id} value={e.id}>{e.eventName || e.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="gantt-content">
        {/* Left Sidebar - Technicians (20%) */}
        <div className="gantt-sidebar">
          <div className="sidebar-header">👤 Technicians</div>
          <div className="tech-pool">
            {technicians.map(tech => (
              <div
                key={tech.id}
                draggable
                onDragStart={(e) => handleTechDragStart(e, tech)}
                className="tech-card"
              >
                <div className="tech-name">{tech.name}</div>
                <div className="tech-position">{tech.position || 'Tech'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Content - Gantt Grid (80%) */}
        <div className="gantt-main">
          {/* Event Rows */}
          {events.map(event => {
            const eventRequirements = requirements.filter(r => r.event_id === event.id);
            const isExpanded = expandedEvents[event.id];

            return (
              <div key={event.id} className="event-section">
                {/* Event Header */}
                <div
                  className="event-header"
                  onClick={() => setExpandedEvents(prev => ({
                    ...prev,
                    [event.id]: !isExpanded
                  }))}
                >
                  <span className="event-toggle">{isExpanded ? '▼' : '▶'}</span>
                  <span className="event-name">{event.eventName || event.name}</span>
                  <span className="event-date">{event.start_date}</span>
                </div>

                {/* Event Rooms */}
                {isExpanded && (
                  <div className="event-rooms">
                    {eventRequirements.map(req => {
                      const reqAssignments = assignments.filter(
                        a => a.requirement_id === req.id && (filterTech === 'all' || a.technician_id === parseInt(filterTech))
                      );

                      return (
                        <div key={req.id} className="room-row">
                          {/* Requirements Sidebar */}
                          <div className="room-requirements">
                            <div className="req-item">
                              <div className="req-location">{req.room_or_location}</div>
                              <div className="req-time">{req.start_time} - {req.end_time}</div>
                              <div className="req-position">{req.position}</div>
                              <div className="req-coverage">
                                {reqAssignments.length}/{req.techs_needed} assigned
                              </div>
                            </div>
                          </div>

                          {/* Assignments */}
                          <div className="assignments-container" onDragOver={(e) => handleEventDragOver(e, event.id)} onDrop={(e) => handleEventDrop(e, event.id, req.room_or_location)}>
                            {reqAssignments.map(assignment => {
                              const tech = getTech(assignment.technician_id);
                              const calc = calculateAssignmentPay(assignment);

                              return (
                                <div
                                  key={assignment.id}
                                  className={`assignment-block ${selectedAssignmentId === assignment.id ? 'selected' : ''}`}
                                  onClick={() => setSelectedAssignmentId(assignment.id)}
                                >
                                  <div className="block-header">
                                    <span className="tech-name">{tech?.name}</span>
                                  </div>

                                  <div className="block-content">
                                    <div className="field">
                                      <label>Hours:</label>
                                      <input
                                        type="number"
                                        value={assignment.hours_worked}
                                        onChange={(e) => handleAssignmentFieldChange(assignment.id, 'hours_worked', parseFloat(e.target.value))}
                                        min="0"
                                        step="0.5"
                                      />
                                    </div>

                                    <div className="field">
                                      <label>Rate Type:</label>
                                      <select value={assignment.rate_type} onChange={(e) => handleAssignmentFieldChange(assignment.id, 'rate_type', e.target.value)}>
                                        <option value="hourly">Hourly</option>
                                        <option value="half-day">Half Day</option>
                                        <option value="full-day">Full Day</option>
                                      </select>
                                    </div>

                                    {calc && (
                                      <div className="block-calculations">
                                        <div className="calc-row">
                                          <span className="calc-label">Tech Payout:</span>
                                          <span className="calc-value">${calc.techPayout.totalPay}</span>
                                        </div>
                                        <div className="calc-row">
                                          <span className="calc-label">Bill Rate:</span>
                                          <span className="calc-value">${calc.billing.totalBill}</span>
                                        </div>
                                        <div className="calc-row margin">
                                          <span className="calc-label">Margin:</span>
                                          <span className="calc-value">${calc.margin} ({calc.marginPercent}%)</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Resize Handles */}
                                  <div className="resize-start" onMouseDown={(e) => handleAssignmentMouseDown(e, assignment.id, 'start')}></div>
                                  <div className="resize-end" onMouseDown={(e) => handleAssignmentMouseDown(e, assignment.id, 'end')}></div>
                                </div>
                              );
                            })}

                            {/* Empty State */}
                            {reqAssignments.length === 0 && (
                              <div className="empty-slot">
                                Drag tech here
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Conflict Warning Modal */}
      {conflictWarning && (
        <div className="conflict-modal">
          <div className="modal-content">
            <h3>⚠️ Scheduling Conflict</h3>
            <p>{conflictWarning.tech.name} is already scheduled during {conflictWarning.requirement.start_time} - {conflictWarning.requirement.end_time}</p>
            <div className="modal-actions">
              <button onClick={() => setConflictWarning(null)} className="btn-cancel">Cancel</button>
              <button onClick={() => {
                // TODO: Create assignment with override
                setConflictWarning(null);
              }} className="btn-override">Override & Continue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleGridGantt;
