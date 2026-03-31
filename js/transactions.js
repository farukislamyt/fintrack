/**
 * FinTrack Transactions Module
 */

const Transactions = (() => {
  let sortField = 'date';
  let sortDir = -1; // -1 = desc
  let currentPage = 1;
  const PER_PAGE = 10;

  // --- Get all transactions ---
  const getAll = () => Storage.get('transactions') || [];

  // --- Save ---
  const save = (transactions) => Storage.set('transactions', transactions);

  // --- Add/Edit ---
  const upsert = (data) => {
    const all = getAll();
    const idx = all.findIndex(t => t.id === data.id);
    if (idx > -1) {
      all[idx] = { ...all[idx], ...data };
    } else {
      all.unshift({ id: Utils.uid(), createdAt: new Date().toISOString(), ...data });
    }
    save(all);
    return all;
  };

  // --- Delete ---
  const remove = (id) => {
    const all = getAll().filter(t => t.id !== id);
    save(all);
    return all;
  };

  // --- Filter & Sort ---
  const applyFilters = (transactions, { search, type, category, month }) => {
    return transactions.filter(t => {
      const matchSearch = !search || t.description.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase());
      const matchType = !type || type === 'all' || t.type === type;
      const matchCategory = !category || category === 'all' || t.category === category;
      const matchMonth = !month || t.date.startsWith(month);
      return matchSearch && matchType && matchCategory && matchMonth;
    });
  };

  const applySort = (transactions) => {
    return [...transactions].sort((a, b) => {
      let valA = a[sortField], valB = b[sortField];
      if (sortField === 'amount') { valA = Number(valA); valB = Number(valB); }
      if (valA < valB) return -1 * sortDir;
      if (valA > valB) return 1 * sortDir;
      return 0;
    });
  };

  // --- Render Table ---
  const renderTable = () => {
    const search = document.getElementById('searchInput')?.value.trim() || '';
    const type = document.getElementById('filterType')?.value || 'all';
    const category = document.getElementById('filterCategory')?.value || 'all';
    const month = document.getElementById('filterMonth')?.value || '';

    let all = getAll();
    let filtered = applyFilters(all, { search, type, category, month });
    filtered = applySort(filtered);

    const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;
    if (currentPage > totalPages) currentPage = 1;

    const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

    const tbody = document.getElementById('transactionTableBody');
    const emptyEl = document.getElementById('noTransactions');
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      emptyEl && (emptyEl.hidden = false);
    } else {
      emptyEl && (emptyEl.hidden = true);
      tbody.innerHTML = paginated.map(t => `
        <tr>
          <td>${Utils.formatDate(t.date)}</td>
          <td>
            <div style="font-weight:500;color:var(--text-primary)">${Utils.escHtml(t.description)}</div>
            ${t.notes ? `<div style="font-size:0.75rem;color:var(--text-muted)">${Utils.escHtml(t.notes)}</div>` : ''}
          </td>
          <td><span class="cat-badge">${Utils.escHtml(t.category)}</span></td>
          <td><span class="badge ${t.type}">${t.type}</span></td>
          <td>
            <span class="txn-amount ${t.type}">
              ${t.type === 'income' ? '+' : '-'}${Utils.formatCurrency(t.amount)}
            </span>
          </td>
          <td>
            <div class="action-btns">
              <button class="action-btn" onclick="Transactions.openEdit('${t.id}')" aria-label="Edit">✏</button>
              <button class="action-btn delete" onclick="Transactions.confirmDelete('${t.id}')" aria-label="Delete">🗑</button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    renderPagination(totalPages, filtered.length);
    updateFilterCategories(all);
  };

  // --- Pagination ---
  const renderPagination = (totalPages, totalItems) => {
    const el = document.getElementById('pagination');
    if (!el) return;
    if (totalPages <= 1) { el.innerHTML = ''; return; }

    let html = '';
    html += `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="Transactions.goPage(${currentPage-1})">←</button>`;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="Transactions.goPage(${i})">${i}</button>`;
      } else if (Math.abs(i - currentPage) === 2) {
        html += `<span style="color:var(--text-muted);padding:0 4px">…</span>`;
      }
    }
    html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="Transactions.goPage(${currentPage+1})">→</button>`;
    el.innerHTML = html;
  };

  const goPage = (page) => { currentPage = page; renderTable(); };

  // --- Update category filter dropdown ---
  const updateFilterCategories = (transactions) => {
    const sel = document.getElementById('filterCategory');
    if (!sel) return;
    const current = sel.value;
    const cats = [...new Set(transactions.map(t => t.category))].sort();
    sel.innerHTML = '<option value="all">All Categories</option>' +
      cats.map(c => `<option value="${Utils.escHtml(c)}" ${c === current ? 'selected' : ''}>${Utils.escHtml(c)}</option>`).join('');
  };

  // --- Sort ---
  const setSort = (field) => {
    if (sortField === field) sortDir *= -1;
    else { sortField = field; sortDir = -1; }
    renderTable();
    // Update header icons
    document.querySelectorAll('[data-sort]').forEach(th => {
      const icon = th.querySelector('.sort-icon');
      if (!icon) return;
      if (th.dataset.sort === field) icon.textContent = sortDir === -1 ? '↓' : '↑';
      else icon.textContent = '↕';
    });
  };

  // --- Modal open/close ---
  const openAdd = () => {
    document.getElementById('txnModalTitle').textContent = 'Add Transaction';
    document.getElementById('txnSubmitBtn').textContent = 'Add Transaction';
    document.getElementById('transactionForm').reset();
    document.getElementById('transactionForm').removeAttribute('data-id');
    document.getElementById('txnDate').value = Utils.today();
    setActiveType('expense');
    populateCategoryDropdown('expense');
    Modal.open('transactionModal');
  };

  const openEdit = (id) => {
    const t = getAll().find(t => t.id === id);
    if (!t) return;
    document.getElementById('txnModalTitle').textContent = 'Edit Transaction';
    document.getElementById('txnSubmitBtn').textContent = 'Save Changes';
    document.getElementById('transactionForm').setAttribute('data-id', id);
    setActiveType(t.type);
    populateCategoryDropdown(t.type);
    document.getElementById('txnAmount').value = t.amount;
    document.getElementById('txnDate').value = t.date;
    document.getElementById('txnDescription').value = t.description;
    document.getElementById('txnCategory').value = t.category;
    document.getElementById('txnPayment').value = t.payment || 'cash';
    document.getElementById('txnNotes').value = t.notes || '';
    document.getElementById('txnRecurring').checked = t.recurring || false;
    document.getElementById('recurringGroup').hidden = !t.recurring;
    if (t.recurring) document.getElementById('txnRecurringFreq').value = t.recurringFreq || 'monthly';
    Modal.open('transactionModal');
  };

  const confirmDelete = (id) => {
    const t = getAll().find(t => t.id === id);
    if (!t) return;
    document.getElementById('confirmMessage').textContent = `Delete "${t.description}"? This cannot be undone.`;
    document.getElementById('confirmDeleteBtn').onclick = () => {
      remove(id);
      Modal.close('confirmModal');
      renderTable();
      App.refreshDashboard();
      Utils.toast('Transaction deleted', 'success');
    };
    Modal.open('confirmModal');
  };

  // --- Type toggle ---
  const setActiveType = (type) => {
    document.querySelectorAll('.type-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === type);
    });
  };

  // --- Category dropdown ---
  const populateCategoryDropdown = (type) => {
    const sel = document.getElementById('txnCategory');
    if (!sel) return;
    const settings = AppState.settings;
    const cats = type === 'income' ? settings.incomeCategories : settings.expenseCategories;
    sel.innerHTML = cats.map(c => `<option value="${Utils.escHtml(c)}">${Utils.escHtml(c)}</option>`).join('');
  };

  // --- Handle form submit ---
  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const id = form.getAttribute('data-id');
    const type = document.querySelector('.type-btn.active')?.dataset.type || 'expense';
    const amount = parseFloat(document.getElementById('txnAmount').value);
    const date = document.getElementById('txnDate').value;
    const description = document.getElementById('txnDescription').value.trim();
    const category = document.getElementById('txnCategory').value;
    const payment = document.getElementById('txnPayment').value;
    const notes = document.getElementById('txnNotes').value.trim();
    const recurring = document.getElementById('txnRecurring').checked;
    const recurringFreq = document.getElementById('txnRecurringFreq').value;

    if (!amount || amount <= 0 || !date || !description || !category) {
      Utils.toast('Please fill in all required fields', 'error');
      return;
    }

    upsert({ id, type, amount, date, description, category, payment, notes, recurring, recurringFreq });
    Modal.close('transactionModal');
    renderTable();
    App.refreshDashboard();
    Utils.toast(id ? 'Transaction updated' : 'Transaction added', 'success');
  };

  // --- Recent transactions for dashboard ---
  const renderRecent = (limit = 8, period = 'month') => {
    const el = document.getElementById('recentTransactions');
    if (!el) return;
    let all = getAll();
    all = Utils.filterByPeriod(all, period);
    all = all.slice(0, limit);

    if (all.length === 0) {
      el.innerHTML = '<div class="empty-state"><div class="empty-icon">◎</div><p>No transactions for this period.</p></div>';
      return;
    }

    el.innerHTML = all.map(t => `
      <div class="txn-item" role="listitem">
        <div class="txn-icon ${t.type}">${t.type === 'income' ? '↑' : '↓'}</div>
        <div class="txn-info">
          <div class="txn-name">${Utils.escHtml(t.description)}</div>
          <div class="txn-meta">${Utils.formatDate(t.date)} · ${Utils.escHtml(t.category)}</div>
        </div>
        <div class="txn-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${Utils.formatCurrency(t.amount)}</div>
      </div>
    `).join('');
  };

  // --- Init ---
  const init = () => {
    // Form submit
    document.getElementById('transactionForm')?.addEventListener('submit', handleSubmit);

    // Quick add btn
    document.getElementById('quickAddBtn')?.addEventListener('click', openAdd);
    document.getElementById('emptyAddBtn')?.addEventListener('click', openAdd);

    // Type toggle
    document.querySelectorAll('.type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setActiveType(btn.dataset.type);
        populateCategoryDropdown(btn.dataset.type);
      });
    });

    // Recurring toggle
    document.getElementById('txnRecurring')?.addEventListener('change', (e) => {
      document.getElementById('recurringGroup').hidden = !e.target.checked;
    });

    // Sort headers
    document.querySelectorAll('[data-sort]').forEach(th => {
      th.addEventListener('click', () => setSort(th.dataset.sort));
    });

    // Filters
    const debouncedRender = Utils.debounce(renderTable, 200);
    document.getElementById('searchInput')?.addEventListener('input', debouncedRender);
    document.getElementById('filterType')?.addEventListener('change', renderTable);
    document.getElementById('filterCategory')?.addEventListener('change', renderTable);
    document.getElementById('filterMonth')?.addEventListener('change', renderTable);
    document.getElementById('clearFilters')?.addEventListener('click', () => {
      document.getElementById('searchInput').value = '';
      document.getElementById('filterType').value = 'all';
      document.getElementById('filterCategory').value = 'all';
      document.getElementById('filterMonth').value = '';
      currentPage = 1;
      renderTable();
    });
  };

  return { getAll, upsert, remove, renderTable, renderRecent, openAdd, openEdit, confirmDelete, goPage, init };
})();

window.Transactions = Transactions;
