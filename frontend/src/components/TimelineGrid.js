import React, { useState, useCallback, useMemo } from 'react';
import TechCard from './TechCard';
import '../styles/ScheduleGridAdvanced.css';

const TimelineGrid = ({
  event = {},
  requirements = [],
  assignments = [],
  technicians = [],
  selectedDate = null,
  onAssignTech = () => {},
  onRemoveAssignment = () => {},
  draggedTech = null,
  isOverTarget = false
}) => {
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Get locations for this event
  const locations = useMemo(() => {
    const locs = [...new Set(requirements.map(r => r.location).filter(Boolean))];
    return locs.length > 0 ? locs : ['Main Stage'];
  }, [requirements]);

  // Get time slots (30-minute intervals)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 8; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  }, []);

  // Get assignments for a slot
  const getSlotAssignments = useCallback(
    (location, time) => {
      return assignments.filter(
        a =>
          a.location === location &&
          a.assignment_date === selectedDate &&
          a.start_time === time
      );
    },
    [assignments, selectedDate]
  );

  // Handle drop
  const handleDrop = useCallback(
    (e, location, time) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        const techData = e.dataTransfer.getData('tech');
        if (!techData) return;

        const tech = JSON.parse(techData);
        onAssignTech({
          tech,
          location,
          date: selectedDate,
          startTime: time,
          position: null
        });
      } catch (error) {
        console.error('Drop error:', error);
      }
    },
    [selectedDate, onAssignTech]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div className="timeline-grid">
      {/* Time header */}
      <div className="timeline-grid__time-column">
        <div className="timeline-grid__corner"></div>
        {timeSlots.map(time => (
          <div key={time} className="timeline-grid__time-slot">
            {time}
          </div>
        ))}
      </div>

      {/* Locations */}
      <div className="timeline-grid__locations">
        {locations.map(location => (
          <div key={location} className="timeline-grid__location">
            {/* Location header */}
            <div className="timeline-grid__location-header">
              <div className="timeline-grid__location-name">{location}</div>
              <div className="timeline-grid__location-count">
                {assignments.filter(a => a.location === location && a.assignment_date === selectedDate).length}
                {' '}assigned
              </div>
            </div>

            {/* Time slots for this location */}
            <div className="timeline-grid__slots">
              {timeSlots.map(time => {
                const slotAssignments = getSlotAssignments(location, time);
                const isDragTarget =
                  draggedTech &&
                  isOverTarget &&
                  selectedSlot === `${location}-${time}`;

                return (
                  <div
                    key={`${location}-${time}`}
                    className={`timeline-grid__slot ${
                      isDragTarget ? 'timeline-grid__slot--drag-over' : ''
                    }`}
                    onDrop={(e) => handleDrop(e, location, time)}
                    onDragOver={handleDragOver}
                    onMouseEnter={() => draggedTech && setSelectedSlot(`${location}-${time}`)}
                    onMouseLeave={() => setSelectedSlot(null)}
                  >
                    {slotAssignments.map(assignment => (
                      <TechCard
                        key={assignment.id}
                        tech={technicians.find(t => t.id === assignment.technician_id) || {}}
                        assignedHours={assignment.hours_worked}
                        position={assignment.position}
                        variant="assignment"
                        onRemove={() => onRemoveAssignment(assignment.id)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineGrid;
