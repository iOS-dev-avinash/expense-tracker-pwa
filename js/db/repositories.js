/**
 * repositories.js
 * Data access layer - CRUD operations for each store
 */

import { withTransaction, idbRequest, cursorAll } from './database.js';

/* ============================================================
   TRANSACTION REPOSITORY
   ============================================================ */
export const TransactionRepository = {
  /** Get all transactions */
  async getAll() {
    return withTransaction('transactions', 'readonly', async ({ transactions }) => {
      return idbRequest(transactions.getAll());
    });
  },

  /** Get transaction by ID */
  async getById(id) {
    return withTransaction('transactions', 'readonly', async ({ transactions }) => {
      return idbRequest(transactions.get(id));
    });
  },

  /** Add a new transaction */
  async add(transaction) {
    return withTransaction('transactions', 'readwrite', async ({ transactions }) => {
      await idbRequest(transactions.add(transaction));
      return transaction;
    });
  },

  /** Update an existing transaction */
  async update(transaction) {
    return withTransaction('transactions', 'readwrite', async ({ transactions }) => {
      transaction.updatedAt = new Date().toISOString();
      await idbRequest(transactions.put(transaction));
      return transaction;
    });
  },

  /** Delete a transaction by ID */
  async delete(id) {
    return withTransaction('transactions', 'readwrite', async ({ transactions }) => {
      await idbRequest(transactions.delete(id));
      return id;
    });
  },

  /** Get transactions by date range (ISOString dates) */
  async getByDateRange(startISO, endISO) {
    return withTransaction('transactions', 'readonly', async ({ transactions }) => {
      const index = transactions.index('date');
      const range = IDBKeyRange.bound(startISO, endISO, false, false);
      return cursorAll(transactions, range, 'date');
    });
  },

  /** Get transactions by type */
  async getByType(type) {
    return withTransaction('transactions', 'readonly', async ({ transactions }) => {
      const index = transactions.index('type');
      return idbRequest(index.getAll(type));
    });
  },

  /** Get transactions by category */
  async getByCategory(categoryId) {
    return withTransaction('transactions', 'readonly', async ({ transactions }) => {
      const index = transactions.index('categoryId');
      return idbRequest(index.getAll(categoryId));
    });
  },

  /** Get transactions for current month */
  async getThisMonth() {
    const now = new Date();
    const startISO = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endISO   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    return this.getByDateRange(startISO, endISO);
  },

  /** Get transactions for today */
  async getToday() {
    const todayISO = new Date().toISOString().split('T')[0];
    return this.getByDateRange(todayISO, todayISO);
  },

  /** Bulk insert transactions (for import) */
  async bulkAdd(transactionList) {
    return withTransaction('transactions', 'readwrite', async ({ transactions }) => {
      for (const tx of transactionList) {
        await idbRequest(transactions.put(tx));
      }
      return transactionList.length;
    });
  },

  /** Clear all transactions */
  async clearAll() {
    return withTransaction('transactions', 'readwrite', async ({ transactions }) => {
      await idbRequest(transactions.clear());
    });
  },
};

/* ============================================================
   CATEGORY REPOSITORY
   ============================================================ */
export const CategoryRepository = {
  /** Get all categories */
  async getAll() {
    return withTransaction('categories', 'readonly', async ({ categories }) => {
      return idbRequest(categories.getAll());
    });
  },

  /** Get category by ID */
  async getById(id) {
    return withTransaction('categories', 'readonly', async ({ categories }) => {
      return idbRequest(categories.get(id));
    });
  },

  /** Add a new category */
  async add(category) {
    return withTransaction('categories', 'readwrite', async ({ categories }) => {
      await idbRequest(categories.add(category));
      return category;
    });
  },

  /** Update a category */
  async update(category) {
    return withTransaction('categories', 'readwrite', async ({ categories }) => {
      await idbRequest(categories.put(category));
      return category;
    });
  },

  /** Delete a category */
  async delete(id) {
    return withTransaction('categories', 'readwrite', async ({ categories }) => {
      await idbRequest(categories.delete(id));
      return id;
    });
  },

  /** Get categories by type */
  async getByType(type) {
    return withTransaction('categories', 'readonly', async ({ categories }) => {
      const index = categories.index('type');
      return idbRequest(index.getAll(type));
    });
  },

  /** Bulk insert (for import / seeding) */
  async bulkAdd(categoryList) {
    return withTransaction('categories', 'readwrite', async ({ categories }) => {
      for (const cat of categoryList) {
        await idbRequest(categories.put(cat));
      }
      return categoryList.length;
    });
  },

  /** Clear all categories */
  async clearAll() {
    return withTransaction('categories', 'readwrite', async ({ categories }) => {
      await idbRequest(categories.clear());
    });
  },

  /** Count categories */
  async count() {
    return withTransaction('categories', 'readonly', async ({ categories }) => {
      return idbRequest(categories.count());
    });
  },
};

