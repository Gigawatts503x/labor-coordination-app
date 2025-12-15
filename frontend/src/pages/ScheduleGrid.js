// frontend/src/pages/ScheduleGrid.js
import React, { useState, useEffect } from 'react';
import { useEvents } from '../hooks/useEvents';
import { useTechnicians } from '../hooks/useTechnicians';
import { getScheduleData } from '../utils/api';
import '../styles/ScheduleGrid.css';

const ScheduleGrid = ({ onNavigateToEvent }) => {
  const { events, loading: eventsLoading } = useEvents();
  const { technicians, loading: techsLoading } = useTechnicians();

  const [assignments, setAssignments] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTech, setSelectedTech] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState('all');

  // Load all assignments and requirements from all events
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setAssignmentsLoading(true);
        const allAssignments = [];
        const allRequirements = [];

        // Fetch assignments and requirements for each event
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

  // Get technician info by ID
  const getTechnicianInfo = (techId) => {
    return technicians.find(t => t.id === techId);
  };

  // Get event info by ID
  const getEventInfo = (eventId) => {
    return events.find(e => e.id === eventId);
  };

  // Get requirement info by ID
  const getRequirementInfo = (reqId) => {
    return requirements.find(r => r.id === reqId);
  };

  // Check if date matches (handles both requirement_date and assignment date fields)
  const matchesDate = (assignment) => {
    const requirement = getRequirementInfo(assignment.requirement_id);
    const eventDate = requirement?.requirement_date || requirement?.date;
    return eventDate === selectedDate;
  };

  // Get assignments for selected filters
  const getFilteredAssignments = () => {
    return assignments.filter(assignment => {
      const matchesDateFilter = matchesDate(assignment);
      const matchesTech = selectedTech === 'all' || assignment.technician_id === parseInt(selectedTech);
      const requirement = getRequirementInfo(assignment.requirement_id);
      const event = requirement ? getEventInfo(requirement.event_id) : null;
      const matchesEvent = selectedEvent === 'all' || (event && event.id === parseInt(selectedEvent));
      return matchesDateFilter && matchesTech && matchesEvent;
    });
  };

  // Get assignments for a technician on the selected date
  const getTechAssignmentsForDay = (techId) => {
    return assignments.filter(a => {
      if (a.technician_id !== techId) return false;
      const requirement = getRequirementInfo(a.requirement_id);
      const eventDate = requirement?.requirement_date || requirement?.date;
      return eventDate === selectedDate;
    });
  };

  // Get availability status
  const getTechAvailability = (techId) => {
    const dayAssignments = getTechAssignmentsForDay(techId);
    if (dayAssignments.length === 0) return 'available';

    // Try hours_worked or hours
    const totalHours = dayAssignments.reduce((sum, a) => sum + (a.hours_worked || a.hours || 0), 0);
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
  if (eventsLoading || techsLoading || assignmentsLoading) {
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
          <button onClick={handlePrevDate} className="btn-nav">
            ←
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-input"
          />
          <span className="date-display">
            {formatDate(parseDate(selectedDate))}
          </span>
          <button onClick={handleNextDate} className="btn-nav">
            →
          </button>
          <button onClick={handleToday} className="btn-today">
            Today
          </button>
        </div>

        {/* Filters */}
        <div className="schedule-filters">
          <select
            value={selectedTech}
            onChange={(e) => setSelectedTech(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Technicians</option>
            {technicians.map((tech) => (
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
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.eventName || event.name || 'Untitled Event'}
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
            technicians.map((tech) => {
              const availability = getTechAvailability(tech.id);
              const dayAssignments = getTechAssignmentsForDay(tech.id);
              const totalHours = dayAssignments.reduce(
                (sum, a) => sum + (a.hours_worked || a.hours || 0),
                0
              );

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
                  <div className="tech-hours">
                    {totalHours.toFixed(1)}h assigned
                  </div>
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
              <p>
                No assignments for the selected filters on{' '}
                {formatDate(parseDate(selectedDate))}
              </p>
            </div>
          ) : (
            <div className="assignments-list">
              {filteredAssignments.map((assignment) => {
                const tech = getTechnicianInfo(assignment.technician_id);
                const requirement = getRequirementInfo(assignment.requirement_id);
                const event = requirement ? getEventInfo(requirement.event_id) : null;

                return (
                  <div key={assignment.id} className="assignment-row">
                    <div className="time-slot">
                      {requirement?.start_time} - {requirement?.end_time}
                    </div>
                    <div className="event-col">
                      <span
                        className="event-link"
                        onClick={() =>
                          onNavigateToEvent && onNavigateToEvent(requirement?.event_id)
                        }
                      >
                        {event?.eventName || event?.name || 'Unknown Event'}
                      </span>
                    </div>
                    <div className="assignment-col">
                      <div className="tech-name">{tech?.name}</div>
                      <div className="assignment-position">
                        {requirement?.position}
                      </div>
                    </div>
                    <div className="rate-col">
                      <span className={`rate-badge rate-${assignment.rate_type}`}>
                        {assignment.rate_type === 'hourly' && '💵 Hourly'}
                        {assignment.rate_type === 'half-day' && '🕐 Half Day'}
                        {assignment.rate_type === 'full-day' && '📅 Full Day'}
                      </span>
                    </div>
                    <div className="hours-col">
                      <strong>{assignment.hours_worked || assignment.hours || 0}h</strong>
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
            {filteredAssignments
              .reduce((sum, a) => sum + (a.hours_worked || a.hours || 0), 0)
              .toFixed(1)}
            h
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Techs Available</div>
          <div className="stat-value">
            {technicians.filter((t) => getTechAvailability(t.id) === 'available')
              .length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Techs Partial</div>
          <div className="stat-value">
            {technicians.filter((t) => getTechAvailability(t.id) === 'partial')
              .length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleGrid;
