/**
 * storage.js
 * localStorage helpers for settings & non-critical state
 */

const PREFIX = 'et_';

/**
 * Get a value from localStorage
 * @param {string} key
 * @param {any} fallback
 * @returns {any}
 */
export function lsGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Set a value in localStorage
 * @param {string} key
 * @param {any} value
 */
export function lsSet(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage write failed:', e);
  }
}

/**
 * Remove a value from localStorage
 * @param {string} key
 */
export function lsRemove(key) {
  localStorage.removeItem(PREFIX + key);
}

/**
 * Clear all app-related localStorage entries
 */
export function lsClear() {
  Object.keys(localStorage)
    .filter(k => k.startsWith(PREFIX))
    .forEach(k => localStorage.removeItem(k));
}

/**
 * Simple reactive store backed by localStorage
 */
export class ReactiveStore {
  #data    = {};
  #listeners = new Map();

  constructor(key, defaults = {}) {
    this.key = key;
    this.#data = { ...defaults, ...lsGet(key, {}) };
  }

  get(prop) {
    return this.#data[prop];
  }

  set(prop, value) {
    this.#data[prop] = value;
    lsSet(this.key, this.#data);
    const cbs = this.#listeners.get(prop) || [];
    cbs.forEach(cb => cb(value));
    const allCbs = this.#listeners.get('*') || [];
    allCbs.forEach(cb => cb(prop, value));
  }

  getAll() {
    return { ...this.#data };
  }

  setMany(updates) {
    Object.assign(this.#data, updates);
    lsSet(this.key, this.#data);
    Object.entries(updates).forEach(([prop, value]) => {
      const cbs = this.#listeners.get(prop) || [];
      cbs.forEach(cb => cb(value));
    });
    const allCbs = this.#listeners.get('*') || [];
    if (allCbs.length) allCbs.forEach(cb => cb('batch', updates));
  }

  subscribe(prop, callback) {
    if (!this.#listeners.has(prop)) this.#listeners.set(prop, []);
    this.#listeners.get(prop).push(callback);
    return () => {
      const cbs = this.#listeners.get(prop) || [];
      const idx = cbs.indexOf(callback);
      if (idx > -1) cbs.splice(idx, 1);
    };
  }

  reset(defaults = {}) {
    this.#data = { ...defaults };
    lsRemove(this.key);
  }
}
