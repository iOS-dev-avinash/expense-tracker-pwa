/**
 * fab.js
 * Floating Action Button with speed dial
 */

import { TRANSACTION_TYPES } from '../utils/constants.js';

let isOpen = false;
let _onAddTransaction = null;

/** Initialize the FAB */
export function initFAB(onAddTransaction) {
  _onAddTransaction = onAddTransaction;

  const fab     = document.getElementById('fab');
  const fabMenu = document.getElementById('fab-menu');

  if (!fab || !fabMenu) return;

  // Build speed dial
  fabMenu.innerHTML = `
    <div class="fab-option" id="fab-opt-scan">
      <span class="fab-option-label">Scan Receipt</span>
      <button class="fab-option-btn" style="background:#6366f1" aria-label="Scan Receipt">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </button>
      <input type="file" id="fab-scan-input" accept="image/*" capture="environment" style="display:none" />
    </div>
    <div class="fab-option" id="fab-opt-income">
      <span class="fab-option-label">Add Income</span>
      <button class="fab-option-btn income" aria-label="Add Income">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <polyline points="19 12 12 5 5 12"/>
        </svg>
      </button>
    </div>
    <div class="fab-option" id="fab-opt-expense">
      <span class="fab-option-label">Add Expense</span>
      <button class="fab-option-btn expense" aria-label="Add Expense">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <polyline points="19 12 12 19 5 12"/>
        </svg>
      </button>
    </div>
  `;

  fab.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  `;
  fab.setAttribute('aria-label', 'Add transaction');
  fab.setAttribute('aria-expanded', 'false');

  fab.addEventListener('click', () => toggleFAB());

  document.getElementById('fab-opt-expense')?.addEventListener('click', () => {
    closeFAB();
    if (_onAddTransaction) _onAddTransaction(TRANSACTION_TYPES.EXPENSE);
  });

  document.getElementById('fab-opt-income')?.addEventListener('click', () => {
    closeFAB();
    if (_onAddTransaction) _onAddTransaction(TRANSACTION_TYPES.INCOME);
  });

  const scanBtn = document.getElementById('fab-opt-scan');
  const scanInput = document.getElementById('fab-scan-input');
  
  scanBtn?.addEventListener('click', async () => {
    // Check if API key is set first
    const { SettingsService } = await import('../services/settingsService.js');
    const { Toast } = await import('./toast.js');
    const apiKey = await SettingsService.get('geminiApiKey');
    if (!apiKey) {
      Toast.error('Please configure Gemini API Key in Settings first', { duration: 4000 });
      closeFAB();
      setTimeout(() => window.__router?.navigate('settings'), 1000);
      return;
    }
    scanInput?.click();
  });

  scanInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    closeFAB();
    
    try {
      const { OCRService } = await import('../services/ocrService.js');
      const { Toast } = await import('./toast.js');
      Toast.info('Scanning receipt... please wait', { duration: 5000 });
      
      const extractedData = await OCRService.scanReceipt(file);
      if (_onAddTransaction) _onAddTransaction(TRANSACTION_TYPES.EXPENSE, null, extractedData);
      
    } catch (err) {
      const { Toast } = await import('./toast.js');
      Toast.error('Scan failed: ' + err.message, { duration: 5000 });
    }
    
    // Reset input
    scanInput.value = '';
  });

  // Close FAB when clicking outside
  document.addEventListener('click', (e) => {
    if (isOpen && !fab.contains(e.target) && !fabMenu.contains(e.target)) {
      closeFAB();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeFAB();
  });
}

function toggleFAB() {
  if (isOpen) {
    closeFAB();
  } else {
    openFAB();
  }
}

function openFAB() {
  isOpen = true;
  const fab     = document.getElementById('fab');
  const fabMenu = document.getElementById('fab-menu');
  fab?.classList.add('open');
  fabMenu?.classList.add('open');
  fab?.setAttribute('aria-expanded', 'true');
}

export function closeFAB() {
  isOpen = false;
  const fab     = document.getElementById('fab');
  const fabMenu = document.getElementById('fab-menu');
  fab?.classList.remove('open');
  fabMenu?.classList.remove('open');
  fab?.setAttribute('aria-expanded', 'false');
}
