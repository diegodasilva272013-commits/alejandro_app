// ── dashboard.js — Señales v3.0 ───────────────────────────────────────────
// Renderiza el dashboard: score strip, sidebar nav, puntos, gráficos, resumen

let _charts = [];

function destruirCharts() {
  _charts.forEach(c => { try { c.destroy(); } catch(e) {} });
  _charts = [];
}

// ── Score strip ───────────────────────────────────────────────────────────
function renderScoreStrip(datos, resumen, empresa) {
  const strip = document.getElementById('score-strip');
  strip.innerHTML = '';

  const cards = [
    { label:'Puntos CUMPLEN',    value: resumen.totalCumple,   sub:`de ${resumen.total}`, cls:'verde' },
    { label:'No Cumplen',        value: resumen.totalNo,       sub:'señales negativas',   cls:'rojo' },
    { label:'Dato Faltante',     value: resumen.totalFaltante, sub:'sin datos',            cls:'orange' },
    { label:'Alertas Activas',   value: resumen.alertas.length,sub:'requieren atención',  cls:'rojo' },
  ];

  // ROIC vs WACC card
  if (ok(datos.roic) && ok(datos.wacc)) {
    const crea = datos.roic > datos.wacc;
    cards.unshift({
      label: 'ROIC vs WACC',
      value: (datos.roic - datos.wacc).toFixed(1) + 'pp',
      sub: crea ? 'CREA VALOR' : 'DESTRUYE VALOR',
      cls: crea ? 'verde' : 'rojo'
    });
  }

  cards.forEach(c => {
    strip.insertAdjacentHTML('beforeend', `
      <div class="score-card ${c.cls}">
        <div class="sc-label">${c.label}</div>
        <div class="sc-value">${c.value}</div>
        <div class="sc-sub">${c.sub}</div>
      </div>`);
  });
}

// ── Sidebar nav ───────────────────────────────────────────────────────────
function renderSidebarNav(puntos, resumen) {
  const navPuntos = document.getElementById('nav-puntos');
  navPuntos.innerHTML = '';

  // Agrupar por grupo
  const grupos = {};
  puntos.forEach(p => {
    (grupos[p.grupo] = grupos[p.grupo] || []).push(p);
  });

  for (const [grupo, pts] of Object.entries(grupos)) {
    navPuntos.insertAdjacentHTML('beforeend',
      `<div class="nav-section-title">${grupo}</div>`);
    pts.forEach(p => {
      const cls = p.resultado === CUMPLE ? 'cumple' : p.resultado === NO ? 'no' : 'falta';
      const ico = p.resultado === CUMPLE ? '✓' : p.resultado === NO ? '✗' : '?';
      navPuntos.insertAdjacentHTML('beforeend', `
        <div class="nav-item" onclick="scrollToSection('punto-${p.letra}')">
          <span>${p.letra}</span>
          <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.73rem">${p.titulo.split('—')[0].trim()}</span>
          <span class="nav-badge ${cls}">${ico}</span>
        </div>`);
    });
  }

  // Conteos
  document.getElementById('nav-counts').innerHTML = `
    <div class="nc-row"><span class="nc-label">Cumplen</span><span class="nc-val" style="color:#4ddc8a">${resumen.totalCumple}</span></div>
    <div class="nc-row"><span class="nc-label">No Cumplen</span><span class="nc-val" style="color:#ff7b7b">${resumen.totalNo}</span></div>
    <div class="nc-row"><span class="nc-label">Datos faltantes</span><span class="nc-val" style="color:#ffaa44">${resumen.totalFaltante}</span></div>`;
}

