// ── parser.js ─────────────────────────────────────────────────────────────────
const FinancialParser = {

  FIELD_MAP: {
    ev:                ["valor de la empresa", "enterprise value", "ve)", "ev)", "ve (", "ev ("],
    ebit:              ["ebit)"],
    ev_ebit:           ["ve/ebit", "ev/ebit", "ve / ebit", "ev / ebit"],
    wacc:              ["wacc"],
    roic:              ["rendimiento del capital invertido", "roic", "retorno sobre capital invertido"],
    fcf:               ["flujo de caja libre neto", "free cash flow", "fcf apalancado", "flujo de caja libre"],
    fcf_yield:         ["rendimiento de flujo de caja libre", "fcf yield", "fcf yeild"],
    ev_fcf:            ["ve / flujo de caja libre", "ev/fcf", "ve/fcf"],
    margen_ebit:       ["margen ebit"],
    ebitda:            ["ebitda)"],
    margen_ebitda:     ["margen ebitda"],
    per:               ["per)", "relación per (ltm)", "p/e"],
    per_fwd:           ["relación per (fwd)", "per fwd", "per forward"],
    peg:               ["ratio peg", "peg"],
    roe:               ["rendimiento de capital)", "roe", "return on equity"],
    roa:               ["rendimiento de activos", "roa"],
    equity:            ["capital contable", "equity", "patrimonio neto"],
    deuda_total:       ["deuda total"],
    deuda_neta:        ["deuda neta)"],
    deuda_neta_ebitda: ["deuda neta / ebitda", "deuda neta/ebitda"],
    icr:               ["ratio de cobertura de intereses", "icr", "interest coverage"],
    deuda_patrimonio:  ["deuda / patrimonio", "deuda/patrimonio"],
    deuda_cp:          ["deuda a corto plazo"],
    fcf_margin_apal:   ["margen de flujo de caja libre apalancado", "fcf levered margin"],
    fcf_margin_unapal: ["margen de flujo de caja libre sin apalancamiento", "fcf unlev margin"],
    capex:             ["gastos de capital", "capex"],
    capex_margin:      ["margen de gastos de capital"],
    ingresos:          ["ingresos)"],
    utilidad_bruta:    ["utilidad bruta"],
    ganancias_netas:   ["ganancias netas"],
    margen_bruto:      ["margen beneficio bruto"],
    margen_neto:       ["ingresos netos margen"],
    cash_ops:          ["efectivo de las operaciones"],
    bpa_growth:        ["crecimiento básico del bpa"],
    eps_proj:          ["previsiones de bpa"],
    revenue_proj:      ["previsión de ingresos"],
    shares:            ["acc. en circulación", "acciones en circulación"],
    altman_z:          ["fórmula altman z-score", "altman z"],
    piotroski:         ["puntuación piotroski"],
    current_ratio:     ["ratio de solvencia"],
    quick_ratio:       ["prueba ácida"],
  },

  parseValue(raw) {
    if (!raw) return null;
    const s = raw.toString().trim();
    if (s === "N/A" || s === "–" || s === "-" || s === "") return null;

    let num = s
      .replace(/[$,\s]/g, "")
      .replace(/x$/i, "")
      .replace(/%$/, "")
      .replace(/–/g, "-")
      .trim();

    let multiplier = 1;
    if (/[bB]$/.test(num)) { multiplier = 1000; num = num.slice(0, -1); }
    if (/[mM]$/.test(num)) { multiplier = 1;    num = num.slice(0, -1); }

    const val = parseFloat(num);
    if (isNaN(val)) return null;
    return val * multiplier;
  },

  async parseDocx(file) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return this.parseText(result.value);
  },

  parseText(text) {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    const data = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      const nextLine = lines[i + 1] || "";

      for (const [field, aliases] of Object.entries(this.FIELD_MAP)) {
        if (data[field] !== undefined) continue;
        if (aliases.some(alias => line.includes(alias))) {
          const raw = this.extractValueFromLine(lines[i]) || nextLine;
          const val = this.parseValue(raw);
          if (val !== null) {
            data[field] = val;
            data[`${field}_raw`] = raw.trim();
          }
          break;
        }
      }
    }

    return data;
  },

  extractValueFromLine(line) {
    const match = line.match(/[\s\t]([\-–]?\$?[\d,\.]+\s*[BbMmKk%x]?)\s*$/);
    return match ? match[1] : null;
  },

  parseManualForm(formData) {
    const data = {};
    for (const [key, val] of Object.entries(formData)) {
      if (val !== "" && val !== null) {
        data[key] = this.parseValue(val);
        data[`${key}_raw`] = val;
      }
    }
    return data;
  }
};
