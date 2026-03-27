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
  
  const utcDate = new Date(date);
  
  // Get the UTC time in milliseconds
  const utcTime = utcDate.getTime();
  
  // Get the local timezone offset in milliseconds
  const localOffset = utcDate.getTimezoneOffset() * 60 * 1000;
  
  // Convert UTC to IST by adding 5.5 hours (IST offset)
  const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
  
  // Calculate IST time
  const istTime = new Date(utcTime + localOffset + istOffset);
  
  return istTime;
};

/**
 * Formats a date to IST time string
 * @param {Date|string} date - The date to format
 * @param {string} format - Optional format string (default: 'hh:mm a')
 * @returns {string} - Formatted time string in IST
 */
export const formatIST = (date, formatStr = 'hh:mm a') => {
  const istDate = toIST(date);
  if (!istDate) return '-';
  
  // Use date-fns formatting if available, otherwise use native formatting
  try {
    const { format } = require('date-fns');
    return format(istDate, formatStr);
  } catch (e) {
    // Fallback to native formatting
    if (formatStr === 'hh:mm a') {
      let hours = istDate.getHours();
      const minutes = istDate.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // hour '0' should be '12'
      const minutesStr = minutes < 10 ? '0' + minutes : minutes;
      return `${hours}:${minutesStr} ${ampm}`;
    }
    return istDate.toLocaleString();
  }
};

/**
 * Formats a date to IST date string (for display)
 * @param {Date|string} date - The date to format
 * @returns {string} - Formatted date string in IST
 */
export const formatDateIST = (date) => {
  const istDate = toIST(date);
  if (!istDate) return '-';
  
  try {
    const { format } = require('date-fns');
    return format(istDate, 'dd MMM yyyy');
  } catch (e) {
    return istDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
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
