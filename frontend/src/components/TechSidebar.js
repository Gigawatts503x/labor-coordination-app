import React, { useState, useMemo } from 'react';
import TechCard from './TechCard';
import '../styles/ScheduleGridAdvanced.css';

const TechSidebar = ({
  technicians = [],
  assignments = [],
  selectedDate = null,
  onDragStart = () => {},
  settings = {}
}) => {
  const [filters, setFilters] = useState({
    showAvailable: true,
    showAssigned: true,
    showByPosition: null,
    hideConflicts: false
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Calculate tech info for selected date
  const techInfo = useMemo(() => {
    const info = {};
    for (const tech of technicians) {
      const dayAssignments = assignments.filter(
        a => a.technician_id === tech.id && a.assignment_date === selectedDate
      );
      const assignedHours = dayAssignments.reduce((sum, a) => sum + (a.hours_worked || 0), 0);
      info[tech.id] = {
        assignedHours,
        assignmentCount: dayAssignments.length,
        isAvailable: assignedHours < 16
      };
    }
    return info;
  }, [technicians, assignments, selectedDate]);

  // Filter techs based on criteria
  const filteredTechs = useMemo(() => {
    return technicians.filter(tech => {
      const info = techInfo[tech.id];

      // Search filter
      if (searchTerm && !tech.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Availability filter
      if (filters.showAvailable && filters.showAssigned) {
        // Show all
      } else if (filters.showAvailable && !filters.showAssigned) {
        if (!info.isAvailable) return false;
      } else if (!filters.showAvailable && filters.showAssigned) {
        if (info.isAvailable) return false;
      }

      return true;
    });
  }, [technicians, techInfo, filters, searchTerm]);

  // Group by availability
  const groupedTechs = useMemo(() => {
    const available = filteredTechs.filter(t => techInfo[t.id].isAvailable);
    const busy = filteredTechs.filter(t => !techInfo[t.id].isAvailable);
    return { available, busy };
  }, [filteredTechs, techInfo]);

  return (
    <div className="tech-sidebar">
      <div className="tech-sidebar__header">
        <h3 className="tech-sidebar__title">Technicians</h3>
        <span className="tech-sidebar__count">{filteredTechs.length}</span>
      </div>

      {/* Search */}
      <div className="tech-sidebar__search">
        <input
          type="text"
          className="tech-sidebar__search-input"
          placeholder="Search techs..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="tech-sidebar__filters">
        <label className="tech-sidebar__filter-item">
          <input
            type="checkbox"
            checked={filters.showAvailable}
            onChange={e =>
              setFilters({ ...filters, showAvailable: e.target.checked })
            }
          />
          <span>Available</span>
          <span className="tech-sidebar__filter-count">
            {groupedTechs.available.length}
          </span>
        </label>

        <label className="tech-sidebar__filter-item">
          <input
            type="checkbox"
            checked={filters.showAssigned}
            onChange={e =>
              setFilters({ ...filters, showAssigned: e.target.checked })
            }
          />
          <span>Assigned</span>
          <span className="tech-sidebar__filter-count">
            {groupedTechs.busy.length}
          </span>
        </label>
      </div>

      {/* Tech List */}
      <div className="tech-sidebar__list">
        {groupedTechs.available.length > 0 && (
          <div className="tech-sidebar__group">
            <div className="tech-sidebar__group-header">Available</div>
            {groupedTechs.available.map(tech => (
              <TechCard
                key={tech.id}
                tech={tech}
                assignedHours={techInfo[tech.id].assignedHours}
                availableHours={16 - techInfo[tech.id].assignedHours}
                onDragStart={onDragStart}
                variant="sidebar"
              />
            ))}
          </div>
        )}

        {groupedTechs.busy.length > 0 && (
          <div className="tech-sidebar__group">
            <div className="tech-sidebar__group-header">Busy</div>
            {groupedTechs.busy.map(tech => (
              <TechCard
                key={tech.id}
                tech={tech}
                assignedHours={techInfo[tech.id].assignedHours}
                availableHours={Math.max(0, 16 - techInfo[tech.id].assignedHours)}
                onDragStart={onDragStart}
                variant="sidebar"
              />
            ))}
          </div>
        )}

        {filteredTechs.length === 0 && (
          <div className="tech-sidebar__empty">No technicians match filters</div>
        )}
      </div>
    </div>
  );
};

export default TechSidebar;

