// ── parser.js — Señales v3.0 ──────────────────────────────────────────────
// Convierte texto libre / CSV / Excel / DOCX / PDF en un objeto de datos
// financieros normalizados listo para el evaluador.

const DF = null; // DATO FALTANTE sentinel

function ok(v) { return v !== DF && v !== null && v !== undefined; }

const FIELD_MAP = {
  // Rentabilidad
  roic:                ['rendimiento del capital invertido','roic','return on invested capital'],
  wacc:                ['wacc','weighted average cost of capital','costo de capital'],
  roe:                 ['rendimiento de capital','roe','return on equity','retorno sobre patrimonio'],
  roa:                 ['rendimiento de activos','roa','return on assets','retorno sobre activos'],

  // Ingresos y márgenes
  ingresos:            ['ingresos','revenue','ventas','total revenue','ingresos totales'],
  utilidad_bruta:      ['utilidad bruta','gross profit','ganancia bruta'],
  ganancias_netas:     ['ganancias netas','net income','utilidad neta','net profit'],
  margen_bruto:        ['margen beneficio bruto','margen bruto','gross margin','margen bruta'],
  margen_neto:         ['margen neto','net margin','net profit margin'],
  margen_ebitda:       ['margen ebitda','ebitda margin'],
  margen_ebit:         ['margen ebit','ebit margin','operating margin','margen operativo'],

  // EBIT / EBITDA
  ebit:                ['ebit','operating income','resultado operativo'],
  ebitda:              ['ebitda'],

  // FCF
  fcf_neto:            ['flujo de caja libre neto','fcf','fcf apalancado','free cash flow','fcf neto','levered free cash flow'],
  fcf_yield:           ['rendimiento de flujo de caja libre','fcf yield','free cash flow yield','rendimiento fcf'],
  fcf_margen_apal:     ['margen de flujo de caja libre apalancado','margen fcf apalancado','levered fcf margin','fcf margin apalancado'],
  fcf_margen_sin_apal: ['margen de flujo de caja libre sin apalancamiento','margen fcf sin apal','unlevered fcf margin','fcf margin sin apalancamiento'],

  // Valoración
  per_ltm:             ['per ltm','p/e ltm','price to earnings ltm','pe ltm','per'],
  per_fwd:             ['relación per (fwd)','per forward','p/e forward','pe forward','per fwd'],
  peg:                 ['ratio peg','peg','peg ratio'],
  ev:                  ['valor de la empresa (ve)','valor de la empresa','ev','enterprise value','valor empresa'],
  ev_ebit:             ['ev/ebit','ve/ebit','ve / ebit','ev ebit'],
  ev_ebitda:           ['ev/ebitda','ve/ebitda','ve / ebitda','ev ebitda'],
  ev_fcf:              ['ve / flujo de caja libre','ev/fcf','ve/fcf','ev fcf'],

  // Deuda
  deuda_patrimonio:    ['deuda / patrimonio','deuda/patrimonio','d/e','debt to equity','deuda patrimonio'],
  deuda_neta_ebitda:   ['deuda neta / ebitda','deuda neta/ebitda','net debt/ebitda','deuda neta ebitda'],
  deuda_neta:          ['deuda neta','net debt'],
  deuda_total:         ['deuda total','total debt'],
  equity:              ['capital contable','equity','patrimonio neto','patrimonio','capital','book value'],

  // CapEx
  capex:               ['gastos de capital','capex','capital expenditure','inversión en activos'],
  capex_margen:        ['margen de gastos de capital','margen capex','capex margin','capex/revenue'],
  ppe:                 ['pp&e','ppe','property plant equipment','activos fijos brutos'],
  benef_bruto_activos: ['beneficio bruto / activos totales','benef bruto/activos','gross profit/assets','benef bruto activos'],

  // Crecimiento
  eps_growth:          ['crecimiento básico del bpa','eps growth','crecimiento eps','earnings per share growth'],
  eps_fwd:             ['previsiones de bpa (investingpro)','previsiones de bpa','eps proyectado','eps forward','eps fwd','eps estimado'],
  cfo:                 ['efectivo de las operaciones','cfo','efectivo de operaciones','cash from operations','flujo operativo'],

  // Cualitativos
  balance_sano:        ['balance sano','balance solido','balance limpio','balance sólido'],
  salud_debil:         ['salud estructural débil','salud debil','salud estructural debil'],
  ventaja_comp:        ['ventaja competitiva','moat','competitive advantage'],
  sector_deterioro:    ['sector deteriorándose','sector deteriorando','sector en deterioro'],
  re_rating_ev:        ['posible re-rating ev','re rating ev','rerating ev'],
  spin_off:            ['spin-off','spinoff','spin off'],
  recompra:            ['recompra agresiva','recompra de acciones','buyback agresivo','share buyback'],
  venta_activos:       ['venta de activos','asset sale','venta activos'],
  // InvestingPro labels
  ingresos_netos_margin: ['ingresos netos margen accionistas'],
  minority_int:          ['margen de intereses minoritarios de los resultados'],
  deuda_lp:              ['deuda a largo plazo', 'long-term debt'],
  da:                    ['depreciación y amortización', 'depreciation and amortization'],
  efectivo_bg:           ['efectivo neto (ben graham)'],
  ppe_brutos:            ['propiedad, planta y equipo brutos'],
  beneish:               ['fórmula beneish m-score', 'beneish m-score'],
  altman_z:              ['fórmula altman z-score', 'altman z', 'z-score'],
  piotroski_score:       ['puntuación piotroski', 'piotroski f-score', 'piotroski score'],
  capital_total:         ['capital total'],
  asset_turnover:        ['rotación de activos', 'asset turnover'],
  efectivo_equiv:        ['efectivo y equivalentes', 'cash and equivalents'],
  acciones_circ:         ['acc. en circulación', 'acciones en circulación'],
  revenue_proj:          ['previsión de ingresos (investingpro)', 'previsión de ingresos', 'revenue forecast'],
};

