/**
 * FinTrack Pro — App v3.0
 * • Centralized confirm-modal handler (fixes duplicate handlers)
 * • Theme persistence with system-preference detection
 * • Dashboard insights panel
 * • Keyboard navigation
 * • Storage usage indicator
 * • Error boundary for module failures
 * • PWA install prompt & update notification
 * • About section with version & developer info
 */

// ── App State ──────────────────────────────────────────────
const AppState = {
  currentPage: 'dashboard',
  settings: {
    userName:          '',
    currency:          'USD',
    dateFormat:        'MM/DD/YYYY',
    savingsTarget:     20,
    incomeCategories:  ['Salary','Freelance','Business','Investment','Rental','Gift','Other Income'],
    expenseCategories: ['Food & Dining','Transportation','Shopping','Housing','Utilities',
                        'Healthcare','Entertainment','Education','Personal Care',
                        'Travel','Insurance','Savings','Other Expense']
  }
};
window.AppState = AppState;

// ── Modal Manager ──────────────────────────────────────────
const Modal = {
  open: (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.hidden = false;
    el.removeAttribute('aria-hidden');
    // Focus first interactive element
    requestAnimationFrame(() => {
      const first = el.querySelector('input:not([type="hidden"]), select, textarea, button:not(.modal-close)');
      if (first) first.focus();
    });
    document.body.style.overflow = 'hidden';
  },
  close: (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.hidden = true;
    el.setAttribute('aria-hidden', 'true');
    // Restore scroll only if no other modals open
    if (!document.querySelector('.modal-backdrop:not([hidden])')) {
      document.body.style.overflow = '';
    }
  },
  init: () => {
    // Backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) Modal.close(backdrop.id);
      });
    });
    // Close buttons
    document.querySelectorAll('[data-modal]').forEach(btn => {
      btn.addEventListener('click', () => Modal.close(btn.dataset.modal));
    });
    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const open = document.querySelector('.modal-backdrop:not([hidden])');
      if (open) Modal.close(open.id);
    });
  }
};
window.Modal = Modal;

// ── Centralized Confirm Delete Handler ────────────────────
// Fixes: previous code attached onclick directly to button (overwrote on each call)
const ConfirmModal = {
  init: () => {
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', (e) => {
      const btn  = e.currentTarget;
      const id   = btn.dataset.pendingId;
      const type = btn.dataset.pendingType;
      if (!id) return;

      Modal.close('confirmModal');

      if (type === 'budget') {
        Budget.remove(id);
        Budget.render();
        Utils.toast('Budget deleted', 'success');
      } else if (type === 'goal') {
        Goals.remove(id);
        Goals.render();
        Utils.toast('Goal deleted', 'success');
      } else {
        // transaction (default)
        Transactions.remove(id);
        Transactions.renderTable();
        App.refreshDashboard();
        Utils.toast('Transaction deleted', 'success');
      }

      delete btn.dataset.pendingId;
      delete btn.dataset.pendingType;
    });
  }
};

