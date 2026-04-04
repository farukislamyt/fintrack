/**
 * FinTrack Pro — Goals Module v2.0
 * Fixes:
 * • Deadline timezone-safe (T12:00:00 fix)
 * • Event delegation for all actions
 * • Goal completion celebration
 * • Monthly contribution calculator
 * • Progress percentage clamped to 100%
 */

const Goals = (() => {
  const getAll = () => Storage.get('goals', []);
  const save   = (g) => Storage.set('goals', g);

  const upsert = (data) => {
    const all = getAll();
    const idx = all.findIndex(g => g.id === data.id);
    if (idx > -1) all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
    else all.push({ id: data.id || Utils.uid(), createdAt: new Date().toISOString(), ...data });
    save(all);
  };

  const remove = (id) => save(getAll().filter(g => g.id !== id));

  const addContribution = (id, amount) => {
    const all = getAll();
    const g   = all.find(g => g.id === id);
    if (!g) return;
    g.saved = Utils.clamp((g.saved || 0) + amount, 0, g.target);
    save(all);
  };

  // ── Days left (timezone-safe) ──────────────────────────
  const getDaysLeft = (deadline) => {
    if (!deadline) return null;
    // Use T12:00:00 to avoid UTC midnight offset issues
    const d   = new Date(deadline + 'T12:00:00');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.ceil((d - today) / 86400000);
  };

  const deadlineLabel = (deadline) => {
    if (!deadline) return { text: 'No deadline', cls: '' };
    const days = getDaysLeft(deadline);
    if (days < 0)   return { text: 'Deadline passed', cls: 'deadline--over' };
    if (days === 0) return { text: 'Due today',       cls: 'deadline--today' };
    if (days <= 7)  return { text: `${days} days left`, cls: 'deadline--soon' };
    if (days <= 30) return { text: `${days} days left`, cls: 'deadline--near' };
    return { text: `${days} days left`, cls: '' };
  };

  // ── Monthly contribution needed ────────────────────────
  const monthlyNeeded = (g) => {
    if (!g.deadline) return null;
    const days = getDaysLeft(g.deadline);
    if (days <= 0) return null;
    const months = days / 30.44;
    const needed = (g.target - (g.saved || 0)) / months;
    return needed > 0 ? needed : 0;
  };

  // ── Render ─────────────────────────────────────────────
  const render = () => {
    const goals   = getAll();
    const listEl  = document.getElementById('goalsList');
    const emptyEl = document.getElementById('noGoals');
    if (!listEl) return;

    if (goals.length === 0) {
      listEl.innerHTML = '';
      emptyEl && (emptyEl.hidden = false);
      return;
    }
    emptyEl && (emptyEl.hidden = true);

    // Sort: incomplete first (by pct desc), completed last
    const sorted = [...goals].sort((a, b) => {
      const pA = (a.saved || 0) / a.target;
      const pB = (b.saved || 0) / b.target;
      const doneA = pA >= 1, doneB = pB >= 1;
      if (doneA !== doneB) return doneA ? 1 : -1;
      return pB - pA;
    });

    listEl.innerHTML = sorted.map(g => {
      const saved     = g.saved || 0;
      const pct       = Utils.clamp((saved / g.target) * 100, 0, 100);
      const done      = pct >= 100;
      const dl        = deadlineLabel(g.deadline);
      const monthly   = monthlyNeeded(g);
      const barColor  = done ? 'var(--income)' : pct >= 70 ? 'var(--gold)' : 'var(--accent)';

      return `
        <div class="goal-card${done ? ' goal-card--done' : ''}" data-id="${Utils.escHtml(g.id)}">
          <div class="goal-header">
            <div class="goal-emoji" aria-hidden="true">${g.emoji || '🎯'}</div>
            <div class="goal-actions">
              <button class="action-btn edit-btn" data-action="edit" data-id="${Utils.escHtml(g.id)}" aria-label="Edit goal">✏</button>
              <button class="action-btn action-btn--del" data-action="delete" data-id="${Utils.escHtml(g.id)}" aria-label="Delete goal">🗑</button>
            </div>
          </div>

          <div class="goal-name">${Utils.escHtml(g.name)}</div>
          <div class="goal-deadline ${dl.cls}">${dl.text}</div>

          <div class="goal-amounts">
            <span class="goal-saved">${Utils.formatCurrency(saved)} <span class="goal-saved-label">saved</span></span>
            <span class="goal-total">${Utils.formatCurrency(g.target)}</span>
          </div>

          <div class="progress-bar" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100" aria-label="${Utils.escHtml(g.name)} ${Math.round(pct)}% complete">
            <div class="progress-fill" style="width:${pct}%;background:${barColor}"></div>
          </div>

          <div class="goal-footer-row">
            <span class="goal-percent">${Math.round(pct)}% complete</span>
            ${monthly !== null ? `<span class="goal-monthly-hint">${Utils.formatCurrency(monthly)}/mo needed</span>` : ''}
          </div>

          ${done
            ? `<div class="goal-achieved">🎉 Goal Achieved!</div>`
            : `<div class="goal-contribute-form">
                 <input type="number" class="goal-contrib-input" data-goal-id="${Utils.escHtml(g.id)}" placeholder="Add amount…" min="0.01" step="0.01" aria-label="Contribution amount for ${Utils.escHtml(g.name)}" />
                 <button class="goal-contrib-btn" data-action="contribute" data-id="${Utils.escHtml(g.id)}">+ Add</button>
               </div>`
          }
        </div>`;
    }).join('');
  };

  // ── Contribute ─────────────────────────────────────────
  const contribute = (id) => {
    const input  = document.querySelector(`.goal-contrib-input[data-goal-id="${id}"]`);
    const amount = parseFloat(input?.value || 0);
    if (!amount || amount <= 0) { Utils.toast('Enter a valid amount', 'error'); return; }

    const goalsBefore = getAll();
    const goal        = goalsBefore.find(g => g.id === id);
    const wasComplete = goal && (goal.saved || 0) >= goal.target;

    addContribution(id, amount);
    render();

    const goalAfter = getAll().find(g => g.id === id);
    const nowDone   = goalAfter && goalAfter.saved >= goalAfter.target;

    if (!wasComplete && nowDone) {
      Utils.toast(`🎉 Goal "${goalAfter.name}" achieved!`, 'success', 5000);
    } else {
      Utils.toast(`✓ Added ${Utils.formatCurrency(amount)}`, 'success');
    }
  };

  // ── Modal: open add ────────────────────────────────────
  const openAdd = () => {
    const form = document.getElementById('goalForm');
    document.getElementById('goalModalTitle').textContent = 'Add Goal';
    form.reset();
    form.removeAttribute('data-id');
    document.getElementById('goalEmoji').value = '🎯';
    document.querySelectorAll('.emoji-opt').forEach(b => b.classList.toggle('active', b.dataset.emoji === '🎯'));
    Modal.open('goalModal');
  };

  const openEdit = (id) => {
    const g = getAll().find(g => g.id === id);
    if (!g) return;
    const form = document.getElementById('goalForm');
    document.getElementById('goalModalTitle').textContent = 'Edit Goal';
    form.setAttribute('data-id', id);
    document.getElementById('goalName').value     = g.name;
    document.getElementById('goalTarget').value   = g.target;
    document.getElementById('goalSaved').value    = g.saved || 0;
    document.getElementById('goalDeadline').value = g.deadline || '';
    document.getElementById('goalEmoji').value    = g.emoji || '🎯';
    document.querySelectorAll('.emoji-opt').forEach(b =>
      b.classList.toggle('active', b.dataset.emoji === (g.emoji || '🎯')));
    Modal.open('goalModal');
  };

  const confirmDelete = (id) => {
    const g = getAll().find(g => g.id === id);
    if (!g) return;
    document.getElementById('confirmMessage').textContent = `Delete goal "${g.name}"?`;
    document.getElementById('confirmDeleteBtn').dataset.pendingType = 'goal';
    document.getElementById('confirmDeleteBtn').dataset.pendingId   = id;
    Modal.open('confirmModal');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const id       = e.target.getAttribute('data-id') || null;
    const name     = document.getElementById('goalName').value.trim();
    const target   = parseFloat(document.getElementById('goalTarget').value);
    const saved    = parseFloat(document.getElementById('goalSaved').value)  || 0;
    const deadline = document.getElementById('goalDeadline').value || '';
    const emoji    = document.getElementById('goalEmoji').value    || '🎯';

    if (!name || !target || target <= 0) {
      Utils.toast('Please fill in required fields', 'error'); return;
    }
    if (saved > target) {
      Utils.toast('Saved amount cannot exceed target', 'error'); return;
    }

    upsert({ id, name, target, saved, deadline, emoji });
    Modal.close('goalModal');
    render();
    Utils.toast(id ? '✓ Goal updated' : '✓ Goal added', 'success');
  };

  // ── Init ───────────────────────────────────────────────
  const init = () => {
    document.getElementById('addGoalBtn')?.addEventListener('click', openAdd);
    document.getElementById('goalForm')  ?.addEventListener('submit', handleSubmit);

    // Emoji picker
    document.querySelectorAll('.emoji-opt').forEach(btn =>
      btn.addEventListener('click', () => {
        document.querySelectorAll('.emoji-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('goalEmoji').value = btn.dataset.emoji;
      }));

    // Event delegation for goal card actions
    document.getElementById('goalsList')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { action, id } = btn.dataset;
      if (action === 'edit')        openEdit(id);
      if (action === 'delete')      confirmDelete(id);
      if (action === 'contribute')  contribute(id);
    });

    // Allow Enter key on contribution input
    document.getElementById('goalsList')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.classList.contains('goal-contrib-input')) {
        const id = e.target.dataset.goalId;
        if (id) contribute(id);
      }
    });
  };

  return { getAll, upsert, remove, render, contribute, openAdd, openEdit, confirmDelete, init };
})();

window.Goals = Goals;
