/**
 * FinTrack Pro — Goals v3.0
 * FIXED: spread order bug
 */
const Goals = (() => {
  const getAll = () => Storage.get('goals', []);
  const save   = (d) => Storage.set('goals', d);

  // FIX: spread order
  const upsert = (data) => {
    const all = getAll();
    const existingId = data.id && data.id !== 'null' ? data.id : null;
    const idx = existingId ? all.findIndex(g => g.id === existingId) : -1;
    if (idx > -1) all[idx] = { ...all[idx], ...data, id: existingId, updatedAt: new Date().toISOString() };
    else all.push({ ...data, id: Utils.uid(), createdAt: new Date().toISOString() });
    save(all);
  };

  const remove = (id) => save(getAll().filter(g => g.id !== id));

  const addContribution = (id, amount) => {
    const all = getAll();
    const g   = all.find(g => g.id===id);
    if (!g) return false;
    const wasComplete = (g.saved||0) >= g.target;
    g.saved = Utils.clamp((g.saved||0)+amount, 0, g.target);
    save(all);
    return !wasComplete && g.saved >= g.target; // returns true if just completed
  };

  const getDaysLeft = (dl) => {
    if (!dl) return null;
    const d = new Date(dl+'T12:00:00'), now = new Date();
    now.setHours(12,0,0,0);
    return Math.ceil((d - now) / 86400000);
  };

  const dlLabel = (dl) => {
    if (!dl) return { text:'No deadline', cls:'' };
    const d = getDaysLeft(dl);
    if (d < 0)   return { text:'Deadline passed', cls:'dl--over' };
    if (d === 0) return { text:'Due today',       cls:'dl--today' };
    if (d <= 7)  return { text:`${d} days left`,  cls:'dl--soon' };
    if (d <= 30) return { text:`${d} days left`,  cls:'dl--near' };
    return { text: `${d} days left`, cls: '' };
  };

  const monthlyNeeded = (g) => {
    const d = getDaysLeft(g.deadline);
    if (!d || d<=0) return null;
    const n = (g.target-(g.saved||0)) / (d/30.44);
    return n > 0 ? n : 0;
  };

  const render = () => {
    const goals = getAll();
    const listEl = document.getElementById('goalsList');
    const emptyEl = document.getElementById('noGoals');
    if (!listEl) return;
    if (!goals.length) { listEl.innerHTML=''; if(emptyEl) emptyEl.hidden=false; return; }
    if (emptyEl) emptyEl.hidden = true;
    const sorted = [...goals].sort((a,b) => {
      const pA=(a.saved||0)/a.target, pB=(b.saved||0)/b.target;
      if ((pA>=1) !== (pB>=1)) return pA>=1?1:-1;
      return pB-pA;
    });
    listEl.innerHTML = sorted.map(g => {
      const saved = g.saved||0, pct = Utils.clamp((saved/g.target)*100,0,100);
      const done  = pct>=100, dl  = dlLabel(g.deadline);
      const bar   = done?'var(--income)':pct>=70?'var(--gold)':'var(--accent)';
      const mn    = monthlyNeeded(g);
      return `<div class="goal-card${done?' goal-card--done':''}" data-id="${Utils.escHtml(g.id)}">
        <div class="goal-header">
          <div class="goal-emoji">${g.emoji||'🎯'}</div>
          <div class="goal-actions">
            <button class="action-btn" data-action="edit" data-id="${Utils.escHtml(g.id)}" aria-label="Edit goal">✏</button>
            <button class="action-btn action-btn--del" data-action="delete" data-id="${Utils.escHtml(g.id)}" aria-label="Delete goal">🗑</button>
          </div>
        </div>
        <div class="goal-name">${Utils.escHtml(g.name)}</div>
        <div class="goal-deadline ${dl.cls}">${dl.text}</div>
        <div class="goal-amounts">
          <span>${Utils.formatCurrency(saved)} <small>saved</small></span>
          <span class="goal-total">${Utils.formatCurrency(g.target)}</span>
        </div>
        <div class="progress-bar" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100">
          <div class="progress-fill" style="width:${pct}%;background:${bar}"></div>
        </div>
        <div class="goal-footer-row">
          <span class="goal-pct">${Math.round(pct)}% complete</span>
          ${mn!==null?`<span class="goal-mn">${Utils.formatCurrency(mn)}/mo needed</span>`:''}
        </div>
        ${done
          ? `<div class="goal-achieved">🎉 Goal Achieved!</div>`
          : `<div class="goal-contrib-form">
               <input type="number" class="goal-contrib-inp" data-goal-id="${Utils.escHtml(g.id)}" placeholder="Add amount…" min="0.01" step="0.01" />
               <button class="goal-contrib-btn" data-action="contribute" data-id="${Utils.escHtml(g.id)}">+ Add</button>
             </div>`}
      </div>`;
    }).join('');
  };

  const contribute = (id) => {
    const inp = document.querySelector(`.goal-contrib-inp[data-goal-id="${id}"]`);
    const amt = parseFloat(inp?.value||0);
    if (!amt||amt<=0) { Utils.toast('Enter a valid amount','error'); return; }
    const g = getAll().find(g=>g.id===id);
    const just = addContribution(id, amt);
    render();
    if (just) Utils.toast(`🎉 Goal "${g?.name}" achieved!`, 'success', 5000);
    else Utils.toast(`✓ Added ${Utils.formatCurrency(amt)}`, 'success');
  };

  const openAdd = () => {
    const form = document.getElementById('goalForm');
    document.getElementById('goalModalTitle').textContent = 'Add Goal';
    form.reset(); form.removeAttribute('data-id');
    document.getElementById('goalEmoji').value = '🎯';
    document.querySelectorAll('.emoji-opt').forEach(b => b.classList.toggle('active', b.dataset.emoji==='🎯'));
    Modal.open('goalModal');
  };

  const openEdit = (id) => {
    const g = getAll().find(g=>g.id===id);
    if (!g) return;
    const form = document.getElementById('goalForm');
    document.getElementById('goalModalTitle').textContent = 'Edit Goal';
    form.setAttribute('data-id', id);
    document.getElementById('goalName').value     = g.name;
    document.getElementById('goalTarget').value   = g.target;
    document.getElementById('goalSaved').value    = g.saved||0;
    document.getElementById('goalDeadline').value = g.deadline||'';
    document.getElementById('goalEmoji').value    = g.emoji||'🎯';
    document.querySelectorAll('.emoji-opt').forEach(b => b.classList.toggle('active', b.dataset.emoji===(g.emoji||'🎯')));
    Modal.open('goalModal');
  };

  const confirmDelete = (id) => {
    const g = getAll().find(g=>g.id===id);
    if (!g) return;
    ConfirmModal.show(`Delete goal "${g.name}"?`, () => { remove(id); render(); Utils.toast('Goal deleted','success'); });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const rawId = e.target.getAttribute('data-id');
    const id    = (rawId && rawId!=='null') ? rawId : null;
    const name   = document.getElementById('goalName').value.trim();
    const target = parseFloat(document.getElementById('goalTarget').value);
    const saved  = parseFloat(document.getElementById('goalSaved').value)||0;
    const dl     = document.getElementById('goalDeadline').value||'';
    const emoji  = document.getElementById('goalEmoji').value||'🎯';
    if (!name||!target||target<=0) { Utils.toast('Fill in required fields','error'); return; }
    if (saved>target) { Utils.toast('Saved cannot exceed target','error'); return; }
    upsert({ id, name, target, saved, deadline: dl, emoji });
    Modal.close('goalModal');
    render();
    Utils.toast(id?'✓ Goal updated':'✓ Goal added','success');
  };

  const init = () => {
    document.getElementById('addGoalBtn')?.addEventListener('click', openAdd);
    document.getElementById('goalForm')?.addEventListener('submit', handleSubmit);
    document.querySelectorAll('.emoji-opt').forEach(b => b.addEventListener('click', () => {
      document.querySelectorAll('.emoji-opt').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      document.getElementById('goalEmoji').value = b.dataset.emoji;
    }));
    document.getElementById('goalsList')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      if (btn.dataset.action==='edit')        openEdit(btn.dataset.id);
      if (btn.dataset.action==='delete')      confirmDelete(btn.dataset.id);
      if (btn.dataset.action==='contribute')  contribute(btn.dataset.id);
    });
    document.getElementById('goalsList')?.addEventListener('keydown', e => {
      if (e.key==='Enter' && e.target.classList.contains('goal-contrib-inp')) contribute(e.target.dataset.goalId);
    });
  };

  return { getAll, upsert, remove, render, contribute, openAdd, openEdit, confirmDelete, init };
})();
window.Goals = Goals;
