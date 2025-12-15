import React, { useMemo } from 'react';
import '../styles/ScheduleGridAdvanced.css';

const RequirementsPanel = ({
  requirements = [],
  assignments = [],
  selectedDate = null
}) => {
  // Calculate fulfillment for selected date
  const requirementStatus = useMemo(() => {
    const status = {};

    for (const req of requirements) {
      // Check if requirement applies to selected date
      if (selectedDate && req.requirement_date && req.requirement_date !== selectedDate) {
        continue;
      }

      const assignedCount = assignments.filter(
        a => a.requirement_id === req.id && a.assignment_date === selectedDate
      ).length;

      const fulfilled = assignedCount >= (req.techs_needed || 1);

      status[req.id] = {
        required: req.techs_needed || 1,
        assigned: assignedCount,
        fulfilled,
        remaining: Math.max(0, (req.techs_needed || 1) - assignedCount)
      };
    }

    return status;
  }, [requirements, assignments, selectedDate]);

  const filtered = requirements.filter(req => {
    if (!selectedDate) return true;
    return req.requirement_date === selectedDate || !req.requirement_date;
  });

  const fulfilled = filtered.filter(r => requirementStatus[r.id]?.fulfilled);
  const unfulfilled = filtered.filter(r => !requirementStatus[r.id]?.fulfilled);

  return (
    <div className="requirements-panel">
      <div className="requirements-panel__header">
        <h3 className="requirements-panel__title">Requirements</h3>
        <span className="requirements-panel__date">{selectedDate || 'All'}</span>
      </div>

      <div className="requirements-panel__stats">
        <div className="requirements-panel__stat">
          <div className="requirements-panel__stat-value">{fulfilled.length}</div>
          <div className="requirements-panel__stat-label">Fulfilled</div>
        </div>
        <div className="requirements-panel__stat">
          <div className="requirements-panel__stat-value">{unfulfilled.length}</div>
          <div className="requirements-panel__stat-label">Open</div>
        </div>
      </div>

      {/* Fulfilled Requirements */}
      {fulfilled.length > 0 && (
        <div className="requirements-panel__section">
          <div className="requirements-panel__section-header">✓ Fulfilled</div>
          {fulfilled.map(req => {
            const status = requirementStatus[req.id];
            return (
              <div key={req.id} className="requirements-panel__item requirements-panel__item--fulfilled">
                <div className="requirements-panel__item-header">
                  <div className="requirements-panel__item-position">{req.position}</div>
                  <div className="requirements-panel__item-count">
                    {status.assigned}/{status.required}
                  </div>
                </div>
                <div className="requirements-panel__item-location">{req.location}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unfulfilled Requirements */}
      {unfulfilled.length > 0 && (
        <div className="requirements-panel__section">
          <div className="requirements-panel__section-header">⚠ Needs Attention</div>
          {unfulfilled.map(req => {
            const status = requirementStatus[req.id];
            return (
              <div key={req.id} className="requirements-panel__item requirements-panel__item--unfulfilled">
                <div className="requirements-panel__item-header">
                  <div className="requirements-panel__item-position">{req.position}</div>
                  <div className="requirements-panel__item-count">
                    {status.assigned}/{status.required}
                  </div>
                </div>
                <div className="requirements-panel__item-location">{req.location}</div>
                <div className="requirements-panel__item-needed">
                  {status.remaining} more needed
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="requirements-panel__empty">No requirements for selected date</div>
      )}
    </div>
  );
};

export default RequirementsPanel;

