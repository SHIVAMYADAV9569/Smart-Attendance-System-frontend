/**
 * Timezone Utility Functions
 * Handles IST (Indian Standard Time) conversions for the attendance system
 */

/**
 * Converts a UTC date to IST (Indian Standard Time)
 * IST is UTC+5:30
 * @param {Date|string} date - The date to convert (UTC or ISO string)
 * @returns {Date} - Date object representing IST time
 */
export const toIST = (date) => {
  if (!date) return null;
  return new Date(date); // simple rakho
};

/**
 * Formats a date to IST time string
 * @param {Date|string} date - The date to format
 * @param {string} format - Optional format string (default: 'hh:mm a')
 * @returns {string} - Formatted time string in IST
 */

/**
 * Formats a date to IST date string (for display)
 * @param {Date|string} date - The date to format
 * @returns {string} - Formatted date string in IST
 */
export const formatIST = (date) => {
  if (!date) return '-';

  return new Date(date).toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};



/**
 * Gets the start of day in IST
 * @param {Date} date - The date
 * @returns {Date} - Start of day in IST (00:00:00 IST)
 */
export const startOfDayIST = (date) => {
  const istDate = toIST(date);
  const startOfDay = new Date(istDate);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
};

/**
 * Gets the end of day in IST
 * @param {Date} date - The date
 * @returns {Date} - End of day in IST (23:59:59 IST)
 */
export const endOfDayIST = (date) => {
  const istDate = toIST(date);
  const endOfDay = new Date(istDate);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
};

/**
 * Converts IST date range to UTC for API queries
 * @param {string} startDate - Start date in IST
 * @param {string} endDate - End date in IST
 * @returns {object} - Object with UTC dates for querying
 */
export const convertISTDateRangeToUTC = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return { startDate: null, endDate: null };
  }
  
  // Parse the IST dates
  const startIST = new Date(startDate);
  const endIST = new Date(endDate);
  
  // Set to start and end of day in IST
  startIST.setHours(0, 0, 0, 0);
  endIST.setHours(23, 59, 59, 999);
  
  // Convert to UTC by subtracting 5.5 hours
  const istOffset = 5.5 * 60 * 60 * 1000;
  const startUTC = new Date(startIST.getTime() - istOffset);
  const endUTC = new Date(endIST.getTime() - istOffset);
  
  return {
    startDate: startUTC.toISOString(),
    endDate: endUTC.toISOString()
  };
};
