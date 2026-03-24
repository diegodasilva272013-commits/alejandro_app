// ── calculator.js ─────────────────────────────────────────────────────────────
const Calculator = {

  DATO_FALTANTE: "DATO_FALTANTE",

  calcROImp(data) {
    if (data.ev_ebit != null) {
      return { value: (1 / data.ev_ebit) * 100, source: "directo" };
    }
    if (data.ev != null && data.ebit != null) {
      const ev_ebit = data.ev / data.ebit;
      return { value: (1 / ev_ebit) * 100, ev_ebit_calc: ev_ebit, source: "calculado" };
    }
    return { value: null, source: this.DATO_FALTANTE };
  },

  calcDeudaNeta(data) {
    if (data.deuda_neta != null) return { value: data.deuda_neta, source: "directo" };
    if (data.deuda_total != null && data.caja != null) {
      return { value: data.deuda_total - data.caja, source: "calculado" };
    }
    return { value: null, source: this.DATO_FALTANTE };
  },

  calcCajaImplicita(data) {
    if (data.deuda_total != null && data.deuda_neta != null) {
      return data.deuda_total - data.deuda_neta;
    }
    return null;
  },

  evaluate(data) {
    const roiMP  = this.calcROImp(data);
    const wacc   = data.wacc;
    const roic   = data.roic;
    const umbral = wacc != null ? wacc + 1.5 : null;
    const deudaN = this.calcDeudaNeta(data);
    const caja   = this.calcCajaImplicita(data);
    const r      = {};

    // ── A: ROImp ──────────────────────────────────────────────────────────────
    r.roimp_calc = {
      label: "ROImp — Cálculo principal",
      formula: "1 / (EV/EBIT) × 100",
      value: roiMP.value,
      result: roiMP.value == null ? "DATO_FALTANTE"
            : roiMP.value < wacc  ? "NO_CUMPLE" : "CUMPLE",
      detail: roiMP.value != null
        ? `EV/EBIT = ${(data.ev_ebit || data.ev / data.ebit).toFixed(2)}x → ROImp = ${roiMP.value.toFixed(2)}%`
        : "EV/EBIT o EV y EBIT no disponibles"
    };

    r.roimp_vs_umbral = {
      label: "ROImp vs WACC + 1.5% (margen de seguridad)",
      value: roiMP.value,
      umbral,
      result: roiMP.value == null || umbral == null ? "DATO_FALTANTE"
            : roiMP.value >= umbral ? "CUMPLE" : "NO_CUMPLE",
      detail: roiMP.value != null && umbral != null
        ? `ROImp=${roiMP.value.toFixed(2)}% vs Umbral=${umbral.toFixed(2)}% | Gap: ${(roiMP.value - umbral).toFixed(2)} pp`
        : "Datos insuficientes"
    };

    r.roic_vs_wacc = {
      label: "ROIC vs WACC",
      value: roic,
      wacc,
      result: roic == null || wacc == null ? "DATO_FALTANTE"
            : roic > wacc ? "CUMPLE" : "NO_CUMPLE",
      detail: roic != null && wacc != null
        ? `ROIC=${roic.toFixed(2)}% vs WACC=${wacc.toFixed(2)}%`
        : "DATO FALTANTE"
    };

    r.regla_critica = {
      label: "Regla crítica: ROIC > WACC pero ROImp < WACC → NO COMPRAR",
      result: roic == null || roiMP.value == null || wacc == null ? "DATO_FALTANTE"
            : roiMP.value < wacc ? "NO_CUMPLE" : "CUMPLE",
      detail: roic != null && roiMP.value != null && wacc != null
        ? `ROIC=${roic.toFixed(2)}% | ROImp=${roiMP.value.toFixed(2)}% | WACC=${wacc.toFixed(2)}%`
        : "DATO FALTANTE"
    };

    // ── B: Trampas ────────────────────────────────────────────────────────────
    r.trampa_per = {
      label: "PER bajo — EBIT es débil",
      result: data.per == null || data.ebit == null ? "DATO_FALTANTE"
            : data.per < 15 && data.ebit > 0 ? "CUMPLE" : "NO_CUMPLE",
      detail: data.per != null ? `PER=${data.per.toFixed(1)}x | EBIT=$${data.ebit != null ? data.ebit.toFixed(1) : "?"}M` : "DATO FALTANTE"
    };

    r.trampa_roe = {
      label: "ROE alto — equity se erosiona",
      result: data.roe == null ? "DATO_FALTANTE"
            : data.roe > 20 ? "ALERTA" : "CUMPLE",
      detail: data.roe != null ? `ROE=${data.roe.toFixed(1)}%` : "DATO FALTANTE"
    };

    r.trampa_roic = {
      label: "ROIC alto — mercado ya lo pagó",
      result: roic == null || wacc == null ? "DATO_FALTANTE"
            : roic < wacc ? "NO_CUMPLE" : "CUMPLE",
      detail: roic != null && wacc != null ? `ROIC=${roic.toFixed(1)}% vs WACC=${wacc.toFixed(1)}%` : "DATO FALTANTE"
    };

    r.trampa_ebitda = {
      label: "EBITDA fuerte — CapEx e intereses matan EBIT",
      result: data.ebitda == null || data.capex == null ? "DATO_FALTANTE"
            : (data.capex / (data.ingresos || 1)) < 0.10 ? "CUMPLE" : "NO_CUMPLE",
      detail: data.ebitda != null
        ? `EBITDA=$${data.ebitda.toFixed(1)}M | CapEx=$${data.capex != null ? data.capex.toFixed(1) : "?"}M (${data.capex_margin != null ? data.capex_margin.toFixed(1) : "?"}% ingresos)`
        : "DATO FALTANTE"
    };

    r.trampa_roimp = {
      label: "ROImp < WACC — Trampa clásica",
      result: roiMP.value == null || wacc == null ? "DATO_FALTANTE"
            : roiMP.value < wacc ? "NO_CUMPLE" : "CUMPLE",
      detail: roiMP.value != null && wacc != null
        ? `ROImp=${roiMP.value.toFixed(2)}% vs WACC=${wacc.toFixed(2)}%`
        : "DATO FALTANTE"
    };

    // ── C: Cuándo ignorar ROImp < WACC ───────────────────────────────────────
    r.ebit_creciendo = {
      label: "Crecimiento de EBIT visible y cercano",
      result: data.bpa_growth != null || data.revenue_proj != null ? "CUMPLE" : "DATO_FALTANTE",
      detail: data.bpa_growth != null
        ? `BPA growth=${data.bpa_growth.toFixed(1)}% | Rev.proj=$${data.revenue_proj != null ? data.revenue_proj.toFixed(0) : "?"}M`
        : "DATO FALTANTE — serie EBIT no aportada"
    };

    r.ingr_creciendo = {
      label: "Crecimiento Ingresos > 10%, utilidades creciendo",
      result: data.ingresos == null || data.revenue_proj == null ? "DATO_FALTANTE"
            : ((data.revenue_proj - data.ingresos) / data.ingresos * 100) > 10 ? "CUMPLE" : "NO_CUMPLE",
      detail: data.ingresos != null && data.revenue_proj != null
        ? `Ingresos actuales=$${data.ingresos.toFixed(0)}M | Proyección=$${data.revenue_proj.toFixed(0)}M → Δ=${((data.revenue_proj - data.ingresos) / data.ingresos * 100).toFixed(1)}%`
        : "DATO FALTANTE"
    };

    r.capex_bajo = {
      label: "CapEx bajo y decreciente",
      result: data.capex_margin == null ? "DATO_FALTANTE"
            : data.capex_margin < 5 ? "CUMPLE" : "NO_CUMPLE",
      detail: data.capex_margin != null
        ? `CapEx margin=${data.capex_margin.toFixed(1)}% de ingresos`
        : "DATO FALTANTE"
    };

    r.fcf_bueno = {
      label: "FCF bueno y creciente",
      result: data.fcf == null ? "DATO_FALTANTE"
            : data.fcf > 0 ? "CUMPLE" : "NO_CUMPLE",
      detail: data.fcf != null ? `FCF=$${data.fcf.toFixed(1)}M | Yield=${data.fcf_yield != null ? data.fcf_yield.toFixed(1) : "?"}%` : "DATO FALTANTE"
    };

    r.apalancamiento_bajo = {
      label: "Apalancamiento bajo",
      result: deudaN.value == null ? "DATO_FALTANTE"
            : deudaN.value < 0 ? "CUMPLE" : "NO_CUMPLE",
      detail: deudaN.value != null
        ? `Deuda Neta=$${deudaN.value.toFixed(0)}M (${deudaN.value < 0 ? "NEGATIVA ✔" : "POSITIVA"})`
        : "DATO FALTANTE"
    };

    // ── D: Deuda Neta ─────────────────────────────────────────────────────────
    r.deuda_neta_calc = {
      label: "Cálculo Deuda Neta",
      value: deudaN.value,
      result: deudaN.value == null ? "DATO_FALTANTE" : "CUMPLE",
      clasificacion: deudaN.value != null
        ? deudaN.value < 0 ? "SÓLIDA / CONTROLADA" : "NO CONTROLADA"
        : "DATO FALTANTE",
      detail: deudaN.value != null
        ? `Deuda Neta = $${deudaN.value.toFixed(0)}M → ${deudaN.value < 0 ? "NEGATIVA → SÓLIDA" : "POSITIVA → RIESGO"}`
        : "Deuda Total o Caja no disponibles"
    };

    // ── E/F: Deuda Controlada ─────────────────────────────────────────────────
    r.dn_ebitda = {
      label: "Deuda Neta/EBITDA ≤ 2X",
      result: data.deuda_neta_ebitda == null ? "DATO_FALTANTE"
            : Math.abs(data.deuda_neta_ebitda) <= 2 ? "CUMPLE" : "NO_CUMPLE",
      detail: data.deuda_neta_ebitda != null
        ? `Deuda Neta/EBITDA = ${data.deuda_neta_ebitda.toFixed(1)}x`
        : "DATO FALTANTE"
    };

    r.icr = {
      label: "ICR 2–5X",
      result: data.icr == null ? "DATO_FALTANTE"
            : data.icr >= 2 && data.icr <= 5 ? "CUMPLE" : "NO_CUMPLE",
      detail: data.icr != null ? `ICR = ${data.icr.toFixed(1)}x` : "DATO FALTANTE — reportado como N/A"
    };

    r.deuda_patrimonio = {
      label: "Deuda/Patrimonio < 80%",
      result: data.deuda_patrimonio == null ? "DATO_FALTANTE"
            : data.deuda_patrimonio < 80 ? "CUMPLE" : "NO_CUMPLE",
      detail: data.deuda_patrimonio != null
        ? `Deuda/Patrimonio = ${data.deuda_patrimonio.toFixed(1)}%`
        : "DATO FALTANTE"
    };

    r.fcf_margin_comp = {
      label: "Margen FCF Apalancado ≥ Margen FCF sin Apalancamiento",
      result: data.fcf_margin_apal == null || data.fcf_margin_unapal == null ? "DATO_FALTANTE"
            : data.fcf_margin_apal >= data.fcf_margin_unapal ? "CUMPLE" : "NO_CUMPLE",
      detail: data.fcf_margin_apal != null
        ? `Apal=${data.fcf_margin_apal.toFixed(1)}% vs Sin Apal=${data.fcf_margin_unapal != null ? data.fcf_margin_unapal.toFixed(1) : "?"}%`
        : "DATO FALTANTE"
    };

    // ── G: EV/FCF ─────────────────────────────────────────────────────────────
    r.ev_fcf_alto = {
      label: "EV/FCF > 15X — Revisión obligatoria",
      result: data.ev_fcf == null ? "DATO_FALTANTE"
            : data.ev_fcf > 15 ? "NO_CUMPLE" : "CUMPLE",
      detail: data.ev_fcf != null
        ? `EV/FCF = ${data.ev_fcf.toFixed(1)}x (${data.ev_fcf > 15 ? "> 15x → revisión" : "≤ 15x → ok"})`
        : "DATO FALTANTE"
    };

    r.ev_fcf_bajo = {
      label: "EV/FCF < 6X — Revisión obligatoria",
      result: data.ev_fcf == null ? "DATO_FALTANTE"
            : data.ev_fcf < 6 ? "NO_CUMPLE" : "CUMPLE",
      detail: data.ev_fcf != null
        ? `EV/FCF = ${data.ev_fcf.toFixed(1)}x (${data.ev_fcf < 6 ? "< 6x → pico de ciclo?" : "≥ 6x → ok"})`
        : "DATO FALTANTE"
    };

    // ── K: Deuda Neta / EV ────────────────────────────────────────────────────
    r.dn_ev = {
      label: "Deuda Neta / EV",
      result: deudaN.value == null || data.ev == null ? "DATO_FALTANTE" : "CUMPLE",
      value: deudaN.value != null && data.ev != null ? deudaN.value / data.ev * 100 : null,
      detail: deudaN.value != null && data.ev != null
        ? `Deuda Neta($${deudaN.value.toFixed(0)}M) / EV($${data.ev.toFixed(0)}M) = ${(deudaN.value / data.ev * 100).toFixed(1)}%`
        : "DATO FALTANTE"
    };

    // ── H: Congruencia de ORO ─────────────────────────────────────────────────
    const condOro = [
      deudaN.value != null && deudaN.value < 0,
      data.fcf != null && data.fcf > 0,
      roic != null && wacc != null && roic > wacc,
      roiMP.value != null && wacc != null && roiMP.value > wacc,
      null,
    ];
    r.congruencia_oro = {
      label: "Congruencia de ORO",
      condiciones: condOro,
      cumplidas: condOro.filter(c => c === true).length,
      total: 5,
      result: condOro.filter(c => c === true).length >= 4 ? "CUMPLE" : "NO_CUMPLE"
    };

    // ── VEREDICTO ─────────────────────────────────────────────────────────────
    r.veredicto = {
      roimp: roiMP.value,
      wacc,
      umbral,
      roic,
      no_comprar: roiMP.value != null && wacc != null && roiMP.value < wacc,
      label: roiMP.value != null && wacc != null
        ? roiMP.value < wacc
          ? `✘ ROImp (${roiMP.value.toFixed(2)}%) < WACC (${wacc.toFixed(2)}%) → NO COMPRAR`
          : `✔ ROImp (${roiMP.value.toFixed(2)}%) > WACC (${wacc.toFixed(2)}%) → BUENA SEÑAL`
        : "⚠ Datos insuficientes para veredicto"
    };

    const allResults = Object.values(r).filter(v => v && v.result);
    r.stats = {
      cumple:   allResults.filter(v => v.result === "CUMPLE").length,
      nocumple: allResults.filter(v => v.result === "NO_CUMPLE").length,
      faltante: allResults.filter(v => v.result === "DATO_FALTANTE").length,
    };

    return { ...r, _raw: data, _roiMP: roiMP, _deudaNeta: deudaN, _caja: caja };
  }
};
