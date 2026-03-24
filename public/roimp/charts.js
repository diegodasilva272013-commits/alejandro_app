// ── charts.js ─────────────────────────────────────────────────────────────────
Chart.defaults.color = "#8FA8C8";
Chart.defaults.font.family = "'Inter', 'Segoe UI', Arial, sans-serif";

const COLORS = {
  bg0: "#05080F", bg1: "#080E1A", bg2: "#0D1627",
  gold1: "#1A56C4", gold2: "#2E74E8", gold3: "#5A9BFF",
  silver1: "#8FA8C8", silver2: "#B8CEEA", silver3: "#D8E6F5",
  green: "#1A8A4A", red: "#C0392B", amber: "#D68910",
  gray2: "#6A829E", white: "#FFFFFF",
  // aliases for internal use
  navy: "#080E1A", navyMid: "#0D1627", gold: "#5A9BFF"
};

const Charts = {

  instances: {},

  destroy(id) {
    if (this.instances[id]) { this.instances[id].destroy(); delete this.instances[id]; }
  },

  // ── 1: ROImp vs WACC vs ROIC ─────────────────────────────────────────────
  renderROImp(canvasId, results) {
    this.destroy(canvasId);
    const d     = results._raw;
    const roiMP = results._roiMP.value;
    const wacc  = d.wacc;
    const roic  = d.roic;
    const umbral = wacc != null ? wacc + 1.5 : null;

    const allLabels = ["ROImp", "ROIC", "WACC", "WACC+1.5%"];
    const allValues = [roiMP, roic, wacc, umbral];
    const filtered  = allLabels.reduce((acc, l, i) => {
      if (allValues[i] != null) acc.push({ label: l, value: allValues[i] });
      return acc;
    }, []);
    if (!filtered.length) return;

    const labels = filtered.map(f => f.label);
    const values = filtered.map(f => f.value);
    const colors = filtered.map(f => {
      if (f.label === "WACC" || f.label === "WACC+1.5%") return COLORS.red + "99";
      if (f.value >= (wacc || 0)) return COLORS.green + "CC";
      return COLORS.red + "CC";
    });

    const ctx = document.getElementById(canvasId).getContext("2d");
    this.instances[canvasId] = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{ data: values, backgroundColor: colors,
          borderColor: colors.map(c => c.slice(0, 7)), borderWidth: 2, borderRadius: 6 }]
      },
      options: {
        indexAxis: "y", responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: c => ` ${c.parsed.x.toFixed(2)}%` } }
        },
        scales: {
          x: { beginAtZero: true, grid: { color: "rgba(26,86,196,.12)" }, ticks: { callback: v => `${v}%` } },
          y: { grid: { display: false } }
        }
      }
    });
  },

  // ── 2: Trampas ────────────────────────────────────────────────────────────
  renderTrampas(canvasId, results) {
    this.destroy(canvasId);
    const d    = results._raw;
    const wacc = d.wacc;

    const items = [
      { label: "PER",         actual: d.per,              ref: 15 },
      { label: "ROE %",       actual: d.roe,              ref: wacc },
      { label: "ROIC %",      actual: d.roic,             ref: wacc },
      { label: "Marg.EBITDA", actual: d.margen_ebitda,    ref: 15 },
      { label: "ROImp %",     actual: results._roiMP.value, ref: wacc },
    ].filter(i => i.actual != null && i.ref != null);

    if (!items.length) return;
    const ctx = document.getElementById(canvasId).getContext("2d");
    this.instances[canvasId] = new Chart(ctx, {
      type: "bar",
      data: {
        labels: items.map(i => i.label),
        datasets: [
          { label: "Valor actual", data: items.map(i => i.actual), borderRadius: 4, borderWidth: 0,
            backgroundColor: items.map(i =>
              (i.label === "ROImp %" || i.label === "ROIC %") && i.actual < (wacc || 0)
                ? COLORS.red + "CC" : COLORS.green + "CC") },
          { label: "Referencia", data: items.map(i => i.ref),
            backgroundColor: COLORS.gold + "55", borderColor: COLORS.gold, borderWidth: 2, borderRadius: 4 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: COLORS.silver1, boxWidth: 14 } } },
        scales: { x: { grid: { color: "rgba(26,86,196,.12)" } }, y: { grid: { color: "rgba(26,86,196,.12)" } } }
      }
    });
  },

  // ── 3: Composición Deuda Neta (dona) ─────────────────────────────────────
  renderDeudaNeta(canvasId, results) {
    this.destroy(canvasId);
    const d   = results._raw;
    const dn  = results._deudaNeta.value;
    const caja = results._caja;
    if (dn == null || d.deuda_total == null) return;

    const cajaVal = Math.abs(caja != null ? caja : d.deuda_total - dn);
    const ctx = document.getElementById(canvasId).getContext("2d");
    this.instances[canvasId] = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Caja", "Deuda Total"],
        datasets: [{
          data: [cajaVal, d.deuda_total],
          backgroundColor: [COLORS.green + "CC", COLORS.red + "CC"],
          borderColor: [COLORS.green, COLORS.red],
          borderWidth: 2, hoverOffset: 8
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: "60%",
        plugins: {
          legend: { position: "bottom", labels: { color: COLORS.silver1, boxWidth: 14, padding: 16 } },
          tooltip: { callbacks: { label: c => ` $${c.parsed.toFixed(0)}M` } }
        }
      },
      plugins: [{
        id: "centerText",
        afterDraw(chart) {
          const { ctx: c, chartArea: { width, height, left, top } } = chart;
          c.save();
          c.textAlign = "center"; c.textBaseline = "middle";
          c.fillStyle = dn < 0 ? COLORS.green : COLORS.red;
          c.font = "bold 13px Inter, Arial";
          c.fillText(dn < 0 ? "SÓLIDA ✔" : "RIESGO ✘", left + width / 2, top + height / 2);
          c.restore();
        }
      }]
    });
  },

  // ── 4: Ratios de deuda ────────────────────────────────────────────────────
  renderRatiosDeuda(canvasId, results) {
    this.destroy(canvasId);
    const d = results._raw;
    const items = [
      { label: "DN/EBITDA", actual: d.deuda_neta_ebitda != null ? Math.abs(d.deuda_neta_ebitda) : null, ctrl: 2, risk: 4 },
      { label: "D/Patrim.%", actual: d.deuda_patrimonio, ctrl: 80, risk: 200 },
      { label: "FCF Apal.%", actual: d.fcf_margin_apal,  ctrl: 10, risk: 5 },
      { label: "FCF s/Apal%",actual: d.fcf_margin_unapal, ctrl: 10, risk: 5 },
    ].filter(i => i.actual != null);
    if (!items.length) return;

    const ctx = document.getElementById(canvasId).getContext("2d");
    this.instances[canvasId] = new Chart(ctx, {
      type: "bar",
      data: {
        labels: items.map(i => i.label),
        datasets: [
          { label: "Valor actual", data: items.map(i => i.actual), borderRadius: 4, borderWidth: 0,
            backgroundColor: items.map(i => i.actual <= i.ctrl ? COLORS.green + "CC" : COLORS.red + "CC") },
          { label: "Umbral controlada", data: items.map(i => i.ctrl),
            backgroundColor: COLORS.gold + "55", borderColor: COLORS.gold, borderWidth: 2, borderRadius: 4 },
          { label: "Umbral riesgo", data: items.map(i => i.risk),
            backgroundColor: COLORS.red + "33", borderColor: COLORS.red, borderWidth: 2, borderRadius: 4 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: COLORS.silver1, boxWidth: 14 } } },
        scales: { x: { grid: { color: "rgba(26,86,196,.12)" } }, y: { grid: { color: "rgba(26,86,196,.12)" } } }
      }
    });
  },

  // ── 5: Sensibilidad ROImp vs EV/EBIT ─────────────────────────────────────
  renderSensibilidad(canvasId, results) {
    this.destroy(canvasId);
    const d    = results._raw;
    const wacc = d.wacc;
    if (wacc == null) return;

    const steps      = Array.from({ length: 71 }, (_, i) => 5 + i * 0.5);
    const roimpCurve = steps.map(x => (1 / x) * 100);
    const waccLine   = steps.map(() => wacc);
    const umbralLine = steps.map(() => wacc + 1.5);
    const curEV      = d.ev_ebit || (d.ev && d.ebit ? d.ev / d.ebit : null);

    const ctx = document.getElementById(canvasId).getContext("2d");
    const gradFill = ctx.createLinearGradient(0, 0, 0, 270);
    gradFill.addColorStop(0, COLORS.green + "50");
    gradFill.addColorStop(0.7, COLORS.green + "10");
    gradFill.addColorStop(1, "rgba(0,0,0,0)");

    this.instances[canvasId] = new Chart(ctx, {
      type: "line",
      data: {
        labels: steps.map(v => v.toFixed(1) + "x"),
        datasets: [
          { label: "ROImp = f(EV/EBIT)", data: roimpCurve,
            borderColor: COLORS.gold3, backgroundColor: gradFill,
            fill: "origin",
            borderWidth: 2.5, pointRadius: 0, tension: 0.3 },
          { label: `WACC (${wacc}%)`, data: waccLine,
            borderColor: COLORS.red, backgroundColor: "transparent",
            borderWidth: 2, borderDash: [6, 3], pointRadius: 0 },
          { label: `WACC+1.5% (${(wacc + 1.5).toFixed(1)}%)`, data: umbralLine,
            borderColor: COLORS.amber, backgroundColor: "transparent",
            borderWidth: 1.5, borderDash: [3, 3], pointRadius: 0 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: COLORS.silver1, boxWidth: 14, padding: 12 } },
          tooltip: { callbacks: { label: c => ` ${c.parsed.y.toFixed(2)}%` } }
        },
        scales: {
          x: { grid: { color: "rgba(26,86,196,.12)" }, ticks: { maxTicksLimit: 10, color: COLORS.silver1 } },
          y: { grid: { color: "rgba(26,86,196,.12)" }, ticks: { callback: v => `${v.toFixed(1)}%`, color: COLORS.silver1 } }
        }
      }
    });

    if (curEV != null) {
      const idx = steps.findIndex(s => Math.abs(s - curEV) < 0.3);
      if (idx >= 0) {
        this.instances[canvasId].data.datasets.push({
          label: `HOY (${curEV.toFixed(1)}x → ${(1/curEV*100).toFixed(2)}%)`,
          data: steps.map((_, i) => i === idx ? (1 / curEV) * 100 : null),
          pointRadius: steps.map((_, i) => i === idx ? 9 : 0),
          pointBackgroundColor: COLORS.gold3,
          pointBorderColor: COLORS.white,
          pointBorderWidth: 2.5,
          showLine: false,
          type: "scatter",
        });
        this.instances[canvasId].update();
      }
    }
  },

  // ── 6: Dashboard donut ────────────────────────────────────────────────────
  renderDashboard(canvasId, results) {
    this.destroy(canvasId);
    const { cumple, nocumple, faltante } = results.stats;
    const ctx = document.getElementById(canvasId).getContext("2d");
    this.instances[canvasId] = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: [`Cumple (${cumple})`, `No Cumple (${nocumple})`, `Faltante (${faltante})`],
        datasets: [{
          data: [cumple, nocumple, faltante],
          backgroundColor: [COLORS.green + "CC", COLORS.red + "CC", COLORS.gray2 + "99"],
          borderColor:     [COLORS.green,         COLORS.red,         COLORS.gray2 + "88"],
          borderWidth: 2, hoverOffset: 10
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: "58%",
        plugins: {
          legend: { position: "bottom", labels: { color: COLORS.silver1, boxWidth: 12, padding: 14 } }
        }
      }
    });
  },

  // ── 7: Gauge ROImp vs WACC (semi-donut) ──────────────────────────────────
  renderGauge(canvasId, results) {
    this.destroy(canvasId);
    const roiMP = results._roiMP.value;
    const wacc  = results._raw.wacc;
    if (roiMP == null || wacc == null) return;

    const maxScale = Math.max(20, Math.ceil(Math.max(roiMP, wacc) * 2));
    const isGood   = roiMP >= wacc;
    const sc       = isGood ? COLORS.green : COLORS.red;
    const zones    = [
      Math.max(0, Math.min(wacc, maxScale)),
      Math.min(1.5, Math.max(0, maxScale - wacc)),
      Math.max(0, maxScale - wacc - 1.5),
    ];

    const ctx = document.getElementById(canvasId).getContext("2d");
    this.instances[canvasId] = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: [`Riesgo (0–${wacc.toFixed(1)}%)`, "Margen +1.5%", `Seguro (>${(wacc + 1.5).toFixed(1)}%)`],
        datasets: [{
          data: zones,
          backgroundColor: [COLORS.red + "55", COLORS.amber + "66", COLORS.green + "55"],
          borderColor:      [COLORS.red + "88", COLORS.amber + "88", COLORS.green + "88"],
          borderWidth: 1,
        }]
      },
      options: {
        circumference: 180,
        rotation: 180,
        cutout: "62%",
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { color: COLORS.silver1, boxWidth: 10, padding: 10, font: { size: 10 } } },
          tooltip: { callbacks: { label: c => ` ${c.label}` } }
        }
      },
      plugins: [{
        id: "gaugeNeedle",
        afterDraw(chart) {
          const meta = chart.getDatasetMeta(0);
          if (!meta.data || !meta.data[0]) return;
          const arc = meta.data[0];
          const cx  = arc.x;
          const cy  = arc.y;
          const outerR = arc.outerRadius;

          const pct   = Math.min(Math.max(roiMP / maxScale, 0), 1);
          const angle = Math.PI + pct * Math.PI; // π (left) → 2π (right) through top

          const c = chart.ctx;

          // Glow effect
          c.save();
          c.shadowColor = sc;
          c.shadowBlur  = 10;
          c.strokeStyle = sc;
          c.lineWidth   = 3;
          c.lineCap     = "round";
          c.beginPath();
          c.moveTo(cx + outerR * 0.12 * Math.cos(angle), cy + outerR * 0.12 * Math.sin(angle));
          c.lineTo(cx + outerR * 0.83 * Math.cos(angle), cy + outerR * 0.83 * Math.sin(angle));
          c.stroke();
          c.restore();

          // Center pivot
          c.save();
          c.fillStyle   = sc;
          c.strokeStyle = COLORS.bg0;
          c.lineWidth   = 2.5;
          c.shadowColor = sc;
          c.shadowBlur  = 8;
          c.beginPath();
          c.arc(cx, cy, 7, 0, 2 * Math.PI);
          c.fill();
          c.stroke();
          c.restore();

          // Center text
          c.save();
          c.textAlign    = "center";
          c.fillStyle    = sc;
          c.font         = "bold 19px 'Space Mono', monospace";
          c.fillText(`${roiMP.toFixed(2)}%`, cx, cy - 20);
          c.fillStyle = COLORS.silver1;
          c.font      = "10px Inter, Arial";
          c.fillText(`ROImp — WACC: ${wacc.toFixed(2)}%`, cx, cy - 5);
          c.restore();
        }
      }]
    });
  },

  // ── 8: Radar Congruencia ORO ──────────────────────────────────────────────
  renderRadarOro(canvasId, results) {
    this.destroy(canvasId);
    const d     = results._raw;
    const dn    = results._deudaNeta ? results._deudaNeta.value : null;
    const roiMP = results._roiMP.value;
    const wacc  = d.wacc;
    const roic  = d.roic;

    const score5 = (v, positive) =>
      v == null ? 5 : positive(v) ? 10 : Math.max(1, 3);

    const scores = [
      score5(dn,    v => v < 0),
      score5(d.fcf, v => v > 0),
      roic != null && wacc != null ? (roic > wacc ? 10 : Math.max(1, 5 + (roic - wacc))) : 5,
      roiMP != null && wacc != null ? (roiMP > wacc + 1.5 ? 10 : roiMP > wacc ? 7 : Math.max(1, 4 + (roiMP - wacc))) : 5,
      d.ev_fcf != null ? (d.ev_fcf > 6 && d.ev_fcf < 30 ? 10 : d.ev_fcf <= 6 ? 4 : 2) : 5,
    ];

    const ptColors = scores.map(s => s >= 7 ? COLORS.green : s <= 3 ? COLORS.red : COLORS.amber);

    const ctx = document.getElementById(canvasId).getContext("2d");
    this.instances[canvasId] = new Chart(ctx, {
      type: "radar",
      data: {
        labels: ["DN Negativa", "FCF Positivo", "ROIC > WACC", "ROImp > WACC", "EV/FCF Sano"],
        datasets: [
          {
            label: "Empresa",
            data: scores,
            backgroundColor: "rgba(46,116,232,.2)",
            borderColor: COLORS.gold2,
            borderWidth: 2.5,
            pointBackgroundColor: ptColors,
            pointBorderColor: COLORS.bg0,
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
          },
          {
            label: "Ideal",
            data: [10, 10, 10, 10, 10],
            backgroundColor: "rgba(26,138,74,.07)",
            borderColor: COLORS.green + "55",
            borderWidth: 1,
            borderDash: [5, 5],
            pointRadius: 0,
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: COLORS.silver1, boxWidth: 12, padding: 16 } }
        },
        scales: {
          r: {
            min: 0, max: 10,
            ticks: {
              stepSize: 2,
              backdropColor: "transparent",
              color: COLORS.silver1,
              font: { size: 9 }
            },
            grid:        { color: "rgba(26,86,196,.2)" },
            angleLines:  { color: "rgba(26,86,196,.25)" },
            pointLabels: { color: COLORS.silver2, font: { size: 11, weight: "600" } }
          }
        }
      }
    });
  },

  // ── 9: Score de salud (donut central) ────────────────────────────────────
  renderScore(canvasId, results) {
    this.destroy(canvasId);
    const { cumple, nocumple } = results.stats;
    const total = cumple + nocumple;
    const pct   = total > 0 ? Math.round(cumple / total * 100) : 0;
    const sc    = pct >= 75 ? COLORS.green : pct >= 50 ? COLORS.amber : COLORS.red;

    const ctx = document.getElementById(canvasId).getContext("2d");
    const ringGrad = ctx.createLinearGradient(0, 0, 200, 200);
    ringGrad.addColorStop(0, sc + "EE");
    ringGrad.addColorStop(1, sc + "88");

    this.instances[canvasId] = new Chart(ctx, {
      type: "doughnut",
      data: {
        datasets: [{
          data: [pct, 100 - pct],
          backgroundColor: [ringGrad, COLORS.bg2],
          borderWidth: 0,
          hoverOffset: 4,
        }]
      },
      options: {
        cutout: "76%",
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend:  { display: false },
          tooltip: { enabled: false }
        }
      },
      plugins: [{
        id: "centerScore",
        afterDraw(chart) {
          const { ctx: c, chartArea: { width, height, left, top } } = chart;
          const cx = left + width  / 2;
          const cy = top  + height / 2;
          c.save();
          c.textAlign = "center"; c.textBaseline = "middle";
          // Glow
          c.shadowColor = sc; c.shadowBlur = 12;
          c.fillStyle = sc;
          c.font = "bold 32px 'Space Mono', monospace";
          c.fillText(`${pct}%`, cx, cy - 10);
          c.shadowBlur = 0;
          c.fillStyle = COLORS.silver2;
          c.font = "600 11px Inter, Arial";
          c.fillText("Score de Salud", cx, cy + 14);
          c.fillStyle = COLORS.gray2;
          c.font = "10px Inter, Arial";
          c.fillText(`${cumple} cumple · ${nocumple} no · ${results.stats.faltante} sin dato`, cx, cy + 30);
          c.restore();
        }
      }]
    });
  },

  // ── 10: Evolución FCF y márgenes (barras apiladas) ────────────────────────
  renderFCF(canvasId, results) {
    this.destroy(canvasId);
    const d = results._raw;
    const items = [
      { label: "EBITDA",      v: d.ebitda,          color: COLORS.gold3 },
      { label: "EBIT",        v: d.ebit,            color: COLORS.gold2 },
      { label: "FCF",         v: d.fcf,             color: COLORS.green },
      { label: "CapEx",       v: d.capex != null ? -Math.abs(d.capex) : null, color: COLORS.red },
      { label: "Deuda Neta",  v: results._deudaNeta ? results._deudaNeta.value : null, color: COLORS.amber },
    ].filter(i => i.v != null);
    if (!items.length) return;

    const ctx = document.getElementById(canvasId).getContext("2d");
    this.instances[canvasId] = new Chart(ctx, {
      type: "bar",
      data: {
        labels: items.map(i => i.label),
        datasets: [{
          data: items.map(i => i.v),
          backgroundColor: items.map(i => i.color + "CC"),
          borderColor:     items.map(i => i.color),
          borderWidth: 1.5,
          borderRadius: 6,
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: c => ` $${c.parsed.x.toFixed(0)}M` } }
        },
        scales: {
          x: { grid: { color: "rgba(26,86,196,.12)" }, ticks: { callback: v => `$${v}M`, color: COLORS.silver1 } },
          y: { grid: { display: false }, ticks: { color: COLORS.silver2, font: { weight: "600" } } }
        }
      }
    });
  },

  renderAll(results) {
    this.renderROImp("chart-roimp", results);
    this.renderGauge("chart-gauge", results);
    this.renderTrampas("chart-trampas", results);
    this.renderDeudaNeta("chart-deuda", results);
    this.renderRatiosDeuda("chart-ratios", results);
    this.renderFCF("chart-fcf", results);
    this.renderSensibilidad("chart-sens", results);
    this.renderRadarOro("chart-radar-oro", results);
    this.renderScore("chart-score", results);
    this.renderDashboard("chart-dashboard", results);
  }
};
