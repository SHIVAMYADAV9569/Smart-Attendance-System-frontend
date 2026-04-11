/**
 * Timezone Utility Functions
 * Handles IST (Indian Standard Time) conversions for the attendance system
 */

/**
 * Converts UTC date to IST formatted string
 * @param {Date|string} date - The date to convert (UTC or ISO string)
 * @param {string} formatStr - Format: 'time' or 'datetime'
 * @returns {string} - Formatted time string in IST
 */
export const formatIST = (date, formatStr = 'time') => {
  if (!date) return '-';
  
  try {
    const dateObj = new Date(date);
    
    if (formatStr === 'time' || formatStr === 'hh:mm a') {
      return dateObj.toLocaleTimeString("en-IN", {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: "Asia/Kolkata"
      });
    }
    
    return dateObj.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata"
    });
  } catch (e) {
    return '-';
  }
};

/**
 * Formats a date to IST date string (for display)
 * @param {Date|string} date - The date to format
 * @returns {string} - Formatted date string in IST
 */
export const formatDateIST = (date) => {
  if (!date) return '-';
  
  try {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return '-';
  }
};
