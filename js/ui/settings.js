/**
 * settings.js
 * Settings UI, import/export, data management, themes, and budgets
 */

import { SettingsService } from '../services/settingsService.js';
import { BudgetRepository } from '../db/repositories.js';
import { CategoryService } from '../services/categoryService.js';
import { showModal, showConfirm, showPrompt } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { APP_VERSION } from '../utils/constants.js';
import { downloadFile, readFileAsText, escapeHtml, addRippleListeners } from '../utils/helpers.js';
import { formatCurrency } from '../utils/formatter.js';

export async function renderSettings() {
  const container = document.getElementById('page-settings');
  if (!container) return;

  const settings = await SettingsService.getAll();

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Settings</h1>
        <div class="page-subtitle">App preferences & data management</div>
      </div>
    </div>

    <div style="padding:var(--space-4)">
      <!-- User Profile -->
      <div class="card" style="margin-bottom:var(--space-4);padding:var(--space-4)">
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <div style="width:48px;height:48px;border-radius:50%;background:var(--gradient-accent);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:1.2rem">
            ${(settings.name || 'U')[0].toUpperCase()}
          </div>
          <div style="flex:1">
            <div style="font-weight:700;font-size:1rem" id="settings-user-name">${escapeHtml(settings.name || 'Expense Tracker User')}</div>
            <div style="font-size:0.75rem;color:var(--text-secondary)">Local Profile</div>
          </div>
          <button class="btn btn-ghost btn-sm" id="btn-edit-name">Edit</button>
        </div>
      </div>

      <!-- Theme & Preferences -->
      <div class="settings-section-label">Preferences</div>
      <div class="settings-list" style="margin-bottom:var(--space-4)">
        <div class="settings-item" id="item-theme">
          <div class="settings-item-icon" style="background:rgba(139,92,246,0.1);color:#8b5cf6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </div>
          <div class="settings-item-content">
            <div class="settings-item-title">App Theme</div>
            <div class="settings-item-sub" id="theme-sub-text">${settings.theme || 'System'}</div>
          </div>
          <div class="settings-item-right">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>

        <div class="settings-item" id="item-budget">
          <div class="settings-item-icon" style="background:rgba(34,197,94,0.1);color:#22c55e">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div class="settings-item-content">
            <div class="settings-item-title">Monthly Budgets</div>
            <div class="settings-item-sub">Set spending limits for categories</div>
          </div>
          <div class="settings-item-right">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>

      <!-- Backup & Restore -->
      <div class="settings-section-label">Data & Backup</div>
      <div class="settings-list" style="margin-bottom:var(--space-4)">
        <div class="settings-item" id="item-export">
          <div class="settings-item-icon" style="background:rgba(59,130,246,0.1);color:#3b82f6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </div>
          <div class="settings-item-content">
            <div class="settings-item-title">Export Backup</div>
            <div class="settings-item-sub">Download JSON backup of all data</div>
          </div>
          <div class="settings-item-right">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>

        <div class="settings-item" id="item-import">
          <div class="settings-item-icon" style="background:rgba(245,158,11,0.1);color:#f59e0b">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </div>
          <div class="settings-item-content">
            <div class="settings-item-title">Import Data</div>
            <div class="settings-item-sub">Restore or merge from JSON backup</div>
          </div>
          <div class="settings-item-right">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>

        <div class="settings-item" id="item-clear-tx">
          <div class="settings-item-icon" style="background:rgba(239,68,68,0.1);color:#ef4444">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </div>
          <div class="settings-item-content">
            <div class="settings-item-title" style="color:var(--red-500)">Delete All Transactions</div>
            <div class="settings-item-sub">Remove transactions but keep categories</div>
          </div>
        </div>

        <div class="settings-item" id="item-reset-app">
          <div class="settings-item-icon" style="background:rgba(239,68,68,0.15);color:#ef4444">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><polyline points="3 3 3 8 8 8"/></svg>
          </div>
          <div class="settings-item-content">
            <div class="settings-item-title" style="color:var(--red-500)">Reset App</div>
            <div class="settings-item-sub">Erase everything and return to defaults</div>
          </div>
        </div>
      </div>

      <!-- About -->
      <div class="settings-section-label">About</div>
      <div class="settings-list" style="margin-bottom:var(--space-4)">
        <div class="settings-item" style="cursor:default">
          <div class="settings-item-icon" style="background:var(--accent-100);color:var(--accent-600)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          </div>
          <div class="settings-item-content">
            <div class="settings-item-title">Expense Tracker PWA</div>
            <div class="settings-item-sub">Version ${APP_VERSION} · 100% Offline & Local</div>
          </div>
        </div>
      </div>
    </div>

    <input type="file" id="file-import-input" accept=".json" style="display:none" />
    <div style="height:var(--space-16)"></div>
  `;

  setupSettingsEvents(container, settings);
}

function setupSettingsEvents(container, settings) {
  addRippleListeners(container);

  // Edit Name
  container.querySelector('#btn-edit-name')?.addEventListener('click', async () => {
    const name = await showPrompt({ title: 'Edit Name', placeholder: 'Enter your name', defaultValue: settings.name || '', label: 'Your Name' });
    if (name !== null) {
      await SettingsService.set('name', name);
      Toast.success('Name updated');
      renderSettings();
    }
  });

  // Theme Switch
  container.querySelector('#item-theme')?.addEventListener('click', () => {
    const content = `
      <div class="chip-group" style="flex-direction:column;gap:var(--space-2)">
        <button class="chip ${settings.theme === 'system' || !settings.theme ? 'selected' : ''}" data-theme-val="system" style="justify-content:flex-start">📱 System Default</button>
        <button class="chip ${settings.theme === 'light' ? 'selected' : ''}" data-theme-val="light" style="justify-content:flex-start">☀️ Light Theme</button>
        <button class="chip ${settings.theme === 'dark' ? 'selected' : ''}" data-theme-val="dark" style="justify-content:flex-start">🌙 Dark Theme</button>
      </div>
    `;
    const { el, close } = showModal({ title: 'App Theme', content, variant: 'bottom' });

    el.querySelectorAll('[data-theme-val]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const val = btn.dataset.themeVal;
        await SettingsService.set('theme', val);
        SettingsService.applyTheme(val);
        Toast.success(`Theme set to ${val}`);
        close();
        renderSettings();
      });
    });
  });

  // Budget Management
  container.querySelector('#item-budget')?.addEventListener('click', () => openBudgetModal());

  // Export
  container.querySelector('#item-export')?.addEventListener('click', async () => {
    try {
      const backup = await SettingsService.exportFullBackup();
      downloadFile(JSON.stringify(backup, null, 2), `expense-tracker-backup-${Date.now()}.json`);
      Toast.success('Backup downloaded');
    } catch (err) {
      Toast.error('Export failed: ' + err.message);
    }
  });

  // Import
  const fileInput = container.querySelector('#file-import-input');
  container.querySelector('#item-import')?.addEventListener('click', () => fileInput?.click());

  fileInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await readFileAsText(file);
      const data = JSON.parse(text);

      const content = `
        <p style="font-size:0.9rem;margin-bottom:var(--space-4)">How would you like to import this backup file?</p>
        <div style="display:flex;flex-direction:column;gap:var(--space-2)">
          <button class="btn btn-primary" id="import-merge">Merge with existing data</button>
          <button class="btn btn-danger" id="import-replace">Replace existing data</button>
        </div>
      `;

      const { el, close } = showModal({ title: 'Import Data', content, variant: 'center' });

      el.querySelector('#import-merge')?.addEventListener('click', async () => {
        await SettingsService.importFullBackup(data, 'merge');
        Toast.success('Data merged successfully');
        close();
        window.location.reload();
      });

      el.querySelector('#import-replace')?.addEventListener('click', async () => {
        await SettingsService.importFullBackup(data, 'replace');
        Toast.success('Data replaced successfully');
        close();
        window.location.reload();
      });
    } catch (err) {
      Toast.error('Invalid backup file');
    }
    fileInput.value = '';
  });

  // Clear transactions
  container.querySelector('#item-clear-tx')?.addEventListener('click', async () => {
    const ok = await showConfirm({
      title: 'Delete All Transactions',
      message: 'Are you sure? This will delete all transaction records permanently.',
      confirmLabel: 'Delete All',
      dangerous: true,
    });
    if (ok) {
      await SettingsService.deleteAllTransactions();
      Toast.success('All transactions deleted');
      window.__refreshDashboard?.();
    }
  });

  // Reset app
  container.querySelector('#item-reset-app')?.addEventListener('click', async () => {
    const ok = await showConfirm({
      title: 'Reset Entire App',
      message: 'This will wipe ALL transactions, custom categories, budgets, and settings. This cannot be undone!',
      confirmLabel: 'Reset Everything',
      dangerous: true,
    });
    if (ok) {
      await SettingsService.resetApp();
      Toast.success('App reset to factory state');
      setTimeout(() => window.location.reload(), 1000);
    }
  });
}

async function openBudgetModal() {
  const categories = await CategoryService.getExpenseCategories();
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const existingBudgets = await BudgetRepository.getByMonth(monthKey);

  const budgetMap = {};
  existingBudgets.forEach(b => budgetMap[b.categoryId] = b.amount);

  const content = `
    <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:var(--space-4)">
      Set monthly spending limits for categories in <strong>${now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</strong>.
    </p>

    <div style="max-height:60vh;overflow-y:auto">
      ${categories.map(c => `
        <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-3)">
          <div class="category-icon" style="background:${c.color}20;font-size:1.2rem;width:36px;height:36px">
            ${c.icon}
          </div>
          <div style="flex:1;font-weight:600;font-size:0.875rem">${escapeHtml(c.name)}</div>
          <input type="number" class="form-control" style="width:110px;min-height:36px;font-size:0.875rem"
            data-budget-cat="${c.id}" placeholder="No limit" value="${budgetMap[c.id] || ''}" min="0" step="100" />
        </div>
      `).join('')}
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary" id="budget-cancel">Cancel</button>
    <button class="btn btn-primary" id="budget-save">Save Budgets</button>
  `;

  const { el, close } = showModal({ title: 'Set Category Budgets', content, footer, variant: 'bottom' });

  el.querySelector('#budget-cancel')?.addEventListener('click', () => close());

  el.querySelector('#budget-save')?.addEventListener('click', async () => {
    const inputs = el.querySelectorAll('[data-budget-cat]');
    for (const input of inputs) {
      const catId = input.dataset.budgetCat;
      const val = parseFloat(input.value);

      const existing = existingBudgets.find(b => b.categoryId === catId);
      if (!isNaN(val) && val > 0) {
        if (existing) {
          existing.amount = val;
          await BudgetRepository.update(existing);
        } else {
          await BudgetRepository.add({ categoryId: catId, month: monthKey, amount: val });
        }
      } else if (existing) {
        await BudgetRepository.delete(existing.id);
      }
    }

    Toast.success('Budgets saved');
    close();
    window.__refreshDashboard?.();
  });
}
