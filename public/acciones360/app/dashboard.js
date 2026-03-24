// ── dashboard.js — Módulo 4: Renderizado del dashboard ────────────────────────
const Dashboard = {

  // Qué gráfica va después de qué indicador num
  CHART_AFTER: {
    '03': 'G1',
    '05': 'G3',
    '06': 'G4',
    '10': 'G2',
    '15': 'G6',
    '18': 'G7',
    '20': 'G8',
    '24': 'G9',
    '35': 'G5',
  },

  CHART_IDS: {
    G1: ['chart-g1'],
    G2: ['chart-g2'],
    G3: ['chart-g3'],
    G4: ['chart-g4'],
    G5: ['chart-g5'],
    G6: ['chart-g6'],
    G7: ['chart-g7'],
    G8: ['chart-g8'],
    G9: ['chart-g9a', 'chart-g9b'],
  },

  CHART_TITLES: {
    G1: 'Ingresos, Utilidad Bruta y Ganancia Neta',
    G2: 'EBIT y EBITDA',
    G3: 'Márgenes — Análisis Semáforo',
    G4: 'Flujos de Caja (CFO, CapEx, FCF)',
    G5: 'Estructura de Capital',
    G6: 'Retornos sobre Capital (ROE, ROA, ROIC)',
    G7: 'Múltiplos de Valoración',
    G8: 'Liquidez y Solvencia',
    G9: 'Deuda Neta y Altman Z-Score',
  },

  COLOR_CSS: {
    green:  { bg: '#EAF7EF', border: '#27AE60', text: '#155724' },
    teal:   { bg: '#E8F4F5', border: '#1A6B72', text: '#0E4048' },
    orange: { bg: '#FEF3E2', border: '#E67E22', text: '#7D4E10' },
    red:    { bg: '#FDECEA', border: '#C0392B', text: '#7B1C14' },
    gray:   { bg: '#F0F2F5', border: '#4A5568', text: '#4A5568' },
  },

  // ── Render principal ───────────────────────────────────────────────────────
  render(data, results, summary, empresa, ticker) {
    this._renderHeader(empresa, ticker);
    this._renderKPIs(results);
    this._renderIndicators(results);
    this._renderResumenFinal(results, summary);
    this._activateNav('nav-resumen');
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  _renderHeader(empresa, ticker) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('header-empresa', empresa + (ticker ? ` (${ticker})` : ''));
    set('header-ticker',  ticker ? `(${ticker})` : '');
    set('header-fecha',   new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' }));
  },

  // ── KPI Cards ──────────────────────────────────────────────────────────────
  _renderKPIs(results) {
    const KPI_IDS = ['ind_04', 'ind_08', 'ind_24', 'ind_16', 'ind_19', 'ind_01', 'ind_a', 'ind_xx'];
    const container = document.getElementById('kpi-grid');
    if (!container) return;

    container.innerHTML = KPI_IDS.map(id => {
      const r = results.find(x => x.id === id);
      if (!r) return '';
      const cc = this.COLOR_CSS[r.rango.color] || this.COLOR_CSS.gray;
      return `
        <div class="kpi-card" style="border-left:4px solid ${cc.border};background:${cc.bg}">
          <div class="kpi-num" style="color:${cc.border}">${r.valorFmt}</div>
          <div class="kpi-label">${r.nombre}</div>
          <div class="kpi-badge" style="background:${cc.border};color:#fff">${r.rango.badge}</div>
        </div>`;
    }).join('');

    // Warning box for missing data
    const missing = results.filter(r => r.faltante);
    const warnBox = document.getElementById('warn-box');
    if (warnBox) {
      if (missing.length > 0) {
        warnBox.style.display = 'block';
        warnBox.innerHTML = `<strong>⚠ ${missing.length} dato(s) faltante(s):</strong> ${missing.map(r => r.nombre).join(', ')}`;
      } else {
        warnBox.style.display = 'none';
      }
    }
  },

  // Indicator num → bloque body container mapping
  _BLOQUE_MAP: {
    '01':'bloque-i-body','02':'bloque-i-body','03':'bloque-i-body','04':'bloque-i-body','05':'bloque-i-body',
    '06':'bloque-ii-body','07':'bloque-ii-body','08':'bloque-ii-body','09':'bloque-ii-body','10':'bloque-ii-body',
    '11':'bloque-iii-body','12':'bloque-iii-body','13':'bloque-iii-body','14':'bloque-iii-body','15':'bloque-iii-body',
    '16':'bloque-iv-body','17':'bloque-iv-body','18':'bloque-iv-body','19':'bloque-iv-body','20':'bloque-iv-body',
    '21':'bloque-v-body','22':'bloque-v-body','23':'bloque-v-body','24':'bloque-v-body',
    '25':'bloque-v-body','26':'bloque-v-body','27':'bloque-v-body',
    '28':'bloque-vi-body','29':'bloque-vi-body','30':'bloque-vi-body',
    '31':'bloque-vii-body','32':'bloque-vii-body','33':'bloque-vii-body','34':'bloque-vii-body','35':'bloque-vii-body',
    'XX':'bloque-xx-body',
    'A':'bloque-ae-body','B':'bloque-ae-body','C':'bloque-ae-body','D':'bloque-ae-body','E':'bloque-ae-body',
    'CF1':'bloque-cf-body','CF2':'bloque-cf-body','CF3':'bloque-cf-body','CF4':'bloque-cf-body',
    'CF5':'bloque-cf-body','CF6':'bloque-cf-body','CF7':'bloque-cf-body',
    'FWD1':'bloque-fwd-body','FWD2':'bloque-fwd-body','FWD3':'bloque-fwd-body','FWD4':'bloque-fwd-body',
  },

  // ── Sección de indicadores ─────────────────────────────────────────────────
  _renderIndicators(results) {
    // Build per-bloque HTML strings
    const ALL_BODIES = [
      'bloque-i-body','bloque-ii-body','bloque-iii-body','bloque-iv-body',
      'bloque-v-body','bloque-vi-body','bloque-vii-body','bloque-viii-body',
      'bloque-xx-body','bloque-ae-body','bloque-cf-body','bloque-fwd-body',
    ];
    const htmlMap = {};
    ALL_BODIES.forEach(id => { htmlMap[id] = ''; });

    for (const r of results) {
      const targetId = this._BLOQUE_MAP[r.num] || 'bloque-vii-body';
      const cc = this.COLOR_CSS[r.rango.color] || this.COLOR_CSS.gray;

      htmlMap[targetId] += `
        <div class="indicator-card" id="icard-${r.id}">
          <div class="ic-header">
            <span class="ic-num">${r.num}</span>
            <span class="ic-name">${r.nombre}</span>
          </div>
          <div class="ic-formula">
            <span class="ic-label">Fórmula:</span> ${r.formula}
          </div>
          <div class="ic-result">
            <span class="ic-label">Resultado:</span>
            <strong style="color:${cc.border}">${r.valorFmt}</strong>
          </div>
          <div class="ic-lectura" style="background:${cc.bg};border-left:3px solid ${cc.border}">
            <span class="ic-label">Lectura:</span>
            ${r.rango.texto}
            <span class="ic-badge" style="background:${cc.border};color:#fff">${r.rango.badge}</span>
          </div>
          <div class="ic-tendencia">
            <span class="ic-label">Tendencia:</span>
            ${r.tendencia || '— Solo 1 periodo disponible'}
          </div>
        </div>`;

      // Insert chart after designated indicators
      const gKey = this.CHART_AFTER[r.num];
      if (gKey) htmlMap[targetId] += this._chartBlock(gKey);
    }

    // Flush all containers
    ALL_BODIES.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = htmlMap[id] ||
        '<p style="color:var(--gray3,#888);font-size:.83rem;padding:.5rem 0">Sin indicadores en este bloque.</p>';
    });
  },

  _chartBlock(gKey) {
    const title = this.CHART_TITLES[gKey] || gKey;
    const ids = this.CHART_IDS[gKey] || [];
    const canvases = ids.map(id =>
      `<div class="chart-wrap"><canvas id="${id}" style="width:100%;height:100%"></canvas></div>`
    ).join('');
    const gridStyle = gKey === 'G9'
      ? 'display:grid;grid-template-columns:1fr 1fr;gap:1rem'
      : '';

    return `
      <div class="chart-block">
        <div class="chart-block-title">${title}</div>
        <div style="${gridStyle}">${canvases}</div>
      </div>`;
  },

  // ── Resumen Final ──────────────────────────────────────────────────────────
  _renderResumenFinal(results, summary) {
    // Score badge
    const scoreDom = document.getElementById('score-badge');
    if (scoreDom) {
      const sc = summary.scoreNum;
      const scColor = sc >= 70 ? '#27AE60' : sc >= 45 ? '#E67E22' : '#C0392B';
      scoreDom.innerHTML = `<span style="font-size:2.2rem;font-weight:800;color:${scColor}">${sc}%</span><br><span style="font-size:.8rem;color:#4A5568">Salud Financiera</span>`;
    }

    // Counts
    ['green','teal','orange','red','gray'].forEach(c => {
      const el = document.getElementById(`count-${c}`);
      if (el) el.textContent = summary.counts[c] || 0;
    });

    // Fortalezas
    const fortEl = document.getElementById('fortalezas-list');
    if (fortEl) {
      fortEl.innerHTML = summary.fortalezas.length
        ? summary.fortalezas.map(r => `<div class="resumen-item green-item"><strong>${r.nombre}</strong>: ${r.valorFmt} — ${r.rango.badge}</div>`).join('')
        : '<div class="resumen-item">Sin fortalezas destacadas detectadas.</div>';
    }

    // Alertas
    const alertEl = document.getElementById('alertas-list');
    if (alertEl) {
      alertEl.innerHTML = summary.alertas.length
        ? summary.alertas.map(r => `<div class="resumen-item orange-item"><strong>${r.nombre}</strong>: ${r.valorFmt} — ${r.rango.badge}</div>`).join('')
        : '<div class="resumen-item" style="color:#27AE60">✅ Sin alertas críticas detectadas.</div>';
    }

    // Conclusión automática
    const concEl = document.getElementById('conclusion-text');
    if (concEl) {
      const sc = summary.scoreNum;
      let concl = '';
      if (sc >= 70) concl = `La empresa presenta una <strong>salud financiera sólida</strong> con ${summary.fortalezas.length} fortalezas identificadas y ${summary.alertas.length} alertas. Los indicadores muestran una empresa con fundamentos positivos.`;
      else if (sc >= 45) concl = `La empresa presenta una <strong>salud financiera moderada</strong>. Hay aspectos positivos pero también ${summary.alertas.length} áreas de atención que requieren seguimiento.`;
      else concl = `La empresa presenta <strong>señales de alerta importantes</strong>. Se identificaron ${summary.alertas.length} indicadores en zona de riesgo. Se recomienda análisis adicional antes de tomar decisiones.`;
      if (summary.faltantes.length > 0) concl += ` Nota: ${summary.faltantes.length} indicador(es) no pudieron calcularse por datos faltantes.`;
      concEl.innerHTML = concl;
    }
  },

  // ── Navegación sidebar ────────────────────────────────────────────────────
  _activateNav(id) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
  },

  scrollTo(sectionId) {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
};
