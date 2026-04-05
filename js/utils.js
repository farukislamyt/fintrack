/**
 * FinTrack Pro — Utils v3.0
 */
const Utils = (() => {
  const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

  const SYMBOLS = { USD:'$', EUR:'€', GBP:'£', BDT:'৳', INR:'₹', JPY:'¥', CAD:'CA$', AUD:'A$' };

  const formatCurrency = (amount, overrideCurrency) => {
    const currency = overrideCurrency || (window.AppState && AppState.settings.currency) || 'USD';
    const sym = SYMBOLS[currency] || '$';
    const num = parseFloat(amount) || 0;
    return `${sym}${Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const parseDate  = (s) => new Date(s + 'T12:00:00');

  const formatDate = (dateStr, fmt) => {
    if (!dateStr) return '';
    fmt = fmt || (window.AppState && AppState.settings.dateFormat) || 'MM/DD/YYYY';
    const d   = parseDate(dateStr);
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
    const today = new Date(); today.setHours(12, 0, 0, 0);
    const diff  = Math.round((d - today) / 86400000);
    if (diff === 0)  return 'Today';
    if (diff === -1) return 'Yesterday';
    if (diff === 1)  return 'Tomorrow';
    if (diff > 1  && diff < 7)  return `In ${diff}d`;
    if (diff < 0  && diff > -7) return `${Math.abs(diff)}d ago`;
    return formatDate(dateStr);
  };

  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  const currentMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  };

  const currentYear = () => new Date().getFullYear();

  const filterByPeriod = (txns, period) => {
    const now   = new Date();
    const y     = now.getFullYear(), mo = now.getMonth();
    return txns.filter(t => {
      const d = parseDate(t.date);
      if (period === 'week') {
        const cutoff = new Date(y, mo, now.getDate() - 6); cutoff.setHours(0,0,0,0);
        return d >= cutoff;
      }
      if (period === 'month') return d.getMonth() === mo && d.getFullYear() === y;
      if (period === 'year')  return d.getFullYear() === y;
      return true;
    });
  };

  const summarize = (txns) => {
    let income = 0, expense = 0;
    for (const t of txns) {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    }
    return { income, expense, balance: income - expense, savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0 };
  };

  const groupByCategory = (txns, type = 'expense') => {
    const g = {};
    for (const t of txns) { if (t.type === type) g[t.category] = (g[t.category] || 0) + t.amount; }
    return Object.entries(g).sort((a,b) => b[1]-a[1]).map(([category, amount]) => ({ category, amount }));
  };

  const groupByMonth = (txns, year) => {
    const months = Array.from({length:12}, (_, i) => ({ month:i, income:0, expense:0 }));
    for (const t of txns) {
      const d = parseDate(t.date);
      if (d.getFullYear() !== year) continue;
      if (t.type === 'income') months[d.getMonth()].income += t.amount;
      else months[d.getMonth()].expense += t.amount;
    }
    return months;
  };

  const toast = (msg, type = 'success', duration = 3500) => {
    const c = document.getElementById('toastContainer');
    if (!c) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    const icons = { success:'✓', error:'✕', warning:'!', info:'i' };
    el.innerHTML = `<div class="toast-icon">${icons[type]||'●'}</div><span class="toast-msg">${escHtml(String(msg))}</span><button class="toast-close" aria-label="Dismiss">✕</button>`;
    el.querySelector('.toast-close').addEventListener('click', () => dismiss(el));
    c.appendChild(el);
    const t = setTimeout(() => dismiss(el), duration);
    el._t = t;
  };

  const dismiss = (el) => {
    if (!el || !el.parentNode) return;
    clearTimeout(el._t);
    el.style.animation = 'toastOut .3s ease forwards';
    setTimeout(() => el.remove(), 300);
  };

  const MONTHS      = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const debounce = (fn, delay = 300) => {
    let t;
    return function(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), delay); };
  };

  const download = (content, filename, mime) => {
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([content], { type: mime })),
      download: filename
    });
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(a.href);
  };

  const toCSV = (txns) => {
    const esc = v => `"${String(v||'').replace(/"/g,'""')}"`;
    const hdr = ['Date','Description','Category','Type','Amount','Payment','Notes','Recurring'];
    const rows = txns.map(t => [t.date,esc(t.description),esc(t.category),t.type,t.amount.toFixed(2),t.payment||'',esc(t.notes||''),t.recurring?t.recurringFreq||'monthly':''].join(','));
    return [hdr.join(','), ...rows].join('\n');
  };

  const escHtml = (s) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  const abbrevNum = (n) => {
    if (Math.abs(n) >= 1e9) return (n/1e9).toFixed(1)+'B';
    if (Math.abs(n) >= 1e6) return (n/1e6).toFixed(1)+'M';
    if (Math.abs(n) >= 1e3) return (n/1e3).toFixed(1)+'K';
    return String(Math.round(n));
  };

  return {
    uid, formatCurrency, formatDate, formatRelativeDate, parseDate,
    today, currentMonth, currentYear,
    filterByPeriod, summarize, groupByCategory, groupByMonth,
    toast, MONTHS, MONTHS_FULL, debounce, download, toCSV, escHtml,
    clamp, abbrevNum
  };
})();
window.Utils = Utils;
