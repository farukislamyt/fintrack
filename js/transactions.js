/**
 * FinTrack Pro — Transactions Module v2.0
 * Fixes:
 * • Event delegation replaces inline onclick (XSS-safe)
 * • renderRecent sorts by date DESC before slicing
 * • Proper date sort (string compare works for YYYY-MM-DD)
 * • Input validation with visual feedback
 * • Bulk delete support
 * • Better pagination UX
 */

const Transactions = (() => {
  let sortField   = 'date';
  let sortDir     = -1;   // -1 = desc, 1 = asc
  let currentPage = 1;
  const PER_PAGE  = 12;

  // ── CRUD ───────────────────────────────────────────────
  const getAll = () => Storage.get('transactions', []);

  const save = (txns) => Storage.set('transactions', txns);

  const upsert = (data) => {
    const all = getAll();
    const idx = all.findIndex(t => t.id === data.id);
    if (idx > -1) {
      all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
    } else {
      all.unshift({
        id: data.id || Utils.uid(),
        createdAt: new Date().toISOString(),
        ...data
      });
    }
    return save(all);
  };

  const remove = (id) => {
    const filtered = getAll().filter(t => t.id !== id);
    save(filtered);
    return filtered;
  };

  const bulkRemove = (ids) => {
    const set = new Set(ids);
    const filtered = getAll().filter(t => !set.has(t.id));
    save(filtered);
    return filtered;
  };

  // ── Filter & Sort ──────────────────────────────────────
  const applyFilters = (txns, { search, type, category, month }) => {
    const q = (search || '').toLowerCase();
    return txns.filter(t => {
      if (q && !t.description.toLowerCase().includes(q) &&
               !t.category.toLowerCase().includes(q) &&
               !(t.notes || '').toLowerCase().includes(q)) return false;
      if (type && type !== 'all' && t.type !== type) return false;
      if (category && category !== 'all' && t.category !== category) return false;
      if (month && !t.date.startsWith(month)) return false;
      return true;
    });
  };

  const applySort = (txns) =>
    [...txns].sort((a, b) => {
      let vA = a[sortField], vB = b[sortField];
      if (sortField === 'amount') { vA = +vA; vB = +vB; }
      if (vA < vB) return -sortDir;
      if (vA > vB) return  sortDir;
      return 0;
    });

  // ── Render Table ───────────────────────────────────────
  const renderTable = () => {
    const search   = (document.getElementById('searchInput')?.value  || '').trim();
    const type     =  document.getElementById('filterType')?.value   || 'all';
    const category =  document.getElementById('filterCategory')?.value || 'all';
    const month    =  document.getElementById('filterMonth')?.value  || '';

    const all      = getAll();
    const filtered = applySort(applyFilters(all, { search, type, category, month }));
    const total    = filtered.length;
    const pages    = Math.max(1, Math.ceil(total / PER_PAGE));

    if (currentPage > pages) currentPage = 1;
    const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

    const tbody  = document.getElementById('transactionTableBody');
    const emptyEl = document.getElementById('noTransactions');
    if (!tbody) return;

    // Update result count
    const countEl = document.getElementById('txnResultCount');
    if (countEl) countEl.textContent = `${total} result${total !== 1 ? 's' : ''}`;

    if (total === 0) {
      tbody.innerHTML = '';
      emptyEl && (emptyEl.hidden = false);
    } else {
      emptyEl && (emptyEl.hidden = true);
      tbody.innerHTML = paginated.map(t => {
        const isIncome  = t.type === 'income';
        const amtColor  = isIncome ? 'var(--income)' : 'var(--expense)';
        const amtPrefix = isIncome ? '+' : '-';
        const payIcon   = { cash:'💵', card:'💳', bank:'🏦', mobile:'📱', other:'•' }[t.payment] || '•';
        return `
          <tr data-id="${Utils.escHtml(t.id)}">
            <td>
              <div class="txn-date-cell">
                <span class="txn-date-main">${Utils.formatDate(t.date)}</span>
                <span class="txn-date-rel">${Utils.formatRelativeDate(t.date)}</span>
              </div>
            </td>
            <td>
              <div class="txn-desc-wrap">
                <span class="txn-desc-name" title="${Utils.escHtml(t.description)}">${Utils.escHtml(t.description)}</span>
                ${t.notes ? `<span class="txn-desc-note">${Utils.escHtml(t.notes)}</span>` : ''}
                ${t.recurring ? `<span class="recurring-badge" title="${t.recurringFreq || 'monthly'}">↻</span>` : ''}
              </div>
            </td>
            <td><span class="cat-badge">${Utils.escHtml(t.category)}</span></td>
            <td><span class="badge ${t.type}">${t.type}</span></td>
            <td><span class="txn-amount" style="color:${amtColor};font-family:var(--font-mono)">${amtPrefix}${Utils.formatCurrency(t.amount)}</span></td>
            <td><span class="pay-badge" title="${t.payment || ''}">${payIcon} <span class="pay-label">${t.payment || ''}</span></span></td>
            <td>
              <div class="action-btns">
                <button class="action-btn edit-btn" data-action="edit" data-id="${Utils.escHtml(t.id)}" aria-label="Edit ${Utils.escHtml(t.description)}">✏</button>
                <button class="action-btn delete action-btn--del" data-action="delete" data-id="${Utils.escHtml(t.id)}" aria-label="Delete ${Utils.escHtml(t.description)}">🗑</button>
              </div>
            </td>
          </tr>`;
      }).join('');
    }

    renderPagination(pages, total);
    updateFilterCategories(all);
    updateSortIcons();
  };

  // ── Pagination ─────────────────────────────────────────
  const renderPagination = (totalPages, totalItems) => {
    const el = document.getElementById('pagination');
    if (!el) return;
    if (totalPages <= 1) { el.innerHTML = ''; return; }

    const start = (currentPage - 1) * PER_PAGE + 1;
    const end   = Math.min(currentPage * PER_PAGE, totalItems);

    let html = `<span class="pagination-info">${start}–${end} of ${totalItems}</span>`;
    html += `<button class="page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''} aria-label="Previous">‹</button>`;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
        html += `<button class="page-btn${i === currentPage ? ' active' : ''}" data-page="${i}" aria-label="Page ${i}" aria-current="${i === currentPage ? 'page' : 'false'}">${i}</button>`;
      } else if (Math.abs(i - currentPage) === 2) {
        html += `<span class="page-ellipsis">…</span>`;
      }
    }
    html += `<button class="page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''} aria-label="Next">›</button>`;
    el.innerHTML = html;
  };

  const goPage = (page) => {
    currentPage = page;
    renderTable();
    document.getElementById('page-transactions')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Category dropdown filter ───────────────────────────
  const updateFilterCategories = (txns) => {
    const sel = document.getElementById('filterCategory');
    if (!sel) return;
    const current = sel.value;
    const cats    = [...new Set(txns.map(t => t.category))].sort();
    sel.innerHTML = '<option value="all">All Categories</option>' +
      cats.map(c => `<option value="${Utils.escHtml(c)}"${c === current ? ' selected' : ''}>${Utils.escHtml(c)}</option>`).join('');
  };

  // ── Sort ───────────────────────────────────────────────
  const setSort = (field) => {
    sortDir   = sortField === field ? -sortDir : -1;
    sortField = field;
    currentPage = 1;
    renderTable();
  };

  const updateSortIcons = () => {
    document.querySelectorAll('[data-sort]').forEach(th => {
      const icon = th.querySelector('.sort-icon');
      if (!icon) return;
      icon.textContent = th.dataset.sort === sortField ? (sortDir === -1 ? '↓' : '↑') : '↕';
      icon.style.opacity = th.dataset.sort === sortField ? '1' : '0.3';
    });
  };

  // ── Form helpers ───────────────────────────────────────
  const setActiveType = (type) => {
    document.querySelectorAll('.type-btn').forEach(btn =>
      btn.classList.toggle('active', btn.dataset.type === type));
    populateCategoryDropdown(type);
  };

  const populateCategoryDropdown = (type) => {
    const sel  = document.getElementById('txnCategory');
    if (!sel) return;
    const cats = type === 'income'
      ? AppState.settings.incomeCategories
      : AppState.settings.expenseCategories;
    sel.innerHTML = cats.map(c => `<option value="${Utils.escHtml(c)}">${Utils.escHtml(c)}</option>`).join('');
  };

  // ── Open Add / Edit ────────────────────────────────────
  const openAdd = (defaultType = 'expense') => {
    const form = document.getElementById('transactionForm');
    document.getElementById('txnModalTitle').textContent = 'Add Transaction';
    document.getElementById('txnSubmitBtn').textContent  = 'Add Transaction';
    form.reset();
    form.removeAttribute('data-id');
    form.querySelectorAll('.field-error').forEach(e => e.textContent = '');
    document.getElementById('txnDate').value = Utils.today();
    document.getElementById('recurringGroup').hidden = true;
    setActiveType(defaultType);
    Modal.open('transactionModal');
  };

  const openEdit = (id) => {
    const t = getAll().find(t => t.id === id);
    if (!t) return;
    const form = document.getElementById('transactionForm');
    document.getElementById('txnModalTitle').textContent = 'Edit Transaction';
    document.getElementById('txnSubmitBtn').textContent  = 'Save Changes';
    form.setAttribute('data-id', id);
    form.querySelectorAll('.field-error').forEach(e => e.textContent = '');
    setActiveType(t.type);
    document.getElementById('txnAmount').value        = t.amount;
    document.getElementById('txnDate').value          = t.date;
    document.getElementById('txnDescription').value   = t.description;
    document.getElementById('txnPayment').value        = t.payment || 'cash';
    document.getElementById('txnNotes').value          = t.notes || '';
    document.getElementById('txnRecurring').checked   = !!t.recurring;
    document.getElementById('recurringGroup').hidden  = !t.recurring;
    document.getElementById('txnRecurringFreq').value = t.recurringFreq || 'monthly';
    // Set category after dropdown is populated
    requestAnimationFrame(() => {
      const sel = document.getElementById('txnCategory');
      if (sel) sel.value = t.category;
    });
    Modal.open('transactionModal');
  };

  const confirmDelete = (id) => {
    const t = getAll().find(t => t.id === id);
    if (!t) return;
    document.getElementById('confirmMessage').textContent =
      `Delete "${t.description}"? This cannot be undone.`;
    document.getElementById('confirmDeleteBtn').dataset.pendingId = id;
    Modal.open('confirmModal');
  };

  // ── Form Submit ────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    const form   = e.target;
    const id     = form.getAttribute('data-id') || null;
    const type   = document.querySelector('.type-btn.active')?.dataset.type || 'expense';
    const amount = parseFloat(document.getElementById('txnAmount').value);
    const date   = document.getElementById('txnDate').value;
    const desc   = document.getElementById('txnDescription').value.trim();
    const cat    = document.getElementById('txnCategory').value;
    const payment= document.getElementById('txnPayment').value;
    const notes  = document.getElementById('txnNotes').value.trim();
    const recurring = document.getElementById('txnRecurring').checked;
    const recurringFreq = document.getElementById('txnRecurringFreq').value;

    // Validation
    let valid = true;
    const setErr = (fieldId, msg) => {
      const err = document.getElementById(fieldId + 'Error');
      if (err) err.textContent = msg;
      if (msg) { document.getElementById(fieldId)?.classList.add('invalid'); valid = false; }
      else document.getElementById(fieldId)?.classList.remove('invalid');
    };

    setErr('txnAmount',      !amount || amount <= 0    ? 'Enter a valid amount'     : '');
    setErr('txnDate',        !date                     ? 'Select a date'            : '');
    setErr('txnDescription', !desc                     ? 'Enter a description'      : '');
    setErr('txnCategory',    !cat                      ? 'Select a category'        : '');

    if (!valid) return;

    upsert({ id, type, amount, date, description: desc, category: cat, payment, notes, recurring, recurringFreq });
    Modal.close('transactionModal');
    renderTable();
    App.refreshDashboard();
    Utils.toast(id ? '✓ Transaction updated' : '✓ Transaction added', 'success');
  };

  // ── Recent Transactions (Dashboard) ───────────────────
  const renderRecent = (limit = 8, period = 'month') => {
    const el = document.getElementById('recentTransactions');
    if (!el) return;

    // FIX: sort by date DESC before slicing
    let txns = Utils.filterByPeriod(getAll(), period);
    txns = txns.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
    txns = txns.slice(0, limit);

    if (txns.length === 0) {
      el.innerHTML = `<div class="empty-state" style="padding:32px 0">
        <div class="empty-icon">⇄</div>
        <p>No transactions for this period.</p>
        <button class="btn-add" id="emptyDashAddBtn">Add Transaction</button>
      </div>`;
      document.getElementById('emptyDashAddBtn')?.addEventListener('click', openAdd);
      return;
    }

    const icons = { income: '↑', expense: '↓' };
    el.innerHTML = txns.map(t => `
      <div class="txn-item" role="listitem" data-id="${Utils.escHtml(t.id)}" tabindex="0" aria-label="${Utils.escHtml(t.description)} ${t.type === 'income' ? '+' : '-'}${Utils.formatCurrency(t.amount)}">
        <div class="txn-icon ${t.type}" aria-hidden="true">${icons[t.type] || '•'}</div>
        <div class="txn-info">
          <div class="txn-name">${Utils.escHtml(t.description)}</div>
          <div class="txn-meta">${Utils.formatDate(t.date)} · ${Utils.escHtml(t.category)}${t.payment ? ` · ${t.payment}` : ''}</div>
        </div>
        <div class="txn-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${Utils.formatCurrency(t.amount)}</div>
      </div>`).join('');
  };

  // ── Event delegation (NO inline handlers) ─────────────
  const init = () => {
    // Form submit
    document.getElementById('transactionForm')?.addEventListener('submit', handleSubmit);

    // Quick-add buttons (multiple entry points)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-quick-add]');
      if (btn) openAdd(btn.dataset.quickAdd || 'expense');
    });

    document.getElementById('quickAddBtn')  ?.addEventListener('click', () => openAdd());
    document.getElementById('emptyAddBtn')  ?.addEventListener('click', () => openAdd());

    // Type toggle
    document.querySelectorAll('.type-btn').forEach(btn =>
      btn.addEventListener('click', () => setActiveType(btn.dataset.type)));

    // Recurring toggle
    document.getElementById('txnRecurring')?.addEventListener('change', (e) => {
      document.getElementById('recurringGroup').hidden = !e.target.checked;
    });

    // Sort headers
    document.querySelectorAll('[data-sort]').forEach(th =>
      th.addEventListener('click', () => setSort(th.dataset.sort)));

    // Filters
    const debouncedRender = Utils.debounce(renderTable, 220);
    document.getElementById('searchInput')    ?.addEventListener('input',  debouncedRender);
    document.getElementById('filterType')     ?.addEventListener('change', renderTable);
    document.getElementById('filterCategory') ?.addEventListener('change', renderTable);
    document.getElementById('filterMonth')    ?.addEventListener('change', renderTable);
    document.getElementById('clearFilters')   ?.addEventListener('click', () => {
      document.getElementById('searchInput').value    = '';
      document.getElementById('filterType').value     = 'all';
      document.getElementById('filterCategory').value = 'all';
      document.getElementById('filterMonth').value    = '';
      currentPage = 1;
      renderTable();
    });

    // ── Event delegation for table actions ────────────────
    document.getElementById('transactionTableBody')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { action, id } = btn.dataset;
      if (action === 'edit')   openEdit(id);
      if (action === 'delete') confirmDelete(id);
    });

    // ── Pagination delegation ──────────────────────────────
    document.getElementById('pagination')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-page]');
      if (!btn || btn.disabled) return;
      const page = parseInt(btn.dataset.page);
      if (!isNaN(page) && page >= 1) goPage(page);
    });

    // ── Confirm-modal delete button ────────────────────────
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.pendingId;
      if (!id) return;
      remove(id);
      Modal.close('confirmModal');
      renderTable();
      App.refreshDashboard();
      Utils.toast('Transaction deleted', 'success');
      delete e.currentTarget.dataset.pendingId;
    });

    // ── Inline field error clearing ────────────────────────
    ['txnAmount','txnDate','txnDescription','txnCategory'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => {
        const err = document.getElementById(id + 'Error');
        if (err) err.textContent = '';
        document.getElementById(id)?.classList.remove('invalid');
      });
    });
  };

  return { getAll, upsert, remove, bulkRemove, renderTable, renderRecent, openAdd, openEdit, confirmDelete, init };
})();

window.Transactions = Transactions;
