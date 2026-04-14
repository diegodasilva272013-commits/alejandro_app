// ══════════════════════════════════════════════════════════════════════
//  CÍRCULO AZUL FINANZAS — Módulo Análisis Técnico de Breakouts
//  Metodologías: Minervini (VCP), Kullamagi (MA Breakout),
//                Darvas (Box System), O'Neill (Cup & Handle)
// ══════════════════════════════════════════════════════════════════════

'use strict';

// ══════════════════════════════════════════
//  NAVEGACIÓN MÓDULO TÉCNICO
// ══════════════════════════════════════════
function showTechInput(){
  document.getElementById('landing').style.display         = 'none';
  document.getElementById('input-screen').style.display   = 'none';
  document.getElementById('dashboard').style.display      = 'none';
  document.getElementById('tech-input-screen').style.display  = 'block';
  document.getElementById('tech-dashboard').style.display = 'none';
  document.getElementById('btn-pdf').style.display        = 'none';
  document.getElementById('btn-selector').style.display   = 'none';
  document.getElementById('btn-tech-pdf').style.display   = 'none';
  var bvp = document.getElementById('btn-ver-pdf');
  if(bvp) bvp.style.display = 'none';
  initTechPeriodSelector();
}

function showTechDash(){
  document.getElementById('landing').style.display             = 'none';
  document.getElementById('input-screen').style.display        = 'none';
  document.getElementById('dashboard').style.display           = 'none';
  document.getElementById('tech-input-screen').style.display   = 'none';
  document.getElementById('tech-dashboard').style.display      = 'block';
  document.getElementById('btn-pdf').style.display             = 'none';
  document.getElementById('btn-selector').style.display        = 'none';
  document.getElementById('btn-tech-pdf').style.display        = 'inline-block';
  var bvp = document.getElementById('btn-ver-pdf');
  if(bvp) bvp.style.display = 'none';
}

// ══════════════════════════════════════════
//  EJEMPLO DE DATOS
// ══════════════════════════════════════════
var TECH_EXAMPLE = `ACCION: Apple Inc. (AAPL)
PERIODO: Anual 2025
MONEDA: USD

PRECIO_ACTUAL: 220.50
PRECIO_PIVOTE: 225.00
PRECIO_MIN_PATRON: 198.00
PRECIO_MAX_52S: 237.23
PRECIO_MIN_52S: 164.08

MA10: 218.40
MA20: 214.80
MA50: 205.30
MA200: 189.60
TENDENCIA_MA200: subiendo

VOLUMEN_PROMEDIO: 55000000
VOLUMEN_HOY: 82000000

VCP_CONTRACCION_1: 18
VCP_CONTRACCION_2: 10
VCP_CONTRACCION_3: 4

DARVAS_TECHO: 225.00
DARVAS_PISO: 210.00
DARVAS_SEMANAS: 7

COPA_PROFUNDIDAD: 22
COPA_SEMANAS: 14
HANDLE_SEMANAS: 3

AVANCE_PREVIO: 65
CONSOLIDACION_SEMANAS: 4

STOP_LOSS: 212.00
PRECIO_OBJETIVO_1: 260.00
PRECIO_OBJETIVO_2: 290.00

RSI_14: 65.5
MACD: 0.85
MACD_SIGNAL: 0.60
MACD_HIST: 0.25
BB_SUPERIOR: 235.00
BB_INFERIOR: 195.00
ATR_14: 4.20
RS_LINE: subiendo
SECTOR: Tecnología
SECTOR_TENDENCIA: fuerte

EPS_CREC_TRIM: 25
EPS_CREC_ANUAL: 18
VENTAS_CRECIMIENTO: 12
ROE: 28
INST_PCT: 65
FLOAT_ACC: 5000000000

# ── Datos mensuales para tabla comparativa (M-12 → M-1, separados por coma) ──
# El sistema calcula automáticamente ROA, ROE, Margen EBIT, Asset Turnover,
# OCF/NI, FCF/NI y Deuda Neta/FCF a partir de estos componentes.
# Los demás ratios los podés pegar directamente si los tenés.
GANANCIAS_NETAS_12M: 100,103,107,110,115,118,121,125,129,133,136,140
ACTIVOS_TOTALES_12M: 800,805,810,815,820,825,830,835,840,845,850,855
INGRESOS_12M: 500,502,508,515,520,525,530,538,545,552,558,565
EBIT_12M: 75,77,81,82,83,85,90,92,93,94,95,98
PATRIMONIO_12M: 400,405,410,415,420,425,430,435,440,445,450,455
OFC_12M: 110,110,110,111,111,111,111,111,111,111,111,111
FCF_12M: 100,105,108,110,113,116,117,119,120,121,122,123
DEUDA_NETA_12M: 150,148,145,143,140,138,135,132,130,129,128,125
ROIC_12M: 30,31,32,33,34,35,36,37,38,39,40,41
# Opcionales (si los tenés directos; sino se calculan o se omiten):
CROIC_12M: 25,26,27,28,29,30,31,32,33,34,35,36
PER_12M: 28,29,30,30,31,32,33,34,35,36,37,38
FCF_YIELD_12M: 3,3,3,3,3,3,3,3,3,3,3,3
CCR_12M: 1.05,1.06,1.08,1.10,1.12,1.14,1.16,1.18,1.20,1.22,1.24,1.25
BENEISH_12M: -2.3,-2.3,-2.4,-2.4,-2.5,-2.5,-2.6,-2.6,-2.7,-2.7,-2.8,-2.8
ALTMAN_12M: 4.5,4.6,4.7,4.8,4.9,5.0,5.1,5.2,5.3,5.4,5.5,5.6
PIOTROSKI_12M: 8,8,8,8,8,8,9,9,9,9,9,9`;

function loadTechExample(){
  document.getElementById('tech-paste-area').value = TECH_EXAMPLE;
  showTechInput();
}