// ── Navigation ─────────────────────────────────────────────
const Nav = {
  init: () => {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        Nav.goTo(btn.dataset.page);
        if (window.innerWidth <= 768) Nav.closeSidebar();
      });
    });

    // "View all" links in content
    document.querySelectorAll('[data-page]:not(.nav-item)').forEach(el => {
      el.addEventListener('click', () => Nav.goTo(el.dataset.page));
    });

    // Hamburger
    const hamburger = document.getElementById('hamburger');
    const overlay   = document.getElementById('sidebarOverlay');
    const closeBtn  = document.getElementById('sidebarClose');

    hamburger?.addEventListener('click', () => {
      Nav.openSidebar();
      hamburger.setAttribute('aria-expanded', 'true');
    });
    overlay?.addEventListener('click',  Nav.closeSidebar);
    closeBtn?.addEventListener('click', Nav.closeSidebar);

    // Keyboard: close sidebar on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const sidebar = document.getElementById('sidebar');
        if (sidebar?.classList.contains('open')) Nav.closeSidebar();
      }
    });
  },

  openSidebar: () => {
    document.getElementById('sidebar')?.classList.add('open');
    document.getElementById('sidebarOverlay')?.classList.add('visible');
    document.getElementById('hamburger')?.setAttribute('aria-expanded', 'true');
  },

  closeSidebar: () => {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.remove('visible');
    document.getElementById('hamburger')?.setAttribute('aria-expanded', 'false');
  },

  goTo: (page) => {
    if (!page) return;
    AppState.currentPage = page;

    // Update nav active
    document.querySelectorAll('.nav-item').forEach(btn => {
      const active = btn.dataset.page === page;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-current', active ? 'page' : 'false');
    });

    // Show page
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) {
      pageEl.classList.add('active');
      pageEl.focus && pageEl.setAttribute('tabindex', '-1');
    }

    // Topbar title
    const titles = {
      dashboard: 'Dashboard', transactions: 'Transactions',
      budget: 'Budget Planner', goals: 'Financial Goals',
      reports: 'Reports & Analytics', settings: 'Settings'
    };
    const topbar = document.getElementById('topbarTitle');
    if (topbar) topbar.textContent = titles[page] || page;

    // Page-specific render
    const renders = {
      dashboard:    () => App.refreshDashboard(),
      transactions: () => Transactions.renderTable(),
      budget:       () => Budget.render(),
      goals:        () => Goals.render(),
      reports:      () => { Reports.populateYears(); Reports.render(); },
      settings:     () => Settings.render()
    };
    renders[page]?.();

    // Update URL hash (for bookmarking)
    history.replaceState(null, '', `#${page}`);
  }
};

// ── Settings ───────────────────────────────────────────────
const Settings = {
  load: () => {
    const saved = Storage.get('settings');
    if (saved) {
      // Deep-merge: preserve default categories, merge with saved
      const merged = { ...AppState.settings, ...saved };
      // Merge category arrays (union) so no custom categories are lost
      if (saved.incomeCategories) {
        const allIncome = new Set([...AppState.settings.incomeCategories, ...saved.incomeCategories]);
        merged.incomeCategories = [...allIncome].sort();
      }
      if (saved.expenseCategories) {
        const allExpense = new Set([...AppState.settings.expenseCategories, ...saved.expenseCategories]);
        merged.expenseCategories = [...allExpense].sort();
      }
      AppState.settings = merged;
    }
  },

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
    document.getElementById('userName').value        = s.userName      || '';
    document.getElementById('currencySelect').value  = s.currency      || 'USD';
    document.getElementById('dateFormat').value      = s.dateFormat    || 'MM/DD/YYYY';
    document.getElementById('savingsTarget').value   = s.savingsTarget || 20;
    Settings.renderCategories();
    Settings.renderStorageInfo();
  },

  renderCategories: () => {
    const s = AppState.settings;
    const render = (listId, type, cats) => {
      const el = document.getElementById(listId);
      if (!el) return;
      el.innerHTML = cats.map(c => `
        <div class="category-item">
          <span>${Utils.escHtml(c)}</span>
          <button class="cat-del" data-type="${type}" data-name="${Utils.escHtml(c)}" aria-label="Delete ${Utils.escHtml(c)}">✕</button>
        </div>`).join('');
    };
    render('incomeCatList',  'income',  s.incomeCategories);
    render('expenseCatList', 'expense', s.expenseCategories);
  },

  renderStorageInfo: () => {
    const el = document.getElementById('storageInfo');
    if (!el) return;
    const usage = Storage.getUsage();
    el.innerHTML = `
      <div class="storage-usage">
        <div class="storage-bar-wrap">
          <div class="storage-bar-fill" style="width:${usage.pct}%"></div>
        </div>
        <span class="storage-text">${usage.kb} KB used (~${usage.pct}% of 5 MB)</span>
      </div>`;
  },

  deleteCategory: (type, name) => {
    const key = type === 'income' ? 'incomeCategories' : 'expenseCategories';
    AppState.settings[key] = AppState.settings[key].filter(c => c !== name);
    Storage.set('settings', AppState.settings);
    Settings.renderCategories();
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
    Utils.toast('✓ Category added', 'success');
  },

  init: () => {
    document.getElementById('saveSettings')  ?.addEventListener('click', Settings.save);
    document.getElementById('addCategoryBtn')?.addEventListener('click', Settings.addCategory);
    document.getElementById('newCategoryName')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') Settings.addCategory();
    });

    // Category delete delegation
    ['incomeCatList','expenseCatList'].forEach(listId => {
      document.getElementById(listId)?.addEventListener('click', (e) => {
        const btn = e.target.closest('.cat-del');
        if (!btn) return;
        Settings.deleteCategory(btn.dataset.type, btn.dataset.name);
      });
    });
  }
};

