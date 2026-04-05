/**
 * FinTrack Pro — App v3.0
 * Single confirm modal handler, hash routing, insights, full init order
 */

// ── App State ──────────────────────────────────────────────
const AppState = {
  currentPage: 'dashboard',
  settings: {
    userName: '', currency: 'USD', dateFormat: 'MM/DD/YYYY', savingsTarget: 20,
    incomeCategories:  ['Salary','Freelance','Business','Investment','Rental','Gift','Other Income'],
    expenseCategories: ['Food & Dining','Transportation','Shopping','Housing','Utilities','Healthcare','Entertainment','Education','Personal Care','Travel','Insurance','Savings','Other Expense']
  }
};
window.AppState = AppState;

// ── Modal ──────────────────────────────────────────────────
const Modal = {
  open: (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.hidden = false;
    el.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      const first = el.querySelector('input:not([type="hidden"]),select,textarea,button:not(.modal-close)');
      if (first) first.focus();
    });
  },
  close: (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.hidden = true;
    el.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.modal-backdrop:not([hidden])')) document.body.style.overflow = '';
  },
  init: () => {
    document.querySelectorAll('.modal-backdrop').forEach(b => {
      b.addEventListener('click', e => { if (e.target === b) Modal.close(b.id); });
    });
    document.querySelectorAll('[data-modal]').forEach(btn => {
      btn.addEventListener('click', () => Modal.close(btn.dataset.modal));
    });
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      const open = document.querySelector('.modal-backdrop:not([hidden])');
      if (open) Modal.close(open.id);
    });
  }
};
window.Modal = Modal;

// ── Centralized Confirm Modal (ONE handler, no duplicates) ──
const ConfirmModal = {
  _cb: null,
  show: (msg, onConfirm) => {
    document.getElementById('confirmMessage').textContent = msg;
    ConfirmModal._cb = onConfirm;
    Modal.open('confirmModal');
  },
  init: () => {
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', () => {
      Modal.close('confirmModal');
      if (typeof ConfirmModal._cb === 'function') {
        ConfirmModal._cb();
        ConfirmModal._cb = null;
      }
    });
  }
};
window.ConfirmModal = ConfirmModal;

// ── Navigation ─────────────────────────────────────────────
const Nav = {
  init: () => {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => { Nav.goTo(btn.dataset.page); if (window.innerWidth <= 768) Nav.closeSidebar(); });
    });
    document.querySelectorAll('[data-page]:not(.nav-item)').forEach(el => {
      el.addEventListener('click', () => Nav.goTo(el.dataset.page));
    });
    const hamburger = document.getElementById('hamburger');
    hamburger?.addEventListener('click', () => { Nav.openSidebar(); hamburger.setAttribute('aria-expanded','true'); });
    document.getElementById('sidebarOverlay')?.addEventListener('click', Nav.closeSidebar);
    document.getElementById('sidebarClose')  ?.addEventListener('click', Nav.closeSidebar);
    document.addEventListener('keydown', e => {
      if (e.key==='Escape' && document.getElementById('sidebar')?.classList.contains('open')) Nav.closeSidebar();
    });
  },
  openSidebar: () => {
    document.getElementById('sidebar')?.classList.add('open');
    document.getElementById('sidebarOverlay')?.classList.add('visible');
    document.getElementById('hamburger')?.setAttribute('aria-expanded','true');
  },
  closeSidebar: () => {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.remove('visible');
    document.getElementById('hamburger')?.setAttribute('aria-expanded','false');
  },
  goTo: (page) => {
    if (!page) return;
    AppState.currentPage = page;
    document.querySelectorAll('.nav-item').forEach(b => {
      const a = b.dataset.page === page;
      b.classList.toggle('active', a);
      b.setAttribute('aria-current', a ? 'page' : 'false');
    });
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`)?.classList.add('active');
    const titles = { dashboard:'Dashboard', transactions:'Transactions', budget:'Budget Planner', goals:'Financial Goals', loans:'Loans', reports:'Reports & Analytics', settings:'Settings' };
    const tb = document.getElementById('topbarTitle');
    if (tb) tb.textContent = titles[page] || page;
    ({ dashboard: App.refreshDashboard, transactions: Transactions.renderTable, budget: Budget.render,
       goals: Goals.render, loans: Loans.render, reports: () => { Reports.populateYears(); Reports.render(); },
       settings: Settings.render })[page]?.();
    history.replaceState(null, '', `#${page}`);
  }
};

