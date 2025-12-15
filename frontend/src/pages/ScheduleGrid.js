// frontend/src/pages/ScheduleGrid.js

import React, { useState, useEffect } from 'react';
import { useEvents } from '../hooks/useEvents';
import { useAssignments } from '../hooks/useAssignments';
import { useTechnicians } from '../hooks/useTechnicians';
import '../styles/ScheduleGrid.css';

function ScheduleGrid() {
  const { events } = useEvents();
  const { assignments, updateAssignment } = useAssignments();
  const { technicians } = useTechnicians();

  const [filteredEvents, setFilteredEvents] = useState([]);
  const [dateRange, setDateRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [draggedItem, setDraggedItem] = useState(null);
  const [conflictWarning, setConflictWarning] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [hoveredSlot, setHoveredSlot] = useState(null);

  // Filter events based on date range
  useEffect(() => {
    let filtered = [...events];

    if (dateRange === 'custom' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.event_date);
        return eventDate >= start && eventDate <= end;
      });
    }

    // Sort by date and time
    filtered.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    setFilteredEvents(filtered);
  }, [events, dateRange, startDate, endDate]);

  // Get all unassigned techs (available pool)
  const getAvailableTechs = () => {
    const assignedTechIds = assignments.map(a => a.technician_id);
    return technicians.filter(tech => !assignedTechIds.includes(tech.id));
  };

  // Get requirements for an event
  const getEventRequirements = (eventId) => {
    // This assumes requirements are stored in events or a separate table
    // For now, we'll extract from assignments
    return assignments.filter(a => a.event_id === eventId);
  };

  // Check for time conflicts
  const checkTimeConflict = (techId, newEventId, newSlot) => {
    const techAssignments = assignments.filter(a => a.technician_id === techId);
    
    const newEvent = events.find(e => e.id === newEventId);
    if (!newEvent) return null;

    for (let assignment of techAssignments) {
      const existingEvent = events.find(e => e.id === assignment.event_id);
      if (!existingEvent) continue;

      const newStart = new Date(`${newEvent.event_date}T${newSlot.start_time}`);
      const newEnd = new Date(`${newEvent.event_date}T${newSlot.end_time}`);
      const existingStart = new Date(`${existingEvent.event_date}T${assignment.start_time}`);
      const existingEnd = new Date(`${existingEvent.event_date}T${assignment.end_time}`);

      // Check if times overlap
      if (newStart < existingEnd && newEnd > existingStart) {
        return {
          conflictingTech: technicians.find(t => t.id === techId),
          conflictingEvent: existingEvent,
          conflictingAssignment: assignment
        };
      }
    }
    return null;
  };

  // Handle drag start
  const handleDragStart = (e, item, source) => {
    setDraggedItem({ item, source }); // source: 'pool' or 'grid'
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop on a requirement slot
  const handleDropOnSlot = (e, eventId, slotIndex) => {
    e.preventDefault();
    
    if (!draggedItem) return;

    const { item, source } = draggedItem;
    const techId = source === 'pool' ? item.id : item.technician_id;
    const slot = getEventRequirements(eventId)[slotIndex];

    // Check for conflicts
    const conflict = checkTimeConflict(techId, eventId, slot);

    if (conflict) {
      setConflictWarning({
        techId,
        eventId,
        slot,
        conflict,
        source
      });
      setDraggedItem(null);
      return;
    }

    // Show confirmation dialog
    const oldAssignment = source === 'grid' ? item : null;
    setConfirmDialog({
      action: 'move',
      techId,
      eventId,
      slot,
      oldAssignment,
      source
    });

    setDraggedItem(null);
  };

  // Handle conflict override
  const handleOverrideConflict = () => {
    const { techId, eventId, slot, source } = conflictWarning;
    
    setConfirmDialog({
      action: 'move_with_conflict',
      techId,
      eventId,
      slot,
      source,
      conflictOverride: true
    });

    setConflictWarning(null);
    setDraggedItem(null);
  };

  // Handle confirmation
  const handleConfirmAction = async () => {
    if (!confirmDialog) return;

    const { action, techId, eventId, slot, oldAssignment, source } = confirmDialog;

    try {
      // If moving from grid to grid, remove from old position
      if (oldAssignment && source === 'grid') {
        await updateAssignment(oldAssignment.id, { technician_id: null });
      }

      // Add to new position
      const newAssignment = {
        ...slot,
        technician_id: techId,
        event_id: eventId
      };

      await updateAssignment(slot.id, newAssignment);

      setConfirmDialog(null);
    } catch (error) {
      console.error('Error updating assignment:', error);
    }
  };

  // Format time display
  const formatTime = (time) => {
    if (!time) return '—';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Get tech name
  const getTechName = (techId) => {
    const tech = technicians.find(t => t.id === techId);
    return tech ? tech.name : '—';
  };

  const availableTechs = getAvailableTechs();

  return (
    <div className="schedule-grid">
      <div className="schedule-header">
        <h2>Schedule Grid - Multi-Event View</h2>
        <p>Drag technicians between events to manage assignments across your schedule</p>
      </div>

      {/* Filter Controls */}
      <div className="schedule-filters">
        <div className="filter-group">
          <label>View:</label>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="all">All Events</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </div>

        {dateRange === 'custom' && (
          <div className="date-range-inputs">
            <div className="filter-group">
              <label>From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="schedule-container">
        {/* Available Tech Pool */}
        <div className="available-pool">
          <div className="pool-header">
            <h3>🆓 Available Technicians</h3>
            <span className="pool-count">{availableTechs.length}</span>
          </div>
          <div className="tech-list">
            {availableTechs.length > 0 ? (
              availableTechs.map(tech => (
                <div
                  key={tech.id}
                  className="tech-item available"
                  draggable
                  onDragStart={(e) => handleDragStart(e, tech, 'pool')}
                >
                  <span className="tech-name">{tech.name}</span>
                  <span className="tech-rate">${tech.day_rate || 450}/day</span>
                </div>
              ))
            ) : (
              <div className="empty-message">All techs assigned</div>
            )}
          </div>
        </div>

        {/* Events Grid */}
        <div className="events-grid">
          {filteredEvents.length === 0 ? (
            <div className="empty-grid">
              <p>No events found for the selected date range</p>
            </div>
          ) : (
            filteredEvents.map(event => {
              const requirements = getEventRequirements(event.id);
              
              return (
                <div key={event.id} className="event-card">
                  <div className="event-header">
                    <h3>{event.name}</h3>
                    <span className="event-date">
                      {new Date(event.event_date).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="requirements-list">
                    {requirements.length === 0 ? (
                      <div className="empty-requirements">
                        <p>No requirements for this event</p>
                      </div>
                    ) : (
                      requirements.map((req, idx) => {
                        const isAssigned = req.technician_id;
                        
                        return (
                          <div
                            key={req.id}
                            className={`requirement-slot ${isAssigned ? 'assigned' : 'unassigned'} ${
                              hoveredSlot?.id === req.id ? 'hovered' : ''
                            }`}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDropOnSlot(e, event.id, idx)}
                            onDragEnter={() => setHoveredSlot(req)}
                            onDragLeave={() => setHoveredSlot(null)}
                          >
                            <div className="slot-info">
                              <div className="room-time">
                                <span className="room">{req.room_or_location || 'TBD'}</span>
                                <span className="time">
                                  {formatTime(req.start_time)} - {formatTime(req.end_time)}
                                </span>
                              </div>
                              <span className="position">{req.position}</span>
                            </div>

                            {isAssigned ? (
                              <div
                                className="assigned-tech"
                                draggable
                                onDragStart={(e) => handleDragStart(e, req, 'grid')}
                              >
                                <span>{getTechName(req.technician_id)}</span>
                                <span className="remove-hint">↔️ Drag to move</span>
                              </div>
                            ) : (
                              <div className="empty-slot">
                                <span className="drop-hint">← Drop tech here</span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Conflict Warning Dialog */}
      {conflictWarning && (
        <div className="modal-overlay" onClick={() => setConflictWarning(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Scheduling Conflict</h3>
              <button className="close-btn" onClick={() => setConflictWarning(null)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <p>
                <strong>{getTechName(conflictWarning.techId)}</strong> is already scheduled at:
              </p>
              <div className="conflict-details">
                <p className="conflict-event">
                  📍 <strong>{conflictWarning.conflict.conflictingEvent.name}</strong>
                  <br />
                  🕐 {formatTime(conflictWarning.conflict.conflictingAssignment.start_time)} -{' '}
                  {formatTime(conflictWarning.conflict.conflictingAssignment.end_time)}
                  <br />
                  🏠 {conflictWarning.conflict.conflictingAssignment.room_or_location || 'TBD'}
                </p>

                <p className="proposed-move">
                  Proposed move to:
                  <br />
                  🕐 {formatTime(conflictWarning.slot.start_time)} -{' '}
                  {formatTime(conflictWarning.slot.end_time)}
                </p>
              </div>

              <p className="warning-text">
                This will create a double-booking. Do you want to override this conflict?
              </p>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setConflictWarning(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleOverrideConflict}
              >
                Override & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="modal-overlay" onClick={() => setConfirmDialog(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✓ Confirm Assignment Change</h3>
              <button className="close-btn" onClick={() => setConfirmDialog(null)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {confirmDialog.oldAssignment && (
                <>
                  <p className="section-title">Removing From:</p>
                  <div className="assignment-summary">
                    <p>
                      <strong>{getTechName(confirmDialog.oldAssignment.technician_id)}</strong>
                    </p>
                    <p className="text-secondary">
                      🏠 {confirmDialog.oldAssignment.room_or_location || 'TBD'}
                    </p>
                  </div>
                </>
              )}

              <p className="section-title">Adding To:</p>
              <div className="assignment-summary">
                <p>
                  <strong>{getTechName(confirmDialog.techId)}</strong>
                </p>
                <p className="text-secondary">
                  📍 Event: {events.find(e => e.id === confirmDialog.eventId)?.name}
                </p>
                <p className="text-secondary">
                  🏠 Room: {confirmDialog.slot.room_or_location || 'TBD'}
                </p>
                <p className="text-secondary">
                  🕐 Time: {formatTime(confirmDialog.slot.start_time)} -{' '}
                  {formatTime(confirmDialog.slot.end_time)}
                </p>
              </div>

              {confirmDialog.oldAssignment && (
                <div className="impact-warning">
                  <p>
                    This will create an <strong>OPEN SLOT</strong> at the original event.
                  </p>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmDialog(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmAction}
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

export default ScheduleGrid;
