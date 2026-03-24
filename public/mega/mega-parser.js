// ══════════════════════════════════════════════════════
//  MEGA PARSER — parsea el texto KEY:VALUE unificado
//  Compatible con todos los módulos de Círculo Azul
// ══════════════════════════════════════════════════════

// Mapa de aliases: nombre alternativo → clave canónica del mega parser
const MEGA_ALIAS = {
  // Ingresos
  'ingresos totales':'INGRESOS','ventas netas':'INGRESOS','revenue':'INGRESOS','total revenue':'INGRESOS',
  // Utilidad
  'utilidad bruta':'UTILIDAD_BRUTA','ganancia bruta':'UTILIDAD_BRUTA','gross profit':'UTILIDAD_BRUTA',
  // Ganancias netas
  'ganancias netas':'GANANCIAS_NETAS','ganancia neta':'GANANCIAS_NETAS','utilidad neta':'GANANCIAS_NETAS',
  'net income':'GANANCIAS_NETAS','net earnings':'GANANCIAS_NETAS',
  // EBIT
  'utilidad operativa':'EBIT','operating income':'EBIT','beneficio operativo':'EBIT',
  // EBITDA — solo alias, no sobrescribir clave exacta
  // Capital operativo
  'efectivo de las operaciones':'OFC','cash from operations':'OFC','flujo caja operativo':'OFC','cfo':'OFC',
  'gastos de capital':'CAPEX','capital expenditure':'CAPEX','capex margin':'MARGEN_CAPEX',
  'flujo de caja libre neto':'FCF','free cash flow':'FCF','fcf apalancado':'FCF',
  // BPA
  'bpa':'BPA','eps':'BPA','earnings per share':'BPA',
  // Equity
  'capital contable':'EQUITY','patrimonio neto':'EQUITY','stockholders equity':'EQUITY',
  // Balance
  'activos totales':'ACTIVOS_TOTALES','total assets':'ACTIVOS_TOTALES',
  'activos corrientes':'ACTIVOS_CORRIENTES','current assets':'ACTIVOS_CORRIENTES',
  'pasivos corrientes':'PASIVOS_CORRIENTES','current liabilities':'PASIVOS_CORRIENTES',
  'inventarios':'INVENTARIOS','inventories':'INVENTARIOS',
  'deuda total':'DEUDA_TOTAL','total debt':'DEUDA_TOTAL',
  'deuda a corto plazo':'DEUDA_CP','short-term debt':'DEUDA_CP',
  'deuda neta':'DEUDA_NETA','net debt':'DEUDA_NETA',
  'deuda neta / ebitda':'DEUDA_NETA_EBITDA','net debt/ebitda':'DEUDA_NETA_EBITDA',
  'deuda / patrimonio':'DEUDA_PATRIMONIO','debt/equity':'DEUDA_PATRIMONIO',
  'ratio de cobertura de intereses':'ICR','interest coverage':'ICR','coverage ratio':'ICR',
  'gasto de intereses':'GASTO_INTERESES','interest expense':'GASTO_INTERESES',
  // Valoración
  'valor de la empresa':'EV','enterprise value':'EV',
  've/ebit':'EV_EBIT','ev ebit':'EV_EBIT','ve / ebit':'EV_EBIT','ev / ebit':'EV_EBIT',
  've/fcf':'EV_FCF','ev/fcf':'EV_FCF','ev fcf':'EV_FCF',
  've/ebitda':'EV_EBITDA','ev ebitda':'EV_EBITDA',
  'relación per':'PER','price/earnings':'PER','pe ratio':'PER','pe ltm':'PER',
  'per forward':'PER_FWD','forward pe':'PER_FWD',
  'ratio peg':'PEG','peg ratio':'PEG',
  // Retornos
  'rendimiento de capital':'ROE','return on equity':'ROE','retorno sobre patrimonio':'ROE',
  'rendimiento de activos':'ROA','return on assets':'ROA',
  'rendimiento del capital invertido':'ROIC','return on invested capital':'ROIC',
  'costo de capital':'WACC','weighted average cost':'WACC',
  // FCF márgenes
  'margen fcf apalancado':'FCF_APAL','levered fcf margin':'FCF_APAL',
  'margen fcf sin apal':'FCF_SIN_APAL','unlevered fcf margin':'FCF_SIN_APAL',
  'margen de gastos de capital':'MARGEN_CAPEX',
  'rendimiento de flujo de caja libre':'FCF_YIELD','fcf yield':'FCF_YIELD',
  // Ratios liquidez
  'ratio de solvencia':'CURRENT_RATIO','current ratio':'CURRENT_RATIO','liquidez corriente':'CURRENT_RATIO',
  'prueba ácida':'QUICK_RATIO','quick ratio':'QUICK_RATIO',
  // Scores
  'fórmula altman z-score':'ALTMAN','altman z':'ALTMAN','z-score':'ALTMAN',
  'puntuación piotroski':'PIOTROSKI','piotroski f-score':'PIOTROSKI',
  // Proyecciones/crec
  'previsiones de bpa':'EPS_PROJ','eps forecast':'EPS_PROJ','eps proyectado':'EPS_PROJ',
  'previsión de ingresos':'REVENUE_PROJ','revenue forecast':'REVENUE_PROJ',
  'crecimiento bpa':'BPA_GROWTH','eps growth':'BPA_GROWTH',
  'acc. en circulación':'SHARES','shares outstanding':'SHARES',
  // Márgenes textuales
  'margen bruto':'MARGEN_BRUTO','gross margin':'MARGEN_BRUTO',
  'margen ebit':'MARGEN_EBIT','operating margin':'MARGEN_EBIT',
  'margen ebitda':'MARGEN_EBITDA','ebitda margin':'MARGEN_EBITDA',
  'margen neto':'MARGEN_NETO','net margin':'MARGEN_NETO',
  // Valoración extra
  'per':'PER','pe':'PER','p/e':'PER',
  'per forward':'PER_FWD','forward pe':'PER_FWD','per fwd':'PER_FWD',
  'ev/ventas':'EV_VENTAS','ev ventas':'EV_VENTAS','ev/sales':'EV_VENTAS',
  // Liquidez / solvencia
  'current_ratio':'CURRENT_RATIO','ratio corriente':'CURRENT_RATIO','liquidez corriente':'CURRENT_RATIO',
  'quick_ratio':'QUICK_RATIO','prueba acida':'QUICK_RATIO',
  'icr':'ICR','interes cobertura':'ICR','interest coverage ratio':'ICR',
  'deuda neta ebitda':'DEUDA_NETA_EBITDA','deuda neta/ebitda':'DEUDA_NETA_EBITDA','deuda_neta_ebitda':'DEUDA_NETA_EBITDA',
  'deuda ebitda':'DEUDA_NETA_EBITDA',
  'deuda patrimonio':'DEUDA_PATRIMONIO','deuda/patrimonio':'DEUDA_PATRIMONIO',
  'altman':'ALTMAN','altman z':'ALTMAN','altman_z':'ALTMAN',
  'piotroski':'PIOTROSKI','piotroski f':'PIOTROSKI',
  // Técnico
  'precio_actual':'PRECIO_ACTUAL','precio actual':'PRECIO_ACTUAL',
  'precio_pivote':'PRECIO_PIVOTE','precio pivote':'PRECIO_PIVOTE',
  'tendencia_ma200':'TENDENCIA_MA200','tendencia ma200':'TENDENCIA_MA200',
  'rs_line':'RS_LINE','sector_tendencia':'SECTOR_TENDENCIA',
  // Cualitativos (Señales)
  'balance sano':'BALANCE_SANO','balance solido':'BALANCE_SANO','balance sólido':'BALANCE_SANO',
  'salud estructural débil':'SALUD_DEBIL','salud debil':'SALUD_DEBIL',
  'ventaja competitiva':'VENTAJA_COMP','moat':'VENTAJA_COMP','competitive advantage':'VENTAJA_COMP',
  'sector deteriorándose':'SECTOR_DETERIORO','sector deteriorando':'SECTOR_DETERIORO',
  'posible re-rating ev':'RE_RATING_EV','re rating ev':'RE_RATING_EV',
  'spin-off':'SPIN_OFF','spinoff':'SPIN_OFF','spin off':'SPIN_OFF',
  'recompra agresiva':'RECOMPRA','share buyback':'RECOMPRA',
  'venta de activos':'VENTA_ACTIVOS','asset sale':'VENTA_ACTIVOS',
};

