// frontend/src/utils/dateUtils.js

/**
 * Format an ISO date string to a consistent display format
 * Handles timezone issues by parsing the date in UTC
 * 
 * @param {string} isoDate - ISO date string (e.g., "2025-12-20" or "2025-12-20T00:00:00Z")
 * @returns {string} Formatted date (e.g., "Dec 20, 2025")
 */
export const formatDate = (isoDate) => {
  if (!isoDate) return '—';
  
  // Parse the date as UTC to avoid timezone shift
  const [year, month, day] = isoDate.split('T')[0].split('-');
  const utcDate = new Date(`${year}-${month}-${day}T00:00:00Z`);
  
  return utcDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Alternative: Use the raw ISO date without conversion for input fields
 * @param {string} isoDate - ISO date string
 * @returns {string} Date in YYYY-MM-DD format (suitable for input fields)
 */
export const getISODateOnly = (isoDate) => {
  if (!isoDate) return '';
  return isoDate.split('T')[0]; // Extract just the YYYY-MM-DD part
};