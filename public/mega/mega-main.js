// ══════════════════════════════════════════════════════
//  MEGA — Controlador Principal
// ══════════════════════════════════════════════════════

// ── Campos cualitativos (Señales v3.0) ────────────────
const QUAL_FIELDS = [
  { key:'BALANCE_SANO',     label:'Balance Sano' },
  { key:'SALUD_DEBIL',      label:'Salud Estructural Débil' },
  { key:'VENTAJA_COMP',     label:'Ventaja Competitiva' },
  { key:'SECTOR_DETERIORO', label:'Sector en Deterioro' },
  { key:'RE_RATING_EV',     label:'Posible Re-rating EV' },
  { key:'SPIN_OFF',         label:'Spin-off / Escisión' },
  { key:'RECOMPRA',         label:'Recompra Agresiva' },
  { key:'VENTA_ACTIVOS',    label:'Venta de Activos' },
];

// ── Campos técnicos (opcionales) ──────────────────────
const TECH_FIELDS = [
  { key:'PRECIO_ACTUAL',         label:'Precio Actual',         type:'number' },
  { key:'PRECIO_PIVOTE',         label:'Precio Pivote',         type:'number' },
  { key:'PRECIO_MIN_PATRON',     label:'Precio Mín Patrón',     type:'number' },
  { key:'PRECIO_MAX_52S',        label:'Máx 52 Semanas',        type:'number' },
  { key:'PRECIO_MIN_52S',        label:'Mín 52 Semanas',        type:'number' },
  { key:'MA10',                  label:'Media 10 días',         type:'number' },
  { key:'MA20',                  label:'Media 20 días',         type:'number' },
  { key:'MA50',                  label:'Media 50 días',         type:'number' },
  { key:'MA200',                 label:'Media 200 días',        type:'number' },
  { key:'TENDENCIA_MA200',       label:'Tendencia MA200',       type:'text',   placeholder:'alcista / bajista' },
  { key:'VOLUMEN_PROMEDIO',      label:'Volumen Promedio',      type:'number' },
  { key:'VOLUMEN_HOY',           label:'Volumen Hoy',           type:'number' },
  { key:'VCP_CONTRACCION_1',     label:'VCP Contracción 1 (%)', type:'number' },
  { key:'VCP_CONTRACCION_2',     label:'VCP Contracción 2 (%)', type:'number' },
  { key:'VCP_CONTRACCION_3',     label:'VCP Contracción 3 (%)', type:'number' },
  { key:'DARVAS_TECHO',          label:'Darvas Techo',          type:'number' },
  { key:'DARVAS_PISO',           label:'Darvas Piso',           type:'number' },
  { key:'DARVAS_SEMANAS',        label:'Darvas Semanas',        type:'number' },
  { key:'COPA_PROFUNDIDAD',      label:'Copa Profundidad (%)',  type:'number' },
  { key:'COPA_SEMANAS',          label:'Copa Semanas',          type:'number' },
  { key:'HANDLE_SEMANAS',        label:'Handle Semanas',        type:'number' },
  { key:'AVANCE_PREVIO',         label:'Avance Previo (%)',     type:'number' },
  { key:'CONSOLIDACION_SEMANAS', label:'Consolidación Semanas', type:'number' },
  { key:'STOP_LOSS',             label:'Stop Loss',             type:'number' },
  { key:'PRECIO_OBJETIVO_1',     label:'Precio Objetivo 1',     type:'number' },
  { key:'PRECIO_OBJETIVO_2',     label:'Precio Objetivo 2',     type:'number' },
  { key:'RSI_14',                label:'RSI 14',                type:'number' },
  { key:'EPS_CREC_TRIM',         label:'EPS Crec. Trim. (%)',   type:'number' },
  { key:'EPS_CREC_ANUAL',        label:'EPS Crec. Anual (%)',   type:'number' },
  { key:'VENTAS_CRECIMIENTO',    label:'Crecim. Ventas (%)',    type:'number' },
  { key:'INST_PCT',              label:'Tenencia Inst. (%)',    type:'number' },
  { key:'RS_LINE',               label:'RS Line',               type:'text',   placeholder:'subiendo / bajando' },
  { key:'SECTOR_TENDENCIA',      label:'Tendencia Sector',      type:'text',   placeholder:'alcista / bajista / neutro' },
];

