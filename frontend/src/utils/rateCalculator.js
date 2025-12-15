// frontend/src/utils/rateCalculator.js

/**
 * Complete rate calculation engine for tech assignments
 * Handles: hours breakdown, overtime, double-time, pay calculations
 */

export const rateCalculator = {
  /**
   * Calculate hours breakdown based on start/end times and thresholds
   * @param {string} startTime - HH:MM format (e.g., "15:00")
   * @param {string} endTime - HH:MM format (e.g., "04:00") - can be next day
   * @param {object} settings - { otThreshold, dtThreshold, dtStartHour, ... }
   * @returns {object} - { totalHours, baseHours, otHours, dtHours, breakdown }
   */
  calculateHoursBreakdown: (startTime, endTime, settings = {}) => {
    const {
      otThreshold = 10,
      dtStartHour = 20, // 8pm
      dtEndHour = 4 // 4am
    } = settings;

    // Parse times
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;

    // Handle overnight shift (end time is next day)
    let isOvernight = false;
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60; // Add 24 hours
      isOvernight = true;
    }

    const totalMinutes = endMinutes - startMinutes;
    const totalHours = totalMinutes / 60;

    // Calculate DT hours (8pm to 4am window)
    const dtStartMinutes = dtStartHour * 60; // 8pm = 1200 mins
    const dtEndMinutes = dtEndHour * 60; // 4am = 240 mins (next day)
    
    let dtHours = 0;

    // Single day scenario
    if (!isOvernight) {
      // If shift is entirely within DT window
      if (startMinutes >= dtStartMinutes) {
        dtHours = totalHours;
      }
      // If shift spans across midnight... actually can't happen in single day
    } else {
      // Overnight shift
      // DT portion: from dtStartHour to midnight (24:00)
      if (startMinutes >= dtStartMinutes) {
        dtHours += (24 * 60 - startMinutes) / 60; // From start to midnight
      } else {
        dtHours += (24 * 60 - dtStartMinutes) / 60; // From 8pm to midnight
      }

      // DT portion: from midnight (00:00) to dtEndHour (4am)
      if (endMinutes >= dtEndMinutes) {
        dtHours += (endMinutes - 24 * 60) / 60; // But cap at 4am
        if (endMinutes > 24 * 60 + dtEndMinutes) {
          dtHours = dtHours - ((endMinutes - 24 * 60 - dtEndMinutes) / 60);
        }
      } else {
        dtHours += (endMinutes - 24 * 60) / 60;
      }
    }

    // Clamp DT hours to total hours
    dtHours = Math.min(dtHours, totalHours);

    // Calculate base and OT hours
    let baseHours = Math.min(totalHours, otThreshold);
    let otHours = Math.max(0, totalHours - otThreshold);

    // DT hours are IN ADDITION (overlap with base/OT)
    return {
      totalHours: parseFloat(totalHours.toFixed(2)),
      baseHours: parseFloat(baseHours.toFixed(2)),
      otHours: parseFloat(otHours.toFixed(2)),
      dtHours: parseFloat(dtHours.toFixed(2)),
      breakdown: `${baseHours.toFixed(1)}h base + ${otHours.toFixed(1)}h OT + ${dtHours.toFixed(1)}h DT`
    };
  },

  /**
   * Calculate tech payout based on hours and rates
   * @param {object} hoursData - { baseHours, otHours, dtHours }
   * @param {number} techRate - base hourly rate
   * @param {number} otMultiplier - OT multiplier (default 1.5)
   * @param {number} dtMultiplier - DT multiplier (default 2.0)
   * @returns {object} - { basePay, otPay, dtPay, totalPay }
   */
  calculateTechPayout: (hoursData, techRate, otMultiplier = 1.5, dtMultiplier = 2.0) => {
    const basePay = hoursData.baseHours * techRate;
    const otPay = hoursData.otHours * techRate * otMultiplier;
    const dtPay = hoursData.dtHours * techRate * dtMultiplier;

    return {
      basePay: parseFloat(basePay.toFixed(2)),
      otPay: parseFloat(otPay.toFixed(2)),
      dtPay: parseFloat(dtPay.toFixed(2)),
      totalPay: parseFloat((basePay + otPay + dtPay).toFixed(2))
    };
  },

  /**
   * Calculate customer billing based on hours and rates
   * @param {object} hoursData - { baseHours, otHours, dtHours }
   * @param {number} billRate - base billing rate
   * @param {number} otMultiplier - OT multiplier
   * @param {number} dtMultiplier - DT multiplier
   * @returns {object} - { baseBill, otBill, dtBill, totalBill }
   */
  calculateBilling: (hoursData, billRate, otMultiplier = 1.5, dtMultiplier = 2.0) => {
    const baseBill = hoursData.baseHours * billRate;
    const otBill = hoursData.otHours * billRate * otMultiplier;
    const dtBill = hoursData.dtHours * billRate * dtMultiplier;

    return {
      baseBill: parseFloat(baseBill.toFixed(2)),
      otBill: parseFloat(otBill.toFixed(2)),
      dtBill: parseFloat(dtBill.toFixed(2)),
      totalBill: parseFloat((baseBill + otBill + dtBill).toFixed(2))
    };
  },

  /**
   * Complete calculation for an assignment
   * @param {object} assignment - { startTime, endTime, techRate, billRate, otMultiplier, dtMultiplier }
   * @param {object} settings - Global settings
   * @returns {object} - Complete breakdown with all calculations
   */
  calculateAssignment: (assignment, settings = {}) => {
    const {
      startTime,
      endTime,
      techRate = 0,
      billRate = 0,
      otMultiplier = 1.5,
      dtMultiplier = 2.0
    } = assignment;

    // Get hours breakdown
    const hoursData = rateCalculator.calculateHoursBreakdown(startTime, endTime, settings);

    // Calculate payouts
    const techPayout = rateCalculator.calculateTechPayout(hoursData, techRate, otMultiplier, dtMultiplier);
    const billData = rateCalculator.calculateBilling(hoursData, billRate, otMultiplier, dtMultiplier);

    return {
      hours: hoursData,
      techPayout,
      billing: billData,
      margin: parseFloat((billData.totalBill - techPayout.totalPay).toFixed(2)),
      marginPercent: parseFloat((((billData.totalBill - techPayout.totalPay) / billData.totalBill) * 100).toFixed(1))
    };
  }
};

export default rateCalculator;
