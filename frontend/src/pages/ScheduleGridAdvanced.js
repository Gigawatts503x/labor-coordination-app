import React, { useState, useEffect, useCallback } from 'react';
import TechSidebar from '../components/TechSidebar';
import RequirementsPanel from '../components/RequirementsPanel';
import TimelineGrid from '../components/TimelineGrid';
import {
  getScheduleData,
  createAssignment,
  deleteAssignment,
  getTechnicians,
  getEventRequirements,
  getEventAssignments
} from '../utils/api';
import { useUndoRedo, UndoRedoManager } from '../utils/undoRedoManager';
import DragDropManager from '../utils/dragDropManager';
import '../styles/ScheduleGridAdvanced.css';

const ScheduleGridAdvanced = ({ eventId, onBack }) => {
  // Data state
  const [event, setEvent] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [selectedDate, setSelectedDate] = useState(null);
  const [dragState, setDragState] = useState(DragDropManager.prototype.getState?.call({}) || {});

  // Undo/Redo
  const {
    manager: undoManager,
    canUndo,
    canRedo,
    undo,
    redo,
    push
  } = useUndoRedo();

  // Drag-drop manager
  const [dragDropManager] = useState(() => new DragDropManager());

  useEffect(() => {
    const unsubscribe = dragDropManager.subscribe((update) => {
      setDragState(update.state);
    });
    return unsubscribe;
  }, [dragDropManager]);

  // Load schedule data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await getScheduleData(eventId);
        setEvent(data.event);
        setRequirements(data.requirements);
        setAssignments(data.assignments);
        setTechnicians(data.technicians);
        setSettings(data.settings);

        // Set default date to event start date
        if (data.event && data.event.start_date) {
          setSelectedDate(data.event.start_date);
        }
      } catch (err) {
        console.error('Error loading schedule data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      loadData();
    }
  }, [eventId]);

  // Handle assign tech
  const handleAssignTech = useCallback(
    async ({ tech, location, date, startTime, position }) => {
      try {
        // Calculate default end time (2 hours)
        const [h, m] = startTime.split(':').map(Number);
        const endMinutes = (h * 60 + m + 120) % (24 * 60);
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

        const newAssignment = {
          event_id: eventId,
          technician_id: tech.id,
          location,
          assignment_date: date,
          start_time: startTime,
          end_time: endTime,
          hours_worked: 2,
          position: position || 'Technician',
          rate_type: 'hourly',
          notes: ''
        };

        // Save to database
        const response = await createAssignment(newAssignment);
        const created = response.data;

        // Add to local state
        setAssignments([...assignments, created]);

        // Push to undo history
        push(
          UndoRedoManager.createAction('assign', 'assignment', null, created, {
            tech,
            location,
            date
          })
        );

        // Toast notification
        showToast(`✓ ${tech.name} assigned to ${location}`, 'success');
      } catch (err) {
        console.error('Error assigning tech:', err);
        showToast('Failed to assign technician', 'error');
      }
    },
    [eventId, assignments, push]
  );

  // Handle remove assignment
  const handleRemoveAssignment = useCallback(
    async (assignmentId) => {
      try {
        const assignment = assignments.find(a => a.id === assignmentId);
        if (!assignment) return;

        // Save to undo history before deleting
        push(
          UndoRedoManager.createAction('remove', 'assignment', assignment, null, {
            location: assignment.location,
            date: assignment.assignment_date
          })
        );

        // Delete from database
        await deleteAssignment(assignmentId);

        // Update local state
        setAssignments(assignments.filter(a => a.id !== assignmentId));

        showToast('✓ Assignment removed', 'success');
      } catch (err) {
        console.error('Error removing assignment:', err);
        showToast('Failed to remove assignment', 'error');
      }
    },
    [assignments, push]
  );

  // Handle drag start
  const handleDragStart = useCallback((tech, e) => {
    dragDropManager.startDrag(tech, 'sidebar');
  }, [dragDropManager]);

  // Handle undo
  const handleUndo = useCallback(() => {
    undo((action) => {
      // Implement undo logic based on action type
      console.log('Undo:', action);
    });
  }, [undo]);

  // Handle redo
  const handleRedo = useCallback(() => {
    redo((action) => {
      // Implement redo logic based on action type
      console.log('Redo:', action);
    });
  }, [redo]);

  // Toast notifications
  const showToast = (message, type = 'info') => {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // TODO: Implement toast UI component
  };

  if (loading) {
    return (
      <div className="schedule-grid-advanced__loading">
        <div className="spinner">Loading schedule...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="schedule-grid-advanced__error">
        <h3>Error loading schedule</h3>
        <p>{error}</p>
        {onBack && <button onClick={onBack}>Go Back</button>}
      </div>
    );
  }

  return (
    <div className="schedule-grid-advanced">
      {/* Header */}
      <div className="schedule-grid-advanced__header">
        <div className="schedule-grid-advanced__title">
          <h2>{event?.name}</h2>
          <div className="schedule-grid-advanced__date-range">
            {event?.start_date} to {event?.end_date}
          </div>
        </div>

        <div className="schedule-grid-advanced__controls">
          <button
            className="schedule-grid-advanced__btn schedule-grid-advanced__btn--undo"
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button
            className="schedule-grid-advanced__btn schedule-grid-advanced__btn--redo"
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            ↷ Redo
          </button>

          {onBack && (
            <button
              className="schedule-grid-advanced__btn schedule-grid-advanced__btn--back"
              onClick={onBack}
            >
              ← Back
            </button>
          )}
        </div>
      </div>

      {/* Date selector */}
      <div className="schedule-grid-advanced__date-selector">
        <label>Select Date:</label>
        <input
          type="date"
          value={selectedDate || ''}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={event?.start_date}
          max={event?.end_date}
        />
      </div>

      {/* Main grid */}
      <div className="schedule-grid-advanced__container">
        {/* Left sidebar */}
        <div className="schedule-grid-advanced__sidebar">
          <TechSidebar
            technicians={technicians}
            assignments={assignments}
            selectedDate={selectedDate}
            onDragStart={handleDragStart}
            settings={settings}
          />
        </div>

        {/* Center timeline grid */}
        <div className="schedule-grid-advanced__timeline">
          <TimelineGrid
            event={event}
            requirements={requirements}
            assignments={assignments}
            technicians={technicians}
            selectedDate={selectedDate}
            onAssignTech={handleAssignTech}
            onRemoveAssignment={handleRemoveAssignment}
            draggedTech={dragState.draggedTech}
            isOverTarget={dragState.isOverTarget}
          />
        </div>

        {/* Right panel */}
        <div className="schedule-grid-advanced__panel">
          <RequirementsPanel
            requirements={requirements}
            assignments={assignments}
            selectedDate={selectedDate}
          />
        </div>
      </div>
    </div>
  );
};

export default ScheduleGridAdvanced;