// ── Estado global ──────────────────────────────────────
let _qualState = {};   // { BALANCE_SANO:'si', ... }
let _chartInstances = [];  // para destruir antes de re-render
let _megaClResult = null;  // resultado de megaCalcChecklist — usado por comparar empresas
let _megaParsedD  = null;  // datos parseados (megaParse) — usados por comparar empresas

// ══════════════════════════════════════════════════════
// INIT — se corre cuando carga la página
// ══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initQualGrid();
  initTechGrid();
  // Activar primer tab del dashboard (el dashboard está oculto hasta que se corre el reporte)
  showTab('tab-checklist', document.querySelector('.tab-btn'));
});

// ── Inicializar grilla de cualitativos ────────────────
function initQualGrid() {
  const grid = document.getElementById('qual-grid');
  if (!grid) return;
  // Init state
  QUAL_FIELDS.forEach(f => { _qualState[f.key] = null; });

  grid.innerHTML = QUAL_FIELDS.map(f => `
    <div class="qual-item">
      <span class="qual-label">${f.label}</span>
      <div class="qual-btns">
        <button class="qual-btn qual-si"  onclick="setQual('${f.key}','si',  this)" id="qbtn-si-${f.key}">SI</button>
        <button class="qual-btn qual-no"  onclick="setQual('${f.key}','no',  this)" id="qbtn-no-${f.key}">NO</button>
        <button class="qual-btn qual-na"  onclick="setQual('${f.key}',null, this)" id="qbtn-na-${f.key}" style="opacity:.5">N/A</button>
      </div>
    </div>`).join('');
}

function setQual(key, val, btn) {
  _qualState[key] = val;
  // Limpiar activos del grupo
  ['si','no','na'].forEach(s => {
    const b = document.getElementById(`qbtn-${s}-${key}`);
    if (b) { b.classList.remove('active'); b.style.opacity = s === 'na' ? '.5' : '1'; }
  });
  btn.classList.add('active');
  btn.style.opacity = '1';
}

// ── Inicializar grilla de campos técnicos ─────────────
function initTechGrid() {
  const grid = document.getElementById('tech-inputs-grid');
  if (!grid) return;
  grid.innerHTML = TECH_FIELDS.map(f => `
    <div class="tech-field">
      <label>${f.label}</label>
      <input type="${f.type||'number'}" id="tf-${f.key}" placeholder="${f.placeholder||''}" step="any">
    </div>`).join('');
}

function getTechExtras() {
  const extras = {};
  TECH_FIELDS.forEach(f => {
    const el = document.getElementById(`tf-${f.key}`);
    if (el && el.value.trim()) {
      extras[f.key] = f.type === 'number' ? parseFloat(el.value) : el.value.trim();
    }
  });
  return extras;
}

// ── Tab switcher ──────────────────────────────────────
function showTab(tabId, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const tab = document.getElementById(tabId);
  if (tab) tab.classList.add('active');
  if (btn) btn.classList.add('active');
}

// ── Progress step ─────────────────────────────────────
function progStep(n, status) {
  const el = document.getElementById(`prog-${n}`);
  if (!el) return;
  el.className = status;   // CSS espera .done / .running / .pending / .error
  const icons = { done:'✅', running:'⏳', pending:'⬜', error:'❌' };
  const icon = el.querySelector('.prog-icon');
  if (icon) icon.textContent = icons[status] || '⬜';
}