// ── Helpers ──────────────────────────────────────────────────────────────

function limpiarNumero(str) {
  if (!str) return DF;
  const s = String(str).trim().replace(/,(?=\d{3})/g, '');
  let num = s.replace(/[$€\s]/g, '').replace(/–/g, '-');
  let mult = 1;
  if (/[Bb]$/.test(num)) { mult = 1000; num = num.slice(0, -1); }
  else if (/[Mm]$/.test(num)) { mult = 1; num = num.slice(0, -1); }
  else if (/[Kk]$/.test(num)) { mult = 0.001; num = num.slice(0, -1); }
  num = num.replace(/[%xX]/g, '');
  const val = parseFloat(num);
  return isNaN(val) ? DF : val * mult;
}

function normalizarCualitativo(str) {
  if (!str) return DF;
  const s = str.toString().trim().toLowerCase();
  if (/^\s*(sí|si|yes|true|1|x)\s*$/i.test(s)) return 'si';
  if (/^\s*(no|false|0)\s*$/i.test(s)) return 'no';
  return DF;
}

const CUALITATIVOS = ['balance_sano','salud_debil','ventaja_comp','sector_deterioro',
                      're_rating_ev','spin_off','recompra','venta_activos'];

// Pre-ordenar entradas: primero exactas por longitud de alias desc → evita
// que 'ebit' capture 'Margen EBITDA', 'ingresos' capture 'Ingresos netos…', etc.
const _FIELD_ENTRIES_SORTED = Object.entries(FIELD_MAP)
  .map(([k, v]) => [k, v.slice().sort((a, b) => b.length - a.length)])
  .sort((a, b) => (b[1][0]?.length ?? 0) - (a[1][0]?.length ?? 0));

