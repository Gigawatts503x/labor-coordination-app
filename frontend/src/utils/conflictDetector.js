/**
 * Conflict Detector - Detects scheduling conflicts and violations
 */

export class ConflictDetector {
  /**
   * Check if two time slots overlap
   */
  static timesOverlap(start1, end1, start2, end2) {
    const toMinutes = (time) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const s1 = toMinutes(start1);
    const e1 = toMinutes(end1);
    const s2 = toMinutes(start2);
    const e2 = toMinutes(end2);

    return !(e1 <= s2 || s1 >= e2);
  }

  /**
   * Find all conflicts for a tech assignment
   */
  static findTechConflicts(assignment, existingAssignments) {
    const conflicts = [];

    for (const existing of existingAssignments) {
      // Skip if same assignment
      if (existing.id === assignment.id) continue;

      // Check if same tech and date
      if (
        existing.technician_id === assignment.technician_id &&
        existing.assignment_date === assignment.assignment_date
      ) {
        // Check if times overlap
        if (
          this.timesOverlap(
            existing.start_time,
            existing.end_time,
            assignment.start_time,
            assignment.end_time
          )
        ) {
          conflicts.push({
            type: 'tech_double_booked',
            severity: 'error',
            conflictingAssignment: existing,
            message: `Tech ${assignment.tech_name} is already assigned to ${existing.location} at this time`
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Find location conflicts (same room, same time)
   */
  static findLocationConflicts(assignment, existingAssignments) {
    const conflicts = [];

    for (const existing of existingAssignments) {
      if (existing.id === assignment.id) continue;

      if (
        existing.location === assignment.location &&
        existing.assignment_date === assignment.assignment_date
      ) {
        if (
          this.timesOverlap(
            existing.start_time,
            existing.end_time,
            assignment.start_time,
            assignment.end_time
          )
        ) {
          conflicts.push({
            type: 'location_conflict',
            severity: 'warning',
            conflictingAssignment: existing,
            message: `Location ${assignment.location} already has tech assigned at this time`
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Check if tech would exceed max hours per day
   */
  static checkDailyHourLimit(assignment, existingAssignments, maxHoursPerDay = 16) {
    const violations = [];

    // Calculate hours on this day
    const dayAssignments = existingAssignments.filter(
      a =>
        a.technician_id === assignment.technician_id &&
        a.assignment_date === assignment.assignment_date &&
        a.id !== assignment.id
    );

    const existingHours = dayAssignments.reduce((sum, a) => sum + (a.hours_worked || 0), 0);
    const newHours = assignment.hours_worked || 0;
    const total = existingHours + newHours;

    if (total > maxHoursPerDay) {
      violations.push({
        type: 'daily_hour_limit_exceeded',
        severity: 'warning',
        message: `Tech would work ${total}h on ${assignment.assignment_date} (max: ${maxHoursPerDay}h)`,
        currentHours: existingHours,
        proposedHours: newHours,
        totalHours: total,
        maxHours: maxHoursPerDay,
        exceededBy: total - maxHoursPerDay
      });
    }

    return violations;
  }

  /**
   * Check all constraints for an assignment
   */
  static validateAssignment(assignment, existingAssignments, maxHoursPerDay = 16) {
    const errors = [];
    const warnings = [];

    // Tech conflicts
    const techConflicts = this.findTechConflicts(assignment, existingAssignments);
    techConflicts.forEach(c => {
      if (c.severity === 'error') errors.push(c);
      else warnings.push(c);
    });

    // Location conflicts
    const locationConflicts = this.findLocationConflicts(assignment, existingAssignments);
    locationConflicts.forEach(c => {
      if (c.severity === 'error') errors.push(c);
      else warnings.push(c);
    });

    // Daily hour limits
    const hourLimits = this.checkDailyHourLimit(assignment, existingAssignments, maxHoursPerDay);
    hourLimits.forEach(c => warnings.push(c));

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canOverride: errors.length === 0 && warnings.length > 0
    };
  }

  /**
   * Get all unresolved conflicts in a schedule
   */
  static getAllConflicts(assignments, maxHoursPerDay = 16) {
    const conflicts = [];
    const seen = new Set();

    for (let i = 0; i < assignments.length; i++) {
      for (let j = i + 1; j < assignments.length; j++) {
        const a1 = assignments[i];
        const a2 = assignments[j];
        const pairId = [a1.id, a2.id].sort().join('-');

        if (seen.has(pairId)) continue;
        seen.add(pairId);

        // Check tech conflict
        if (
          a1.technician_id === a2.technician_id &&
          a1.assignment_date === a2.assignment_date &&
          this.timesOverlap(a1.start_time, a1.end_time, a2.start_time, a2.end_time)
        ) {
          conflicts.push({
            type: 'tech_double_booked',
            severity: 'error',
            assignments: [a1, a2],
            message: `Tech ${a1.tech_name} double-booked on ${a1.assignment_date}`
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Suggest conflict resolution options
   */
  static suggestResolutions(assignment, existingAssignments, allTechs = []) {
    const validation = this.validateAssignment(assignment, existingAssignments);

    if (validation.isValid) {
      return {
        canProceed: true,
        suggestedActions: []
      };
    }

    const actions = [];

    // If tech conflict, suggest alternative techs or times
    const techConflicts = validation.errors.filter(e => e.type === 'tech_double_booked');
    if (techConflicts.length > 0) {
      actions.push({
        type: 'switch_tech',
        description: 'Assign a different technician',
        relatedConflicts: techConflicts
      });

      actions.push({
        type: 'reschedule_assignment',
        description: 'Reschedule this assignment to a different time',
        relatedConflicts: techConflicts
      });

      actions.push({
        type: 'move_conflicting',
        description: 'Move the conflicting assignment to another time',
        relatedConflicts: techConflicts
      });
    }

    return {
      canProceed: false,
      blockers: validation.errors,
      warnings: validation.warnings,
      suggestedActions: actions
    };
  }
}

export default ConflictDetector;
