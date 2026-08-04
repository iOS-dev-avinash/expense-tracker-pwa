/**
 * settingsService.js
 * Application settings management
 */

import { SettingsRepository } from '../db/repositories.js';
import { TransactionRepository, CategoryRepository, BudgetRepository, RecurringRepository } from '../db/repositories.js';
import { CategoryService } from './categoryService.js';
import { lsSet, lsClear } from '../utils/storage.js';
import { deleteDatabase, getDatabase } from '../db/database.js';

const DEFAULTS = {
  theme:    'system',
  currency: 'INR',
  locale:   'en-IN',
  name:     '',
  budgetAlerts: true,
  recurringAlerts: true,
};

export const SettingsService = {
  /** Load all settings */
  async getAll() {
    const stored = await SettingsRepository.getAll();
    return { ...DEFAULTS, ...stored };
  },

  /** Get a specific setting */
  async get(key) {
    const val = await SettingsRepository.get(key);
    return val !== null ? val : DEFAULTS[key] ?? null;
  },

  /** Save a setting */
  async set(key, value) {
    await SettingsRepository.set(key, value);
  },

  /** Save multiple settings */
  async setMany(obj) {
    await SettingsRepository.setMany(obj);
  },

  /** Apply theme to DOM */
  applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme'); // system
    }
  },

  /** Export the entire database as JSON */
  async exportFullBackup() {
    const [transactions, categories, settings, budgets, recurring] = await Promise.all([
      TransactionRepository.getAll(),
      CategoryRepository.getAll(),
      SettingsRepository.getAll(),
      BudgetRepository.getAll(),
      RecurringRepository.getAll(),
    ]);

    return {
      version:    '1.0.0',
      exportedAt: new Date().toISOString(),
      transactions,
      categories,
      settings,
      budgets,
      recurring,
    };
  },

  /** Import from a full backup */
  async importFullBackup(data, mode = 'merge') {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid backup format');
    }

    // Run clear operations sequentially to avoid IDB contention on iOS
    if (mode === 'replace') {
      await TransactionRepository.clearAll();
      await CategoryRepository.clearAll();
      await SettingsRepository.clearAll();
      await BudgetRepository.clearAll();
      await RecurringRepository.clearAll();
    }

    // Import each store sequentially
    if (Array.isArray(data.transactions) && data.transactions.length) {
      await TransactionRepository.bulkAdd(data.transactions);
    }
    if (Array.isArray(data.categories) && data.categories.length) {
      await CategoryRepository.bulkAdd(data.categories);
    }
    if (data.settings && typeof data.settings === 'object') {
      await SettingsRepository.setMany(data.settings);
    }
    if (Array.isArray(data.budgets) && data.budgets.length) {
      await BudgetRepository.bulkAdd(data.budgets);
    }
    if (Array.isArray(data.recurring) && data.recurring.length) {
      await RecurringRepository.bulkAdd(data.recurring);
    }

    // Ensure default categories exist after import
    await CategoryService.initDefaults();
  },

  /** Reset entire app — deletes the entire IndexedDB database and all caches */
  async resetApp() {
    // Unregister SW and clear all caches first
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map(k => caches.delete(k)));
    }
    lsClear();
    // Delete the entire database — properly waits for onsuccess now
    await deleteDatabase();
  },

  /** Delete ALL transactions only — clears the transactions store directly */
  async deleteAllTransactions() {
    // Use a clean, direct IDB transaction — no async/await inside.
    // Queuing .clear() synchronously and resolving on tx.oncomplete
    // is the only reliable way on iOS WebKit / Chrome.
    await new Promise((resolve, reject) => {
      try {
        const db = getDatabase();
        const tx = db.transaction(['transactions'], 'readwrite');
        tx.objectStore('transactions').clear(); // synchronous — no await
        tx.oncomplete = () => resolve();
        tx.onerror   = () => reject(tx.error);
        tx.onabort   = () => reject(new Error('Clear transactions aborted'));
      } catch (err) {
        reject(err);
      }
    });
  },
};
