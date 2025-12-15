// frontend/src/pages/ScheduleGrid.js

import React, { useState, useMemo } from 'react';
import { useEvents } from '../hooks/useEvents';
import { useAssignments } from '../hooks/useAssignments';
import { useTechnicians } from '../hooks/useTechnicians';
import { useRequirements } from '../hooks/useRequirements';
import '../styles/ScheduleGrid.css';

export default function ScheduleGrid() {
  const { events, loading: eventsLoading } = useEvents();
  const { assignments } = useAssignments();
  const { technicians } = useTechnicians();
  const { requirements } = useRequirements();

  const [viewMode, setViewMode] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [draggedTech, setDraggedTech] = useState(null);
  const [dragSource, setDragSource] = useState(null);
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const [conflictModal, setConflictModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  // Format date for display (YYYY-MM-DD → Dec 20, 2025)
  const formatDateDisplay = (dateString) => {
    if (!dateString) return 'No Date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get unassigned technicians
  const availableTechs = useMemo(() => {
    const assignedIds = new Set(assignments.map(a => a.technician_id));
    return technicians.filter(t => !assignedIds.has(t.id));
  }, [technicians, assignments]);

  // Filter events based on date range
  const filteredEvents = useMemo(() => {
    let result = [...events];

    if (viewMode === 'range' && dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      result = result.filter(event => {
        if (!event.start_date) return false;
        const eventDate = new Date(event.start_date);
        return eventDate >= from && eventDate <= to;
      });
    }

    // Sort by start_date
    return result.sort((a, b) => {
      const dateA = a.start_date ? new Date(a.start_date) : new Date(0);
      const dateB = b.start_date ? new Date(b.start_date) : new Date(0);
      return dateA - dateB;
    });
  }, [events, viewMode, dateFrom, dateTo]);

  // Get requirements for an event
  const getEventRequirements = (eventId) => {
    return requirements.filter(r => r.event_id === eventId);
  };

  // Get assignment for a requirement
  const getAssignmentForRequirement = (requirementId) => {
    return assignments.find(a => a.requirement_id === requirementId);
  };

  // Check for time conflicts
  const hasTimeConflict = (techId, requirementId) => {
    const requirement = requirements.find(r => r.id === requirementId);
    if (!requirement) return false;

    // Find all other assignments for this tech
    const techAssignments = assignments.filter(
      a => a.technician_id === techId && a.id !== requirementId
    );

    return techAssignments.some(assignment => {
      const otherReq = requirements.find(r => r.id === assignment.requirement_id);
      if (!otherReq) return false;

      // Check if times overlap
      const reqStart = parseInt(requirement.start_time?.split(':')[0] || '0');
      const reqEnd = parseInt(requirement.end_time?.split(':')[0] || '23');
      const otherStart = parseInt(otherReq.start_time?.split(':')[0] || '0');
      const otherEnd = parseInt(otherReq.end_time?.split(':')[0] || '23');

      return !(reqEnd <= otherStart || reqStart >= otherEnd);
    });
  };

  // Handle drag start from tech pool
  const handleDragStartTech = (e, tech) => {
    setDraggedTech(tech);
    setDragSource({ type: 'pool', tech });
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag start from assigned slot
  const handleDragStartAssigned = (e, tech, requirementId) => {
    const requirement = requirements.find(r => r.id === requirementId);
    const event = events.find(ev => ev.id === requirement?.event_id);
    
    setDraggedTech(tech);
    setDragSource({
      type: 'assigned',
      tech,
      requirementId,
      fromEvent: event
    });
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over slot
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop on requirement slot
  const handleDropOnRequirement = (e, requirementId) => {
    e.preventDefault();
    if (!draggedTech) return;

    const requirement = requirements.find(r => r.id === requirementId);
    const event = events.find(ev => ev.id === requirement?.event_id);
    const existingAssignment = getAssignmentForRequirement(requirementId);

    // Check for conflicts
    const conflict = hasTimeConflict(draggedTech.id, requirementId);

    if (conflict && !existingAssignment) {
      // Show conflict warning
      setConflictModal({
        tech: draggedTech,
        requirement,
        event,
        fromSource: dragSource
      });
      setDraggedTech(null);
      setDragSource(null);
      return;
    }

    // Show confirmation dialog
    setConfirmModal({
      tech: draggedTech,
      requirement,
      event,
      existingAssignment,
      fromSource: dragSource,
      hasConflict: conflict
    });

    setDraggedTech(null);
    setDragSource(null);
  };

  // Confirm assignment
  const confirmAssignment = async () => {
    if (!confirmModal) return;

    try {
      const { tech, requirement, existingAssignment, fromSource } = confirmModal;

      // If there's an existing assignment, need to handle removal
      if (existingAssignment) {
        // This would be handled by your API
        // await removeAssignment(existingAssignment.id);
      }

      // If dragging from another assignment, need to remove it
      if (fromSource?.type === 'assigned' && fromSource?.requirementId) {
        // await removeAssignment(fromSource.requirementId);
      }

      // Create new assignment
      // await createAssignment({
      //   requirement_id: requirement.id,
      //   technician_id: tech.id
      // });

      setConfirmModal(null);
    } catch (error) {
      console.error('Error confirming assignment:', error);
    }
  };

  // Override conflict and assign
  const overrideConflict = async () => {
    if (!conflictModal) return;

    try {
      const { tech, requirement } = conflictModal;

      // Create assignment despite conflict
      // await createAssignment({
      //   requirement_id: requirement.id,
      //   technician_id: tech.id
      // });

      setConflictModal(null);
    } catch (error) {
      console.error('Error overriding conflict:', error);
    }
  };

  if (eventsLoading) {
    return (
      <div className="schedule-grid">
        <div className="empty-grid">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="schedule-grid">
      {/* Header */}
      <div className="schedule-header">
        <h2>Schedule Grid - Multi-Event View</h2>
        <p>Drag technicians between events to manage assignments across your schedule</p>
      </div>

      {/* Filters */}
      <div className="schedule-filters">
        <div className="filter-group">
          <label>View:</label>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="form-control"
          >
            <option value="all">All Events</option>
            <option value="range">Custom Date Range</option>
          </select>
        </div>

        {viewMode === 'range' && (
          <div className="date-range-inputs">
            <div className="filter-group">
              <label>From:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="filter-group">
              <label>To:</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="form-control"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="schedule-container">
        {/* Available Tech Pool */}
        <div className="available-pool">
          <div className="pool-header">
            <h3>Available Technicians</h3>
            <span className="pool-count">{availableTechs.length}</span>
          </div>

          {availableTechs.length === 0 ? (
            <div className="empty-message">All technicians assigned</div>
          ) : (
            <div className="tech-list">
              {availableTechs.map(tech => (
                <div
                  key={tech.id}
                  className="tech-item"
                  draggable
                  onDragStart={(e) => handleDragStartTech(e, tech)}
                >
                  <div className="tech-name">{tech.name}</div>
                  <div className="tech-rate">${tech.day_rate}/day</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Events Grid */}
        <div className="events-grid">
          {filteredEvents.length === 0 ? (
            <div className="empty-grid">
              {viewMode === 'range' && dateFrom && dateTo
                ? 'No events in selected date range'
                : 'No events found'}
            </div>
          ) : (
            filteredEvents.map(event => (
              <div key={event.id} className="event-card">
                <div className="event-header">
                  <div>
                    <h3>{event.name}</h3>
                    <div className="event-date">
                      {formatDateDisplay(event.start_date)}
                    </div>
                  </div>
                </div>

                {getEventRequirements(event.id).length === 0 ? (
                  <div className="empty-requirements">
                    No requirements for this event
                  </div>
                ) : (
                  <div className="requirements-list">
                    {getEventRequirements(event.id).map(requirement => {
                      const assignment = getAssignmentForRequirement(requirement.id);
                      const assignedTech = assignment
                        ? technicians.find(t => t.id === assignment.technician_id)
                        : null;

                      return (
                        <div
                          key={requirement.id}
                          className={`requirement-slot ${
                            assignment ? 'assigned' : 'unassigned'
                          } ${hoveredSlot === requirement.id ? 'hovered' : ''}`}
                          onDragOver={handleDragOver}
                          onDragLeave={() => setHoveredSlot(null)}
                          onDrop={(e) => handleDropOnRequirement(e, requirement.id)}
                          onDragEnter={() => setHoveredSlot(requirement.id)}
                        >
                          <div className="slot-info">
                            <div className="room-time">
                              <span className="room">{requirement.room_or_location}</span>
                              <span className="time">
                                {requirement.start_time} - {requirement.end_time}
                              </span>
                            </div>
                            <div className="position">
                              {requirement.position}
                            </div>
                          </div>

                          {assignedTech ? (
                            <div
                              className="assigned-tech"
                              draggable
                              onDragStart={(e) =>
                                handleDragStartAssigned(e, assignedTech, requirement.id)
                              }
                            >
                              <div>{assignedTech.name}</div>
                              <div className="remove-hint">Drag to move</div>
                            </div>
                          ) : (
                            <div className="empty-slot">
                              <div className="drop-hint">Drop tech here</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Conflict Warning Modal */}
      {conflictModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>⚠️ Scheduling Conflict</h3>
              <button
                className="close-btn"
                onClick={() => setConflictModal(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="section-title">Conflict Detected</p>
              <div className="conflict-details">
                <p className="warning-text">
                  {conflictModal.tech.name} is already scheduled during this time
                </p>
                <div className="conflict-event">
                  <strong>Existing Assignment:</strong>
                  <br />
                  📍 {conflictModal.event.name}
                  <br />
                  🕐 {conflictModal.requirement.start_time} -{' '}
                  {conflictModal.requirement.end_time}
                </div>
              </div>
              <div className="impact-warning">
                <p>
                  You can override this conflict, but the technician will be double-booked.
                </p>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setConflictModal(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={overrideConflict}
              >
                Override & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Confirm Assignment Change</h3>
              <button
                className="close-btn"
                onClick={() => setConfirmModal(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="section-title">Summary</p>

              {confirmModal.fromSource?.type === 'assigned' && (
                <>
                  <p className="section-title">Removing From</p>
                  <div className="assignment-summary">
                    <p>
                      <strong>Event:</strong> {confirmModal.fromSource.fromEvent?.name}
                    </p>
                    <p className="text-secondary">
                      {confirmModal.fromSource.fromEvent?.start_date &&
                        formatDateDisplay(confirmModal.fromSource.fromEvent.start_date)}
                    </p>
                  </div>
                </>
              )}

              <p className="section-title">Adding To</p>
              <div className="assignment-summary">
                <p>
                  <strong>Event:</strong> {confirmModal.event.name}
                </p>
                <p>
                  <strong>Location:</strong> {confirmModal.requirement.room_or_location}
                </p>
                <p>
                  <strong>Time:</strong> {confirmModal.requirement.start_time} -{' '}
                  {confirmModal.requirement.end_time}
                </p>
                <p>
                  <strong>Position:</strong> {confirmModal.requirement.position}
                </p>
                <p className="text-secondary">
                  {confirmModal.event.start_date &&
                    formatDateDisplay(confirmModal.event.start_date)}
                </p>
              </div>

              {confirmModal.hasConflict && (
                <div className="impact-warning">
                  <p>⚠️ This will create a time conflict for {confirmModal.tech.name}</p>
                </div>
              )}

              {confirmModal.fromSource?.type === 'assigned' && (
                <div className="impact-warning">
                  <p>This will create an open slot at {confirmModal.fromSource.fromEvent?.name}</p>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmModal(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={confirmAssignment}
              >
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
