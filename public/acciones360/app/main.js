// ── main.js — Controlador principal Acciones 360 ──────────────────────────────
// Globals
let _a360Data     = null;  // raw parsed data
let _a360Results  = null;  // 43 indicator results
let _a360Summary  = null;  // fortalezas / alertas / score
let _a360Empresa  = '';
let _a360Ticker   = '';
let _a360RawText  = '';
let _a360PdfFile  = null;  // PDF file reference for preview flow

// Expose for export.js
window._a360Empresa = '';
window._a360Results = null;
window._a360Summary = null;

// ═══════════════════════════════════════════════════════════════════════════════
// FILE / DRAG-DROP / PASTE HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════
document.getElementById('file-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) await handleFile(file);
  e.target.value = '';
});

const dropZone = document.getElementById('drop-zone');
dropZone.addEventListener('dragover',  (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', ()  => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', async (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) await handleFile(file);
});

async function handleFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  // PDF gets its own preview flow
  if (ext === 'pdf') {
    await showPdfPreview(file);
    return;
  }

  showScreen('loading');
  setStep(1, 'active');
  setProgress(10, 'Leyendo archivo...');

  try {
    let data;
    if (ext === 'docx') {
      data = await Reader.parseDocx(file);
    } else if (ext === 'xlsx' || ext === 'xls') {
      data = await Reader.parseXlsx(file);
    } else if (ext === 'csv') {
      const text = await file.text();
      data = Reader.parseCsv(text, file.name);
    } else {
      alert('Formato no soportado. Usá .docx, .xlsx, .csv o .pdf');
      showScreen('upload');
      return;
    }
    _a360Data    = data;
    _a360RawText = '';
    showConfirm(data.empresa || file.name.replace(/\.[^.]+$/, ''), data.ticker || '');
  } catch(err) {
    console.error('Error leyendo archivo:', err);
    alert('Error al leer el archivo: ' + err.message);
    showScreen('upload');
  }
}

function runManualA360() {
  const raw = (document.getElementById('paste-area').value || '').trim();
  if (!raw) { alert('Pegá los datos financieros en el campo de texto.'); return; }
  _a360RawText = raw;
  _a360Data = Reader.parseText(raw);
  showConfirm(_a360Data.empresa || 'Empresa', _a360Data.ticker || '');
}

// ═══════════════════════════════════════════════════════════════════════════════
// VER PDF — abre el dashboard en ventana nueva para imprimir/guardar como PDF
// ═══════════════════════════════════════════════════════════════════════════════
function verA360PDF() {
  var dashContent = document.getElementById('screen-dashboard');
  if (!dashContent) { alert('No hay dashboard activo para previsualizar.'); return; }

  var companyName = _a360Empresa || 'Acciones 360';
  var reportDate  = new Date().toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' });

  // Convertir canvas → imágenes estáticas en el clon
  var clone = dashContent.cloneNode(true);
  clone.style.display = 'block';
  var canvases      = dashContent.querySelectorAll('canvas');
  var cloneCanvases = clone.querySelectorAll('canvas');
  canvases.forEach(function(cv, i) {
    try {
      var img = document.createElement('img');
      img.src = cv.toDataURL('image/png');
      img.style.width = '100%';
      img.style.height = 'auto';
      img.style.display = 'block';
      if (cloneCanvases[i] && cloneCanvases[i].parentNode) {
        cloneCanvases[i].parentNode.replaceChild(img, cloneCanvases[i]);
      }
    } catch(e) {}
  });

  // Traer el CSS actual de la página
  var cssLinks = '';
  document.querySelectorAll('link[rel="stylesheet"]').forEach(function(lnk) {
    cssLinks += '<link rel="stylesheet" href="' + lnk.href + '">';
  });
  var cssStyles = '';
  document.querySelectorAll('style').forEach(function(s) {
    cssStyles += '<style>' + s.innerHTML + '</style>';
  });

  var previewHTML = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">' +
    '<title>Vista Previa — ' + companyName + '</title>' +
    cssLinks + cssStyles +
    '<style>' +
    'body{background:#05080F;color:#8FA8C8;font-family:Inter,sans-serif;margin:0;padding:0}' +
    '.app-header,.topbar-actions,.dash-sidebar,.no-print,.slide-panel,.panel-overlay,#err-banner{display:none!important}' +
    '.dash-layout{display:block!important;padding-top:0!important;min-height:0!important}' +
    '.dash-main{margin-left:0!important;max-width:100%!important;padding:1.5rem 2rem 2rem!important}' +
    '.preview-toolbar{position:fixed;top:0;left:0;right:0;background:#080E1A;border-bottom:1px solid rgba(26,86,196,.3);' +
    'display:flex;align-items:center;justify-content:space-between;padding:10px 24px;z-index:9999}' +
    '.preview-toolbar h3{color:#B8CEEA;margin:0;font-size:14px;font-weight:500}' +
    '.preview-toolbar .btns{display:flex;gap:10px}' +
    '.pbtn{padding:8px 18px;border-radius:6px;border:none;font-size:13px;font-weight:600;cursor:pointer}' +
    '.pbtn-gold{background:#1A56C4;color:#fff}.pbtn-gold:hover{background:#2E74E8}' +
    '.pbtn-out{background:transparent;color:#B8CEEA;border:1px solid rgba(26,86,196,.4)}.pbtn-out:hover{background:#0d1627}' +
    '.preview-content{margin-top:56px;padding:1.5rem 2rem 2rem}' +
    '@media print{' +
    '.preview-toolbar{display:none!important}.preview-content{margin-top:0;padding:0}' +
    'body{-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    '.section-block{break-inside:avoid;page-break-inside:avoid}' +
    '.kpi-card,.indicator-card,.score-card,.resumen-box{break-inside:avoid}' +
    '}' +
    '</style></head><body>' +
    '<div class="preview-toolbar">' +
    '  <h3>📄 Vista Previa — ' + companyName + ' · ' + reportDate + '</h3>' +
    '  <div class="btns">' +
    '    <button class="pbtn pbtn-gold" onclick="window.print()">🖨 Imprimir / Guardar como PDF</button>' +
    '    <button class="pbtn pbtn-out" onclick="window.close()">✕ Cerrar</button>' +
    '  </div>' +
    '</div>' +
    '<div class="preview-content">' + clone.innerHTML + '</div>' +
    '</body></html>';

  var win = window.open('', '_blank', 'width=1100,height=850,scrollbars=yes,resizable=yes');
  if (!win) { alert('El navegador bloqueó la ventana emergente. Por favor permití las ventanas emergentes para este sitio.'); return; }
  win.document.open();
  win.document.write(previewHTML);
  win.document.close();
}