// ── Cargar datos de prueba completos ──────────────────
function cargarEjemplo() {
  // ── 1. Datos financieros (cubre todos los módulos) ──
  const ejemplo = `EMPRESA: META PLATFORMS
TICKER: META
SECTOR: Tecnología
MONEDA: USD
AÑOS: 2021,2022,2023,2024,2025

INGRESOS: 117929,116609,134902,164500,187000
UTILIDAD_BRUTA: 97320,88058,111211,135200,155000
EBIT: 46753,20581,46069,65700,80000
EBITDA: 51538,27095,52862,73200,89000
GANANCIAS_NETAS: 39370,23200,39098,53000,65000
FCF: 37326,18934,43009,58000,72000
OFC: 57683,29595,71113,91000,108000
CAPEX: 19965,29543,27269,34000,36000
BPA: 13.77,8.59,14.87,21.10,26.80
EQUITY: 124000,138000,153000,174000,198000

ROIC: 33.1,17.2,28.9,35.2,40.1
ROE: 31.5,18.4,28.6,33.0,38.5
ROA: 18.2,10.1,18.5,22.3,26.0
WACC: 10.5

MARGEN_BRUTO: 82.5,75.5,82.4,82.2,82.9
MARGEN_EBIT: 39.6,17.7,34.1,39.9,42.8
MARGEN_EBITDA: 43.7,23.2,39.2,44.5,47.6
MARGEN_NETO: 33.4,19.9,29.0,32.2,34.8
FCF_APAL: 31.6,16.2,31.9,35.3,38.5
FCF_SIN_APAL: 36.2,20.1,35.8,39.0,42.1
MARGEN_CAPEX: 16.9,25.3,20.2,20.7,19.3

DEUDA_TOTAL: 3000,13000,37000,37000,37000
CAJA: 48088,40018,65513,78000,92000
DEUDA_NETA: -45088,-27018,-28513,-41000,-55000
EV: 1280000
EV_EBIT: 19.5
EV_EBITDA: 14.4
EV_FCF: 22.1
PER: 24.3
PER_FWD: 20.8
PEG: 0.82
FCF_YIELD: 4.5

ACTIVOS_TOTALES: 185000
ACTIVOS_CORRIENTES: 82000
PASIVOS_CORRIENTES: 28000
INVENTARIOS: 1200
DEUDA_NETA_EBITDA: -0.62
DEUDA_PATRIMONIO: 19.4
ICR: 42
GASTO_INTERESES: 1100

CURRENT_RATIO: 2.9
QUICK_RATIO: 2.7
ALTMAN: 9.2
PIOTROSKI: 8

PRECIO_ACTUAL: 612.50
PRECIO_PIVOTE: 585.00
PRECIO_MAX_52S: 638.40
PRECIO_MIN_52S: 414.50
MA10: 608.20
MA20: 598.40
MA50: 570.10
MA200: 511.30
TENDENCIA_MA200: alcista
VOLUMEN_PROMEDIO: 14500000
VOLUMEN_HOY: 21800000
AVANCE_PREVIO: 42
CONSOLIDACION_SEMANAS: 7
VCP_CONTRACCION_1: 22
VCP_CONTRACCION_2: 14
VCP_CONTRACCION_3: 8
COPA_PROFUNDIDAD: 34
COPA_SEMANAS: 14
HANDLE_SEMANAS: 3
STOP_LOSS: 572.00
PRECIO_OBJETIVO_1: 680.00
PRECIO_OBJETIVO_2: 750.00
RSI_14: 62
EPS_CREC_TRIM: 35
EPS_CREC_ANUAL: 27
VENTAS_CRECIMIENTO: 19
INST_PCT: 74
RS_LINE: subiendo
SECTOR_TENDENCIA: alcista

BALANCE_SANO: si
VENTAJA_COMP: si
RECOMPRA: si
SALUD_DEBIL: no
SECTOR_DETERIORO: no
SPIN_OFF: no
RE_RATING_EV: si
VENTA_ACTIVOS: no`;

  const inp = document.getElementById('inp-data');
  if (inp) inp.value = ejemplo;

  // ── 2. Empresa ──────────────────────────────────────
  const emp = document.getElementById('inp-empresa');
  if (emp) emp.value = 'META PLATFORMS (META)';

  // ── 3. Cualitativos ─────────────────────────────────
  const quals = {
    BALANCE_SANO:     'si',
    SALUD_DEBIL:      'no',
    VENTAJA_COMP:     'si',
    SECTOR_DETERIORO: 'no',
    RE_RATING_EV:     'si',
    SPIN_OFF:         'no',
    RECOMPRA:         'si',
    VENTA_ACTIVOS:    'no',
  };
  Object.entries(quals).forEach(([key, val]) => {
    _qualState[key] = val;
    ['si','no','na'].forEach(s => {
      const b = document.getElementById(`qbtn-${s}-${key}`);
      if (b) { b.classList.remove('active'); b.style.opacity = s === 'na' ? '.5' : '1'; }
    });
    const activeBtn = document.getElementById(`qbtn-${val}-${key}`);
    if (activeBtn) { activeBtn.classList.add('active'); activeBtn.style.opacity = '1'; }
  });

  // ── 4. Campos técnicos ──────────────────────────────
  const techVals = {
    PRECIO_ACTUAL: '612.50', PRECIO_PIVOTE: '585.00',
    PRECIO_MAX_52S: '638.40', PRECIO_MIN_52S: '414.50',
    MA10: '608.20', MA20: '598.40', MA50: '570.10', MA200: '511.30',
    TENDENCIA_MA200: 'alcista',
    VOLUMEN_PROMEDIO: '14500000', VOLUMEN_HOY: '21800000',
    VCP_CONTRACCION_1: '22', VCP_CONTRACCION_2: '14', VCP_CONTRACCION_3: '8',
    COPA_PROFUNDIDAD: '34', COPA_SEMANAS: '14', HANDLE_SEMANAS: '3',
    AVANCE_PREVIO: '42', CONSOLIDACION_SEMANAS: '7',
    STOP_LOSS: '572.00', PRECIO_OBJETIVO_1: '680.00', PRECIO_OBJETIVO_2: '750.00',
    RSI_14: '62', EPS_CREC_TRIM: '35', EPS_CREC_ANUAL: '27',
    VENTAS_CRECIMIENTO: '19', INST_PCT: '74',
    RS_LINE: 'subiendo', SECTOR_TENDENCIA: 'alcista',
  };
  Object.entries(techVals).forEach(([key, val]) => {
    const el = document.getElementById(`tf-${key}`);
    if (el) el.value = val;
  });

  // Abrir el panel técnico para que se vea
  const det = document.getElementById('tech-details');
  if (det) det.open = true;

  // Feedback visual
  const btn = event?.currentTarget;
  if (btn) {
    const orig = btn.innerHTML;
    btn.innerHTML = '✅ Datos cargados';
    btn.style.borderColor = 'var(--green)';
    btn.style.color = 'var(--green)';
    setTimeout(() => { btn.innerHTML = orig; btn.style.borderColor = ''; btn.style.color = ''; }, 2000);
  }
}

