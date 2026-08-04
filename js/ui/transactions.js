/**
 * transactions.js
 * Transaction list, search, filter, CRUD operations
 */

import { TransactionService }  from '../services/transactionService.js';
import { CategoryService }     from '../services/categoryService.js';
import { showModal, showConfirm } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { renderTransactionItem, renderDateDivider, renderEmptyState, renderSkeletonTransactions } from '../components/cards.js';
import { formatCurrency, formatDate, todayISO } from '../utils/formatter.js';
import { PAYMENT_METHODS, TRANSACTION_TYPES, DATE_FILTERS, SORT_OPTIONS } from '../utils/constants.js';
import { debounce, groupBy, filterTransactions, escapeHtml, addRippleListeners } from '../utils/helpers.js';

let _filters = {
  type: 'all',
  dateFilter: 'this_month',
  sort: 'date_desc',
  search: '',
  category: '',
  paymentMethod: '',
};

let _allTransactions = [];
let _lastDeleted = null;

/** Render the transactions page */
export async function renderTransactions() {
  const container = document.getElementById('page-transactions');
  if (!container) return;

  container.innerHTML = getTransactionsHTML();
  setupTransactionEvents();

  await loadTransactions();
}

function getTransactionsHTML() {
  return `
    <!-- Page Header -->
    <div class="page-header" id="tx-header">
      <div>
        <h1 class="page-title">Transactions</h1>
        <div class="page-subtitle" id="tx-count-label">Loading...</div>
      </div>
      <div class="header-actions">
        <button class="btn-icon" id="tx-filter-btn" aria-label="Filter transactions">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
        </button>
        <button class="btn-icon" id="tx-sort-btn" aria-label="Sort transactions">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="16" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
        </button>
      </div>
    </div>

    <!-- Search Bar -->
    <div style="padding:var(--space-3) var(--space-4)">
      <div class="search-bar">
        <div class="search-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <input type="search" id="tx-search" placeholder="Search transactions..." aria-label="Search transactions" autocomplete="off" />
        <button class="search-clear" id="tx-search-clear" aria-label="Clear search">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>

    <!-- Type Filter Chips -->
    <div class="filter-scroll" id="tx-type-chips">
      <button class="filter-chip active" data-type="all" id="type-all">All</button>
      <button class="filter-chip" data-type="expense" id="type-expense">Expense</button>
      <button class="filter-chip" data-type="income" id="type-income">Income</button>
    </div>

    <!-- Date Filter Chips -->
    <div class="filter-scroll" id="tx-date-chips" style="padding-top:0">
      ${DATE_FILTERS.filter(f => f.id !== 'custom').map(f => `
        <button class="filter-chip ${f.id === _filters.dateFilter ? 'active' : ''}" data-date="${f.id}" id="date-${f.id}">${f.label}</button>
      `).join('')}
      <button class="filter-chip" data-date="custom" id="date-custom">Custom</button>
    </div>

    <!-- Custom date range (hidden by default) -->
    <div id="tx-custom-range" style="display:none;padding:0 var(--space-4) var(--space-3);display:none">
      <div style="display:flex;gap:var(--space-3)">
        <div class="form-group" style="flex:1;margin-bottom:0">
          <label class="form-label" for="tx-date-from">From</label>
          <input type="date" class="form-control" id="tx-date-from" />
        </div>
        <div class="form-group" style="flex:1;margin-bottom:0">
          <label class="form-label" for="tx-date-to">To</label>
          <input type="date" class="form-control" id="tx-date-to" />
        </div>
      </div>
    </div>

    <!-- Transaction List -->
    <div id="tx-list" style="padding:0 var(--space-4) var(--space-4)">
      <div style="background:var(--bg-card);border-radius:var(--border-radius-lg);overflow:hidden;box-shadow:var(--shadow-sm);border:1px solid var(--border-color)">
        ${renderSkeletonTransactions(7)}
      </div>
    </div>

    <!-- Bottom padding -->
    <div style="height:var(--space-16)"></div>
  `;
}

