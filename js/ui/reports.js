/**
 * reports.js
 * Comprehensive reports view with charts and analytics
 */

import { ReportService } from '../services/reportService.js';
import { renderEmptyState, renderStatRow } from '../components/cards.js';
import { formatCurrency, formatPercentage } from '../utils/formatter.js';
import { DATE_FILTERS, CHART_COLORS } from '../utils/constants.js';
import { downloadFile, escapeHtml, addRippleListeners } from '../utils/helpers.js';
import { Toast } from '../components/toast.js';

let _charts = {};
let _currentPeriod = 'this_month';

export async function renderReports() {
  const container = document.getElementById('page-reports');
  if (!container) return;

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Financial Reports</h1>
        <div class="page-subtitle">Visual analytics & insights</div>
      </div>
      <div class="header-actions">
        <button class="btn-icon" id="report-export-json" title="Export Report JSON">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
        <button class="btn-icon" id="report-print-btn" title="Print Report">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        </button>
      </div>
    </div>

    <!-- Period Filter -->
    <div class="filter-scroll" id="report-period-chips">
      ${DATE_FILTERS.filter(f => f.id !== 'custom').map(f => `
        <button class="filter-chip ${f.id === _currentPeriod ? 'active' : ''}" data-report-period="${f.id}">${f.label}</button>
      `).join('')}
    </div>

    <div style="padding:var(--space-4)" id="report-content">
      <!-- Income vs Expense Summary Card -->
      <div class="card" style="margin-bottom:var(--space-4);padding:var(--space-4)" id="report-summary-card">
        <div class="skeleton skeleton-title" style="width:40%"></div>
        <div class="skeleton skeleton-text" style="width:60%;margin-top:10px"></div>
      </div>

      <!-- Income vs Expense Bar Chart -->
      <div class="card" style="margin-bottom:var(--space-4)">
        <div class="card-header">
          <h3 class="section-title">Income vs Expense</h3>
        </div>
        <div class="chart-wrapper">
          <canvas id="chart-inc-exp"></canvas>
        </div>
      </div>

      <!-- Expense Category Breakdown Doughnut -->
      <div class="card" style="margin-bottom:var(--space-4)">
        <div class="card-header">
          <h3 class="section-title">Expense by Category</h3>
        </div>
        <div class="chart-wrapper doughnut">
          <canvas id="chart-cat-pie"></canvas>
        </div>
        <div id="report-cat-legend" style="padding:var(--space-3) var(--space-4) var(--space-4);display:flex;flex-wrap:wrap;gap:var(--space-2)"></div>
      </div>

      <!-- Monthly Trend Line/Bar Chart -->
      <div class="card" style="margin-bottom:var(--space-4)">
        <div class="card-header">
          <h3 class="section-title">Monthly Trend (6 Months)</h3>
        </div>
        <div class="chart-wrapper tall">
          <canvas id="chart-monthly-trend"></canvas>
        </div>
      </div>

      <!-- Top Spending Categories -->
      <div class="card" style="margin-bottom:var(--space-4)">
        <div class="card-header">
          <h3 class="section-title">Top Spending Categories</h3>
        </div>
        <div style="padding:var(--space-4)" id="report-top-spending"></div>
      </div>

      <!-- Highlights (Highest Expense & Highest Income) -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);margin-bottom:var(--space-4)">
        <div class="card" style="padding:var(--space-4)" id="highlight-expense"></div>
        <div class="card" style="padding:var(--space-4)" id="highlight-income"></div>
      </div>
    </div>

    <div style="height:var(--space-16)"></div>
  `;

  setupReportEvents(container);
  await loadReports(_currentPeriod);
}

function setupReportEvents(container) {
  addRippleListeners(container);

  container.querySelectorAll('[data-report-period]').forEach(chip => {
    chip.addEventListener('click', async () => {
      container.querySelectorAll('[data-report-period]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      _currentPeriod = chip.dataset.reportPeriod;
      await loadReports(_currentPeriod);
    });
  });

  document.getElementById('report-export-json')?.addEventListener('click', async () => {
    try {
      const data = await ReportService.exportReportJSON(_currentPeriod);
      downloadFile(JSON.stringify(data, null, 2), `expense-report-${_currentPeriod}-${Date.now()}.json`);
      Toast.success('Report exported as JSON');
    } catch (err) {
      Toast.error('Failed to export report');
    }
  });

  document.getElementById('report-print-btn')?.addEventListener('click', () => {
    window.print();
  });
}

async function loadReports(period) {
  await Promise.all([
    loadReportSummary(period),
    loadIncExpChart(period),
    loadCategoryPieChart(period),
    loadMonthlyTrendChart(),
    loadTopSpendingList(period),
    loadHighlights(period),
  ]);
}

async function loadReportSummary(period) {
  const card = document.getElementById('report-summary-card');
  if (!card) return;

  try {
    const summary = await ReportService.getIncomeVsExpense(period);
    card.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:var(--space-2);text-align:center">
        <div>
          <div style="font-size:0.75rem;color:var(--text-secondary);font-weight:500">Income</div>
          <div style="font-size:1.1rem;font-weight:700;color:var(--blue-500);margin-top:2px">${formatCurrency(summary.income)}</div>
        </div>
        <div>
          <div style="font-size:0.75rem;color:var(--text-secondary);font-weight:500">Expense</div>
          <div style="font-size:1.1rem;font-weight:700;color:var(--red-500);margin-top:2px">${formatCurrency(summary.expense)}</div>
        </div>
        <div>
          <div style="font-size:0.75rem;color:var(--text-secondary);font-weight:500">Savings</div>
          <div style="font-size:1.1rem;font-weight:700;color:${summary.savings >= 0 ? 'var(--accent-500)' : 'var(--red-500)'};margin-top:2px">${formatCurrency(summary.savings)}</div>
        </div>
      </div>
      <div style="margin-top:var(--space-3);padding-top:var(--space-3);border-top:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:0.8rem;color:var(--text-secondary)">Savings Rate:</span>
        <span class="badge ${summary.savingsRate >= 20 ? 'badge-success' : 'badge-warning'}">${summary.savingsRate.toFixed(1)}%</span>
      </div>
    `;
  } catch (err) {
    console.error(err);
  }
}

