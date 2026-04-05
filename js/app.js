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
    Settings.renderStorageInfoSection();
    Settings.renderBackupHistory();
    Settings.renderImportOptions();
    Settings.renderThemeSection();
    Settings.renderAppInfo();
    Settings.renderPagesLinks();
  },
  
  renderAppInfo: () => {
    const el = document.getElementById('appInfoSection');
    if (!el || !window.APP_CONFIG) return;
    const cfg = window.APP_CONFIG;
    el.innerHTML = `
      <div class="settings-card settings-card--info">
        <h3 class="settings-card-title">About FinTrack Pro</h3>
        <div class="app-info-grid">
          <div class="info-row">
            <span class="info-label">Version</span>
            <span class="info-value">${cfg.VERSION}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Build Date</span>
            <span class="info-value">${cfg.BUILD_DATE}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Developer</span>
            <span class="info-value">${cfg.DEVELOPER}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value">${cfg.EMAIL}</span>
          </div>
          <div class="info-row">
            <span class="info-label">License</span>
            <span class="info-value">${cfg.LICENSE}</span>
          </div>
        </div>
      </div>
    `;
  },

  renderPagesLinks: () => {
    const el = document.getElementById('appInfoSection');
    if (!el || typeof Pages === 'undefined') return;

    const pagesHTML = `
      <div class="settings-card settings-card--pages">
        <h3 class="settings-card-title">Resources & Information</h3>
        <div class="pages-grid">
          <a href="#" data-page-link="about" data-mode="page" class="page-link">
            <span class="page-link-icon">ℹ️</span>
            <div class="page-link-text">
              <strong>About Us</strong>
              <small>Learn about FinTrack Pro</small>
            </div>
          </a>
          <a href="#" data-page-link="privacy" data-mode="page" class="page-link">
            <span class="page-link-icon">🔒</span>
            <div class="page-link-text">
              <strong>Privacy Policy</strong>
              <small>Your data privacy</small>
            </div>
          </a>
          <a href="#" data-page-link="terms" data-mode="page" class="page-link">
            <span class="page-link-icon">⚖️</span>
            <div class="page-link-text">
              <strong>Terms of Service</strong>
              <small>Legal terms</small>
            </div>
          </a>
          <a href="#" data-page-link="help" data-mode="page" class="page-link">
            <span class="page-link-icon">❓</span>
            <div class="page-link-text">
              <strong>Help & FAQ</strong>
              <small>Frequently asked questions</small>
            </div>
          </a>
          <a href="#" data-page-link="contact" data-mode="page" class="page-link">
            <span class="page-link-icon">✉️</span>
            <div class="page-link-text">
              <strong>Contact Us</strong>
              <small>Get in touch with us</small>
            </div>
          </a>
        </div>
      </div>
    `;

    el.innerHTML = el.innerHTML + pagesHTML;
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
  renderStorageInfoSection: () => {
    const el = document.getElementById('storageInfoSection');
    if (!el) return;
    const u = Storage.getUsage();
    const pct = parseFloat(u.pct);
    const status = pct > 80 ? 'critical' : pct > 60 ? 'warning' : 'ok';
    el.innerHTML = `
      <div class="storage-usage storage-${status}">
        <div class="storage-bar-wrap">
          <div class="storage-bar-fill" style="width:${u.pct}%"></div>
        </div>
        <span class="storage-text">${u.kb} KB used (~${u.pct}% of 5 MB)</span>
        ${pct > 80 ? '<p class="storage-warning">⚠ Storage nearly full. Consider exporting data.</p>' : ''}
      </div>
    `;
  },

  renderBackupHistory: () => {
    const el = document.getElementById('backupHistorySection');
    if (!el || typeof BackupManager === 'undefined') return;
    
    const backups = BackupManager.getBackupHistory();
    if (backups.length === 0) {
      el.innerHTML = '<p class="text-muted">No backups created yet. Export to create one.</p>';
      return;
    }

    const html = backups.map((b, i) => `
      <div class="backup-item">
        <div class="backup-info">
          <span class="backup-date">${new Date(b.timestamp).toLocaleString()}</span>
          <span class="backup-size">${(b.size / 1024).toFixed(1)} KB</span>
        </div>
        <div class="backup-stats">
          ${b.stats ? `<small>${b.stats.transactions || 0} txns • ${b.stats.budgets || 0} budgets • ${b.stats.goals || 0} goals</small>` : ''}
        </div>
      </div>
    `).join('');

    el.innerHTML = `<div class="backup-list">${html}</div>`;
  },

  renderImportOptions: () => {
    const el = document.getElementById('importOptionsSection');
    if (!el) return;

    el.innerHTML = `
      <div class="import-options">
        <label class="option-item">
          <input type="radio" name="importMode" value="replace" checked />
          <span class="option-label">
            <strong>Replace All Data</strong>
            <small>Overwrite everything with imported data</small>
          </span>
        </label>
        <label class="option-item">
          <input type="radio" name="importMode" value="merge" />
          <span class="option-label">
            <strong>Merge with Current</strong>
            <small>Keep existing data and add new items</small>
          </span>
        </label>
      </div>
    `;
  },

  renderThemeSection: () => {
    const el = document.getElementById('themeSection');
    if (!el || typeof ThemeManager === 'undefined') return;

    const currentTheme = ThemeManager.getTheme();
    const themes = [
      { value: 'auto', label: '🌓 Auto', desc: 'Follow system preference' },
      { value: 'light', label: '☀️ Light', desc: 'Always light theme' },
      { value: 'dark', label: '🌙 Dark', desc: 'Always dark theme' }
    ];

    el.innerHTML = `
      <div class="theme-options">
        ${themes.map(t => `
          <label class="option-item">
            <input type="radio" name="themeOption" value="${t.value}" ${currentTheme === t.value ? 'checked' : ''} />
            <span class="option-label">
              <strong>${t.label}</strong>
              <small>${t.desc}</small>
            </span>
          </label>
        `).join('')}
      </div>
      <div class="accessibility-options">
        <label class="checkbox-item">
          <input type="checkbox" id="reducedMotionChk" ${ThemeManager.respects_prefers_reduced_motion() ? 'checked' : ''} />
          <span>Reduce motion</span>
        </label>
      </div>
    `;

    // Add event listeners
    document.querySelectorAll('input[name="themeOption"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        ThemeManager.setTheme(e.target.value);
        DataSync.notifyObservers('settings', { type: 'theme-changed' });
      });
    });

    const reducedMotionChk = document.getElementById('reducedMotionChk');
    if (reducedMotionChk) {
      reducedMotionChk.addEventListener('change', (e) => {
        ThemeManager.enableReducedMotion(e.target.checked);
      });
    }
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
    // Export JSON
    document.getElementById('exportJsonBtn')?.addEventListener('click', async () => {
      if (typeof BackupManager === 'undefined') {
        Utils.toast('Backup system not ready', 'error');
        return;
      }
      const result = BackupManager.export_json();
      Utils.toast(result ? '✓ JSON exported successfully' : '✗ Export failed', result ? 'success' : 'error');
    });

    // Export CSV
    document.getElementById('exportCsvBtn')?.addEventListener('click', async () => {
      if (typeof BackupManager === 'undefined') {
        Utils.toast('Backup system not ready', 'error');
        return;
      }
      const result = BackupManager.export_csv();
      Utils.toast(result ? '✓ CSV exported successfully' : '✗ Export failed', result ? 'success' : 'error');
    });

    // Import file
    document.getElementById('importFile')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (typeof BackupManager === 'undefined') {
        Utils.toast('Backup system not ready', 'error');
        e.target.value = '';
        return;
      }

      // Validate and prepare import
      const validation = await BackupManager.importFromJSON(file);
      
      if (!validation.success) {
        Utils.toast('✗ Invalid backup file: ' + (validation.errors?.[0] || 'Unknown error'), 'error');
        e.target.value = '';
        return;
      }

      // Show confirmation with import mode
      const importMode = document.querySelector('input[name="importMode"]:checked')?.value || 'replace';
      const action = importMode === 'merge' ? 'Merge' : 'Replace';
      const message = `Install this backup? (${validation.stats?.transactions || 0} transactions)\n\n${action} mode selected.`;

      ConfirmModal.show(message, () => {
        const result = BackupManager.importBackupData(validation.backup, importMode === 'merge');
        if (result.success) {
          Settings.load();
          App.refreshAll();
          Utils.toast(`✓ ${result.message}`, 'success');
        } else {
          Utils.toast(`✗ ${result.message}`, 'error');
        }
        e.target.value = '';
      });
    });

    // Optimize storage
    document.getElementById('optimizeStorageBtn')?.addEventListener('click', () => {
      if (typeof BackupManager === 'undefined') {
        Utils.toast('Backup system not ready', 'error');
        return;
      }

      ConfirmModal.show('Optimize storage? This removes duplicate entries.', () => {
        const result = BackupManager.optimizeStorage();
        if (result.success) {
          Settings.renderStorageInfoSection();
          Utils.toast(`✓ Freed ${(result.freed / 1024).toFixed(1)} KB of space`, 'success');
        } else {
          Utils.toast('✗ Optimization failed', 'error');
        }
      });
    });

    // View logs
    document.getElementById('viewLogsBtn')?.addEventListener('click', () => {
      if (typeof Logger === 'undefined') {
        Utils.toast('Logger not available', 'error');
        return;
      }

      const logs = Logger.getLogs().slice(-50); // Last 50 logs
      const logText = logs.map(l => `[${l.timestamp}] ${l.level}: ${l.message}`).join('\n');
      
      const modal = document.createElement('div');
      modal.className = 'modal-backdrop';
      modal.innerHTML = `
        <div class="modal" style="max-height: 80vh; overflow-y: auto;">
          <h3>Application Logs (Last 50)</h3>
          <textarea readonly style="width: 100%; height: 400px; font-family: monospace; font-size: 0.85rem;">${logText}</textarea>
          <button class="btn-primary" onclick="this.closest('.modal-backdrop').remove()">Close</button>
        </div>
      `;
      document.body.appendChild(modal);
      modal.hidden = false;
      Logger.info('Logs viewer opened');
    });

    // Clear all data
    document.getElementById('clearAllData')?.addEventListener('click', () => {
      ConfirmModal.show('⚠ Permanently delete ALL data? This cannot be undone.\n\nCreate an export first!', () => {
        Storage.clear();
        if (typeof DataSync !== 'undefined') {
          DataSync.syncAll();
        }
        Settings.load();
        App.refreshAll();
        Utils.toast('✓ All data cleared', 'warning');
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
    try {
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
    } catch (err) {
      Logger.error('Dashboard refresh failed', { error: err.message });
      Utils.toast('Failed to refresh dashboard', 'error');
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
    // Seed data disabled - users should start clean
    // If you want to restore sample data, uncomment the code below
    /*
    if (Transactions.getAll().length > 0) return;
    // ... sample data code ...
    */
  },

  init: () => {
    Storage.init();
    Settings.load();
    
    // Initialize managers
    if (typeof ThemeManager !== 'undefined') ThemeManager.init();
    if (typeof DataSync !== 'undefined') DataSync.startAutoSync(5000);
    
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
    if (typeof Pages !== 'undefined') Pages.init();
    
    document.getElementById('dashPeriod')?.addEventListener('change', App.refreshDashboard);
    
    // Initialize onboarding (only shows on first launch)
    Onboarding.init();
    
    const hash = location.hash.replace('#','');
    const valid = ['dashboard','transactions','budget','goals','loans','reports','settings','pages'];
    Nav.goTo(valid.includes(hash) ? hash : 'dashboard');
  }
};

document.addEventListener('DOMContentLoaded', App.init);