// ── Data Manager ───────────────────────────────────────────
const DataManager = {
  init: () => {
    document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
      const data = Storage.exportAll();
      Utils.download(JSON.stringify(data, null, 2), `fintrack-backup-${Utils.today()}.json`, 'application/json');
      Utils.toast('✓ JSON exported', 'success');
    });

    document.getElementById('exportCsvBtn')?.addEventListener('click', () => {
      Utils.download(Utils.toCSV(Transactions.getAll()), `fintrack-transactions-${Utils.today()}.csv`, 'text/csv');
      Utils.toast('✓ CSV exported', 'success');
    });

    document.getElementById('exportBtn')?.addEventListener('click', () => {
      Utils.download(Utils.toCSV(Transactions.getAll()), `fintrack-transactions-${Utils.today()}.csv`, 'text/csv');
      Utils.toast('✓ CSV exported', 'success');
    });

    document.getElementById('importFile')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data  = JSON.parse(ev.target.result);
          const count = Storage.importAll(data);
          Settings.load();
          App.refreshAll();
          Utils.toast(`✓ Imported ${count} keys successfully`, 'success');
        } catch {
          Utils.toast('Invalid file — could not parse JSON', 'error');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    document.getElementById('clearAllData')?.addEventListener('click', () => {
      document.getElementById('confirmMessage').textContent =
        '⚠ This will permanently delete ALL data. Are you sure?';
      document.getElementById('confirmDeleteBtn').dataset.pendingType = 'clearAll';
      Modal.open('confirmModal');
    });
  }
};

// ── Theme ──────────────────────────────────────────────────
const Theme = {
  init: () => {
    // Detect system preference if no saved preference
    const saved = localStorage.getItem('ftp_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    Theme.apply(theme);

    document.getElementById('themeToggle')?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      Theme.apply(current === 'dark' ? 'light' : 'dark');
    });

    // Respond to system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('ftp_theme')) {
        Theme.apply(e.matches ? 'dark' : 'light');
      }
    });
  },

  apply: (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ftp_theme', theme);
    // Update meta theme-color
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content', theme === 'dark' ? '#080b10' : '#f0f4f8'
    );
    // Refresh charts for new colors
    setTimeout(() => Charts.refreshTheme(), 50);
  }
};

