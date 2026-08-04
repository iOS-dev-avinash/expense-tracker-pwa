/**
 * navbar.js
 * Bottom navigation bar
 */

import { ROUTES } from '../utils/constants.js';

const NAV_ITEMS = [
  {
    id:    ROUTES.DASHBOARD,
    label: 'Home',
    icon:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  },
  {
    id:    ROUTES.TRANSACTIONS,
    label: 'Transactions',
    icon:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  },
  {
    id: 'fab-spacer',
    label: '',
    icon: '',
    isSpacer: true,
  },
  {
    id:    ROUTES.CATEGORIES,
    label: 'Categories',
    icon:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  },
  {
    id:    ROUTES.REPORTS,
    label: 'Reports',
    icon:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  },
  {
    id:    ROUTES.SETTINGS,
    label: 'Settings',
    icon:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  },
];

/**
 * Render the bottom navigation
 * @param {Function} onNavigate - callback(routeId)
 */
export function renderNavbar(onNavigate) {
  const nav = document.getElementById('bottom-nav');
  if (!nav) return;

  nav.innerHTML = NAV_ITEMS.map(item => {
    if (item.isSpacer) {
      return `<div class="nav-fab-placeholder" aria-hidden="true"></div>`;
    }
    return `
      <button
        class="nav-item"
        data-route="${item.id}"
        id="nav-${item.id}"
        aria-label="${item.label}"
        role="tab"
        aria-selected="false"
      >
        <div class="nav-icon">${item.icon}</div>
        <span class="nav-label">${item.label}</span>
      </button>
    `;
  }).join('');

  // Attach click handlers
  nav.querySelectorAll('.nav-item[data-route]').forEach(btn => {
    btn.addEventListener('click', () => {
      const route = btn.dataset.route;
      if (onNavigate) onNavigate(route);
    });
  });
}

/**
 * Set the active nav item
 * @param {string} routeId
 */
export function setActiveNavItem(routeId) {
  document.querySelectorAll('.nav-item').forEach(item => {
    const isActive = item.dataset.route === routeId;
    item.classList.toggle('active', isActive);
    item.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}
