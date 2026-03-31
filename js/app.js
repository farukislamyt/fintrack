/**
 * FinTrack Main Application
 * Orchestrates all modules
 */

// ===================== App State =====================
const AppState = {
  currentPage: 'dashboard',
  settings: {
    userName: '',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    savingsTarget: 20,
    incomeCategories: ['Salary','Freelance','Business','Investment','Rental','Gift','Other Income'],
    expenseCategories: ['Food & Dining','Transportation','Shopping','Housing','Utilities','Healthcare','Entertainment','Education','Personal Care','Travel','Insurance','Savings','Other Expense']
  }
};

window.AppState = AppState;

// ===================== Modal Manager =====================
const Modal = {
  open: (id) => {
    const el = document.getElementById(id);
    if (el) { el.hidden = false; el.focus(); }
  },
  close: (id) => {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
  },
  init: () => {
    // Close on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.hidden = true;
      });
    });

    // Close buttons
    document.querySelectorAll('[data-modal]').forEach(btn => {
      btn.addEventListener('click', () => Modal.close(btn.dataset.modal));
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop:not([hidden])').forEach(m => m.hidden = true);
      }
    });
  }
};

window.Modal = Modal;

// ===================== Navigation =====================
const Nav = {
  init: () => {
    // Sidebar nav buttons
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        Nav.goTo(btn.dataset.page);
        // Mobile: close sidebar
        if (window.innerWidth <= 768) Nav.closeSidebar();
      });
    });

    // Link buttons in content (e.g. "View all" on dashboard)
    document.querySelectorAll('[data-page]').forEach(el => {
      if (!el.classList.contains('nav-item')) {
        el.addEventListener('click', () => Nav.goTo(el.dataset.page));
      }
    });

    // Hamburger
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const sidebarClose = document.getElementById('sidebarClose');

    hamburger?.addEventListener('click', () => {
      sidebar.classList.add('open');
      overlay.classList.add('visible');
      hamburger.setAttribute('aria-expanded', 'true');
    });

    [overlay, sidebarClose].forEach(el => {
      el?.addEventListener('click', Nav.closeSidebar);
    });
  },

  closeSidebar: () => {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.remove('visible');
    document.getElementById('hamburger')?.setAttribute('aria-expanded', 'false');
  },

  goTo: (page) => {
    AppState.currentPage = page;

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(btn => {
      const isActive = btn.dataset.page === page;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-current', isActive ? 'page' : 'false');
    });

    // Show page
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`)?.classList.add('active');

    // Update topbar title
    const titles = {
      dashboard: 'Dashboard', transactions: 'Transactions',
      budget: 'Budget Planner', goals: 'Financial Goals',
      reports: 'Reports & Analytics', settings: 'Settings'
    };
    document.getElementById('topbarTitle').textContent = titles[page] || page;

    // Page-specific render
    if (page === 'dashboard') App.refreshDashboard();
    if (page === 'transactions') Transactions.renderTable();
    if (page === 'budget') Budget.render();
    if (page === 'goals') Goals.render();
    if (page === 'reports') { Reports.populateYears(); Reports.render(); }
    if (page === 'settings') Settings.render();
  }
};

// ===================== Settings =====================
const Settings = {
  load: () => {
    const saved = Storage.get('settings');
    if (saved) AppState.settings = { ...AppState.settings, ...saved };
  },

  save: () => {
    AppState.settings.userName = document.getElementById('userName').value.trim();
    AppState.settings.currency = document.getElementById('currencySelect').value;
    AppState.settings.dateFormat = document.getElementById('dateFormat').value;
    AppState.settings.savingsTarget = parseFloat(document.getElementById('savingsTarget').value) || 20;
    Storage.set('settings', AppState.settings);
    Utils.toast('Settings saved!', 'success');
    App.refreshDashboard();
  },

  render: () => {
    const s = AppState.settings;
    document.getElementById('userName').value = s.userName || '';
    document.getElementById('currencySelect').value = s.currency || 'USD';
    document.getElementById('dateFormat').value = s.dateFormat || 'MM/DD/YYYY';
    document.getElementById('savingsTarget').value = s.savingsTarget || 20;
    Settings.renderCategories();
  },

  renderCategories: () => {
    const s = AppState.settings;

    const incomeEl = document.getElementById('incomeCatList');
    const expenseEl = document.getElementById('expenseCatList');

    if (incomeEl) {
      incomeEl.innerHTML = s.incomeCategories.map(c => `
        <div class="category-item">
          <span>${Utils.escHtml(c)}</span>
          <button class="cat-del" onclick="Settings.deleteCategory('income','${Utils.escHtml(c)}')" aria-label="Delete ${c}">✕</button>
        </div>
      `).join('');
    }

    if (expenseEl) {
      expenseEl.innerHTML = s.expenseCategories.map(c => `
        <div class="category-item">
          <span>${Utils.escHtml(c)}</span>
          <button class="cat-del" onclick="Settings.deleteCategory('expense','${Utils.escHtml(c)}')" aria-label="Delete ${c}">✕</button>
        </div>
      `).join('');
    }
  },

  addCategory: () => {
    const name = document.getElementById('newCategoryName').value.trim();
    const type = document.getElementById('newCategoryType').value;
    if (!name) { Utils.toast('Enter a category name', 'error'); return; }

    const key = type === 'income' ? 'incomeCategories' : 'expenseCategories';
    if (AppState.settings[key].includes(name)) {
      Utils.toast('Category already exists', 'warning'); return;
    }

    AppState.settings[key].push(name);
    AppState.settings[key].sort();
    Storage.set('settings', AppState.settings);
    document.getElementById('newCategoryName').value = '';
    Settings.renderCategories();
    Utils.toast('Category added', 'success');
  },

  deleteCategory: (type, name) => {
    const key = type === 'income' ? 'incomeCategories' : 'expenseCategories';
    AppState.settings[key] = AppState.settings[key].filter(c => c !== name);
    Storage.set('settings', AppState.settings);
    Settings.renderCategories();
  },

  init: () => {
    document.getElementById('saveSettings')?.addEventListener('click', Settings.save);
    document.getElementById('addCategoryBtn')?.addEventListener('click', Settings.addCategory);
  }
};

// ===================== Data Management =====================
const DataManager = {
  init: () => {
    document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
      const data = Storage.exportAll();
      Utils.download(JSON.stringify(data, null, 2), `fintrack-backup-${Utils.today()}.json`, 'application/json');
      Utils.toast('JSON exported!', 'success');
    });

    document.getElementById('exportCsvBtn')?.addEventListener('click', () => {
      const data = Utils.toCSV(Transactions.getAll());
      Utils.download(data, `fintrack-transactions-${Utils.today()}.csv`, 'text/csv');
      Utils.toast('CSV exported!', 'success');
    });

    document.getElementById('exportBtn')?.addEventListener('click', () => {
      const data = Utils.toCSV(Transactions.getAll());
      Utils.download(data, `fintrack-transactions-${Utils.today()}.csv`, 'text/csv');
      Utils.toast('CSV exported!', 'success');
    });

    document.getElementById('importFile')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          Storage.importAll(data);
          Settings.load();
          App.refreshAll();
          Utils.toast('Data imported successfully!', 'success');
        } catch {
          Utils.toast('Invalid file format', 'error');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    document.getElementById('clearAllData')?.addEventListener('click', () => {
      document.getElementById('confirmMessage').textContent = '⚠ This will permanently delete ALL your data. Are you sure?';
      document.getElementById('confirmDeleteBtn').onclick = () => {
        Storage.clear();
        Settings.load();
        App.refreshAll();
        Modal.close('confirmModal');
        Utils.toast('All data cleared', 'warning');
      };
      Modal.open('confirmModal');
    });
  }
};

// ===================== Theme =====================
const Theme = {
  init: () => {
    const saved = localStorage.getItem('fintrack_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);

    document.getElementById('themeToggle')?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('fintrack_theme', next);
    });
  }
};

// ===================== Main App =====================
const App = {
  refreshDashboard: () => {
    const period = document.getElementById('dashPeriod')?.value || 'month';
    const all = Transactions.getAll();
    const filtered = Utils.filterByPeriod(all, period);
    const { income, expense, balance, savingsRate } = Utils.summarize(filtered);
    const target = AppState.settings.savingsTarget || 20;

    document.getElementById('totalIncome').textContent = Utils.formatCurrency(income);
    document.getElementById('totalExpenses').textContent = Utils.formatCurrency(expense);
    document.getElementById('netBalance').textContent = Utils.formatCurrency(balance);
    document.getElementById('savingsPercent').textContent = `${Math.round(savingsRate)}%`;
    document.getElementById('savingsGoal').textContent = `Target: ${target}%`;
    document.getElementById('incomeChange').textContent = `${filtered.filter(t=>t.type==='income').length} transactions`;
    document.getElementById('expenseChange').textContent = `${filtered.filter(t=>t.type==='expense').length} transactions`;
    document.getElementById('savingsRate').textContent = balance >= 0 ? 'In surplus' : 'In deficit';

    // Update sidebar balance
    const balanceEl = document.getElementById('sidebarBalanceAmount');
    if (balanceEl) {
      balanceEl.textContent = Utils.formatCurrency(balance);
      balanceEl.style.color = balance >= 0 ? 'var(--income)' : 'var(--expense)';
    }

    // Dashboard charts
    const monthlyData = Utils.groupByMonth(all, new Date().getFullYear());
    const labels = Utils.MONTHS;
    Charts.renderCashflow('cashflowChart', labels, monthlyData.map(m => m.income), monthlyData.map(m => m.expense));

    const cats = Utils.groupByCategory(filtered, 'expense');
    if (cats.length > 0) {
      Charts.renderCategory('categoryChart', cats.map(c => c.category), cats.map(c => c.amount));
    }

    Transactions.renderRecent(8, period);
  },

  refreshAll: () => {
    App.refreshDashboard();
    if (AppState.currentPage === 'transactions') Transactions.renderTable();
    if (AppState.currentPage === 'budget') Budget.render();
    if (AppState.currentPage === 'goals') Goals.render();
    if (AppState.currentPage === 'reports') Reports.render();
    if (AppState.currentPage === 'settings') Settings.render();
  },

  seedSampleData: () => {
    // Only seed if no transactions exist
    if (Transactions.getAll().length > 0) return;

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const pm = String(now.getMonth()).padStart(2, '0') || '12';

    const samples = [
      { type:'income', amount:5000, date:`${y}-${m}-01`, description:'Monthly Salary', category:'Salary', payment:'bank', notes:'', recurring:true, recurringFreq:'monthly' },
      { type:'income', amount:850, date:`${y}-${m}-05`, description:'Freelance Project', category:'Freelance', payment:'bank', notes:'Web design project' },
      { type:'expense', amount:1200, date:`${y}-${m}-01`, description:'Rent Payment', category:'Housing', payment:'bank', notes:'', recurring:true, recurringFreq:'monthly' },
      { type:'expense', amount:320, date:`${y}-${m}-03`, description:'Grocery Shopping', category:'Food & Dining', payment:'card' },
      { type:'expense', amount:45, date:`${y}-${m}-04`, description:'Internet Bill', category:'Utilities', payment:'card', recurring:true, recurringFreq:'monthly' },
      { type:'expense', amount:80, date:`${y}-${m}-06`, description:'Restaurant Dinner', category:'Food & Dining', payment:'card' },
      { type:'expense', amount:150, date:`${y}-${m}-08`, description:'Uber/Transport', category:'Transportation', payment:'mobile' },
      { type:'expense', amount:60, date:`${y}-${m}-10`, description:'Netflix & Spotify', category:'Entertainment', payment:'card' },
      { type:'income', amount:200, date:`${y}-${m}-12`, description:'Stock Dividend', category:'Investment', payment:'bank' },
      { type:'expense', amount:200, date:`${y}-${m}-14`, description:'Clothing & Shoes', category:'Shopping', payment:'card' },
      { type:'expense', amount:30, date:`${y}-${m}-15`, description:'Doctor Visit', category:'Healthcare', payment:'cash' },
      { type:'expense', amount:100, date:`${y}-${m}-18`, description:'Online Course', category:'Education', payment:'card' },
      { type:'expense', amount:250, date:`${y}-${m}-20`, description:'Weekend Trip', category:'Travel', payment:'card' },
    ];

    samples.forEach(s => Transactions.upsert({ id: Utils.uid(), createdAt: new Date().toISOString(), ...s }));

    // Sample budgets
    const budgets = [
      { category:'Food & Dining', amount:600 },
      { category:'Transportation', amount:250 },
      { category:'Entertainment', amount:150 },
      { category:'Shopping', amount:300 },
      { category:'Housing', amount:1500 },
    ];
    budgets.forEach(b => Budget.upsert({ id: Utils.uid(), ...b }));

    // Sample goal
    Goals.upsert({ id: Utils.uid(), name:'Emergency Fund', target:10000, saved:3500, deadline:'2025-12-31', emoji:'💰', createdAt: new Date().toISOString() });
    Goals.upsert({ id: Utils.uid(), name:'Dream Vacation', target:5000, saved:1200, deadline:'2025-08-01', emoji:'✈️', createdAt: new Date().toISOString() });
  },

  init: () => {
    // Load settings first
    Settings.load();

    // Init theme
    Theme.init();

    // Init modals
    Modal.init();

    // Init navigation
    Nav.init();

    // Init modules
    Transactions.init();
    Budget.init();
    Goals.init();
    Reports.init();
    Settings.init();
    DataManager.init();

    // Period selector on dashboard
    document.getElementById('dashPeriod')?.addEventListener('change', App.refreshDashboard);

    // Seed sample data on first load
    App.seedSampleData();

    // Initial render
    App.refreshDashboard();
  }
};

// ===================== Boot =====================
document.addEventListener('DOMContentLoaded', App.init);
