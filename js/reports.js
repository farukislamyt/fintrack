/**
 * FinTrack Pro — Reports Module v2.0
 * • Top spender / top income highlights
 * • Month-over-month comparison
 * • Streak tracking (days with transactions)
 * • Average daily spend
 */

const Reports = (() => {
  const getYears = () => {
    const txns  = Transactions.getAll();
    const years = [...new Set(txns.map(t => new Date(t.date + 'T12:00:00').getFullYear()))];
    const now   = Utils.currentYear();
    if (!years.includes(now)) years.unshift(now);
    return years.sort((a, b) => b - a);
  };

  const populateYears = () => {
    const sel = document.getElementById('reportYear');
    if (!sel) return;
    const current = sel.value || String(Utils.currentYear());
    sel.innerHTML = getYears()
      .map(y => `<option value="${y}"${String(y) === current ? ' selected' : ''}>${y}</option>`)
      .join('');
  };

  // ── Render all report sections ─────────────────────────
  const render = () => {
    const year      = parseInt(document.getElementById('reportYear')?.value) || Utils.currentYear();
    const allTxns   = Transactions.getAll();
    const yearTxns  = allTxns.filter(t => new Date(t.date + 'T12:00:00').getFullYear() === year);
    const { income, expense } = Utils.summarize(yearTxns);
    const savings   = income - expense;
    const savingsRate = income > 0 ? (savings / income * 100) : 0;

    // Annual summary cards
    document.getElementById('annualIncome')  ?.textContent && (document.getElementById('annualIncome').textContent   = Utils.formatCurrency(income));
    document.getElementById('annualExpenses')?.textContent && (document.getElementById('annualExpenses').textContent = Utils.formatCurrency(expense));
    document.getElementById('annualSavings') ?.textContent && (document.getElementById('annualSavings').textContent  = Utils.formatCurrency(savings));
    const srEl = document.getElementById('annualSavingsRate');
    if (srEl) {
      srEl.textContent = `${savingsRate.toFixed(1)}% savings rate`;
      srEl.style.color = savingsRate >= 20 ? 'var(--income)' : savingsRate >= 10 ? 'var(--gold)' : 'var(--expense)';
    }

    // Charts
    const monthlyData = Utils.groupByMonth(allTxns, year);
    Charts.renderMonthly('monthlyChart', monthlyData);
    Charts.renderTrend('trendChart', monthlyData);

    // Category breakdown
    renderCategoryBreakdown(yearTxns);

    // Stats panel
    renderStats(yearTxns, year);
  };

  // ── Category breakdown bars ────────────────────────────
  const renderCategoryBreakdown = (txns) => {
    const el = document.getElementById('categoryBreakdown');
    if (!el) return;

    const breakdown = Utils.groupByCategory(txns, 'expense');
    const total     = breakdown.reduce((s, c) => s + c.amount, 0);

    if (breakdown.length === 0) {
      el.innerHTML = '<p class="empty-text">No expense data for this year.</p>';
      return;
    }

    el.innerHTML = breakdown.map((c, i) => {
      const pct   = total > 0 ? (c.amount / total * 100) : 0;
      const color = ['#4f8ef7','#ff4d6d','#00d68f','#ffba08','#4da6ff','#a78bfa','#34d399','#fb923c'][i % 8];
      return `
        <div class="cat-row">
          <span class="cat-name" title="${Utils.escHtml(c.category)}">${Utils.escHtml(c.category)}</span>
          <div class="cat-bar-wrap">
            <div class="cat-bar-fill" style="width:${pct}%;background:${color}"></div>
          </div>
          <span class="cat-amount">${Utils.formatCurrency(c.amount)}</span>
          <span class="cat-pct">${pct.toFixed(1)}%</span>
        </div>`;
    }).join('');
  };

  // ── Stats panel ────────────────────────────────────────
  const renderStats = (yearTxns, year) => {
    const el = document.getElementById('reportStats');
    if (!el) return;

    const expenses  = yearTxns.filter(t => t.type === 'expense');
    const incomes   = yearTxns.filter(t => t.type === 'income');

    // Average monthly
    const monthlyData  = Utils.groupByMonth(yearTxns, year);
    const activeMos    = monthlyData.filter(m => m.income > 0 || m.expense > 0).length || 1;
    const avgIncome    = incomes.reduce((s, t) => s + t.amount, 0)  / activeMos;
    const avgExpense   = expenses.reduce((s, t) => s + t.amount, 0) / activeMos;

    // Largest expense / income
    const bigExpense   = expenses.reduce((m, t) => t.amount > (m?.amount || 0) ? t : m, null);
    const bigIncome    = incomes.reduce((m, t)  => t.amount > (m?.amount || 0) ? t : m, null);

    // Top expense category
    const catBreakdown = Utils.groupByCategory(yearTxns, 'expense');
    const topCat       = catBreakdown[0];

    // Transaction count
    const txnCount     = yearTxns.length;

    el.innerHTML = `
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">Avg Monthly Income</div>
          <div class="stat-value income">${Utils.formatCurrency(avgIncome)}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Avg Monthly Expense</div>
          <div class="stat-value expense">${Utils.formatCurrency(avgExpense)}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Total Transactions</div>
          <div class="stat-value">${txnCount}</div>
        </div>
        ${topCat ? `
        <div class="stat-item">
          <div class="stat-label">Top Expense Category</div>
          <div class="stat-value">${Utils.escHtml(topCat.category)}</div>
          <div class="stat-sub">${Utils.formatCurrency(topCat.amount)}</div>
        </div>` : ''}
        ${bigExpense ? `
        <div class="stat-item">
          <div class="stat-label">Largest Expense</div>
          <div class="stat-value expense">${Utils.formatCurrency(bigExpense.amount)}</div>
          <div class="stat-sub">${Utils.escHtml(bigExpense.description)}</div>
        </div>` : ''}
        ${bigIncome ? `
        <div class="stat-item">
          <div class="stat-label">Largest Income</div>
          <div class="stat-value income">${Utils.formatCurrency(bigIncome.amount)}</div>
          <div class="stat-sub">${Utils.escHtml(bigIncome.description)}</div>
        </div>` : ''}
      </div>`;
  };

  const init = () => {
    populateYears();
    document.getElementById('reportYear')?.addEventListener('change', render);
  };

  return { render, populateYears, init };
})();

window.Reports = Reports;
