// frontend/src/pages/ScheduleGrid.js
import React, { useState } from 'react';
import { useEvents } from '../hooks/useEvents';
import { useTechnicians } from '../hooks/useTechnicians';
import { useAssignments } from '../hooks/useAssignments';
import '../styles/ScheduleGrid.css';

const ScheduleGrid = ({ onNavigateToEvent }) => {
  const { events, loading: eventsLoading } = useEvents();
  const { technicians, loading: techsLoading } = useTechnicians();
  const { assignments, loading: assignLoading } = useAssignments();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTech, setSelectedTech] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState('all');

  // Parse date string to Date object
  const parseDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    return new Date(year, month - 1, day);
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get assignments for selected filters
  const getFilteredAssignments = () => {
    return assignments.filter(assignment => {
      const matchesDate = assignment.assignmentDate === selectedDate;
      const matchesTech = selectedTech === 'all' || assignment.technicianId === parseInt(selectedTech);
      const matchesEvent = selectedEvent === 'all' || assignment.eventId === parseInt(selectedEvent);
      return matchesDate && matchesTech && matchesEvent;
    });
  };

  // Get technician info by ID
  const getTechnicianInfo = (techId) => {
    return technicians.find(t => t.id === techId);
  };

  // Get event info by ID
  const getEventInfo = (eventId) => {
    return events.find(e => e.id === eventId);
  };

  // Get assignments for a technician on the selected date
  const getTechAssignmentsForDay = (techId) => {
    return assignments.filter(a => 
      a.technicianId === techId && 
      a.assignmentDate === selectedDate &&
      (selectedEvent === 'all' || a.eventId === parseInt(selectedEvent))
    );
  };

  // Get availability status
  const getTechAvailability = (techId) => {
    const dayAssignments = getTechAssignmentsForDay(techId);
    if (dayAssignments.length === 0) return 'available';
    
    const totalHours = dayAssignments.reduce((sum, a) => sum + (a.hoursWorked || 0), 0);
    if (totalHours >= 8) return 'full';
    if (totalHours >= 4) return 'partial';
    return 'available';
  };

  // Date navigation
  const handlePrevDate = () => {
    const current = parseDate(selectedDate);
    current.setDate(current.getDate() - 1);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleNextDate = () => {
    const current = parseDate(selectedDate);
    current.setDate(current.getDate() + 1);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Show loading state
  if (eventsLoading || techsLoading || assignLoading) {
    return <div className="schedule-grid loading">📅 Loading schedule...</div>;
  }

  const filteredAssignments = getFilteredAssignments();

  return (
    <div className="schedule-grid">
      {/* Header */}
      <div className="schedule-header">
        <h1>📅 Schedule Grid</h1>
        <p>View technician assignments and availability</p>
      </div>

      {/* Controls */}
      <div className="schedule-controls">
        {/* Date Navigation */}
        <div className="date-controls">
          <button onClick={handlePrevDate} className="btn-nav">←</button>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-input"
          />
          <span className="date-display">{formatDate(parseDate(selectedDate))}</span>
          <button onClick={handleNextDate} className="btn-nav">→</button>
          <button onClick={handleToday} className="btn-today">Today</button>
        </div>

        {/* Filters */}
        <div className="schedule-filters">
          <select 
            value={selectedTech}
            onChange={(e) => setSelectedTech(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Technicians</option>
            {technicians.map(tech => (
              <option key={tech.id} value={tech.id}>
                {tech.name} ({tech.position || 'Technician'})
              </option>
            ))}
          </select>

          <select 
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Events</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>
                {event.eventName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="schedule-grid-container">
        {/* Technicians Column */}
        <div className="tech-list">
          <div className="tech-header">Technicians</div>
          {technicians.length === 0 ? (
            <div className="empty-tech-list">No technicians added yet</div>
          ) : (
            technicians.map(tech => {
              const availability = getTechAvailability(tech.id);
              const dayAssignments = getTechAssignmentsForDay(tech.id);
              const totalHours = dayAssignments.reduce((sum, a) => sum + (a.hoursWorked || 0), 0);

              return (
                <div key={tech.id} className={`tech-item status-${availability}`}>
                  <div className="tech-name">{tech.name}</div>
                  <div className="tech-position">{tech.position || 'Technician'}</div>
                  <div className="tech-status">
                    <span className={`status-badge status-${availability}`}>
                      {availability === 'full' && '🔴 Full'}
                      {availability === 'partial' && '🟡 Partial'}
                      {availability === 'available' && '🟢 Available'}
                    </span>
                  </div>
                  <div className="tech-hours">{totalHours.toFixed(1)}h assigned</div>
                </div>
              );
            })
          )}
        </div>

        {/* Assignments Grid */}
        <div className="assignments-grid">
          <div className="grid-header">
            <div className="time-slot">Time</div>
            <div className="event-col">Event</div>
            <div className="assignment-col">Assignment Details</div>
            <div className="rate-col">Rate Type</div>
            <div className="hours-col">Hours</div>
          </div>

          {filteredAssignments.length === 0 ? (
            <div className="empty-assignments">
              <p>No assignments for the selected filters on {formatDate(parseDate(selectedDate))}</p>
            </div>
          ) : (
            <div className="assignments-list">
              {filteredAssignments.map(assignment => {
                const tech = getTechnicianInfo(assignment.technicianId);
                const event = getEventInfo(assignment.eventId);

                return (
                  <div key={assignment.id} className="assignment-row">
                    <div className="time-slot">
                      {assignment.startTime} - {assignment.endTime}
                    </div>
                    <div className="event-col">
                      <span 
                        className="event-link"
                        onClick={() => onNavigateToEvent && onNavigateToEvent(assignment.eventId)}
                      >
                        {event?.eventName || 'Unknown Event'}
                      </span>
                    </div>
                    <div className="assignment-col">
                      <div className="tech-name">{tech?.name}</div>
                      <div className="assignment-position">{assignment.position}</div>
                    </div>
                    <div className="rate-col">
                      <span className={`rate-badge rate-${assignment.rateType}`}>
                        {assignment.rateType === 'hourly' && '💵 Hourly'}
                        {assignment.rateType === 'half-day' && '🕐 Half Day'}
                        {assignment.rateType === 'full-day' && '📅 Full Day'}
                      </span>
                    </div>
                    <div className="hours-col">
                      <strong>{assignment.hoursWorked}h</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="schedule-stats">
        <div className="stat-card">
          <div className="stat-label">Total Assignments</div>
          <div className="stat-value">{filteredAssignments.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Hours Assigned</div>
          <div className="stat-value">
            {filteredAssignments.reduce((sum, a) => sum + (a.hoursWorked || 0), 0).toFixed(1)}h
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Techs Available</div>
          <div className="stat-value">
            {technicians.filter(t => getTechAvailability(t.id) === 'available').length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Techs Partial</div>
          <div className="stat-value">
            {technicians.filter(t => getTechAvailability(t.id) === 'partial').length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleGrid;