async function loadTransactions() {
  const listEl = document.getElementById('tx-list');
  const countLabel = document.getElementById('tx-count-label');

  try {
    _allTransactions = await TransactionService.getAll();
    renderTransactionList();
  } catch (err) {
    console.error('Load transactions error:', err);
    if (listEl) listEl.innerHTML = renderEmptyState({ title: 'Error loading', message: err.message });
  }
}

function renderTransactionList() {
  const listEl = document.getElementById('tx-list');
  const countLabel = document.getElementById('tx-count-label');
  if (!listEl) return;

  const filtered = filterTransactions(_allTransactions, {
    ..._filters,
    startDate: document.getElementById('tx-date-from')?.value,
    endDate:   document.getElementById('tx-date-to')?.value,
  });

  if (countLabel) {
    countLabel.textContent = `${filtered.length} transaction${filtered.length !== 1 ? 's' : ''}`;
  }

  if (!filtered.length) {
    listEl.innerHTML = `
      <div style="background:var(--bg-card);border-radius:var(--border-radius-lg);box-shadow:var(--shadow-sm);border:1px solid var(--border-color)">
        ${renderEmptyState({
          title: 'No transactions found',
          message: _filters.search ? 'Try adjusting your search or filters' : 'Add your first transaction using the + button',
        })}
      </div>
    `;
    return;
  }

  // Group by date
  const grouped = groupBy(filtered, t => t.date);
  const sortedDates = Object.keys(grouped).sort((a, b) => {
    return _filters.sort === 'date_asc'
      ? new Date(a) - new Date(b)
      : new Date(b) - new Date(a);
  });

  let html = '';
  for (const date of sortedDates) {
    const txsForDate = grouped[date];
    const dayExpense = txsForDate.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const dayIncome  = txsForDate.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

    html += renderDateDivider(date, dayIncome, dayExpense);
    html += `<div class="transaction-group">`;
    html += txsForDate.map(tx => renderTransactionItem(tx)).join('');
    html += `</div>`;
  }

  listEl.innerHTML = html;

  // Event delegation for click
  listEl.querySelectorAll('.transaction-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      if (id) openEditTransaction(id);
    });
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      }
    });
  });
}

function setupTransactionEvents() {
  // Search
  const searchInput = document.getElementById('tx-search');
  const clearBtn = document.getElementById('tx-search-clear');

  searchInput?.addEventListener('input', debounce((e) => {
    _filters.search = e.target.value;
    renderTransactionList();
  }, 250));

  clearBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    _filters.search = '';
    renderTransactionList();
  });

  // Type chips
  document.getElementById('tx-type-chips')?.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-type]');
    if (!chip) return;
    document.querySelectorAll('#tx-type-chips .filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    _filters.type = chip.dataset.type;
    renderTransactionList();
  });

  // Date chips
  document.getElementById('tx-date-chips')?.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-date]');
    if (!chip) return;
    document.querySelectorAll('#tx-date-chips .filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const dateFilter = chip.dataset.date;
    _filters.dateFilter = dateFilter;

    const customRange = document.getElementById('tx-custom-range');
    if (customRange) {
      customRange.style.display = dateFilter === 'custom' ? 'block' : 'none';
    }

    if (dateFilter !== 'custom') renderTransactionList();
  });

  // Custom date range
  document.getElementById('tx-date-from')?.addEventListener('change', () => renderTransactionList());
  document.getElementById('tx-date-to')?.addEventListener('change', () => renderTransactionList());

  // Filter button - opens filter sheet
  document.getElementById('tx-filter-btn')?.addEventListener('click', openFilterSheet);

  // Sort button
  document.getElementById('tx-sort-btn')?.addEventListener('click', openSortSheet);
}