// ── Resumen Ejecutivo ─────────────────────────────────────────────────────
function renderResumenEjecutivo(datos, puntos, resumen, empresa, ticker, periodo) {
  const container = document.getElementById('sec-resumen-ejecutivo');
  if (!container) return;

  const pct = resumen.total > 0 ? Math.round((resumen.totalCumple / resumen.total) * 100) : 0;
  const semaforo = pct >= 70 ? '#1A8A4A' : pct >= 50 ? '#E67E22' : '#C0392B';
  const semaforoLabel = pct >= 70 ? 'COMPRA POTENCIAL' : pct >= 50 ? 'REVISAR CON CUIDADO' : 'CAUTELA';

  // Métricas clave en filas
  const metricas = [
    ['ROIC', ok(datos.roic) ? datos.roic.toFixed(2) + '%' : 'N/D', ok(datos.roic) && ok(datos.wacc) ? (datos.roic > datos.wacc ? '#1A8A4A' : '#C0392B') : '#8FA8C8'],
    ['WACC', ok(datos.wacc) ? datos.wacc.toFixed(2) + '%' : 'N/D', '#8FA8C8'],
    ['ROE', ok(datos.roe) ? datos.roe.toFixed(2) + '%' : 'N/D', ok(datos.roe) ? (datos.roe > 15 ? '#1A8A4A' : '#C0392B') : '#8FA8C8'],
    ['ROA', ok(datos.roa) ? datos.roa.toFixed(2) + '%' : 'N/D', ok(datos.roa) ? (datos.roa > 10 ? '#1A8A4A' : '#C0392B') : '#8FA8C8'],
    ['Margen Bruto', ok(datos.margen_bruto) ? datos.margen_bruto.toFixed(2) + '%' : 'N/D', ok(datos.margen_bruto) ? (datos.margen_bruto >= 40 ? '#1A8A4A' : '#C0392B') : '#8FA8C8'],
    ['Margen Neto', ok(datos.margen_neto) ? datos.margen_neto.toFixed(2) + '%' : 'N/D', ok(datos.margen_neto) ? (datos.margen_neto >= 20 ? '#1A8A4A' : '#C0392B') : '#8FA8C8'],
    ['Margen EBITDA', ok(datos.margen_ebitda) ? datos.margen_ebitda.toFixed(2) + '%' : 'N/D', ok(datos.margen_ebitda) ? (datos.margen_ebitda >= 25 ? '#1A8A4A' : '#C0392B') : '#8FA8C8'],
    ['Margen EBIT', ok(datos.margen_ebit) ? datos.margen_ebit.toFixed(2) + '%' : 'N/D', ok(datos.margen_ebit) ? (datos.margen_ebit >= 15 ? '#1A8A4A' : '#C0392B') : '#8FA8C8'],
    ['FCF Yield', ok(datos.fcf_yield) ? datos.fcf_yield.toFixed(2) + '%' : 'N/D', ok(datos.fcf_yield) ? (datos.fcf_yield >= 4 ? '#1A8A4A' : '#C0392B') : '#8FA8C8'],
    ['PER LTM', ok(datos.per_ltm) ? datos.per_ltm.toFixed(1) + 'x' : 'N/D', ok(datos.per_ltm) ? (datos.per_ltm > 0 && datos.per_ltm <= 25 ? '#1A8A4A' : '#C0392B') : '#8FA8C8'],
    ['PER Forward', ok(datos.per_fwd) ? datos.per_fwd.toFixed(1) + 'x' : 'N/D', ok(datos.per_fwd) ? (datos.per_fwd > 0 && datos.per_fwd <= 20 ? '#1A8A4A' : '#C0392B') : '#8FA8C8'],
    ['EV/EBITDA', ok(datos.ev_ebitda) ? datos.ev_ebitda.toFixed(1) + 'x' : 'N/D', ok(datos.ev_ebitda) ? (datos.ev_ebitda <= 15 ? '#1A8A4A' : '#C0392B') : '#8FA8C8'],
    ['Deuda Neta/EBITDA', ok(datos.deuda_neta_ebitda) ? datos.deuda_neta_ebitda.toFixed(2) + 'x' : 'N/D', ok(datos.deuda_neta_ebitda) ? (datos.deuda_neta_ebitda <= 2.5 ? '#1A8A4A' : '#C0392B') : '#8FA8C8'],
    ['EPS Growth', ok(datos.eps_growth) ? datos.eps_growth.toFixed(2) + '%' : 'N/D', ok(datos.eps_growth) ? (datos.eps_growth >= 10 ? '#1A8A4A' : '#C0392B') : '#8FA8C8'],
  ].filter(m => m[1] !== 'N/D');

  const filasHTML = metricas.map(m => `
    <div class="rej-fila">
      <span class="rej-label">${m[0]}</span>
      <span class="rej-val" style="color:${m[2]}">${m[1]}</span>
    </div>`).join('');

  // Alertas
  const alertasHTML = resumen.alertas.length > 0
    ? resumen.alertas.map(p => `<div class="rej-alerta">⚠ ${p.letra} — ${p.alerta}</div>`).join('')
    : '<div class="rej-alerta-ok">✓ Sin alertas activas</div>';

  container.innerHTML = `
    <div class="section-block">
      <div class="section-title">Resumen Ejecutivo</div>
      <div class="rej-grid">
        <!-- Columna izquierda: métricas -->
        <div class="rej-col-metricas">
          <div class="rej-section-hdr">Indicadores Financieros Clave</div>
          ${filasHTML || '<div style="color:rgba(255,255,255,.4);font-size:.82rem;padding:.5rem 0">No se cargaron indicadores numéricos.</div>'}
        </div>

        <!-- Columna derecha: scorecard + alertas -->
        <div class="rej-col-score">
          <div class="rej-score-box" style="border-color:${semaforo}33;background:${semaforo}11">
            <div class="rej-score-pct" style="color:${semaforo}">${pct}%</div>
            <div class="rej-score-label" style="color:${semaforo}">${semaforoLabel}</div>
            <div class="rej-score-sub">${resumen.totalCumple} de ${resumen.total} puntos cumplen</div>
            <div class="rej-score-detalle">
              <span style="color:#1A8A4A">✓ ${resumen.totalCumple} cumplen</span> ·
              <span style="color:#C0392B">✗ ${resumen.totalNo} no cumplen</span> ·
              <span style="color:#E67E22">? ${resumen.totalFaltante} sin dato</span>
            </div>
          </div>

          <div class="rej-section-hdr" style="margin-top:1.1rem">Alertas</div>
          <div class="rej-alertas-box">${alertasHTML}</div>

          <div class="rej-conclusion-box">
            <div class="rej-conclusion-lbl">Conclusión</div>
            <div class="rej-conclusion-txt">${resumen.conclusion}</div>
            ${resumen.cita ? `<div class="rej-cita">${resumen.cita}</div>` : ''}
          </div>
        </div>
      </div>
    </div>`;
}

