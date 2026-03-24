// ── charts.js — Módulo 3: Motor de las 9 gráficas — Estética Dark Navy ────────
Chart.defaults.color = "#8FA8C8";
Chart.defaults.font.family = "'Inter', 'Segoe UI', Arial, sans-serif";

const Charts360 = {
  instances: {},

  C: {
    bg0:     '#05080F',
    bg1:     '#080E1A',
    bg2:     '#0D1627',
    blue2:   '#2E74E8',
    blue3:   '#5A9BFF',
    silver1: '#8FA8C8',
    silver2: '#B8CEEA',
    green:   '#1A8A4A',
    teal:    '#1A8A7F',
    amber:   '#D68910',
    red:     '#C0392B',
    grid:    'rgba(26,86,196,.12)',
  },

  // backward-compat alias
  get PALETTE() { return this.C; },

  destroy(id) {
    if (this.instances[id]) {
      this.instances[id].destroy();
      delete this.instances[id];
    }
  },

  destroyAll() {
    Object.keys(this.instances).forEach(id => this.destroy(id));
  },

  _base(id) {
    this.destroy(id);
    const canvas = document.getElementById(id);
    if (!canvas) return null;
    return canvas.getContext('2d');
  },

  _chartOpts(type, data, options) {
    return {
      type, data,
      options: { responsive: true, maintainAspectRatio: false, animation: { duration: 600, easing: 'easeOutQuart' }, ...options }
    };
  },

  _semCol(colorKey) {
    const map = { green: '#1A8A4ACC', teal: '#1A8A7FCC', orange: '#D68910CC', red: '#C0392BCC', gray: '#6A829ECC' };
    return map[colorKey] || map.gray;
  },
  _semColSolid(colorKey) { return this._semCol(colorKey).slice(0, 7); },

  // G1 — Barras verticales: Ingresos, Utilidad Bruta, Ganancia Neta
  renderG1(d, empresa) {
    const ctx = this._base('chart-g1');
    if (!ctx) return;
    const labels = ['Ingresos', 'Utilidad Bruta', 'Ganancia Neta'];
    const values = [d.ingresos, d.utilidad_bruta, d.ganancias_netas].map(v => v ?? 0);
    const colors = [
      this.C.blue2 + 'CC',
      this.C.teal  + 'CC',
      (d.ganancias_netas ?? 0) >= 0 ? this.C.green + 'CC' : this.C.red + 'CC',
    ];
    this.instances['chart-g1'] = new Chart(ctx, this._chartOpts('bar', {
      labels,
      datasets: [{ label: 'USD (M)', data: values, backgroundColor: colors,
        borderColor: colors.map(c => c.slice(0,7)), borderWidth: 2, borderRadius: 6, borderSkipped: false,
        barPercentage: 0.45, maxBarThickness: 56 }]
    }, {
      plugins: {
        legend: { display: false },
        title: { display: true, text: `${empresa} — P&L Principal`, color: this.C.blue3, font: { size: 13, weight: '700' } },
      },
      scales: {
        x: { grid: { color: this.C.grid }, ticks: { color: this.C.silver1 } },
        y: { grid: { color: this.C.grid }, ticks: { color: this.C.silver1, callback: v => v >= 1000 ? (v/1000).toFixed(1)+'B' : v+'M' } },
      }
    }));
  },

  // G2 — Barras agrupadas: EBIT vs EBITDA
  renderG2(d, empresa) {
    const ctx = this._base('chart-g2');
    if (!ctx) return;
    this.instances['chart-g2'] = new Chart(ctx, this._chartOpts('bar', {
      labels: ['EBIT', 'EBITDA'],
      datasets: [{
        label: 'Valor (M)',
        data: [d.ebit ?? 0, d.ebitda ?? 0],
        backgroundColor: [this.C.blue2 + 'CC', this.C.teal + 'CC'],
        borderColor:     [this.C.blue2,         this.C.teal],
        borderWidth: 2, borderRadius: 6, borderSkipped: false,
        barPercentage: 0.4, maxBarThickness: 72,
      }]
    }, {
      plugins: {
        legend: { display: false },
        title: { display: true, text: `${empresa} — EBIT vs EBITDA`, color: this.C.blue3, font: { size: 13, weight: '700' } },
      },
      scales: {
        x: { grid: { color: this.C.grid }, ticks: { color: this.C.silver1 } },
        y: { grid: { color: this.C.grid }, ticks: { color: this.C.silver1, callback: v => v >= 1000 ? (v/1000).toFixed(1)+'B' : v+'M' } },
      }
    }));
  },

  // G3 — Barras horizontales semáforo: todos los márgenes
  renderG3(results, empresa) {
    const ctx = this._base('chart-g3');
    if (!ctx) return;
    const margenIds = ['ind_01','ind_02','ind_03','ind_04','ind_11','ind_12','ind_13','ind_14'];
    const items = results.filter(r => margenIds.includes(r.id) && !r.faltante && r.valor != null);
    if (!items.length) {
      // fallback: % indicators numbered ≤15
      const fb = results.filter(r => r.unidad === '%' && !r.faltante && r.valor != null && r.num <= '15');
      items.push(...fb);
    }
    if (!items.length) return;
    const labels = items.map(r => r.nombre.replace('Margen ', '').replace(' (Operativo)', '').replace(' Apalancado', ' Ap.').replace(' (apalancado)', ''));
    const values = items.map(r => r.valor);
    const colors = items.map(r => this._semCol(r.rango.color));
    const borders= items.map(r => this._semColSolid(r.rango.color));

    this.instances['chart-g3'] = new Chart(ctx, this._chartOpts('bar', {
      labels,
      datasets: [{ label: '%', data: values, backgroundColor: colors,
        borderColor: borders, borderWidth: 2, borderRadius: 4, borderSkipped: false }]
    }, {
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        title: { display: true, text: `${empresa} — Análisis de Márgenes (%)`, color: this.C.blue3, font: { size: 13, weight: '700' } },
        annotation: {
          annotations: {
            ref20: { type: 'line', scaleID: 'x', value: 20, borderColor: this.C.amber, borderWidth: 2, borderDash: [6,3],
              label: { display: true, content: '20%', position: 'end', color: this.C.amber, font: { size: 10 } } }
          }
        },
        tooltip: { callbacks: { label: c => ` ${c.parsed.x.toFixed(2)}%` } },
      },
      scales: {
        x: { grid: { color: this.C.grid }, ticks: { color: this.C.silver1, callback: v => v+'%' } },
        y: { grid: { display: false }, ticks: { color: this.C.silver2, font: { size: 11 } } },
      }
    }));
  },

  // G4 — Barras: CFO, CapEx, FCF
  renderG4(d, empresa) {
    const ctx = this._base('chart-g4');
    if (!ctx) return;
    const labels = ['CFO', 'CapEx', 'FCF'];
    const values = [d.cash_ops ?? 0, d.capex != null ? -Math.abs(d.capex) : 0, d.fcf ?? 0];
    const colors = [
      this.C.blue2 + 'CC',
      this.C.red   + 'CC',
      (d.fcf ?? 0) >= 0 ? this.C.green + 'CC' : this.C.red + 'CC',
    ];
    this.instances['chart-g4'] = new Chart(ctx, this._chartOpts('bar', {
      labels,
      datasets: [{ label: 'USD (M)', data: values, backgroundColor: colors,
        borderColor: colors.map(c => c.slice(0,7)), borderWidth: 2, borderRadius: 6, borderSkipped: false,
        barPercentage: 0.45, maxBarThickness: 56 }]
    }, {
      plugins: {
        legend: { display: false },
        title: { display: true, text: `${empresa} — Flujos de Caja`, color: this.C.blue3, font: { size: 13, weight: '700' } },
        tooltip: { callbacks: { label: c => ` ${Math.abs(c.parsed.y) >= 1000 ? (c.parsed.y/1000).toFixed(2)+'B' : c.parsed.y.toFixed(0)+'M'}` } }
      },
      scales: {
        x: { grid: { color: this.C.grid }, ticks: { color: this.C.silver1 } },
        y: { grid: { color: this.C.grid }, ticks: { color: this.C.silver1, callback: v => (Math.abs(v) >= 1000) ? (v/1000).toFixed(1)+'B' : v+'M' } },
      }
    }));
  },

  // G5 — Dona: Estructura de capital
  renderG5(d, empresa) {
    const ctx = this._base('chart-g5');
    if (!ctx) return;
    const eq    = Math.abs(d.equity      || 0);
    const dt    = Math.abs(d.deuda_total || 0);
    const total = eq + dt;
    if (total === 0) return;
    const de   = dt / eq;
    const deColor = de < 1 ? this.C.green : de < 2 ? this.C.amber : this.C.red;

    this.instances['chart-g5'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Patrimonio Neto', 'Deuda Total'],
        datasets: [{
          data: [eq, dt],
          backgroundColor: [this.C.green + 'CC', this.C.red + 'CC'],
          borderColor:     [this.C.green,         this.C.red],
          borderWidth: 2, hoverOffset: 10,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: { position: 'bottom', labels: { color: this.C.silver2, boxWidth: 14, padding: 16 } },
          title: { display: true, text: `${empresa} — Estructura de Capital`, color: this.C.blue3, font: { size: 13, weight: '700' } },
          tooltip: { callbacks: { label: c => ` ${c.label}: ${c.parsed >= 1000 ? (c.parsed/1000).toFixed(1)+'B' : c.parsed.toFixed(0)+'M'} (${((c.parsed/total)*100).toFixed(1)}%)` } }
        }
      },
      plugins: [{
        id: 'centerG5',
        afterDraw(chart) {
          const { ctx: c, chartArea: { width, height, left, top } } = chart;
          c.save(); c.textAlign='center'; c.textBaseline='middle';
          c.fillStyle = deColor;
          c.font = 'bold 12px Inter, Arial';
          c.fillText(`D/E ${de.toFixed(2)}x`, left + width/2, top + height/2);
          c.restore();
        }
      }]
    });
  },

  // G6 — LINE CHART: Perfil de Retornos (ROE, ROA, ROIC vs WACC)
  renderG6(d, empresa) {
    const ctx = this._base('chart-g6');
    if (!ctx) return;
    const wacc = d.wacc;
    const baseItems = [
      { l: 'ROE',  v: d.roe  },
      { l: 'ROA',  v: d.roa  },
      { l: 'ROIC', v: d.roic },
    ].filter(x => x.v != null);
    if (!baseItems.length) return;

    // Añadir WACC al eje X para que la línea lo cruce
    const allItems = wacc != null
      ? [...baseItems, { l: `WACC`, v: wacc }]
      : baseItems;
    const labels = allItems.map(x => x.l);
    const values = allItems.map(x => x.v);

    // Gradiente de relleno
    const gradient = ctx.canvas ? (() => {
      const g = ctx.createLinearGradient(0, 0, 0, 260);
      g.addColorStop(0, 'rgba(90,155,255,.22)');
      g.addColorStop(1, 'rgba(90,155,255,.01)');
      return g;
    })() : 'rgba(90,155,255,.12)';

    // Colores de los puntos según si superan el WACC
    const threshold = wacc ?? 8;
    const pointColors = allItems.map(x =>
      x.l === 'WACC' ? this.C.red :
      x.v >= threshold ? this.C.green : this.C.amber
    );

    const datasets = [{
      label: 'Retorno (%)',
      data: values,
      borderColor: this.C.blue3,
      backgroundColor: gradient,
      fill: true,
      tension: 0.38,
      pointRadius: 7,
      pointHoverRadius: 10,
      pointBackgroundColor: pointColors,
      pointBorderColor: '#080E1A',
      pointBorderWidth: 2,
      borderWidth: 2.5,
    }];

    // Línea horizontal WACC
    if (wacc != null) {
      datasets.push({
        label: `WACC ${wacc}%`,
        data: labels.map(() => wacc),
        borderColor: this.C.red,
        borderWidth: 1.5, borderDash: [6, 4],
        pointRadius: 0, fill: false, tension: 0,
      });
    }

    this.instances['chart-g6'] = new Chart(ctx, this._chartOpts('line', {
      labels, datasets
    }, {
      plugins: {
        legend: { labels: { color: this.C.silver1, boxWidth: 14, padding: 14 } },
        title: { display: true, text: `${empresa} — Perfil de Retornos`, color: this.C.blue3, font: { size: 13, weight: '700' } },
        tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${c.parsed.y.toFixed(2)}%` } }
      },
      scales: {
        x: { grid: { color: this.C.grid }, ticks: { color: this.C.silver1 } },
        y: { grid: { color: this.C.grid }, ticks: { color: this.C.silver1, callback: v => v+'%' } },
      }
    }));
  },

  // G7 — Barras verticales: Múltiplos de valoración
  renderG7(d, empresa) {
    const ctx = this._base('chart-g7');
    if (!ctx) return;
    const ev_ebit   = d.ev_ebit   ?? (d.ev && d.ebit   ? d.ev / d.ebit   : null);
    const ev_fcf    = d.ev_fcf    ?? (d.ev && d.fcf    ? d.ev / d.fcf    : null);
    const ev_ebitda = d.ev_ebitda ?? (d.ev && d.ebitda ? d.ev / d.ebitda : null);

    const items = [
      { l: 'PER',       v: d.per      },
      { l: 'PER Fwd',   v: d.per_fwd  },
      { l: 'PEG',       v: d.peg      },
      { l: 'EV/EBIT',   v: ev_ebit    },
      { l: 'EV/FCF',    v: ev_fcf     },
      { l: 'EV/EBITDA', v: ev_ebitda  },
    ].filter(x => x.v != null);
    if (!items.length) return;

    const colFor = v => v < 15 ? this.C.green+'CC' : v < 25 ? this.C.teal+'CC' : v < 40 ? this.C.amber+'CC' : this.C.red+'CC';

    this.instances['chart-g7'] = new Chart(ctx, this._chartOpts('bar', {
      labels: items.map(x => x.l),
      datasets: [{
        label: 'Múltiplo (x)',
        data: items.map(x => x.v),
        backgroundColor: items.map(x => colFor(x.v)),
        borderColor: items.map(x => colFor(x.v).slice(0,7)),
        borderWidth: 2, borderRadius: 6, borderSkipped: false,
        barPercentage: 0.45, maxBarThickness: 52,
      }]
    }, {
      plugins: {
        legend: { display: false },
        title: { display: true, text: `${empresa} — Múltiplos de Valoración`, color: this.C.blue3, font: { size: 13, weight: '700' } },
        annotation: {
          annotations: {
            ref15: { type: 'line', scaleID: 'y', value: 15, borderColor: this.C.green+'88', borderWidth: 1.5, borderDash: [4,3], label: { display: true, content: '15x', position: 'end', color: this.C.green, font: { size: 10 } } },
            ref25: { type: 'line', scaleID: 'y', value: 25, borderColor: this.C.amber+'88', borderWidth: 1.5, borderDash: [4,3], label: { display: true, content: '25x', position: 'end', color: this.C.amber, font: { size: 10 } } },
          }
        },
        tooltip: { callbacks: { label: c => ` ${c.parsed.y.toFixed(2)}x` } }
      },
      scales: {
        x: { grid: { color: this.C.grid }, ticks: { color: this.C.silver1 } },
        y: { grid: { color: this.C.grid }, ticks: { color: this.C.silver1, callback: v => v+'x' }, suggestedMax: 50 },
      }
    }));
  },

  // G8 — Barras: Liquidez y Solvencia
  renderG8(d, empresa) {
    const ctx = this._base('chart-g8');
    if (!ctx) return;
    const de = d.deuda_patrimonio != null ? d.deuda_patrimonio / 100 : (d.deuda_total && d.equity ? d.deuda_total / d.equity : null);
    const items = [
      { l: 'Liquidez Corriente', v: d.current_ratio },
      { l: 'Prueba Ácida',       v: d.quick_ratio   },
      { l: 'D/E Ratio',          v: de              },
    ].filter(x => x.v != null);
    if (!items.length) return;

    const colFor = (l, v) => {
      if (l.includes('Liquidez')) return v >= 1.5 ? this.C.green+'CC' : v >= 1 ? this.C.amber+'CC' : this.C.red+'CC';
      if (l.includes('Ácida'))   return v >= 1   ? this.C.green+'CC' : v >= 0.5? this.C.amber+'CC' : this.C.red+'CC';
      return v < 0.5 ? this.C.green+'CC' : v < 1.5 ? this.C.teal+'CC' : v < 3 ? this.C.amber+'CC' : this.C.red+'CC';
    };

    this.instances['chart-g8'] = new Chart(ctx, this._chartOpts('bar', {
      labels: items.map(x => x.l),
      datasets: [{
        label: 'Ratio (x)',
        data: items.map(x => x.v),
        backgroundColor: items.map(x => colFor(x.l, x.v)),
        borderColor: items.map(x => colFor(x.l, x.v).slice(0,7)),
        borderWidth: 2, borderRadius: 6, borderSkipped: false,
        barPercentage: 0.4, maxBarThickness: 68,
      }]
    }, {
      plugins: {
        legend: { display: false },
        title: { display: true, text: `${empresa} — Liquidez y Solvencia`, color: this.C.blue3, font: { size: 13, weight: '700' } },
        annotation: {
          annotations: {
            ref1: { type: 'line', scaleID: 'y', value: 1, borderColor: this.C.amber, borderWidth: 2, borderDash: [5,3],
              label: { display: true, content: '1.0x', position: 'end', color: this.C.amber, font: { size: 10 } } }
          }
        },
        tooltip: { callbacks: { label: c => ` ${c.parsed.y.toFixed(2)}x` } }
      },
      scales: {
        x: { grid: { color: this.C.grid }, ticks: { color: this.C.silver1 } },
        y: { grid: { color: this.C.grid }, ticks: { color: this.C.silver1, callback: v => v+'x' } },
      }
    }));
  },

  // G9 — Panel doble: Deuda Neta barra + Altman Z gauge
  renderG9(d, empresa) {
    this._renderG9Deuda(d, empresa);
    this._renderG9Altman(d, empresa);
  },

  _renderG9Deuda(d, empresa) {
    const ctx = this._base('chart-g9a');
    if (!ctx || d.deuda_neta == null) return;
    const isNeg = d.deuda_neta < 0;
    const barCol = isNeg ? this.C.green : this.C.red;
    this.instances['chart-g9a'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [isNeg ? 'Posición Neta de Caja' : 'Deuda Neta', 'Deuda Total Bruta'],
        datasets: [{
          data: [Math.abs(d.deuda_neta), Math.abs(d.deuda_total || d.deuda_neta)],
          backgroundColor: [barCol + 'CC', this.C.red + '66'],
          borderColor:     [barCol,         this.C.red],
          borderWidth: 2, hoverOffset: 10,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { position: 'bottom', labels: { color: this.C.silver2, boxWidth: 14, padding: 14 } },
          title: { display: true, text: `${empresa} — Deuda Neta`, color: this.C.blue3, font: { size: 13, weight: '700' } },
          tooltip: { callbacks: { label: c => ` ${c.label}: ${c.parsed >= 1000 ? (c.parsed/1000).toFixed(1)+'B' : c.parsed.toFixed(0)+'M'}` } }
        }
      },
      plugins: [{
        id: 'centerDN',
        afterDraw(chart) {
          const { ctx: c, chartArea: { width, height, left, top } } = chart;
          c.save(); c.textAlign='center'; c.textBaseline='middle';
          c.fillStyle = barCol;
          c.font = 'bold 11px Inter, Arial';
          c.fillText(isNeg ? '✔ CAJA NETA' : '✘ DEUDA NETA', left+width/2, top+height/2);
          c.restore();
        }
      }]
    });
  },

  _renderG9Altman(d, empresa) {
    const ctx = this._base('chart-g9b');
    if (!ctx || d.altman_z == null) return;

    const z          = Math.max(0, Math.min(d.altman_z, 6));
    const zoneLabel  = d.altman_z >= 3 ? '✔ ZONA SEGURA' : d.altman_z >= 1.8 ? '⚠ ZONA GRIS' : '✘ ZONA RIESGO';
    const zoneColor  = d.altman_z >= 3 ? this.C.green : d.altman_z >= 1.8 ? this.C.amber : this.C.red;

    this.instances['chart-g9b'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Riesgo (0–1.8)', 'Gris (1.8–3)', 'Segura (3+)'],
        datasets: [
          {
            data: [1.8, 1.2, 3.0],
            backgroundColor: [this.C.red+'CC', this.C.amber+'CC', this.C.green+'CC'],
            borderColor:     [this.C.red,       this.C.amber,       this.C.green],
            borderWidth: 1, circumference: 180, rotation: 270, weight: 3,
          },
          {
            data: [Math.min(z, 6), 6 - Math.min(z, 6)],
            backgroundColor: ['rgba(255,255,255,.9)', 'rgba(0,0,0,0)'],
            borderWidth: 0, circumference: 180, rotation: 270, weight: 0.4,
          }
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '55%',
        plugins: {
          legend: { position: 'bottom', labels: { color: this.C.silver1, boxWidth: 12, padding: 10, font: { size: 10 } } },
          title: {
            display: true,
            text: [`Altman Z-Score: ${d.altman_z.toFixed(2)}`, zoneLabel],
            color: [this.C.blue3, zoneColor],
            font: [{ size: 13, weight: '700' }, { size: 11 }],
          },
          tooltip: { filter: item => item.datasetIndex === 0 }
        }
      }
    });
  },

  // Renderiza todas las gráficas
  renderAll(data, results, empresa) {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      this.renderG1(data, empresa);
      this.renderG2(data, empresa);
      this.renderG3(results, empresa);
      this.renderG4(data, empresa);
      this.renderG5(data, empresa);
      this.renderG6(data, empresa);
      this.renderG7(data, empresa);
      this.renderG8(data, empresa);
      this.renderG9(data, empresa);
    }, 80);
  },
};
