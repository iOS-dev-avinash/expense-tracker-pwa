/**
 * dashboard.js
 * Dashboard view - summary cards, charts, recent transactions
 */

import { TransactionService } from '../services/transactionService.js';
import { CategoryService }    from '../services/categoryService.js';
import { BudgetRepository }   from '../db/repositories.js';
import { renderSummaryCard, renderTransactionItem, renderEmptyState, renderDateDivider, renderSkeletonTransactions } from '../components/cards.js';
import { formatCurrency, formatDate }  from '../utils/formatter.js';
import { groupBy } from '../utils/helpers.js';
import { CHART_COLORS, RECENT_TX_LIMIT } from '../utils/constants.js';

let _chartInstances = {};

/**
 * Render the dashboard page
 */
export async function renderDashboard() {
  const container = document.getElementById('page-dashboard');
  if (!container) return;

  container.innerHTML = getDashboardHTML();

  // Load data
  try {
    await loadDashboardData();
  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}

function getDashboardHTML() {
  return `
    <!-- Hero Section -->
    <div class="dashboard-hero" id="dashboard-hero">
      <div style="position:relative;z-index:1">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4)">
          <div>
            <div style="font-size:0.75rem;color:rgba(255,255,255,0.6);font-weight:500;letter-spacing:0.06em;text-transform:uppercase">
              ${getGreeting()}
            </div>
            <h1 style="color:white;font-size:1.5rem;margin-top:2px" id="dash-greeting-name">My Finances</h1>
          </div>
          <div style="display:flex;gap:var(--space-2)">
            <button class="btn-icon" id="dash-refresh-btn" aria-label="Refresh dashboard" style="background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.2);color:white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            </button>
          </div>
        </div>

        <!-- Balance Display -->
        <div style="text-align:center;padding:var(--space-4) 0">
          <div style="font-size:0.75rem;color:rgba(255,255,255,0.5);font-weight:500;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:var(--space-2)">
            Total Balance
          </div>
          <div id="dash-total-balance" style="font-size:2.5rem;font-weight:800;color:white;letter-spacing:-0.03em;line-height:1">
            <div class="skeleton skeleton-title" style="width:160px;height:40px;margin:0 auto;background:rgba(255,255,255,0.1)"></div>
          </div>
          <div style="margin-top:var(--space-3);display:flex;gap:var(--space-6);justify-content:center">
            <div id="dash-hero-income" style="text-align:center">
              <div style="font-size:0.7rem;color:rgba(255,255,255,0.5);margin-bottom:3px">Income</div>
              <div style="font-size:1rem;font-weight:700;color:#4ade80">
                <div class="skeleton" style="width:70px;height:18px;background:rgba(255,255,255,0.1)"></div>
              </div>
            </div>
            <div style="width:1px;background:rgba(255,255,255,0.1)"></div>
            <div id="dash-hero-expense" style="text-align:center">
              <div style="font-size:0.7rem;color:rgba(255,255,255,0.5);margin-bottom:3px">Expense</div>
              <div style="font-size:1rem;font-weight:700;color:#f87171">
                <div class="skeleton" style="width:70px;height:18px;background:rgba(255,255,255,0.1)"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-grid" id="summary-cards">
      ${['income','expense','balance','savings'].map(type => `
        <div class="summary-card ${type}">
          <div class="skeleton skeleton-text" style="width:50%;margin-bottom:8px"></div>
          <div class="skeleton skeleton-title" style="width:75%"></div>
        </div>
      `).join('')}
    </div>

    <!-- Quick Action Bar -->
    <div style="padding:var(--space-4);display:flex;gap:var(--space-2);overflow-x:auto" class="filter-scroll">
      <button class="filter-chip active" data-period="this_month" id="period-this_month">This Month</button>
      <button class="filter-chip" data-period="today" id="period-today">Today</button>
      <button class="filter-chip" data-period="this_week" id="period-this_week">This Week</button>
      <button class="filter-chip" data-period="last_month" id="period-last_month">Last Month</button>
      <button class="filter-chip" data-period="this_year" id="period-this_year">This Year</button>
    </div>

    <!-- Charts Section -->
    <div style="padding:0 var(--space-4) var(--space-4)">
      <div class="card" style="margin-bottom:var(--space-4)">
        <div class="card-header">
          <h3 class="section-title">Expense by Category</h3>
          <span style="font-size:0.75rem;color:var(--text-secondary)" id="dash-cat-period">This Month</span>
        </div>
        <div class="chart-wrapper doughnut" id="dash-doughnut-wrapper">
          <canvas id="dash-doughnut-chart" aria-label="Expense by category chart"></canvas>
        </div>
        <div id="dash-cat-legend" style="padding:var(--space-3) var(--space-4) var(--space-4);display:flex;flex-wrap:wrap;gap:var(--space-2)"></div>
      </div>

      <div class="card" style="margin-bottom:var(--space-4)">
        <div class="card-header">
          <h3 class="section-title">Monthly Trend</h3>
          <span style="font-size:0.75rem;color:var(--text-secondary)">6 months</span>
        </div>
        <div class="chart-wrapper" style="height:220px">
          <canvas id="dash-bar-chart" aria-label="Monthly income vs expense chart"></canvas>
        </div>
      </div>
    </div>

    <!-- Budget Overview -->
    <div class="section" id="dash-budget-section" style="padding-top:0">
      <div class="section-header">
        <h3 class="section-title">Budget</h3>
        <span class="section-action" id="dash-manage-budgets">Manage</span>
      </div>
      <div id="dash-budget-list">
        <div class="skeleton skeleton-title" style="margin-bottom:8px"></div>
        <div class="skeleton skeleton-text"></div>
      </div>
    </div>

    <!-- Recent Transactions -->
    <div class="section" style="padding-top:0">
      <div class="section-header">
        <h3 class="section-title">Recent Transactions</h3>
        <span class="section-action" id="dash-see-all">See All</span>
      </div>
      <div id="dash-recent-transactions" style="background:var(--bg-card);border-radius:var(--border-radius-lg);overflow:hidden;box-shadow:var(--shadow-sm);border:1px solid var(--border-color)">
        ${renderSkeletonTransactions(5)}
      </div>
    </div>

    <!-- Bottom spacer -->
    <div style="height:var(--space-8)"></div>
  `;
}

async function loadDashboardData() {
  const activePeriod = document.querySelector('.filter-chip.active[data-period]')?.dataset.period || 'this_month';
  await Promise.all([
    loadSummaryCards(activePeriod),
    loadCharts(activePeriod),
    loadRecentTransactions(),
    loadBudgets(activePeriod),
  ]);

  setupPeriodChips();
  setupRefreshBtn();
  setupSeeAll();
  loadUserName();
}

function setupPeriodChips() {
  document.querySelectorAll('.filter-chip[data-period]').forEach(chip => {
    chip.addEventListener('click', async () => {
      document.querySelectorAll('.filter-chip[data-period]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const period = chip.dataset.period;
      await Promise.all([
        loadSummaryCards(period),
        loadCharts(period),
        loadBudgets(period),
      ]);
    });
  });
}

function setupRefreshBtn() {
  document.getElementById('dash-refresh-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('dash-refresh-btn');
    btn.style.opacity = '0.5';
    btn.style.pointerEvents = 'none';
    const period = document.querySelector('.filter-chip.active[data-period]')?.dataset.period || 'this_month';
    await Promise.all([
      loadSummaryCards(period),
      loadCharts(period),
      loadRecentTransactions(),
      loadBudgets(period),
    ]);
    btn.style.opacity = '';
    btn.style.pointerEvents = '';
  });
}

function setupSeeAll() {
  document.getElementById('dash-see-all')?.addEventListener('click', () => {
    window.__router?.navigate('transactions');
  });
  document.getElementById('dash-manage-budgets')?.addEventListener('click', () => {
    window.__router?.navigate('settings');
  });
}

async function loadUserName() {
  try {
    const { SettingsService } = await import('../services/settingsService.js');
    const name = await SettingsService.get('name');
    const el = document.getElementById('dash-greeting-name');
    if (el && name) el.textContent = name;
  } catch {}
}

async function loadSummaryCards(period = 'this_month') {
  const container = document.getElementById('summary-cards');
  if (!container) return;

  try {
    const [allTx, summary] = await Promise.all([
      TransactionService.getAll(),
      TransactionService.getDashboardSummary(),
    ]);

    // Get period-specific data
    const { filterTransactions, calculateTotals } = await import('../utils/helpers.js');
    const periodTx = filterTransactions(allTx, { dateFilter: period });
    const periodTotals = calculateTotals(periodTx);

    // Update hero balance
    const balanceEl = document.getElementById('dash-total-balance');
    if (balanceEl) {
      const balance = summary.totalBalance;
      balanceEl.innerHTML = `
        <span style="font-size:1rem;vertical-align:super;opacity:0.7">₹</span>${formatCurrency(Math.abs(balance), { showSymbol: false })}
      `;
      balanceEl.style.color = balance < 0 ? 'var(--red-400)' : 'white';
    }

    const heroIncomeEl = document.getElementById('dash-hero-income');
    if (heroIncomeEl) {
      heroIncomeEl.querySelector('div:last-child').innerHTML = `<span style="font-size:1rem;font-weight:700;color:#4ade80">${formatCurrency(periodTotals.income)}</span>`;
    }
    const heroExpenseEl = document.getElementById('dash-hero-expense');
    if (heroExpenseEl) {
      heroExpenseEl.querySelector('div:last-child').innerHTML = `<span style="font-size:1rem;font-weight:700;color:#f87171">${formatCurrency(periodTotals.expense)}</span>`;
    }

    const icons = {
      income: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
      expense: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>`,
      balance: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
      savings: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    };

    container.innerHTML = `
      ${renderSummaryCard({ label: 'Income',  amount: periodTotals.income,   type: 'income',  icon: icons.income })}
      ${renderSummaryCard({ label: 'Expense', amount: periodTotals.expense,  type: 'expense', icon: icons.expense })}
      ${renderSummaryCard({ label: 'Balance', amount: periodTotals.balance,  type: 'balance', icon: icons.balance })}
      ${renderSummaryCard({ label: 'Savings', amount: summary.savings, type: 'savings', icon: icons.savings })}
    `;
  } catch (err) {
    console.error('Failed to load summary:', err);
  }
}

async function loadCharts(period = 'this_month') {
  await Promise.all([
    loadDoughnutChart(period),
    loadBarChart(),
  ]);
}

async function loadDoughnutChart(period = 'this_month') {
  const canvas = document.getElementById('dash-doughnut-chart');
  const legendEl = document.getElementById('dash-cat-legend');
  if (!canvas || !legendEl) return;

  try {
    const { TransactionService } = await import('../services/transactionService.js');
    const topCats = await TransactionService.getTopCategories(6, period);

    if (_chartInstances.doughnut) {
      _chartInstances.doughnut.destroy();
    }

    if (!topCats.length) {
      canvas.closest('.chart-wrapper').innerHTML = renderEmptyState({ title: 'No expenses', message: 'Add some expenses to see the chart' });
      legendEl.innerHTML = '';
      return;
    }

    const Chart = window.Chart;
    if (!Chart) return;

    _chartInstances.doughnut = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: topCats.map(c => c.name),
        datasets: [{
          data: topCats.map(c => c.total),
          backgroundColor: topCats.map(c => c.color || CHART_COLORS[0]),
          borderColor: 'transparent',
          borderWidth: 0,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${formatCurrency(ctx.parsed)}`,
            },
          },
        },
        animation: { animateRotate: true, animateScale: true },
      },
    });

    // Legend
    legendEl.innerHTML = topCats.map(c => `
      <span style="display:inline-flex;align-items:center;gap:5px;font-size:0.75rem;font-weight:500;color:var(--text-secondary)">
        <span style="width:8px;height:8px;border-radius:50%;background:${c.color};flex-shrink:0"></span>
        ${c.icon} ${c.name}
      </span>
    `).join('');

    // Period label
    const periodEl = document.getElementById('dash-cat-period');
    if (periodEl) {
      const labels = { this_month: 'This Month', today: 'Today', this_week: 'This Week', last_month: 'Last Month', this_year: 'This Year' };
      periodEl.textContent = labels[period] || period;
    }
  } catch (err) {
    console.error('Doughnut chart error:', err);
  }
}

