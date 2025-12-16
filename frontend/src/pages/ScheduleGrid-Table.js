// frontend/src/pages/ScheduleGrid-Table.js - ✅ WITH DRAG-DROP TECH ASSIGNMENT

import React, { useState, useEffect } from 'react';
import '../styles/ScheduleGrid-Table.css';

const ScheduleGridTable = ({
  assignments = [],
  requirements = [],
  events = [],
  technicians = [],
  draggedTech = null,
  onDeleteAssignment = () => {},
  onCreateAssignment = () => {},
}) => {
  const [tableData, setTableData] = useState([]);
  const [filterPosition, setFilterPosition] = useState('');
  const [filterTech, setFilterTech] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [dragOverRow, setDragOverRow] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  // Build table data from requirements and assignments
  useEffect(() => {
    const rows = [];

    requirements.forEach((req) => {
      const event = events.find((e) => e.id === req.eventid);
      const reqAssignments = assignments.filter((a) => a.requirementid === req.id);

      // If requirement has assignments, create one row per assignment
      if (reqAssignments.length > 0) {
        reqAssignments.forEach((assign) => {
          const tech = technicians.find((t) => t.id === assign.technicianid);
          rows.push({
            id: `${req.id}-${assign.id}`,
            requirementId: req.id,
            assignmentId: assign.id,
            position: req.position,
            technician: tech?.name || 'Unknown',
            technicianId: assign.technicianid,
            location: req.roomorlocation,
            date: req.requirementdate,
            eventName: event?.name || 'Unknown',
            inTime: assign.starttime || '—',
            outTime: assign.endtime || '—',
            hours: assign.hoursworked || '—',
            status: 'assigned',
          });
        });
      } else {
        // If no assignment, create one row with "NEEDED"
        rows.push({
          id: req.id,
          requirementId: req.id,
          assignmentId: null,
          position: req.position,
          technician: 'NEEDED',
          technicianId: null,
          location: req.roomorlocation,
          date: req.requirementdate,
          eventName: event?.name || 'Unknown',
          inTime: '—',
          outTime: '—',
          hours: '—',
          status: 'needed',
        });
      }
    });

    setTableData(rows.sort((a, b) => new Date(a.date) - new Date(b.date)));
  }, [requirements, assignments, events, technicians]);

  // Apply filters
  const getFilteredData = () => {
    return tableData.filter((row) => {
      const matchPosition = !filterPosition ||
        row.position.toLowerCase().includes(filterPosition.toLowerCase());
      const matchTech = !filterTech ||
        row.technician.toLowerCase().includes(filterTech.toLowerCase());
      const matchDate = !filterDate || row.date === filterDate;

      return matchPosition && matchTech && matchDate;
    });
  };

  const filteredData = getFilteredData();

  // ==================== DRAG HANDLERS ====================

  const handleDragOver = (e, rowId) => {
    if (!draggedTech) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverRow(rowId);
  };

  const handleDragLeave = () => {
    setDragOverRow(null);
  };

  // ASSIGN TECH to NEEDED slot
  const handleDropTech = async (e, row) => {
    e.preventDefault();
    setDragOverRow(null);

    if (!draggedTech) return;

    // Only allow dropping on "NEEDED" or existing assignments (for replacement)
    if (row.status !== 'needed' && row.status !== 'assigned') return;

    const confirmMessage =
      row.status === 'assigned'
        ? `Replace ${row.technician} with ${draggedTech.name}?`
        : `Assign ${draggedTech.name} to ${row.position}?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      // Delete existing assignment if replacing
      if (row.assignmentId) {
        await onDeleteAssignment(row.assignmentId);
      }

      // Create new assignment
      const payload = {
        eventid: row.eventName,
        technicianid: draggedTech.id,
        requirementid: row.requirementId,
        position: row.position,
        roomorlocation: row.location,
        assignmentdate: row.date,
        starttime: '09:00',
        endtime: '17:00',
      };

      console.log('📤 Creating assignment:', payload);
      await onCreateAssignment(payload);

      console.log('✅ Assignment created successfully');
    } catch (err) {
      console.error('Error assigning tech:', err);
    }
  };

  // ==================== HELPERS ====================

  const formatDate = (isoDate) => {
    if (!isoDate) return '—';
    return new Date(isoDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getUniquePositions = () => {
    return [...new Set(tableData.map((row) => row.position))].sort();
  };

  const getUniqueTechs = () => {
    return [...new Set(tableData.map((row) => row.technician).filter((t) => t !== 'NEEDED'))].sort();
  };

  // ==================== RENDER ====================

  return (
    <div className="schedule-grid-table">
      {/* Header with Title */}
      <div className="table-header">
        <h2>📋 All Assignments</h2>
        <div className="header-stats">
          <span className="stat">Total: {tableData.length}</span>
          <span className="stat">Assigned: {tableData.filter((r) => r.status === 'assigned').length}</span>
          <span className="stat">Needed: {tableData.filter((r) => r.status === 'needed').length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="table-filters">
        <div className="filter-group">
          <label>Position:</label>
          <select
            className="filter-select"
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
          >
            <option value="">All Positions</option>
            {getUniquePositions().map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Technician:</label>
          <select
            className="filter-select"
            value={filterTech}
            onChange={(e) => setFilterTech(e.target.value)}
          >
            <option value="">All Techs</option>
            {getUniqueTechs().map((tech) => (
              <option key={tech} value={tech}>
                {tech}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Date:</label>
          <input
            type="date"
            className="filter-input"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>

        {(filterPosition || filterTech || filterDate) && (
          <button
            className="btn btn--sm btn--outline"
            onClick={() => {
              setFilterPosition('');
              setFilterTech('');
              setFilterDate('');
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {filteredData.length === 0 ? (
          <div className="empty-table">
            <p>
              {tableData.length === 0
                ? 'No assignments yet. Add requirements from the Schedule Grid.'
                : 'No results match your filters.'}
            </p>
          </div>
        ) : (
          <table className="assignments-table">
            <thead>
              <tr>
                <th>Position</th>
                <th>Technician</th>
                <th>Location</th>
                <th>Date</th>
                <th>In</th>
                <th>Out</th>
                <th>Hours</th>
                <th>Event</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row) => (
                <tr
                  key={row.id}
                  className={`assignment-row ${row.status} ${
                    dragOverRow === row.id ? 'drag-over' : ''
                  }`}
                  onDragOver={(e) => handleDragOver(e, row.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDropTech(e, row)}
                >
                  <td className="cell-position">
                    <span className="badge">{row.position}</span>
                  </td>

                  <td
                    className={`cell-technician ${row.status}`}
                    onMouseEnter={() => {
                      if (draggedTech && row.status === 'needed') {
                        setTooltip({
                          text: `Drop ${draggedTech.name} here`,
                          x: 0,
                          y: 0,
                        });
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    {row.status === 'needed' ? (
                      <span className="needed-badge">NEEDED</span>
                    ) : (
                      <>
                        <span className="tech-name">{row.technician}</span>
                        {row.technicianId && (
                          <button
                            className="btn btn--sm btn--outline"
                            onClick={() => onDeleteAssignment(row.assignmentId)}
                            title="Remove assignment"
                          >
                            ✕
                          </button>
                        )}
                      </>
                    )}
                  </td>

                  <td className="cell-location">{row.location}</td>

                  <td className="cell-date">{formatDate(row.date)}</td>

                  <td className="cell-time">{row.inTime}</td>

                  <td className="cell-time">{row.outTime}</td>

                  <td className="cell-hours">
                    <strong>{row.hours}</strong>
                  </td>

                  <td className="cell-event">
                    <span className="event-tag">{row.eventName}</span>
                  </td>

                  <td className="cell-actions">
                    {row.assignmentId ? (
                      <button
                        className="btn btn--sm btn--outline"
                        onClick={() => onDeleteAssignment(row.assignmentId)}
                        title="Remove this assignment"
                      >
                        Delete
                      </button>
                    ) : (
                      <span className="action-hint">Drag tech here</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Tooltip on Drag */}
      {tooltip && draggedTech && (
        <div className="drag-tooltip">
          📥 Drop {draggedTech.name} to assign
        </div>
      )}
    </div>
  );
};

export default ScheduleGridTable;