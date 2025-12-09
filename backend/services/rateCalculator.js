// backend/services/rateCalculator.js
// Handles all rate calculations and overtime logic
// WHAT THIS DOES:
// - Calculates hours from time_in and time_out
// - Applies overtime multipliers based on project settings
// - Generates tech payout and customer billing amounts
// - Handles rounding rules

/**
 * Calculate hours between two times
 * INPUT: "10:00:00" and "18:30:00"
 * OUTPUT: 8.5 hours
 */
function calculateHours(timeIn, timeOut) {
  if (!timeIn || !timeOut) return 0;

  // Parse time strings (handle both "HH:MM" and "HH:MM:SS")
  const [inHours, inMinutes] = timeIn.split(':').map(Number);
  const [outHours, outMinutes] = timeOut.split(':').map(Number);

  const inTotalMinutes = inHours * 60 + inMinutes;
  const outTotalMinutes = outHours * 60 + outMinutes;

  // Handle overnight shifts (if out time is earlier than in time, assume next day)
  let diff = outTotalMinutes - inTotalMinutes;
  if (diff < 0) {
    diff += 24 * 60; // Add 24 hours
  }

  return diff / 60; // Convert back to hours
}

/**
 * Calculate overtime hours
 * INPUT: totalHours = 10, overtimeThreshold = 8, multiplier = 1.5
 * OUTPUT: { regularHours: 8, otHours: 2, otMultiplier: 1.5 }
 */
function calculateOvertimeHours(totalHours, overtimeThreshold = 8) {
  const regular = Math.min(totalHours, overtimeThreshold);
  const overtime = Math.max(0, totalHours - overtimeThreshold);
  
  return {
    regularHours: regular,
    otHours: overtime,
  };
}

/**
 * Apply rounding rule to hours
 * INPUT: 8.25 hours with "half-hour" rounding
 * OUTPUT: 8.5 hours
 * RULES:
 *   - "exact": no rounding
 *   - "quarter-hour": round to 0.25 increments
 *   - "half-hour": round to 0.5 increments
 *   - "full-hour": round to nearest hour
 */
function applyRounding(hours, rule = 'half-hour') {
  const roundingMap = {
    'exact': hours,
    'quarter-hour': Math.round(hours * 4) / 4,
    'half-hour': Math.round(hours * 2) / 2,
    'full-hour': Math.round(hours),
  };

  return roundingMap[rule] || hours;
}

/**
 * Calculate tech payout (what the tech gets paid)
 * Uses project settings from database
 */
export function calculateTechPayout(assignment, projectSettings) {
  const {
    hours_worked = 0,
    ot_hours = 0,
    dot_hours = 0,
    tech_rate = 0,
    half_full_flag = null
  } = assignment;

  const {
    overtime_multiplier = 1.5,
    dot_multiplier = 2.0
  } = projectSettings;

  let payout = 0;

  // Check if this is a half-day or full-day rate
  if (half_full_flag === 'half') {
    payout = assignment.half_day_rate || 0;
  } else if (half_full_flag === 'full') {
    payout = assignment.full_day_rate || 0;
  } else {
    // Hourly calculation
    payout = (hours_worked * tech_rate) +
             (ot_hours * tech_rate * overtime_multiplier) +
             (dot_hours * tech_rate * dot_multiplier);
  }

  return Math.round(payout * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate customer billing (what to bill the client)
 * Uses different rates and rounding than tech payout
 */
export function calculateCustomerBill(assignment, projectSettings) {
  const {
    hours_worked = 0,
    bill_rate = 0,
  } = assignment;

  const {
    invoice_increment = 'half-hour'
  } = projectSettings;

  // Apply rounding first
  const roundedHours = applyRounding(hours_worked, invoice_increment);

  // Calculate bill
  const bill = roundedHours * bill_rate;

  return Math.round(bill * 100) / 100;
}

/**
 * Full calculation: given times and settings, calculate everything
 * This is called when creating or updating an assignment
 */
export function calculateAssignmentMetrics(assignment, projectSettings) {
  // 1. Calculate total hours
  const totalHours = calculateHours(assignment.time_in, assignment.time_out);
  
  // 2. Apply rounding to total hours
  const roundedTotalHours = applyRounding(
    totalHours,
    projectSettings.rounding_rule || 'half-hour'
  );

  // 3. Split into regular/overtime/double-time
  const { regularHours, otHours } = calculateOvertimeHours(
    roundedTotalHours,
    projectSettings.overtime_threshold || 8
  );

  // 4. Calculate payouts
  const updatedAssignment = {
    ...assignment,
    hours_worked: regularHours,
    ot_hours: otHours,
    dot_hours: 0, // Can be extended later for triple-time, etc.
  };

  const techPayout = calculateTechPayout(updatedAssignment, projectSettings);
  const customerBill = calculateCustomerBill(updatedAssignment, projectSettings);

  return {
    hours_worked: regularHours,
    ot_hours: otHours,
    dot_hours: 0,
    tech_payout: techPayout,
    bill_amount: customerBill,
  };
}

/**
 * Calculate total project costs
 * Used for dashboard summaries
 */
export function calculateEventTotals(assignments) {
  const totals = {
    totalTechPayout: 0,
    totalCustomerBill: 0,
    totalHours: 0,
    totalOTHours: 0,
    techCount: new Set(),
  };

  assignments.forEach(assignment => {
    totals.totalTechPayout += assignment.tech_payout || 0;
    totals.totalCustomerBill += assignment.billed_day_rate || 0;
    totals.totalHours += assignment.hours_worked || 0;
    totals.totalOTHours += assignment.ot_hours || 0;
    if (assignment.tech_name) {
      totals.techCount.add(assignment.tech_name);
    }
  });

  totals.uniqueTechs = totals.techCount.size;
  delete totals.techCount; // Remove the Set from output

  return totals;
}

export default {
  calculateHours,
  calculateOvertimeHours,
  applyRounding,
  calculateTechPayout,
  calculateCustomerBill,
  calculateAssignmentMetrics,
  calculateEventTotals,
};
