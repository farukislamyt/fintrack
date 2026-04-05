/**
 * FinTrack Pro — Budget v3.0
 * FIXED: spread order bug
 */
const Budget = (() => {
  const getAll = () => Storage.get('budgets', []);
  const save   = (d) => Storage.set('budgets', d);

  // FIX: ...data first, then override id
  const upsert = (data) => {
    const all = getAll();
    const existingId = data.id && data.id !== 'null' ? data.id : null;
    const idx = existingId ? all.findIndex(b => b.id === existingId) : -1;
    if (idx > -1) all[idx] = { ...all[idx], ...data, id: existingId };
    else all.push({ ...data, id: Utils.uid() });
    save(all);
  };

  const remove = (id) => save(getAll().filter(b => b.id !== id));

  const getMonthlySpending = () => {
    const month = Utils.currentMonth();
    const sp = {};
    Transactions.getAll().filter(t => t.type==='expense' && t.date.startsWith(month))
      .forEach(t => { sp[t.category] = (sp[t.category]||0) + t.amount; });
    return sp;
  };

  const render = () => {
    const budgets = getAll(), sp = getMonthlySpending();
    const ovEl = document.getElementById('budgetOverview');
    if (ovEl) {
      const tot  = budgets.reduce((s,b) => s+b.amount, 0);
      const used = budgets.reduce((s,b) => s+(sp[b.category]||0), 0);
      const rem  = tot - used;
      const pct  = tot > 0 ? Utils.clamp((used/tot)*100,0,100) : 0;
      const col  = rem<0?'var(--expense)':pct>=80?'var(--gold)':'var(--income)';
      ovEl.innerHTML = `
        <div class="budget-ov-card"><div class="budget-ov-label">Total Budget</div><div class="budget-ov-amount" style="color:var(--balance)">${Utils.formatCurrency(tot)}</div><div class="budget-ov-sub">${budgets.length} categories</div></div>
        <div class="budget-ov-card"><div class="budget-ov-label">Total Spent</div><div class="budget-ov-amount" style="color:var(--expense)">${Utils.formatCurrency(used)}</div><div class="budget-ov-sub">${Math.round(pct)}% used</div></div>
        <div class="budget-ov-card"><div class="budget-ov-label">Remaining</div><div class="budget-ov-amount" style="color:${col}">${rem<0?'-':''}${Utils.formatCurrency(Math.abs(rem))}</div><div class="budget-ov-sub">${rem<0?'Over budget':'Available'}</div></div>`;
    }
    const listEl = document.getElementById('budgetList');
    const emptyEl = document.getElementById('noBudgets');
    if (!listEl) return;
    if (!budgets.length) { listEl.innerHTML=''; if(emptyEl) emptyEl.hidden=false; return; }
    if (emptyEl) emptyEl.hidden = true;
    const sorted = [...budgets].sort((a,b) => ((sp[b.category]||0)/b.amount) - ((sp[a.category]||0)/a.amount));
    listEl.innerHTML = sorted.map(b => {
      const spent = sp[b.category]||0;
      const pct   = Utils.clamp((spent/b.amount)*100,0,100);
      const over  = spent > b.amount;
      const lvl   = pct>=100?'over':pct>=80?'warn':'safe';
      const icon  = pct>=100?'🔴':pct>=80?'🟡':'🟢';
      const statCol = over?'var(--expense)':pct>=80?'var(--gold)':'var(--income)';
      return `<div class="budget-item${over?' budget-item--over':''}" data-id="${Utils.escHtml(b.id)}">
        <div class="budget-item-header">
          <div class="budget-item-info"><span class="budget-alert-icon">${icon}</span>
            <div><div class="budget-item-name">${Utils.escHtml(b.category)}</div>
            <div class="budget-item-amounts"><span style="color:${over?'var(--expense)':'var(--text-secondary)'}">${Utils.formatCurrency(spent)}</span><span style="color:var(--text-muted)"> / ${Utils.formatCurrency(b.amount)}</span></div></div>
          </div>
          <div class="action-btns">
            <button class="action-btn" data-action="edit" data-id="${Utils.escHtml(b.id)}" aria-label="Edit budget">✏</button>
            <button class="action-btn action-btn--del" data-action="delete" data-id="${Utils.escHtml(b.id)}" aria-label="Delete budget">🗑</button>
          </div>
        </div>
        <div class="progress-bar" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100">
          <div class="progress-fill ${lvl}" style="width:${pct}%"></div>
        </div>
        <div class="budget-status"><span>${Math.round(pct)}% used</span><span style="color:${statCol}">${over?`Over by ${Utils.formatCurrency(spent-b.amount)}`:`${Utils.formatCurrency(b.amount-spent)} remaining`}</span></div>
      </div>`;
    }).join('');
  };

  const openAdd = () => {
    document.getElementById('budgetModalTitle').textContent = 'Add Budget';
    document.getElementById('budgetForm').reset();
    document.getElementById('budgetForm').removeAttribute('data-id');
    populateCats();
    Modal.open('budgetModal');
  };

  const openEdit = (id) => {
    const b = getAll().find(b => b.id===id);
    if (!b) return;
    document.getElementById('budgetModalTitle').textContent = 'Edit Budget';
    document.getElementById('budgetForm').setAttribute('data-id', id);
    populateCats(b.category);
    document.getElementById('budgetAmount').value = b.amount;
    Modal.open('budgetModal');
  };

  const confirmDelete = (id) => {
    const b = getAll().find(b => b.id===id);
    if (!b) return;
    ConfirmModal.show(`Delete budget for "${b.category}"?`, () => {
      remove(id); render(); Utils.toast('Budget deleted', 'success');
    });
  };

  const populateCats = (current=null) => {
    const sel = document.getElementById('budgetCategory');
    if (!sel) return;
    const existing = new Set(getAll().map(b=>b.category));
    const cats = AppState.settings.expenseCategories.filter(c => c===current || !existing.has(c));
    sel.innerHTML = cats.length
      ? cats.map(c=>`<option value="${Utils.escHtml(c)}"${c===current?' selected':''}>${Utils.escHtml(c)}</option>`).join('')
      : '<option value="">All categories budgeted</option>';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const rawId = e.target.getAttribute('data-id');
    const id    = (rawId && rawId!=='null') ? rawId : null;
    const cat   = document.getElementById('budgetCategory').value;
    const amt   = parseFloat(document.getElementById('budgetAmount').value);
    if (!cat || !amt || amt<=0) { Utils.toast('Fill in all fields', 'error'); return; }
    if (!id && getAll().find(b=>b.category===cat)) { Utils.toast('Budget already exists for this category', 'warning'); return; }
    upsert({ id, category: cat, amount: amt });
    Modal.close('budgetModal');
    render();
    Utils.toast(id ? '✓ Budget updated' : '✓ Budget added', 'success');
  };

  const init = () => {
    document.getElementById('addBudgetBtn')?.addEventListener('click', openAdd);
    document.getElementById('budgetForm')?.addEventListener('submit', handleSubmit);
    document.getElementById('budgetList')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      if (btn.dataset.action==='edit')   openEdit(btn.dataset.id);
      if (btn.dataset.action==='delete') confirmDelete(btn.dataset.id);
    });
  };

  return { getAll, upsert, remove, render, openAdd, openEdit, confirmDelete, init };
})();
window.Budget = Budget;
