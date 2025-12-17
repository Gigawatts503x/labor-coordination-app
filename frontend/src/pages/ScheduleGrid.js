// frontend/src/pages/ScheduleGrid.js - ✅ COMPLETE DRAG-DROP IMPLEMENTATION

import React, { useState, useEffect } from 'react';
import { useEvents } from '../hooks/useEvents';
import { useTechnicians } from '../hooks/useTechnicians';
import {
  createRequirement,
  getEventRequirements,
  getEventAssignments,
  deleteAssignment,
  createAssignment,
  updateAssignment,
  getPositions,
} from '../utils/api';
import ScheduleGridTable from './ScheduleGrid-Table';
import '../styles/ScheduleGrid.css';

const ScheduleGrid = ({ onNavigateToEvent }) => {
  const { events, loading: eventsLoading } = useEvents();
  const { technicians, loading: techsLoading } = useTechnicians();

  // ==================== DATA ====================
  const [assignments, setAssignments] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // ==================== UI STATE ====================
  const [draggedPosition, setDraggedPosition] = useState(null);
  const [draggedTech, setDraggedTech] = useState(null);
  const [dragPreview, setDragPreview] = useState(null);
  const [expandedEvents, setExpandedEvents] = useState({});
  const [positionFilter, setPositionFilter] = useState('');
  const [techFilter, setTechFilter] = useState('');

  // ==================== LOAD DATA ====================

  // Load positions from settings
  useEffect(() => {
    const loadPositions = async () => {
      try {
        const response = await getPositions();
        setPositions(response.data || []);
      } catch (err) {
        console.warn('Failed to load positions:', err);
        setPositions([]);
      }
    };
    loadPositions();
  }, []);

  // Load all requirements and assignments
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoadingData(true);
        const allAssignments = [];
        const allRequirements = [];

        for (const event of events) {
          try {
            const [reqResponse, assignResponse] = await Promise.all([
              getEventRequirements(event.id),
              getEventAssignments(event.id),
            ]);

            if (reqResponse.data) allRequirements.push(...reqResponse.data);
            if (assignResponse.data) allAssignments.push(...assignResponse.data);
          } catch (err) {
            console.warn(`Failed to load data for event ${event.id}:`, err);
          }
        }

        setAssignments(allAssignments);
        setRequirements(allRequirements);

        // Expand all events by default
        const expanded = {};
        events.forEach((e) => {
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

  const getTech = (techId) => technicians.find((t) => t.id === techId);
  const getEvent = (eventId) => events.find((e) => e.id === eventId);
  const getRequirement = (reqId) => requirements.find((r) => r.id === reqId);

  // Get all unique positions from requirements
  const getAvailablePositions = () => {
    const posSet = new Set(positions);
    requirements.forEach((r) => {
      if (r.position) posSet.add(r.position);
    });
    return Array.from(posSet).sort();
  };

  // Filtered positions
  const getFilteredPositions = () => {
    const allPos = getAvailablePositions();
    if (!positionFilter.trim()) return allPos;
    return allPos.filter((p) =>
      p.toLowerCase().includes(positionFilter.toLowerCase())
    );
  };

  // Get unassigned technicians
  const getUnassignedTechs = () => {
    return technicians.filter((t) => {
      const assigned = assignments.some((a) => a.technicianid === t.id);
      return !assigned;
    });
  };

  // Filtered unassigned techs
  const getFilteredTechs = () => {
    const unassigned = getUnassignedTechs();
    if (!techFilter.trim()) return unassigned;
    return unassigned.filter(
      (t) =>
        t.name.toLowerCase().includes(techFilter.toLowerCase()) ||
        (t.position && t.position.toLowerCase().includes(techFilter.toLowerCase()))
    );
  };

  // Get requirements for a specific event
  const getEventRequirementsForEvent = (eventId) => {
    return requirements.filter((r) => r.eventid === eventId);
  };

  // ==================== DRAG & DROP ====================

  const handlePositionDragStart = (e, position) => {
    setDraggedPosition(position);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('position', position);
  };

  const handleTechDragStart = (e, tech) => {
    setDraggedTech(tech);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('tech', JSON.stringify(tech));
  };

  const handleEventDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // CREATE REQUIREMENT when position dropped on event
  const handleEventDrop = async (e, eventId) => {
    e.preventDefault();

    if (!draggedPosition) {
      setDraggedPosition(null);
      return;
    }

    const event = getEvent(eventId);
    if (!event) {
      setDraggedPosition(null);
      return;
    }

    try {
      // Build payload matching backend schema
      const payload = {
        eventid: eventId,
        position: draggedPosition,
        roomorlocation: event.name || 'TBD',
        requirementdate: event.startdate || new Date().toISOString().split('T')[0],
        starttime: '09:00',
        endtime: '17:00',
        techsneeded: 1,
      };

      console.log('📤 Creating requirement:', payload);
      const response = await createRequirement(payload);
      console.log('✅ Requirement created:', response.data);

      // Refetch requirements for this event
      const reqs = await getEventRequirements(eventId);
      setRequirements((prev) => {
        const filtered = prev.filter((r) => r.eventid !== eventId);
        return [...filtered, ...(reqs.data || [])];
      });

      setExpandedEvents((prev) => ({
        ...prev,
        [eventId]: true,
      }));
    } catch (err) {
      console.error('❌ Error creating requirement:', err);
      alert(`Failed to create requirement:\n\n${err.response?.data?.error || err.message}`);
    }

    setDraggedPosition(null);
  };

  // ==================== ACTIONS ====================

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Remove this assignment?')) return;

    try {
      await deleteAssignment(assignmentId);
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    } catch (err) {
      console.error('Error deleting assignment:', err);
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const handleToggleEvent = (eventId) => {
    setExpandedEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  // ==================== RENDER ====================

  if (eventsLoading || techsLoading || loadingData) {
    return (
      <div className="schedule-grid">
        <div className="loading-spinner">Loading schedule data...</div>
      </div>
    );
  }

  const filteredPositions = getFilteredPositions();
  const filteredTechs = getFilteredTechs();

  return (
    <div className="schedule-grid">
      {/* LEFT SIDEBAR - POSITIONS */}
      <div className="schedule-sidebar schedule-sidebar--left">
        <div className="sidebar-header">
          <h3>
            📍 Positions <span className="count">({filteredPositions.length})</span>
          </h3>
        </div>

        <input
          type="text"
          className="sidebar-search"
          placeholder="Search positions..."
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value)}
        />

        <div className="positions-list">
          {filteredPositions.length === 0 ? (
            <div className="empty-state">
              <p>No positions available</p>
              <small>Add positions in Settings → Positions</small>
            </div>
          ) : (
            filteredPositions.map((position) => (
              <div
                key={position}
                className="position-item"
                draggable
                onDragStart={(e) => handlePositionDragStart(e, position)}
                onClick={() => setDragPreview(null)}
              >
                <span className="drag-handle">⋮⋮</span>
                <span className="position-name">{position}</span>
                <span className="position-count">
                  {requirements.filter((r) => r.position === position).length}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="sidebar-hint">Drag a position to an event to create a requirement</div>
      </div>

      {/* CENTER - EVENTS GRID */}
      {/* <div className="schedule-center">
        <div className="events-grid">
          {events.map((event) => {
            const eventReqs = getEventRequirementsForEvent(event.id);
            const isExpanded = expandedEvents[event.id];

            return (
              <div key={event.id} className="event-card">
                <div
                  className="event-header"
                  onClick={() => handleToggleEvent(event.id)}
                >
                  <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                  <h3>{event.name}</h3>
                  <span className="event-meta">
                    {eventReqs.length} req{eventReqs.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {isExpanded && (
                  <div
                    className="event-drop-zone"
                    onDragOver={handleEventDragOver}
                    onDrop={(e) => handleEventDrop(e, event.id)}
                  >
                    {eventReqs.length === 0 ? (
                      <div className="empty-zone">
                        <p>Drop a position here to create a requirement</p>
                      </div>
                    ) : (
                      <table className="requirements-table">
                        <thead>
                          <tr>
                            <th>Position</th>
                            <th>Location</th>
                            <th>Date</th>
                            <th>Assigned</th>
                          </tr>
                        </thead>
                        <tbody>
                          {eventReqs.map((req) => {
                            const reqAssignments = assignments.filter(
                              (a) => a.requirementid === req.id
                            );

                            return (
                              <tr key={req.id} className="requirement-row">
                                <td className="position-col">{req.position}</td>
                                <td className="location-col">{req.roomorlocation}</td>
                                <td className="date-col">
                                  {new Date(req.requirementdate).toLocaleDateString()}
                                </td>
                                <td className="assigned-col">
                                  {reqAssignments.length > 0 ? (
                                    reqAssignments.map((assign, idx) => (
                                      <span key={assign.id} className="assigned-tech">
                                        {getTech(assign.technicianid)?.name || 'Unknown'}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="not-assigned">NEEDED</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div> */}

      {/* RIGHT SIDEBAR - TECHNICIANS */}
      <div className="schedule-sidebar schedule-sidebar--right">
        <div className="sidebar-header">
          <h3>
            👥 Available Techs <span className="count">({filteredTechs.length})</span>
          </h3>
        </div>

        <input
          type="text"
          className="sidebar-search"
          placeholder="Search techs..."
          value={techFilter}
          onChange={(e) => setTechFilter(e.target.value)}
        />

        <div className="techs-list">
          {filteredTechs.length === 0 ? (
            <div className="empty-state">
              <p>No available technicians</p>
              <small>All techs are currently assigned</small>
            </div>
          ) : (
            filteredTechs.map((tech) => (
              <div
                key={tech.id}
                className="tech-item"
                draggable
                onDragStart={(e) => handleTechDragStart(e, tech)}
              >
                <span className="drag-handle">⋮⋮</span>
                <span className="tech-name">{tech.name}</span>
                {tech.position && <span className="tech-position">{tech.position}</span>}
              </div>
            ))
          )}
        </div>

        <div className="sidebar-hint">Drag a tech to a requirement's table row to assign</div>
      </div>

      {/* FULL TABLE VIEW - Pass assignments and handlers */}
      <div className="schedule-table-container">
        <ScheduleGridTable
          assignments={assignments}
          requirements={requirements}
          events={events}
          technicians={technicians}
          draggedTech={draggedTech}
          onDeleteAssignment={handleDeleteAssignment}
          onCreateAssignment={async (data) => {
            try {
              const response = await createAssignment(data);
              setAssignments((prev) => [...prev, response.data]);
              setDraggedTech(null);
            } catch (err) {
              console.error('Error creating assignment:', err);
              alert(`Failed to assign: ${err.response?.data?.error || err.message}`);
            }
          }}
        />
      </div>
    </div>
  );
};

export default ScheduleGrid;