// ══════════════════════════════════════════════════════
// ── Flag: PDF habilitado solo cuando IA terminó ───────
let _iaListo         = false;
let _megaEmpresa     = '';
let _megaRawText     = '';
const MEGA_HIST_KEY  = 'mega_hist_v1';

function _setPDFBtns(enabled, label) {
  document.querySelectorAll('#btn-pdf-top, #btn-pdf-dash').forEach(b => {
    b.disabled = !enabled;
    b.textContent = label;
    b.title = enabled ? '' : 'Esperá a que termine el Análisis IA antes de generar el PDF';
  });
}

// MAIN ORCHESTRATOR
// ══════════════════════════════════════════════════════
async function iniciarMegaReporte() {
  const empresa = (document.getElementById('inp-empresa')?.value || '').trim();
  const rawText = (document.getElementById('inp-data')?.value || '').trim();
  _megaEmpresa = empresa;
  _megaRawText = rawText;

  if (!rawText) {
    alert('Pegá los datos financieros en el área de texto.');
    return;
  }

  // Destruir charts anteriores
  _chartInstances.forEach(c => { try { c.destroy(); } catch(e){} });
  _chartInstances = [];

  // Mostrar pantalla de progreso
  document.getElementById('screen-input').style.display    = 'none';
  document.getElementById('screen-progress').style.display = 'block';
  document.getElementById('screen-dash').style.display     = 'none';
  const navPdf = document.getElementById('nav-pdf-area');
  if (navPdf) navPdf.style.display = 'none';

  // Reset progress
  for (let i = 0; i < 7; i++) progStep(i, 'pending');

  try {
    // ── 0. Parser ──────────────────────────────────────
    progStep(0, 'running');
    await tick();
    const d = megaParse(rawText);
    progStep(0, 'done');

    // ── 1. Check List ──────────────────────────────────
    progStep(1, 'running');
    await tick();
    const clResult = megaCalcChecklist(d);
    _megaClResult = clResult;   // exponer globalmente para comparar empresas
    _megaParsedD  = d;          // guardar datos parseados para comparar empresas
    megaRenderChecklist(d, 'tab-checklist');   // pasa d para usar renderDash original
    progStep(1, 'done');

    // ── 2. Análisis Técnico ────────────────────────────
    progStep(2, 'running');
    await tick();
    const techExtras = getTechExtras();
    const techResult = megaCalcTecnico(d, techExtras);
    megaRenderTecnico(techResult, 'tab-tecnico');
    progStep(2, 'done');

    // ── 3. ROImp ───────────────────────────────────────
    progStep(3, 'running');
    await tick();
    const roimpResult = megaCalcRoimp(d);
    megaRenderRoimp(roimpResult, 'tab-roimp');
    progStep(3, 'done');

    // ── 4. Acciones 360 ────────────────────────────────
    progStep(4, 'running');
    await tick();
    const result360 = megaCalc360(d);
    megaRender360(d, 'tab-360');
    progStep(4, 'done');

    // ── 5. Señales v3.0 ────────────────────────────────
    progStep(5, 'running');
    await tick();
    const senalesResult = megaCalcSenales(d, _qualState);
    megaRenderSenales(d, 'tab-senales');
    progStep(5, 'done');

    // ── Mostrar dashboard ──────────────────────────────
    document.getElementById('screen-progress').style.display = 'none';
    document.getElementById('screen-dash').style.display     = 'block';
    // Habilitar botones PDF
    const navArea = document.getElementById('nav-pdf-area');
    if (navArea) navArea.style.display = 'flex';
    const btnTop  = document.getElementById('btn-pdf-top');
    if (btnTop)  { btnTop.style.display = 'inline-flex'; btnTop.disabled = false; }
    const btnDash = document.getElementById('btn-pdf-dash');
    if (btnDash) btnDash.disabled = false;

    // Actualizar título y fecha
    const tit = document.getElementById('dash-empresa');
    if (tit) tit.textContent = empresa || 'Empresa';
    const fech = document.getElementById('dash-fecha');
    if (fech) fech.textContent = new Date().toLocaleDateString('es-AR');

    // Activar primer tab
    const firstBtn = document.querySelector('.tab-btn');
    if (firstBtn) showTab('tab-checklist', firstBtn);

    // ── 6. IA (asíncrono, no bloquea) ─────────────────
    progStep(6, 'running');
    const resumen = {
      clScore:      Math.round(clResult.pctScore),
      clGreen:      clResult.cntGreen,
      clTotal:      clResult.inds ? clResult.inds.length : 35,
      roImp:        roimpResult.roImp,
      wacc:         roimpResult.wacc,
      roimpVerd:    roimpResult.verd || 'N/E',
      health360:    Math.round(result360.healthScore || 0),
      senalesPct:   Math.round(senalesResult.pct),
      senalesCumple:senalesResult.totalCumple,
      senalesTotal: (senalesResult.totalCumple||0)+(senalesResult.totalNo||0)+(senalesResult.totalFalta||0),
      oroCount:     roimpResult.oroCount || 0,
    };
    _iaListo = false;
    _setPDFBtns(false, '⏳ Esperando IA…');

    document.getElementById('tab-ia').innerHTML = `
      <div class="sec-title">🤖 Análisis IA — Procesando…</div>
      <div style="text-align:center;padding:2rem;color:var(--text3)">
        <div class="ia-spinner"></div>
        <p>Consultando modelo GPT-4o…</p>
      </div>`;

    megaCallIA(empresa, rawText, resumen).then(texto => {
      megaRenderIA(texto, empresa, 'tab-ia');
      progStep(6, 'done');
      _iaListo = true;
      _setPDFBtns(true, '📄 PDF Completo');
    }).catch(err => {
      document.getElementById('tab-ia').innerHTML = `<div class="sec-title">🤖 Análisis IA</div><p style="color:var(--red)">${err.message}</p>`;
      progStep(6, 'error');
      _iaListo = true; // permitir PDF igualmente aunque IA haya fallado
      _setPDFBtns(true, '📄 PDF Completo');
    });

  } catch (err) {
    console.error('Error en Mega Reporte:', err);
    document.getElementById('screen-progress').innerHTML += `
      <div style="color:var(--red);margin-top:1rem;padding:1rem;border:1px solid var(--red);border-radius:8px">
        ❌ Error: ${err.message}
      </div>`;
  }
}

