/**
 * FinTrack Pro — Transactions v3.0
 * FIXED: spread order bug (id was overwritten by null from data spread)
 */
const Transactions = (() => {
  let sortField = 'date', sortDir = -1, curPage = 1;
  const PER = 12;
  let renderDebounce = null;

  const getAll = () => Storage.get('transactions', []);
  const save   = (d) => Storage.set('transactions', d);

  // FIX: generate id FIRST, then spread data, then override id to ensure it's never null
  const upsert = (data) => {
    const all = getAll();
    const existingId = data.id && data.id !== 'null' ? data.id : null;
    const idx = existingId ? all.findIndex(t => t.id === existingId) : -1;
    if (idx > -1) {
      all[idx] = { ...all[idx], ...data, id: existingId, updatedAt: new Date().toISOString() };
    } else {
      const newId = Utils.uid();
      // CRITICAL FIX: put ...data FIRST, then override id so null never wins
      all.unshift({ ...data, id: newId, createdAt: new Date().toISOString() });
    }
    return save(all);
  };

  const remove     = (id) => save(getAll().filter(t => t.id !== id));
  const bulkRemove = (ids) => { const s = new Set(ids); save(getAll().filter(t => !s.has(t.id))); };

  // ── Optimized Filters & Sort ──────────────────────────────
  const applyFilters = (txns, { search, type, category, month }) => {
    const q = (search || '').toLowerCase();
    if (!q && !type && !category && !month) return txns; // Fast path: no filters
    
    return txns.filter(t => {
      if (q && !t.description.toLowerCase().includes(q) && !t.category.toLowerCase().includes(q) && !(t.notes||'').toLowerCase().includes(q)) return false;
      if (type && type !== 'all' && t.type !== type) return false;
      if (category && category !== 'all' && t.category !== category) return false;
      if (month && !t.date.startsWith(month)) return false;
      return true;
    });
  };

  const applySort = (txns) => [...txns].sort((a,b) => {
    let vA = a[sortField], vB = b[sortField];
    if (sortField === 'amount') { vA = +vA; vB = +vB; }
    return vA < vB ? -sortDir : vA > vB ? sortDir : 0;
  });

  // ── Render Table ─────────────────────────────────────────
  const renderTable = () => {
    const search   = document.getElementById('searchInput')?.value.trim() || '';
    const type     = document.getElementById('filterType')?.value || 'all';
    const category = document.getElementById('filterCategory')?.value || 'all';
    const month    = document.getElementById('filterMonth')?.value || '';

    const all      = getAll();
    const filtered = applySort(applyFilters(all, { search, type, category, month }));
    const total    = filtered.length;
    const pages    = Math.max(1, Math.ceil(total / PER));
    if (curPage > pages) curPage = 1;
    const paged = filtered.slice((curPage - 1) * PER, curPage * PER);

    const tbody  = document.getElementById('transactionTableBody');
    const emptyEl = document.getElementById('noTransactions');
    if (!tbody) return;

    const countEl = document.getElementById('txnResultCount');
    if (countEl) countEl.textContent = `${total} result${total !== 1 ? 's' : ''}`;

    if (!total) {
      tbody.innerHTML = '';
      if (emptyEl) emptyEl.hidden = false;
    } else {
      if (emptyEl) emptyEl.hidden = true;
      const payIcons = { cash:'💵', card:'💳', bank:'🏦', mobile:'📱', other:'•' };
      tbody.innerHTML = paged.map(t => `
        <tr>
          <td><div class="date-cell"><b>${Utils.formatDate(t.date)}</b><small>${Utils.formatRelativeDate(t.date)}</small></div></td>
          <td><div class="desc-cell"><span class="desc-name" title="${Utils.escHtml(t.description)}">${Utils.escHtml(t.description)}</span>${t.notes?`<small class="desc-note">${Utils.escHtml(t.notes)}</small>`:''}${t.recurring?`<span class="rec-badge" title="${t.recurringFreq||'monthly'}">↻</span>`:''}</div></td>
          <td><span class="cat-badge">${Utils.escHtml(t.category)}</span></td>
          <td><span class="badge ${t.type}">${t.type}</span></td>
          <td class="amount-cell ${t.type}">${t.type==='income'?'+':'-'}${Utils.formatCurrency(t.amount)}</td>
          <td><span class="pay-badge">${payIcons[t.payment]||'•'} ${Utils.escHtml(t.payment||'')}</span></td>
          <td>
            <div class="action-btns">
              <button class="action-btn" data-action="edit" data-id="${Utils.escHtml(t.id)}" aria-label="Edit">✏</button>
              <button class="action-btn action-btn--del" data-action="delete" data-id="${Utils.escHtml(t.id)}" aria-label="Delete">🗑</button>
            </div>
          </td>
        </tr>`).join('');
    }
    renderPagination(pages, total);
    updateFilterCategories(all);
    updateSortIcons();
  };

  const renderPagination = (pages, total) => {
    const el = document.getElementById('pagination');
    if (!el) return;
    if (pages <= 1) { el.innerHTML = ''; return; }
    const start = (curPage-1)*PER+1, end = Math.min(curPage*PER, total);
    let h = `<span class="pag-info">${start}–${end} of ${total}</span>`;
    h += `<button class="page-btn" data-page="${curPage-1}" ${curPage===1?'disabled':''}>‹</button>`;
    for (let i = 1; i <= pages; i++) {
      if (i===1||i===pages||Math.abs(i-curPage)<=1) h += `<button class="page-btn${i===curPage?' active':''}" data-page="${i}">${i}</button>`;
      else if (Math.abs(i-curPage)===2) h += `<span class="page-ellipsis">…</span>`;
    }
    h += `<button class="page-btn" data-page="${curPage+1}" ${curPage===pages?'disabled':''}>›</button>`;
    el.innerHTML = h;
  };

  const updateFilterCategories = (txns) => {
    const sel = document.getElementById('filterCategory');
    if (!sel) return;
    const cur  = sel.value;
    const cats = [...new Set(txns.map(t => t.category))].sort();
    sel.innerHTML = '<option value="all">All Categories</option>' +
      cats.map(c => `<option value="${Utils.escHtml(c)}"${c===cur?' selected':''}>${Utils.escHtml(c)}</option>`).join('');
  };

  const setSort = (field) => { sortDir = sortField===field ? -sortDir : -1; sortField = field; curPage = 1; renderTable(); };

  const updateSortIcons = () => {
    document.querySelectorAll('[data-sort]').forEach(th => {
      const icon = th.querySelector('.sort-icon');
      if (!icon) return;
      icon.textContent = th.dataset.sort === sortField ? (sortDir===-1?'↓':'↑') : '↕';
      icon.style.opacity = th.dataset.sort === sortField ? '1' : '0.3';
    });
  };

  // ── Form helpers ─────────────────────────────────────────
  const setActiveType = (type) => {
    document.querySelectorAll('.type-btn').forEach(b => b.classList.toggle('active', b.dataset.type===type));
    populateCatDropdown(type);
  };

  const populateCatDropdown = (type) => {
    const sel = document.getElementById('txnCategory');
    if (!sel) return;
    const cats = type === 'income' ? AppState.settings.incomeCategories : AppState.settings.expenseCategories;
    sel.innerHTML = cats.map(c => `<option value="${Utils.escHtml(c)}">${Utils.escHtml(c)}</option>`).join('');
  };

  // ── Open Add / Edit ───────────────────────────────────────
  const openAdd = (defType = 'expense') => {
    const form = document.getElementById('transactionForm');
    document.getElementById('txnModalTitle').textContent = 'Add Transaction';
    document.getElementById('txnSubmitBtn').textContent  = 'Add Transaction';
    form.reset();
    form.removeAttribute('data-id');
    form.querySelectorAll('.field-error').forEach(e => e.textContent='');
    form.querySelectorAll('.invalid').forEach(e => e.classList.remove('invalid'));
    document.getElementById('txnDate').value = Utils.today();
    document.getElementById('recurringGroup').hidden = true;
    setActiveType(defType);
    Modal.open('transactionModal');
  };

  const openEdit = (id) => {
    const t = getAll().find(t => t.id === id);
    if (!t) return;
    const form = document.getElementById('transactionForm');
    document.getElementById('txnModalTitle').textContent = 'Edit Transaction';
    document.getElementById('txnSubmitBtn').textContent  = 'Save Changes';
    form.setAttribute('data-id', id);
    form.querySelectorAll('.field-error').forEach(e => e.textContent='');
    setActiveType(t.type);
    document.getElementById('txnAmount').value        = t.amount;
    document.getElementById('txnDate').value          = t.date;
    document.getElementById('txnDescription').value   = t.description;
    document.getElementById('txnPayment').value        = t.payment || 'cash';
    document.getElementById('txnNotes').value          = t.notes || '';
    document.getElementById('txnRecurring').checked   = !!t.recurring;
    document.getElementById('recurringGroup').hidden  = !t.recurring;
    document.getElementById('txnRecurringFreq').value = t.recurringFreq || 'monthly';
    requestAnimationFrame(() => { const s = document.getElementById('txnCategory'); if(s) s.value = t.category; });
    Modal.open('transactionModal');
  };

  const confirmDelete = (id) => {
    const t = getAll().find(t => t.id === id);
    if (!t) return;
    ConfirmModal.show(`Delete "${t.description}"? This cannot be undone.`, () => {
      remove(id); renderTable(); App.refreshDashboard();
      Utils.toast('Transaction deleted', 'success');
    });
  };

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const rawId = form.getAttribute('data-id');
    // Only use existing id if it's a real non-empty string
    const id = (rawId && rawId !== 'null' && rawId !== 'undefined') ? rawId : null;

    const type   = document.querySelector('.type-btn.active')?.dataset.type || 'expense';
    const amount = parseFloat(document.getElementById('txnAmount').value);
    const date   = document.getElementById('txnDate').value;
    const desc   = document.getElementById('txnDescription').value.trim();
    const cat    = document.getElementById('txnCategory').value;
    const pay    = document.getElementById('txnPayment').value;
    const notes  = document.getElementById('txnNotes').value.trim();
    const recur  = document.getElementById('txnRecurring').checked;
    const freq   = document.getElementById('txnRecurringFreq').value;

    let ok = true;
    const setErr = (fid, msg) => {
      const err = document.getElementById(fid+'Error');
      if (err) err.textContent = msg;
      const inp = document.getElementById(fid);
      if (inp) inp.classList.toggle('invalid', !!msg);
      if (msg) ok = false;
    };
    
    // ── Enhanced Validation ──────────────────────────────────
    const validAmount = Utils.isValidAmount(amount);
    const validDate = Utils.isValidDate(date);
    
    setErr('txnAmount',      !validAmount ? 'Enter a valid amount (> 0)' : '');
    setErr('txnDate',        !validDate   ? 'Select a valid date'       : '');
    setErr('txnDescription', !desc        ? 'Enter a description'       : '');
    setErr('txnCategory',    !cat         ? 'Select a category'         : '');
    if (!ok) return;

    upsert({ id, type, amount, date, description: desc, category: cat, payment: pay, notes, recurring: recur, recurringFreq: freq });
    Modal.close('transactionModal');
    renderTable();
    App.refreshDashboard();
    Utils.toast(id ? '✓ Transaction updated' : '✓ Transaction added', 'success');
  };

  // ── Recent for dashboard ──────────────────────────────────
  const renderRecent = (limit = 8, period = 'month') => {
    const el = document.getElementById('recentTransactions');
    if (!el) return;
    let txns = Utils.filterByPeriod(getAll(), period);
    txns = txns.sort((a,b) => b.date.localeCompare(a.date)).slice(0, limit);
    if (!txns.length) {
      el.innerHTML = `<div class="empty-state" style="padding:28px 0"><div class="empty-icon">⇄</div><p>No transactions this period.</p></div>`;
      return;
    }
    el.innerHTML = txns.map(t => `
      <div class="txn-item" role="listitem">
        <div class="txn-icon ${t.type}">${t.type==='income'?'↑':'↓'}</div>
        <div class="txn-info">
          <div class="txn-name">${Utils.escHtml(t.description)}</div>
          <div class="txn-meta">${Utils.formatDate(t.date)} · ${Utils.escHtml(t.category)}</div>
        </div>
        <div class="txn-amount ${t.type}">${t.type==='income'?'+':'-'}${Utils.formatCurrency(t.amount)}</div>
      </div>`).join('');
  };

  // ── Init ──────────────────────────────────────────────────
  const init = () => {
    document.getElementById('transactionForm')?.addEventListener('submit', handleSubmit);
    document.getElementById('quickAddBtn')?.addEventListener('click', () => openAdd());
    document.getElementById('emptyAddBtn')?.addEventListener('click', () => openAdd());
    document.querySelectorAll('.type-btn').forEach(b => b.addEventListener('click', () => setActiveType(b.dataset.type)));
    document.getElementById('txnRecurring')?.addEventListener('change', e => { document.getElementById('recurringGroup').hidden = !e.target.checked; });
    document.querySelectorAll('[data-sort]').forEach(th => th.addEventListener('click', () => setSort(th.dataset.sort)));

    const dRender = Utils.debounce(renderTable, 220);
    document.getElementById('searchInput')?.addEventListener('input', dRender);
    ['filterType','filterCategory','filterMonth'].forEach(id => document.getElementById(id)?.addEventListener('change', renderTable));
    document.getElementById('clearFilters')?.addEventListener('click', () => {
      ['searchInput','filterType','filterCategory','filterMonth'].forEach(id => { const el = document.getElementById(id); if(el) el.value = el.tagName==='SELECT'?(id==='filterType'||id==='filterCategory'?'all':''):''; });
      curPage = 1; renderTable();
    });

    document.getElementById('transactionTableBody')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      if (btn.dataset.action === 'edit')   openEdit(btn.dataset.id);
      if (btn.dataset.action === 'delete') confirmDelete(btn.dataset.id);
    });

    document.getElementById('pagination')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-page]');
      if (!btn || btn.disabled) return;
      const p = parseInt(btn.dataset.page);
      if (!isNaN(p) && p >= 1) { curPage = p; renderTable(); }
    });

    ['txnAmount','txnDate','txnDescription','txnCategory'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => {
        document.getElementById(id+'Error') && (document.getElementById(id+'Error').textContent='');
        document.getElementById(id)?.classList.remove('invalid');
      });
    });
  };

  return { getAll, upsert, remove, bulkRemove, renderTable, renderRecent, openAdd, openEdit, confirmDelete, init };
})();
window.Transactions = Transactions;