function openFilterSheet() {
  const content = `
    <div class="form-group">
      <label class="form-label">Payment Method</label>
      <select class="form-control" id="filter-payment">
        <option value="">All methods</option>
        ${PAYMENT_METHODS.map(m => `<option value="${m.id}" ${_filters.paymentMethod === m.id ? 'selected' : ''}>${m.label}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Category</label>
      <select class="form-control" id="filter-category">
        <option value="">All categories</option>
      </select>
    </div>
  `;

  const { el, close } = showModal({
    title: 'Filter',
    content,
    footer: `
      <button class="btn btn-secondary" id="filter-reset">Reset</button>
      <button class="btn btn-primary" id="filter-apply">Apply</button>
    `,
    variant: 'bottom',
  });

  // Populate category dropdown
  CategoryService.getAll().then(cats => {
    const sel = el.querySelector('#filter-category');
    if (sel) {
      cats.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = `${cat.icon} ${cat.name}`;
        if (_filters.category === cat.id) opt.selected = true;
        sel.appendChild(opt);
      });
    }
  });

  el.querySelector('#filter-reset')?.addEventListener('click', () => {
    _filters.paymentMethod = '';
    _filters.category = '';
    renderTransactionList();
    close();
  });

  el.querySelector('#filter-apply')?.addEventListener('click', () => {
    _filters.paymentMethod = el.querySelector('#filter-payment')?.value || '';
    _filters.category      = el.querySelector('#filter-category')?.value || '';
    renderTransactionList();
    close();
  });
}

function openSortSheet() {
  const content = `
    <div class="chip-group" style="flex-direction:column;gap:var(--space-2)">
      ${SORT_OPTIONS.map(opt => `
        <button class="chip ${_filters.sort === opt.id ? 'selected' : ''}" data-sort="${opt.id}" style="justify-content:flex-start;border-radius:var(--border-radius)">
          ${_filters.sort === opt.id ? '✓ ' : ''}${opt.label}
        </button>
      `).join('')}
    </div>
  `;

  const { el, close } = showModal({ title: 'Sort By', content, variant: 'bottom' });

  el.querySelectorAll('[data-sort]').forEach(btn => {
    btn.addEventListener('click', () => {
      _filters.sort = btn.dataset.sort;
      renderTransactionList();
      close();
    });
  });
}

/** Open add/edit transaction modal */
export async function openTransactionModal(type = TRANSACTION_TYPES.EXPENSE, existingId = null) {
  let existing = null;
  if (existingId) {
    existing = await TransactionService.getById(existingId);
  }

  const categories = await CategoryService.getAll();
  const defaultType = existing?.type || type;
  const expCats = categories.filter(c => c.type === 'expense' || !c.type);
  const incCats = categories.filter(c => c.type === 'income');

  const formId = `tx-form-${Date.now()}`;

  const content = `
    <form id="${formId}" novalidate>
      <!-- Amount -->
      <div class="form-group">
        <label class="form-label required" for="tx-amount">Amount</label>
        <div class="amount-input-wrapper">
          <span class="amount-currency">₹</span>
          <input
            type="number"
            class="form-control"
            id="tx-amount"
            placeholder="0"
            value="${existing?.amount || ''}"
            min="0.01"
            step="0.01"
            inputmode="decimal"
            autofocus
            onfocus="this.select()"
            autocomplete="off"
            aria-label="Transaction amount"
          />
        </div>
      </div>

      <!-- Type -->
      <div class="form-group">
        <label class="form-label">Type</label>
        <div class="chip-group" id="tx-type-group">
          <button type="button" class="chip expense ${defaultType === 'expense' ? 'selected' : ''}" data-type="expense">
            📉 Expense
          </button>
          <button type="button" class="chip income ${defaultType === 'income' ? 'selected' : ''}" data-type="income">
            📈 Income
          </button>
        </div>
      </div>

      <!-- Category -->
      <div class="form-group">
        <label class="form-label required" for="tx-category">Category</label>
        <select class="form-control" id="tx-category" aria-label="Category">
          <option value="">Select category...</option>
          <optgroup label="Expense" id="cat-expense-group">
            ${expCats.map(c => `<option value="${c.id}" ${existing?.categoryId === c.id ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('')}
          </optgroup>
          <optgroup label="Income" id="cat-income-group">
            ${incCats.map(c => `<option value="${c.id}" ${existing?.categoryId === c.id ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('')}
          </optgroup>
        </select>
      </div>

      <!-- Subcategory -->
      <div class="form-group" id="tx-subcategory-group">
        <label class="form-label" for="tx-subcategory">Sub Category</label>
        <select class="form-control" id="tx-subcategory" aria-label="Sub category">
          <option value="">None</option>
        </select>
      </div>

      <!-- Payment Method -->
      <div class="form-group">
        <label class="form-label required" for="tx-payment">Payment Method</label>
        <select class="form-control" id="tx-payment" aria-label="Payment method">
          ${PAYMENT_METHODS.map(m => `<option value="${m.id}" ${(existing?.paymentMethod || 'cash') === m.id ? 'selected' : ''}>${m.icon} ${m.label}</option>`).join('')}
        </select>
      </div>

      <!-- Date -->
      <div class="form-group">
        <label class="form-label required" for="tx-date">Date</label>
        <input type="date" class="form-control" id="tx-date" value="${existing?.date || todayISO()}" max="${todayISO()}" aria-label="Transaction date" />
      </div>

      <!-- Notes -->
      <div class="form-group">
        <label class="form-label" for="tx-notes">Notes</label>
        <textarea class="form-control" id="tx-notes" rows="2" placeholder="Add a note..." style="resize:none" aria-label="Notes">${existing?.notes || ''}</textarea>
      </div>

      <!-- Recurring -->
      <div class="form-group" style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <div class="form-label">Recurring Transaction</div>
          <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:2px">Repeat this transaction</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="tx-recurring" ${existing?.isRecurring ? 'checked' : ''} />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <div id="tx-error" style="color:var(--red-500);font-size:0.8rem;margin-top:var(--space-2);display:none"></div>
    </form>
  `;

  const isEdit = Boolean(existingId);
  const footer = `
    ${isEdit ? `<button class="btn btn-danger" id="tx-delete-btn" style="flex:0;padding:0 var(--space-4)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>` : ''}
    <button class="btn btn-secondary" id="tx-cancel-btn">Cancel</button>
    <button class="btn btn-primary" id="tx-save-btn">${isEdit ? 'Update' : 'Save'}</button>
  `;

  const { el, close } = showModal({
    title: isEdit ? 'Edit Transaction' : 'Add Transaction',
    content,
    footer,
    variant: 'bottom',
  });

  // Wire up form interactions
  setupTransactionForm(el, existing, categories, defaultType, close, isEdit);
  addRippleListeners(el);
}

function setupTransactionForm(el, existing, categories, defaultType, close, isEdit) {
  let currentType = defaultType;

  // Type toggle
  const typeGroup = el.querySelector('#tx-type-group');
  typeGroup?.querySelectorAll('[data-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      typeGroup.querySelectorAll('[data-type]').forEach(b => {
        b.classList.remove('selected', 'expense', 'income');
        b.classList.add(b.dataset.type);
      });
      btn.classList.add('selected');
      currentType = btn.dataset.type;
      updateCategoryOptions(el, categories, currentType, null);
    });
  });

  // Category change -> update subcategories
  const catSelect = el.querySelector('#tx-category');
  catSelect?.addEventListener('change', () => {
    const cat = categories.find(c => c.id === catSelect.value);
    updateSubcategories(el, cat, existing?.subcategory);
  });

  // Init subcategories
  if (existing) {
    const cat = categories.find(c => c.id === existing.categoryId);
    if (cat) updateSubcategories(el, cat, existing.subcategory);
  }

  // Save
  el.querySelector('#tx-save-btn')?.addEventListener('click', async () => {
    const data = collectFormData(el, currentType);
    if (!data) return;

    const saveBtn = el.querySelector('#tx-save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      if (isEdit && existing) {
        await TransactionService.update(existing.id, data);
        Toast.success('Transaction updated');
      } else {
        await TransactionService.add(data);
        Toast.success('Transaction added');
      }
      close();
      await refreshTransactions();
      window.__refreshDashboard?.();
    } catch (err) {
      showFormError(el, err.message);
      saveBtn.disabled = false;
      saveBtn.textContent = isEdit ? 'Update' : 'Save';
    }
  });

  // Cancel
  el.querySelector('#tx-cancel-btn')?.addEventListener('click', () => close());

  // Delete
  el.querySelector('#tx-delete-btn')?.addEventListener('click', async () => {
    const confirmed = await showConfirm({
      title: 'Delete Transaction',
      message: 'This transaction will be permanently deleted.',
      confirmLabel: 'Delete',
      dangerous: true,
    });

    if (confirmed && existing) {
      _lastDeleted = existing;
      await TransactionService.delete(existing.id);
      close();
      await refreshTransactions();
      window.__refreshDashboard?.();

      Toast.success('Transaction deleted', {
        action: {
          label: 'Undo',
          onClick: async () => {
            if (_lastDeleted) {
              await TransactionService.add(_lastDeleted);
              _lastDeleted = null;
              await refreshTransactions();
              window.__refreshDashboard?.();
              Toast.info('Transaction restored');
            }
          },
        },
      });
    }
  });
}

function updateCategoryOptions(el, categories, type, selectedId) {
  const catSelect = el.querySelector('#tx-category');
  if (!catSelect) return;

  const expCats = categories.filter(c => c.type === 'expense' || !c.type);
  const incCats = categories.filter(c => c.type === 'income');

  catSelect.innerHTML = `
    <option value="">Select category...</option>
    <optgroup label="Expense">
      ${expCats.map(c => `<option value="${c.id}" ${selectedId === c.id ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('')}
    </optgroup>
    <optgroup label="Income">
      ${incCats.map(c => `<option value="${c.id}" ${selectedId === c.id ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('')}
    </optgroup>
  `;
}

function updateSubcategories(el, category, selectedSub = '') {
  const subSelect = el.querySelector('#tx-subcategory');
  if (!subSelect) return;

  subSelect.innerHTML = `<option value="">None</option>`;
  if (category?.subcategories?.length) {
    category.subcategories.forEach(sub => {
      const opt = document.createElement('option');
      opt.value = sub;
      opt.textContent = sub;
      if (sub === selectedSub) opt.selected = true;
      subSelect.appendChild(opt);
    });
  }
}

function collectFormData(el, type) {
  const amount = parseFloat(el.querySelector('#tx-amount')?.value);
  const categoryId = el.querySelector('#tx-category')?.value;
  const subcategory = el.querySelector('#tx-subcategory')?.value;
  const paymentMethod = el.querySelector('#tx-payment')?.value;
  const date = el.querySelector('#tx-date')?.value;
  const notes = el.querySelector('#tx-notes')?.value?.trim();
  const isRecurring = el.querySelector('#tx-recurring')?.checked || false;

  if (!amount || amount <= 0) {
    showFormError(el, 'Please enter a valid amount');
    return null;
  }
  if (!categoryId) {
    showFormError(el, 'Please select a category');
    return null;
  }
  if (!date) {
    showFormError(el, 'Please select a date');
    return null;
  }

  hideFormError(el);
  return { type, amount, categoryId, subcategory, paymentMethod, date, notes, isRecurring };
}

function showFormError(el, message) {
  const errEl = el.querySelector('#tx-error');
  if (errEl) {
    errEl.textContent = message;
    errEl.style.display = 'block';
  }
}

function hideFormError(el) {
  const errEl = el.querySelector('#tx-error');
  if (errEl) errEl.style.display = 'none';
}

/** Refresh the transaction list */
export async function refreshTransactions() {
  _allTransactions = await TransactionService.getAll();
  renderTransactionList();
}

/** Open edit modal (called from external) */
async function openEditTransaction(id) {
  await openTransactionModal(TRANSACTION_TYPES.EXPENSE, id);
}

// Expose for dashboard's "see all" click
export { openEditTransaction };