async function loadIncExpChart(period) {
  const canvas = document.getElementById('chart-inc-exp');
  if (!canvas) return;

  try {
    const summary = await ReportService.getIncomeVsExpense(period);
    if (_charts.incExp) _charts.incExp.destroy();

    const Chart = window.Chart;
    if (!Chart) return;

    _charts.incExp = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Income', 'Expense'],
        datasets: [{
          data: [summary.income, summary.expense],
          backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(239, 68, 68, 0.8)'],
          borderRadius: 8,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { ticks: { callback: v => formatCurrency(v, { compact: true }) } }
        }
      }
    });
  } catch (err) { console.error(err); }
}

async function loadCategoryPieChart(period) {
  const canvas = document.getElementById('chart-cat-pie');
  const legendEl = document.getElementById('report-cat-legend');
  if (!canvas || !legendEl) return;

  try {
    const categories = await ReportService.getExpenseByCategory(period);
    if (_charts.catPie) _charts.catPie.destroy();

    if (!categories.length) {
      canvas.closest('.chart-wrapper').innerHTML = renderEmptyState({ title: 'No expense data' });
      legendEl.innerHTML = '';
      return;
    }

    const Chart = window.Chart;
    if (!Chart) return;

    _charts.catPie = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: categories.map(c => c.categoryName),
        datasets: [{
          data: categories.map(c => c.total),
          backgroundColor: categories.map(c => c.color || CHART_COLORS[0]),
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });

    legendEl.innerHTML = categories.map(c => `
      <span style="display:inline-flex;align-items:center;gap:4px;font-size:0.75rem">
        <span style="width:8px;height:8px;border-radius:50%;background:${c.color}"></span>
        ${c.icon} ${c.categoryName} (${formatCurrency(c.total, { compact: true })})
      </span>
    `).join('');
  } catch (err) { console.error(err); }
}

async function loadMonthlyTrendChart() {
  const canvas = document.getElementById('chart-monthly-trend');
  if (!canvas) return;

  try {
    const trend = await ReportService.getMonthlyTrend(6);
    if (_charts.trend) _charts.trend.destroy();

    const Chart = window.Chart;
    if (!Chart) return;

    _charts.trend = new Chart(canvas, {
      type: 'line',
      data: {
        labels: trend.map(t => t.label),
        datasets: [
          {
            label: 'Income',
            data: trend.map(t => t.income),
            borderColor: '#3b82f6',
            tension: 0.3,
            fill: false,
          },
          {
            label: 'Expense',
            data: trend.map(t => t.expense),
            borderColor: '#ef4444',
            tension: 0.3,
            fill: false,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { ticks: { callback: v => formatCurrency(v, { compact: true }) } }
        }
      }
    });
  } catch (err) { console.error(err); }
}

async function loadTopSpendingList(period) {
  const container = document.getElementById('report-top-spending');
  if (!container) return;

  try {
    const top = await ReportService.getTopSpending(5, period);
    if (!top.length) {
      container.innerHTML = renderEmptyState({ title: 'No spending recorded' });
      return;
    }

    const grandTotal = top.reduce((acc, curr) => acc + curr.total, 0);
    container.innerHTML = top.map((c, i) => renderStatRow({
      rank: i + 1,
      name: c.categoryName,
      icon: c.icon,
      color: c.color,
      amount: c.total,
      total: grandTotal,
    })).join('');
  } catch (err) { console.error(err); }
}

async function loadHighlights(period) {
  const expEl = document.getElementById('highlight-expense');
  const incEl = document.getElementById('highlight-income');
  if (!expEl || !incEl) return;

  try {
    const [highestExp, highestInc] = await Promise.all([
      ReportService.getHighestExpense(period),
      ReportService.getHighestIncome(period),
    ]);

    expEl.innerHTML = `
      <div style="font-size:0.7rem;color:var(--text-secondary);font-weight:600;text-transform:uppercase">Highest Expense</div>
      ${highestExp ? `
        <div style="font-size:1.1rem;font-weight:700;color:var(--red-500);margin:4px 0">${formatCurrency(highestExp.amount)}</div>
        <div style="font-size:0.75rem;color:var(--text-primary);font-weight:600" class="text-ellipsis">${highestExp.categoryIcon} ${escapeHtml(highestExp.categoryName)}</div>
      ` : `<div style="font-size:0.8rem;color:var(--text-tertiary);margin-top:4px">None</div>`}
    `;

    incEl.innerHTML = `
      <div style="font-size:0.7rem;color:var(--text-secondary);font-weight:600;text-transform:uppercase">Highest Income</div>
      ${highestInc ? `
        <div style="font-size:1.1rem;font-weight:700;color:var(--blue-500);margin:4px 0">${formatCurrency(highestInc.amount)}</div>
        <div style="font-size:0.75rem;color:var(--text-primary);font-weight:600" class="text-ellipsis">${highestInc.categoryIcon} ${escapeHtml(highestInc.categoryName)}</div>
      ` : `<div style="font-size:0.8rem;color:var(--text-tertiary);margin-top:4px">None</div>`}
    `;
  } catch (err) { console.error(err); }
}

export async function refreshReports() {
  await loadReports(_currentPeriod);
}