// ── Puntos cards ──────────────────────────────────────────────────────────
function renderPuntos(puntos) {
  const container = document.getElementById('sec-puntos');
  container.innerHTML = '';

  // Agrupar
  const grupos = {};
  puntos.forEach(p => {
    (grupos[p.grupo] = grupos[p.grupo] || []).push(p);
  });

  for (const [grupo, pts] of Object.entries(grupos)) {
    const cumple   = pts.filter(p => p.resultado === CUMPLE).length;
    const total    = pts.length;
    const clsCount = cumple === total ? 'cumple' : cumple === 0 ? 'no' : 'falta';

    let html = `<div class="section-block">
      <div class="section-title">
        ${grupo}
        <span class="section-title-counter nav-badge ${clsCount}">${cumple}/${total}</span>
      </div>
      <div class="section-body">`;

    pts.forEach(p => {
      const clsLetra = p.resultado === CUMPLE ? 'cumple' : p.resultado === NO ? 'no' : 'falta';
      const clsBadge = clsLetra;
      html += `
        <div class="punto-card" id="punto-${p.letra}">
          <div class="punto-letra ${clsLetra}">${p.letra}</div>
          <div class="punto-body">
            <div class="punto-titulo">${p.titulo}</div>
            <div class="punto-datos">${p.datosRec}</div>
            <div class="punto-interp">${p.interpretacion}</div>
          </div>
          <div class="badge-resultado ${clsBadge}">${p.resultado}</div>
        </div>`;

      if (p.alerta && p.resultado !== CUMPLE) {
        html += `<div class="alerta-box"><span class="alerta-id">⚠ ALERTA</span>${p.alerta}</div>`;
      }
    });

    html += '</div></div>';
    container.insertAdjacentHTML('beforeend', html);
  }
}

