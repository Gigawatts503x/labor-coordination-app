/**
 * frontend/src/utils/rateCalculator.js
 * 
 * CORRECTED PAYMENT LOGIC:
 * - Day Rate: Fixed amount for half-day to full-day threshold
 * - OT Rate: Tech's hourly rate × 1.5
 * - DOT Rate: Tech's hourly rate × 2.0
 * - DOT Start Hour: Any work after this hour becomes DOT (if not already paid as day rate)
 */

/**
 * Calculate hours between two times
 */
export function calculateHours(timeIn, timeOut) {
  if (!timeIn || !timeOut) return 0;

  const [inHours, inMinutes] = timeIn.split(':').map(Number);
  const [outHours, outMinutes] = timeOut.split(':').map(Number);

  const inTotalMinutes = inHours * 60 + inMinutes;
  const outTotalMinutes = outHours * 60 + outMinutes;

  let diff = outTotalMinutes - inTotalMinutes;
  if (diff < 0) {
    diff += 24 * 60;
  }

  return diff / 60;
}

/**
 * CORRECTED: Calculate hour breakdown (day rate threshold, then OT, then DOT)
 * 
 * LOGIC:
 * 1. If hours <= halfday_hours: All at day rate
 * 2. If hours > halfday_hours but <= fullday_hours: All at day rate
 * 3. If hours > fullday_hours: fullday_hours at day rate, rest as OT (unless after DOT start hour)
 * 4. If after DOT_START_HOUR: Hours after that threshold become DOT instead of OT
 */
export function calculateHourBreakdown(
  totalHours,
  startHour,
  halfday_hours = 5,
  fullday_hours = 10,
  dot_start_hour = 20
) {
  if (!totalHours || totalHours <= 0) {
    return { dayRateHours: 0, otHours: 0, dotHours: 0 };
  }

  let dayRateHours = 0;
  let otHours = 0;
  let dotHours = 0;

  // Hours covered by day rate (up to fullday_hours)
  if (totalHours <= fullday_hours) {
    dayRateHours = totalHours;
  } else {
    dayRateHours = fullday_hours;
    let remainingHours = totalHours - fullday_hours;

    // Check if work extends past DOT start hour
    if (startHour < dot_start_hour) {
      // Work starts before DOT hour
      // Remaining hours after fullday become OT
      otHours = remainingHours;
      dotHours = 0;
    } else {
      // Work starts at or after DOT hour - all remaining become DOT
      otHours = 0;
      dotHours = remainingHours;
    }
  }

  return {
    dayRateHours: parseFloat(dayRateHours.toFixed(2)),
    otHours: parseFloat(otHours.toFixed(2)),
    dotHours: parseFloat(dotHours.toFixed(2))
  };
}

/**
 * CORRECTED: Calculate tech payout
 * 
 * @param {number} dayRateHours - Hours covered by day rate
 * @param {number} otHours - Overtime hours
 * @param {number} dotHours - Double-time hours
 * @param {number} dayRate - Tech's day rate (fixed amount)
 * @param {number} hourlyRate - Tech's hourly rate (for OT/DOT calculations)
 * @param {number} otRatio - OT multiplier (1.5)
 * @param {number} dotRatio - DOT multiplier (2.0)
 * @returns {number} Total tech payout
 */
export function calculateTechPayout(
  dayRateHours,
  otHours,
  dotHours,
  dayRate,
  hourlyRate,
  otRatio = 1.5,
  dotRatio = 2.0
) {
  const dayPay = dayRateHours > 0 ? dayRate : 0;
  const otPay = otHours * hourlyRate * otRatio;
  const dotPay = dotHours * hourlyRate * dotRatio;

  return parseFloat((dayPay + otPay + dotPay).toFixed(2));
}

/**
 * CORRECTED: Calculate customer billing
 * Same structure as tech payout but with customer/billing rates
 */
export function calculateBilledAmount(
  dayRateHours,
  otHours,
  dotHours,
  billingDayRate,
  billingHourlyRate,
  otRatio = 1.5,
  dotRatio = 2.0
) {
  const dayBilling = dayRateHours > 0 ? billingDayRate : 0;
  const otBilling = otHours * billingHourlyRate * otRatio;
  const dotBilling = dotHours * billingHourlyRate * dotRatio;

  return parseFloat((dayBilling + otBilling + dotBilling).toFixed(2));
}

/**
 * Calculate margin (profit)
 */
export function calculateMargin(techPayout, customerBill) {
  const margin = customerBill - techPayout;
  const marginPercent = customerBill > 0 ? (margin / customerBill) * 100 : 0;

  return {
    margin: parseFloat(margin.toFixed(2)),
    marginPercent: parseFloat(marginPercent.toFixed(2))
  };
}

/**
 * CORRECTED: Calculate all metrics for an assignment
 * 
 * Key difference: Uses tech's hourly rate for OT/DOT, day rate for base hours
 */
export function calculateAssignmentMetrics(assignment, settings, techRates) {
  const {
    start_time = null,
    end_time = null,
    assignment_date = null
  } = assignment;

  const {
    ot_ratio = 1.5,
    dot_ratio = 2.0,
    dot_start_hour = 20,
    halfday_hours = 5,
    fullday_hours = 10,
    customer_hourly_rate = 75,
    customer_day_rate = 450
  } = settings;

  // Get tech rates (use event overrides if available, else use tech profile defaults)
  const {
    day_rate = 450,
    hourly_rate = 50,
    half_day_rate = 300,
    full_day_rate = 450
  } = techRates || {};

  if (!start_time || !end_time || !assignment_date) {
    return {
      hours_worked: 0,
      day_rate_hours: 0,
      ot_hours: 0,
      dot_hours: 0,
      tech_pay: 0,
      customer_bill: 0,
      margin: 0
    };
  }

  // Calculate total hours
  const hours_worked = calculateHours(start_time, end_time);

  // Parse start hour
  const startHour = parseInt(start_time.split(':')[0], 10);

  // Get hour breakdown
  const breakdown = calculateHourBreakdown(
    hours_worked,
    startHour,
    halfday_hours,
    fullday_hours,
    dot_start_hour
  );

  // Calculate payouts using tech's rates
  const tech_pay = calculateTechPayout(
    breakdown.dayRateHours,
    breakdown.otHours,
    breakdown.dotHours,
    day_rate,
    hourly_rate,
    ot_ratio,
    dot_ratio
  );

  const customer_bill = calculateBilledAmount(
    breakdown.dayRateHours,
    breakdown.otHours,
    breakdown.dotHours,
    customer_day_rate,
    customer_hourly_rate,
    ot_ratio,
    dot_ratio
  );

  const marginData = calculateMargin(tech_pay, customer_bill);

  return {
    hours_worked: parseFloat(hours_worked.toFixed(2)),
    day_rate_hours: parseFloat(breakdown.dayRateHours.toFixed(2)),
    ot_hours: parseFloat(breakdown.otHours.toFixed(2)),
    dot_hours: parseFloat(breakdown.dotHours.toFixed(2)),
    tech_pay,
    customer_bill,
    margin: marginData.margin,
    margin_percent: marginData.marginPercent
  };
}

export default {
  calculateHours,
  calculateHourBreakdown,
  calculateTechPayout,
  calculateBilledAmount,
  calculateMargin,
  calculateAssignmentMetrics
};