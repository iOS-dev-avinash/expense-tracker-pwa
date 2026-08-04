/**
 * repositories.js
 * Data access layer - CRUD operations for each store.
 *
 * IMPORTANT: All `operation` callbacks passed to withTransaction MUST be
 * synchronous. Do NOT use async/await inside them. Instead, return the
 * IDBRequest directly. The transaction completes via tx.oncomplete in database.js.
 */

import { withTransaction, idbRequest, cursorAll, getDatabase } from './database.js';

/* ============================================================
   HELPERS
   ============================================================ */

/**
 * Directly clears an IDB object store without going through withTransaction.
 * Most reliable approach for clear() operations on iOS Safari.
 * @param {string} storeName
 * @returns {Promise<void>}
 */
function clearStore(storeName) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    const tx = db.transaction([storeName], 'readwrite');
    const req = tx.objectStore(storeName).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error('clearStore aborted: ' + storeName));
    req.onerror = () => reject(req.error);
  });
}

/* ============================================================
   TRANSACTION REPOSITORY
   ============================================================ */
export const TransactionRepository = {
  /** Get all transactions */
  getAll() {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['transactions'], 'readonly');
      const req = tx.objectStore('transactions').getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
  },

  /** Get transaction by ID */
  getById(id) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['transactions'], 'readonly');
      const req = tx.objectStore('transactions').get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
  },

  /** Add a new transaction */
  add(transaction) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['transactions'], 'readwrite');
      const req = tx.objectStore('transactions').add(transaction);
      tx.oncomplete = () => resolve(transaction);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('add transaction aborted'));
      req.onerror = () => reject(req.error);
    });
  },

  /** Update an existing transaction */
  update(transaction) {
    transaction.updatedAt = new Date().toISOString();
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['transactions'], 'readwrite');
      const req = tx.objectStore('transactions').put(transaction);
      tx.oncomplete = () => resolve(transaction);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('update transaction aborted'));
      req.onerror = () => reject(req.error);
    });
  },

  /** Delete a transaction by ID */
  delete(id) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['transactions'], 'readwrite');
      const req = tx.objectStore('transactions').delete(id);
      tx.oncomplete = () => resolve(id);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('delete transaction aborted'));
      req.onerror = () => reject(req.error);
    });
  },

  /** Get transactions by date range (ISOString dates) */
  getByDateRange(startISO, endISO) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['transactions'], 'readonly');
      const store = tx.objectStore('transactions');
      const index = store.index('date');
      const range = IDBKeyRange.bound(startISO, endISO, false, false);
      const req = index.getAll(range);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
  },

  /** Get transactions by type */
  getByType(type) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['transactions'], 'readonly');
      const req = tx.objectStore('transactions').index('type').getAll(type);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
  },

  /** Get transactions by category */
  getByCategory(categoryId) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['transactions'], 'readonly');
      const req = tx.objectStore('transactions').index('categoryId').getAll(categoryId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
  },

  /** Get transactions for current month */
  getThisMonth() {
    const now = new Date();
    const startISO = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endISO   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    return this.getByDateRange(startISO, endISO);
  },

  /** Get transactions for today */
  getToday() {
    const todayISO = new Date().toISOString().split('T')[0];
    return this.getByDateRange(todayISO, todayISO);
  },

  /** Bulk insert transactions (for import) */
  bulkAdd(transactionList) {
    return new Promise((resolve, reject) => {
      if (!transactionList.length) return resolve(0);
      const db = getDatabase();
      const tx = db.transaction(['transactions'], 'readwrite');
      const store = tx.objectStore('transactions');
      transactionList.forEach(t => store.put(t));
      tx.oncomplete = () => resolve(transactionList.length);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('bulkAdd transactions aborted'));
    });
  },

  /** Clear ALL transactions */
  clearAll() {
    return clearStore('transactions');
  },
};

/* ============================================================
   CATEGORY REPOSITORY
   ============================================================ */
