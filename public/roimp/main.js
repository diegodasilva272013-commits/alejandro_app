// ── main.js ────────────────────────────────────────────────────────────────────
let currentResults = null;
let _currentRawText = '';
let _currentEmpresa = '';

// ── Archivo .docx ──────────────────────────────────────────────────────────────
document.getElementById("file-input").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  await processFile(file);
});

const dropZone = document.getElementById("drop-zone");
dropZone.addEventListener("dragover",  (e) => { e.preventDefault(); dropZone.classList.add("drag-over"); });
dropZone.addEventListener("dragleave", ()  => { dropZone.classList.remove("drag-over"); });
dropZone.addEventListener("drop", async (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  const file = e.dataTransfer.files[0];
  if (file && file.name.toLowerCase().endsWith(".docx")) await processFile(file);
  else alert("Por favor subí un archivo .docx");
});

async function processFile(file) {
  showLoading();
  try {
    const data = await FinancialParser.parseDocx(file);
    if (!data.empresa) data.empresa = file.name.replace(/\.docx$/i, "").replace(/_/g, " ");
    _currentRawText = ''; // no raw text for file uploads
    runAnalysis(data, data.empresa || file.name);
  } catch (err) {
    console.error("Error leyendo archivo:", err);
    alert("Error al leer el archivo. Verificá que sea un .docx válido.\n\n" + err.message);
  } finally {
    hideLoading();
  }
}

// ── Pegado de datos ────────────────────────────────────────────────────────────
function runManual() {
  const raw = (document.getElementById("paste-area").value || "").trim();
  if (!raw) { alert("Pegá los datos financieros en el campo de texto."); return; }
  const data = FinancialParser.parseText(raw);
  if (data.ev_ebit == null && (data.ev == null || data.ebit == null)) {
    alert("No se detectó EV/EBIT en el texto. Asegurate de incluir ese dato.");
    return;
  }
  // Leer nombre empresa del campo (tiene prioridad), luego intentar extraer del texto
  const campoEmpresa = ((document.getElementById('inp-empresa')||{}).value||'').trim();
  const empresaMatch = raw.match(/(?:empresa|company|ticker|accion|acción)[:\s]+([\w\s\.]+)/i);
  const empresa = campoEmpresa || (empresaMatch ? empresaMatch[1].trim().split("\n")[0] : "Empresa");
  _currentRawText = raw;
  runAnalysis(data, empresa);
}

function loadExample() {
  document.getElementById("paste-area").value = `Empresa: Duolingo Inc.
TICKER: DUOL

VE/EBIT (EV/EBIT)  34.7x
WACC  9.3%
Rendimiento del capital invertido (ROIC)  8.6%
Valor de la empresa (EV)  $3,873M
EBIT  $111.6M
Flujo de caja libre neto (FCF apalancado)  $354.6M
VE / Flujo de caja libre (EV/FCF)  23.8x
Rendimiento de flujo de caja libre (FCF Yield)  4.3%

Deuda neta  -$1,024B
Deuda total  $97.3M
Deuda / Patrimonio  7.4%
Deuda neta / EBITDA  -7.5x
ICR (ratio de cobertura de intereses)  N/A

PER (LTM)  12.9x
Rendimiento de capital (ROE)  36.2%
Rendimiento de activos (ROA)  7.8%
Margen EBIT  11.6%
EBITDA  $125.9M
Margen EBITDA  13.1%
Gastos de capital (CapEx)  $9.7M
Margen de gastos de capital  1.0%

Margen de flujo de caja libre apalancado  36.8%
Margen de flujo de caja libre sin apalancamiento  18.3%

Ingresos  $964.3M
Utilidad bruta  $743.2M
Margen beneficio bruto  77.1%
Ganancias netas  $183.0M`;
}

// ── Análisis central ───────────────────────────────────────────────────────────
function runAnalysis(data, empresa) {
  _currentEmpresa = empresa;
  try {
    currentResults = Calculator.evaluate(data);
    showDashboard(empresa);
    Renderer.render(currentResults, empresa);
    setTimeout(() => Charts.renderAll(currentResults), 120);
  } catch (err) {
    console.error("Error en análisis:", err);
    alert("Error al calcular: " + err.message);
  }
}