// ── Resumen Final ─────────────────────────────────────────────────────────
function renderResumenFinal(puntos, resumen) {
  const container = document.getElementById('sec-final');

  const cumplenList = puntos.filter(p => p.resultado === CUMPLE)
    .map(p => `<li><span class="dot dot-green"></span>${p.letra} — ${p.titulo}</li>`).join('');
  const noList = puntos.filter(p => p.resultado === NO)
    .map(p => `<li><span class="dot dot-red"></span>${p.letra} — ${p.titulo}</li>`).join('');
  const faltaList = puntos.filter(p => p.resultado === FALTA)
    .map(p => `<li><span class="dot dot-gray"></span>${p.letra} — ${p.titulo}</li>`).join('');

  container.innerHTML = `
    <div class="section-block">
      <div class="section-title">Resumen Final — Señales v3.0</div>
      <div class="section-body" style="padding:1.25rem">
        <div class="resumen-box">
          <div class="resumen-box-title" style="color:#4ddc8a">✓ Señales que CUMPLEN (${resumen.totalCumple})</div>
          <ul class="resumen-lista">${cumplenList || '<li><span class="dot dot-gray"></span>Ninguna</li>'}</ul>
        </div>
        ${resumen.totalNo > 0 ? `
        <div class="resumen-box" style="border-color:rgba(192,57,43,.3);margin-top:1rem">
          <div class="resumen-box-title" style="color:#ff7b7b">✗ No Cumplen (${resumen.totalNo})</div>
          <ul class="resumen-lista">${noList}</ul>
        </div>` : ''}
        ${resumen.totalFaltante > 0 ? `
        <div class="resumen-box" style="border-color:rgba(230,126,34,.25);margin-top:1rem">
          <div class="resumen-box-title" style="color:#ffaa44">? Dato Faltante (${resumen.totalFaltante})</div>
          <ul class="resumen-lista">${faltaList}</ul>
        </div>` : ''}
        <div class="conclusion-box" style="margin-top:1.25rem">
          <div class="conclusion-label">Conclusión del análisis</div>
          <div class="conclusion-text">${resumen.conclusion}</div>
          ${resumen.cita ? `<div class="conclusion-cita">${resumen.cita}</div>` : ''}
        </div>
      </div>
    </div>`;
}