// ── Dashboard ──────────────────────────────────────────────
const App = {
  refreshDashboard: () => {
    const period   = document.getElementById('dashPeriod')?.value || 'month';
    const all      = Transactions.getAll();
    const filtered = Utils.filterByPeriod(all, period);
    const { income, expense, balance, savingsRate } = Utils.summarize(filtered);
    const target   = AppState.settings.savingsTarget || 20;

    // Update cards
    const safe = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    safe('totalIncome',   Utils.formatCurrency(income));
    safe('totalExpenses', Utils.formatCurrency(expense));
    safe('netBalance',    Utils.formatCurrency(balance));
    safe('savingsPercent', `${Math.round(savingsRate)}%`);
    safe('savingsGoal',    `Target: ${target}%`);
    safe('incomeChange',  `${filtered.filter(t => t.type === 'income').length} transactions`);
    safe('expenseChange', `${filtered.filter(t => t.type === 'expense').length} transactions`);

    const srEl = document.getElementById('savingsRate');
    if (srEl) {
      srEl.textContent = balance >= 0 ? '↑ In surplus' : '↓ In deficit';
      srEl.style.color = balance >= 0 ? 'var(--income)' : 'var(--expense)';
    }

    // Savings rate color
    const spEl = document.getElementById('savingsPercent');
    if (spEl) spEl.style.color = savingsRate >= target ? 'var(--gold)' : 'var(--text-primary)';

    // Sidebar balance
    const balEl = document.getElementById('sidebarBalanceAmount');
    if (balEl) {
      balEl.textContent  = Utils.formatCurrency(balance);
      balEl.style.color  = balance >= 0 ? 'var(--income)' : 'var(--expense)';
    }

    // Greeting
    const userName = AppState.settings.userName;
    const greetEl  = document.getElementById('dashGreeting');
    if (greetEl && userName) {
      const hr    = new Date().getHours();
      const greet = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
      greetEl.textContent = `${greet}, ${userName}`;
    }

    // Charts
    const yr = Utils.currentYear();
    const monthlyData = Utils.groupByMonth(all, yr);
    Charts.renderCashflow(
      'cashflowChart',
      Utils.MONTHS,
      monthlyData.map(m => m.income),
      monthlyData.map(m => m.expense)
    );

    const cats = Utils.groupByCategory(filtered, 'expense');
    if (cats.length > 0) {
      Charts.renderCategory('categoryChart', cats.map(c => c.category), cats.map(c => c.amount));
    }

    // Insights
    App.renderInsights(filtered, income, expense, balance, savingsRate, target);

    Transactions.renderRecent(8, period);
  },

  renderInsights: (txns, income, expense, balance, savingsRate, target) => {
    const el = document.getElementById('insightsList');
    if (!el) return;

    const insights = [];

    if (savingsRate < target && income > 0) {
      insights.push({
        type: 'warn',
        icon: '⚠',
        text: `Savings rate ${Math.round(savingsRate)}% is below your ${target}% target.`
      });
    }

    // Over-budget categories
    const budgets  = Budget.getAll();
    const month    = Utils.currentMonth();
    const spending = {};
    txns.filter(t => t.type === 'expense' && t.date.startsWith(month))
        .forEach(t => { spending[t.category] = (spending[t.category] || 0) + t.amount; });

    budgets.forEach(b => {
      const spent = spending[b.category] || 0;
      if (spent > b.amount) {
        insights.push({
          type: 'error',
          icon: '🔴',
          text: `${b.category} is over budget by ${Utils.formatCurrency(spent - b.amount)}.`
        });
      }
    });

    if (balance > 0 && savingsRate >= target) {
      insights.push({
        type: 'success',
        icon: '✓',
        text: `On track! Savings rate ${Math.round(savingsRate)}% meets your ${target}% goal.`
      });
    }

    if (txns.length === 0) {
      insights.push({ type: 'info', icon: 'i', text: 'No transactions in this period yet.' });
    }

    el.innerHTML = insights.map(i => `
      <div class="insight-item insight-item--${i.type}">
        <span class="insight-icon">${i.icon}</span>
        <span>${Utils.escHtml(i.text)}</span>
      </div>`).join('') || '<div class="insight-item insight-item--info"><span class="insight-icon">i</span><span>All looks good!</span></div>';
  },

  refreshAll: () => {
    App.refreshDashboard();
    const p = AppState.currentPage;
    if (p === 'transactions') Transactions.renderTable();
    if (p === 'budget')       Budget.render();
    if (p === 'goals')        Goals.render();
    if (p === 'reports')      { Reports.populateYears(); Reports.render(); }
    if (p === 'settings')     Settings.render();
  },

  seedSampleData: () => {
    if (Transactions.getAll().length > 0) return;

    const now  = new Date();
    const y    = now.getFullYear();
    const m    = String(now.getMonth() + 1).padStart(2, '0');
    // FIX: correct previous month calculation
    const pm   = now.getMonth() === 0
      ? `${y - 1}-12`
      : `${y}-${String(now.getMonth()).padStart(2, '0')}`;

    const samples = [
      { type:'income',  amount:5000,  date:`${y}-${m}-01`, description:'Monthly Salary',     category:'Salary',          payment:'bank',   recurring:true,  recurringFreq:'monthly' },
      { type:'income',  amount:850,   date:`${y}-${m}-05`, description:'Freelance Project',   category:'Freelance',       payment:'bank',   notes:'Web design project' },
      { type:'income',  amount:200,   date:`${y}-${m}-12`, description:'Stock Dividend',      category:'Investment',      payment:'bank' },
      { type:'expense', amount:1200,  date:`${y}-${m}-01`, description:'Rent Payment',        category:'Housing',         payment:'bank',   recurring:true,  recurringFreq:'monthly' },
      { type:'expense', amount:320,   date:`${y}-${m}-03`, description:'Grocery Shopping',    category:'Food & Dining',   payment:'card' },
      { type:'expense', amount:45,    date:`${y}-${m}-04`, description:'Internet Bill',       category:'Utilities',       payment:'card',   recurring:true,  recurringFreq:'monthly' },
      { type:'expense', amount:80,    date:`${y}-${m}-06`, description:'Restaurant Dinner',   category:'Food & Dining',   payment:'card' },
      { type:'expense', amount:150,   date:`${y}-${m}-08`, description:'Transport / Uber',    category:'Transportation',  payment:'mobile' },
      { type:'expense', amount:60,    date:`${y}-${m}-10`, description:'Netflix & Spotify',   category:'Entertainment',   payment:'card',   recurring:true,  recurringFreq:'monthly' },
      { type:'expense', amount:200,   date:`${y}-${m}-14`, description:'Clothing & Shoes',    category:'Shopping',        payment:'card' },
      { type:'expense', amount:30,    date:`${y}-${m}-15`, description:'Doctor Visit',        category:'Healthcare',      payment:'cash' },
      { type:'expense', amount:100,   date:`${y}-${m}-18`, description:'Online Course',       category:'Education',       payment:'card' },
      { type:'expense', amount:250,   date:`${y}-${m}-20`, description:'Weekend Trip',        category:'Travel',          payment:'card' },
      // Previous month
      { type:'income',  amount:5000,  date:`${pm}-01`,     description:'Monthly Salary',      category:'Salary',          payment:'bank' },
      { type:'expense', amount:1200,  date:`${pm}-01`,     description:'Rent Payment',        category:'Housing',         payment:'bank' },
      { type:'expense', amount:290,   date:`${pm}-05`,     description:'Grocery Shopping',    category:'Food & Dining',   payment:'card' },
      { type:'expense', amount:45,    date:`${pm}-04`,     description:'Internet Bill',       category:'Utilities',       payment:'card' },
      { type:'expense', amount:120,   date:`${pm}-12`,     description:'Transport',           category:'Transportation',  payment:'mobile' },
    ];
    samples.forEach(s => Transactions.upsert({ id: Utils.uid(), ...s }));

    [
      { category:'Food & Dining', amount:600 },
      { category:'Transportation', amount:250 },
      { category:'Entertainment', amount:150 },
      { category:'Shopping', amount:300 },
      { category:'Housing', amount:1500 },
    ].forEach(b => Budget.upsert({ id: Utils.uid(), ...b }));

    Goals.upsert({ id: Utils.uid(), name:'Emergency Fund',  target:10000, saved:3500, deadline:'2026-12-31', emoji:'💰' });
    Goals.upsert({ id: Utils.uid(), name:'Dream Vacation',  target:5000,  saved:1200, deadline:'2026-08-01', emoji:'✈️' });
    Goals.upsert({ id: Utils.uid(), name:'New Laptop',      target:2000,  saved:800,  deadline:'2026-06-01', emoji:'💻' });
  },

  init: () => {
    // Storage first
    Storage.init();
    Settings.load();
    Theme.init();
    Modal.init();
    ConfirmModal.init();
    Nav.init();

    // Clear-all-data: override centralized handler
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', async (e) => {
      if (e.currentTarget.dataset.pendingType === 'clearAll') {
        await Storage.clear();
        Settings.load();
        App.refreshAll();
        Modal.close('confirmModal');
        Utils.toast('All data cleared', 'warning');
        delete e.currentTarget.dataset.pendingType;
        delete e.currentTarget.dataset.pendingId;
      }
    }, true); // capture phase to run before ConfirmModal handler

    // Modules
    Transactions.init();
    Budget.init();
    Goals.init();
    Reports.init();
    Settings.init();
    DataManager.init();

    // Period selector
    document.getElementById('dashPeriod')?.addEventListener('change', App.refreshDashboard);

    // Handle hash navigation on load
    const hash = location.hash.replace('#', '');
    const validPages = ['dashboard','transactions','budget','goals','reports','settings'];

    // Seed sample data BEFORE processing recurring or navigating
    App.seedSampleData();
    try { Transactions.processRecurring(); } catch (err) { console.warn('[App] processRecurring failed:', err); }

    if (hash && validPages.includes(hash)) {
      Nav.goTo(hash);
    } else {
      App.refreshDashboard();
    }

    // Listen for storage changes from other tabs
    window.addEventListener('storage', () => App.refreshAll());

    // ── PWA Install Prompt & Update Banner ──────────────────
    FinTrackPWA.init();
  }
};