// Carga automática de series históricas trimestrales desde Yahoo Finance
function techLoad12M(){
  var tickerInput = document.getElementById('tech-12m-ticker');
  var btn         = document.getElementById('tech-12m-btn');
  var status      = document.getElementById('tech-12m-status');
  var textarea    = document.getElementById('tech-paste-area');

  // Intentar leer ticker del campo dedicado o del paste-area
  var ticker = (tickerInput.value || '').trim();
  if (!ticker) {
    // extraer del paste si lo hay: buscar ACCION: Apple Inc. (AAPL) → toma lo que está entre paréntesis
    var paste = textarea.value || '';
    var m = paste.match(/ACCION\s*:.*?\(([A-Z0-9.\-^]+)\)/i);
    if (!m) m = paste.match(/TICKER\s*:\s*([A-Z0-9.\-^]+)/i);
    if (m) ticker = m[1].trim();
  }
  if (!ticker) {
    status.textContent = '⚠ Ingresá el ticker primero.';
    return;
  }

  btn.disabled = true;
  status.textContent = 'Buscando datos en Yahoo Finance…';

  fetch('/api/financials12m/' + encodeURIComponent(ticker))
    .then(function(r){ return r.json(); })
    .then(function(data){
      btn.disabled = false;
      if (!data.ok) {
        status.textContent = '✗ ' + (data.error || 'Error desconocido');
        return;
      }
      // Armar el bloque de texto para agregar al textarea
      var lines = ['', '# ── Series históricas trimestrales (Yahoo Finance, más reciente último) ──'];
      var s = data.series;
      Object.keys(s).forEach(function(k){
        if (s[k]) lines.push(k + ': ' + s[k]);
      });
      // Agregar al textarea (sin duplicar si ya existen esas claves)
      var current = textarea.value;
      // Eliminar cualquier bloque 12M previo
      current = current.replace(/\n# ── Series históricas[\s\S]*$/m, '').trimEnd();
      textarea.value = current + lines.join('\n');
      status.textContent = '✓ Datos cargados (' + ticker + ')';
      // Re-parsear si ya hay un reporte visible
      if (typeof parseTechAndRender === 'function') parseTechAndRender();
    })
    .catch(function(err){
      btn.disabled = false;
      status.textContent = '✗ Error de red: ' + err.message;
    });
}

// ══════════════════════════════════════════
//  PARSER
// ══════════════════════════════════════════

// Mapa de nombres InvestingPro / plataformas en español → claves internas
var INVESTINGPRO_MAP = {
  // precios / mercado
  'precio actual':           'PRECIO_ACTUAL',
  'precio de cierre':        'PRECIO_ACTUAL',
  'último precio':           'PRECIO_ACTUAL',
  'precio':                  'PRECIO_ACTUAL',
  'precio pivote':           'PRECIO_PIVOTE',
  'máximo 52 semanas':       'PRECIO_MAX_52S',
  'max 52 semanas':          'PRECIO_MAX_52S',
  'máximo 52s':              'PRECIO_MAX_52S',
  'mínimo 52 semanas':       'PRECIO_MIN_52S',
  'min 52 semanas':          'PRECIO_MIN_52S',
  'mínimo 52s':              'PRECIO_MIN_52S',
  'acc. en circulación':     'FLOAT_ACC',
  'acc en circulacion':      'FLOAT_ACC',
  'acciones en circulación': 'FLOAT_ACC',

  // rentabilidad
  'rendimiento de capital':          'ROE',
  'roe':                             'ROE',
  'rendimiento del capital invertido':'ROIC',
  'roic':                            'ROIC',
  'rendimiento de activos':          'ROA',
  'roa':                             'ROA',

  // valoración
  'per':                     'PER',
  'ratio per':               'PER',
  'relación per':            'PER',
  'relación per (fwd)':      'PER_FWD',
  'per forward':             'PER_FWD',
  'ratio peg':               'PEG',
  'peg':                     'PEG',
  've / flujo de caja libre':'EV_FCF',
  've/ebit':                 'EV_EBIT',
  've/ebitda':               'EV_EBITDA',

  // márgenes
  'margen beneficio bruto':  'MARGEN_BRUTO',
  'margen bruto':            'MARGEN_BRUTO',
  'margen ebit':             'MARGEN_EBIT',
  'margen ebitda':           'MARGEN_EBITDA',
  'ingresos netos margen accionistas': 'MARGEN_NETO',
  'margen neto':             'MARGEN_NETO',
  'margen de flujo de caja libre sin apalancamiento': 'MARGEN_FCF_UNLEV',
  'margen de flujo de caja libre apalancado': 'MARGEN_FCF_LEV',

  // ingresos y resultados
  'ingresos':                'INGRESOS',
  'revenue':                 'INGRESOS',
  'utilidad bruta':          'UTILIDAD_BRUTA',
  'ganancias netas':         'GANANCIAS_NETAS',
  'ebit':                    'EBIT',
  'ebitda':                  'EBITDA',
  'flujo de caja libre neto':'FCF',
  'free cash flow':          'FCF',
  'efectivo de las operaciones': 'OFC',

  // balance / solvencia
  'capital contable':        'PATRIMONIO',
  'patrimonio':              'PATRIMONIO',
  'deuda total':             'DEUDA_TOTAL',
  'deuda a largo plazo':     'DEUDA_LP',
  'deuda neta':              'DEUDA_NETA',
  'deuda / patrimonio':      'DEUDA_PATRIMONIO',
  'deuda neta / ebitda':     'DN_EBITDA',
  'ratio de solvencia':      'CURRENT_RATIO',
  'prueba ácida':            'QUICK_RATIO',
  'prueba acida':            'QUICK_RATIO',
  'ratio de cobertura de intereses': 'INTCOV',
  'efectivo y equivalentes': 'CASH',
  'capital total':           'CAPITAL_TOTAL',

  // scoring
  'fórmula altman z-score':  'ALTMAN',
  'altman z-score':          'ALTMAN',
  'puntuación piotroski':    'PIOTROSKI',
  'piotroski':               'PIOTROSKI',
  'fórmula beneish m-score': 'BENEISH',
  'beneish m-score':         'BENEISH',

  // otros
  'wacc':                    'WACC',
  'valor de la empresa (ve)':'EV',
  'valor de la empresa':     'EV',
  'gastos de capital':       'CAPEX',
  'depreciación y amortización': 'DA',
  'rotación de activos':     'ASSET_TURNOVER',
  'rendimiento de flujo de caja libre': 'FCF_YIELD',
  'rsi':                     'RSI_14',
  'rsi 14':                  'RSI_14',
  'sector':                  'SECTOR',
  'beneficio bruto / activos totales': 'GP_ASSETS',
  'propiedad, planta y equipo brutos': 'PPE',
  'efectivo neto (ben graham)':        'NET_CASH_GRAHAM',
  'crecimiento básico del bpa':        'EPS_CREC_ANUAL',
  'previsiones de bpa (investingpro)': 'EPS_FWD',
  'previsión de ingresos (investingpro)': 'REV_FWD',
  'margen de intereses minoritarios de los resultados': 'MIN_INT_MARGIN',
  'margen de gastos de capital':       'CAPEX_MARGIN',
};

// Detecta si una cadena parece un valor numérico (con sufijos B/M/K/%, x, etc.)
function _looksLikeValue(s) {
  if (!s) return false;
  // Eliminar paréntesis
  s = s.replace(/[()]/g, '').trim();
  return /^[\-\+]?[\d.,]+\s*[BMKTbmkt%]?x?$/i.test(s)
    || /^[\-\+]?\$?\s*[\d.,]+\s*[BMKTbmkt]?$/i.test(s)
    || /^[\d.,]+\s*x$/i.test(s);
}

// Normaliza valor con sufijos B/M/K a número
function _normalizeInvestingValue(s) {
  if (!s) return s;
  s = s.trim();
  // Quitar trailing 'x' para ratios — mantener como número
  var isRatio = /x$/i.test(s);
  var isPct   = /%$/.test(s);
  var clean   = s.replace(/[x%$]/gi, '').replace(/\s/g, '').replace(/,/g, '');
  var num     = parseFloat(clean);
  if (isNaN(num)) return s;
  // Convertir sufijos de magnitud
  if (/B$/i.test(s.replace(/[x%]/gi,'')))      num = num * 1000;  // B→ miles de M
  else if (/T$/i.test(s.replace(/[x%]/gi,''))) num = num * 1000000;
  else if (/K$/i.test(s.replace(/[x%]/gi,''))) num = num / 1000;
  else if (/M$/i.test(s.replace(/[x%]/gi,''))) { /* ya en M, OK */ }
  return num;
}

function parseTechData(raw){
  var d = {};
  var lines = raw.split('\n').map(function(l){ return l.trim(); }).filter(function(l){ return l && !l.startsWith('#'); });

  // Primero intentar formato clásico CLAVE: valor
  var foundClassic = false;
  for(var i=0; i<lines.length; i++){
    var line = lines[i];
    var idx  = line.indexOf(':');
    if(idx < 0) continue;
    var key = line.slice(0, idx).trim().toUpperCase().replace(/[^A-Z0-9_]/g,'_');
    var val = line.slice(idx+1).trim().replace(/\/\/.*$/, '').trim();
    if(val === '') continue;
    foundClassic = true;
    var n = parseFloat(val);
    if(!isNaN(n) && val.indexOf(',') === -1) d[key] = n;
    else d[key] = val;
  }

  // Si no se encontraron datos en formato clásico o falta PRECIO_ACTUAL,
  // intentar formato InvestingPro (nombre en una línea, valor en la siguiente)
  if (!d['PRECIO_ACTUAL'] && !d['PRECIO_PIVOTE']) {
    var skipHeaders = /^nombre\s+m[eé]trica|^m[eé]trica|^valor|^tendencia$/i;
    var filtered = lines.filter(function(l) { return !skipHeaders.test(l); });

    for (var j = 0; j < filtered.length; j++) {
      var metricName = filtered[j];

      // Saltar si la línea parece un valor
      if (_looksLikeValue(metricName)) continue;

      // Si la siguiente línea es un valor, tenemos un par
      if (j + 1 < filtered.length && _looksLikeValue(filtered[j + 1])) {
        var rawVal = filtered[j + 1];
        var lookupKey = metricName.toLowerCase().trim()
          .replace(/\u00a0/g, ' ')   // nbsp
          .replace(/\s+/g, ' ');
        var mappedKey = INVESTINGPRO_MAP[lookupKey];
        if (mappedKey) {
          var nVal = _normalizeInvestingValue(rawVal);
          d[mappedKey] = nVal;
        }
        // También guardar con clave genérica para el prompt de IA
        var genericKey = metricName.toUpperCase().replace(/[^A-Z0-9_ÁÉÍÓÚÑ]/g, '_').replace(/_+/g, '_');
        if (!d[genericKey]) {
          var nv2 = _normalizeInvestingValue(rawVal);
          d[genericKey] = nv2;
        }
        j++; // saltar la línea del valor
      }
    }
  }

  return d;
}

function tNum(d, key, def){ var v=d[key]; return typeof v==='number'?v:(def!==undefined?def:null); }
function tStr(d, key, def){ var v=d[key]; return typeof v==='string'?v.toLowerCase():(def||''); }
function fmtP(v){ return v!==null?v.toFixed(2):'N/E'; }
function fmtMoney(v){ return v!==null?'$'+v.toFixed(2):'N/E'; }
function fmtPct(v){ return v!==null?v.toFixed(1)+'%':'N/E'; }
function fmtX(v){ return v!==null?v.toFixed(2)+'x':'N/E'; }
function fmtN2(v,d){ return v!==null?v.toLocaleString('es',{minimumFractionDigits:d||0,maximumFractionDigits:d||0}):'N/E'; }

// ══════════════════════════════════════════
//  MOTOR DE CÁLCULO — 4 METODOLOGÍAS
// ══════════════════════════════════════════
function parse12M(d, key){
  var raw = d[key];
  if(raw == null) return null;
  var parts = String(raw).split(',').map(function(v){ return parseFloat(v.trim()); });
  var vals = parts.filter(function(v){ return !isNaN(v); });
  return vals.length ? vals : null;
}

// Construye series 12M: calcula ratios desde componentes crudos
// o usa valores directos si están disponibles
function buildSeries12m(d){
  function zip(a, b, fn){
    if(!a || !b) return null;
    var len = Math.min(a.length, b.length), out = [];
    for(var i=0; i<len; i++)
      out.push((a[i]!=null && b[i]!=null && b[i]!==0) ? fn(a[i],b[i]) : null);
    return out.some(function(v){ return v!==null; }) ? out : null;
  }
  var gn    = parse12M(d,'GANANCIAS_NETAS_12M');
  var at    = parse12M(d,'ACTIVOS_TOTALES_12M');
  var ing   = parse12M(d,'INGRESOS_12M');
  var ebitM = parse12M(d,'EBIT_12M');
  var pat   = parse12M(d,'PATRIMONIO_12M');
  var ofcM  = parse12M(d,'OFC_12M');
  var fcfM  = parse12M(d,'FCF_12M');
  var dnM   = parse12M(d,'DEUDA_NETA_12M');
  var roicM = parse12M(d,'ROIC_12M');
  var waccN = tNum(d,'WACC');

  var roa      = parse12M(d,'ROA_12M')           || zip(gn, at,    function(a,b){ return a/b*100; });
  var roe12    = parse12M(d,'ROE_12M')           || zip(gn, pat,   function(a,b){ return a/b*100; });
  var margenEb = parse12M(d,'MARGEN_EBIT_12M')  || zip(ebitM, ing, function(a,b){ return a/b*100; });
  var assetT   = parse12M(d,'ASSET_TURNOVER_12M')|| zip(ing, at,   function(a,b){ return a/b; });
  var ocfNI    = parse12M(d,'OCF_NETINCOME_12M') || zip(ofcM, gn,  function(a,b){ return a/b; });
  var fcfNI    = parse12M(d,'FCF_NETINCOME_12M') || zip(fcfM, gn,  function(a,b){ return a/b; });
  var dnFcf    = parse12M(d,'DN_FCF_12M')       || zip(dnM, fcfM,  function(a,b){ return a/b; });
  var roicWacc = parse12M(d,'ROIC_WACC_12M');
  if(!roicWacc && roicM && waccN !== null)
    roicWacc = roicM.map(function(r){ return r !== null ? r - waccN : null; });

  return {
    roa:          roa,
    roic:         roicM,
    roe:          roe12,
    croic:        parse12M(d,'CROIC_12M'),
    per:          parse12M(d,'PER_12M'),
    fcfYield:     parse12M(d,'FCF_YIELD_12M'),
    ccr:          parse12M(d,'CCR_12M'),
    assetTurnover:assetT,
    beneish:      parse12M(d,'BENEISH_12M'),
    ocfNI:        ocfNI,
    fcfNI:        fcfNI,
    dnFcf:        dnFcf,
    margenEbit:   margenEb,
    altman:       parse12M(d,'ALTMAN_12M'),
    piotroski:    parse12M(d,'PIOTROSKI_12M'),
    roicWacc:     roicWacc
  };
}

function calcTech(d){

  var precio   = tNum(d,'PRECIO_ACTUAL');
  var pivote   = tNum(d,'PRECIO_PIVOTE');
  var minPat   = tNum(d,'PRECIO_MIN_PATRON');
  var max52    = tNum(d,'PRECIO_MAX_52S');
  var min52    = tNum(d,'PRECIO_MIN_52S');
  var ma10     = tNum(d,'MA10');
  var ma20     = tNum(d,'MA20');
  var ma50     = tNum(d,'MA50');
  var ma200    = tNum(d,'MA200');
  var tendMA200= tStr(d,'TENDENCIA_MA200','');
  var volProm  = tNum(d,'VOLUMEN_PROMEDIO');
  var volHoy   = tNum(d,'VOLUMEN_HOY');
  var vcp1     = tNum(d,'VCP_CONTRACCION_1');
  var vcp2     = tNum(d,'VCP_CONTRACCION_2');
  var vcp3     = tNum(d,'VCP_CONTRACCION_3');
  var dTecho   = tNum(d,'DARVAS_TECHO');
  var dPiso    = tNum(d,'DARVAS_PISO');
  var dSemanas = tNum(d,'DARVAS_SEMANAS');
  var copaProf = tNum(d,'COPA_PROFUNDIDAD');
  var copaSem  = tNum(d,'COPA_SEMANAS');
  var handleSem= tNum(d,'HANDLE_SEMANAS');
  var avPrevio = tNum(d,'AVANCE_PREVIO');
  var consol   = tNum(d,'CONSOLIDACION_SEMANAS');
  var stopLoss = tNum(d,'STOP_LOSS');
  var obj1     = tNum(d,'PRECIO_OBJETIVO_1');
  var obj2     = tNum(d,'PRECIO_OBJETIVO_2');
  var accion   = d['ACCION'] || d['TICKER'] || 'Activo';
  var periodo  = d['PERIODO'] || 'Anual 2025';
  var moneda   = d['MONEDA'] || 'USD';

  // ─── Indicadores Técnicos Adicionales ───────────────────────────
  var rsi14    = tNum(d,'RSI_14');
  var macdVal  = tNum(d,'MACD');
  var macdSig  = tNum(d,'MACD_SIGNAL');
  var macdHist = tNum(d,'MACD_HIST');
  var bbSup    = tNum(d,'BB_SUPERIOR');
  var bbInf    = tNum(d,'BB_INFERIOR');
  var atr14    = tNum(d,'ATR_14');
  var rsLine   = tStr(d,'RS_LINE','');
  var sector   = d['SECTOR'] || '';
  var sectorTend = tStr(d,'SECTOR_TENDENCIA','');
  // ─── CANSLIM / Fundamentales ────────────────────────────────
  var epsQTrim = tNum(d,'EPS_CREC_TRIM');
  var epsAnual = tNum(d,'EPS_CREC_ANUAL');
  var ventasCr = tNum(d,'VENTAS_CRECIMIENTO');
  var roe      = tNum(d,'ROE');
  var instPct  = tNum(d,'INST_PCT');
  var floatAcc = tNum(d,'FLOAT_ACC');

  // ───────────────────────────────────────
  //  CONDICIONES COMUNES
  // ───────────────────────────────────────
  var volRatio = (volHoy && volProm) ? volHoy/volProm : null;
  var volOk    = volRatio !== null ? volRatio >= 1.4 : null;

  // Stage 2 (precio > MA50 > MA200 y MA200 subiendo)
  var stage2 = precio && ma50 && ma200
    ? (precio > ma50 && ma50 > ma200 && tendMA200.includes('subiendo'))
    : null;

  // Precio vs MAs
  var sobre10  = (precio && ma10)  ? precio > ma10  : null;
  var sobre20  = (precio && ma20)  ? precio > ma20  : null;
  var sobre50  = (precio && ma50)  ? precio > ma50  : null;
  var sobre200 = (precio && ma200) ? precio > ma200 : null;

  // Posición dentro del patrón (cuán cerca del pivote)
  var pctDePivote = (precio && pivote) ? ((pivote-precio)/pivote)*100 : null;
  var enZonaEntry = pctDePivote !== null ? pctDePivote >= 0 && pctDePivote <= 5 : null;

  // Distancia al stop
  var riesgo_pct = (precio && stopLoss) ? ((precio-stopLoss)/precio)*100 : null;

  // R:R a objetivo 1
  var recompensa1_pct = (precio && obj1) ? ((obj1-precio)/precio)*100 : null;
  var rr1 = (recompensa1_pct && riesgo_pct) ? recompensa1_pct/riesgo_pct : null;

  // R:R a objetivo 2
  var recompensa2_pct = (precio && obj2) ? ((obj2-precio)/precio)*100 : null;
  var rr2 = (recompensa2_pct && riesgo_pct) ? recompensa2_pct/riesgo_pct : null;

  // ───────────────────────────────────────
  //  INDICADORES TÉCNICOS ADICIONALES
  // ───────────────────────────────────────
  // RSI
  var rsiZone = null, rsiOk = null;
  if(rsi14 !== null){
    if(rsi14 < 30)       { rsiZone = 'Sobreventa';      rsiOk = null;  }
    else if(rsi14 <= 70) { rsiZone = 'Zona saludable';  rsiOk = true;  }
    else if(rsi14 <= 80) { rsiZone = 'Momentum fuerte'; rsiOk = true;  }
    else                 { rsiZone = 'Sobrecompra';     rsiOk = false; }
  }
  // MACD
  var macdBull = (macdVal !== null && macdSig !== null) ? macdVal > macdSig : null;
  var macdHPos = macdHist !== null ? macdHist > 0 : null;
  // Bollinger Bands
  var bbRange = null, bbSqueeze = null, bbPct = null;
  if(bbSup && bbInf && precio){
    bbRange   = ((bbSup - bbInf) / precio) * 100;
    bbSqueeze = bbRange < 8;
    bbPct     = ((precio - bbInf) / (bbSup - bbInf)) * 100;
  }
  // ATR
  var stopAtr = null, riesgoAtr = null;
  if(atr14 && precio){ stopAtr = precio - 1.5*atr14; riesgoAtr = (atr14*1.5/precio)*100; }
  // RS Line & Sector
  var rsLineOk  = rsLine ? rsLine.includes('subiendo') : null;
  var sectorOk  = sectorTend ? (sectorTend.includes('fuerte')||sectorTend.includes('positiv')||sectorTend.includes('alcist')) : null;
  // CANSLIM checks
  var epsQOk   = epsQTrim !== null ? epsQTrim >= 25 : null;
  var epsAOk   = epsAnual !== null ? epsAnual >= 15 : null;
  var ventasOk = ventasCr !== null ? ventasCr >= 20 : null;
  var roeOk    = roe      !== null ? roe      >= 17 : null;
  var instOk   = instPct  !== null ? instPct  >= 30 : null;
  var canslimChecks = [
    { cond:epsQOk,   label:'Crecim. EPS trimestral ≥25% (CANSLIM — "E")',          val: epsQTrim !==null ? epsQTrim+'%'  : 'N/E' },
    { cond:epsAOk,   label:'Crecim. EPS anual ≥15% (CANSLIM — "E" anual)',         val: epsAnual !==null ? epsAnual+'%'  : 'N/E' },
    { cond:ventasOk, label:'Crecim. ventas ≥20% (CANSLIM — "C/A")',               val: ventasCr !==null ? ventasCr+'%'  : 'N/E' },
    { cond:roeOk,    label:'ROE ≥17% — calidad del negocio (CANSLIM — "A")',      val: roe      !==null ? roe+'%'       : 'N/E' },
    { cond:instOk,   label:'Propiedad institucional ≥30% (CANSLIM — "I")',         val: instPct  !==null ? instPct+'%'   : 'N/E' },
    { cond:rsLineOk, label:'RS Line vs índice en ascenso (CANSLIM — "R")',         val: rsLine   || 'N/E' },
    { cond:sectorOk, label:'Sector en liderazgo de mercado (CANSLIM — "L")',       val: sectorTend|| 'N/E' },
  ];
  var canslimScore = canslimChecks.filter(function(ch){ return ch.cond===true;  }).length;
  var canslimTotal = canslimChecks.filter(function(ch){ return ch.cond!==null; }).length;

  // ───────────────────────────────────────
  //  1. MINERVINI — VCP
  // ───────────────────────────────────────
  var vcp = (function(){
    var checks = [];
    var score  = 0;

    // a) Stage 2
    checks.push({ cond: stage2, label:'Stage 2 activo (precio > MA50 > MA200, MA200 subiendo)',
      detalle: stage2 ? '✓ Precio '+fmtMoney(precio)+' > MA50 '+fmtMoney(ma50)+' > MA200 '+fmtMoney(ma200) : 'No confirmado' });
    if(stage2) score++;

    // b) Contracciones progresivas (decrecientes)
    var controkOk = false;
    if(vcp1 !== null && vcp2 !== null){
      if(vcp3 !== null){
        controkOk = (vcp1 > vcp2) && (vcp2 > vcp3) && (vcp3 <= 8);
      } else {
        controkOk = (vcp1 > vcp2) && (vcp2 <= 12);
      }
    }
    checks.push({ cond: controkOk,
      label:'Contracciones progresivamente menores (VCP)',
      detalle: vcp1!==null ? (vcp1+'% → '+(vcp2||'N/E')+'% → '+(vcp3||'N/E')+'%') : 'No ingresado' });
    if(controkOk) score++;

    // c) Última contracción ≤ 8%
    var ultContr = vcp3 || vcp2;
    var ultOk = ultContr !== null ? ultContr <= 8 : null;
    checks.push({ cond: ultOk, label:'Última contracción ≤ 8% (pivote ajustado)',
      detalle: ultContr!==null ? ultContr+'%' : 'N/E' });
    if(ultOk) score++;

    // d) Volumen expandido en el breakout (≥40%)
    checks.push({ cond: volOk, label:'Volumen breakout ≥ 140% del promedio',
      detalle: volRatio!==null ? (volRatio*100).toFixed(0)+'% del promedio ('+fmtN2(volHoy)+' vs avg '+fmtN2(volProm)+')' : 'N/E' });
    if(volOk) score++;

    // e) Precio cerca del pivote (≤5% por debajo)
    checks.push({ cond: enZonaEntry, label:'Precio en zona de entry (≤5% bajo el pivote)',
      detalle: pctDePivote!==null ? fmtPct(pctDePivote)+' del pivote '+fmtMoney(pivote) : 'N/E' });
    if(enZonaEntry) score++;

    // Punto de entrada VCP: precio del pivote
    var entry = pivote || precio;
    var stopV = minPat || (stopLoss || (entry * 0.96));
    var riesgoV = ((entry-stopV)/entry)*100;

    var total = 5;
    var signal = score >= 4 ? '🟢' : score >= 2 ? '🟡' : '🔴';
    var cls    = score >= 4 ? 'active' : score >= 2 ? 'warn' : 'bad';
    return { checks, score, total, signal, cls, entry, stop: stopV, riesgo_pct: riesgoV,
      nombre: 'Volatility Contraction Pattern (VCP)', corto: 'Minervini VCP' };
  })();

  // ───────────────────────────────────────
  //  2. KULLAMAGI — Moving Average Breakout
  // ───────────────────────────────────────
  var kulla = (function(){
    var checks = [];
    var score  = 0;

    // a) Avance previo ≥ 30%
    var avOk = avPrevio !== null ? avPrevio >= 30 : null;
    checks.push({ cond: avOk, label:'Avance previo ≥ 30% antes de la consolidación',
      detalle: avPrevio!==null ? avPrevio+'%' : 'N/E' });
    if(avOk) score++;

    // b) Precio sobre MA10 y MA20 (soporte de las medias)
    checks.push({ cond: sobre10, label:'Precio sobre MA10 (soporte dinámico)',
      detalle: ma10!==null ? fmtMoney(precio)+' vs MA10 '+fmtMoney(ma10) : 'N/E' });
    if(sobre10) score++;
    checks.push({ cond: sobre20, label:'Precio sobre MA20',
      detalle: ma20!==null ? fmtMoney(precio)+' vs MA20 '+fmtMoney(ma20) : 'N/E' });
    if(sobre20) score++;

    // c) MA20 sobre MA50
    var ordenMAs = (ma20 && ma50) ? ma20 > ma50 : null;
    checks.push({ cond: ordenMAs, label:'MA20 > MA50 (orden alcista de medias)',
      detalle: ma20&&ma50 ? fmtMoney(ma20)+' > '+fmtMoney(ma50) : 'N/E' });
    if(ordenMAs) score++;

    // d) Consolidación de 1–8 semanas
    var consolOk = consol !== null ? (consol >= 1 && consol <= 8) : null;
    checks.push({ cond: consolOk, label:'Consolidación entre 1 y 8 semanas',
      detalle: consol!==null ? consol+' semanas' : 'N/E' });
    if(consolOk) score++;

    // e) Volumen expandido
    checks.push({ cond: volOk, label:'Volumen breakout ≥ 140% del promedio',
      detalle: volRatio!==null ? (volRatio*100).toFixed(0)+'%' : 'N/E' });
    if(volOk) score++;

    var entry  = pivote || precio;
    var stopK  = stopLoss || ma20 || (entry * 0.97);
    var riesgoK= ((entry-stopK)/entry)*100;

    var total  = 6;
    var signal = score >= 5 ? '🟢' : score >= 3 ? '🟡' : '🔴';
    var cls    = score >= 5 ? 'active' : score >= 3 ? 'warn' : 'bad';
    return { checks, score, total, signal, cls, entry, stop: stopK, riesgo_pct: riesgoK,
      nombre: 'Moving Average Breakout System', corto: 'Kullamagi MA' };
  })();

  // ───────────────────────────────────────
  //  3. DARVAS — Box System
  // ───────────────────────────────────────
  var darvas = (function(){
    var checks = [];
    var score  = 0;

    // a) Nuevo máximo 52 semanas reciente
    var max52Ok = (precio && max52) ? precio >= max52 * 0.85 : null;
    checks.push({ cond: max52Ok, label:'Precio en zona de máximos de 52 semanas (≥85% del máx)',
      detalle: max52!==null ? fmtMoney(precio)+' vs máx52 '+fmtMoney(max52) : 'N/E' });
    if(max52Ok) score++;

    // b) Caja definida (techo y piso)
    var cajaOk = (dTecho && dPiso) ? true : false;
    checks.push({ cond: cajaOk, label:'Caja de Darvas definida (techo y piso)',
      detalle: cajaOk ? 'Techo: '+fmtMoney(dTecho)+' · Piso: '+fmtMoney(dPiso) : 'No ingresado' });
    if(cajaOk) score++;

    // c) Amplitud de la caja ≤ 15%
    var cajaPct = (dTecho && dPiso) ? ((dTecho-dPiso)/dTecho)*100 : null;
    var cajaAngosta = cajaPct !== null ? cajaPct <= 15 : null;
    checks.push({ cond: cajaAngosta, label:'Amplitud de la caja ≤ 15% (bien definida)',
      detalle: cajaPct!==null ? cajaPct.toFixed(1)+'%' : 'N/E' });
    if(cajaAngosta) score++;

    // d) Formación ≥ 3 semanas
    var semOk = dSemanas !== null ? dSemanas >= 3 : null;
    checks.push({ cond: semOk, label:'Caja formada desde hace ≥ 3 semanas',
      detalle: dSemanas!==null ? dSemanas+' semanas' : 'N/E' });
    if(semOk) score++;

    // e) Precio cerca o sobre el techo
    var sobreTecho = (precio && dTecho) ? precio >= dTecho * 0.98 : null;
    checks.push({ cond: sobreTecho, label:'Precio en zona del techo / breakout (≥98% del techo)',
      detalle: precio&&dTecho ? fmtMoney(precio)+' vs techo '+fmtMoney(dTecho) : 'N/E' });
    if(sobreTecho) score++;

    // f) Volumen confirmación
    checks.push({ cond: volOk, label:'Expansión de volumen en el breakout',
      detalle: volRatio!==null ? (volRatio*100).toFixed(0)+'%' : 'N/E' });
    if(volOk) score++;

    var entry = dTecho || pivote || precio;
    var stopD = dPiso || stopLoss || (entry * 0.93);
    var riesgoD = ((entry-stopD)/entry)*100;

    var total  = 6;
    var signal = score >= 5 ? '🟢' : score >= 3 ? '🟡' : '🔴';
    var cls    = score >= 5 ? 'active' : score >= 3 ? 'warn' : 'bad';
    return { checks, score, total, signal, cls, entry, stop: stopD, riesgo_pct: riesgoD,
      nombre: 'Box System de Darvas', corto: 'Darvas Box' };
  })();

  // ───────────────────────────────────────
  //  4. O'NEILL — Cup & Handle
  // ───────────────────────────────────────
  var oneill = (function(){
    var checks = [];
    var score  = 0;

    // a) Copa: profundidad 12–33%
    var copaOk = copaProf !== null ? (copaProf >= 12 && copaProf <= 33) : null;
    checks.push({ cond: copaOk, label:'Profundidad de copa entre 12% y 33%',
      detalle: copaProf!==null ? copaProf+'%' : 'N/E' });
    if(copaOk) score++;

    // b) Copa: duración 7–65 semanas
    var copaT = copaSem !== null ? (copaSem >= 7 && copaSem <= 65) : null;
    checks.push({ cond: copaT, label:'Copa formada entre 7 y 65 semanas',
      detalle: copaSem!==null ? copaSem+' semanas' : 'N/E' });
    if(copaT) score++;

    // c) Handle: 1–5 semanas en la parte alta
    var handleOk = handleSem !== null ? (handleSem >= 1 && handleSem <= 5) : null;
    checks.push({ cond: handleOk, label:'Asa/Handle formada entre 1 y 5 semanas',
      detalle: handleSem!==null ? handleSem+' semanas' : 'N/E' });
    if(handleOk) score++;

    // d) Avance previo ≥ 30%
    var avOk = avPrevio !== null ? avPrevio >= 30 : null;
    checks.push({ cond: avOk, label:'Avance previo antes de la copa ≥ 30%',
      detalle: avPrevio!==null ? avPrevio+'%' : 'N/E' });
    if(avOk) score++;

    // e) Precio sobre MA200
    checks.push({ cond: sobre200, label:'Precio sobre MA200 (tendencia alcista de largo plazo)',
      detalle: ma200!==null ? fmtMoney(precio)+' vs MA200 '+fmtMoney(ma200) : 'N/E' });
    if(sobre200) score++;

    // f) Volumen en el breakout del pivote
    checks.push({ cond: volOk, label:'Volumen breakout ≥ 150% del promedio',
      detalle: volRatio!==null ? (volRatio*100).toFixed(0)+'%' : 'N/E' });
    if(volOk) score++;

    var entry = pivote || precio;
    var stopO = stopLoss || (ma50 ? ma50 : entry*0.92);
    var riesgoO = ((entry-stopO)/entry)*100;

    var total  = 6;
    var signal = score >= 5 ? '🟢' : score >= 3 ? '🟡' : '🔴';
    var cls    = score >= 5 ? 'active' : score >= 3 ? 'warn' : 'bad';
    return { checks, score, total, signal, cls, entry, stop: stopO, riesgo_pct: riesgoO,
      nombre: 'Cup & Handle de O\'Neill', corto: 'O\'Neill C&H' };
  })();

  // ───────────────────────────────────────
  //  CONFLUENCIA
  // ───────────────────────────────────────
  var methods = [vcp, kulla, darvas, oneill];
  var verdes  = methods.filter(function(m){ return m.signal==='🟢'; }).length;
  var amarillos = methods.filter(function(m){ return m.signal==='🟡'; }).length;
  var rojos   = methods.filter(function(m){ return m.signal==='🔴'; }).length;
  var confScore = verdes*2 + amarillos;
  var confPct  = Math.round(confScore / (methods.length*2) * 100);

  // Mejor entry: promedio ponderado de entradas de métodos verdes/amarillos
  var activeMethods = methods.filter(function(m){ return m.signal !== '🔴'; });
  var bestEntry = activeMethods.length > 0
    ? activeMethods.reduce(function(s,m){ return s+m.entry; },0)/activeMethods.length
    : (pivote||precio);
  bestEntry = bestEntry || precio;

  var bestStop     = stopLoss || Math.min.apply(null, activeMethods.map(function(m){ return m.stop; }).concat([(precio||0)*0.93]));
  var riesgoFinal  = ((bestEntry-bestStop)/bestEntry)*100;
  var reward1Final = obj1 ? ((obj1-bestEntry)/bestEntry)*100 : null;
  var reward2Final = obj2 ? ((obj2-bestEntry)/bestEntry)*100 : null;
  var rr1Final     = (reward1Final&&riesgoFinal) ? reward1Final/riesgoFinal : null;
  var rr2Final     = (reward2Final&&riesgoFinal) ? reward2Final/riesgoFinal : null;

  return {
    accion, periodo, moneda,
    precio, pivote, minPat, max52, min52,
    ma10, ma20, ma50, ma200, tendMA200,
    volProm, volHoy, volRatio, volOk,
    stage2, sobre50, sobre200,
    pctDePivote, enZonaEntry,
    riesgo_pct, recompensa1_pct, recompensa2_pct, rr1, rr2,
    stopLoss: stopLoss||bestStop, obj1, obj2,
    vcp, kulla, darvas, oneill,
    methods, verdes, amarillos, rojos, confScore, confPct,
    bestEntry, bestStop, riesgoFinal, reward1Final, reward2Final, rr1Final, rr2Final,
    copaProf, copaSem, handleSem, avPrevio, consol,
    vcp1, vcp2, vcp3,
    dTecho, dPiso, dSemanas,
    rsi14, rsiZone, rsiOk,
    macdVal, macdSig, macdHist, macdBull, macdHPos,
    bbSup, bbInf, bbRange, bbSqueeze, bbPct,
    atr14, stopAtr, riesgoAtr,
    rsLine, rsLineOk, sector, sectorTend, sectorOk,
    epsQTrim, epsQOk, epsAnual, epsAOk,
    ventasCr, ventasOk, roe, roeOk, instPct, instOk, floatAcc,
    canslimChecks, canslimScore, canslimTotal,
    series12m: buildSeries12m(d)
  };
}

// ══════════════════════════════════════════
//  GENERADOR DE OPINIÓN AUTOMÁTICA
// ══════════════════════════════════════════
function generarOpinion(c){
  var verdes = c.verdes;
  var score  = c.confPct;
  var activo = c.accion;
  var precio = c.precio;
  var metodos = c.methods.filter(function(m){ return m.signal==='🟢'; }).map(function(m){ return m.corto; });

  // Veredicto
  var veredicto, vClass, vIcon;
  if(verdes >= 3 && score >= 70){
    veredicto = 'BREAKOUT CONFIRMADO — ENTRADA DE ALTA CONFIANZA';
    vClass = 'v-buy'; vIcon = '✅';
  } else if(verdes >= 2 || score >= 45){
    veredicto = 'ZONA DE VIGILANCIA — ESPERAR CONFIRMACIÓN';
    vClass = 'v-wait'; vIcon = '⏳';
  } else {
    veredicto = 'SIN CONFLUENCIA SUFICIENTE — MANTENERSE AFUERA';
    vClass = 'v-avoid'; vIcon = '⛔';
  }

  // Párrafos de análisis
  var parrafos = [];

  // Tendencia
  if(c.stage2){
    parrafos.push('<p>El activo <strong>'+activo+'</strong> opera actualmente en <strong>Stage 2 (fase alcista)</strong>, con el precio por encima de la MA50 y MA200, y la media de 200 días en tendencia ascendente. Este es el filtro más crítico para cualquiera de los 4 sistemas analizados.</p>');
  } else if(c.sobre200){
    parrafos.push('<p><strong>'+activo+'</strong> opera sobre su MA200, pero aún no cumple completamente con el Stage 2 de Minervini (se requiere MA50 > MA200 y tendencia ascendente). Hay base alcista pero el momento no es óptimo.</p>');
  } else {
    parrafos.push('<p><strong>'+activo+'</strong> no opera sobre su MA200. Ninguno de los sistemas legendarios recomienda entradas en activos debajo de esta media. El riesgo de operar en tendencia bajista es estructuralmente elevado.</p>');
  }

  // Confluencia de metodologías
  if(metodos.length > 0){
    parrafos.push('<p>Se identificó confluencia positiva en <strong>'+metodos.length+' de 4 metodologías</strong>: '+metodos.join(', ')+'. La confluencia de sistemas independientes reduce significativamente la probabilidad de falsa señal.</p>');
  } else {
    parrafos.push('<p>Ninguna de las 4 metodologías arroja señal verde en este momento. Antes de operar, el activo debe cumplir al menos las condiciones de una metodología de forma completa.</p>');
  }

  // VCP específico
  if(c.vcp.signal === '🟢'){
    var contrStr = [c.vcp1, c.vcp2, c.vcp3].filter(function(v){ return v!==null; }).map(function(v){ return v+'%'; }).join(' → ');
    parrafos.push('<p>El <strong>VCP de Minervini</strong> muestra contracciones progresivas '+contrStr+', con la última aprieta por debajo del umbral del 8%. Este patrón históricamente precede movimientos de 30–100%+ cuando se combina con expansión de volumen.</p>');
  }

  // Darvas
  if(c.darvas.signal === '🟢'){
    parrafos.push('<p>La <strong>Caja de Darvas</strong> está bien definida entre '+fmtMoney(c.dPiso)+' y '+fmtMoney(c.dTecho)+', con '+(c.dSemanas||'N/E')+' semanas de consolidación. Darvas operaba exclusivamente breakouts de cajas con gran expansión de volumen, señal de acumulación institucional.</p>');
  }

  // Kullamagi
  if(c.kulla.signal === '🟢'){
    parrafos.push('<p>El sistema de <strong>Kullamagi</strong> confirma un avance previo de '+fmtPct(c.avPrevio)+' con consolidación ordenada. Las medias móviles de 10 y 20 días actúan como soporte dinámico, indicando manos fuertes sosteniendo el precio.</p>');
  }

  // O'Neill
  if(c.oneill.signal === '🟢'){
    parrafos.push('<p>El patr\u00f3n <strong>Cup &amp; Handle de O\'Neill</strong> cumple con profundidad de copa del '+fmtPct(c.copaProf)+' (rango \u00f3ptimo 12\u201333%), formaci\u00f3n de '+(c.copaSem||'N/E')+' semanas y asa de '+(c.handleSem||'N/E')+' semanas. O\'Neill identific\u00f3 este como el patr\u00f3n de mayor \u00e9xito hist\u00f3rico en los mejores ganadores del mercado.</p>');
  }

  // Volumen
  if(c.volRatio !== null){
    if(c.volRatio >= 1.5){
      parrafos.push('<p>El volumen del día de breakout alcanza el <strong>'+(c.volRatio*100).toFixed(0)+'% del promedio</strong>, superando holgadamente el mínimo del 140% requerido por todos los sistemas. Esto confirma participación institucional activa.</p>');
    } else if(c.volRatio >= 1.2){
      parrafos.push('<p>El volumen está por encima del promedio ('+(c.volRatio*100).toFixed(0)+'%) pero no alcanza el mínimo ideal del 140–150%. Los breakouts sin suficiente volumen tienen mayor probabilidad de ser falsos.</p>');
    } else {
      parrafos.push('<p>⚠️ El volumen es <strong>inferior al promedio</strong>, lo que es una señal de alerta. Todos los sistemas legendarios requieren expansión de volumen para validar un breakout. Sin ella, el riesgo de false breakout es muy alto.</p>');
    }
  }

  // Riesgo/Recompensa
  if(c.rr1Final !== null){
    if(c.rr1Final >= 3){
      parrafos.push('<p>El ratio Riesgo:Recompensa de <strong>1:'+c.rr1Final.toFixed(1)+'</strong> al objetivo 1 es excelente — superior al mínimo de 1:3 que utilizan estos traders. Incluso con una tasa de éxito del 40%, la ecuación matemática genera retornos positivos.</p>');
    } else if(c.rr1Final >= 2){
      parrafos.push('<p>El ratio R:R de 1:'+c.rr1Final.toFixed(1)+' es aceptable, aunque los mejores setups de Minervini y Kullamagi apuntan a 1:5 mínimo. Considerar si el objetivo puede ampliarse o si el stop puede ajustarse.</p>');
    } else {
      parrafos.push('<p>⚠️ El ratio R:R de 1:'+c.rr1Final.toFixed(1)+' es bajo. Estos traders trabajan con expectativa matemática positiva: sin al menos 1:2, no vale el riesgo vs capacidad de pérdida del capital.</p>');
    }
  }

  return {
    parrafos: parrafos,
    veredicto: veredicto,
    vClass: vClass,
    vIcon: vIcon,
    score: score
  };
}

// ══════════════════════════════════════════
//  SVG HELPERS (compatibles con los de app.js)
// ══════════════════════════════════════════
function tsvgLevelChart(precio, pivote, stop, obj1, obj2, minPat){
  var W=560,H=220,padL=90,padR=40,padT=16,padB=20;
  var vals=[precio,pivote,stop,obj1,obj2,minPat].filter(function(v){ return v!==null&&v!==undefined&&!isNaN(v); });
  if(!vals.length) return '';
  var mn=Math.min.apply(null,vals)*0.98, mx=Math.max.apply(null,vals)*1.015;
  var ys=function(v){ return padT+(1-(v-mn)/(mx-mn))*(H-padT-padB); };
  var out='';

  function hLine(v, color, label, dash, bold){
    if(v===null||isNaN(v)) return;
    var y=ys(v), sw=bold?2.5:1.5;
    out+='<line x1="'+padL+'" y1="'+y+'" x2="'+(W-padR)+'" y2="'+y+'" stroke="'+color+'" stroke-width="'+sw+'" '+(dash?'stroke-dasharray="6 4"':'')+'/>';
    out+='<text x="'+(padL-6)+'" y="'+(y+4)+'" fill="'+color+'" font-size="10" font-family="Space Mono,monospace" text-anchor="end" font-weight="'+(bold?700:400)+'">$'+v.toFixed(2)+'</text>';
    out+='<text x="'+(W-padR+6)+'" y="'+(y+4)+'" fill="'+color+'" font-size="9" font-family="Inter,sans-serif">'+label+'</text>';
  }

  // Zona de riesgo (stop → precio)
  if(stop&&precio){
    var yP=ys(precio), yS=ys(stop);
    out+='<rect x="'+padL+'" y="'+yP+'" width="'+(W-padL-padR)+'" height="'+(yS-yP)+'" fill="rgba(239,68,68,.08)"/>';
  }
  // Zona de recompensa (precio → obj1)
  if(obj1&&precio){
    var yP2=ys(precio), yO=ys(obj1);
    out+='<rect x="'+padL+'" y="'+yO+'" width="'+(W-padL-padR)+'" height="'+(yP2-yO)+'" fill="rgba(34,197,94,.07)"/>';
  }

  hLine(stop,   '#ef4444', 'STOP LOSS', false, false);
  hLine(minPat, '#f59e0b', 'Min patrón', true,  false);
  hLine(precio, '#5A9BFF', 'PRECIO ACTUAL', false, true);
  hLine(pivote, '#F2CC6E', 'PIVOTE / ENTRY', false, true);
  if(obj1) hLine(obj1,  '#22c55e', 'OBJETIVO 1', false, false);
  if(obj2) hLine(obj2,  '#4ade80', 'OBJETIVO 2', true,  false);

  // Eje izquierdo
  for(var i=0;i<=4;i++){
    var yg=padT+i/4*(H-padT-padB);
    var vg=mn+(1-i/4)*(mx-mn);
    out+='<line x1="'+padL+'" y1="'+yg+'" x2="'+(W-padR)+'" y2="'+yg+'" stroke="rgba(90,155,255,.07)" stroke-width="1"/>';
    out+='<text x="'+(padL-6)+'" y="'+(yg+4)+'" fill="rgba(90,155,255,.3)" font-size="8" font-family="Space Mono,monospace" text-anchor="end">'+vg.toFixed(0)+'</text>';
  }

  return '<svg viewBox="0 0 '+W+' '+H+'" width="100%" style="display:block">'+out+'</svg>';
}

function tsvgRRBar(riesgo, reward1, reward2){
  if(!riesgo) return '';
  var W=560,H=90,padL=80,padR=20,padT=12;
  var total = Math.max(riesgo, reward1||0, reward2||0)*1.1;
  var out='';
  var bH=16,gap=10;

  function bar(y,val,col,lbl){
    if(!val) return;
    var bw=(val/total)*(W-padL-padR);
    out+='<text x="'+(padL-6)+'" y="'+(y+bH/2+4)+'" fill="#6A829E" font-size="9" font-family="Inter,sans-serif" text-anchor="end">'+lbl+'</text>';
    out+='<rect x="'+padL+'" y="'+y+'" width="'+(W-padL-padR)+'" height="'+bH+'" rx="3" fill="rgba(90,155,255,.08)"/>';
    out+='<rect x="'+padL+'" y="'+y+'" width="'+bw+'" height="'+bH+'" rx="3" fill="'+col+'"/>';
    out+='<text x="'+(padL+bw+6)+'" y="'+(y+bH/2+4)+'" fill="'+col+'" font-size="10" font-family="Space Mono,monospace" font-weight="700">'+val.toFixed(1)+'%</text>';
  }

  bar(padT,           riesgo,  '#ef4444','Riesgo');
  if(reward1) bar(padT+bH+gap,  reward1, '#22c55e','Obj 1');
  if(reward2) bar(padT+bH*2+gap*2, reward2, '#4ade80','Obj 2');

  return '<svg viewBox="0 0 '+W+' '+H+'" width="100%" style="display:block">'+out+'</svg>';
}

function tsvgConfluenciaRadar(methods){
  var n=methods.length;
  var cx=130,cy=130,R=95,ri=40;
  var angle=function(i){ return -Math.PI/2+(2*Math.PI/n)*i; };
  var pt=function(r,i){ return [cx+r*Math.cos(angle(i)),cy+r*Math.sin(angle(i))]; };
  var out='';

  for(var l=1;l<=4;l++){
    var r=R*(l/4);
    var pts=[];
    for(var i2=0;i2<n;i2++) pts.push(pt(r,i2));
    out+='<polygon points="'+pts.map(function(p){ return p.join(','); }).join(' ')+'" fill="'+(l===4?'rgba(90,155,255,.04)':'none')+'" stroke="rgba(90,155,255,.15)" stroke-width="1"/>';
  }
  for(var i3=0;i3<n;i3++){
    var ep=pt(R,i3);
    out+='<line x1="'+cx+'" y1="'+cy+'" x2="'+ep[0]+'" y2="'+ep[1]+'" stroke="rgba(90,155,255,.15)" stroke-width="1"/>';
  }

  var vals=methods.map(function(m){ return m.score/m.total; });
  var dataPts=vals.map(function(v,i){ return pt(R*Math.min(v,1),i); });
  out+='<polygon points="'+dataPts.map(function(p){ return p.join(','); }).join(' ')+'" fill="#5A9BFF" fill-opacity=".2" stroke="#5A9BFF" stroke-width="2"/>';

  methods.forEach(function(m,i){
    var vPt=dataPts[i];
    var bc=m.signal==='🟢'?'#22c55e':m.signal==='🟡'?'#f59e0b':'#ef4444';
    out+='<circle cx="'+vPt[0]+'" cy="'+vPt[1]+'" r="5" fill="'+bc+'" stroke="#080E1A" stroke-width="1.5"/>';
    var lPt=pt(R+30,i);
    out+='<text x="'+lPt[0]+'" y="'+(lPt[1]+4)+'" text-anchor="middle" fill="#B8CEEA" font-size="9" font-family="Inter,sans-serif" font-weight="600">'+m.corto.split(' ')[0]+'</text>';
    var pctTxt=Math.round(m.score/m.total*100)+'%';
    out+='<text x="'+vPt[0]+'" y="'+(vPt[1]-8)+'" text-anchor="middle" fill="'+bc+'" font-size="8" font-family="Space Mono,monospace" font-weight="700">'+pctTxt+'</text>';
  });
  out+='<circle cx="'+cx+'" cy="'+cy+'" r="3" fill="#5A9BFF"/>';

  return '<svg viewBox="0 0 260 260" width="240" height="240">'+out+'</svg>';
}

// ══════════════════════════════════════════
//  TABLA DE SEÑALES POR INDICADOR
// ══════════════════════════════════════════
function buildSnapTable(c){
  var pr = c.precio;
  function pd(a,b){ return (a&&b)?((a-b)/b*100):null; }
  function ps(v){ return v!==null?(v>0?'+':'')+v.toFixed(1)+'%':'—'; }

  // Fila de grupo separador
  function grp(lbl){
    return '<tr class="tsi-grp"><td colspan="4">'+lbl+'</td></tr>';
  }
  // Fila de indicador: categoria, nombre, valor, cls
  var n=0;
  function row(nombre, valor, cls, bueno){
    n++;
    var num=(n<10?'0':'')+n;
    return '<tr class="tsi-row">'
      +'<td class="tsi-n">'+num+'</td>'
      +'<td class="tsi-nm">'+nombre+'</td>'
      +'<td class="tsi-v tsi-'+cls+'"><span class="tsi-dot tsi-dot--'+cls+'"></span>'+valor+'</td>'
      +'<td class="tsi-ok">'+bueno+'</td>'
      +'</tr>';
  }

  var rows = '';

  // ── TENDENCIA ──
  rows += grp('Tendencia');
  if(c.stage2!==null) rows += row('Stage 2', c.stage2?'Activo':'Inactivo', c.stage2?'g':'r', 'Precio > MA50 > MA200 ↑');
  if(pr&&c.ma200){ var v=pd(pr,c.ma200); rows += row('Precio vs MA 200', ps(v), v>=0?'g':'r', 'Precio > MA200'); }
  if(pr&&c.ma50) { var v=pd(pr,c.ma50);  rows += row('Precio vs MA 50',  ps(v), v>=0?'g':'r', 'Precio > MA50');  }
  if(pr&&c.ma20) { var v=pd(pr,c.ma20);  rows += row('Precio vs MA 20',  ps(v), v>=0?'g':'r', 'Precio > MA20');  }
  if(pr&&c.ma10) { var v=pd(pr,c.ma10);  rows += row('Precio vs MA 10',  ps(v), v>=0?'g':'r', 'Precio > MA10');  }
  if(c.tendMA200) rows += row('MA200 Pendiente', c.tendMA200, c.tendMA200.includes('subiendo')?'g':c.tendMA200.includes('lateral')?'a':'r', 'Subiendo');
  if(pr&&c.pivote){ var v=pd(pr,c.pivote); rows += row('vs Pivote / Entry', ps(v), Math.abs(v)<=5?'a':(v<0?'g':'r'), '0–5% bajo pivote'); }

  // ── VOLUMEN ──
  rows += grp('Volumen');
  if(c.volRatio!==null) rows += row('Breakout Volumen', (c.volRatio*100).toFixed(0)+'%', c.volOk?'g':'r', '≥ 140% del promedio');
  if(c.volHoy)          rows += row('Volumen Hoy', fmtN2(c.volHoy,0), c.volOk?'g':'r', 'Mayor al promedio');
  if(c.volProm)         rows += row('Promedio 50d', fmtN2(c.volProm,0), 'n', 'Referencia');

  // ── MOMENTUM ──
  rows += grp('Momentum');
  if(c.rsi14!==null)    rows += row('RSI (14)', c.rsi14.toFixed(1)+(c.rsiZone?' · '+c.rsiZone:''), c.rsiOk===true?'g':c.rsiOk===false?'r':'a', '30–80');
  if(c.macdVal!==null)  rows += row('MACD', c.macdBull?'Alcista':'Bajista', c.macdBull?'g':'r', 'MACD > Signal');
  if(c.macdHist!==null) rows += row('Histograma MACD', c.macdHist.toFixed(3), c.macdHPos?'g':'r', '> 0');

  // ── VOLATILIDAD ──
  rows += grp('Volatilidad');
  if(c.atr14!==null)           rows += row('ATR (14)', '$'+c.atr14.toFixed(2), 'n', 'Referencia');
  if(c.stopAtr)                rows += row('Stop 1.5 × ATR', '$'+c.stopAtr.toFixed(2), 'n', 'Nivel de stop sugerido');
  if(c.bbPct!==null)           rows += row('Bollinger %B', c.bbPct.toFixed(0)+'%', c.bbPct>80?'r':c.bbPct>50?'g':'a', '50–80%');
  if(c.bbSqueeze!==undefined)  rows += row('BB Squeeze', c.bbSqueeze?'Sí':'No', c.bbSqueeze?'g':'n', 'Compresión precede breakout');

  // ── FUERZA RELATIVA ──
  rows += grp('Fuerza Relativa');
  if(c.rsLine)     rows += row('RS Line', c.rsLine, c.rsLineOk?'g':'r', 'Subiendo');
  if(c.sector)     rows += row('Sector', c.sector, 'n', 'Referencia');
  if(c.sectorTend) rows += row('Tendencia Sector', c.sectorTend, c.sectorOk?'g':'r', 'Fuerte / alcista');

  // ── PATRONES ──
  rows += grp('Patrones de Precio');
  if(c.vcp1!==null||c.vcp2!==null){
    var cs=[c.vcp1,c.vcp2,c.vcp3].filter(function(x){return x!==null;}).map(function(x){return x+'%';}).join(' → ');
    rows += row('VCP Contracciones', cs, c.vcp.signal==='🟢'?'g':c.vcp.signal==='🟡'?'a':'r', 'Cada C < anterior');
  }
  if(c.dTecho&&c.dPiso){ var cp=((c.dTecho-c.dPiso)/c.dTecho*100); rows += row('Darvas Amplitud', cp.toFixed(1)+'%', cp<=15?'g':'r', '≤ 15%'); }
  if(c.dSemanas!=null)   rows += row('Darvas Semanas', c.dSemanas+'sem', c.dSemanas>=3?'g':'r', '≥ 3 semanas');
  if(c.copaProf!==null)  rows += row('Copa Profundidad', c.copaProf+'%', (c.copaProf>=12&&c.copaProf<=33)?'g':'r', '12–33%');
  if(c.copaSem!==null)   rows += row('Copa Semanas', c.copaSem+'sem', (c.copaSem>=7&&c.copaSem<=65)?'g':'r', '7–65 sem');
  if(c.handleSem!==null) rows += row('Asa Semanas', c.handleSem+'sem', (c.handleSem>=1&&c.handleSem<=5)?'g':'r', '1–5 sem');
  if(c.avPrevio!==null)  rows += row('Avance Previo', c.avPrevio+'%', c.avPrevio>=30?'g':'r', '≥ 30%');
  if(c.consol!==null)    rows += row('Consolidación', c.consol+'sem', (c.consol>=1&&c.consol<=8)?'g':'r', '1–8 sem');

  // ── CANSLIM ──
  rows += grp('CANSLIM · Fundamentales');
  if(c.epsQTrim!==null) rows += row('EPS Trim. (Q)', '+'+c.epsQTrim+'%', c.epsQOk?'g':'r', '≥ 25%');
  if(c.epsAnual!==null) rows += row('EPS Anual', '+'+c.epsAnual+'%', c.epsAOk?'g':'r', '≥ 15%');
  if(c.ventasCr!==null) rows += row('Ventas Crecimiento', '+'+c.ventasCr+'%', c.ventasOk?'g':'r', '≥ 20%');
  if(c.roe!==null)      rows += row('ROE', c.roe+'%', c.roeOk?'g':'r', '≥ 17%');
  if(c.instPct!==null)  rows += row('Institucional', c.instPct+'%', c.instOk?'g':'r', '≥ 30%');
  if(c.floatAcc!==null) rows += row('Float Acciones', fmtN2(c.floatAcc,0), 'n', 'Referencia');

  // ── CONFLUENCIA ──
  rows += grp('Confluencia · Métodos');
  c.methods.forEach(function(m){
    rows += row(m.nombre||m.corto, m.score+'/'+m.total+' condiciones', m.signal==='🟢'?'g':m.signal==='🟡'?'a':'r', 'Mayoría cumplidas');
  });
  rows += row('Score Global', c.confPct+'%', c.confPct>=70?'g':c.confPct>=40?'a':'r', '≥ 70%');
  if(c.riesgoFinal) rows += row('Riesgo Entry → Stop', c.riesgoFinal.toFixed(1)+'%', c.riesgoFinal<=5?'g':c.riesgoFinal<=8?'a':'r', '≤ 5%');
  if(c.rr1Final)    rows += row('R:R Objetivo 1', '1 : '+c.rr1Final.toFixed(1), c.rr1Final>=3?'g':c.rr1Final>=2?'a':'r', '≥ 1:3');
  if(c.rr2Final)    rows += row('R:R Objetivo 2', '1 : '+c.rr2Final.toFixed(1), c.rr2Final>=3?'g':c.rr2Final>=2?'a':'r', '≥ 1:3');

  return '<div class="tech-section">'
    +'<div class="tech-sec-tag">Vista global · '+n+' indicadores · '+c.periodo+'</div>'
    +'<h2 class="tech-sec-title">Señales por <span>Indicador</span></h2>'
    +'<div style="overflow-x:auto">'
    +'<table class="tsi">'
    +'<thead><tr><th class="tsi-n">#</th><th>Indicador</th><th>Valor · Señal</th><th>Criterio</th></tr></thead>'
    +'<tbody>'+rows+'</tbody>'
    +'</table>'
    +'</div>'
    +'</div>';
}

// ══════════════════════════════════════════
//  RSI BAR SVG HELPER
// ══════════════════════════════════════════
function tsvgRsiBar(rsi14){
  if(rsi14===null||rsi14===undefined) return '';
  var W=560,H=64,pL=60,pR=50,pT=22;
  var bw=W-pL-pR;
  var col=rsi14>80?'#ef4444':rsi14>70?'#f59e0b':rsi14>30?'#22c55e':'#5A9BFF';
  var pct=Math.min(Math.max(rsi14,0),100)/100;
  var out='';
  out+='<rect x="'+pL+'" y="'+pT+'" width="'+(bw*0.3).toFixed(0)+'" height="14" rx="2" fill="rgba(90,155,255,.18)"/>';
  out+='<rect x="'+(pL+bw*0.3).toFixed(0)+'" y="'+pT+'" width="'+(bw*0.4).toFixed(0)+'" height="14" fill="rgba(34,197,94,.18)"/>';
  out+='<rect x="'+(pL+bw*0.7).toFixed(0)+'" y="'+pT+'" width="'+(bw*0.1).toFixed(0)+'" height="14" fill="rgba(245,158,11,.2)"/>';
  out+='<rect x="'+(pL+bw*0.8).toFixed(0)+'" y="'+pT+'" width="'+(bw*0.2).toFixed(0)+'" height="14" rx="2" fill="rgba(239,68,68,.18)"/>';
  out+='<rect x="'+pL+'" y="'+pT+'" width="'+bw+'" height="14" rx="2" fill="none" stroke="rgba(90,155,255,.2)" stroke-width="1"/>';
  [30,70,80].forEach(function(v){
    var px=(pL+bw*(v/100)).toFixed(0);
    out+='<line x1="'+px+'" y1="'+(pT-5)+'" x2="'+px+'" y2="'+(pT+19)+'" stroke="rgba(90,155,255,.3)" stroke-width="1"/>';
    out+='<text x="'+px+'" y="'+(pT-7)+'" text-anchor="middle" font-size="8" fill="rgba(90,155,255,.5)" font-family="Space Mono,monospace">'+v+'</text>';
  });
  out+='<text x="'+(pL+bw*0.15).toFixed(0)+'" y="'+(pT+28)+'" text-anchor="middle" font-size="8" fill="rgba(90,155,255,.6)" font-family="Inter,sans-serif">Sobreventa</text>';
  out+='<text x="'+(pL+bw*0.5).toFixed(0)+'" y="'+(pT+28)+'" text-anchor="middle" font-size="8" fill="rgba(34,197,94,.7)" font-family="Inter,sans-serif">Saludable</text>';
  out+='<text x="'+(pL+bw*0.75).toFixed(0)+'" y="'+(pT+28)+'" text-anchor="middle" font-size="8" fill="rgba(245,158,11,.7)" font-family="Inter,sans-serif">Fuerte</text>';
  out+='<text x="'+(pL+bw*0.9).toFixed(0)+'" y="'+(pT+28)+'" text-anchor="middle" font-size="8" fill="rgba(239,68,68,.7)" font-family="Inter,sans-serif">OB</text>';
  var posX=(pL+bw*pct).toFixed(0);
  out+='<circle cx="'+posX+'" cy="'+(pT+7)+'" r="9" fill="'+col+'" stroke="#080E1A" stroke-width="2"/>';
  out+='<text x="'+posX+'" y="'+(pT+11)+'" text-anchor="middle" font-size="8" fill="#fff" font-family="Space Mono,monospace" font-weight="700">'+rsi14.toFixed(0)+'</text>';
  return '<svg viewBox="0 0 '+W+' '+H+'" width="100%" style="display:block">'+out+'</svg>';
}

// ══════════════════════════════════════════
//  RENDER DASHBOARD TÉCNICO
// ══════════════════════════════════════════
function renderTechDash(c){
  var MON = c.moneda;
  var op  = generarOpinion(c);

  // Semáforos globales
  function dotCls(sig){ return sig==='🟢'?'g':sig==='🔴'?'r':'a'; }

  // Tarjeta de método
  function metodCard(m){
    var rrPct = (c.reward1Final && m.riesgo_pct) ? c.reward1Final / m.riesgo_pct : null;
    var rrCls = rrPct!==null ? (rrPct>=3?'good':rrPct>=2?'mid':'bad') : 'mid';
    return '<div class="tc-card '+m.cls+'">'
      +'<div class="tc-card-method">'+m.corto+'</div>'
      +'<div class="tc-card-signal">'+m.signal+'</div>'
      +'<div class="tc-card-name">'+m.nombre+'</div>'
      +'<div class="tc-card-entry">Entry: $'+m.entry.toFixed(2)+'</div>'
      +'<div class="tc-card-stop">Stop: $'+m.stop.toFixed(2)+' · Riesgo: '+m.riesgo_pct.toFixed(1)+'%</div>'
      +(rrPct!==null?'<div class="tc-card-rr '+rrCls+'">R:R 1:'+(rrPct.toFixed(1))+'</div>':'')
      +'<div style="font-size:10px;color:var(--gray2);margin-top:6px">'+m.score+' / '+m.total+' condiciones ✓</div>'
      +'</div>';
  }

  // Tabla de condiciones de un método
  function condTable(m){
    return '<table class="tech-table" style="width:100%;margin-top:8px">'
      +'<thead><tr><th>Estado</th><th>Condición</th><th>Detalle</th></tr></thead>'
      +'<tbody>'+m.checks.map(function(ch){
        var cls = ch.cond===true?'g':ch.cond===false?'r':'a';
        var icon= ch.cond===true?'✅':ch.cond===false?'❌':'—';
        return '<tr><td class="'+cls+'" style="font-size:14px;text-align:center">'+icon+'</td>'
          +'<td>'+ch.label+'</td>'
          +'<td class="mono" style="font-size:11px">'+ch.detalle+'</td></tr>';
      }).join('')+'</tbody></table>';
  }

  // VCP dots visuales
  var vcpDots = '';
  if(c.vcp1!==null||c.vcp2!==null||c.vcp3!==null){
    var contracciones = [c.vcp1,c.vcp2,c.vcp3].filter(function(v){ return v!==null; });
    vcpDots = '<div class="vcp-contracciones" style="display:flex;align-items:center;gap:8px;margin-top:16px;flex-wrap:wrap">';
    contracciones.forEach(function(v,i){
      var sz = 50 - i*10;
      vcpDots += '<div style="display:flex;flex-direction:column;align-items:center;gap:4px">'
        +'<div style="width:'+sz+'px;height:'+sz+'px;border-radius:50%;background:rgba(90,155,255,.15);border:2px solid rgba(90,155,255,.4);display:flex;align-items:center;justify-content:center;font-family:Space Mono,monospace;font-size:11px;font-weight:700;color:#5A9BFF">'+v+'%</div>'
        +'<div style="font-size:8px;color:var(--gray2)">C'+(i+1)+'</div>'
        +'</div>';
      if(i < contracciones.length-1) vcpDots += '<div style="color:rgba(90,155,255,.4);font-size:14px;margin-bottom:12px">→</div>';
    });
    vcpDots += '</div>';
  }

  var html = '';

  // ══ 1. HERO — Confluencia ══
  html += '<div class="tech-section" style="padding-bottom:32px">'
    +'<div class="tech-sec-tag">Análisis técnico · Breakout Analysis — Metodologías Legendarias</div>'
    +'<div style="display:grid;grid-template-columns:1fr auto;gap:28px;align-items:start">'
    +'  <div>'
    +'    <h2 class="tech-sec-title" style="margin-bottom:14px">'+c.accion+'</h2>'
    +'    <div class="ficha" style="margin-bottom:24px">'
    +'      <div class="ficha-item"><span class="ficha-val">'+fmtMoney(c.precio)+'</span><span class="ficha-lbl">Precio Actual</span></div>'
    +'      <div class="ficha-item"><span class="ficha-val">'+fmtMoney(c.pivote||0)+'</span><span class="ficha-lbl">Pivote / Entry</span></div>'
    +'      <div class="ficha-item"><span class="ficha-val">'+(c.periodo||'Anual')+'</span><span class="ficha-lbl">Período</span></div>'
    +'      <div class="ficha-item"><span class="ficha-val">'+MON+'</span><span class="ficha-lbl">Moneda</span></div>'
    +'      <div class="ficha-item"><span class="ficha-val">'+c.confPct+'%</span><span class="ficha-lbl">Confluencia</span></div>'
    +'    </div>'
    +'    <!-- 4 método-cards -->'
    +'    <div class="tech-confluence">'+c.methods.map(function(m){ return metodCard(m); }).join('')+'</div>'
    +'  </div>'
    +'  <!-- Radar -->'
    +'  <div style="display:flex;flex-direction:column;align-items:center;gap:8px">'
    +'    <div style="font-size:10px;letter-spacing:.25em;color:#5A9BFF;text-transform:uppercase;margin-bottom:4px">Radar de Confluencia</div>'
    +tsvgConfluenciaRadar(c.methods)
    +'    <div style="display:flex;gap:12px;margin-top:4px">'
    +'      <div style="display:flex;align-items:center;gap:5px;font-size:10px;color:var(--gray1)"><div style="width:10px;height:10px;border-radius:50%;background:#22c55e"></div>'+c.verdes+'</div>'
    +'      <div style="display:flex;align-items:center;gap:5px;font-size:10px;color:var(--gray1)"><div style="width:10px;height:10px;border-radius:50%;background:#f59e0b"></div>'+c.amarillos+'</div>'
    +'      <div style="display:flex;align-items:center;gap:5px;font-size:10px;color:var(--gray1)"><div style="width:10px;height:10px;border-radius:50%;background:#ef4444"></div>'+c.rojos+'</div>'
    +'    </div>'
    +'  </div>'
    +'</div>'
    +'</div>';

  // ══ 1.5. SNAPSHOT TABLE ══
  html += buildSnapTable(c);

  // ══ 2. NIVELES DE PRECIO ══
  html += '<div class="tech-section">'
    +'<div class="tech-sec-tag">Niveles clave · Entry · Stop · Objetivos</div>'
    +'<h2 class="tech-sec-title">Mapa de <span>Precios</span></h2>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">'
    +'  <div>'
    +'    <div class="price-levels">'
    +(c.bestEntry?'<div class="pl-card"><div class="pl-card-lbl">Punto de Entry (Confluencia)</div><div class="pl-card-val entry">$'+c.bestEntry.toFixed(2)+'</div><div class="pl-card-note">Promedio ponderado de métodos activos</div></div>':'')
    +(c.bestStop?'<div class="pl-card"><div class="pl-card-lbl">Stop Loss</div><div class="pl-card-val stop">$'+c.bestStop.toFixed(2)+'</div><div class="pl-card-note">Riesgo: '+(c.riesgoFinal?c.riesgoFinal.toFixed(1)+'%':'N/E')+'</div></div>':'')
    +(c.obj1?'<div class="pl-card"><div class="pl-card-lbl">Objetivo 1</div><div class="pl-card-val obj1">$'+c.obj1.toFixed(2)+'</div><div class="pl-card-note">+'+(c.reward1Final?c.reward1Final.toFixed(1)+'%':'N/E')+' · R:R '+(c.rr1Final?'1:'+c.rr1Final.toFixed(1):'N/E')+'</div></div>':'')
    +(c.obj2?'<div class="pl-card"><div class="pl-card-lbl">Objetivo 2</div><div class="pl-card-val obj2">$'+c.obj2.toFixed(2)+'</div><div class="pl-card-note">+'+(c.reward2Final?c.reward2Final.toFixed(1)+'%':'N/E')+' · R:R '+(c.rr2Final?'1:'+c.rr2Final.toFixed(1):'N/E')+'</div></div>':'')
    +'    </div>'
    +'    <div class="tech-chart-box" style="margin-top:0">'
    +'      <div class="tech-chart-title">Distribución Riesgo / Recompensa</div>'
    +tsvgRRBar(c.riesgoFinal, c.reward1Final, c.reward2Final)
    +'    </div>'
    +'  </div>'
    +'  <div class="tech-chart-box">'
    +'    <div class="tech-chart-title">Niveles de precio — visualización vertical</div>'
    +tsvgLevelChart(c.precio, c.pivote||c.bestEntry, c.bestStop, c.obj1, c.obj2, c.minPat)
    +'  </div>'
    +'</div>'
    +'<!-- Tabla niveles -->'
    +'<div style="overflow-x:auto"><table class="tech-table">'
    +'<thead><tr><th>Nivel</th><th>Precio</th><th>% vs Actual</th><th>Tipo</th></tr></thead>'
    +'<tbody>'
    +(c.obj2?'<tr><td style="color:#4ade80;font-weight:700">Objetivo 2</td><td class="mono">$'+c.obj2.toFixed(2)+'</td><td class="g">+'+(c.reward2Final?c.reward2Final.toFixed(1)+'%':'N/E')+'</td><td>Meta ampliada</td></tr>':'')
    +(c.obj1?'<tr><td style="color:#22c55e;font-weight:700">Objetivo 1</td><td class="mono">$'+c.obj1.toFixed(2)+'</td><td class="g">+'+(c.reward1Final?c.reward1Final.toFixed(1)+'%':'N/E')+'</td><td>Meta principal</td></tr>':'')
    +(c.pivote?'<tr><td style="color:#F2CC6E;font-weight:700">Pivote / Entry</td><td class="mono">$'+c.pivote.toFixed(2)+'</td><td class="a">'+(c.pctDePivote!==null?(c.pctDePivote>0?'-':'')+c.pctDePivote.toFixed(1)+'%':'N/E')+'</td><td>Punto de breakout</td></tr>':'')
    +'<tr style="background:rgba(90,155,255,.06)"><td style="color:#5A9BFF;font-weight:700">Precio Actual</td><td class="mono">$'+c.precio.toFixed(2)+'</td><td>—</td><td>Cotización actual</td></tr>'
    +(c.bestStop?'<tr><td style="color:#ef4444;font-weight:700">Stop Loss</td><td class="mono">$'+c.bestStop.toFixed(2)+'</td><td class="r">-'+(c.riesgoFinal?c.riesgoFinal.toFixed(1)+'%':'N/E')+'</td><td>Salida si falla el patrón</td></tr>':'')
    +'</tbody></table></div>'
    +'</div>';

  // ══ 3. MEDIAS MÓVILES ══
  html += '<div class="tech-section">'
    +'<div class="tech-sec-tag">Estructura de tendencia · Stage Analysis</div>'
    +'<h2 class="tech-sec-title">Medias Móviles & <span>Stage</span></h2>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">'
    +'  <div>'
    +'    <div class="tkg">';
  if(c.ma10 )  html += '<div class="tkc"><div class="tkc-val">$'+c.ma10.toFixed(2)+'</div><div class="tkc-name">MA 10 días</div><div class="tkc-note">'+(c.precio>c.ma10?'✅ Precio sobre MA10':'❌ Bajo MA10')+'</div></div>';
  if(c.ma20 )  html += '<div class="tkc"><div class="tkc-val">$'+c.ma20.toFixed(2)+'</div><div class="tkc-name">MA 20 días</div><div class="tkc-note">'+(c.precio>c.ma20?'✅ Precio sobre MA20':'❌ Bajo MA20')+'</div></div>';
  if(c.ma50 )  html += '<div class="tkc"><div class="tkc-val">$'+c.ma50.toFixed(2)+'</div><div class="tkc-name">MA 50 días</div><div class="tkc-note">'+(c.precio>c.ma50?'✅ Precio sobre MA50':'❌ Bajo MA50')+'</div></div>';
  if(c.ma200)  html += '<div class="tkc"><div class="tkc-val">$'+c.ma200.toFixed(2)+'</div><div class="tkc-name">MA 200 días</div><div class="tkc-note">'+(c.precio>c.ma200?'✅ Precio sobre MA200':'❌ Bajo MA200')+'</div></div>';
  html += '    </div>'
    +'    <!-- Señales MA -->'
    +'    <div>'
    +[[c.sobre200,'stage2','MA200 subiendo','Precio > MA200 · Base alcista de largo plazo'],[c.stage2,'stage2','Stage 2 (Minervini)','Precio > MA50 > MA200 · MA200 en ascenso']].map(function(r){
      return '<div class="tech-signal-row"><div class="tsr-dot '+dotCls(r[0]===true?'🟢':r[0]===false?'🔴':'🟡')+'"></div><div class="tsr-method">'+r[2]+'</div><div class="tsr-condicion">'+r[3]+'</div><div class="tsr-valor '+(r[0]===true?'g':r[0]===false?'r':'a')+'">'+(r[0]===true?'✓ SÍ':r[0]===false?'✗ NO':'N/E')+'</div></div>';
    }).join('')
    +'    </div>'
    +'  </div>'
    +'  <div>'
    +'    <div style="background:var(--bg1);border:1px solid rgba(90,155,255,.15);border-radius:6px;padding:20px">'
    +'      <div class="tech-chart-title">Posición relativa del precio vs MAs</div>'
    +'      <div style="display:flex;flex-direction:column;gap:12px;margin-top:8px">';
  [['MA10',c.ma10],['MA20',c.ma20],['MA50',c.ma50],['MA200',c.ma200]].forEach(function(pair){
    var label=pair[0], v=pair[1];
    if(!v||!c.precio) return;
    var pct = ((c.precio-v)/v*100);
    var col = pct>0?'#22c55e':'#ef4444';
    var barW = Math.min(Math.abs(pct)/20*100,100);
    html += '<div style="display:flex;align-items:center;gap:12px">'
      +'<div style="font-size:10px;color:var(--gray2);width:40px">'+label+'</div>'
      +'<div style="flex:1;height:12px;background:rgba(90,155,255,.1);border-radius:4px;overflow:hidden;position:relative">'
      +'<div style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(90,155,255,.3)"></div>'
      +'<div style="height:100%;width:'+barW+'%;'+(pct>=0?'margin-left:50%':'margin-left:calc(50% - '+barW+'%)')+';background:'+col+';border-radius:4px"></div>'
      +'</div>'
      +'<div style="font-family:Space Mono,monospace;font-size:11px;font-weight:700;color:'+col+';width:60px;text-align:right">'+(pct>0?'+':'')+pct.toFixed(1)+'%</div>'
      +'</div>';
  });
  html += '      </div>'
    +'    </div>'
    +'  </div>'
    +'</div>'
    +'</div>';

  // ══ 4. VOLUMEN ══
  html += '<div class="tech-section">'
    +'<div class="tech-sec-tag">Confirmación institucional · Expansión de volumen</div>'
    +'<h2 class="tech-sec-title">Análisis de <span>Volumen</span></h2>'
    +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">'
    +(c.volProm?'<div class="tkc"><div class="tkc-val">'+fmtN2(c.volProm)+'</div><div class="tkc-name">Volumen Promedio (50d)</div><div class="tkc-note">Referencia base</div></div>':'')
    +(c.volHoy ?'<div class="tkc" style="border-top-color:'+(c.volOk?'#22c55e':'#ef4444')+'"><div class="tkc-val" style="color:'+(c.volOk?'#22c55e':'#ef4444')+';-webkit-text-fill-color:'+(c.volOk?'#22c55e':'#ef4444')+'">'+fmtN2(c.volHoy)+'</div><div class="tkc-name">Volumen del Breakout</div><div class="tkc-note">'+(c.volOk?'✅ Expansión institucional validada':'❌ Insuficiente — señal débil')+'</div></div>':'')
    +(c.volRatio?'<div class="tkc" style="border-top-color:'+(c.volOk?'#22c55e':'#ef4444')+'"><div class="tkc-val" style="color:'+(c.volOk?'#22c55e':'#ef4444')+';-webkit-text-fill-color:'+(c.volOk?'#22c55e':'#ef4444')+'">'+(c.volRatio*100).toFixed(0)+'%</div><div class="tkc-name">% vs Promedio</div><div class="tkc-note">Umbral mínimo: 140% · '+fmtX(c.volRatio)+' el promedio</div></div>':'')
    +'</div>'
    +'<div class="tech-signal-row" style="margin-top:16px">'
    +'  <div class="tsr-dot '+dotCls(c.volOk?'🟢':'🔴')+'"></div>'
    +'  <div class="tsr-method">Volumen</div>'
    +'  <div class="tsr-condicion">El volumen del breakout debe superar el 140% del promedio (Minervini/Darvas/O\'Neill) o 120% mínimo (Kullamagi)</div>'
    +'  <div class="tsr-valor '+(c.volOk?'g':'r')+'">'+(c.volRatio?(c.volRatio*100).toFixed(0)+'%':'N/E')+'</div>'
    +'</div>'
    +'</div>';

  // ══ 4.5. INDICADORES TÉCNICOS ADICIONALES ══
  var hasExtra = c.rsi14!==null||c.macdVal!==null||c.bbSup!==null||c.atr14!==null||!!c.rsLine||!!c.sectorTend;
  if(hasExtra){
    html += '<div class="tech-section">';
    html += '<div class="tech-sec-tag">Momentum · Volatilidad · Fuerza relativa</div>';
    html += '<h2 class="tech-sec-title">Indicadores <span>Técnicos</span></h2>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:24px">';
    if(c.rsi14!==null){
      var rc=c.rsi14>80?'#ef4444':c.rsi14>70?'#f59e0b':c.rsi14>30?'#22c55e':'#5A9BFF';
      html+='<div class="tkc" style="border-top-color:'+rc+'"><div class="tkc-val" style="color:'+rc+';-webkit-text-fill-color:'+rc+'">'+c.rsi14.toFixed(1)+'</div><div class="tkc-name">RSI (14)</div><div class="tkc-note">'+c.rsiZone+'</div></div>';
    }
    if(c.macdVal!==null){
      var mc=c.macdBull?'#22c55e':'#ef4444';
      html+='<div class="tkc" style="border-top-color:'+mc+'"><div class="tkc-val" style="color:'+mc+';-webkit-text-fill-color:'+mc+'">'+c.macdVal.toFixed(3)+'</div><div class="tkc-name">MACD</div><div class="tkc-note">Signal: '+(c.macdSig!==null?c.macdSig.toFixed(3):'N/E')+(c.macdBull?'<br>&#x2705; Alcista':'<br>&#x274C; Bajista')+'</div></div>';
    }
    if(c.macdHist!==null){
      var mhc=c.macdHPos?'#22c55e':'#ef4444';
      html+='<div class="tkc" style="border-top-color:'+mhc+'"><div class="tkc-val" style="color:'+mhc+';-webkit-text-fill-color:'+mhc+'">'+c.macdHist.toFixed(3)+'</div><div class="tkc-name">Histograma MACD</div><div class="tkc-note">'+(c.macdHPos?'&#x2705; Positivo':'&#x274C; Negativo')+'</div></div>';
    }
    if(c.bbSup!==null&&c.bbInf!==null){
      var bbc2=c.bbSqueeze?'#F2CC6E':'#5A9BFF';
      html+='<div class="tkc" style="border-top-color:'+bbc2+'"><div class="tkc-val" style="font-size:13px;color:'+bbc2+';-webkit-text-fill-color:'+bbc2+'">'+(c.bbPct!==null?c.bbPct.toFixed(0)+'%':'N/E')+' de la banda</div><div class="tkc-name">Bollinger Bands</div><div class="tkc-note">Sup: $'+c.bbSup.toFixed(2)+' &middot; Inf: $'+c.bbInf.toFixed(2)+'<br>'+(c.bbSqueeze?'&#x26A1; Compr&eacute;si&oacute;n &mdash; potencial breakout':'Amplitud normal')+' ('+(c.bbRange!==null?c.bbRange.toFixed(1)+'%':'N/E')+')</div></div>';
    }
    if(c.atr14!==null){
      html+='<div class="tkc"><div class="tkc-val">$'+c.atr14.toFixed(2)+'</div><div class="tkc-name">ATR (14)</div><div class="tkc-note">Stop 1.5&times;: '+(c.stopAtr?'$'+c.stopAtr.toFixed(2):'N/E')+'<br>Riesgo: '+(c.riesgoAtr?c.riesgoAtr.toFixed(1)+'%':'N/E')+'</div></div>';
    }
    if(c.rsLine){
      var rslc=c.rsLineOk?'#22c55e':(c.rsLine.includes('lateral')?'#f59e0b':'#ef4444');
      html+='<div class="tkc" style="border-top-color:'+rslc+'"><div class="tkc-val" style="font-size:15px;text-transform:capitalize;color:'+rslc+';-webkit-text-fill-color:'+rslc+'">'+c.rsLine+'</div><div class="tkc-name">RS Line vs Mercado</div><div class="tkc-note">'+(c.rsLineOk?'&#x2705; Outperformance':'&#x274C; Underperformance')+'</div></div>';
    }
    if(c.sector||c.sectorTend){
      var sc3=c.sectorOk?'#22c55e':c.sectorOk===false?'#ef4444':'#f59e0b';
      html+='<div class="tkc" style="border-top-color:'+sc3+'"><div class="tkc-val" style="font-size:14px;text-transform:capitalize;color:'+sc3+';-webkit-text-fill-color:'+sc3+'">'+(c.sectorTend||'N/E')+'</div><div class="tkc-name">Sector'+(c.sector?' &mdash; '+c.sector:'')+'</div><div class="tkc-note">'+(c.sectorOk?'&#x2705; Liderazgo':'&#x274C; Rezagado')+'</div></div>';
    }
    html += '</div>';
    if(c.rsi14!==null){
      html += '<div class="tech-chart-box"><div class="tech-chart-title">RSI 14 &mdash; zona actual en la escala</div>'+tsvgRsiBar(c.rsi14)+'</div>';
    }
    var indRows=[];
    if(c.rsi14!==null)    indRows.push({ic:c.rsiOk===true?'&#x2705;':c.rsiOk===false?'&#x274C;':'&mdash;',lbl:'RSI 14',val:c.rsi14.toFixed(1),nota:c.rsiZone,cl:c.rsiOk===true?'g':c.rsiOk===false?'r':'a'});
    if(c.macdVal!==null)  indRows.push({ic:c.macdBull?'&#x2705;':'&#x274C;',lbl:'MACD vs Signal',val:c.macdVal.toFixed(3)+' vs '+(c.macdSig!==null?c.macdSig.toFixed(3):'N/E'),nota:c.macdBull?'Alcista':'Bajista',cl:c.macdBull?'g':'r'});
    if(c.macdHist!==null) indRows.push({ic:c.macdHPos?'&#x2705;':'&#x274C;',lbl:'Histograma MACD',val:c.macdHist.toFixed(3),nota:c.macdHPos?'Positivo':'Negativo',cl:c.macdHPos?'g':'r'});
    if(c.bbSqueeze!==null)indRows.push({ic:c.bbSqueeze?'&#x26A1;':'&mdash;',lbl:'Bollinger Squeeze',val:(c.bbRange!==null?c.bbRange.toFixed(1)+'%':'N/E'),nota:c.bbSqueeze?'Compresi&oacute;n &mdash; potencial breakout':'Normal',cl:c.bbSqueeze?'g':'a'});
    if(c.atr14!==null)    indRows.push({ic:'&#x1F4CA;',lbl:'ATR 14',val:'$'+c.atr14.toFixed(2),nota:'Riesgo 1.5&times;ATR: '+(c.riesgoAtr?c.riesgoAtr.toFixed(1)+'%':'N/E'),cl:'a'});
    if(c.rsLine)          indRows.push({ic:c.rsLineOk?'&#x2705;':'&#x274C;',lbl:'RS Line',val:c.rsLine,nota:c.rsLineOk?'Outperformance vs &iacute;ndice':'Underperformance',cl:c.rsLineOk?'g':'r'});
    if(c.sectorTend)      indRows.push({ic:c.sectorOk?'&#x2705;':c.sectorOk===false?'&#x274C;':'&mdash;',lbl:'Sector'+(c.sector?' ('+c.sector+')':''),val:c.sectorTend,nota:c.sectorOk?'Liderazgo':'Rezagado',cl:c.sectorOk?'g':c.sectorOk===false?'r':'a'});
    if(indRows.length>0){
      html+='<div style="overflow-x:auto;margin-top:16px"><table class="tech-table"><thead><tr><th>Estado</th><th>Indicador</th><th>Valor</th><th>Nota</th></tr></thead><tbody>'
        +indRows.map(function(r){ return '<tr><td style="text-align:center;font-size:14px">'+r.ic+'</td><td style="font-weight:600">'+r.lbl+'</td><td class="mono '+r.cl+'">'+r.val+'</td><td>'+r.nota+'</td></tr>'; }).join('')
        +'</tbody></table></div>';
    }
    html += '</div>';
  }

  // ══ 4.7. CANSLIM / FUNDAMENTALES ══
  if(c.canslimTotal > 0){
    html += '<div class="tech-section">';
    html += '<div class="tech-sec-tag">CANSLIM &middot; O\'Neill &middot; Fundamentales del trader</div>';
    html += '<h2 class="tech-sec-title">Fundamentos <span>CANSLIM</span></h2>';
    html += '<div style="display:grid;grid-template-columns:2fr 1fr;gap:24px">';
    html += '<div>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:12px;margin-bottom:20px">';
    if(c.epsQTrim!==null){ var ec=c.epsQOk?'#22c55e':'#ef4444'; html+='<div class="tkc" style="border-top-color:'+ec+'"><div class="tkc-val" style="color:'+ec+';-webkit-text-fill-color:'+ec+'">+'+c.epsQTrim+'%</div><div class="tkc-name">EPS Trim.</div><div class="tkc-note">M&iacute;n: 25%</div></div>'; }
    if(c.epsAnual!==null){ var ea=c.epsAOk?'#22c55e':'#ef4444'; html+='<div class="tkc" style="border-top-color:'+ea+'"><div class="tkc-val" style="color:'+ea+';-webkit-text-fill-color:'+ea+'">+'+c.epsAnual+'%</div><div class="tkc-name">EPS Anual</div><div class="tkc-note">M&iacute;n: 15%</div></div>'; }
    if(c.ventasCr!==null){ var vc=c.ventasOk?'#22c55e':'#ef4444'; html+='<div class="tkc" style="border-top-color:'+vc+'"><div class="tkc-val" style="color:'+vc+';-webkit-text-fill-color:'+vc+'">+'+c.ventasCr+'%</div><div class="tkc-name">Ventas</div><div class="tkc-note">M&iacute;n: 20%</div></div>'; }
    if(c.roe!==null){ var roo=c.roeOk?'#22c55e':'#ef4444'; html+='<div class="tkc" style="border-top-color:'+roo+'"><div class="tkc-val" style="color:'+roo+';-webkit-text-fill-color:'+roo+'">'+c.roe+'%</div><div class="tkc-name">ROE</div><div class="tkc-note">M&iacute;n: 17%</div></div>'; }
    if(c.instPct!==null){ var ic2=c.instOk?'#22c55e':'#ef4444'; html+='<div class="tkc" style="border-top-color:'+ic2+'"><div class="tkc-val" style="color:'+ic2+';-webkit-text-fill-color:'+ic2+'">'+c.instPct+'%</div><div class="tkc-name">Institucional</div><div class="tkc-note">M&iacute;n: 30%</div></div>'; }
    if(c.floatAcc!==null){ html+='<div class="tkc"><div class="tkc-val" style="font-size:13px">'+fmtN2(c.floatAcc)+'</div><div class="tkc-name">Float</div><div class="tkc-note">Acciones circulantes</div></div>'; }
    html += '</div>';
    html+='<div style="overflow-x:auto"><table class="tech-table"><thead><tr><th>Estado</th><th>Condici&oacute;n CANSLIM</th><th>Valor</th></tr></thead><tbody>'
      +c.canslimChecks.map(function(ch){
        var cls=ch.cond===true?'g':ch.cond===false?'r':'a';
        var icon=ch.cond===true?'&#x2705;':ch.cond===false?'&#x274C;':'&mdash;';
        return '<tr><td style="font-size:14px;text-align:center">'+icon+'</td><td>'+ch.label+'</td><td class="mono '+cls+'">'+ch.val+'</td></tr>';
      }).join('')+'</tbody></table></div>';
    html += '</div>';
    var csColor=c.canslimScore>=5?'#22c55e':c.canslimScore>=3?'#f59e0b':'#ef4444';
    var csPct=c.canslimTotal>0?Math.round(c.canslimScore/c.canslimTotal*100):0;
    html+='<div><div style="background:var(--bg1);border:1px solid rgba(90,155,255,.15);border-radius:8px;padding:24px;text-align:center">'
      +'<div style="font-size:9px;letter-spacing:.35em;color:#5A9BFF;text-transform:uppercase;margin-bottom:12px">Score CANSLIM</div>'
      +'<div style="font-family:Space Mono,monospace;font-size:52px;font-weight:700;line-height:1;color:'+csColor+'">'+c.canslimScore+'<span style="font-size:22px;opacity:.4">/'+c.canslimTotal+'</span></div>'
      +'<div style="font-size:11px;color:var(--gray2);margin-top:8px">'+(c.canslimScore>=5?'Calidad ALTA':c.canslimScore>=3?'Calidad MEDIA':'Calidad BAJA')+'</div>'
      +'<div style="margin-top:14px;background:rgba(90,155,255,.1);border-radius:6px;overflow:hidden;height:8px">'
      +'<div style="height:100%;width:'+csPct+'%;background:'+csColor+';border-radius:6px"></div>'
      +'</div></div></div>';
    html += '</div></div>';
  }

  // ══ 5. DETALLE POR METODOLOGÍA ══
  html += '<div class="tech-section">'
    +'<div class="tech-sec-tag">Detalle de condiciones · Las 4 metodologías</div>'
    +'<h2 class="tech-sec-title">Checklist por <span>Metodología</span></h2>'
    +'<div style="display:flex;flex-direction:column;gap:32px">';

  c.methods.forEach(function(m){
    html += '<div>'
      +'  <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px">'
      +'    <div style="font-size:28px">'+m.signal+'</div>'
      +'    <div>'
      +'      <div style="font-size:10px;letter-spacing:.3em;color:#5A9BFF;text-transform:uppercase">'+m.corto+'</div>'
      +'      <div style="font-size:18px;font-weight:700;color:var(--white);font-family:Cormorant Garamond,serif">'+m.nombre+'</div>'
      +'    </div>'
      +'    <div style="margin-left:auto;font-family:Space Mono,monospace;font-size:24px;font-weight:700;color:'+(m.signal==='🟢'?'#22c55e':m.signal==='🟡'?'#f59e0b':'#ef4444')+'">'+m.score+'/'+m.total+'</div>'
      +'  </div>'
      +condTable(m);

    // Datos extra VCP
    if(m === c.vcp && vcpDots) html += vcpDots;

    html += '</div>';
  });

  html += '</div></div>';

  // ══ 6. OPINIÓN ══
  html += '<div class="tech-section">'
    +'<div class="tech-sec-tag">Diagnóstico · Opinión del sistema</div>'
    +'<h2 class="tech-sec-title">Análisis & <span>Opinión</span></h2>'
    +'<div class="tech-opinion">'
    +'  <div class="tech-opinion-tag">DIAGNÓSTICO AUTOMATIZADO — CÍRCULO AZUL FINANZAS</div>'
    +'  <div class="tech-opinion-title">'+c.accion+' · Confluencia '+c.confPct+'% · '+c.verdes+'/4 metodologías</div>'
    +'  <div class="tech-opinion-body">'+op.parrafos.join('')+'</div>'
    +'  <div class="tech-opinion-verdict '+op.vClass+'">'
    +'    <div class="tech-opinion-verdict-icon">'+op.vIcon+'</div>'
    +'    <div class="tech-opinion-verdict-text">'+op.veredicto+'</div>'
    +'  </div>'
    +'</div>'
    +'</div>';

  // ══ 7. TABLA 12 MESES ══
  var s12 = c.series12m;
  var hasSeries = s12 && Object.keys(s12).some(function(k){ return s12[k] !== null; });
  if(hasSeries){
    // Determina cuántos meses hay (máximo disponible)
    var nMeses = 0;
    Object.keys(s12).forEach(function(k){ if(s12[k] && s12[k].length > nMeses) nMeses = s12[k].length; });
    if(nMeses > 12) nMeses = 12;

    // Cabeceras de columna M-N … M-1
    var mHeaders = '';
    for(var m = nMeses; m >= 1; m--) mHeaders += '<th style="min-width:54px;text-align:center;padding:7px 4px;font-size:10px;font-family:Space Mono,monospace;color:#6A829E;font-weight:400;letter-spacing:.02em;white-space:nowrap">M-'+m+'</th>';

    // Helper: dot signal
    function dot12(val, hiGood, loGood, loBad, hiBad){
      // hiGood/loGood: thresholds for green; loBad/hiBad: thresholds for red
      // hiGood = null → only lower bound matters; loBad = null → only upper bound matters
      var clr;
      if(hiGood !== null && val >= hiGood) clr = '#22c55e';
      else if(loGood !== null && val >= loGood) clr = '#22c55e';
      else if(hiBad !== null && val <= hiBad)   clr = '#ef4444';
      else if(loBad !== null && val <= loBad)   clr = '#ef4444';
      else clr = '#f59e0b';
      return '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:'+clr+';margin-left:3px;vertical-align:middle;flex-shrink:0"></span>';
    }

    // Definición de cada ratio: [label, seriesKey, formatFn, signalFn(val)→color]
    var ratiosDef = [
      { label:'ROA %',             key:'roa',          fmt:function(v){ return v.toFixed(0); },          sig:function(v){ return v>=10?'g':v>=5?'a':'r'; } },
      { label:'ROIC %',            key:'roic',         fmt:function(v){ return v.toFixed(0); },          sig:function(v){ return v>=15?'g':v>=8?'a':'r'; } },
      { label:'ROE %',             key:'roe',          fmt:function(v){ return v.toFixed(0); },          sig:function(v){ return v>=17?'g':v>=10?'a':'r'; } },
      { label:'CROIC %',           key:'croic',        fmt:function(v){ return v.toFixed(0); },          sig:function(v){ return v>=10?'g':v>=5?'a':'r'; } },
      { label:'PER',               key:'per',          fmt:function(v){ return v.toFixed(0); },          sig:function(v){ return v<=20?'g':v<=30?'a':'r'; } },
      { label:'FCF Yield %',       key:'fcfYield',     fmt:function(v){ return v.toFixed(0); },          sig:function(v){ return v>=4?'g':v>=2?'a':'r'; } },
      { label:'CCR',               key:'ccr',          fmt:function(v){ return v.toFixed(2); },          sig:function(v){ return v>=1.2?'g':v>=1.0?'a':'r'; } },
      { label:'Asset Turnover',    key:'assetTurnover',fmt:function(v){ return v.toFixed(2); },          sig:function(v){ return v>=0.8?'g':v>=0.5?'a':'r'; } },
      { label:'Beneish M-Score',   key:'beneish',      fmt:function(v){ return v.toFixed(1); },          sig:function(v){ return v<=-2.22?'g':v<=-1.78?'a':'r'; } },
      { label:'OCF / Net Income',  key:'ocfNI',        fmt:function(v){ return v.toFixed(2); },          sig:function(v){ return v>=1.0?'g':v>=0.7?'a':'r'; } },
      { label:'FCF / Net Income',  key:'fcfNI',        fmt:function(v){ return v.toFixed(2); },          sig:function(v){ return v>=0.8?'g':v>=0.5?'a':'r'; } },
      { label:'Deuda Neta / FCF',  key:'dnFcf',        fmt:function(v){ return v.toFixed(1); },          sig:function(v){ return v<=2?'g':v<=4?'a':'r'; } },
      { label:'Margen EBIT %',     key:'margenEbit',   fmt:function(v){ return v.toFixed(0); },          sig:function(v){ return v>=15?'g':v>=8?'a':'r'; } },
      { label:'Altman Z-Score',    key:'altman',       fmt:function(v){ return v.toFixed(1); },          sig:function(v){ return v>=3?'g':v>=1.81?'a':'r'; } },
      { label:'Piotroski',         key:'piotroski',    fmt:function(v){ return v.toFixed(0); },          sig:function(v){ return v>=7?'g':v>=4?'a':'r'; } },
      { label:'ROIC \u2013 WACC %',key:'roicWacc',    fmt:function(v){ return v.toFixed(0); },          sig:function(v){ return v>0?'g':v===0?'a':'r'; } }
    ];

    var dotClr = { g:'#22c55e', a:'#f59e0b', r:'#ef4444' };

    var tableRows = '';
    ratiosDef.forEach(function(def){
      var serie = s12[def.key];
      if(!serie) return;
      // serie[0] = more distant month, serie[last] = M-1 (most recent)
      // Columns go M-nMeses ... M-1 → indices nMeses-1 ... 0? 
      // Actually we want to show oldest first: M-12 … M-1
      // Input order: serie[0]=M-12, serie[last]=M-1 if nMeses=length
      var cells = '';
      var padded = serie.slice(0); // oldest first
      // If fewer than nMeses values, left-pad with null
      while(padded.length < nMeses) padded.unshift(null);
      for(var ci = 0; ci < nMeses; ci++){
        var v = padded[ci];
        if(v === null){
          cells += '<td style="text-align:center;padding:6px 4px;color:#4A5568;font-size:11px">\u2014</td>';
        } else {
          var s = def.sig(v);
          var dc = dotClr[s];
          cells += '<td style="text-align:center;padding:6px 4px">'
            +'<span style="display:inline-flex;align-items:center;justify-content:center;gap:2px;font-family:Space Mono,monospace;font-size:11px;color:#D8E6F5;white-space:nowrap">'
            +def.fmt(v)
            +'<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:'+dc+'"></span>'
            +'</span></td>';
        }
      }
      tableRows += '<tr style="border-bottom:1px solid rgba(26,86,196,.1)">'
        +'<td style="padding:7px 12px 7px 0;color:#8FA8C8;font-size:11px;font-weight:500;white-space:nowrap;position:sticky;left:0;background:#080E1A;z-index:1">'+def.label+'</td>'
        +cells
        +'</tr>';
    });

    html += '<div class="tech-section rv">'
      +'<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">'
      +'<div class="tech-sec-eyebrow">\ud83d\udcca Ratios Hist\u00f3ricos</div>'
      +'</div>'
      +'<h2 class="tech-sec-title">\ud83d\udcc8 Tabla Completa <span>('+nMeses+' Meses)</span></h2>'
      +'<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid rgba(26,86,196,.2);border-radius:10px;background:#080E1A">'
      +'<table style="width:100%;border-collapse:collapse;min-width:640px">'
      +'<thead>'
      +'<tr style="background:#0D1B3E;border-bottom:1px solid rgba(26,86,196,.3)">'
      +'<th style="text-align:left;padding:9px 12px 9px 0;font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#6A829E;position:sticky;left:0;background:#0D1B3E;z-index:2;white-space:nowrap">Ratio</th>'
      +mHeaders
      +'</tr>'
      +'</thead>'
      +'<tbody>'
      +tableRows
      +'</tbody>'
      +'</table>'
      +'</div>'
      +'<div style="margin-top:10px;display:flex;gap:18px;font-size:10px;color:#6A829E">'
      +'<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;margin-right:4px"></span>Saludable</span>'
      +'<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#f59e0b;margin-right:4px"></span>Neutro</span>'
      +'<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#ef4444;margin-right:4px"></span>Alerta</span>'
      +'</div>'
      +'</div>';
  }

  // ══ 8. CIERRE ══
  html += '<div class="tech-close">' 
    +'<div class="tech-close-score">'+c.confPct+'%</div>'
    +'<div class="tech-close-sub">Confluencia de las 4 metodologías — '+c.accion+'</div>'
    +'<div style="display:flex;justify-content:center;gap:40px;margin-top:32px;flex-wrap:wrap">'
    +(c.verdes?'<div style="text-align:center"><div style="font-family:Space Mono,monospace;font-size:28px;font-weight:700;color:#22c55e">'+c.verdes+'</div><div style="font-size:10px;letter-spacing:.2em;color:var(--gray2)">VERDE</div></div>':'')
    +(c.amarillos?'<div style="text-align:center"><div style="font-family:Space Mono,monospace;font-size:28px;font-weight:700;color:#f59e0b">'+c.amarillos+'</div><div style="font-size:10px;letter-spacing:.2em;color:var(--gray2)">AMARILLO</div></div>':'')
    +(c.rojos?'<div style="text-align:center"><div style="font-family:Space Mono,monospace;font-size:28px;font-weight:700;color:#ef4444">'+c.rojos+'</div><div style="font-size:10px;letter-spacing:.2em;color:var(--gray2)">ROJO</div></div>':'')
    +(c.rr1Final?'<div style="text-align:center"><div style="font-family:Space Mono,monospace;font-size:28px;font-weight:700;color:#5A9BFF">1:'+c.rr1Final.toFixed(1)+'</div><div style="font-size:10px;letter-spacing:.2em;color:var(--gray2)">R:R OBJ 1</div></div>':'')
    +'</div>'
    +'<div style="margin-top:32px;font-size:10px;color:var(--gray2);letter-spacing:.3em;text-transform:uppercase">CÍRCULO AZUL FINANZAS · '+c.accion+' · '+c.periodo+'</div>'
    +'</div>';

  document.getElementById('tech-dash-content').innerHTML = html;

  // Animaciones
  setTimeout(function(){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(!e.isIntersecting) return;
        e.target.classList.add('vi');
        io.unobserve(e.target);
      });
    },{ threshold:0.05, rootMargin:'0px 0px -40px 0px' });
    document.querySelectorAll('#tech-dash-content .tech-section').forEach(function(s){
      s.classList.add('rv'); io.observe(s);
    });
  }, 80);
}

