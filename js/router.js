/**
 * router.js
 * Hash-based SPA Router
 */

import { ROUTES } from './utils/constants.js';

export class Router {
  constructor(routes = {}) {
    this.routes = routes;
    this.currentRoute = null;

    window.addEventListener('hashchange', () => this.handleRoute());
  }

  init() {
    this.handleRoute();
  }

  navigate(routeId) {
    window.location.hash = `#${routeId}`;
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || ROUTES.DASHBOARD;
    const route = this.routes[hash] ? hash : ROUTES.DASHBOARD;

    if (this.currentRoute === route) return;
    this.currentRoute = route;

    // Toggle active pages
    document.querySelectorAll('.page').forEach(page => {
      const pageId = page.id.replace('page-', '');
      if (pageId === route) {
        page.classList.add('active', 'page-enter');
      } else {
        page.classList.remove('active', 'page-enter');
      }
    });

    // Update bottom nav
    const navModule = window.__setActiveNavItem;
    if (navModule) navModule(route);

    // Invoke page callback
    if (this.routes[route]) {
      this.routes[route]();
    }

    // Scroll to top
    window.scrollTo(0, 0);
  }
}
