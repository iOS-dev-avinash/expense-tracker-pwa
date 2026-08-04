/**
 * cards.js
 * Reusable card rendering functions
 */

import { formatCurrency, formatAmountWithSign, formatDate, formatRelativeDate } from '../utils/formatter.js';
import { PAYMENT_METHODS } from '../utils/constants.js';
import { escapeHtml } from '../utils/helpers.js';

/**
 * Render a summary card
 * @param {{ label, amount, type, icon, change? }} opts
 * @returns {string} HTML string
 */
export function renderSummaryCard({ label, amount, type, icon, change }) {
  const isNegative = amount < 0;
  const changeHTML = change !== undefined
    ? `<span class="summary-card-change" style="color: ${change >= 0 ? 'var(--accent-500)' : 'var(--red-500)'}">
        ${change >= 0 ? '↑' : '↓'} ${Math.abs(change).toFixed(1)}% vs last month
      </span>`
    : '';

  return `
    <div class="summary-card ${type}" role="article" aria-label="${label}: ${formatCurrency(amount)}">
      <div class="summary-card-icon">${icon}</div>
      <div class="summary-card-label">${escapeHtml(label)}</div>
      <div class="summary-card-amount" style="${isNegative ? 'color: var(--red-500)' : ''}">
        ${formatCurrency(Math.abs(amount))}
      </div>
      ${changeHTML}
    </div>
  `;
}

/**
 * Render a transaction list item
 * @param {Object} transaction
 * @param {Object} opts
 * @returns {string}
 */
export function renderTransactionItem(transaction, opts = {}) {
  const { showDate = false, onClick = '', onDelete = '' } = opts;
  const paymentMethod = PAYMENT_METHODS.find(p => p.id === transaction.paymentMethod);
  const paymentLabel  = paymentMethod?.label || transaction.paymentMethod || '';
  const dateStr = showDate
    ? formatRelativeDate(transaction.date)
    : formatDate(transaction.date, 'time') || '';

  const sign = transaction.type === 'income' ? '+' : '-';

  return `
    <div
      class="transaction-item"
      data-id="${transaction.id}"
      data-type="${transaction.type}"
      tabindex="0"
      role="button"
      aria-label="${transaction.type} of ${formatCurrency(transaction.amount)} for ${escapeHtml(transaction.categoryName || '')}"
    >
      <div class="transaction-item-icon" style="background: ${transaction.categoryColor || '#64748b'}20">
        <span role="img" aria-label="${escapeHtml(transaction.categoryName || '')}">
          ${transaction.categoryIcon || '📦'}
        </span>
      </div>
      <div class="transaction-item-body">
        <div class="transaction-item-title">
          ${escapeHtml(transaction.categoryName || 'Unknown')}
          ${transaction.subcategory ? `<span style="font-weight:400;color:var(--text-secondary);font-size:0.8rem"> · ${escapeHtml(transaction.subcategory)}</span>` : ''}
        </div>
        <div class="transaction-item-meta">
          <span>${escapeHtml(paymentLabel)}</span>
          ${transaction.notes ? `<span class="meta-dot"></span><span class="text-ellipsis" style="max-width:120px">${escapeHtml(transaction.notes)}</span>` : ''}
          ${dateStr ? `<span class="meta-dot"></span><span>${escapeHtml(dateStr)}</span>` : ''}
        </div>
      </div>
      <div class="transaction-item-amount ${transaction.type}">
        ${sign}${formatCurrency(transaction.amount)}
      </div>
    </div>
  `;
}

/**
 * Render an empty state
 * @param {{ title?: string, message?: string, icon?: string }} opts
 * @returns {string}
 */
