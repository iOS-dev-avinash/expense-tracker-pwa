/**
 * reportService.js
 * Aggregation and analytics for reports
 */

import { TransactionRepository } from '../db/repositories.js';
import { filterTransactions, calculateTotals, groupByCategory, sortBy } from '../utils/helpers.js';
import { getDateRange } from '../utils/helpers.js';

export const ReportService = {
  /**
   * Get income vs expense for a period
   * @param {string} dateFilter
   * @returns {Promise<{ income: number, expense: number, savings: number, savingsRate: number }>}
   */
  async getIncomeVsExpense(dateFilter = 'this_month') {
    const all = await TransactionRepository.getAll();
    const filtered = filterTransactions(all, { dateFilter });
    const { income, expense } = calculateTotals(filtered);
    const savings = income - expense;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    return { income, expense, savings, savingsRate };
  },

  /**
   * Get expense breakdown by category
   * @param {string} dateFilter
   * @returns {Promise<Array>}
   */
  async getExpenseByCategory(dateFilter = 'this_month') {
    const all = await TransactionRepository.getAll();
    const expenses = filterTransactions(all, { type: 'expense', dateFilter });
    return groupByCategory(expenses);
  },

  /**
   * Get income breakdown by category
   * @param {string} dateFilter
   * @returns {Promise<Array>}
   */
  async getIncomeByCategory(dateFilter = 'this_month') {
    const all = await TransactionRepository.getAll();
    const income = filterTransactions(all, { type: 'income', dateFilter });
    return groupByCategory(income);
  },

  /**
   * Get monthly trend for last N months
   * @param {number} months
   * @returns {Promise<Array<{ label, income, expense, savings }>>}
   */
  async getMonthlyTrend(months = 6) {
    const all = await TransactionRepository.getAll();
    const result = [];

    for (let i = months - 1; i >= 0; i--) {
      const now = new Date();
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const start = new Date(year, month, 1).toISOString().split('T')[0];
      const end   = new Date(year, month + 1, 0).toISOString().split('T')[0];
      const txs = filterTransactions(all, { dateFilter: 'custom', startDate: start, endDate: end });
      const { income, expense } = calculateTotals(txs);
      result.push({
        label: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        income,
        expense,
        savings: income - expense,
        year,
        month,
      });
    }

    return result;
  },

  /**
   * Get daily trend for a specific month
   * @param {number} year
   * @param {number} month  (0-indexed)
   * @returns {Promise<Array<{ day, income, expense }>>}
   */
  async getDailyTrend(year, month) {
    const start = new Date(year, month, 1).toISOString().split('T')[0];
    const end   = new Date(year, month + 1, 0).toISOString().split('T')[0];
    const all   = await TransactionRepository.getAll();
    const txs   = filterTransactions(all, { dateFilter: 'custom', startDate: start, endDate: end });
    const days  = new Date(year, month + 1, 0).getDate();

    return Array.from({ length: days }, (_, idx) => {
      const d = idx + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayTxs = txs.filter(t => t.date === dateStr);
      const { income, expense } = calculateTotals(dayTxs);
      return { day: d, date: dateStr, income, expense };
    });
  },

  /**
   * Get weekly trend
   * @param {number} weeks
   * @returns {Promise<Array<{ label, income, expense }>>}
   */
  async getWeeklyTrend(weeks = 8) {
    const all = await TransactionRepository.getAll();
    const result = [];
    const now = new Date();

    for (let i = weeks - 1; i >= 0; i--) {
      const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);

      const startISO = start.toISOString().split('T')[0];
      const endISO   = end.toISOString().split('T')[0];
      const txs = filterTransactions(all, { dateFilter: 'custom', startDate: startISO, endDate: endISO });
      const { income, expense } = calculateTotals(txs);
      result.push({
        label: `${start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`,
        income,
        expense,
        savings: income - expense,
      });
    }

    return result;
  },

  /**
   * Get top spending categories
   * @param {number} limit
   * @param {string} dateFilter
   * @returns {Promise<Array>}
   */
  async getTopSpending(limit = 5, dateFilter = 'this_month') {
    const all = await TransactionRepository.getAll();
    const expenses = filterTransactions(all, { type: 'expense', dateFilter });
    const byCategory = groupByCategory(expenses);
    return byCategory.slice(0, limit);
  },

  /**
   * Get highest single expense
   * @param {string} dateFilter
   * @returns {Promise<Object|null>}
   */
  async getHighestExpense(dateFilter = 'this_month') {
    const all = await TransactionRepository.getAll();
    const expenses = filterTransactions(all, { type: 'expense', dateFilter });
    if (!expenses.length) return null;
    return expenses.reduce((max, t) => t.amount > max.amount ? t : max, expenses[0]);
  },

  /**
   * Get highest single income
   * @param {string} dateFilter
   * @returns {Promise<Object|null>}
   */
  async getHighestIncome(dateFilter = 'this_month') {
    const all = await TransactionRepository.getAll();
    const income = filterTransactions(all, { type: 'income', dateFilter });
    if (!income.length) return null;
    return income.reduce((max, t) => t.amount > max.amount ? t : max, income[0]);
  },

  /**
   * Get cash flow analysis
   * @param {string} dateFilter
   * @returns {Promise<Object>}
   */
  async getCashFlowAnalysis(dateFilter = 'this_month') {
    const all = await TransactionRepository.getAll();
    const filtered = filterTransactions(all, { dateFilter });
    const { income, expense, balance } = calculateTotals(filtered);
    const expenseByCategory = groupByCategory(filtered.filter(t => t.type === 'expense'));
    const incomeByCategory  = groupByCategory(filtered.filter(t => t.type === 'income'));
    const txCount = filtered.length;
    const avgExpense = filtered.filter(t => t.type === 'expense').length
      ? expense / filtered.filter(t => t.type === 'expense').length
      : 0;

    return {
      income,
      expense,
      balance,
      savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0,
      txCount,
      avgExpense,
      expenseByCategory,
      incomeByCategory,
    };
  },

  /**
   * Export report as JSON
   * @param {string} dateFilter
   * @returns {Promise<Object>}
   */
  async exportReportJSON(dateFilter = 'this_month') {
    const [ivse, byCategory, monthly, topSpending, highestExpense, highestIncome] = await Promise.all([
      this.getIncomeVsExpense(dateFilter),
      this.getExpenseByCategory(dateFilter),
      this.getMonthlyTrend(6),
      this.getTopSpending(10, dateFilter),
      this.getHighestExpense(dateFilter),
      this.getHighestIncome(dateFilter),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      period: dateFilter,
      summary: ivse,
      expenseByCategory: byCategory,
      monthlyTrend: monthly,
      topSpending,
      highestExpense,
      highestIncome,
    };
  },
};
