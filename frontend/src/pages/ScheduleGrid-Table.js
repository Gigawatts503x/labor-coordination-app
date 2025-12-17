// frontend/src/pages/ScheduleGrid-Table.js
// ✅ UPDATED: Enhanced filters - Position, Technician, Start Date, End Date, Event Name

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
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterEventName, setFilterEventName] = useState('');
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
            eventId: event?.id,
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
          eventId: event?.id,
          inTime: '—',
          outTime: '—',
          hours: '—',
          status: 'needed',
        });
      }
    });

    setTableData(rows.sort((a, b) => new Date(a.date) - new Date(b.date)));
  }, [requirements, assignments, events, technicians]);

  // Apply all filters - Excel-like filtering
  const getFilteredData = () => {
    return tableData.filter((row) => {
      // Filter by Position
      const matchPosition =
        !filterPosition ||
        row.position?.toLowerCase().includes(filterPosition.toLowerCase());

      // Filter by Technician
      const matchTech =
        !filterTech || row.technician.toLowerCase().includes(filterTech.toLowerCase());

      // Filter by Start Date
      const matchStartDate =
        !filterStartDate || new Date(row.date) >= new Date(filterStartDate);

      // Filter by End Date
      const matchEndDate =
        !filterEndDate || new Date(row.date) <= new Date(filterEndDate);

      // Filter by Event Name
      const matchEventName =
        !filterEventName ||
        row.eventName?.toLowerCase().includes(filterEventName.toLowerCase());

      // All filters must match (AND logic)
      return matchPosition && matchTech && matchStartDate && matchEndDate && matchEventName;
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
        eventid: row.eventId,
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
      alert(`Failed to assign: ${err.message}`);
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
    return [...new Set(tableData.map((row) => row.position).filter(Boolean))].sort();
  };

  const getUniqueTechs = () => {
    return [...new Set(tableData.map((row) => row.technician).filter((t) => t !== 'NEEDED'))].sort();
  };

  const getUniqueEventNames = () => {
    return [...new Set(tableData.map((row) => row.eventName).filter(Boolean))].sort();
  };

  // Check if any filters are active
  const hasActiveFilters = filterPosition || filterTech || filterStartDate || filterEndDate || filterEventName;

  // ==================== RENDER ====================
  return (
    <div className="schedule-grid-table">
      {/* Filters */}
      <div className="table-filters">
        <div className="filter-input-group">
          <label>Position</label>
          <input
            type="text"
            placeholder="Filter by position..."
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-input-group">
          <label>Technician</label>
          <input
            type="text"
            placeholder="Filter by technician..."
            value={filterTech}
            onChange={(e) => setFilterTech(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-input-group">
          <label>Start Date</label>
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-input-group">
          <label>End Date</label>
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-input-group">
          <label>Event Name</label>
          <input
            type="text"
            placeholder="Filter by event..."
            value={filterEventName}
            onChange={(e) => setFilterEventName(e.target.value)}
            className="filter-input"
          />
        </div>

        {hasActiveFilters && (
          <button
            className="btn-filter-clear"
            onClick={() => {
              setFilterPosition('');
              setFilterTech('');
              setFilterStartDate('');
              setFilterEndDate('');
              setFilterEventName('');
            }}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Table */}
      {filteredData.length === 0 ? (
        <div className="table-empty-state">
          <p>
            {tableData.length === 0
              ? 'No assignments yet. Add requirements from the Schedule Grid.'
              : 'No results match your filters.'}
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="schedule-table">
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
                  className={`row-${row.status} ${dragOverRow === row.id ? 'drag-over' : ''}`}
                  onDragOver={(e) => handleDragOver(e, row.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDropTech(e, row)}
                >
                  <td>{row.position}</td>
                  <td
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
                      <span className="status-needed">NEEDED</span>
                    ) : (
                      <>
                        <span className="technician-name">{row.technician}</span>
                        {row.technicianId && (
                          <span className="tech-id">({row.technicianId})</span>
                        )}
                      </>
                    )}
                  </td>
                  <td>{row.location}</td>
                  <td>{formatDate(row.date)}</td>
                  <td>{row.inTime}</td>
                  <td>{row.outTime}</td>
                  <td>{row.hours}</td>
                  <td>{row.eventName}</td>
                  <td className="actions-cell">
                    {row.assignmentId ? (
                      <button
                        className="btn-remove"
                        onClick={() => onDeleteAssignment(row.assignmentId)}
                        title="Remove assignment"
                      >
                        ✕
                      </button>
                    ) : (
                      <span className="text-muted">Drag tech here</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats Footer */}
      {tableData.length > 0 && (
        <div className="table-stats">
          <span>Total: {tableData.length} assignments</span>
          <span>Assigned: {tableData.filter((r) => r.status === 'assigned').length}</span>
          <span>Needed: {tableData.filter((r) => r.status === 'needed').length}</span>
          {hasActiveFilters && (
            <span style={{ marginLeft: 'auto', fontStyle: 'italic' }}>
              Showing {filteredData.length} of {tableData.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleGridTable;