const MEGA_CUALITATIVOS = ['BALANCE_SANO','SALUD_DEBIL','VENTAJA_COMP','SECTOR_DETERIORO',
                           'RE_RATING_EV','SPIN_OFF','RECOMPRA','VENTA_ACTIVOS'];

function megaNormCualit(s) {
  if (!s) return null;
  const t = String(s).trim().toLowerCase();
  if (/^\s*(sí|si|yes|true|1|x)\s*$/.test(t)) return 'si';
  if (/^\s*(no|false|0)\s*$/.test(t)) return 'no';
  return null;
}

// ── PARSER PRINCIPAL ────────────────────────────────────────────────────────
function megaParse(raw) {
  const d = {};
  const lines = raw.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const rawKey = line.slice(0, idx).trim();
    const rawVal = line.slice(idx + 1).trim().replace(/\/\/.*$/, '').trim();
    if (!rawVal) continue;

    // Normalizar clave: buscar alias primero
    const lowerKey = rawKey.toLowerCase().replace(/\s+/g, ' ');
    let canonKey = null;
    for (const [alias, canon] of Object.entries(MEGA_ALIAS)) {
      if (lowerKey.includes(alias)) { canonKey = canon; break; }
    }
    // si no hay alias, usar clave literal uppercased
    if (!canonKey) {
      canonKey = rawKey.toUpperCase().replace(/[^A-Z0-9_&%]/g, '_');
    }

    // Cualitativos
    if (MEGA_CUALITATIVOS.includes(canonKey)) {
      d[canonKey] = megaNormCualit(rawVal);
      continue;
    }

    // Arrays (valores separados por coma)
    if (rawVal.includes(',')) {
      const arr = rawVal.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
      if (arr.length > 0) { d[canonKey] = arr; continue; }
    }

    // Numérico
    const num = parseFloat(rawVal.replace(/[$,\s]/g, '').replace(/x$/i, ''));
    if (!isNaN(num)) { d[canonKey] = num; }
    else { d[canonKey] = rawVal; }
  }

  return d;
}