async function loadBarChart() {
  const canvas = document.getElementById('dash-bar-chart');
  if (!canvas) return;

  try {
    const trend = await TransactionService.getMonthlyTrend(6);

    if (_chartInstances.bar) {
      _chartInstances.bar.destroy();
    }

    const Chart = window.Chart;
    if (!Chart) return;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
      (!document.documentElement.hasAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
    const textColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)';

    _chartInstances.bar = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: trend.map(t => t.label),
        datasets: [
          {
            label: 'Income',
            data: trend.map(t => t.income),
            backgroundColor: 'rgba(59,130,246,0.75)',
            borderRadius: 6,
            borderSkipped: false,
          },
          {
            label: 'Expense',
            data: trend.map(t => t.expense),
            backgroundColor: 'rgba(239,68,68,0.75)',
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: textColor,
              font: { family: 'Inter', size: 11 },
              boxWidth: 10,
              usePointStyle: true,
              pointStyle: 'circle',
            },
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { family: 'Inter', size: 10 } },
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { family: 'Inter', size: 10 },
              callback: val => formatCurrency(val, { compact: true }),
            },
          },
        },
        animation: { duration: 600, easing: 'easeOutQuart' },
      },
    });
  } catch (err) {
    console.error('Bar chart error:', err);
  }
}

