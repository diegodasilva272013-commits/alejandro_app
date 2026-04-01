// ── main.js — Señales v3.0 — Orquestador principal ────────────────────────

let _archivoActual  = null;
let _tabActual      = 'pegar';
let _datosGlobales  = null;
let _empresa        = '';
let _ticker         = '';
let _periodo        = '';
let _rawTextSenales = '';

const SENALES_HIST_KEY = 'senales_hist_v1';

// ── Tabs ─────────────────────────────────────────────────────────────────
function switchTab(tab) {
  _tabActual = tab;
  document.querySelectorAll('.upload-tab').forEach((t, i) => {
    t.classList.toggle('active', (i === 0 && tab === 'pegar') || (i === 1 && tab === 'archivo'));
  });
  document.getElementById('panel-pegar').classList.toggle('active', tab === 'pegar');
  document.getElementById('panel-archivo').classList.toggle('active', tab === 'archivo');
}

// ── Drag & Drop ───────────────────────────────────────────────────────────
(function initDrop() {
  const zone = document.getElementById('drop-zone');
  if (!zone) return;
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) setArchivo(file);
  });
  document.getElementById('file-input').addEventListener('change', e => {
    if (e.target.files[0]) setArchivo(e.target.files[0]);
  });
})();

function setArchivo(file) {
  _archivoActual = file;
  const tag = document.getElementById('file-name-tag');
  tag.textContent = '📎 ' + file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)';
  tag.style.display = 'block';
  mostrarError('');
}

// ── Error helper ──────────────────────────────────────────────────────────
function mostrarError(msg) {
  const b = document.getElementById('upload-error');
  b.textContent = msg;
  b.style.display = msg ? 'block' : 'none';
}

function setLoadingStep(txt) {
  const el = document.getElementById('loading-step');
  if (el) el.textContent = txt;
}