// ── HELPERS ─────────────────────────────────────────────────────────────────
function mArr(d, key) { const v = d[key]; return Array.isArray(v) ? v : []; }
function mNum(d, key, def = null) { const v = d[key]; return typeof v === 'number' ? v : def; }
function mStr(d, key, def = '') { const v = d[key]; return v !== undefined && v !== null ? String(v) : def; }
function mLast(a) { return a.length > 0 ? a[a.length - 1] : null; }
function mFmt(v, dec = 2) { if (v === null || v === undefined) return '—'; return typeof v === 'number' ? v.toFixed(dec) : String(v); }
function mFmtN(v, dec = 0) { if (v === null) return '—'; return v.toLocaleString('es', { maximumFractionDigits: dec }); }
function mPct(v, dec = 2) { return v !== null ? v.toFixed(dec) + '%' : '—'; }
function mSig(v, good, bad) {
  if (v === null) return { icon: '❓', cls: 'sig-gray' };
  if (good(v)) return { icon: '🟢', cls: 'sig-green' };
  if (bad && bad(v)) return { icon: '🔴', cls: 'sig-red' };
  return { icon: '🟡', cls: 'sig-amber' };
}

// ── ADAPTER: UPPERCASE mega keys → lowercase module keys ─────────────────────
// Converts megaParse() output to the format expected by acciones360 engine
// and señales evaluador. Arrays are preserved as scalars (last value).
function megaAdaptToLower(d) {
  const N  = k => mNum(d, k);
  const A  = k => mArr(d, k);
  const L  = k => mLast(A(k));
  // Scalar: prefer direct scalar key; fallback to last of array
  const SC = k => N(k) !== null ? N(k) : L(k);

  return {
    empresa:             d.EMPRESA || d.empresa || '',
    ticker:              d.TICKER  || d.ACCION  || '',

    // ── P&L scalars (last annual value)
    ingresos:            SC('INGRESOS'),
    utilidad_bruta:      SC('UTILIDAD_BRUTA'),
    ebit:                SC('EBIT'),
    ebitda:              SC('EBITDA'),
    ganancias_netas:     SC('GANANCIAS_NETAS'),
    fcf:                 SC('FCF'),
    cash_ops:            SC('OFC'),
    capex:               SC('CAPEX'),
    equity:              SC('EQUITY'),

    // ── Márgenes
    margen_bruto:        N('MARGEN_BRUTO'),
    margen_ebit:         N('MARGEN_EBIT'),
    margen_ebitda:       N('MARGEN_EBITDA'),
    margen_neto:         N('MARGEN_NETO'),
    fcf_margen_apal:     N('FCF_APAL')   || N('FCF_MARGEN_APAL'),
    fcf_margin_unapal:   N('FCF_SIN_APAL'),
    fcf_margen_sin_apal: N('FCF_SIN_APAL'),
    capex_margin:        N('MARGEN_CAPEX'),
    capex_margen:        N('MARGEN_CAPEX'),

    // ── Retornos
    roe:                 N('ROE'),
    roa:                 N('ROA'),
    roic:                N('ROIC') !== null ? N('ROIC') : L('ROIC'),
    wacc:                N('WACC'),

    // ── FCF
    fcf_yield:           N('FCF_YIELD'),
    fcf_neto:            SC('FCF'),       // senales uses fcf_neto
    bpa_growth:          N('BPA_GROWTH'),

    // ── Deuda
    deuda_total:         N('DEUDA_TOTAL'),
    deuda_neta:          N('DEUDA_NETA'),
    deuda_neta_ebitda:   N('DEUDA_NETA_EBITDA'),
    deuda_patrimonio:    N('DEUDA_PATRIMONIO'),
    caja:                N('CAJA'),
    icr:                 N('ICR'),

    // ── Liquidez
    current_ratio:       N('CURRENT_RATIO') || N('CRATIO'),
    quick_ratio:         N('QUICK_RATIO')   || N('QRATIO'),

    // ── Valoración
    per:                 N('PER'),
    per_fwd:             N('PER_FWD'),
    per_ltm:             N('PER'),        // senales uses per_ltm
    peg:                 N('PEG'),
    ev:                  N('EV'),
    ev_ebit:             N('EV_EBIT'),
    ev_ebitda:           N('EV_EBITDA'),
    ev_fcf:              N('EV_FCF'),

    // ── Scoring
    altman_z:            N('ALTMAN'),
    piotroski:           N('PIOTROSKI'),

    // ── Cualitativos (senales evaluador usa valores 'si'/'no')
    balance_sano:        d.BALANCE_SANO      || null,
    salud_debil:         d.SALUD_DEBIL       || null,
    ventaja_competitiva: d.VENTAJA_COMP      || null,
    sector_deterioro:    d.SECTOR_DETERIORO  || null,
    re_rating_ev:        d.RE_RATING_EV      || null,
    spin_off:            d.SPIN_OFF          || null,
    recompra:            d.RECOMPRA          || null,
    venta_activos:       d.VENTA_ACTIVOS     || null,
  };
}