export const CategoryRepository = {
  getAll() {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['categories'], 'readonly');
      const req = tx.objectStore('categories').getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
  },

  getById(id) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['categories'], 'readonly');
      const req = tx.objectStore('categories').get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
  },

  add(category) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['categories'], 'readwrite');
      const req = tx.objectStore('categories').add(category);
      tx.oncomplete = () => resolve(category);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('add category aborted'));
      req.onerror = () => reject(req.error);
    });
  },

  update(category) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['categories'], 'readwrite');
      const req = tx.objectStore('categories').put(category);
      tx.oncomplete = () => resolve(category);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('update category aborted'));
      req.onerror = () => reject(req.error);
    });
  },

  delete(id) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['categories'], 'readwrite');
      const req = tx.objectStore('categories').delete(id);
      tx.oncomplete = () => resolve(id);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('delete category aborted'));
      req.onerror = () => reject(req.error);
    });
  },

  getByType(type) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['categories'], 'readonly');
      const req = tx.objectStore('categories').index('type').getAll(type);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
  },

  bulkAdd(categoryList) {
    return new Promise((resolve, reject) => {
      if (!categoryList.length) return resolve(0);
      const db = getDatabase();
      const tx = db.transaction(['categories'], 'readwrite');
      const store = tx.objectStore('categories');
      categoryList.forEach(c => store.put(c));
      tx.oncomplete = () => resolve(categoryList.length);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('bulkAdd categories aborted'));
    });
  },

  clearAll() {
    return clearStore('categories');
  },

  count() {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['categories'], 'readonly');
      const req = tx.objectStore('categories').count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
  },
};

/* ============================================================
   SETTINGS REPOSITORY
   ============================================================ */
export const SettingsRepository = {
  get(key) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['settings'], 'readonly');
      const req = tx.objectStore('settings').get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
  },

  set(key, value) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['settings'], 'readwrite');
      const req = tx.objectStore('settings').put({ key, value, updatedAt: new Date().toISOString() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('settings set aborted'));
      req.onerror = () => reject(req.error);
    });
  },

  getAll() {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['settings'], 'readonly');
      const req = tx.objectStore('settings').getAll();
      req.onsuccess = () => {
        const result = {};
        for (const r of req.result) result[r.key] = r.value;
        resolve(result);
      };
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
  },

  setMany(obj) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['settings'], 'readwrite');
      const store = tx.objectStore('settings');
      Object.entries(obj).forEach(([key, value]) =>
        store.put({ key, value, updatedAt: new Date().toISOString() })
      );
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('setMany settings aborted'));
    });
  },

  clearAll() {
    return clearStore('settings');
  },
};

/* ============================================================
   BUDGET REPOSITORY
   ============================================================ */
export const BudgetRepository = {
  getAll() {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['budgets'], 'readonly');
      const req = tx.objectStore('budgets').getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
  },

  getById(id) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['budgets'], 'readonly');
      const req = tx.objectStore('budgets').get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
  },

  add(budget) {
    if (!budget.id) budget.id = `budget-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['budgets'], 'readwrite');
      const req = tx.objectStore('budgets').add(budget);
      tx.oncomplete = () => resolve(budget);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('add budget aborted'));
      req.onerror = () => reject(req.error);
    });
  },

  update(budget) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['budgets'], 'readwrite');
      const req = tx.objectStore('budgets').put(budget);
      tx.oncomplete = () => resolve(budget);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('update budget aborted'));
      req.onerror = () => reject(req.error);
    });
  },

  delete(id) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['budgets'], 'readwrite');
      const req = tx.objectStore('budgets').delete(id);
      tx.oncomplete = () => resolve(id);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('delete budget aborted'));
      req.onerror = () => reject(req.error);
    });
  },

  getByMonth(month) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['budgets'], 'readonly');
      const req = tx.objectStore('budgets').index('month').getAll(month);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
  },

  clearAll() {
    return clearStore('budgets');
  },
};

/* ============================================================
   RECURRING REPOSITORY
   ============================================================ */
export const RecurringRepository = {
  getAll() {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['recurring'], 'readonly');
      const req = tx.objectStore('recurring').getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
  },

  getById(id) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['recurring'], 'readonly');
      const req = tx.objectStore('recurring').get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
  },

  add(rec) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['recurring'], 'readwrite');
      const req = tx.objectStore('recurring').add(rec);
      tx.oncomplete = () => resolve(rec);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('add recurring aborted'));
      req.onerror = () => reject(req.error);
    });
  },

  update(rec) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['recurring'], 'readwrite');
      const req = tx.objectStore('recurring').put(rec);
      tx.oncomplete = () => resolve(rec);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('update recurring aborted'));
      req.onerror = () => reject(req.error);
    });
  },

  delete(id) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const tx = db.transaction(['recurring'], 'readwrite');
      const req = tx.objectStore('recurring').delete(id);
      tx.oncomplete = () => resolve(id);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('delete recurring aborted'));
      req.onerror = () => reject(req.error);
    });
  },

  clearAll() {
    return clearStore('recurring');
  },
};
