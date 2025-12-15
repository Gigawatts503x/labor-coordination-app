// frontend/src/pages/ScheduleGrid.js - FIXED DATA LOADING
import React, { useState, useEffect } from 'react';
import { useEvents } from '../hooks/useEvents';
import { useTechnicians } from '../hooks/useTechnicians';
import { getEventRequirements, getEventAssignments } from '../utils/api';
import '../styles/ScheduleGrid.css';

const ScheduleGrid = ({ onNavigateToEvent }) => {
  const { events, loading: eventsLoading } = useEvents();
  const { technicians, loading: techsLoading } = useTechnicians();

  // Data
  const [assignments, setAssignments] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // UI State
  const [draggedPosition, setDraggedPosition] = useState(null);
  const [draggedTech, setDraggedTech] = useState(null);
  const [expandedEvents, setExpandedEvents] = useState({});

  // Load all data from each event
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoadingData(true);
        const allAssignments = [];
        const allRequirements = [];

        console.log('Loading data for events:', events);

        for (const event of events) {
          try {
            console.log(`Fetching data for event ${event.id}...`);
            
            const [reqResponse, assignResponse] = await Promise.all([
              getEventRequirements(event.id),
              getEventAssignments(event.id)
            ]);

            console.log(`Event ${event.id} requirements:`, reqResponse.data);
            console.log(`Event ${event.id} assignments:`, assignResponse.data);

            if (reqResponse.data) allRequirements.push(...reqResponse.data);
            if (assignResponse.data) allAssignments.push(...assignResponse.data);
          } catch (err) {
            console.warn(`Failed to load data for event ${event.id}:`, err);
          }
        }

        console.log('All requirements loaded:', allRequirements);
        console.log('All assignments loaded:', allAssignments);

        setAssignments(allAssignments);
        setRequirements(allRequirements);

        // Expand all events by default
        const expanded = {};
        events.forEach(e => {
          expanded[e.id] = true;
        });
        setExpandedEvents(expanded);
      } catch (error) {
        console.error('Error loading schedule data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    if (events.length > 0) {
      loadAllData();
    } else {
      setLoadingData(false);
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

  // Get unassigned technicians for drag pool
  const getUnassignedTechs = () => {
    return technicians.filter(t => {
      const assigned = assignments.some(a => a.technician_id === t.id);
      return !assigned;
    });
  };

  // Get assignments for an event
  const getEventAssignments = (eventId) => {
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

  const handleEventDrop = (e, eventId) => {
    e.preventDefault();

    // If dragging position → create new requirement
    if (draggedPosition) {
      const event = getEvent(eventId);
      if (!event) return;

      // Create temp requirement (will need backend integration)
      const tempReq = {
        id: `temp-${Date.now()}`,
        event_id: eventId,
        position: draggedPosition,
        room_or_location: event.eventName || event.name,
        start_time: '09:00',
        end_time: '17:00',
        requirement_date: event.start_date,
        techs_needed: 1
      };

      setRequirements([...requirements, tempReq]);
      setExpandedEvents(prev => ({ ...prev, [eventId]: true }));
      setDraggedPosition(null);
    }

    if (draggedTech) {
      setDraggedTech(null);
    }
  };

  // ==================== CELL EDITING ====================

  const handleCellChange = (assignmentId, field, value) => {
    setAssignments(assignments.map(a =>
      a.id === assignmentId ? { ...a, [field]: value } : a
    ));
  };

  const handleDeleteAssignment = (assignmentId) => {
    setAssignments(assignments.filter(a => a.id !== assignmentId));
  };

  // ==================== RENDER ====================

  if (eventsLoading || techsLoading || loadingData) {
    return <div className="schedule-table loading">📋 Loading schedule...</div>;
  }

  const positions = getAvailablePositions();
  const unassignedTechs = getUnassignedTechs();

  console.log('Render - Events:', events.length, 'Requirements:', requirements.length, 'Assignments:', assignments.length);

  return (
    <div className="schedule-table">
      {/* Header */}
      <div className="schedule-header">
        <h1>📋 Schedule Grid - Table View</h1>
      </div>

      {/* Main Content */}
      <div className="schedule-content">
        {/* Left Sidebar */}
        <div className="sidebar">
          {/* Positions Section */}
          <div className="sidebar-section">
            <div className="section-header">📌 Positions ({positions.length})</div>
            <div className="positions-list">
              {positions.length === 0 ? (
                <div className="empty-section">No positions available. Create requirements first.</div>
              ) : (
                positions.map(position => (
                  <div
                    key={position}
                    draggable
                    onDragStart={(e) => handlePositionDragStart(e, position)}
                    className="position-card"
                    title="Drag to event to create new assignment"
                  >
                    {position}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Technicians Section */}
          <div className="sidebar-section">
            <div className="section-header">👤 Available Techs ({unassignedTechs.length})</div>
            <div className="techs-list">
              {unassignedTechs.length === 0 ? (
                <div className="empty-section">
                  {technicians.length === 0 ? 'No technicians added' : 'All techs assigned'}
                </div>
              ) : (
                unassignedTechs.map(tech => (
                  <div
                    key={tech.id}
                    draggable
                    onDragStart={(e) => handleTechDragStart(e, tech)}
                    className="tech-card"
                    title={`${tech.name} (${tech.position})`}
                  >
                    <div className="tech-name">{tech.name}</div>
                    <div className="tech-position">{tech.position || 'Tech'}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main Table Area */}
        <div className="table-area">
          {/* Table */}
          <div className="table-container">
            {/* Header Row */}
            <div className="table-header-row">
              <div className="col col-position">Position</div>
              <div className="col col-technician">Technician</div>
              <div className="col col-location">Location</div>
              <div className="col col-date">Date</div>
              <div className="col col-in">In</div>
              <div className="col col-out">Out</div>
              <div className="col col-hours">Hours</div>
              <div className="col col-actions">Actions</div>
            </div>

            {/* Event Sections */}
            {events.length === 0 ? (
              <div className="empty-table">
                <p>No events found. Create an event to get started.</p>
              </div>
            ) : (
              events.map(event => {
                const eventAssignments = assignments.filter(a => {
                  const req = getRequirement(a.requirement_id);
                  return req && req.event_id === event.id;
                });
                const eventRequirements = requirements.filter(r => r.event_id === event.id);
                const isExpanded = expandedEvents[event.id];

                return (
                  <div key={event.id} className="event-group">
                    {/* Event Header */}
                    <div
                      className="event-header-row"
                      onClick={() => setExpandedEvents(prev => ({
                        ...prev,
                        [event.id]: !isExpanded
                      }))}
                      onDragOver={handleEventDragOver}
                      onDrop={(e) => handleEventDrop(e, event.id)}
                    >
                      <div className="toggle">{isExpanded ? '▼' : '▶'}</div>
                      <div className="event-name">{event.eventName || event.name || 'Untitled Event'}</div>
                      <div className="event-stats">
                        {eventAssignments.length} / {eventRequirements.length} filled
                      </div>
                    </div>

                    {/* Assignments */}
                    {isExpanded && (
                      <div className="assignments-group">
                        {eventRequirements.length === 0 ? (
                          <div className="empty-message">
                            💡 Drag position from left → Then drag tech name to assign
                          </div>
                        ) : (
                          eventRequirements.map(requirement => {
                            const assignment = assignments.find(a => a.requirement_id === requirement.id);
                            const tech = assignment ? getTech(assignment.technician_id) : null;

                            return (
                              <div key={requirement.id} className="assignment-row">
                                <div className="col col-position">
                                  {requirement.position || 'Unknown'}
                                </div>

                                <div className="col col-technician">
                                  <input
                                    type="text"
                                    value={tech?.name || 'Unassigned'}
                                    readOnly
                                    className="cell-input"
                                  />
                                </div>

                                <div className="col col-location">
                                  <input
                                    type="text"
                                    value={requirement.room_or_location || ''}
                                    onChange={(e) => {
                                      if (assignment) {
                                        handleCellChange(assignment.id, 'location', e.target.value);
                                      }
                                    }}
                                    className="cell-input"
                                  />
                                </div>

                                <div className="col col-date">
                                  <input
                                    type="date"
                                    value={requirement.requirement_date || ''}
                                    className="cell-input"
                                    readOnly
                                  />
                                </div>

                                <div className="col col-in">
                                  <input
                                    type="time"
                                    value={requirement.start_time || ''}
                                    className="cell-input"
                                    readOnly
                                  />
                                </div>

                                <div className="col col-out">
                                  <input
                                    type="time"
                                    value={requirement.end_time || ''}
                                    className="cell-input"
                                    readOnly
                                  />
                                </div>

                                <div className="col col-hours">
                                  <input
                                    type="number"
                                    value={assignment?.hours_worked || 0}
                                    onChange={(e) => {
                                      if (assignment) {
                                        handleCellChange(assignment.id, 'hours_worked', parseFloat(e.target.value));
                                      }
                                    }}
                                    className="cell-input"
                                    step="0.5"
                                  />
                                </div>

                                <div className="col col-actions">
                                  {assignment && (
                                    <button
                                      className="btn-delete"
                                      onClick={() => handleDeleteAssignment(assignment.id)}
                                      title="Delete assignment"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleGrid;
