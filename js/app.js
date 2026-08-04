/**
 * app.js
 * Application entry point & setup
 */

import { openDatabase } from './db/database.js';
import { CategoryService } from './services/categoryService.js';
import { SettingsService } from './services/settingsService.js';
import { seedSampleData } from './seed.js';
import { Router } from './router.js';

import { renderNavbar, setActiveNavItem } from './components/navbar.js';
import { initFAB } from './components/fab.js';

import { renderDashboard, refreshDashboard } from './ui/dashboard.js';
import { renderTransactions, openTransactionModal, openEditTransaction, refreshTransactions } from './ui/transactions.js';
import { renderCategories, refreshCategories } from './ui/categories.js';
import { renderReports, refreshReports } from './ui/reports.js';
import { renderSettings } from './ui/settings.js';

import { ROUTES } from './utils/constants.js';
import { isOnline } from './utils/helpers.js';
import { Toast } from './components/toast.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. Initialize IndexedDB
    await openDatabase();

    // 2. Initialize default categories
    await CategoryService.initDefaults();

    // 3. Seed sample data if empty
    await seedSampleData();

    // 4. Load & apply theme
    const theme = await SettingsService.get('theme');
    SettingsService.applyTheme(theme);

    // 5. Render Navigation & FAB
    renderNavbar((routeId) => router.navigate(routeId));
    window.__setActiveNavItem = setActiveNavItem;

    initFAB((type) => {
      openTransactionModal(type);
    });

    // 6. Expose global modal opener helpers for cross-view navigation
    window.__openTransactionModal = (id) => openEditTransaction(id);
    window.__refreshDashboard = () => refreshDashboard();

    // 7. Setup Router
    const router = new Router({
      [ROUTES.DASHBOARD]: async () => {
        setActiveNavItem(ROUTES.DASHBOARD);
        await renderDashboard();
      },
      [ROUTES.TRANSACTIONS]: async () => {
        setActiveNavItem(ROUTES.TRANSACTIONS);
        await renderTransactions();
      },
      [ROUTES.CATEGORIES]: async () => {
        setActiveNavItem(ROUTES.CATEGORIES);
        await renderCategories();
      },
      [ROUTES.REPORTS]: async () => {
        setActiveNavItem(ROUTES.REPORTS);
        await renderReports();
      },
      [ROUTES.SETTINGS]: async () => {
        setActiveNavItem(ROUTES.SETTINGS);
        await renderSettings();
      },
    });

    window.__router = router;
    router.init();

    // 8. Register Service Worker
    registerServiceWorker();

    // 9. Offline Status Listener
    setupOfflineListener();

    // 10. FAB hide-on-scroll
    setupFabScrollBehavior();

    // 11. Dismiss Loading Screen
    hideLoadingScreen();

  } catch (err) {
    console.error('Initialization error:', err);
    hideLoadingScreen();
    showErrorScreen(err.message);
  }
});

function hideLoadingScreen() {
  const loading = document.getElementById('loading-screen');
  if (loading) {
    loading.classList.add('fade-out');
    setTimeout(() => loading.remove(), 400);
  }
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('SW registered:', reg.scope))
        .catch(err => console.warn('SW registration failed:', err));
    });
  }
}

function setupOfflineListener() {
  const banner = document.getElementById('offline-banner');

  const updateStatus = () => {
    if (!isOnline()) {
      banner?.classList.add('show');
    } else {
      banner?.classList.remove('show');
    }
  };

  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
  updateStatus();
}

function showErrorScreen(message) {
  const screen = document.getElementById('error-screen');
  const msgEl  = document.getElementById('error-message');
  if (screen) {
    screen.style.display = 'flex';
    if (msgEl && message) msgEl.textContent = message;
  }
}

function setupFabScrollBehavior() {
  const fab = document.getElementById('fab');
  const fabMenu = document.getElementById('fab-menu');
  const main = document.getElementById('main-content');
  if (!fab || !main) return;

  let lastScroll = 0;
  main.addEventListener('scroll', () => {
    const curr = main.scrollTop;
    if (curr > lastScroll + 10) {
      // Scrolling down — hide FAB
      fab.style.transform = 'scale(0)';
      fab.style.opacity = '0';
      if (fabMenu) { fabMenu.classList.remove('open'); fab.classList.remove('open'); }
    } else if (curr < lastScroll - 10) {
      // Scrolling up — show FAB
      fab.style.transform = '';
      fab.style.opacity = '';
    }
    lastScroll = Math.max(curr, 0);
  }, { passive: true });
}