// ══════════════════════════════════════════
//  PARSE & RENDER (punto de entrada)
// ══════════════════════════════════════════
function parseTechAndRender(){
  var raw    = document.getElementById('tech-paste-area').value.trim();
  var errBox = document.getElementById('tech-parse-error');
  var okBox  = document.getElementById('tech-parse-ok');
  errBox.style.display = 'none';
  okBox.style.display  = 'none';

  if(!raw){
    errBox.textContent = 'Por favor ingresá los datos del activo antes de continuar.';
    errBox.style.display = 'block'; return;
  }

  var d;
  try { d = parseTechData(raw); }
  catch(e){ errBox.textContent='Error al leer los datos: '+e.message; errBox.style.display='block'; return; }

  if(!d['PRECIO_ACTUAL'] && !d['PRECIO_PIVOTE']){
    // Si hay al menos 3 métricas parseadas, no bloquear — el usuario pegó datos fundamentales
    if (Object.keys(d).length < 3) {
      errBox.textContent='No se encontró PRECIO_ACTUAL ni suficientes datos. Verificá el formato.';
      errBox.style.display='block'; return;
    }
  }

  if(!d['PERIODO']){ d['PERIODO'] = getTechPeriodo() || 'Análisis'; }

  try {
    var calc = calcTech(d);
    renderTechDash(calc);
    okBox.textContent = '✓ Datos cargados · '+Object.keys(d).length+' campos · '+calc.verdes+' de 4 metodologías con señal verde.';
    okBox.style.display = 'block';
    showTechDash();
    window.scrollTo({top:0, behavior:'smooth'});
  } catch(e){
    errBox.textContent = 'Error al calcular: '+e.message;
    errBox.style.display = 'block';
    console.error(e);
  }
}