/* ============================================================
   SETTINGS REPOSITORY
   ============================================================ */
export const SettingsRepository = {
  /** Get a single setting by key */
  async get(key) {
    return withTransaction('settings', 'readonly', async ({ settings }) => {
      const record = await idbRequest(settings.get(key));
      return record ? record.value : null;
    });
  },

  /** Set a setting */
  async set(key, value) {
    return withTransaction('settings', 'readwrite', async ({ settings }) => {
      await idbRequest(settings.put({ key, value, updatedAt: new Date().toISOString() }));
    });
  },

  /** Get all settings as object */
  async getAll() {
    return withTransaction('settings', 'readonly', async ({ settings }) => {
      const records = await idbRequest(settings.getAll());
      const result = {};
      for (const r of records) result[r.key] = r.value;
      return result;
    });
  },

  /** Set many settings at once */
  async setMany(obj) {
    return withTransaction('settings', 'readwrite', async ({ settings }) => {
      for (const [key, value] of Object.entries(obj)) {
        await idbRequest(settings.put({ key, value, updatedAt: new Date().toISOString() }));
      }
    });
  },

  /** Clear all settings */
  async clearAll() {
    return withTransaction('settings', 'readwrite', async ({ settings }) => {
      await idbRequest(settings.clear());
    });
  },
};

/* ============================================================
   BUDGET REPOSITORY
   ============================================================ */
export const BudgetRepository = {
  async getAll() {
    return withTransaction('budgets', 'readonly', async ({ budgets }) => {
      return idbRequest(budgets.getAll());
    });
  },

  async getById(id) {
    return withTransaction('budgets', 'readonly', async ({ budgets }) => {
      return idbRequest(budgets.get(id));
    });
  },

  async add(budget) {
    return withTransaction('budgets', 'readwrite', async ({ budgets }) => {
      await idbRequest(budgets.add(budget));
      return budget;
    });
  },

  async update(budget) {
    return withTransaction('budgets', 'readwrite', async ({ budgets }) => {
      await idbRequest(budgets.put(budget));
      return budget;
    });
  },

  async delete(id) {
    return withTransaction('budgets', 'readwrite', async ({ budgets }) => {
      await idbRequest(budgets.delete(id));
      return id;
    });
  },

  async getByMonth(month) {
    return withTransaction('budgets', 'readonly', async ({ budgets }) => {
      const index = budgets.index('month');
      return idbRequest(index.getAll(month));
    });
  },

  async clearAll() {
    return withTransaction('budgets', 'readwrite', async ({ budgets }) => {
      await idbRequest(budgets.clear());
    });
  },
};

/* ============================================================
   RECURRING REPOSITORY
   ============================================================ */
export const RecurringRepository = {
  async getAll() {
    return withTransaction('recurring', 'readonly', async ({ recurring }) => {
      return idbRequest(recurring.getAll());
    });
  },

  async getById(id) {
    return withTransaction('recurring', 'readonly', async ({ recurring }) => {
      return idbRequest(recurring.get(id));
    });
  },

  async add(rec) {
    return withTransaction('recurring', 'readwrite', async ({ recurring }) => {
      await idbRequest(recurring.add(rec));
      return rec;
    });
  },

  async update(rec) {
    return withTransaction('recurring', 'readwrite', async ({ recurring }) => {
      await idbRequest(recurring.put(rec));
      return rec;
    });
  },

  async delete(id) {
    return withTransaction('recurring', 'readwrite', async ({ recurring }) => {
      await idbRequest(recurring.delete(id));
      return id;
    });
  },

  async clearAll() {
    return withTransaction('recurring', 'readwrite', async ({ recurring }) => {
      await idbRequest(recurring.clear());
    });
  },
};
