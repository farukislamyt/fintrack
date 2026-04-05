/**
 * FinTrack Pro — Reports v3.0
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
    const cur = sel.value || String(Utils.currentYear());
    sel.innerHTML = getYears().map(y => `<option value="${y}"${String(y)===cur?' selected':''}>${y}</option>`).join('');
  };

  const render = () => {
    const year   = parseInt(document.getElementById('reportYear')?.value) || Utils.currentYear();
    const all    = Transactions.getAll();
    const txns   = all.filter(t => new Date(t.date + 'T12:00:00').getFullYear() === year);
    const { income, expense } = Utils.summarize(txns);
    const savings = income - expense;
    const rate    = income > 0 ? (savings / income * 100) : 0;

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('annualIncome',   Utils.formatCurrency(income));
    set('annualExpenses', Utils.formatCurrency(expense));
    set('annualSavings',  Utils.formatCurrency(savings));
    const srEl = document.getElementById('annualSavingsRate');
    if (srEl) { srEl.textContent = `${rate.toFixed(1)}% savings rate`; srEl.style.color = rate>=20?'var(--income)':rate>=10?'var(--gold)':'var(--expense)'; }

    const monthly = Utils.groupByMonth(all, year);
    Charts.renderMonthly('monthlyChart', monthly);
    Charts.renderTrend('trendChart', monthly);
    renderCategoryBreakdown(txns);
    renderStats(txns, year, monthly);
  };

  const renderCategoryBreakdown = (txns) => {
    const el = document.getElementById('categoryBreakdown');
    if (!el) return;
    const breakdown = Utils.groupByCategory(txns, 'expense');
    const total     = breakdown.reduce((s, c) => s + c.amount, 0);
    if (!breakdown.length) { el.innerHTML = '<p class="empty-text">No expense data for this year.</p>'; return; }
    const colors = ['#4f8ef7','#ff4d6d','#00d28a','#f5b800','#3d9eff','#a78bfa','#34d399','#fb923c'];
    el.innerHTML = breakdown.map((c, i) => {
      const pct = total > 0 ? (c.amount / total * 100) : 0;
      return `<div class="cat-row">
        <span class="cat-name" title="${Utils.escHtml(c.category)}">${Utils.escHtml(c.category)}</span>
        <div class="cat-bar-wrap"><div class="cat-bar-fill" style="width:${pct}%;background:${colors[i%8]}"></div></div>
        <span class="cat-amount">${Utils.formatCurrency(c.amount)}</span>
        <span class="cat-pct">${pct.toFixed(1)}%</span>
      </div>`;
    }).join('');
  };

  const renderStats = (txns, year, monthly) => {
    const el = document.getElementById('reportStats');
    if (!el) return;
    const exp  = txns.filter(t => t.type==='expense');
    const inc  = txns.filter(t => t.type==='income');
    const actM = monthly.filter(m => m.income>0||m.expense>0).length || 1;
    const avgI = inc.reduce((s,t)=>s+t.amount,0) / actM;
    const avgE = exp.reduce((s,t)=>s+t.amount,0) / actM;
    const bigE = exp.reduce((m,t)=>t.amount>(m?.amount||0)?t:m, null);
    const bigI = inc.reduce((m,t)=>t.amount>(m?.amount||0)?t:m, null);
    const top  = Utils.groupByCategory(txns,'expense')[0];
    el.innerHTML = `<div class="stats-grid">
      <div class="stat-item"><div class="stat-label">Avg Monthly Income</div><div class="stat-value income">${Utils.formatCurrency(avgI)}</div></div>
      <div class="stat-item"><div class="stat-label">Avg Monthly Expense</div><div class="stat-value expense">${Utils.formatCurrency(avgE)}</div></div>
      <div class="stat-item"><div class="stat-label">Total Transactions</div><div class="stat-value">${txns.length}</div></div>
      ${top?`<div class="stat-item"><div class="stat-label">Top Expense Category</div><div class="stat-value">${Utils.escHtml(top.category)}</div><div class="stat-sub">${Utils.formatCurrency(top.amount)}</div></div>`:''}
      ${bigE?`<div class="stat-item"><div class="stat-label">Largest Expense</div><div class="stat-value expense">${Utils.formatCurrency(bigE.amount)}</div><div class="stat-sub">${Utils.escHtml(bigE.description)}</div></div>`:''}
      ${bigI?`<div class="stat-item"><div class="stat-label">Largest Income</div><div class="stat-value income">${Utils.formatCurrency(bigI.amount)}</div><div class="stat-sub">${Utils.escHtml(bigI.description)}</div></div>`:''}
    </div>`;
  };

  const init = () => {
    populateYears();
    document.getElementById('reportYear')?.addEventListener('change', render);
  };

  return { render, populateYears, init };
})();
window.Reports = Reports;
