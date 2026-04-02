/**
 * FinTrack Charts Module
 * Manages all Chart.js instances
 */

const Charts = (() => {
  const instances = {};

  const getThemeColors = () => {
    const computed = getComputedStyle(document.documentElement);
    return {
      income:  '#00d68f',
      expense: '#ff4d6d',
      balance: '#4da6ff',
      accent:  '#4f8ef7',
      text:    computed.getPropertyValue('--text-secondary').trim() || '#8899b0',
      grid:    computed.getPropertyValue('--border-low').trim() || 'rgba(255,255,255,0.07)',
      bg:      computed.getPropertyValue('--bg-card').trim() || '#111827'
    };
  };

  const destroy = (id) => {
    if (instances[id]) {
      instances[id].destroy();
      delete instances[id];
    }
  };

  const globalDefaults = () => {
    const c = getThemeColors();
    Chart.defaults.color = c.text;
    Chart.defaults.font.family = "'Space Grotesk', sans-serif";
    Chart.defaults.font.size = 11;
  };

  // Cash Flow Line/Bar Chart
  const renderCashflow = (canvasId, labels, incomeData, expenseData) => {
    destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    globalDefaults();
    const c = getThemeColors();

    instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Income',
            data: incomeData,
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderColor: c.income,
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: 'Expense',
            data: expenseData,
            backgroundColor: 'rgba(244, 63, 94, 0.7)',
            borderColor: c.expense,
            borderWidth: 1,
            borderRadius: 4,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${Utils.formatCurrency(ctx.parsed.y)}`
            }
          }
        },
        scales: {
          x: { grid: { color: c.grid, lineWidth: 0.5 } },
          y: {
            grid: { color: c.grid, lineWidth: 0.5 },
            ticks: { callback: v => Utils.formatCurrency(v) }
          }
        }
      }
    });
  };

  // Doughnut/Pie for categories
  const renderCategory = (canvasId, labels, data) => {
    destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    globalDefaults();

    const COLORS = [
      '#4f8ef7','#ff4d6d','#00d68f','#ffba08','#4da6ff',
      '#a78bfa','#34d399','#fb923c','#38bdf8','#e879f9'
    ];

    instances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: COLORS.slice(0, data.length),
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 10,
              usePointStyle: true,
              pointStyle: 'circle',
              font: { size: 11 }
            }
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${Utils.formatCurrency(ctx.parsed)}`
            }
          }
        }
      }
    });
  };

  // Monthly bar chart for reports
  const renderMonthly = (canvasId, monthlyData) => {
    destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    globalDefaults();
    const c = getThemeColors();

    instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Utils.MONTHS,
        datasets: [
          {
            label: 'Income',
            data: monthlyData.map(m => m.income),
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderRadius: 4
          },
          {
            label: 'Expense',
            data: monthlyData.map(m => m.expense),
            backgroundColor: 'rgba(244, 63, 94, 0.7)',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true } },
          tooltip: { callbacks: { label: ctx => ` ${Utils.formatCurrency(ctx.parsed.y)}` } }
        },
        scales: {
          x: { grid: { color: c.grid, lineWidth: 0.5 } },
          y: { grid: { color: c.grid, lineWidth: 0.5 }, ticks: { callback: v => Utils.formatCurrency(v) } }
        }
      }
    });
  };

  // Line trend chart
  const renderTrend = (canvasId, monthlyData) => {
    destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    globalDefaults();
    const c = getThemeColors();

    instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Utils.MONTHS,
        datasets: [
          {
            label: 'Net Savings',
            data: monthlyData.map(m => m.income - m.expense),
            borderColor: c.balance,
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: c.balance
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true } },
          tooltip: { callbacks: { label: ctx => ` ${Utils.formatCurrency(ctx.parsed.y)}` } }
        },
        scales: {
          x: { grid: { color: c.grid, lineWidth: 0.5 } },
          y: { grid: { color: c.grid, lineWidth: 0.5 }, ticks: { callback: v => Utils.formatCurrency(v) } }
        }
      }
    });
  };

  // Re-apply theme to all charts
  const applyTheme = () => {
    Object.values(instances).forEach(chart => chart.update());
  };

  return { renderCashflow, renderCategory, renderMonthly, renderTrend, destroy, applyTheme };
})();

window.Charts = Charts;
