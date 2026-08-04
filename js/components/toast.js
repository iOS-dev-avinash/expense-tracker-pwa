/**
 * toast.js
 * Toast notification system
 */

import { TOAST_DURATION } from '../utils/constants.js';

let container = null;

function getContainer() {
  if (!container) {
    container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
  }
  return container;
}

/**
 * Show a toast notification
 * @param {{ title?: string, message: string, type?: 'success'|'error'|'warning'|'info', duration?: number, action?: { label: string, onClick: Function } }} opts
 */
export function showToast({ title, message, type = 'info', duration = TOAST_DURATION, action } = {}) {
  const c = getContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');

  const icons = {
    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };

  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-content">
      ${title ? `<div class="toast-title">${title}</div>` : ''}
      <div class="toast-message">${message}</div>
      ${action ? `<span class="toast-action" id="toast-action-${Date.now()}">${action.label}</span>` : ''}
    </div>
    <button class="toast-close" aria-label="Close">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div class="toast-progress">
      <div class="toast-progress-bar" style="animation-duration: ${duration}ms"></div>
    </div>
  `;

  c.appendChild(toast);

  // Action handler
  if (action) {
    const actionEl = toast.querySelector('.toast-action');
    if (actionEl) {
      actionEl.addEventListener('click', () => {
        action.onClick();
        dismiss(toast);
      });
    }
  }

  // Close button
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => dismiss(toast));

  // Auto dismiss
  const timer = setTimeout(() => dismiss(toast), duration);

  // Pause on hover
  toast.addEventListener('mouseenter', () => {
    clearTimeout(timer);
    const bar = toast.querySelector('.toast-progress-bar');
    if (bar) bar.style.animationPlayState = 'paused';
  });

  toast.addEventListener('mouseleave', () => {
    const bar = toast.querySelector('.toast-progress-bar');
    if (bar) bar.style.animationPlayState = 'running';
    setTimeout(() => dismiss(toast), duration / 3);
  });

  return toast;
}

function dismiss(toast) {
  if (!toast || toast.classList.contains('exit')) return;
  toast.classList.add('exit');
  toast.addEventListener('animationend', () => toast.remove(), { once: true });
  // Fallback removal
  setTimeout(() => toast.remove(), 600);
}

/** Convenience wrappers */
export const Toast = {
  success: (message, opts = {}) => showToast({ ...opts, message, type: 'success' }),
  error:   (message, opts = {}) => showToast({ ...opts, message, type: 'error' }),
  warning: (message, opts = {}) => showToast({ ...opts, message, type: 'warning' }),
  info:    (message, opts = {}) => showToast({ ...opts, message, type: 'info' }),
};
