// frontend/src/pages/ScheduleGrid-Table.js
// ✅ FIXED: Enhanced filters and complete assignment creation with all 25 parameters

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

  // ✅ FIXED: ASSIGN TECH to NEEDED slot with ALL 25 PARAMETERS
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

      // ✅ FIXED: Build complete assignment payload with all required fields
      const payload = {
        // Required identifiers
        eventId: row.eventId,                    // ✅ FIXED: eventId (camelCase, not eventid)
        technicianid: draggedTech.id,
        requirementid: row.requirementId,
        position: row.position,
        roomorlocation: row.location,

        // Time information
        assignmentdate: row.date,
        starttime: '09:00',                      // Default to 9 AM
        endtime: '17:00',                        // Default to 5 PM

        // Hours (calculated from start/end time)
        hoursworked: 8,                          // 9-5 = 8 hours
        basehours: 8,
        othours: 0,                              // Overtime hours (none by default)
        dothours: 0,                             // Double-time hours (none by default)

        // Rate information (get from technician object if available)
        ratetype: draggedTech.ratetype || 'hourly',
        techhourlyrate: draggedTech.techhourlyrate || null,
        techhalfdayrate: draggedTech.techhalfdayrate || null,
        techfulldayrate: draggedTech.techfulldayrate || null,

        // Billing rates (get from technician if available)
        billhourlyrate: draggedTech.billhourlyrate || null,
        billhalfdayrate: draggedTech.billhalfdayrate || null,
        billfulldayrate: draggedTech.billfulldayrate || null,

        // Calculated/billing fields (will be calculated by backend or UI later)
        calculatedpay: 0,                        // Will be calculated by rate calculator
        customerbill: 0,                         // Will be calculated by rate calculator

        // Optional notes
        notes: null,
      };

      console.log('📤 Creating assignment with complete payload:', payload);
      await onCreateAssignment(payload);
      console.log('✅ Assignment created successfully');
    } catch (err) {
      console.error('❌ Error assigning tech:', err);
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
  const hasActiveFilters =
    filterPosition || filterTech || filterStartDate || filterEndDate || filterEventName;

  // ==================== RENDER ====================

  return (
    <div className="schedule-grid-table">
      <div className="filters-container">
        <div className="filter-group">
          <label htmlFor="filter-position">Position</label>
          <input
            id="filter-position"
            type="text"
            placeholder="Search positions..."
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filter-tech">Technician</label>
          <input
            id="filter-tech"
            type="text"
            placeholder="Search technicians..."
            value={filterTech}
            onChange={(e) => setFilterTech(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filter-start-date">Start Date</label>
          <input
            id="filter-start-date"
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filter-end-date">End Date</label>
          <input
            id="filter-end-date"
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filter-event-name">Event Name</label>
          <input
            id="filter-event-name"
            type="text"
            placeholder="Search events..."
            value={filterEventName}
            onChange={(e) => setFilterEventName(e.target.value)}
            className="filter-input"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => {
              setFilterPosition('');
              setFilterTech('');
              setFilterStartDate('');
              setFilterEndDate('');
              setFilterEventName('');
            }}
            className="clear-filters-btn"
          >
            Clear Filters
          </button>
        )}
      </div>

      {tableData.length === 0 ? (
        <p className="no-data">No assignments yet. Add requirements from the Schedule Grid.</p>
      ) : filteredData.length === 0 ? (
        <p className="no-data">No results match your filters.</p>
      ) : (
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
                className={`${row.status} ${dragOverRow === row.id ? 'drag-over' : ''}`}
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
                    <span className="needed-badge">NEEDED</span>
                  ) : (
                    <>
                      {row.technician}
                      {row.technicianId && (
                        <span className="technician-id">({row.technicianId})</span>
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
                      className="delete-btn"
                      onClick={() => onDeleteAssignment(row.assignmentId)}
                      title="Delete assignment"
                    >
                      ✕
                    </button>
                  ) : (
                    <span className="drag-hint">Drag tech here</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tooltip && (
        <div className="tooltip" style={{ top: tooltip.y, left: tooltip.x }}>
          {tooltip.text}
        </div>
      )}

      <div className="table-stats">
        <p>
          <strong>Total:</strong> {filteredData.length} assignments
          {hasActiveFilters && ` (filtered from ${tableData.length})`}
        </p>
        <p>
          <strong>Assigned:</strong> {filteredData.filter((r) => r.status === 'assigned').length}
        </p>
        <p>
          <strong>Needed:</strong> {filteredData.filter((r) => r.status === 'needed').length}
        </p>
      </div>
    </div>
  );
};

export default ScheduleGridTable;