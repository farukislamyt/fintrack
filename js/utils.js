/**
 * FinTrack Pro — Utilities v2.0
 * Fixes:
 * • debounce 'this' context bug fixed
 * • formatDate timezone-safe
 * • filterByPeriod week-start aligned
 * • groupByMonth returns sorted months
 * • New: formatRelativeDate, groupByDay, clamp, deepClone
 */

const Utils = (() => {
  // ── UID ────────────────────────────────────────────────
  const uid = () =>
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

  // ── Currency ───────────────────────────────────────────
  const SYMBOLS = { USD:'$', EUR:'€', GBP:'£', BDT:'৳', INR:'₹', JPY:'¥', CAD:'CA$', AUD:'A$' };

  const formatCurrency = (amount, overrideCurrency) => {
    const currency = overrideCurrency ||
      (window.AppState && AppState.settings.currency) || 'USD';
    const sym = SYMBOLS[currency] || '$';
    const num = parseFloat(amount) || 0;
    const absStr = Math.abs(num).toLocaleString('en-US', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    });
    return `${sym}${absStr}`;
  };

  // ── Date ───────────────────────────────────────────────
  // FIX: append 'T12:00:00' to avoid UTC midnight → local-day-off-by-one
  const parseDate = (dateStr) => new Date(dateStr + 'T12:00:00');

  const formatDate = (dateStr, overrideFmt) => {
    if (!dateStr) return '';
    const fmt = overrideFmt ||
      (window.AppState && AppState.settings.dateFormat) || 'MM/DD/YYYY';
    const d = parseDate(dateStr);
    const m   = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const y   = d.getFullYear();
    if (fmt === 'DD/MM/YYYY') return `${day}/${m}/${y}`;
    if (fmt === 'YYYY-MM-DD') return `${y}-${m}-${day}`;
    return `${m}/${day}/${y}`;
  };

  const formatRelativeDate = (dateStr) => {
    if (!dateStr) return '';
    const d     = parseDate(dateStr);
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tgt   = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diff  = Math.round((tgt - today) / 86400000);
    if (diff === 0)  return 'Today';
    if (diff === -1) return 'Yesterday';
    if (diff === 1)  return 'Tomorrow';
    if (diff > 1 && diff < 7)   return `In ${diff} days`;
    if (diff < 0 && diff > -7)  return `${Math.abs(diff)} days ago`;
    return formatDate(dateStr);
  };

  // ── Today's date as YYYY-MM-DD ─────────────────────────
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  const currentMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  };

  const currentYear = () => new Date().getFullYear();

  // ── Add period to date string ─────────────────────────
  const addPeriod = (dateStr, freq) => {
    const d = parseDate(dateStr);
    if (freq === 'daily') {
      d.setDate(d.getDate() + 1);
    } else if (freq === 'weekly') {
      d.setDate(d.getDate() + 7);
    } else if (freq === 'monthly') {
      d.setMonth(d.getMonth() + 1);
    } else if (freq === 'yearly') {
      d.setFullYear(d.getFullYear() + 1);
    }
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  // ── Filter by period ───────────────────────────────────
  const filterByPeriod = (transactions, period) => {
    const now   = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth();

    return transactions.filter(t => {
      const d = parseDate(t.date);
      if (period === 'week') {
        // FIX: use proper 7-day rolling window from start of today
        const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
        return d >= cutoff;
      }
      if (period === 'month') {
        return d.getMonth() === month && d.getFullYear() === year;
      }
      if (period === 'year') {
        return d.getFullYear() === year;
      }
      return true; // 'all'
    });
  };

  // ── Summarize ──────────────────────────────────────────
  const summarize = (transactions) => {
    let income = 0, expense = 0;
    for (const t of transactions) {
      if (t.type === 'income')  income  += t.amount;
      else if (t.type === 'expense') expense += t.amount;
    }
    const balance     = income - expense;
    const savingsRate = income > 0 ? (balance / income) * 100 : 0;
    return { income, expense, balance, savingsRate };
  };

  // ── Group by category ──────────────────────────────────
  const groupByCategory = (transactions, type = 'expense') => {
    const groups = {};
    for (const t of transactions) {
      if (t.type !== type) continue;
      groups[t.category] = (groups[t.category] || 0) + t.amount;
    }
    return Object.entries(groups)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({ category, amount }));
  };

  // ── Group by month ─────────────────────────────────────
  const groupByMonth = (transactions, year) => {
    const months = Array.from({ length: 12 }, (_, i) => ({ month: i, income: 0, expense: 0 }));
    for (const t of transactions) {
      const d = parseDate(t.date);
      if (d.getFullYear() !== year) continue;
      const m = d.getMonth();
      if (t.type === 'income')  months[m].income  += t.amount;
      else                       months[m].expense += t.amount;
    }
    return months;
  };

  // ── Group by day (for sparklines / recent) ─────────────
  const groupByDay = (transactions, days = 30) => {
    const now   = new Date();
    const result = {};
    for (let i = days - 1; i >= 0; i--) {
      const d   = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      result[key] = { income: 0, expense: 0 };
    }
    for (const t of transactions) {
      if (result[t.date]) {
        result[t.date][t.type] = (result[t.date][t.type] || 0) + t.amount;
      }
    }
    return Object.entries(result).map(([date, v]) => ({ date, ...v }));
  };

  // ── Toast ──────────────────────────────────────────────
  const toast = (message, type = 'success', duration = 3500) => {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    const icons = { success: '✓', error: '✕', warning: '!', info: 'i' };
    el.innerHTML = `<div class="toast-icon">${icons[type] || '●'}</div><span class="toast-msg">${escHtml(String(message))}</span><button class="toast-close" aria-label="Dismiss">✕</button>`;
    el.querySelector('.toast-close').addEventListener('click', () => dismissToast(el));
    container.appendChild(el);
    // Auto-dismiss
    const t = setTimeout(() => dismissToast(el), duration);
    el._timer = t;
  };

  const dismissToast = (el) => {
    if (!el || !el.parentNode) return;
    clearTimeout(el._timer);
    el.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => el.remove(), 300);
  };

  // ── Month names ────────────────────────────────────────
  const MONTHS     = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  // ── FIX: debounce with correct context handling ────────
  const debounce = (fn, delay = 300) => {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  };

  // ── Download file ──────────────────────────────────────
  const download = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── CSV export ─────────────────────────────────────────
  const toCSV = (transactions) => {
    const headers = ['Date','Description','Category','Type','Amount','Payment','Notes','Recurring'];
    const csvEsc  = (v) => `"${String(v || '').replace(/"/g, '""')}"`;
    const rows    = transactions.map(t => [
      t.date,
      csvEsc(t.description),
      csvEsc(t.category),
      t.type,
      t.amount.toFixed(2),
      t.payment || '',
      csvEsc(t.notes || ''),
      t.recurring ? t.recurringFreq || 'monthly' : ''
    ].join(','));
    return [headers.join(','), ...rows].join('\n');
  };

  // ── Escape HTML ────────────────────────────────────────
  const escHtml = (str) => {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  // ── Clamp ──────────────────────────────────────────────
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  // ── Deep clone ────────────────────────────────────────
  const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

  // ── Number abbreviation ────────────────────────────────
  const abbrevNumber = (num) => {
    if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return String(num);
  };

  return {
    uid, formatCurrency, formatDate, formatRelativeDate, parseDate,
    today, currentMonth, currentYear, addPeriod,
    filterByPeriod, summarize, groupByCategory, groupByMonth, groupByDay,
    toast, MONTHS, MONTHS_FULL, debounce, download, toCSV, escHtml,
    clamp, deepClone, abbrevNumber
  };
})();

window.Utils = Utils;
