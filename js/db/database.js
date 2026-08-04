/**
 * database.js
 * IndexedDB initialization and low-level access
 */

import { DB_NAME, DB_VERSION } from '../utils/constants.js';
export { DB_NAME };

let _db = null;

/**
 * Open (or create) the IndexedDB database
 * @returns {Promise<IDBDatabase>}
 */
export function openDatabase() {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // ---- transactions store ----
      if (!db.objectStoreNames.contains('transactions')) {
        const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
        txStore.createIndex('date',          'date',          { unique: false });
        txStore.createIndex('categoryId',    'categoryId',    { unique: false });
        txStore.createIndex('type',          'type',          { unique: false });
        txStore.createIndex('paymentMethod', 'paymentMethod', { unique: false });
        txStore.createIndex('createdAt',     'createdAt',     { unique: false });
      }

      // ---- categories store ----
      if (!db.objectStoreNames.contains('categories')) {
        const catStore = db.createObjectStore('categories', { keyPath: 'id' });
        catStore.createIndex('name', 'name', { unique: false });
        catStore.createIndex('type', 'type', { unique: false });
      }

      // ---- settings store ----
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // ---- budgets store ----
      if (!db.objectStoreNames.contains('budgets')) {
        const budgetStore = db.createObjectStore('budgets', { keyPath: 'id' });
        budgetStore.createIndex('categoryId', 'categoryId', { unique: false });
        budgetStore.createIndex('month', 'month', { unique: false });
      }

      // ---- recurring store ----
      if (!db.objectStoreNames.contains('recurring')) {
        const recStore = db.createObjectStore('recurring', { keyPath: 'id' });
        recStore.createIndex('nextDue', 'nextDue', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      _db = event.target.result;

      _db.onversionchange = () => {
        _db.close();
        _db = null;
        window.location.reload();
      };

      resolve(_db);
    };

    request.onerror = (event) => {
      reject(new Error(`IndexedDB open failed: ${event.target.error?.message}`));
    };

    request.onblocked = () => {
      console.warn('IndexedDB open blocked – please close other tabs.');
    };
  });
}

/**
 * Get the cached DB instance
 * @returns {IDBDatabase}
 */
export function getDatabase() {
  if (!_db) throw new Error('Database not initialized. Call openDatabase() first.');
  return _db;
}

/**
 * Execute a transaction on one or more stores
 * @param {string|string[]} storeNames
 * @param {'readonly'|'readwrite'} mode
 * @param {Function} operation  - receives stores object, returns Promise
 * @returns {Promise<any>}
 */
/**
 * Execute a transaction on one or more stores.
 * NOTE: We do NOT use async/await inside the IDB transaction because browsers
 * (especially Safari/iOS) auto-commit a transaction when no pending requests
 * remain — mixing await with IDB requests causes the transaction to commit
 * before the request actually fires. Instead, we queue all IDB requests
 * synchronously and only resolve once the transaction itself completes.
 *
 * @param {string|string[]} storeNames
 * @param {'readonly'|'readwrite'} mode
 * @param {Function} operation - receives stores object SYNCHRONOUSLY, returns IDBRequest
 * @returns {Promise<any>}
 */
export function withTransaction(storeNames, mode, operation) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    const names = Array.isArray(storeNames) ? storeNames : [storeNames];

    let tx;
    try {
      tx = db.transaction(names, mode);
    } catch (err) {
      return reject(err);
    }

    const stores = {};
    names.forEach(n => (stores[n] = tx.objectStore(n)));

    let result;
    try {
      // operation must be synchronous — it queues IDB requests, doesn't await them
      result = operation(stores);
    } catch (err) {
      return reject(err);
    }

    // If operation returned an IDBRequest, resolve its value on success
    if (result && typeof result.onsuccess !== 'undefined') {
      result.onsuccess = () => { result = result.result; };
      result.onerror = () => reject(result.error);
    }

    tx.oncomplete = () => resolve(result && result.result !== undefined ? result.result : result);
    tx.onerror    = () => reject(tx.error);
    tx.onabort    = () => reject(new Error('Transaction aborted'));
  });
}


/**
 * Promisify an IDBRequest
 * @param {IDBRequest} request
 * @returns {Promise<any>}
 */
export function idbRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror   = () => reject(request.error);
  });
}

/**
 * Get all items from a store using cursor
 * @param {IDBObjectStore} store
 * @param {IDBKeyRange|null} range
 * @param {string|null} indexName
 * @returns {Promise<Array>}
 */
export function cursorAll(store, range = null, indexName = null) {
  return new Promise((resolve, reject) => {
    const source = indexName ? store.index(indexName) : store;
    const request = source.openCursor(range);
    const results = [];

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete the entire database (for reset)
 * @returns {Promise<void>}
 */
export function deleteDatabase() {
  return new Promise((resolve, reject) => {
    if (_db) {
      _db.close();
      _db = null;
    }

    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror   = () => reject(request.error);
    request.onblocked = () => {
      console.warn('Database deletion blocked');
      resolve();
    };
  });
}