// ═══════════════════════════════════════════════════════════════════════════════
// PDF VIEWER
// ═══════════════════════════════════════════════════════════════════════════════
async function showPdfPreview(file) {
  _a360PdfFile = file;
  showScreen('pdf');

  const nameEl   = document.getElementById('pdf-preview-name');
  const pagesEl  = document.getElementById('pdf-pages-wrap');
  const pagesLbl = document.getElementById('pdf-preview-pages');
  const analyzeBtn = document.getElementById('btn-pdf-analyze');
  const loadingEl = document.getElementById('pdf-loading-indicator');

  if (nameEl)    nameEl.textContent = file.name;
  if (pagesLbl)  pagesLbl.textContent = '';
  if (analyzeBtn) analyzeBtn.disabled = true;
  // Clear old pages but keep spinner
  const oldPages = pagesEl ? pagesEl.querySelectorAll('.pdf-page-wrap') : [];
  oldPages.forEach(el => el.remove());
  if (loadingEl) loadingEl.style.display = 'flex';

  if (typeof pdfjsLib === 'undefined') {
    if (loadingEl) loadingEl.querySelector('.pdf-loading-text').textContent = 'PDF.js no disponible — el análisis se ejecutará directamente.';
    if (analyzeBtn) analyzeBtn.disabled = false;
    return;
  }

  try {
    const ab  = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(ab) }).promise;
    const totalPages = pdf.numPages;
    if (pagesLbl) pagesLbl.textContent = `${totalPages} página${totalPages !== 1 ? 's' : ''}`;

    for (let i = 1; i <= totalPages; i++) {
      const page     = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });

      const wrap = document.createElement('div');
      wrap.className = 'pdf-page-wrap';

      const num = document.createElement('div');
      num.className = 'pdf-page-num';
      num.textContent = `Página ${i} de ${totalPages}`;

      const canvas = document.createElement('canvas');
      canvas.className = 'pdf-page-canvas';
      canvas.width  = viewport.width;
      canvas.height = viewport.height;

      wrap.appendChild(num);
      wrap.appendChild(canvas);
      if (pagesEl) {
        if (loadingEl) pagesEl.insertBefore(wrap, loadingEl);
        else pagesEl.appendChild(wrap);
      }

      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    }
  } catch (err) {
    console.error('PDF render error:', err);
    if (loadingEl) loadingEl.querySelector('.pdf-loading-text').textContent = 'No se pudo renderizar el PDF: ' + err.message;
  } finally {
    if (loadingEl) loadingEl.style.display = 'none';
    if (analyzeBtn) analyzeBtn.disabled = false;
  }
}

function cancelPdfPreview() {
  _a360PdfFile = null;
  showScreen('upload');
}

