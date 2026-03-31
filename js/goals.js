/**
 * FinTrack Goals Module
 */

const Goals = (() => {
  const getAll = () => Storage.get('goals') || [];
  const save = (goals) => Storage.set('goals', goals);

  const upsert = (data) => {
    const all = getAll();
    const idx = all.findIndex(g => g.id === data.id);
    if (idx > -1) all[idx] = { ...all[idx], ...data };
    else all.push({ id: Utils.uid(), createdAt: new Date().toISOString(), ...data });
    save(all);
  };

  const remove = (id) => save(getAll().filter(g => g.id !== id));

  const addContribution = (id, amount) => {
    const all = getAll();
    const g = all.find(g => g.id === id);
    if (!g) return;
    g.saved = Math.min((g.saved || 0) + amount, g.target);
    save(all);
  };

  const render = () => {
    const goals = getAll();
    const listEl = document.getElementById('goalsList');
    const emptyEl = document.getElementById('noGoals');
    if (!listEl) return;

    if (goals.length === 0) {
      listEl.innerHTML = '';
      emptyEl && (emptyEl.hidden = false);
      return;
    }
    emptyEl && (emptyEl.hidden = true);

    listEl.innerHTML = goals.map(g => {
      const saved = g.saved || 0;
      const pct = Math.min((saved / g.target) * 100, 100);
      const completed = pct >= 100;
      const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline) - new Date()) / 86400000) : null;
      const deadlineText = g.deadline
        ? (daysLeft < 0 ? 'Deadline passed' : daysLeft === 0 ? 'Due today' : `${daysLeft} days left`)
        : 'No deadline';

      return `
        <div class="goal-card ${completed ? 'goal-card--done' : ''}">
          <div class="goal-header">
            <div>
              <div class="goal-emoji">${g.emoji || '🎯'}</div>
            </div>
            <div class="goal-actions">
              <button class="action-btn" onclick="Goals.openEdit('${g.id}')" aria-label="Edit">✏</button>
              <button class="action-btn delete" onclick="Goals.confirmDelete('${g.id}')" aria-label="Delete">🗑</button>
            </div>
          </div>
          <div class="goal-name">${Utils.escHtml(g.name)}</div>
          <div class="goal-deadline">${deadlineText}</div>
          <div class="goal-amounts">
            <span>${Utils.formatCurrency(saved)} saved</span>
            <span class="goal-total">${Utils.formatCurrency(g.target)}</span>
          </div>
          <div class="progress-bar" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100" aria-label="${g.name} progress">
            <div class="progress-fill ${completed ? 'safe' : pct >= 70 ? 'warn' : ''}" style="width:${pct}%;background:${completed ? 'var(--income)' : pct >= 70 ? 'var(--gold)' : 'var(--accent)'}"></div>
          </div>
          <div class="goal-percent">${Math.round(pct)}% complete${completed ? ' 🎉' : ''}</div>
          ${!completed ? `
          <div class="goal-update-form">
            <input type="number" id="contrib-${g.id}" placeholder="Add amount" min="0.01" step="0.01" aria-label="Contribution amount" />
            <button onclick="Goals.contribute('${g.id}')">+ Add</button>
          </div>` : `<div style="text-align:center;padding:10px 0;font-size:0.85rem;color:var(--income);font-weight:600">Goal Achieved! 🎉</div>`}
        </div>
      `;
    }).join('');
  };

  const contribute = (id) => {
    const input = document.getElementById(`contrib-${id}`);
    const amount = parseFloat(input?.value || 0);
    if (!amount || amount <= 0) { Utils.toast('Enter a valid amount', 'error'); return; }
    addContribution(id, amount);
    render();
    Utils.toast(`Added ${Utils.formatCurrency(amount)} to goal!`, 'success');
  };

  const openAdd = () => {
    document.getElementById('goalModalTitle').textContent = 'Add Goal';
    document.getElementById('goalForm').reset();
    document.getElementById('goalForm').removeAttribute('data-id');
    document.getElementById('goalEmoji').value = '🎯';
    document.querySelectorAll('.emoji-opt').forEach(e => e.classList.remove('active'));
    document.querySelector('.emoji-opt[data-emoji="🎯"]')?.classList.add('active');
    Modal.open('goalModal');
  };

  const openEdit = (id) => {
    const g = getAll().find(g => g.id === id);
    if (!g) return;
    document.getElementById('goalModalTitle').textContent = 'Edit Goal';
    document.getElementById('goalForm').setAttribute('data-id', id);
    document.getElementById('goalName').value = g.name;
    document.getElementById('goalTarget').value = g.target;
    document.getElementById('goalSaved').value = g.saved || 0;
    document.getElementById('goalDeadline').value = g.deadline || '';
    document.getElementById('goalEmoji').value = g.emoji || '🎯';
    document.querySelectorAll('.emoji-opt').forEach(e => {
      e.classList.toggle('active', e.dataset.emoji === (g.emoji || '🎯'));
    });
    Modal.open('goalModal');
  };

  const confirmDelete = (id) => {
    const g = getAll().find(g => g.id === id);
    if (!g) return;
    document.getElementById('confirmMessage').textContent = `Delete goal "${g.name}"?`;
    document.getElementById('confirmDeleteBtn').onclick = () => {
      remove(id);
      Modal.close('confirmModal');
      render();
      Utils.toast('Goal deleted', 'success');
    };
    Modal.open('confirmModal');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const id = e.target.getAttribute('data-id');
    const name = document.getElementById('goalName').value.trim();
    const target = parseFloat(document.getElementById('goalTarget').value);
    const saved = parseFloat(document.getElementById('goalSaved').value) || 0;
    const deadline = document.getElementById('goalDeadline').value || '';
    const emoji = document.getElementById('goalEmoji').value || '🎯';
    if (!name || !target || target <= 0) {
      Utils.toast('Please fill in required fields', 'error');
      return;
    }
    upsert({ id, name, target, saved, deadline, emoji });
    Modal.close('goalModal');
    render();
    Utils.toast(id ? 'Goal updated' : 'Goal added', 'success');
  };

  const init = () => {
    document.getElementById('addGoalBtn')?.addEventListener('click', openAdd);
    document.getElementById('goalForm')?.addEventListener('submit', handleSubmit);

    // Emoji picker
    document.querySelectorAll('.emoji-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.emoji-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('goalEmoji').value = btn.dataset.emoji;
      });
    });
  };

  return { getAll, upsert, remove, render, contribute, openAdd, openEdit, confirmDelete, init };
})();

window.Goals = Goals;
