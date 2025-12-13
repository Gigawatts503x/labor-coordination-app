/**
 * frontend/src/utils/rateCalculator.js
 * 
 * Step 2: Handles rate calculations for the frontend
 * - Calculates hours from time_in and time_out
 * - Breaks down hours into base/OT/DT categories
 * - Calculates tech payout and customer billing
 * - Uses per-assignment, event-level, and global settings
 */

/**
 * Calculate hours between two times
 * INPUT: "10:00" and "18:30"
 * OUTPUT: 8.5 hours
 */
export function calculateHours(timeIn, timeOut) {
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
 * Calculate hour breakdown (base/OT/DT hours)
 * Step 2: NEW - Splits total hours into categories
 * 
 * INPUT: totalHours = 12, halfday_hours = 5
 * OUTPUT: { baseHours: 5, otHours: 5, dtHours: 2 }
 */
export function calculateHourBreakdown(totalHours, halfday_hours = 5) {
  if (!totalHours || totalHours <= 0) {
    return { baseHours: 0, otHours: 0, dtHours: 0 };
  }

  // For simplicity: base = up to halfday_hours, OT after that
  const baseHours = Math.min(totalHours, halfday_hours);
  const remainingHours = totalHours - baseHours;
  const otHours = remainingHours;
  const dtHours = 0; // Can be extended for specific rules

  return {
    baseHours: parseFloat(baseHours.toFixed(2)),
    otHours: parseFloat(otHours.toFixed(2)),
    dtHours: parseFloat(dtHours.toFixed(2))
  };
}

/**
 * Apply rounding rule to hours
 * INPUT: 8.25 hours with "half-hour" rounding
 * OUTPUT: 8.5 hours
 * RULES:
 * - "exact": no rounding
 * - "quarter-hour": round to 0.25 increments
 * - "half-hour": round to 0.5 increments
 * - "full-hour": round to nearest hour
 */
export function applyRounding(hours, rule = 'half-hour') {
  if (!hours) return 0;

  const roundingMap = {
    exact: hours,
    'quarter-hour': Math.round(hours * 4) / 4,
    'half-hour': Math.round(hours * 2) / 2,
    'full-hour': Math.round(hours)
  };

  return roundingMap[rule] || hours;
}

/**
 * Calculate tech payout based on effective settings
 * Step 2: NEW - Uses per-assignment, event, and global rates
 * 
 * @param {object} assignment - Assignment with hours and rate info
 * @param {object} settings - Effective settings (assignment > event > global)
 * @returns {object} { techPayout, breakdown }
 */
export function calculateTechPayout(assignment, settings) {
  const {
    hours_worked = 0,
    base_hours = 0,
    ot_hours = 0,
    dot_hours = 0,
    rate_type = 'hourly'
  } = assignment;

  const {
    tech_hourly_rate = 50,
    tech_half_day_rate = 250,
    tech_full_day_rate = 500,
    halfday_hours = 5,
    fullday_hours = 10
  } = settings;

  let techPayout = 0;
  let breakdown = { baseHours: 0, otHours: 0, dtHours: 0 };

  if (rate_type === 'half-day') {
    // Half-day rate applies to up to halfday_hours
    techPayout = tech_half_day_rate;
    breakdown.baseHours = Math.min(hours_worked, halfday_hours);
  } else if (rate_type === 'full-day') {
    // Full-day rate applies to full shift
    techPayout = tech_full_day_rate;
    breakdown.baseHours = hours_worked;
  } else {
    // Hourly calculation with OT/DT multipliers
    breakdown = calculateHourBreakdown(hours_worked, halfday_hours);
    
    techPayout = 
      (breakdown.baseHours * tech_hourly_rate) +
      (breakdown.otHours * tech_hourly_rate * 1.5) +  // 1.5x for OT
      (breakdown.dtHours * tech_hourly_rate * 2.0);   // 2x for DT
  }

  return {
    techPayout: parseFloat(techPayout.toFixed(2)),
    breakdown
  };
}

/**
 * Calculate customer billing based on effective settings
 * Step 2: NEW - Uses per-assignment, event, and global rates
 * 
 * @param {object} assignment - Assignment with hours and billing info
 * @param {object} settings - Effective settings (assignment > event > global)
 * @returns {object} { billedAmount, breakdown }
 */
export function calculateBilledAmount(assignment, settings) {
  const {
    hours_worked = 0,
    base_hours = 0,
    ot_hours = 0,
    dot_hours = 0,
    rate_type = 'hourly'
  } = assignment;

  const {
    bill_hourly_rate = 75,
    bill_half_day_rate = 375,
    bill_full_day_rate = 750,
    halfday_hours = 5,
    fullday_hours = 10
  } = settings;

  let billedAmount = 0;
  let breakdown = { baseHours: 0, otHours: 0, dtHours: 0 };

  if (rate_type === 'half-day') {
    // Half-day billing rate
    billedAmount = bill_half_day_rate;
    breakdown.baseHours = Math.min(hours_worked, halfday_hours);
  } else if (rate_type === 'full-day') {
    // Full-day billing rate
    billedAmount = bill_full_day_rate;
    breakdown.baseHours = hours_worked;
  } else {
    // Hourly calculation with OT/DT multipliers
    breakdown = calculateHourBreakdown(hours_worked, halfday_hours);
    
    billedAmount = 
      (breakdown.baseHours * bill_hourly_rate) +
      (breakdown.otHours * bill_hourly_rate * 1.5) +  // 1.5x for OT
      (breakdown.dtHours * bill_hourly_rate * 2.0);   // 2x for DT
  }

  return {
    billedAmount: parseFloat(billedAmount.toFixed(2)),
    breakdown
  };
}

/**
 * Calculate total event costs
 * Sums all assignment payouts and billings
 * 
 * @param {array} assignments - Array of assignments
 * @param {object} settings - Effective settings
 * @returns {object} { totalTechPay, totalBill, totalHours, uniqueTechs }
 */
export function calculateEventTotals(assignments, settings) {
  let totalTechPay = 0;
  let totalBill = 0;
  let totalHours = 0;
  const techSet = new Set();

  assignments.forEach(assignment => {
    const { techPayout } = calculateTechPayout(assignment, settings);
    const { billedAmount } = calculateBilledAmount(assignment, settings);

    totalTechPay += techPayout;
    totalBill += billedAmount;
    totalHours += assignment.hours_worked || 0;

    if (assignment.technician_name) {
      techSet.add(assignment.technician_name);
    }
  });

  return {
    totalTechPay: parseFloat(totalTechPay.toFixed(2)),
    totalBill: parseFloat(totalBill.toFixed(2)),
    totalHours: parseFloat(totalHours.toFixed(2)),
    uniqueTechs: techSet.size
  };
}

/**
 * Calculate margin on an assignment
 * Useful for understanding profitability
 * 
 * @param {number} techPayout - What we pay the tech
 * @param {number} billedAmount - What we bill the customer
 * @returns {object} { margin, marginPercent }
 */
export function calculateMargin(techPayout, billedAmount) {
  const margin = billedAmount - techPayout;
  const marginPercent = billedAmount > 0 ? (margin / billedAmount) * 100 : 0;

  return {
    margin: parseFloat(margin.toFixed(2)),
    marginPercent: parseFloat(marginPercent.toFixed(2))
  };
}

export default {
  calculateHours,
  calculateHourBreakdown,
  applyRounding,
  calculateTechPayout,
  calculateBilledAmount,
  calculateEventTotals,
  calculateMargin
};
