/**
 * FinTrack Utility Functions
 */

const Utils = (() => {
  // UUID generator
  const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  // Format currency
  const formatCurrency = (amount, settings = null) => {
    const s = settings || (window.AppState && window.AppState.settings) || {};
    const currency = s.currency || 'USD';
    const symbols = { USD:'$', EUR:'€', GBP:'£', BDT:'৳', INR:'₹', JPY:'¥', CAD:'CA$', AUD:'A$' };
    const sym = symbols[currency] || '$';
    const num = parseFloat(amount) || 0;
    return `${sym}${Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format date
  const formatDate = (dateStr, settings = null) => {
    if (!dateStr) return '';
    const s = settings || (window.AppState && window.AppState.settings) || {};
    const fmt = s.dateFormat || 'MM/DD/YYYY';
    const d = new Date(dateStr + 'T00:00:00');
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const y = d.getFullYear();
    if (fmt === 'DD/MM/YYYY') return `${day}/${m}/${y}`;
    if (fmt === 'YYYY-MM-DD') return `${y}-${m}-${day}`;
    return `${m}/${day}/${y}`;
  };

  // Get today's date as YYYY-MM-DD
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  // Get month string YYYY-MM
  const currentMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  };

  // Filter transactions by period
  const filterByPeriod = (transactions, period) => {
    const now = new Date();
    return transactions.filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      if (period === 'week') {
        const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
        return d >= weekAgo;
      }
      if (period === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (period === 'year') {
        return d.getFullYear() === now.getFullYear();
      }
      return true; // 'all'
    });
  };

  // Summarize transactions
  const summarize = (transactions) => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense, savingsRate: income > 0 ? ((income - expense) / income * 100) : 0 };
  };

  // Group by category
  const groupByCategory = (transactions, type = 'expense') => {
    const filtered = transactions.filter(t => t.type === type);
    const groups = {};
    filtered.forEach(t => {
      if (!groups[t.category]) groups[t.category] = 0;
      groups[t.category] += t.amount;
    });
    return Object.entries(groups)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount]) => ({ category: cat, amount }));
  };

  // Group by month
  const groupByMonth = (transactions, year) => {
    const months = Array.from({ length: 12 }, (_, i) => ({ month: i, income: 0, expense: 0 }));
    transactions.forEach(t => {
      const d = new Date(t.date + 'T00:00:00');
      if (d.getFullYear() === year) {
        const m = d.getMonth();
        if (t.type === 'income') months[m].income += t.amount;
        else months[m].expense += t.amount;
      }
    });
    return months;
  };

  // Show toast notification
  const toast = (message, type = 'success', duration = 3000) => {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    const icons = { success: '✓', error: '✕', warning: '!' };
    el.innerHTML = `<span>${icons[type] || '●'}</span><span>${message}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => el.remove(), 300);
    }, duration);
  };

  // Month names
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Debounce
  const debounce = (fn, delay = 300) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  };

  // Download helper
  const download = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export to CSV
  const toCSV = (transactions) => {
    const headers = ['Date','Description','Category','Type','Amount','Payment','Notes'];
    const rows = transactions.map(t => [
      t.date, `"${t.description}"`, t.category, t.type,
      t.amount.toFixed(2), t.payment || '', `"${t.notes || ''}"`
    ]);
    return [headers, ...rows].map(r => r.join(',')).join('\n');
  };

  // Escape HTML
  const escHtml = (str) => {
    const el = document.createElement('div');
    el.appendChild(document.createTextNode(str || ''));
    return el.innerHTML;
  };

  return {
    uid, formatCurrency, formatDate, today, currentMonth,
    filterByPeriod, summarize, groupByCategory, groupByMonth,
    toast, MONTHS, debounce, download, toCSV, escHtml
  };
})();

window.Utils = Utils;