// ── Settings ───────────────────────────────────────────────
const Settings = {
  load: () => { const s = Storage.get('settings'); if (s) AppState.settings = { ...AppState.settings, ...s }; },
  save: () => {
    AppState.settings.userName      = document.getElementById('userName').value.trim();
    AppState.settings.currency      = document.getElementById('currencySelect').value;
    AppState.settings.dateFormat    = document.getElementById('dateFormat').value;
    AppState.settings.savingsTarget = parseFloat(document.getElementById('savingsTarget').value) || 20;
    Storage.set('settings', AppState.settings);
    Utils.toast('✓ Settings saved', 'success');
    App.refreshDashboard();
  },
  render: () => {
    const s = AppState.settings;
    document.getElementById('userName').value       = s.userName      || '';
    document.getElementById('currencySelect').value = s.currency      || 'USD';
    document.getElementById('dateFormat').value     = s.dateFormat    || 'MM/DD/YYYY';
    document.getElementById('savingsTarget').value  = s.savingsTarget || 20;
    Settings.renderCategories();
    Settings.renderStorageInfo();
  },
  renderCategories: () => {
    const render = (id, type, cats) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = cats.map(c => `
        <div class="category-item">
          <span>${Utils.escHtml(c)}</span>
          <button class="cat-del" data-type="${type}" data-name="${Utils.escHtml(c)}" aria-label="Delete ${Utils.escHtml(c)}">✕</button>
        </div>`).join('');
    };
    render('incomeCatList',  'income',  AppState.settings.incomeCategories);
    render('expenseCatList', 'expense', AppState.settings.expenseCategories);
  },
  renderStorageInfo: () => {
    const el = document.getElementById('storageInfo');
    if (!el) return;
    const u = Storage.getUsage();
    el.innerHTML = `<div class="storage-usage"><div class="storage-bar-wrap"><div class="storage-bar-fill" style="width:${u.pct}%"></div></div><span class="storage-text">${u.kb} KB used (~${u.pct}% of 5 MB)</span></div>`;
  },
  addCategory: () => {
    const name = document.getElementById('newCategoryName').value.trim();
    const type = document.getElementById('newCategoryType').value;
    if (!name) { Utils.toast('Enter a category name', 'error'); return; }
    const key = type === 'income' ? 'incomeCategories' : 'expenseCategories';
    if (AppState.settings[key].includes(name)) { Utils.toast('Category already exists', 'warning'); return; }
    AppState.settings[key].push(name);
    AppState.settings[key].sort();
    Storage.set('settings', AppState.settings);
    document.getElementById('newCategoryName').value = '';
    Settings.renderCategories();
    Utils.toast('✓ Category added', 'success');
  },
  init: () => {
    document.getElementById('saveSettings')  ?.addEventListener('click', Settings.save);
    document.getElementById('addCategoryBtn')?.addEventListener('click', Settings.addCategory);
    document.getElementById('newCategoryName')?.addEventListener('keydown', e => { if (e.key==='Enter') Settings.addCategory(); });
    ['incomeCatList','expenseCatList'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', e => {
        const btn = e.target.closest('.cat-del');
        if (!btn) return;
        const key = btn.dataset.type==='income' ? 'incomeCategories' : 'expenseCategories';
        AppState.settings[key] = AppState.settings[key].filter(c => c !== btn.dataset.name);
        Storage.set('settings', AppState.settings);
        Settings.renderCategories();
      });
    });
  }
};

