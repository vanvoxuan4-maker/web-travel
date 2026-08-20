/**
 * Utility functions for formatting currency, debouncing, and XSS sanitization
 */

/**
 * Format raw number to Vietnamese Dong (VND) string
 * @param {number} amount 
 * @returns {string} e.g. "4.500.000 ₫"
 */
export function formatCurrencyVND(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

/**
 * Debounce function to limit rapid execution (e.g. search inputs - Security Rule 7 & Performance Rule 9)
 * @param {Function} func 
 * @param {number} wait 
 * @returns {Function}
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Escape HTML special characters to prevent XSS attacks (Security Rule 7)
 * @param {string} str 
 * @returns {string}
 */
export function escapeHTML(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