async function loadRecentTransactions() {
  const container = document.getElementById('dash-recent-transactions');
  if (!container) return;

  try {
    const all = await TransactionService.getAll();
    const recent = all
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, RECENT_TX_LIMIT);

    if (!recent.length) {
      container.innerHTML = renderEmptyState({
        title: 'No transactions yet',
        message: 'Tap the + button to add your first transaction',
      });
      return;
    }

    container.innerHTML = recent.map(tx => renderTransactionItem(tx, { showDate: true })).join('');

    // Click to edit
    container.querySelectorAll('.transaction-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        if (id) window.__openTransactionModal?.(id);
      });
    });
  } catch (err) {
    console.error('Recent transactions error:', err);
    container.innerHTML = renderEmptyState({ title: 'Error loading transactions' });
  }
}

async function loadBudgets(period = 'this_month') {
  const container = document.getElementById('dash-budget-list');
  if (!container) return;

  try {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const budgets = await BudgetRepository.getByMonth(monthKey);

    if (!budgets.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:var(--space-4);color:var(--text-tertiary);font-size:0.875rem">
          No budgets set. <span style="color:var(--accent-600);cursor:pointer;font-weight:600" id="dash-add-budget">Set budget →</span>
        </div>
      `;
      document.getElementById('dash-add-budget')?.addEventListener('click', () => window.__router?.navigate('settings'));
      return;
    }

    const [allTx, catMap] = await Promise.all([
      TransactionService.getAll(),
      CategoryService.getCategoryMap(),
    ]);

    const { filterTransactions, groupByCategory } = await import('../utils/helpers.js');
    const monthTx = filterTransactions(allTx, { type: 'expense', dateFilter: 'this_month' });
    const spentByCategory = groupByCategory(monthTx);

    const { renderBudgetCard } = await import('../components/cards.js');
    container.innerHTML = budgets.map(b => {
      const cat = catMap[b.categoryId];
      const spentEntry = spentByCategory.find(s => s.categoryId === b.categoryId);
      return renderBudgetCard({ category: cat, budget: b.amount, spent: spentEntry?.total || 0 });
    }).join('');
  } catch (err) {
    console.error('Budget load error:', err);
    container.innerHTML = '';
  }
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/** Called when dashboard becomes active again (for refresh) */
export async function refreshDashboard() {
  const period = document.querySelector('.filter-chip.active[data-period]')?.dataset.period || 'this_month';
  await Promise.all([
    loadSummaryCards(period),
    loadCharts(period),
    loadRecentTransactions(),
    loadBudgets(period),
  ]);
}