// ── Gráficos ──────────────────────────────────────────────────────────────
function renderGraficos(datos, resumen, empresa) {
  destruirCharts();

  const GOLD    = '#C9A84C';
  const GREEN   = '#1A8A4A';
  const RED     = '#C0392B';
  const ORANGE  = '#E67E22';
  const BLUE    = '#5A9BFF';
  const NAVY    = '#0D1B3E';
  const GRAY    = 'rgba(255,255,255,.25)';

  const chartDefaults = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: GRAY, font: { size: 11 } } } },
    scales: {}
  };

  // ── Gráfico 1: Barras — Rentabilidad ──────────────────────────────────
  (() => {
    const labels = [], vals = [], colors = [];
    if (ok(datos.roic))  { labels.push('ROIC');  vals.push(datos.roic);  colors.push(datos.roic > (datos.wacc||0) ? GREEN : RED); }
    if (ok(datos.wacc))  { labels.push('WACC');  vals.push(datos.wacc);  colors.push(GOLD); }
    if (ok(datos.roe))   { labels.push('ROE');   vals.push(datos.roe);   colors.push(BLUE); }
    if (ok(datos.roa))   { labels.push('ROA');   vals.push(datos.roa);   colors.push('#9B59B6'); }

    if (!labels.length) { document.getElementById('chart-rent').parentElement.parentElement.style.display = 'none'; return; }

    const ctx = document.getElementById('chart-rent').getContext('2d');
    _charts.push(new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ data: vals, backgroundColor: colors, borderRadius: 5, barPercentage: .6 }] },
      options: { ...chartDefaults,
        plugins: { legend: { display: false },
          tooltip: { callbacks: { label: ctx => ctx.parsed.y.toFixed(2) + '%' } } },
        scales: {
          x: { ticks: { color: GRAY }, grid: { color: 'rgba(255,255,255,.05)' } },
          y: { ticks: { color: GRAY, callback: v => v + '%' }, grid: { color: 'rgba(255,255,255,.05)' },
               title: { display: true, text: '%', color: GRAY, font: { size: 10 } } }
        }
      }
    }));
  })();

  // ── Gráfico 2: Donut — Distribución ───────────────────────────────────
  (() => {
    const ctx = document.getElementById('chart-donut').getContext('2d');
    _charts.push(new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Cumplen', 'No Cumplen', 'Faltante'],
        datasets: [{ data: [resumen.totalCumple, resumen.totalNo, resumen.totalFaltante],
          backgroundColor: [GREEN, RED, ORANGE],
          borderColor: ['#080E1A'], borderWidth: 3, hoverOffset: 8
        }]
      },
      options: { ...chartDefaults,
        plugins: {
          legend: { position: 'bottom', labels: { color: GRAY, padding: 12, font: { size: 11 } } },
          tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed}` } }
        },
        cutout: '60%'
      }
    }));
  })();

  // ── Gráfico 3: Línea — Cascada de márgenes ────────────────────────────
  (() => {
    const labels = [], vals = [], colors = [];
    const add = (lbl, v) => {
      if (!ok(v)) return;
      labels.push(lbl); vals.push(v);
      colors.push(v >= 20 ? GREEN : v >= 10 ? GOLD : RED);
    };
    add('M.Bruto',   datos.margen_bruto);
    add('M.EBITDA',  datos.margen_ebitda);
    add('M.EBIT',    datos.margen_ebit);
    add('M.Neto',    datos.margen_neto);
    add('M.FCF',     datos.fcf_margen_apal);
    add('M.CapEx',   datos.capex_margen);

    if (!labels.length) { document.getElementById('chart-margenes').parentElement.parentElement.style.display = 'none'; return; }

    const ctx = document.getElementById('chart-margenes').getContext('2d');
    _charts.push(new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: vals, borderColor: GOLD, backgroundColor: 'rgba(201,168,76,.08)',
          pointBackgroundColor: colors, pointRadius: 6, pointHoverRadius: 8,
          tension: .35, fill: true
        }]
      },
      options: { ...chartDefaults,
        plugins: { legend: { display: false },
          tooltip: { callbacks: { label: ctx => ctx.parsed.y.toFixed(2) + '%' } } },
        scales: {
          x: { ticks: { color: GRAY }, grid: { color: 'rgba(255,255,255,.05)' } },
          y: { ticks: { color: GRAY, callback: v => v + '%' }, grid: { color: 'rgba(255,255,255,.05)' } }
        }
      }
    }));
  })();
}

// ── Render completo ───────────────────────────────────────────────────────
function renderDashboard(datos, puntos, resumen, empresa, ticker, periodo) {
  // Header
  document.getElementById('dash-empresa').textContent =
    empresa + (ticker ? ` (${ticker})` : '');
  document.getElementById('dash-meta').textContent =
    [periodo, new Date().toLocaleDateString('es-AR', { year:'numeric', month:'long', day:'numeric' })]
      .filter(Boolean).join(' · ') + ' · Señales v3.0 · 29 puntos evaluados';

  renderScoreStrip(datos, resumen, empresa);
  renderSidebarNav(puntos, resumen);
  renderResumenEjecutivo(datos, puntos, resumen, empresa, ticker, periodo);
  renderGraficos(datos, resumen, empresa);
  renderPuntos(puntos);
  renderResumenFinal(puntos, resumen);
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // Actualizar nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  event.currentTarget && event.currentTarget.classList.add('active');
}