// ── Análisis principal ────────────────────────────────────────────────────
async function iniciarAnalisis() {
  _empresa = document.getElementById('inp-empresa').value.trim();
  _ticker  = document.getElementById('inp-ticker').value.trim().toUpperCase();
  _periodo = document.getElementById('inp-periodo').value.trim();

  if (!_empresa) { mostrarError('El nombre de empresa es requerido.'); return; }

  mostrarError('');
  document.getElementById('btn-analizar').disabled = true;

  // Mostrar loading
  showScreen('loading');
  setLoadingStep('Leyendo datos…');

  try {
    let datos;

    if (_tabActual === 'pegar') {
      const texto = document.getElementById('txt-paste').value.trim();
      if (!texto) throw new Error('Pegá los datos financieros antes de continuar.');
      _rawTextSenales = texto;
      setLoadingStep('Parseando texto libre…');
      datos = parsearTexto(texto);

    } else {
      if (!_archivoActual) throw new Error('Seleccioná un archivo antes de continuar.');
      setLoadingStep('Leyendo archivo ' + _archivoActual.name + '…');
      datos = await parsearArchivo(_archivoActual);
    }

    setLoadingStep('Evaluando 29 puntos…');
    await delay(300);

    const { puntos, resumen } = evaluarLos29Puntos(datos);
    _datosGlobales = { datos, puntos, resumen };

    setLoadingStep('Generando dashboard…');
    await delay(200);

    // Actualizar header
    document.getElementById('hdr-empresa').textContent = _empresa + (_ticker ? ` (${_ticker})` : '');
    document.getElementById('hdr-empresa').style.display = 'inline';
    document.getElementById('topbar-actions').style.display = 'flex';

    renderDashboard(datos, puntos, resumen, _empresa, _ticker, _periodo);
    showScreen('dashboard');

  } catch(err) {
    console.error('iniciarAnalisis error:', err);
    showScreen('upload');
    mostrarError('Error: ' + (err.message || String(err)));
    document.getElementById('btn-analizar').disabled = false;
  }
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Datos de ejemplo (empresa ficticia para testing) ──────────────────────
function cargarEjemplo() {
  document.getElementById('inp-empresa').value = 'MegaCorp S.A.';
  document.getElementById('inp-ticker').value  = 'MGCP';
  document.getElementById('inp-periodo').value = 'LTM 2025';

  document.getElementById('txt-paste').value =
`ROIC: 18.5%
WACC: 9.2%
ROE: 24%
ROA: 12.5%
Ingresos: 5200
Utilidad Bruta: 2340
Ganancias Netas: 1050
Margen Bruto: 45%
Margen Neto: 20.2%
Margen EBIT: 18%
Margen EBITDA: 32%
EBIT: 936
EBITDA: 1664
FCF: 780
FCF Yield: 4.8%
Margen FCF apalancado: 15%
PER LTM: 21x
PER Forward: 17x
PEG: 1.2
EV: 18000
EV/EBIT: 19.2x
EV/EBITDA: 10.8x
EV/FCF: 23x
Deuda/Patrimonio: 65%
Deuda Neta/EBITDA: 1.8x
Deuda Neta: 3000
Deuda Total: 4200
Equity: 6500
CapEx: 260
Margen CapEx: 5%
PP&E: 1800
Benef Bruto/Activos: 28%
EPS Growth: 14%
EPS Proyectado: 4.85
Efectivo de operaciones: 1120
Balance sano: Sí
Salud estructural débil: No
Ventaja competitiva: Sí
Sector deteriorándose: No
Posible re-rating EV: Sí
Spin-off: No
Recompra agresiva: Sí
Venta de activos: No`;

  // Asegurarse de que el tab Pegar esté activo
  switchTab('pegar');
}

// ── Navegación de pantallas ───────────────────────────────────────────────
function showScreen(name) {
  document.getElementById('screen-upload').style.display    = name === 'upload'    ? 'flex' : 'none';
  document.getElementById('screen-loading').style.display   = name === 'loading'   ? 'flex' : 'none';
  document.getElementById('screen-dashboard').style.display = name === 'dashboard' ? 'block' : 'none';

  if (name === 'upload') {
    document.getElementById('hdr-empresa').style.display    = 'none';
    document.getElementById('topbar-actions').style.display = 'none';
  }
}

function volverUpload() {
  document.getElementById('btn-analizar').disabled = false;
  showScreen('upload');
}

// ── CSS compartido para PDF ───────────────────────────────────────────────
function buildPDFStyles() {
  return `
  @page { margin: 1.5cm 1.2cm; size: A4; }
  html, body { min-height:0 !important; height:auto !important; background:#05080F !important; margin:0; padding:0; font-family:'Inter',sans-serif; }
  * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; color-adjust:exact !important; }

  /* Ocultar elementos de UI */
  .app-header, .topbar-actions, .dash-sidebar, #pdf-toolbar { display:none !important; }

  /* Layout */
  .dash-layout { display:block !important; padding-top:0 !important; min-height:0 !important; height:auto !important; }
  .dash-main { margin-left:0 !important; max-width:100% !important; padding:.75rem 0 !important; min-height:0 !important; }

  /* Score strip — horizontal, compacto */
  .score-strip { display:flex !important; flex-wrap:wrap !important; gap:.5rem !important; margin-bottom:.85rem !important; }
  .score-card { flex:1 1 120px; padding:.6rem .75rem !important; break-inside:avoid; }
  .sc-value { font-size:1.4rem !important; }

  /* Resumen ejecutivo — compacto en print */
  .rej-grid { grid-template-columns: 1.2fr 1fr !important; gap:1rem !important; padding:.75rem !important; }
  .rej-score-pct { font-size:2rem !important; }
  .rej-fila { padding:.22rem 0 !important; }

  /* Charts grid — 2 columnas, tamaño fijo */
  .charts-grid { display:grid !important; grid-template-columns:1fr 1fr !important; gap:.75rem !important; margin-bottom:.85rem !important; }
  .chart-card { break-inside:avoid; padding:.6rem !important; }
  .chart-card.full { grid-column:1/-1 !important; }
  .chart-wrap { height:160px !important; }
  .chart-wrap canvas, .chart-wrap img { width:100% !important; height:160px !important; object-fit:contain !important; }

  /* Section blocks — sin overflow oculto, sin altura fija */
  .section-block { overflow:visible !important; margin-bottom:.6rem !important; page-break-inside:auto !important; break-inside:auto !important; }
  .section-body { padding:.6rem .75rem !important; }
  .section-title { padding:.55rem .75rem !important; font-size:.82rem !important; }

  /* Punto cards — compactos, sin break-inside para no generar páginas vacías */
  .punto-card { padding:.45rem .6rem !important; gap:.5rem !important; break-inside:avoid; page-break-inside:avoid; margin-bottom:.3rem !important; }
  .punto-letra { width:32px !important; height:32px !important; font-size:.7rem !important; flex-shrink:0 !important; }
  .punto-titulo { font-size:.78rem !important; margin-bottom:.15rem !important; }
  .punto-datos { font-size:.72rem !important; }
  .punto-interp { font-size:.72rem !important; margin-top:.2rem !important; }
  .badge-resultado { font-size:.65rem !important; padding:.15rem .4rem !important; white-space:nowrap !important; }
  .alerta-box { padding:.35rem .75rem !important; font-size:.72rem !important; margin-bottom:.3rem !important; }

  /* Agrupaciones por grupo — salto de página entre grupos grandes */
  .section-block + .section-block { page-break-before:auto; }

  /* Resumen final */
  .resumen-box { padding:1rem !important; margin-bottom:.75rem !important; }
  .resumen-box-title { font-size:.9rem !important; margin-bottom:.6rem !important; }
  .resumen-lista li { padding:.22rem 0 !important; font-size:.76rem !important; }
  .conclusion-box { padding:.85rem !important; }
  .conclusion-text { font-size:.78rem !important; }
  `;
}

// ── Generar HTML del dashboard para PDF ───────────────────────────────────
function buildPDFHTML(clone, toolbar) {
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map(el => el.outerHTML).join('\n');
  const pdfStyles = buildPDFStyles();
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>${_empresa} — Señales v3.0</title>
${styles}
<style>${pdfStyles}</style>
</head><body>
${toolbar}
${clone.outerHTML}
</body></html>`;
}

// ── Preparar clone del dashboard ──────────────────────────────────────────
function prepararClone() {
  const dash = document.getElementById('screen-dashboard');
  const clone = dash.cloneNode(true);
  clone.style.display = 'block';

  // Canvas → imágenes
  const origCanvases  = dash.querySelectorAll('canvas');
  const cloneCanvases = clone.querySelectorAll('canvas');
  origCanvases.forEach((cv, i) => {
    try {
      const img = document.createElement('img');
      img.src = cv.toDataURL('image/png');
      img.style.cssText = 'width:100%;height:auto;display:block;border-radius:4px';
      if (cloneCanvases[i]) cloneCanvases[i].replaceWith(img);
    } catch(e) {}
  });

  // Eliminar sidebar
  const sidebar = clone.querySelector('.dash-sidebar');
  if (sidebar) sidebar.remove();

  return clone;
}

// ── Ver PDF (preview con print) ───────────────────────────────────────────
function verPDFSenales() {
  if (!_datosGlobales) return;
  const clone = prepararClone();

  const toolbar = `<div id="pdf-toolbar" style="position:fixed;top:0;left:0;right:0;z-index:9999;
    display:flex;align-items:center;gap:.6rem;padding:.6rem 1.2rem;
    background:#0D1B3E;border-bottom:1px solid rgba(201,168,76,.3);font-family:'Inter',sans-serif;">
    <span style="color:rgba(255,255,255,.6);font-size:.8rem;margin-right:auto">📄 ${_empresa}${_periodo ? ' · ' + _periodo : ''} — Señales v3.0</span>
    <button onclick="window.print()" style="background:#C9A84C;color:#0D1B3E;padding:.4rem 1rem;border-radius:6px;font-size:.8rem;font-weight:700;cursor:pointer;border:none">⬇ Guardar PDF</button>
    <button onclick="window.close()" style="background:rgba(255,255,255,.12);color:#fff;padding:.4rem 1rem;border-radius:6px;font-size:.8rem;font-weight:700;cursor:pointer;border:none">✕ Cerrar</button>
  </div>
  <div style="height:50px"></div>`;

  const html = buildPDFHTML(clone, toolbar);

  const win = window.open('', '_blank', 'width=1100,height=850,scrollbars=yes,resizable=yes');
  if (!win) { alert('Habilitá las ventanas emergentes para este sitio.'); return; }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

// ── Exportar PDF (descarga directa con html2pdf) ──────────────────────────
async function exportarPDFSenales() {
  if (!_datosGlobales) return;

  const btn = document.querySelector('[onclick="exportarPDFSenales()"]');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Generando...'; }

  try {
    const dash = document.getElementById('screen-dashboard');
    if (!dash) throw new Error('No hay dashboard activo');

    // Ocultar sidebar temporalmente
    const sidebar = dash.querySelector('.dash-sidebar');
    if (sidebar) sidebar.style.display = 'none';

    const empresa = _empresa || 'Señales';
    const filename = empresa.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, '_') + '_Senales_CirculoAzul.pdf';

    await html2pdf().set({
      margin:       [8, 4, 8, 4],
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.95 },
      html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#05080F', scrollY: 0 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    }).from(dash).save();

    // Restaurar sidebar
    if (sidebar) sidebar.style.display = '';

  } catch(err) {
    console.error('exportarPDFSenales error:', err);
    alert('Error generando PDF: ' + err.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '⬇ PDF'; }
  }
}

// ══════════════════════════════════════════════════════════
// ── HISTORIAL ─────────────────────────────────────────────
// ══════════════════════════════════════════════════════════
function getSenalesHist() {
  try { return JSON.parse(localStorage.getItem(SENALES_HIST_KEY) || '[]'); }
  catch(e) { return []; }
}

function saveSenalesAnalisis() {
  if (!_datosGlobales) { alert('Primero generá un análisis.'); return; }
  const hist = getSenalesHist();
  const pct = _datosGlobales.resumen ? _datosGlobales.resumen.pct || 0 : 0;
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    empresa: _empresa || 'Sin nombre',
    ticker: _ticker || '',
    periodo: _periodo || '',
    fecha: new Date().toISOString(),
    raw: _rawTextSenales,
    pct: Math.round(pct)
  };
  hist.unshift(entry);
  localStorage.setItem(SENALES_HIST_KEY, JSON.stringify(hist.slice(0, 50)));
  showSenalesToast('💾 Análisis guardado');
}

function openSenalesHist() {
  renderSenalesHistList();
  document.getElementById('senales-hist-overlay').style.display = 'block';
  requestAnimationFrame(() => { document.getElementById('senales-hist-panel').style.right = '0'; });
}

function closeSenalesHist() {
  document.getElementById('senales-hist-panel').style.right = '-440px';
  setTimeout(() => { document.getElementById('senales-hist-overlay').style.display = 'none'; }, 320);
}

function renderSenalesHistList() {
  const list = document.getElementById('senales-hist-list');
  const hist = getSenalesHist();
  if (!hist.length) {
    list.innerHTML = '<div style="color:#3d5a7a;text-align:center;padding:3rem 1rem;font-size:.83rem;line-height:1.6">No hay análisis guardados todavía.<br><br>Generá un análisis y usá<br>💾 <strong style="color:#5A9BFF">Guardar</strong> para conservarlo aquí.</div>';
    return;
  }
  list.innerHTML = hist.map((e, i) => {
    const fecha = new Date(e.fecha);
    const fechaStr = fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
    const hora = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const color = e.pct >= 70 ? '#4CAF50' : e.pct >= 40 ? '#f59e0b' : '#ef5350';
    return `
    <div style="background:rgba(13,22,39,.6);border:1px solid rgba(26,86,196,.2);border-radius:8px;margin-bottom:.6rem;overflow:hidden">
      <div style="padding:.75rem 1rem;display:flex;align-items:flex-start;gap:.75rem">
        <div style="width:8px;height:8px;border-radius:50%;background:${color};margin-top:.35rem;flex-shrink:0"></div>
        <div style="flex:1;min-width:0">
          <div style="font-size:.88rem;font-weight:600;color:#D8E6F5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e.empresa}${e.ticker ? ' ('+e.ticker+')' : ''}</div>
          <div style="font-size:.68rem;color:#3d5a7a;margin-top:.1rem">${fechaStr} · ${hora}${e.periodo ? ' · ' + e.periodo : ''}</div>
          <div style="font-size:.7rem;margin-top:.3rem"><span style="color:${color};font-weight:600">Señales ${e.pct}%</span></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:.3rem;flex-shrink:0">
          ${e.raw ? `<button onclick="loadSenalesHistEntry(${i})" style="background:#1A56C4;color:#fff;border:none;padding:.28rem .75rem;border-radius:5px;cursor:pointer;font-size:.7rem;font-weight:600">↩ Cargar</button>` : '<span style="font-size:.65rem;color:#3d5a7a">Sin texto</span>'}
          <button onclick="deleteSenalesHistEntry(${i})" style="background:rgba(239,83,80,.12);color:#ef5350;border:1px solid rgba(239,83,80,.2);padding:.28rem .75rem;border-radius:5px;cursor:pointer;font-size:.7rem">🗑 Borrar</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function loadSenalesHistEntry(index) {
  const entry = getSenalesHist()[index];
  if (!entry || !entry.raw) { alert('Este análisis no tiene datos de texto recuperables.'); return; }
  closeSenalesHist();
  document.getElementById('inp-empresa').value = entry.empresa;
  document.getElementById('inp-ticker').value  = entry.ticker || '';
  document.getElementById('inp-periodo').value = entry.periodo || '';
  document.getElementById('txt-paste').value   = entry.raw;
  switchTab('pegar');
  showScreen('upload');
  setTimeout(iniciarAnalisis, 100);
}

function deleteSenalesHistEntry(index) {
  if (!confirm('¿Borrar este análisis del historial?')) return;
  const hist = getSenalesHist();
  hist.splice(index, 1);
  localStorage.setItem(SENALES_HIST_KEY, JSON.stringify(hist));
  renderSenalesHistList();
}

function shareSenalesAnalisis() {
  if (!_rawTextSenales) { alert('Solo análisis ingresados como texto pueden compartirse por link.'); return; }
  try {
    const encoded = btoa(unescape(encodeURIComponent(_rawTextSenales)));
    const params = new URLSearchParams({ d: encoded });
    if (_empresa) params.set('emp', _empresa);
    if (_ticker)  params.set('tkr', _ticker);
    if (_periodo) params.set('per', _periodo);
    const url = window.location.origin + '/senales/?' + params.toString();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => showSenalesToast('🔗 Link copiado al portapapeles')).catch(() => _senalesFallbackCopy(url));
    } else { _senalesFallbackCopy(url); }
  } catch(e) { alert('Error al generar el link: ' + e.message); }
}

function _senalesFallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  try { document.execCommand('copy'); showSenalesToast('🔗 Link copiado al portapapeles'); }
  catch(e) { alert('Copiá el link manualmente:\n' + text); }
  document.body.removeChild(ta);
}

function showSenalesToast(msg) {
  const t = document.getElementById('senales-toast');
  if (!t) return;
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(8px)'; }, 2800);
}

// ── Auto-load desde URL (share link) ──────────────────────
(function checkSenalesShareLink() {
  try {
    const params = new URLSearchParams(window.location.search);
    const d = params.get('d');
    if (!d) return;
    const text = decodeURIComponent(escape(atob(d)));
    document.getElementById('txt-paste').value   = text;
    document.getElementById('inp-empresa').value = params.get('emp') || '';
    document.getElementById('inp-ticker').value  = params.get('tkr') || '';
    document.getElementById('inp-periodo').value = params.get('per') || '';
    setTimeout(iniciarAnalisis, 400);
  } catch(e) {}
})();
