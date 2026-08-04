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
