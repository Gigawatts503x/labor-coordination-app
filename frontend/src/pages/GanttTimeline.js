// frontend/src/pages/GanttTimeline.js
import React, { useState, useEffect } from 'react';
import { getTechnicians, getEvents, getTechSchedule } from '../utils/api';
import '../styles/GanttTimeline.css';

const GanttTimeline = () => {
  const [technicians, setTechnicians] = useState([]);
  const [events, setEvents] = useState([]);
  const [techSchedules, setTechSchedules] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [techRes, eventRes] = await Promise.all([
          getTechnicians(),
          getEvents()
        ]);

        setTechnicians(techRes.data);
        setEvents(eventRes.data);

        // Load schedules for all techs
        const schedules = {};
        await Promise.all(
          techRes.data.map(async (tech) => {
            const schedRes = await getTechSchedule(tech.id);
            schedules[tech.id] = schedRes.data;
          })
        );

        setTechSchedules(schedules);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Filter assignments within date range
  const getAssignmentsInRange = (techId) => {
    const schedule = techSchedules[techId] || [];
    return schedule.filter(assignment => {
      const assignDate = assignment.assignment_date;
      return assignDate && assignDate >= dateRange.start && assignDate <= dateRange.end;
    });
  };

  // Generate array of dates in range
  const getDatesInRange = () => {
    const dates = [];
    const current = new Date(dateRange.start);
    const end = new Date(dateRange.end);

    while (current <= end) {
      dates.push(new Date(current).toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  // Get time slots for a specific date
  const getTimeSlots = () => {
    return ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
  };

  // Check if tech has an assignment at given time
  const getAssignmentAtTime = (techId, date, hour) => {
    const assignments = getAssignmentsInRange(techId);
    return assignments.find(a => {
      if (a.assignment_date !== date) return false;
      const startHour = parseInt(a.start_time?.split(':')[0] || 0);
      const endHour = parseInt(a.end_time?.split(':')[0] || 0);
      return hour >= startHour && hour < endHour;
    });
  };

  const dates = getDatesInRange();
  const timeSlots = getTimeSlots();

  if (loading) return <div className="gantt-timeline">Loading timeline...</div>;
  if (error) return <div className="gantt-timeline error">Error: {error}</div>;

  return (
    <div className="gantt-timeline">
      <header className="gantt-header">
        <h1>Technician Gantt Timeline</h1>
        <div className="date-range-picker">
          <div className="form-group">
            <label>From</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>To</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="gantt-container">
        {/* Tech Names Column */}
        <div className="gantt-tech-labels">
          <div className="gantt-header-cell">Technician</div>
          {technicians.map(tech => (
            <div key={tech.id} className="gantt-tech-label">
              <div className="tech-name">{tech.name}</div>
              <div className="tech-position">{tech.position || 'No position'}</div>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="gantt-chart">
          {/* Date Headers */}
          <div className="gantt-dates-row">
            <div className="gantt-header-cell-space"></div>
            {dates.map(date => (
              <div key={date} className="gantt-date-header">
                <div className="date-value">{new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
              </div>
            ))}
          </div>

          {/* Tech Rows */}
          {technicians.map(tech => (
            <div key={tech.id} className="gantt-tech-row">
              {dates.map(date => (
                <div key={`${tech.id}-${date}`} className="gantt-day-cell">
                  {/* Time breakdown */}
                  <div className="gantt-hours">
                    {timeSlots.map(slot => {
                      const hour = parseInt(slot.split(':')[0]);
                      const assignment = getAssignmentAtTime(tech.id, date, hour);
                      return (
                        <div
                          key={`${slot}`}
                          className={`gantt-hour ${assignment ? 'assigned' : 'available'}`}
                          title={assignment ? `${assignment.event_name} - ${assignment.position}` : 'Available'}
                        >
                          {assignment && (
                            <span className="assignment-indicator">
                              {assignment.event_name.substring(0, 3)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Detailed assignments for this date */}
                  <div className="gantt-assignments">
                    {getAssignmentsInRange(tech.id)
                      .filter(a => a.assignment_date === date)
                      .map(assignment => (
                        <div
                          key={assignment.id}
                          className="gantt-assignment-block"
                          title={`${assignment.event_name} - ${assignment.position}\n${assignment.start_time || ''} to ${assignment.end_time || ''}`}
                        >
                          <div className="assignment-time">
                            {assignment.start_time?.substring(0, 5)} - {assignment.end_time?.substring(0, 5)}
                          </div>
                          <div className="assignment-event">{assignment.event_name}</div>
                          {assignment.position && (
                            <div className="assignment-position">{assignment.position}</div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="gantt-legend">
        <div className="legend-item">
          <div className="legend-box available"></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-box assigned"></div>
          <span>Assigned</span>
        </div>
      </div>
    </div>
  );
};

export default GanttTimeline;
