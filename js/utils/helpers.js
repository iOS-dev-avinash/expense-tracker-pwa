/**
 * helpers.js
 * General utility functions
 */

import { TRANSACTION_TYPES } from './constants.js';

/**
 * Generate a unique ID
 * @returns {string}
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Deep clone an object
 * @param {any} obj
 * @returns {any}
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce a function
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle a function
 * @param {Function} fn
 * @param {number} limit
 * @returns {Function}
 */
export function throttle(fn, limit = 100) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Group array items by a key function
 * @param {Array} arr
 * @param {Function} keyFn
 * @returns {Object}
 */
export function groupBy(arr, keyFn) {
  return arr.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

/**
 * Sort array by a key
 * @param {Array} arr
 * @param {string|Function} key
 * @param {'asc'|'desc'} direction
 * @returns {Array}
 */
export function sortBy(arr, key, direction = 'desc') {
  return [...arr].sort((a, b) => {
    const aVal = typeof key === 'function' ? key(a) : a[key];
    const bVal = typeof key === 'function' ? key(b) : b[key];
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Sum array of numbers or objects by key
 * @param {Array} arr
 * @param {string|null} key
 * @returns {number}
 */
export function sum(arr, key = null) {
  return arr.reduce((acc, item) => acc + (key ? (item[key] || 0) : item), 0);
}

/**
 * Clamp a number between min and max
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Get date range for a filter ID
 * @param {string} filterId
 * @returns {{ start: Date, end: Date }}
 */
export function getDateRange(filterId) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  switch (filterId) {
    case 'today':
      return { start: today, end: tomorrow };

    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      return { start: yesterday, end: today };
    }

    case 'this_week': {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return { start: startOfWeek, end: tomorrow };
    }

    case 'this_month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { start: startOfMonth, end: endOfMonth };
    }

    case 'last_month': {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: startOfLastMonth, end: endOfLastMonth };
    }

    case 'last_3_months': {
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return { start: threeMonthsAgo, end: tomorrow };
    }

    case 'this_year': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return { start: startOfYear, end: tomorrow };
    }

    default:
      return { start: new Date(0), end: tomorrow };
  }
}

/**
 * Check if a date is within a range
 * @param {Date|string} date
 * @param {Date} start
 * @param {Date} end
 * @returns {boolean}
 */
export function isDateInRange(date, start, end) {
  const d = new Date(date);
  return d >= start && d < end;
}

/**
 * Get days in a month
 * @param {number} year
 * @param {number} month (0-indexed)
 * @returns {number}
 */
export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Filter and sort transactions
 * @param {Array} transactions
 * @param {Object} filters
 * @returns {Array}
 */
export function filterTransactions(transactions, filters = {}) {
  let result = [...transactions];

  if (filters.type && filters.type !== 'all') {
    result = result.filter(t => t.type === filters.type);
  }

  if (filters.category) {
    result = result.filter(t => t.categoryId === filters.category);
  }

  if (filters.paymentMethod) {
    result = result.filter(t => t.paymentMethod === filters.paymentMethod);
  }

  if (filters.dateFilter && filters.dateFilter !== 'all') {
    if (filters.dateFilter === 'custom' && filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      end.setDate(end.getDate() + 1);
      result = result.filter(t => isDateInRange(t.date, start, end));
    } else {
      const { start, end } = getDateRange(filters.dateFilter);
      result = result.filter(t => isDateInRange(t.date, start, end));
    }
  }

  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    result = result.filter(t =>
      (t.notes || '').toLowerCase().includes(q) ||
      (t.categoryName || '').toLowerCase().includes(q) ||
      (t.subcategory || '').toLowerCase().includes(q) ||
      (t.paymentMethod || '').toLowerCase().includes(q) ||
      String(t.amount).includes(q)
    );
  }

  // Sort
  const sort = filters.sort || 'date_desc';
  switch (sort) {
    case 'date_asc':
      result.sort((a, b) => new Date(a.date) - new Date(b.date));
      break;
    case 'amount_desc':
      result.sort((a, b) => b.amount - a.amount);
      break;
    case 'amount_asc':
      result.sort((a, b) => a.amount - b.amount);
      break;
    default: // date_desc
      result.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  return result;
}

/**
 * Calculate totals from transactions
 * @param {Array} transactions
 * @returns {{ income: number, expense: number, balance: number }}
 */
export function calculateTotals(transactions) {
  const income  = sum(transactions.filter(t => t.type === TRANSACTION_TYPES.INCOME), 'amount');
  const expense = sum(transactions.filter(t => t.type === TRANSACTION_TYPES.EXPENSE), 'amount');
  return { income, expense, balance: income - expense };
}

/**
 * Group transactions by category and sum amounts
 * @param {Array} transactions
 * @returns {Array<{ categoryId, categoryName, icon, color, total }>}
 */
export function groupByCategory(transactions) {
  const map = {};
  for (const t of transactions) {
    if (!map[t.categoryId]) {
      map[t.categoryId] = {
        categoryId: t.categoryId,
        categoryName: t.categoryName || t.categoryId,
        icon: t.categoryIcon || '📦',
        color: t.categoryColor || '#64748b',
        total: 0,
        count: 0,
      };
    }
    map[t.categoryId].total += t.amount;
    map[t.categoryId].count += 1;
  }
  return Object.values(map).sort((a, b) => b.total - a.total);
}

/**
 * Create a ripple effect on a button
 * @param {MouseEvent} e
 */
export function createRipple(e) {
  const btn = e.currentTarget;
  const circle = document.createElement('span');
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  circle.style.width  = circle.style.height = `${size}px`;
  circle.style.left   = `${e.clientX - rect.left - size / 2}px`;
  circle.style.top    = `${e.clientY - rect.top - size / 2}px`;
  circle.classList.add('ripple-effect');

  let container = btn.querySelector('.ripple-container');
  if (!container) {
    container = document.createElement('span');
    container.classList.add('ripple-container');
    btn.appendChild(container);
  }
  container.appendChild(circle);
  circle.addEventListener('animationend', () => circle.remove());
}

/**
 * Add ripple to all .btn elements in a container
 * @param {HTMLElement} root
 */
export function addRippleListeners(root = document) {
  root.querySelectorAll('.btn:not([data-ripple])').forEach(btn => {
    btn.setAttribute('data-ripple', '1');
    btn.addEventListener('click', createRipple);
  });
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Check if the app is installed as PWA
 * @returns {boolean}
 */
export function isPWAInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
}

/**
 * Download a file. On iOS (where blob download doesn't work),
 * opens the content in a new tab so the user can Share/Save it.
 * @param {string} content
 * @param {string} filename
 * @param {string} type
 */
export function downloadFile(content, filename, type = 'application/json') {
  const blob = new Blob([content], { type });

  // iOS detection — blob downloads don't work on iOS Safari/Chrome
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  if (isIOS) {
    // Open in new tab — user can tap Share → Save to Files
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      // Popup blocked — fallback: show content in current tab
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };
      reader.readAsDataURL(blob);
    }
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return;
  }

  // Desktop / Android Chrome — standard anchor download
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Read a file as text
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Safe JSON parse
 * @param {string} str
 * @param {any} fallback
 * @returns {any}
 */
export function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * Wait for a given number of milliseconds
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check online status
 * @returns {boolean}
 */
export function isOnline() {
  return navigator.onLine;
}