// ── Data Manager ───────────────────────────────────────────
const DataManager = {
  init: () => {
    document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
      Utils.download(JSON.stringify(Storage.exportAll(),null,2), `fintrack-backup-${Utils.today()}.json`, 'application/json');
      Utils.toast('✓ JSON exported', 'success');
    });
    document.getElementById('exportCsvBtn')?.addEventListener('click', () => {
      Utils.download(Utils.toCSV(Transactions.getAll()), `fintrack-txns-${Utils.today()}.csv`, 'text/csv');
      Utils.toast('✓ CSV exported', 'success');
    });
    document.getElementById('exportBtn')?.addEventListener('click', () => {
      Utils.download(Utils.toCSV(Transactions.getAll()), `fintrack-txns-${Utils.today()}.csv`, 'text/csv');
      Utils.toast('✓ CSV exported', 'success');
    });
    document.getElementById('importFile')?.addEventListener('change', e => {
      const file = e.target.files[0]; if (!file) return;
      const r = new FileReader();
      r.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result);
          const n = Storage.importAll(data);
          Settings.load(); App.refreshAll();
          Utils.toast(`✓ Imported successfully (${n} keys)`, 'success');
        } catch { Utils.toast('Invalid JSON file', 'error'); }
      };
      r.readAsText(file); e.target.value = '';
    });
    document.getElementById('clearAllData')?.addEventListener('click', () => {
      ConfirmModal.show('⚠ Permanently delete ALL data? This cannot be undone.', () => {
        Storage.clear(); Settings.load(); App.refreshAll();
        Utils.toast('All data cleared', 'warning');
      });
    });
  }
};

