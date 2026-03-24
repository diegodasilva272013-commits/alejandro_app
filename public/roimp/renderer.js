// ── renderer.js ───────────────────────────────────────────────────────────────
const Renderer = {

  badge(result) {
    const map = {
      CUMPLE:        '<span class="badge cumple">✔ Cumple</span>',
      NO_CUMPLE:     '<span class="badge nocumple">✘ No Cumple</span>',
      DATO_FALTANTE: '<span class="badge faltante">⚠ Faltante</span>',
      ALERTA:        '<span class="badge nocumple">⚠ Alerta</span>',
    };
    return map[result] || map.DATO_FALTANTE;
  },

  evalBlock(label, docText, recibidos, calculo, result, interpretacion) {
    return `
      <div class="eval-block">
        <div>
          <div class="eval-label">${label}</div>
          <div class="eval-detail">
            <span class="key">Marco:</span> ${docText}<br>
            <span class="key">Datos:</span> ${recibidos}<br>
            ${calculo !== "—" ? `<span class="key">Cálculo:</span> ${calculo}<br>` : ""}
            <span class="key">Interpretación:</span> ${interpretacion}
          </div>
        </div>
        ${this.badge(result)}
      </div>`;
  },

  render(results, empresa) {
    const d  = results._raw;
    const r  = results;
    const rv = r.veredicto;

    // Header
    document.getElementById("empresa-name").textContent = empresa;

    // Veredicto bar
    document.getElementById("veredicto-bar").className =
      `veredicto-bar ${rv.no_comprar ? "no-comprar" : "buena-senal"}`;
    document.getElementById("veredicto-badge").textContent = rv.label;
    document.getElementById("veredicto-sub").textContent = rv.no_comprar
      ? "El precio de mercado no cubre el costo de capital. No es mala empresa — es mala entrada."
      : "El rendimiento implícito supera el costo de capital. Señal positiva.";

    // KPI Cards
    const ev_ebit_val = d.ev_ebit || (d.ev && d.ebit ? d.ev / d.ebit : null);
    const scoreTotal = r.stats.cumple + r.stats.nocumple;
    const scorePct   = scoreTotal > 0 ? Math.round(r.stats.cumple / scoreTotal * 100) : 0;
    const kpis = [
      { label: "ROImp", value: r._roiMP.value != null ? r._roiMP.value.toFixed(2) + "%" : "N/A",
        sub: rv.no_comprar ? "< WACC — No comprar" : "> WACC — Buena señal",
        cls: rv.no_comprar ? "nocumple" : "cumple" },
      { label: "WACC", value: d.wacc != null ? d.wacc.toFixed(2) + "%" : "N/A",
        sub: "Costo mínimo de capital", cls: "neutral" },
      { label: "ROIC", value: d.roic != null ? d.roic.toFixed(2) + "%" : "N/A",
        sub: d.roic != null && d.wacc != null ? (d.roic >= d.wacc ? "≥ WACC ✔" : "< WACC ✘") : "Dato faltante",
        cls: d.roic != null && d.wacc != null && d.roic >= d.wacc ? "cumple" : "nocumple" },
      { label: "EV/EBIT", value: ev_ebit_val != null ? ev_ebit_val.toFixed(1) + "x" : "N/A",
        sub: ev_ebit_val != null ? `ROImp = ${(1 / ev_ebit_val * 100).toFixed(2)}%` : "—",
        cls: "neutral" },
      { label: "EV / FCF", value: d.ev_fcf != null ? d.ev_fcf.toFixed(1) + "x" : "N/A",
        sub: d.ev_fcf != null ? (d.ev_fcf > 15 ? "Caro >15x ✘" : d.ev_fcf < 6 ? "Cuidado <6x ⚠" : "Rango ok ✔") : "Dato faltante",
        cls: d.ev_fcf != null ? (d.ev_fcf > 15 || d.ev_fcf < 6 ? "nocumple" : "cumple") : "neutral" },
      { label: "Score", value: `${scorePct}%`,
        sub: `${r.stats.cumple} de ${scoreTotal} criterios`,
        cls: scorePct >= 60 ? "cumple" : "nocumple" },
    ];

    document.getElementById("kpi-row").innerHTML = kpis.map(k => `
      <div class="kpi-card ${k.cls}">
        <div class="kpi-label">${k.label}</div>
        <div class="kpi-value">${k.value}</div>
        <div class="kpi-sub">${k.sub}</div>
      </div>`).join("");

    // Sección A
    const ev_ebit_str = ev_ebit_val != null ? ev_ebit_val.toFixed(2) : "?";
    document.getElementById("section-a-content").innerHTML =
      this.evalBlock("ROImp — Cálculo principal",
        "1 / (EV/EBIT) × 100 = Rendimiento Implícito",
        r.roimp_calc.detail,
        r._roiMP.value != null ? `1 / ${ev_ebit_str} × 100 = ${r._roiMP.value.toFixed(2)}%` : "—",
        r.roimp_calc.result,
        r.roimp_calc.result === "NO_CUMPLE"
          ? "ROImp < WACC. La empresa NO genera retornos suficientes para cubrir el costo de capital."
          : "ROImp ≥ WACC. Rendimiento operativo cubre el costo de capital.") +
      this.evalBlock("ROImp vs WACC + 1.5% (margen de seguridad)",
        "ROImp > WACC + 1.5% — margen de seguridad operativo",
        r.roimp_vs_umbral.detail,
        r._roiMP.value != null && rv.umbral != null ? `${r._roiMP.value.toFixed(2)}% > ${rv.umbral.toFixed(2)}%?` : "—",
        r.roimp_vs_umbral.result,
        "Compensa errores en EBIT, ciclos económicos, cambios de tasa y riesgo competitivo.") +
      this.evalBlock("ROIC vs WACC",
        "ROIC > WACC → Buena señal",
        r.roic_vs_wacc.detail, "—", r.roic_vs_wacc.result,
        "ROIC informa cuánto vale el motor operativo relativo al costo de capital.") +
      this.evalBlock("Regla crítica: ROIC > WACC pero ROImp < WACC → NO COMPRAR",
        "Si ROIC > WACC, pero ROImp < WACC → NO COMPRAR",
        r.regla_critica.detail, "—", r.regla_critica.result,
        "El mercado puede haber descontado ya toda la calidad del ROIC. La trampa de calidad.");

    // Sección B
    const trampas = [r.trampa_per, r.trampa_roe, r.trampa_roic, r.trampa_ebitda, r.trampa_roimp];
    document.getElementById("section-b-content").innerHTML = `
      <div style="padding:1rem 1.25rem;">
        <table class="trampa-table">
          <thead><tr>
            <th>RATIO</th><th>PUEDE ENGAÑAR SI…</th><th>DATOS</th><th>RESULTADO</th>
          </tr></thead>
          <tbody>${trampas.map(t => {
            const parts = t.label.split("—");
            return `<tr>
              <td style="font-weight:700;color:var(--silver3)">${parts[0].trim()}</td>
              <td style="color:var(--silver1);font-size:.78rem">${(parts[1] || "—").trim()}</td>
              <td style="color:var(--silver1);font-size:.78rem;font-family:'Space Mono',monospace">${t.detail}</td>
              <td>${this.badge(t.result)}</td>
            </tr>`;
          }).join("")}</tbody>
        </table>
      </div>`;

    // Sección C — Condiciones para ignorar ROImp < WACC
    const condC = [r.ebit_creciendo, r.ingr_creciendo, r.capex_bajo, r.fcf_bueno, r.apalancamiento_bajo];
    document.getElementById("section-c-content").innerHTML =
      condC.map(c => this.evalBlock(c.label, "", c.detail, "—", c.result, "")).join("");

    // Sección D
    document.getElementById("section-d-content").innerHTML =
      this.evalBlock("Cálculo Deuda Neta",
        "DEUDA NETA = Deuda Total (–) Caja y Equivalentes",
        r.deuda_neta_calc.detail, "—", r.deuda_neta_calc.result,
        `Clasificación: ${r.deuda_neta_calc.clasificacion}`) +
      this.evalBlock(r.dn_ebitda.label, "DN/EBITDA ≤ 2x → controlada", r.dn_ebitda.detail, "—", r.dn_ebitda.result, "") +
      this.evalBlock(r.deuda_patrimonio.label, "D/Patrimonio < 80%", r.deuda_patrimonio.detail, "—", r.deuda_patrimonio.result, "") +
      this.evalBlock(r.fcf_margin_comp.label, "FCF apalancado ≥ FCF sin apalancamiento → buena señal", r.fcf_margin_comp.detail, "—", r.fcf_margin_comp.result, "");

    // Sección G — EV/FCF
    document.getElementById("section-g-content").innerHTML =
      this.evalBlock(r.ev_fcf_alto.label, "EV/FCF > 15x → revisión obligatoria → precio muy elevado", r.ev_fcf_alto.detail, "—", r.ev_fcf_alto.result, "Un múltiplo muy alto puede indicar que el mercado ya descuentó mucho crecimiento futuro.") +
      this.evalBlock(r.ev_fcf_bajo.label, "EV/FCF < 6x → revisión obligatoria → posible pico de ciclo", r.ev_fcf_bajo.detail, "—", r.ev_fcf_bajo.result, "Un múltiplo muy bajo puede indicar FCF inflado puntualmente o empresa en pico de ciclo.");

    // Congruencia de ORO
    const cond = r.congruencia_oro;
    const oroLabels = ["Deuda Neta negativa", "FCF positivo", "ROIC > WACC", "ROImp > WACC", "Equity creciente"];
    const oroIcons  = ["🏦", "💰", "📈", "⚡", "📊"];
    document.getElementById("section-h-content").innerHTML = `
      <div style="padding:1rem 1.25rem;">
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:.85rem;margin-bottom:1.1rem;">
          ${oroLabels.map((l, i) => {
            const v = cond.condiciones[i];
            const col = v === null ? 'var(--silver1)' : v ? '#2ABF72' : '#E05A50';
            const bg  = v === null ? 'rgba(26,86,196,.08)' : v ? 'rgba(26,138,74,.15)' : 'rgba(192,57,43,.15)';
            const brd = v === null ? 'rgba(26,86,196,.2)' : v ? 'rgba(26,138,74,.35)' : 'rgba(192,57,43,.35)';
            const icon = v === null ? '⚠' : v ? '✔' : '✘';
            return `<div style="background:${bg};border:1px solid ${brd};border-radius:10px;padding:.9rem .6rem;text-align:center;transition:transform .15s">
              <div style="font-size:1.5rem;margin-bottom:.4rem">${oroIcons[i]}</div>
              <div style="font-size:1.1rem;font-weight:700;color:${col};margin-bottom:.3rem">${icon}</div>
              <div style="font-size:.68rem;color:var(--silver1);line-height:1.35;font-weight:600">${l}</div>
            </div>`;
          }).join("")}
        </div>
        <div style="text-align:center;padding:.65rem 1rem;border-radius:8px;background:${cond.cumplidas >= 4 ? 'rgba(26,138,74,.12)' : 'rgba(214,137,16,.1)'};border:1px solid ${cond.cumplidas >= 4 ? 'rgba(26,138,74,.3)' : 'rgba(214,137,16,.3)'}">
          <span style="color:${cond.cumplidas >= 4 ? '#2ABF72' : '#D68910'};font-weight:700;font-size:.95rem;">
            ${cond.cumplidas}/${cond.total} condiciones — ${cond.result === 'CUMPLE' ? '🏆 CONGRUENCIA ORO ALCANZADA' : '⚠ CONGRUENCIA INCOMPLETA'}
          </span>
        </div>
      </div>`;

    // Resumen Final
    const cumpleItems   = Object.values(r).filter(v => v && v.result === "CUMPLE").map(v => v.label).filter(Boolean);
    const nocumpleItems = Object.values(r).filter(v => v && v.result === "NO_CUMPLE").map(v => v.label).filter(Boolean);
    const faltanteItems = Object.values(r).filter(v => v && v.result === "DATO_FALTANTE").map(v => v.label).filter(Boolean);

    document.getElementById("summary-grid").innerHTML = `
      <div class="summary-col cumple">
        <div class="col-title">✔ CUMPLE (${r.stats.cumple})</div>
        <ul>${cumpleItems.map(i => `<li>${i}</li>`).join("")}</ul>
      </div>
      <div class="summary-col nocumple">
        <div class="col-title">✘ NO CUMPLE (${r.stats.nocumple})</div>
        <ul>${nocumpleItems.map(i => `<li>${i}</li>`).join("")}</ul>
      </div>
      <div class="summary-col faltante">
        <div class="col-title">⚠ DATO FALTANTE (${r.stats.faltante})</div>
        <ul>${faltanteItems.map(i => `<li>${i}</li>`).join("")}</ul>
      </div>`;

    // Conclusión
    const gap = r._roiMP.value != null && d.wacc != null ? (r._roiMP.value - d.wacc).toFixed(2) : null;
    const gapStr = gap != null ? (gap >= 0 ? `+${gap} pp sobre WACC` : `${gap} pp bajo WACC`) : "";
    document.getElementById("conclusion-body").innerHTML = `
      <div style="display:grid;grid-template-columns:auto 1fr;gap:1.25rem;align-items:start">
        <div style="background:${rv.no_comprar ? 'rgba(192,57,43,.15)' : 'rgba(26,138,74,.15)'};border:1px solid ${rv.no_comprar ? 'rgba(192,57,43,.35)' : 'rgba(26,138,74,.35)'};border-radius:10px;padding:1rem 1.25rem;min-width:180px;text-align:center">
          <div style="font-size:2rem;margin-bottom:.4rem">${rv.no_comprar ? '⛔' : '✅'}</div>
          <div style="color:${rv.no_comprar ? '#E05A50' : '#2ABF72'};font-weight:700;font-size:.9rem;">${rv.no_comprar ? 'NO COMPRAR' : 'BUENA SEÑAL'}</div>
          <div style="color:var(--silver1);font-size:.75rem;margin-top:.3rem;font-family:'Space Mono',monospace">${gapStr}</div>
        </div>
        <div>
          <p style="margin:.0 0 .65rem;color:var(--silver3);font-weight:600">
            ${rv.no_comprar ? 'Empresa de calidad — pero mala entrada al precio actual.' : 'El rendimiento implícito supera el costo de capital con margen.'}
          </p>
          <p style="margin:0 0 .65rem;font-size:.82rem;line-height:1.65">
            <strong>ROImp</strong> = ${r._roiMP.value != null ? `<strong style="color:${rv.no_comprar ? '#E05A50' : '#2ABF72'};font-family:'Space Mono',monospace">${r._roiMP.value.toFixed(2)}%</strong>` : 'N/A'} &nbsp;|&nbsp;
            <strong>WACC</strong> = ${d.wacc != null ? `<strong style="font-family:'Space Mono',monospace">${d.wacc.toFixed(2)}%</strong>` : 'N/A'} &nbsp;|&nbsp;
            <strong>ROIC</strong> = ${d.roic != null ? `<strong style="font-family:'Space Mono',monospace">${d.roic.toFixed(2)}%</strong>` : 'N/A'}
          </p>
          <p class="verdict-text" style="font-size:.82rem;line-height:1.65;margin:0">
            ${rv.no_comprar
              ? '"ROImp &lt; WACC — El precio de mercado implica que el negocio NO cubre su costo de capital. Consecuencias directas: compresión de múltiplos, retornos mediocres a largo plazo, alta volatilidad ante cualquier desaceleración y mala asimetría riesgo/beneficio. Clásica trampa de calidad."'
              : '"ROImp &gt; WACC + 1.5% — El rendimiento implícito supera el costo de capital con margen de seguridad operativo. El mercado no ha descontado completamente el valor subyacente. Señal positiva — complementar con análisis de crecimiento y estructura de deuda."'}
          </p>
        </div>
      </div>`;
  }
};
