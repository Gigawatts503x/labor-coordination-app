/**
 * Schedule Calculator - Calculates tech availability and scheduling conflicts
 */

export class ScheduleCalculator {
  constructor(settings = {}) {
    this.settings = {
      halfday_hours: 5,
      fullday_hours: 10,
      ot_threshold: 10,
      dot_start_hour: 20, // 8 PM
      dot_end_hour: 4, // 4 AM
      ...settings
    };
  }

  /**
   * Convert time string (HH:MM) to minutes since midnight
   */
  timeToMinutes(time) {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes since midnight to time string (HH:MM)
   */
  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  /**
   * Calculate hours between two times (handles overnight shifts)
   */
  calculateHours(startTime, endTime, isOvernight = false) {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    if (isOvernight || end < start) {
      // Overnight shift: from start time to midnight + midnight to end time
      return ((24 * 60 - start) + end) / 60;
    }

    return (end - start) / 60;
  }

  /**
   * Calculate hours in double-time window (8 PM - 4 AM)
   */
  calculateDTHours(startTime, endTime, isOvernight = false) {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    const dtStart = this.timeToMinutes(`${this.settings.dot_start_hour}:00`); // 8 PM = 1200 min
    const dtEnd = this.timeToMinutes(`${this.settings.dot_end_hour}:00`); // 4 AM = 240 min

    let dtHours = 0;

    if (isOvernight) {
      // Overnight shift: includes time from dtStart to midnight AND midnight to dtEnd
      dtHours = ((24 * 60 - dtStart) + dtEnd) / 60;
    } else if (start < dtStart && end > dtStart) {
      // Shift spans into DT window
      dtHours = (end - dtStart) / 60;
    } else if (start >= dtStart) {
      // Entire shift is in DT window
      dtHours = (end - start) / 60;
    }

    return Math.max(0, dtHours);
  }

  /**
   * Calculate rate breakdown for an assignment
   */
  calculateRateBreakdown(startTime, endTime, isOvernight = false) {
    const totalHours = this.calculateHours(startTime, endTime, isOvernight);
    const dtHours = this.calculateDTHours(startTime, endTime, isOvernight);

    // Hours after OT threshold (excluding DT hours)
    const otThreshold = this.settings.ot_threshold;
    let otHours = 0;
    let baseHours = totalHours - dtHours;

    if (baseHours > otThreshold) {
      otHours = baseHours - otThreshold;
      baseHours = otThreshold;
    }

    return {
      baseHours: Math.round(baseHours * 100) / 100,
      otHours: Math.round(otHours * 100) / 100,
      dtHours: Math.round(dtHours * 100) / 100,
      totalHours: Math.round(totalHours * 100) / 100
    };
  }

  /**
   * Check if a tech is available (no overlapping assignments)
   */
  isAvailable(techId, date, startTime, endTime, existingAssignments = []) {
    return !existingAssignments.some(assignment => {
      if (assignment.technician_id !== techId || assignment.assignment_date !== date) {
        return false;
      }

      // Check for time overlap
      const existingStart = this.timeToMinutes(assignment.start_time);
      const existingEnd = this.timeToMinutes(assignment.end_time);
      const newStart = this.timeToMinutes(startTime);
      const newEnd = this.timeToMinutes(endTime);

      return !(newEnd <= existingStart || newStart >= existingEnd);
    });
  }

  /**
   * Get available techs for a time slot
   */
  getAvailableTechs(techs, date, startTime, endTime, existingAssignments = []) {
    return techs.filter(tech =>
      this.isAvailable(tech.id, date, startTime, endTime, existingAssignments)
    );
  }

  /**
   * Calculate hours already assigned to a tech on a given date
   */
  getAssignedHoursForDate(techId, date, assignments = []) {
    return assignments
      .filter(a => a.technician_id === techId && a.assignment_date === date)
      .reduce((sum, a) => sum + (a.hours_worked || 0), 0);
  }

  /**
   * Get all assignments for a tech on a date
   */
  getAssignmentsForDate(techId, date, assignments = []) {
    return assignments.filter(a => a.technician_id === techId && a.assignment_date === date);
  }

  /**
   * Calculate available hours remaining for a tech on a date
   */
  getAvailableHours(techId, date, assignments = [], maxDaily = 16) {
    const assignedHours = this.getAssignedHoursForDate(techId, date, assignments);
    return Math.max(0, maxDaily - assignedHours);
  }

  /**
   * Check if there's a conflict (tech double-booked at same time)
   */
  hasConflict(techId, date, startTime, endTime, assignments = []) {
    return !this.isAvailable(techId, date, startTime, endTime, assignments);
  }

  /**
   * Get all conflicts for a tech on a date
   */
  getConflicts(techId, date, startTime, endTime, assignments = []) {
    const conflicts = [];
    for (const assignment of assignments) {
      if (
        assignment.technician_id === techId &&
        assignment.assignment_date === date &&
        !this.isAvailable(techId, date, startTime, endTime, [assignment])
      ) {
        conflicts.push(assignment);
      }
    }
    return conflicts;
  }

  /**
   * Suggest optimal techs for a position based on availability and hours
   */
  suggestTechs(techs, date, startTime, endTime, requirements = [], assignments = [], limit = 3) {
    const rateBreakdown = this.calculateRateBreakdown(startTime, endTime);
    const neededHours = rateBreakdown.totalHours;

    const suggestions = techs
      .map(tech => {
        const isAvailable = this.isAvailable(tech.id, date, startTime, endTime, assignments);
        const assignedHours = this.getAssignedHoursForDate(tech.id, date, assignments);
        const availableHours = this.getAvailableHours(tech.id, date, assignments);
        const canFit = availableHours >= neededHours;

        // Score based on availability and fit
        let score = 0;
        if (isAvailable && canFit) {
          score = 100 - assignedHours; // Prefer less-busy techs
        } else if (isAvailable) {
          score = 50; // Can fit but might exceed daily max
        } else {
          score = 0; // Not available
        }

        return {
          tech,
          score,
          isAvailable,
          assignedHours,
          availableHours,
          canFit
        };
      })
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => ({
        tech: s.tech,
        isAvailable: s.isAvailable,
        assignedHours: s.assignedHours,
        availableHours: s.availableHours,
        canFit: s.canFit
      }));

    return suggestions;
  }

  /**
   * Get all dates covered by an event
   */
  getEventDateRange(event) {
    if (!event.start_date || !event.end_date) return [];

    const start = new Date(event.start_date);
    const end = new Date(event.end_date);
    const dates = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }

    return dates;
  }
}

/**
 * Utility function to get time slot label
 */
export function getTimeSlotLabel(date, startTime, endTime) {
  return `${date} ${startTime}-${endTime}`;
}

/**
 * Utility function to format hours as readable string
 */
export function formatHours(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default ScheduleCalculator;
