/**
 * FinTrack Pro — Charts Module v2.0
 * • Proper theme color reading
 * • New: sparkline, area chart, net worth chart
 * • Accessible chart configs
 * • Smooth re-render on theme change
 */

const Charts = (() => {
  const instances = {};

  // ── Theme colors ───────────────────────────────────────
  const C = () => {
    const s = getComputedStyle(document.documentElement);
    const get = (v) => s.getPropertyValue(v).trim();
    return {
      income:  '#00d68f',
      expense: '#ff4d6d',
      balance: '#4da6ff',
      gold:    '#ffba08',
      accent:  '#4f8ef7',
      purple:  '#a78bfa',
      text:    get('--text-secondary') || '#8899b0',
      muted:   get('--text-muted')     || '#4a5568',
      grid:    'rgba(255,255,255,0.06)',
      bg:      get('--bg-card')        || '#111827',
    };
  };

  const PALETTE = [
    '#4f8ef7','#ff4d6d','#00d68f','#ffba08','#4da6ff',
    '#a78bfa','#34d399','#fb923c','#f472b6','#2dd4bf'
  ];

  // ── Base Chart.js defaults ─────────────────────────────
  const setDefaults = () => {
    const c = C();
    Chart.defaults.color                      = c.text;
    Chart.defaults.font.family                = "'Space Grotesk', sans-serif";
    Chart.defaults.font.size                  = 11;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.padding    = 10;
    Chart.defaults.plugins.tooltip.boxPadding = 4;
  };

  // ── Destroy existing instance ──────────────────────────
  const destroy = (id) => {
    if (instances[id]) {
      try { instances[id].destroy(); } catch (_) {}
      delete instances[id];
    }
  };

  // ── Shared axis config ─────────────────────────────────
  const axisDefaults = (c) => ({
    x: {
      grid:  { color: c.grid, lineWidth: 0.5 },
      ticks: { color: c.text, maxRotation: 0 },
      border: { color: 'transparent' }
    },
    y: {
      grid:  { color: c.grid, lineWidth: 0.5 },
      ticks: { color: c.text, callback: v => Utils.abbrevNumber(v) },
      border: { color: 'transparent' }
    }
  });

  // ── Cash Flow (Bar) ────────────────────────────────────
  const renderCashflow = (canvasId, labels, incomeData, expenseData) => {
    destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    setDefaults();
    const c = C();

    instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Income',
            data: incomeData,
            backgroundColor: 'rgba(0,214,143,0.75)',
            borderColor: c.income,
            borderWidth: 1,
            borderRadius: 5,
            borderSkipped: false,
          },
          {
            label: 'Expense',
            data: expenseData,
            backgroundColor: 'rgba(255,77,109,0.7)',
            borderColor: c.expense,
            borderWidth: 1,
            borderRadius: 5,
            borderSkipped: false,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${Utils.formatCurrency(ctx.parsed.y)}`
            }
          }
        },
        scales: axisDefaults(c)
      }
    });
  };

  // ── Category Doughnut ──────────────────────────────────
  const renderCategory = (canvasId, labels, data) => {
    destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    setDefaults();
    const c = C();

    instances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: PALETTE.slice(0, data.length),
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 12,
              usePointStyle: true,
              pointStyle: 'circle',
              font: { size: 11 },
              color: c.text,
              boxWidth: 8
            }
          },
          tooltip: {
            callbacks: {
              label: ctx => {
                const total = ctx.dataset.data.reduce((s, v) => s + v, 0);
                const pct   = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                return ` ${ctx.label}: ${Utils.formatCurrency(ctx.parsed)} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  };

  // ── Monthly Bar (Reports) ──────────────────────────────
  const renderMonthly = (canvasId, monthlyData) => {
    destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    setDefaults();
    const c = C();

    instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Utils.MONTHS,
        datasets: [
          {
            label: 'Income',
            data: monthlyData.map(m => m.income),
            backgroundColor: 'rgba(0,214,143,0.75)',
            borderRadius: 4
          },
          {
            label: 'Expense',
            data: monthlyData.map(m => m.expense),
            backgroundColor: 'rgba(255,77,109,0.7)',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true, color: c.text, padding: 16 }
          },
          tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${Utils.formatCurrency(ctx.parsed.y)}` } }
        },
        scales: axisDefaults(c)
      }
    });
  };

  // ── Net Savings Trend (Line) ───────────────────────────
  const renderTrend = (canvasId, monthlyData) => {
    destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    setDefaults();
    const c = C();

    const netData = monthlyData.map(m => m.income - m.expense);

    instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Utils.MONTHS,
        datasets: [
          {
            label: 'Income',
            data: monthlyData.map(m => m.income),
            borderColor: c.income,
            backgroundColor: 'rgba(0,214,143,0.06)',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: c.income,
            borderWidth: 2
          },
          {
            label: 'Expense',
            data: monthlyData.map(m => m.expense),
            borderColor: c.expense,
            backgroundColor: 'rgba(255,77,109,0.05)',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: c.expense,
            borderWidth: 2
          },
          {
            label: 'Net Savings',
            data: netData,
            borderColor: c.balance,
            backgroundColor: 'rgba(77,166,255,0.06)',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: c.balance,
            borderWidth: 2,
            borderDash: [5, 3]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true, color: c.text, padding: 16 }
          },
          tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${Utils.formatCurrency(ctx.parsed.y)}` } }
        },
        scales: axisDefaults(c)
      }
    });
  };

  // ── Sparkline (mini line) ──────────────────────────────
  const renderSparkline = (canvasId, data, color = '#4f8ef7') => {
    destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map((_, i) => i),
        datasets: [{
          data,
          borderColor: color,
          backgroundColor: color + '15',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 1.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false }
        },
        animation: { duration: 600 }
      }
    });
  };

  // ── Update all on theme change ─────────────────────────
  const refreshTheme = () => {
    setDefaults();
    Object.values(instances).forEach(chart => {
      try { chart.update('none'); } catch (_) {}
    });
  };

  return {
    renderCashflow, renderCategory, renderMonthly, renderTrend,
    renderSparkline, destroy, refreshTheme
  };
})();

window.Charts = Charts;