// ── PWA Module ────────────────────────────────────────────────
const FinTrackPWA = {
  deferredPrompt: null,

  init: () => {
    window.FinTrackPWA = FinTrackPWA;

    // ── Install prompt ─────────────────────────────────────
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      FinTrackPWA.deferredPrompt = e;
      // Don't show if already dismissed in this session
      if (!sessionStorage.getItem('ftp_pwa_dismissed')) {
        const banner = document.getElementById('pwaInstallBanner');
        if (banner) {
          setTimeout(() => { banner.hidden = false; }, 3000);
        }
      }
    });

    document.getElementById('pwaInstallBtn')?.addEventListener('click', async () => {
      if (!FinTrackPWA.deferredPrompt) return;
      FinTrackPWA.deferredPrompt.prompt();
      const result = await FinTrackPWA.deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        Utils.toast('✓ FinTrack Pro installed!', 'success', 4000);
      }
      FinTrackPWA.deferredPrompt = null;
      document.getElementById('pwaInstallBanner') && (document.getElementById('pwaInstallBanner').hidden = true);
    });

    document.getElementById('pwaDismissBtn')?.addEventListener('click', () => {
      document.getElementById('pwaInstallBanner') && (document.getElementById('pwaInstallBanner').hidden = true);
      sessionStorage.setItem('ftp_pwa_dismissed', '1');
    });

    // ── Update banner ──────────────────────────────────────
    document.getElementById('updateNowBtn')?.addEventListener('click', () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(reg => {
          if (reg && reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        });
        window.location.reload();
      }
    });

    document.getElementById('updateDismissBtn')?.addEventListener('click', () => {
      document.getElementById('updateBanner') && (document.getElementById('updateBanner').hidden = true);
    });

    // Listen for messages from SW
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NEW_VERSION') {
          const banner = document.getElementById('updateBanner');
          if (banner) banner.hidden = false;
        }
      });
    }
  },

  onUpdateAvailable: (reg) => {
    const banner = document.getElementById('updateBanner');
    if (banner) banner.hidden = false;
  }
};
window.FinTrackPWA = FinTrackPWA;

document.addEventListener('DOMContentLoaded', App.init);