// ── Pantallas ──────────────────────────────────────────────────────────────────
function showDashboard(empresa) {
  document.getElementById("upload-screen").style.display = "none";
  document.getElementById("dashboard").style.display     = "block";
  document.getElementById("btn-back-topbar").style.display = "inline-flex";
  const histBtn = document.getElementById("btn-roimp-hist");
  if (histBtn) histBtn.style.display = "inline-flex";
  const actions = document.getElementById("roimp-dash-actions");
  if (actions) actions.style.display = "flex";
  applyHiddenSections();
  window.scrollTo(0, 0);
}

function resetDashboard() {
  document.getElementById("upload-screen").style.display = "grid";
  document.getElementById("dashboard").style.display     = "none";
  document.getElementById("btn-back-topbar").style.display = "none";
  const histBtn2 = document.getElementById("btn-roimp-hist");
  if (histBtn2) histBtn2.style.display = "none";
  const actions = document.getElementById("roimp-dash-actions");
  if (actions) actions.style.display = "none";
  document.getElementById("file-input").value = "";
  Object.keys(Charts.instances).forEach(id => Charts.destroy(id));
}

function showLoading() {
  const btn = document.querySelector(".btn-primary");
  if (btn) { btn.textContent = "Procesando..."; btn.disabled = true; }
}
function hideLoading() {
  const btn = document.querySelector(".btn-primary");
  if (btn) { btn.textContent = "ANALIZAR →"; btn.disabled = false; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── PDF ────────────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function verROImpPDF() {
  const dash = document.getElementById('dashboard');
  const clone = dash.cloneNode(true);

  // Convert canvases → img to preserve chart renders
  const origCanvases = dash.querySelectorAll('canvas');
  const cloneCanvases = clone.querySelectorAll('canvas');
  origCanvases.forEach((cv, i) => {
    try {
      const img = document.createElement('img');
      img.src = cv.toDataURL('image/png');
      img.style.cssText = 'width:100%;height:auto;display:block;border-radius:4px';
      cloneCanvases[i].replaceWith(img);
    } catch(e) {}
  });

  // Collect page stylesheets
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map(el => el.outerHTML).join('\n');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${_currentEmpresa || 'ROImp'} — Análisis Financiero Estructural</title>
${styles}
<style>
  body { background:#05080F !important; margin:0; padding:0; }
  .topbar, .sidebar { display:none !important; }
  .dashboard { display:block !important; padding-top:.5rem !important; }
  @media print {
    body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .no-print { display:none !important; }
    .dashboard { padding-top:0 !important; }
  }
</style>
</head>
<body>
<div class="print-toolbar no-print" style="position:sticky;top:0;z-index:9999;background:rgba(5,8,15,.97);backdrop-filter:blur(10px);border-bottom:1px solid rgba(26,86,196,.25);padding:.55rem 1.5rem;display:flex;gap:.65rem;align-items:center">
  <strong style="color:#D8E6F5;font-family:'Inter',sans-serif;font-size:.88rem;letter-spacing:.02em">📄 ${_currentEmpresa || 'ROImp'} — Análisis Estructural</strong>
  <div style="flex:1"></div>
  <button onclick="window.print()" style="background:#1A56C4;color:#fff;border:none;padding:.38rem 1.1rem;border-radius:6px;cursor:pointer;font-size:.8rem;font-weight:600;letter-spacing:.02em">🖨 Imprimir / Guardar PDF</button>
  <button onclick="window.close()" style="background:rgba(255,255,255,.07);color:#8FA8C8;border:1px solid rgba(255,255,255,.09);padding:.38rem .9rem;border-radius:6px;cursor:pointer;font-size:.8rem">✕ Cerrar</button>
</div>
${clone.outerHTML}
</body></html>`;

  const win = window.open('', '_blank');
  if (!win) { alert('Habilitá las ventanas emergentes para este sitio y volvé a intentarlo.'); return; }
  win.document.write(html);
  win.document.close();
}

async function exportROImpPDF() {
  const btn = document.querySelector('[onclick="exportROImpPDF()"]');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Generando...'; }
  try {
    const dash = document.getElementById('dashboard');
    if (!dash) throw new Error('No hay dashboard activo');
    const clone = dash.cloneNode(true);
    dash.querySelectorAll('canvas').forEach((cv, i) => {
      try {
        const img = document.createElement('img');
        img.src = cv.toDataURL('image/png');
        img.style.cssText = 'width:100%;height:auto;display:block;border-radius:4px';
        clone.querySelectorAll('canvas')[i].replaceWith(img);
      } catch(e) {}
    });
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map(el => el.outerHTML).join('\n');
    const empresa = _currentEmpresa || 'ROImp';
    const fullHTML = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${empresa} — ROImp</title>${styles}<style>*,*::before,*::after{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;animation:none!important;transition:none!important}body{background:#05080F!important;margin:0;padding:0}.topbar,.sidebar,.no-print,.ca-particles{display:none!important}.dashboard{display:block!important;padding-top:.5rem!important}</style></head><body>${clone.outerHTML}</body></html>`;
    const resp = await fetch('/api/pdf360', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ fullHTML, companyName: empresa }) });
    if (!resp.ok) throw new Error('Error del servidor: ' + resp.status);
    const blob = await resp.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = empresa.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g,'_') + '_ROImp_CirculoAzul.pdf';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 30000);
  } catch(err) {
    console.error('exportROImpPDF error:', err);
    alert('Error generando PDF: ' + err.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '⬇ PDF'; }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── HISTORIAL ──────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
const ROIMP_HIST_KEY = 'roimp_historial';

function getROImpHist() {
  try { return JSON.parse(localStorage.getItem(ROIMP_HIST_KEY) || '[]'); }
  catch(e) { return []; }
}

function saveROImpAnalisis() {
  if (!currentResults) { alert('Primero generá un análisis.'); return; }
  const hist = getROImpHist();
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    empresa: _currentEmpresa || 'Sin nombre',
    fecha: new Date().toISOString(),
    raw: _currentRawText || '',
    roimp: (currentResults.roimp != null ? currentResults.roimp : 0).toFixed(2),
    wacc:  (currentResults.wacc  != null ? currentResults.wacc  : 0).toFixed(2),
    veredicto: currentResults.veredicto || ''
  };
  hist.unshift(entry);
  localStorage.setItem(ROIMP_HIST_KEY, JSON.stringify(hist.slice(0, 50)));
  showROImpToast('💾 Análisis guardado');
}

