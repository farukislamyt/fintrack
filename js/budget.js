/**
 * FinTrack Budget Module
 */

const Budget = (() => {
  const getAll = () => Storage.get('budgets') || [];
  const save = (budgets) => Storage.set('budgets', budgets);

  const upsert = (data) => {
    const all = getAll();
    const idx = all.findIndex(b => b.id === data.id);
    if (idx > -1) all[idx] = { ...all[idx], ...data };
    else all.push({ id: Utils.uid(), ...data });
    save(all);
  };

  const remove = (id) => save(getAll().filter(b => b.id !== id));

  // Get spending per category for current month
  const getMonthlySpending = () => {
    const month = Utils.currentMonth();
    const transactions = Transactions.getAll().filter(t =>
      t.type === 'expense' && t.date.startsWith(month)
    );
    const spending = {};
    transactions.forEach(t => {
      spending[t.category] = (spending[t.category] || 0) + t.amount;
    });
    return spending;
  };

  const render = () => {
    const budgets = getAll();
    const spending = getMonthlySpending();

    // Overview cards
    const overviewEl = document.getElementById('budgetOverview');
    if (overviewEl) {
      const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
      const totalSpent = budgets.reduce((s, b) => s + (spending[b.category] || 0), 0);
      const remaining = totalBudget - totalSpent;
      overviewEl.innerHTML = `
        <div class="budget-ov-card">
          <div class="budget-ov-label">Total Budget</div>
          <div class="budget-ov-amount" style="color:var(--balance)">${Utils.formatCurrency(totalBudget)}</div>
        </div>
        <div class="budget-ov-card">
          <div class="budget-ov-label">Total Spent</div>
          <div class="budget-ov-amount" style="color:var(--expense)">${Utils.formatCurrency(totalSpent)}</div>
        </div>
        <div class="budget-ov-card">
          <div class="budget-ov-label">Remaining</div>
          <div class="budget-ov-amount" style="color:${remaining >= 0 ? 'var(--income)' : 'var(--expense)'}">${Utils.formatCurrency(Math.abs(remaining))}${remaining < 0 ? ' over' : ''}</div>
        </div>
      `;
    }

    const listEl = document.getElementById('budgetList');
    const emptyEl = document.getElementById('noBudgets');
    if (!listEl) return;

    if (budgets.length === 0) {
      listEl.innerHTML = '';
      emptyEl && (emptyEl.hidden = false);
      return;
    }
    emptyEl && (emptyEl.hidden = true);

    listEl.innerHTML = budgets.map(b => {
      const spent = spending[b.category] || 0;
      const pct = Math.min((spent / b.amount) * 100, 100);
      const overBudget = spent > b.amount;
      const warnLevel = pct >= 100 ? 'over' : pct >= 80 ? 'warn' : 'safe';
      const statusText = overBudget
        ? `Over by ${Utils.formatCurrency(spent - b.amount)}`
        : `${Utils.formatCurrency(b.amount - spent)} remaining`;

      return `
        <div class="budget-item">
          <div class="budget-item-header">
            <div>
              <div class="budget-item-name">${Utils.escHtml(b.category)}</div>
              <div class="budget-item-amounts">${Utils.formatCurrency(spent)} / ${Utils.formatCurrency(b.amount)}</div>
            </div>
            <div class="action-btns">
              <button class="action-btn" onclick="Budget.openEdit('${b.id}')" aria-label="Edit">✏</button>
              <button class="action-btn delete" onclick="Budget.confirmDelete('${b.id}')" aria-label="Delete">🗑</button>
            </div>
          </div>
          <div class="progress-bar" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-fill ${warnLevel}" style="width:${pct}%"></div>
          </div>
          <div class="budget-status">${Math.round(pct)}% used · ${statusText}</div>
        </div>
      `;
    }).join('');
  };

  const openAdd = () => {
    document.getElementById('budgetModalTitle').textContent = 'Add Budget';
    document.getElementById('budgetForm').reset();
    document.getElementById('budgetForm').removeAttribute('data-id');
    populateBudgetCategories();
    Modal.open('budgetModal');
  };

  const openEdit = (id) => {
    const b = getAll().find(b => b.id === id);
    if (!b) return;
    document.getElementById('budgetModalTitle').textContent = 'Edit Budget';
    document.getElementById('budgetForm').setAttribute('data-id', id);
    populateBudgetCategories();
    document.getElementById('budgetCategory').value = b.category;
    document.getElementById('budgetAmount').value = b.amount;
    Modal.open('budgetModal');
  };

  const confirmDelete = (id) => {
    const b = getAll().find(b => b.id === id);
    if (!b) return;
    document.getElementById('confirmMessage').textContent = `Delete budget for "${b.category}"?`;
    document.getElementById('confirmDeleteBtn').onclick = () => {
      remove(id);
      Modal.close('confirmModal');
      render();
      Utils.toast('Budget deleted', 'success');
    };
    Modal.open('confirmModal');
  };

  const populateBudgetCategories = () => {
    const sel = document.getElementById('budgetCategory');
    if (!sel) return;
    const cats = AppState.settings.expenseCategories;
    sel.innerHTML = cats.map(c => `<option value="${Utils.escHtml(c)}">${Utils.escHtml(c)}</option>`).join('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const id = e.target.getAttribute('data-id');
    const category = document.getElementById('budgetCategory').value;
    const amount = parseFloat(document.getElementById('budgetAmount').value);
    if (!category || !amount || amount <= 0) {
      Utils.toast('Please fill in all fields', 'error');
      return;
    }
    // Check for duplicate category if adding new
    if (!id && getAll().find(b => b.category === category)) {
      Utils.toast('Budget for this category already exists', 'warning');
      return;
    }
    upsert({ id, category, amount });
    Modal.close('budgetModal');
    render();
    Utils.toast(id ? 'Budget updated' : 'Budget added', 'success');
  };

  const init = () => {
    document.getElementById('addBudgetBtn')?.addEventListener('click', openAdd);
    document.getElementById('budgetForm')?.addEventListener('submit', handleSubmit);
  };

  return { getAll, upsert, remove, render, openAdd, openEdit, confirmDelete, init };
})();

window.Budget = Budget;