// ── Theme ──────────────────────────────────────────────────
const Theme = {
  init: () => {
    const saved = localStorage.getItem('ftp_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    Theme.apply(saved || (prefersDark ? 'dark' : 'light'));
    document.getElementById('themeToggle')?.addEventListener('click', () => {
      Theme.apply(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem('ftp_theme')) Theme.apply(e.matches ? 'dark' : 'light');
    });
  },
  apply: (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ftp_theme', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme==='dark'?'#07090f':'#eef2f7');
    setTimeout(() => Charts.refreshTheme(), 60);
  }
};

// ── Dashboard ──────────────────────────────────────────────
const App = {
  refreshDashboard: () => {
    const period = document.getElementById('dashPeriod')?.value || 'month';
    const all    = Transactions.getAll();
    const fil    = Utils.filterByPeriod(all, period);
    const { income, expense, balance, savingsRate } = Utils.summarize(fil);
    const target = AppState.settings.savingsTarget || 20;
    const set = (id, v) => { const el=document.getElementById(id); if(el) el.textContent=v; };

    set('totalIncome',   Utils.formatCurrency(income));
    set('totalExpenses', Utils.formatCurrency(expense));
    set('netBalance',    Utils.formatCurrency(balance));
    set('savingsPercent', `${Math.round(savingsRate)}%`);
    set('savingsGoal',    `Target: ${target}%`);
    set('incomeChange',  `${fil.filter(t=>t.type==='income').length} transactions`);
    set('expenseChange', `${fil.filter(t=>t.type==='expense').length} transactions`);

    const srEl = document.getElementById('savingsRate');
    if (srEl) { srEl.textContent = balance>=0 ? '↑ Surplus' : '↓ Deficit'; srEl.style.color = balance>=0?'var(--income)':'var(--expense)'; }

    const balEl = document.getElementById('sidebarBalanceAmount');
    if (balEl) { balEl.textContent = Utils.formatCurrency(balance); balEl.style.color = balance>=0?'var(--income)':'var(--expense)'; }

    const greet = document.getElementById('dashGreeting');
    if (greet && AppState.settings.userName) {
      const h = new Date().getHours();
      greet.textContent = `${h<12?'Good morning':h<18?'Good afternoon':'Good evening'}, ${AppState.settings.userName}`;
    }

    const mn = Utils.groupByMonth(all, Utils.currentYear());
    Charts.renderCashflow('cashflowChart', Utils.MONTHS, mn.map(m=>m.income), mn.map(m=>m.expense));
    const cats = Utils.groupByCategory(fil, 'expense');
    if (cats.length) Charts.renderCategory('categoryChart', cats.map(c=>c.category), cats.map(c=>c.amount));

    App.renderInsights(fil, income, expense, balance, savingsRate, target);
    Transactions.renderRecent(8, period);

    // Loan summary on dashboard
    const ls = document.getElementById('loanDashSummary');
    if (ls) {
      const s = Loans.getSummary();
      if (s.active > 0) {
        ls.hidden = false;
        ls.innerHTML = `<div class="loan-dash-row">
          <span class="loan-dash-item receive">📥 Receive: <strong>${Utils.formatCurrency(s.toReceive)}</strong></span>
          <span class="loan-dash-item pay">📤 Pay: <strong>${Utils.formatCurrency(s.toPay)}</strong></span>
          ${s.overdue>0?`<span class="loan-dash-item overdue">⚠ ${s.overdue} overdue</span>`:''}
          <button class="link-btn" data-page="loans">View loans →</button>
        </div>`;
      } else { ls.hidden = true; }
    }
  },

  renderInsights: (txns, income, expense, balance, savingsRate, target) => {
    const el = document.getElementById('insightsList');
    if (!el) return;
    const items = [];
    if (savingsRate < target && income > 0)
      items.push({ type:'warn',    icon:'⚠', text:`Savings rate ${Math.round(savingsRate)}% is below your ${target}% target.` });
    const sp = {};
    txns.filter(t=>t.type==='expense').forEach(t=>{sp[t.category]=(sp[t.category]||0)+t.amount;});
    Budget.getAll().forEach(b => {
      if ((sp[b.category]||0) > b.amount)
        items.push({ type:'error', icon:'🔴', text:`${b.category} over budget by ${Utils.formatCurrency((sp[b.category]||0)-b.amount)}.` });
    });
    const ls = Loans.getSummary();
    if (ls.overdue > 0)
      items.push({ type:'error', icon:'⏰', text:`${ls.overdue} overdue loan${ls.overdue>1?'s':''} need attention.` });
    if (balance > 0 && savingsRate >= target)
      items.push({ type:'success', icon:'✓', text:`On track! Savings rate ${Math.round(savingsRate)}% meets your ${target}% goal.` });
    if (!txns.length)
      items.push({ type:'info', icon:'i', text:'No transactions this period yet.' });
    el.innerHTML = items.map(i =>
      `<div class="insight-item insight-item--${i.type}"><span class="insight-icon">${i.icon}</span><span>${Utils.escHtml(i.text)}</span></div>`
    ).join('') || '<div class="insight-item insight-item--info"><span class="insight-icon">i</span><span>All looks good!</span></div>';
  },

  refreshAll: () => {
    App.refreshDashboard();
    const p = AppState.currentPage;
    if (p==='transactions') Transactions.renderTable();
    if (p==='budget')       Budget.render();
    if (p==='goals')        Goals.render();
    if (p==='loans')        Loans.render();
    if (p==='reports')      { Reports.populateYears(); Reports.render(); }
    if (p==='settings')     Settings.render();
  },

  seedSampleData: () => {
    if (Transactions.getAll().length > 0) return;
    const now = new Date(), y = now.getFullYear();
    const m  = String(now.getMonth()+1).padStart(2,'0');
    const pm = now.getMonth()===0 ? `${y-1}-12` : `${y}-${String(now.getMonth()).padStart(2,'0')}`;
    [
      {type:'income', amount:5000, date:`${y}-${m}-01`, description:'Monthly Salary',   category:'Salary',         payment:'bank',   recurring:true,  recurringFreq:'monthly'},
      {type:'income', amount:850,  date:`${y}-${m}-05`, description:'Freelance Project', category:'Freelance',      payment:'bank'},
      {type:'income', amount:200,  date:`${y}-${m}-12`, description:'Stock Dividend',    category:'Investment',     payment:'bank'},
      {type:'expense',amount:1200, date:`${y}-${m}-01`, description:'Rent Payment',      category:'Housing',        payment:'bank',   recurring:true,  recurringFreq:'monthly'},
      {type:'expense',amount:320,  date:`${y}-${m}-03`, description:'Grocery Shopping',  category:'Food & Dining',  payment:'card'},
      {type:'expense',amount:45,   date:`${y}-${m}-04`, description:'Internet Bill',     category:'Utilities',      payment:'card',   recurring:true,  recurringFreq:'monthly'},
      {type:'expense',amount:80,   date:`${y}-${m}-06`, description:'Restaurant Dinner', category:'Food & Dining',  payment:'card'},
      {type:'expense',amount:150,  date:`${y}-${m}-08`, description:'Transport',         category:'Transportation', payment:'mobile'},
      {type:'expense',amount:60,   date:`${y}-${m}-10`, description:'Subscriptions',     category:'Entertainment',  payment:'card',   recurring:true,  recurringFreq:'monthly'},
      {type:'expense',amount:200,  date:`${y}-${m}-14`, description:'Clothing',          category:'Shopping',       payment:'card'},
      {type:'income', amount:5000, date:`${pm}-01`,     description:'Monthly Salary',    category:'Salary',         payment:'bank'},
      {type:'expense',amount:1200, date:`${pm}-01`,     description:'Rent Payment',      category:'Housing',        payment:'bank'},
      {type:'expense',amount:290,  date:`${pm}-05`,     description:'Groceries',         category:'Food & Dining',  payment:'card'},
    ].forEach(s => Transactions.upsert({ ...s }));
    [{category:'Food & Dining',amount:600},{category:'Transportation',amount:250},{category:'Entertainment',amount:150},{category:'Shopping',amount:300},{category:'Housing',amount:1500}]
      .forEach(b => Budget.upsert({ ...b }));
    Goals.upsert({ name:'Emergency Fund', target:10000, saved:3500, deadline:`${y+1}-12-31`, emoji:'💰' });
    Goals.upsert({ name:'Dream Vacation',  target:5000,  saved:1200, deadline:`${y}-08-01`,   emoji:'✈️' });
    Loans.upsert({ loanType:'given', personName:'John Doe',  amount:500,  date:`${y}-${m}-01`, dueDate:`${y}-06-30`, note:'Borrowed for rent', payments:[] });
    Loans.upsert({ loanType:'taken', personName:'Mom',       amount:1000, date:`${pm}-15`,      dueDate:`${y}-12-31`, note:'Personal loan', payments:[{id:Utils.uid(),amount:200,date:`${y}-${m}-01`,note:'First installment',createdAt:new Date().toISOString()}] });
  },

  init: () => {
    Storage.init();
    Settings.load();
    Theme.init();
    Modal.init();
    ConfirmModal.init();
    Nav.init();
    Transactions.init();
    Budget.init();
    Goals.init();
    Loans.init();
    Reports.init();
    Settings.init();
    DataManager.init();
    document.getElementById('dashPeriod')?.addEventListener('change', App.refreshDashboard);
    App.seedSampleData();
    const hash = location.hash.replace('#','');
    const valid = ['dashboard','transactions','budget','goals','loans','reports','settings'];
    Nav.goTo(valid.includes(hash) ? hash : 'dashboard');
  }
};

document.addEventListener('DOMContentLoaded', App.init);
