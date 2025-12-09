
/**
 * GanttTimeline.jsx - Main Gantt Component
 * 
 * Displays technicians on left axis, time slots on top axis, and assignments as colored blocks.
 * Users can drag to assign, click to edit, and search to filter.
 * 
 * Props:
 * - eventId: UUID of the event
 * - startDate: ISO string (e.g., "2025-12-05")
 * - endDate: ISO string (e.g., "2025-12-08")
 * - technicians: Array of tech objects with id, name, position, hourlyRate
 * - assignments: Array of assignment objects
 * - onAssignmentCreate: Function(data) - callback when user drags to create
 * - onAssignmentUpdate: Function(id, data) - callback when user saves edit
 * - onAssignmentDelete: Function(id) - callback when user deletes
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import AssignmentEditModal from './AssignmentEditModal';
import './GanttTimeline.css';

const GanttTimeline = ({ eventId, startDate, endDate, technicians, assignments, onAssignmentCreate, onAssignmentUpdate, onAssignmentDelete }) => {
  
  // Dragging state: tracks tech and time range during drag operation
  const [dragging, setDragging] = useState(null);
  
  // Selected assignment: opens edit modal when clicked
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  
  // Hovered cell: visual feedback during drag
  const [hoveredCell, setHoveredCell] = useState(null);
  
  // Time granularity: "hour" or "day"
  const [timeGranularity, setTimeGranularity] = useState('hour');
  
  // Search filter for technicians
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTechs, setFilteredTechs] = useState(technicians);
  
  /**
   * generateTimeSlots()
   * Creates array of time slots (hourly or daily) across event dates
   */
  const generateTimeSlots = useCallback(() => {
    const slots = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      for (let hour = 8; hour < 18; hour++) {
        if (timeGranularity === 'hour') {
          slots.push({
            date: dateStr,
            hour,
            display: `${hour % 12 || 12}${hour < 12 ? 'A' : 'P'}`,
            timestamp: new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour).getTime(),
          });
        }
      }
    }
    
    return slots;
  }, [startDate, endDate, timeGranularity]);
  
  /**
   * getAssignmentsForTech()
   * Returns assignments for a specific technician
   */
  const getAssignmentsForTech = useCallback((techId) => {
    return assignments.filter(a => a.techId === techId);
  }, [assignments]);
  
  /**
   * getTechAssignmentForSlot()
   * Checks if tech has assignment at this time slot
   */
  const getTechAssignmentForSlot = useCallback((techId, timeSlot) => {
    const techAssignments = getAssignmentsForTech(techId);
    
    return techAssignments.find(assignment => {
      const assignStart = new Date(assignment.startTime).getTime();
      const assignEnd = new Date(assignment.endTime).getTime();
      const slotStart = timeSlot.timestamp;
      const slotEnd = slotStart + 3600000;
      
      return assignStart <= slotStart && assignEnd > slotStart;
    }) || null;
  }, [getAssignmentsForTech]);
  
  /**
   * hasConflict()
   * Checks if tech already has overlapping assignment
   */
  const hasConflict = useCallback((techId, startTime, endTime) => {
    return getAssignmentsForTech(techId).some(assignment => {
      const aStart = new Date(assignment.startTime).getTime();
      const aEnd = new Date(assignment.endTime).getTime();
      const newStart = new Date(startTime).getTime();
      const newEnd = new Date(endTime).getTime();
      
      return newStart < aEnd && newEnd > aStart;
    });
  }, [getAssignmentsForTech]);
  
  /**
   * Drag handlers - three part sequence
   */
  const handleMouseDown = (techId, timeSlot) => {
    setDragging({
      techId,
      startTime: timeSlot.timestamp,
      endTime: timeSlot.timestamp + 3600000,
      startDate: timeSlot.date,
    });
  };
  
  const handleMouseEnter = (techId, timeSlot) => {
    if (!dragging || dragging.techId !== techId) return;
    
    setDragging(prev => ({
      ...prev,
      endTime: timeSlot.timestamp + 3600000,
    }));
    
    setHoveredCell({ techId, timeSlot });
  };
  
  const handleMouseUp = async () => {
    if (!dragging) return;
    
    const { techId, startTime, endTime } = dragging;
    
    if (endTime - startTime < 3600000) {
      alert('Assignment must be at least 1 hour');
      setDragging(null);
      return;
    }
    
    if (hasConflict(techId, new Date(startTime), new Date(endTime))) {
      alert('Tech has conflicting assignment');
      setDragging(null);
      return;
    }
    
    const tech = technicians.find(t => t.id === techId);
    if (!tech) {
      alert('Invalid technician');
      setDragging(null);
      return;
    }
    
    try {
      await onAssignmentCreate({
        eventId,
        techId,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        position: tech.position || 'Technician',
        location: 'TBD',
        rateType: tech.rateType || 'hourly',
        rate: tech.hourlyRate || 0,
        status: 'scheduled',
      });
      
      setDragging(null);
      setHoveredCell(null);
    } catch (error) {
      console.error('Failed to create assignment:', error);
      alert('Error creating assignment');
    }
  };
  
  /**
   * Assignment click handler - opens edit modal
   */
  const handleAssignmentClick = (assignment, e) => {
    e.stopPropagation();
    setSelectedAssignment(assignment);
  };
  
  const handleUpdateAssignment = async (updatedData) => {
    try {
      await onAssignmentUpdate(selectedAssignment.id, updatedData);
      setSelectedAssignment(null);
    } catch (error) {
      console.error('Failed to update:', error);
      alert('Error updating assignment');
    }
  };
  
  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Delete this assignment?')) return;
    
    try {
      await onAssignmentDelete(assignmentId);
      setSelectedAssignment(null);
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Error deleting assignment');
    }
  };
  
  /**
   * Search/filter technicians
   */
  const handleSearch = (term) => {
    setSearchTerm(term);
    const filtered = technicians.filter(tech =>
      tech.name.toLowerCase().includes(term.toLowerCase()) ||
      (tech.position && tech.position.toLowerCase().includes(term.toLowerCase()))
    );
    setFilteredTechs(filtered);
  };
  
  /**
   * getEventColor()
   * Deterministic color based on eventId
   */
  const getEventColor = (eventId) => {
    const colors = [
      '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
      '#9b59b6', '#1abc9c', '#34495e', '#e67e22',
    ];
    
    let hash = 0;
    for (let i = 0; i < eventId.length; i++) {
      hash = ((hash << 5) - hash) + eventId.charCodeAt(i);
      hash = hash & hash;
    }
    return colors[Math.abs(hash) % colors.length];
  };
  
  const timeSlots = generateTimeSlots();
  
  return (
    <div className="gantt-timeline" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      
      <div className="gantt-controls">
        <h2>Event Timeline</h2>
        <input
          type="text"
          placeholder="Search technicians..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="tech-search"
        />
        <div className="granularity-controls">
          <label>View:</label>
          <select value={timeGranularity} onChange={(e) => setTimeGranularity(e.target.value)}>
            <option value="day">By Day</option>
            <option value="hour">By Hour</option>
          </select>
        </div>
      </div>
      
      <div className="gantt-container">
        
        <div className="gantt-sidebar">
          <div className="sidebar-header">
            <div className="tech-name-col">Technician</div>
            <div className="tech-rate-col">Rate</div>
          </div>
          
          <div className="tech-list">
            {filteredTechs.map(tech => (
              <div key={tech.id} className={`tech-row ${selectedAssignment?.techId === tech.id ? 'selected' : ''}`}>
                <div className="tech-name-col">
                  <strong>{tech.name}</strong>
                  <small>{tech.position}</small>
                </div>
                <div className="tech-rate-col">
                  <small>${tech.hourlyRate || 0}/hr</small>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="gantt-grid-wrapper">
          
          <div className="gantt-header">
            <div className="header-cell empty"></div>
            {timeSlots.map((slot, idx) => (
              <div key={idx} className="header-cell">
                <div className="time">{slot.display}</div>
                <div className="date">{slot.date}</div>
              </div>
            ))}
          </div>
          
          <div className="gantt-grid">
            {filteredTechs.map(tech => (
              <div key={tech.id} className="gantt-row">
                <div className="row-spacer"></div>
                
                {timeSlots.map((slot, slotIdx) => {
                  const assignment = getTechAssignmentForSlot(tech.id, slot);
                  const isHovered = hoveredCell?.techId === tech.id;
                  const isDragging = dragging?.techId === tech.id;
                  
                  return (
                    <div
                      key={`${tech.id}-${slotIdx}`}
                      className={`gantt-cell ${assignment ? 'assigned' : 'empty'} ${isHovered ? 'hovered' : ''} ${isDragging ? 'dragging' : ''}`}
                      onMouseDown={() => handleMouseDown(tech.id, slot)}
                      onMouseEnter={() => handleMouseEnter(tech.id, slot)}
                      style={assignment ? {
                        backgroundColor: getEventColor(assignment.eventId),
                        opacity: 0.8,
                        cursor: 'pointer',
                      } : {}}
                      onClick={(e) => assignment && handleAssignmentClick(assignment, e)}
                      title={assignment ? `${assignment.position} @ ${assignment.location}` : 'Drag to assign'}
                    >
                      {assignment && <span className="assignment-label">{assignment.location?.substring(0, 3)}</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {selectedAssignment && (
        <AssignmentEditModal
          assignment={selectedAssignment}
          onUpdate={handleUpdateAssignment}
          onDelete={handleDeleteAssignment}
          onClose={() => setSelectedAssignment(null)}
        />
      )}
      
      {dragging && (
        <div className="drag-preview">
          <p>Drag to assign • Release to confirm</p>
          <p>{Math.round((dragging.endTime - dragging.startTime) / 3600000)} hours</p>
        </div>
      )}
    </div>
  );
};