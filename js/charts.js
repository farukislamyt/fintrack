/**
 * FinTrack Pro — Charts v3.0
 */
const Charts = (() => {
  const inst = {};

  const C = () => {
    const s = getComputedStyle(document.documentElement);
    return {
      income:'#00d28a', expense:'#f03e5e', balance:'#3d9eff', gold:'#f5b800', accent:'#3b82f6',
      text:   s.getPropertyValue('--text-secondary').trim() || '#7d90a8',
      grid:   'rgba(255,255,255,0.055)',
      bg:     s.getPropertyValue('--bg-card').trim() || '#0f1520',
    };
  };

  const PALETTE = ['#3b82f6','#f03e5e','#00d28a','#f5b800','#3d9eff','#a78bfa','#34d399','#fb923c','#f472b6','#2dd4bf'];

  const defaults = () => {
    const c = C();
    Chart.defaults.color = c.text;
    Chart.defaults.font.family = "'Space Grotesk', system-ui, sans-serif";
    Chart.defaults.font.size = 11;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.padding = 10;
  };

  const destroy = (id) => { if (inst[id]) { try { inst[id].destroy(); } catch(_){} delete inst[id]; } };

  const axes = (c) => ({
    x: { grid:{ color:c.grid, lineWidth:.5 }, ticks:{ color:c.text, maxRotation:0 }, border:{ color:'transparent' } },
    y: { grid:{ color:c.grid, lineWidth:.5 }, ticks:{ color:c.text, callback: v => Utils.abbrevNum(v) }, border:{ color:'transparent' } }
  });

  const renderCashflow = (canvasId, labels, incomeData, expenseData) => {
    destroy(canvasId);
    const ctx = document.getElementById(canvasId); if (!ctx) return;
    defaults(); const c = C();
    inst[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [
        { label:'Income',  data:incomeData,  backgroundColor:'rgba(0,210,138,.75)', borderColor:c.income,  borderWidth:1, borderRadius:4, borderSkipped:false },
        { label:'Expense', data:expenseData, backgroundColor:'rgba(240,62,94,.7)',  borderColor:c.expense, borderWidth:1, borderRadius:4, borderSkipped:false }
      ]},
      options: { responsive:true, maintainAspectRatio:true, interaction:{ mode:'index', intersect:false },
        plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label: ctx => ` ${ctx.dataset.label}: ${Utils.formatCurrency(ctx.parsed.y)}` }}},
        scales: axes(c) }
    });
  };

  const renderCategory = (canvasId, labels, data) => {
    destroy(canvasId);
    const ctx = document.getElementById(canvasId); if (!ctx) return;
    defaults(); const c = C();
    inst[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets:[{ data, backgroundColor:PALETTE.slice(0,data.length), borderWidth:0, hoverOffset:8 }]},
      options: { responsive:true, maintainAspectRatio:true, cutout:'68%',
        plugins:{ legend:{ position:'bottom', labels:{ padding:12, usePointStyle:true, pointStyle:'circle', font:{size:11}, color:c.text, boxWidth:8 }},
          tooltip:{ callbacks:{ label: ctx => { const tot = ctx.dataset.data.reduce((s,v)=>s+v,0); return ` ${ctx.label}: ${Utils.formatCurrency(ctx.parsed)} (${tot>0?((ctx.parsed/tot)*100).toFixed(1):0}%)`; }}}}
      }
    });
  };

  const renderMonthly = (canvasId, monthly) => {
    destroy(canvasId);
    const ctx = document.getElementById(canvasId); if (!ctx) return;
    defaults(); const c = C();
    inst[canvasId] = new Chart(ctx, {
      type:'bar',
      data:{ labels:Utils.MONTHS, datasets:[
        { label:'Income',  data:monthly.map(m=>m.income),  backgroundColor:'rgba(0,210,138,.75)', borderRadius:4 },
        { label:'Expense', data:monthly.map(m=>m.expense), backgroundColor:'rgba(240,62,94,.7)',  borderRadius:4 }
      ]},
      options:{ responsive:true, maintainAspectRatio:true, interaction:{ mode:'index', intersect:false },
        plugins:{ legend:{ position:'bottom', labels:{ usePointStyle:true, color:c.text, padding:16 }},
          tooltip:{ callbacks:{ label: ctx => ` ${ctx.dataset.label}: ${Utils.formatCurrency(ctx.parsed.y)}` }}},
        scales: axes(c) }
    });
  };

  const renderTrend = (canvasId, monthly) => {
    destroy(canvasId);
    const ctx = document.getElementById(canvasId); if (!ctx) return;
    defaults(); const c = C();
    inst[canvasId] = new Chart(ctx, {
      type:'line',
      data:{ labels:Utils.MONTHS, datasets:[
        { label:'Income',      data:monthly.map(m=>m.income),            borderColor:c.income,  backgroundColor:'rgba(0,210,138,.06)', fill:true, tension:.4, pointRadius:3, pointBackgroundColor:c.income,  borderWidth:2 },
        { label:'Expense',     data:monthly.map(m=>m.expense),           borderColor:c.expense, backgroundColor:'rgba(240,62,94,.05)', fill:true, tension:.4, pointRadius:3, pointBackgroundColor:c.expense, borderWidth:2 },
        { label:'Net Savings', data:monthly.map(m=>m.income-m.expense),  borderColor:c.balance, backgroundColor:'rgba(61,158,255,.05)', fill:true, tension:.4, pointRadius:3, pointBackgroundColor:c.balance, borderWidth:2, borderDash:[5,3] }
      ]},
      options:{ responsive:true, maintainAspectRatio:true, interaction:{ mode:'index', intersect:false },
        plugins:{ legend:{ position:'bottom', labels:{ usePointStyle:true, color:c.text, padding:16 }},
          tooltip:{ callbacks:{ label: ctx => ` ${ctx.dataset.label}: ${Utils.formatCurrency(ctx.parsed.y)}` }}},
        scales: axes(c) }
    });
  };

  const refreshTheme = () => { defaults(); Object.values(inst).forEach(ch => { try { ch.update('none'); } catch(_){} }); };

  return { renderCashflow, renderCategory, renderMonthly, renderTrend, destroy, refreshTheme };
})();
window.Charts = Charts;