// ══════════════════════════════════════════
//  SELECTOR DE PERÍODO
// ══════════════════════════════════════════
function getTechPeriodo(){
  var radio = document.querySelector('input[name="tech-periodo"]:checked');
  if(!radio) return 'Anual';
  if(radio.value === 'anual'){
    var anio = document.getElementById('tp-anio');
    return 'Anual ' + (anio ? anio.value : new Date().getFullYear());
  }
  if(radio.value === 'mensual'){
    var mes     = document.getElementById('tp-mes');
    var mesAnio = document.getElementById('tp-mes-anio');
    var meses   = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    var mesNom  = mes ? (meses[parseInt(mes.value,10)-1] || mes.value) : '';
    return 'Mensual ' + mesNom + ' ' + (mesAnio ? mesAnio.value : '');
  }
  if(radio.value === 'custom'){
    var desde = document.getElementById('tp-desde');
    var hasta = document.getElementById('tp-hasta');
    var fD = function(s){ if(!s) return ''; var p=s.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; };
    var dStr = fD(desde && desde.value);
    var hStr = fD(hasta && hasta.value);
    return 'Período' + (dStr ? ' ' + dStr : '') + (hStr ? ' al ' + hStr : '');
  }
  return 'Anual';
}

function initTechPeriodSelector(){
  var radios = document.querySelectorAll('input[name="tech-periodo"]');
  if(!radios.length) return;
  function syncOpts(){
    var sel = document.querySelector('input[name="tech-periodo"]:checked');
    if(!sel) return;
    var aO = document.getElementById('tp-anual-opts');
    var mO = document.getElementById('tp-mensual-opts');
    var cO = document.getElementById('tp-custom-opts');
    if(aO) aO.style.display = sel.value==='anual'   ? 'flex' : 'none';
    if(mO) mO.style.display = sel.value==='mensual' ? 'flex' : 'none';
    if(cO) cO.style.display = sel.value==='custom'  ? 'flex' : 'none';
  }
  radios.forEach(function(r){ r.addEventListener('change', syncOpts); });
  syncOpts();
}

// ══════════════════════════════════════════
//  PDF TÉCNICO
// ══════════════════════════════════════════
async function generarTechPDF(){
  var btn = document.getElementById('btn-tech-pdf');
  if(btn) { btn.disabled = true; btn.textContent = '⏳ Generando...'; }

  try {
    var dashContent = document.getElementById('tech-dash-content');
    if(!dashContent) throw new Error('No hay dashboard técnico activo');

    var companyName = (dashContent.querySelector('.tech-sec-title') || {}).textContent || 'Análisis Técnico';
    companyName = companyName.replace(/\s+/g,' ').trim().slice(0,40);
    var filename = companyName.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g,'_')+'_Tecnico_CirculoAzul.pdf';

    await html2pdf().set({
      margin:       [8, 4, 8, 4],
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.95 },
      html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#05080F', scrollY: 0 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    }).from(dashContent).save();

  } catch(err){
    console.error('generarTechPDF error:',err);
    alert('Error generando PDF: ' + err.message);
  } finally {
    if(btn) { btn.disabled = false; btn.textContent = '⬇ PDF Técnico'; }
  }
}
