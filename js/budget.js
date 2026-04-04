/**
 * FinTrack Pro — Budget Module v2.0
 * • Event delegation (no inline onclick)
 * • Visual progress with animated bars
 * • Over-budget alerts
 * • Budget vs actual comparison
 */

const Budget = (() => {
  const getAll  = () => Storage.get('budgets', []);
  const save    = (b) => Storage.set('budgets', b);

  const upsert = (data) => {
    const all = getAll();
    const idx = all.findIndex(b => b.id === data.id);
    if (idx > -1) all[idx] = { ...all[idx], ...data };
    else all.push({ ...data, id: data.id || Utils.uid() });
    save(all);
  };

  const remove = (id) => save(getAll().filter(b => b.id !== id));

  // ── Monthly spending per category ──────────────────────
  const getMonthlySpending = () => {
    const month = Utils.currentMonth();
    const spending = {};
    Transactions.getAll()
      .filter(t => t.type === 'expense' && t.date.startsWith(month))
      .forEach(t => { spending[t.category] = (spending[t.category] || 0) + t.amount; });
    return spending;
  };

  // ── Render ─────────────────────────────────────────────
  const render = () => {
    const budgets  = getAll();
    const spending = getMonthlySpending();

    // Overview cards
    const ovEl = document.getElementById('budgetOverview');
    if (ovEl) {
      const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
      const totalSpent  = budgets.reduce((s, b) => s + (spending[b.category] || 0), 0);
      const remaining   = totalBudget - totalSpent;
      const overallPct  = totalBudget > 0 ? Utils.clamp((totalSpent / totalBudget) * 100, 0, 100) : 0;
      const ovStatus    = remaining < 0 ? 'over' : overallPct >= 80 ? 'warn' : 'safe';
      const statusColor = { safe: 'var(--income)', warn: 'var(--gold)', over: 'var(--expense)' }[ovStatus];

      ovEl.innerHTML = `
        <div class="budget-ov-card">
          <div class="budget-ov-label">Total Budget</div>
          <div class="budget-ov-amount" style="color:var(--balance)">${Utils.formatCurrency(totalBudget)}</div>
          <div class="budget-ov-sub">${budgets.length} categories</div>
        </div>
        <div class="budget-ov-card">
          <div class="budget-ov-label">Total Spent</div>
          <div class="budget-ov-amount" style="color:var(--expense)">${Utils.formatCurrency(totalSpent)}</div>
          <div class="budget-ov-sub">${Math.round(overallPct)}% of budget used</div>
        </div>
        <div class="budget-ov-card">
          <div class="budget-ov-label">Remaining</div>
          <div class="budget-ov-amount" style="color:${statusColor}">
            ${remaining < 0 ? '-' : ''}${Utils.formatCurrency(Math.abs(remaining))}
          </div>
          <div class="budget-ov-sub">${remaining < 0 ? 'Over budget' : 'Available to spend'}</div>
        </div>`;
    }

    const listEl  = document.getElementById('budgetList');
    const emptyEl = document.getElementById('noBudgets');
    if (!listEl) return;

    if (budgets.length === 0) {
      listEl.innerHTML = '';
      emptyEl && (emptyEl.hidden = false);
      return;
    }
    emptyEl && (emptyEl.hidden = true);

    // Sort: over-budget first, then by pct desc
    const sorted = [...budgets].sort((a, b) => {
      const pA = (spending[a.category] || 0) / a.amount;
      const pB = (spending[b.category] || 0) / b.amount;
      return pB - pA;
    });

    listEl.innerHTML = sorted.map(b => {
      const spent     = spending[b.category] || 0;
      const pct       = Utils.clamp((spent / b.amount) * 100, 0, 100);
      const over      = spent > b.amount;
      const warnLevel = pct >= 100 ? 'over' : pct >= 80 ? 'warn' : 'safe';
      const statusTxt = over
        ? `Over by ${Utils.formatCurrency(spent - b.amount)}`
        : `${Utils.formatCurrency(b.amount - spent)} remaining`;
      const alertIcon = pct >= 100 ? '🔴' : pct >= 80 ? '🟡' : '🟢';

      return `
        <div class="budget-item${over ? ' budget-item--over' : ''}" data-id="${Utils.escHtml(b.id)}">
          <div class="budget-item-header">
            <div class="budget-item-info">
              <span class="budget-alert-icon" aria-hidden="true">${alertIcon}</span>
              <div>
                <div class="budget-item-name">${Utils.escHtml(b.category)}</div>
                <div class="budget-item-amounts">
                  <span style="color:${over ? 'var(--expense)' : 'var(--text-secondary)'}">${Utils.formatCurrency(spent)}</span>
                  <span style="color:var(--text-muted)"> / ${Utils.formatCurrency(b.amount)}</span>
                </div>
              </div>
            </div>
            <div class="action-btns">
              <button class="action-btn edit-btn" data-action="edit" data-id="${Utils.escHtml(b.id)}" aria-label="Edit budget">✏</button>
              <button class="action-btn action-btn--del" data-action="delete" data-id="${Utils.escHtml(b.id)}" aria-label="Delete budget">🗑</button>
            </div>
          </div>
          <div class="progress-bar" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100" aria-label="${b.category} budget ${Math.round(pct)}% used">
            <div class="progress-fill ${warnLevel}" style="width:${pct}%"></div>
          </div>
          <div class="budget-status">
            <span>${Math.round(pct)}% used</span>
            <span style="color:${over ? 'var(--expense)' : warnLevel === 'warn' ? 'var(--gold)' : 'var(--income)'}">${statusTxt}</span>
          </div>
        </div>`;
    }).join('');
  };

  // ── Modal helpers ──────────────────────────────────────
  const populateCategoryDropdown = (excludeExisting = [], currentCat = null) => {
    const sel = document.getElementById('budgetCategory');
    if (!sel) return;
    const existing = new Set(getAll().map(b => b.category));
    const cats = AppState.settings.expenseCategories.filter(c => c === currentCat || !existing.has(c));
    sel.innerHTML = cats.length
      ? cats.map(c => `<option value="${Utils.escHtml(c)}"${c === currentCat ? ' selected' : ''}>${Utils.escHtml(c)}</option>`).join('')
      : '<option value="">No more categories to add</option>';
  };

  const openAdd = () => {
    document.getElementById('budgetModalTitle').textContent = 'Add Budget';
    document.getElementById('budgetForm').reset();
    document.getElementById('budgetForm').removeAttribute('data-id');
    populateCategoryDropdown();
    Modal.open('budgetModal');
  };

  const openEdit = (id) => {
    const b = getAll().find(b => b.id === id);
    if (!b) return;
    document.getElementById('budgetModalTitle').textContent = 'Edit Budget';
    document.getElementById('budgetForm').setAttribute('data-id', id);
    populateCategoryDropdown([], b.category);
    document.getElementById('budgetAmount').value = b.amount;
    Modal.open('budgetModal');
  };

  const confirmDelete = (id) => {
    const b = getAll().find(b => b.id === id);
    if (!b) return;
    document.getElementById('confirmMessage').textContent = `Delete budget for "${b.category}"?`;
    document.getElementById('confirmDeleteBtn').dataset.pendingType = 'budget';
    document.getElementById('confirmDeleteBtn').dataset.pendingId   = id;
    Modal.open('confirmModal');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const id       = e.target.getAttribute('data-id') || null;
    const category = document.getElementById('budgetCategory').value;
    const amount   = parseFloat(document.getElementById('budgetAmount').value);

    if (!category || !amount || amount <= 0) {
      Utils.toast('Please fill in all fields', 'error'); return;
    }
    if (!id && getAll().find(b => b.category === category)) {
      Utils.toast('Budget for this category already exists', 'warning'); return;
    }
    upsert({ id, category, amount });
    Modal.close('budgetModal');
    render();
    Utils.toast(id ? '✓ Budget updated' : '✓ Budget added', 'success');
  };

  // ── Init ───────────────────────────────────────────────
  const init = () => {
    document.getElementById('addBudgetBtn')?.addEventListener('click', openAdd);
    document.getElementById('budgetForm')  ?.addEventListener('submit', handleSubmit);

    // Event delegation for list actions
    document.getElementById('budgetList')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { action, id } = btn.dataset;
      if (action === 'edit')   openEdit(id);
      if (action === 'delete') confirmDelete(id);
    });
  };

  return { getAll, upsert, remove, render, openAdd, openEdit, confirmDelete, init };
})();

window.Budget = Budget;
