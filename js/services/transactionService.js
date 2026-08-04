/**
 * transactionService.js
 * Business logic for transactions
 */

import { TransactionRepository } from '../db/repositories.js';
import { createTransaction, validateTransaction } from '../db/models.js';
import { CategoryService } from './categoryService.js';
import { filterTransactions, calculateTotals } from '../utils/helpers.js';
import { getDateRange } from '../utils/helpers.js';

export const TransactionService = {
  /** Add a new transaction */
  async add(data) {
    const { valid, errors } = validateTransaction(data);
    if (!valid) throw new Error(errors.join('; '));

    // Enrich with category info
    const category = await CategoryService.getById(data.categoryId);
    if (category) {
      data.categoryName  = category.name;
      data.categoryIcon  = category.icon;
      data.categoryColor = category.color;
    }

    const tx = createTransaction(data);
    return TransactionRepository.add(tx);
  },

  /** Update an existing transaction */
  async update(id, data) {
    const existing = await TransactionRepository.getById(id);
    if (!existing) throw new Error('Transaction not found');

    const merged = { ...existing, ...data, id };
    const { valid, errors } = validateTransaction(merged);
    if (!valid) throw new Error(errors.join('; '));

    // Re-enrich category info if categoryId changed
    if (data.categoryId && data.categoryId !== existing.categoryId) {
      const category = await CategoryService.getById(data.categoryId);
      if (category) {
        merged.categoryName  = category.name;
        merged.categoryIcon  = category.icon;
        merged.categoryColor = category.color;
      }
    }

    return TransactionRepository.update(merged);
  },

  /** Delete a transaction */
  async delete(id) {
    return TransactionRepository.delete(id);
  },

  /** Get all transactions */
  async getAll() {
    return TransactionRepository.getAll();
  },

  /** Get a single transaction */
  async getById(id) {
    return TransactionRepository.getById(id);
  },

  /** Get transactions with filters applied */
  async getFiltered(filters = {}) {
    const all = await TransactionRepository.getAll();
    return filterTransactions(all, filters);
  },

  /** Get today's transactions */
  async getToday() {
    const { start, end } = getDateRange('today');
    const all = await TransactionRepository.getAll();
    return filterTransactions(all, { dateFilter: 'today' });
  },

  /** Get this month's transactions */
  async getThisMonth() {
    const all = await TransactionRepository.getAll();
    return filterTransactions(all, { dateFilter: 'this_month' });
  },

  /** Get monthly totals for last N months */
  async getMonthlyTrend(months = 6) {
    const all = await TransactionRepository.getAll();
    const result = [];

    for (let i = months - 1; i >= 0; i--) {
      const now = new Date();
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year  = d.getFullYear();
      const month = d.getMonth();
      const start = new Date(year, month, 1).toISOString().split('T')[0];
      const end   = new Date(year, month + 1, 0).toISOString().split('T')[0];
      const txs   = filterTransactions(all, { dateFilter: 'custom', startDate: start, endDate: end });
      const { income, expense } = calculateTotals(txs);
      result.push({ year, month, label: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), income, expense });
    }

    return result;
  },

  /** Get daily totals for a month */
  async getDailyTrend(year, month) {
    const start = new Date(year, month, 1).toISOString().split('T')[0];
    const end   = new Date(year, month + 1, 0).toISOString().split('T')[0];
    const all = await TransactionRepository.getAll();
    const txs = filterTransactions(all, { dateFilter: 'custom', startDate: start, endDate: end });

    const days = new Date(year, month + 1, 0).getDate();
    const result = [];

    for (let d = 1; d <= days; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayTxs = txs.filter(t => t.date === dateStr);
      const { income, expense } = calculateTotals(dayTxs);
      result.push({ day: d, date: dateStr, income, expense });
    }

    return result;
  },

  /** Get weekly totals for last N weeks */
  async getWeeklyTrend(weeks = 8) {
    const all = await TransactionRepository.getAll();
    const result = [];
    const now = new Date();

    for (let i = weeks - 1; i >= 0; i--) {
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() - i * 7);
      const startOfWeek = new Date(endOfWeek);
      startOfWeek.setDate(endOfWeek.getDate() - 6);

      const startISO = startOfWeek.toISOString().split('T')[0];
      const endISO   = endOfWeek.toISOString().split('T')[0];
      const txs = filterTransactions(all, { dateFilter: 'custom', startDate: startISO, endDate: endISO });
      const { income, expense } = calculateTotals(txs);
      result.push({ label: `W${weeks - i}`, startISO, endISO, income, expense });
    }

    return result;
  },

  /** Get top spending categories */
  async getTopCategories(limit = 5, dateFilter = 'this_month') {
    const all = await TransactionRepository.getAll();
    const expenses = filterTransactions(all, { type: 'expense', dateFilter });

    const catMap = {};
    for (const tx of expenses) {
      if (!catMap[tx.categoryId]) {
        catMap[tx.categoryId] = {
          categoryId: tx.categoryId,
          name: tx.categoryName || tx.categoryId,
          icon: tx.categoryIcon || '📦',
          color: tx.categoryColor || '#64748b',
          total: 0,
          count: 0,
        };
      }
      catMap[tx.categoryId].total += tx.amount;
      catMap[tx.categoryId].count += 1;
    }

    return Object.values(catMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  },

  /** Get dashboard summary */
  async getDashboardSummary() {
    const all = await TransactionRepository.getAll();
    const today = filterTransactions(all, { dateFilter: 'today' });
    const month = filterTransactions(all, { dateFilter: 'this_month' });

    const todayTotals = calculateTotals(today);
    const monthTotals = calculateTotals(month);
    const allTotals   = calculateTotals(all);

    return {
      todayIncome:   todayTotals.income,
      todayExpense:  todayTotals.expense,
      monthIncome:   monthTotals.income,
      monthExpense:  monthTotals.expense,
      totalBalance:  allTotals.balance,
      totalIncome:   allTotals.income,
      totalExpense:  allTotals.expense,
      savings:       monthTotals.income - monthTotals.expense,
    };
  },

  /** Export all transactions as JSON */
  async exportJSON() {
    return TransactionRepository.getAll();
  },

  /** Import transactions from JSON */
  async importJSON(transactions, mode = 'merge') {
    if (!Array.isArray(transactions)) throw new Error('Expected an array of transactions');

    if (mode === 'replace') {
      await TransactionRepository.clearAll();
    }

    const enriched = transactions.map(t => createTransaction(t));
    return TransactionRepository.bulkAdd(enriched);
  },
};
