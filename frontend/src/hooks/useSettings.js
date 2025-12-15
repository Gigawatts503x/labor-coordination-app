// frontend/src/hooks/useSettings.js
import { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../utils/api';

/**
 * Hook for managing global and event-specific settings
 * Handles cascading: assignment level > event level > global level
 */
export const useSettings = () => {
  const [globalSettings, setGlobalSettings] = useState({
    // Tech rates
    tech_hourly_rate: 50,
    tech_half_day_rate: 250,
    tech_full_day_rate: 500,
    // Billing rates
    bill_hourly_rate: 75,
    bill_half_day_rate: 375,
    bill_full_day_rate: 750,
    // Thresholds
    half_day_hours: 5,
    full_day_hours: 10,
    ot_threshold: 10,
    dt_threshold: 20,
    dt_start_hour: 20, // 8pm
    dt_end_hour: 4, // 4am
    // Multipliers
    ot_multiplier: 1.5,
    dt_multiplier: 2.0
  });

  const [eventSettings, setEventSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load global settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await getSettings();
        if (response.data) {
          setGlobalSettings(response.data);
        }
      } catch (err) {
        console.warn('Failed to load settings, using defaults:', err);
        // Use default values
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  /**
   * Get effective rate for an assignment
   * Cascades: assignment override > event override > global default
   */
  const getEffectiveRate = (field, eventId, assignmentOverride) => {
    // 1. Check assignment override
    if (assignmentOverride && assignmentOverride[field] !== undefined) {
      return assignmentOverride[field];
    }

    // 2. Check event override
    if (eventId && eventSettings[eventId] && eventSettings[eventId][field] !== undefined) {
      return eventSettings[eventId][field];
    }

    // 3. Use global default
    return globalSettings[field];
  };

  /**
   * Update global settings
   */
  const updateGlobalSettings = async (updates) => {
    try {
      const response = await updateSettings(updates);
      setGlobalSettings(response.data);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Set event-specific override (partial)
   */
  const setEventOverride = (eventId, overrides) => {
    setEventSettings(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        ...overrides
      }
    }));
  };

  /**
   * Get all rates for calculation
   */
  const getRatesForCalculation = (eventId, assignmentOverride) => {
    return {
      techHourlyRate: getEffectiveRate('tech_hourly_rate', eventId, assignmentOverride),
      techHalfDayRate: getEffectiveRate('tech_half_day_rate', eventId, assignmentOverride),
      techFullDayRate: getEffectiveRate('tech_full_day_rate', eventId, assignmentOverride),
      billHourlyRate: getEffectiveRate('bill_hourly_rate', eventId, assignmentOverride),
      billHalfDayRate: getEffectiveRate('bill_half_day_rate', eventId, assignmentOverride),
      billFullDayRate: getEffectiveRate('bill_full_day_rate', eventId, assignmentOverride),
      otThreshold: getEffectiveRate('ot_threshold', eventId, assignmentOverride),
      dtThreshold: getEffectiveRate('dt_threshold', eventId, assignmentOverride),
      dtStartHour: getEffectiveRate('dt_start_hour', eventId, assignmentOverride),
      dtEndHour: getEffectiveRate('dt_end_hour', eventId, assignmentOverride),
      otMultiplier: getEffectiveRate('ot_multiplier', eventId, assignmentOverride),
      dtMultiplier: getEffectiveRate('dt_multiplier', eventId, assignmentOverride),
      halfDayHours: getEffectiveRate('half_day_hours', eventId, assignmentOverride),
      fullDayHours: getEffectiveRate('full_day_hours', eventId, assignmentOverride)
    };
  };

  return {
    globalSettings,
    eventSettings,
    loading,
    error,
    updateGlobalSettings,
    setEventOverride,
    getEffectiveRate,
    getRatesForCalculation
  };
};