async function analyzePdf() {
  if (!_a360PdfFile) return;
  const file = _a360PdfFile;
  showScreen('loading');
  setStep(1, 'active');
  setProgress(10, 'Leyendo PDF...');
  try {
    const data = await Reader.parsePdf(file);
    _a360Data    = data;
    _a360RawText = '';
    showConfirm(data.empresa || file.name.replace(/\.pdf$/i, ''), data.ticker || '');
  } catch (err) {
    console.error('Error analizando PDF:', err);
    const b = document.getElementById('err-banner');
    if (b) { b.style.display = 'block'; b.textContent = '⚠ Error al leer PDF: ' + err.message; }
    showScreen('upload');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIRM SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function showConfirm(empresa, ticker) {
  _a360Empresa = empresa;
  _a360Ticker  = ticker;
  document.getElementById('confirm-name').textContent = empresa;
  const meta = [ticker ? `Ticker: ${ticker}` : null].filter(Boolean).join(' · ');
  document.getElementById('confirm-meta').textContent = meta || ' ';
  showScreen('confirm');
}

function confirmAndRun() {
  showScreen('loading');
  runAnalysis();
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING + ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════
function runAnalysis() {
  const steps = [
    { id: 'step-1', pct: 25, msg: 'Leyendo datos financieros...' },
    { id: 'step-2', pct: 55, msg: 'Calculando 43 indicadores...' },
    { id: 'step-3', pct: 80, msg: 'Generando 9 gráficas...' },
    { id: 'step-4', pct: 95, msg: 'Construyendo reporte...' },
  ];
  let stepIdx = 0;

  const tick = () => {
    if (stepIdx >= steps.length) {
      finishAnalysis();
      return;
    }
    const s = steps[stepIdx];
    setStep(stepIdx + 1, 'active');
    if (stepIdx > 0) setStep(stepIdx, 'done');
    setProgress(s.pct, s.msg);
    stepIdx++;
    setTimeout(tick, 520);
  };
  tick();
}

function finishAnalysis() {
  try {
    _a360Results = IndicatorEngine.calcAll(_a360Data);
    _a360Summary = IndicatorEngine.getSummary(_a360Results);

    // expose via window for export.js
    window._a360Empresa = _a360Empresa;
    window._a360Results = _a360Results;
    window._a360Summary = _a360Summary;

    setStep(4, 'done');
    setProgress(100, '¡Análisis completo!');

    setTimeout(() => {
      showScreen('dashboard');
      Dashboard.render(_a360Data, _a360Results, _a360Summary, _a360Empresa, _a360Ticker);
      // Render all charts after DOM is painted
      setTimeout(() => Charts360.renderAll(_a360Data, _a360Results, _a360Empresa), 200);
      applyA360HiddenSections();
    }, 400);
  } catch(err) {
    console.error('Error en análisis:', err);
    const b = document.getElementById('err-banner');
    if (b) { b.style.display = 'block'; b.textContent = '⚠ Error al analizar: ' + err.message + ' — Revisá la consola (F12) para más detalle.'; }
    showScreen('upload');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN SWITCHER
// ═══════════════════════════════════════════════════════════════════════════════
function showScreen(name) {
  ['upload', 'confirm', 'loading', 'pdf', 'dashboard'].forEach(s => {
    const el = document.getElementById('screen-' + s);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById('screen-' + name);
  if (target) target.style.display = (name === 'dashboard') ? 'block' : 'flex';

  const actions = document.getElementById('topbar-actions');
  const hdrEmpresa = document.getElementById('header-empresa');
  const hdrDiv2    = document.getElementById('hdr-div2');
  const btnVerPdf  = document.getElementById('btn-ver-pdf');
  if (name === 'dashboard') {
    if (actions) actions.style.display = 'flex';
    if (hdrEmpresa) { hdrEmpresa.textContent = _a360Empresa; hdrEmpresa.style.display = 'inline'; }
    if (hdrDiv2)    hdrDiv2.style.display = 'block';
  } else {
    if (actions) actions.style.display = 'none';
    if (hdrEmpresa) hdrEmpresa.style.display = 'none';
    if (hdrDiv2)    hdrDiv2.style.display = 'none';
  }
}

function resetA360() {
  Charts360.destroyAll();
  _a360Data = null; _a360Results = null; _a360Summary = null;
  _a360Empresa = ''; _a360Ticker = ''; _a360RawText = '';
  window._a360Empresa = ''; window._a360Results = null; window._a360Summary = null;
  showScreen('upload');
}

// ── Helpers loading screen ──────────────────────────────────────────────────
function setProgress(pct, msg) {
  const bar = document.getElementById('loading-bar');
  const msgEl = document.getElementById('loading-msg');
  if (bar)   bar.style.width = pct + '%';
  if (msgEl) msgEl.textContent = msg || '';
}
function setStep(num, state) {
  const el = document.getElementById('step-' + num);
  if (!el) return;
  el.classList.remove('done', 'active');
  if (state) el.classList.add(state);
}

// ── Sidebar nav ─────────────────────────────────────────────────────────────
function activateNav(id) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

// ═══════════════════════════════════════════════════════════════════════════════
// HISTORIAL
// ═══════════════════════════════════════════════════════════════════════════════
const A360_HIST_KEY = 'a360_historial';

function getA360Hist() {
  try { return JSON.parse(localStorage.getItem(A360_HIST_KEY) || '[]'); }
  catch(e) { return []; }
}

function saveA360Analisis() {
  if (!_a360Results) { alert('Primero generá un análisis.'); return; }
  const hist = getA360Hist();
  const entry = {
    id:       Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    empresa:  _a360Empresa || 'Sin nombre',
    ticker:   _a360Ticker  || '',
    fecha:    new Date().toISOString(),
    raw:      _a360RawText || '',
    score:    _a360Summary?.scoreNum || 0,
    counts:   _a360Summary?.counts   || {},
  };
  hist.unshift(entry);
  localStorage.setItem(A360_HIST_KEY, JSON.stringify(hist.slice(0, 50)));
  showA360Toast('💾 Análisis guardado');
}

function openA360Hist() {
  renderA360HistList();
  document.getElementById('a360-hist-overlay').style.display = 'block';
  requestAnimationFrame(() => {
    document.getElementById('a360-hist-panel').style.right = '0';
  });
}
function closeA360Hist() {
  document.getElementById('a360-hist-panel').style.right = '-460px';
  setTimeout(() => { document.getElementById('a360-hist-overlay').style.display = 'none'; }, 320);
}

function renderA360HistList() {
  const listEl = document.getElementById('a360-hist-list');
  const hist   = getA360Hist();
  if (!hist.length) {
    listEl.innerHTML = '<div style="color:var(--gray3);text-align:center;padding:3rem 1rem;font-size:.85rem;line-height:1.6">No hay análisis guardados.<br><br>Generá un análisis y hacé clic en<br><strong>💾 Guardar</strong>.</div>';
    return;
  }
  listEl.innerHTML = hist.map((e, i) => {
    const fecha  = new Date(e.fecha);
    const fStr   = fecha.toLocaleDateString('es-AR', { day:'2-digit', month:'short', year:'numeric' });
    const hora   = fecha.toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' });
    const sc     = e.score || 0;
    const dotClr = sc >= 65 ? 'var(--green)' : sc >= 40 ? 'var(--orange)' : 'var(--red)';
    return `
    <div class="hist-entry">
      <div class="hist-dot" style="background:${dotClr}"></div>
      <div class="hist-info">
        <div class="hist-empresa">${e.empresa} ${e.ticker ? '('+e.ticker+')' : ''}</div>
        <div class="hist-date">${fStr} · ${hora}</div>
        <div class="hist-meta">Salud: ${sc}%  ·  ✅${e.counts?.green||0} 🔵${e.counts?.teal||0} 🟠${e.counts?.orange||0} 🔴${e.counts?.red||0}</div>
      </div>
      <div class="hist-btns">
        <button class="hist-btn load" onclick="loadA360HistEntry(${i})">↩ Cargar</button>
        <button class="hist-btn del"  onclick="deleteA360HistEntry(${i})">🗑 Borrar</button>
      </div>
    </div>`;
  }).join('');
}

function loadA360HistEntry(index) {
  const hist  = getA360Hist();
  const entry = hist[index];
  if (!entry || !entry.raw) {
    alert('Este análisis fue cargado desde archivo y no tiene datos de texto recuperables.');
    return;
  }
  closeA360Hist();
  document.getElementById('paste-area').value = entry.raw;
  _a360RawText = entry.raw;
  showScreen('upload');
  setTimeout(runManualA360, 100);
}

function deleteA360HistEntry(index) {
  if (!confirm('¿Borrar este análisis del historial?')) return;
  const hist = getA360Hist();
  hist.splice(index, 1);
  localStorage.setItem(A360_HIST_KEY, JSON.stringify(hist));
  renderA360HistList();
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPARTIR
// ═══════════════════════════════════════════════════════════════════════════════
function shareA360Analisis() {
  if (!_a360RawText) {
    alert('Este análisis fue cargado desde archivo.\nSolo se pueden compartir via link los análisis ingresados como texto.');
    return;
  }
  try {
    const encoded = btoa(unescape(encodeURIComponent(_a360RawText)));
    const url     = window.location.origin + '/acciones360/?d=' + encoded;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => showA360Toast('🔗 Link copiado al portapapeles'))
        .catch(() => _a360FallbackCopy(url));
    } else {
      _a360FallbackCopy(url);
    }
  } catch(e) {
    alert('Error generando link: ' + e.message);
  }
}

function _a360FallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:-9999px;opacity:0';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  try { document.execCommand('copy'); showA360Toast('🔗 Link copiado'); }
  catch(e) { alert('Copiá el link manualmente:\n' + text); }
  document.body.removeChild(ta);
}

function showA360Toast(msg) {
  const t = document.getElementById('a360-share-toast');
  if (!t) return;
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(2rem)';
  }, 2800);
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPARAR EMPRESAS
// ═══════════════════════════════════════════════════════════════════════════════
let _compareDataB  = null;
let _compareResB   = null;
let _compareSumB   = null;
let _compareEmpresaB = '';

function openComparePanel() {
  const el = document.getElementById('compare-empresa-a');
  if (el) el.textContent = _a360Empresa || 'Empresa A';
  document.getElementById('compare-error').style.display = 'none';
  document.getElementById('compare-overlay').style.display = 'block';
  requestAnimationFrame(() => {
    document.getElementById('compare-panel').style.right = '0';
  });
}

function closeComparePanel() {
  document.getElementById('compare-panel').style.right = '-440px';
  setTimeout(() => { document.getElementById('compare-overlay').style.display = 'none'; }, 320);
}

function runCompare() {
  const raw = (document.getElementById('compare-paste-b').value || '').trim();
  const errEl = document.getElementById('compare-error');
  if (!raw) {
    errEl.style.display = 'block';
    errEl.textContent = 'Pegá los datos de la segunda empresa antes de comparar.';
    return;
  }
  errEl.style.display = 'none';

  try {
    _compareDataB    = Reader.parseText(raw);
    _compareResB     = IndicatorEngine.calcAll(_compareDataB);
    _compareSumB     = IndicatorEngine.getSummary(_compareResB);
    _compareEmpresaB = _compareDataB.empresa || 'Empresa B';
    closeComparePanel();
    renderCompareSection();
  } catch(e) {
    errEl.style.display = 'block';
    errEl.textContent = 'Error al procesar los datos: ' + e.message;
  }
}

function closeCompare() {
  _compareDataB = null; _compareResB = null; _compareSumB = null; _compareEmpresaB = '';
  const sec = document.getElementById('sec-compare');
  if (sec) sec.style.display = 'none';
}

function renderCompareSection() {
  if (!_a360Results || !_compareResB) return;

  const CC = {
    green:  { border: '#27AE60', bg: 'rgba(39,174,96,.12)',  text: '#4ADE80' },
    teal:   { border: '#1A9BAA', bg: 'rgba(26,155,170,.12)', text: '#2DD4E8' },
    orange: { border: '#E67E22', bg: 'rgba(230,126,34,.12)', text: '#FB923C' },
    red:    { border: '#C0392B', bg: 'rgba(192,57,43,.12)',  text: '#F87171' },
    gray:   { border: '#4A5568', bg: 'rgba(74,85,104,.10)',  text: '#94A3B8' },
  };
  const scoreColor = s => s >= 70 ? '#4ADE80' : s >= 45 ? '#FB923C' : '#F87171';
  const cw = { green: 3, teal: 2, orange: 1, red: 0, gray: -1 };

  const scA = _a360Summary.scoreNum;
  const scB = _compareSumB.scoreNum;

  const SECTION_ORDER = [
    { key: 'I — Rentabilidad',      test: n => +n >= 1  && +n <= 5  },
    { key: 'II — Retornos Capital', test: n => +n >= 6  && +n <= 10 },
    { key: 'III — Flujo de Caja',   test: n => +n >= 11 && +n <= 15 },
    { key: 'IV — Deuda y Liquidez', test: n => +n >= 16 && +n <= 20 },
    { key: 'V — Valoración',        test: n => +n >= 21 && +n <= 27 },
    { key: 'VI — Crecimiento',      test: n => +n >= 28 && +n <= 30 },
    { key: 'VII — Contexto',        test: n => +n >= 31 && +n <= 35 },
    { key: 'XX — Comparativa',      test: n => String(n) === 'XX'   },
    { key: 'A–E — Scoring',         test: n => ['A','B','C','D','E'].includes(String(n)) },
    { key: 'CF — Calidad FCF',      test: n => String(n).startsWith('CF')  },
    { key: 'FWD — Forward',         test: n => String(n).startsWith('FWD') },
  ];

  const groups = {};
  SECTION_ORDER.forEach(s => { groups[s.key] = []; });
  for (let i = 0; i < _a360Results.length; i++) {
    const rA = _a360Results[i], rB = _compareResB[i];
    const sec = SECTION_ORDER.find(s => s.test(rA.num));
    if (sec) groups[sec.key].push({ rA, rB });
  }

  // ── Scores header ─────────────────────────────────────────────────────────
  const hdr = document.getElementById('compare-header-cards');
  if (hdr) {
    const pills = (counts) => ['green','teal','orange','red'].map(c =>
      `<span style="font-size:.65rem;padding:.12rem .4rem;border-radius:4px;background:${CC[c].bg};color:${CC[c].text};border:1px solid ${CC[c].border}40">
        ${c==='green'?'✅':c==='teal'?'🔵':c==='orange'?'🟠':'🔴'} ${counts[c]||0}
      </span>`).join('');
    const colCard = (emp, sum, sc, isWinner) => `
      <div style="background:rgba(15,25,50,.6);border:2px solid ${isWinner?'var(--gold)':'var(--border)'};border-radius:14px;padding:1.2rem;text-align:center">
        ${isWinner?'<div style="font-size:.6rem;color:var(--gold);font-weight:700;letter-spacing:.1em;margin-bottom:.4rem">🏆 GANADOR</div>':''}
        <div style="font-size:1.1rem;font-weight:800;color:var(--text1);margin-bottom:.5rem">${emp}</div>
        <div style="font-size:2.6rem;font-weight:900;color:${scoreColor(sc)};line-height:1">${sc}%</div>
        <div style="font-size:.65rem;color:var(--gray3);margin:.3rem 0 .7rem">Salud Financiera</div>
        <div style="display:flex;gap:.25rem;justify-content:center;flex-wrap:wrap;margin-bottom:.6rem">${pills(sum.counts)}</div>
        <div style="font-size:.68rem;color:var(--gray3)">
          <span style="color:#4ADE80">▲ ${sum.fortalezas.length} fortalezas</span>
          &nbsp;·&nbsp;
          <span style="color:#F87171">▼ ${sum.alertas.length} alertas</span>
        </div>
        <div style="margin-top:.8rem;border-top:1px solid var(--border);padding-top:.7rem">
          <div style="font-size:.65rem;color:var(--gray3);font-weight:700;margin-bottom:.4rem;text-transform:uppercase;letter-spacing:.07em">Principales fortalezas</div>
          ${sum.fortalezas.slice(0,3).map(f=>`<div style="font-size:.62rem;color:#4ADE80;margin:.15rem 0">✓ ${f.nombre}</div>`).join('')}
        </div>
        ${sum.alertas.length?`
        <div style="margin-top:.6rem;border-top:1px solid var(--border);padding-top:.6rem">
          <div style="font-size:.65rem;color:var(--gray3);font-weight:700;margin-bottom:.4rem;text-transform:uppercase;letter-spacing:.07em">Principales alertas</div>
          ${sum.alertas.slice(0,3).map(a=>`<div style="font-size:.62rem;color:#F87171;margin:.15rem 0">⚠ ${a.nombre}</div>`).join('')}
        </div>`:''}
      </div>`;
    hdr.innerHTML = colCard(_a360Empresa, _a360Summary, scA, scA >= scB)
                  + colCard(_compareEmpresaB, _compareSumB, scB, scB > scA);
  }

  // ── Reporte completo lado a lado ──────────────────────────────────────────
  const tableWrap = document.getElementById('compare-table-wrap');
  if (!tableWrap) return;

  // helper: card para un indicador
  const indCard = (r, isWinner) => {
    const cc = CC[r.rango.color] || CC.gray;
    const winBadge = isWinner ? `<span style="font-size:.58rem;background:var(--gold);color:#0a0a0a;border-radius:3px;padding:.1rem .35rem;font-weight:800;margin-left:.3rem">▲ MEJOR</span>` : '';
    return `
      <div style="background:rgba(255,255,255,.03);border:1px solid ${isWinner ? cc.border+'80' : 'var(--border)'};border-radius:8px;padding:.75rem;height:100%;box-sizing:border-box">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:.4rem">
          <div style="font-size:.63rem;color:var(--gray3);font-weight:700">${r.num}</div>
          ${winBadge}
        </div>
        <div style="font-size:.73rem;color:var(--text1);font-weight:700;margin-bottom:.25rem;line-height:1.3">${r.nombre}</div>
        <div style="font-size:.58rem;color:var(--gray3);margin-bottom:.6rem;font-style:italic">${r.formula}</div>
        <div style="font-size:1.4rem;font-weight:900;color:${cc.text};margin-bottom:.3rem;line-height:1">${r.valorFmt}</div>
        <div style="display:inline-block;background:${cc.bg};color:${cc.text};border:1px solid ${cc.border}60;border-radius:5px;padding:.15rem .5rem;font-size:.65rem;font-weight:800;margin-bottom:.4rem">${r.rango.badge}</div>
        <div style="font-size:.62rem;color:var(--gray3);line-height:1.5">${r.rango.texto}</div>
      </div>`;
  };

  let winA_total = 0, winB_total = 0;
  let html = '';

  for (const { key } of SECTION_ORDER) {
    const rows = groups[key];
    if (!rows || !rows.length) continue;

    let sectionWinA = 0, sectionWinB = 0;
    // Count section winner first
    for (const { rA, rB } of rows) {
      const wA = cw[rA.rango.color] ?? -1;
      const wB = cw[rB.rango.color] ?? -1;
      if (wA > wB) { sectionWinA++; winA_total++; }
      else if (wB > wA) { sectionWinB++; winB_total++; }
    }

    const secWinnerLabel = sectionWinA > sectionWinB
      ? `<span style="color:#4ADE80;font-size:.65rem;font-weight:700">▲ ${_a360Empresa}</span>`
      : sectionWinB > sectionWinA
      ? `<span style="color:#4ADE80;font-size:.65rem;font-weight:700">▲ ${_compareEmpresaB}</span>`
      : `<span style="color:var(--gray3);font-size:.65rem">= Empate</span>`;

    // Column headers (first section only, repeated for clarity)
    let rowsHtml = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem;margin-bottom:.35rem">
        <div style="font-size:.62rem;font-weight:700;color:#5A9BFF;text-align:center;padding:.2rem;border-bottom:1px solid rgba(90,155,255,.3)">${_a360Empresa}</div>
        <div style="font-size:.62rem;font-weight:700;color:#5A9BFF;text-align:center;padding:.2rem;border-bottom:1px solid rgba(90,155,255,.3)">${_compareEmpresaB}</div>
      </div>`;

    for (const { rA, rB } of rows) {
      const wA = cw[rA.rango.color] ?? -1;
      const wB = cw[rB.rango.color] ?? -1;
      const aWins = wA > wB, bWins = wB > wA;
      rowsHtml += `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem;margin-bottom:.55rem;align-items:start">
          ${indCard(rA, aWins)}
          ${indCard(rB, bWins)}
        </div>`;
    }

    html += `
      <div style="margin-bottom:1.8rem;border:1px solid var(--border);border-radius:12px;overflow:hidden">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:.65rem 1rem;background:rgba(90,155,255,.06);border-bottom:1px solid var(--border)">
          <div style="font-size:.78rem;font-weight:800;color:var(--gold);text-transform:uppercase;letter-spacing:.07em">${key}</div>
          ${secWinnerLabel}
        </div>
        <div style="padding:.75rem">${rowsHtml}</div>
      </div>`;
  }

  // ── Marcador global ───────────────────────────────────────────────────────
  const scoreboardHtml = `
    <div style="background:rgba(26,86,196,.1);border:1px solid rgba(90,155,255,.3);border-radius:12px;padding:1rem 1.5rem;margin-bottom:1.8rem;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:.5rem;text-align:center">
      <div>
        <div style="font-size:2.2rem;font-weight:900;color:${winA_total>winB_total?'#4ADE80':'var(--text2)'}">${winA_total}</div>
        <div style="font-size:.7rem;color:var(--gray3);margin-top:.2rem">${_a360Empresa}</div>
        ${winA_total>winB_total?'<div style="font-size:.65rem;color:var(--gold);margin-top:.3rem">🏆 Gana en indicadores</div>':''}
      </div>
      <div style="font-size:.72rem;color:var(--gray3);font-weight:700;white-space:nowrap">INDICADORES<br>GANADOS</div>
      <div>
        <div style="font-size:2.2rem;font-weight:900;color:${winB_total>winA_total?'#4ADE80':'var(--text2)'}">${winB_total}</div>
        <div style="font-size:.7rem;color:var(--gray3);margin-top:.2rem">${_compareEmpresaB}</div>
        ${winB_total>winA_total?'<div style="font-size:.65rem;color:var(--gold);margin-top:.3rem">🏆 Gana en indicadores</div>':''}
      </div>
    </div>`;

  tableWrap.innerHTML = scoreboardHtml + (html || '<p style="color:var(--gray3);font-size:.83rem">Sin datos suficientes para comparar.</p>');

  // ── Análisis IA ───────────────────────────────────────────────────────────
  const iaWrap = document.getElementById('compare-ia-wrap');
  if (iaWrap) {
    iaWrap.style.display = 'block';
    iaWrap.innerHTML = `
      <div style="font-size:.75rem;font-weight:700;color:var(--gold);margin-bottom:.8rem;text-transform:uppercase;letter-spacing:.08em">Análisis Comparativo IA</div>
      <div id="compare-ia-text" style="font-size:.8rem;color:var(--text2);line-height:1.75">
        <div style="display:flex;align-items:center;gap:.6rem;color:var(--gray3)">
          <div style="width:14px;height:14px;border:2px solid rgba(90,155,255,.3);border-top-color:#5A9BFF;border-radius:50%;animation:spin360 .7s linear infinite;flex-shrink:0"></div>
          Generando análisis comparativo...
        </div>
      </div>`;
    _runCompareIA();
  }

  const sec = document.getElementById('sec-compare');
  if (sec) { sec.style.display = 'block'; sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
}

async function _runCompareIA() {
  // Build a text summary of both companies from their results
  const fmt = results => results
    .filter(r => r.rango.color !== 'gray')
    .map(r => `${r.nombre}: ${r.valorFmt} [${r.rango.badge}]`)
    .join('\n');

  const prompt = `Sos un analista financiero de Círculo Azul Finanzas. Comparás DOS empresas basándote EXCLUSIVAMENTE en los datos calculados. NO inventés cifras ni datos externos.

EMPRESA A: ${_a360Empresa}
Salud financiera: ${_a360Summary.scoreNum}%
${fmt(_a360Results)}

EMPRESA B: ${_compareEmpresaB}
Salud financiera: ${_compareSumB.scoreNum}%
${fmt(_compareResB)}

INSTRUCCIONES:
1. Comparar rentabilidad real (márgenes, ROE, ROA, ROIC) con los números dados.
2. Comparar calidad de caja (FCF, CFO, ratios CF) con los números dados.
3. Comparar posición de deuda y liquidez con los números dados.
4. Comparar valoración (PER, EV/EBIT, FCF Yield) con los números dados.
5. Conclusión clara: ¿cuál empresa presenta mejor posición financiera y por qué? Justificar con los indicadores.
6. NO inventar proyecciones ni datos externos. Solo analizar lo que está arriba.
Estructurá con: ## Rentabilidad, ## Calidad de Caja, ## Deuda y Liquidez, ## Valoración, ## Conclusión`;

  try {
    const res = await fetch('/api/analisis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        texto: fmt(_a360Results) + '\n---\n' + fmt(_compareResB),
        empresa: `${_a360Empresa} vs ${_compareEmpresaB}`,
        prompt_extra: prompt
      })
    });
    const data = await res.json();
    const texto = data.analisis || data.result || 'Sin respuesta del modelo.';
    const el = document.getElementById('compare-ia-text');
    if (el) el.innerHTML = texto
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/#{1,3} (.+)/g, '<h4 style="color:var(--gold);margin:.7rem 0 .3rem">$1</h4>');
  } catch(e) {
    const el = document.getElementById('compare-ia-text');
    if (el) el.innerHTML = `<span style="color:#e74c3c">Error al contactar IA: ${e.message}</span>`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECCIONES CONFIG
// ═══════════════════════════════════════════════════════════════════════════════
const A360_SECTIONS = [
  { id: 'sec-resumen',      label: '📋 Resumen Ejecutivo' },
  { id: 'sec-bloque-i',    label: 'I — Rentabilidad (01–05)' },
  { id: 'sec-bloque-ii',   label: 'II — Retornos sobre Capital (06–10)' },
  { id: 'sec-bloque-iii',  label: 'III — Flujo de Caja (11–15)' },
  { id: 'sec-bloque-iv',   label: 'IV — Deuda y Liquidez (16–20)' },
  { id: 'sec-bloque-v',    label: 'V — Valoración (21–27)' },
  { id: 'sec-bloque-vi',   label: 'VI — Crecimiento (28–30)' },
  { id: 'sec-bloque-vii',  label: 'VII — Contexto y Calidad (31–35)' },
  { id: 'sec-bloque-viii', label: 'VIII — Scoring Compuesto' },
  { id: 'sec-bloque-xx',   label: 'XX — Comparativa Sectorial' },
  { id: 'sec-bloque-ae',   label: 'A–E — Scoring y Proyecciones' },
  { id: 'sec-bloque-cf',   label: 'CF — Calidad de Flujo de Caja' },
  { id: 'sec-bloque-fwd',  label: 'FWD — Indicadores Forward' },
  { id: 'sec-final',       label: '★ Resumen Final' },
];
const A360_HIDDEN_KEY = 'a360_hidden_sections';

function getA360HiddenSections() {
  try { return JSON.parse(localStorage.getItem(A360_HIDDEN_KEY) || '[]'); }
  catch(e) { return []; }
}

function applyA360HiddenSections() {
  const hidden = getA360HiddenSections();
  A360_SECTIONS.forEach(s => {
    const el = document.getElementById(s.id);
    if (el) el.style.display = hidden.includes(s.id) ? 'none' : '';
  });
}

function openA360Config() {
  renderA360ConfigPanel();
  document.getElementById('a360-config-overlay').style.display = 'block';
  requestAnimationFrame(() => {
    document.getElementById('a360-config-panel').style.right = '0';
  });
}
function closeA360Config() {
  document.getElementById('a360-config-panel').style.right = '-380px';
  setTimeout(() => { document.getElementById('a360-config-overlay').style.display = 'none'; }, 320);
}

function renderA360ConfigPanel() {
  const hidden = getA360HiddenSections();
  const cont = document.getElementById('a360-config-list');
  cont.innerHTML = `
    <p style="color:var(--gray3);font-size:.78rem;margin-bottom:1rem;line-height:1.5">Seleccioná qué secciones ver en el reporte. Se guarda automáticamente.</p>
    ${A360_SECTIONS.map(s => `
    <label class="config-item">
      <input type="checkbox" ${hidden.includes(s.id) ? '' : 'checked'} onchange="toggleA360Section('${s.id}', this.checked)">
      <span class="config-item-label">${s.label}</span>
    </label>`).join('')}
    <div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--gray2);display:flex;gap:.5rem">
      <button onclick="showAllA360Sections()" style="flex:1;background:var(--gray1);border:1px solid var(--gray2);color:var(--midblue);padding:.4rem;border-radius:6px;cursor:pointer;font-size:.77rem">Mostrar todo</button>
      <button onclick="closeA360Config()" style="flex:1;background:var(--navy);border:none;color:#fff;padding:.4rem;border-radius:6px;cursor:pointer;font-size:.77rem;font-weight:600">Listo ✓</button>
    </div>`;
}

function toggleA360Section(id, visible) {
  let hidden = getA360HiddenSections();
  hidden = visible ? hidden.filter(h => h !== id) : [...new Set([...hidden, id])];
  localStorage.setItem(A360_HIDDEN_KEY, JSON.stringify(hidden));
  const el = document.getElementById(id);
  if (el) el.style.display = visible ? '' : 'none';
}

function showAllA360Sections() {
  localStorage.removeItem(A360_HIDDEN_KEY);
  A360_SECTIONS.forEach(s => { const el = document.getElementById(s.id); if (el) el.style.display = ''; });
  renderA360ConfigPanel();
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE DATA
// ═══════════════════════════════════════════════════════════════════════════════
function loadA360Example() {
  document.getElementById('paste-area').value = `Empresa: Duolingo Inc.
TICKER: DUOL

Ingresos  $964.3M
Utilidad Bruta  $743.2M
Margen beneficio bruto  77.1%
EBIT  $111.6M
Margen EBIT  11.6%
EBITDA  $125.9M
Margen EBITDA  13.1%
Ganancias Netas  $183.0M
Margen de flujo de caja libre apalancado  36.8%
Margen de flujo de caja libre sin apalancamiento  18.3%

ROE  36.2%
ROA  7.8%
ROIC  8.6%
WACC  9.3%

FCF  $354.6M
FCF Yield  4.3%
Gastos de Capital  $9.7M
Margen de gastos de capital  1.0%
Efectivo de las operaciones  $380.1M

Deuda Total  $97.3M
Net Debt  -$1,024M
Deuda / Patrimonio  7.4%
Deuda Neta / EBITDA  -7.5x
ICR  N/A
Ratio de Solvencia  2.8x
Prueba Ácida  2.1x

Valor de la Empresa  $3,873M
EV/EBIT  34.7x
EV/FCF  23.8x
PER  12.9x
PER Forward  58.3x
PEG Ratio  1.2x

Crecimiento básico del BPA  48.3%
Previsiones de BPA  $2.95
Previsión de Ingresos  $1,100M

Fórmula Altman Z-Score  4.1
Puntuación Piotroski  7
Acc. en circulación  50.1M`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// URL LOADER — links compartidos (?d=...)
// ═══════════════════════════════════════════════════════════════════════════════
(function() {
  const params = new URLSearchParams(window.location.search);
  const data   = params.get('d');
  if (!data) return;
  try {
    const raw = decodeURIComponent(escape(atob(data)));
    document.getElementById('paste-area').value = raw;
    _a360RawText = raw;
    setTimeout(runManualA360, 500);
  } catch(e) {
    console.warn('Acciones360: error decodificando link compartido —', e.message);
  }
})();