function openROImpHist() {
  renderROImpHistList();
  document.getElementById('roimp-hist-overlay').style.display = 'block';
  requestAnimationFrame(() => {
    document.getElementById('roimp-hist-panel').style.right = '0';
  });
}

function closeROImpHist() {
  document.getElementById('roimp-hist-panel').style.right = '-440px';
  setTimeout(() => { document.getElementById('roimp-hist-overlay').style.display = 'none'; }, 320);
}

function renderROImpHistList() {
  const list = document.getElementById('roimp-hist-list');
  const hist = getROImpHist();
  if (!hist.length) {
    list.innerHTML = '<div style="color:#3d5a7a;text-align:center;padding:3rem 1rem;font-size:.83rem;line-height:1.6">No hay análisis guardados todavía.<br><br>Generá un análisis y usá<br>💾 <strong style="color:#5A9BFF">Guardar</strong> para conservarlo aquí.</div>';
    return;
  }
  list.innerHTML = hist.map((e, i) => {
    const fecha = new Date(e.fecha);
    const fechaStr = fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
    const hora = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const roimpNum = parseFloat(e.roimp);
    const waccNum  = parseFloat(e.wacc);
    const positivo = roimpNum >= waccNum;
    const dot = positivo ? '#4CAF50' : '#ef5350';
    return `
    <div style="background:rgba(13,22,39,.6);border:1px solid rgba(26,86,196,.2);border-radius:8px;margin-bottom:.6rem;overflow:hidden;transition:border-color .2s">
      <div style="padding:.75rem 1rem;display:flex;align-items:flex-start;gap:.75rem">
        <div style="width:8px;height:8px;border-radius:50%;background:${dot};margin-top:.35rem;flex-shrink:0"></div>
        <div style="flex:1;min-width:0">
          <div style="font-size:.88rem;font-weight:600;color:#D8E6F5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e.empresa}</div>
          <div style="font-size:.68rem;color:#3d5a7a;margin-top:.1rem">${fechaStr} · ${hora}</div>
          <div style="font-size:.7rem;margin-top:.3rem;display:flex;gap:.6rem;flex-wrap:wrap">
            <span style="color:${dot};font-weight:600">ROImp ${e.roimp}%</span>
            <span style="color:#5f7a99">WACC ${e.wacc}%</span>
            ${e.veredicto ? `<span style="color:#5A9BFF;opacity:.8">${e.veredicto.slice(0,28)}…</span>` : ''}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:.3rem;flex-shrink:0">
          <button onclick="loadROImpHistEntry(${i})" style="background:#1A56C4;color:#fff;border:none;padding:.28rem .75rem;border-radius:5px;cursor:pointer;font-size:.7rem;font-weight:600;white-space:nowrap">↩ Cargar</button>
          <button onclick="deleteROImpHistEntry(${i})" style="background:rgba(239,83,80,.12);color:#ef5350;border:1px solid rgba(239,83,80,.2);padding:.28rem .75rem;border-radius:5px;cursor:pointer;font-size:.7rem;white-space:nowrap">🗑 Borrar</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function loadROImpHistEntry(index) {
  const hist = getROImpHist();
  const entry = hist[index];
  if (!entry || !entry.raw) {
    alert('Este análisis fue cargado desde archivo y no tiene datos de texto recuperables.');
    return;
  }
  closeROImpHist();
  document.getElementById('paste-area').value = entry.raw;
  _currentRawText = entry.raw;
  // Return to input screen then auto-run
  document.getElementById('upload-screen').style.display = 'grid';
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('btn-back-topbar').style.display = 'none';
  const actions = document.getElementById('roimp-dash-actions');
  if (actions) actions.style.display = 'none';
  Object.keys(Charts.instances).forEach(id => Charts.destroy(id));
  setTimeout(runManual, 150);
}

function deleteROImpHistEntry(index) {
  if (!confirm('¿Borrar este análisis del historial?')) return;
  const hist = getROImpHist();
  hist.splice(index, 1);
  localStorage.setItem(ROIMP_HIST_KEY, JSON.stringify(hist));
  renderROImpHistList();
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── COMPARTIR ──────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function shareROImpAnalisis() {
  if (!_currentRawText) {
    alert('Este análisis fue cargado desde archivo.\nSolo análisis ingresados como texto pueden compartirse por link.');
    return;
  }
  try {
    const encoded = btoa(unescape(encodeURIComponent(_currentRawText)));
    const url = window.location.origin + '/roimp/?d=' + encoded;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => showROImpToast('🔗 Link copiado al portapapeles'))
        .catch(() => _fallbackCopy(url));
    } else {
      _fallbackCopy(url);
    }
  } catch(e) {
    alert('Error al generar el link: ' + e.message);
  }
}

function _fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  try { document.execCommand('copy'); showROImpToast('🔗 Link copiado al portapapeles'); }
  catch(e) { alert('Copiá el link manualmente:\n' + text); }
  document.body.removeChild(ta);
}

function showROImpToast(msg) {
  const t = document.getElementById('roimp-share-toast');
  if (!t) return;
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(1.5rem)';
  }, 2800);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── CONFIGURAR SECCIONES ───────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
const ROIMP_SECTIONS = [
  { id: 'sec-a',       label: 'A — Rendimiento Operativo Implícito (ROImp)' },
  { id: 'sec-b',       label: 'B — Trampas comunes' },
  { id: 'sec-c',       label: 'C — Cuándo ignorar ROImp < WACC' },
  { id: 'sec-d',       label: 'D — Deuda Neta y Estructura de Capital' },
  { id: 'sec-g',       label: 'G — EV/FCF — Validación del Múltiplo' },
  { id: 'sec-h',       label: 'H — Congruencia de ORO (5 condiciones)' },
  { id: 'sec-i',       label: 'I — Análisis de Sensibilidad' },
  { id: 'sec-resumen', label: '∑ — Resumen Final y Conclusión' },
];
const ROIMP_HIDDEN_KEY = 'roimp_hidden_sections';

function getHiddenSections() {
  try { return JSON.parse(localStorage.getItem(ROIMP_HIDDEN_KEY) || '[]'); }
  catch(e) { return []; }
}

function applyHiddenSections() {
  const hidden = getHiddenSections();
  ROIMP_SECTIONS.forEach(s => {
    const el = document.getElementById(s.id);
    if (el) el.style.display = hidden.includes(s.id) ? 'none' : '';
  });
}

function openROImpConfig() {
  renderROImpConfigPanel();
  document.getElementById('roimp-config-overlay').style.display = 'block';
  requestAnimationFrame(() => {
    document.getElementById('roimp-config-panel').style.right = '0';
  });
}

function closeROImpConfig() {
  document.getElementById('roimp-config-panel').style.right = '-380px';
  setTimeout(() => { document.getElementById('roimp-config-overlay').style.display = 'none'; }, 320);
}

function renderROImpConfigPanel() {
  const hidden = getHiddenSections();
  const container = document.getElementById('roimp-config-list');
  container.innerHTML = `
    <p style="color:#3d5a7a;font-size:.76rem;margin:0 0 1rem;line-height:1.5">Seleccioná las secciones que querés ver en el reporte. La configuración se guarda automáticamente.</p>
    ${ROIMP_SECTIONS.map(s => {
      const isVisible = !hidden.includes(s.id);
      return `
      <label style="display:flex;align-items:center;gap:.75rem;padding:.55rem .5rem;border-radius:6px;cursor:pointer;margin-bottom:.15rem;transition:background .15s" onmouseover="this.style.background='rgba(26,86,196,.08)'" onmouseout="this.style.background=''">
        <input type="checkbox" ${isVisible ? 'checked' : ''} onchange="toggleROImpSection('${s.id}', this.checked)"
          style="width:15px;height:15px;accent-color:#1A56C4;cursor:pointer;flex-shrink:0">
        <span style="color:#B8CEEA;font-size:.82rem">${s.label}</span>
      </label>`;
    }).join('')}
    <div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid rgba(26,86,196,.15);display:flex;gap:.5rem">
      <button onclick="showAllROImpSections()" style="flex:1;background:rgba(26,86,196,.12);border:1px solid rgba(26,86,196,.25);color:#5A9BFF;padding:.42rem .5rem;border-radius:6px;cursor:pointer;font-size:.76rem">Mostrar todo</button>
      <button onclick="closeROImpConfig()" style="flex:1;background:#1A56C4;border:none;color:#fff;padding:.42rem .5rem;border-radius:6px;cursor:pointer;font-size:.76rem;font-weight:600">Listo ✓</button>
    </div>`;
}

function toggleROImpSection(id, visible) {
  let hidden = getHiddenSections();
  hidden = visible ? hidden.filter(h => h !== id) : [...new Set([...hidden, id])];
  localStorage.setItem(ROIMP_HIDDEN_KEY, JSON.stringify(hidden));
  const el = document.getElementById(id);
  if (el) el.style.display = visible ? '' : 'none';
}

function showAllROImpSections() {
  localStorage.removeItem(ROIMP_HIDDEN_KEY);
  ROIMP_SECTIONS.forEach(s => {
    const el = document.getElementById(s.id);
    if (el) el.style.display = '';
  });
  renderROImpConfigPanel();
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── URL LOADER — links compartidos (?d=...) ────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
(function () {
  const params = new URLSearchParams(window.location.search);
  const data = params.get('d');
  if (!data) return;
  try {
    const raw = decodeURIComponent(escape(atob(data)));
    document.getElementById('paste-area').value = raw;
    _currentRawText = raw;
    setTimeout(runManual, 400);
  } catch(e) {
    console.warn('ROImp: error al decodificar link compartido —', e.message);
  }
})();

