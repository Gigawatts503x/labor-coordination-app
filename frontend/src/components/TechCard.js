import React from 'react';
import '../styles/ScheduleGridAdvanced.css';

const TechCard = ({
  tech,
  assignedHours = 0,
  availableHours = 24,
  position = null,
  isDragging = false,
  onDragStart = () => {},
  onRemove = () => {},
  showDetails = true,
  variant = 'sidebar' // 'sidebar' or 'assignment'
}) => {
  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('tech', JSON.stringify(tech));
    onDragStart(tech, e);
  };

  const utilizationPercent = ((assignedHours / 24) * 100).toFixed(0);
  const isHighUtilization = assignedHours > 16;

  if (variant === 'assignment') {
    // Card shown in grid (compact)
    return (
      <div
        className={`tech-card tech-card--assignment ${
          isHighUtilization ? 'tech-card--warning' : ''
        }`}
        title={`${tech.name} - ${assignedHours}h assigned`}
      >
        <div className="tech-card__name">{tech.name}</div>
        {position && <div className="tech-card__position">{position}</div>}
        <div className="tech-card__hours">{assignedHours}h</div>
        <button
          className="tech-card__remove"
          onClick={onRemove}
          title="Remove assignment"
          aria-label="Remove"
        >
          ×
        </button>
      </div>
    );
  }

  // Sidebar variant (full details)
  return (
    <div
      className={`tech-card tech-card--sidebar ${isDragging ? 'tech-card--dragging' : ''}`}
      draggable
      onDragStart={handleDragStart}
    >
      <div className="tech-card__header">
        <div className="tech-card__name">{tech.name}</div>
        <div className="tech-card__utilization" title="Utilization">
          {utilizationPercent}%
        </div>
      </div>

      {showDetails && (
        <div className="tech-card__details">
          <div className="tech-card__detail-row">
            <span className="tech-card__label">Available:</span>
            <span className="tech-card__value">{availableHours.toFixed(1)}h</span>
          </div>
          <div className="tech-card__detail-row">
            <span className="tech-card__label">Assigned:</span>
            <span className="tech-card__value">{assignedHours.toFixed(1)}h</span>
          </div>
          {position && (
            <div className="tech-card__detail-row">
              <span className="tech-card__label">Position:</span>
              <span className="tech-card__value">{position}</span>
            </div>
          )}
        </div>
      )}

      <div className="tech-card__progress">
        <div className="tech-card__progress-bar">
          <div
            className={`tech-card__progress-fill ${
              isHighUtilization ? 'tech-card__progress-fill--warning' : ''
            }`}
            style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
          />
        </div>
      </div>

      <div className="tech-card__hint">Drag to assign</div>
    </div>
  );
};

export default TechCard;