// ── Volver a input ────────────────────────────────────
function volverAlInput() {
  document.getElementById('screen-dash').style.display     = 'none';
  document.getElementById('screen-progress').style.display = 'none';
  document.getElementById('screen-input').style.display    = 'block';
  const navArea2 = document.getElementById('nav-pdf-area');
  if (navArea2) navArea2.style.display = 'none';
}

// ── Generar PDF ───────────────────────────────────────
async function generarPDF() {
  if (!_iaListo) {
    alert('El Análisis IA todavía está procesando. Esperá unos segundos y volvé a intentarlo.');
    return;
  }

  const btns = document.querySelectorAll('#btn-pdf-top, #btn-pdf-dash');
  btns.forEach(b => { b.disabled = true; b.textContent = '⏳ Generando...'; });

  try {
    const dash = document.getElementById('screen-dash');
    if (!dash) throw new Error('No hay dashboard activo');

    // ── PASO 1: Mostrar todos los tabs temporalmente para que los canvas se rendericen ──
    const tabs = Array.from(dash.querySelectorAll('.tab-content'));
    const prevDisplay = tabs.map(t => t.style.display);
    tabs.forEach(t => { t.style.display = 'block'; });

    // Forzar re-render de todos los charts de Chart.js (los canvases en tabs hidden no se renderizan automáticamente)
    if (typeof Chart !== 'undefined') {
      dash.querySelectorAll('canvas').forEach(cv => {
        try {
          const chart = Chart.getChart(cv);
          if (chart) { chart.resize(); chart.update('none'); }
        } catch(e) {}
      });
    }
    await new Promise(r => setTimeout(r, 400)); // dar tiempo a Chart.js para pintar

    // ── PASO 2: Capturar todos los canvas por índice ──
    const canvasDataUrls = Array.from(dash.querySelectorAll('canvas')).map(cv => {
      try { return cv.toDataURL('image/png'); } catch(e) { return null; }
    });

    // ── PASO 3: Restaurar visibilidad original ──
    tabs.forEach((t, i) => { t.style.display = prevDisplay[i]; });

    // ── PASO 4: Clonar el dashboard ──
    const clone = dash.cloneNode(true);

    // ── PASO 5: En el clon, mostrar solo tabs con contenido real ──
    const cloneTabs = Array.from(clone.querySelectorAll('.tab-content'));
    cloneTabs.forEach(t => {
      const hasContent = t.innerHTML.trim().length > 50;
      if (hasContent) {
        t.style.cssText = 'display:block!important;opacity:1!important;visibility:visible!important;height:auto!important;overflow:visible!important;page-break-inside:avoid';
      } else {
        t.remove(); // eliminar tabs vacíos para evitar páginas en blanco
      }
    });

    // ── PASO 6: Reemplazar canvas por imágenes en el clon ──
    const cloneCanvases = Array.from(clone.querySelectorAll('canvas'));
    cloneCanvases.forEach((cv, i) => {
      const dataUrl = canvasDataUrls[i];
      if (dataUrl) {
        const img = document.createElement('img');
        img.src = dataUrl;
        img.style.cssText = 'width:100%;height:auto;display:block;border-radius:6px';
        cv.parentNode.replaceChild(img, cv);
      }
    });

    // ── PASO 7: Limpiar elementos de UI del clon ──
    clone.querySelectorAll(
      '.mega-nav, .tab-bar, .tab-bar-wrap, #nav-pdf-area, .no-print, ' +
      '.btn-pdf, .btn-mega, .btn-secondary, #btn-pdf-top, #btn-pdf-dash, ' +
      '#screen-input, #screen-progress'
    ).forEach(el => el.remove());

    // ── PASO 8: Construir HTML completo para Puppeteer ──
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(el => el.outerHTML).join('\n');
    const empresa = (document.getElementById('dash-empresa') || {}).textContent || 'Mega Reporte';

    const fullHTML = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>${empresa} — Mega Reporte Círculo Azul</title>
${styles}
<style>
  *, *::before, *::after {
    -webkit-print-color-adjust:exact !important;
    print-color-adjust:exact !important;
    animation:none !important;
    transition:none !important;
  }
  html, body { margin:0; padding:0; background:#05080F; font-family:'Inter',sans-serif; color:#fff; }
  .mega-nav,.tab-bar,.tab-bar-wrap,.btn-pdf,.btn-mega,.no-print,
  #nav-pdf-area,#screen-input,#screen-progress { display:none !important; }
  #screen-dash { display:block !important; padding:0 !important; }
  .tab-content { display:block !important; opacity:1 !important; height:auto !important;
    overflow:visible !important; padding:1.5rem 2rem !important;
    page-break-before:auto !important; break-before:auto !important; }
  .tab-content + .tab-content {
    border-top:2px solid rgba(90,155,255,.2); margin-top:1rem;
    page-break-before:auto !important; break-before:auto !important; }
  img { max-width:100%; height:auto; }
  canvas { display:none !important; }
</style>
</head><body>${clone.outerHTML}</body></html>`;

    const resp = await fetch('/api/pdf360', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullHTML, companyName: empresa })
    });

    if (!resp.ok) throw new Error('Error servidor: ' + resp.status);

    const blob = await resp.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = empresa.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, '_') + '_MegaReporte_CirculoAzul.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 30000);

  } catch(err) {
    console.error('generarPDF Mega error:', err);
    alert('Error generando PDF: ' + err.message);
  } finally {
    btns.forEach(b => { b.disabled = false; b.textContent = '📄 PDF Completo'; });
    const btnTop = document.getElementById('btn-pdf-top');
    if (btnTop) btnTop.textContent = '📄 PDF';
  }
}

// ── Helper: ceder el event loop para repintar UI ──────
function tick(ms = 20) {
  return new Promise(r => setTimeout(r, ms));
}

// ══════════════════════════════════════════════════════
// ── HISTORIAL — MEGA ──────────────────────────────────
// ══════════════════════════════════════════════════════
function getMegaHist() {
  try { return JSON.parse(localStorage.getItem(MEGA_HIST_KEY) || '[]'); }
  catch(e) { return []; }
}

function saveMegaAnalisis() {
  if (!_megaRawText) { alert('Primero generá un análisis.'); return; }
  const hist = getMegaHist();
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    empresa: _megaEmpresa || 'Sin nombre',
    fecha: new Date().toISOString(),
    raw: _megaRawText
  };
  hist.unshift(entry);
  localStorage.setItem(MEGA_HIST_KEY, JSON.stringify(hist.slice(0, 50)));
  showMegaToast('💾 Análisis guardado');
}

function openMegaHist() {
  renderMegaHistList();
  document.getElementById('mega-hist-overlay').style.display = 'block';
  requestAnimationFrame(() => { document.getElementById('mega-hist-panel').style.right = '0'; });
}

function closeMegaHist() {
  document.getElementById('mega-hist-panel').style.right = '-440px';
  setTimeout(() => { document.getElementById('mega-hist-overlay').style.display = 'none'; }, 320);
}

function renderMegaHistList() {
  const list = document.getElementById('mega-hist-list');
  const hist = getMegaHist();
  if (!hist.length) {
    list.innerHTML = '<div style="color:#3d5a7a;text-align:center;padding:3rem 1rem;font-size:.83rem;line-height:1.6">No hay análisis guardados todavía.<br><br>Generá un análisis y usá<br>💾 <strong style="color:#5A9BFF">Guardar</strong> para conservarlo aquí.</div>';
    return;
  }
  list.innerHTML = hist.map((e, i) => {
    const fecha = new Date(e.fecha);
    const fechaStr = fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
    const hora = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    return `
    <div style="background:rgba(13,22,39,.6);border:1px solid rgba(26,86,196,.2);border-radius:8px;margin-bottom:.6rem;overflow:hidden">
      <div style="padding:.75rem 1rem;display:flex;align-items:flex-start;gap:.75rem">
        <div style="width:8px;height:8px;border-radius:50%;background:#5A9BFF;margin-top:.35rem;flex-shrink:0"></div>
        <div style="flex:1;min-width:0">
          <div style="font-size:.88rem;font-weight:600;color:#D8E6F5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e.empresa}</div>
          <div style="font-size:.68rem;color:#3d5a7a;margin-top:.1rem">${fechaStr} · ${hora}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:.3rem;flex-shrink:0">
          <button onclick="loadMegaHistEntry(${i})" style="background:#1A56C4;color:#fff;border:none;padding:.28rem .75rem;border-radius:5px;cursor:pointer;font-size:.7rem;font-weight:600">↩ Cargar</button>
          <button onclick="deleteMegaHistEntry(${i})" style="background:rgba(239,83,80,.12);color:#ef5350;border:1px solid rgba(239,83,80,.2);padding:.28rem .75rem;border-radius:5px;cursor:pointer;font-size:.7rem">🗑 Borrar</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function loadMegaHistEntry(index) {
  const entry = getMegaHist()[index];
  if (!entry) return;
  closeMegaHist();
  document.getElementById('inp-empresa').value = entry.empresa;
  document.getElementById('inp-data').value    = entry.raw || '';
  volverAlInput();
  setTimeout(iniciarMegaReporte, 100);
}

function deleteMegaHistEntry(index) {
  if (!confirm('¿Borrar este análisis del historial?')) return;
  const hist = getMegaHist();
  hist.splice(index, 1);
  localStorage.setItem(MEGA_HIST_KEY, JSON.stringify(hist));
  renderMegaHistList();
}

function shareMegaAnalisis() {
  if (!_megaRawText) { alert('Primero generá un análisis para compartir.'); return; }
  try {
    const encoded = btoa(unescape(encodeURIComponent(_megaRawText)));
    const params = new URLSearchParams({ d: encoded });
    if (_megaEmpresa) params.set('emp', _megaEmpresa);
    const url = window.location.origin + '/mega/?' + params.toString();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => showMegaToast('🔗 Link copiado al portapapeles')).catch(() => _megaFallbackCopy(url));
    } else { _megaFallbackCopy(url); }
  } catch(e) { alert('Error al generar el link: ' + e.message); }
}

function _megaFallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
  document.body.appendChild(ta); ta.focus(); ta.select();
  try { document.execCommand('copy'); showMegaToast('🔗 Link copiado al portapapeles'); }
  catch(e) { alert('Copiá el link manualmente:\n' + text); }
  document.body.removeChild(ta);
}

function showMegaToast(msg) {
  const t = document.getElementById('mega-toast');
  if (!t) return;
  t.textContent = msg;
  t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)';
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(8px)'; }, 2800);
}

// ── Auto-load desde URL (share link) ──────────────────────
(function checkMegaShareLink() {
  try {
    const params = new URLSearchParams(window.location.search);
    const d = params.get('d');
    if (!d) return;
    const text = decodeURIComponent(escape(atob(d)));
    document.getElementById('inp-data').value    = text;
    document.getElementById('inp-empresa').value = params.get('emp') || '';
    setTimeout(iniciarMegaReporte, 400);
  } catch(e) {}
})();