export function renderEmptyState({ title = 'Nothing here', message = 'No data found', icon } = {}) {
  const defaultIcon = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 15s1.5 2 4 2 4-2 4-2"/>
      <line x1="9" y1="9" x2="9.01" y2="9"/>
      <line x1="15" y1="9" x2="15.01" y2="9"/>
    </svg>
  `;

  return `
    <div class="empty-state">
      <div class="empty-state-icon">
        ${icon || defaultIcon}
      </div>
      <div class="empty-state-title">${escapeHtml(title)}</div>
      <p class="empty-state-text">${escapeHtml(message)}</p>
    </div>
  `;
}

/**
 * Render a stat/ranking row
 * @param {{ rank, name, icon, color, amount, total, percentage }} opts
 * @returns {string}
 */
export function renderStatRow({ rank, name, icon, color, amount, total, percentage }) {
  const pct = total > 0 ? ((amount / total) * 100) : 0;

  return `
    <div class="stat-row">
      <div class="stat-rank">${rank}</div>
      <div class="stat-bar">
        <div class="stat-bar-label">
          <span>${icon || '📦'} ${escapeHtml(name)}</span>
          <span class="stat-bar-amount">${formatCurrency(amount)}</span>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill ${pct > 100 ? 'danger' : pct > 75 ? 'warning' : ''}"
               style="width: ${Math.min(pct, 100).toFixed(1)}%; background: ${color || 'var(--accent-500)'}">
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render a date group header for transaction list
 * @param {string} dateStr - ISO date
 * @param {number} dayTotal - net total for the day
 * @returns {string}
 */
export function renderDateDivider(dateStr, dayIncome = 0, dayExpense = 0) {
  const relative = formatRelativeDate(dateStr);
  const netStr = dayExpense > 0
    ? `<span style="color:var(--red-500)">-${formatCurrency(dayExpense)}</span>`
    : '';

  return `
    <div class="date-divider">
      <span>${relative} · ${formatDate(dateStr, 'short')}</span>
      <span class="date-divider-total">${netStr}</span>
    </div>
  `;
}

/**
 * Render a skeleton loading item
 * @param {number} count
 * @returns {string}
 */
export function renderSkeletonTransactions(count = 5) {
  return Array.from({ length: count }, () => `
    <div class="transaction-item" style="pointer-events:none">
      <div class="skeleton skeleton-avatar"></div>
      <div class="transaction-item-body">
        <div class="skeleton skeleton-title" style="width:60%"></div>
        <div class="skeleton skeleton-text" style="width:40%;margin-top:6px"></div>
      </div>
      <div class="skeleton skeleton-title" style="width:60px"></div>
    </div>
  `).join('');
}

/**
 * Render a budget progress card
 * @param {{ category, budget, spent }} opts
 * @returns {string}
 */
export function renderBudgetCard({ category, budget, spent }) {
  const pct = budget > 0 ? (spent / budget) * 100 : 0;
  const cls = pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : '';

  return `
    <div class="card" style="padding: var(--space-4); margin-bottom: var(--space-3)">
      <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-3)">
        <div class="category-icon" style="background:${category?.color || '#64748b'}20;font-size:1.3rem">
          ${category?.icon || '📦'}
        </div>
        <div style="flex:1">
          <div style="font-weight:600;font-size:0.9rem">${escapeHtml(category?.name || 'Unknown')}</div>
          <div style="font-size:0.75rem;color:var(--text-secondary)">${formatCurrency(spent)} of ${formatCurrency(budget)}</div>
        </div>
        <div style="font-size:0.9rem;font-weight:700;color:${cls === 'danger' ? 'var(--red-500)' : cls === 'warning' ? 'var(--amber-500)' : 'var(--text-primary)'}">
          ${pct.toFixed(0)}%
        </div>
      </div>
      <div class="progress-bar-wrapper">
        <div class="progress-bar-track">
          <div class="progress-bar-fill ${cls}" style="width:${Math.min(pct, 100).toFixed(1)}%;background:${category?.color || 'var(--accent-500)'}"></div>
        </div>
      </div>
    </div>
  `;
}
