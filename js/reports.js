/**
 * FinTrack Reports Module
 */

const Reports = (() => {
  const getYears = () => {
    const transactions = Transactions.getAll();
    const years = [...new Set(transactions.map(t => new Date(t.date + 'T00:00:00').getFullYear()))];
    return years.sort((a, b) => b - a);
  };

  const populateYears = () => {
    const sel = document.getElementById('reportYear');
    if (!sel) return;
    const years = getYears();
    const currentYear = new Date().getFullYear();
    if (!years.includes(currentYear)) years.unshift(currentYear);
    sel.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
  };

  const render = () => {
    const year = parseInt(document.getElementById('reportYear')?.value || new Date().getFullYear());
    const transactions = Transactions.getAll();
    const yearTransactions = transactions.filter(t => new Date(t.date + 'T00:00:00').getFullYear() === year);

    const { income, expense } = Utils.summarize(yearTransactions);
    document.getElementById('annualIncome').textContent = Utils.formatCurrency(income);
    document.getElementById('annualExpenses').textContent = Utils.formatCurrency(expense);
    document.getElementById('annualSavings').textContent = Utils.formatCurrency(income - expense);

    const monthlyData = Utils.groupByMonth(transactions, year);

    // Charts
    Charts.renderMonthly('monthlyChart', monthlyData);
    Charts.renderTrend('trendChart', monthlyData);

    // Category breakdown
    const catBreakdown = Utils.groupByCategory(yearTransactions, 'expense');
    const total = catBreakdown.reduce((s, c) => s + c.amount, 0);

    const breakdownEl = document.getElementById('categoryBreakdown');
    if (breakdownEl) {
      if (catBreakdown.length === 0) {
        breakdownEl.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem">No expense data for this year.</p>';
      } else {
        breakdownEl.innerHTML = catBreakdown.map(c => {
          const pct = total > 0 ? (c.amount / total * 100) : 0;
          return `
            <div class="cat-row">
              <span class="cat-name">${Utils.escHtml(c.category)}</span>
              <div class="cat-bar-wrap">
                <div class="cat-bar-fill" style="width:${pct}%"></div>
              </div>
              <span class="cat-amount">${Utils.formatCurrency(c.amount)}</span>
              <span class="cat-pct">${Math.round(pct)}%</span>
            </div>
          `;
        }).join('');
      }
    }
  };

  const init = () => {
    populateYears();
    document.getElementById('reportYear')?.addEventListener('change', render);
  };

  return { render, populateYears, init };
})();

window.Reports = Reports;
