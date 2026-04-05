/**
 * FinTrack Pro — Loans v3.0
 * Full give/take loan management system
 * Features: partial payments, overdue tracking, interest calc, history
 */
const Loans = (() => {
  const getAll  = () => Storage.get('loans', []);
  const save    = (d) => Storage.set('loans', d);

  // FIX: spread order - data first, then override id
  const upsert = (data) => {
    const all = getAll();
    const existingId = data.id && data.id !== 'null' ? data.id : null;
    const idx = existingId ? all.findIndex(l => l.id === existingId) : -1;
    if (idx > -1) {
      all[idx] = { ...all[idx], ...data, id: existingId, updatedAt: new Date().toISOString() };
    } else {
      all.push({ ...data, id: Utils.uid(), createdAt: new Date().toISOString(), payments: [], status: 'active' });
    }
    save(all);
  };

  const remove = (id) => save(getAll().filter(l => l.id !== id));

  // ── Add a payment to a loan ───────────────────────────────
  const addPayment = (loanId, amount, note = '') => {
    const all  = getAll();
    const loan = all.find(l => l.id === loanId);
    if (!loan) return false;
    if (!Array.isArray(loan.payments)) loan.payments = [];
    loan.payments.push({ id: Utils.uid(), amount, date: Utils.today(), note, createdAt: new Date().toISOString() });
    const paid = loan.payments.reduce((s, p) => s + p.amount, 0);
    if (paid >= loan.amount) loan.status = 'settled';
    save(all);
    return true;
  };

  const deletePayment = (loanId, paymentId) => {
    const all  = getAll();
    const loan = all.find(l => l.id === loanId);
    if (!loan || !Array.isArray(loan.payments)) return;
    loan.payments = loan.payments.filter(p => p.id !== paymentId);
    const paid = loan.payments.reduce((s, p) => s + p.amount, 0);
    loan.status = paid >= loan.amount ? 'settled' : 'active';
    save(all);
  };

  const markSettled = (id) => {
    const all  = getAll();
    const loan = all.find(l => l.id === id);
    if (!loan) return;
    loan.status = loan.status === 'settled' ? 'active' : 'settled';
    save(all);
  };

  // ── Computed helpers ──────────────────────────────────────
  const getPaid       = (loan) => (loan.payments || []).reduce((s, p) => s + p.amount, 0);
  const getRemaining  = (loan) => Math.max(loan.amount - getPaid(loan), 0);
  const isOverdue     = (loan) => {
    if (!loan.dueDate || loan.status === 'settled') return false;
    return new Date(loan.dueDate + 'T12:00:00') < new Date();
  };

  // ── Summary stats ─────────────────────────────────────────
  const getSummary = () => {
    const all = getAll();
    const active = all.filter(l => l.status !== 'settled');
    let toReceive = 0, toPay = 0;
    active.forEach(l => {
      const rem = getRemaining(l);
      if (l.loanType === 'given')  toReceive += rem;
      if (l.loanType === 'taken')  toPay     += rem;
    });
    const overdue = all.filter(l => isOverdue(l));
    return { toReceive, toPay, overdue: overdue.length, total: all.length, active: active.length };
  };

  // ── Render all ────────────────────────────────────────────
  const render = () => {
    renderSummary();
    renderList('given');
    renderList('taken');
  };

  const renderSummary = () => {
    const el = document.getElementById('loanSummary');
    if (!el) return;
    const s = getSummary();
    el.innerHTML = `
      <div class="loan-sum-card loan-sum--receive">
        <div class="loan-sum-icon">📥</div>
        <div class="loan-sum-info">
          <div class="loan-sum-label">To Receive</div>
          <div class="loan-sum-amount">${Utils.formatCurrency(s.toReceive)}</div>
        </div>
      </div>
      <div class="loan-sum-card loan-sum--pay">
        <div class="loan-sum-icon">📤</div>
        <div class="loan-sum-info">
          <div class="loan-sum-label">To Pay Back</div>
          <div class="loan-sum-amount">${Utils.formatCurrency(s.toPay)}</div>
        </div>
      </div>
      <div class="loan-sum-card ${s.overdue > 0 ? 'loan-sum--overdue' : 'loan-sum--neutral'}">
        <div class="loan-sum-icon">${s.overdue > 0 ? '⚠' : '✓'}</div>
        <div class="loan-sum-info">
          <div class="loan-sum-label">Overdue</div>
          <div class="loan-sum-amount">${s.overdue} loan${s.overdue !== 1 ? 's' : ''}</div>
        </div>
      </div>
      <div class="loan-sum-card loan-sum--neutral">
        <div class="loan-sum-icon">📋</div>
        <div class="loan-sum-info">
          <div class="loan-sum-label">Active Loans</div>
          <div class="loan-sum-amount">${s.active} of ${s.total}</div>
        </div>
      </div>`;
  };

  const renderList = (type) => {
    const listId  = type === 'given' ? 'loansGivenList'  : 'loansTakenList';
    const emptyId = type === 'given' ? 'noLoansGiven'    : 'noLoansTaken';
    const el      = document.getElementById(listId);
    const emptyEl = document.getElementById(emptyId);
    if (!el) return;

    // Filter by active tab (all / active / settled)
    const tabVal = document.getElementById('loanTabFilter')?.value || 'active';
    let loans = getAll().filter(l => l.loanType === type);
    if (tabVal === 'active')   loans = loans.filter(l => l.status !== 'settled');
    if (tabVal === 'settled')  loans = loans.filter(l => l.status === 'settled');
    loans = loans.sort((a, b) => {
      if (isOverdue(a) && !isOverdue(b)) return -1;
      if (!isOverdue(a) && isOverdue(b)) return 1;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

    if (!loans.length) {
      el.innerHTML = '';
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;

    el.innerHTML = loans.map(l => {
      const paid    = getPaid(l);
      const rem     = getRemaining(l);
      const pct     = l.amount > 0 ? Utils.clamp((paid / l.amount) * 100, 0, 100) : 0;
      const over    = isOverdue(l);
      const settled = l.status === 'settled';
      const daysLeft = l.dueDate ? Math.ceil((new Date(l.dueDate + 'T12:00:00') - new Date()) / 86400000) : null;
      const dlText  = l.dueDate
        ? (daysLeft < 0 ? `Overdue by ${Math.abs(daysLeft)}d` : daysLeft === 0 ? 'Due today' : `Due in ${daysLeft}d`)
        : 'No due date';
      const barColor = settled ? 'var(--income)' : over ? 'var(--expense)' : pct >= 70 ? 'var(--gold)' : 'var(--accent)';

      return `
        <div class="loan-card${over && !settled ? ' loan-card--overdue' : ''}${settled ? ' loan-card--settled' : ''}" data-id="${Utils.escHtml(l.id)}">
          <div class="loan-card-header">
            <div class="loan-person-info">
              <div class="loan-avatar">${(l.personName || '?')[0].toUpperCase()}</div>
              <div>
                <div class="loan-person-name">${Utils.escHtml(l.personName || 'Unknown')}</div>
                <div class="loan-meta">
                  ${l.date ? `Started ${Utils.formatDate(l.date)}` : ''}
                  ${l.dueDate ? ` · <span class="${over && !settled ? 'text-expense' : ''}">${dlText}</span>` : ''}
                </div>
              </div>
            </div>
            <div class="loan-card-actions">
              ${settled ? `<span class="settled-badge">✓ Settled</span>` : ''}
              ${over && !settled ? `<span class="overdue-badge">Overdue</span>` : ''}
              <button class="action-btn" data-action="edit-loan" data-id="${Utils.escHtml(l.id)}" aria-label="Edit loan">✏</button>
              <button class="action-btn action-btn--del" data-action="delete-loan" data-id="${Utils.escHtml(l.id)}" aria-label="Delete loan">🗑</button>
            </div>
          </div>

          ${l.note ? `<div class="loan-note">${Utils.escHtml(l.note)}</div>` : ''}

          <div class="loan-amounts-row">
            <div class="loan-amount-item">
              <div class="loan-amount-label">Principal</div>
              <div class="loan-amount-val">${Utils.formatCurrency(l.amount)}</div>
            </div>
            <div class="loan-amount-item">
              <div class="loan-amount-label">Paid</div>
              <div class="loan-amount-val" style="color:var(--income)">${Utils.formatCurrency(paid)}</div>
            </div>
            <div class="loan-amount-item">
              <div class="loan-amount-label">Remaining</div>
              <div class="loan-amount-val" style="color:${over && !settled ? 'var(--expense)' : 'var(--text-primary)'}">${Utils.formatCurrency(rem)}</div>
            </div>
          </div>

          <div class="progress-bar" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-fill" style="width:${pct}%;background:${barColor}"></div>
          </div>
          <div class="loan-pct-row">
            <span>${Math.round(pct)}% repaid</span>
            ${l.interestRate ? `<span class="loan-interest-tag">${l.interestRate}% interest</span>` : ''}
          </div>

          ${!settled ? `
          <div class="loan-payment-form">
            <input type="number" class="loan-payment-inp" data-loan-id="${Utils.escHtml(l.id)}" placeholder="Payment amount…" min="0.01" step="0.01" />
            <input type="text" class="loan-payment-note" data-loan-id="${Utils.escHtml(l.id)}" placeholder="Note (optional)" maxlength="60" />
            <button class="loan-pay-btn" data-action="add-payment" data-id="${Utils.escHtml(l.id)}">+ Pay</button>
            <button class="loan-settle-btn" data-action="settle-loan" data-id="${Utils.escHtml(l.id)}" title="Mark as fully settled">✓ Settle</button>
          </div>` : `
          <div class="loan-payment-form">
            <button class="btn-ghost" style="height:32px;font-size:.78rem" data-action="settle-loan" data-id="${Utils.escHtml(l.id)}">↩ Reopen</button>
          </div>`}

          ${l.payments && l.payments.length > 0 ? `
          <details class="loan-history">
            <summary class="loan-history-toggle">Payment history (${l.payments.length})</summary>
            <div class="loan-history-list">
              ${l.payments.map(p => `
                <div class="loan-history-item">
                  <span class="loan-history-date">${Utils.formatDate(p.date)}</span>
                  <span class="loan-history-note">${Utils.escHtml(p.note || '—')}</span>
                  <span class="loan-history-amount">+${Utils.formatCurrency(p.amount)}</span>
                  <button class="loan-history-del" data-action="delete-payment" data-loan-id="${Utils.escHtml(l.id)}" data-payment-id="${Utils.escHtml(p.id)}" aria-label="Delete payment">✕</button>
                </div>`).join('')}
            </div>
          </details>` : ''}
        </div>`;
    }).join('');
  };

  // ── Open Add modal ────────────────────────────────────────
  const openAdd = (defaultType = 'given') => {
    const form = document.getElementById('loanForm');
    document.getElementById('loanModalTitle').textContent = 'Add Loan';
    form.reset();
    form.removeAttribute('data-id');
    document.getElementById('loanDate').value = Utils.today();
    const typeSelect = document.getElementById('loanTypeSelect');
    if (typeSelect) typeSelect.value = defaultType;
    Modal.open('loanModal');
  };

  const openEdit = (id) => {
    const l = getAll().find(l => l.id === id);
    if (!l) return;
    const form = document.getElementById('loanForm');
    document.getElementById('loanModalTitle').textContent = 'Edit Loan';
    form.setAttribute('data-id', id);
    document.getElementById('loanTypeSelect').value    = l.loanType;
    document.getElementById('loanPersonName').value    = l.personName || '';
    document.getElementById('loanAmount').value        = l.amount;
    document.getElementById('loanDate').value          = l.date || Utils.today();
    document.getElementById('loanDueDate').value       = l.dueDate || '';
    document.getElementById('loanInterestRate').value  = l.interestRate || '';
    document.getElementById('loanNote').value          = l.note || '';
    Modal.open('loanModal');
  };

  const confirmDelete = (id) => {
    const l = getAll().find(l => l.id === id);
    if (!l) return;
    ConfirmModal.show(`Delete loan for "${l.personName}"? All payment history will be lost.`, () => {
      remove(id);
      render();
      Utils.toast('Loan deleted', 'success');
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const rawId = e.target.getAttribute('data-id');
    const id    = (rawId && rawId !== 'null') ? rawId : null;
    const loanType   = document.getElementById('loanTypeSelect').value;
    const personName = document.getElementById('loanPersonName').value.trim();
    const amount     = parseFloat(document.getElementById('loanAmount').value);
    const date       = document.getElementById('loanDate').value;
    const dueDate    = document.getElementById('loanDueDate').value || '';
    const interest   = parseFloat(document.getElementById('loanInterestRate').value) || 0;
    const note       = document.getElementById('loanNote').value.trim();

    if (!personName || !amount || amount <= 0 || !date) {
      Utils.toast('Fill in all required fields', 'error'); return;
    }
    upsert({ id, loanType, personName, amount, date, dueDate, interestRate: interest, note });
    Modal.close('loanModal');
    render();
    Utils.toast(id ? '✓ Loan updated' : '✓ Loan added', 'success');
  };

  const handleAddPayment = (loanId) => {
    const inp  = document.querySelector(`.loan-payment-inp[data-loan-id="${loanId}"]`);
    const note = document.querySelector(`.loan-payment-note[data-loan-id="${loanId}"]`);
    const amt  = parseFloat(inp?.value || 0);
    if (!amt || amt <= 0) { Utils.toast('Enter a valid payment amount', 'error'); return; }
    const loan = getAll().find(l => l.id === loanId);
    const rem  = getRemaining(loan);
    if (amt > rem + 0.01) { Utils.toast(`Payment exceeds remaining balance of ${Utils.formatCurrency(rem)}`, 'warning'); return; }
    addPayment(loanId, amt, note?.value?.trim() || '');
    render();
    Utils.toast(`✓ Payment of ${Utils.formatCurrency(amt)} recorded`, 'success');
  };

  // ── Init ──────────────────────────────────────────────────
  const init = () => {
    document.getElementById('addLoanGivenBtn')?.addEventListener('click', () => openAdd('given'));
    document.getElementById('addLoanTakenBtn')?.addEventListener('click', () => openAdd('taken'));
    document.getElementById('loanForm')?.addEventListener('submit', handleSubmit);
    document.getElementById('loanTabFilter')?.addEventListener('change', render);

    // Delegation for both lists
    ['loansGivenList', 'loansTakenList'].forEach(listId => {
      document.getElementById(listId)?.addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const { action, id, loanId, paymentId } = btn.dataset;
        if (action === 'edit-loan')       openEdit(id);
        if (action === 'delete-loan')     confirmDelete(id);
        if (action === 'settle-loan')     { markSettled(id); render(); }
        if (action === 'add-payment')     handleAddPayment(id);
        if (action === 'delete-payment')  {
          ConfirmModal.show('Delete this payment record?', () => {
            deletePayment(btn.dataset.loanId, btn.dataset.paymentId);
            render();
            Utils.toast('Payment deleted', 'success');
          });
        }
      });
      document.getElementById(listId)?.addEventListener('keydown', e => {
        if (e.key === 'Enter' && e.target.classList.contains('loan-payment-inp')) {
          handleAddPayment(e.target.dataset.loanId);
        }
      });
    });
  };

  return { getAll, upsert, remove, render, addPayment, markSettled, getSummary, openAdd, openEdit, init };
})();
window.Loans = Loans;
