/**
 * formatter.js
 * Date, currency, and number formatting utilities
 */

import { CURRENCY_SYMBOL } from './constants.js';

/** Get locale from settings or use default */
let _locale = 'en-IN';

export function setLocale(locale) {
  _locale = locale;
}

/**
 * Format a number as currency
 * @param {number} amount
 * @param {{ showSymbol?: boolean, compact?: boolean }} opts
 * @returns {string}
 */
export function formatCurrency(amount, opts = {}) {
  const { showSymbol = true, compact = false } = opts;
  const num = Number(amount) || 0;

  if (compact && Math.abs(num) >= 1_00_000) {
    const lakhs = num / 1_00_000;
    return `${showSymbol ? CURRENCY_SYMBOL : ''}${lakhs.toFixed(1)}L`;
  }

  if (compact && Math.abs(num) >= 1_000) {
    const k = num / 1_000;
    return `${showSymbol ? CURRENCY_SYMBOL : ''}${k.toFixed(1)}K`;
  }

  const formatted = new Intl.NumberFormat(_locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(num));

  return `${showSymbol ? CURRENCY_SYMBOL : ''}${formatted}`;
}

/**
 * Format amount with sign
 * @param {number} amount
 * @param {'income'|'expense'} type
 * @returns {string}
 */
export function formatAmountWithSign(amount, type) {
  const sign = type === 'income' ? '+' : '-';
  return `${sign}${formatCurrency(amount)}`;
}

/**
 * Format a date
 * @param {Date|string} date
 * @param {'short'|'medium'|'long'|'time'|'month'|'day'} format
 * @returns {string}
 */
export function formatDate(date, format = 'medium') {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';

  switch (format) {
    case 'short':
      return d.toLocaleDateString(_locale, { day: '2-digit', month: 'short' });

    case 'medium':
      return d.toLocaleDateString(_locale, { day: '2-digit', month: 'short', year: 'numeric' });

    case 'long':
      return d.toLocaleDateString(_locale, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

    case 'time':
      return d.toLocaleTimeString(_locale, { hour: '2-digit', minute: '2-digit' });

    case 'datetime':
      return d.toLocaleString(_locale, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    case 'month':
      return d.toLocaleDateString(_locale, { month: 'long', year: 'numeric' });

    case 'day':
      return d.toLocaleDateString(_locale, { weekday: 'short', day: '2-digit', month: 'short' });

    case 'iso':
      return d.toISOString().split('T')[0];

    case 'month-short':
      return d.toLocaleDateString(_locale, { month: 'short' });

    default:
      return d.toLocaleDateString(_locale);
  }
}

/**
 * Get a relative time string (e.g. "Today", "Yesterday", "2 days ago")
 * @param {Date|string} date
 * @returns {string}
 */
export function formatRelativeDate(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';

  const now  = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffMs = today - target;
  const diffDays = Math.round(diffMs / 86_400_000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)  return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${diffDays >= 14 ? 's' : ''} ago`;
  return formatDate(date, 'short');
}

/**
 * Format a number as percentage
 * @param {number} value
 * @param {number} total
 * @param {number} decimals
 * @returns {string}
 */
export function formatPercentage(value, total, decimals = 1) {
  if (!total || total === 0) return '0%';
  return `${((value / total) * 100).toFixed(decimals)}%`;
}

/**
 * Parse an amount string to number
 * @param {string} str
 * @returns {number}
 */
export function parseAmount(str) {
  const cleaned = String(str).replace(/[^\d.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 * @returns {string}
 */
export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get current month boundaries
 * @returns {{ start: string, end: string }}
 */
export function currentMonthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  return { start, end };
}

/**
 * Format bytes to human-readable size
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1_048_576)   return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

/**
 * Get month name
 * @param {number} monthIndex (0-11)
 * @param {'short'|'long'} style
 * @returns {string}
 */
export function getMonthName(monthIndex, style = 'short') {
  return new Date(2000, monthIndex, 1).toLocaleDateString(_locale, { month: style });
}

/**
 * Get last N months as labels
 * @param {number} n
 * @returns {string[]}
 */
export function getLastNMonthLabels(n = 6) {
  const result = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(d.toLocaleDateString(_locale, { month: 'short', year: '2-digit' }));
  }
  return result;
}

/**
 * Get last N months as { year, month } objects
 * @param {number} n
 * @returns {Array<{ year: number, month: number, label: string }>}
 */
export function getLastNMonths(n = 6) {
  const result = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString(_locale, { month: 'short', year: '2-digit' }),
    });
  }
  return result;
}