function buscarCampo(linea) {
  const l = linea.toLowerCase().trim();
  // Primero: coincidencia exacta (resuelve ambigüedad sin importar orden)
  for (const [campo, aliases] of _FIELD_ENTRIES_SORTED) {
    for (const alias of aliases) {
      if (l === alias) return campo;
    }
  }
  // Segundo: substring (alias más largos primero gracias al orden pre-calculado)
  for (const [campo, aliases] of _FIELD_ENTRIES_SORTED) {
    for (const alias of aliases) {
      if (l.includes(alias)) return campo;
    }
  }
  return null;
}

function extraerValor(linea) {
  // busca después de : o = o tab
  const m = linea.match(/[:=\t]\s*(.+)$/);
  return m ? m[1].trim() : null;
}

// ── Parser principal ──────────────────────────────────────────────────────

function parsearTexto(texto) {
  const datos = {};
  // Inicializar todos los campos en DF
  for (const campo of Object.keys(FIELD_MAP)) datos[campo] = DF;

  const lineas = texto.split(/\n|\r/).map(l => l.trim()).filter(l => l.length > 1 && !l.startsWith('#') && !l.startsWith('//'));

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];
    const campo = buscarCampo(linea);
    if (!campo) continue;

    // Intentar valor en misma línea (KEY: VALUE) o siguiente línea (InvestingPro)
    let valorRaw = extraerValor(linea);
    if (!valorRaw && i + 1 < lineas.length) {
      const sig = lineas[i + 1].trim();
      if (sig && /^[-–]?[\d$]/.test(sig)) {
        valorRaw = sig;
        i++;
      }
    }
    if (!valorRaw) continue;

    if (CUALITATIVOS.includes(campo)) {
      datos[campo] = normalizarCualitativo(valorRaw);
    } else {
      datos[campo] = limpiarNumero(valorRaw);
    }
  }

  // Calcular derivados
  calcularDerivados(datos);
  return datos;
}

function calcularDerivados(d) {
  if (d.roic !== DF && d.wacc !== DF) d.spread_roic_wacc = d.roic - d.wacc;
  if (d.ev_ebit !== DF && d.ev_ebit !== 0) d.roimp = (1 / d.ev_ebit) * 100;
  if (d.ebit !== DF && d.ebitda !== DF && d.ebitda !== 0) d.ratio_ebit_ebitda = (d.ebit / d.ebitda) * 100;
}

// ── Parsear CSV ───────────────────────────────────────────────────────────

function parsearCSV(texto) {
  // Intento interpretar como tabla key-value
  const lineas = texto.split(/\n/).map(l => l.split(/[;,\t]/));
  let textoResultante = '';
  for (const partes of lineas) {
    if (partes.length >= 2) {
      textoResultante += partes[0] + ': ' + partes[1] + '\n';
    }
  }
  return parsearTexto(textoResultante);
}

// ── Parsear Excel (ArrayBuffer) ───────────────────────────────────────────

function parsearExcel(buffer) {
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  let texto = '';
  for (const row of rows) {
    if (row.length >= 2 && row[0]) {
      texto += row[0] + ': ' + row[1] + '\n';
    }
  }
  return parsearTexto(texto);
}

// ── Parsear DOCX (ArrayBuffer) ────────────────────────────────────────────

async function parsearDocx(buffer) {
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return parsearTexto(result.value);
}

// ── Parsear PDF (ArrayBuffer) ─────────────────────────────────────────────

async function parsearPDF(buffer) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  let texto = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    texto += content.items.map(s => s.str).join(' ') + '\n';
  }
  return parsearTexto(texto);
}

// ── Entry point para archivo ──────────────────────────────────────────────

async function parsearArchivo(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const buffer = await file.arrayBuffer();

  if (ext === 'xlsx' || ext === 'xls') return parsearExcel(new Uint8Array(buffer));
  if (ext === 'docx') return parsearDocx(buffer);
  if (ext === 'pdf')  return parsearPDF(buffer);
  // txt / csv → leer como texto
  const texto = new TextDecoder('utf-8').decode(buffer);
  if (ext === 'csv') return parsearCSV(texto);
  return parsearTexto(texto);
}
