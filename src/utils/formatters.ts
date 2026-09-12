/**
 * Utility functions for formatting currency, debouncing, day of week, and XSS sanitization
 */

/**
 * Format raw number to Vietnamese Dong (VND) string
 * @param amount number
 * @returns string e.g. "4.500.000 ₫"
 */
export function formatCurrencyVND(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

/**
 * Debounce function to limit rapid execution (e.g. search inputs - Security Rule 7 & Performance Rule 9)
 */
export function debounce<T extends (...args: unknown[]) => void>(func: T, wait = 300): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return function executedFunction(...args: Parameters<T>) {
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
 */
export function escapeHTML(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Get Vietnamese Day of Week (e.g. 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN')
 * Dynamically calculates from date string (DD/MM/YYYY or YYYY-MM-DD)
 */
export function getDayOfWeekVN(dateStr: string): string {
  if (!dateStr || typeof dateStr !== 'string') return 'T2';
  try {
    let day = 0, month = 0, year = 0;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
      }
    } else if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      }
    }
    if (day && year) {
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        const dayIndex = d.getDay(); // 0 = CN, 1 = T2, 2 = T3, 3 = T4, 4 = T5, 5 = T6, 6 = T7
        const vnDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        return vnDays[dayIndex];
      }
    }
  } catch {
    // fallback
  }
  return 'T2';
}

/**
 * Remove Vietnamese diacritics/accents for robust search matching
 * e.g. "Hạ Long" -> "ha long", "Đà Nẵng" -> "da nang"
 */
export function removeVietnameseTones(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

/**
 * Convert any date string (DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD) into standardized ISO format: YYYY-MM-DD.
 * Ensures PostgreSQL DATE compatibility and prevents out-of-range errors (code 22008).
 */
export function toIsoDate(dateStr: string): string {
  if (!dateStr || typeof dateStr !== 'string') return new Date().toISOString().slice(0, 10);
  const trimmed = dateStr.trim();
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  // DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // DD-MM-YYYY
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('-');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // Fallback parsing
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return trimmed;
}

/**
 * Format any ISO date (YYYY-MM-DD) into user-friendly Vietnamese display: DD/MM/YYYY
 */
export function formatDateVN(dateStr: string): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-');
    return `${d}/${m}/${y}`;
  }
  return trimmed;
}



