/**
 * models.js
 * Data models / schema definitions for the app
 */

import { generateId } from '../utils/helpers.js';
import { todayISO }   from '../utils/formatter.js';
import { TRANSACTION_TYPES } from '../utils/constants.js';

/**
 * Create a new Transaction object
 * @param {Partial<Transaction>} data
 * @returns {Transaction}
 */
export function createTransaction(data = {}) {
  return {
    id:            data.id            || generateId(),
    type:          data.type          || TRANSACTION_TYPES.EXPENSE,
    amount:        Number(data.amount) || 0,
    categoryId:    data.categoryId    || 'miscellaneous',
    categoryName:  data.categoryName  || 'Miscellaneous',
    categoryIcon:  data.categoryIcon  || '📦',
    categoryColor: data.categoryColor || '#64748b',
    subcategory:   data.subcategory   || '',
    paymentMethod: data.paymentMethod || 'cash',
    date:          data.date          || todayISO(),
    notes:         data.notes         || '',
    isRecurring:   data.isRecurring   || false,
    recurringId:   data.recurringId   || null,
    createdAt:     data.createdAt     || new Date().toISOString(),
    updatedAt:     data.updatedAt     || new Date().toISOString(),
  };
}

/**
 * Create a new Category object
 * @param {Partial<Category>} data
 * @returns {Category}
 */
export function createCategory(data = {}) {
  return {
    id:            data.id            || generateId(),
    name:          data.name          || 'New Category',
    icon:          data.icon          || '📦',
    color:         data.color         || '#64748b',
    type:          data.type          || TRANSACTION_TYPES.EXPENSE,
    subcategories: data.subcategories || [],
    isDefault:     data.isDefault     || false,
    createdAt:     data.createdAt     || new Date().toISOString(),
  };
}

/**
 * Create a new Budget object
 * @param {Partial<Budget>} data
 * @returns {Budget}
 */
export function createBudget(data = {}) {
  const now = new Date();
  return {
    id:         data.id         || generateId(),
    categoryId: data.categoryId || null,
    month:      data.month      || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    amount:     Number(data.amount) || 0,
    createdAt:  data.createdAt  || new Date().toISOString(),
  };
}

/**
 * Create a new Recurring Transaction template
 * @param {Partial<RecurringTransaction>} data
 * @returns {RecurringTransaction}
 */
export function createRecurring(data = {}) {
  return {
    id:            data.id            || generateId(),
    title:         data.title         || '',
    type:          data.type          || TRANSACTION_TYPES.EXPENSE,
    amount:        Number(data.amount) || 0,
    categoryId:    data.categoryId    || 'miscellaneous',
    categoryName:  data.categoryName  || 'Miscellaneous',
    categoryIcon:  data.categoryIcon  || '📦',
    categoryColor: data.categoryColor || '#64748b',
    subcategory:   data.subcategory   || '',
    paymentMethod: data.paymentMethod || 'auto_debit',
    frequency:     data.frequency     || 'monthly',
    startDate:     data.startDate     || todayISO(),
    nextDue:       data.nextDue       || todayISO(),
    notes:         data.notes         || '',
    isActive:      data.isActive      !== undefined ? data.isActive : true,
    createdAt:     data.createdAt     || new Date().toISOString(),
  };
}

/**
 * Create a Settings entry
 * @param {string} key
 * @param {any} value
 * @returns {{ key: string, value: any }}
 */
export function createSetting(key, value) {
  return { key, value, updatedAt: new Date().toISOString() };
}

/**
 * Validate a transaction object
 * @param {Object} data
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateTransaction(data) {
  const errors = [];

  if (!data.amount || Number(data.amount) <= 0) {
    errors.push('Amount must be greater than 0');
  }

  if (!data.type || !Object.values(TRANSACTION_TYPES).includes(data.type)) {
    errors.push('Invalid transaction type');
  }

  if (!data.categoryId) {
    errors.push('Category is required');
  }

  if (!data.date) {
    errors.push('Date is required');
  } else {
    const d = new Date(data.date);
    if (isNaN(d.getTime())) errors.push('Invalid date');
  }

  if (!data.paymentMethod) {
    errors.push('Payment method is required');
  }

  if (data.amount && Number(data.amount) > 10_00_00_000) {
    errors.push('Amount is unrealistically large');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a category object
 * @param {Object} data
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateCategory(data) {
  const errors = [];

  if (!data.name || data.name.trim().length < 1) {
    errors.push('Category name is required');
  }

  if (data.name && data.name.trim().length > 50) {
    errors.push('Category name too long (max 50 chars)');
  }

  return { valid: errors.length === 0, errors };
}
