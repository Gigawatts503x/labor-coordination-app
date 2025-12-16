// frontend/src/pages/ScheduleGrid.js
// WITH SYNC HOOK, FILTERS, COMPACT TECH CARDS, AND WIRED DRAG-AND-DROP
// FIXED: Proper requirement data formatting for API

import React, { useState, useEffect } from 'react';
import { useEvents } from '../hooks/useEvents';
import { useTechnicians } from '../hooks/useTechnicians';
import { useScheduleSync } from '../hooks/useScheduleSync';
import { createRequirement, deleteAssignment, updateAssignment } from '../utils/api';
import '../styles/ScheduleGrid.css';

const ScheduleGrid = ({ onNavigateToEvent }) => {
  const { events, loading: eventsLoading } = useEvents();
  const { technicians, loading: techsLoading } = useTechnicians();
  
  // Use the sync hook for real-time data
  const { requirements, assignments, loading: syncLoading, lastUpdated, refetch } = useScheduleSync(events, 5000);

  // UI State
  const [draggedPosition, setDraggedPosition] = useState(null);
  const [draggedTech, setDraggedTech] = useState(null);
  const [expandedEvents, setExpandedEvents] = useState({});
  const [positionFilter, setPositionFilter] = useState('');
  const [techFilter, setTechFilter] = useState('');

  // Initialize expanded events on mount
  useEffect(() => {
    if (events.length > 0) {
      const expanded = {};
      events.forEach(e => {
        expanded[e.id] = true;
      });
      setExpandedEvents(expanded);
    }
  }, [events]);

  // ==================== HELPERS ====================
  
  const getTech = (techId) => technicians.find(t => t.id === techId);
  const getEvent = (eventId) => events.find(e => e.id === eventId);
  const getRequirement = (reqId) => requirements.find(r => r.id === reqId);

  // Get all positions (unique)
  const getAvailablePositions = () => {
    const positions = new Set();
    requirements.forEach(r => {
      if (r.position) positions.add(r.position);
    });
    return Array.from(positions).sort();
  };

  // Filtered positions
  const getFilteredPositions = () => {
    const positions = getAvailablePositions();
    if (!positionFilter.trim()) return positions;
    return positions.filter(p => 
      p.toLowerCase().includes(positionFilter.toLowerCase())
    );
  };

  // Get unassigned technicians for drag pool
  const getUnassignedTechs = () => {
    return technicians.filter(t => {
      const assigned = assignments.some(a => a.technician_id === t.id);
      return !assigned;
    });
  };

  // Filtered techs
  const getFilteredTechs = () => {
    const unassigned = getUnassignedTechs();
    if (!techFilter.trim()) return unassigned;
    return unassigned.filter(t =>
      t.name.toLowerCase().includes(techFilter.toLowerCase()) ||
      (t.position && t.position.toLowerCase().includes(techFilter.toLowerCase()))
    );
  };

  // Get assignments for a specific requirement
  const getRequirementAssignments = (requirementId) => {
    return assignments.filter(a => a.requirement_id === requirementId);
  };

  // Get assignments for a specific event
  const getEventAssignmentsForEvent = (eventId) => {
    return assignments.filter(a => {
      const req = getRequirement(a.requirement_id);
      return req && req.event_id === eventId;
    });
  };

  // ==================== DRAG & DROP ====================

  const handlePositionDragStart = (e, position) => {
    setDraggedPosition(position);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleTechDragStart = (e, tech) => {
    setDraggedTech(tech);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleEventDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleEventDrop = async (e, eventId) => {
    e.preventDefault();
    
    if (draggedPosition) {
      const event = getEvent(eventId);
      if (!event) return;

      try {
        // FIXED: Create requirement with proper data structure
        const newReq = await createRequirement({
          event_id: eventId,
          position: draggedPosition,
          roomorlocation: event.eventName || event.name,
          starttime: '09:00',
          endtime: '17:00',
          requirementdate: event.start_date || new Date().toISOString().split('T')[0],
          techsneeded: 1,
        });
        
        console.log('Created requirement:', newReq.data);
        
        // Trigger immediate refetch
        await refetch();
        
        // Expand event to show new requirement
        setExpandedEvents(prev => ({ ...prev, [eventId]: true }));
      } catch (err) {
        console.error('Failed to create requirement:', err);
        alert(`Error creating requirement: ${err.message}`);
      }
    }

    if (draggedTech) {
      // TODO: Wire tech assignment when we have a requirement context
      console.log('Tech drag-drop placeholder:', draggedTech);
    }

    setDraggedPosition(null);
    setDraggedTech(null);
  };

  // ==================== CELL EDITING & DELETION ====================

  const handleUpdateAssignment = async (assignmentId, field, value) => {
    try {
      await updateAssignment(assignmentId, { [field]: value });
      await refetch();
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
      alert(`Failed to update: ${err.message}`);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Remove this assignment?')) return;
    try {
      await deleteAssignment(assignmentId);
      await refetch();
    } catch (err) {
      console.error('Error deleting assignment:', err);
      alert(`Failed to delete: ${err.message}`);
    }
  };

  // ==================== TIME FORMATTING ====================

  const formatTime = (isoString) => {
    if (!isoString) return '';
    if (typeof isoString === 'string' && isoString.includes(':')) {
      return isoString.substring(0, 5);
    }
    return '';
  };

  // ==================== RENDER ====================

  const isLoading = eventsLoading || techsLoading || syncLoading;

  if (isLoading) {
    return <div className="schedule-grid loading-state">Loading schedule...</div>;
  }

  if (!events || events.length === 0) {
    return (
      <div className="schedule-grid empty-state">
        No events found. Create an event to get started.
      </div>
    );
  }

  const filteredPositions = getFilteredPositions();
  const filteredTechs = getFilteredTechs();

  return (
    <div className="schedule-grid">
      {/* ========== HEADER ========== */}
      <div className="schedule-header">
        <h1>Schedule Grid - Table View</h1>
        <div className="sync-indicator">
          {lastUpdated && (
            <>
              ✓ Synced {new Date(lastUpdated).toLocaleTimeString()}
            </>
          )}
        </div>
      </div>

      <div className="schedule-container">
        {/* ========== LEFT SIDEBAR: POSITIONS ========== */}
        <div className="sidebar">
          <div className="section-header">📍 Positions ({filteredPositions.length})</div>
          
          <div className="filter-input-wrapper">
            <input
              type="text"
              className="filter-input"
              placeholder="Search positions..."
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
            />
            {positionFilter && (
              <button
                className="filter-clear"
                onClick={() => setPositionFilter('')}
                title="Clear filter"
              >
                ✕
              </button>
            )}
          </div>

          <div className="positions-list">
            {filteredPositions.length > 0 ? (
              filteredPositions.map(position => (
                <div
                  key={position}
                  className="position-card"
                  draggable
                  onDragStart={(e) => handlePositionDragStart(e, position)}
                  title={`Drag to event to create requirement`}
                >
                  📌 {position}
                </div>
              ))
            ) : (
              <div className="empty-filter-message">No positions match</div>
            )}
          </div>
        </div>

        {/* ========== CENTER: EVENTS & REQUIREMENTS ========== */}
        <div className="events-container">
          {events.map(event => {
            const eventReqs = requirements.filter(r => r.event_id === event.id);
            const eventAssigns = getEventAssignmentsForEvent(event.id);
            const isExpanded = expandedEvents[event.id];

            return (
              <div key={event.id} className="event-section">
                {/* Event Header */}
                <div className="event-header-row">
                  <button
                    className="toggle"
                    onClick={() =>
                      setExpandedEvents(prev => ({
                        ...prev,
                        [event.id]: !prev[event.id],
                      }))
                    }
                  >
                    {isExpanded ? '▼' : '▶'}
                  </button>
                  <div className="event-name" onClick={() => onNavigateToEvent?.(event.id)}>
                    {event.eventName || event.name}
                  </div>
                  <div className="event-stats">
                    {eventReqs.length} reqs · {eventAssigns.length} assigned
                  </div>
                </div>

                {/* Requirements Table (expanded) */}
                {isExpanded && eventReqs.length > 0 && (
                  <div className="requirements-table">
                    <div className="table-header-row">
                      <div className="col">Position</div>
                      <div className="col">Location</div>
                      <div className="col">Date</div>
                      <div className="col">In</div>
                      <div className="col">Out</div>
                      <div className="col">Techs</div>
                      <div className="col">Assigned</div>
                      <div className="col">Actions</div>
                    </div>

                    {eventReqs.map(req => {
                      const reqAssigns = getRequirementAssignments(req.id);
                      const assignedNames = reqAssigns
                        .map(a => getTech(a.technician_id)?.name)
                        .filter(Boolean)
                        .join(', ') || '—';

                      return (
                        <div key={req.id} className="assignment-row">
                          <div className="col">{req.position || '—'}</div>
                          <div className="col">{req.roomorlocation || '—'}</div>
                          <div className="col">{req.requirementdate || '—'}</div>
                          <div className="col">{formatTime(req.starttime) || '—'}</div>
                          <div className="col">{formatTime(req.endtime) || '—'}</div>
                          <div className="col">{req.techsneeded || 0}</div>
                          <div className="col assigned-count">{reqAssigns.length}/{req.techsneeded || 0}</div>
                          <div className="col actions">
                            <button
                              className="btn-secondary btn-sm"
                              onClick={() => onNavigateToEvent?.(event.id)}
                              title="Edit in event details"
                            >
                              ✎
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Assignments Table (nested under expanded event) */}
                {isExpanded && eventAssigns.length > 0 && (
                  <div className="assignments-table">
                    <div className="table-header-row">
                      <div className="col">Technician</div>
                      <div className="col">Position</div>
                      <div className="col">Date</div>
                      <div className="col">In</div>
                      <div className="col">Out</div>
                      <div className="col">Hours</div>
                      <div className="col">Rate</div>
                      <div className="col">Actions</div>
                    </div>

                    {eventAssigns.map(assign => {
                      const tech = getTech(assign.technician_id);
                      return (
                        <div key={assign.id} className="assignment-row">
                          <div className="col">{tech?.name || '—'}</div>
                          <div className="col">{assign.position || '—'}</div>
                          <div className="col">{assign.assignmentdate || '—'}</div>
                          <div className="col">{formatTime(assign.starttime) || '—'}</div>
                          <div className="col">{formatTime(assign.endtime) || '—'}</div>
                          <div className="col">{assign.hoursworked || '—'}</div>
                          <div className="col">{assign.ratetype || '—'}</div>
                          <div className="col actions">
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteAssignment(assign.id)}
                              title="Delete assignment"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Empty state */}
                {isExpanded && eventReqs.length === 0 && (
                  <div className="empty-table">
                    No requirements for this event. Drag a position here to create one.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ========== RIGHT SIDEBAR: TECHNICIANS ========== */}
        <div className="sidebar-right">
          <div className="section-header">👤 Available Techs ({filteredTechs.length})</div>
          
          <div className="filter-input-wrapper">
            <input
              type="text"
              className="filter-input"
              placeholder="Search techs..."
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value)}
            />
            {techFilter && (
              <button
                className="filter-clear"
                onClick={() => setTechFilter('')}
                title="Clear filter"
              >
                ✕
              </button>
            )}
          </div>

          <div className="techs-list">
            {filteredTechs.length > 0 ? (
              filteredTechs.map(tech => (
                <div
                  key={tech.id}
                  className="tech-card"
                  draggable
                  onDragStart={(e) => handleTechDragStart(e, tech)}
                  title="Drag to requirement to assign"
                >
                  <div className="tech-name">{tech.name}</div>
                  {tech.position && <div className="tech-position">{tech.position}</div>}
                </div>
              ))
            ) : (
              <div className="empty-filter-message">No techs available</div>
            )}
          </div>
        </div>
      </div>

      {/* Drag target hint */}
      <div
        className="schedule-drop-hint"
        onDragOver={handleEventDragOver}
        style={{
          display: draggedPosition || draggedTech ? 'block' : 'none',
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '12px 16px',
          backgroundColor: 'var(--color-primary)',
          color: 'white',
          borderRadius: 'var(--radius-base)',
          fontSize: 'var(--font-size-sm)',
          pointerEvents: 'none',
        }}
      >
        {draggedPosition && `📌 Drop to create requirement`}
        {draggedTech && `👤 Drop on requirement to assign`}
      </div>
    </div>
  );
};

export default ScheduleGrid;
