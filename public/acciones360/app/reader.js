// ── reader.js — Módulo 1: Lector universal de archivos ────────────────────────
const Reader = {

  // ── Mapa de aliases (nombre en texto → clave interna) ─────────────────────
  FIELD_MAP: {
    // Empresa
    empresa:          ['empresa', 'company', 'compañía', 'compania', 'nombre empresa'],
    ticker:           ['ticker', 'símbolo', 'simbolo', 'symbol'],

    // P&L
    ingresos:         ['ingresos totales', 'ingresos', 'ventas netas', 'revenue', 'total revenue', 'net revenue'],
    utilidad_bruta:   ['utilidad bruta', 'ganancia bruta', 'gross profit', 'beneficio bruto'],
    ebitda:           ['ebitda', 'ebitda ', 'ebitda)', 'ebitda ('],
    ebit:             ['ebit', 'ebit ', 'ebit)', 'ebit (', 'utilidad operativa', 'operating income', 'beneficio operativo'],
    ganancias_netas:  ['ganancias netas', 'ganancia neta', 'utilidad neta', 'net income', 'net earnings', 'beneficio neto'],
    margen_ebitda:    ['margen ebitda', 'ebitda margin'],
    margen_bruto:     ['margen beneficio bruto', 'margen bruto', 'gross margin', 'gross profit margin'],
    margen_ebit:      ['margen ebit', 'operating margin', 'margen operativo'],
    bpa_growth:       ['crecimiento básico del bpa', 'eps growth', 'bpa growth', 'crecimiento bpa', 'earnings growth'],

    // Valoración
    per:              ['relación per (ltm)', 'per (ltm)', 'per ', 'per)', 'per', 'p/e)', 'price/earnings', 'pe ratio'],
    per_fwd:          ['per forward', 'relación per (fwd)', 'per fwd', 'forward pe', 'p/e forward'],
    peg:              ['ratio peg', 'peg ratio', 'peg)'],
    ev:               ['valor de la empresa', 'enterprise value', 'ev (', 've (', 'ev)', 've)'],
    ev_ebit:          ['ve/ebit', 'ev/ebit', 've / ebit', 'ev / ebit'],
    ev_fcf:           ['ve / flujo de caja libre', 'ev/fcf', 've/fcf', 'ev / fcf'],
    ev_ebitda:        ['ev/ebitda', 've/ebitda', 'ev / ebitda'],

    // Cash flow
    fcf:              ['fcf ', 'flujo de caja libre neto', 'free cash flow', 'fcf apalancado', 'flujo de caja libre)', 'levered fcf', 'fcf)'],
    fcf_yield:        ['rendimiento de flujo de caja libre', 'fcf yield', 'fcf yield)'],
    fcf_margin_apal:  ['margen de flujo de caja libre apalancado', 'fcf levered margin', 'margen fcf apalancado'],
    fcf_margin_unapal:['margen de flujo de caja libre sin apalancamiento', 'fcf unlevered margin', 'fcf unlev'],
    cash_ops:         ['efectivo de las operaciones', 'cash from operations', 'cfo', 'flujo caja operativo'],
    capex:            ['gastos de capital', 'capex)', 'capital expenditure', 'capital expenditures'],
    capex_margin:     ['margen de gastos de capital', 'capex margin'],

    // Retornos
    roic:             ['rendimiento del capital invertido', 'roic', 'roic ', 'roic)', 'return on invested capital', 'retorno capital invertido'],
    roe:              ['rendimiento de capital', 'roe', 'roe ', 'roe)', 'return on equity', 'retorno sobre patrimonio'],
    roa:              ['rendimiento de activos', 'roa', 'roa ', 'roa)', 'return on assets'],
    wacc:             ['wacc', 'wacc ', 'wacc)', 'costo de capital', 'weighted average cost'],

    // Balance / Deuda
    equity:           ['capital contable', 'equity)', 'patrimonio neto', 'stockholders equity', 'shareholders equity'],
    deuda_total:      ['deuda total', 'total debt', 'deuda financiera total'],
    deuda_neta:       ['deuda neta', 'net debt', 'deuda neta)', 'deuda neta ('],
    deuda_neta_ebitda:['deuda neta / ebitda', 'net debt/ebitda', 'deuda neta/ebitda', 'net debt / ebitda'],
    deuda_patrimonio: ['deuda / patrimonio', 'deuda/patrimonio', 'debt/equity', 'd/e ratio'],
    deuda_cp:         ['deuda a corto plazo', 'short-term debt', 'current portion'],
    icr:              ['ratio de cobertura de intereses', 'interest coverage', 'icr)', 'coverage ratio'],
    current_ratio:    ['ratio de solvencia', 'current ratio', 'liquidez corriente', 'razón corriente'],
    quick_ratio:      ['prueba ácida', 'quick ratio', 'acid test'],

    // Scoring / proyecciones
    altman_z:         ['fórmula altman z-score', 'altman z', 'z-score', 'altman zscore'],
    piotroski:        ['puntuación piotroski', 'piotroski f-score', 'piotroski score', 'f-score'],
    eps_proj:         ['previsiones de bpa (investingpro)', 'previsiones de bpa', 'eps forecast', 'eps proyectado', 'bpa proyectado', 'forward eps'],
    revenue_proj:     ['previsión de ingresos (investingpro)', 'previsión de ingresos', 'revenue forecast', 'ingresos proyectados'],
    shares:           ['acc. en circulación', 'acciones en circulación', 'shares outstanding', 'diluted shares'],

    // Balance adicional — necesario para indicadores CF
    activos_totales:  ['activos totales', 'total assets', 'total activos', 'activo total'],
    caja:             ['efectivo y equivalentes', 'cash and equivalents', 'caja y equivalentes', 'cash)', 'cash (', 'efectivo)'],
    precio_accion:    ['precio de la acción', 'precio acción', 'stock price', 'share price', 'precio actual', 'precio cierre'],

    // InvestingPro labels
    ingresos_netos_margin: ['ingresos netos margen accionistas'],
    minority_int:          ['margen de intereses minoritarios de los resultados'],
    deuda_lp:              ['deuda a largo plazo', 'long-term debt'],
    da:                    ['depreciación y amortización', 'depreciation and amortization'],
    efectivo_bg:           ['efectivo neto (ben graham)'],
    gbpta:                 ['beneficio bruto / activos totales'],
    ppe_brutos:            ['propiedad, planta y equipo brutos'],
    beneish:               ['fórmula beneish m-score', 'beneish m-score'],
    capital_total:         ['capital total'],
    asset_turnover:        ['rotación de activos', 'rotacion de activos'],

    // Indicadores CF — calidad de flujo de caja
    book_to_bill:     ['book-to-bill', 'book to bill', 'relación pedidos/facturación', 'orders/revenue'],
    backlog:          ['backlog', 'cartera de pedidos', 'pedidos pendientes', 'order backlog'],

    // Indicadores FWD — forward
    fcf_forecast:     ['fcf forecast', 'fcf proyectado', 'free cash flow forecast', 'fcf_forecast'],
  },

  // ── Limpiador de valor numérico ────────────────────────────────────────────
  parseValue(raw) {
    if (raw == null) return null;
    const s = raw.toString().trim();
    if (/^(n\/a|–|-|nd|na|null|undefined)$/i.test(s) || s === '') return null;

    let num = s.replace(/[$,\s]/g, '').replace(/–/g, '-').trim();

    let multiplier = 1;
    if (/[bB]$/.test(num)) { multiplier = 1000; num = num.slice(0, -1); }
    else if (/[mM]$/.test(num)) { multiplier = 1; num = num.slice(0, -1); }
    else if (/[kK]$/.test(num)) { multiplier = 0.001; num = num.slice(0, -1); }

    // Remove trailing x or %
    num = num.replace(/[x%]$/i, '');

    const val = parseFloat(num);
    return isNaN(val) ? null : val * multiplier;
  },

  // ── Extractor de valor del final de una línea ──────────────────────────────
  extractValue(line) {
    // Match: optional - sign, optional $, digits with optional M/B/K/% suffix
    const m = line.match(/([-–]?\$?[\d,]+\.?\d*\s*[BMKbmk%x]?)[\s\t]*$/);
    return m ? m[1].trim() : null;
  },

  // ── Identifica empresa del texto ───────────────────────────────────────────
  extractEmpresa(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    for (const pat of [
      /(?:empresa|company|compañía)[:\s]+([^\n\r\t]+)/i,
      /^([A-Z][A-Za-z\s\.&,]+)\s*\n/m,
    ]) {
      const m = text.match(pat);
      if (m) return m[1].trim().split('\n')[0].trim();
    }
    // Fallback: first non-numeric line
    return lines.find(l => /^[A-Za-z]/.test(l) && l.length < 60) || 'Empresa';
  },

  extractTicker(text) {
    const m = text.match(/(?:ticker|símbolo|symbol)[:\s]+([A-Z0-9]{1,8})/i);
    return m ? m[1].trim() : null;
  },

  // ── Parser de texto plano (pegar datos) ────────────────────────────────────
  parseText(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const data = { empresa: this.extractEmpresa(text), ticker: this.extractTicker(text) };

    // Pre-ordenar campos por longitud del alias más largo (desc) → evita
    // que 'ebit' capture 'EBITDA', 'roe' capture 'ROIC', etc.
    const sortedFields = Object.entries(this.FIELD_MAP)
      .filter(([f]) => f !== 'empresa' && f !== 'ticker')
      .map(([f, aliases]) => [f, aliases.slice().sort((a, b) => b.length - a.length)])
      .sort((a, b) => (b[1][0]?.length ?? 0) - (a[1][0]?.length ?? 0));

    for (let i = 0; i < lines.length; i++) {
      const lower = lines[i].toLowerCase().trim();
      const nextLine = (lines[i + 1] || '');

      // Primero: coincidencia exacta
      let matched = false;
      for (const [field, aliases] of sortedFields) {
        if (data[field] !== undefined) continue;
        if (aliases.some(alias => lower === alias.trim())) {
          const rawVal = this.extractValue(lines[i]) || nextLine.trim();
          const val = this.parseValue(rawVal);
          if (val !== null) {
            data[field] = val;
            data[`${field}_raw`] = rawVal.trim();
          }
          matched = true;
          break;
        }
      }
      if (matched) continue;

      // Segundo: substring (alias más largos primero)
      for (const [field, aliases] of sortedFields) {
        if (data[field] !== undefined) continue;
        if (aliases.some(alias => lower.includes(alias))) {
          const rawVal = this.extractValue(lines[i]) || nextLine.trim();
          const val = this.parseValue(rawVal);
          if (val !== null) {
            data[field] = val;
            data[`${field}_raw`] = rawVal.trim();
          }
          break;
        }
      }
    }
    return data;
  },

  // ── Parser de .docx (via mammoth) ─────────────────────────────────────────
  async parseDocx(file) {
    const ab = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: ab });
    const data = this.parseText(result.value);
    if (!data.empresa || data.empresa === 'Empresa') {
      data.empresa = file.name.replace(/\.docx$/i, '').replace(/[_-]/g, ' ').trim();
    }
    return data;
  },

  // ── Parser de .xlsx (via SheetJS / XLSX) ──────────────────────────────────
  async parseXlsx(file) {
    const ab = await file.arrayBuffer();
    const wb = XLSX.read(ab, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    // Try to extract empresa from first few rows
    let empresa = file.name.replace(/\.(xlsx|xls)$/i, '').replace(/[_-]/g, ' ').trim();
    const data = { empresa };

    // Build text representation then reuse parseText
    const textLines = rows
      .filter(r => r.some(c => c !== ''))
      .map(r => r.map(c => String(c).trim()).join('\t'));
    const text = textLines.join('\n');
    const parsed = this.parseText(text);
    return { ...parsed, empresa: parsed.empresa !== 'Empresa' ? parsed.empresa : empresa };
  },

  // ── Parser de .csv ─────────────────────────────────────────────────────────
  parseCsv(text, filename) {
    const data = this.parseText(text);
    if (!data.empresa || data.empresa === 'Empresa') {
      data.empresa = filename.replace(/\.csv$/i, '').replace(/[_-]/g, ' ');
    }
    return data;
  },

  // ── Parser de .pdf (via PDF.js o texto extraído) ───────────────────────────
  async parsePdf(file) {
    // Use pdf.js if available; fallback to text
    if (typeof pdfjsLib !== 'undefined') {
      const ab = await file.arrayBuffer();
      const typedArr = new Uint8Array(ab);
      const pdf = await pdfjsLib.getDocument({ data: typedArr }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map(item => item.str).join(' ') + '\n';
      }
      const data = this.parseText(fullText);
      if (!data.empresa || data.empresa === 'Empresa') {
        data.empresa = file.name.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ');
      }
      return data;
    }
    throw new Error('PDF.js no disponible. Usá el formato .docx o convertí a texto.');
  },

  // ── Entry point principal ──────────────────────────────────────────────────
  async read(file) {
    const name = file.name.toLowerCase();
    if (name.endsWith('.docx') || name.endsWith('.doc')) return this.parseDocx(file);
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) return this.parseXlsx(file);
    if (name.endsWith('.csv')) {
      const text = await file.text();
      return this.parseCsv(text, file.name);
    }
    if (name.endsWith('.pdf')) return this.parsePdf(file);
    // Fallback: try reading as text
    const text = await file.text();
    return this.parseText(text);
  },
};
